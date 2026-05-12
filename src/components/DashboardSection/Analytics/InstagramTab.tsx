// Analytics/InstagramTab.tsx
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import { CustomTooltip, SectionTitle } from "./AnalyticsComponents";
import { fmtNum, fmtDate } from "./analyticsHelpers";
import type { InstagramSummary } from "./analyticsTypes";

type Props = { igData: InstagramSummary | null; token: string | null };

const API = "https://localhost:7079";

type SentimentResult = {
  positive: number;
  negative: number;
  neutral:  number;
  summary:  string;
};

const SC = { positive: "#10b981", negative: "#ef4444", neutral: "#94a3b8" };
const SE = { positive: "😊", negative: "😠", neutral: "😐" };

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

export default function InstagramTab({ igData, token }: Props) {
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [sentimentMap, setSentimentMap] = useState<Record<string, SentimentResult | "loading">>({});
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

  // Likes par post pour le bar chart
  const likesPerPost = [...igTopPosts]
    .sort((a, b) => b.likeCount - a.likeCount)
    .slice(0, 6)
    .map((p, i) => ({
      name: `Post ${i + 1}`,
      likes: p.likeCount,
      comments: p.commentCount,
    }));

  const selectedPostData = igTopPosts.find(p => p.id === selectedPost);

  const handleAnalyze = async (postId: string, caption: string) => {
    if (!token || sentimentMap[postId] || analyzingRef.current[postId]) return;
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
      setSentimentMap(prev => ({
        ...prev,
        [postId]: {
          positive: Number(payload?.positive ?? 0),
          neutral:  Number(payload?.neutral  ?? 0),
          negative: Number(payload?.negative ?? 0),
          summary:  String(payload?.summary  ?? ""),
        },
      }));
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
        <Kpi label="Followers"    value={fmtNum(igFollowers)}  sub="audience"       color="#e1306c" />
        <Kpi label="Posts"        value={igMediaCount}         sub="published"      color="#e65787" />
        <Kpi label="Likes"        value={fmtNum(igTotalLikes)} sub="recent posts"   color="#f59e0b" />
        <Kpi label="Comments"     value={fmtNum(igTotalComments)} sub="recent posts" color="#06b6d4" />
        <Kpi label="Eng. Rate"    value={`${engRate}%`}        sub="likes+cmts/fol" color="#10b981" />
        <Kpi label="Avg Likes"    value={igMediaCount > 0 ? Math.round(igTotalLikes / igMediaCount) : 0} sub="per post" color="#e65787" />
      </div>

      {/* ── Charts ───────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, marginBottom: 14 }}>

        {/* Daily Reach */}
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

        {/* Likes & Comments par post */}
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

      {/* ── Top Liked Posts + Sentiment ──────────────────────────────────── */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", padding: "18px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <SectionTitle title="Top Liked Posts" sub="Sorted by likes · click ✨ Analyze for sentiment" badge="REAL" badgeColor="#e1306c" />
        </div>

        {topLiked.length === 0
          ? <div style={{ textAlign: "center", padding: "40px 0", color: "#cbd5e1", fontSize: 12 }}>No posts found</div>
          : topLiked.map((p, i) => {
            const s        = sentimentMap[p.id];
            const isLoad   = s === "loading";
            const result   = s && s !== "loading" ? s as SentimentResult : null;
            const total    = result ? result.positive + result.neutral + result.negative : 0;
            const isSelected = selectedPost === p.id;

            return (
              <div key={p.id}>
                <div
                  onClick={() => result && setSelectedPost(isSelected ? null : p.id)}
                  style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 8px",
                    borderRadius: 10, cursor: result ? "pointer" : "default",
                    background: isSelected ? "#fff8fa" : "transparent",
                    border: `1px solid ${isSelected ? "#e1306c30" : "transparent"}`,
                    transition: "all .15s", marginBottom: 6 }}>

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

                  {/* Sentiment mini-bar si résultat */}
                  {result && (
                    <div style={{ width: 120, flexShrink: 0 }}>
                      <div style={{ height: 6, borderRadius: 6, overflow: "hidden", display: "flex", marginBottom: 4 }}>
                        <div style={{ width: `${total > 0 ? (result.positive / total) * 100 : 0}%`, background: "#10b981" }} />
                        <div style={{ width: `${total > 0 ? (result.neutral  / total) * 100 : 0}%`, background: "#94a3b8" }} />
                        <div style={{ width: `${total > 0 ? (result.negative / total) * 100 : 0}%`, background: "#ef4444" }} />
                      </div>
                      <div style={{ display: "flex", gap: 6, fontSize: 10 }}>
                        <span style={{ color: "#10b981", fontWeight: 600 }}>😊{result.positive}</span>
                        <span style={{ color: "#94a3b8", fontWeight: 600 }}>😐{result.neutral}</span>
                        <span style={{ color: "#ef4444", fontWeight: 600 }}>😠{result.negative}</span>
                      </div>
                    </div>
                  )}

                  {/* Bouton */}
                  <div onClick={e => e.stopPropagation()} style={{ flexShrink: 0 }}>
                    {!result ? (
                      <button onClick={() => handleAnalyze(p.id, p.caption ?? "")}
                        disabled={isLoad}
                        style={{ padding: "5px 10px", borderRadius: 7,
                          border: `1px solid ${isLoad ? "#e2e8f0" : "#fecdd3"}`,
                          cursor: isLoad ? "not-allowed" : "pointer",
                          background: isLoad ? "#f8fafc" : "#fff0f4",
                          color: isLoad ? "#94a3b8" : "#e1306c",
                          fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                        {isLoad
                          ? <><span style={{ width: 10, height: 10, border: "2px solid #fca5a5",
                              borderTopColor: "#e1306c", borderRadius: "50%",
                              display: "inline-block", animation: "spin .8s linear infinite" }} />...</>
                          : "✨ Analyze"
                        }
                      </button>
                    ) : (
                      <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6,
                        background: "#f0fdf4", color: "#16a34a", fontWeight: 700 }}>✓</span>
                    )}
                  </div>
                </div>

                {/* Panel détail sentiment */}
                <AnimatePresence>
                  {isSelected && result && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: "hidden", marginBottom: 8 }}>
                      <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px",
                        border: "1px solid #f0f0f0", marginLeft: 34 }}>

                        {/* Grande barre */}
                        <div style={{ height: 10, borderRadius: 10, overflow: "hidden", display: "flex", marginBottom: 12 }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${total > 0 ? (result.positive / total) * 100 : 0}%` }}
                            transition={{ duration: 0.8 }} style={{ background: "#10b981", height: "100%" }} />
                          <motion.div initial={{ width: 0 }} animate={{ width: `${total > 0 ? (result.neutral / total) * 100 : 0}%` }}
                            transition={{ duration: 0.8, delay: 0.1 }} style={{ background: "#94a3b8", height: "100%" }} />
                          <motion.div initial={{ width: 0 }} animate={{ width: `${total > 0 ? (result.negative / total) * 100 : 0}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }} style={{ background: "#ef4444", height: "100%" }} />
                        </div>

                        {/* Stats */}
                        <div style={{ display: "flex", gap: 20, marginBottom: result.summary ? 10 : 0 }}>
                          {(["positive", "neutral", "negative"] as const).map(s => (
                            <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 14 }}>{SE[s]}</span>
                              <div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: SC[s], letterSpacing: "-0.5px" }}>
                                  {result[s]}
                                </div>
                                <div style={{ fontSize: 9, color: "#94a3b8" }}>
                                  {s} · {total > 0 ? Math.round((result[s] / total) * 100) : 0}%
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {result.summary && (
                          <div style={{ fontSize: 11, color: "#64748b", fontStyle: "italic",
                            lineHeight: 1.5, paddingTop: 8, borderTop: "1px solid #e2e8f0" }}>
                            "{result.summary}"
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        }
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}