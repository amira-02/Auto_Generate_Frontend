// src/components/DashboardSection/PostsView.tsx
import { useState, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiImage, FiFileText, FiClock, FiCheckCircle, FiAlertCircle,
  FiX, FiEdit3, FiUpload, FiSend, FiCalendar, FiSearch, FiRefreshCw
} from "react-icons/fi";
import { AuthContext } from "../../hooks/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type Platform = "linkedin" | "twitter" | "instagram" | "facebook" | "tiktok" | "threads";

type Post = {
  id: number;
  topic: string;
  hashtags: string;
  caption: string | null;
  tone: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  platforms: Platform[];
  scheduledAt: string | null;
  status: string; // vient de la DB : "DRAFT", "SCHEDULED", "PUBLISHED"…
  createdAt: string;
};

// normalise peu importe la casse
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
  linkedin:  { label: "LinkedIn",   color: "#0077b5", bg: "#e8f4fb" },
  twitter:   { label: "Twitter/X",  color: "#1da1f2", bg: "#e8f6fe" },
  instagram: { label: "Instagram",  color: "#e1306c", bg: "#fce8ef" },
  facebook:  { label: "Facebook",   color: "#1877f2", bg: "#e8f0fd" },
  tiktok:    { label: "TikTok",     color: "#333",    bg: "#f0f0f0" },
  threads:   { label: "Threads",    color: "#111",    bg: "#f0f0f0" },
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
  if (!post.imageUrl && !post.videoUrl) m.push("media");
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

function btnStyle(color: string): React.CSSProperties {
  return {
    background: color + "15", color, border: `1px solid ${color}33`,
    borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600,
    cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5,
    fontFamily: "inherit",
  };
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
      {/* top progress bar */}
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
            {post.topic}
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
          <img src={post.imageUrl} alt="" style={{
            width: 52, height: 52, borderRadius: 10, objectFit: "cover", flexShrink: 0,
          }} />
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
  post: Post; onClose: () => void;
  onUpdate: (p: Post) => void; token: string | null;
}) {
  const missing = getMissing(post);
  const score = getScore(post);
  const statusKey = normalizeStatus(post.status);
  const status = STATUS_META[statusKey];

  const [editingCaption, setEditingCaption] = useState(false);
  const [captionDraft, setCaptionDraft] = useState(post.caption || "");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setCaptionDraft(post.caption || "");
    setEditingCaption(false);
  }, [post.id]);

  const handleSaveCaption = () => {
    onUpdate({ ...post, caption: captionDraft });
    setEditingCaption(false);
  };

  const handleGenerateCaption = async () => {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 1200));
    const generated = `Caption générée pour "${post.topic}". Connecte ici /api/posts/chat. #ContentCreation #AI`;
    onUpdate({ ...post, caption: generated });
    setEditingCaption(false);
    setGenerating(false);
  };

  const ALL_PLATFORMS: Platform[] = ["linkedin", "twitter", "instagram", "facebook", "tiktok", "threads"];

  const togglePlatform = (p: Platform) => {
    const updated = post.platforms?.includes(p)
      ? post.platforms.filter(x => x !== p)
      : [...(post.platforms || []), p];
    onUpdate({ ...post, platforms: updated });
  };

  return (
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
            {post.topic}
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

        <Section title="Caption" icon={<FiFileText size={14} />} status={post.caption ? "ok" : "missing"}>
          {editingCaption ? (
            <div>
              <textarea
                value={captionDraft}
                onChange={e => setCaptionDraft(e.target.value)}
                rows={5}
                style={{
                  width: "100%", borderRadius: 10, border: "1.5px solid #7c3aed",
                  padding: 12, fontSize: 13, lineHeight: 1.6, resize: "vertical",
                  fontFamily: "inherit", outline: "none", boxSizing: "border-box", color: "#1a1a1a",
                }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button onClick={handleSaveCaption} style={btnStyle("#7c3aed")}>
                  <FiCheckCircle size={13} /> Save
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
              <button
                onClick={() => { setCaptionDraft(post.caption!); setEditingCaption(true); }}
                style={{ ...btnStyle("#7c3aed"), marginTop: 8, fontSize: 11 }}
              >
                <FiEdit3 size={11} /> Edit
              </button>
            </div>
          ) : (
            <div style={{
              background: "#fffbeb", border: "1px dashed #fcd34d", borderRadius: 10,
              padding: "14px 16px", textAlign: "center",
            }}>
              <div style={{ fontSize: 13, color: "#92400e", marginBottom: 10 }}>No caption yet</div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <button onClick={() => setEditingCaption(true)} style={btnStyle("#7c3aed")}>
                  <FiEdit3 size={13} /> Write
                </button>
                <button onClick={handleGenerateCaption} disabled={generating} style={btnStyle("#059669")}>
                  <FiRefreshCw size={13} />
                  {generating ? "Generating…" : "AI Generate"}
                </button>
              </div>
            </div>
          )}
        </Section>

        <Section title="Media" icon={<FiImage size={14} />} status={post.imageUrl ? "ok" : "missing"}>
          {post.imageUrl ? (
            <div>
              <img src={post.imageUrl} alt="" style={{
                width: "100%", borderRadius: 12, display: "block", maxHeight: 200, objectFit: "cover",
              }} />
              <button style={{ ...btnStyle("#888"), marginTop: 8, fontSize: 11 }}>
                <FiUpload size={11} /> Replace
              </button>
            </div>
          ) : (
            <div style={{
              background: "#f5f5f5", border: "1.5px dashed #ddd", borderRadius: 12,
              padding: "24px 16px", textAlign: "center",
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🖼️</div>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>No media attached</div>
              <button style={btnStyle("#7c3aed")}><FiUpload size={13} /> Upload</button>
            </div>
          )}
        </Section>

        <Section title="Platforms" icon={<FiSend size={14} />} status={(post.platforms?.length || 0) > 0 ? "ok" : "missing"}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {ALL_PLATFORMS.map(p => {
              const meta = PLATFORM_META[p];
              const sel = post.platforms?.includes(p);
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
        </Section>

        <Section title="Schedule" icon={<FiCalendar size={14} />} status={post.scheduledAt ? "ok" : "warning"}>
          {post.scheduledAt ? (
            <div style={{
              background: "#ede9fe", borderRadius: 10, padding: "10px 14px",
              fontSize: 13, color: "#5b21b6", fontWeight: 500,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <FiClock size={14} /> {fmtDate(post.scheduledAt)}
            </div>
          ) : (
            <input
              type="datetime-local"
              style={{
                width: "100%", border: "1px solid #e0e0e0", borderRadius: 10,
                padding: "8px 12px", fontSize: 13, fontFamily: "inherit",
                color: "#333", outline: "none", boxSizing: "border-box",
              }}
              onChange={e => {
                if (e.target.value)
                  onUpdate({ ...post, scheduledAt: new Date(e.target.value).toISOString() });
              }}
            />
          )}
        </Section>

        {post.hashtags && (
          <Section title="Hashtags" icon={<span style={{ fontSize: 14, color: "#888" }}>#</span>} status="ok">
            <div style={{
              fontSize: 13, color: "#7c3aed", background: "#faf9ff",
              borderRadius: 10, padding: "8px 12px", lineHeight: 1.6,
            }}>
              {post.hashtags}
            </div>
          </Section>
        )}

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

    // ✅ Change le port si besoin (7001, 5001, 7243…)
    fetch("https://localhost:7079/api/posts", {
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
        setPosts(data.map(p => ({
          id: p.id,
          topic: p.topic ?? "",
          hashtags: p.hashtags ?? "",
          caption: p.caption ?? null,
          tone: p.tone ?? null,
          imageUrl: p.imageUrl ?? null,
          videoUrl: null,
          platforms: Array.isArray(p.platforms) ? p.platforms : [],
          scheduledAt: p.scheduledDate ?? p.scheduledAt ?? null,
          status: p.status ?? "DRAFT",
          createdAt: p.createdAt ?? new Date().toISOString(),
        })));
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
    if (search && !p.topic.toLowerCase().includes(search.toLowerCase())) return false;
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
            ➜ Vérifie que le backend tourne et que le port dans le fetch est correct
            (cherche <code>https://localhost:????</code> dans ce fichier).
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