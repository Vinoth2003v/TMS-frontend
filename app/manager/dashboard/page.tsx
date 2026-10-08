"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar  from "@/components/Navbar";
import RoleChat from "@/components/RoleChat";
import { tasksApi, notificationsApi, usersApi, categoriesApi, helpRequestsApi, filesApi, chatApi, workloadApi, WorkloadRiskData } from "@/lib/api";
import { 
  AlertCircle, Calendar, MessageSquare, ListTodo, Plus, Target, 
  CheckCircle2, Search, Clock, Tag, User, Filter, SlidersHorizontal, 
  Send, Zap, ChevronRight, Activity, HelpCircle, Users, Check, X,
  Flame, AlertTriangle, Loader2, Sparkles, Paperclip, Download, Eye, FileText
} from "lucide-react";

const PRIORITY_CONFIG: Record<string, { label: string; badgeClass: string; icon: any }> = {
  Urgent: { label: "URGENT", badgeClass: "badge-urgent", icon: Flame },
  High:   { label: "HIGH",   badgeClass: "badge-high",   icon: AlertTriangle },
  Medium: { label: "MEDIUM", badgeClass: "badge-medium", icon: Clock },
  Low:    { label: "LOW",    badgeClass: "badge-low",    icon: CheckCircle2 },
};

const STATUS_CHIPS: Record<string, { label: string; badgeClass: string }> = {
  "Todo":             { label: "TODO",             badgeClass: "badge-todo" },
  "TODO":             { label: "TODO",             badgeClass: "badge-todo" },
  "In Progress":      { label: "IN_PROGRESS",      badgeClass: "badge-inprogress" },
  "IN_PROGRESS":      { label: "IN_PROGRESS",      badgeClass: "badge-inprogress" },
  "Pending Approval": { label: "PENDING_APPROVAL", badgeClass: "badge-pending" },
  "PENDING_APPROVAL": { label: "PENDING_APPROVAL", badgeClass: "badge-pending" },
  "Completed":        { label: "COMPLETED",        badgeClass: "badge-completed" },
  "COMPLETED":        { label: "COMPLETED",        badgeClass: "badge-completed" },
};

function formatFileSize(bytes: number): string {
  if (!bytes && bytes !== 0) return "0 B";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

/* ══════════════════════════════════════════════════════════════
   MANAGER TASK REVIEW & DELIVERABLES MODAL
   ══════════════════════════════════════════════════════════════ */
function ManagerDeliverablesModal({ task, onClose, onStatusChange }: any) {
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    loadAttachments();
  }, [task.id]);

  const loadAttachments = async () => {
    setLoading(true);
    try {
      const data = await filesApi.getByTask(task.id);
      setAttachments(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const isCompleted = task.status === "Completed" || task.status === "COMPLETED";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560, padding: "28px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 className="brand-text" style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
            <Paperclip size={18} color="var(--accent)" /> Task Review & Deliverables
          </h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: 6, borderRadius: "50%" }}>
            <X size={18} />
          </button>
        </div>

        {/* Task Overview Card */}
        <div style={{ background: "var(--bg-secondary)", borderRadius: "var(--radius-sm)", padding: "18px 20px", border: "1px solid var(--border)", marginBottom: 22 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
            {task.title}
          </div>
          {task.description && (
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 14 }}>
              {task.description}
            </p>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, paddingTop: 12, borderTop: "1px solid var(--border)", fontSize: 12.5 }}>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Assigned To: </span>
              <strong style={{ color: "var(--accent)" }}>{task.assignedTo || "Unassigned"}</strong>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Status: </span>
              <strong style={{ color: isCompleted ? "var(--success)" : "var(--text-primary)" }}>{task.status}</strong>
            </div>
            {task.dueDate && (
              <div>
                <span style={{ color: "var(--text-muted)" }}>Due Date: </span>
                <span style={{ color: "var(--text-primary)" }}>{task.dueDate}</span>
              </div>
            )}
            {task.completedBy && (
              <div>
                <span style={{ color: "var(--text-muted)" }}>Completed By: </span>
                <strong style={{ color: "var(--success)" }}>{task.completedBy}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Deliverables & Attachments Section */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Uploaded Deliverables {attachments.length > 0 && `(${attachments.length})`}
          </h3>

          {loading ? (
            <div style={{ fontSize: 12.5, color: "var(--text-muted)", padding: "16px 0", textAlign: "center" }}>
              Loading task files…
            </div>
          ) : attachments.length === 0 ? (
            <div style={{ padding: "20px", background: "var(--bg-secondary)", borderRadius: "8px", border: "1px dashed var(--border)", textAlign: "center" }}>
              <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: 0, fontStyle: "italic" }}>
                No completion files or documents have been uploaded for this task yet.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {attachments.map((att: any) => (
                <div
                  key={att.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: 22 }}>📄</span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {att.originalName || att.fileName}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                        <span>{formatFileSize(att.fileSize)}</span>
                        <span>•</span>
                        <span>Uploaded by: <strong style={{ color: "var(--text-secondary)" }}>{att.uploadedBy || "Team Member"}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <a
                      href={att.demoBlobUrl || filesApi.getDownloadUrl(att.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-ghost btn-xs"
                      style={{ height: 30, padding: "0 12px", display: "inline-flex", alignItems: "center", gap: 5 }}
                    >
                      <Eye size={13} /> View
                    </a>
                    <a
                      href={att.demoBlobUrl || filesApi.getDownloadUrl(att.id)}
                      download={att.originalName || "deliverable"}
                      className="btn btn-primary btn-xs"
                      style={{ height: 30, padding: "0 12px", display: "inline-flex", alignItems: "center", gap: 5 }}
                    >
                      <Download size={13} /> Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manager Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: "1px solid var(--border)", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Update Status:</span>
            <select
              className="form-select"
              style={{ width: "140px", height: 30, fontSize: 12, borderRadius: "6px" }}
              value={task.status}
              onChange={(e) => {
                onStatusChange(task, e.target.value);
              }}
            >
              <option value="Todo">Todo</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            {(task.status === "Pending Approval" || task.status === "PENDING_APPROVAL") && (
              <>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: "var(--danger)", borderColor: "var(--danger-border)" }}
                  onClick={() => {
                    onStatusChange(task, "In Progress");
                    onClose();
                  }}
                >
                  Request Revisions
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    onStatusChange(task, "Completed");
                    onClose();
                  }}
                >
                  Approve Deliverable
                </button>
              </>
            )}
            <button className="btn btn-ghost btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, user, onStatusChange, onComment, onOpenDetails }: any) {
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const isApproaching = task.dueDate && task.status !== "Completed" && task.status !== "COMPLETED" &&
    (new Date(task.dueDate).getTime() - Date.now() < 86400000 * 2);

  const submitComment = () => {
    if (!commentText.trim()) return;
    onComment(task, commentText);
    setCommentText("");
  };

  const handleStatusSelect = async (newVal: string) => {
    setUpdatingStatus(true);
    await onStatusChange(task, newVal);
    setUpdatingStatus(false);
  };

  const prio = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Low;
  const PrioIcon = prio.icon;
  const statusChip = STATUS_CHIPS[task.status] || STATUS_CHIPS["Todo"];

  return (
    <div 
      className="task-card" 
      style={{ 
        marginBottom: 12, 
        padding: "16px 20px", 
        borderLeft: isApproaching ? "3px solid var(--danger)" : "3px solid var(--border)"
      }}
    >
      <div className="task-card-header" style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
            <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text-primary)" }}>{task.title}</span>
            {isApproaching && (
              <span className="badge badge-urgent" style={{ fontSize: 10, padding: "2px 6px" }}>
                <AlertCircle size={11} strokeWidth={2.5} /> Due soon
              </span>
            )}
            <span className={`badge ${statusChip.badgeClass}`}>
              {statusChip.label}
            </span>
          </div>
          {task.description && (
            <p style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.45 }}>{task.description}</p>
          )}
        </div>

        {/* Priority Badge */}
        <div className={`badge ${prio.badgeClass}`} style={{ flexShrink: 0 }}>
          <PrioIcon size={12} />
          <span>{prio.label}</span>
        </div>
      </div>

      {/* Meta Pills */}
      <div className="task-meta" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10, alignItems: "center" }}>
        {task.dueDate && (
          <span className="pill">
            <Calendar size={12} style={{ color: "var(--accent)" }}/> {task.dueDate}
          </span>
        )}
        <span className="pill" style={{ color: "var(--text-primary)", fontWeight: 500, borderColor: "rgba(255, 138, 31, 0.25)", background: "var(--accent-dim)" }}>
          <User size={12} style={{ color: "var(--accent)" }} /> {task.assignedTo || "Unassigned"}
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

      {/* Controls footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 500 }}>Status:</span>
            <select
              className="form-select"
              disabled={updatingStatus}
              style={{ width: "145px", padding: "4px 8px", fontSize: 12, height: 28, borderRadius: "6px", cursor: "pointer" }}
              value={task.status}
              onChange={(e) => handleStatusSelect(e.target.value)}
            >
              <option value="Todo">Todo</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Completed">Completed</option>
            </select>
            {updatingStatus && <Loader2 size={13} className="animate-spin" color="var(--accent)" />}
          </div>
          
          {(task.status === "Completed" || task.status === "COMPLETED") && task.completedBy && (
            <span style={{ fontSize: 11.5, color: "var(--success)", display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
              <CheckCircle2 size={13}/> by {task.completedBy}
            </span>
          )}

          {(task.status === "Pending Approval" || task.status === "PENDING_APPROVAL") && (
            <div style={{ display: "flex", gap: 6 }}>
              <button 
                className="btn btn-ghost btn-xs" 
                style={{ color: "var(--success)", borderColor: "var(--success-border)", background: "var(--success-dim)" }} 
                onClick={() => onStatusChange(task, "Completed")}
              >
                Approve
              </button>
              <button 
                className="btn btn-ghost btn-xs" 
                style={{ color: "var(--danger)", borderColor: "var(--danger-border)", background: "var(--danger-dim)" }} 
                onClick={() => onStatusChange(task, "In Progress")}
              >
                Reject
              </button>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button
            className="btn btn-ghost btn-xs"
            onClick={() => onOpenDetails(task)}
            style={{ color: "var(--accent)", borderColor: "rgba(255, 138, 31, 0.25)", display: "inline-flex", alignItems: "center", gap: 5 }}
            title="View deliverables and attachments"
          >
            <Paperclip size={12} />
            <span>View Deliverables</span>
          </button>

          <button
            className="btn btn-ghost btn-xs"
            onClick={() => setShowComments(!showComments)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", background: showComments ? "var(--bg-elevated)" : "transparent" }}
          >
            <MessageSquare size={12} />
            <span>{task.comments?.length || 0} notes</span>
          </button>
        </div>
      </div>

      {showComments && (
        <div style={{ marginTop: 12, background: "var(--bg-elevated)", borderRadius: "8px", padding: 12, border: "1px solid var(--border)" }}>
          <div style={{ maxHeight: 180, overflowY: "auto", marginBottom: 10 }}>
            {(!task.comments || task.comments.length === 0) && (
              <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: "10px 0", fontStyle: "italic" }}>No notes yet.</p>
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
              placeholder="Add an update…"
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
  );
}

export default function ManagerDashboard() {
  const [tasks, setTasks]                 = useState<any[]>([]);
  const [user, setUser]                   = useState<any>(null);
  const [users, setUsers]                 = useState<any[]>([]);
  const [categories, setCategories]       = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [helpRequests, setHelpRequests]   = useState<any[]>([]);
  const [loading, setLoading]             = useState(true);
  
  const [searchQuery, setSearchQuery]     = useState("");
  const [filterStatus, setFilterStatus]   = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [sortBy, setSortBy]               = useState("dueDate");
  const [activeTab, setActiveTab]         = useState("tasks");
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  // Form State
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
  const [formError, setFormError] = useState("");

  // Workload Risk Analysis State
  const [workloadData, setWorkloadData] = useState<WorkloadRiskData | null>(null);
  const [loadingWorkload, setLoadingWorkload] = useState(false);

  const handleMemberSelect = async (memberEmail: string) => {
    setForm((prev) => ({ ...prev, assignedTo: memberEmail }));
    if (formError) setFormError("");
    if (!memberEmail) {
      setWorkloadData(null);
      return;
    }
    setLoadingWorkload(true);
    try {
      const data = await workloadApi.getMemberWorkload(memberEmail);
      setWorkloadData(data);
    } catch (err) {
      console.error("Failed to load workload data:", err);
      setWorkloadData(null);
    } finally {
      setLoadingWorkload(false);
    }
  };

  // Deliverables Modal State
  const [showDeliverablesModal, setShowDeliverablesModal] = useState(false);
  const [selectedTaskForDeliverables, setSelectedTaskForDeliverables] = useState<any>(null);

  // Toast Notification State
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Help Request Thread State
  const [activeHelpRequest, setActiveHelpRequest] = useState<any>(null);
  const [helpReplyText, setHelpReplyText] = useState("");

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { window.location.href = "/login"; return; }
    const u = JSON.parse(stored);
    setUser(u);
    loadAll(u);

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "chat") setActiveTab("chat");
      else if (tabParam === "help") setActiveTab("help");
    }
  }, []);

  useEffect(() => {
    if (user?.email) {
      chatApi.getUnreadCounts(user.email).then((res) => {
        setChatUnreadCount(res?.total || 0);
      }).catch(() => {});
    }
  }, [user?.email, activeTab]);

  const loadAll = async (u: any) => {
    try {
      const [t, us, notifs, cats, reqs] = await Promise.all([
        tasksApi.getAll(),
        usersApi.getAll(),
        notificationsApi.getAll(u.email).catch(() => []),
        categoriesApi.getAll().catch(() => []),
        helpRequestsApi.getManagerRequests(u.email).catch(() => [])
      ]);
      setTasks(t || []);
      setUsers(us || []);
      setCategories(cats || []);
      setNotifications((notifs || []).slice(0, 5));
      setHelpRequests(reqs || []);
    } catch (e) { 
      console.error(e); 
      showToast("error", "Unable to connect to the server. Please try again.");
    }
    setLoading(false);
  };

  const sendNotification = async (to: string, message: string) => {
    if (!to) return;
    try { await notificationsApi.create(to, message, "TASK_ASSIGNED"); } catch {}
  };

  // ONLY TEAM_MEMBER users allowed
  const teamMembers = users.filter((u: any) => {
    const r = (u.role || "").toUpperCase().trim();
    return r === "TEAM_MEMBER" || r === "TEAM";
  });

  const addTask = async () => {
    if (!form.title.trim()) {
      setFormError("Task title is required.");
      return;
    }
    if (!form.assignedTo.trim()) {
      setFormError("Please select a team member to assign this task.");
      return;
    }

    // Client-side verification: assignee must be in teamMembers
    const isAssigneeTeamMember = teamMembers.some(
      (m: any) => m.email?.toLowerCase() === form.assignedTo.trim().toLowerCase()
    );
    if (!isAssigneeTeamMember) {
      setFormError("Managers can assign tasks only to Team Members.");
      showToast("error", "Managers can assign tasks only to Team Members.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const payload = {
        ...form,
        labels: form.labels ? form.labels.split(",").map((l) => l.trim()).filter(Boolean).join(",") : "",
        createdBy: user?.email,
      };
      const newTask = await tasksApi.create(payload);
      setTasks((prev) => [newTask, ...prev]);
      if (form.assignedTo && form.assignedTo !== user?.email) {
        await sendNotification(form.assignedTo, `New task assigned: "${form.title}" by ${user?.name || user?.email}`);
      }
      setForm({ 
        title: "", 
        description: "", 
        dueDate: "", 
        priority: "Medium", 
        assignedTo: "", 
        category: "Uncategorized", 
        labels: "", 
        status: "Todo" 
      });
      setShowTaskForm(false);
      showToast("success", "Task assigned successfully.");
    } catch (err: any) { 
      console.error(err);
      const errMsg = err?.message || err?.error || "";
      if (errMsg.includes("Team Members") || errMsg.includes("TEAM_MEMBER")) {
        setFormError("Managers can assign tasks only to Team Members.");
        showToast("error", "Managers can assign tasks only to Team Members.");
      } else if (errMsg.includes("Failed to fetch") || errMsg.includes("Network")) {
        setFormError("Unable to connect to the server. Please try again.");
        showToast("error", "Unable to connect to the server. Please try again.");
      } else {
        setFormError(errMsg || "Failed to create task.");
        showToast("error", errMsg || "Failed to create task.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (task: any, newStatus: string) => {
    try {
      const updated = await tasksApi.update(task.id, {
        status: newStatus,
        completedBy: (newStatus === "Completed" || newStatus === "COMPLETED") ? (user?.name || user?.email) : undefined,
      });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      if (task.createdBy && task.createdBy !== user?.email) {
        await sendNotification(task.createdBy, `Task "${task.title}" → ${newStatus}`);
      }
      showToast("success", `Status updated to ${newStatus}`);
    } catch (e: any) { 
      console.error(e);
      showToast("error", "Unable to update task status.");
    }
  };

  const addComment = async (task: any, text: string) => {
    try {
      const updated = await tasksApi.addComment(task.id, text, user?.name || user?.email, user?.email);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      showToast("success", "Comment added.");
    } catch (e) { 
      console.error(e);
      showToast("error", "Failed to add comment.");
    }
  };

  const sendHelpReply = async () => {
    if (!helpReplyText.trim() || !activeHelpRequest) return;
    try {
      const msg = await helpRequestsApi.addMessage(activeHelpRequest.id, {
        text: helpReplyText,
        senderEmail: user.email,
        senderName: user.name || user.email
      });
      const updatedReqs = helpRequests.map(r => {
        if (r.id === activeHelpRequest.id) {
          const msgs = r.messages ? [...r.messages] : [];
          msgs.push({ ...msg, createdAt: new Date().toISOString() });
          return { ...r, messages: msgs, status: r.status === "Pending" ? "Responded" : r.status };
        }
        return r;
      });
      setHelpRequests(updatedReqs);
      setActiveHelpRequest(updatedReqs.find(r => r.id === activeHelpRequest.id));
      setHelpReplyText("");
      showToast("success", "Response sent.");
    } catch (e) { 
      console.error(e);
      showToast("error", "Failed to send response.");
    }
  };

  const resolveHelpRequest = async (id: number) => {
    try {
      await helpRequestsApi.updateStatus(id, "Resolved");
      const updatedReqs = helpRequests.map(r => r.id === id ? { ...r, status: "Resolved" } : r);
      setHelpRequests(updatedReqs);
      if (activeHelpRequest?.id === id) setActiveHelpRequest(updatedReqs.find(r => r.id === id));
      showToast("success", "Help request marked as resolved.");
    } catch (e) { 
      console.error(e);
      showToast("error", "Failed to resolve request.");
    }
  };

  const visibleTasks = tasks.filter((t) => {
    if (user?.role === "admin" || user?.role === "ADMIN") return true;
    if (user?.role === "manager" || user?.role === "MANAGER") return t.createdBy === user?.email || t.assignedTo === user?.email;
    return t.assignedTo === user?.email || t.createdBy === user?.email;
  });

  const filteredTasks = visibleTasks
    .filter((t) => filterStatus === "All" || t.status === filterStatus)
    .filter((t) => filterPriority === "All" || t.priority === filterPriority)
    .filter((t) => filterCategory === "All" || t.category === filterCategory)
    .filter((t) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.assignedTo?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === "priority") {
        const p: Record<string, number> = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
        return (p[b.priority] || 0) - (p[a.priority] || 0);
      }
      if (!a.dueDate) return 1; if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  // 5 Clean Cards stats
  const stats = {
    total: visibleTasks.length,
    pending: visibleTasks.filter((t) => ["Todo", "TODO", "Pending Approval", "PENDING_APPROVAL"].includes(t.status)).length,
    inProgress: visibleTasks.filter((t) => ["In Progress", "IN_PROGRESS"].includes(t.status)).length,
    completed: visibleTasks.filter((t) => ["Completed", "COMPLETED"].includes(t.status)).length,
  };

  const upcomingDeadlines = visibleTasks
    .filter((t) => t.dueDate && t.status !== "Completed" && t.status !== "COMPLETED")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  if (loading) {
    return (
      <div className="loading-page">
        <Loader2 size={32} className="animate-spin" color="var(--accent)" />
        <p style={{ marginTop: 14, color: "var(--text-muted)", fontSize: 13 }}>Loading workspace…</p>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Navbar title="Manager Workspace" />
        <div className="page-content">

          {/* DASHBOARD HERO */}
          <div style={{ marginBottom: 26, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14 }}>
            <div>
              <h1 className="brand-text" style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
                Manager Command Center <Zap size={22} color="var(--accent)" />
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                Coordinate team assignments, monitor sprint progress, and review pending approvals.
              </p>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="tabs" style={{ margin: 0 }}>
                <button 
                  onClick={() => setActiveTab("tasks")}
                  className={`tab-btn ${activeTab === "tasks" ? "active" : ""}`} 
                >
                  Tasks Overview
                </button>
                <button 
                  onClick={() => setActiveTab("chat")}
                  className={`tab-btn ${activeTab === "chat" ? "active" : ""}`} 
                  style={{ display: "flex", gap: 6, alignItems: "center" }}
                >
                  <span>💬 Chat with Members</span>
                  {chatUnreadCount > 0 && (
                    <span style={{ background: "var(--accent)", padding: "1px 6px", borderRadius: 999, fontSize: 10, color: "white", fontWeight: 700 }}>
                      {chatUnreadCount}
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab("help")}
                  className={`tab-btn ${activeTab === "help" ? "active" : ""}`} 
                  style={{ display: "flex", gap: 6, alignItems: "center" }}
                >
                  <span>Help Requests</span>
                  {helpRequests.filter(r => r.status === "Pending").length > 0 && (
                    <span style={{ background: "var(--danger)", padding: "1px 6px", borderRadius: 999, fontSize: 10, color: "white", fontWeight: 700 }}>
                      {helpRequests.filter(r => r.status === "Pending").length}
                    </span>
                  )}
                </button>
              </div>

              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setFormError("");
                  setWorkloadData(null);
                  setShowTaskForm(true);
                }} 
                style={{ height: 38, padding: "0 18px", fontSize: 13 }}
              >
                <Plus size={15} /> Assign Task
              </button>
            </div>
          </div>

          {activeTab === "tasks" && (
            <>
              {/* 5 CLEAN METRIC CARDS */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                gap: 14,
                marginBottom: 24
              }}>
                {/* 1. Total Tasks */}
                <div className="stat-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>TOTAL TASKS</span>
                    <div className="stat-icon-wrap">
                      <ListTodo size={17} />
                    </div>
                  </div>
                  <div className="stat-info">
                    <h3>{stats.total}</h3>
                    <p>All active assignments</p>
                  </div>
                </div>

                {/* 2. Pending Tasks */}
                <div className="stat-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>PENDING TASKS</span>
                    <div className="stat-icon-wrap" style={{ background: "var(--warning-dim)", color: "var(--warning)", borderColor: "var(--warning-border)" }}>
                      <Clock size={17} />
                    </div>
                  </div>
                  <div className="stat-info">
                    <h3 style={{ color: "var(--warning)" }}>{stats.pending}</h3>
                    <p>Todo & awaiting review</p>
                  </div>
                </div>

                {/* 3. In Progress */}
                <div className="stat-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>IN PROGRESS</span>
                    <div className="stat-icon-wrap" style={{ background: "var(--accent-dim)", color: "var(--accent)", borderColor: "rgba(255, 138, 31, 0.25)" }}>
                      <Target size={17} />
                    </div>
                  </div>
                  <div className="stat-info">
                    <h3 style={{ color: "var(--accent)" }}>{stats.inProgress}</h3>
                    <p>Active task execution</p>
                  </div>
                </div>

                {/* 4. Completed Tasks */}
                <div className="stat-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>COMPLETED</span>
                    <div className="stat-icon-wrap" style={{ background: "var(--success-dim)", color: "var(--success)", borderColor: "var(--success-border)" }}>
                      <CheckCircle2 size={17} />
                    </div>
                  </div>
                  <div className="stat-info">
                    <h3 style={{ color: "var(--success)" }}>{stats.completed}</h3>
                    <p>Delivered successfully</p>
                  </div>
                </div>

                {/* 5. Team Members */}
                <div className="stat-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>TEAM MEMBERS</span>
                    <div className="stat-icon-wrap" style={{ background: "rgba(245, 158, 11, 0.12)", color: "var(--accent)", borderColor: "rgba(245, 158, 11, 0.25)" }}>
                      <Users size={17} />
                    </div>
                  </div>
                  <div className="stat-info">
                    <h3>{teamMembers.length}</h3>
                    <p>Eligible assignees</p>
                  </div>
                </div>
              </div>

              {/* MAIN CONTENT COMPOSITION */}
              <div className="grid-2-1">
                {/* Left Column: Task List */}
                <div className="card" style={{ padding: 22 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                    <div>
                      <h2 className="section-title" style={{ fontSize: 17, margin: 0 }}>Team Tasks</h2>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Manage team workloads & reviews</span>
                    </div>

                    <div style={{ position: "relative" }}>
                      <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                      <input 
                        className="form-input" 
                        style={{ paddingLeft: 30, width: 200, height: 32, fontSize: 12 }} 
                        placeholder="Search tasks…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Filters Bar */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", background: "var(--bg-secondary)", padding: 8, borderRadius: "10px", border: "1px solid var(--border)", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 6px", color: "var(--text-muted)" }}>
                      <Filter size={13} /> <span style={{ fontSize: 11.5, fontWeight: 600 }}>Filters:</span>
                    </div>
                    
                    <select className="form-select" style={{ width: "auto", padding: "4px 8px", fontSize: 12, height: 28 }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                      <option value="All">All Statuses</option>
                      <option value="Todo">Todo</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Pending Approval">Pending Approval</option>
                      <option value="Completed">Completed</option>
                    </select>

                    <select className="form-select" style={{ width: "auto", padding: "4px 8px", fontSize: 12, height: 28 }} value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                      <option value="All">All Priorities</option>
                      <option value="Urgent">Urgent</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>

                    <select className="form-select" style={{ width: "auto", padding: "4px 8px", fontSize: 12, height: 28 }} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                      <option value="All">All Categories</option>
                      <option value="Uncategorized">Uncategorized</option>
                      {categories.map((c: any) => <option key={c.id || c.name} value={c.name}>{c.name}</option>)}
                    </select>

                    <div style={{ flex: 1 }} />

                    <select className="form-select" style={{ width: "auto", padding: "4px 8px", fontSize: 12, height: 28, background: "var(--bg-card)" }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                      <option value="dueDate">Due Date</option>
                      <option value="priority">Priority</option>
                    </select>
                  </div>

                  {/* Task List */}
                  {filteredTasks.length === 0 ? (
                    <div className="empty-state" style={{ padding: "40px 20px" }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                        <Search size={20} style={{ color: "var(--text-muted)" }} />
                      </div>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>No tasks found</h3>
                      <p style={{ color: "var(--text-secondary)", fontSize: 12 }}>Adjust filters or assign a new task to your team.</p>
                    </div>
                  ) : (
                    <div>
                      {filteredTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          user={user}
                          onStatusChange={updateStatus}
                          onComment={addComment}
                          onOpenDetails={(t: any) => {
                            setSelectedTaskForDeliverables(t);
                            setShowDeliverablesModal(true);
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column: Deadlines & Feed */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Deadlines Widget */}
                  <div className="card" style={{ padding: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <div style={{ padding: 5, borderRadius: 6, background: "var(--danger-dim)", color: "var(--danger)" }}>
                        <AlertCircle size={14} />
                      </div>
                      <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>CRITICAL DEADLINES</h3>
                    </div>
                    
                    {upcomingDeadlines.length === 0 ? (
                      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Team is on track. No immediate deadlines.</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {upcomingDeadlines.map((t) => (
                          <div key={t.id} style={{ padding: "10px 12px", borderRadius: "8px", background: "var(--bg-secondary)", border: "1px solid var(--border)", position: "relative", overflow: "hidden" }}>
                            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: t.priority === "Urgent" || t.priority === "High" ? "var(--danger)" : "var(--accent)" }} />
                            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", marginBottom: 4 }}>{t.title}</div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11 }}>
                              <span style={{ color: "var(--text-muted)" }}>{t.assignedTo}</span>
                              <span style={{ color: "var(--accent)", fontWeight: 600 }}>{t.dueDate}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Team Feed Widget */}
                  <div className="card" style={{ padding: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <div style={{ padding: 5, borderRadius: 6, background: "var(--accent-dim)", color: "var(--accent)" }}>
                        <Activity size={14} />
                      </div>
                      <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>TEAM ACTIVITY FEED</h3>
                    </div>

                    {notifications.length === 0 ? (
                      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>No recent team activity.</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {notifications.map((n: any, i) => (
                          <div key={n.id || i} style={{ display: "flex", gap: 10 }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", marginTop: 6, flexShrink: 0 }} />
                            <div>
                              <div style={{ fontSize: 12, color: "var(--text-primary)", lineHeight: 1.4 }}>{n.message}</div>
                              <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 2 }}>
                                {n.date ? new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "chat" && (
            <div style={{ marginTop: 4 }}>
              <RoleChat
                mode="manager"
                currentUser={user}
                contacts={teamMembers.map((m: any) => ({
                  id: m.id,
                  name: m.name || m.email,
                  email: m.email,
                  role: "Team Member",
                  online: true,
                }))}
              />
            </div>
          )}

          {activeTab === "help" && (
            /* Help Requests Tab */
            <div className="grid-2-1">
              <div>
                <h2 className="section-title" style={{ fontSize: 18, marginBottom: 16 }}>Incoming Help Requests</h2>
                
                {helpRequests.length === 0 ? (
                  <div className="empty-state" style={{ padding: "48px 24px" }}>
                    <HelpCircle size={36} style={{ color: "var(--text-muted)", margin: "0 auto 12px", opacity: 0.5 }} />
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>No help requests</h3>
                    <p style={{ color: "var(--text-secondary)", fontSize: 12 }}>Your team members haven't submitted any help requests.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {helpRequests.map((req) => (
                      <div 
                        key={req.id} 
                        className="card" 
                        style={{ 
                          padding: 16, 
                          cursor: "pointer", 
                          border: activeHelpRequest?.id === req.id ? "1.5px solid var(--accent)" : "1px solid var(--border)"
                        }} 
                        onClick={() => setActiveHelpRequest(req)}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{req.issueTitle}</div>
                          <span className={`badge ${req.status === "Resolved" ? "badge-completed" : req.status === "Responded" ? "badge-inprogress" : "badge-pending"}`}>
                            {req.status}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>From: <span style={{ color: "var(--accent)" }}>{req.teamMemberEmail}</span></div>
                        <p style={{ fontSize: 12.5, color: "var(--text-primary)", margin: 0 }}>{req.description}</p>
                        {req.attachmentUrl && (
                          <a href={req.attachmentUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11.5, color: "var(--accent)", display: "inline-block", marginTop: 6 }} onClick={(e) => e.stopPropagation()}>
                            📎 View Attachment
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                {activeHelpRequest ? (
                  <div className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", height: "calc(100vh - 180px)" }}>
                    <div style={{ padding: 16, borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <h3 style={{ fontSize: 14, margin: 0, fontWeight: 600 }}>{activeHelpRequest.issueTitle}</h3>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0" }}>{activeHelpRequest.teamMemberEmail}</p>
                      </div>
                      {activeHelpRequest.status !== "Resolved" && (
                        <button className="btn btn-ghost btn-xs" style={{ color: "var(--success)", borderColor: "var(--success-border)", background: "var(--success-dim)" }} onClick={() => resolveHelpRequest(activeHelpRequest.id)}>
                          <CheckCircle2 size={12} /> Resolve
                        </button>
                      )}
                    </div>
                    
                    <div style={{ flex: 1, padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <div className="avatar" style={{ width: 24, height: 24, borderRadius: "6px", background: "var(--bg-secondary)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 10, color: "var(--text-primary)" }}>
                          {activeHelpRequest.teamMemberEmail.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{activeHelpRequest.teamMemberEmail}</div>
                          <div style={{ fontSize: 12.5, color: "var(--text-secondary)", background: "var(--bg-elevated)", padding: "8px 10px", borderRadius: "0 8px 8px 8px", border: "1px solid var(--border)" }}>
                            {activeHelpRequest.description}
                          </div>
                        </div>
                      </div>

                      {activeHelpRequest.messages?.map((msg: any) => (
                        <div key={msg.id} style={{ display: "flex", gap: 8, alignSelf: msg.senderEmail === user.email ? "flex-end" : "flex-start", flexDirection: msg.senderEmail === user.email ? "row-reverse" : "row" }}>
                          <div className="avatar" style={{ width: 24, height: 24, borderRadius: "6px", background: msg.senderEmail === user.email ? "var(--accent)" : "var(--bg-secondary)", color: "#fff", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 10 }}>
                            {msg.senderName?.charAt(0) || msg.senderEmail?.charAt(0) || '?'}
                          </div>
                          <div style={{ maxWidth: "80%" }}>
                            <div style={{ fontSize: 12.5, color: msg.senderEmail === user.email ? "#fff" : "var(--text-secondary)", background: msg.senderEmail === user.email ? "var(--accent-gradient)" : "var(--bg-elevated)", padding: "8px 10px", borderRadius: "8px", border: msg.senderEmail === user.email ? "none" : "1px solid var(--border)" }}>
                              {msg.text}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {activeHelpRequest.status !== "Resolved" && (
                      <div style={{ padding: 12, borderTop: "1px solid var(--border)", background: "var(--bg-secondary)", display: "flex", gap: 8, alignItems: "center" }}>
                        <input
                          className="form-input"
                          style={{ padding: "6px 10px", fontSize: 12, flex: 1, borderRadius: "6px" }}
                          placeholder="Type your response…"
                          value={helpReplyText}
                          onChange={(e) => setHelpReplyText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && sendHelpReply()}
                        />
                        <button className="btn btn-primary btn-xs" onClick={sendHelpReply} style={{ height: 30, padding: "0 12px" }}>
                          <Send size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="empty-state" style={{ padding: "48px 20px" }}>
                    <MessageSquare size={36} style={{ color: "var(--text-muted)", margin: "0 auto 12px", opacity: 0.5 }} />
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>Select a request</h3>
                    <p style={{ color: "var(--text-secondary)", fontSize: 12 }}>Click a ticket on the left to review details and reply.</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* TASK CREATION MODAL (Strictly Restricted to TEAM_MEMBER) */}
      {showTaskForm && (
        <div 
          className="modal-overlay" 
          onClick={() => !submitting && setShowTaskForm(false)} 
        >
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                  <span>Create & Assign Task</span>
                  <span className="badge badge-high">Manager</span>
                </h2>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "2px 0 0" }}>Assign new work strictly to an active Team Member.</p>
              </div>
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={() => setShowTaskForm(false)}
                disabled={submitting}
                style={{ padding: 4 }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Inline Error Message */}
            {formError && (
              <div style={{
                marginBottom: 16,
                padding: "10px 14px",
                borderRadius: "8px",
                background: "var(--danger-dim)",
                border: "1px solid var(--danger-border)",
                color: "var(--danger)",
                fontSize: 12.5,
                display: "flex",
                alignItems: "center",
                gap: 8
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{formError}</span>
              </div>
            )}

            {/* VISUALLY PROMINENT: Assign To Team Member */}
            <div style={{
              marginBottom: 18,
              padding: "14px 16px",
              background: "rgba(255, 138, 31, 0.05)",
              border: "1.5px solid rgba(255, 138, 31, 0.3)",
              borderRadius: "10px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label className="form-label" style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 12.5, display: "flex", alignItems: "center", gap: 6, margin: 0 }}>
                  <Users size={14} color="var(--accent)" />
                  Assign To Team Member <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <span className="badge badge-high" style={{ fontSize: 10 }}>
                  TEAM_MEMBER ONLY
                </span>
              </div>

              {teamMembers.length === 0 ? (
                <div style={{
                  padding: "10px 12px",
                  background: "var(--warning-dim)",
                  border: "1px solid var(--warning-border)",
                  borderRadius: "6px",
                  color: "var(--warning)",
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 6
                }}>
                  <AlertCircle size={14} />
                  <span>No team members available.</span>
                </div>
              ) : (
                <div>
                  <select
                    className="form-select"
                    value={form.assignedTo}
                    onChange={(e) => handleMemberSelect(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      fontSize: 13,
                      borderColor: "rgba(255, 138, 31, 0.4)",
                      cursor: "pointer"
                    }}
                  >
                    <option value="" disabled>Select a team member</option>
                    {teamMembers.map((tm: any) => (
                      <option key={tm.id || tm.email} value={tm.email} style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
                        {tm.name} ({tm.email})
                      </option>
                    ))}
                  </select>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "4px 0 0" }}>
                    Only verified TEAM_MEMBER users appear. Admins, Managers, and Individual Users cannot be selected.
                  </p>

                  {/* Workload Risk Analysis Panel */}
                  {loadingWorkload && (
                    <div style={{
                      marginTop: 10,
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 12,
                      color: "var(--text-muted)"
                    }}>
                      <Loader2 size={14} className="animate-spin" color="var(--accent)" />
                      <span>Analyzing team member workload…</span>
                    </div>
                  )}

                  {!loadingWorkload && workloadData && (
                    <div style={{
                      marginTop: 10,
                      padding: "12px 14px",
                      borderRadius: "8px",
                      background: workloadData.riskLevel === "HIGH" 
                        ? "rgba(239, 68, 68, 0.08)" 
                        : workloadData.riskLevel === "MEDIUM" 
                        ? "rgba(245, 158, 11, 0.08)" 
                        : "rgba(34, 197, 94, 0.08)",
                      border: `1px solid ${
                        workloadData.riskLevel === "HIGH"
                          ? "var(--danger-border)"
                          : workloadData.riskLevel === "MEDIUM"
                          ? "var(--warning-border)"
                          : "var(--success-border)"
                      }`,
                    }}>
                      {/* Notice Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontWeight: 700,
                          fontSize: 12.5,
                          color: workloadData.riskLevel === "HIGH" ? "var(--danger)" : workloadData.riskLevel === "MEDIUM" ? "var(--warning)" : "var(--success)"
                        }}>
                          {workloadData.riskLevel === "HIGH" ? (
                            <><span>⚠️</span> <span>Workload Notice</span></>
                          ) : workloadData.riskLevel === "MEDIUM" ? (
                            <><span>⚠️</span> <span>Workload Notice</span></>
                          ) : (
                            <><span>✓</span> <span>Workload Status</span></>
                          )}
                        </div>

                        <span style={{
                          padding: "2px 8px",
                          borderRadius: "999px",
                          fontSize: 10.5,
                          fontWeight: 700,
                          background: workloadData.riskLevel === "HIGH" ? "var(--danger-dim)" : workloadData.riskLevel === "MEDIUM" ? "var(--warning-dim)" : "var(--success-dim)",
                          color: workloadData.riskLevel === "HIGH" ? "var(--danger)" : workloadData.riskLevel === "MEDIUM" ? "var(--warning)" : "var(--success)",
                          border: `1px solid ${workloadData.riskLevel === "HIGH" ? "var(--danger-border)" : workloadData.riskLevel === "MEDIUM" ? "var(--warning-border)" : "var(--success-border)"}`
                        }}>
                          Workload Risk: {workloadData.riskLevel === "HIGH" ? "🔴 HIGH" : workloadData.riskLevel === "MEDIUM" ? "🟡 MEDIUM" : "🟢 LOW"}
                        </span>
                      </div>

                      {/* Metrics Summary */}
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 6,
                        marginBottom: 8,
                        textAlign: "center"
                      }}>
                        <div style={{ background: "var(--bg-elevated)", padding: "6px 4px", borderRadius: "6px", border: "1px solid var(--border)" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{workloadData.activeTasks}</div>
                          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>Active Tasks</div>
                        </div>
                        <div style={{ background: "var(--bg-elevated)", padding: "6px 4px", borderRadius: "6px", border: "1px solid var(--border)" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: workloadData.overdueTasks > 0 ? "var(--danger)" : "var(--text-primary)" }}>{workloadData.overdueTasks}</div>
                          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>Overdue Tasks</div>
                        </div>
                        <div style={{ background: "var(--bg-elevated)", padding: "6px 4px", borderRadius: "6px", border: "1px solid var(--border)" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: workloadData.highPriorityTasks > 0 ? "var(--warning)" : "var(--text-primary)" }}>{workloadData.highPriorityTasks}</div>
                          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>High Priority</div>
                        </div>
                      </div>

                      {/* Advisory Notice */}
                      <p style={{
                        fontSize: 11.5,
                        lineHeight: 1.45,
                        color: "var(--text-secondary)",
                        margin: 0
                      }}>
                        {workloadData.message}
                      </p>
                      {(workloadData.riskLevel === "HIGH" || workloadData.riskLevel === "MEDIUM") && (
                        <p style={{ fontSize: 11, color: "var(--accent)", margin: "4px 0 0", fontWeight: 500 }}>
                          Consider reviewing the workload before assigning another task.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Task Title */}
            <div className="form-group">
              <label className="form-label">
                Task Title <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input 
                className="form-input" 
                placeholder="What needs to be done?" 
                value={form.title}
                onChange={(e) => {
                  setForm({ ...form, title: e.target.value });
                  if (formError) setFormError("");
                }} 
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea 
                className="form-textarea" 
                placeholder="Provide specifications, acceptance criteria…" 
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} 
              />
            </div>

            {/* Due Date & Priority */}
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

            {/* Category & Tags */}
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select 
                  className="form-select" 
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="Uncategorized">Uncategorized</option>
                  {categories.map((c: any) => <option key={c.id || c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Tags (comma-separated)</label>
                <input 
                  className="form-input" 
                  placeholder="e.g. backend, api" 
                  value={form.labels}
                  onChange={(e) => setForm({ ...form, labels: e.target.value })} 
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
              <button 
                className="btn btn-ghost" 
                onClick={() => {
                  setShowTaskForm(false);
                  setWorkloadData(null);
                }}
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={addTask} 
                disabled={submitting || !form.title.trim() || !form.assignedTo.trim()}
                style={{
                  background: workloadData?.riskLevel === "HIGH" 
                    ? "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)" 
                    : workloadData?.riskLevel === "MEDIUM"
                    ? "var(--accent-gradient)"
                    : undefined
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Assigning…</span>
                  </>
                ) : (workloadData?.riskLevel === "HIGH" || workloadData?.riskLevel === "MEDIUM") ? (
                  <>
                    <AlertTriangle size={14} />
                    <span>Assign Anyway</span>
                  </>
                ) : (
                  <>
                    <Plus size={14} />
                    <span>Assign Task</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deliverables & Completion Modal */}
      {showDeliverablesModal && selectedTaskForDeliverables && (
        <ManagerDeliverablesModal
          task={selectedTaskForDeliverables}
          onClose={() => {
            setShowDeliverablesModal(false);
            setSelectedTaskForDeliverables(null);
          }}
          onStatusChange={(t: any, newStatus: string) => {
            updateStatus(t, newStatus);
            setSelectedTaskForDeliverables((prev: any) => prev ? { ...prev, status: newStatus } : null);
          }}
        />
      )}

      {/* Modern Toast Notification */}
      {toast && (
        <div style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          padding: "12px 18px",
          borderRadius: "10px",
          background: toast.type === "success" ? "#142918" : toast.type === "error" ? "#331212" : "#21160E",
          border: `1px solid ${toast.type === "success" ? "var(--success)" : toast.type === "error" ? "var(--danger)" : "var(--accent)"}`,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 10,
          boxShadow: "var(--shadow-lg)",
          fontSize: 13,
          fontWeight: 500,
          maxWidth: 400,
        }}>
          {toast.type === "success" && <CheckCircle2 size={16} color="var(--success)" />}
          {toast.type === "error" && <AlertCircle size={16} color="var(--danger)" />}
          {toast.type === "info" && <Zap size={16} color="var(--accent)" />}
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button 
            onClick={() => setToast(null)} 
            style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 2, display: "flex" }}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}