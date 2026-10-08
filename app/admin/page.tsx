"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar  from "@/components/Navbar";
import { tasksApi, usersApi, analyticsApi, authApi, categoriesApi } from "@/lib/api";
import { 
  Users, ClipboardList, CheckCircle2, BarChart3, Plus, Tags, Trash2, 
  Edit2, Shield, UserPlus, Activity, Eye, Search, AlertCircle, X, Check, Sparkles 
} from "lucide-react";

export default function AdminPanel() {
  const [activeTab, setActiveTab]   = useState("analytics");
  
  // Data State
  const [users, setUsers]           = useState<any[]>([]);
  const [tasks, setTasks]           = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [analytics, setAnalytics]   = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  
  // Search State
  const [searchUser, setSearchUser] = useState("");
  const [searchTask, setSearchTask] = useState("");
  const [searchCat, setSearchCat]   = useState("");

  // Modal States
  const [showUserModal, setShowUserModal] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState<any>(null);
  
  const [showCatModal, setShowCatModal] = useState(false);
  const [editCat, setEditCat] = useState<any>(null);

  // Role Management State
  const [selectedRoles, setSelectedRoles] = useState<Record<number, string>>({});
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  const [roleUpdateMsg, setRoleUpdateMsg] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { window.location.href = "/login"; return; }
    const u = JSON.parse(stored);
    if (u.role !== "admin" && u.role !== "ADMIN") { window.location.href = "/dashboard"; return; }
    setCurrentUser(u);
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [u, t, a, c] = await Promise.all([
        usersApi.getAll(),
        tasksApi.getAll(),
        analyticsApi.getGlobal().catch(() => null),
        categoriesApi.getAll().catch(() => [])
      ]);
      setUsers(u || []); 
      setTasks(t || []); 
      setAnalytics(a); 
      setCategories(c || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleSaveUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    try {
      if (editUser?.id) await usersApi.update(editUser.id, data);
      else await authApi.register(data as any);
      loadAll();
      setShowUserModal(false);
    } catch (e: any) { alert(e.message); }
  };

  const deleteUser = async (id: number, name: string) => {
    if (!confirm(`Delete user "${name}"?`)) return;
    await usersApi.delete(id);
    setUsers((p) => p.filter((u) => u.id !== id));
    loadAll();
  };

  const handleRoleChange = (id: number, role: string) => {
    setSelectedRoles(prev => ({ ...prev, [id]: role }));
  };

  const saveRoleUpdate = async (id: number) => {
    const roleToAssign = selectedRoles[id] || users.find(u => u.id === id)?.role;
    if (!roleToAssign) return;

    setUpdatingUserId(id);
    setRoleUpdateMsg("");

    try {
      const updated = await usersApi.updateRole(id, roleToAssign);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: updated.role || roleToAssign } : u)));
      setRoleUpdateMsg(`Role updated to ${roleToAssign} in MySQL database.`);
      setTimeout(() => setRoleUpdateMsg(""), 3500);
    } catch (e: any) {
      alert(e.message || "Failed to update role. Only Admins can change user roles.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleSaveTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    data.createdBy = currentUser?.email;

    try {
      if (editTask?.id) await tasksApi.update(editTask.id, data);
      else await tasksApi.create(data);
      loadAll();
      setShowTaskModal(false);
    } catch (e: any) { alert(e.message); }
  };

  const deleteTask = async (id: number) => {
    if (!confirm("Delete this task?")) return;
    await tasksApi.delete(id);
    setTasks((p) => p.filter((t) => t.id !== id));
    loadAll();
  };

  const handleSaveCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    try {
      if (editCat?.id) await categoriesApi.update(editCat.id, data as any);
      else await categoriesApi.create(data as any);
      loadAll();
      setShowCatModal(false);
    } catch (e: any) { alert(e.message); }
  };

  const deleteCategory = async (id: number, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    await categoriesApi.delete(id);
    setCategories((p) => p.filter((c) => c.id !== id));
  };

  const filteredUsers = users.filter((u) => !searchUser || u.name?.toLowerCase().includes(searchUser.toLowerCase()) || u.email?.toLowerCase().includes(searchUser.toLowerCase()));
  const filteredTasks = tasks.filter((t) => !searchTask || t.title?.toLowerCase().includes(searchTask.toLowerCase()) || (t.assignedTo || "").toLowerCase().includes(searchTask.toLowerCase()));
  const filteredCategories = categories.filter((c) => !searchCat || c.name?.toLowerCase().includes(searchCat.toLowerCase()));

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Navbar title="Administration" />
        <div className="page-content">

          {/* DASHBOARD HERO */}
          <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14 }}>
            <div>
              <h1 className="brand-text" style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
                Admin Command Center <Shield size={20} color="var(--accent)" />
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                Enterprise control over users, roles, global tasks, and organizational categories.
              </p>
            </div>
            
            <div className="tabs" style={{ margin: 0 }}>
              {[
                { key: "analytics",  label: "Overview",        icon: Activity },
                { key: "users",      label: "User Management", icon: Users },
                { key: "tasks",      label: "All Tasks",       icon: ClipboardList },
                { key: "categories", label: "Categories",      icon: Tags },
              ].map((t) => (
                <button 
                  key={t.key} 
                  className={`tab-btn ${activeTab === t.key ? "active" : ""}`}
                  onClick={() => setActiveTab(t.key)} 
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <t.icon size={14} />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 1. OVERVIEW TAB */}
          {activeTab === "analytics" && analytics && (
            <>
              {/* Stat Cards Row */}
              <div className="grid-4" style={{ marginBottom: 20 }}>
                <div className="stat-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>REGISTERED USERS</span>
                    <div className="stat-icon-wrap">
                      <Users size={17} />
                    </div>
                  </div>
                  <div className="stat-info">
                    <h3>{analytics.totalUsers}</h3>
                    <p>Total platform accounts</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>TASKS CREATED</span>
                    <div className="stat-icon-wrap" style={{ background: "rgba(56, 189, 248, 0.12)", color: "var(--info)", borderColor: "rgba(56, 189, 248, 0.25)" }}>
                      <ClipboardList size={17} />
                    </div>
                  </div>
                  <div className="stat-info">
                    <h3>{analytics.totalTasks}</h3>
                    <p>Platform assignments</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>TASKS COMPLETED</span>
                    <div className="stat-icon-wrap" style={{ background: "var(--success-dim)", color: "var(--success)", borderColor: "var(--success-border)" }}>
                      <CheckCircle2 size={17} />
                    </div>
                  </div>
                  <div className="stat-info">
                    <h3 style={{ color: "var(--success)" }}>{analytics.completedTasks}</h3>
                    <p>Successfully delivered</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>COMPLETION RATE</span>
                    <div className="stat-icon-wrap" style={{ background: "var(--warning-dim)", color: "var(--warning)", borderColor: "var(--warning-border)" }}>
                      <BarChart3 size={17} />
                    </div>
                  </div>
                  <div className="stat-info">
                    <h3 style={{ color: "var(--accent)" }}>{analytics.completionRate}%</h3>
                    <p>Global productivity score</p>
                  </div>
                </div>
              </div>

              {/* Task Distribution & Top Performers */}
              <div className="grid-1-2">
                <div className="card" style={{ padding: "22px" }}>
                  <h3 className="section-title" style={{ fontSize: 15, marginBottom: 20 }}>Task Distribution</h3>
                  {analytics.tasksByStatus && Object.entries(analytics.tasksByStatus).map(([status, count]: any) => {
                    const pct = analytics.totalTasks > 0 ? (count / analytics.totalTasks) * 100 : 0;
                    return (
                      <div key={status} style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
                          <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{status}</span>
                          <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{count} <span style={{ color: "var(--text-muted)", fontWeight: 400, marginLeft: 2 }}>({Math.round(pct)}%)</span></span>
                        </div>
                        <div className="progress-bar" style={{ height: 5 }}>
                          <div className="progress-fill" style={{ 
                            width: `${pct}%`, 
                            background: status === 'Completed' ? 'var(--success)' : status === 'In Progress' ? 'var(--accent)' : 'var(--text-muted)' 
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="card" style={{ padding: "22px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                    <h3 className="section-title" style={{ fontSize: 15, margin: 0 }}>Top Performers</h3>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Efficiency Index</span>
                  </div>
                  
                  <div className="table-wrap" style={{ border: "none" }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Team Member</th>
                          <th>Completed</th>
                          <th style={{ textAlign: "right" }}>Efficiency</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.teamStats?.slice(0, 5).map((s: any) => (
                          <tr key={s.email}>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div className="avatar" style={{ width: 28, height: 28, borderRadius: "6px", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11, color: "var(--text-primary)" }}>
                                  {s.name.charAt(0)}
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{s.name}</span>
                              </div>
                            </td>
                            <td>
                              <div style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
                                <strong style={{ color: "var(--text-primary)" }}>{s.completedTasks}</strong> / {s.assignedTasks}
                              </div>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <span className="pill" style={{ 
                                background: s.productivity > 70 ? "var(--success-dim)" : "var(--bg-secondary)", 
                                color: s.productivity > 70 ? "var(--success)" : "var(--text-secondary)",
                                borderColor: s.productivity > 70 ? "var(--success-border)" : "var(--border)"
                              }}>
                                {s.productivity}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 2. USER MANAGEMENT TAB */}
          {activeTab === "users" && (
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>USER MANAGEMENT</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 2, margin: 0 }}>
                    Only Administrators can assign and modify user roles. Changes persist to MySQL database.
                  </p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ position: "relative" }}>
                    <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input 
                      className="form-input" 
                      style={{ width: 220, paddingLeft: 30, height: 34, fontSize: 12.5 }} 
                      placeholder="Search users…"
                      value={searchUser} 
                      onChange={(e) => setSearchUser(e.target.value)} 
                    />
                  </div>
                  <button className="btn btn-primary" onClick={() => { setEditUser(null); setShowUserModal(true); }} style={{ height: 34, padding: "0 14px", fontSize: 12.5 }}>
                    <UserPlus size={14} /> Invite User
                  </button>
                </div>
              </div>

              {roleUpdateMsg && (
                <div style={{ margin: "14px 24px 0", padding: "10px 14px", background: "var(--success-dim)", color: "var(--success)", borderRadius: "8px", fontSize: 12.5, display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--success-border)" }}>
                  <CheckCircle2 size={15} /> {roleUpdateMsg}
                </div>
              )}

              <div className="table-wrap" style={{ border: "none" }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: 24 }}>Name</th>
                      <th>Email</th>
                      <th>Current Role</th>
                      <th>Assign Role</th>
                      <th style={{ textAlign: "right", paddingRight: 24 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      const currentVal = selectedRoles[u.id] || u.role;
                      const isSelf = u.id === currentUser?.id;
                      const roleBadgeClass = 
                        u.role === "ADMIN" ? "badge-urgent" :
                        u.role === "MANAGER" ? "badge-high" :
                        u.role === "TEAM_MEMBER" ? "badge-completed" : "badge-todo";

                      return (
                        <tr key={u.id}>
                          <td style={{ paddingLeft: 24 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div className="avatar" style={{ width: 30, height: 30, borderRadius: "6px", background: "var(--accent-dim)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>
                                {u.name?.charAt(0).toUpperCase()}
                              </div>
                              <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 13.5 }}>{u.name}</span>
                            </div>
                          </td>
                          <td style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
                            {u.email}
                          </td>
                          <td>
                            <span className={`badge ${roleBadgeClass}`}>
                              {u.role}
                            </span>
                          </td>
                          <td>
                            <select 
                              className="form-select" 
                              style={{ width: "160px", padding: "5px 10px", fontSize: 12, height: 30, borderRadius: "6px" }}
                              value={currentVal} 
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            >
                              <option value="INDIVIDUAL_USER">INDIVIDUAL_USER</option>
                              <option value="TEAM_MEMBER">TEAM_MEMBER</option>
                              <option value="MANAGER">MANAGER</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          </td>
                          <td style={{ textAlign: "right", paddingRight: 24 }}>
                            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6 }}>
                              <button 
                                className="btn btn-primary btn-xs" 
                                style={{ height: 28, padding: "0 10px", fontSize: 11.5 }}
                                disabled={updatingUserId === u.id}
                                onClick={() => saveRoleUpdate(u.id)}
                              >
                                {updatingUserId === u.id ? "Saving…" : "Save"}
                              </button>
                              <button className="btn btn-ghost btn-xs" onClick={() => { setEditUser(u); setShowUserModal(true); }} title="Edit"><Edit2 size={13}/></button>
                              {!isSelf && (
                                <button className="btn btn-ghost btn-xs" style={{ color: "var(--danger)" }} onClick={() => deleteUser(u.id, u.name)} title="Delete"><Trash2 size={13}/></button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. ALL TASKS TAB */}
          {activeTab === "tasks" && (
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>GLOBAL TASK REGISTRY</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 2, margin: 0 }}>Monitor all organizational tasks.</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ position: "relative" }}>
                    <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input 
                      className="form-input" 
                      style={{ width: 220, paddingLeft: 30, height: 34, fontSize: 12.5 }} 
                      placeholder="Search tasks…"
                      value={searchTask} 
                      onChange={(e) => setSearchTask(e.target.value)} 
                    />
                  </div>
                  <button className="btn btn-primary" onClick={() => { setEditTask(null); setShowTaskModal(true); }} style={{ height: 34, padding: "0 14px", fontSize: 12.5 }}>
                    <Plus size={14} /> New Task
                  </button>
                </div>
              </div>

              <div className="table-wrap" style={{ border: "none" }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: 24 }}>Task Details</th>
                      <th>Assignee</th>
                      <th>Status</th>
                      <th>Category</th>
                      <th>Due</th>
                      <th style={{ textAlign: "right", paddingRight: 24 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((t) => (
                      <tr key={t.id}>
                        <td style={{ paddingLeft: 24 }}>
                          <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--text-primary)" }}>{t.title || "Untitled"}</div>
                          <div style={{ marginTop: 2 }}>
                            <span className={`badge badge-${t.priority?.toLowerCase()}`}>{t.priority}</span>
                          </div>
                        </td>
                        <td>
                          {t.assignedTo ? (
                            <span style={{ fontSize: 12.5, color: "var(--accent)" }}>{t.assignedTo}</span>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: 12 }}>Unassigned</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${t.status === 'Completed' ? 'badge-completed' : t.status === 'In Progress' ? 'badge-inprogress' : 'badge-todo'}`}>
                            {t.status}
                          </span>
                        </td>
                        <td><span className="pill">{t.category}</span></td>
                        <td style={{ fontSize: 12.5, color: t.dueDate && new Date(t.dueDate) < new Date() ? "var(--danger)" : "var(--text-secondary)" }}>
                          {t.dueDate || "—"}
                        </td>
                        <td style={{ textAlign: "right", paddingRight: 24 }}>
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                            <button className="btn btn-ghost btn-xs" onClick={() => { setEditTask(t); setShowTaskModal(true); }}><Eye size={13}/></button>
                            <button className="btn btn-ghost btn-xs" style={{ color: "var(--danger)" }} onClick={() => deleteTask(t.id)}><Trash2 size={13}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. CATEGORIES TAB */}
          {activeTab === "categories" && (
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>WORKSPACE CATEGORIES</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 2, margin: 0 }}>Organize tasks with categories and tags.</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ position: "relative" }}>
                    <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input 
                      className="form-input" 
                      style={{ width: 220, paddingLeft: 30, height: 34, fontSize: 12.5 }} 
                      placeholder="Search categories…"
                      value={searchCat} 
                      onChange={(e) => setSearchCat(e.target.value)} 
                    />
                  </div>
                  <button className="btn btn-primary" onClick={() => { setEditCat(null); setShowCatModal(true); }} style={{ height: 34, padding: "0 14px", fontSize: 12.5 }}>
                    <Plus size={14} /> New Category
                  </button>
                </div>
              </div>

              <div className="table-wrap" style={{ border: "none" }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: 24 }}>Category Name</th>
                      <th>Description</th>
                      <th style={{ textAlign: "right", paddingRight: 24 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map((c) => (
                      <tr key={c.id}>
                        <td style={{ paddingLeft: 24 }}>
                          <span className="pill" style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)" }} />
                            {c.name}
                          </span>
                        </td>
                        <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>{c.description || "No description provided."}</td>
                        <td style={{ textAlign: "right", paddingRight: 24 }}>
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                            <button className="btn btn-ghost btn-xs" onClick={() => { setEditCat(c); setShowCatModal(true); }}><Edit2 size={13}/></button>
                            <button className="btn btn-ghost btn-xs" style={{ color: "var(--danger)" }} onClick={() => deleteCategory(c.id, c.name)}><Trash2 size={13}/></button>
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

      {/* User Modal */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{editUser ? "Edit User" : "Invite User"}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowUserModal(false)} style={{ padding: 4 }}><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveUser}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" name="name" defaultValue={editUser?.name} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" name="email" defaultValue={editUser?.email} required disabled={!!editUser} />
              </div>
              <div className="form-group">
                <label className="form-label">Workspace Role</label>
                <select className="form-select" name="role" defaultValue={editUser?.role || "INDIVIDUAL_USER"}>
                  <option value="INDIVIDUAL_USER">INDIVIDUAL_USER</option>
                  <option value="TEAM_MEMBER">TEAM_MEMBER</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              {!editUser && (
                <div className="form-group">
                  <label className="form-label">Initial Password</label>
                  <input className="form-input" type="password" name="password" required />
                </div>
              )}
              <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowUserModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editUser ? "Save Changes" : "Send Invite"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal-content" style={{ maxWidth: 580 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{editTask ? "Edit Global Task" : "Create Global Task"}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowTaskModal(false)} style={{ padding: 4 }}><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveTask}>
              <div className="form-group">
                <label className="form-label">Task Title</label>
                <input className="form-input" name="title" defaultValue={editTask?.title} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" name="description" defaultValue={editTask?.description} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" name="priority" defaultValue={editTask?.priority || "Low"}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" name="status" defaultValue={editTask?.status || "Todo"}>
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Pending Approval">Pending Approval</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" name="category" defaultValue={editTask?.category || "Uncategorized"}>
                    <option value="Uncategorized">Uncategorized</option>
                    {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input className="form-input" type="date" name="dueDate" defaultValue={editTask?.dueDate} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Assign To (Email)</label>
                <input 
                  type="email"
                  list="admin-assignees"
                  className="form-input" 
                  name="assignedTo" 
                  defaultValue={editTask?.assignedTo || ""}
                  placeholder="e.g. member@gmail.com"
                />
                <datalist id="admin-assignees">
                  {users.map((u: any) => (
                    <option key={u.email} value={u.email}>{u.name} ({u.role})</option>
                  ))}
                </datalist>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCatModal && (
        <div className="modal-overlay" onClick={() => setShowCatModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{editCat ? "Edit Category" : "New Category"}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCatModal(false)} style={{ padding: 4 }}><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveCategory}>
              <div className="form-group">
                <label className="form-label">Category Name</label>
                <input className="form-input" name="name" defaultValue={editCat?.name} required placeholder="e.g. Frontend, API, Infrastructure" />
              </div>
              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea className="form-textarea" name="description" defaultValue={editCat?.description} />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCatModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
