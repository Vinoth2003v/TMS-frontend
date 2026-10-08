"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar  from "@/components/Navbar";
import { tasksApi, notificationsApi } from "@/lib/api";
import {
  Calendar, Tag, User, MessageSquare, Send, CheckCircle2,
  Clock, ListTodo, Flame, SlidersHorizontal, Search, Check, AlertTriangle
} from "lucide-react";

const PRIORITY_CONFIG: Record<string, { label: string; badgeClass: string; icon: any }> = {
  Urgent: { label: "URGENT", badgeClass: "badge-urgent", icon: Flame },
  High:   { label: "HIGH",   badgeClass: "badge-high",   icon: AlertTriangle },
  Medium: { label: "MEDIUM", badgeClass: "badge-medium", icon: Clock },
  Low:    { label: "LOW",    badgeClass: "badge-low",    icon: CheckCircle2 },
};

function MyTaskCard({ task, user, isApproaching, onStatusChange, onComment }: any) {
  const [comment, setComment] = useState("");
  const [showComments, setShowComments] = useState(false);

  const submitComment = () => {
    if (!comment.trim()) return;
    onComment(task, comment);
    setComment("");
  };

  const isCompleted = task.status === "Completed" || task.status === "COMPLETED";
  const prio = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Low;
  const PrioIcon = prio.icon;

  return (
    <div 
      className="task-card" 
      style={{
        marginBottom: 10,
        padding: "16px 20px",
        borderLeft: isApproaching ? "3px solid var(--danger)" : isCompleted ? "3px solid var(--success)" : "3px solid var(--border)"
      }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        {/* Checkbox button */}
        <button 
          className="btn btn-ghost" 
          style={{ 
            padding: 0, 
            borderRadius: "50%", 
            color: isCompleted ? "var(--success)" : "var(--text-muted)", 
            border: `1.5px solid ${isCompleted ? "var(--success)" : "var(--border)"}`, 
            width: 22, 
            height: 22, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            marginTop: 2,
            background: isCompleted ? "var(--success-dim)" : "transparent",
            flexShrink: 0
          }}
          onClick={() => onStatusChange(task, isCompleted ? "Todo" : "Completed")}
          title={isCompleted ? "Mark incomplete" : "Mark completed"}
        >
          {isCompleted && <Check size={13} strokeWidth={3} />}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="task-card-header" style={{ marginBottom: 4 }}>
            <div style={{ flex: 1, paddingRight: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ 
                  fontSize: 14.5, 
                  fontWeight: 600, 
                  textDecoration: isCompleted ? "line-through" : "none", 
                  color: isCompleted ? "var(--text-muted)" : "var(--text-primary)" 
                }}>
                  {task.title}
                </span>

                {isApproaching && (
                  <span className="badge badge-urgent" style={{ fontSize: 10, padding: "2px 6px" }}>
                    <Flame size={11} strokeWidth={2.5} /> Due soon
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <span className={`badge ${prio.badgeClass}`}>
                <PrioIcon size={11} /> {prio.label}
              </span>
              <span className={`badge ${isCompleted ? 'badge-completed' : task.status === 'In Progress' ? 'badge-inprogress' : task.status === 'Pending Approval' ? 'badge-pending' : 'badge-todo'}`}>
                {task.status}
              </span>
            </div>
          </div>

          {task.description && (
            <p style={{ fontSize: 12.5, color: "var(--text-secondary)", marginBottom: 8, lineHeight: 1.45 }}>{task.description}</p>
          )}

          <div className="task-meta" style={{ gap: 8, marginTop: 8 }}>
            {task.dueDate && (
              <span className="pill">
                <Calendar size={12} style={{ color: "var(--accent)" }}/> {task.dueDate}
              </span>
            )}
            <span className="pill">
              <User size={12} style={{ color: "var(--text-muted)" }}/>
              {task.createdBy === user?.email ? "Created by me" : `By ${task.createdBy?.split("@")[0]}`}
            </span>
            {task.category && task.category !== "Uncategorized" && (
              <span className="pill">
                <Tag size={12} style={{ color: "var(--text-muted)" }}/> {task.category}
              </span>
            )}
            {task.labels && typeof task.labels === "string" && task.labels.split(",").filter(Boolean).map((l: string, i: number) => (
              <span key={i} style={{ background: "rgba(255, 138, 31, 0.08)", color: "var(--accent)", padding: "2px 6px", borderRadius: "5px", fontSize: 11, fontWeight: 500 }}>
                #{l.trim()}
              </span>
            ))}
          </div>

          {/* Controls Footer */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 500 }}>Status:</span>
              <select
                className="form-select"
                style={{ width: "140px", padding: "4px 8px", fontSize: 12, height: 28, borderRadius: "6px" }}
                value={task.status}
                onChange={(e) => onStatusChange(task, e.target.value)}
              >
                <option value="Todo">Todo</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Completed">Completed</option>
              </select>

              {task.completedBy && isCompleted && (
                <span style={{ fontSize: 11.5, color: "var(--success)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <CheckCircle2 size={12}/> {task.completedBy}
                </span>
              )}
            </div>

            <button
              className="btn btn-ghost btn-xs"
              onClick={() => setShowComments(!showComments)}
              style={{ background: showComments ? "var(--bg-elevated)" : "transparent" }}
            >
              <MessageSquare size={12} />
              <span>{task.comments?.length || 0} notes</span>
            </button>
          </div>

          {showComments && (
            <div style={{ marginTop: 12, background: "var(--bg-elevated)", borderRadius: "8px", padding: 12, border: "1px solid var(--border)" }}>
              <div style={{ maxHeight: 180, overflowY: "auto", marginBottom: 10 }}>
                {(!task.comments || task.comments.length === 0) && (
                  <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: "10px 0", fontStyle: "italic" }}>No notes added.</p>
                )}
                {task.comments?.map((c: any, i: number) => (
                  <div key={c.id || i} style={{ marginBottom: 10, display: "flex", gap: 8 }}>
                    <div className="avatar" style={{ width: 24, height: 24, borderRadius: "6px", background: "var(--bg-secondary)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 10, color: "var(--text-primary)" }}>
                      {c.by?.charAt(0) || "U"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                        <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-primary)" }}>{c.by}</span>
                        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{c.date ? new Date(c.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", background: "var(--bg-card)", padding: "6px 10px", borderRadius: "0 8px 8px 8px", border: "1px solid var(--border)", lineHeight: 1.4 }}>
                        {c.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  className="form-input"
                  style={{ padding: "6px 10px", fontSize: 12, flex: 1, borderRadius: "6px" }}
                  placeholder="Write a comment…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitComment()}
                />
                <button className="btn btn-primary btn-xs" onClick={submitComment} style={{ height: 28, padding: "0 10px" }}>
                  <Send size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MyTasks() {
  const [tasks, setTasks]                   = useState<any[]>([]);
  const [user, setUser]                     = useState<any>(null);
  const [loading, setLoading]               = useState(true);
  const [filterStatus, setFilterStatus]     = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [sortBy, setSortBy]                 = useState("dueDate");
  const [searchQuery, setSearchQuery]       = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { window.location.href = "/login"; return; }
    const u = JSON.parse(stored);
    setUser(u);
    tasksApi.getAll()
      .then(setTasks)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (task: any, status: string) => {
    const updated = await tasksApi.update(task.id, {
      status,
      completedBy: (status === "Completed" || status === "COMPLETED") ? (user?.name || user?.email) : undefined,
    });
    setTasks((p) => p.map((t) => (t.id === task.id ? updated : t)));
    if (task.createdBy && task.createdBy !== user?.email) {
      await notificationsApi.create(task.createdBy, `"${task.title}" is now ${status}`, "TASK_UPDATED").catch(() => {});
    }
  };

  const addComment = async (task: any, text: string) => {
    const updated = await tasksApi.addComment(task.id, text, user?.name, user?.email);
    setTasks((p) => p.map((t) => (t.id === task.id ? updated : t)));
  };

  const myTasks = tasks.filter((t) => t.assignedTo === user?.email || t.createdBy === user?.email);

  const filtered = myTasks
    .filter((t) => filterStatus === "All" || t.status === filterStatus)
    .filter((t) => filterPriority === "All" || t.priority === filterPriority)
    .filter((t) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === "priority") { 
        const p: any = { Urgent: 4, High: 3, Medium: 2, Low: 1 }; 
        return (p[b.priority] || 0) - (p[a.priority] || 0); 
      }
      if (!a.dueDate) return 1; if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  const stats = {
    total: myTasks.length,
    completed: myTasks.filter((t) => t.status === "Completed" || t.status === "COMPLETED").length,
    inProgress: myTasks.filter((t) => t.status === "In Progress" || t.status === "IN_PROGRESS").length,
    todo: myTasks.filter((t) => t.status !== "Completed" && t.status !== "COMPLETED").length,
  };
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Navbar title="My Tasks" />
        <div className="page-content">

          {/* Header */}
          <div style={{ marginBottom: 20 }}>
            <h1 className="brand-text" style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              My Tasks
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
              <strong style={{ color: "var(--accent)" }}>{stats.todo}</strong> pending &nbsp;·&nbsp;
              <strong style={{ color: "var(--success)" }}>{stats.completed}</strong> completed
            </p>
          </div>

          {/* Progress Card */}
          {stats.total > 0 && (
            <div className="card" style={{ padding: "16px 20px", marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>Sprint Execution Progress</span>
                <span style={{ color: completionRate === 100 ? "var(--success)" : "var(--accent)", fontWeight: 700, fontSize: 13 }}>{completionRate}%</span>
              </div>
              <div className="progress-bar" style={{ height: 6 }}>
                <div className="progress-fill" style={{ width: `${completionRate}%` }} />
              </div>
              <div style={{ display: "flex", gap: 20, marginTop: 12 }}>
                {[
                  { label: "Todo", count: stats.todo, color: "var(--text-muted)" },
                  { label: "In Progress", count: stats.inProgress, color: "var(--warning)" },
                  { label: "Completed", count: stats.completed, color: "var(--success)" },
                ].map(({ label, count, color }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
                    <span style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>{label}: <strong style={{ color }}>{count}</strong></span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap", background: "var(--bg-secondary)", padding: 8, borderRadius: "10px", border: "1px solid var(--border)", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 6px", color: "var(--text-muted)" }}>
              <SlidersHorizontal size={13} /> <span style={{ fontSize: 11.5, fontWeight: 600 }}>Filters:</span>
            </div>
            <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
              <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                className="form-input"
                style={{ paddingLeft: 30, fontSize: 12, height: 28 }}
                placeholder="Search tasks…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select className="form-select" style={{ width: "auto", height: 28, fontSize: 12, padding: "0 8px" }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="Todo">Todo</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Completed">Completed</option>
            </select>
            <select className="form-select" style={{ width: "auto", height: 28, fontSize: 12, padding: "0 8px" }} value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
              <option value="All">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <select className="form-select" style={{ width: "auto", height: 28, fontSize: 12, padding: "0 8px" }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
            </select>
          </div>

          {/* Task List */}
          {filtered.length === 0 ? (
            <div className="empty-state" style={{ padding: "48px 24px" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <ListTodo size={22} style={{ color: "var(--text-muted)" }} />
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>No tasks found</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: 12 }}>Adjust your filters or create a new task.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {filtered.map((task) => {
                const isApproaching = task.dueDate && task.status !== "Completed" && task.status !== "COMPLETED" &&
                  new Date(task.dueDate).getTime() - Date.now() < 86400000 * 2;
                return (
                  <MyTaskCard
                    key={task.id}
                    task={task}
                    user={user}
                    isApproaching={isApproaching}
                    onStatusChange={updateStatus}
                    onComment={addComment}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
