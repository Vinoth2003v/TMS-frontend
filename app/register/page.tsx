"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api";
import { ArrowRight, Activity, ShieldCheck, User, Mail, Lock, AlertCircle } from "lucide-react";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Normal registration: No role selection allowed. Backend enforces INDIVIDUAL_USER.
      const data = await authApi.register({ name, email, password } as any);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      // New accounts are created as INDIVIDUAL_USER and routed to user dashboard
      if (data.user.role === "ADMIN" || data.user.role === "admin") router.push("/admin");
      else if (data.user.role === "MANAGER" || data.user.role === "manager") router.push("/manager/dashboard");
      else if (data.user.role === "TEAM_MEMBER" || data.user.role === "team") router.push("/team/dashboard");
      else router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 440, padding: "44px 38px" }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div style={{ 
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 48, height: 48, borderRadius: "14px", 
            background: "var(--accent-gradient)", color: "#fff", marginBottom: 18,
            boxShadow: "var(--shadow-glow)"
          }}>
            <Activity size={24} strokeWidth={2.5} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>
            Task Management System
          </div>
          <h1 className="brand-text" style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.5px" }}>
            Create an account
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 13.5, marginTop: 6 }}>
            Start managing your personal and team tasks
          </p>
        </div>

        {error && (
          <div style={{ 
            padding: "11px 14px", background: "var(--danger-dim)", color: "var(--danger)", 
            borderRadius: "var(--radius-sm)", fontSize: 13, marginBottom: 20, 
            border: "1px solid var(--danger-border)", display: "flex", alignItems: "center", gap: 8
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} /> {error}
          </div>
        )}

        {/* Security Notice: Standard user registration */}
        <div style={{ 
          padding: "10px 14px", background: "var(--accent-dim)", 
          border: "1px solid rgba(255, 138, 31, 0.25)", borderRadius: "var(--radius-sm)",
          fontSize: 12, color: "var(--text-secondary)", marginBottom: 20,
          display: "flex", alignItems: "flex-start", gap: 10, lineHeight: 1.45
        }}>
          <ShieldCheck size={16} style={{ color: "var(--accent)", flexShrink: 0, marginTop: 1 }} />
          <span>New accounts are created as <strong>Individual User</strong>. Organization roles are assigned exclusively by an Admin.</span>
        </div>

        <form onSubmit={handleRegister}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: 12.5 }}>Full Name</label>
            <div style={{ position: "relative" }}>
              <User size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input 
                className="form-input" 
                placeholder="e.g. Arun Kumar"
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                style={{ paddingLeft: 40, height: 42, fontSize: 13.5 }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: 12.5 }}>Email address</label>
            <div style={{ position: "relative" }}>
              <Mail size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input 
                className="form-input" 
                type="email" 
                placeholder="you@company.com"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                style={{ paddingLeft: 40, height: 42, fontSize: 13.5 }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 26 }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: 12.5 }}>Password</label>
            <div style={{ position: "relative" }}>
              <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input 
                className="form-input" 
                type="password" 
                placeholder="Create a strong password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                style={{ paddingLeft: 40, height: 42, fontSize: 13.5 }}
              />
            </div>
          </div>

          <button 
            className="btn btn-primary btn-full" 
            type="submit" 
            disabled={loading}
            style={{ height: 44, fontSize: 14, fontWeight: 600 }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                Creating account...
              </span>
            ) : (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                Create account <ArrowRight size={16} />
              </span>
            )}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 28, fontSize: 13, color: "var(--text-secondary)" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}