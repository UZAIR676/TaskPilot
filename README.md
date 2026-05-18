# Task Manager

A Spring Boot REST API for managing personal tasks, with Google Gemini AI integration and a React frontend.

Built as part of the Eulerity Backend Engineering Intern assessment.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Java 17, Spring Boot 3.3.5 |
| Database | H2 (in-memory) |
| AI | Google Gemini 1.5 Flash |
| Frontend | React 19 + Vite |
| Build | Maven |

---

## Prerequisites

- Java 17+
- Node.js 18+
- A [Google Gemini API key](https://aistudio.google.com/app/apikey) — free to get

---

## Setup & Run

### 1. Extract the project

Unzip the submitted project folder and open a terminal inside it:

```bash
cd task-man
```

### 2. Add your Gemini API key

Open `src/main/resources/application.properties` and set:

```properties
gemini.api.key=YOUR_GEMINI_API_KEY_HERE
```

### 3. Restore dependencies

> `node_modules/` and `target/` are not included in the submission — this is standard practice.

**Frontend dependencies:**
```bash
npm install
```

**Backend dependencies:**
Maven dependencies are downloaded automatically on first run. No manual step needed.

### 4. Run backend + frontend together

```bash
npm run dev
```

> Backend: `http://localhost:8080`
> Frontend: `http://localhost:5173`

Or run separately:

```bash
# Backend only (downloads all Maven dependencies automatically)
mvnw.cmd spring-boot:run

# Frontend only (separate terminal)
cd frontend
npm install
npm run dev
```

---

## Running Tests

```bash
mvnw.cmd test
```

All 9 tests pass. Tests cover all CRUD endpoints and all 3 AI endpoints (with mocked Gemini calls).

---

## API Endpoints

### Task CRUD

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/tasks` | Create a new task |
| `GET` | `/tasks` | List all tasks |
| `GET` | `/tasks/{id}` | Get a single task |
| `PUT` | `/tasks/{id}` | Update a task |
| `DELETE` | `/tasks/{id}` | Delete a task |

**Task object:**
```json
{
  "id": "uuid-auto-generated",
  "title": "Submit quarterly report",
  "description": "Finance team needs it by EOD",
  "dueDate": "2025-12-31",
  "priority": "HIGH",
  "status": "TODO"
}
```

---

## AI-Powered Endpoints

### 1. `POST /tasks/suggest` — Natural language → Task

Accepts a plain-text description and uses Gemini AI to create a structured task, automatically saved to the database.

**Request:**
```
POST /tasks/suggest
Content-Type: text/plain

remind me to submit the quarterly report before Friday
```

**Response:**
```json
{
  "id": "a1b2c3d4-...",
  "title": "Submit Quarterly Report",
  "description": "Ensure the quarterly report is completed and submitted before the Friday deadline.",
  "dueDate": "2025-12-19",
  "priority": "HIGH",
  "status": "TODO"
}
```

---

### 2. `POST /tasks/{id}/summarize` — AI task summary

Returns a plain-language summary of a task based on its fields.

**Request:**
```
POST /tasks/abc123/summarize
```

**Response:**
```json
{
  "summary": "This is a high-priority task to submit the quarterly report. It is currently in progress and due by end of day Friday."
}
```

---

### 3. `POST /tasks/{id}/breakdown` — AI subtask breakdown

Breaks a complex task into 3-5 actionable subtasks using Gemini AI.

**Request:**
```
POST /tasks/abc123/breakdown
```

**Response:**
```json
{
  "subtasks": [
    { "subtask": "Gather all required financial data and inputs", "priority": "HIGH" },
    { "subtask": "Draft and compile the quarterly report", "priority": "HIGH" },
    { "subtask": "Review report for accuracy and completeness", "priority": "MEDIUM" },
    { "subtask": "Submit final report to Finance team", "priority": "HIGH" }
  ]
}
```

---

## Project Structure

```
task-man/
├── src/
│   ├── main/
│   │   ├── java/com/eulerity/task_manager/
│   │   │   ├── controller/        # REST controllers
│   │   │   ├── model/             # Task entity
│   │   │   ├── repository/        # Spring Data JPA
│   │   │   ├── service/           # AIService (Gemini)
│   │   │   └── TaskManagerApplication.java
│   │   └── resources/
│   │       └── application.properties
│   └── test/
│       └── java/com/eulerity/task_manager/
│           └── TaskControllerTest.java   # 9 tests
├── frontend/                      # React + Vite UI
├── pom.xml
└── README.md
```

---

## Notes

- The H2 database is in-memory — data resets on every restart. This is intentional per the assessment requirements.
- `node_modules/` and `target/` are excluded from submission — `npm install` restores frontend deps, and Maven auto-downloads backend deps on first run.
- The Gemini API key is not included in the submission. Add your own key in `application.properties` before running.
- The `net.bytebuddy.experimental=true` flag in `pom.xml` is needed if running tests on Java 21+. It has no effect on Java 17."# TaskPilot" 
"# TaskPilot" 
"# TaskPilot" 
