"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar  from "@/components/Navbar";
import { analyticsApi, tasksApi, usersApi } from "@/lib/api";
import { ClipboardList, CheckCircle2, Clock, BarChart3, PieChart, Target, Users, Tag } from "lucide-react";

export default function ManagerAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [tasks, setTasks]         = useState<any[]>([]);
  const [users, setUsers]         = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [user, setUser]           = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { window.location.href = "/login"; return; }
    const u = JSON.parse(stored);
    if (u.role !== "manager" && u.role !== "admin") { window.location.href = "/dashboard"; return; }
    setUser(u);
    Promise.all([
      analyticsApi.getForManager(u.email).catch(() => null),
      tasksApi.getAll({ createdBy: u.email }),
      usersApi.getAll(),
    ]).then(([a, t, us]) => {
      setAnalytics(a);
      setTasks(t);
      setUsers(us);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  const categories = analytics?.tasksByCategory || {};
  const priorities = analytics?.tasksByPriority || {};
  const statuses   = analytics?.tasksByStatus   || {};
  const maxCat     = Math.max(1, ...Object.values(categories) as number[]);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Navbar title="Analytics & Reports" />
        <div className="page-content">

          {/* Page Intro */}
          <div style={{ marginBottom: 28 }}>
            <h1 className="brand-text" style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.5px", marginBottom: 4 }}>
              Analytics & Performance
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 13.5 }}>
              Real-time workspace insights, team velocity, and delivery statistics.
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid-4 mb-24">
            <div className="stat-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span className="stat-label">Total Tasks</span>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(255, 138, 31, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ClipboardList size={17} color="var(--accent)" />
                </div>
              </div>
              <div className="stat-val">{analytics?.totalTasks || 0}</div>
              <div className="stat-sub">Across all workspace workflows</div>
            </div>

            <div className="stat-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span className="stat-label">Completed</span>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--success-dim)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircle2 size={17} color="var(--success)" />
                </div>
              </div>
              <div className="stat-val" style={{ color: "var(--success)" }}>{analytics?.completedTasks || 0}</div>
              <div className="stat-sub">Delivered successfully</div>
            </div>

            <div className="stat-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span className="stat-label">In Progress</span>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--warning-dim)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Clock size={17} color="var(--warning)" />
                </div>
              </div>
              <div className="stat-val" style={{ color: "var(--warning)" }}>{analytics?.inProgressTasks || 0}</div>
              <div className="stat-sub">Active in pipeline</div>
            </div>

            <div className="stat-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span className="stat-label">Completion Rate</span>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(255, 138, 31, 0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BarChart3 size={17} color="var(--accent)" />
                </div>
              </div>
              <div className="stat-val" style={{ color: "var(--accent)" }}>{analytics?.completionRate || 0}%</div>
              <div className="stat-sub">Task resolution efficiency</div>
            </div>
          </div>

          <div className="grid-2 mb-24">
            {/* Status Distribution */}
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <PieChart size={17} color="var(--accent)" />
                <h3 className="section-title" style={{ margin: 0, fontSize: 16 }}>Status Breakdown</h3>
              </div>
              {Object.entries(statuses).length === 0 ? (
                <div className="empty-state" style={{ padding: "32px 0", textAlign: "center" }}>
                  <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No task status data available</p>
                </div>
              ) : (
                Object.entries(statuses).map(([status, count]: any) => {
                  const max   = Math.max(1, ...Object.values(statuses) as number[]);
                  const pct   = Math.round((count / (analytics?.totalTasks || 1)) * 100);
                  const color = status === "Completed" ? "var(--success)" : status === "In Progress" ? "var(--accent)" : status === "Pending Approval" ? "var(--warning)" : "var(--text-muted)";
                  return (
                    <div key={status} style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                        <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{status}</span>
                        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{count} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({pct}%)</span></span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${(count / max) * 100}%`, background: color }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Priority Breakdown */}
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <Target size={17} color="var(--accent)" />
                <h3 className="section-title" style={{ margin: 0, fontSize: 16 }}>Priority Distribution</h3>
              </div>
              {Object.entries(priorities).length === 0 ? (
                <div className="empty-state" style={{ padding: "32px 0", textAlign: "center" }}>
                  <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No priority data recorded yet</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {["High", "Medium", "Low"].map((p) => {
                    const count = (priorities[p] || 0) as number;
                    const pct   = analytics?.totalTasks ? Math.round((count / analytics.totalTasks) * 100) : 0;
                    const color = p === "High" ? "var(--danger)" : p === "Medium" ? "var(--warning)" : "var(--text-muted)";
                    return (
                      <div key={p}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                          <span><span className={`badge badge-${p.toLowerCase()}`}>{p} Priority</span></span>
                          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{count} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({pct}%)</span></span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="card mb-24">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <Tag size={17} color="var(--accent)" />
              <h3 className="section-title" style={{ margin: 0, fontSize: 16 }}>Tasks by Category</h3>
            </div>
            {Object.keys(categories).length === 0 ? (
              <div className="empty-state" style={{ padding: "32px 0", textAlign: "center" }}>
                <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No categories assigned to tasks</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
                {Object.entries(categories).map(([cat, count]: any) => (
                  <div key={cat} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "16px", transition: "var(--transition)" }}>
                    <div style={{ fontWeight: 700, fontSize: 22, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>{count}</div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4, fontWeight: 500 }}>{cat}</div>
                    <div className="progress-bar" style={{ marginTop: 12 }}>
                      <div className="progress-fill" style={{ width: `${(count / maxCat) * 100}%`, background: "var(--accent)" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Team Performance */}
          {analytics?.teamStats && analytics.teamStats.length > 0 && (
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <Users size={17} color="var(--accent)" />
                <h3 className="section-title" style={{ margin: 0, fontSize: 16 }}>Team Performance Leaderboard</h3>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Rank</th><th>Member</th><th>Assigned</th><th>Completed</th><th>Pending</th><th>Productivity</th></tr>
                  </thead>
                  <tbody>
                    {analytics.teamStats.map((s: any, i: number) => (
                      <tr key={s.email}>
                        <td>
                          <div style={{
                            width: 26, height: 26, borderRadius: "6px",
                            background: i === 0 ? "rgba(255, 138, 31, 0.2)" : i === 1 ? "rgba(245, 158, 11, 0.15)" : "var(--bg-elevated)",
                            border: i === 0 ? "1px solid var(--accent)" : "1px solid var(--border)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 700, fontSize: 12, color: i === 0 ? "var(--accent)" : "var(--text-secondary)"
                          }}>
                            {i + 1}
                          </div>
                        </td>
                        <td>
                          <div className="primary-text" style={{ fontSize: 13.5 }}>{s.name}</div>
                          <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{s.email}</div>
                        </td>
                        <td style={{ fontWeight: 500 }}>{s.assignedTasks}</td>
                        <td style={{ fontWeight: 600, color: "var(--success)" }}>{s.completedTasks}</td>
                        <td style={{ fontWeight: 500, color: "var(--warning)" }}>{s.assignedTasks - s.completedTasks}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div className="progress-bar" style={{ width: 90 }}>
                              <div className="progress-fill" style={{
                                width: `${s.productivity}%`,
                                background: s.productivity >= 80 ? "var(--success)" : s.productivity >= 50 ? "var(--warning)" : "var(--danger)"
                              }} />
                            </div>
                            <span style={{
                              fontWeight: 600, fontSize: 12.5,
                              color: s.productivity >= 80 ? "var(--success)" : s.productivity >= 50 ? "var(--warning)" : "var(--danger)"
                            }}>
                              {s.productivity}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
