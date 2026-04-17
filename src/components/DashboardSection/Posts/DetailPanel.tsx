import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactDOM from "react-dom";
import {
  FiImage, FiFileText, FiClock, FiCheckCircle, FiAlertCircle,
  FiX, FiEdit3, FiUpload, FiSend, FiCalendar, FiRefreshCw,
  FiZap, FiSave, FiLink, FiArrowLeft
} from "react-icons/fi";
import type { Post } from "./PostsView";

const API_BASE = "https://localhost:7079";

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
  draft:     { label: "Draft",     color: "#d97706", bg: "#fffbeb", border: "#fde68a", dot: "#f59e0b", icon: "✏️" },
  scheduled: { label: "Scheduled", color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe", dot: "#818cf8", icon: "📅" },
  published: { label: "Published", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", dot: "#34d399", icon: "✅" },
  failed:    { label: "Failed",    color: "#dc2626", bg: "#fef2f2", border: "#fecaca", dot: "#f87171", icon: "❌" },
};

// ─── Light Palette ────────────────────────────────────────────────────────────
const C = {
  bg:         "#ffffff",
  surface:    "#ffffff",
  surfaceSub: "#f8f9ff",
  border:     "#e8eaf2",
  borderHi:   "#6366f1",
  text:       "#111827",
  textSub:    "#374151",
  textMuted:  "#6b7280",
  textDim:    "#9ca3af",
  accent:     "#6366f1",
  accentSoft: "#eef2ff",
  accentGlow: "rgba(99,102,241,0.15)",
  teal:       "#0d9488",
  tealSoft:   "#f0fdfa",
  rose:       "#e11d48",
  roseSoft:   "#fff1f2",
  amber:      "#d97706",
  amberSoft:  "#fffbeb",
  shadow:     "rgba(99,102,241,0.08)",
  shadowLg:   "rgba(17,24,39,0.12)",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const normalizeStatus = (s: string): "draft" | "scheduled" | "published" | "failed" => {
  switch ((s ?? "").toUpperCase()) {
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
  if (!post.platforms || post.platforms.length === 0) m.push("platforms");
  if (!post.scheduledAt && normalizeStatus(post.status) !== "published") m.push("schedule");
  return m;
}
export function getScore(post: Post) { return Math.round(((4 - getMissing(post).length) / 4) * 100); }
export function fmtDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
export function resolveImageUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("data:") || url.startsWith("http")) return url;
  return `${API_BASE}${url}`;
}

// ─── Input style ──────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 10,
  border: `1.5px solid ${C.border}`,
  background: C.surfaceSub, color: C.text,
  fontSize: 13, fontFamily: "inherit",
  outline: "none", boxSizing: "border-box",
  transition: "border-color 0.18s, box-shadow 0.18s",
};
const focusInput = (e: React.FocusEvent<any>) => {
  e.currentTarget.style.borderColor = C.accent;
  e.currentTarget.style.boxShadow = `0 0 0 3px ${C.accentGlow}`;
  e.currentTarget.style.background = C.bg;
};
const blurInput = (e: React.FocusEvent<any>) => {
  e.currentTarget.style.borderColor = C.border;
  e.currentTarget.style.boxShadow = "none";
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
      border: `1.5px solid ${filled ? "transparent" : color + "55"}`,
      borderRadius: 9, padding: "8px 14px",
      fontSize: 12, fontWeight: 700, letterSpacing: "0.02em",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      display: "inline-flex", alignItems: "center", gap: 6,
      fontFamily: "inherit", transition: "all 0.16s",
      ...(extraStyle || {}),
    }}
      onMouseEnter={e => {
        if (!disabled) {
          e.currentTarget.style.background = filled ? color + "dd" : color + "12";
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = filled ? `0 4px 14px ${color}44` : `0 2px 8px ${color}22`;
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = bg || "transparent";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {children}
    </button>
  );
}

// ─── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const color = score === 100 ? "#059669" : score >= 50 ? C.accent : C.amber;
  const r = 26; const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: 68, height: 68, flexShrink: 0 }}>
      <svg width={68} height={68} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={34} cy={34} r={r} fill="none" stroke={C.border} strokeWidth={5} />
        <motion.circle
          cx={34} cy={34} r={r} fill="none"
          stroke={color} strokeWidth={5} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (score / 100) * circ }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <span style={{ fontSize: 14, fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 8, color: C.textDim, fontWeight: 600 }}>%</span>
      </div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────
function Section({ title, icon, status, children }: {
  title: string; icon: React.ReactNode; status: "ok" | "missing" | "warning"; children: React.ReactNode;
}) {
  const dotColor = { ok: "#059669", missing: C.rose, warning: C.amber }[status];
  const dotBg = { ok: "#ecfdf5", missing: C.roseSoft, warning: C.amberSoft }[status];
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 13 }}>
        <span style={{ color: C.accent }}>{icon}</span>
        <span style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {title}
        </span>
        <div style={{ flex: 1, height: 1, background: C.border, marginLeft: 4 }} />
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor, boxShadow: `0 0 0 3px ${dotBg}` }} />
      </div>
      {children}
    </div>
  );
}

// ─── Platform Badge ───────────────────────────────────────────────────────────
function PlatformBadge({ platform }: { platform: Platform }) {
  const m = PLATFORM_META[platform];
  if (!m) return null;
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: "4px 11px", borderRadius: 20,
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
        borderRadius: 13, padding: "12px 18px",
        fontSize: 13, fontWeight: 700,
        border: `1.5px solid ${isOk ? "#a7f3d0" : "#fecaca"}`,
        boxShadow: `0 8px 28px ${isOk ? "rgba(5,150,105,0.12)" : "rgba(220,38,38,0.12)"}`,
        display: "flex", alignItems: "center", gap: 9,
      }}
    >
      {isOk ? <FiCheckCircle size={15} /> : <FiAlertCircle size={15} />}
      {msg}
    </motion.div>,
    document.body
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
        placeholder="Describe the image…"
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
          <FiZap size={12} /> {loading ? "Generating…" : "Generate"}
        </Btn>
        <Btn color={C.textMuted} onClick={onCancel}>Cancel</Btn>
      </div>
      {error && (
        <div style={{ marginTop: 10, background: C.roseSoft, border: `1px solid #fecaca`, borderRadius: 9, padding: "10px 13px", fontSize: 12, color: C.rose }}>
          ❌ {error}
        </div>
      )}
      {loading && (
        <div style={{ marginTop: 16, textAlign: "center", padding: "28px", background: C.surfaceSub, borderRadius: 14, border: `1px dashed ${C.border}` }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }} style={{ fontSize: 28, marginBottom: 8 }}>🎨</motion.div>
          <div style={{ fontSize: 13, color: C.textMuted }}>AI is painting your image…</div>
          <div style={{ fontSize: 11, color: C.textDim, marginTop: 4 }}>Usually 15–30 seconds</div>
        </div>
      )}
      {previewUrl && !loading && (
        <div style={{ marginTop: 14 }}>
          <img src={previewUrl} alt="Generated" style={{ width: "100%", borderRadius: 12, display: "block", maxHeight: 240, objectFit: "cover", border: `2px solid ${C.accent}` }} />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <Btn color={C.teal} bg={C.teal} onClick={() => onConfirm(previewUrl)}><FiCheckCircle size={12} /> Use This</Btn>
            <Btn color={C.accent} onClick={handleGenerate} disabled={loading}><FiRefreshCw size={12} /> Retry</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export type DetailPanelProps = {
  post: Post; onClose: () => void; onUpdate: (p: Post) => void; token: string | null;
};

export default function DetailPanel({ post, onClose, onUpdate, token }: DetailPanelProps) {
  const missing = getMissing(post);
  const score = getScore(post);
  const statusKey = normalizeStatus(post.status);
  const status = STATUS_META[statusKey];

  const [editingCaption, setEditingCaption] = useState(false);
  const [captionDraft, setCaptionDraft] = useState(post.caption || "");
  const [toneDraft, setToneDraft] = useState(post.tone || "Casual");
  const [hashtagsDraft, setHashtagsDraft] = useState(post.hashtags || "");
  const [savingCaption, setSavingCaption] = useState(false);
  const [generatingCaption, setGeneratingCaption] = useState(false);

  const [imageMode, setImageMode] = useState<"none" | "upload" | "url" | "generate">("none");
  const [imageUrlDraft, setImageUrlDraft] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingParams, setEditingParams] = useState(false);
  const [scheduledDraft, setScheduledDraft] = useState(
    post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : ""
  );
  const [platformsDraft, setPlatformsDraft] = useState<Platform[]>(post.platforms || []);
  const [savingParams, setSavingParams] = useState(false);
  const [toastState, setToastState] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastState({ msg, type });
    setTimeout(() => setToastState(null), 3000);
  };

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
    setPlatformsDraft(post.platforms || []);
    setScheduledDraft(post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : "");
    setEditingParams(false);
  }, [post.id]);

  const headers = (isJson = true) => ({
    ...(isJson ? { "Content-Type": "application/json" } : {}),
    "Authorization": `Bearer ${token}`,
  });

  const handleSaveCaption = async () => {
    setSavingCaption(true);
    try {
      const res = await fetch(`${API_BASE}/api/posts/${post.id}/caption`, {
        method: "PATCH", headers: headers(),
        body: JSON.stringify({ content: captionDraft, tone: toneDraft, hashtags: hashtagsDraft, generatedBy: "manual" }),
      });
      if (!res.ok) throw new Error(await res.text());
      onUpdate({ ...post, caption: captionDraft, tone: toneDraft, hashtags: hashtagsDraft });
      setEditingCaption(false); showToast("Caption saved!");
    } catch (e: any) { showToast(e.message || "Error", "error"); }
    finally { setSavingCaption(false); }
  };

  const handleGenerateCaption = async () => {
    setGeneratingCaption(true);
    try {
      const res = await fetch(`${API_BASE}/api/posts/chat`, {
        method: "POST", headers: headers(),
        body: JSON.stringify({ topicId: post.topicId, message: `Generate a ${toneDraft} caption for a post about ${post.topicName}`, toneOfVoice: toneDraft, hashtags: hashtagsDraft }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const generated = data?.output ?? data?.text ?? data?.caption ?? "";
      if (generated) { setCaptionDraft(generated); setEditingCaption(true); showToast("Caption generated!"); }
    } catch (e: any) { showToast(e.message || "Failed", "error"); }
    finally { setGeneratingCaption(false); }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingImage(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch(`${API_BASE}/api/posts/${post.id}/images/upload`, {
        method: "POST", headers: { "Authorization": `Bearer ${token}` }, body: fd,
      });
      if (!res.ok) throw new Error(await res.text());
      onUpdate({ ...post, imageUrl: (await res.json()).url });
      setImageMode("none"); showToast("Image uploaded!");
    } catch (e: any) { showToast(e.message || "Upload failed", "error"); }
    finally { setUploadingImage(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const handleSetImageUrl = async () => {
    if (!imageUrlDraft.trim()) return;
    setUploadingImage(true);
    try {
      const res = await fetch(`${API_BASE}/api/posts/${post.id}/images/url`, {
        method: "POST", headers: headers(), body: JSON.stringify({ url: imageUrlDraft }),
      });
      if (!res.ok) throw new Error(await res.text());
      onUpdate({ ...post, imageUrl: imageUrlDraft });
      setImageUrlDraft(""); setImageMode("none"); showToast("Image set!");
    } catch (e: any) { showToast(e.message || "Error", "error"); }
    finally { setUploadingImage(false); }
  };

  const handleImageConfirmed = (dataUrl: string) => {
    onUpdate({ ...post, imageUrl: dataUrl });
    setImageMode("none"); showToast("Image saved!");
  };

  const handleSaveParams = async () => {
    setSavingParams(true);
    try {
      const res = await fetch(`${API_BASE}/api/posts/${post.id}/params`, {
        method: "PATCH", headers: headers(),
        body: JSON.stringify({ scheduledAt: scheduledDraft ? new Date(scheduledDraft).toISOString() : null, platforms: platformsDraft }),
      });
      if (!res.ok) throw new Error(await res.text());
      onUpdate({ ...post, platforms: platformsDraft, scheduledAt: scheduledDraft ? new Date(scheduledDraft).toISOString() : null });
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
    if (!scheduledDraft) { showToast("Pick a date first", "error"); return; }
    try {
      const res = await fetch(`${API_BASE}/api/posts/${post.id}/schedule`, {
        method: "POST", headers: headers(),
        body: JSON.stringify({ scheduledAt: new Date(scheduledDraft).toISOString() }),
      });
      if (!res.ok) throw new Error(await res.text());
      onUpdate(await res.json()); setEditingParams(false); showToast("Scheduled! 📅");
    } catch (e: any) { showToast(e.message || "Error", "error"); }
  };

  const ALL_PLATFORMS: Platform[] = ["instagram", "linkedin", "twitter", "facebook", "tiktok", "threads"];
  const togglePlatform = (p: Platform) =>
    setPlatformsDraft(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const resolvedImageUrl = resolveImageUrl(post.imageUrl);

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
        background: "rgba(15, 20, 50, 0.45)",
        backdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9999, padding: "16px", boxSizing: "border-box",
      }}
    >
      <motion.div
        key="dp-card"
        initial={{ scale: 0.94, opacity: 0, y: 28 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 28 }}
        transition={{ type: "spring", stiffness: 340, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: C.bg,
          borderRadius: 24,
          border: `1px solid ${C.border}`,
          boxShadow: `0 24px 60px -8px ${C.shadowLg}, 0 4px 16px -4px ${C.shadow}`,
          width: "100%", maxWidth: 560,
          maxHeight: "92vh",
          overflow: "hidden",
          display: "flex", flexDirection: "column",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        {/* ── Header ── */}
        <div style={{
          flexShrink: 0, position: "relative", overflow: "hidden",
          padding: "24px 24px 20px",
          background: `linear-gradient(135deg, #f0f4ff 0%, #fafbff 60%, #f5f0ff 100%)`,
          borderBottom: `1px solid ${C.border}`,
        }}>
          {/* Decorative blobs */}
          <div style={{
            position: "absolute", top: -40, right: -40, width: 180, height: 180,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", bottom: -20, left: 40, width: 120, height: 120,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(13,148,136,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          {/* Top bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, position: "relative" }}>
            <button onClick={onClose} style={{
              background: "rgba(255,255,255,0.8)", border: `1px solid ${C.border}`,
              borderRadius: 9, padding: "6px 12px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5,
              color: C.textMuted, fontSize: 12, fontWeight: 600,
              transition: "all 0.15s", backdropFilter: "blur(4px)",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = C.accentSoft; e.currentTarget.style.color = C.accent; e.currentTarget.style.borderColor = C.accent + "44"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.8)"; e.currentTarget.style.color = C.textMuted; e.currentTarget.style.borderColor = C.border; }}
            >
              <FiArrowLeft size={13} /> Back
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Status pill */}
              <div style={{
                background: status.bg, color: status.color,
                padding: "5px 12px", borderRadius: 20,
                fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
                display: "flex", alignItems: "center", gap: 6,
                border: `1px solid ${status.border}`,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: status.dot }} />
                {status.label}
              </div>

              <button onClick={onClose} style={{
                background: "rgba(255,255,255,0.8)", border: `1px solid ${C.border}`,
                borderRadius: 8, width: 32, height: 32, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: C.textMuted, transition: "all 0.15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = C.roseSoft; e.currentTarget.style.color = C.rose; e.currentTarget.style.borderColor = C.rose + "33"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.8)"; e.currentTarget.style.color = C.textMuted; e.currentTarget.style.borderColor = C.border; }}
              >
                <FiX size={14} />
              </button>
            </div>
          </div>

          {/* Score + title */}
          <div style={{ display: "flex", alignItems: "center", gap: 18, position: "relative" }}>
            <ScoreRing score={score} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.accent, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>
                Post Details
              </div>
              <h2 style={{
                margin: 0, fontSize: 20, fontWeight: 800, color: C.text,
                letterSpacing: "-0.02em", lineHeight: 1.2,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {post.topicName}
              </h2>
              <div style={{ marginTop: 5, fontSize: 11, color: C.textDim }}>
                Created {fmtDate(post.createdAt)}
              </div>
            </div>
          </div>

          {/* Missing warnings */}
          {missing.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 14 }}>
              {missing.map(m => (
                <span key={m} style={{
                  fontSize: 10, padding: "3px 10px", borderRadius: 20,
                  background: C.amberSoft, color: C.amber,
                  border: `1px solid #fde68a`, fontWeight: 700, letterSpacing: "0.04em",
                }}>
                  ⚠ missing {m}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Scrollable Body ── */}
        <div style={{
          overflowY: "auto", flex: 1, padding: "24px",
          background: C.bg,
          scrollbarWidth: "thin",
          scrollbarColor: `${C.border} transparent`,
        }}>

          {/* Caption */}
          <Section title="Caption" icon={<FiFileText size={13} />} status={post.caption ? "ok" : "missing"}>
            {editingCaption ? (
              <div>
                <textarea value={captionDraft} onChange={e => setCaptionDraft(e.target.value)} rows={4}
                  style={{ ...inputStyle, resize: "vertical", marginBottom: 12 }}
                  onFocus={focusInput} onBlur={blurInput} />
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
                  <Btn color={C.teal} bg={C.teal} onClick={handleSaveCaption} disabled={savingCaption}>
                    <FiSave size={12} /> {savingCaption ? "Saving…" : "Save"}
                  </Btn>
                  <Btn color={C.accent} onClick={handleGenerateCaption} disabled={generatingCaption}>
                    <FiZap size={12} /> {generatingCaption ? "Generating…" : "AI Generate"}
                  </Btn>
                  <Btn color={C.textMuted} onClick={() => setEditingCaption(false)}>Cancel</Btn>
                </div>
              </div>
            ) : (
              <div>
                {post.caption
                  ? (
                    <div style={{
                      background: C.surfaceSub, borderRadius: 12,
                      padding: "13px 16px", marginBottom: 14,
                      borderLeft: `3px solid ${C.accent}`,
                    }}>
                      <p style={{ fontSize: 13, color: C.textSub, lineHeight: 1.65, margin: 0 }}>{post.caption}</p>
                    </div>
                  )
                  : <p style={{ fontSize: 13, color: C.textDim, margin: "0 0 14px", fontStyle: "italic" }}>No caption yet — add one to get started.</p>
                }
                <Btn color={C.accent} onClick={() => setEditingCaption(true)}>
                  <FiEdit3 size={12} /> Edit Caption
                </Btn>
              </div>
            )}
          </Section>

          {/* Media */}
          <Section title="Media" icon={<FiImage size={13} />} status={post.imageUrl ? "ok" : "missing"}>
            {resolvedImageUrl && (
              <div style={{ marginBottom: 14, borderRadius: 14, overflow: "hidden", border: `1px solid ${C.border}`, boxShadow: `0 2px 8px ${C.shadow}` }}>
                <img src={resolvedImageUrl} alt="Post media"
                  style={{ width: "100%", display: "block", maxHeight: 210, objectFit: "cover" }} />
              </div>
            )}
            {imageMode === "none" && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Btn color={C.accent} onClick={() => setImageMode("upload")}><FiUpload size={12} /> Upload</Btn>
                <Btn color={C.accent} onClick={() => setImageMode("url")}><FiLink size={12} /> Add URL</Btn>
                <Btn color="#7c3aed" onClick={() => setImageMode("generate")}><FiZap size={12} /> AI Generate</Btn>
              </div>
            )}
            {imageMode === "upload" && (
              <div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn color={C.accent} bg={C.accent} onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
                    <FiUpload size={12} /> {uploadingImage ? "Uploading…" : "Choose File"}
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
                  <Btn color={C.teal} bg={C.teal} onClick={handleSetImageUrl} disabled={uploadingImage}>
                    {uploadingImage ? "Saving…" : "Set URL"}
                  </Btn>
                  <Btn color={C.textMuted} onClick={() => setImageMode("none")}>Cancel</Btn>
                </div>
              </div>
            )}
            {imageMode === "generate" && (
              <ImageGeneratePreview post={post} token={token} onConfirm={handleImageConfirmed} onCancel={() => setImageMode("none")} />
            )}
          </Section>

          {/* Distribution */}
          <Section title="Distribution" icon={<FiClock size={13} />} status={post.platforms?.length ? "ok" : "missing"}>
            {editingParams ? (
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 10 }}>Platforms</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
                  {ALL_PLATFORMS.map(p => {
                    const sel = platformsDraft.includes(p);
                    const m = PLATFORM_META[p];
                    return (
                      <button key={p} onClick={() => togglePlatform(p)} style={{
                        padding: "6px 13px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: sel ? m.bg : C.surfaceSub,
                        border: `1.5px solid ${sel ? m.color + "55" : C.border}`,
                        color: sel ? m.color : C.textMuted,
                        cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5,
                        transition: "all 0.15s",
                      }}>
                        <span style={{ fontSize: 11 }}>{m.icon}</span>{m.label}
                      </button>
                    );
                  })}
                </div>
                <label style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Schedule Date</label>
                <input type="datetime-local" value={scheduledDraft} onChange={e => setScheduledDraft(e.target.value)}
                  style={{ ...inputStyle, marginBottom: 14 }}
                  onFocus={focusInput} onBlur={blurInput} />
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn color={C.teal} bg={C.teal} onClick={handleSaveParams} disabled={savingParams}>
                    <FiSave size={12} /> {savingParams ? "Saving…" : "Save Changes"}
                  </Btn>
                  <Btn color={C.textMuted} onClick={() => setEditingParams(false)}>Cancel</Btn>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  {post.platforms?.map(p => <PlatformBadge key={p} platform={p} />)}
                  {(!post.platforms || post.platforms.length === 0) && (
                    <span style={{ fontSize: 12, color: C.textDim, fontStyle: "italic" }}>No platforms selected</span>
                  )}
                </div>
                {post.scheduledAt && (
                  <div style={{
                    fontSize: 12, color: C.accent, marginBottom: 12,
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: C.accentSoft, padding: "5px 11px", borderRadius: 20,
                    border: `1px solid ${C.accent}22`,
                  }}>
                    <FiCalendar size={11} /> {fmtDate(post.scheduledAt)}
                  </div>
                )}
                <div>
                  <Btn color={C.accent} onClick={() => setEditingParams(true)}>
                    <FiEdit3 size={12} /> Configure
                  </Btn>
                </div>
              </div>
            )}
          </Section>

          {/* ── Action Footer ── */}
          <div style={{
            display: "flex", gap: 10, paddingTop: 20,
            borderTop: `1px solid ${C.border}`, flexWrap: "wrap",
          }}>
            {statusKey === "draft" && (
              <Btn color={C.accent} bg={C.accent} onClick={handleSchedule}>
                <FiCalendar size={13} /> Schedule Post
              </Btn>
            )}
            {statusKey === "scheduled" && (
              <Btn color={C.teal} bg={C.teal} onClick={handlePublish}>
                <FiSend size={13} /> Publish Now
              </Btn>
            )}
            {(statusKey === "draft" || statusKey === "scheduled") && (
              <Btn color={C.teal} onClick={handlePublish}>
                <FiSend size={13} /> Publish
              </Btn>
            )}
          </div>
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