import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowLeft, FiExternalLink, FiUserPlus } from "react-icons/fi";
import AssignModal from "../Team/AssignModal";

const API = import.meta.env.VITE_API_URL ?? "https://localhost:7079";

type SheetRow = {
  rowKey:       string;
  postId:       number | null;
  status:       string | null;
  scheduledAt:  string | null;
  caption:      string | null;
  hashtags:     string | null;
  platforms:    string | null;
  // Brief créa (orange section)
  brief:        string | null;
  charte:       string | null;
  format:       string | null;
  texteVisuel:  string | null;
  imagesPhotos: string | null;
  infosPost:    string | null;
  // Programmation
  budget:       string | null;
  objectif:     string | null;
  pages:        string | null;
  // Sponsorisation
  duplicateIG:  string | null;
  sponsoEnd:    string | null;
  audience:     string | null;
  commentaires: string | null;
};

function PlatformBadge({ name }: { name: string }) {
  const key = name.toLowerCase();

  if (key === "instagram") return (
    <svg viewBox="0 0 48 48" width="22" height="22" style={{ borderRadius: 6, display: "block", flexShrink: 0 }}>
      <defs>
        <radialGradient id="ig-g" cx="30%" cy="107%" r="150%">
          <stop offset="0%"  stopColor="#fdf497"/>
          <stop offset="5%"  stopColor="#fdf497"/>
          <stop offset="45%" stopColor="#fd5949"/>
          <stop offset="60%" stopColor="#d6249f"/>
          <stop offset="90%" stopColor="#285AEB"/>
        </radialGradient>
      </defs>
      <rect width="48" height="48" rx="11" fill="url(#ig-g)"/>
      <rect x="11" y="11" width="26" height="26" rx="7" fill="none" stroke="white" strokeWidth="2.8"/>
      <circle cx="24" cy="24" r="6.3" fill="none" stroke="white" strokeWidth="2.8"/>
      <circle cx="33.5" cy="14.5" r="1.8" fill="white"/>
    </svg>
  );

  if (key === "facebook") return (
    <svg viewBox="0 0 48 48" width="22" height="22" style={{ borderRadius: 6, display: "block", flexShrink: 0 }}>
      <rect width="48" height="48" rx="11" fill="#1877F2"/>
      <path d="M28.5 25.5H32l1.5-6H28.5V17c0-1.6.8-3 3.2-3H34v-5.1A39 39 0 0 0 29.8 8C25 8 21.5 11.2 21.5 17v2.5H17v6h4.5V38h7V25.5z" fill="white"/>
    </svg>
  );

  if (key === "tiktok") return (
    <svg viewBox="0 0 48 48" width="22" height="22" style={{ borderRadius: 6, display: "block", flexShrink: 0 }}>
      <rect width="48" height="48" rx="11" fill="#010101"/>
      <path d="M34.2 14.7a8.3 8.3 0 0 1-5.2-4.7H24v22.7a3.8 3.8 0 1 1-3-3.7v-5a9 9 0 1 0 8 8.9V19.9a13.5 13.5 0 0 0 7.5 2.3v-4.8a8.4 8.4 0 0 1-2.3-2.7z" fill="white"/>
      <path d="M34.2 14.7a8.3 8.3 0 0 1-2.3-2.7A8.3 8.3 0 0 1 29 10h-1v2a8.4 8.4 0 0 0 6.2 2.7z" fill="#69C9D0"/>
      <path d="M21 29.7a3.8 3.8 0 1 0 3 3.7V11.9h1a8.3 8.3 0 0 0 2.9 8.1 13.5 13.5 0 0 1-6.9-9V10h-5v19.7a3.8 3.8 0 0 1 5 0z" fill="#EE1D52" fillOpacity="0"/>
    </svg>
  );

  if (key === "linkedin") return (
    <svg viewBox="0 0 48 48" width="22" height="22" style={{ borderRadius: 6, display: "block", flexShrink: 0 }}>
      <rect width="48" height="48" rx="11" fill="#0A66C2"/>
      <path d="M14 19h5v19h-5zm2.5-7.5a2.9 2.9 0 1 1 0 5.8 2.9 2.9 0 0 1 0-5.8zM22 19h5v2.6c.7-1.3 2.4-2.6 5-2.6 5.3 0 6.3 3.5 6.3 8V38h-5v-9.8c0-2.3-.7-3.5-2.5-3.5-2.2 0-3.1 1.5-3.1 3.5V38H22V19z" fill="white"/>
    </svg>
  );

  if (key === "twitter") return (
    <svg viewBox="0 0 48 48" width="22" height="22" style={{ borderRadius: 6, display: "block", flexShrink: 0 }}>
      <rect width="48" height="48" rx="11" fill="#000"/>
      <path d="M11 11h9.5l7.7 10.5L37 11h3L28.3 24.2 40 37h-9.5L22.4 26 13 37h-3l11.8-13.7L11 11zm4 2 20 22h3L18 13h-3z" fill="white"/>
    </svg>
  );

  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 9px", borderRadius: 8,
      background: "#f1f5f9", color: "#475569", textTransform: "capitalize" as const }}>{name}</span>
  );
}

function toEmbedUrl(url: string): string {
  // Google Drive share link → direct view
  const gdrive = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (gdrive) return `https://drive.google.com/uc?export=view&id=${gdrive[1]}`;
  const gopen = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (gopen) return `https://drive.google.com/uc?export=view&id=${gopen[1]}`;

  // Shutterstock page URL → CDN preview image
  // e.g. shutterstock.com/fr/image-photo/some-slug-1234567 → image.shutterstock.com/image-photo/some-slug-1234567-600w.jpg
  const ss = url.match(/shutterstock\.com\/(?:[a-z-]+\/)?(image-(?:photo|vector|illustration|footage))\/([^?#/]+)/);
  if (ss) return `https://image.shutterstock.com/${ss[1]}/${ss[2]}-600w.jpg`;

  return url;
}

function isDirectImage(url: string): boolean {
  const clean = url.split("?")[0].toLowerCase();
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp|avif)$/.test(clean)
    || url.includes("drive.google.com/uc?export=view")
    || url.includes("googleusercontent.com")
    || url.includes("image.shutterstock.com")
    || url.includes("imgur.com")
    || url.includes("cloudinary.com");
}

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace("www.", ""); }
  catch { return url.slice(0, 30); }
}

function SmartCaption({ text }: { text: string }) {
  const lines = text.split("\n");
  const slideRe = /^(SLIDE\s+\d+\s*[—\-–:]\s*)/i;
  const titleRe = /^(Titre\s*[:\-–]\s*)/i;

  return (
    <div style={{ maxHeight: 320, overflowY: "auto", paddingRight: 4,
      display: "flex", flexDirection: "column", gap: 2 }}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} style={{ height: 6 }} />;

        if (slideRe.test(trimmed)) {
          const match = trimmed.match(slideRe)!;
          const prefix = match[0];
          const rest   = trimmed.slice(prefix.length);
          return (
            <div key={i} style={{ marginTop: i > 0 ? 10 : 0, paddingTop: i > 0 ? 8 : 0,
              borderTop: i > 0 ? "1px dashed #d1fae5" : "none" }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: "#16a34a",
                textTransform: "uppercase", letterSpacing: "0.08em",
                background: "#dcfce7", padding: "1px 6px", borderRadius: 4, marginRight: 6 }}>
                {prefix.replace(/[—\-–:]\s*$/, "").trim()}
              </span>
              {rest && <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{rest}</span>}
            </div>
          );
        }

        if (titleRe.test(trimmed)) {
          const match = trimmed.match(titleRe)!;
          const rest  = trimmed.slice(match[0].length);
          return (
            <div key={i} style={{ fontSize: 11, color: "#374151", lineHeight: 1.6,
              paddingLeft: 8, borderLeft: "2px solid #22c55e" }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8",
                textTransform: "uppercase", marginRight: 4 }}>Titre</span>
              {rest}
            </div>
          );
        }

        return (
          <div key={i} style={{ fontSize: 11, color: "#374151", lineHeight: 1.65,
            paddingLeft: 2 }}>
            {trimmed}
          </div>
        );
      })}
    </div>
  );
}

function ImageField({ value }: { value: string }) {
  const urls = value.match(/https?:\/\/[^\s"]+/g) ?? [];
  const rest  = value.replace(/https?:\/\/[^\s"]+/g, "").trim();

  if (urls.length === 0) {
    return <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>{value}</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {urls.map((raw, i) => {
        const embedSrc = toEmbedUrl(raw);

        if (isDirectImage(embedSrc)) {
          return (
            <a key={i} href={raw} target="_blank" rel="noreferrer"
              style={{ display: "block", borderRadius: 10, overflow: "hidden",
                border: "1px solid #e5e7eb", lineHeight: 0 }}>
              <img src={embedSrc} alt={`image ${i + 1}`}
                style={{ width: "100%", maxHeight: 200, objectFit: "cover", display: "block" }}
                onError={e => { (e.currentTarget.parentElement as HTMLElement).style.display = "none"; }}
              />
            </a>
          );
        }

        // Web page URL → show as a clean link card
        return (
          <a key={i} href={raw} target="_blank" rel="noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
              borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc",
              textDecoration: "none", color: "inherit" }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>🔗</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#1d4ed8",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {getDomain(raw)}
              </div>
              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {decodeURIComponent(raw).slice(0, 60)}…
              </div>
            </div>
          </a>
        );
      })}
      {rest && (
        <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>{rest}</div>
      )}
    </div>
  );
}

type Comment = { author: string; text: string; date: string | null };

type BriefDetail = {
  id:          number;
  cardId:      string;
  title:       string;
  description: string | null;
  sheetUrl:    string | null;
  due:         string | null;
  labelsJson:  string | null;
  cardUrl:     string | null;
  assignedAt:  string | null;
  clientName:  string | null;
  rows:        SheetRow[];
  comments:    Comment[];
};

type Props = { briefId: number; clientId: number; token: string | null; onBack: () => void };

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  InReview:  { bg: "#fefce8", text: "#854d0e" },
  Published: { bg: "#f0fdf4", text: "#15803d" },
  Draft:     { bg: "#f8fafc", text: "#64748b" },
  Scheduled: { bg: "#eff6ff", text: "#1d4ed8" },
};

type AssignTarget = { rowKey: string; postId: number | null; briefTitle: string };

export default function BriefDetailPanel({ briefId, clientId, token, onBack }: Props) {
  const [brief,           setBrief]           = useState<BriefDetail | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [tab,             setTab]             = useState<"rows" | "comments" | "info" | "live">("rows");
  const [assignRow,       setAssignRow]       = useState<AssignTarget | null>(null);
  const [assignedRowKeys, setAssignedRowKeys] = useState<Set<string>>(new Set());
  const [showAllRows,     setShowAllRows]     = useState(false);
  const [viewMore, setViewMore] = useState<{ label: string; value: string; image: boolean } | null>(null);

  useEffect(() => {
    fetchBrief();
    fetch(`${API}/api/assignments?clientId=${clientId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then((list: any[]) => {
        setAssignedRowKeys(new Set(list.map((a: any) => a.rowKey).filter(Boolean)));
      })
      .catch(() => {});
  }, [briefId]);

  // Auto-refresh brief data every 90 seconds to reflect backend sheet sync
  useEffect(() => {
    const id = setInterval(() => fetchBrief(), 90 * 1000);
    return () => clearInterval(id);
  }, [briefId]);

  const fetchBrief = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/trello/briefs/${briefId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setBrief(await res.json());
    } catch {}
    finally { setLoading(false); }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
      height: 300, color: "#94a3b8", fontSize: 13 }}>
      Chargement…
    </div>
  );

  if (!brief) return (
    <div style={{ padding: 24, color: "#dc2626", fontSize: 13 }}>Brief introuvable.</div>
  );

  const labels: string[] = brief.labelsJson ? JSON.parse(brief.labelsJson) : [];
  const dueDate = brief.due ? new Date(brief.due) : null;


  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22 }}
      style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <button onClick={onBack}
          style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid #e5e7eb",
            background: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", color: "#64748b", flexShrink: 0 }}>
          <FiArrowLeft size={15} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", lineHeight: 1.3 }}>
            {brief.title}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {brief.clientName && <span>🏢 {brief.clientName}</span>}
            {dueDate && (
              <span style={{ color: dueDate < new Date() ? "#dc2626" : "#ea580c" }}>
                📅 {dueDate.toLocaleDateString("fr-FR")}
              </span>
            )}
            {brief.cardUrl && (
              <a href={brief.cardUrl} target="_blank" rel="noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 4, color: "#1d4ed8", textDecoration: "none" }}>
                <FiExternalLink size={11} /> Voir sur Trello
              </a>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Labels */}
      {labels.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {labels.map(l => (
            <span key={l} style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px",
              borderRadius: 20, background: "#f1f5f9", color: "#475569" }}>
              🏷 {l}
            </span>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 4, background: "#f8fafc",
        borderRadius: 10, padding: 4 }}>
        {([
          { key: "rows",     label: `📊 Posts (${brief.rows.length})` },
          { key: "live",     label: "🔴 Live Sheet" },
          { key: "comments", label: `💬 (${brief.comments.length})` },
          { key: "info",     label: "📋 Desc." },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ flex: 1, padding: "7px 8px", borderRadius: 8, border: "none",
              background: tab === t.key ? "#fff" : "transparent",
              color: tab === t.key ? "#0f172a" : "#64748b",
              fontWeight: tab === t.key ? 700 : 500, fontSize: 12, cursor: "pointer",
              boxShadow: tab === t.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              transition: "all .15s" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Posts (card view) ── */}
      {tab === "rows" && (
        brief.rows.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 16px", background: "#f8fafc",
            borderRadius: 14, border: "1px dashed #e2e8f0" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
              Aucune ligne importée
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>
              {brief.sheetUrl
                ? "Le planning sera importé automatiquement. Vérifiez que le sheet est partagé publiquement."
                : "Ce brief n'a pas de Google Sheet associé."}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {brief.rows.slice(0, 2).map(row => {
              const sc = STATUS_COLOR[row.status ?? ""] ?? STATUS_COLOR.Draft;
              const platforms: string[] = row.platforms
                ? (() => { try { return JSON.parse(row.platforms); } catch { return [row.platforms]; } })()
                : [];
              const isAssigned = assignedRowKeys.has(row.rowKey);

              const briefFields = [
                { label: "Détails / Brief",  value: row.brief,        image: false },
                { label: "Charte",           value: row.charte,       image: false },
                { label: "Format",           value: row.format,       image: false },
                { label: "Texte visuel",     value: row.texteVisuel,  image: false },
                { label: "Images & photos",  value: row.imagesPhotos, image: true  },
                { label: "Infos du post",    value: row.infosPost,    image: false },
                { label: "Budget",           value: row.budget,       image: false },
                { label: "Objectif",         value: row.objectif,     image: false },
                { label: "Duplication IG",   value: row.duplicateIG,  image: false },
                { label: "Fin sponso",       value: row.sponsoEnd,    image: false },
                { label: "Audience",         value: row.audience,     image: false },
              ].filter(f => f.value);

              return (
                <div key={row.rowKey} style={{
                  borderRadius: 16, border: `1.5px solid ${isAssigned ? "#bbf7d0" : "#e5e7eb"}`,
                  background: "#fff", overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>

                  {/* ── Header ── */}
                  <div style={{ padding: "12px 16px", background: "#f8fafc",
                    borderBottom: "1.5px solid #e5e7eb",
                    display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: "#0f172a",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                      {row.rowKey}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px",
                      borderRadius: 20, background: sc.bg, color: sc.text }}>
                      {row.status ?? "—"}
                    </span>
                    {row.scheduledAt && (
                      <span style={{ fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
                        📅 {new Date(row.scheduledAt).toLocaleDateString("fr-FR")}
                      </span>
                    )}
                    {platforms.length > 0 && (
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {platforms.map(p => <PlatformBadge key={p} name={p} />)}
                      </div>
                    )}
                    {row.budget && <span style={{ fontSize: 11, fontWeight: 700, color: "#16a34a" }}>💰 {row.budget}</span>}
                    {isAssigned ? (
                      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 700 }}>✓ Assigné</span>
                        <button onClick={() => {
                            setAssignedRowKeys(prev => { const s = new Set(prev); s.delete(row.rowKey); return s; });
                            fetch(`${API}/api/assignments/cancel`, {
                              method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ rowKey: row.rowKey, postId: row.postId, clientId }),
                            }).catch(() => {});
                          }}
                          style={{ fontSize: 10, padding: "3px 9px", borderRadius: 8,
                            border: "1px solid #fca5a5", background: "#fff1f2",
                            color: "#dc2626", cursor: "pointer", fontWeight: 600 }}>
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setAssignRow({ rowKey: row.rowKey, postId: row.postId, briefTitle: brief.title })}
                        style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5,
                          padding: "4px 10px", borderRadius: 8, border: "1.5px solid #dc2626",
                          background: "#fef2f2", color: "#dc2626", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                        <FiUserPlus size={11} /> Assigner
                      </button>
                    )}
                  </div>

                  {/* ── Body: two columns ── */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>

                    {/* Left — Brief créa */}
                    <div style={{ padding: "14px 16px", borderRight: "1.5px solid #e5e7eb",
                      background: "linear-gradient(180deg,#fffbf5 0%,#fff 100%)" }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: "#d97706",
                        letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10,
                        display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: "#f59e0b" }} />
                        Brief créa
                      </div>
                      {briefFields.length === 0
                        ? <span style={{ fontSize: 11, color: "#cbd5e1", fontStyle: "italic" }}>Aucun brief renseigné</span>
                        : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {briefFields.map(f => {
                              const isLong = f.value!.length > 60 || f.value!.includes("\n");
                              const preview = f.value!.split("\n")[0].slice(0, 60);
                              return (
                                <div key={f.label}>
                                  <div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8",
                                    textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
                                    {f.label}
                                  </div>
                                  {f.image
                                    ? <ImageField value={f.value!} />
                                    : <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.5,
                                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {preview}{isLong ? "…" : ""}
                                      </div>
                                  }
                                  {isLong && !f.image && (
                                    <button onClick={() => setViewMore({ label: f.label, value: f.value!, image: false })}
                                      style={{ fontSize: 10, color: "#dc2626", background: "none", border: "none",
                                        cursor: "pointer", padding: 0, marginTop: 2, fontFamily: "inherit" }}>
                                      View more
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                      }
                    </div>

                    {/* Right — Texte du post */}
                    <div style={{ padding: "14px 16px", background: "linear-gradient(180deg,#f0fdf4 0%,#fff 100%)" }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: "#16a34a",
                        letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10,
                        display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: "#22c55e" }} />
                        Texte du post
                      </div>
                      {row.caption ? (() => {
                        const isLong = row.caption!.length > 60 || row.caption!.includes("\n");
                        const preview = row.caption!.split("\n")[0].slice(0, 60);
                        return (
                          <>
                            <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.5,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {preview}{isLong ? "…" : ""}
                            </div>
                            {isLong && (
                              <button onClick={() => setViewMore({ label: "Texte du post", value: row.caption!, image: false })}
                                style={{ fontSize: 10, color: "#16a34a", background: "none", border: "none",
                                  cursor: "pointer", padding: 0, marginTop: 4, fontFamily: "inherit" }}>
                                View more
                              </button>
                            )}
                          </>
                        );
                      })() : (
                        <span style={{ fontSize: 11, color: "#cbd5e1", fontStyle: "italic" }}>Pas encore rédigé</span>
                      )}
                      {row.hashtags && (
                        <div style={{ marginTop: 8, fontSize: 11, color: "#dc2626",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {row.hashtags}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {brief.rows.length > 2 && (
              <button onClick={() => setShowAllRows(true)}
                style={{ width: "100%", padding: "11px", borderRadius: 12,
                  border: "1.5px dashed #dc2626", background: "#fff8f8",
                  color: "#dc2626", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  fontFamily: "inherit", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 8, transition: "all .15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#fff8f8"; }}>
                👁 Voir tout — {brief.rows.length} posts
              </button>
            )}
          </div>
        )
      )}

      {/* ── View more popup ── */}
      <AnimatePresence>
        {viewMore && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setViewMore(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
              backdropFilter: "blur(6px)", zIndex: 1200, display: "flex",
              alignItems: "center", justifyContent: "center", padding: 24 }}>
            <motion.div
              initial={{ scale: 0.94, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.94, y: 16, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              onClick={e => e.stopPropagation()}
              style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 560,
                maxHeight: "80vh", display: "flex", flexDirection: "column",
                boxShadow: "0 32px 80px rgba(0,0,0,0.2)", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f5",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                  {viewMore.label}
                </span>
                <button onClick={() => setViewMore(null)}
                  style={{ width: 28, height: 28, borderRadius: 8, background: "#f8f9fc",
                    border: "1px solid #f0f0f5", cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: 16 }}>
                  ✕
                </button>
              </div>
              <div style={{ padding: "18px 20px", overflowY: "auto" }}>
                {viewMore.label === "Texte du post"
                  ? <SmartCaption text={viewMore.value} />
                  : viewMore.image
                  ? <ImageField value={viewMore.value} />
                  : <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.8,
                      whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {viewMore.value}
                    </div>
                }
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── All rows modal ── */}
      <AnimatePresence>
        {showAllRows && brief && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowAllRows(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)",
              backdropFilter: "blur(8px)", zIndex: 1100, display: "flex",
              alignItems: "center", justifyContent: "center", padding: 24 }}>
            <motion.div
              initial={{ scale: 0.94, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.94, y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 28 }}
              onClick={e => e.stopPropagation()}
              style={{ background: "#f8fafc", borderRadius: 24, width: "100%", maxWidth: 860,
                maxHeight: "88vh", display: "flex", flexDirection: "column",
                boxShadow: "0 40px 100px rgba(0,0,0,0.22)", overflow: "hidden" }}>

              {/* Modal header */}
              <div style={{ padding: "18px 24px", background: "#fff",
                borderBottom: "1.5px solid #f0f0f5",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                flexShrink: 0 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                    {brief.title} — tous les posts
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                    {brief.rows.length} ligne{brief.rows.length > 1 ? "s" : ""} · cliquer une ligne pour l'assigner
                  </div>
                </div>
                <button onClick={() => setShowAllRows(false)}
                  style={{ width: 32, height: 32, borderRadius: 9,
                    background: "#f8f9fc", border: "1px solid #ebebf0",
                    cursor: "pointer", display: "flex", alignItems: "center",
                    justifyContent: "center", color: "#64748b", fontSize: 16 }}>
                  ✕
                </button>
              </div>

              {/* Modal body — scrollable grid */}
              <div style={{ overflowY: "auto", padding: "20px 24px",
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {brief.rows.map(row => {
                  const sc = STATUS_COLOR[row.status ?? ""] ?? STATUS_COLOR.Draft;
                  const isAssigned = assignedRowKeys.has(row.rowKey);
                  const platforms: string[] = row.platforms
                    ? (() => { try { return JSON.parse(row.platforms); } catch { return [row.platforms]; } })()
                    : [];
                  return (
                    <div key={row.rowKey}
                      style={{ background: "#fff", borderRadius: 16,
                        border: `1.5px solid ${isAssigned ? "#bbf7d0" : "#e5e7eb"}`,
                        overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>

                      {/* Row header */}
                      <div style={{ padding: "10px 14px", background: isAssigned ? "#f0fdf4" : "#f8fafc",
                        borderBottom: `1.5px solid ${isAssigned ? "#bbf7d0" : "#e5e7eb"}`,
                        display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <div style={{ width: 26, height: 26, borderRadius: 7,
                          background: "#0f172a", display: "flex", alignItems: "center",
                          justifyContent: "center", color: "#fff", fontSize: 11,
                          fontWeight: 800, flexShrink: 0 }}>
                          {row.rowKey}
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px",
                          borderRadius: 20, background: sc.bg, color: sc.text }}>
                          {row.status ?? "—"}
                        </span>
                        {platforms.slice(0, 2).map(p => <PlatformBadge key={p} name={p} />)}
                        <div style={{ marginLeft: "auto" }}>
                          {isAssigned ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 700 }}>✓ Assigné</span>
                              <button
                                onClick={() => {
                                  setAssignedRowKeys(prev => { const s = new Set(prev); s.delete(row.rowKey); return s; });
                                  fetch(`${API}/api/assignments/cancel`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                    body: JSON.stringify({ rowKey: row.rowKey, postId: row.postId, clientId }),
                                  }).catch(() => {});
                                }}
                                style={{ fontSize: 10, padding: "2px 8px", borderRadius: 8,
                                  border: "1px solid #fca5a5", background: "#fff", color: "#dc2626",
                                  cursor: "pointer", fontWeight: 600 }}>
                                Annuler
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setShowAllRows(false); setAssignRow({ rowKey: row.rowKey, postId: row.postId, briefTitle: brief.title }); }}
                              style={{ display: "flex", alignItems: "center", gap: 4,
                                padding: "4px 10px", borderRadius: 8,
                                border: "1.5px solid #dc2626", background: "#fef2f2",
                                color: "#dc2626", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                              <FiUserPlus size={10} /> Assigner
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Row summary */}
                      <div style={{ padding: "10px 14px" }}>
                        {row.caption ? (
                          <div style={{ fontSize: 11, color: "#374151", lineHeight: 1.6,
                            display: "-webkit-box", WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {row.caption}
                          </div>
                        ) : (
                          <div style={{ fontSize: 11, color: "#cbd5e1", fontStyle: "italic" }}>
                            Pas encore rédigé
                          </div>
                        )}
                        {row.scheduledAt && (
                          <div style={{ fontSize: 10, color: "#64748b", marginTop: 6 }}>
                            📅 {new Date(row.scheduledAt).toLocaleDateString("fr-FR")}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tab: Comments ── */}
      {tab === "comments" && (
        brief.comments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 16px", background: "#f8fafc",
            borderRadius: 14, border: "1px dashed #e2e8f0" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
              Aucun commentaire sur cette carte
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {brief.comments.map((c, i) => (
              <div key={i} style={{ padding: "14px 16px", borderRadius: 12,
                background: "#f8fafc", border: "1px solid #f0f0f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 9,
                    background: "linear-gradient(135deg,#dc2626,#dc2626)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                    {c.author.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{c.author}</div>
                    {c.date && (
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>
                        {new Date(c.date).toLocaleString("fr-FR")}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {c.text}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Tab: Description ── */}
      {tab === "info" && (
        <div style={{ padding: "18px 20px", borderRadius: 14,
          background: "#f8fafc", border: "1px solid #f0f0f0" }}>
          {brief.description ? (
            <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
              {brief.description}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: "#94a3b8", fontStyle: "italic" }}>
              Aucune description sur cette carte Trello.
            </div>
          )}
          {brief.sheetUrl && (
            <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 10,
              background: "#f0fdf4", border: "1px solid #bbf7d0",
              display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>📊</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a" }}>Google Sheet lié</div>
                <a href={brief.sheetUrl} target="_blank" rel="noreferrer"
                  style={{ fontSize: 11, color: "#1d4ed8", wordBreak: "break-all" }}>
                  {brief.sheetUrl}
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Live Sheet ── */}
      {tab === "live" && (() => {
        if (!brief.sheetUrl) return (
          <div style={{ textAlign: "center", padding: "32px 16px", background: "#f8fafc",
            borderRadius: 14, border: "1px dashed #e2e8f0" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
              Aucun Google Sheet associé à ce brief.
            </div>
          </div>
        );
        const idMatch  = brief.sheetUrl.match(/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
        const gidMatch = brief.sheetUrl.match(/[?&#]gid=(\d+)/);
        if (!idMatch) return <div style={{ color: "#dc2626", fontSize: 13 }}>URL du sheet invalide.</div>;
        const id  = idMatch[1];
        const gid = gidMatch ? gidMatch[1] : "0";
        const embedUrl = `https://docs.google.com/spreadsheets/d/${id}/htmlview?gid=${gid}&widget=true&rm=minimal`;
        return (
          <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid #e5e7eb" }}>
            <div style={{ padding: "8px 14px", background: "#f8fafc", borderBottom: "1px solid #e5e7eb",
              display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                🔴 Affichage en direct — Google Sheet
              </span>
              <a href={brief.sheetUrl} target="_blank" rel="noreferrer"
                style={{ fontSize: 11, color: "#1d4ed8", display: "flex", alignItems: "center", gap: 4,
                  textDecoration: "none", fontWeight: 600 }}>
                <FiExternalLink size={11} /> Ouvrir
              </a>
            </div>
            <iframe
              src={embedUrl}
              style={{ width: "100%", height: 480, border: "none", display: "block" }}
              title="Google Sheet Live"
            />
          </div>
        );
      })()}

      {/* ── Assign Modal ── */}
      <AnimatePresence>
        {assignRow && (
          <AssignModal
            briefTitle={assignRow.briefTitle}
            rowKey={assignRow.rowKey}
            postId={assignRow.postId}
            clientId={clientId}
            token={token}
            onClose={() => setAssignRow(null)}
            onAssigned={() => {
              if (assignRow) setAssignedRowKeys(prev => new Set([...prev, assignRow.rowKey]));
              setAssignRow(null);
            }}
            onSelf={() => setAssignRow(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
