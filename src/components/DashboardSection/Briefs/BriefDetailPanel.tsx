import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowLeft, FiExternalLink, FiUserPlus, FiCalendar, FiClock, FiGlobe, FiPenTool, FiSend, FiDollarSign, FiTarget, FiUsers, FiMessageCircle, FiHash, FiAlignLeft, FiRefreshCw, FiFileText, FiDroplet, FiImage, FiInfo, FiCheck } from "react-icons/fi";
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

function PlatformIcon({ name, dim, size = 22 }: { name: string; dim?: boolean; size?: number }) {
  const opacity = dim ? 0.15 : 1;
  const filter  = dim ? "grayscale(1)" : "none";
  const base: React.CSSProperties = { display: "block", flexShrink: 0, opacity, filter, transition: "opacity .15s, filter .15s" };
  const k = name.toLowerCase();

  if (k === "instagram") return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" style={base}>
      <defs><linearGradient id="pi-ig-pop" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
        <stop stopColor="#feda75"/><stop offset=".3" stopColor="#fa7e1e"/>
        <stop offset=".6" stopColor="#d62976"/><stop offset="1" stopColor="#4f5bd5"/>
      </linearGradient></defs>
      <rect x="2" y="2" width="20" height="20" rx="5.5" stroke="url(#pi-ig-pop)" strokeWidth="2"/>
      <circle cx="12" cy="12" r="4.5" stroke="url(#pi-ig-pop)" strokeWidth="2"/>
      <circle cx="17.5" cy="6.5" r="1.2" fill="#d62976"/>
    </svg>
  );
  if (k === "facebook") return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="#1877f2" style={base}>
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
    </svg>
  );
  if (k === "linkedin") return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="#0077b5" style={base}>
      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4V9h4v1.5A6 6 0 0116 8z"/>
      <rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
    </svg>
  );
  if (k === "tiktok") return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="#010101" style={base}>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05A6.34 6.34 0 003.15 15.3a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.97a8.16 8.16 0 004.77 1.52V8.04a4.85 4.85 0 01-1-.35z"/>
    </svg>
  );
  return <span style={{ ...base, fontSize: 11, fontWeight: 700, color: "#9ca3af" }}>{name[0]}</span>;
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

// ── Popup helpers ────────────────────────────────────────────────────────────
function SecHead({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
      <div style={{ width: 26, height: 26, borderRadius: 7, background: "#eef2ff",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#6366f1", flexShrink: 0 }}>
        {icon}
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{title}</span>
    </div>
  );
}

function Tile({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 5 }}>
        {icon && <span style={{ color: "#d1d5db", display: "flex", alignItems: "center" }}>{icon}</span>}
        <span style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af",
          textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{label}</span>
      </div>
      {children}
    </div>
  );
}

function Empty() {
  return <span style={{ fontSize: 13, color: "#d1d5db" }}>—</span>;
}

function TextField({ label, value, icon }: { label: string; value: string | null; icon?: React.ReactNode }) {
  return (
    <Tile label={label} icon={icon}>
      {value
        ? <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.7,
            whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{value}</div>
        : <Empty />}
    </Tile>
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
  const [syncing,         setSyncing]         = useState(false);
  const [syncDone,        setSyncDone]        = useState(false);
  const [tab,             setTab]             = useState<"rows" | "comments" | "info" | "live">("rows");
  const [assignRow,       setAssignRow]       = useState<AssignTarget | null>(null);
  const [assignedRowKeys, setAssignedRowKeys] = useState<Set<string>>(new Set());
  const [detailRow,       setDetailRow]       = useState<SheetRow | null>(null);

  // Fetch brief data (silent — no full page loader)
  const fetchBrief = async () => {
    try {
      const res = await fetch(`${API}/api/trello/briefs/${briefId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setBrief(await res.json());
    } catch {}
  };

  // Trigger backend sync then refresh displayed data
  const syncAndFetch = async () => {
    setSyncing(true);
    setSyncDone(false);
    try {
      await fetch(`${API}/api/sheets/sync/${clientId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
    await fetchBrief();
    setSyncing(false);
    setSyncDone(true);
    setTimeout(() => setSyncDone(false), 2500);
  };

  // On mount: sync first, then show data
  useEffect(() => {
    setLoading(true);
    syncAndFetch().finally(() => setLoading(false));

    fetch(`${API}/api/assignments?clientId=${clientId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then((list: any[]) => {
        setAssignedRowKeys(new Set(list.map((a: any) => a.rowKey).filter(Boolean)));
      })
      .catch(() => {});
  }, [briefId]);

  // Background refresh every 30s
  useEffect(() => {
    const id = setInterval(() => fetchBrief(), 30 * 1000);
    return () => clearInterval(id);
  }, [briefId]);

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

        {/* Sync button */}
        <button onClick={syncAndFetch} disabled={syncing}
          title="Synchroniser avec Google Sheets"
          style={{ display: "flex", alignItems: "center", gap: 6,
            padding: "7px 12px", borderRadius: 9, border: "1px solid #e5e7eb",
            background: syncDone ? "#f0fdf4" : "#fff",
            color: syncDone ? "#16a34a" : syncing ? "#9ca3af" : "#374151",
            fontSize: 12, fontWeight: 600, cursor: syncing ? "not-allowed" : "pointer",
            transition: "all .2s", flexShrink: 0 }}>
          {syncDone
            ? <><FiCheck size={12} /> Synced</>
            : <><FiRefreshCw size={12}
                style={{ animation: syncing ? "spin .7s linear infinite" : "none" }} />
               {syncing ? "Sync…" : "Actualiser"}</>}
        </button>
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

      {/* ── Tab: Posts ── */}
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
          <div style={{ borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden",
            background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>

            {/* Table header */}
            <div style={{ display: "grid", gridTemplateColumns: "48px 110px 96px 1fr 148px",
              padding: "10px 16px", background: "#f8fafc",
              borderBottom: "1px solid #e5e7eb", gap: 12 }}>
              {["N°", "Statut", "Date", "Contenu", ""].map((h, i) => (
                <span key={i} style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8",
                  textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</span>
              ))}
            </div>

            {/* All rows */}
            {brief.rows.map((row, idx) => {
              const sc = STATUS_COLOR[row.status ?? ""] ?? STATUS_COLOR.Draft;
              const isAssigned = assignedRowKeys.has(row.rowKey);
              return (
                <div key={row.rowKey}
                  style={{ display: "grid", gridTemplateColumns: "48px 110px 96px 1fr 148px",
                    padding: "13px 16px", gap: 12, alignItems: "center",
                    borderTop: idx > 0 ? "1px solid #f0f0f5" : "none",
                    background: isAssigned ? "#f0fdf4" : "#fff",
                    borderLeft: `3px solid ${isAssigned ? "#22c55e" : "transparent"}`,
                    cursor: "pointer", transition: "background .12s" }}
                  onMouseEnter={e => { if (!isAssigned) e.currentTarget.style.background = "#f8fafc"; }}
                  onMouseLeave={e => { if (!isAssigned) e.currentTarget.style.background = "#fff"; }}>

                  <div style={{ width: 32, height: 32, borderRadius: 9, background: "#6366f1",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
                    {row.rowKey}
                  </div>

                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px",
                    borderRadius: 20, background: sc.bg, color: sc.text,
                    display: "inline-block", whiteSpace: "nowrap" }}>
                    {row.status ?? "—"}
                  </span>

                  <span style={{ fontSize: 11, color: "#64748b" }}>
                    {row.scheduledAt
                      ? new Date(row.scheduledAt).toLocaleDateString("fr-FR")
                      : <span style={{ color: "#e2e8f0" }}>—</span>}
                  </span>

                  <div style={{ overflow: "hidden", minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: "#374151",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {row.caption || <span style={{ color: "#cbd5e1", fontStyle: "italic" }}>Pas encore rédigé</span>}
                    </div>
                    {row.brief && (
                      <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {row.brief}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                    <button onClick={() => setDetailRow(row)}
                      style={{ padding: "4px 10px", borderRadius: 8,
                        border: "1px solid #e2e8f0", background: "#f8fafc",
                        color: "#64748b", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                      Voir
                    </button>
                    {isAssigned ? (
                      <button onClick={() => {
                          setAssignedRowKeys(prev => { const s = new Set(prev); s.delete(row.rowKey); return s; });
                          fetch(`${API}/api/assignments/cancel`, {
                            method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ rowKey: row.rowKey, postId: row.postId, clientId }),
                          }).catch(() => {});
                        }}
                        style={{ fontSize: 10, padding: "4px 10px", borderRadius: 8,
                          border: "1px solid #fca5a5", background: "#fff1f2",
                          color: "#dc2626", cursor: "pointer", fontWeight: 600 }}>
                        Annuler
                      </button>
                    ) : (
                      <button onClick={() => setAssignRow({ rowKey: row.rowKey, postId: row.postId, briefTitle: brief.title })}
                        style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px",
                          borderRadius: 8, border: "1.5px solid #dc2626", background: "#fef2f2",
                          color: "#dc2626", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                        <FiUserPlus size={10} /> Assigner
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Row detail popup ── */}
      <AnimatePresence>
        {detailRow && (() => {
          const sc = STATUS_COLOR[detailRow.status ?? ""] ?? STATUS_COLOR.Draft;
          const isAssigned = assignedRowKeys.has(detailRow.rowKey);
          const pubDate = detailRow.scheduledAt ? new Date(detailRow.scheduledAt) : null;
          const platforms: string[] = detailRow.platforms
            ? (() => { try { return JSON.parse(detailRow.platforms); } catch { return detailRow.platforms!.split(",").map((s: string) => s.trim()); } })()
            : [];
          const pages: string[] = detailRow.pages
            ? (() => { try { return JSON.parse(detailRow.pages); } catch { return detailRow.pages!.split(",").map((s: string) => s.trim()); } })()
            : [];
          const allPlatforms = ["Instagram", "Facebook", "LinkedIn", "TikTok"];
          const activePlats = [...new Set([...platforms, ...pages].map(p => p.toLowerCase()))];
          const tags = detailRow.hashtags ? (detailRow.hashtags.match(/#\w+/g) ?? detailRow.hashtags.split(/\s+/).filter(Boolean)) : [];
          const dupeOui = detailRow.duplicateIG ? /oui|yes|true|1/i.test(detailRow.duplicateIG) : null;

          const sCard: React.CSSProperties = {
            background: "#fff", borderRadius: 14, border: "1px solid #f1f5f9",
            padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
          };

          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDetailRow(null)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
                backdropFilter: "blur(8px)", zIndex: 1100, display: "flex",
                alignItems: "center", justifyContent: "center", padding: 20 }}>
              <motion.div
                initial={{ scale: 0.95, y: 16, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 16, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                onClick={e => e.stopPropagation()}
                style={{ background: "#f9fafb", borderRadius: 20, width: "100%", maxWidth: 840,
                  maxHeight: "92vh", display: "flex", flexDirection: "column",
                  boxShadow: "0 24px 64px rgba(0,0,0,0.14)",
                  fontFamily: "'Inter','Segoe UI',system-ui,-apple-system,sans-serif",
                  overflow: "hidden" }}>

                {/* ── Header ── */}
                <div style={{ padding: "16px 22px", background: "#fff", flexShrink: 0,
                  borderBottom: "1px solid #f3f4f6",
                  display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>
                        Post {detailRow.rowKey}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px",
                        borderRadius: 20, background: sc.bg, color: sc.text }}>
                        {detailRow.status ?? "—"}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2, fontWeight: 500,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {brief.title}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {isAssigned ? (
                      <>
                        <span style={{ fontSize: 11, color: "#10b981", fontWeight: 700 }}>✓ Assigné</span>
                        <button onClick={() => {
                            setAssignedRowKeys(prev => { const s = new Set(prev); s.delete(detailRow.rowKey); return s; });
                            fetch(`${API}/api/assignments/cancel`, {
                              method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ rowKey: detailRow.rowKey, postId: detailRow.postId, clientId }),
                            }).catch(() => {});
                          }}
                          style={{ fontSize: 11, padding: "6px 12px", borderRadius: 8, cursor: "pointer",
                            border: "1px solid #fca5a5", background: "#fef2f2", color: "#ef4444", fontWeight: 600 }}>
                          Annuler
                        </button>
                      </>
                    ) : (
                      <button onClick={() => { setDetailRow(null); setAssignRow({ rowKey: detailRow.rowKey, postId: detailRow.postId, briefTitle: brief.title }); }}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
                          borderRadius: 9, border: "none", background: "#6366f1",
                          color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        <FiUserPlus size={12} /> Assigner
                      </button>
                    )}
                    <button onClick={() => setDetailRow(null)}
                      style={{ width: 32, height: 32, borderRadius: 8, background: "#f3f4f6",
                        border: "none", cursor: "pointer", display: "flex",
                        alignItems: "center", justifyContent: "center", color: "#6b7280", fontSize: 16 }}>
                      ✕
                    </button>
                  </div>
                </div>

                {/* ── Body ── */}
                <div style={{ overflowY: "auto", flex: 1, padding: "14px 16px",
                  display: "flex", flexDirection: "column", gap: 12, background: "#f9fafb" }}>

                  {/* ① Planification */}
                  <div style={sCard}>
                    <SecHead icon={<FiCalendar size={13}/>} title="Planification" />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>

                      {/* Date */}
                      <Tile label="Date de publication" icon={<FiCalendar size={11}/>}>
                        {pubDate ? (
                          <div style={{ marginTop: 4 }}>
                            <div style={{ fontSize: 24, fontWeight: 800, color: "#111827", lineHeight: 1, letterSpacing: "-0.5px" }}>
                              {pubDate.getDate()} {pubDate.toLocaleDateString("fr-FR", { month: "short" })}
                            </div>
                            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>
                              {pubDate.toLocaleDateString("fr-FR", { weekday: "long" })} · {pubDate.getFullYear()}
                            </div>
                          </div>
                        ) : <Empty />}
                      </Tile>

                      {/* Heure */}
                      <Tile label="Heure de publication" icon={<FiClock size={11}/>}>
                        {pubDate ? (
                          <div style={{ marginTop: 4 }}>
                            <div style={{ fontSize: 24, fontWeight: 800, color: "#111827", lineHeight: 1, letterSpacing: "-0.5px" }}>
                              {pubDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>Heure locale</div>
                          </div>
                        ) : <Empty />}
                      </Tile>

                      {/* Plateformes */}
                      <Tile label="Pages" icon={<FiGlobe size={11}/>}>
                        <div style={{ display: "flex", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
                          {allPlatforms.map(p => (
                            <div key={p} title={p}>
                              <PlatformIcon name={p} dim={!activePlats.includes(p.toLowerCase())} />
                            </div>
                          ))}
                          {activePlats.length === 0 && <Empty />}
                        </div>
                      </Tile>
                    </div>
                  </div>

                  {/* ② Création du contenu */}
                  <div style={sCard}>
                    <SecHead icon={<FiPenTool size={13}/>} title="Création du contenu" />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>

                      {/* Brief */}
                      <Tile label="Brief créatif" icon={<FiFileText size={11}/>}>
                        {detailRow.brief
                          ? <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.75, marginTop: 4,
                              whiteSpace: "pre-wrap", wordBreak: "break-word",
                              borderLeft: "2px solid #e9d5ff", paddingLeft: 10 }}>
                              {detailRow.brief}
                            </div>
                          : <Empty />}
                      </Tile>

                      {/* Charte */}
                      <Tile label="Charte graphique" icon={<FiDroplet size={11}/>}>
                        {detailRow.charte ? (() => {
                          const hexes = detailRow.charte.match(/#[0-9a-fA-F]{3,6}/g) ?? [];
                          return (
                            <div style={{ marginTop: 4 }}>
                              {hexes.length > 0 && (
                                <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
                                  {hexes.map((h, i) => (
                                    <div key={i} title={h} style={{ width: 22, height: 22, borderRadius: 6,
                                      background: h, boxShadow: "0 0 0 1px rgba(0,0,0,0.1)" }} />
                                  ))}
                                </div>
                              )}
                              <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.65,
                                whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                {detailRow.charte}
                              </div>
                            </div>
                          );
                        })() : <Empty />}
                      </Tile>

                      {/* Format */}
                      <Tile label="Format" icon={<FiImage size={11}/>}>
                        {detailRow.format ? (() => {
                          const f = detailRow.format.toLowerCase();
                          const isSquare = /carr[eé]|1:1/.test(f);
                          const isStory  = /story|9:16/.test(f);
                          const isLandsc = /paysage|16:9|youtube/.test(f);
                          const isPortr  = /portrait|4:5/.test(f);
                          const isA4     = /a4|a3|pdf/.test(f);
                          const ratio    = isA4 ? "A4" : isStory ? "9:16" : isLandsc ? "16:9" : isPortr ? "4:5" : isSquare ? "1:1" : null;
                          const bw = isStory ? 18 : isLandsc ? 40 : isPortr ? 24 : 30;
                          const bh = isStory ? 36 : isLandsc ? 24 : isPortr ? 34 : isA4 ? 38 : 30;
                          return (
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                              {ratio && (
                                <div style={{ width: bw, height: bh, borderRadius: 4, flexShrink: 0,
                                  background: "#eef2ff", border: "2px solid #6366f1",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: 7, fontWeight: 800, color: "#6366f1" }}>
                                  {ratio}
                                </div>
                              )}
                              <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{detailRow.format}</span>
                            </div>
                          );
                        })() : <Empty />}
                      </Tile>

                      {/* Texte visuel */}
                      <Tile label="Texte visuel" icon={<FiPenTool size={11}/>}>
                        {detailRow.texteVisuel ? (
                          <div style={{ marginTop: 4, padding: "10px 12px", borderRadius: 8,
                            background: "#f5f3ff", border: "1px solid #ddd6fe" }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#6d28d9",
                              fontStyle: "italic", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                              "{detailRow.texteVisuel}"
                            </div>
                          </div>
                        ) : <Empty />}
                      </Tile>

                      {/* Images – full width */}
                      <div style={{ gridColumn: "1 / -1" }}>
                        <Tile label="Images & photos" icon={<FiImage size={11}/>}>
                          <div style={{ marginTop: 6 }}>
                            {detailRow.imagesPhotos ? <ImageField value={detailRow.imagesPhotos} /> : <Empty />}
                          </div>
                        </Tile>
                      </div>

                      {/* Infos du post – full width */}
                      <div style={{ gridColumn: "1 / -1" }}>
                        <Tile label="Infos à intégrer" icon={<FiInfo size={11}/>}>
                          {detailRow.infosPost
                            ? <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.7, marginTop: 4,
                                whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                {detailRow.infosPost}
                              </div>
                            : <Empty />}
                        </Tile>
                      </div>
                    </div>
                  </div>

                  {/* ③ Publication */}
                  <div style={sCard}>
                    <SecHead icon={<FiSend size={13}/>} title="Publication" />
                    <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 18 }}>

                      <Tile label="Texte du post" icon={<FiAlignLeft size={11}/>}>
                        <div style={{ marginTop: 4 }}>
                          {detailRow.caption ? <SmartCaption text={detailRow.caption} /> : <Empty />}
                        </div>
                      </Tile>

                      <Tile label="Hashtags" icon={<FiHash size={11}/>}>
                        {tags.length > 0 ? (
                          <div style={{ marginTop: 6 }}>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 6px" }}>
                              {tags.map((t, i) => (
                                <span key={i} style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px",
                                  borderRadius: 20, background: "#fef2f2", color: "#ef4444",
                                  border: "1px solid #fecaca" }}>{t}</span>
                              ))}
                            </div>
                            <div style={{ marginTop: 6, fontSize: 10, color: "#9ca3af" }}>
                              {tags.length} hashtag{tags.length > 1 ? "s" : ""}
                            </div>
                          </div>
                        ) : <Empty />}
                      </Tile>
                    </div>
                  </div>

                  {/* ④ Sponsorisation & Budget */}
                  <div style={sCard}>
                    <SecHead icon={<FiDollarSign size={13}/>} title="Sponsorisation & Budget" />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>

                      {/* Budget */}
                      <Tile label="Budget alloué" icon={<FiDollarSign size={11}/>}>
                        {detailRow.budget ? (
                          <div style={{ marginTop: 4 }}>
                            <div style={{ fontSize: 26, fontWeight: 900, color: "#4f46e5",
                              letterSpacing: "-1px", lineHeight: 1 }}>
                              {detailRow.budget}
                            </div>
                            <div style={{ width: 36, height: 3, background: "#6366f1",
                              borderRadius: 2, marginTop: 8 }} />
                          </div>
                        ) : <Empty />}
                      </Tile>

                      {/* Période de sponsorisation – horizontal */}
                      <Tile label="Période sponso" icon={<FiCalendar size={11}/>}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                          <div>
                            <div style={{ fontSize: 9, fontWeight: 700, color: "#10b981",
                              textTransform: "uppercase", letterSpacing: "0.06em" }}>Début</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>—</div>
                          </div>
                          <div style={{ flex: 1, height: 2, borderRadius: 2,
                            background: "linear-gradient(90deg,#10b981,#ef4444)" }} />
                          <div>
                            <div style={{ fontSize: 9, fontWeight: 700, color: "#ef4444",
                              textTransform: "uppercase", letterSpacing: "0.06em" }}>Fin</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                              {detailRow.sponsoEnd ?? "—"}
                            </div>
                          </div>
                        </div>
                      </Tile>

                      {/* Duplication IG */}
                      <Tile label="Duplication Instagram" icon={<FiRefreshCw size={11}/>}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                          <div style={{ width: 44, height: 24, borderRadius: 12, position: "relative", flexShrink: 0,
                            background: dupeOui ? "#10b981" : "#e5e7eb", transition: "background .2s" }}>
                            <div style={{ position: "absolute", top: 2, width: 20, height: 20,
                              borderRadius: "50%", background: "#fff",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                              left: dupeOui ? 22 : 2, transition: "left .2s" }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700,
                              color: dupeOui === null ? "#9ca3af" : dupeOui ? "#10b981" : "#ef4444" }}>
                              {dupeOui === null ? "—" : dupeOui ? "Oui" : "Non"}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                              <PlatformIcon name="Instagram" size={14} dim={!dupeOui} />
                              <span style={{ fontSize: 10, color: "#9ca3af" }}>Instagram</span>
                            </div>
                          </div>
                        </div>
                      </Tile>
                    </div>
                  </div>

                  {/* ⑤ Ciblage & Objectifs */}
                  <div style={sCard}>
                    <SecHead icon={<FiTarget size={13}/>} title="Ciblage & Objectifs" />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>

                      <Tile label="Objectif de campagne" icon={<FiTarget size={11}/>}>
                        {detailRow.objectif ? (
                          <span style={{ display: "inline-block", marginTop: 5, fontSize: 12, fontWeight: 700,
                            padding: "5px 14px", borderRadius: 20,
                            background: "#eef2ff", color: "#4f46e5", border: "1px solid #c7d2fe" }}>
                            {detailRow.objectif}
                          </span>
                        ) : <Empty />}
                      </Tile>

                      <Tile label="Audience cible" icon={<FiUsers size={11}/>}>
                        {detailRow.audience ? (() => {
                          const ageMatch = detailRow.audience.match(/\d{2}[\s-–]+\d{2}/);
                          const words = detailRow.audience.split(/[\s,;\/]+/).filter(w => w.length > 2);
                          return (
                            <div style={{ marginTop: 5 }}>
                              {ageMatch && (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 7,
                                  fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                                  background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
                                  {ageMatch[0]} ans
                                </span>
                              )}
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                                {words.slice(0, 8).map((w, i) => (
                                  <span key={i} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 20,
                                    background: "#f3f4f6", color: "#4b5563", fontWeight: 500 }}>{w}</span>
                                ))}
                              </div>
                            </div>
                          );
                        })() : <Empty />}
                      </Tile>
                    </div>
                  </div>

                  {/* ⑥ Notes & Commentaires */}
                  <div style={sCard}>
                    <SecHead icon={<FiMessageCircle size={13}/>} title="Notes & Commentaires" />
                    <div style={{ borderLeft: "2px solid #e9d5ff", paddingLeft: 14 }}>
                      {detailRow.commentaires
                        ? <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.8,
                            whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                            {detailRow.commentaires}
                          </div>
                        : <span style={{ fontSize: 12, color: "#d1d5db" }}>Aucune note pour ce post</span>}
                    </div>
                  </div>

                </div>
              </motion.div>
            </motion.div>
          );
        })()}
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
