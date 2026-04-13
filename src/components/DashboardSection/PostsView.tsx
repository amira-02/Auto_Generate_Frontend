// src/components/DashboardSection/PostsView.tsx
import { useState, useEffect, useContext, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiImage, FiFileText, FiClock, FiCheckCircle, FiAlertCircle,
  FiX, FiEdit3, FiUpload, FiSend, FiCalendar, FiSearch, FiRefreshCw,
  FiZap, FiTrash2, FiSave, FiLink
} from "react-icons/fi";
import { AuthContext } from "../../hooks/AuthContext";

const API_BASE = "https://localhost:7079";

// ─── Types ────────────────────────────────────────────────────────────────────

type Platform = "linkedin" | "twitter" | "instagram" | "facebook" | "tiktok" | "threads";

type Post = {
  id: number;
  topicId: number;
  topicName: string;
  hashtags: string;
  caption: string | null;
  tone: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  platforms: Platform[];
  scheduledAt: string | null;
  status: string;
  createdAt: string;
};

const normalizeStatus = (s: string): "draft" | "scheduled" | "published" | "failed" => {
  switch ((s ?? "").toUpperCase()) {
    case "SCHEDULED": return "scheduled";
    case "PUBLISHED": return "published";
    case "FAILED":    return "failed";
    default:          return "draft";
  }
};

// ─── Metadata ─────────────────────────────────────────────────────────────────

const PLATFORM_META: Record<Platform, { label: string; color: string; bg: string }> = {
  linkedin:  { label: "LinkedIn",  color: "#0077b5", bg: "#e8f4fb" },
  twitter:   { label: "Twitter/X", color: "#1da1f2", bg: "#e8f6fe" },
  instagram: { label: "Instagram", color: "#e1306c", bg: "#fce8ef" },
  facebook:  { label: "Facebook",  color: "#1877f2", bg: "#e8f0fd" },
  tiktok:    { label: "TikTok",    color: "#333",    bg: "#f0f0f0" },
  threads:   { label: "Threads",   color: "#111",    bg: "#f0f0f0" },
};

const STATUS_META = {
  draft:     { label: "Draft",     color: "#888",    bg: "#f3f3f3", icon: "⚪" },
  scheduled: { label: "Scheduled", color: "#7c3aed", bg: "#ede9fe", icon: "🕐" },
  published: { label: "Published", color: "#059669", bg: "#d1fae5", icon: "✅" },
  failed:    { label: "Failed",    color: "#dc2626", bg: "#fee2e2", icon: "❌" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMissing(post: Post) {
  const m: string[] = [];
  if (!post.caption) m.push("caption");
  if (!post.imageUrl) m.push("media");
  if (!post.platforms || post.platforms.length === 0) m.push("platforms");
  if (!post.scheduledAt && normalizeStatus(post.status) !== "published") m.push("schedule");
  return m;
}

function getScore(post: Post) {
  return Math.round(((4 - getMissing(post).length) / 4) * 100);
}

function fmtDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PlatformBadge({ platform }: { platform: Platform }) {
  const m = PLATFORM_META[platform];
  if (!m) return null;
  return (
    <span style={{
      fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 20,
      background: m.bg, color: m.color, border: `1px solid ${m.color}22`, letterSpacing: 0.3,
    }}>
      {m.label}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = score === 100 ? "#059669" : score >= 50 ? "#7c3aed" : "#f59e0b";
  return (
    <div style={{ background: "#f0f0f0", borderRadius: 99, height: 6, overflow: "hidden" }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ height: "100%", background: color, borderRadius: 99 }}
      />
    </div>
  );
}

function Section({ title, icon, status, children }: {
  title: string; icon: React.ReactNode;
  status: "ok" | "missing" | "warning"; children: React.ReactNode;
}) {
  const dot = { ok: "#059669", missing: "#dc2626", warning: "#d97706" }[status];
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
        <span style={{ color: "#888", display: "flex" }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: 1 }}>
          {title}
        </span>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: dot, marginLeft: "auto", flexShrink: 0 }} />
      </div>
      {children}
    </div>
  );
}

function btnStyle(color: string, filled = false): React.CSSProperties {
  return {
    background: filled ? color : color + "15",
    color: filled ? "white" : color,
    border: `1px solid ${filled ? color : color + "33"}`,
    borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600,
    cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5,
    fontFamily: "inherit", transition: "opacity 0.15s",
  };
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      style={{
        position: "fixed", bottom: 28, right: 28, zIndex: 9999,
        background: type === "success" ? "#059669" : "#dc2626",
        color: "white", borderRadius: 12, padding: "12px 18px",
        fontSize: 13, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
        display: "flex", alignItems: "center", gap: 8,
      }}
    >
      {type === "success" ? <FiCheckCircle size={15} /> : <FiAlertCircle size={15} />}
      {msg}
    </motion.div>
  );
}

// ─── Image Generation Preview ─────────────────────────────────────────────────

function ImageGeneratePreview({
  post, token, onConfirm, onCancel
}: {
  post: Post;
  token: string | null;
  onConfirm: (url: string) => void;
  onCancel: () => void;
}) {
  const [prompt, setPrompt] = useState(post.caption || "");
  const [style, setStyle] = useState("realistic");
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setPreviewUrl(null);
    try {
      const res = await fetch(`${API_BASE}/api/posts/${post.id}/images/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt, style }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || err.message || "Generation failed");
      }
      const data = await res.json();
      setPreviewUrl(`${API_BASE}${data.url}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 4 }}>
      {/* Prompt */}
      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        rows={3}
        placeholder="Describe the image you want to generate…"
        style={{
          width: "100%", borderRadius: 8, border: "1px solid #e0e0e0",
          padding: "8px 12px", fontSize: 13, fontFamily: "inherit",
          outline: "none", resize: "none", boxSizing: "border-box", color: "#333",
        }}
      />

      {/* Style + Generate button */}
      <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
        <select
          value={style}
          onChange={e => setStyle(e.target.value)}
          style={{
            borderRadius: 8, border: "1px solid #e0e0e0",
            padding: "6px 10px", fontSize: 12, fontFamily: "inherit",
            color: "#333", outline: "none",
          }}
        >
          {["realistic", "cartoon", "watercolor", "cinematic", "minimalist", "oil-painting"].map(s => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <button onClick={handleGenerate} disabled={loading} style={btnStyle("#059669", true)}>
          <FiZap size={13} /> {loading ? "Generating…" : "Generate"}
        </button>
        <button onClick={onCancel} style={btnStyle("#888")}>Cancel</button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          marginTop: 10, background: "#fee2e2", border: "1px solid #fca5a5",
          borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#dc2626",
        }}>
          ❌ {error}
        </div>
      )}

      {/* Loading spinner */}
      {loading && (
        <div style={{
          marginTop: 16, textAlign: "center", padding: "24px 0",
          background: "#f9f9f9", borderRadius: 12,
        }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🎨</div>
          <div style={{ fontSize: 13, color: "#888" }}>Generating your image with AI…</div>
          <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>This may take up to 30 seconds</div>
        </div>
      )}

      {/* Preview */}
      {previewUrl && !loading && (
        <div style={{ marginTop: 12 }}>
          <img
            src={previewUrl}
            alt="Generated preview"
            style={{
              width: "100%", borderRadius: 12, display: "block",
              maxHeight: 240, objectFit: "cover",
              border: "2px solid #059669",
            }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button
              onClick={() => onConfirm(previewUrl)}
              style={btnStyle("#059669", true)}
            >
              <FiCheckCircle size={13} /> Use this image
            </button>
            <button onClick={handleGenerate} style={btnStyle("#7c3aed")}>
              <FiRefreshCw size={13} /> Regenerate
            </button>
            <button onClick={onCancel} style={btnStyle("#888")}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({ post, selected, onClick }: { post: Post; selected: boolean; onClick: () => void }) {
  const missing = getMissing(post);
  const score = getScore(post);
  const statusKey = normalizeStatus(post.status);
  const status = STATUS_META[statusKey];
  const scoreColor = score === 100 ? "#059669" : score >= 50 ? "#7c3aed" : "#f59e0b";

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      onClick={onClick}
      style={{
        background: selected ? "#faf9ff" : "white",
        border: `1.5px solid ${selected ? "#7c3aed" : "#e8e8e8"}`,
        borderRadius: 16, padding: "16px 18px", cursor: "pointer",
        position: "relative", overflow: "hidden",
        boxShadow: selected ? "0 0 0 3px #7c3aed18" : "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: "#f0f0f0", borderRadius: "16px 16px 0 0",
      }}>
        <div style={{
          height: "100%", width: `${score}%`, background: scoreColor,
          borderRadius: "16px 16px 0 0", transition: "width 0.4s ease",
        }} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ flex: 1, paddingRight: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", marginBottom: 5, lineHeight: 1.3 }}>
            {post.topicName}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{
              fontSize: 11, padding: "2px 8px", borderRadius: 20,
              background: status.bg, color: status.color, fontWeight: 500,
            }}>
              {status.icon} {status.label}
            </span>
            {post.scheduledAt && (
              <span style={{ fontSize: 11, color: "#888" }}>📅 {fmtDate(post.scheduledAt)}</span>
            )}
          </div>
        </div>
        {post.imageUrl ? (
          <img
            src={post.imageUrl.startsWith("http") ? post.imageUrl : `${API_BASE}${post.imageUrl}`}
            alt=""
            style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
          />
        ) : (
          <div style={{
            width: 52, height: 52, borderRadius: 10, background: "#f5f5f5",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, color: "#ccc", fontSize: 20,
          }}>
            <FiImage />
          </div>
        )}
      </div>

      {post.caption ? (
        <div style={{
          fontSize: 12, color: "#555", lineHeight: 1.5,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
          background: "#f9f9f9", borderRadius: 8, padding: "6px 10px", marginBottom: 10,
        }}>
          {post.caption}
        </div>
      ) : (
        <div style={{
          fontSize: 12, color: "#b45309", fontStyle: "italic",
          background: "#fffbeb", borderRadius: 8, padding: "6px 10px",
          marginBottom: 10, display: "flex", alignItems: "center", gap: 5,
        }}>
          <FiAlertCircle style={{ flexShrink: 0 }} /> No caption yet
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {post.platforms && post.platforms.length > 0
            ? post.platforms.map(p => <PlatformBadge key={p} platform={p} />)
            : <span style={{ fontSize: 11, color: "#dc2626", background: "#fee2e2", padding: "2px 8px", borderRadius: 20 }}>No platforms</span>
          }
        </div>
        {missing.length > 0 && (
          <span style={{
            fontSize: 11, color: "#dc2626", background: "#fee2e2",
            padding: "2px 8px", borderRadius: 20, fontWeight: 500, flexShrink: 0,
          }}>
            {missing.length} missing
          </span>
        )}
      </div>

      {post.hashtags && (
        <div style={{ marginTop: 8, fontSize: 11, color: "#7c3aed", opacity: 0.7 }}>
          {post.hashtags}
        </div>
      )}
    </motion.div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({ post, onClose, onUpdate, token }: {
  post: Post;
  onClose: () => void;
  onUpdate: (p: Post) => void;
  token: string | null;
}) {
  const missing = getMissing(post);
  const score = getScore(post);
  const statusKey = normalizeStatus(post.status);
  const status = STATUS_META[statusKey];

  // Caption state
  const [editingCaption, setEditingCaption] = useState(false);
  const [captionDraft, setCaptionDraft] = useState(post.caption || "");
  const [toneDraft, setToneDraft] = useState(post.tone || "Casual");
  const [hashtagsDraft, setHashtagsDraft] = useState(post.hashtags || "");
  const [savingCaption, setSavingCaption] = useState(false);
  const [generatingCaption, setGeneratingCaption] = useState(false);

  // Image state
  const [imageMode, setImageMode] = useState<"none" | "upload" | "url" | "generate">("none");
  const [imageUrlDraft, setImageUrlDraft] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Params state
  const [editingParams, setEditingParams] = useState(false);
  const [scheduledDraft, setScheduledDraft] = useState(
    post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : ""
  );
  const [platformsDraft, setPlatformsDraft] = useState<Platform[]>(post.platforms || []);
  const [savingParams, setSavingParams] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    setCaptionDraft(post.caption || "");
    setToneDraft(post.tone || "Casual");
    setHashtagsDraft(post.hashtags || "");
    setEditingCaption(false);
    setImageMode("none");
    setPlatformsDraft(post.platforms || []);
    setScheduledDraft(post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : "");
    setEditingParams(false);
  }, [post.id]);

  const headers = (isJson = true) => ({
    ...(isJson ? { "Content-Type": "application/json" } : {}),
    "Authorization": `Bearer ${token}`,
  });

  // ── Save Caption ──
  const handleSaveCaption = async () => {
    setSavingCaption(true);
    try {
      const res = await fetch(`${API_BASE}/api/posts/${post.id}/caption`, {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({
          content: captionDraft,
          tone: toneDraft,
          hashtags: hashtagsDraft,
          generatedBy: "manual",
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      onUpdate({ ...post, caption: captionDraft, tone: toneDraft, hashtags: hashtagsDraft });
      setEditingCaption(false);
      showToast("Caption saved!");
    } catch (e: any) {
      showToast(e.message || "Error saving caption", "error");
    } finally {
      setSavingCaption(false);
    }
  };

  // ── Generate Caption via n8n ──
  const handleGenerateCaption = async () => {
    setGeneratingCaption(true);
    try {
      const res = await fetch(`${API_BASE}/api/posts/chat`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          topicId: post.topicId,
          message: `Generate a ${toneDraft} caption`,
          toneOfVoice: toneDraft,
          hashtags: hashtagsDraft,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const generated = data?.output ?? data?.text ?? data?.caption ?? "";
      if (generated) {
        setCaptionDraft(generated);
        setEditingCaption(true);
        showToast("Caption generated! Review and save.");
      }
    } catch (e: any) {
      showToast(e.message || "Generation failed", "error");
    } finally {
      setGeneratingCaption(false);
    }
  };

  // ── Upload Image ──
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_BASE}/api/posts/${post.id}/images/upload`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      onUpdate({ ...post, imageUrl: data.url });
      setImageMode("none");
      showToast("Image uploaded!");
    } catch (e: any) {
      showToast(e.message || "Upload failed", "error");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Set Image URL ──
  const handleSetImageUrl = async () => {
    if (!imageUrlDraft.trim()) return;
    setUploadingImage(true);
    try {
      const res = await fetch(`${API_BASE}/api/posts/${post.id}/images/url`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ url: imageUrlDraft }),
      });
      if (!res.ok) throw new Error(await res.text());
      onUpdate({ ...post, imageUrl: imageUrlDraft });
      setImageUrlDraft("");
      setImageMode("none");
      showToast("Image set!");
    } catch (e: any) {
      showToast(e.message || "Error setting image URL", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  // ── Image Generated Confirmed ──
  const handleImageConfirmed = (url: string) => {
    onUpdate({ ...post, imageUrl: url });
    setImageMode("none");
    showToast("Image generated and saved!");
  };

  // ── Save Params ──
  const handleSaveParams = async () => {
    setSavingParams(true);
    try {
      const res = await fetch(`${API_BASE}/api/posts/${post.id}/params`, {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({
          scheduledAt: scheduledDraft ? new Date(scheduledDraft).toISOString() : null,
          platforms: platformsDraft,
          tone: toneDraft,
          hashtags: hashtagsDraft,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      onUpdate({
        ...post,
        platforms: platformsDraft,
        scheduledAt: scheduledDraft ? new Date(scheduledDraft).toISOString() : null,
        tone: toneDraft,
        hashtags: hashtagsDraft,
      });
      setEditingParams(false);
      showToast("Parameters saved!");
    } catch (e: any) {
      showToast(e.message || "Error saving params", "error");
    } finally {
      setSavingParams(false);
    }
  };

  const ALL_PLATFORMS: Platform[] = ["linkedin", "twitter", "instagram", "facebook", "tiktok", "threads"];
  const togglePlatform = (p: Platform) => {
    setPlatformsDraft(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const resolvedImageUrl = post.imageUrl
    ? post.imageUrl.startsWith("http") ? post.imageUrl : `${API_BASE}${post.imageUrl}`
    : null;

  return (
    <>
      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} />}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 40 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        style={{
          background: "white", border: "1.5px solid #e8e8e8", borderRadius: 20,
          overflow: "hidden", display: "flex", flexDirection: "column", height: "100%",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "18px 20px", borderBottom: "1px solid #f0f0f0",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          background: "#faf9ff",
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", marginBottom: 6 }}>
              {post.topicName}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{
                fontSize: 12, padding: "3px 10px", borderRadius: 20,
                background: status.bg, color: status.color, fontWeight: 600,
              }}>
                {status.icon} {status.label}
              </span>
              <span style={{ fontSize: 12, color: "#888" }}>{fmtDate(post.createdAt)}</span>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#999", padding: 4, borderRadius: 8, display: "flex", alignItems: "center",
          }}>
            <FiX size={18} />
          </button>
        </div>

        {/* Completion meter */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#444" }}>Completeness</span>
            <span style={{
              fontSize: 13, fontWeight: 700,
              color: score === 100 ? "#059669" : score >= 50 ? "#7c3aed" : "#dc2626",
            }}>{score}%</span>
          </div>
          <ScoreBar score={score} />
          {missing.length > 0 && (
            <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {missing.map(m => (
                <span key={m} style={{
                  fontSize: 11, color: "#dc2626", background: "#fee2e2",
                  padding: "2px 8px", borderRadius: 20, fontWeight: 500,
                }}>⚠ {m}</span>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>

          {/* ── Caption ── */}
          <Section title="Caption" icon={<FiFileText size={14} />} status={post.caption ? "ok" : "missing"}>
            {editingCaption ? (
              <div>
                <textarea
                  value={captionDraft}
                  onChange={e => setCaptionDraft(e.target.value)}
                  rows={5}
                  placeholder="Write your caption here…"
                  style={{
                    width: "100%", borderRadius: 10, border: "1.5px solid #7c3aed",
                    padding: 12, fontSize: 13, lineHeight: 1.6, resize: "vertical",
                    fontFamily: "inherit", outline: "none", boxSizing: "border-box", color: "#1a1a1a",
                  }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>Tone</label>
                    <select
                      value={toneDraft}
                      onChange={e => setToneDraft(e.target.value)}
                      style={{
                        width: "100%", marginTop: 4, borderRadius: 8, border: "1px solid #e0e0e0",
                        padding: "6px 10px", fontSize: 12, fontFamily: "inherit", color: "#333",
                        outline: "none",
                      }}
                    >
                      {["Casual", "Professional", "Funny", "Inspirational", "Educational", "Promotional"].map(t => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 2 }}>
                    <label style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>Hashtags</label>
                    <input
                      value={hashtagsDraft}
                      onChange={e => setHashtagsDraft(e.target.value)}
                      placeholder="#tag1 #tag2"
                      style={{
                        width: "100%", marginTop: 4, borderRadius: 8, border: "1px solid #e0e0e0",
                        padding: "6px 10px", fontSize: 12, fontFamily: "inherit", color: "#333",
                        outline: "none", boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button onClick={handleSaveCaption} disabled={savingCaption} style={btnStyle("#7c3aed", true)}>
                    <FiSave size={13} /> {savingCaption ? "Saving…" : "Save"}
                  </button>
                  <button onClick={handleGenerateCaption} disabled={generatingCaption} style={btnStyle("#059669")}>
                    <FiZap size={13} /> {generatingCaption ? "Generating…" : "Re-generate"}
                  </button>
                  <button onClick={() => setEditingCaption(false)} style={btnStyle("#888")}>Cancel</button>
                </div>
              </div>
            ) : post.caption ? (
              <div>
                <div style={{
                  fontSize: 13, color: "#333", lineHeight: 1.7,
                  background: "#f9f9f9", borderRadius: 10, padding: "10px 14px",
                }}>
                  {post.caption}
                </div>
                {post.tone && (
                  <div style={{ fontSize: 11, color: "#888", marginTop: 6 }}>
                    Tone: <strong>{post.tone}</strong>
                  </div>
                )}
                {post.hashtags && (
                  <div style={{ fontSize: 11, color: "#7c3aed", marginTop: 4 }}>
                    {post.hashtags}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button
                    onClick={() => { setCaptionDraft(post.caption!); setToneDraft(post.tone || "Casual"); setHashtagsDraft(post.hashtags || ""); setEditingCaption(true); }}
                    style={btnStyle("#7c3aed")}
                  >
                    <FiEdit3 size={11} /> Edit
                  </button>
                  <button onClick={handleGenerateCaption} disabled={generatingCaption} style={btnStyle("#059669")}>
                    <FiZap size={11} /> {generatingCaption ? "Generating…" : "Re-generate"}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                background: "#fffbeb", border: "1px dashed #fcd34d", borderRadius: 10,
                padding: "14px 16px", textAlign: "center",
              }}>
                <div style={{ fontSize: 13, color: "#92400e", marginBottom: 10 }}>No caption yet</div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                  <button onClick={() => { setCaptionDraft(""); setEditingCaption(true); }} style={btnStyle("#7c3aed")}>
                    <FiEdit3 size={13} /> Write
                  </button>
                  <button onClick={handleGenerateCaption} disabled={generatingCaption} style={btnStyle("#059669")}>
                    <FiZap size={13} /> {generatingCaption ? "Generating…" : "AI Generate"}
                  </button>
                </div>
              </div>
            )}
          </Section>

          {/* ── Media ── */}
          <Section title="Media" icon={<FiImage size={14} />} status={post.imageUrl ? "ok" : "missing"}>

            {/* Current image preview */}
            {resolvedImageUrl && imageMode === "none" && (
              <div style={{ marginBottom: 10 }}>
                <img
                  src={resolvedImageUrl}
                  alt="Post media"
                  style={{
                    width: "100%", borderRadius: 12, display: "block",
                    maxHeight: 220, objectFit: "cover",
                    border: "1px solid #e8e8e8",
                  }}
                />
              </div>
            )}

            {/* Mode selector */}
            {imageMode === "none" && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={() => fileInputRef.current?.click()} style={btnStyle("#7c3aed")}>
                  <FiUpload size={13} /> {resolvedImageUrl ? "Replace" : "Upload"}
                </button>
                <button onClick={() => setImageMode("url")} style={btnStyle("#0077b5")}>
                  <FiLink size={13} /> Set URL
                </button>
                <button onClick={() => setImageMode("generate")} style={btnStyle("#059669")}>
                  <FiZap size={13} /> AI Generate
                </button>
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            {uploadingImage && (
              <div style={{ fontSize: 12, color: "#7c3aed", marginTop: 6 }}>⏳ Uploading…</div>
            )}

            {/* URL mode */}
            {imageMode === "url" && (
              <div style={{ marginTop: 4 }}>
                <input
                  value={imageUrlDraft}
                  onChange={e => setImageUrlDraft(e.target.value)}
                  placeholder="https://…"
                  style={{
                    width: "100%", border: "1px solid #e0e0e0", borderRadius: 8,
                    padding: "8px 12px", fontSize: 13, fontFamily: "inherit",
                    outline: "none", boxSizing: "border-box", color: "#333",
                  }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button onClick={handleSetImageUrl} disabled={uploadingImage} style={btnStyle("#7c3aed", true)}>
                    <FiCheckCircle size={13} /> Apply
                  </button>
                  <button onClick={() => setImageMode("none")} style={btnStyle("#888")}>Cancel</button>
                </div>
              </div>
            )}

            {/* ✅ Generate mode — composant dédié */}
            {imageMode === "generate" && (
              <ImageGeneratePreview
                post={post}
                token={token}
                onConfirm={handleImageConfirmed}
                onCancel={() => setImageMode("none")}
              />
            )}
          </Section>

          {/* ── Platforms & Schedule ── */}
          <Section
            title="Platforms & Schedule"
            icon={<FiSend size={14} />}
            status={(post.platforms?.length || 0) > 0 ? "ok" : "missing"}
          >
            {editingParams ? (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: "#888", fontWeight: 600, marginBottom: 6 }}>PLATFORMS</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {ALL_PLATFORMS.map(p => {
                      const meta = PLATFORM_META[p];
                      const sel = platformsDraft.includes(p);
                      return (
                        <button key={p} onClick={() => togglePlatform(p)} style={{
                          fontSize: 12, padding: "5px 12px", borderRadius: 20,
                          border: `1.5px solid ${sel ? meta.color : "#e0e0e0"}`,
                          background: sel ? meta.bg : "white",
                          color: sel ? meta.color : "#888",
                          cursor: "pointer", fontWeight: sel ? 600 : 400,
                          transition: "all 0.15s", fontFamily: "inherit",
                        }}>
                          {meta.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: "#888", fontWeight: 600, marginBottom: 6 }}>SCHEDULE</div>
                  <input
                    type="datetime-local"
                    value={scheduledDraft}
                    onChange={e => setScheduledDraft(e.target.value)}
                    style={{
                      width: "100%", border: "1px solid #e0e0e0", borderRadius: 8,
                      padding: "8px 12px", fontSize: 13, fontFamily: "inherit",
                      color: "#333", outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={handleSaveParams} disabled={savingParams} style={btnStyle("#7c3aed", true)}>
                    <FiSave size={13} /> {savingParams ? "Saving…" : "Save"}
                  </button>
                  <button onClick={() => setEditingParams(false)} style={btnStyle("#888")}>Cancel</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                  {(post.platforms?.length || 0) > 0
                    ? post.platforms.map(p => <PlatformBadge key={p} platform={p} />)
                    : <span style={{ fontSize: 11, color: "#dc2626", background: "#fee2e2", padding: "2px 8px", borderRadius: 20 }}>No platforms</span>
                  }
                </div>
                {post.scheduledAt && (
                  <div style={{
                    background: "#ede9fe", borderRadius: 10, padding: "8px 12px",
                    fontSize: 13, color: "#5b21b6", fontWeight: 500,
                    display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
                  }}>
                    <FiClock size={14} /> {fmtDate(post.scheduledAt)}
                  </div>
                )}
                <button onClick={() => setEditingParams(true)} style={btnStyle("#7c3aed")}>
                  <FiEdit3 size={11} /> Edit
                </button>
              </div>
            )}
          </Section>

          {/* ── Publish / Schedule actions ── */}
          {statusKey === "draft" && (
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                disabled={score < 75}
                style={{
                  flex: 1, background: "#7c3aed", color: "white", border: "none",
                  borderRadius: 12, padding: "12px 0", fontSize: 14, fontWeight: 600,
                  cursor: score < 75 ? "not-allowed" : "pointer", opacity: score < 75 ? 0.4 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  fontFamily: "inherit",
                }}
                title={score < 75 ? "Complete the post first" : "Publish now"}
              >
                <FiSend size={14} /> Publish
              </button>
              <button style={{
                flex: 1, background: "white", color: "#7c3aed",
                border: "1.5px solid #7c3aed", borderRadius: 12, padding: "12px 0",
                fontSize: 14, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                fontFamily: "inherit",
              }}>
                <FiCalendar size={14} /> Schedule
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PostsView() {
  const { token } = useContext(AuthContext);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "draft" | "scheduled" | "published">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/api/posts`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then(async r => {
        if (!r.ok) {
          const txt = await r.text();
          throw new Error(`${r.status} — ${txt}`);
        }
        return r.json();
      })
      .then((data: any[]) => {
        setPosts(data.map(p => {
          let platforms: Platform[] = [];
          try {
            if (typeof p.platforms === "string") platforms = JSON.parse(p.platforms);
            else if (Array.isArray(p.platforms)) platforms = p.platforms;
          } catch {}
          return {
            id: p.id,
            topicId: p.topicId ?? 0,
            topicName: p.topicName ?? p.topic ?? "",
            hashtags: p.hashtags ?? "",
            caption: p.caption ?? null,
            tone: p.tone ?? null,
            imageUrl: p.imageUrl ?? null,
            videoUrl: null,
            platforms,
            scheduledAt: p.scheduledDate ?? p.scheduledAt ?? null,
            status: p.status ?? "DRAFT",
            createdAt: p.createdAt ?? new Date().toISOString(),
          };
        }));
        setLoading(false);
      })
      .catch(err => {
        console.error("PostsView fetch error:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  const selectedPost = posts.find(p => p.id === selectedId) ?? null;

  const filtered = posts.filter(p => {
    const s = normalizeStatus(p.status);
    if (filter !== "all" && s !== filter) return false;
    if (search && !p.topicName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleUpdate = (updated: Post) => {
    setPosts(ps => ps.map(p => p.id === updated.id ? updated : p));
  };

  const counts = {
    all: posts.length,
    draft: posts.filter(p => normalizeStatus(p.status) === "draft").length,
    scheduled: posts.filter(p => normalizeStatus(p.status) === "scheduled").length,
    published: posts.filter(p => normalizeStatus(p.status) === "published").length,
  };

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>Posts</h1>
        <p style={{ color: "#888", marginTop: 4, fontSize: 14 }}>Manage and complete your content</p>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {(["all", "draft", "scheduled", "published"] as const).map(key => {
          const meta = {
            all:       { label: "All",       color: "#7c3aed", bg: "#ede9fe" },
            draft:     { label: "Drafts",    color: "#d97706", bg: "#fef3c7" },
            scheduled: { label: "Scheduled", color: "#7c3aed", bg: "#ede9fe" },
            published: { label: "Published", color: "#059669", bg: "#d1fae5" },
          }[key];
          return (
            <div key={key} style={{
              background: "white", border: "1.5px solid #f0f0f0", borderRadius: 14,
              padding: "12px 18px", display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: meta.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontWeight: 700, color: meta.color,
              }}>
                {counts[key]}
              </div>
              <span style={{ fontSize: 13, color: "#666" }}>{meta.label}</span>
            </div>
          );
        })}
      </div>

      {/* Search + Filter */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{
          flex: 1, minWidth: 200, display: "flex", alignItems: "center",
          gap: 8, background: "white", border: "1.5px solid #e8e8e8",
          borderRadius: 12, padding: "8px 14px",
        }}>
          <FiSearch size={15} style={{ color: "#aaa", flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search posts…"
            style={{
              border: "none", outline: "none", fontSize: 13,
              fontFamily: "inherit", width: "100%", color: "#333", background: "transparent",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(["all", "draft", "scheduled", "published"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600,
              cursor: "pointer", border: "1.5px solid",
              background: filter === f ? "#7c3aed" : "white",
              color: filter === f ? "white" : "#888",
              borderColor: filter === f ? "#7c3aed" : "#e8e8e8",
              transition: "all 0.15s", textTransform: "capitalize", fontFamily: "inherit",
            }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* States */}
      {loading && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#aaa" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
          <div style={{ fontSize: 14 }}>Loading posts…</div>
        </div>
      )}

      {error && (
        <div style={{
          background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 12,
          padding: "14px 18px", marginBottom: 20, fontSize: 13, color: "#dc2626",
        }}>
          <strong>Fetch error:</strong> {error}
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
            ➜ Vérifie que le backend tourne sur <code>{API_BASE}</code>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          {/* List */}
          <div style={{
            flex: selectedPost ? "0 0 380px" : 1,
            transition: "flex 0.3s ease",
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#aaa" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <div style={{ fontSize: 14 }}>
                  {posts.length === 0 ? "No posts in database yet" : "No posts match this filter"}
                </div>
              </div>
            )}
            <AnimatePresence>
              {filtered.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  selected={selectedId === post.id}
                  onClick={() => setSelectedId(selectedId === post.id ? null : post.id)}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Detail */}
          <AnimatePresence>
            {selectedPost && (
              <motion.div
                key="detail"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "100%", flex: 1 }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                style={{ minWidth: 0, height: "calc(100vh - 240px)", position: "sticky", top: 20 }}
              >
                <DetailPanel
                  post={selectedPost}
                  onClose={() => setSelectedId(null)}
                  onUpdate={handleUpdate}
                  token={token}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
} 