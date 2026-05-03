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
  { id: "dashboard", label: "Overview",  icon: "◈" },
  { id: "topics",    label: "Topics",    icon: "◉" },
  { id: "posts",     label: "Posts",     icon: "◧" },
  { id: "calendar",  label: "Calendar",  icon: "▦" },
  { id: "analytics", label: "Analytics", icon: "◎" },
];

const MANAGE = [
  { id: "accounts", label: "Accounts", icon: "⊕" },
  { id: "settings", label: "Settings", icon: "⊙" },
];

function StatCard({ label, value, accent }: { label: string; value: number | string; accent: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: 16, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", fontFamily: "'DM Mono', monospace", letterSpacing: "-1px" }}>{value}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: accent }} />
        <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>{label}</span>
      </div>
    </motion.div>
  );
}

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

  const [activeNav, setActiveNav]         = useState("dashboard");
  const [selectedTopic, setSelectedTopic] = useState<{ id: number; name: string } | null>(null);
  const [modal, setModal]                 = useState<ModalState>(INITIAL_MODAL);
  const [posts, setPosts]                 = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts]   = useState(false);
  const [sidebarOpen, setSidebarOpen]     = useState(true);

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

  const stats = {
    total:     posts.length,
    published: posts.filter(p => p.status === "published").length,
    scheduled: posts.filter(p => p.status === "scheduled").length,
    drafts:    posts.filter(p => p.status === "draft").length,
    failed:    posts.filter(p => p.status === "failed").length,
  };

  const setM        = (patch: Partial<ModalState>) => setModal(m => ({ ...m, ...patch }));
  const closeModal  = () => setModal(m => ({ ...m, open: false }));
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

      {/* ── Sidebar ───────────────────────────────────────────────────── */}
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

        {/* Nav links */}
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

      {/* ── Main ──────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, padding: "20px 24px", overflow: "auto" }}>
          <AnimatePresence mode="wait">

            {activeNav === "dashboard" && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 28 }}>
                  <StatCard label="Total Posts" value={loadingPosts ? "…" : stats.total}     accent="#6366f1" />
                  <StatCard label="Published"   value={loadingPosts ? "…" : stats.published}  accent="#10b981" />
                  <StatCard label="Scheduled"   value={loadingPosts ? "…" : stats.scheduled}  accent="#f59e0b" />
                  <StatCard label="Drafts"      value={loadingPosts ? "…" : stats.drafts}     accent="#94a3b8" />
                  <StatCard label="Failed"      value={loadingPosts ? "…" : stats.failed}     accent="#ef4444" />
                </div>
                <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", overflow: "hidden" }}>
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid #f5f5f5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Recent Posts</span>
                    <button onClick={() => setActiveNav("posts")} style={{ fontSize: 12, color: "#6366f1", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>View all →</button>
                  </div>
                  {loadingPosts ? (
                    <div style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Loading…</div>
                  ) : posts.length === 0 ? (
                    <div style={{ padding: "60px 20px", textAlign: "center" }}>
                      <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
                      <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>No posts yet</p>
                    </div>
                  ) : posts.slice(0, 6).map((post, i) => {
                    const sc: Record<string, string> = { published: "#10b981", scheduled: "#f59e0b", draft: "#94a3b8", failed: "#ef4444", inreview: "#3b82f6" };
                    const color = sc[post.status?.toLowerCase()] ?? "#94a3b8";
                    return (
                      <div key={post.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 20px", borderBottom: i < 5 ? "1px solid #f9f9f9" : "none", transition: "background .1s" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#fafafa"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: "#f1f5f9", flexShrink: 0, overflow: "hidden" }}>
                          {post.imageUrl && <img src={post.imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 13, color: "#374151", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 500 }}>{post.caption ?? post.topicName ?? "Untitled"}</p>
                          <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{post.topicName} · {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                        </div>
                        <div style={{ padding: "3px 10px", borderRadius: 20, background: color + "15", color, fontSize: 11, fontWeight: 600, flexShrink: 0, textTransform: "capitalize" }}>{post.status}</div>
                      </div>
                    );
                  })}
                </div>
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

            {/* ✅ ANALYTICS */}
            {activeNav === "analytics" && (
              <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Analytics />
              </motion.div>
            )}

            {activeNav === "settings" && (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh" }}>
                <div style={{ fontSize: 48, marginBottom: 14 }}>⚙️</div>
                <p style={{ fontSize: 15, fontWeight: 500, color: "#64748b", margin: 0 }}>Settings coming soon</p>
                <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 6 }}>We're working on something great</p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      <CreatePostModal
        modal={modal} setM={setM} closeModal={closeModal}
        handlePublish={handlePublish} handleSaveDraft={handleSaveDraft}
        handleFileUpload={handleFileUpload} handleImageUpload={handleImageUpload}
        handleVideoUpload={handleVideoUpload} togglePlatform={togglePlatform}
        removeImage={removeImage} fileInputRef={fileInputRef}
        imageInputRef={imageInputRef} videoInputRef={videoInputRef}
        PLATFORMS={PLATFORMS}
      />
    </div>
  );
}