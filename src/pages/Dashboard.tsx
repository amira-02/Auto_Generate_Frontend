// src/pages/Dashboard.tsx
import { useContext, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../hooks/AuthContext";
import { ClientContext } from "../hooks/ClientContext";
import type { Client } from "../hooks/ClientContext";
import { jwtDecode } from "jwt-decode";
import CalendarView from "../components/DashboardSection/Calendar/CalendarView";
import CreatePostModal from "../components/DashboardSection/Posts/CreatePostModal";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiChevronsLeft, FiChevronsRight, FiHome,
  FiChevronDown, FiCheck, FiPlus, FiX,
} from "react-icons/fi";
import PostsView from "../components/DashboardSection/Posts/PostsView";
import TopicsView from "../components/DashboardSection/Topics/TopicsView";
import TopicDetailView from "../components/DashboardSection/Topics/TopicDetailView";
import ConnectedAccountsView from "../components/DashboardSection/SocialAccounts/ConnectedAccountsView";
import Analytics from "../components/DashboardSection/Analytics/index";
import ExternalTaskModal from "../components/DashboardSection/Notifications/ExternalTaskModal";
import BriefsView from "../components/DashboardSection/Briefs/BriefsView";
import TeamView from "../components/DashboardSection/Team/TeamView";
import MyTasksView from "../components/DashboardSection/Team/MyTasksView";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://localhost:7079";

type Step = "form" | "generating" | "preview";
type CaptionLength = "short" | "medium" | "long";
type Tone = "professional" | "casual" | "funny" | "inspirational";
type ScheduleType = "now" | "schedule";

type ModalState = {
  open: boolean; step: Step; topic: string; hashtags: string;
  captionLength: CaptionLength; tone: Tone; file: File | null;
  fileName: string; fileContent: string; selectedPlatforms: string[];
  scheduleType: ScheduleType; scheduledAt: string; generatedContent: string;
  generatedImage: string; loading: boolean; error: string; postId: number;
  uploadedImages: string[]; uploadedVideo: string | null;
  scheduleDate?: string; scheduleTime?: string; success?: string; topicId?: number;
};

const PLATFORMS = [
  { id: "linkedin",  label: "LinkedIn",  color: "#0077b5", icon: "💼" },
  { id: "twitter",   label: "Twitter/X", color: "#1da1f2", icon: "𝕏"  },
  { id: "instagram", label: "Instagram", color: "#e1306c", icon: "📸" },
  { id: "facebook",  label: "Facebook",  color: "#1877f2", icon: "📘" },
  { id: "tiktok",    label: "TikTok",    color: "#010101", icon: "🎵" },
  { id: "threads",   label: "Threads",   color: "#000000", icon: "🧵" },
];

const INITIAL_MODAL: ModalState = {
  open: false, step: "form", topic: "", hashtags: "", captionLength: "medium",
  tone: "professional", file: null, fileName: "", fileContent: "",
  selectedPlatforms: [], scheduleType: "now", scheduledAt: "",
  generatedContent: "", generatedImage: "", loading: false, error: "",
  postId: 0, uploadedImages: [], uploadedVideo: null,
};

const NAV = [
  { id: "analytics", label: "Analytics",     icon: "◈" },
  { id: "topics",    label: "Topics",        icon: "◉" },
  // { id: "posts",     label: "Posts",         icon: "◧" },
  { id: "calendar",  label: "Calendar",      icon: "▦" },
  { id: "briefs",    label: "Briefs Trello", icon: "🟦" },
  { id: "team",      label: "Équipe",        icon: "👥" },
  { id: "mytasks",   label: "Mes tâches",    icon: "✅" },
];

const MANAGE = [
  { id: "accounts", label: "Accounts", icon: "⊕" },
  { id: "settings", label: "Settings", icon: "⊙" },
];

function IconBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }} onClick={onClick} title={title}
      style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid #f0f0f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", flexShrink: 0 }}>
      {children}
    </motion.button>
  );
}

// ── Client avatar color palette ───────────────────────────────────────────────
const CLIENT_COLORS = ["#dc2626", "#7c3aed", "#0077b5", "#059669", "#d97706", "#dc2626", "#0891b2"];
function clientColor(id: number) { return CLIENT_COLORS[id % CLIENT_COLORS.length]; }

// ── Client Switcher ───────────────────────────────────────────────────────────
function ClientSwitcher({ onCreate }: { onCreate: () => void }) {
  const { clients, selectedClient, selectClient } = useContext(ClientContext);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const color = selectedClient ? clientColor(selectedClient.id) : "#dc2626";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <motion.button
        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 10, padding: "7px 12px 7px 8px",
          background: "#f8f9fb", border: "1.5px solid #f0f0f0", borderRadius: 12,
          cursor: "pointer", fontFamily: "inherit",
        }}
      >
        <div style={{
          width: 30, height: 30, borderRadius: 9, background: color, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 13, fontWeight: 700,
        }}>
          {selectedClient ? selectedClient.name.charAt(0).toUpperCase() : "?"}
        </div>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>
            {selectedClient?.name ?? "No client"}
          </div>
          {selectedClient?.industry && (
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{selectedClient.industry}</div>
          )}
        </div>
        <FiChevronDown size={13} color="#94a3b8" style={{ marginLeft: 4, flexShrink: 0 }} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            style={{
              position: "absolute", top: "calc(100% + 8px)", left: 0,
              width: 270, background: "#fff", borderRadius: 14,
              border: "1px solid #f0f0f0",
              boxShadow: "0 12px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
              zIndex: 200, overflow: "hidden",
            }}
          >
            {clients.length > 0 && (
              <div style={{ padding: "6px 6px 4px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 8px 8px" }}>
                  Switch client
                </div>
                {clients.map(c => {
                  const cc = clientColor(c.id);
                  const active = selectedClient?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => { selectClient(c); setOpen(false); }}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 10,
                        padding: "9px 10px", borderRadius: 10, border: "none",
                        background: active ? "#fef2f2" : "transparent",
                        cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                        transition: "background .12s",
                      }}
                      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "#f8f9fb"; }}
                      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: 9, background: cc, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontSize: 13, fontWeight: 700,
                      }}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {c.name}
                        </div>
                        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>
                          {c.accountsCount} accounts · {c.postsCount} posts
                        </div>
                      </div>
                      {active && <FiCheck size={14} color="#dc2626" style={{ flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
            )}

            <div style={{ borderTop: clients.length > 0 ? "1px solid #f5f5f5" : "none", padding: "6px" }}>
              <button
                onClick={() => { setOpen(false); onCreate(); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 10px", borderRadius: 10, border: "none",
                  background: "transparent", cursor: "pointer",
                  fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: "#dc2626",
                  transition: "background .12s",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#fef2f2"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 9, background: "#fef2f2", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <FiPlus size={14} color="#dc2626" />
                </div>
                Add new client
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Create Client Modal ───────────────────────────────────────────────────────
function CreateClientModal({ token, onClose, onCreated }: {
  token: string | null;
  onClose: () => void;
  onCreated: (c: Client) => void;
}) {
  const [form, setForm] = useState({ name: "", industry: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError("Name is required"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch(`${API_BASE}/api/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: form.name.trim(), industry: form.industry || null, description: form.description || null }),
      });
      if (!res.ok) throw new Error(await res.text());
      const created: Client = await res.json();
      onCreated(created);
    } catch (e: any) {
      setError(e.message || "Failed to create client");
    } finally { setSaving(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
        backdropFilter: "blur(8px)", display: "flex", alignItems: "center",
        justifyContent: "center", zIndex: 1000, padding: 20,
      }}
    >
      <motion.div
        initial={{ scale: 0.94, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.94, y: 16, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 20, width: "100%", maxWidth: 460,
          boxShadow: "0 32px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ padding: "22px 24px 18px", borderBottom: "1px solid #f5f5f5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>New Client</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Add a client to manage their content</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, background: "#f8f9fb", border: "1px solid #f0f0f0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
            <FiX size={14} />
          </button>
        </div>

        <div style={{ padding: "22px 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { key: "name",        label: "Client Name",         placeholder: "Acme Corp",         required: true  },
            { key: "industry",    label: "Industry",            placeholder: "Technology, Retail…", required: false },
            { key: "description", label: "Short Description",   placeholder: "What they do…",     required: false },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {f.label} {f.required && <span style={{ color: "#ef4444" }}>*</span>}
              </label>
              <input
                value={(form as any)[f.key]}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 13, outline: "none", boxSizing: "border-box", background: "#fafafa", transition: "border .15s" }}
                onFocus={e => { e.target.style.borderColor = "#dc2626"; e.target.style.background = "#fff"; }}
                onBlur={e => { e.target.style.borderColor = "#e5e7eb"; e.target.style.background = "#fafafa"; }}
              />
            </div>
          ))}

          {error && (
            <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#dc2626", fontWeight: 500 }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: 11, border: "1.5px solid #f0f0f0", background: "#f8f9fb", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !form.name.trim()}
              style={{
                flex: 2, padding: "12px", borderRadius: 11, border: "none",
                background: saving || !form.name.trim() ? "#e5e7eb" : "linear-gradient(135deg,#dc2626,#dc2626)",
                color: saving || !form.name.trim() ? "#9ca3af" : "#fff",
                fontSize: 13, fontWeight: 700, cursor: saving || !form.name.trim() ? "not-allowed" : "pointer",
                fontFamily: "inherit", boxShadow: saving || !form.name.trim() ? "none" : "0 4px 16px #dc262640",
              }}
            >
              {saving ? "Creating…" : "Create Client"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Trello Link Modal ─────────────────────────────────────────────────────────
function TrelloLinkModal({ client, token, onClose, onSaved }: {
  client: Client;
  token: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [boardId,      setBoardId]      = useState(client.trelloBoardId ?? "");
  const [callbackUrl,  setCallbackUrl]  = useState(`${API_BASE}/api/trello/webhook`);
  const [saving,       setSaving]       = useState(false);
  const [registering,  setRegistering]  = useState(false);
  const [saveMsg,      setSaveMsg]      = useState("");
  const [regMsg,       setRegMsg]       = useState("");
  const [saveError,    setSaveError]    = useState("");
  const [regError,     setRegError]     = useState("");

  const handleSave = async () => {
    setSaving(true); setSaveMsg(""); setSaveError("");
    try {
      const res = await fetch(`${API_BASE}/api/clients/${client.id}/trello-board`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ boardId: boardId.trim() || null }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSaveMsg("Board ID saved!");
      onSaved();
    } catch (e: any) {
      setSaveError(e.message || "Save failed");
    } finally { setSaving(false); }
  };

  const handleRegisterWebhook = async () => {
    if (!boardId.trim()) { setRegError("Enter a Board ID first"); return; }
    setRegistering(true); setRegMsg(""); setRegError("");
    try {
      const res = await fetch(`${API_BASE}/api/trello/register-webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ boardId: boardId.trim(), callbackUrl: callbackUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? JSON.stringify(data));
      setRegMsg("Webhook registered! Trello will now send events to your backend.");
    } catch (e: any) {
      setRegError(e.message || "Registration failed");
    } finally { setRegistering(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: "1.5px solid #e5e7eb", fontSize: 13, outline: "none",
    boxSizing: "border-box", background: "#fafafa", transition: "border .15s",
    fontFamily: "inherit",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}
    >
      <motion.div
        initial={{ scale: 0.94, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.94, y: 16, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        onClick={e => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 480, boxShadow: "0 32px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05)", overflow: "hidden" }}
      >
        {/* Header */}
        <div style={{ padding: "22px 24px 18px", borderBottom: "1px solid #f5f5f5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🟦</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Link Trello Board</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{client.name}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, background: "#f8f9fb", border: "1px solid #f0f0f0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
            <FiX size={14} />
          </button>
        </div>

        <div style={{ padding: "22px 24px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Board ID section */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Trello Board ID
            </label>
            <input
              value={boardId}
              onChange={e => setBoardId(e.target.value)}
              placeholder="e.g. 5d4e8f3a2b1c9d0e7f6a5b4c"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = "#1d4ed8"; e.target.style.background = "#fff"; }}
              onBlur={e => { e.target.style.borderColor = "#e5e7eb"; e.target.style.background = "#fafafa"; }}
            />
            <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>
              Find your Board ID in the Trello URL: <br />
              <code style={{ background: "#f1f5f9", padding: "1px 5px", borderRadius: 4, fontSize: 11 }}>
                trello.com/b/<strong>BOARD_ID</strong>/board-name
              </code>
            </div>
            {saveError && <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#dc2626" }}>⚠️ {saveError}</div>}
            {saveMsg  && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#16a34a" }}>✓ {saveMsg}</div>}
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: saving ? "#e5e7eb" : "#1d4ed8", color: saving ? "#9ca3af" : "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}
            >
              {saving ? "Saving…" : "Save Board ID"}
            </button>
          </div>

          {/* Divider */}
          <div style={{ borderTop: "1px solid #f5f5f5", paddingTop: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 14 }}>
              Register Trello Webhook
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 12, lineHeight: 1.5 }}>
              Trello will call this URL when a card is created on the board. Requires <code style={{ background: "#f1f5f9", padding: "1px 5px", borderRadius: 4 }}>Trello:ApiKey</code> + <code style={{ background: "#f1f5f9", padding: "1px 5px", borderRadius: 4 }}>Trello:Token</code> in appsettings.json, and your backend must be publicly accessible (ngrok or deployed URL).
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input
                value={callbackUrl}
                onChange={e => setCallbackUrl(e.target.value)}
                placeholder="https://your-backend.ngrok.io/api/trello/webhook"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = "#1d4ed8"; e.target.style.background = "#fff"; }}
                onBlur={e => { e.target.style.borderColor = "#e5e7eb"; e.target.style.background = "#fafafa"; }}
              />
              {regError && <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#dc2626" }}>⚠️ {regError}</div>}
              {regMsg   && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#16a34a" }}>✓ {regMsg}</div>}
              <button
                onClick={handleRegisterWebhook}
                disabled={registering}
                style={{ padding: "10px 16px", borderRadius: 10, border: "1.5px solid #1d4ed8", background: "transparent", color: registering ? "#94a3b8" : "#1d4ed8", fontSize: 13, fontWeight: 700, cursor: registering ? "not-allowed" : "pointer", fontFamily: "inherit" }}
              >
                {registering ? "Registering…" : "Register Webhook with Trello"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Trello Assign Modal ───────────────────────────────────────────────────────
function TrelloAssignModal({ title, briefId, token, onClose, onAssigned }: {
  title: string; briefId: number; token: string | null;
  onClose: () => void; onAssigned: () => void;
}) {
  const { clients } = useContext(ClientContext);
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [loading,    setLoading]    = useState(false);
  const [msg,        setMsg]        = useState<string | null>(null);
  const [briefInfo,  setBriefInfo]  = useState<{ sheetUrl: string | null } | null>(null);

  // Fetch brief to know if it has a sheet URL
  useEffect(() => {
    if (!briefId || !token) return;
    fetch(`${API_BASE}/api/trello/briefs/${briefId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setBriefInfo({ sheetUrl: d.sheetUrl ?? null }))
      .catch(() => {});
  }, [briefId, token]);

  const hasSheet = !!briefInfo?.sheetUrl;

  const handleAssign = async () => {
    if (!selectedId || !token) return;
    setLoading(true); setMsg(null);
    try {
      // 1. Link brief to the chosen client
      const r1 = await fetch(`${API_BASE}/api/trello/briefs/${briefId}/assign`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: selectedId }),
      });
      if (!r1.ok) { setMsg("⚠️ Erreur lors de l'assignation"); setLoading(false); return; }

      // 2. If brief has a sheet URL, trigger sync
      if (hasSheet) {
        const r2 = await fetch(`${API_BASE}/api/sheets/sync/${selectedId}`, {
          method: "POST", headers: { Authorization: `Bearer ${token}` },
        });
        const data = await r2.json();
        setMsg(r2.ok
          ? `✅ Brief assigné — ${data.created} post(s) importé(s) !`
          : `✅ Brief assigné (sync : ${data.message})`
        );
      } else {
        setMsg("✅ Brief assigné au client !");
      }

      setTimeout(() => { onAssigned(); onClose(); }, 1500);
    } catch { setMsg("⚠️ Erreur réseau"); }
    finally { setLoading(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}
    >
      <motion.div
        initial={{ scale: 0.94, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.94, y: 16, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        onClick={e => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 460, boxShadow: "0 32px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05)", overflow: "hidden" }}
      >
        {/* Header */}
        <div style={{ padding: "22px 24px 18px", borderBottom: "1px solid #f5f5f5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
              {hasSheet ? "📊" : "🟦"}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Assigner au client</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, background: "#f8f9fb", border: "1px solid #f0f0f0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
            <FiX size={14} />
          </button>
        </div>

        <div style={{ padding: "22px 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {hasSheet ? (
            <div style={{ fontSize: 12, color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 14px" }}>
              📊 Planning Google Sheet détecté — les posts seront importés automatiquement
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "#64748b", background: "#f8f9fb", border: "1px solid #f0f0f0", borderRadius: 10, padding: "10px 14px" }}>
              🟦 Brief Trello reçu — tu pourras lier un planning depuis la vue Briefs.
            </div>
          )}

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Choisir le client <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value ? Number(e.target.value) : "")}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 13, outline: "none", background: "#fafafa", fontFamily: "inherit", cursor: "pointer" }}
            >
              <option value="">-- Sélectionner un client --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {msg && (
            <div style={{ background: msg.startsWith("✅") ? "#f0fdf4" : "#fef2f2", border: `1px solid ${msg.startsWith("✅") ? "#bbf7d0" : "#fecaca"}`, borderRadius: 10, padding: "10px 14px", fontSize: 12, color: msg.startsWith("✅") ? "#16a34a" : "#dc2626", fontWeight: 500 }}>
              {msg}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: 11, border: "1.5px solid #f0f0f0", background: "#f8f9fb", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              Annuler
            </button>
            <button
              onClick={handleAssign}
              disabled={loading || !selectedId}
              style={{ flex: 2, padding: "12px", borderRadius: 11, border: "none", background: loading || !selectedId ? "#e5e7eb" : "#16a34a", color: loading || !selectedId ? "#9ca3af" : "#fff", fontSize: 13, fontWeight: 700, cursor: loading || !selectedId ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: loading || !selectedId ? "none" : "0 4px 16px #16a34a40" }}
            >
              {loading ? "En cours…" : hasSheet ? "Importer les posts" : "Assigner le brief"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── No Clients Empty State ────────────────────────────────────────────────────
function NoClientsState({ onCreateClient }: { onCreateClient: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "70vh", textAlign: "center", padding: "0 40px" }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🏢</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>No clients yet</div>
        <div style={{ fontSize: 14, color: "#64748b", marginBottom: 32, maxWidth: 360 }}>
          Create your first client to start managing their social media content, accounts, and posts.
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={onCreateClient}
          style={{
            padding: "13px 28px", borderRadius: 14, border: "none",
            background: "linear-gradient(135deg,#dc2626,#dc2626)",
            color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 6px 20px #dc262640", display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit",
          }}
        >
          <FiPlus size={16} /> Create First Client
        </motion.button>
      </motion.div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { logout, token } = useContext(AuthContext);
  const { clients, selectedClient, selectClient, loading: clientsLoading, reload: reloadClients } = useContext(ClientContext);
  const navigate = useNavigate();

  const [activeNav,      setActiveNav]      = useState("analytics");
  const [selectedTopic,  setSelectedTopic]  = useState<{ id: number; name: string } | null>(null);
  const [modal,          setModal]          = useState<ModalState>(INITIAL_MODAL);
  const [posts,          setPosts]          = useState<any[]>([]);
  const [, setLoadingPosts] = useState(false);
  const [sidebarOpen,    setSidebarOpen]    = useState(true);
  const [externalTaskId, setExternalTaskId] = useState<number | null>(null);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [showTrelloModal,  setShowTrelloModal]  = useState(false);
  const [trelloNotif,      setTrelloNotif]      = useState<{ title: string; briefId: number } | null>(null);
  const [showProfile,      setShowProfile]      = useState(false);

  const fileInputRef  = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  let userEmail = "user@mail.com", userInitial = "U", userRole = "Editor";
  if (token) {
    try {
      const d: any = jwtDecode(token);
      userEmail   = d.email ?? d["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ?? "user@mail.com";
      userRole    = d.role
                 ?? d["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
                 ?? "Editor";
      userInitial = userEmail.charAt(0).toUpperCase();
    } catch {}
  }

  const isTeamMember = userRole === "Graphiste" || userRole === "Redacteur" || userRole === "ChefVisuel" || userRole === "ChefRedac" || userRole === "ChefEquipe";

  const roleLabel = userRole === "Graphiste"  ? "🎨 Graphiste"
                  : userRole === "Redacteur"  ? "✍️ Rédacteur"
                  : userRole === "ChefVisuel" ? "👑 Chef Visuel"
                  : userRole === "ChefRedac"  ? "👑 Chef Rédaction"
                  : userRole === "ChefEquipe" ? "👑 Chef d'équipe"
                  : userRole ?? "";

  // ── Team member / Chef d'équipe: show only their task view ───────────────
  if (isTeamMember) {
    const roleColor =
      userRole === "Graphiste"  ? "#7c3aed" :
      userRole === "Redacteur"  ? "#0ea5e9" :
      userRole === "ChefVisuel" || userRole === "ChefRedac" || userRole === "ChefEquipe"
        ? "#e11d48" : "#64748b";

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden",
        background: "#fff", fontFamily: "'DM Sans', system-ui, sans-serif" }}>

        {/* ── Top bar ── */}
        <div style={{ height: 52, background: "#fff", border: "1px solid #ebebf0",
          borderRadius: 14, margin: "12px 16px 0",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 20px", flexShrink: 0 }}>

          {/* Left — role badge */}
          <span style={{ fontSize: 11, color: "#64748b",
            background: "#f4f5f7", padding: "5px 14px",
            borderRadius: 100, border: "1px solid #e8eaf0", letterSpacing: "0.02em" }}>
            {roleLabel}
          </span>

          {/* Right — avatar + logout */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

            {/* Clickable avatar → profile */}
            <button onClick={() => setShowProfile(true)}
              style={{ display: "flex", alignItems: "center", gap: 10,
                background: "none", border: "none", cursor: "pointer",
                padding: "4px 8px", borderRadius: 10,
                transition: "background .15s", fontFamily: "inherit" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f4f5f7")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}>
              <div style={{ width: 32, height: 32, borderRadius: "50%",
                background: "#f1f5f9", border: "1.5px solid #e2e8f0",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#475569", fontSize: 12, flexShrink: 0 }}>
                {userInitial}
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 12, color: "#0f172a", lineHeight: 1.2 }}>
                  {userEmail.split("@")[0]}
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>{userEmail}</div>
              </div>
            </button>

            <div style={{ width: 1, height: 22, background: "#f0f0f5" }} />

            {/* Logout icon */}
            <button onClick={() => { logout(); navigate("/"); }}
              title="Déconnexion"
              style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid #ebebf0",
                background: "#fff", display: "flex", alignItems: "center",
                justifyContent: "center", cursor: "pointer", color: "#94a3b8",
                transition: "all .15s" }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "#fff1f2"; el.style.color = "#e11d48";
                el.style.borderColor = "#fecdd3";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "#fff"; el.style.color = "#94a3b8";
                el.style.borderColor = "#ebebf0";
              }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Workspace ── */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", boxSizing: "border-box" }}>
          <MyTasksView token={token} role={userRole} />
        </div>

        {/* ── Profile modal ── */}
        {showProfile && (
          <div onClick={() => setShowProfile(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 2000, padding: "24px", backdropFilter: "blur(4px)" }}>
            <div onClick={e => e.stopPropagation()}
              style={{ width: 420, borderRadius: 24, background: "#fff",
                border: "1.5px solid #ebebf0", overflow: "hidden",
                fontFamily: "'DM Sans', system-ui, sans-serif" }}>

              {/* Header band */}
              <div style={{ height: 80, background: "linear-gradient(135deg, #f8f9fc, #f0f1f5)",
                borderBottom: "1px solid #f0f0f5", position: "relative",
                display: "flex", alignItems: "flex-end", padding: "0 28px 0" }}>
                <div style={{ position: "absolute", top: 14, right: 14 }}>
                  <button onClick={() => setShowProfile(false)}
                    style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #ebebf0",
                      background: "#fff", cursor: "pointer", color: "#94a3b8", fontSize: 16,
                      display: "flex", alignItems: "center", justifyContent: "center" }}>
                    ✕
                  </button>
                </div>
              </div>

              {/* Avatar overlapping */}
              <div style={{ padding: "0 28px", marginTop: -28 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%",
                  background: "#fff", border: "3px solid #fff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, color: "#475569",
                  background: "#f1f5f9" as any }}>
                  {userInitial}
                </div>
              </div>

              {/* Info */}
              <div style={{ padding: "12px 28px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 18, color: "#0f172a", lineHeight: 1.2, marginBottom: 4 }}>
                    {userEmail.split("@")[0]}
                  </div>
                  <span style={{ fontSize: 11, color: "#64748b",
                    background: "#f4f5f7", padding: "3px 10px",
                    borderRadius: 100, border: "1px solid #e8eaf0" }}>
                    {roleLabel}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { label: "Email",  value: userEmail  },
                    { label: "Rôle",   value: userRole   },
                  ].map(row => (
                    <div key={row.label} style={{ display: "flex", alignItems: "center",
                      padding: "12px 16px", borderRadius: 12,
                      background: "#f8f9fc", border: "1px solid #f0f0f5" }}>
                      <div style={{ fontSize: 11, color: "#94a3b8", width: 70,
                        textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>
                        {row.label}
                      </div>
                      <div style={{ fontSize: 13, color: "#1e293b" }}>{row.value}</div>
                    </div>
                  ))}
                </div>

                <button onClick={() => { logout(); navigate("/"); }}
                  style={{ width: "100%", padding: "12px", borderRadius: 12, border: "none",
                    background: "#fff1f2", color: "#e11d48", fontSize: 13,
                    cursor: "pointer", fontFamily: "inherit", display: "flex",
                    alignItems: "center", justifyContent: "center", gap: 8,
                    border: "1px solid #fecdd3" as any, transition: "background .15s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fecdd3")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#fff1f2")}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Se déconnecter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const fetchPosts = async () => {
    if (!token) return;
    setLoadingPosts(true);
    try {
      const clientParam = selectedClient ? `?clientId=${selectedClient.id}` : "";
      const res = await fetch(`${API_BASE}/api/posts${clientParam}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setPosts(await res.json());
    } catch {}
    finally { setLoadingPosts(false); }
  };

  useEffect(() => { fetchPosts(); }, [token, selectedClient?.id]);

  // Auto-refresh every 2 minutes — backend sheet sync runs on same interval
  useEffect(() => {
    const id = setInterval(async () => {
      await reloadClients();
      await fetchPosts();
    }, 2 * 60 * 1000);
    return () => clearInterval(id);
  }, [token, selectedClient?.id]);

  // Reset topic selection when client changes
  useEffect(() => { setSelectedTopic(null); }, [selectedClient?.id]);

  const setM           = (patch: Partial<ModalState>) => setModal(m => ({ ...m, ...patch }));
  const closeModal     = () => setModal(m => ({ ...m, open: false }));
  const togglePlatform = (id: string) => setM({
    selectedPlatforms: modal.selectedPlatforms.includes(id)
      ? modal.selectedPlatforms.filter(p => p !== id)
      : [...modal.selectedPlatforms, id],
  });
  const handleFileUpload  = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const r = new FileReader();
    r.onload = ev => setM({ file, fileName: file.name, fileContent: ev.target?.result as string });
    r.readAsText(file);
  };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files) return;
    setM({ uploadedImages: [...modal.uploadedImages, ...Array.from(files).map(f => URL.createObjectURL(f))] });
  };
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setM({ uploadedVideo: URL.createObjectURL(file) });
  };
  const removeImage     = (idx: number) => setM({ uploadedImages: modal.uploadedImages.filter((_, i) => i !== idx) });
  const handlePublish   = async () => { await fetchPosts(); };
  const handleSaveDraft = async () => { await fetchPosts(); };

  const handleExternalTaskAssigned = (data: {
    postId: number; topicId: number;
    description: string; scheduledAt: string; externalTaskId: number;
  }) => {
    setExternalTaskId(null);
    setModal({
      ...INITIAL_MODAL,
      open: true, topicId: data.topicId, topic: data.description,
      scheduledAt: data.scheduledAt, scheduleType: "schedule", postId: data.postId,
    });
  };

  const handleClientCreated = async (c: Client) => {
    await reloadClients();
    selectClient(c);
    setShowCreateClient(false);
  };

  const navItemStyle = (active: boolean): React.CSSProperties => ({
    display: "flex", alignItems: "center", gap: sidebarOpen ? 10 : 0,
    padding: "8px", justifyContent: sidebarOpen ? "flex-start" : "center",
    borderRadius: 10, border: "none",
    background: active ? "#fef2f2" : "transparent",
    color: active ? "#dc2626" : "#64748b",
    fontWeight: active ? 600 : 400, fontSize: 13,
    cursor: "pointer", transition: "all .15s", width: "100%",
  });

  const iconStyle = (active: boolean): React.CSSProperties => ({
    width: 30, height: 30, borderRadius: 9, flexShrink: 0,
    background: active ? "#dc2626" : "#f1f5f9",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 13, color: active ? "#fff" : "#94a3b8",
  });

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#f8f9fb", fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── Sidebar ── */}
      <motion.aside initial={false} animate={{ width: sidebarOpen ? 232 : 64 }} transition={{ duration: 0.25, ease: "easeInOut" }}
        style={{ flexShrink: 0, background: "#fff", borderRadius: 16, margin: "16px 0 16px 16px", border: "1px solid #f0f0f0", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", padding: "20px 12px", gap: 4, overflow: "hidden" }}>

        {/* Brand + action icons */}
        <div style={{ display: "flex", marginBottom: 20, flexDirection: sidebarOpen ? "row" : "column", alignItems: "center", gap: sidebarOpen ? 0 : 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: sidebarOpen ? 1 : undefined }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: "linear-gradient(135deg,#dc2626,#dc2626)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 15, fontWeight: 700 }}>
              A
            </div>
            {sidebarOpen && (
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.3px", whiteSpace: "nowrap" }}>
                AutoGenerate
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: sidebarOpen ? "row" : "column", gap: 4 }}>
            <IconBtn onClick={() => navigate("/")} title="Back to Home"><FiHome size={14} /></IconBtn>
            <IconBtn onClick={() => setSidebarOpen(!sidebarOpen)} title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}>
              {sidebarOpen ? <FiChevronsLeft size={16} /> : <FiChevronsRight size={16} />}
            </IconBtn>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          {sidebarOpen && <p style={{ fontSize: 10, fontWeight: 600, color: "#cbd5e1", letterSpacing: "0.08em", padding: "0 4px 8px", textTransform: "uppercase", margin: 0 }}>Workspace</p>}
          {NAV.map(item => {
            const active = activeNav === item.id;
            return (
              <button key={item.id} onClick={() => { setActiveNav(item.id); if (item.id !== "topics") setSelectedTopic(null); }}
                title={!sidebarOpen ? item.label : undefined} style={navItemStyle(active)}>
                <span style={iconStyle(active)}>{item.icon}</span>
                {sidebarOpen && (<>
                  <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>
                  {active && <div style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: "#dc2626" }} />}
                </>)}
              </button>
            );
          })}

          <div style={{ margin: "10px 0 8px", borderTop: "1px solid #f5f5f5" }} />
          {sidebarOpen && <p style={{ fontSize: 10, fontWeight: 600, color: "#cbd5e1", letterSpacing: "0.08em", padding: "0 4px 8px", textTransform: "uppercase", margin: 0 }}>Manage</p>}
          {MANAGE.map(item => {
            const active = activeNav === item.id;
            return (
              <button key={item.id} onClick={() => setActiveNav(item.id)}
                title={!sidebarOpen ? item.label : undefined} style={navItemStyle(active)}>
                <span style={iconStyle(active)}>{item.icon}</span>
                {sidebarOpen && <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* User */}
        <div style={{ borderTop: "1px solid #f5f5f5", paddingTop: 14, display: "flex", flexDirection: "column", gap: 8, alignItems: sidebarOpen ? "stretch" : "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: sidebarOpen ? "flex-start" : "center" }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, background: "linear-gradient(135deg,#dc2626,#dc2626)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>{userInitial}</div>
            {sidebarOpen && <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userEmail.split("@")[0]}</div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>Content Manager</div>
            </div>}
          </div>
          {sidebarOpen && (
            <button onClick={() => { logout(); navigate("/"); }}
              style={{ padding: "7px 12px", borderRadius: 10, border: "1px solid #f0f0f0", background: "transparent", color: "#94a3b8", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all .15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#fef2f2"; (e.currentTarget as HTMLElement).style.color = "#ef4444"; (e.currentTarget as HTMLElement).style.borderColor = "#fecaca"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#94a3b8"; (e.currentTarget as HTMLElement).style.borderColor = "#f0f0f0"; }}>
              <span>→</span> Sign out
            </button>
          )}
        </div>
      </motion.aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>

        {/* ── Client switcher bar ── */}
        <div style={{
          padding: "12px 24px", background: "#fff",
          borderBottom: "1px solid #f0f0f0",
          display: "flex", alignItems: "center", gap: 14,
          flexShrink: 0, margin: "16px 16px 0",
          borderRadius: "14px 14px 0 0",
          boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
        }}>
          {clientsLoading && !selectedClient ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid #f0f0f0", borderTopColor: "#dc2626" }} />
              <span style={{ fontSize: 13, color: "#94a3b8" }}>Loading clients…</span>
            </div>
          ) : (
            <ClientSwitcher onCreate={() => setShowCreateClient(true)} />
          )}

          {/* Client stats */}
          {selectedClient && (
            <div style={{ display: "flex", gap: 6, marginLeft: "auto", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#f0fdf4", color: "#16a34a" }}>
                {selectedClient.accountsCount} connected
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#f5f3ff", color: "#7c3aed" }}>
                {selectedClient.postsCount} posts
              </span>
              {selectedClient.industry && (
                <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "#f8f9fb", color: "#64748b" }}>
                  {selectedClient.industry}
                </span>
              )}
              <button
                onClick={() => setShowTrelloModal(true)}
                style={{
                  fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, border: "none",
                  background: selectedClient.trelloBoardId ? "#eff6ff" : "#f8f9fb",
                  color: selectedClient.trelloBoardId ? "#1d4ed8" : "#64748b",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                }}
              >
                🟦 {selectedClient.trelloBoardId ? "Trello linked" : "Link Trello"}
              </button>

              {/* Auto-sync indicator — shows last sync time */}
              {selectedClient.sheetUrl && selectedClient.sheetLastSyncAt && (
                <span style={{ fontSize: 10, color: "#16a34a", fontWeight: 600 }}>
                  ✅ Sync: {new Date(selectedClient.sheetLastSyncAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Content area ── */}
        <div style={{ flex: 1, overflow: "auto", margin: "0 16px 16px", background: "#fff", borderRadius: "0 0 14px 14px", border: "1px solid #f0f0f0", borderTop: "none" }}>
          {/* No client state */}
          {!clientsLoading && clients.length === 0 ? (
            <NoClientsState onCreateClient={() => setShowCreateClient(true)} />
          ) : (
            <div style={{ padding: "20px 24px" }}>
              <AnimatePresence mode="wait">

                {activeNav === "analytics" && (
                  <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <Analytics key={selectedClient?.id ?? 0} clientId={selectedClient?.id ?? 0} onExternalTask={(id) => setExternalTaskId(id)} onTrelloTask={(title, referenceId) => setTrelloNotif({ title, briefId: Number(referenceId) })} />
                  </motion.div>
                )}

                {activeNav === "topics" && !selectedTopic && (
                  <motion.div key="topics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <TopicsView key={selectedClient?.id ?? 0} clientId={selectedClient?.id ?? 0} onSelectTopic={(id, name) => setSelectedTopic({ id, name })} />
                  </motion.div>
                )}
                {activeNav === "topics" && selectedTopic && (
                  <motion.div key="topic-detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <TopicDetailView topicId={selectedTopic.id} topicName={selectedTopic.name} onBack={() => setSelectedTopic(null)} />
                  </motion.div>
                )}

                {/* {activeNav === "posts" && (
                  <motion.div key="posts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <PostsView key={selectedClient?.id ?? 0} clientId={selectedClient?.id ?? 0} />
                  </motion.div>
                )} */}

                {activeNav === "calendar" && (
                  <motion.div key="calendar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: "calc(100vh - 180px)" }}>
                    <CalendarView key={selectedClient?.id ?? 0} posts={posts} token={token ?? ""} apiBase={API_BASE} clientId={selectedClient?.id ?? 0} />
                  </motion.div>
                )}

                {activeNav === "briefs" && (
                  <motion.div key="briefs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <BriefsView key={selectedClient?.id ?? 0} clientId={selectedClient?.id ?? 0} token={token} />
                  </motion.div>
                )}

                {activeNav === "accounts" && (
                  <motion.div key="accounts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <ConnectedAccountsView key={selectedClient?.id ?? 0} clientId={selectedClient?.id ?? 0} />
                  </motion.div>
                )}

                {activeNav === "team" && (
                  <motion.div key="team" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <TeamView token={token} role={userRole} />
                  </motion.div>
                )}

                {activeNav === "mytasks" && (
                  <motion.div key="mytasks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <MyTasksView token={token} />
                  </motion.div>
                )}

                {activeNav === "settings" && (
                  <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh" }}>
                    <div style={{ fontSize: 48, marginBottom: 14 }}>⚙️</div>
                    <p style={{ fontSize: 15, fontWeight: 500, color: "#64748b", margin: 0 }}>Settings coming soon</p>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <CreatePostModal
        modal={modal} setM={setM} closeModal={closeModal}
        handlePublish={handlePublish} handleSaveDraft={handleSaveDraft}
        handleFileUpload={handleFileUpload} handleImageUpload={handleImageUpload}
        handleVideoUpload={handleVideoUpload} togglePlatform={togglePlatform}
        removeImage={removeImage} fileInputRef={fileInputRef}
        imageInputRef={imageInputRef} videoInputRef={videoInputRef}
        PLATFORMS={PLATFORMS}
      />

      <ExternalTaskModal
        taskId={externalTaskId}
        token={token}
        onClose={() => setExternalTaskId(null)}
        onAssigned={handleExternalTaskAssigned}
      />

      <AnimatePresence>
        {showCreateClient && (
          <CreateClientModal
            token={token}
            onClose={() => setShowCreateClient(false)}
            onCreated={handleClientCreated}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTrelloModal && selectedClient && (
          <TrelloLinkModal
            client={selectedClient}
            token={token}
            onClose={() => setShowTrelloModal(false)}
            onSaved={() => { reloadClients(); setShowTrelloModal(false); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {trelloNotif && (
          <TrelloAssignModal
            title={trelloNotif.title}
            briefId={trelloNotif.briefId}
            token={token}
            onClose={() => setTrelloNotif(null)}
            onAssigned={async () => { await reloadClients(); await fetchPosts(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
