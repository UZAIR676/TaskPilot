import { useEffect, useState } from "react";

const BASE_URL = "https://taskpilot-production-bfa0.up.railway.app";

const G = {
  injectGlobal: () => {
    if (document.getElementById("tm-global")) return;
    const s = document.createElement("style");
    s.id = "tm-global";
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      :root {
        --bg: #0a0a0f; --surface: #111118; --surface2: #18181f;
        --border: rgba(255,255,255,0.06); --border2: rgba(255,255,255,0.09);
        --accent: #7c6dfa; --accent2: #fa6d8a; --accent3: #6dfabd;
        --text: #f0f0ff; --muted: #7878a0;
      }
      body { background: var(--bg); font-family: 'Syne', sans-serif; color: var(--text); min-height: 100vh; overflow-x: hidden; }
      input, textarea, select { font-family: 'Syne', sans-serif; outline: none; }
      input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }
      @keyframes fadeUp   { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
      @keyframes fadeDown { from { opacity:0; transform:translateY(-10px)} to { opacity:1; transform:translateY(0) } }
      @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.3} }
      @keyframes slideIn  { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
    `;
    document.head.appendChild(s);
  },
};

const statusLabel = (s) => ({ TODO: "To Do", IN_PROGRESS: "In Progress", DONE: "Done" }[s] || s);

const priorityColor = {
  HIGH:   { bg: "rgba(250,109,138,.1)", color: "#fa8faa", border: "rgba(250,109,138,.2)" },
  MEDIUM: { bg: "rgba(250,204,109,.1)", color: "#facc6d", border: "rgba(250,204,109,.2)" },
  LOW:    { bg: "rgba(109,250,189,.1)", color: "#6dfabd", border: "rgba(109,250,189,.2)" },
};
const statusColor = {
  TODO:        { bg: "rgba(120,120,160,.1)", color: "#9898c0", border: "rgba(120,120,160,.2)" },
  IN_PROGRESS: { bg: "rgba(124,109,250,.1)", color: "#a89afc", border: "rgba(124,109,250,.2)" },
  DONE:        { bg: "rgba(109,250,189,.1)", color: "#6dfabd", border: "rgba(109,250,189,.2)" },
};
const subtaskPColor = { HIGH: "#fa8faa", MEDIUM: "#facc6d", LOW: "#6dfabd" };

function Badge({ text, style }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 9px", borderRadius: 20, fontFamily: "'DM Mono', monospace", letterSpacing: ".04em", border: `0.5px solid ${style.border}`, background: style.bg, color: style.color }}>
      {text}
    </span>
  );
}

function Toast({ msg, visible }) {
  return (
    <div style={{ position: "fixed", bottom: 22, left: "50%", transform: `translateX(-50%) translateY(${visible ? 0 : 10}px)`, background: "#18181f", border: "0.5px solid rgba(255,255,255,.1)", padding: "10px 22px", borderRadius: 30, fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#f0f0ff", zIndex: 9999, opacity: visible ? 1 : 0, transition: "all .25s", pointerEvents: "none", whiteSpace: "nowrap" }}>
      {msg}
    </div>
  );
}

// ─── TaskCard ─────────────────────────────────────────────────────────────────
function TaskCard({ task, onDelete, delay = 0 }) {
  const [summary, setSummary]               = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryOpen, setSummaryOpen]       = useState(false);
  const [subtasks, setSubtasks]             = useState(null);
  const [loadingBreak, setLoadingBreak]     = useState(false);
  const [breakOpen, setBreakOpen]           = useState(false);

  const handleSummarize = async () => {
    if (summaryOpen) { setSummaryOpen(false); return; }
    if (summary) { setSummaryOpen(true); return; }
    setLoadingSummary(true); setSummaryOpen(true);
    try {
      const r = await fetch(`${BASE_URL}/tasks/${task.id}/summarize`, { method: "POST" });
      const data = await r.json();
      setSummary(data.summary);
    } catch { setSummary("Could not reach backend."); }
    finally { setLoadingSummary(false); }
  };

  const handleBreakdown = async () => {
    if (breakOpen) { setBreakOpen(false); return; }
    if (subtasks) { setBreakOpen(true); return; }
    setLoadingBreak(true); setBreakOpen(true);
    try {
      const r = await fetch(`${BASE_URL}/tasks/${task.id}/breakdown`, { method: "POST" });
      const data = await r.json();
      setSubtasks(data.subtasks || []);
    } catch { setSubtasks([]); }
    finally { setLoadingBreak(false); }
  };

  return (
    <div
      style={{ background: "#111118", border: "0.5px solid rgba(255,255,255,.09)", borderRadius: 16, padding: "1.1rem 1.25rem", position: "relative", animation: `fadeUp .4s ${delay}s ease both`, transition: "transform .2s, box-shadow .2s" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 14px 40px rgba(0,0,0,.35)"; e.currentTarget.querySelector(".tc-actions").style.opacity = 1; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.querySelector(".tc-actions").style.opacity = 0; }}
    >
      {/* 3 action buttons */}
      <div className="tc-actions" style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 4, opacity: 0, transition: "opacity .15s" }}>
        <button onClick={handleSummarize} title="AI Summary"   style={iconBtn()}>✦</button>
        <button onClick={handleBreakdown} title="AI Breakdown" style={iconBtn()}>⊞</button>
        <button onClick={() => onDelete(task.id)} title="Delete" style={iconBtn()}>✕</button>
      </div>

      <p style={{ fontSize: 14, fontWeight: 700, color: "#f0f0ff", lineHeight: 1.35, marginBottom: 5, paddingRight: 90 }}>{task.title}</p>
      <p style={{ fontSize: 12, color: "#7878a0", marginBottom: 10, lineHeight: 1.5, minHeight: 16 }}>{task.description || ""}</p>

      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
        <Badge text={task.priority} style={priorityColor[task.priority] || priorityColor.MEDIUM} />
        <Badge text={statusLabel(task.status)} style={statusColor[task.status] || statusColor.TODO} />
        {task.dueDate && (
          <span style={{ background: "#18181f", color: "#7878a0", border: "0.5px solid rgba(255,255,255,.06)", fontSize: 10, padding: "3px 8px", borderRadius: 20, fontFamily: "'DM Mono', monospace" }}>
            ⬡ {task.dueDate}
          </span>
        )}
      </div>

      {/* Summary panel */}
      {summaryOpen && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "0.5px solid rgba(255,255,255,.06)", fontSize: 12, color: "#9898c0", lineHeight: 1.6, animation: "slideIn .25s ease" }}>
          {loadingSummary
            ? <span style={{ color: "#a89afc" }}>✦ Summarizing...</span>
            : <><span style={{ color: "#a89afc", marginRight: 5 }}>✦</span>{summary}</>}
        </div>
      )}

      {/* Breakdown panel */}
      {breakOpen && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "0.5px solid rgba(255,255,255,.06)", animation: "slideIn .25s ease" }}>
          <div style={{ fontSize: 11, color: "#a89afc", fontFamily: "'DM Mono',monospace", marginBottom: 8, letterSpacing: ".06em" }}>⊞ subtasks</div>
          {loadingBreak ? (
            <span style={{ fontSize: 12, color: "#7878a0" }}>Breaking down...</span>
          ) : subtasks && subtasks.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {subtasks.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: "#18181f", borderRadius: 8, padding: "6px 10px", border: "0.5px solid rgba(255,255,255,.06)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: subtaskPColor[s.priority] || "#7878a0" }} />
                  <span style={{ fontSize: 12, color: "#d0d0f0", flex: 1 }}>{s.subtask}</span>
                  <span style={{ fontSize: 10, color: subtaskPColor[s.priority] || "#7878a0", fontFamily: "'DM Mono',monospace" }}>{s.priority}</span>
                </div>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: 12, color: "#7878a0" }}>No subtasks generated.</span>
          )}
        </div>
      )}
    </div>
  );
}

function iconBtn() {
  return { width: 28, height: 28, borderRadius: 8, border: "0.5px solid rgba(255,255,255,.09)", background: "#18181f", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#7878a0", transition: "all .15s", fontFamily: "inherit" };
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  G.injectGlobal();
  const [tasks, setTasks]       = useState([]);
  const [filter, setFilter]     = useState("ALL");
  const [toast, setToast]       = useState({ msg: "", visible: false });
  const [title, setTitle]       = useState("");
  const [desc, setDesc]         = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [status, setStatus]     = useState("TODO");
  const [dueDate, setDueDate]   = useState("");
  const [aiText, setAiText]     = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const showToast = (msg) => {
    setToast({ msg, visible: true });
    clearTimeout(window._tm_toast);
    window._tm_toast = setTimeout(() => setToast(t => ({ ...t, visible: false })), 2400);
  };

  const loadTasks = async () => {
    try { const r = await fetch(`${BASE_URL}/tasks`); setTasks(await r.json()); }
    catch { setTasks([]); }
  };

  useEffect(() => { loadTasks(); }, []);

  const createTask = async () => {
    if (!title.trim()) { showToast("Enter a title first"); return; }
    try {
      await fetch(`${BASE_URL}/tasks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, description: desc, priority, status, dueDate: dueDate || null }) });
      setTitle(""); setDesc(""); setPriority("MEDIUM"); setStatus("TODO"); setDueDate("");
      showToast("Task created ✓"); loadTasks();
    } catch { showToast("Backend offline — check server"); }
  };

  const deleteTask = async (id) => {
    try { await fetch(`${BASE_URL}/tasks/${id}`, { method: "DELETE" }); } catch {}
    setTasks(prev => prev.filter(t => t.id !== id));
    showToast("Task deleted");
  };

  const aiSuggest = async () => {
    if (!aiText.trim()) { showToast("Describe your task first"); return; }
    setAiLoading(true); showToast("AI thinking...");
    try {
      const r = await fetch(`${BASE_URL}/tasks/suggest`, { method: "POST", headers: { "Content-Type": "text/plain" }, body: aiText });
      if (r.ok) { setAiText(""); showToast("AI task created ✦"); loadTasks(); }
      else showToast("AI request failed");
    } catch { showToast("Backend offline — check server"); }
    finally { setAiLoading(false); }
  };

  const filtered = filter === "ALL" ? tasks : tasks.filter(t => t.status === filter);
  const doneCt   = tasks.filter(t => t.status === "DONE").length;

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 550, height: 550, borderRadius: "50%", background: "rgba(124,109,250,.07)", filter: "blur(90px)", top: -180, left: -120 }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "rgba(250,109,138,.06)", filter: "blur(80px)", bottom: -80, right: -80 }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 880, margin: "0 auto", padding: "2rem 1.5rem" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2.5rem", animation: "fadeDown .5s ease both" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg, #7c6dfa, #fa6d8a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✦</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-.02em" }}>TaskFlow</div>
              <div style={{ fontSize: 11, color: "#7878a0", fontFamily: "'DM Mono',monospace", letterSpacing: ".07em" }}>AI-powered workspace</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[`${tasks.length} tasks`, `${doneCt} done`].map(label => (
              <div key={label} style={{ background: "#18181f", border: "0.5px solid rgba(255,255,255,.09)", borderRadius: 30, padding: "6px 14px", fontSize: 12, fontFamily: "'DM Mono',monospace", color: "#7878a0" }}>
                <span style={{ color: "#f0f0ff", fontWeight: 500 }}>{label.split(" ")[0]}</span>{" "}{label.split(" ")[1]}
              </div>
            ))}
          </div>
        </div>

        {/* Create Task */}
        <SectionLabel>create task</SectionLabel>
        <div style={{ ...cardStyle, animation: "fadeUp .5s .05s ease both", marginBottom: "1.5rem" }}>
          <Field label="title">
            <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs to be done?" onKeyDown={e => e.key === "Enter" && createTask()} />
          </Field>
          <Field label="description">
            <textarea style={{ ...inputStyle, minHeight: 64, resize: "vertical" }} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Add context or details..." />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
            <Field label="priority">
              <select style={inputStyle} value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="LOW">Low</option>
              </select>
            </Field>
            <Field label="status">
              <select style={inputStyle} value={status} onChange={e => setStatus(e.target.value)}>
                <option value="TODO">To Do</option><option value="IN_PROGRESS">In Progress</option><option value="DONE">Done</option>
              </select>
            </Field>
            <Field label="due date">
              <input style={inputStyle} type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </Field>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button style={btnGhostStyle} onClick={() => { setTitle(""); setDesc(""); setPriority("MEDIUM"); setStatus("TODO"); setDueDate(""); }}>Clear</button>
            <button style={btnPrimaryStyle} onClick={createTask}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(124,109,250,.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
              + Add Task
            </button>
          </div>
        </div>

        {/* AI Suggest */}
        <SectionLabel>ai suggest</SectionLabel>
        <div style={{ ...cardStyle, background: "linear-gradient(135deg, #111118 0%, #13101e 100%)", border: "0.5px solid rgba(124,109,250,.15)", position: "relative", overflow: "hidden", animation: "fadeUp .5s .1s ease both", marginBottom: "1.5rem" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(124,109,250,.35), transparent)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ background: "rgba(124,109,250,.1)", border: "0.5px solid rgba(124,109,250,.2)", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontFamily: "'DM Mono',monospace", color: "#a89afc", letterSpacing: ".06em", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7c6dfa", animation: "pulse 2s infinite", display: "inline-block" }} />
              Gemini AI
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <textarea style={{ ...inputStyle, flex: 1, minHeight: 64, resize: "vertical" }} value={aiText} onChange={e => setAiText(e.target.value)} placeholder="e.g. 'remind me to submit the quarterly report by Friday with high priority'..." />
            <button onClick={aiSuggest} disabled={aiLoading}
              style={{ padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: aiLoading ? "not-allowed" : "pointer", fontFamily: "'Syne',sans-serif", border: "0.5px solid rgba(124,109,250,.3)", background: "rgba(124,109,250,.1)", color: "#a89afc", transition: "all .2s", whiteSpace: "nowrap", opacity: aiLoading ? .6 : 1 }}
              onMouseEnter={e => { if (!aiLoading) { e.currentTarget.style.background = "rgba(124,109,250,.18)"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(124,109,250,.1)"; e.currentTarget.style.transform = "translateY(0)"; }}>
              {aiLoading ? "✦ Thinking..." : "✦ Generate"}
            </button>
          </div>
        </div>

        {/* Tasks */}
        <SectionLabel>your tasks</SectionLabel>
        <div style={{ display: "flex", gap: 6, marginBottom: "1.2rem", flexWrap: "wrap", animation: "fadeUp .5s .15s ease both" }}>
          {["ALL", "TODO", "IN_PROGRESS", "DONE"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: "6px 14px", borderRadius: 30, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Syne',sans-serif", border: "0.5px solid rgba(255,255,255,.09)", background: filter === f ? "rgba(255,255,255,.06)" : "transparent", color: filter === f ? "#a89afc" : "#7878a0", borderColor: filter === f ? "rgba(124,109,250,.25)" : "rgba(255,255,255,.09)", transition: "all .15s" }}>
              {{ ALL: "All", TODO: "To Do", IN_PROGRESS: "In Progress", DONE: "Done" }[f]}
              {f !== "ALL" && <span style={{ marginLeft: 5, opacity: .6 }}>{tasks.filter(t => t.status === f).length}</span>}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
          {filtered.length === 0 ? (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "3rem", color: "#7878a0" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>◎</div>
              <p style={{ fontSize: 14 }}>No tasks here yet</p>
            </div>
          ) : (
            filtered.map((t, i) => <TaskCard key={t.id} task={t} onDelete={deleteTask} delay={i * 0.04} />)
          )}
        </div>
      </div>

      <Toast msg={toast.msg} visible={toast.visible} />
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 11, letterSpacing: ".12em", color: "#7878a0", textTransform: "uppercase", fontFamily: "'DM Mono',monospace", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
      {children}
      <span style={{ flex: 1, height: ".5px", background: "rgba(255,255,255,.08)" }} />
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 11, fontFamily: "'DM Mono',monospace", color: "#7878a0", marginBottom: 5, letterSpacing: ".06em" }}>{label}</label>
      {children}
    </div>
  );
}

const cardStyle = { background: "#111118", border: "0.5px solid rgba(255,255,255,.09)", borderRadius: 18, padding: "1.4rem 1.5rem" };
const inputStyle = { width: "100%", background: "#18181f", border: "0.5px solid rgba(255,255,255,.09)", borderRadius: 10, padding: "9px 13px", color: "#f0f0ff", fontSize: 14, transition: "border-color .2s, box-shadow .2s", WebkitAppearance: "none", appearance: "none" };
const btnGhostStyle = { padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Syne',sans-serif", border: "0.5px solid rgba(255,255,255,.09)", background: "transparent", color: "#7878a0", transition: "all .2s" };
const btnPrimaryStyle = { padding: "9px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Syne',sans-serif", border: "none", background: "linear-gradient(135deg, #7c6dfa, #9d6dfa)", color: "#fff", transition: "transform .2s, box-shadow .2s" };