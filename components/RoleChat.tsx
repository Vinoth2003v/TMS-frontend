"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Send, Search, MessageSquare, Check, CheckCheck, 
  User, Shield, Clock, Sparkles, RefreshCw, Circle
} from "lucide-react";
import { chatApi } from "@/lib/api";

interface ChatContact {
  id?: number | string;
  name: string;
  email: string;
  role?: string;
  online?: boolean;
}

interface RoleChatProps {
  mode: "manager" | "team";
  currentUser: {
    id?: number | string;
    email: string;
    name?: string;
    role?: string;
  };
  contacts: ChatContact[];
  defaultContactEmail?: string;
}

export default function RoleChat({
  mode,
  currentUser,
  contacts,
  defaultContactEmail,
}: RoleChatProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [lastMessages, setLastMessages] = useState<Record<string, any>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter contacts based on search query
  const filteredContacts = contacts.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  // Auto-select initial contact
  useEffect(() => {
    if (contacts.length === 0) return;
    if (defaultContactEmail) {
      const match = contacts.find(
        (c) => c.email.toLowerCase() === defaultContactEmail.toLowerCase()
      );
      if (match) {
        setSelectedContact(match);
        return;
      }
    }
    if (!selectedContact && contacts.length > 0) {
      setSelectedContact(contacts[0]);
    }
  }, [contacts, defaultContactEmail]);

  // Load unread counts & recent previews
  const loadUnreadAndRecent = async () => {
    if (!currentUser?.email) return;
    try {
      const counts = await chatApi.getUnreadCounts(currentUser.email);
      if (counts?.bySender) {
        setUnreadCounts(counts.bySender);
      }
      const recent = await chatApi.getRecent(currentUser.email);
      if (Array.isArray(recent)) {
        const lasts: Record<string, any> = {};
        recent.forEach((m) => {
          const partner =
            m.senderEmail?.toLowerCase() === currentUser.email?.toLowerCase()
              ? m.receiverEmail?.toLowerCase()
              : m.senderEmail?.toLowerCase();
          if (partner && !lasts[partner]) {
            lasts[partner] = m;
          }
        });
        setLastMessages(lasts);
      }
    } catch (err) {
      console.error("Failed to load chat summaries:", err);
    }
  };

  useEffect(() => {
    loadUnreadAndRecent();
    const interval = setInterval(loadUnreadAndRecent, 6000);
    return () => clearInterval(interval);
  }, [currentUser?.email]);

  // Load conversation when selected contact changes
  const loadConversation = async (contact: ChatContact, showLoader = true) => {
    if (!currentUser?.email || !contact?.email) return;
    if (showLoader) setLoadingMessages(true);
    try {
      const conv = await chatApi.getConversation(contact.email, currentUser.email);
      setMessages(Array.isArray(conv) ? conv : []);
      // Clear unread for this contact locally
      setUnreadCounts((prev) => {
        const copy = { ...prev };
        delete copy[contact.email];
        return copy;
      });
    } catch (err) {
      console.error("Failed to fetch conversation:", err);
    } finally {
      if (showLoader) setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (selectedContact) {
      loadConversation(selectedContact, true);
    }
  }, [selectedContact?.email]);

  // Polling for active conversation every 3 seconds
  useEffect(() => {
    if (!selectedContact) return;
    const interval = setInterval(() => {
      loadConversation(selectedContact, false);
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedContact?.email, currentUser?.email]);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedContact || sending) return;

    const text = inputText.trim();
    setInputText("");
    setSending(true);

    // Optimistic UI update
    const optimisticMsg = {
      id: "opt_" + Date.now(),
      senderEmail: currentUser.email,
      receiverEmail: selectedContact.email,
      message: text,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setLastMessages((prev) => ({
      ...prev,
      [selectedContact.email.toLowerCase()]: optimisticMsg,
    }));

    try {
      const saved = await chatApi.sendMessage({
        senderEmail: currentUser.email,
        receiverEmail: selectedContact.email,
        message: text,
      });
      // Replace optimistic message with actual saved one
      if (saved && saved.id) {
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticMsg.id ? saved : m))
        );
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  // Format timestamp helper
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div
      className="card"
      style={{
        padding: 0,
        overflow: "hidden",
        border: "1px solid var(--border)",
        background: "var(--bg-card)",
        borderRadius: "var(--radius)",
        display: "grid",
        gridTemplateColumns: contacts.length > 1 ? "320px 1fr" : "280px 1fr",
        minHeight: "680px",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      {/* ─────────────────────────────────────────────────────────────
          LEFT PANEL: CONTACTS LIST
          ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          borderRight: "1px solid var(--border)",
          background: "var(--bg-secondary)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Left Header */}
        <div
          style={{
            padding: "18px 18px 14px",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-card)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "8px",
                  background: "var(--accent-dim)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent)",
                }}
              >
                <MessageSquare size={16} />
              </div>
              <h3
                style={{
                  fontSize: 14.5,
                  fontWeight: 700,
                  margin: 0,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.01em",
                }}
              >
                {mode === "manager" ? "Team Members" : "Assigned Manager"}
              </h3>
            </div>
            <span
              className="badge"
              style={{
                fontSize: 11,
                padding: "2px 8px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
              }}
            >
              {contacts.length} {contacts.length === 1 ? "contact" : "members"}
            </span>
          </div>

          {/* Search bar (only if more than 1 contact) */}
          {contacts.length > 1 && (
            <div style={{ position: "relative" }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                className="form-input"
                style={{
                  paddingLeft: 32,
                  paddingRight: 10,
                  height: 34,
                  fontSize: 12.5,
                  background: "var(--bg-elevated)",
                  borderRadius: "var(--radius-xs)",
                }}
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Contacts Scrollable List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
          {filteredContacts.length === 0 ? (
            <div
              style={{
                padding: "36px 16px",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: 12.5,
              }}
            >
              <User size={28} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
              <p>No members found.</p>
            </div>
          ) : (
            filteredContacts.map((contact) => {
              const isSelected =
                selectedContact?.email.toLowerCase() ===
                contact.email.toLowerCase();
              const unread = unreadCounts[contact.email] || 0;
              const lastMsg = lastMessages[contact.email.toLowerCase()];
              const isOnline = contact.online ?? true; // Default to online for active team environment

              return (
                <div
                  key={contact.email}
                  onClick={() => setSelectedContact(contact)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    borderRadius: "var(--radius-xs)",
                    cursor: "pointer",
                    marginBottom: 4,
                    transition: "var(--transition)",
                    background: isSelected
                      ? "rgba(255, 138, 31, 0.12)"
                      : "transparent",
                    border: isSelected
                      ? "1px solid rgba(255, 138, 31, 0.35)"
                      : "1px solid transparent",
                  }}
                  className="contact-item"
                >
                  {/* Avatar with status indicator */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div
                      className="avatar"
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "10px",
                        background: isSelected
                          ? "var(--accent)"
                          : "var(--bg-elevated)",
                        color: isSelected ? "#fff" : "var(--text-primary)",
                        fontWeight: 700,
                        fontSize: 14,
                        border: "1px solid var(--border)",
                      }}
                    >
                      {contact.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    {/* Status Dot */}
                    <span
                      style={{
                        position: "absolute",
                        bottom: -1,
                        right: -1,
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: isOnline ? "var(--success)" : "var(--text-muted)",
                        border: "2px solid var(--bg-secondary)",
                      }}
                      title={isOnline ? "Online" : "Offline"}
                    />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 2,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: isSelected
                            ? "var(--accent-hover)"
                            : "var(--text-primary)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {contact.name}
                      </span>
                      {lastMsg?.createdAt && (
                        <span
                          style={{
                            fontSize: 10,
                            color: "var(--text-muted)",
                            flexShrink: 0,
                          }}
                        >
                          {formatTime(lastMsg.createdAt)}
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 11.5,
                          color: "var(--text-secondary)",
                          margin: 0,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          lineHeight: 1.3,
                        }}
                      >
                        {lastMsg?.message ||
                          (isOnline ? "🟢 Online" : "Offline")}
                      </p>

                      {unread > 0 && (
                        <span
                          style={{
                            background: "var(--accent)",
                            color: "#fff",
                            fontSize: 10,
                            fontWeight: 700,
                            borderRadius: "999px",
                            padding: "1px 6px",
                            minWidth: 18,
                            textAlign: "center",
                            flexShrink: 0,
                          }}
                        >
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          RIGHT PANEL: CONVERSATION VIEW
          ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-primary)",
        }}
      >
        {selectedContact ? (
          <>
            {/* Conversation Header */}
            <div
              style={{
                padding: "14px 20px",
                borderBottom: "1px solid var(--border)",
                background: "var(--bg-card)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ position: "relative" }}>
                  <div
                    className="avatar"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "10px",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      fontWeight: 700,
                      fontSize: 13,
                      color: "var(--accent)",
                    }}
                  >
                    {selectedContact.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span
                    style={{
                      position: "absolute",
                      bottom: -1,
                      right: -1,
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      background: "var(--success)",
                      border: "2px solid var(--bg-card)",
                    }}
                  />
                </div>

                <div>
                  <h4
                    style={{
                      fontSize: 14.5,
                      fontWeight: 700,
                      margin: 0,
                      color: "var(--text-primary)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {selectedContact.name}
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: "var(--success)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "var(--success)",
                          display: "inline-block",
                        }}
                      />
                      Online
                    </span>
                  </h4>
                  <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                    {selectedContact.email}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={() => loadConversation(selectedContact, false)}
                  style={{
                    padding: "4px 10px",
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    color: "var(--text-secondary)",
                  }}
                  title="Refresh chat"
                >
                  <RefreshCw size={12} />
                  <span>Sync</span>
                </button>
              </div>
            </div>

            {/* Conversation Messages Viewport */}
            <div
              style={{
                flex: 1,
                padding: "20px 24px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 14,
                background: "var(--bg-base)",
              }}
            >
              {loadingMessages ? (
                <div
                  style={{
                    margin: "auto",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    fontSize: 12.5,
                  }}
                >
                  <div className="spinner" style={{ margin: "0 auto 10px" }} />
                  Loading conversation…
                </div>
              ) : messages.length === 0 ? (
                <div
                  style={{
                    margin: "auto",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    maxWidth: 320,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 12px",
                      color: "var(--accent)",
                    }}
                  >
                    <MessageSquare size={22} />
                  </div>
                  <h5
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      marginBottom: 6,
                    }}
                  >
                    No messages yet
                  </h5>
                  <p style={{ fontSize: 12, lineHeight: 1.5 }}>
                    Start the conversation with {selectedContact.name}. Direct
                    messages are synced in real-time.
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMine =
                    msg.senderEmail?.toLowerCase() ===
                    currentUser.email?.toLowerCase();
                  const partnerName = selectedContact.name || "Member";
                  const senderDisplay = isMine ? "You" : partnerName;

                  return (
                    <div
                      key={msg.id || idx}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignSelf: isMine ? "flex-end" : "flex-start",
                        maxWidth: "75%",
                      }}
                    >
                      {/* Sender label */}
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: isMine ? "var(--accent)" : "var(--text-secondary)",
                          marginBottom: 3,
                          alignSelf: isMine ? "flex-end" : "flex-start",
                        }}
                      >
                        {senderDisplay}
                      </span>

                      {/* Chat Bubble */}
                      <div
                        style={{
                          padding: "10px 14px",
                          borderRadius: isMine
                            ? "14px 14px 2px 14px"
                            : "14px 14px 14px 2px",
                          background: isMine
                            ? "linear-gradient(135deg, rgba(255, 138, 31, 0.22) 0%, rgba(255, 107, 0, 0.22) 100%)"
                            : "var(--bg-elevated)",
                          border: isMine
                            ? "1px solid rgba(255, 138, 31, 0.45)"
                            : "1px solid var(--border)",
                          color: "var(--text-primary)",
                          fontSize: 13,
                          lineHeight: 1.5,
                          boxShadow: "var(--shadow-sm)",
                          wordBreak: "break-word",
                        }}
                      >
                        <div>{msg.message}</div>
                        <div
                          style={{
                            fontSize: 10,
                            color: isMine
                              ? "rgba(255, 255, 255, 0.65)"
                              : "var(--text-muted)",
                            textAlign: isMine ? "right" : "left",
                            marginTop: 4,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: isMine ? "flex-end" : "flex-start",
                            gap: 4,
                          }}
                        >
                          <span>{formatTime(msg.createdAt)}</span>
                          {isMine && (
                            <span>
                              {msg.read ? (
                                <CheckCheck size={12} color="var(--accent)" />
                              ) : (
                                <Check size={12} />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Conversation Input Form */}
            <form
              onSubmit={handleSendMessage}
              style={{
                padding: "14px 20px",
                borderTop: "1px solid var(--border)",
                background: "var(--bg-card)",
                display: "flex",
                gap: 10,
                alignItems: "center",
              }}
            >
              <input
                ref={inputRef}
                className="form-input"
                style={{
                  flex: 1,
                  height: 42,
                  padding: "0 16px",
                  fontSize: 13,
                  background: "var(--bg-elevated)",
                  borderRadius: "var(--radius-xs)",
                  border: "1px solid var(--border)",
                }}
                placeholder="Type a message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={sending}
                autoFocus
              />

              <button
                type="submit"
                className="btn btn-primary"
                disabled={!inputText.trim() || sending}
                style={{
                  height: 42,
                  padding: "0 20px",
                  fontSize: 13,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  borderRadius: "var(--radius-xs)",
                }}
              >
                {sending ? (
                  <span
                    className="spinner"
                    style={{ width: 14, height: 14, borderWidth: 2 }}
                  />
                ) : (
                  <>
                    <span>Send</span>
                    <Send size={14} />
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <div
            style={{
              margin: "auto",
              textAlign: "center",
              color: "var(--text-muted)",
              padding: 40,
            }}
          >
            <MessageSquare size={36} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
            <h4 style={{ fontSize: 16, color: "var(--text-primary)", marginBottom: 4 }}>
              Select a conversation
            </h4>
            <p style={{ fontSize: 12.5 }}>
              Choose a contact from the left panel to begin chatting.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

