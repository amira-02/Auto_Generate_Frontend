// src/pages/Dashboard.tsx
import { useContext, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../hooks/AuthContext";
import { jwtDecode } from "jwt-decode";
import CalendarView from "../components/DashboardSection/Calendar/CalendarView";
import CreatePostModal from "../components/DashboardSection/Posts/CreatePostModal";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronsLeft, FiChevronsRight } from "react-icons/fi";
import PostsView from "../components/DashboardSection/Posts/PostsView";
import TopicsView from "../components/DashboardSection/Topics/TopicsView";
import TopicDetailView from "../components/DashboardSection/Topics/TopicDetailView";
import ConnectedAccountsView from "../components/DashboardSection/SocialAccounts/ConnectedAccountsView";
import Analytics from "../components/DashboardSection/Analytics/index";
import ExternalTaskModal from "../components/DashboardSection/Notifications/ExternalTaskModal";

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

// ── Analytics is the default nav now
const NAV = [
  { id: "analytics", label: "Analytics", icon: "◈" },
  { id: "topics",    label: "Topics",    icon: "◉" },
  { id: "posts",     label: "Posts",     icon: "◧" },
  { id: "calendar",  label: "Calendar",  icon: "▦" },
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

export default function Dashboard() {
  const { logout, token } = useContext(AuthContext);
  const navigate = useNavigate();

  // ── "analytics" is the default active nav
  const [activeNav,      setActiveNav]      = useState("analytics");
  const [selectedTopic,  setSelectedTopic]  = useState<{ id: number; name: string } | null>(null);
  const [modal,          setModal]          = useState<ModalState>(INITIAL_MODAL);
  const [posts,          setPosts]          = useState<any[]>([]);
  const [loadingPosts,   setLoadingPosts]   = useState(false);
  const [sidebarOpen,    setSidebarOpen]    = useState(true);
  const [externalTaskId, setExternalTaskId] = useState<number | null>(null);

  const fileInputRef  = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  let userEmail = "user@mail.com", userInitial = "U";
  if (token) {
    try {
      const d: any = jwtDecode(token);
      userEmail   = d.email ?? d["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ?? "user@mail.com";
      userInitial = userEmail.charAt(0).toUpperCase();
    } catch {}
  }

  const fetchPosts = async () => {
    if (!token) return;
    setLoadingPosts(true);
    try {
      const res = await fetch(`${API_BASE}/api/posts`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setPosts(await res.json());
    } catch {}
    finally { setLoadingPosts(false); }
  };

  useEffect(() => { fetchPosts(); }, [token]);

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

  // External task → open CreatePostModal pre-filled
  const handleExternalTaskAssigned = (data: {
    postId: number; topicId: number;
    description: string; scheduledAt: string; externalTaskId: number;
  }) => {
    setExternalTaskId(null);
    setModal({
      ...INITIAL_MODAL,
      open:         true,
      topicId:      data.topicId,
      topic:        data.description,
      scheduledAt:  data.scheduledAt,
      scheduleType: "schedule",
      postId:       data.postId,
    });
  };

  const navItemStyle = (active: boolean): React.CSSProperties => ({
    display: "flex", alignItems: "center", gap: sidebarOpen ? 10 : 0,
    padding: "8px", justifyContent: sidebarOpen ? "flex-start" : "center",
    borderRadius: 10, border: "none",
    background: active ? "#f0f0fe" : "transparent",
    color: active ? "#6366f1" : "#64748b",
    fontWeight: active ? 600 : 400, fontSize: 13,
    cursor: "pointer", transition: "all .15s", width: "100%",
  });

  const iconStyle = (active: boolean): React.CSSProperties => ({
    width: 30, height: 30, borderRadius: 9, flexShrink: 0,
    background: active ? "#6366f1" : "#f1f5f9",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 13, color: active ? "#fff" : "#94a3b8",
  });

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#f8f9fb", fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── Sidebar ── */}
      <motion.aside initial={false} animate={{ width: sidebarOpen ? 232 : 64 }} transition={{ duration: 0.25, ease: "easeInOut" }}
        style={{ flexShrink: 0, background: "#fff", borderRadius: 16, margin: "16px 0 16px 16px", border: "1px solid #f0f0f0", boxShadow: "0 1px 6px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", padding: "20px 12px", gap: 4, overflow: "hidden" }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, justifyContent: sidebarOpen ? "flex-start" : "center" }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 15, fontWeight: 700 }}>A</div>
          {sidebarOpen && <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.3px", whiteSpace: "nowrap" }}>AutoGenerate</span>}
          <IconBtn onClick={() => setSidebarOpen(!sidebarOpen)} title={sidebarOpen ? "Collapse" : "Expand"}>
            {sidebarOpen ? <FiChevronsLeft size={16} /> : <FiChevronsRight size={16} />}
          </IconBtn>
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
                  {active && <div style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: "#6366f1" }} />}
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
            <div style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>{userInitial}</div>
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
      <main style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, padding: "20px 24px", overflow: "auto" }}>
          <AnimatePresence mode="wait">

            {/* ✅ Analytics is default — includes NotificationBell + Overview */}
            {activeNav === "analytics" && (
              <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Analytics onExternalTask={(id) => setExternalTaskId(id)} />
              </motion.div>
            )}

            {activeNav === "topics" && !selectedTopic && (
              <motion.div key="topics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <TopicsView onSelectTopic={(id, name) => setSelectedTopic({ id, name })} />
              </motion.div>
            )}
            {activeNav === "topics" && selectedTopic && (
              <motion.div key="topic-detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <TopicDetailView topicId={selectedTopic.id} topicName={selectedTopic.name} onBack={() => setSelectedTopic(null)} />
              </motion.div>
            )}

            {activeNav === "posts" && (
              <motion.div key="posts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <PostsView />
              </motion.div>
            )}

            {activeNav === "calendar" && (
              <motion.div key="calendar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: "calc(100vh - 130px)" }}>
                <CalendarView posts={posts} token={token ?? ""} apiBase={API_BASE} />
              </motion.div>
            )}

            {activeNav === "accounts" && (
              <motion.div key="accounts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ConnectedAccountsView />
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
    </div>
  );
}