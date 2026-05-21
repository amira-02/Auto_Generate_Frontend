import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiArrowLeft, FiExternalLink, FiRefreshCw } from "react-icons/fi";

const API = import.meta.env.VITE_API_URL ?? "https://localhost:7079";

type SheetRow = {
  rowKey:       string;
  postId:       number | null;
  status:       string | null;
  scheduledAt:  string | null;
  caption:      string | null;
  hashtags:     string | null;
  platforms:    string | null;
  brief:        string | null;
  format:       string | null;
  budget:       string | null;
  objectif:     string | null;
  audience:     string | null;
  texteVisuel:  string | null;
  pages:        string | null;
  commentaires: string | null;
};

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

export default function BriefDetailPanel({ briefId, clientId, token, onBack }: Props) {
  const [brief,    setBrief]    = useState<BriefDetail | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<"rows" | "comments" | "info" | "live">("rows");
  const [syncing,  setSyncing]  = useState(false);
  const [syncMsg,  setSyncMsg]  = useState<string | null>(null);

  useEffect(() => {
    fetchBrief();
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

  const handleSync = async () => {
    if (!clientId) return;
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch(`${API}/api/sheets/sync/${clientId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setSyncMsg(`+${data.created} ajoutée(s), ${data.updated} mise(s) à jour`);
        await fetchBrief();
      } else {
        setSyncMsg(data.message ?? "Erreur de sync");
      }
    } catch {
      setSyncMsg("Erreur réseau");
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(null), 4000);
    }
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
        {/* Sync button */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <button onClick={handleSync} disabled={syncing}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
              borderRadius: 8, border: "1px solid #e5e7eb", background: syncing ? "#f8fafc" : "#fff",
              cursor: syncing ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 600,
              color: syncing ? "#94a3b8" : "#16a34a" }}>
            <FiRefreshCw size={13} style={{ animation: syncing ? "spin 1s linear infinite" : "none" }} />
            {syncing ? "Sync…" : "Sync Sheet"}
          </button>
          {syncMsg && (
            <span style={{ fontSize: 10, color: syncMsg.startsWith("Erreur") ? "#dc2626" : "#16a34a",
              fontWeight: 600 }}>
              {syncMsg}
            </span>
          )}
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

      {/* ── Tab: Sheet rows ── */}
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
                ? "La sync est peut-être en cours ou le sheet n'est pas partagé publiquement."
                : "Ce brief n'a pas de Google Sheet associé."}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto", borderRadius: 14, border: "1px solid #e5e7eb" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["N°", "Statut", "Date pub.", "Caption", "Platforms", "Format", "Budget"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left",
                      fontWeight: 700, color: "#374151", fontSize: 11, whiteSpace: "nowrap",
                      borderBottom: "1px solid #e5e7eb" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {brief.rows.map((row, i) => {
                  const sc = STATUS_COLOR[row.status ?? ""] ?? STATUS_COLOR.Draft;
                  const platforms = row.platforms ? (() => {
                    try { return JSON.parse(row.platforms) as string[]; } catch { return [row.platforms]; }
                  })() : [];

                  return (
                    <tr key={row.rowKey}
                      style={{ background: i % 2 === 0 ? "#fff" : "#fafafa",
                        borderBottom: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "10px 14px", fontWeight: 700, color: "#374151" }}>
                        {row.rowKey}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px",
                          borderRadius: 6, background: sc.bg, color: sc.text }}>
                          {row.status ?? "—"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", color: "#475569", whiteSpace: "nowrap" }}>
                        {row.scheduledAt
                          ? new Date(row.scheduledAt).toLocaleDateString("fr-FR")
                          : "—"}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#374151", maxWidth: 240 }}>
                        <div style={{ display: "-webkit-box", WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.5 }}>
                          {row.caption ?? <span style={{ color: "#cbd5e1" }}>—</span>}
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {platforms.map(p => (
                            <span key={p} style={{ fontSize: 9, fontWeight: 600, padding: "1px 6px",
                              borderRadius: 4, background: "#eff6ff", color: "#1d4ed8",
                              textTransform: "capitalize" }}>{p}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px", color: "#64748b" }}>{row.format ?? "—"}</td>
                      <td style={{ padding: "10px 14px", color: "#64748b" }}>{row.budget ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

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
                    background: "linear-gradient(135deg,#1d4ed8,#3b82f6)",
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
    </motion.div>
  );
}
