package com.eulerity.task_manager.controller;

import com.eulerity.task_manager.model.Task;
import com.eulerity.task_manager.repository.TaskRepository;
import com.eulerity.task_manager.service.AIService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tasks")
@CrossOrigin(origins = "*")
public class TaskController {

    private final TaskRepository repo;
    private final AIService aiService;
    private final ObjectMapper mapper = new ObjectMapper();

    public TaskController(TaskRepository repo, AIService aiService) {
        this.repo = repo;
        this.aiService = aiService;
    }

    // CREATE
    @PostMapping
    public Task create(@RequestBody Task task, @RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (task.getUserId() == null && userId != null) {
            task.setUserId(userId);
        }
        return repo.save(task);
    }

    // GET ALL - sirf us user ke tasks
    @GetMapping
    public List<Task> getAll(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (userId != null) {
            return repo.findByUserId(userId);
        }
        return repo.findAll();
    }

    // GET BY ID
    @GetMapping("/{id}")
    public ResponseEntity<Task> getById(@PathVariable String id) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<Task> update(@PathVariable String id, @RequestBody Task newTask) {
        return repo.findById(id).map(task -> {
            task.setTitle(newTask.getTitle());
            task.setDescription(newTask.getDescription());
            task.setDueDate(newTask.getDueDate());
            task.setPriority(newTask.getPriority());
            task.setStatus(newTask.getStatus());
            return ResponseEntity.ok(repo.save(task));
        }).orElse(ResponseEntity.notFound().build());
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        if (!repo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // AI: SUGGEST
    @PostMapping("/suggest")
    public ResponseEntity<Task> suggestTask(@RequestBody String input,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        try {
            String aiResponse = aiService.convertToTask(input);
            Task task = mapper.readValue(aiResponse, Task.class);
            if (userId != null) task.setUserId(userId);
            Task saved = repo.save(task);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    // AI: SUMMARIZE
    @PostMapping("/{id}/summarize")
    public ResponseEntity<String> summarizeTask(@PathVariable String id) {
        return repo.findById(id).map(task -> {
            String summary = aiService.summarizeTask(
                    task.getTitle(), task.getDescription(),
                    task.getPriority(), task.getStatus(), task.getDueDate()
            );
            return ResponseEntity.ok(summary);
        }).orElse(ResponseEntity.notFound().build());
    }

    // AI: BREAKDOWN
    @PostMapping("/{id}/breakdown")
    public ResponseEntity<String> breakdownTask(@PathVariable String id) {
        return repo.findById(id).map(task -> {
            String result = aiService.breakdownTask(task.getTitle(), task.getDescription());
            return ResponseEntity.ok(result);
        }).orElse(ResponseEntity.notFound().build());
    }
}