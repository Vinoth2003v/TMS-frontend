"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api";
import { ArrowRight, Activity, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await authApi.login(email, password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.removeItem("demoMode"); // ensure real mode is active

      const userRole = (data.user.role || "").toUpperCase();
      if (userRole === "ADMIN") router.push("/admin");
      else if (userRole === "MANAGER") router.push("/manager/dashboard");
      else if (userRole === "TEAM_MEMBER" || userRole === "TEAM") router.push("/team/dashboard");
      else router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 440, padding: "44px 38px" }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
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
            Welcome back
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 13.5, marginTop: 6 }}>
            Sign in to access your workspace
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

        <form onSubmit={handleLogin}>
          <div className="form-group" style={{ marginBottom: 18 }}>
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

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: 12.5 }}>Password</label>
            <div style={{ position: "relative" }}>
              <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input 
                className="form-input" 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                style={{ paddingLeft: 40, paddingRight: 40, height: 42, fontSize: 13.5 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer",
                  display: "flex", alignItems: "center", padding: 4
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 26, fontSize: 13 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "var(--text-secondary)" }}>
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: "var(--accent)", cursor: "pointer" }}
              />
              Remember me
            </label>
            <span style={{ color: "var(--accent)", cursor: "pointer", fontWeight: 500, fontSize: 12.5 }}>
              Forgot password?
            </span>
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
                Signing in...
              </span>
            ) : (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                Continue to workspace <ArrowRight size={16} />
              </span>
            )}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 28, fontSize: 13, color: "var(--text-secondary)" }}>
          Don't have an account?{" "}
          <Link href="/register" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}