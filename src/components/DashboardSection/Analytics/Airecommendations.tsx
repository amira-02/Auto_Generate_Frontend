// Analytics/AiRecommendations.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { InstagramSummary, FacebookSummary, Post } from "./analyticsTypes";

const API: string = import.meta.env.VITE_API_URL ?? "https://localhost:7079";

type Props = {
  posts:  Post[];
  igData: InstagramSummary | null;
  fbData: FacebookSummary  | null;
  token:  string | null;
};

type Recommendation = {
  type:        "trend" | "event" | "content" | "engagement";
  title:       string;
  description: string;
  action:      string;
  urgency:     "high" | "medium" | "low";
  platform:    string[];
};

const TYPE_META = {
  trend:      { icon: "📈", color: "#dc2626", label: "Trending"    },
  event:      { icon: "📅", color: "#f59e0b", label: "Event"       },
  content:    { icon: "💡", color: "#10b981", label: "Content Tip" },
  engagement: { icon: "🚀", color: "#e1306c", label: "Engagement"  },
};

const URGENCY_COLOR = {
  high:   { bg: "#fef2f2", text: "#dc2626", label: "Urgent"    },
  medium: { bg: "#fff7ed", text: "#ea580c", label: "This week" },
  low:    { bg: "#f0fdf4", text: "#16a34a", label: "Soon"      },
};

export default function AiRecommendations({ posts, igData, fbData, token }: Props) {
  const [recs,    setRecs]    = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [loaded,  setLoaded]  = useState(false);

  const generate = async () => {
    setLoading(true);
    setError(null);

    const igFollowers = igData?.followers ?? 0;
    const fbFans      = fbData?.fans      ?? 0;
    const igEngRate   = igData && igData.mediaCount > 0 && igFollowers > 0
      ? (((igData.totalLikes + igData.totalComments) / igData.mediaCount / igFollowers) * 100).toFixed(1)
      : "0";

    const recentCaptions = posts
      .filter(p => p.status?.toLowerCase() === "published")
      .slice(0, 5)
      .map(p => p.caption?.slice(0, 80))
      .filter(Boolean)
      .join(" | ");

    try {
      const res = await fetch(`${API}/api/ai/recommendations`, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token ?? ""}`,
        },
        body: JSON.stringify({
          igFollowers:   igFollowers,
          igEngRate:     igEngRate,
          igMediaCount:  igData?.mediaCount ?? 0,
          fbFans:        fbFans,
          recentCaptions: recentCaptions || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any)?.message ?? "API error");
      }

      const data = await res.json();
      const parsed: Recommendation[] = Array.isArray(data) ? data : [];

      setRecs(parsed);
      setLoaded(true);
    } catch (e: any) {
      setError(e?.message ?? "Failed to generate recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", padding: "20px 24px",
      display: "flex", flexDirection: "column", height: "100%", boxSizing: "border-box" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10,
            background: "linear-gradient(135deg,#dc2626,#dc2626)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>✨</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>AI Recommendations</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>Trends, events & content ideas · powered by Gemini</div>
          </div>
        </div>

        <button onClick={generate} disabled={loading} style={{
          padding: "8px 16px", borderRadius: 10, border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          background: loading ? "#f1f5f9" : "linear-gradient(135deg,#dc2626,#dc2626)",
          color: loading ? "#94a3b8" : "#fff",
          fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6,
          boxShadow: loading ? "none" : "0 2px 8px rgba(99,102,241,0.3)" }}>
          {loading
            ? <><span style={{ width: 12, height: 12, border: "2px solid #cbd5e1",
                borderTopColor: "#dc2626", borderRadius: "50%",
                display: "inline-block", animation: "spin .8s linear infinite" }} /> Analyzing market...</>
            : loaded ? "↻ Refresh" : "✨ Generate Insights"
          }
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>

      {/* Error */}
      {error && (
        <div style={{ padding: "12px 16px", borderRadius: 10, background: "#fef2f2",
          border: "1px solid #fecaca", fontSize: 12, color: "#dc2626", marginBottom: 12 }}>
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loaded && !loading && !error && (
        <div style={{ textAlign: "center", padding: "32px 20px", background: "#f8fafc",
          borderRadius: 12, border: "1px dashed #e2e8f0" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
            Discover what's trending right now
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", maxWidth: 320, margin: "0 auto" }}>
            Gemini will search the web for current trends, upcoming events and viral content formats
            relevant to your account.
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ height: 80, borderRadius: 12, background: "#f8fafc",
              border: "1px solid #f0f0f0", animation: `pulse 1.5s ease ${i * 0.1}s infinite` }} />
          ))}
        </div>
      )}

      {/* Recommendations */}
      <AnimatePresence>
        {loaded && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recs.map((rec, i) => {
                const tm = TYPE_META[rec.type]    ?? TYPE_META.content;
                const uc = URGENCY_COLOR[rec.urgency] ?? URGENCY_COLOR.low;
                return (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.3 }}
                    style={{ padding: "14px 16px", borderRadius: 12,
                      border: `1px solid ${tm.color}20`,
                      background: tm.color + "06" }}>

                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{tm.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                          {rec.title}
                        </div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 6,
                            background: tm.color + "20", color: tm.color }}>{tm.label}</span>
                          <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 6,
                            background: uc.bg, color: uc.text }}>{uc.label}</span>
                          {rec.platform.map(p => (
                            <span key={p} style={{ fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 6,
                              background: "#f1f5f9", color: "#64748b", textTransform: "capitalize" }}>{p}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <p style={{ margin: "0 0 10px", fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
                      {rec.description}
                    </p>

                    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px",
                      background: "#fff", borderRadius: 8, border: `1px solid ${tm.color}20` }}>
                      <span style={{ fontSize: 11, color: tm.color, fontWeight: 600 }}>→</span>
                      <span style={{ fontSize: 11, color: "#374151", fontWeight: 500 }}>{rec.action}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6,
              fontSize: 10, color: "#94a3b8" }}>
              <span>✨</span>
              <span>
                Generated by Gemini with Google Search ·{" "}
                {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}{" "}
                {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      </div>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
      `}</style>
    </div>
  );
}