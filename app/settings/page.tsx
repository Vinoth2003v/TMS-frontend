"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar  from "@/components/Navbar";
import { usersApi } from "@/lib/api";
import { Settings as SettingsIcon, ShieldAlert, CheckCircle2, AlertCircle, LogOut } from "lucide-react";

export default function Settings() {
  const [user, setUser]     = useState<any>(null);
  const [form, setForm]     = useState({ name: "", phone: "", department: "", password: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState("");
  const [error, setError]   = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { window.location.href = "/login"; return; }
    const u = JSON.parse(stored);
    setUser(u);
    setForm({ name: u.name || "", phone: u.phone || "", department: u.department || "", password: "", confirmPassword: "" });
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(""); setError("");
    if (form.password && form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      const payload: any = { name: form.name, phone: form.phone, department: form.department };
      if (form.password) payload.password = form.password;
      const updated = await usersApi.update(user.id, payload);
      const newUser = { ...user, ...updated };
      localStorage.setItem("user", JSON.stringify(newUser));
      setUser(newUser);
      setForm((f) => ({ ...f, password: "", confirmPassword: "" }));
      setMsg("Profile updated successfully!");
    } catch (e: any) {
      setError(e.message || "Failed to update profile.");
    }
    setSaving(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  if (!user) return <div className="loading-page"><div className="spinner" /></div>;

  const ROLE_LABEL: Record<string, string> = {
    admin: "Administrator",
    ADMIN: "Administrator",
    manager: "Manager",
    MANAGER: "Manager",
    team: "Team Member",
    TEAM_MEMBER: "Team Member",
    user: "Individual User",
    INDIVIDUAL_USER: "Individual User"
  };

  const roleKey = (user.role || "").toLowerCase();

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Navbar title="Settings" />
        <div className="page-content">
          <div style={{ marginBottom: 28 }}>
            <h1 className="brand-text" style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.5px", marginBottom: 4, display: "flex", alignItems: "center", gap: 10 }}>
              <SettingsIcon size={22} color="var(--accent)" /> Account Settings
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 13.5 }}>
              Manage your personal profile, credentials, and account preferences.
            </p>
          </div>

          <div className="grid-2">
            {/* Profile Card */}
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid var(--border)" }}>
                <div style={{ width: 56, height: 56, borderRadius: "12px", background: "var(--accent-gradient)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "#fff", boxShadow: "var(--shadow-glow)" }}>
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17, color: "var(--text-primary)" }}>{user.name}</div>
                  <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>{user.email}</div>
                  <div style={{ marginTop: 6 }}>
                    <span className={`badge badge-${roleKey}`}>{ROLE_LABEL[user.role] || user.role}</span>
                  </div>
                </div>
              </div>

              {msg && (
                <div style={{ padding: "10px 14px", background: "var(--success-dim)", border: "1px solid var(--success-border)", borderRadius: "var(--radius-sm)", marginBottom: 18, fontSize: 13, color: "var(--success)", display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle2 size={16} /> {msg}
                </div>
              )}
              {error && (
                <div style={{ padding: "10px 14px", background: "var(--danger-dim)", border: "1px solid var(--danger-border)", borderRadius: "var(--radius-sm)", marginBottom: 18, fontSize: 13, color: "var(--danger)", display: "flex", alignItems: "center", gap: 8 }}>
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <form onSubmit={saveProfile}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Your full name" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} placeholder="+91 98765 43210" />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input className="form-input" value={form.department} onChange={(e) => setForm({...form, department: e.target.value})} placeholder="Engineering, Design, Operations…" />
                </div>
                <div className="divider" style={{ margin: "20px 0" }} />
                <div style={{ marginBottom: 12, fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>Update Password (optional)</div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input className="form-input" type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} placeholder="Leave blank to keep current password" />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input className="form-input" type="password" value={form.confirmPassword} onChange={(e) => setForm({...form, confirmPassword: e.target.value})} placeholder="Confirm new password" />
                </div>
                <button className="btn btn-primary btn-full" type="submit" disabled={saving} style={{ marginTop: 8 }}>
                  {saving ? "Saving Changes…" : "Save Changes"}
                </button>
              </form>
            </div>

            {/* Account Info Card */}
            <div>
              <div className="card mb-16">
                <h3 style={{ marginBottom: 16, fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>Account Overview</h3>
                {[
                  { label: "Email Address", value: user.email },
                  { label: "Role Authority", value: ROLE_LABEL[user.role] || user.role },
                  { label: "Department",    value: user.department || "—" },
                  { label: "Contact Phone", value: user.phone || "—" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border)", fontSize: 13.5 }}>
                    <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{value}</span>
                  </div>
                ))}
              </div>

              <div className="card" style={{ borderColor: "rgba(239, 68, 68, 0.25)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <ShieldAlert size={18} color="var(--danger)" />
                  <h3 style={{ fontWeight: 700, fontSize: 15, color: "var(--danger)", margin: 0 }}>Session Control</h3>
                </div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 18, lineHeight: 1.5 }}>
                  Sign out of your active session on this device. You will need your credentials to sign back in.
                </p>
                <button className="btn btn-danger btn-full" onClick={handleLogout} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <LogOut size={15} /> Sign Out of Workspace
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
