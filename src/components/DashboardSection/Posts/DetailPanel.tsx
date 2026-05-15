import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactDOM from "react-dom";
import {
  FiImage, FiFileText, FiClock, FiCheckCircle, FiAlertCircle,
  FiX, FiEdit3, FiUpload, FiSend, FiCalendar, FiRefreshCw,
  FiZap, FiSave, FiLink, FiHeart, FiMessageCircle,
  FiShare2, FiBookmark, FiSmile
} from "react-icons/fi";
import type { Post } from "./PostsView";

const API_BASE: string = import.meta.env.VITE_API_URL ?? "https://localhost:7079";

type Platform = "linkedin" | "twitter" | "instagram" | "facebook" | "tiktok" | "threads";

const PLATFORM_META: Record<Platform, { label: string; color: string; bg: string; icon: string }> = {
  linkedin:  { label: "LinkedIn",  color: "#0077b5", bg: "#e8f4fb", icon: "💼" },
  twitter:   { label: "Twitter/X", color: "#1da1f2", bg: "#e8f6fe", icon: "🐦" },
  instagram: { label: "Instagram", color: "#e1306c", bg: "#fce8ef", icon: "📸" },
  facebook:  { label: "Facebook",  color: "#1877f2", bg: "#e8f0fd", icon: "📘" },
  tiktok:    { label: "TikTok",    color: "#555555", bg: "#f0f0f0", icon: "🎵" },
  threads:   { label: "Threads",   color: "#333333", bg: "#efefef", icon: "🧵" },
};

const STATUS_META = {
  draft:     { label: "Draft",     color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb", dot: "#9ca3af", icon: "✏️" },
  inreview:  { label: "In Review", color: "#dc2626", bg: "#eff6ff", border: "#bfdbfe", dot: "#60a5fa", icon: "🔎" },
  approved:  { label: "Approved",  color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", dot: "#34d399", icon: "✅" },
  scheduled: { label: "Scheduled", color: "#dc2626", bg: "#fef2f2", border: "#ed8faf", dot: "#ed8faf", icon: "📅" },
  published: { label: "Published", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", dot: "#34d399", icon: "✅" },
  failed:    { label: "Failed",    color: "#dc2626", bg: "#fef2f2", border: "#fecaca", dot: "#f87171", icon: "❌" },
};

// ─── Light Palette (Instagram-style, no purple) ───────────────────────────────
const C = {
  bg:         "#ffffff",
  surface:    "#ffffff",
  surfaceSub: "#fafafa",
  border:     "#dbdbdb",
  borderHi:   "#262626",
  text:       "#262626",
  textSub:    "#4a4a4a",
  textMuted:  "#8e8e8e",
  textDim:    "#c7c7c7",
  accent:     "#0095f6",
  accentSoft: "#e8f4fd",
  accentGlow: "rgba(0,149,246,0.1)",
  likeRed:    "#ed4956",
  likeRedSoft: "#fef2f2",
  shadow:     "rgba(0,0,0,0.05)",
  shadowLg:   "rgba(0,0,0,0.15)",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────



  const parsePlatforms = (p: any): Platform[] => {
  if (!p) return [];
  if (Array.isArray(p)) return p;
  try { return JSON.parse(p); } catch { return []; }
};
export const normalizeStatus = (s: string): "draft" | "inreview" | "approved" | "scheduled" | "published" | "failed" => {
  switch ((s ?? "").toUpperCase()) {
    case "INREVIEW": return "inreview";
    case "APPROVED": return "approved";
    case "SCHEDULED": return "scheduled";
    case "PUBLISHED": return "published";
    case "FAILED":    return "failed";
    default:          return "draft";
  }
};

export function getMissing(post: Post) {
  const m: string[] = [];
  if (!post.caption) m.push("caption");
  if (!post.imageUrl) m.push("media");
  if (parsePlatforms(post.platforms).length === 0) m.push("platforms");
  return m;
}

export function getScore(post: Post) { 
  return Math.round(((4 - getMissing(post).length) / 4) * 100); 
}

export function fmtDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function fmtTime(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export function resolveImageUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("data:") || url.startsWith("http")) return url;
  return `${API_BASE}${url}`;
}

const extractCaptionFromChatResponse = (data: any): string => {
  const candidate = data?.output ?? data?.reply ?? data?.message ?? data?.text ?? data?.caption;
  if (typeof candidate === "string") {
    try {
      const parsed = JSON.parse(candidate);
      return parsed?.finalCaption || parsed?.reply || parsed?.message || candidate;
    } catch {
      return candidate;
    }
  }
  if (candidate && typeof candidate === "object") {
    return candidate.finalCaption || candidate.reply || candidate.message || "";
  }
  return "";
};





// ─── Input style ──────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 8,
  border: `1px solid ${C.border}`,
  background: C.surfaceSub, color: C.text,
  fontSize: 13, fontFamily: "inherit",
  outline: "none", boxSizing: "border-box",
  transition: "border-color 0.18s",
};

const focusInput = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  e.currentTarget.style.borderColor = C.accent;
  e.currentTarget.style.background = C.bg;
};

const blurInput = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  e.currentTarget.style.borderColor = C.border;
  e.currentTarget.style.background = C.surfaceSub;
};

// ─── Button ───────────────────────────────────────────────────────────────────
function Btn({ color = C.accent, bg, children, disabled, onClick, style: extraStyle }: {
  color?: string; bg?: string; children: React.ReactNode;
  disabled?: boolean; onClick?: () => void; style?: React.CSSProperties;
}) {
  const filled = !!bg;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: bg || "transparent",
      color: filled ? "#fff" : color,
      border: filled ? "none" : `1px solid ${color}40`,
      borderRadius: 8, padding: "8px 16px",
      fontSize: 12, fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      display: "inline-flex", alignItems: "center", gap: 6,
      fontFamily: "inherit", transition: "all 0.2s",
      ...(extraStyle || {}),
    }}
    >
      {children}
    </button>
  );
}

// ─── Image Generate Preview ───────────────────────────────────────────────────
function ImageGeneratePreview({ post, token, onConfirm, onCancel }: {
  post: Post; token: string | null; onConfirm: (url: string) => void; onCancel: () => void;
}) {
  const [prompt, setPrompt] = useState(post.caption || "");
  const [style, setStyle] = useState("realistic");
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true); setError(null); setPreviewUrl(null);
    try {
      const res = await fetch(`${API_BASE}/api/posts/${post.id}/images/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ prompt, style }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || err.message || "Generation failed"); }
      setPreviewUrl((await res.json()).url);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ marginTop: 12 }}>
      <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3}
        placeholder="Describe the image you want to generate..."
        style={{ ...inputStyle, resize: "none" }}
        onFocus={focusInput} onBlur={blurInput} />
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
        <select value={style} onChange={e => setStyle(e.target.value)}
          style={{ ...inputStyle, width: "auto", padding: "8px 12px", cursor: "pointer" }}>
          {["realistic","cartoon","watercolor","cinematic","minimalist","oil-painting"].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <Btn color={C.accent} bg={C.accent} onClick={handleGenerate} disabled={loading}>
          <FiZap size={12} /> {loading ? "Generating..." : "Generate"}
        </Btn>
        <Btn color={C.textMuted} onClick={onCancel}>Cancel</Btn>
      </div>
      {error && (
        <div style={{ marginTop: 10, background: C.likeRedSoft, border: `1px solid #fecaca`, borderRadius: 8, padding: "10px 13px", fontSize: 12, color: C.likeRed }}>
          ❌ {error}
        </div>
      )}
      {loading && (
        <div style={{ marginTop: 16, textAlign: "center", padding: "28px", background: C.surfaceSub, borderRadius: 12, border: `1px dashed ${C.border}` }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }} style={{ fontSize: 28, marginBottom: 8 }}>🎨</motion.div>
          <div style={{ fontSize: 13, color: C.textMuted }}>AI is painting your image...</div>
        </div>
      )}
      {previewUrl && !loading && (
        <div style={{ marginTop: 14 }}>
          <img src={previewUrl} alt="Generated" style={{ width: "100%", borderRadius: 12, display: "block", maxHeight: 240, objectFit: "cover", border: `2px solid ${C.accent}` }} />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <Btn color="#059669" bg="#059669" onClick={() => onConfirm(previewUrl)}><FiCheckCircle size={12} /> Use This</Btn>
            <Btn color={C.accent} onClick={handleGenerate} disabled={loading}><FiRefreshCw size={12} /> Retry</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Platform Badge ───────────────────────────────────────────────────────────
function PlatformBadge({ platform }: { platform: Platform }) {
  const m = PLATFORM_META[platform];
  if (!m) return null;
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: "4px 11px", borderRadius: 6,
      background: m.bg, color: m.color, border: `1px solid ${m.color}22`,
      display: "inline-flex", alignItems: "center", gap: 5,
    }}>
      <span style={{ fontSize: 10 }}>{m.icon}</span>{m.label}
    </span>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
  const isOk = type === "success";
  return ReactDOM.createPortal(
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.95 }}
      style={{
        position: "fixed", bottom: 28, right: 28, zIndex: 999999,
        background: isOk ? "#ecfdf5" : "#fef2f2",
        color: isOk ? "#059669" : "#dc2626",
        borderRadius: 10, padding: "12px 18px",
        fontSize: 13, fontWeight: 600,
        border: `1px solid ${isOk ? "#a7f3d0" : "#fecaca"}`,
        boxShadow: `0 4px 12px rgba(0,0,0,0.1)`,
        display: "flex", alignItems: "center", gap: 9,
      }}
    >
      {isOk ? <FiCheckCircle size={15} /> : <FiAlertCircle size={15} />}
      {msg}
    </motion.div>,
    document.body
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export type DetailPanelProps = {
  post: Post; onClose: () => void; onUpdate: (p: Post) => void; token: string | null;
};

export default function DetailPanel({ post, onClose, onUpdate, token }: DetailPanelProps) {
  const statusKey = normalizeStatus(post.status);
  const status = STATUS_META[statusKey];

  const [editingCaption, setEditingCaption] = useState(false);
  const [captionDraft, setCaptionDraft] = useState(post.caption || "");
  const [toneDraft, setToneDraft] = useState(post.tone || "Casual");
  const [hashtagsDraft, setHashtagsDraft] = useState(post.hashtags || "");
  const [savingCaption, setSavingCaption] = useState(false);
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const [imageMode, setImageMode] = useState<"none" | "upload" | "url" | "generate">("none");
  const [imageUrlDraft, setImageUrlDraft] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingParams, setEditingParams] = useState(false);
  const [scheduledDraft, setScheduledDraft] = useState(
    post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : ""
  );
  const [statusDraft, setStatusDraft] = useState(post.status || "draft");
  const [platformsDraft, setPlatformsDraft] = useState<Platform[]>(post.platforms || []);
  const [savingParams, setSavingParams] = useState(false);
  const [toastState, setToastState] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const canApprove = !!post.caption?.trim() && !!post.imageUrl;

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastState({ msg, type });
    setTimeout(() => setToastState(null), 3000);
  };
const [currentImageIndex, setCurrentImageIndex] = useState(0);
 
// 2. Ajoute cette ligne pour parser les images du post :
const postImages = (() => {
  // imageUrls vient du backend comme array, imageUrl comme string
  const urls = (post as any).imageUrls as string[] | undefined;
  if (Array.isArray(urls) && urls.length > 0) return urls;
  if (post.imageUrl) return [post.imageUrl];
  return [];
})();


  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  useEffect(() => {
    setCaptionDraft(post.caption || "");
    setToneDraft(post.tone || "Casual");
    setHashtagsDraft(post.hashtags || "");
    setEditingCaption(false); setImageMode("none");
    setPlatformsDraft(parsePlatforms(post.platforms));
    setScheduledDraft(post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : "");
    setStatusDraft(post.status || "draft");
    setEditingParams(false);
    setLiked(false);
    setSaved(false);
  }, [post.id]);

  const headers = (isJson = true) => ({
    ...(isJson ? { "Content-Type": "application/json" } : {}),
    "Authorization": `Bearer ${token}`,
  });

 // ─── PATCH à appliquer dans DetailPanel.tsx ──────────────────────────────────
// Remplace les deux fonctions existantes par celles-ci

// ── 1. handleSaveCaption ──────────────────────────────────────────────────────
// Quand on sauvegarde la caption → repasse en InReview + annule scheduling

const handleSaveCaption = async () => {
  setSavingCaption(true);
  try {
    // a) Sauvegarde la caption
    const res = await fetch(`${API_BASE}/api/posts/${post.id}/caption`, {
      method: "PATCH", headers: headers(),
      body: JSON.stringify({
        content:     captionDraft,
        tone:        toneDraft,
        hashtags:    hashtagsDraft,
        generatedBy: "manual",
      }),
    });
    if (!res.ok) throw new Error(await res.text());

    // b) Repasse en InReview + annule scheduledAt
    await fetch(`${API_BASE}/api/posts/${post.id}/params`, {
      method: "PATCH", headers: headers(),
      body: JSON.stringify({
        status:      "inreview",
        scheduledAt: null,       // ← annule la planification
        platforms:   post.platforms ?? [],
      }),
    });

    onUpdate({
      ...post,
      caption:     captionDraft,
      tone:        toneDraft,
      hashtags:    hashtagsDraft,
      status:      "inreview",
      scheduledAt: null,         // ← retiré du calendrier
    });

    setEditingCaption(false);
    showToast("Caption saved — status reset to In Review 🔍");
  } catch (e: any) {
    showToast(e.message || "Error", "error");
  } finally {
    setSavingCaption(false);
  }
};

// ── 2. handleFileChange ───────────────────────────────────────────────────────
// Quand on change l'image → repasse en InReview + annule scheduling

const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setUploadingImage(true);
  try {
    // a) Upload l'image
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API_BASE}/api/posts/${post.id}/images/upload`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
      body: fd,
    });
    if (!res.ok) throw new Error(await res.text());
    const { url } = await res.json();

    // b) Repasse en InReview + annule scheduledAt
    await fetch(`${API_BASE}/api/posts/${post.id}/params`, {
      method: "PATCH", headers: headers(),
      body: JSON.stringify({
        status:      "inreview",
        scheduledAt: null,
        platforms:   post.platforms ?? [],
      }),
    });

    onUpdate({
      ...post,
      imageUrl:    url,
      status:      "inreview",
      scheduledAt: null,
    });

    setImageMode("none");
    showToast("Image updated — status reset to In Review 🔍");
  } catch (e: any) {
    showToast(e.message || "Upload failed", "error");
  } finally {
    setUploadingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }
};

// ── 3. handleSetImageUrl ──────────────────────────────────────────────────────
// Quand on change l'image via URL → même logique

const handleSetImageUrl = async () => {
  if (!imageUrlDraft.trim()) return;
  setUploadingImage(true);
  try {
    const res = await fetch(`${API_BASE}/api/posts/${post.id}/images/url`, {
      method: "POST", headers: headers(),
      body: JSON.stringify({ url: imageUrlDraft }),
    });
    if (!res.ok) throw new Error(await res.text());

    // Repasse en InReview + annule scheduledAt
    await fetch(`${API_BASE}/api/posts/${post.id}/params`, {
      method: "PATCH", headers: headers(),
      body: JSON.stringify({
        status:      "inreview",
        scheduledAt: null,
        platforms:   post.platforms ?? [],
      }),
    });

    onUpdate({
      ...post,
      imageUrl:    imageUrlDraft,
      status:      "inreview",
      scheduledAt: null,
    });

    setImageUrlDraft("");
    setImageMode("none");
    showToast("Image updated — status reset to In Review 🔍");
  } catch (e: any) {
    showToast(e.message || "Error", "error");
  } finally {
    setUploadingImage(false);
  }
};






  const handleGenerateCaption = async () => {
    setGeneratingCaption(true);
    try {
      const res = await fetch(`${API_BASE}/api/posts/chat`, {
        method: "POST", headers: headers(),
        body: JSON.stringify({
          topicId: post.topicId,
          message: `Generate a ${toneDraft} caption for a post about ${post.topicName}`,
          toneOfVoice: toneDraft,
          hashtags: hashtagsDraft,
          platforms: parsePlatforms(post.platforms),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const generated = extractCaptionFromChatResponse(data);
      if (generated) { setCaptionDraft(generated); setEditingCaption(true); showToast("Caption generated!"); }
    } catch (e: any) { showToast(e.message || "Failed", "error"); }
    finally { setGeneratingCaption(false); }
  };

 
  const handleImageConfirmed = (dataUrl: string) => {
    onUpdate({ ...post, imageUrl: dataUrl });
    setImageMode("none"); showToast("Image saved!");
  };

  const handleSaveParams = async () => {
    if (statusDraft === "approved" && !canApprove) {
      showToast("Caption + image are required before Approved.", "error");
      return;
    }
    setSavingParams(true);
    try {
      const res = await fetch(`${API_BASE}/api/posts/${post.id}/params`, {
        method: "PATCH", headers: headers(),
        body: JSON.stringify({
          scheduledAt: scheduledDraft ? new Date(scheduledDraft).toISOString() : null,
          platforms: platformsDraft,
          status: statusDraft,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      onUpdate({
        ...post,
        status: statusDraft,
        platforms: platformsDraft,
        scheduledAt: scheduledDraft ? new Date(scheduledDraft).toISOString() : null,
      });
      setEditingParams(false); showToast("Settings saved!");
    } catch (e: any) { showToast(e.message || "Error", "error"); }
    finally { setSavingParams(false); }
  };

  const handlePublish = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/posts/${post.id}/publish`, { method: "POST", headers: headers() });
      if (!res.ok) throw new Error(await res.text());
      onUpdate(await res.json()); showToast("Published! 🚀");
    } catch (e: any) { showToast(e.message || "Error", "error"); }
  };

  const handleSchedule = async () => {
    if (!scheduledDraft) {
      showToast("Pick a date first", "error");
      return;
    }
    if (statusKey !== "approved") {
      showToast("Post must be Approved before Scheduled.", "error");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/posts/${post.id}/schedule`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ scheduledAt: new Date(scheduledDraft).toISOString() }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updatedPost = await res.json();
      onUpdate(updatedPost);
      setEditingParams(false);
      showToast(`Scheduled for ${new Date(scheduledDraft).toLocaleString()}! 📅`);
    } catch (e: any) {
      showToast(e.message || "Error scheduling post", "error");
    }
  };

  const ALL_PLATFORMS: Platform[] = ["instagram", "linkedin", "twitter", "facebook", "tiktok", "threads"];
  const togglePlatform = (p: Platform) =>
    setPlatformsDraft(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  // Mock user data (safe access)
  const mockUser = {
    username: (post as any).user?.username || "creator",
    avatar: (post as any).user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.topicName || "User")}&background=0095f6&color=fff`,
    name: (post as any).user?.name || "Content Creator"
  };

  const overlay = (
    <motion.div
      key="dp-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", top: 0, left: 0,
        width: "100vw", height: "100vh",
        background: "rgba(0, 0, 0, 0.85)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <motion.div
        key="dp-card"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: C.bg,
          borderRadius: 0,
          width: "auto",
          maxWidth: "90vw",
          height: "auto",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
          overflow: "hidden",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        {/* LEFT SIDE: IMAGE */}
        <div style={{
  flex: "1 1 auto",
  background: "#000",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: window.innerWidth < 768 ? "auto" : "300px",
  position: "relative",
}}>
  {postImages.length > 0 ? (
    <>
      {/* Current image */}
      <img
        src={resolveImageUrl(postImages[currentImageIndex]) ?? ""}
        alt={post.caption || "Post image"}
        style={{
          maxWidth: "100%",
          maxHeight: "85vh",
          width: "auto",
          height: "auto",
          objectFit: "contain",
          display: "block",
          transition: "opacity 0.2s",
        }}
      />
 
      {/* Navigation arrows - only if multiple images */}
      {postImages.length > 1 && (
        <>
          <button
            onClick={() => setCurrentImageIndex(i => Math.max(0, i - 1))}
            disabled={currentImageIndex === 0}
            style={{
              position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
              width: 32, height: 32, borderRadius: "50%",
              background: "rgba(255,255,255,0.85)", border: "none",
              cursor: currentImageIndex === 0 ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, opacity: currentImageIndex === 0 ? 0.4 : 1,
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
          >‹</button>
 
          <button
            onClick={() => setCurrentImageIndex(i => Math.min(postImages.length - 1, i + 1))}
            disabled={currentImageIndex === postImages.length - 1}
            style={{
              position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              width: 32, height: 32, borderRadius: "50%",
              background: "rgba(255,255,255,0.85)", border: "none",
              cursor: currentImageIndex === postImages.length - 1 ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, opacity: currentImageIndex === postImages.length - 1 ? 0.4 : 1,
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
          >›</button>
 
          {/* Dots indicator */}
          <div style={{
            position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
            display: "flex", gap: 6,
          }}>
            {postImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                style={{
                  width: idx === currentImageIndex ? 18 : 6,
                  height: 6, borderRadius: 3,
                  background: idx === currentImageIndex ? "#fff" : "rgba(255,255,255,0.5)",
                  border: "none", cursor: "pointer", padding: 0,
                  transition: "all 0.2s",
                }}
              />
            ))}
          </div>
 
          {/* Counter */}
          <div style={{
            position: "absolute", top: 12, right: 12,
            background: "rgba(0,0,0,0.6)", borderRadius: 12,
            padding: "3px 10px", fontSize: 11, color: "#fff", fontWeight: 600,
          }}>
            {currentImageIndex + 1} / {postImages.length}
          </div>
        </>
      )}
    </>
  ) : (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: 60, color: C.textDim,
    }}>
      <FiImage size={48} />
      <p style={{ marginTop: 16, fontSize: 14 }}>No image yet</p>
      <button onClick={() => setImageMode("upload")} style={{
        marginTop: 12, background: C.accent, border: "none",
        padding: "8px 16px", borderRadius: 8, color: "#fff",
        cursor: "pointer", fontSize: 13, fontWeight: 600,
      }}>
        Upload Image
      </button>
    </div>
  )}
</div>

        {/* RIGHT SIDE: INFO PANEL */}
        <div style={{
          width: window.innerWidth < 768 ? "100%" : "400px",
          maxWidth: "400px",
          background: C.bg,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            padding: "14px 16px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img
                src={mockUser.avatar}
                alt={mockUser.username}
                style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }}
              />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                  {mockUser.username}
                </div>
                <div style={{ fontSize: 11, color: C.textMuted }}>
                  {post.topicName}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                background: status.bg, color: status.color,
                padding: "4px 8px", borderRadius: 6,
                fontSize: 10, fontWeight: 600,
              }}>
                {status.label}
              </div>
              <button onClick={onClose} style={{
                background: "transparent", border: "none",
                cursor: "pointer", color: C.textMuted,
                padding: 4, display: "flex",
              }}>
                <FiX size={18} />
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px",
          }}>
            {/* Caption Section */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <FiFileText size={14} color={C.textMuted} />
                <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Caption
                </span>
                {!post.caption && <span style={{ fontSize: 10, color: "#dc2626", marginLeft: "auto" }}>⚠ Required</span>}
              </div>
              {editingCaption ? (
                <div>
                  <textarea value={captionDraft} onChange={e => setCaptionDraft(e.target.value)} rows={4}
                    style={{ ...inputStyle, resize: "vertical", marginBottom: 12 }}
                    onFocus={focusInput} onBlur={blurInput} placeholder="Write a caption..." />
                  <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                    <select value={toneDraft} onChange={e => setToneDraft(e.target.value)}
                      style={{ ...inputStyle, width: "auto", padding: "7px 11px", cursor: "pointer" }}>
                      {["Casual","Professional","Funny","Inspirational","Educational"].map(t => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                    <input value={hashtagsDraft} onChange={e => setHashtagsDraft(e.target.value)}
                      placeholder="#hashtags"
                      style={{ ...inputStyle, flex: 1, padding: "7px 11px" }}
                      onFocus={focusInput} onBlur={blurInput} />
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Btn color="#059669" bg="#059669" onClick={handleSaveCaption} disabled={savingCaption}>
                      <FiSave size={12} /> {savingCaption ? "Saving..." : "Save"}
                    </Btn>
                    <Btn color={C.accent} onClick={handleGenerateCaption} disabled={generatingCaption}>
                      <FiZap size={12} /> {generatingCaption ? "Generating..." : "AI Generate"}
                    </Btn>
                    <Btn color={C.textMuted} onClick={() => setEditingCaption(false)}>Cancel</Btn>
                  </div>
                </div>
              ) : (
                <div>
                  {post.caption ? (
                    <div style={{
                      background: C.surfaceSub,
                      borderRadius: 8,
                      padding: "12px",
                      fontSize: 13,
                      lineHeight: 1.5,
                      color: C.textSub,
                    }}>
                      <p style={{ margin: 0 }}>{post.caption}</p>
                      {post.hashtags && (
                        <p style={{ margin: "8px 0 0 0", fontSize: 12, color: C.accent }}>{post.hashtags}</p>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: "12px", background: C.surfaceSub, borderRadius: 8, textAlign: "center" }}>
                      <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>No caption yet</p>
                    </div>
                  )}
                  <button onClick={() => setEditingCaption(true)} style={{
                    marginTop: 10,
                    background: "transparent",
                    border: "none",
                    color: C.accent,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: 0,
                  }}>
                    <FiEdit3 size={12} style={{ marginRight: 4 }} /> Edit caption
                  </button>
                </div>
              )}
            </div>

            {/* Media Section */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <FiImage size={14} color={C.textMuted} />
                <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Media
                </span>
                {!post.imageUrl && <span style={{ fontSize: 10, color: "#dc2626", marginLeft: "auto" }}>⚠ Required</span>}
              </div>
              {imageMode === "none" && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Btn color={C.accent} onClick={() => setImageMode("upload")}><FiUpload size={12} /> Upload</Btn>
                  <Btn color={C.accent} onClick={() => setImageMode("url")}><FiLink size={12} /> Add URL</Btn>
                  <Btn color={C.accent} onClick={() => setImageMode("generate")}><FiZap size={12} /> AI Generate</Btn>
                </div>
              )}
              {imageMode === "upload" && (
                <div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn color={C.accent} bg={C.accent} onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
                      <FiUpload size={12} /> {uploadingImage ? "Uploading..." : "Choose File"}
                    </Btn>
                    <Btn color={C.textMuted} onClick={() => setImageMode("none")}>Cancel</Btn>
                  </div>
                </div>
              )}
              {imageMode === "url" && (
                <div>
                  <input value={imageUrlDraft} onChange={e => setImageUrlDraft(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    style={{ ...inputStyle, marginBottom: 10 }}
                    onFocus={focusInput} onBlur={blurInput} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn color="#059669" bg="#059669" onClick={handleSetImageUrl} disabled={uploadingImage}>
                      {uploadingImage ? "Saving..." : "Set URL"}
                    </Btn>
                    <Btn color={C.textMuted} onClick={() => setImageMode("none")}>Cancel</Btn>
                  </div>
                </div>
              )}
              {imageMode === "generate" && (
                <ImageGeneratePreview post={post} token={token} onConfirm={handleImageConfirmed} onCancel={() => setImageMode("none")} />
              )}
            </div>

            {/* Distribution Section */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <FiClock size={14} color={C.textMuted} />
                <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Distribution
                </span>
                {!post.platforms?.length && <span style={{ fontSize: 10, color: "#dc2626", marginLeft: "auto" }}>⚠ Required</span>}
              </div>
              {editingParams ? (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: C.textMuted, display: "block", marginBottom: 8 }}>Platforms</label>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {ALL_PLATFORMS.map(p => {
                        const sel = platformsDraft.includes(p);
                        const m = PLATFORM_META[p];
                        return (
                          <button key={p} onClick={() => togglePlatform(p)} style={{
                            padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                            background: sel ? m.bg : C.surfaceSub,
                            border: `1px solid ${sel ? m.color + "55" : C.border}`,
                            color: sel ? m.color : C.textMuted,
                            cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5,
                            transition: "all 0.15s",
                          }}>
                            <span>{m.icon}</span>{m.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: C.textMuted, display: "block", marginBottom: 8 }}>Schedule (optional)</label>
                    <input type="datetime-local" value={scheduledDraft} onChange={e => setScheduledDraft(e.target.value)}
                      style={inputStyle}
                      onFocus={focusInput} onBlur={blurInput} />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: C.textMuted, display: "block", marginBottom: 8 }}>Status</label>
                    <select
                      value={statusDraft}
                      onChange={e => setStatusDraft(e.target.value)}
                      style={{ ...inputStyle, cursor: "pointer" }}
                    >
                      <option value="draft">Draft</option>
                      <option value="inreview">In Review</option>
                      <option value="approved" disabled={!canApprove}>Approved</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="published">Published</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn color="#059669" bg="#059669" onClick={handleSaveParams} disabled={savingParams}>
                      <FiSave size={12} /> {savingParams ? "Saving..." : "Save Changes"}
                    </Btn>
                    <Btn color={C.textMuted} onClick={() => setEditingParams(false)}>Cancel</Btn>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                    {parsePlatforms(post.platforms).map(p => <PlatformBadge key={p} platform={p} />)}
                    {(!post.platforms || post.platforms.length === 0) && (
                      <span style={{ fontSize: 12, color: C.textDim }}>No platforms selected</span>
                    )}
                  </div>
                  {post.scheduledAt && (
                    <div style={{
                      fontSize: 12, color: C.textMuted, marginBottom: 12,
                      display: "flex", alignItems: "center", gap: 6,
                    }}>
                      <FiCalendar size={12} /> Scheduled for {fmtDate(post.scheduledAt)} at {fmtTime(post.scheduledAt)}
                    </div>
                  )}
                  <button onClick={() => setEditingParams(true)} style={{
                    background: "transparent",
                    border: "none",
                    color: C.accent,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: 0,
                  }}>
                    <FiEdit3 size={12} style={{ marginRight: 4 }} /> Configure
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons (Instagram-style) */}
          <div style={{
            borderTop: `1px solid ${C.border}`,
            padding: "12px 16px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 16 }}>
                <button onClick={() => setLiked(!liked)} style={{
                  background: "transparent", border: "none", cursor: "pointer",
                  color: liked ? C.likeRed : C.textMuted, fontSize: 24,
                }}>
                  <FiHeart fill={liked ? C.likeRed : "none"} size={24} />
                </button>
                <button style={{ background: "transparent", border: "none", cursor: "pointer", color: C.textMuted }}>
                  <FiMessageCircle size={24} />
                </button>
                <button style={{ background: "transparent", border: "none", cursor: "pointer", color: C.textMuted }}>
                  <FiShare2 size={24} />
                </button>
              </div>
              <button onClick={() => setSaved(!saved)} style={{
                background: "transparent", border: "none", cursor: "pointer",
                color: C.textMuted,
              }}>
                <FiBookmark fill={saved ? C.text : "none"} size={24} />
              </button>
            </div>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>124 likes</span>
            </div>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{mockUser.username}</span>
              <span style={{ fontSize: 13, marginLeft: 8, color: C.textSub }}>
                {post.caption?.substring(0, 100) || "No caption yet"}
              </span>
            </div>
            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 12 }}>
              View all 12 comments
            </div>
            <div style={{ fontSize: 10, color: C.textMuted }}>
              {fmtDate(post.createdAt)} · See translation
            </div>
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
              <FiSmile size={20} color={C.textMuted} />
              <input
                type="text"
                placeholder="Add a comment..."
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  fontSize: 13,
                  background: "transparent",
                }}
              />
              <button style={{
                background: "transparent",
                border: "none",
                color: C.accent,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                opacity: 0.7,
              }}>
                Post
              </button>
            </div>
          </div>

          {/* Action footer for publishing */}
          {(statusKey === "draft" || statusKey === "approved" || statusKey === "scheduled") && (
            <div style={{
              borderTop: `1px solid ${C.border}`,
              padding: "12px 16px",
              display: "flex",
              gap: 8,
            }}>
              {statusKey === "approved" && (
                <Btn color={C.accent} bg={C.accent} onClick={() => {
                  if (scheduledDraft) handleSchedule();
                  else handlePublish();
                }}>
                  <FiSend size={13} /> {scheduledDraft ? "Schedule Post" : "Publish Now"}
                </Btn>
              )}
              {(statusKey === "draft" || statusKey === "scheduled") && canApprove && (
                <Btn color={C.accent} onClick={handlePublish}>
                  <FiSend size={13} /> Publish
                </Btn>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
    
  );

  return (
    <>
      {ReactDOM.createPortal(
        <AnimatePresence>{overlay}</AnimatePresence>,
        document.body
      )}
      <AnimatePresence>
        {toastState && <Toast msg={toastState.msg} type={toastState.type} />}
      </AnimatePresence>
    </>
  );
}