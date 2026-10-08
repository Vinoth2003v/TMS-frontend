"use client";
import { useState } from "react";
import { Plus, Calendar, User, Tag, AlertCircle } from "lucide-react";

export default function TaskForm({ onTaskCreated }: { onTaskCreated?: () => void }) {
  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo]   = useState("");
  const [dueDate, setDueDate]         = useState("");
  const [priority, setPriority]       = useState("Medium");
  const [submitting, setSubmitting]   = useState(false);
  const [msg, setMsg]                 = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setMsg("");

    try {
      const stored = localStorage.getItem("user");
      const user = stored ? JSON.parse(stored) : null;

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          assignedTo: assignedTo || user?.email,
          dueDate,
          priority,
          createdBy: user?.email,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.error || "Failed to create task");
      }

      setTitle("");
      setDescription("");
      setAssignedTo("");
      setDueDate("");
      setMsg("Task created successfully!");
      setTimeout(() => setMsg(""), 3000);
      if (onTaskCreated) onTaskCreated();
    } catch (e: any) {
      setMsg(e.message || "Error creating task");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card" style={{ padding: "24px" }}>
      <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "16px", display: "flex", alignItems: "center", gap: 8 }}>
        <Plus size={16} color="var(--accent)" /> Create Task
      </h3>

      {msg && (
        <div style={{
          padding: "10px 14px",
          borderRadius: "8px",
          fontSize: "12px",
          marginBottom: "16px",
          background: msg.includes("Error") || msg.includes("Failed") ? "var(--danger-dim)" : "var(--success-dim)",
          color: msg.includes("Error") || msg.includes("Failed") ? "var(--danger)" : "var(--success)",
          border: `1px solid ${msg.includes("Error") || msg.includes("Failed") ? "var(--danger-border)" : "var(--success-border)"}`
        }}>
          {msg}
        </div>
      )}

      <form onSubmit={handleAdd}>
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label">Title</label>
          <input
            className="form-input"
            placeholder="e.g. Database schema migration"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label">Description</label>
          <textarea
            className="form-textarea"
            placeholder="Key deliverables and requirements…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ minHeight: "80px" }}
          />
        </div>

        <div className="grid-2" style={{ marginBottom: 14 }}>
          <div>
            <label className="form-label">Assign To (Email)</label>
            <input
              className="form-input"
              type="email"
              placeholder="member@org.com"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Due Date</label>
            <input
              className="form-input"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 20 }}>
          <label className="form-label">Priority</label>
          <select 
            className="form-select"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary btn-full"
          disabled={submitting || !title.trim()}
          style={{ height: "40px" }}
        >
          {submitting ? "Creating…" : "Create Task"}
        </button>
      </form>
    </div>
  );
}