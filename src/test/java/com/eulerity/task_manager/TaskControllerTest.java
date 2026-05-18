package com.eulerity.task_manager;

import com.eulerity.task_manager.model.Task;
import com.eulerity.task_manager.repository.TaskRepository;
import com.eulerity.task_manager.service.AIService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "gemini.api.key=test-key",
        "spring.datasource.url=jdbc:h2:mem:testdb",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class TaskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TaskRepository taskRepository;

    @MockBean
    private AIService aiService;

    @BeforeEach
    void setUp() {
        taskRepository.deleteAll();
    }

    @Test
    void createTask_returnsTask() throws Exception {
        String body = """
                {
                  "title":"Test Task",
                  "description":"Desc",
                  "dueDate":"2025-12-31",
                  "priority":"HIGH",
                  "status":"TODO"
                }
                """;

        mockMvc.perform(post("/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Test Task"));
    }

    @Test
    void getAllTasks_returnsList() throws Exception {
        Task task = new Task();
        task.setTitle("Sample Task");
        task.setStatus("TODO");
        task.setPriority("MEDIUM");
        taskRepository.save(task);

        mockMvc.perform(get("/tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Sample Task"));
    }

    @Test
    void getTaskById_found_returnsTask() throws Exception {
        Task task = new Task();
        task.setTitle("Find Me");
        task.setStatus("TODO");
        task.setPriority("LOW");

        Task saved = taskRepository.save(task);

        mockMvc.perform(get("/tasks/" + saved.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Find Me"));
    }

    @Test
    void getTaskById_notFound_returns404() throws Exception {
        mockMvc.perform(get("/tasks/non-existent-id"))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateTask_updatesSuccessfully() throws Exception {
        Task task = new Task();
        task.setTitle("Old Title");
        task.setStatus("TODO");
        task.setPriority("LOW");

        Task saved = taskRepository.save(task);

        String updated = """
                {
                  "title":"New Title",
                  "description":"Updated",
                  "priority":"HIGH",
                  "status":"DONE"
                }
                """;

        mockMvc.perform(put("/tasks/" + saved.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updated))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("New Title"));
    }

    @Test
    void deleteTask_deletesSuccessfully() throws Exception {
        Task task = new Task();
        task.setTitle("Delete Me");
        task.setStatus("TODO");
        task.setPriority("LOW");

        Task saved = taskRepository.save(task);

        mockMvc.perform(delete("/tasks/" + saved.getId()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/tasks/" + saved.getId()))
                .andExpect(status().isNotFound());
    }

    @Test
    void suggestTask_returnsJson() throws Exception {
        when(aiService.convertToTask(anyString()))
                .thenReturn("{\"title\":\"Submit report\",\"priority\":\"HIGH\",\"status\":\"TODO\"}");

        mockMvc.perform(post("/tasks/suggest")
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("remind me to submit report before Friday"))
                .andExpect(status().isOk());
    }

    @Test
    void summarizeTask_returnsSummary() throws Exception {
        Task task = new Task();
        task.setTitle("Go to gym");
        task.setDescription("Exercise daily");
        task.setStatus("TODO");
        task.setPriority("HIGH");

        Task saved = taskRepository.save(task);

        when(aiService.summarizeTask(anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn("{\"summary\":\"This is a high priority gym task.\"}");

        mockMvc.perform(post("/tasks/" + saved.getId() + "/summarize"))
                .andExpect(status().isOk());
    }
}