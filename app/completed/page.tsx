"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar  from "@/components/Navbar";
import { tasksApi } from "@/lib/api";
import { CheckCircle2, Calendar, User, Tag, MessageSquare, Trophy, Search, SlidersHorizontal } from "lucide-react";

const PRIORITY_BADGE: Record<string, string> = {
  High: "badge-high", Medium: "badge-medium", Low: "badge-low",
};

export default function CompletedTasks() {
  const [tasks, setTasks]         = useState<any[]>([]);
  const [user, setUser]           = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("All");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { window.location.href = "/login"; return; }
    const u = JSON.parse(stored);
    setUser(u);
    tasksApi.getAll().then(setTasks).catch(console.error).finally(() => setLoading(false));
  }, []);

  const visible = tasks.filter((t) => {
    if (user?.role === "admin" || user?.role === "manager") return true;
    return t.assignedTo === user?.email || t.createdBy === user?.email;
  });

  const completed = visible
    .filter((t) => t.status === "Completed")
    .filter((t) => filterPriority === "All" || t.priority === filterPriority)
    .filter((t) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
    });

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Navbar title="Completed Tasks" />
        <div className="page-content">

          {/* Header */}
          <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
            <div>
              <h1 className="brand-text" style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.5px", marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}>
                <CheckCircle2 size={24} color="var(--success)" /> Completed Tasks
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: 13.5 }}>
                <strong style={{ color: "var(--success)" }}>{completed.length}</strong> tasks successfully finished and archived
              </p>
            </div>
            {completed.length > 0 && (
              <div style={{ padding: "8px 16px", background: "var(--success-dim)", borderRadius: "var(--radius-full)", display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--success-border)" }}>
                <Trophy size={15} color="var(--success)" />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--success)" }}>
                  {Math.round((completed.length / (visible.length || 1)) * 100)}% completion rate
                </span>
              </div>
            )}
          </div>

          {/* Filters */}
          {(visible.length > 0 || searchQuery || filterPriority !== "All") && (
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", background: "var(--bg-card)", padding: 12, borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 6px", color: "var(--text-muted)" }}>
                <SlidersHorizontal size={14} /> <span style={{ fontSize: 12.5, fontWeight: 500 }}>Filter:</span>
              </div>
              <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: 34, borderRadius: "var(--radius-sm)", fontSize: 13, height: 36 }}
                  placeholder="Search completed tasks…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select className="form-select" style={{ width: "auto", minWidth: 140, borderRadius: "var(--radius-sm)", height: 36, fontSize: 13 }} value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                <option value="All">All Priorities</option>
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>
          )}

          {/* Task Cards */}
          {completed.length === 0 ? (
            <div className="card empty-state" style={{ padding: "64px 24px", textAlign: "center" }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--success-dim)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", border: "1px solid var(--success-border)" }}>
                <Trophy size={28} style={{ color: "var(--success)" }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
                {searchQuery || filterPriority !== "All" ? "No matching completed tasks" : "No completed tasks yet"}
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: 13.5, maxWidth: 360, margin: "0 auto" }}>
                {searchQuery || filterPriority !== "All"
                  ? "Try adjusting your search criteria or priority filter."
                  : "Finish some tasks from your workspace and they will automatically appear here."}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {completed.map((t) => (
                <div key={t.id} className="card" style={{ padding: "18px 22px", borderLeft: "3px solid var(--success)", transition: "var(--transition)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 15, fontWeight: 600, color: "var(--text-secondary)", textDecoration: "line-through", marginBottom: 4 }}>
                        <CheckCircle2 size={16} color="var(--success)" style={{ flexShrink: 0, textDecoration: "none" }} />
                        {t.title}
                      </div>
                      {t.description && (
                        <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, marginLeft: 24 }}>{t.description}</p>
                      )}
                    </div>
                    <span className={`badge ${PRIORITY_BADGE[t.priority] || "badge-low"}`}>{t.priority}</span>
                  </div>

                  <div className="task-meta" style={{ gap: 8, marginLeft: 24 }}>
                    {t.dueDate && (
                      <span className="pill">
                        <Calendar size={12} style={{ color: "var(--text-muted)" }}/> Due {t.dueDate}
                      </span>
                    )}
                    {t.completedBy && (
                      <span className="pill" style={{ background: "var(--success-dim)", borderColor: "var(--success-border)" }}>
                        <CheckCircle2 size={12} style={{ color: "var(--success)" }}/> <span style={{ color: "var(--success)" }}>By {t.completedBy}</span>
                      </span>
                    )}
                    {t.assignedTo && (
                      <span className="pill">
                        <User size={12} style={{ color: "var(--text-muted)" }}/> {t.assignedTo.split("@")[0]}
                      </span>
                    )}
                    {t.category && t.category !== "Uncategorized" && (
                      <span className="pill">
                        <Tag size={12} style={{ color: "var(--text-muted)" }}/> {t.category}
                      </span>
                    )}
                    {t.labels?.map((l: string, i: number) => (
                      <span key={i} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-secondary)", padding: "2px 8px", borderRadius: "var(--radius-full)", fontSize: 11, fontWeight: 500 }}>
                        #{l}
                      </span>
                    ))}
                  </div>

                  {t.comments?.length > 0 && (
                    <div style={{ marginTop: 12, marginLeft: 24, fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                      <MessageSquare size={12} /> {t.comments.length} comment{t.comments.length > 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
