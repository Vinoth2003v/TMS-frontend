"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  LayoutDashboard, CheckSquare, Settings, BarChart3, 
  LogOut, CheckCircle2, Zap, Shield, Sparkles, FolderKanban, MessageSquare
} from "lucide-react";

const NAV_ITEMS = {
  common: [
    { label: "My Tasks",  icon: CheckSquare, href: "/my-tasks" },
    { label: "Completed", icon: CheckCircle2, href: "/completed" },
    { label: "Settings",  icon: Settings, href: "/settings" },
  ],
  user:            [{ label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" }],
  INDIVIDUAL_USER: [{ label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" }],
  team: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/team/dashboard" },
    { label: "Chat with Manager", icon: MessageSquare, href: "/team/dashboard?tab=chat" },
  ],
  TEAM_MEMBER: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/team/dashboard" },
    { label: "Chat with Manager", icon: MessageSquare, href: "/team/dashboard?tab=chat" },
  ],
  manager: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/manager/dashboard" },
    { label: "Chat with Members", icon: MessageSquare, href: "/manager/dashboard?tab=chat" },
    { label: "Analytics", icon: BarChart3, href: "/manager/analytics" },
  ],
  MANAGER: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/manager/dashboard" },
    { label: "Chat with Members", icon: MessageSquare, href: "/manager/dashboard?tab=chat" },
    { label: "Analytics", icon: BarChart3, href: "/manager/analytics" },
  ],
  admin: [
    { label: "Admin Panel", icon: Shield, href: "/admin" },
  ],
  ADMIN: [
    { label: "Admin Panel", icon: Shield, href: "/admin" },
  ],
};

const ROLE_CONFIG: Record<string, { label: string }> = {
  admin:           { label: "Administrator" },
  ADMIN:           { label: "Administrator" },
  manager:         { label: "Manager" },
  MANAGER:         { label: "Manager" },
  team:            { label: "Team Member" },
  TEAM_MEMBER:     { label: "Team Member" },
  user:            { label: "Individual User" },
  INDIVIDUAL_USER: { label: "Individual User" },
};

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.email !== user?.email) {
          setUser(parsed);
        }
      } catch (e) {}
    }
  }, [user?.email]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/login");
  };

  const role        = user?.role || "user";
  const roleItems   = NAV_ITEMS[role as keyof typeof NAV_ITEMS] || NAV_ITEMS.user;
  const commonItems = NAV_ITEMS.common;
  const rc          = ROLE_CONFIG[role] || ROLE_CONFIG.user;

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Zap size={17} strokeWidth={2.4} />
        </div>
        <div>
          <h2>TaskSystem</h2>
          <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600 }}>Workspace</span>
        </div>
      </div>

      {/* User Card */}
      {user && (
        <div className="sidebar-user">
          <div className="avatar">
            {user.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="username">{user.name || user.email}</div>
            <div className="userrole">{rc.label}</div>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        <div className="sidebar-nav-label">Workspace</div>
        {roleItems.map((item) => {
          const [itemPath, itemQuery] = item.href.split("?");
          const currentSearch = typeof window !== "undefined" ? window.location.search : "";
          const isActive = itemQuery 
            ? pathname === itemPath && currentSearch.includes(itemQuery)
            : pathname === itemPath && (!currentSearch.includes("tab=chat"));
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              <span className="nav-icon"><item.icon size={16} strokeWidth={isActive ? 2.2 : 1.8} /></span>
              <span>{item.label}</span>
            </Link>
          );
        })}

        {commonItems.length > 0 && (
          <>
            <div className="sidebar-nav-label" style={{ marginTop: 18 }}>Personal</div>
            {commonItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={`nav-item ${isActive ? "active" : ""}`}
                >
                  <span className="nav-icon"><item.icon size={16} strokeWidth={isActive ? 2.2 : 1.8} /></span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </>
        )}

        <div className="sidebar-nav-label" style={{ marginTop: 18 }}>Account</div>
        <button 
          className="nav-item" 
          onClick={handleLogout} 
          style={{ color: "var(--text-secondary)" }}
        >
          <span className="nav-icon" style={{ color: "var(--danger)" }}><LogOut size={16} strokeWidth={1.8} /></span> 
          <span>Logout</span>
        </button>
      </nav>

      {/* Footer Info */}
      <div style={{ padding: "14px 20px", fontSize: "11px", color: "var(--text-muted)", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>TMS v2.5</span>
        <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--success)" }} title="Connected" />
      </div>
    </aside>
  );
}