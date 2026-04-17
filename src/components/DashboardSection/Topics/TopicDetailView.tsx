import { useState, useEffect, useContext, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowLeft, FiPlus, FiImage, FiAlertCircle, FiSearch, FiX } from "react-icons/fi";
import { AuthContext } from "../../../hooks/AuthContext";
import CreatePostModal from "../Posts/CreatePostModal";

// ✅ Import du DetailPanel depuis PostsView
// Ce composant contient déjà toute la logique d'édition (caption, image, platforms, schedule…)
import DetailPanel from "../Posts/DetailPanel";
import type { Post } from "../Posts/PostsView";
// imports — ajoute FiSearch et FiX si pas déjà présents


const API = "https://localhost:7079";

// ─── Types ────────────────────────────────────────────────────────────────────

type TopicDetail = {
  id: number;
  name: string;
  description: string | null;
  platform: string;
  createdAt: string;
  posts: Post[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  draft:     { label: "Draft",     color: "#64748b", bg: "#f1f5f9", dot: "#94a3b8" },
  inreview:  { label: "In Review", color: "#d97706", bg: "#fffbeb", dot: "#f59e0b" },
  approved:  { label: "Approved",  color: "#0891b2", bg: "#f0f9ff", dot: "#06b6d4" },
  scheduled: { label: "Scheduled", color: "#7c3aed", bg: "#faf5ff", dot: "#8b5cf6" },
  published: { label: "Published", color: "#059669", bg: "#f0fdf4", dot: "#10b981" },
  failed:    { label: "Failed",    color: "#dc2626", bg: "#fef2f2", dot: "#ef4444" },
};

const PLATFORMS = [
  { id: "instagram", label: "Instagram", color: "#e1306c", icon: "📸" },
  { id: "linkedin",  label: "LinkedIn",  color: "#0077b5", icon: "💼" },
  { id: "twitter",   label: "Twitter/X", color: "#1da1f2", icon: "𝕏"  },
  { id: "facebook",  label: "Facebook",  color: "#1877f2", icon: "📘" },
  { id: "tiktok",    label: "TikTok",    color: "#010101", icon: "🎵" },
  { id: "threads",   label: "Threads",   color: "#000000", icon: "🧵" },
];

const INITIAL_MODAL = {
  open: false, step: "form" as const,
  topic: "", topicId: 0,
  hashtags: "", captionLength: "medium" as const,
  tone: "professional" as const, file: null, fileName: "", fileContent: "",
  selectedPlatforms: [] as string[], scheduleType: "now" as const,
  scheduledAt: "", generatedContent: "", generatedImage: "",
  loading: false, error: "", postId: 0,
  uploadedImages: [] as string[], uploadedVideo: null,
};

type Props = {
  topicId: number;
  topicName: string;
  onBack: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function TopicDetailView({ topicId, topicName, onBack }: Props) {
  const { token } = useContext(AuthContext);
  const [topic, setTopic]               = useState<TopicDetail | null>(null);
  const [loading, setLoading]           = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [modal, setModal]               = useState({ ...INITIAL_MODAL, topic: topicName, topicId });

  const fileInputRef  = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);


  
// state — dans le composant, avec les autres useState
const [search, setSearch] = useState("");



  const setM = (patch: any) => setModal(m => ({ ...m, ...patch }));

  useEffect(() => { fetchTopic(); }, [topicId]);

  const fetchTopic = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/topics/${topicId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTopic({ ...data, posts: data.posts ?? [] });
    } finally {
      setLoading(false);
    }
  };

  // ── Quand DetailPanel met à jour un post ─────────────────────────────────────
  // DetailPanel appelle onUpdate(updatedPost) — on met à jour la liste locale
  const handlePostUpdate = (updated: Post) => {
    setTopic(t =>
      t ? { ...t, posts: t.posts.map(p => p.id === updated.id ? updated : p) } : t
    );
    setSelectedPost(updated);
  };

  const handleFileUpload  = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setM({ file, fileName: file.name, fileContent: ev.target?.result as string });
    reader.readAsText(file);
  };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files) return;
    setM({ uploadedImages: [...modal.uploadedImages, ...Array.from(files).map(f => URL.createObjectURL(f))] });
  };
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setM({ uploadedVideo: URL.createObjectURL(file) });
  };
  const handleSaveDraft = async () => {
    setModal({ ...INITIAL_MODAL, topic: topicName, topicId });
    await fetchTopic();
  };
  const handlePublish = async () => {
    setModal({ ...INITIAL_MODAL, topic: topicName, topicId });
    await fetchTopic();
  };

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px" }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#7c3aed", marginBottom: 16 }}
      />
      <p style={{ color: "#94a3b8", fontSize: 14 }}>Loading posts…</p>
    </div>
  );

  const posts = topic?.posts ?? [];

  const filteredPosts = posts.filter(p =>
  !search ||
  (p.caption ?? "").toLowerCase().includes(search.toLowerCase()) ||
  (p.hashtags ?? "").toLowerCase().includes(search.toLowerCase())
);

  const counts = {
    draft:     posts.filter(p => p.status?.toLowerCase() === "draft").length,
    scheduled: posts.filter(p => p.status?.toLowerCase() === "scheduled").length,
    published: posts.filter(p => p.status?.toLowerCase() === "published").length,
  };


  
  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", minHeight: "100vh" }}>

{/* Header */}
<div className="flex items-center justify-between mb-8 gap-3 flex-wrap">
  <div className="flex items-center gap-3">
    <motion.button
      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
      onClick={onBack}
      className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 hover:border-gray-400 rounded-2xl transition"
    >
      <FiArrowLeft size={17} />
    </motion.button>
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">{topic?.name ?? topicName}</h1>
      {/* <p className="text-gray-500 text-sm mt-1">{posts.length} post{posts.length !== 1 ? "s" : ""}</p> */}
    </div>
  </div>

  <div className="flex items-center gap-3 flex-wrap">
    <div className="hidden lg:flex items-center gap-3 border border-gray-300 px-4 py-2 rounded-2xl w-72 focus-within:border-gray-400">
      <FiSearch size={17} className="text-gray-500" />
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search posts..."
        className="bg-transparent outline-none text-sm w-full placeholder-gray-400"
      />
    </div>
    <motion.button
      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
      onClick={() => setModal(m => ({ ...m, open: true, topic: topicName }))}
      className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-2xl hover:bg-gray-700 transition"
    >
      <FiPlus size={17} /> New Post
    </motion.button>
  </div>
</div>
{/* Stats */}
<div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
  {[
    { key: "draft",     label: "Drafts",    count: counts.draft },
    { key: "scheduled", label: "Scheduled", count: counts.scheduled },
    { key: "published", label: "Published", count: counts.published },
    { key: "total",     label: "Total",     count: posts.length },
  ].map(({ key, label, count }) => {
    const meta  = STATUS_META[key];
    return (
      <div key={key} style={{ background: "#fff", border: "1.5px solid #f1f5f9", borderRadius: 10, padding: "8px 16px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: meta?.color ?? "#0f172a", lineHeight: 1 }}>{count}</span>
        <span style={{ fontSize: 12, color: "#94a3b8" }}>{label}</span>
      </div>
    );
  })}
  {search && (
    <div style={{ background: "#f0f9ff", border: "1.5px solid #bae6fd", borderRadius: 10, padding: "8px 16px", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#0369a1" }}>
      <FiSearch size={12} /> {filteredPosts.length} result{filteredPosts.length !== 1 ? "s" : ""} for «{search}»
    </div>
  )}
</div>

{/* Empty — no posts */}
{posts.length === 0 && (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 16, border: "1.5px dashed #e2e8f0" }}>
    <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
    <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 6px", color: "#1e293b" }}>No posts yet</h3>
    <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 20px" }}>Create your first post for this topic</p>
    <motion.button whileHover={{ scale: 1.03 }} onClick={() => setModal(m => ({ ...m, open: true }))}
      style={{ background: "#0f172a", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
      <FiPlus size={14} /> Create Post
    </motion.button>
  </motion.div>
)}

{/* Empty search */}
{posts.length > 0 && filteredPosts.length === 0 && (
  <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8", fontSize: 14 }}>
    No posts match «{search}»
  </div>
)}

{/* Posts Grid */}
{filteredPosts.length > 0 && (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
    <AnimatePresence>
      {filteredPosts.map((post, i) => {
        const statusKey = post.status?.toLowerCase().replace("_", "") ?? "draft";
        const status    = STATUS_META[statusKey] ?? STATUS_META.draft;
        return (
          <motion.div key={post.id}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: i * 0.03, type: "spring", stiffness: 320 }}
            whileHover={{ y: -3 }}
            onClick={() => setSelectedPost(post)}
            style={{ background: "#fff", border: "1.5px solid #f1f5f9", borderRadius: 14, overflow: "hidden", cursor: "pointer", transition: "box-shadow .15s, border-color .15s" }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 24px -6px rgba(0,0,0,0.12)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "#f1f5f9"; }}
          >
            {/* Image 1:1 */}
            <div style={{ position: "relative", paddingBottom: "100%", background: "#f8fafc" }}>
              {post.imageUrl ? (
                <img src={post.imageUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              ) : (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, color: "#cbd5e1" }}>
                  <FiImage size={28} />
                  <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.04em" }}>NO IMAGE</span>
                </div>
              )}
              {/* Status */}
              <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(255,255,255,0.9)", backdropFilter: "blur(6px)", borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 700, color: status.color, letterSpacing: "0.03em" }}>
                {status.label}
              </div>
              {/* Platforms */}
              {(post.platforms ?? []).length > 0 && (
                <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 3 }}>
                  {(post.platforms ?? []).slice(0, 2).map(pid => {
                    const p = PLATFORMS.find(x => x.id === pid);
                    return p ? (
                      <div key={pid} style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>
                        {p.icon}
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </div>
            {/* Footer */}
            <div style={{ padding: "10px 12px" }}>
              {post.caption ? (
                <p style={{ margin: 0, fontSize: 12, color: "#475569", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {post.caption}
                </p>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#f59e0b" }}>
                  <FiAlertCircle size={10} /><span style={{ fontStyle: "italic" }}>No caption</span>
                </div>
              )}
              <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end", fontSize: 10, color: "#cbd5e1" }}>
                {new Date(post.createdAt).toLocaleDateString("fr-FR")}
              </div>
            </div>
          </motion.div>
        );
      })}
    </AnimatePresence>
  </div>
)}

      {/* ✅ DetailPanel — le même que dans PostsView */}
      <AnimatePresence>
        {selectedPost && (
          <DetailPanel
            post={selectedPost}
            token={token}
            onClose={() => setSelectedPost(null)}
            onUpdate={handlePostUpdate}
          />
        )}
      </AnimatePresence>

      {/* Create Post Modal */}
      <CreatePostModal
        modal={modal}
        setM={setM}
        closeModal={() => setModal(m => ({ ...m, open: false }))}
        handlePublish={handlePublish}
        handleSaveDraft={handleSaveDraft}
        handleFileUpload={handleFileUpload}
        handleImageUpload={handleImageUpload}
        handleVideoUpload={handleVideoUpload}
        togglePlatform={(id: string) => setM({
          selectedPlatforms: modal.selectedPlatforms.includes(id)
            ? modal.selectedPlatforms.filter((p: string) => p !== id)
            : [...modal.selectedPlatforms, id],
        })}
        removeImage={(idx: number) => setM({
          uploadedImages: modal.uploadedImages.filter((_: any, i: number) => i !== idx),
        })}
        fileInputRef={fileInputRef}
        imageInputRef={imageInputRef}
        videoInputRef={videoInputRef}
        PLATFORMS={PLATFORMS}
      />
    </div>
  );
}