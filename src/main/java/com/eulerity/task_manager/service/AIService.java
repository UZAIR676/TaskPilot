package com.eulerity.task_manager.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Service
public class AIService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private final WebClient client =
            WebClient.create("https://generativelanguage.googleapis.com");

    private final ObjectMapper mapper = new ObjectMapper();

    // -----------------------------
    // 1. Convert text → Task JSON
    // -----------------------------
    public String convertToTask(String input) {

        String prompt =
                "You are a strict JSON generator for a task manager system.\n" +
                "Convert user input into ONLY valid JSON.\n\n" +
                "RULES:\n" +
                "- Output ONLY JSON (no explanation, no markdown)\n" +
                "- Never return empty fields\n" +
                "- Infer missing values logically\n\n" +
                "FORMAT:\n" +
                "{\n" +
                "  \"title\": \"string\",\n" +
                "  \"description\": \"string\",\n" +
                "  \"dueDate\": null,\n" +
                "  \"priority\": \"LOW|MEDIUM|HIGH\",\n" +
                "  \"status\": \"TODO\"\n" +
                "}\n\n" +
                "USER INPUT:\n" + input;

        return callGemini(prompt);
    }

    // -----------------------------
    // 2. Summarize Task
    // -----------------------------
    public String summarizeTask(String title, String description,
                                String priority, String status, String dueDate) {

        String prompt =
                "Summarize this task in 2-3 simple sentences.\n\n" +
                "Title: " + title + "\n" +
                "Description: " + (description != null ? description : "none") + "\n" +
                "Priority: " + priority + "\n" +
                "Status: " + status + "\n" +
                "Due Date: " + (dueDate != null ? dueDate : "none");

        String summary = callGemini(prompt);

        return "{\"summary\":\"" +
                summary.replace("\"", "'").replace("\n", " ").trim() +
                "\"}";
    }

    // -----------------------------
    // 3. Gemini API Call
    // -----------------------------
    private String callGemini(String prompt) {

        Map<String, Object> body = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", prompt)
                        ))
                )
        );

        String raw = client.post()
                .uri("/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey)
                .header("Content-Type", "application/json")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        try {
            if (raw == null) {
                return "{\"error\":\"No response from AI\"}";
            }

            JsonNode node = mapper.readTree(raw);

            String text = node.path("candidates")
                    .get(0)
                    .path("content")
                    .path("parts")
                    .get(0)
                    .path("text")
                    .asText();

            // CLEAN RESPONSE
            return text
                    .replace("```json", "")
                    .replace("```", "")
                    .replace("\n", " ")
                    .trim();

        } catch (Exception e) {
            return "{\"error\":\"AI call failed\"}";
        }
    }

    public String breakdownTask(String title, String description) {
    String prompt =
            "Break down this task into 3-5 actionable subtasks.\n" +
            "IMPORTANT: Return ONLY valid JSON array. No explanation, no markdown.\n\n" +
            "[{\"subtask\": \"\", \"priority\": \"LOW|MEDIUM|HIGH\"}]\n\n" +
            "Task Title: " + title + "\n" +
            "Description: " + (description != null ? description : "none");
    String result = callGemini(prompt);
    return "{\"subtasks\":" + result + "}";
}
}