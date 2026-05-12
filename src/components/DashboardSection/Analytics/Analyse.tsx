// src/components/DashboardSection/Analytics/Analytics.tsx
import { useState, useEffect, useContext } from "react";
import { motion } from "framer-motion";
import { AuthContext } from "../../../hooks/AuthContext";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const API: string = import.meta.env.VITE_API_URL ?? "https://localhost:7079";

// ─── Types ────────────────────────────────────────────────────────────────────

type Post = {
  id: number;
  status: string;
  topicName: string;
  platforms: string | string[];
  scheduledAt: string | null;
  createdAt: string;
  caption: string | null;
  imageUrl: string | null;
};

type FacebookSummary = {
  fans: number;
  followers: number;
  name: string;
  profilePicture: string;
  impressionsTimeline:  { date: string; value: number }[];
  engagedUsersTimeline: { date: string; value: number }[];
  fanAddsTimeline:      { date: string; value: number }[];
  recentPosts: {
    id: string; message: string; createdTime: string;
    fullPicture: string; permalinkUrl: string;
  }[];
  totalImpressions:  number;
  totalEngagedUsers: number;
};

type InstagramSummary = {
  followers: number;
  mediaCount: number;
  name: string;
  profilePicture: string;
  reachTimeline:    { date: string; value: number }[];
  followerTimeline: { date: string; value: number }[];
  topPosts: {
    id: string; caption: string; mediaType: string; mediaUrl: string;
    timestamp: string; likeCount: number; commentCount: number; permalink: string;
  }[];
  totalLikes: number;
  totalComments: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normalizePlatforms = (raw: unknown): string[] => {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") {
    try { const p = JSON.parse(raw); if (Array.isArray(p)) return p; } catch {}
    return raw.split(",").map(s => s.trim()).filter(Boolean);
  }
  return [];
};

const PLATFORM_META: Record<string, { color: string; icon: string; label: string }> = {
  instagram: { color: "#e1306c", icon: "📸", label: "Instagram" },
  linkedin:  { color: "#0077b5", icon: "💼", label: "LinkedIn"  },
  twitter:   { color: "#1da1f2", icon: "𝕏",  label: "Twitter/X" },
  facebook:  { color: "#1877f2", icon: "📘", label: "Facebook"  },
  tiktok:    { color: "#ff0050", icon: "🎵", label: "TikTok"    },
  threads:   { color: "#000000", icon: "🧵", label: "Threads"   },
};

const STATUS_COLOR: Record<string, string> = {
  published: "#10b981", scheduled: "#e65787",
  draft: "#94a3b8", inreview: "#f59e0b",
  approved: "#06b6d4", failed: "#ef4444",
};

const ENGAGEMENT_MULTIPLIERS: Record<string, number> = {
  instagram: 1.4, tiktok: 1.8, facebook: 1.1,
  twitter: 0.9, linkedin: 1.2, threads: 0.7,
};

function getMonthLabel(offset: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - offset);
  return d.toLocaleString("en-US", { month: "short" });
}

function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
  catch { return iso; }
}

function fmtNum(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000)    return (n / 1000).toFixed(1)    + "K";
  return String(n);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, accent, delta, icon, delay = 0, badge }: {
  label: string; value: string | number; sub?: string;
  accent: string; delta?: number; icon: string; delay?: number; badge?: string; badgeColor?: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }}
      style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", padding: "20px 22px",
        display: "flex", flexDirection: "column", gap: 10, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%",
        background: accent + "15", pointerEvents: "none" }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {badge && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20,
            background: accent + "20", color: accent }}>{badge}</span>}
          {delta !== undefined && <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
            background: delta >= 0 ? "#f0fdf4" : "#fef2f2", color: delta >= 0 ? "#16a34a" : "#dc2626" }}>
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}%</span>}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", fontFamily: "'DM Mono', monospace", letterSpacing: "-1.5px" }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: accent, marginTop: 3, fontWeight: 500 }}>{sub}</div>}
      </div>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0f172a", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#fff", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
      <div style={{ fontWeight: 700, marginBottom: 4, color: "#94a3b8" }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
          <span style={{ color: "#e2e8f0" }}>{p.name}:</span>
          <span style={{ fontWeight: 700 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

function SectionTitle({ title, sub, badge, badgeColor = "#e1306c" }: { title: string; sub?: string; badge?: string; badgeColor?: string }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{title}</div>
        {badge && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 10,
          background: badgeColor + "20", color: badgeColor, letterSpacing: "0.05em" }}>{badge}</span>}
      </div>
      {sub && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Analytics() {
  const { token } = useContext(AuthContext);
  const [posts, setPosts]         = useState<Post[]>([]);
  const [igData, setIgData]       = useState<InstagramSummary | null>(null);
  const [fbData, setFbData]       = useState<FacebookSummary | null>(null);
  const [loading, setLoading]     = useState(true);
  const [period, setPeriod]       = useState<"7d" | "30d" | "90d">("30d");
  const [activeTab, setActiveTab] = useState<"overview" | "instagram" | "facebook" | "content">("overview");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [postsRes, igRes, fbRes] = await Promise.all([
          fetch(`${API}/api/posts`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/api/social/instagram/summary`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/api/social/facebook/summary`,  { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (postsRes.ok) setPosts(await postsRes.json());
        if (igRes.ok)    setIgData(await igRes.json());
        if (fbRes.ok)    setFbData(await fbRes.json());
      } catch {}
      finally { setLoading(false); }
    };
    fetchAll();
  }, [token]);

  // ── Derived — Posts ──────────────────────────────────────────────────────────
  const now          = new Date();
  const thisMonth    = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth    = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const postsThisMonth = posts.filter(p => new Date(p.createdAt) >= thisMonth);
  const postsLastMonth = posts.filter(p => { const d = new Date(p.createdAt); return d >= lastMonth && d <= lastMonthEnd; });
  const published      = posts.filter(p => p.status?.toLowerCase() === "published");
  const scheduled      = posts.filter(p => p.status?.toLowerCase() === "scheduled");
  const growthPct      = postsLastMonth.length > 0 ? Math.round(((postsThisMonth.length - postsLastMonth.length) / postsLastMonth.length) * 100) : 0;

  const engagementScore = (p: Post) => {
    const plats = normalizePlatforms(p.platforms);
    const base  = 120 + (p.id % 80);
    const mult  = plats.reduce((acc, pl) => acc + (ENGAGEMENT_MULTIPLIERS[pl] ?? 1), 0) || 1;
    return Math.round(base * mult);
  };

  const topPosts = [...published].sort((a, b) => engagementScore(b) - engagementScore(a)).slice(0, 5);

  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const offset = 5 - i;
    const mStart = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const mEnd   = new Date(now.getFullYear(), now.getMonth() - offset + 1, 0);
    const mPosts = posts.filter(p => { const d = new Date(p.createdAt); return d >= mStart && d <= mEnd; });
    const mPub   = mPosts.filter(p => p.status?.toLowerCase() === "published");
    return { month: getMonthLabel(offset), total: mPosts.length, published: mPub.length,
      engagement: mPub.reduce((s, p) => s + engagementScore(p), 0) };
  });

  const comparisonData = [
    { metric: "Posts",     thisMonth: postsThisMonth.length,                                                                        lastMonth: postsLastMonth.length },
    { metric: "Published", thisMonth: postsThisMonth.filter(p => p.status?.toLowerCase() === "published").length,                   lastMonth: postsLastMonth.filter(p => p.status?.toLowerCase() === "published").length },
    { metric: "Drafts",    thisMonth: postsThisMonth.filter(p => p.status?.toLowerCase() === "draft").length,                       lastMonth: postsLastMonth.filter(p => p.status?.toLowerCase() === "draft").length },
    { metric: "Scheduled", thisMonth: postsThisMonth.filter(p => p.status?.toLowerCase() === "scheduled").length,                   lastMonth: postsLastMonth.filter(p => p.status?.toLowerCase() === "scheduled").length },
  ];

  const platformCounts = posts.reduce<Record<string, number>>((acc, p) => {
    normalizePlatforms(p.platforms).forEach(pl => { acc[pl] = (acc[pl] ?? 0) + 1; });
    return acc;
  }, {});
  const platformData = Object.entries(platformCounts)
    .map(([id, count]) => ({ id, name: PLATFORM_META[id]?.label ?? id, count, color: PLATFORM_META[id]?.color ?? "#94a3b8" }))
    .sort((a, b) => b.count - a.count);

  const statusCounts = posts.reduce<Record<string, number>>((acc, p) => {
    const s = p.status?.toLowerCase() ?? "draft"; acc[s] = (acc[s] ?? 0) + 1; return acc;
  }, {});
  const statusData = Object.entries(statusCounts).map(([s, v]) => ({
    name: s.charAt(0).toUpperCase() + s.slice(1), value: v, color: STATUS_COLOR[s] ?? "#94a3b8",
  }));

  // ── Derived — Instagram ───────────────────────────────────────────────────
  const igReachData    = (igData?.reachTimeline    ?? []).map(r => ({ date: fmtDate(r.date), reach: r.value }));
  const igFollowerData = (igData?.followerTimeline ?? []).map(f => ({ date: fmtDate(f.date), followers: f.value }));
  const igTopPosts     = igData?.topPosts      ?? [];
  const igTotalLikes   = igData?.totalLikes    ?? 0;
  const igTotalComments= igData?.totalComments ?? 0;
  const igFollowers    = igData?.followers     ?? 0;
  const igMediaCount   = igData?.mediaCount    ?? 0;
  const engRate        = igMediaCount > 0 && igFollowers > 0
    ? ((igTotalLikes + igTotalComments) / igMediaCount / igFollowers * 100).toFixed(2) : "0.00";

  // ── Derived — Facebook ────────────────────────────────────────────────────
  const fbTotalImpressions  = fbData?.impressionsTimeline.reduce( (s, r) => s + r.value, 0) ?? 0;
  const fbTotalEngaged      = fbData?.engagedUsersTimeline.reduce((s, r) => s + r.value, 0) ?? 0;
  const fbAvgDailyImp       = fbData?.impressionsTimeline.length
    ? Math.round(fbTotalImpressions / fbData.impressionsTimeline.length) : 0;
  const fbEngRate           = fbData && fbData.fans > 0
    ? ((fbTotalEngaged / 30 / fbData.fans) * 100).toFixed(2) : "0.00";

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#e65787" }} />
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── Top Bar ───────────────────────────────────────────────────────── */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f0f0f0",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)", padding: "12px 18px",
        display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "#fff1f3",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>📈</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Analytics</span>
        </div>

        {/* Instagram profile badge */}
        {igData && (
          <>
            <div style={{ width: 1, height: 22, background: "#f0f0f0" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {igData.profilePicture && <img src={igData.profilePicture} alt="" style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }} />}
              <span style={{ fontSize: 12, fontWeight: 600, color: "#e1306c" }}>@{igData.name}</span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>{fmtNum(igFollowers)} followers</span>
              <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 10, background: "#e1306c15", color: "#e1306c" }}>IG</span>
            </div>
          </>
        )}

        {/* Facebook profile badge */}
        {fbData && (
          <>
            <div style={{ width: 1, height: 22, background: "#f0f0f0" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {fbData.profilePicture && <img src={fbData.profilePicture} alt="" style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover", border: "2px solid #1877f220" }} />}
              <span style={{ fontSize: 12, fontWeight: 600, color: "#1877f2" }}>{fbData.name}</span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>{fmtNum(fbData.fans)} fans</span>
              <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 10, background: "#1877f215", color: "#1877f2" }}>FB</span>
            </div>
          </>
        )}

        <div style={{ flex: 1 }} />

        {/* Tabs */}
        <div style={{ display: "flex", background: "#f8f9fb", borderRadius: 10, padding: 3, border: "1px solid #f0f0f0" }}>
          {([
            { id: "overview",  label: "Overview"      },
            { id: "instagram", label: "📸 Instagram"  },
            { id: "facebook",  label: "📘 Facebook"   },
            { id: "content",   label: "Content"       },
          ] as const).map(t => {
            const tabAccent = t.id === "facebook" ? "#1877f2" : t.id === "instagram" ? "#e1306c" : "#e65787";
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                padding: "5px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                background: activeTab === t.id ? "#fff" : "transparent",
                color: activeTab === t.id ? tabAccent : "#94a3b8",
                fontSize: 12, fontWeight: activeTab === t.id ? 700 : 400,
                boxShadow: activeTab === t.id ? `0 1px 3px rgba(0,0,0,0.08)` : "none",
                transition: "all .15s",
              }}>{t.label}</button>
            );
          })}
        </div>

        {/* Period */}
        <div style={{ display: "flex", background: "#f8f9fb", borderRadius: 10, padding: 3, border: "1px solid #f0f0f0" }}>
          {(["7d", "30d", "90d"] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer",
              background: period === p ? "#fff" : "transparent",
              color: period === p ? "#0f172a" : "#94a3b8",
              fontSize: 11, fontWeight: period === p ? 600 : 400,
              boxShadow: period === p ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              transition: "all .15s",
            }}>{p}</button>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════ TAB: OVERVIEW ═════════════════════ */}
      {activeTab === "overview" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 14, marginBottom: 20 }}>
            <KpiCard label="Total Posts"      value={posts.length}           accent="#e65787" icon="📝" delta={growthPct} delay={0}    sub={`${postsThisMonth.length} this month`} />
            <KpiCard label="Published"        value={published.length}       accent="#10b981" icon="✅" delta={8}         delay={0.05} sub="Live on social" />
            <KpiCard label="IG Followers"     value={fmtNum(igFollowers)}    accent="#e1306c" icon="📸" delay={0.1}       sub="Instagram" badge="REAL" badgeColor="#e1306c" />
            <KpiCard label="IG Likes"         value={fmtNum(igTotalLikes)}   accent="#f59e0b" icon="❤️" delay={0.15}      sub="recent posts" badge="REAL" badgeColor="#e1306c" />
            <KpiCard label="FB Fans"          value={fmtNum(fbData?.fans ?? 0)} accent="#1877f2" icon="📘" delay={0.2}   sub="Facebook page" badge="REAL" badgeColor="#1877f2" />
            <KpiCard label="FB Impressions"   value={fmtNum(fbTotalImpressions)} accent="#06b6d4" icon="👁️" delay={0.25} sub="Last 30 days" badge="REAL" badgeColor="#1877f2" />
            <KpiCard label="IG Eng. Rate"     value={`${engRate}%`}          accent="#e65787" icon="💬" delay={0.3}       sub="likes+comments/followers" badge="REAL" badgeColor="#e1306c" />
            <KpiCard label="Scheduled"        value={scheduled.length}       accent="#e65787" icon="📅" delay={0.35}      sub="upcoming" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", padding: "20px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <SectionTitle title="Posts over time" sub="Monthly creation trend" />
                <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#94a3b8" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#e65787", display: "inline-block" }} />Total</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />Published</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={monthlyTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gT" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#e65787" stopOpacity={0.15} /><stop offset="95%" stopColor="#e65787" stopOpacity={0} /></linearGradient>
                    <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.15} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="total"     name="Total"     stroke="#e65787" strokeWidth={2} fill="url(#gT)" dot={{ fill: "#e65787", r: 3 }} />
                  <Area type="monotone" dataKey="published" name="Published" stroke="#10b981" strokeWidth={2} fill="url(#gP)" dot={{ fill: "#10b981", r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", padding: "20px 24px" }}>
              <SectionTitle title="This vs Last Month" sub="Month-over-month" />
              <div style={{ marginTop: 16 }} />
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={comparisonData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis dataKey="metric" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="thisMonth" name="This Month" fill="#e65787" radius={[4,4,0,0]} />
                  <Bar dataKey="lastMonth" name="Last Month" fill="#fce7ef"  radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
            {/* Platform usage */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", padding: "20px 24px" }}>
              <SectionTitle title="Platform Usage" sub="Posts per platform" />
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                {platformData.length === 0
                  ? <div style={{ textAlign: "center", padding: "30px 0", color: "#cbd5e1", fontSize: 12 }}>No data yet</div>
                  : platformData.map(pl => {
                    const pct = posts.length > 0 ? Math.round((pl.count / posts.length) * 100) : 0;
                    return (
                      <div key={pl.id}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: "#374151", display: "flex", alignItems: "center", gap: 5 }}>{PLATFORM_META[pl.id]?.icon} {pl.name}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: pl.color }}>{pl.count} <span style={{ color: "#94a3b8", fontWeight: 400 }}>({pct}%)</span></span>
                        </div>
                        <div style={{ height: 5, borderRadius: 10, background: "#f1f5f9", overflow: "hidden" }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                            style={{ height: "100%", borderRadius: 10, background: pl.color }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </motion.div>

            {/* Status pie */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
              style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", padding: "20px 24px" }}>
              <SectionTitle title="Status Breakdown" sub="Distribution of all posts" />
              {statusData.length === 0
                ? <div style={{ textAlign: "center", padding: "30px 0", color: "#cbd5e1", fontSize: 12 }}>No data</div>
                : <>
                  <ResponsiveContainer width="100%" height={130}>
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" innerRadius={38} outerRadius={60} dataKey="value" paddingAngle={3} strokeWidth={0}>
                        {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 8 }}>
                    {statusData.map(s => (
                      <div key={s.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#64748b" }}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.color, display: "inline-block" }} />{s.name}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>{s.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              }
            </motion.div>

            {/* Social overview - IG + FB combined */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", padding: "20px 24px" }}>
              <SectionTitle title="Social Overview" sub="Live platform stats" />
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Instagram */}
                <div style={{ padding: "12px", borderRadius: 10, background: "#fce8ef20", border: "1px solid #e1306c15" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    {igData?.profilePicture && <img src={igData.profilePicture} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#e1306c" }}>@{igData?.name ?? "Instagram"}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>Instagram</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {[
                      { label: "Followers", value: fmtNum(igFollowers) },
                      { label: "Posts",     value: igMediaCount },
                      { label: "Likes",     value: fmtNum(igTotalLikes) },
                      { label: "Eng. Rate", value: `${engRate}%` },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: "center", padding: "6px", background: "#fff", borderRadius: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{s.value}</div>
                        <div style={{ fontSize: 9, color: "#94a3b8" }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Facebook */}
                {fbData && (
                  <div style={{ padding: "12px", borderRadius: 10, background: "#1877f210", border: "1px solid #1877f215" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      {fbData.profilePicture && <img src={fbData.profilePicture} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />}
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#1877f2" }}>{fbData.name}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>Facebook Page</div>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      {[
                        { label: "Fans",        value: fmtNum(fbData.fans) },
                        { label: "Followers",   value: fmtNum(fbData.followers) },
                        { label: "Impressions", value: fmtNum(fbTotalImpressions) },
                        { label: "Eng. Rate",   value: `${fbEngRate}%` },
                      ].map(s => (
                        <div key={s.label} style={{ textAlign: "center", padding: "6px", background: "#fff", borderRadius: 8 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{s.value}</div>
                          <div style={{ fontSize: 9, color: "#94a3b8" }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}

      {/* ════════════════════════════════ TAB: INSTAGRAM ════════════════════ */}
      {activeTab === "instagram" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 14, marginBottom: 20 }}>
            <KpiCard label="Followers"      value={fmtNum(igFollowers)}     accent="#e1306c" icon="👥" delay={0}    sub="Instagram audience"       badge="REAL" badgeColor="#e1306c" />
            <KpiCard label="Total Posts"    value={igMediaCount}            accent="#e65787" icon="🖼️" delay={0.05} sub="published on IG"          badge="REAL" badgeColor="#e1306c" />
            <KpiCard label="Total Likes"    value={fmtNum(igTotalLikes)}    accent="#f59e0b" icon="❤️" delay={0.1}  sub="recent 6 posts"           badge="REAL" badgeColor="#e1306c" />
            <KpiCard label="Total Comments" value={fmtNum(igTotalComments)} accent="#06b6d4" icon="💬" delay={0.15} sub="recent 6 posts"           badge="REAL" badgeColor="#e1306c" />
            <KpiCard label="Eng. Rate"      value={`${engRate}%`}           accent="#10b981" icon="📊" delay={0.2}  sub="(likes+comments)/followers" badge="REAL" badgeColor="#e1306c" />
            <KpiCard label="Avg Likes/Post" value={igMediaCount > 0 ? Math.round(igTotalLikes / igMediaCount) : 0} accent="#e65787" icon="⭐" delay={0.25} sub="per post" badge="REAL" badgeColor="#e1306c" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", padding: "20px 24px" }}>
              <SectionTitle title="Daily Reach" sub="Unique accounts reached per day" badge="REAL" badgeColor="#e1306c" />
              <div style={{ marginTop: 16 }} />
              {igReachData.length === 0
                ? <div style={{ textAlign: "center", padding: "60px 0", color: "#cbd5e1", fontSize: 12 }}>No reach data available yet</div>
                : <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={igReachData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs><linearGradient id="gReach" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#e1306c" stopOpacity={0.2} /><stop offset="95%" stopColor="#e1306c" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="reach" name="Reach" stroke="#e1306c" strokeWidth={2} fill="url(#gReach)" dot={{ fill: "#e1306c", r: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              }
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", padding: "20px 24px" }}>
              <SectionTitle title="Follower Growth" sub="Daily follower count" badge="REAL" badgeColor="#e1306c" />
              <div style={{ marginTop: 16 }} />
              {igFollowerData.length === 0
                ? <div style={{ textAlign: "center", padding: "60px 0", color: "#cbd5e1", fontSize: 12 }}>No follower data available yet</div>
                : <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={igFollowerData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="followers" name="Followers" stroke="#e1306c" strokeWidth={2.5} dot={{ fill: "#e1306c", r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              }
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", padding: "20px 24px" }}>
            <SectionTitle title="Recent Instagram Posts" sub="Latest published content with engagement" badge="REAL" badgeColor="#e1306c" />
            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
              {igTopPosts.length === 0
                ? <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px 0", color: "#cbd5e1", fontSize: 12 }}>No Instagram posts found</div>
                : igTopPosts.map(p => (
                  <a key={p.id} href={p.permalink} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                    <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #f0f0f0", background: "#f8fafc", transition: "box-shadow .15s" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(225,48,108,0.15)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}>
                      <div style={{ position: "relative", paddingBottom: "100%" }}>
                        {p.mediaUrl
                          ? <img src={p.mediaUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                          : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: "#cbd5e1" }}>🖼️</div>
                        }
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.6))", padding: "16px 8px 8px", display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>❤️ {p.likeCount}</span>
                          <span style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>💬 {p.commentCount}</span>
                        </div>
                      </div>
                      <div style={{ padding: "8px 10px" }}>
                        <p style={{ margin: 0, fontSize: 11, color: "#475569", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {p.caption || "No caption"}
                        </p>
                        <div style={{ marginTop: 4, fontSize: 10, color: "#cbd5e1" }}>{fmtDate(p.timestamp)}</div>
                      </div>
                    </div>
                  </a>
                ))
              }
            </div>
          </motion.div>
        </>
      )}

      {/* ════════════════════════════════ TAB: FACEBOOK ═════════════════════ */}
      {activeTab === "facebook" && (
        <>
          {!fbData ? (
            <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 16, border: "1.5px dashed #e5e7eb" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📘</div>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 6px", color: "#1e293b" }}>Facebook not connected</h3>
              <p style={{ color: "#94a3b8", fontSize: 13 }}>Connect your Facebook Page in the Accounts section to see analytics.</p>
            </div>
          ) : (
            <>
              {/* FB KPIs */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 14, marginBottom: 20 }}>
                <KpiCard label="Page Fans"         value={fmtNum(fbData.fans)}       accent="#1877f2" icon="👥" delay={0}    sub="Total page likes"    badge="REAL" badgeColor="#1877f2" />
                <KpiCard label="Followers"          value={fmtNum(fbData.followers)}  accent="#1877f2" icon="📢" delay={0.05} sub="Page followers"      badge="REAL" badgeColor="#1877f2" />
                <KpiCard label="Total Impressions"  value={fmtNum(fbTotalImpressions)} accent="#06b6d4" icon="👁️" delay={0.1} sub="Last 30 days"        badge="REAL" badgeColor="#1877f2" />
                <KpiCard label="Engaged Users"      value={fmtNum(fbTotalEngaged)}    accent="#10b981" icon="💬" delay={0.15} sub="Last 30 days"        badge="REAL" badgeColor="#1877f2" />
                <KpiCard label="Avg Daily Reach"    value={fmtNum(fbAvgDailyImp)}     accent="#e65787" icon="📊" delay={0.2}  sub="impressions/day"     badge="REAL" badgeColor="#1877f2" />
                <KpiCard label="Page Eng. Rate"     value={`${fbEngRate}%`}           accent="#f59e0b" icon="⭐" delay={0.25} sub="engaged/fans/day"    badge="REAL" badgeColor="#1877f2" />
              </div>

              {/* Charts */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", padding: "20px 24px" }}>
                  <SectionTitle title="Daily Impressions" sub="Page reach per day" badge="REAL" badgeColor="#1877f2" />
                  <div style={{ marginTop: 16 }} />
                  {fbData.impressionsTimeline.length === 0
                    ? <div style={{ textAlign: "center", padding: "60px 0", color: "#cbd5e1", fontSize: 12 }}>No data yet</div>
                    : <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={fbData.impressionsTimeline.map(r => ({ date: fmtDate(r.date), value: r.value }))} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <defs><linearGradient id="gFbImp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1877f2" stopOpacity={0.2} /><stop offset="95%" stopColor="#1877f2" stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="value" name="Impressions" stroke="#1877f2" strokeWidth={2} fill="url(#gFbImp)" dot={{ fill: "#1877f2", r: 2 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  }
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                  style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", padding: "20px 24px" }}>
                  <SectionTitle title="Engaged Users" sub="Daily unique users who interacted" badge="REAL" badgeColor="#1877f2" />
                  <div style={{ marginTop: 16 }} />
                  {fbData.engagedUsersTimeline.length === 0
                    ? <div style={{ textAlign: "center", padding: "60px 0", color: "#cbd5e1", fontSize: 12 }}>No data yet</div>
                    : <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={fbData.engagedUsersTimeline.map(r => ({ date: fmtDate(r.date), value: r.value }))} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <defs><linearGradient id="gFbEng" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="value" name="Engaged Users" stroke="#10b981" strokeWidth={2} fill="url(#gFbEng)" dot={{ fill: "#10b981", r: 2 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  }
                </motion.div>
              </div>

              {/* Fan Adds */}
              {fbData.fanAddsTimeline.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
                  style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", padding: "20px 24px", marginBottom: 16 }}>
                  <SectionTitle title="New Fans per Day" sub="Daily page likes growth" badge="REAL" badgeColor="#1877f2" />
                  <div style={{ marginTop: 16 }} />
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={fbData.fanAddsTimeline.map(r => ({ date: fmtDate(r.date), fans: r.value }))} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={8}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="fans" name="New Fans" fill="#1877f2" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              )}

              {/* Recent posts */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", padding: "20px 24px" }}>
                <SectionTitle title="Recent Facebook Posts" sub="Latest published content" badge="REAL" badgeColor="#1877f2" />
                <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                  {fbData.recentPosts.length === 0
                    ? <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px 0", color: "#cbd5e1", fontSize: 12 }}>No posts found</div>
                    : fbData.recentPosts.map(p => (
                      <a key={p.id} href={p.permalinkUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                        <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #f0f0f0", background: "#f8fafc", transition: "box-shadow .15s" }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(24,119,242,0.15)"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}>
                          {p.fullPicture
                            ? <div style={{ position: "relative", paddingBottom: "60%" }}><img src={p.fullPicture} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /></div>
                            : <div style={{ height: 80, background: "#e8f0fd", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>📘</div>
                          }
                          <div style={{ padding: "10px 12px" }}>
                            <p style={{ margin: 0, fontSize: 11, color: "#475569", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                              {p.message || "No message"}
                            </p>
                            <div style={{ marginTop: 4, fontSize: 10, color: "#cbd5e1" }}>{fmtDate(p.createdTime)}</div>
                          </div>
                        </div>
                      </a>
                    ))
                  }
                </div>
              </motion.div>
            </>
          )}
        </>
      )}

      {/* ════════════════════════════════ TAB: CONTENT ══════════════════════ */}
      {activeTab === "content" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", padding: "20px 24px" }}>
              <SectionTitle title="Top Posts" sub="Highest estimated engagement" />
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                {topPosts.length === 0
                  ? <div style={{ textAlign: "center", padding: "30px 0", color: "#cbd5e1", fontSize: 12 }}>No published posts yet</div>
                  : topPosts.map((p, i) => {
                    const score    = engagementScore(p);
                    const maxScore = engagementScore(topPosts[0]);
                    const pct      = Math.round((score / maxScore) * 100);
                    return (
                      <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                          background: i === 0 ? "#fef3c7" : "#f1f5f9",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, fontWeight: 700, color: i === 0 ? "#d97706" : "#64748b" }}>{i + 1}</div>
                        <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, overflow: "hidden", background: "#f8fafc" }}>
                          {p.imageUrl ? <img src={p.imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>📝</div>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: "#374151", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {p.caption?.slice(0, 36) ?? p.topicName}
                          </div>
                          <div style={{ height: 4, borderRadius: 10, background: "#f1f5f9", overflow: "hidden", marginTop: 4 }}>
                            <div style={{ width: `${pct}%`, height: "100%", borderRadius: 10, background: "#e65787" }} />
                          </div>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#e65787", flexShrink: 0 }}>{score.toLocaleString()}</div>
                      </div>
                    );
                  })}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", padding: "20px 24px" }}>
              <SectionTitle title="Engagement Trend" sub="Estimated total reach per month" />
              <div style={{ marginTop: 16 }} />
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={monthlyTrend} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <defs><linearGradient id="lG" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#e65787" /><stop offset="100%" stopColor="#e65787" /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="engagement" name="Engagement" stroke="url(#lG)" strokeWidth={3}
                    dot={{ fill: "#e65787", r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: "#e65787" }} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Platform + FB + IG combined */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", padding: "20px 24px" }}>
              <SectionTitle title="Estimated Engagement by Platform" sub="Based on post volume and platform multipliers" />
              <div style={{ marginTop: 16 }} />
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={platformData.map(pl => ({
                  name: pl.name, engagement: Math.round(pl.count * (ENGAGEMENT_MULTIPLIERS[pl.id] ?? 1) * 142), color: pl.color,
                }))} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }} barSize={10}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} width={72} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="engagement" name="Engagement" radius={[0,4,4,0]}>
                    {platformData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* IG vs FB comparison */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", padding: "20px 24px" }}>
              <SectionTitle title="Instagram vs Facebook" sub="Key metrics comparison" />
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "Audience",    ig: igFollowers,       fb: fbData?.fans ?? 0,               igLabel: "Followers", fbLabel: "Fans" },
                  { label: "Content",     ig: igMediaCount,      fb: fbData?.recentPosts.length ?? 0, igLabel: "IG Posts",  fbLabel: "FB Posts" },
                  { label: "Impressions", ig: igTotalLikes * 10, fb: fbTotalImpressions,              igLabel: "IG Est.",   fbLabel: "FB Real" },
                  { label: "Engagement",  ig: igTotalLikes + igTotalComments, fb: fbTotalEngaged,     igLabel: "Likes+Cmts",fbLabel: "Eng. Users" },
                ].map(row => {
                  const total = row.ig + row.fb;
                  const igPct = total > 0 ? Math.round((row.ig / total) * 100) : 50;
                  const fbPct = 100 - igPct;
                  return (
                    <div key={row.label}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: "#64748b" }}>{row.label}</span>
                        <div style={{ display: "flex", gap: 8 }}>
                          <span style={{ fontSize: 10, color: "#e1306c", fontWeight: 600 }}>📸 {fmtNum(row.ig)}</span>
                          <span style={{ fontSize: 10, color: "#1877f2", fontWeight: 600 }}>📘 {fmtNum(row.fb)}</span>
                        </div>
                      </div>
                      <div style={{ height: 8, borderRadius: 10, background: "#f1f5f9", overflow: "hidden", display: "flex" }}>
                        <div style={{ width: `${igPct}%`, height: "100%", background: "#e1306c", borderRadius: "10px 0 0 10px" }} />
                        <div style={{ width: `${fbPct}%`, height: "100%", background: "#1877f2", borderRadius: "0 10px 10px 0" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </>
      )}

      {/* Footer */}
      <div style={{ marginTop: 20, padding: "10px 16px", borderRadius: 10, background: "#f0f9ff",
        border: "1px solid #bae6fd", fontSize: 11, color: "#0369a1", display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 8, background: "#e1306c", color: "#fff" }}>REAL</span>
        Instagram &amp; Facebook data is live from the API.
        <span style={{ color: "#94a3b8" }}>· Content engagement estimates are simulated.</span>
      </div>
    </div>
  );
}