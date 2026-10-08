"use client";
import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar  from "@/components/Navbar";
import RoleChat from "@/components/RoleChat";
import { tasksApi, notificationsApi, usersApi, categoriesApi, helpRequestsApi, filesApi, chatApi } from "@/lib/api";
import { 
  AlertCircle, Calendar, MessageSquare, ListTodo, Target, 
  CheckCircle2, Search, Clock, Tag, User, Send, CheckCircle, 
  Flame, HelpCircle, AlertTriangle, ArrowRight, X, Check, Activity,
  Paperclip, Download, Eye, UploadCloud, FileText
} from "lucide-react";

const PRIORITY_CONFIG: Record<string, { label: string; badgeClass: string; icon: any }> = {
  Urgent: { label: "URGENT", badgeClass: "badge-urgent", icon: Flame },
  High:   { label: "HIGH",   badgeClass: "badge-high",   icon: AlertTriangle },
  Medium: { label: "MEDIUM", badgeClass: "badge-medium", icon: Clock },
  Low:    { label: "LOW",    badgeClass: "badge-low",    icon: CheckCircle2 },
};

function formatFileSize(bytes: number): string {
  if (!bytes && bytes !== 0) return "0 B";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

/* ══════════════════════════════════════════════════════════════
   TASK DETAILS & COMPLETION FILE MODAL
   ══════════════════════════════════════════════════════════════ */
function TaskDetailsModal({ task, user, onClose, onStatusChange }: any) {
  const [attachments, setAttachments]           = useState<any[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(true);
  const [selectedFile, setSelectedFile]         = useState<File | null>(null);
  const [uploading, setUploading]               = useState(false);
  const [uploadSuccess, setUploadSuccess]       = useState("");
  const [uploadError, setUploadError]           = useState("");
  const [currentStatus, setCurrentStatus]       = useState(task.status || "Todo");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".png", ".jpg", ".jpeg", ".zip"];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB limit

  const isAssigned = (task.assignedTo === user?.email);
  const isCompleted = currentStatus === "Completed" || currentStatus === "COMPLETED";

  // Calculate progress %
  const progressPercent = isCompleted ? 100 : currentStatus === "Pending Approval" ? 85 : currentStatus === "In Progress" ? 50 : 15;

  useEffect(() => {
    loadAttachments();
  }, [task.id]);

  const loadAttachments = async () => {
    setLoadingAttachments(true);
    try {
      const data = await filesApi.getByTask(task.id);
      setAttachments(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError("");
    setUploadSuccess("");
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setUploadError("Invalid file format. Allowed files: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, JPEG, ZIP.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadError("File size exceeds the 10 MB maximum limit.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    if (!isAssigned) {
      setUploadError("Only the Team Member assigned to this task is permitted to upload the completion file.");
      return;
    }

    setUploading(true);
    setUploadError("");
    setUploadSuccess("");

    try {
      await filesApi.upload(task.id, selectedFile, user?.name || user?.email || "Team Member");
      setUploadSuccess("File uploaded successfully");

      // Notify manager that deliverable was uploaded
      if (task.createdBy) {
        const by = user?.name || user?.email || "Team Member";
        notificationsApi.create(
          task.createdBy,
          `Team Member ${by} completed/uploaded deliverable for task "${task.title}": ${selectedFile.name}`,
          "TASK_UPDATED"
        ).catch(console.error);
      }

      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadAttachments();
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleStatusUpdate = (newStatus: string) => {
    setCurrentStatus(newStatus);
    onStatusChange(task, newStatus);

    if ((newStatus === "Completed" || newStatus === "COMPLETED") && task.createdBy) {
      const by = user?.name || user?.email || "Team Member";
      notificationsApi.create(
        task.createdBy,
        `Team Member ${by} marked task "${task.title}" as Completed`,
        "TASK_UPDATED"
      ).catch(console.error);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: 540, padding: "28px" }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 className="brand-text" style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
            Task Details
          </h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: 6, borderRadius: "50%" }}>
            <X size={18} />
          </button>
        </div>

        {/* Task Details Info Card */}
        <div style={{ background: "var(--bg-secondary)", borderRadius: "var(--radius-sm)", padding: "18px 20px", border: "1px solid var(--border)", marginBottom: 24 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Task
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginTop: 2 }}>
              {task.title}
            </div>
            {task.description && (
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.45 }}>
                {task.description}
              </p>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
            <div>
              <div style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                Status
              </div>
              <select
                className="form-select"
                style={{ width: "100%", height: 32, fontSize: 12.5, borderRadius: "6px" }}
                value={currentStatus}
                onChange={(e) => handleStatusUpdate(e.target.value)}
              >
                <option value="Todo">Todo</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11.5, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                <span>Progress</span>
                <span style={{ color: isCompleted ? "var(--success)" : "var(--accent)", fontWeight: 700 }}>
                  {progressPercent}%
                </span>
              </div>
              <div className="progress-bar" style={{ height: 6, marginTop: 8 }}>
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${progressPercent}%`, 
                    background: isCompleted ? "var(--success)" : "var(--accent-gradient)" 
                  }} 
                />
              </div>
            </div>
          </div>

          {!isCompleted && isAssigned && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => handleStatusUpdate("Completed")}
              style={{ 
                marginTop: 14, 
                width: "100%", 
                borderColor: "rgba(34, 197, 94, 0.35)", 
                color: "var(--success)", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                gap: 6,
                fontWeight: 600
              }}
            >
              <CheckCircle2 size={14} /> Mark as Completed
            </button>
          )}
        </div>

        {/* Completion File Section */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Completion File
          </h3>

          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip"
            style={{ display: "none" }}
          />

          {!isAssigned ? (
            <div style={{ padding: "12px 14px", background: "var(--bg-secondary)", borderRadius: "8px", border: "1px solid var(--border)", fontSize: 12.5, color: "var(--text-muted)" }}>
              🔒 Only the assigned Team Member ({task.assignedTo}) can upload completion files.
            </div>
          ) : !selectedFile ? (
            <div>
              <button 
                type="button"
                className="btn btn-ghost"
                onClick={() => fileInputRef.current?.click()}
                style={{ 
                  display: "inline-flex", 
                  alignItems: "center", 
                  gap: 8, 
                  borderColor: "var(--accent)", 
                  color: "var(--accent)",
                  padding: "8px 18px",
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: "8px"
                }}
              >
                <Paperclip size={15} /> Upload File
              </button>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.45 }}>
                Upload the completed work, document, screenshot, ZIP, or other deliverable.
              </p>
            </div>
          ) : (
            /* Selected File Card */
            <div style={{ 
              background: "var(--bg-elevated)", 
              border: "1px solid var(--border)", 
              borderRadius: "var(--radius-sm)", 
              padding: "14px 16px" 
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <span style={{ fontSize: 26 }}>📄</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {selectedFile.name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                    {formatFileSize(selectedFile.size)}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handleRemoveFile}
                  disabled={uploading}
                  style={{ color: "var(--text-secondary)", padding: "6px 14px", fontSize: 12.5 }}
                >
                  Remove
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleUpload}
                  disabled={uploading}
                  style={{ padding: "6px 20px", fontSize: 12.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
                >
                  {uploading ? (
                    <>
                      <span className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} />
                      Uploading…
                    </>
                  ) : (
                    "Upload"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Success Notification */}
          {uploadSuccess && (
            <div style={{ 
              marginTop: 12, 
              padding: "10px 14px", 
              background: "var(--success-dim)", 
              border: "1px solid var(--success-border)", 
              borderRadius: "var(--radius-sm)", 
              color: "var(--success)", 
              fontSize: 13, 
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}>
              <CheckCircle2 size={16} /> {uploadSuccess}
            </div>
          )}

          {/* Error Notification */}
          {uploadError && (
            <div style={{ 
              marginTop: 12, 
              padding: "10px 14px", 
              background: "var(--danger-dim)", 
              border: "1px solid var(--danger-border)", 
              borderRadius: "var(--radius-sm)", 
              color: "var(--danger)", 
              fontSize: 12.5,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} /> {uploadError}
            </div>
          )}
        </div>

        {/* Attachments Section */}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 18 }}>
          <h3 style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Attachments {attachments.length > 0 && `(${attachments.length})`}
          </h3>

          {loadingAttachments ? (
            <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "10px 0" }}>
              Loading attachments…
            </div>
          ) : attachments.length === 0 ? (
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: 0, fontStyle: "italic" }}>
              No files attached yet.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {attachments.map((att) => (
                <div
                  key={att.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 14px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: 20 }}>📄</span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {att.originalName || att.fileName}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                        <span>{formatFileSize(att.fileSize)}</span>
                        <span>•</span>
                        <span>Uploaded by: {att.uploadedBy || "Team Member"}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <a
                      href={att.demoBlobUrl || filesApi.getDownloadUrl(att.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-ghost btn-xs"
                      style={{ height: 28, padding: "0 10px", display: "inline-flex", alignItems: "center", gap: 4 }}
                    >
                      <Eye size={12} /> View
                    </a>
                    <a
                      href={att.demoBlobUrl || filesApi.getDownloadUrl(att.id)}
                      download={att.originalName || "attachment"}
                      className="btn btn-primary btn-xs"
                      style={{ height: 28, padding: "0 10px", display: "inline-flex", alignItems: "center", gap: 4 }}
                    >
                      <Download size={12} /> Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TASK CARD COMPONENT
   ══════════════════════════════════════════════════════════════ */
function TaskCard({ task, user, onStatusChange, onComment, onRequestHelp, onOpenDetails }: any) {
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
        marginBottom: 12, 
        padding: "16px 20px", 
        borderLeft: isApproaching ? "3px solid var(--danger)" : isCompleted ? "3px solid var(--success)" : "3px solid var(--border)"
      }}
    >
      <div className="task-card-header" style={{ marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
            <span 
              onClick={() => onOpenDetails(task)}
              style={{ 
                fontSize: 14.5, 
                fontWeight: 600, 
                textDecoration: isCompleted ? "line-through" : "none", 
                color: isCompleted ? "var(--text-muted)" : "var(--text-primary)",
                cursor: "pointer"
              }}
              title="Click to view details & completion file"
            >
              {task.title}
            </span>

            {isApproaching && (
              <span className="badge badge-urgent" style={{ fontSize: 10, padding: "2px 6px" }}>
                <Flame size={11} strokeWidth={2.5} /> Due soon
              </span>
            )}
          </div>
          {task.description && (
            <p style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 2, lineHeight: 1.45 }}>{task.description}</p>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <span className={`badge ${prio.badgeClass}`}>
            <PrioIcon size={11} /> {prio.label}
          </span>
          <span className={`badge ${isCompleted ? 'badge-completed' : task.status === 'In Progress' ? 'badge-inprogress' : task.status === 'Pending Approval' ? 'badge-pending' : 'badge-todo'}`}>
            {task.status}
          </span>
        </div>
      </div>

      {/* Metadata */}
      <div className="task-meta" style={{ gap: 8, marginTop: 10 }}>
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
        {task.labels && typeof task.labels === "string" && task.labels.split(",").filter(Boolean).map((l: string, i: number) => (
          <span key={i} style={{ background: "rgba(255, 138, 31, 0.08)", color: "var(--accent)", padding: "2px 6px", borderRadius: "5px", fontSize: 11, fontWeight: 500 }}>
            #{l.trim()}
          </span>
        ))}
      </div>

      {/* Status Transition & Actions */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 500 }}>Update Status:</span>
          <select
            className="form-select"
            style={{ width: "145px", padding: "4px 8px", fontSize: 12, height: 28, borderRadius: "6px" }}
            value={task.status}
            onChange={(e) => {
              const val = e.target.value;
              onStatusChange(task, val);
              if (val === "Completed" || val === "COMPLETED") {
                onOpenDetails({ ...task, status: val });
              }
            }}
          >
            <option value="Todo">Todo</option>
            <option value="In Progress">In Progress</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Completed">Completed</option>
          </select>
          
          {isCompleted && (
            <span style={{ fontSize: 11.5, color: "var(--success)", display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
              <CheckCircle2 size={13}/> Completed
            </span>
          )}
          {task.status === "Pending Approval" && (
            <span style={{ fontSize: 11.5, color: "var(--warning)", display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
              <Clock size={13}/> In Review
            </span>
          )}
        </div>
        
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button
            className="btn btn-ghost btn-xs"
            onClick={() => onOpenDetails(task)}
            style={{ color: "var(--accent)", borderColor: "rgba(255, 138, 31, 0.25)", display: "inline-flex", alignItems: "center", gap: 4 }}
            title="Upload completed deliverable"
          >
            <Paperclip size={12} />
            <span>Upload File</span>
          </button>

          <button
            className="btn btn-ghost btn-xs"
            onClick={() => onRequestHelp(task)}
            style={{ borderColor: "rgba(255, 138, 31, 0.25)" }}
          >
            <HelpCircle size={12} />
            <span>Request Help</span>
          </button>
          
          <button
            className="btn btn-ghost btn-xs"
            onClick={() => setShowComments(!showComments)}
            style={{ background: showComments ? "var(--bg-elevated)" : "transparent" }}
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
              placeholder="Ask for help or post an update…"
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

export default function TeamDashboard() {
  const [tasks, setTasks]                 = useState<any[]>([]);
  const [user, setUser]                   = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [helpRequests, setHelpRequests]   = useState<any[]>([]);
  const [loading, setLoading]             = useState(true);
  
  const [searchQuery, setSearchQuery]     = useState("");
  const [filterStatus, setFilterStatus]   = useState("All");
  const [sortBy, setSortBy]               = useState("dueDate");
  const [activeTab, setActiveTab]         = useState("tasks"); // tasks, help, chat
  const [allUsers, setAllUsers]           = useState<any[]>([]);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  // Help Request Modal State
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [selectedTaskForHelp, setSelectedTaskForHelp] = useState<any>(null);
  const [helpForm, setHelpForm] = useState({ title: "", description: "", attachmentUrl: "" });
  const [submittingHelp, setSubmittingHelp] = useState(false);

  // Task Details & Completion File Modal State
  const [showTaskDetailsModal, setShowTaskDetailsModal] = useState(false);
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<any>(null);

  // Help Request Thread State
  const [activeHelpRequest, setActiveHelpRequest] = useState<any>(null);
  const [helpReplyText, setHelpReplyText] = useState("");

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
      const [t, notifs, reqs, us] = await Promise.all([
        tasksApi.getAll(),
        notificationsApi.getAll(u.email).catch(() => []),
        helpRequestsApi.getMemberRequests(u.email).catch(() => []),
        usersApi.getAll().catch(() => [])
      ]);
      setTasks(t || []);
      setNotifications((notifs || []).slice(0, 5));
      setHelpRequests(reqs || []);
      setAllUsers(us || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const updateStatus = async (task: any, newStatus: string) => {
    try {
      const updated = await tasksApi.update(task.id, {
        status: newStatus,
        completedBy: (newStatus === "Completed" || newStatus === "COMPLETED") ? (user?.name || user?.email) : undefined,
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

  const submitHelpRequest = async () => {
    if (!helpForm.title.trim() || !helpForm.description.trim() || !selectedTaskForHelp) return;
    setSubmittingHelp(true);
    try {
      const req = await helpRequestsApi.create({
        taskId: selectedTaskForHelp.id,
        issueTitle: helpForm.title,
        description: helpForm.description,
        attachmentUrl: helpForm.attachmentUrl,
        teamMemberEmail: user.email
      });
      setHelpRequests([req, ...helpRequests]);
      setShowHelpModal(false);
      setHelpForm({ title: "", description: "", attachmentUrl: "" });
      setActiveTab("help");
    } catch (e) { console.error(e); }
    setSubmittingHelp(false);
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
          return { ...r, messages: msgs };
        }
        return r;
      });
      setHelpRequests(updatedReqs);
      setActiveHelpRequest(updatedReqs.find(r => r.id === activeHelpRequest.id));
      setHelpReplyText("");
    } catch (e) { console.error(e); }
  };

  const visibleTasks = tasks.filter((t) => t.assignedTo === user?.email);
  const filteredTasks = visibleTasks
    .filter((t) => filterStatus === "All" || t.status === filterStatus)
    .filter((t) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === "priority") {
        const p: Record<string, number> = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
        return (p[b.priority] || 0) - (p[a.priority] || 0);
      }
      if (!a.dueDate) return 1; if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  const stats = {
    total: visibleTasks.length,
    completed: visibleTasks.filter((t) => t.status === "Completed" || t.status === "COMPLETED").length,
    inProgress: visibleTasks.filter((t) => t.status === "In Progress" || t.status === "IN_PROGRESS").length,
    todo: visibleTasks.filter((t) => t.status !== "Completed" && t.status !== "COMPLETED").length,
  };
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const criticalDeadlines = visibleTasks
    .filter((t) => t.dueDate && t.status !== "Completed" && t.status !== "COMPLETED")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  // Determine assigned manager(s) for this team member
  const managerEmails = Array.from(
    new Set(
      visibleTasks
        .map((t) => t.createdBy)
        .filter((email) => Boolean(email) && email !== user?.email)
    )
  );

  let assignedManagers = allUsers
    .filter((u: any) => {
      const r = (u.role || "").toUpperCase();
      if (r !== "MANAGER") return false;
      return managerEmails.length === 0 || managerEmails.includes(u.email);
    })
    .map((m: any) => ({
      id: m.id,
      name: m.name || m.email,
      email: m.email,
      role: "Manager",
      online: true,
    }));

  if (assignedManagers.length === 0) {
    const fallbackEmail = managerEmails[0] || "manager@tasksystem.com";
    assignedManagers = [
      {
        id: "mgr_1",
        name: "Project Manager",
        email: fallbackEmail,
        role: "Manager",
        online: true,
      },
    ];
  }

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Navbar title="My Work" />
        <div className="page-content">

          {/* DASHBOARD HERO */}
          <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14 }}>
            <div>
              <h1 className="brand-text" style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
                Hello, {user?.name?.split(' ')[0] || "Team Member"} 👋
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                Focus on priority assignments, update ticket statuses, and coordinate with your manager.
              </p>
            </div>
            
            <div className="tabs" style={{ margin: 0 }}>
              <button 
                onClick={() => setActiveTab("tasks")}
                className={`tab-btn ${activeTab === "tasks" ? "active" : ""}`} 
              >
                My Tasks
              </button>
              <button 
                onClick={() => setActiveTab("chat")}
                className={`tab-btn ${activeTab === "chat" ? "active" : ""}`} 
                style={{ display: "flex", gap: 6, alignItems: "center" }}
              >
                <span>💬 Chat with Manager</span>
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
                {helpRequests.length > 0 && (
                  <span style={{ background: "var(--accent)", padding: "1px 6px", borderRadius: 999, fontSize: 10, color: "#fff", fontWeight: 700 }}>
                    {helpRequests.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {activeTab === "chat" && (
            <div style={{ marginTop: 4 }}>
              <RoleChat
                mode="team"
                currentUser={user}
                contacts={assignedManagers}
              />
            </div>
          )}

          {activeTab !== "chat" && (
            <div className="grid-2-1">
            {/* Left Column */}
            <div>
              {activeTab === "tasks" ? (
                <>
                  {/* Progress Card */}
                  <div className="card" style={{ padding: "16px 20px", marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Target size={16} color="var(--accent)" />
                        <span style={{ fontWeight: 600, fontSize: 13.5, color: "var(--text-primary)" }}>Sprint Delivery Progress</span>
                      </div>
                      <span style={{ color: completionRate === 100 ? "var(--success)" : "var(--accent)", fontWeight: 700, fontSize: 13.5 }}>
                        {completionRate}%
                      </span>
                    </div>
                    <div className="progress-bar" style={{ height: 6 }}>
                      <div className="progress-fill" style={{ width: `${completionRate}%` }} />
                    </div>
                  </div>

                  {/* Filter & Search Bar */}
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
                    <div style={{ position: "relative", flex: 1 }}>
                      <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                      <input 
                        className="form-input" 
                        style={{ paddingLeft: 30, height: 32, fontSize: 12 }} 
                        placeholder="Search my tasks…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <select className="form-select" style={{ width: "auto", height: 32, fontSize: 12, padding: "0 10px" }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                      <option value="All">All Statuses</option>
                      <option value="Todo">Todo</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Pending Approval">Pending Approval</option>
                      <option value="Completed">Completed</option>
                    </select>
                    <select className="form-select" style={{ width: "auto", height: 32, fontSize: 12, padding: "0 10px" }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                      <option value="dueDate">Due Date</option>
                      <option value="priority">Priority</option>
                    </select>
                  </div>

                  {/* Task List */}
                  {filteredTasks.length === 0 ? (
                    <div className="empty-state" style={{ padding: "40px 20px" }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                        <CheckCircle size={22} style={{ color: "var(--success)" }} />
                      </div>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>You're all caught up!</h3>
                      <p style={{ color: "var(--text-secondary)", fontSize: 12 }}>No tasks match your filters.</p>
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
                          onRequestHelp={(t: any) => { setSelectedTaskForHelp(t); setShowHelpModal(true); }}
                          onOpenDetails={(t: any) => { setSelectedTaskForDetails(t); setShowTaskDetailsModal(true); }}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* Help Requests View */
                <div>
                  <h2 className="section-title" style={{ fontSize: 17, marginBottom: 16 }}>My Help Requests</h2>
                  
                  {helpRequests.length === 0 ? (
                    <div className="empty-state" style={{ padding: "48px 24px" }}>
                      <HelpCircle size={36} style={{ color: "var(--text-muted)", margin: "0 auto 12px", opacity: 0.5 }} />
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>No help requests</h3>
                      <p style={{ color: "var(--text-secondary)", fontSize: 12 }}>If you get blocked on a task, click "Request Help" on any ticket.</p>
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
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{req.issueTitle}</div>
                            <span className={`badge ${req.status === "Resolved" ? "badge-completed" : req.status === "Responded" ? "badge-inprogress" : "badge-pending"}`}>
                              {req.status}
                            </span>
                          </div>
                          <p style={{ fontSize: 12.5, color: "var(--text-secondary)", margin: 0 }}>{req.description}</p>
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
              )}
            </div>

            {/* Right Column */}
            <div>
              {activeTab === "help" && activeHelpRequest ? (
                <div className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", height: "calc(100vh - 180px)" }}>
                  <div style={{ padding: 16, borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
                    <h3 style={{ fontSize: 14, margin: 0, fontWeight: 600 }}>Thread: {activeHelpRequest.issueTitle}</h3>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0" }}>Manager ticket discussion</p>
                  </div>
                  
                  <div style={{ flex: 1, padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <div className="avatar" style={{ width: 24, height: 24, borderRadius: "6px", background: "var(--bg-secondary)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 10, color: "var(--text-primary)" }}>
                        {activeHelpRequest.teamMemberEmail.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>You</div>
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

                  <div style={{ padding: 12, borderTop: "1px solid var(--border)", background: "var(--bg-secondary)", display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      className="form-input"
                      style={{ padding: "6px 10px", fontSize: 12, flex: 1, borderRadius: "6px" }}
                      placeholder="Add a message…"
                      value={helpReplyText}
                      onChange={(e) => setHelpReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendHelpReply()}
                    />
                    <button className="btn btn-primary btn-xs" onClick={sendHelpReply} style={{ height: 30, padding: "0 12px" }}>
                      <Send size={12} />
                    </button>
                  </div>
                </div>
              ) : (
                /* Stacked Info Cards */
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Card 1: Critical Deadlines */}
                  <div className="card" style={{ padding: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <div style={{ padding: 5, borderRadius: 6, background: "var(--danger-dim)", color: "var(--danger)" }}>
                        <AlertCircle size={14} />
                      </div>
                      <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        CRITICAL DEADLINES
                      </h3>
                    </div>

                    {criticalDeadlines.length === 0 ? (
                      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>No urgent task deadlines.</p>
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

                  {/* Card 2: Personal Stats */}
                  <div className="card" style={{ padding: 20 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      WORK SUMMARY
                    </h3>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div style={{ background: "var(--bg-secondary)", padding: 12, borderRadius: "8px", textAlign: "center" }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--warning)" }}>{stats.inProgress}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>In Progress</div>
                      </div>
                      <div style={{ background: "var(--bg-secondary)", padding: 12, borderRadius: "8px", textAlign: "center" }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--success)" }}>{stats.completed}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Delivered</div>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Activity Feed */}
                  {notifications.length > 0 && (
                    <div className="card" style={{ padding: 20 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                        <div style={{ padding: 5, borderRadius: 6, background: "var(--accent-dim)", color: "var(--accent)" }}>
                          <Activity size={14} />
                        </div>
                        <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          RECENT NOTIFICATIONS
                        </h3>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {notifications.slice(0, 3).map((n: any, i) => (
                          <div key={n.id || i} style={{ display: "flex", gap: 8 }}>
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
              )}
            </div>
          </div>
        )}

        </div>
      </div>

      {/* Help Request Modal */}
      {showHelpModal && (
        <div className="modal-overlay" onClick={() => setShowHelpModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h2 className="section-title" style={{ fontSize: 18, margin: 0 }}>Request Manager Assistance</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowHelpModal(false)} style={{ padding: 4 }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ marginBottom: 14, padding: "10px 12px", background: "var(--bg-secondary)", borderRadius: "8px", border: "1px solid var(--border)", fontSize: 12 }}>
              <span style={{ color: "var(--text-muted)" }}>Task: </span>
              <strong style={{ color: "var(--text-primary)" }}>{selectedTaskForHelp?.title}</strong>
            </div>

            <div className="form-group">
              <label className="form-label">Issue Summary</label>
              <input 
                className="form-input" 
                placeholder="What is blocking your progress?" 
                value={helpForm.title}
                onChange={(e) => setHelpForm({ ...helpForm, title: e.target.value })} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description & Context</label>
              <textarea 
                className="form-textarea" 
                placeholder="Provide details, error messages, or what you've tried…" 
                value={helpForm.description}
                onChange={(e) => setHelpForm({ ...helpForm, description: e.target.value })} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Attachment Link (Optional)</label>
              <input 
                className="form-input" 
                placeholder="https://drive.google.com/… or documentation link" 
                value={helpForm.attachmentUrl}
                onChange={(e) => setHelpForm({ ...helpForm, attachmentUrl: e.target.value })} 
              />
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setShowHelpModal(false)}>Cancel</button>
              <button 
                className="btn btn-primary" 
                onClick={submitHelpRequest}
                disabled={submittingHelp || !helpForm.title.trim() || !helpForm.description.trim()}
              >
                {submittingHelp ? "Submitting…" : "Send to Manager"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Details & Completion File Modal */}
      {showTaskDetailsModal && selectedTaskForDetails && (
        <TaskDetailsModal
          task={selectedTaskForDetails}
          user={user}
          onClose={() => {
            setShowTaskDetailsModal(false);
            setSelectedTaskForDetails(null);
          }}
          onStatusChange={(t: any, newStatus: string) => {
            updateStatus(t, newStatus);
            setSelectedTaskForDetails((prev: any) => prev ? { ...prev, status: newStatus } : null);
          }}
        />
      )}
    </div>
  );
}