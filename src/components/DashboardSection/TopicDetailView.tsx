import { useState, useEffect, useContext, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowLeft, FiPlus, FiImage, FiAlertCircle } from "react-icons/fi";
import { AuthContext } from "../../hooks/AuthContext";
import CreatePostModal from "./CreatePostModal";

const API = "https://localhost:7079";

type Post = {
  id: number;
  status: string;
  caption: string | null;
  tone: string | null;
  imageUrl: string | null;
  imageCount: number;
  scheduledAt: string | null;
  createdAt: string;
};

type TopicDetail = {
  id: number;
  name: string;
  description: string | null;
  platform: string;
  createdAt: string;
  posts: Post[];
};

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  draft:     { label: "Draft",     color: "#888",    bg: "#f3f3f3", icon: "⚪" },
  inreview:  { label: "In Review", color: "#d97706", bg: "#fef3c7", icon: "👀" },
  approved:  { label: "Approved",  color: "#0891b2", bg: "#e0f2fe", icon: "👍" },
  scheduled: { label: "Scheduled", color: "#7c3aed", bg: "#ede9fe", icon: "🕐" },
  published: { label: "Published", color: "#059669", bg: "#d1fae5", icon: "✅" },
  failed:    { label: "Failed",    color: "#dc2626", bg: "#fee2e2", icon: "❌" },
};

const PLATFORMS = [
  { id: "instagram", label: "Instagram", color: "#e1306c" },
  { id: "linkedin",  label: "LinkedIn",  color: "#0077b5" },
  { id: "twitter",   label: "Twitter/X", color: "#1da1f2" },
  { id: "facebook",  label: "Facebook",  color: "#1877f2" },
  { id: "tiktok",    label: "TikTok",    color: "#010101" },
  { id: "threads",   label: "Threads",   color: "#000000" },
];

const INITIAL_MODAL = {
  open: false, step: "form" as const,
  topic: "", topicId: 0,          // ← topicId: 0 ajouté
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

export default function TopicDetailView({ topicId, topicName, onBack }: Props) {
  const { token } = useContext(AuthContext);
  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [loading, setLoading] = useState(false);
 const [modal, setModal] = useState({ ...INITIAL_MODAL, topic: topicName, topicId: topicId });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const setM = (patch: any) => setModal(m => ({ ...m, ...patch }));

  useEffect(() => {
    fetchTopic();
  }, [topicId]);

  const fetchTopic = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/topics/${topicId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTopic(data);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setM({ file, fileName: file.name, fileContent: ev.target?.result as string });
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

  // Refresh posts after saving
  const handleSaveDraft = async () => {
    setModal({ ...INITIAL_MODAL, topic: topicName });
    await fetchTopic();
  };

  const handlePublish = async () => {
    setModal({ ...INITIAL_MODAL, topic: topicName });
    await fetchTopic();
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: "80px 20px", color: "#aaa" }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
      <div>Loading...</div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            onClick={onBack}
            style={{
              background: "white", border: "1.5px solid #e5e7eb", borderRadius: 10,
              padding: "8px 10px", cursor: "pointer", display: "flex",
              alignItems: "center", color: "#555",
            }}
          >
            <FiArrowLeft size={16} />
          </button>
          <div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>Topics</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>{topic?.name ?? topicName}</h1>
          </div>
        </div>
        <button
          onClick={() => setModal(m => ({ ...m, open: true, topic: topicName }))}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            background: "#7c3aed", color: "white", border: "none",
            borderRadius: 12, padding: "10px 18px", fontSize: 14,
            fontWeight: 600, cursor: "pointer",
          }}
        >
          <FiPlus size={16} /> New Post
        </button>
      </div>

      {/* Description */}
      {topic?.description && (
        <div style={{
          background: "white", border: "1.5px solid #e8e8e8", borderRadius: 12,
          padding: "14px 18px", marginBottom: 24, fontSize: 14, color: "#555",
        }}>
          {topic.description}
        </div>
      )}

      {/* Stats row */}
      {topic && (
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          {(["draft", "scheduled", "published"] as const).map(key => {
            const meta = STATUS_META[key];
            const count = topic.posts.filter(p => p.status.toLowerCase() === key).length;
            return (
              <div key={key} style={{
                background: "white", border: "1.5px solid #f0f0f0", borderRadius: 12,
                padding: "12px 18px", display: "flex", alignItems: "center", gap: 10,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: meta.bg, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 14, fontWeight: 700, color: meta.color,
                }}>
                  {count}
                </div>
                <span style={{ fontSize: 13, color: "#666" }}>{meta.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Posts Grid */}
      {topic?.posts.length === 0 && (
        <div style={{
          textAlign: "center", padding: "80px 20px",
          background: "white", borderRadius: 20, border: "1.5px dashed #e5e7eb",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>No posts yet</h3>
          <p style={{ color: "#888", fontSize: 14, margin: "0 0 20px" }}>Create your first post for this topic</p>
          <button
            onClick={() => setModal(m => ({ ...m, open: true }))}
            style={{
              background: "#7c3aed", color: "white", border: "none",
              borderRadius: 12, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}
          >
            <FiPlus size={14} style={{ marginRight: 6 }} /> Create Post
          </button>
        </div>
      )}

      {topic && topic.posts.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          <AnimatePresence>
            {topic.posts.map((post, i) => {
              const statusKey = post.status.toLowerCase().replace("_", "");
              const status = STATUS_META[statusKey] ?? STATUS_META.draft;
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ y: -2 }}
                  style={{
                    background: "white", border: "1.5px solid #e8e8e8",
                    borderRadius: 16, overflow: "hidden",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  {/* Image zone */}
                  {post.imageUrl ? (
                    <img src={post.imageUrl} alt="" style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }} />
                  ) : (
                    <div style={{
                      width: "100%", height: 140, background: "#f5f5f5",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#ccc",
                    }}>
                      <FiImage size={28} />
                    </div>
                  )}

                  <div style={{ padding: "14px 16px" }}>
                    {/* Status */}
                    <span style={{
                      fontSize: 11, padding: "2px 8px", borderRadius: 20,
                      background: status.bg, color: status.color, fontWeight: 500,
                    }}>
                      {status.icon} {status.label}
                    </span>

                    {/* Caption */}
                    <div style={{ marginTop: 10 }}>
                      {post.caption ? (
                        <p style={{
                          fontSize: 13, color: "#444", lineHeight: 1.5, margin: 0,
                          display: "-webkit-box", WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical", overflow: "hidden",
                        }}>
                          {post.caption}
                        </p>
                      ) : (
                        <div style={{
                          fontSize: 12, color: "#b45309", fontStyle: "italic",
                          display: "flex", alignItems: "center", gap: 5,
                        }}>
                          <FiAlertCircle size={12} /> No caption
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div style={{
                      marginTop: 12, paddingTop: 10, borderTop: "1px solid #f0f0f0",
                      display: "flex", justifyContent: "space-between",
                      fontSize: 11, color: "#aaa",
                    }}>
                      <span>{post.imageCount} image{post.imageCount !== 1 ? "s" : ""}</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* CreatePostModal — topicId passé via SaveCaptionDto */}
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
        removeImage={(idx: number) => setM({ uploadedImages: modal.uploadedImages.filter((_: any, i: number) => i !== idx) })}
        fileInputRef={fileInputRef}
        imageInputRef={imageInputRef}
        videoInputRef={videoInputRef}
        PLATFORMS={PLATFORMS}
      />
    </div>
  );
}