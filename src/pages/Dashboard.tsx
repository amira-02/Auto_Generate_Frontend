// src/pages/Dashboard.tsx
import { useContext, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../hooks/AuthContext";
import { jwtDecode } from "jwt-decode";
import CalendarView from "../components/DashboardSection/Calendar/CalendarView";
import CreatePostModal from "../components/DashboardSection/Posts/CreatePostModal";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiBell, FiSearch, FiArrowLeft, FiMenu,
  FiChevronsLeft, FiChevronsRight,
} from "react-icons/fi";
import PostsView from "../components/DashboardSection/Posts/PostsView";
import TopicsView from "../components/DashboardSection/Topics/TopicsView";
import TopicDetailView from "../components/DashboardSection/Topics/TopicDetailView";
import ConnectedAccountsView from "../components/DashboardSection/SocialAccounts/ConnectedAccountsView";

// ─── Base URL centralisée ─────────────────────────────────────────────────────
// En dev → https://localhost:7079
// En prod → remplace par ton domaine ou utilise import.meta.env.VITE_API_URL
const API_BASE = import.meta.env.VITE_API_URL ?? "https://localhost:7079";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "form" | "generating" | "preview";
type CaptionLength = "short" | "medium" | "long";
type Tone = "professional" | "casual" | "funny" | "inspirational";
type ScheduleType = "now" | "schedule";

type ModalState = {
  open: boolean;
  step: Step;
  topic: string;
  hashtags: string;
  captionLength: CaptionLength;
  tone: Tone;
  file: File | null;
  fileName: string;
  fileContent: string;
  selectedPlatforms: string[];
  scheduleType: ScheduleType;
  scheduledAt: string;
  generatedContent: string;
  generatedImage: string;
  loading: boolean;
  error: string;
  postId: number;
  uploadedImages: string[];
  uploadedVideo: string | null;
};

const PLATFORMS = [
  { id: "linkedin",  label: "LinkedIn",   color: "#0077b5", icon: "💼" },
  { id: "twitter",   label: "Twitter / X", color: "#1da1f2", icon: "𝕏" },
  { id: "instagram", label: "Instagram",  color: "#e1306c", icon: "📸" },
  { id: "facebook",  label: "Facebook",   color: "#1877f2", icon: "f"  },
  { id: "tiktok",    label: "TikTok",     color: "#010101", icon: "🎵" },
  { id: "threads",   label: "Threads",    color: "#000000", icon: "🧵" },
];

const INITIAL_MODAL: ModalState = {
  open: false,
  step: "form",
  topic: "",
  hashtags: "",
  captionLength: "medium",
  tone: "professional",
  file: null,
  fileName: "",
  fileContent: "",
  selectedPlatforms: [],
  scheduleType: "now",
  scheduledAt: "",
  generatedContent: "",
  generatedImage: "",
  loading: false,
  error: "",
  postId: 0,
  uploadedImages: [],
  uploadedVideo: null,
};

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { icon: "📊", label: "Dashboard",  id: "dashboard" },
  { icon: "🗂️", label: "Topics",     id: "topics"    },
  { icon: "📝", label: "Posts",      id: "posts"     },
  { icon: "📅", label: "Calendar",   id: "calendar"  },
  { icon: "📈", label: "Analytics",  id: "analytics" },
];

const MANAGE_ITEMS = [
  { icon: "🔗", label: "Connected Accounts", id: "accounts" },
  { icon: "👥", label: "Team Members",        id: "team"     },
  { icon: "⚙️", label: "Settings",            id: "settings" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { logout, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeNav, setActiveNav]               = useState("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedTopic, setSelectedTopic]       = useState<{ id: number; name: string } | null>(null);
  const [modal, setModal]                       = useState<ModalState>(INITIAL_MODAL);
  const [copyDone, setCopyDone]                 = useState(false);
  const [posts, setPosts]                       = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts]         = useState(false);

  const fileInputRef  = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // ─── User info ──────────────────────────────────────────────────────────────

  let userEmail   = "User";
  let userInitial = "U";
  if (token) {
    try {
      const decoded: any = jwtDecode(token);
      userEmail   = decoded.email
        ?? decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"]
        ?? "User";
      userInitial = userEmail.charAt(0).toUpperCase();
    } catch {}
  }

  // ─── Responsive sidebar ─────────────────────────────────────────────────────

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setIsSidebarCollapsed(true);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ─── Fetch posts ─────────────────────────────────────────────────────────────
  // URL absolue avec API_BASE → plus de 404 causé par l'URL relative

  const fetchPosts = async () => {
    if (!token) return;
    setLoadingPosts(true);
    try {
      const res = await fetch(`${API_BASE}/api/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch posts");
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [token]);

  // ─── Stats ──────────────────────────────────────────────────────────────────

  const totalPosts      = posts.length;
  const publishedPosts  = posts.filter(p => p.status === "published").length;
  const scheduledPosts  = posts.filter(p => p.status === "scheduled").length;
  const drafts          = posts.filter(p => p.status === "draft").length;
  const failedPosts     = posts.filter(p => p.status === "failed").length;

  // ─── Modal helpers ──────────────────────────────────────────────────────────

  const openModal  = () => setModal({ ...INITIAL_MODAL, open: true });
  const closeModal = () => setModal(m => ({ ...m, open: false }));
  const setM       = (patch: Partial<ModalState>) => setModal(m => ({ ...m, ...patch }));

  const togglePlatform = (id: string) =>
    setM({
      selectedPlatforms: modal.selectedPlatforms.includes(id)
        ? modal.selectedPlatforms.filter(p => p !== id)
        : [...modal.selectedPlatforms, id],
    });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev =>
      setM({ file, fileName: file.name, fileContent: ev.target?.result as string });
    reader.readAsText(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const urls = Array.from(files).map(f => URL.createObjectURL(f));
    setM({ uploadedImages: [...modal.uploadedImages, ...urls] });
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setM({ uploadedVideo: URL.createObjectURL(file) });
  };

  const removeImage = (idx: number) =>
    setM({ uploadedImages: modal.uploadedImages.filter((_, i) => i !== idx) });

  const copyCaption = () => {
    navigator.clipboard.writeText(modal.generatedContent);
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 1800);
  };

  // ─── API actions ─────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    // Conserve ta logique existante
  };

  const handleGenerateImage = async () => {
    // Conserve ta logique existante
  };

  const handlePublish = async () => {
    // Conserve ta logique existante
    await fetchPosts(); // Refresh après publication
  };

  const handleSaveDraft = async () => {
    // Conserve ta logique existante
    await fetchPosts(); // Refresh après sauvegarde
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-white text-gray-900 font-inter overflow-hidden">

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
  <motion.aside
  initial={false}
  animate={{ width: isSidebarCollapsed ? 64 : 220 }}
  transition={{ type: "spring", stiffness: 300, damping: 30 }}
  className="bg-white flex flex-col fixed h-full z-20 overflow-hidden"
  style={{ borderRight: "1px solid #f0f0f0", boxShadow: "2px 0 12px rgba(0,0,0,0.04)" }}
>
  {/* Toggle */}
  <button
    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
    className="absolute -right-3 top-20 bg-white border border-gray-200 rounded-full p-1.5 shadow-sm hover:bg-gray-50 z-30 transition"
  >
    {isSidebarCollapsed
      ? <FiChevronsRight size={15} className="text-gray-400" />
      : <FiChevronsLeft  size={15} className="text-gray-400" />}
  </button>

  {/* User */}
  <div className={`p-4 flex items-center gap-3 ${isSidebarCollapsed ? "justify-center" : ""}`}
    style={{ borderBottom: "1px solid #f5f5f5" }}>
    <div className="w-9 h-9 bg-gray-900 text-white flex items-center justify-center font-bold text-sm flex-shrink-0"
      style={{ borderRadius: 10 }}>
      {userInitial}
    </div>
    {!isSidebarCollapsed && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="text-sm font-semibold text-gray-900 truncate" style={{ maxWidth: 130 }}>
          {userEmail}
        </div>
        <div className="text-xs text-gray-400 mt-0.5">Starter Plan</div>
      </motion.div>
    )}
  </div>

  {/* Nav */}
  <nav className="flex-1 px-2 py-3 overflow-y-auto" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
    {NAV_ITEMS.map(item => {
      const isActive = activeNav === item.id;
      return (
        <motion.button
          key={item.id}
          onClick={() => setActiveNav(item.id)}
          whileHover={{ x: isSidebarCollapsed ? 0 : 2 }}
          whileTap={{ scale: 0.97 }}
          className={`w-full flex items-center gap-3 text-sm transition-all relative
            ${isSidebarCollapsed ? "justify-center px-0 py-2" : "px-2 py-2"}`}
          style={{ borderRadius: 12, background: isActive ? "#f3f0ff" : "transparent" }}
        >
          {/* Icon bubble */}
          <motion.div
            animate={{ background: isActive ? "#6366f1" : "#f5f5f5" }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center flex-shrink-0"
            style={{ width: 32, height: 32, borderRadius: 9, fontSize: 15 }}
          >
            <span style={{ fontSize: 15 }}>{item.icon}</span>
          </motion.div>

          {/* Label */}
          {!isSidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ color: isActive ? "#6366f1" : "#555", fontWeight: isActive ? 600 : 500 }}
            >
              {item.label}
            </motion.span>
          )}

          {/* Active dot */}
          {isActive && !isSidebarCollapsed && (
            <motion.div
              layoutId="activeDot"
              className="ml-auto"
              style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1", flexShrink: 0 }}
            />
          )}
        </motion.button>
      );
    })}

    {/* Manage section */}
    {!isSidebarCollapsed
      ? <div className="text-xs font-bold text-gray-300 uppercase tracking-widest px-2 pt-4 pb-1"
          style={{ letterSpacing: "0.08em" }}>Manage</div>
      : <div className="my-3" style={{ borderTop: "1px solid #f5f5f5" }} />
    }

    {MANAGE_ITEMS.map(item => {
      const isActive = activeNav === item.id;
      return (
        <motion.button
          key={item.id}
          onClick={() => setActiveNav(item.id)}
          whileHover={{ x: isSidebarCollapsed ? 0 : 2 }}
          whileTap={{ scale: 0.97 }}
          className={`w-full flex items-center gap-3 text-sm transition-all relative
            ${isSidebarCollapsed ? "justify-center px-0 py-2" : "px-2 py-2"}`}
          style={{ borderRadius: 12, background: isActive ? "#f3f0ff" : "transparent" }}
        >
          <motion.div
            animate={{ background: isActive ? "#6366f1" : "#f5f5f5" }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center flex-shrink-0"
            style={{ width: 32, height: 32, borderRadius: 9, fontSize: 15 }}
          >
            <span style={{ fontSize: 15 }}>{item.icon}</span>
          </motion.div>

          {!isSidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ color: isActive ? "#6366f1" : "#555", fontWeight: isActive ? 600 : 500 }}
            >
              {item.label}
            </motion.span>
          )}

          {isActive && !isSidebarCollapsed && (
            <motion.div
              layoutId="activeDotManage"
              className="ml-auto"
              style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1", flexShrink: 0 }}
            />
          )}
        </motion.button>
      );
    })}
  </nav>

  {/* Bottom — plan card avec progress bars */}
  <div className="p-3" style={{ borderTop: "1px solid #f5f5f5" }}>
    {!isSidebarCollapsed ? (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="rounded-xl p-3 mb-2 text-xs"
        style={{ background: "#fafafa", border: "1px solid #f0f0f0" }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-gray-800 text-xs">My plan</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "#f3f0ff", color: "#6366f1" }}>Starter</span>
        </div>

        {/* Accounts bar */}
        <div className="mb-2">
          <div className="flex justify-between text-gray-400 mb-1" style={{ fontSize: 11 }}>
            <span>Accounts</span><span>9/10</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "#eee" }}>
            <motion.div
              initial={{ width: 0 }} animate={{ width: "90%" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full" style={{ background: "#6366f1" }}
            />
          </div>
        </div>

        {/* Credits bar */}
        <div>
          <div className="flex justify-between text-gray-400 mb-1" style={{ fontSize: 11 }}>
            <span>AI Credits</span><span>42/100</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "#eee" }}>
            <motion.div
              initial={{ width: 0 }} animate={{ width: "42%" }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              className="h-full rounded-full" style={{ background: "#10b981" }}
            />
          </div>
        </div>
      </motion.div>
    ) : (
      <div className="flex justify-center text-lg mb-2">📊</div>
    )}

    <motion.button
      onClick={handleLogout}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className="w-full py-2 text-sm font-medium rounded-xl transition flex items-center justify-center gap-2"
      style={{ color: "#aaa", background: "transparent" }}
      onMouseEnter={e => { e.currentTarget.style.background = "#fff0f2"; e.currentTarget.style.color = "#e11d48"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#aaa"; }}
    >
      {isSidebarCollapsed ? "🚪" : <><span>🚪</span> Logout</>}
    </motion.button>
  </div>
</motion.aside>

      {/* ── Main ─────────────────────────────────────────────────────────────── */}
      <motion.main
        animate={{ marginLeft: isSidebarCollapsed ? 64 : 210 }}
        className="flex-1 overflow-auto bg-white"
      >
        <div className="p-6 md:p-8 max-w-7xl mx-auto">

          {/* ── DASHBOARD ────────────────────────────────────────────────────── */}
          {activeNav === "dashboard" && (
            <>
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    Welcome back, {userEmail.split("@")[0]} 👋
                  </h1>
                  <p className="text-gray-500 text-sm mt-1">
                    Let's create something beautiful today
                  </p>
                </div>

                <div className="flex items-center gap-3 mt-4 md:mt-0">
                  <button
                    onClick={() => navigate("/")}
                    className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 hover:border-gray-400 rounded-2xl transition"
                  >
                    <FiArrowLeft size={17} /> Home
                  </button>

                  <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="md:hidden p-3 border border-gray-300 rounded-2xl hover:bg-gray-100"
                  >
                    <FiMenu size={19} />
                  </button>

                  <div className="p-3 border border-gray-300 rounded-2xl hover:bg-gray-100 cursor-pointer">
                    <FiBell size={19} className="text-gray-700" />
                  </div>

                  <div className="hidden lg:flex items-center gap-3 border border-gray-300 px-4 py-2 rounded-2xl w-72 focus-within:border-gray-400">
                    <FiSearch size={17} className="text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search posts..."
                      className="bg-transparent outline-none text-sm w-full placeholder-gray-400"
                    />
                  </div>

                  {/* Create Post button */}
                  <button
                    onClick={openModal}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-2xl hover:bg-gray-700 transition"
                  >
                    ✨ New Post
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {[
                  { label: "Total Posts", value: loadingPosts ? "…" : totalPosts,     icon: "📝" },
                  { label: "Published",   value: loadingPosts ? "…" : publishedPosts, icon: "✅" },
                  { label: "Scheduled",   value: loadingPosts ? "…" : scheduledPosts, icon: "📅" },
                  { label: "Drafts",      value: loadingPosts ? "…" : drafts,         icon: "🧾" },
                  { label: "Failed",      value: loadingPosts ? "…" : failedPosts,    icon: "❌" },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition-all"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-2xl">{stat.icon}</span>
                      <span className="text-3xl font-semibold text-gray-900">{stat.value}</span>
                    </div>
                    <p className="text-gray-500 text-sm mt-4">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Quick calendar preview */}
              {/* <div className="border border-gray-200 rounded-2xl overflow-hidden" style={{ height: 480 }}>
                <CalendarView posts={posts} token={token ?? ""} apiBase={API_BASE} />
              </div> */}
            </>
          )}

          {/* ── TOPICS ───────────────────────────────────────────────────────── */}
          {activeNav === "topics" && !selectedTopic && (
            <TopicsView onSelectTopic={(id, name) => setSelectedTopic({ id, name })} />
          )}
          {activeNav === "topics" && selectedTopic && (
           <TopicDetailView
              topicId={selectedTopic.id}
              topicName={selectedTopic.name}
              onBack={() => setSelectedTopic(null)}
            />
          )}

          {/* ── POSTS ────────────────────────────────────────────────────────── */}
          {activeNav === "posts" && <PostsView />}

          {/* ── CALENDAR ─────────────────────────────────────────────────────── */}
          {activeNav === "calendar" && (
            <div style={{ height: "calc(100vh - 130px)" }}>
              {/*
                ✅ FIX: on passe token + apiBase en props
                CalendarView utilise ces valeurs pour construire
                l'URL absolue → plus de 404
              */}
              <CalendarView
                posts={posts}
                token={token ?? ""}
                apiBase={API_BASE}
              />
            </div>
          )}

          {/* ── ACCOUNTS ─────────────────────────────────────────────────────── */}
          {activeNav === "accounts" && <ConnectedAccountsView />}

          {/* ── ANALYTICS placeholder ────────────────────────────────────────── */}
          {activeNav === "analytics" && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <span className="text-5xl mb-4">📈</span>
              <p className="text-lg font-medium">Analytics coming soon</p>
            </div>
          )}

          {/* ── TEAM placeholder ─────────────────────────────────────────────── */}
          {activeNav === "team" && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <span className="text-5xl mb-4">👥</span>
              <p className="text-lg font-medium">Team features coming soon</p>
            </div>
          )}

          {/* ── SETTINGS placeholder ─────────────────────────────────────────── */}
          {activeNav === "settings" && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <span className="text-5xl mb-4">⚙️</span>
              <p className="text-lg font-medium">Settings coming soon</p>
            </div>
          )}
        </div>
      </motion.main>

      {/* ── Modal ────────────────────────────────────────────────────────────── */}
      <CreatePostModal
        modal={modal}
        setM={setM}
        closeModal={closeModal}
        handleGenerate={handleGenerate}
        handlePublish={handlePublish}
        handleSaveDraft={handleSaveDraft}
        handleFileUpload={handleFileUpload}
        handleImageUpload={handleImageUpload}
        handleVideoUpload={handleVideoUpload}
        handleGenerateImage={handleGenerateImage}
        togglePlatform={togglePlatform}
        removeImage={removeImage}
        copyCaption={copyCaption}
        fileInputRef={fileInputRef}
        imageInputRef={imageInputRef}
        videoInputRef={videoInputRef}
        copyDone={copyDone}
        PLATFORMS={PLATFORMS}
      />
    </div>
  );
}