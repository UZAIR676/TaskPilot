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

    // --------------------
    // CREATE TASK
    // --------------------
    @PostMapping
    public Task create(@RequestBody Task task) {
        return repo.save(task);
    }

    // --------------------
    // GET ALL
    // --------------------
    @GetMapping
    public List<Task> getAll() {
        return repo.findAll();
    }

    // --------------------
    // GET BY ID
    // --------------------
    @GetMapping("/{id}")
    public ResponseEntity<Task> getById(@PathVariable String id) {
        return repo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // --------------------
    // UPDATE
    // --------------------
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

    // --------------------
    // DELETE
    // --------------------
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        if (!repo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // --------------------
    // AI: SUGGEST TASK
    // --------------------
    @PostMapping("/suggest")
    public ResponseEntity<Task> suggestTask(@RequestBody String input) {
        try {
            String aiResponse = aiService.convertToTask(input);
            Task task = mapper.readValue(aiResponse, Task.class);
            Task saved = repo.save(task);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    // --------------------
    // AI: SUMMARIZE TASK
    // --------------------
    @PostMapping("/{id}/summarize")
    public ResponseEntity<String> summarizeTask(@PathVariable String id) {
        return repo.findById(id).map(task -> {
            String summary = aiService.summarizeTask(
                    task.getTitle(),
                    task.getDescription(),
                    task.getPriority(),
                    task.getStatus(),
                    task.getDueDate()
            );
            return ResponseEntity.ok(summary);
        }).orElse(ResponseEntity.notFound().build());
    }

    // --------------------
    // AI: BREAKDOWN TASK
    // --------------------
    @PostMapping("/{id}/breakdown")
    public ResponseEntity<String> breakdownTask(@PathVariable String id) {
        return repo.findById(id).map(task -> {
            String result = aiService.breakdownTask(
                    task.getTitle(),
                    task.getDescription()
            );
            return ResponseEntity.ok(result);
        }).orElse(ResponseEntity.notFound().build());
    }

}