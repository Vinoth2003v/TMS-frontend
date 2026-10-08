"use client";
import { useSelector } from "react-redux";
import { Calendar, User, Clock, AlertCircle } from "lucide-react";

export default function TaskList() {
  const tasks = useSelector((state: any) => state?.tasks?.tasks || []);

  if (!tasks || tasks.length === 0) {
    return (
      <div className="card" style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
        <p style={{ fontSize: "13px" }}>No tasks available.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {tasks.map((t: any, i: number) => (
        <div
          key={t.id || i}
          className="task-card"
        >
          <div className="task-card-header">
            <div>
              <div className="task-title">{t.title}</div>
              {t.description && (
                <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginTop: "4px" }}>
                  {t.description}
                </p>
              )}
            </div>
            <span className={`badge ${t.priority === 'Urgent' ? 'badge-urgent' : t.priority === 'High' ? 'badge-high' : t.priority === 'Medium' ? 'badge-medium' : 'badge-low'}`}>
              {t.priority}
            </span>
          </div>

          <div className="task-meta">
            {t.assignedTo && (
              <span className="pill">
                <User size={12} /> {t.assignedTo}
              </span>
            )}
            {t.dueDate && (
              <span className="pill">
                <Calendar size={12} /> {t.dueDate}
              </span>
            )}
            <span className={`badge ${t.status === 'Completed' ? 'badge-completed' : t.status === 'In Progress' ? 'badge-inprogress' : 'badge-todo'}`}>
              {t.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}