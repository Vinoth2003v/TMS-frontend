"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar  from "@/components/Navbar";
import { tasksApi, notificationsApi, usersApi, categoriesApi } from "@/lib/api";
import { 
  AlertCircle, Calendar, MessageSquare, ListTodo, Plus, Target, 
  CheckCircle2, Search, Clock, Tag, User, Send, ChevronRight, Activity,
  Flame, AlertTriangle, ArrowRight, Check, X, Sparkles
} from "lucide-react";

const PRIORITY_CONFIG: Record<string, { label: string; badgeClass: string; icon: any }> = {
  Urgent: { label: "URGENT", badgeClass: "badge-urgent", icon: Flame },
  High:   { label: "HIGH",   badgeClass: "badge-high",   icon: AlertTriangle },
  Medium: { label: "MEDIUM", badgeClass: "badge-medium", icon: Clock },
  Low:    { label: "LOW",    badgeClass: "badge-low",    icon: CheckCircle2 },
};

function TaskCard({ task, user, onStatusChange, onComment }: any) {
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const isApproaching = task.dueDate && task.status !== "Completed" &&
    (new Date(task.dueDate).getTime() - Date.now() < 86400000 * 2);

  const submitComment = () => {
    if (!commentText.trim()) return;
    onComment(task, commentText);
    setCommentText("");
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
        {/* Quick Complete Toggle Button */}
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
                    <Flame size={11} /> Due soon
                  </span>
                )}
              </div>
            </div>

            {/* Badges on right */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <span className={`badge ${prio.badgeClass}`}>
                <PrioIcon size={11} /> {prio.label}
              </span>
              <span className={`badge ${isCompleted ? 'badge-completed' : task.status === 'In Progress' ? 'badge-inprogress' : 'badge-todo'}`}>
                {task.status}
              </span>
            </div>
          </div>
          
          {task.description && (
            <p style={{ 
              fontSize: 12.5, 
              color: "var(--text-secondary)", 
              marginBottom: 10, 
              lineHeight: 1.45, 
              display: "-webkit-box", 
              WebkitLineClamp: 2, 
              WebkitBoxOrient: "vertical", 
              overflow: "hidden" 
            }}>
              {task.description}
            </p>
          )}

          {/* Metadata Row */}
          <div className="task-meta" style={{ gap: 8, marginTop: 8 }}>
            {task.dueDate && (
              <span className="pill">
                <Calendar size={12} style={{ color: "var(--accent)" }}/> {task.dueDate}
              </span>
            )}
            {task.category && task.category !== "Uncategorized" && (
              <span className="pill">
                <Tag size={12} style={{ color: "var(--text-muted)" }}/> {task.category}
              </span>
            )}
            
            <button
              className="btn btn-ghost btn-xs"
              onClick={() => setShowComments(!showComments)}
              style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", fontSize: 11 }}
            >
              <MessageSquare size={12} />
              <span>{task.comments?.length || 0} notes</span>
            </button>
          </div>

          {/* Comments Accordion */}
          {showComments && (
            <div style={{ marginTop: 14, background: "var(--bg-elevated)", borderRadius: "10px", padding: 12, border: "1px solid var(--border)" }}>
              <div style={{ maxHeight: 180, overflowY: "auto", marginBottom: 10 }}>
                {(!task.comments || task.comments.length === 0) && (
                  <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: "10px 0", fontStyle: "italic" }}>No notes added yet.</p>
                )}
                {task.comments?.map((c: any, i: number) => (
                  <div key={c.id || i} style={{ marginBottom: 8, display: "flex", gap: 8 }}>
                    <div className="avatar" style={{ width: 22, height: 22, borderRadius: "6px", background: "var(--bg-secondary)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 10, color: "var(--text-primary)" }}>
                      {c.by?.charAt(0) || "U"}
                    </div>
                    <div style={{ flex: 1 }}>
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
                  style={{ padding: "6px 10px", fontSize: 12, flex: 1, borderRadius: "8px" }}
                  placeholder="Add a quick note…"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
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

export default function PersonalDashboard() {
  const [tasks, setTasks]                 = useState<any[]>([]);
  const [user, setUser]                   = useState<any>(null);
  const [users, setUsers]                 = useState<any[]>([]);
  const [categories, setCategories]       = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading]             = useState(true);
  
  const [searchQuery, setSearchQuery]     = useState("");
  const [filterStatus, setFilterStatus]   = useState("All");

  const [form, setForm] = useState({ 
    title: "", 
    description: "", 
    dueDate: "", 
    priority: "Medium", 
    assignedTo: "", 
    category: "Uncategorized", 
    labels: "", 
    status: "Todo" 
  });
  const [submitting, setSubmitting] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { window.location.href = "/login"; return; }
    const u = JSON.parse(stored);
    setUser(u);
    loadAll(u);
  }, []);

  const loadAll = async (u: any) => {
    try {
      const [t, us, notifs, cats] = await Promise.all([
        tasksApi.getAll(),
        usersApi.getAll(),
        notificationsApi.getAll(u.email).catch(() => []),
        categoriesApi.getAll().catch(() => [])
      ]);
      setTasks(t || []);
      setUsers(us || []);
      setCategories(cats || []);
      setNotifications((notifs || []).slice(0, 5));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const addTask = async () => {
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        labels: form.labels ? form.labels.split(",").map((l) => l.trim()).filter(Boolean).join(",") : "",
        createdBy: user?.email,
        assignedTo: user?.email // Auto-assign to self
      };
      const newTask = await tasksApi.create(payload);
      setTasks((prev) => [newTask, ...prev]);
      setForm({ title: "", description: "", dueDate: "", priority: "Medium", assignedTo: "", category: "Uncategorized", labels: "", status: "Todo" });
      setShowTaskForm(false);
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  const updateStatus = async (task: any, newStatus: string) => {
    try {
      const updated = await tasksApi.update(task.id, {
        status: newStatus,
        completedBy: newStatus === "Completed" ? (user?.name || user?.email) : undefined,
      });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (e) { console.error(e); }
  };

  const addComment = async (task: any, text: string) => {
    try {
      const updated = await tasksApi.addComment(task.id, text, user?.name || user?.email, user?.email);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (e) { console.error(e); }
  };

  const visibleTasks = tasks.filter((t) => t.assignedTo === user?.email || t.createdBy === user?.email);

  const filteredTasks = visibleTasks
    .filter((t) => filterStatus === "All" || t.status === filterStatus)
    .filter((t) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (a.status === "Completed" && b.status !== "Completed") return 1;
      if (b.status === "Completed" && a.status !== "Completed") return -1;
      
      const p: Record<string, number> = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
      if (p[a.priority] !== p[b.priority]) return (p[b.priority] || 0) - (p[a.priority] || 0);
      
      if (!a.dueDate) return 1; if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  const stats = {
    total: visibleTasks.length,
    completed: visibleTasks.filter((t) => t.status === "Completed").length,
    inProgress: visibleTasks.filter((t) => t.status === "In Progress").length,
    todo: visibleTasks.filter((t) => t.status !== "Completed").length,
  };

  const completionPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const criticalDeadlines = visibleTasks
    .filter((t) => t.dueDate && t.status !== "Completed")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Navbar title="Personal Workspace" />
        <div className="page-content">

          {/* DASHBOARD HERO (Compact Greeting) */}
          <div style={{ marginBottom: 26, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14 }}>
            <div>
              <h1 className="brand-text" style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
                Good day, {user?.name?.split(' ')[0] || "User"} 👋
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                Here's what's happening with your workspace today. You have <strong style={{ color: "var(--accent)" }}>{stats.todo}</strong> pending tasks.
              </p>
            </div>
            
            <button 
              className="btn btn-primary" 
              onClick={() => setShowTaskForm(true)} 
              style={{ height: 38, padding: "0 18px", fontSize: 13 }}
            >
              <Plus size={15} /> Create Task
            </button>
          </div>

          {/* STATISTICS ROW (Compact Premium Cards) */}
          <div className="grid-3" style={{ marginBottom: 24 }}>
            {/* Total Tasks */}
            <div className="stat-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>TOTAL TASKS</span>
                <div className="stat-icon-wrap">
                  <ListTodo size={17} />
                </div>
              </div>
              <div className="stat-info">
                <h3>{stats.total}</h3>
                <p>{stats.todo} active tasks</p>
              </div>
            </div>

            {/* In Progress */}
            <div className="stat-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>IN PROGRESS</span>
                <div className="stat-icon-wrap" style={{ background: "var(--warning-dim)", color: "var(--warning)", borderColor: "var(--warning-border)" }}>
                  <Clock size={17} />
                </div>
              </div>
              <div className="stat-info">
                <h3 style={{ color: "var(--warning)" }}>{stats.inProgress}</h3>
                <p>Currently executing</p>
              </div>
            </div>

            {/* Completed */}
            <div className="stat-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>COMPLETED</span>
                <div className="stat-icon-wrap" style={{ background: "var(--success-dim)", color: "var(--success)", borderColor: "var(--success-border)" }}>
                  <CheckCircle2 size={17} />
                </div>
              </div>
              <div className="stat-info">
                <h3 style={{ color: "var(--success)" }}>{stats.completed}</h3>
                <p>{completionPct}% completion rate</p>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT COMPOSITION (Center Large Card + Right Stacked Cards) */}
          <div className="grid-2-1">
            {/* Primary Large Card: Recent Tasks */}
            <div className="card" style={{ padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <h2 className="section-title" style={{ fontSize: 17, margin: 0 }}>Recent Tasks</h2>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Focus on priority deliverables</span>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ position: "relative" }}>
                    <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input 
                      className="form-input" 
                      style={{ paddingLeft: 30, width: 180, fontSize: 12, height: 32, borderRadius: "8px" }} 
                      placeholder="Filter tasks…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <select 
                    className="form-select" 
                    style={{ width: "auto", fontSize: 12, height: 32, borderRadius: "8px", padding: "0 10px" }}
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="All">All</option>
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {filteredTasks.length === 0 ? (
                <div className="empty-state" style={{ padding: "40px 20px" }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                    <ListTodo size={20} style={{ color: "var(--text-muted)" }} />
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>No tasks found</h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: 12 }}>Create a new task to get started.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {filteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      user={user}
                      onStatusChange={updateStatus}
                      onComment={addComment}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right Stacked Information Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Card 1: Critical Deadlines */}
              <div className="card" style={{ padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <div style={{ padding: 5, borderRadius: 6, background: "var(--danger-dim)", color: "var(--danger)" }}>
                    <AlertCircle size={14} />
                  </div>
                  <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-primary)" }}>
                    CRITICAL DEADLINES
                  </h3>
                </div>

                {criticalDeadlines.length === 0 ? (
                  <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>No urgent deadlines pending.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {criticalDeadlines.map((t) => (
                      <div key={t.id} style={{ padding: "10px 12px", borderRadius: "8px", background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{t.title}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11 }}>
                          <span style={{ color: "var(--text-muted)" }}>{t.priority} Priority</span>
                          <span style={{ color: "var(--accent)", fontWeight: 600 }}>{t.dueDate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card 2: Workspace Progress */}
              <div className="card" style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-primary)" }}>
                    COMPLETION PROGRESS
                  </h3>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>{completionPct}%</span>
                </div>
                
                <div className="progress-bar" style={{ height: 6, marginBottom: 14 }}>
                  <div className="progress-fill" style={{ width: `${completionPct}%` }} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)" }}>
                  <span>{stats.completed} Delivered</span>
                  <span>{stats.todo} Remaining</span>
                </div>
              </div>

              {/* Card 3: Recent Activity */}
              {notifications.length > 0 && (
                <div className="card" style={{ padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <div style={{ padding: 5, borderRadius: 6, background: "var(--accent-dim)", color: "var(--accent)" }}>
                      <Activity size={14} />
                    </div>
                    <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-primary)" }}>
                      RECENT ACTIVITY
                    </h3>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {notifications.slice(0, 3).map((n: any, i) => (
                      <div key={n.id || i} style={{ display: "flex", gap: 10 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", marginTop: 5, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 12, color: "var(--text-primary)", lineHeight: 1.4 }}>{n.message}</div>
                          <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 2 }}>
                            {n.date ? new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Task Creation Modal */}
      {showTaskForm && (
        <div className="modal-overlay" onClick={() => setShowTaskForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 className="section-title" style={{ fontSize: 18, margin: 0 }}>Add Personal Task</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowTaskForm(false)} style={{ padding: 4 }}>
                <X size={16} />
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Task Title</label>
              <input 
                className="form-input" 
                autoFocus
                placeholder="What needs to be done?" 
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <textarea 
                className="form-textarea" 
                placeholder="Provide details or notes…" 
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} 
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Priority</label>
                <select 
                  className="form-select" 
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setShowTaskForm(false)}>Cancel</button>
              <button 
                className="btn btn-primary" 
                onClick={addTask} 
                disabled={submitting || !form.title.trim()}
              >
                {submitting ? "Saving…" : "Create Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}