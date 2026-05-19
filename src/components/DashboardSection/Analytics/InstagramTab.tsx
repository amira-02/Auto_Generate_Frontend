// Analytics/InstagramTab.tsx
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { FiX } from "react-icons/fi";
import { CustomTooltip, SectionTitle } from "./AnalyticsComponents";
import { fmtNum, fmtDate } from "./analyticsHelpers";
import type { InstagramSummary } from "./analyticsTypes";

type Props = { igData: InstagramSummary | null; token: string | null };

const API: string = import.meta.env.VITE_API_URL ?? "https://localhost:7079";

type CommentDetail = {
  text:      string;
  sentiment: "positive" | "neutral" | "negative";
  score:     number;
};

type SentimentResult = {
  positive: number;
  negative: number;
  neutral:  number;
  summary:  string;
  details?: CommentDetail[];
};

type ModalData = {
  postId:   string;
  caption:  string;
  mediaUrl: string | null;
  result:   SentimentResult;
};


// ── Mini KPI inline ───────────────────────────────────────────────────────────
function Kpi({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #f0f0f0",
      padding: "14px 16px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -16, right: -16, width: 52, height: 52,
        borderRadius: "50%", background: color + "12" }} />
      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", letterSpacing: "-1px" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: color, marginTop: 3, fontWeight: 500 }}>{sub}</div>}
    </div>
  );
}

// ── Sentiment Modal ───────────────────────────────────────────────────────────
const SENT_COLORS = { positive: "#10b981", neutral: "#94a3b8", negative: "#ef4444" };

function SentimentModal({ data, onClose }: { data: ModalData; onClose: () => void }) {
  const { result, caption, mediaUrl } = data;
  const total = result.positive + result.neutral + result.negative;
  const dominant = total === 0 ? "neutral"
    : result.positive >= result.negative && result.positive >= result.neutral ? "positive"
    : result.negative >= result.neutral ? "negative"
    : "neutral";

  const dominantLabels = { positive: "Globalement positif", negative: "Globalement négatif", neutral: "Audience mitigée" };

  const chartData = [
    { name: "Positive", value: result.positive,  pct: total > 0 ? Math.round((result.positive / total) * 100) : 0, fill: "#10b981" },
    { name: "Neutral",  value: result.neutral,   pct: total > 0 ? Math.round((result.neutral  / total) * 100) : 0, fill: "#94a3b8" },
    { name: "Negative", value: result.negative,  pct: total > 0 ? Math.round((result.negative / total) * 100) : 0, fill: "#ef4444" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(8px)", display: "flex", alignItems: "center",
        justifyContent: "center", zIndex: 2000, padding: 20 }}
    >
      <motion.div
        initial={{ scale: 0.93, y: 18, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.93, y: 18, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        onClick={e => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 22, width: "100%", maxWidth: 480,
          boxShadow: "0 32px 80px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)", overflow: "hidden" }}
      >
        {/* Header */}
        <div style={{ padding: "20px 22px 16px", borderBottom: "1px solid #f5f5f5",
          display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, overflow: "hidden",
              background: "#f1f5f9", flexShrink: 0 }}>
              {mediaUrl
                ? <img src={mediaUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", background: "#f1f5f9" }} />
              }
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Sentiment Analysis</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1, maxWidth: 280,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {caption || "No caption"}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9,
            background: "#f8f9fb", border: "1px solid #f0f0f0", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
            <FiX size={14} />
          </button>
        </div>

        <div style={{ padding: "22px 22px 24px", display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Dominant label */}
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: SENT_COLORS[dominant] }}>
              {dominantLabels[dominant]}
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
              Based on {total} comment{total !== 1 ? "s" : ""} analysed
            </div>
          </div>

          {/* Bar chart */}
          <div style={{ width: "100%", height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barSize={52}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#cbd5e1" }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "#f8f9fb" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: 10,
                        padding: "8px 12px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: d.fill }}>{d.name}</div>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{d.value} comments · {d.pct}%</div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}
                  shape={(props: any) => (
                    <rect x={props.x} y={props.y} width={props.width} height={props.height}
                      fill={props.fill} rx={8} ry={8} />
                  )}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {(["positive", "neutral", "negative"] as const).map(s => (
              <div key={s} style={{ borderRadius: 12, border: `1.5px solid ${SENT_COLORS[s]}22`,
                background: SENT_COLORS[s] + "08", padding: "12px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: SENT_COLORS[s], letterSpacing: "-0.5px" }}>
                  {result[s]}
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                  {s.charAt(0).toUpperCase() + s.slice(1)} · {total > 0 ? Math.round((result[s] / total) * 100) : 0}%
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          {result.summary && (
            <div style={{ background: "#f8f9fb", borderRadius: 12, padding: "12px 14px", border: "1px solid #f0f0f0" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", marginBottom: 6,
                textTransform: "uppercase", letterSpacing: "0.06em" }}>Summary</div>
              <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.6, fontStyle: "italic" }}>
                "{result.summary}"
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function InstagramTab({ igData, token }: Props) {
  const [sentimentMap, setSentimentMap] = useState<Record<string, SentimentResult | "loading">>({});
  const [modalData,    setModalData]    = useState<ModalData | null>(null);
  const analyzingRef = useRef<Record<string, boolean>>({});

  const igTopPosts      = igData?.topPosts      ?? [];
  const igTotalLikes    = igData?.totalLikes    ?? 0;
  const igTotalComments = igData?.totalComments ?? 0;
  const igFollowers     = igData?.followers     ?? 0;
  const igMediaCount    = igData?.mediaCount    ?? 0;
  const engRate         = igMediaCount > 0 && igFollowers > 0
    ? ((igTotalLikes + igTotalComments) / igMediaCount / igFollowers * 100).toFixed(2) : "0.00";

  const igReachData = (igData?.reachTimeline ?? []).map(r => ({ date: fmtDate(r.date), reach: r.value }));
  const topLiked    = [...igTopPosts].sort((a, b) => b.likeCount - a.likeCount);

  const likesPerPost = [...igTopPosts]
    .sort((a, b) => b.likeCount - a.likeCount)
    .slice(0, 6)
    .map((p, i) => ({ name: `Post ${i + 1}`, likes: p.likeCount, comments: p.commentCount }));

  const handleAnalyze = async (postId: string, caption: string, mediaUrl: string | null) => {
    if (!token || analyzingRef.current[postId]) return;

    // Si déjà analysé, ouvre directement le modal
    const cached = sentimentMap[postId];
    if (cached && cached !== "loading") {
      setModalData({ postId, caption, mediaUrl, result: cached as SentimentResult });
      return;
    }

    analyzingRef.current[postId] = true;
    setSentimentMap(prev => ({ ...prev, [postId]: "loading" }));
    try {
      const res = await fetch(`${API}/api/social/instagram/sentiment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ postId, caption }),
      });
      if (!res.ok) throw new Error();
      const payload = await res.json();
      const result: SentimentResult = {
        positive: Number(payload?.positive ?? 0),
        neutral:  Number(payload?.neutral  ?? 0),
        negative: Number(payload?.negative ?? 0),
        summary:  String(payload?.summary  ?? ""),
        details:  Array.isArray(payload?.details) ? payload.details : [],
      };
      setSentimentMap(prev => ({ ...prev, [postId]: result }));
      setModalData({ postId, caption, mediaUrl, result });
    } catch {
      setSentimentMap(prev => { const n = { ...prev }; delete n[postId]; return n; });
    } finally {
      analyzingRef.current[postId] = false;
    }
  };

  if (!igData) return (
    <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 16, border: "1.5px dashed #e5e7eb" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📸</div>
      <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 6px", color: "#1e293b" }}>Instagram not connected</h3>
      <p style={{ color: "#94a3b8", fontSize: 13 }}>Connect your Instagram account in the Accounts section.</p>
    </div>
  );

  return (
    <>
      {/* ── KPIs compacts ────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 14 }}>
        <Kpi label="Followers"    value={fmtNum(igFollowers)}     sub="audience"       color="#e1306c" />
        <Kpi label="Posts"        value={igMediaCount}            sub="published"      color="#dc2626" />
        <Kpi label="Likes"        value={fmtNum(igTotalLikes)}    sub="recent posts"   color="#f59e0b" />
        <Kpi label="Comments"     value={fmtNum(igTotalComments)} sub="recent posts"   color="#06b6d4" />
        <Kpi label="Eng. Rate"    value={`${engRate}%`}           sub="likes+cmts/fol" color="#10b981" />
        <Kpi label="Avg Likes"    value={igMediaCount > 0 ? Math.round(igTotalLikes / igMediaCount) : 0} sub="per post" color="#dc2626" />
      </div>

      {/* ── Charts ───────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, marginBottom: 14 }}>

        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", padding: "18px 22px" }}>
          <SectionTitle title="Daily Reach" sub="Unique accounts reached per day" badge="REAL" badgeColor="#e1306c" />
          <div style={{ marginTop: 14 }} />
          {igReachData.length === 0
            ? <div style={{ textAlign: "center", padding: "50px 0", color: "#cbd5e1", fontSize: 12 }}>No reach data available yet</div>
            : <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={igReachData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs><linearGradient id="gReach" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#e1306c" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#e1306c" stopOpacity={0} />
                </linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="reach" name="Reach" stroke="#e1306c" strokeWidth={2} fill="url(#gReach)" dot={{ fill: "#e1306c", r: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          }
        </div>

        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", padding: "18px 22px" }}>
          <SectionTitle title="Engagement per Post" sub="Likes and comments on recent posts" badge="REAL" badgeColor="#e1306c" />
          <div style={{ marginTop: 14 }} />
          {likesPerPost.length === 0
            ? <div style={{ textAlign: "center", padding: "50px 0", color: "#cbd5e1", fontSize: 12 }}>No posts data</div>
            : <ResponsiveContainer width="100%" height={180}>
              <BarChart data={likesPerPost} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={12} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="likes"    name="Likes"    fill="#e1306c" radius={[4, 4, 0, 0]} />
                <Bar dataKey="comments" name="Comments" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          }
        </div>
      </div>

      {/* ── Top Liked Posts ──────────────────────────────────────────────── */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", padding: "18px 22px" }}>
        <SectionTitle title="Top Liked Posts" sub="Cliquez ✨ Analyze pour le rapport de sentiment" badge="REAL" badgeColor="#e1306c" />

        <div style={{ marginTop: 14 }}>
          {topLiked.length === 0
            ? <div style={{ textAlign: "center", padding: "40px 0", color: "#cbd5e1", fontSize: 12 }}>No posts found</div>
            : topLiked.map((p, i) => {
              const s      = sentimentMap[p.id];
              const isLoad = s === "loading";
              const result = s && s !== "loading" ? s as SentimentResult : null;
              const total  = result ? result.positive + result.neutral + result.negative : 0;

              return (
                <div key={p.id}
                  style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 8px",
                    borderRadius: 10, marginBottom: 6, transition: "background .15s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#f8f9fb"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                >
                  {/* Rang */}
                  <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    background: i === 0 ? "#fef3c7" : i === 1 ? "#f1f5f9" : i === 2 ? "#fef3f2" : "#f8fafc",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700,
                    color: i === 0 ? "#d97706" : i === 1 ? "#64748b" : i === 2 ? "#cd7f32" : "#94a3b8" }}>
                    {i + 1}
                  </div>

                  {/* Image */}
                  <div style={{ width: 52, height: 52, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "#f1f5f9" }}>
                    {p.mediaUrl
                      ? <img src={p.mediaUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>🖼️</div>
                    }
                  </div>

                  {/* Caption + stats */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 3px", fontSize: 12, color: "#374151", lineHeight: 1.4,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p.caption || "No caption"}
                    </p>
                    <div style={{ display: "flex", gap: 10, fontSize: 11, color: "#94a3b8" }}>
                      <span>❤️ {fmtNum(p.likeCount)}</span>
                      <span>💬 {p.commentCount}</span>
                      <span>{fmtDate(p.timestamp)}</span>
                    </div>
                  </div>

                  {/* Mini barre si déjà analysé */}
                  {result && (
                    <div style={{ width: 110, flexShrink: 0 }}>
                      <div style={{ height: 5, borderRadius: 6, overflow: "hidden", display: "flex", marginBottom: 3 }}>
                        <div style={{ width: `${total > 0 ? (result.positive / total) * 100 : 0}%`, background: "#10b981" }} />
                        <div style={{ width: `${total > 0 ? (result.neutral  / total) * 100 : 0}%`, background: "#94a3b8" }} />
                        <div style={{ width: `${total > 0 ? (result.negative / total) * 100 : 0}%`, background: "#ef4444" }} />
                      </div>
                      <div style={{ display: "flex", gap: 5, fontSize: 10 }}>
                        <span style={{ color: "#10b981", fontWeight: 600 }}>😊{result.positive}</span>
                        <span style={{ color: "#94a3b8", fontWeight: 600 }}>😐{result.neutral}</span>
                        <span style={{ color: "#ef4444", fontWeight: 600 }}>😠{result.negative}</span>
                      </div>
                    </div>
                  )}

                  {/* Bouton Analyze */}
                  <button
                    onClick={() => handleAnalyze(p.id, p.caption ?? "", p.mediaUrl ?? null)}
                    disabled={isLoad}
                    style={{ padding: "5px 11px", borderRadius: 7, flexShrink: 0,
                      border: `1px solid ${result ? "#bbf7d0" : isLoad ? "#e2e8f0" : "#fecdd3"}`,
                      cursor: isLoad ? "not-allowed" : "pointer",
                      background: result ? "#f0fdf4" : isLoad ? "#f8fafc" : "#fff0f4",
                      color: result ? "#16a34a" : isLoad ? "#94a3b8" : "#e1306c",
                      fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                    {isLoad
                      ? <><span style={{ width: 10, height: 10, border: "2px solid #fca5a5",
                          borderTopColor: "#e1306c", borderRadius: "50%",
                          display: "inline-block", animation: "spin .8s linear infinite" }} />Analyse…</>
                      : result ? "📊 Voir rapport" : "✨ Analyze"
                    }
                  </button>
                </div>
              );
            })
          }
        </div>
      </div>

      {/* ── Sentiment Modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {modalData && (
          <SentimentModal data={modalData} onClose={() => setModalData(null)} />
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
