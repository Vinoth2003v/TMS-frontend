"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { notificationsApi } from "@/lib/api";
import { Bell, Calendar, Search, LogOut, CheckCircle2, User as UserIcon } from "lucide-react";

export default function Navbar({ title = "Dashboard" }: { title?: string }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotif, setShowNotif]         = useState(false);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [user, setUser]                   = useState<any>(null);
  const [searchVal, setSearchVal]         = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        setUser(u);
        fetchNotifications(u.email);
        const interval = setInterval(() => fetchNotifications(u.email), 30000);
        return () => clearInterval(interval);
      } catch {}
    }
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchNotifications = async (email: string) => {
    try {
      const data = await notificationsApi.getAll(email);
      setNotifications(data.slice(0, 10));
      setUnreadCount(data.filter((n: any) => !n.read).length);
    } catch { /* Ignore */ }
  };

  const handleMarkAllRead = async () => {
    if (!user?.email) return;
    await notificationsApi.markAllAsRead(user.email).catch(() => {});
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/my-tasks?q=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return "Just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <header className="navbar">
      {/* Left: Title + Search */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <h1 className="navbar-title">{title}</h1>

        <form onSubmit={handleSearchSubmit} className="navbar-search">
          <Search size={14} style={{ position: "absolute", left: 10, color: "var(--text-muted)", pointerEvents: "none" }} />
          <input 
            type="text" 
            placeholder="Search workspace…"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
          />
        </form>
      </div>

      {/* Right: Date, Notifications, Profile Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* Date Display */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          color: "var(--text-secondary)",
          fontSize: "12px",
          fontWeight: 500,
          background: "var(--bg-secondary)",
          padding: "5px 10px",
          borderRadius: "8px",
          border: "1px solid var(--border)"
        }}>
          <Calendar size={13} style={{ color: "var(--accent)" }} />
          <span>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
        </div>

        {/* Notifications Dropdown */}
        <div ref={dropdownRef} style={{ position: "relative" }}>
          <button
            onClick={() => setShowNotif(!showNotif)}
            style={{
              position: "relative",
              width: 34, 
              height: 34,
              borderRadius: "8px",
              background: showNotif ? "var(--bg-elevated)" : "var(--bg-secondary)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              color: showNotif ? "var(--accent)" : "var(--text-secondary)",
              transition: "var(--transition)",
            }}
            title="Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span style={{
                position: "absolute", 
                top: 5, 
                right: 5,
                width: 7, 
                height: 7, 
                borderRadius: "50%", 
                background: "var(--accent)",
                boxShadow: "0 0 6px var(--accent)"
              }} />
            )}
          </button>

          {showNotif && (
            <div className="notif-dropdown">
              <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-secondary)" }}>
                <span style={{ fontWeight: 600, fontSize: "12.5px", color: "var(--text-primary)" }}>Activity Feed</span>
                {unreadCount > 0 && (
                  <button className="btn btn-ghost btn-xs" onClick={(e) => { e.stopPropagation(); handleMarkAllRead(); }} style={{ fontSize: 11, padding: "2px 6px" }}>
                    Mark all read
                  </button>
                )}
              </div>
              <div style={{ maxHeight: 280, overflowY: "auto" }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-muted)" }}>
                    <CheckCircle2 size={24} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                    <p style={{ fontSize: 12 }}>You're all caught up!</p>
                  </div>
                ) : (
                  notifications.map((n, i) => (
                    <div 
                      key={n.id || i}
                      className={`notif-item ${!n.read ? "unread" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!n.read && n.id) notificationsApi.markAsRead(n.id).catch(() => {});
                      }}
                    >
                      <div className="notif-msg">{n.message}</div>
                      <div className="notif-time">{n.date ? timeAgo(n.date) : ""}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar with Profile Link */}
        {user && (
          <div 
            onClick={() => router.push("/settings")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              padding: "4px 8px 4px 4px",
              borderRadius: "8px",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              transition: "var(--transition)"
            }}
            title="Account Settings"
          >
            <div style={{
              width: 26,
              height: 26,
              borderRadius: "6px",
              background: "var(--accent-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 12,
              color: "#fff"
            }}>
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.name?.split(" ")[0] || "User"}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}