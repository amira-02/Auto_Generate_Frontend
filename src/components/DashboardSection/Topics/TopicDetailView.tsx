import { useState, useEffect, useContext, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus, FiImage, FiAlertCircle, FiSearch, FiTrash2, FiChevronLeft, FiChevronRight, FiArrowLeft, FiX } from "react-icons/fi";
import { AuthContext } from "../../../hooks/AuthContext";
import CreatePostModal from "../Posts/CreatePostModal";
import DetailPanel from "../Posts/DetailPanel";
import type { Post } from "../Posts/PostsView";
import { toast } from "react-toastify";

const API: string = import.meta.env.VITE_API_URL ?? "https://localhost:7079";
const PAGE_SIZE = 12;

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

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  all:       { label: "All",       color: "#e65787", bg: "#fff1f3" },
  draft:     { label: "Draft",     color: "#64748b", bg: "#f1f5f9" },
  inreview:  { label: "In Review", color: "#d97706", bg: "#fffbeb" },
  approved:  { label: "Approved",  color: "#0891b2", bg: "#f0f9ff" },
  scheduled: { label: "Scheduled", color: "#7c3aed", bg: "#faf5ff" },
  published: { label: "Published", color: "#059669", bg: "#f0fdf4" },
  failed:    { label: "Failed",    color: "#dc2626", bg: "#fef2f2" },
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
  const [search, setSearch]             = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [page, setPage]                 = useState(1);

  const fileInputRef  = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const setM = (patch: any) => setModal(m => ({ ...m, ...patch }));

  useEffect(() => { fetchTopic(); }, [topicId]);
  useEffect(() => { setPage(1); }, [search, activeFilter]);

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

  const handlePostUpdate = (updated: Post) => {
    setTopic(t => t ? { ...t, posts: t.posts.map(p => p.id === updated.id ? updated : p) } : t);
    setSelectedPost(updated);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setM({ file, fileName: file.name, fileContent: ev.target?.result as string });
    reader.readAsText(file);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        // Always upload to /api/images/upload-temp to get a real Cloudinary URL
        const res = await fetch(`${API}/api/images/upload-temp`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        const fullUrl = data.url?.startsWith("http") ? data.url : `${API}${data.url}`;
        setM((m: any) => ({ ...m, uploadedImages: [...m.uploadedImages, fullUrl] }));
      } catch (err: any) {
        toast.error(`Upload failed: ${err.message}`);
      }
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API}/api/images/upload-temp`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const fullUrl = data.url?.startsWith("http") ? data.url : `${API}${data.url}`;
      setM({ uploadedVideo: fullUrl });
      toast.success("Video uploaded ✅");
    } catch (err: any) {
      toast.error(`Video upload failed: ${err.message}`);
    }
  };

  const handleSaveDraft = async () => {
    setModal({ ...INITIAL_MODAL, topic: topicName, topicId });
    await fetchTopic();
    toast.success("Post sauvegardé en draft ✅");
  };

  const handlePublish = async () => {
    setModal({ ...INITIAL_MODAL, topic: topicName, topicId });
    await fetchTopic();
  };


  const handleDeletePost = async (postId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("Delete this post?")) return;
    try {
      const res = await fetch(`${API}/api/posts/${postId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");
      setTopic(t => t ? { ...t, posts: t.posts.filter(p => p.id !== postId) } : t);
      setSelectedPost(null);
      toast.success("Post deleted ✅");
    } catch { toast.error("Failed to delete post"); }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px" }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#e65787", marginBottom: 12 }}
      />
      <p style={{ color: "#94a3b8", fontSize: 13 }}>Loading posts…</p>
    </div>
  );

  const posts = topic?.posts ?? [];

  // ── Filter & Search ──────────────────────────────────────────────────────────

  const filtered = posts.filter(p => {
    const matchSearch = !search ||
      (p.caption ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.hashtags ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = activeFilter === "all" ||
      p.status?.toLowerCase().replace("_", "") === activeFilter;
    return matchSearch && matchStatus;
  });

  // ── Pagination ───────────────────────────────────────────────────────────────

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagePosts   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Stats ────────────────────────────────────────────────────────────────────

  const counts = {
    all:       posts.length,
    draft:     posts.filter(p => p.status?.toLowerCase() === "draft").length,
    scheduled: posts.filter(p => p.status?.toLowerCase() === "scheduled").length,
    published: posts.filter(p => p.status?.toLowerCase() === "published").length,
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: "#fff", borderRadius: 14,
        border: "1px solid #f0f0f0",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        padding: "10px 16px",
        display: "flex", alignItems: "center", gap: 10,
        marginBottom: 20, flexWrap: "wrap",
      }}>

        {/* Back to Topics */}
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
          onClick={onBack}
          title="Back to Topics"
          style={{
            width: 32, height: 32, borderRadius: 9,
            border: "1px solid #f0f0f0", background: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#64748b", cursor: "pointer", flexShrink: 0,
          }}
        >
          <FiArrowLeft size={15} />
        </motion.button>

        {/* Divider */}
        <div style={{ width: 1, height: 22, background: "#f0f0f0" }} />

        {/* Topic name + stats */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
            {topicName}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            {([
              { key: "draft",     accent: "#94a3b8" },
              { key: "scheduled", accent: "#e65787" },
              { key: "published", accent: "#10b981" },
            ] as const).map(({ key, accent }) => (
              counts[key] > 0 ? (
                <div key={key} style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "3px 9px", borderRadius: 20,
                  background: accent + "10", border: `1px solid ${accent}20`,
                }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: accent }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#0f172a" }}>{counts[key]}</span>
                  <span style={{ fontSize: 10, color: "#94a3b8", textTransform: "capitalize" }}>{key}</span>
                </div>
              ) : null
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 22, background: "#f0f0f0" }} />

        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 7,
          background: "#f8f9fb", borderRadius: 9,
          padding: "7px 12px", border: "1px solid #f0f0f0",
          flex: 1, minWidth: 160, maxWidth: 260,
        }}>
          <FiSearch size={13} color="#94a3b8" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search posts..."
            style={{ border: "none", background: "transparent", outline: "none", fontSize: 12, color: "#374151", width: "100%" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0, display: "flex" }}>
              <FiX size={12} />
            </button>
          )}
        </div>

        {/* Status filters */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {(["all", "draft", "scheduled", "published"] as const).map(key => {
            const meta   = STATUS_META[key];
            const active = activeFilter === key;
            return (
              <button key={key} onClick={() => setActiveFilter(key)} style={{
                padding: "5px 12px", borderRadius: 20, cursor: "pointer",
                background: active ? meta.bg : "transparent",
                color: active ? meta.color : "#94a3b8",
                fontWeight: active ? 700 : 400, fontSize: 11,
                border: active ? `1.5px solid ${meta.color}30` : "1px solid transparent",
                transition: "all .15s",
              }}>
                {meta.label}
                {key !== "all" && counts[key as keyof typeof counts] > 0 && (
                  <span style={{
                    marginLeft: 4, fontSize: 10,
                    background: active ? meta.color + "20" : "#f1f5f9",
                    color: active ? meta.color : "#94a3b8",
                    padding: "1px 5px", borderRadius: 10,
                  }}>
                    {counts[key as keyof typeof counts]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* New Post */}
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={() => setModal(m => ({ ...m, open: true, topic: topicName }))}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 9, border: "none",
            background: "linear-gradient(135deg, #e65787, #e65787)",
            color: "#fff", fontSize: 12, fontWeight: 600,
            cursor: "pointer", boxShadow: "0 3px 10px rgba(230,87,135,0.25)",
            flexShrink: 0,
          }}
        >
          <FiPlus size={14} /> New Post
        </motion.button>
      </div>

      {/* ── Empty — no posts ────────────────────────────────────────────────── */}
      {posts.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 16, border: "1.5px dashed #e5e7eb" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 6px", color: "#1e293b" }}>No posts yet</h3>
          <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 20px" }}>Create your first post for this topic</p>
          <motion.button whileHover={{ scale: 1.03 }}
            onClick={() => setModal(m => ({ ...m, open: true }))}
            style={{ background: "#0f172a", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <FiPlus size={14} /> Create Post
          </motion.button>
        </motion.div>
      )}

      {/* ── Empty search/filter ──────────────────────────────────────────────── */}
      {posts.length > 0 && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8", fontSize: 13, background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0" }}>
          No posts match your filters
        </div>
      )}

      {/* ── Posts Grid ──────────────────────────────────────────────────────── */}
      {pagePosts.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
          gap: 12,
        }}>
          <AnimatePresence>
            {pagePosts.map((post, i) => {
              const statusKey = post.status?.toLowerCase().replace("_", "") ?? "draft";
              const status    = STATUS_META[statusKey] ?? STATUS_META.draft;
              return (
                <motion.div key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.02, type: "spring", stiffness: 340 }}
                  whileHover={{ y: -2 }}
                  onClick={() => setSelectedPost(post)}
                  className="group"
                  style={{
                    background: "#fff", border: "1px solid #f0f0f0",
                    borderRadius: 14, overflow: "hidden", cursor: "pointer",
                    transition: "box-shadow .15s, border-color .15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 20px -6px rgba(0,0,0,0.1)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "#f0f0f0"; }}
                >
                  {/* Image */}
                  <div style={{ position: "relative", paddingBottom: "100%", background: "#f8fafc" }}>
                    {post.imageUrl ? (
                      <img src={post.imageUrl} alt=""
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    ) : (
                      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, color: "#cbd5e1" }}>
                        <FiImage size={24} />
                        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.05em" }}>NO IMAGE</span>
                      </div>
                    )}

                    {/* Status badge */}
                    <div style={{
                      position: "absolute", top: 8, left: 8,
                      background: status.bg,
                      borderRadius: 6, padding: "2px 7px",
                      fontSize: 9, fontWeight: 700, color: status.color, letterSpacing: "0.03em",
                    }}>
                      {status.label}
                    </div>

                    {/* Platform icons */}
                    {(post.platforms ?? []).length > 0 && (
                      <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 3 }}>
                        {(Array.isArray(post.platforms)
  ? post.platforms
  : (() => { try { return JSON.parse(post.platforms ?? "[]"); } catch { return []; } })()
).slice(0, 2).map((pid: string) => {
                          const p = PLATFORMS.find(x => x.id === pid);
                          return p ? (
                            <div key={pid} style={{
                              width: 18, height: 18, borderRadius: "50%",
                              background: "rgba(255,255,255,0.92)", backdropFilter: "blur(4px)",
                              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9,
                            }}>
                              {p.icon}
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}

                    {/* Delete */}
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={e => handleDeletePost(post.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                      style={{
                        position: "absolute", bottom: 8, right: 8,
                        width: 26, height: 26, borderRadius: "50%",
                        border: "1px solid rgba(255,255,255,0.9)",
                        background: "rgba(255,255,255,0.92)", backdropFilter: "blur(4px)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#ef4444", cursor: "pointer",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      }}
                    >
                      <FiTrash2 size={12} />
                    </motion.button>
                  </div>

                  {/* Footer */}
                  <div style={{ padding: "10px 11px" }}>
                    {post.caption ? (
                      <p style={{
                        margin: 0, fontSize: 11, color: "#475569", lineHeight: 1.5,
                        display: "-webkit-box", WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical", overflow: "hidden",
                      }}>
                        {post.caption}
                      </p>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#f59e0b" }}>
                        <FiAlertCircle size={9} />
                        <span style={{ fontStyle: "italic" }}>No caption</span>
                      </div>
                    )}
                    <div style={{ marginTop: 7, display: "flex", justifyContent: "flex-end", fontSize: 9, color: "#cbd5e1" }}>
                      {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────────────────────────── */}
      {filtered.length > PAGE_SIZE && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 6, marginTop: 24,
        }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              width: 32, height: 32, borderRadius: 8, border: "1px solid #f0f0f0",
              background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: page === 1 ? "#cbd5e1" : "#374151",
            }}
          >
            <FiChevronLeft size={15} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
            <button key={n} onClick={() => setPage(n)} style={{
              width: 32, height: 32, borderRadius: 8, cursor: "pointer",
              background: page === n ? "#e65787" : "#fff",
              color: page === n ? "#fff" : "#374151",
              fontWeight: page === n ? 700 : 400, fontSize: 13,
              border: page === n ? "none" : "1px solid #f0f0f0",
            }}>
              {n}
            </button>
          ))}

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              width: 32, height: 32, borderRadius: 8, border: "1px solid #f0f0f0",
              background: "#fff", cursor: page === totalPages ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: page === totalPages ? "#cbd5e1" : "#374151",
            }}
          >
            <FiChevronRight size={15} />
          </button>

          <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 4 }}>
            {filtered.length} posts · page {page}/{totalPages}
          </span>
        </div>
      )}

      {/* ── Detail Panel ────────────────────────────────────────────────────── */}
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

      {/* ── Create Post Modal ────────────────────────────────────────────────── */}
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