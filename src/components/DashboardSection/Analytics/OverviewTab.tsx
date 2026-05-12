// Analytics/OverviewTab.tsx
import { useState, useContext } from "react";
import { AuthContext } from "../../../hooks/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { CustomTooltip } from "./AnalyticsComponents";
import {
  fmtNum, PLATFORM_META, STATUS_COLOR,
  normalizePlatforms, getMonthLabel,
} from "./analyticsHelpers";
import type { Post, InstagramSummary, FacebookSummary, LinkedInSummary, TikTokSummary } from "./analyticsTypes";
import { PlatformIcon } from "./SocialIcons";
import Airecommendations from "./Airecommendations";

type Props = {
  posts: Post[];
  igData: InstagramSummary | null;
  fbData: FacebookSummary  | null;
  liData: LinkedInSummary  | null;
  ttData: TikTokSummary    | null;
};

const card: React.CSSProperties = {
  background: "#fff",
  borderRadius: 16,
  border: "1px solid #f0f0f0",
  padding: "20px",
};

// ── Section label shown before each group ──────────────────────────────────────
function SectionLabel({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, marginBottom: 2 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9, background: "#fff1f3",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 15, flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{title}</div>
        <div style={{ fontSize: 11, color: "#94a3b8" }}>{sub}</div>
      </div>
    </div>
  );
}

// ── KPI tile ───────────────────────────────────────────────────────────────────
function KpiTile({ label, value, delta, sub, accent }: {
  label: string; value: string | number; delta?: number; sub?: string; accent: string;
}) {
  return (
    <div style={{ ...card, position: "relative", overflow: "hidden" }}>
      <div style={{
        position: "absolute", top: -28, right: -28,
        width: 80, height: 80, borderRadius: "50%",
        background: accent + "14", pointerEvents: "none",
      }} />
      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", letterSpacing: "-1.5px", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
        {delta !== undefined && (
          <span style={{
            fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 20,
            background: delta >= 0 ? "#f0fdf4" : "#fef2f2",
            color: delta >= 0 ? "#16a34a" : "#dc2626",
          }}>
            {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}%
          </span>
        )}
        {sub && <span style={{ fontSize: 11, color: "#94a3b8" }}>{sub}</span>}
      </div>
    </div>
  );
}

function StatMini({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 12px" }}>
      <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.5px" }}>{value}</div>
      <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{label}</div>
    </div>
  );
}

// ── Platform card with real-data mini chart ────────────────────────────────────
function PlatformCard({ color, platformKey, name, sub, badge, stats, chartData, chartLabel, profilePicture }: {
  color: string; platformKey: string; name: string; sub: string; badge: string;
  stats: { label: string; value: string | number }[];
  chartData: { i: number; v: number }[];
  chartLabel: string;
  profilePicture?: string;
}) {
  const gradId = `g_${platformKey}`;
  return (
    <div style={{ ...card, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: "16px 16px 0 0" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ position: "relative", width: 36, height: 36, flexShrink: 0 }}>
          {profilePicture
            ? <img src={profilePicture} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: `2px solid ${color}30` }} />
            : <div style={{ width: 36, height: 36, borderRadius: 10, overflow: "hidden" }}>
                <PlatformIcon platform={platformKey} size={36} />
              </div>
          }
          {profilePicture && (
            <div style={{ position: "absolute", bottom: -2, right: -2, width: 16, height: 16, borderRadius: 5, overflow: "hidden", border: "1.5px solid #fff" }}>
              <PlatformIcon platform={platformKey} size={16} />
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
          <div style={{ fontSize: 10, color: "#94a3b8" }}>{sub}</div>
        </div>
        <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 10,
          background: color + "15", color, flexShrink: 0 }}>{badge}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        {stats.map(s => <StatMini key={s.label} label={s.label} value={s.value} />)}
      </div>
      <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 4 }}>{chartLabel}</div>
      <ResponsiveContainer width="100%" height={50}>
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#${gradId})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Post activity calendar (current month heat-map) ────────────────────────────
function PostActivityCalendar({ posts }: { posts: Post[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const offset = firstDay.getDay(); // Sun=0
  const days = Array.from({ length: lastDay.getDate() }, (_, i) => i + 1);

  const postsByDay: Record<number, number> = {};
  posts.forEach((p) => {
    const d = new Date(p.createdAt);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      postsByDay[day] = (postsByDay[day] || 0) + 1;
    }
  });

  const maxCount = Math.max(...Object.values(postsByDay), 1);
  const today = now.getDate();

  const getCircleStyle = (day: number): React.CSSProperties => {
    const count = postsByDay[day] || 0;
    const intensity = count / maxCount;
    const isToday = day === today;
    if (isToday) return {
      width: 32, height: 32, borderRadius: "50%", background: "#e65787", color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700,
    };
    if (count === 0) return {
      width: 32, height: 32, borderRadius: "50%", background: "#f1f5f9", color: "#94a3b8",
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12,
    };
    const alpha = 0.3 + intensity * 0.7;
    return {
      width: 32, height: 32, borderRadius: "50%",
      background: `rgba(230,87,135,${alpha})`,
      color: intensity > 0.5 ? "#fff" : "#d94470",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 12, fontWeight: 600, position: "relative",
    };
  };

  const monthName = now.toLocaleString("en-US", { month: "long", year: "numeric" });
  const thisMonthPosts = posts.filter(p => { const d = new Date(p.createdAt); return d.getMonth() === month; });
  const stats = [
    { label: "Created", value: thisMonthPosts.length },
    { label: "Published", value: thisMonthPosts.filter(p => p.status?.toLowerCase() === "published").length },
    { label: "Scheduled", value: posts.filter(p => p.status?.toLowerCase() === "scheduled").length },
  ];

  return (
    <div style={{ ...card, height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Post Calendar</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{monthName} — days with a dot had posts published</div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", letterSpacing: "-1px" }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {Array(offset).fill(null).map((_, i) => <div key={`e${i}`} />)}
        {days.map((day) => (
          <div key={day} style={{ display: "flex", justifyContent: "center" }}>
            <div style={getCircleStyle(day)}>
              {day}
              {(postsByDay[day] || 0) > 0 && day !== today && (
                <div style={{
                  position: "absolute", top: -2, right: -2,
                  width: 12, height: 12, borderRadius: "50%",
                  background: "#10b981", border: "2px solid #fff",
                  fontSize: 7, color: "#fff", fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>{postsByDay[day]}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const COMPARE_METRICS = {
  audience:   { label: "Audience",   igKey: "followers", fbKey: "fans"        },
  engagement: { label: "Engagement", igKey: "likes",     fbKey: "engaged"     },
  reach:      { label: "Reach",      igKey: "reach",     fbKey: "impressions" },
} as const;

// ── Main ──────────────────────────────────────────────────────────────────────
export default function OverviewTab({ posts, igData, fbData, liData, ttData }: Props) {
  const { token } = useContext(AuthContext);
  const [cMetric, setCMetric] = useState<keyof typeof COMPARE_METRICS>("audience");

  const now       = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const postsThisM = posts.filter(p => new Date(p.createdAt) >= thisMonth);
  const postsLastM = posts.filter(p => { const d = new Date(p.createdAt); return d >= lastMonth && d <= lastMonthEnd; });
  const published  = posts.filter(p => p.status?.toLowerCase() === "published");
  const scheduled  = posts.filter(p => p.status?.toLowerCase() === "scheduled");
  const inReview   = posts.filter(p => ["inreview", "approved"].includes(p.status?.toLowerCase() ?? ""));
  const growthPct  = postsLastM.length > 0
    ? Math.round(((postsThisM.length - postsLastM.length) / postsLastM.length) * 100) : 0;

  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const off  = 5 - i;
    const ms   = new Date(now.getFullYear(), now.getMonth() - off, 1);
    const me   = new Date(now.getFullYear(), now.getMonth() - off + 1, 0);
    const mp   = posts.filter(p => { const d = new Date(p.createdAt); return d >= ms && d <= me; });
    const mpub = mp.filter(p => p.status?.toLowerCase() === "published");
    return { month: getMonthLabel(off), total: mp.length, published: mpub.length };
  });

  const platCounts = posts.reduce<Record<string, number>>((acc, p) => {
    normalizePlatforms(p.platforms).forEach(pl => { acc[pl] = (acc[pl] ?? 0) + 1; });
    return acc;
  }, {});
  const platData = Object.entries(platCounts)
    .map(([id, count]) => ({ id, count, color: PLATFORM_META[id]?.color ?? "#94a3b8", label: PLATFORM_META[id]?.label ?? id }))
    .sort((a, b) => b.count - a.count);

  const statusMap  = posts.reduce<Record<string, number>>((acc, p) => {
    const s = p.status?.toLowerCase() ?? "draft"; acc[s] = (acc[s] ?? 0) + 1; return acc;
  }, {});
  const statusData = Object.entries(statusMap).map(([s, v]) => ({
    name: s === "inreview" ? "In Review" : s.charAt(0).toUpperCase() + s.slice(1),
    value: v, color: STATUS_COLOR[s] ?? "#94a3b8",
  }));

  // Platform metrics
  const igFollowers = igData?.followers     ?? 0;
  const igLikes     = igData?.totalLikes    ?? 0;
  const igComments  = igData?.totalComments ?? 0;
  const igPosts     = igData?.mediaCount    ?? 0;
  const igEngRate   = igPosts > 0 && igFollowers > 0
    ? ((igLikes + igComments) / igPosts / igFollowers * 100).toFixed(2) : "0.00";
  const igReach     = (igData?.reachTimeline ?? []).slice(-14).map((r, i) => ({ i, v: r.value }));

  const fbFans      = fbData?.fans ?? 0;
  const fbFollowers = fbData?.followers ?? 0;
  const fbImp       = fbData?.impressionsTimeline.reduce((s, r) => s + r.value, 0) ?? 0;
  const fbEngaged   = fbData?.engagedUsersTimeline.reduce((s, r) => s + r.value, 0) ?? 0;
  const fbEngRate   = fbFans > 0 ? ((fbEngaged / 30 / fbFans) * 100).toFixed(2) : "0.00";
  const fbImpChart  = (fbData?.impressionsTimeline ?? []).slice(-14).map((r, i) => ({ i, v: r.value }));

  const liFollowers = liData?.followers ?? 0;
  const liImp       = liData?.totalImpressions ?? 0;
  const liReactions = liData?.totalReactions   ?? 0;
  const liEngRate   = liImp > 0 ? ((liReactions / liImp) * 100).toFixed(2) : "0.00";
  const liChart     = (liData?.impressionsTimeline ?? []).slice(-14).map((r, i) => ({ i, v: r.value }));

  const ttFollowers = ttData?.followers  ?? 0;
  const ttViews     = ttData?.totalViews ?? 0;
  const ttLikes     = ttData?.totalLikes ?? 0;
  const ttEngRate   = ttViews > 0 ? (((ttLikes + (ttData?.totalComments ?? 0)) / ttViews) * 100).toFixed(2) : "0.00";
  const ttChart     = (ttData?.viewsTimeline ?? []).slice(-14).map((r, i) => ({ i, v: r.value }));

  // Compare widget
  const cData = {
    audience:   { ig: igFollowers,         fb: fbFans,    igLabel: fmtNum(igFollowers),         fbLabel: fmtNum(fbFans)    },
    engagement: { ig: igLikes + igComments, fb: fbEngaged, igLabel: fmtNum(igLikes + igComments), fbLabel: fmtNum(fbEngaged) },
    reach:      { ig: igLikes * 10,         fb: fbImp,     igLabel: fmtNum(igLikes * 10),         fbLabel: fmtNum(fbImp)     },
  };
  const c      = cData[cMetric];
  const cTotal = c.ig + c.fb;
  const igPct  = cTotal > 0 ? Math.round((c.ig / cTotal) * 100) : 50;
  const fbPct  = 100 - igPct;

  const recentPosts = [...published]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const connectedPlatforms = [igData, fbData, liData, ttData].filter(Boolean).length;
  const platformGridCols = connectedPlatforms <= 2
    ? `repeat(${connectedPlatforms}, 1fr) 1.7fr`
    : connectedPlatforms === 3
      ? "1fr 1fr 1fr 1.5fr"
      : "1fr 1fr 1fr 1fr";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* ── Section 1: Activity summary KPIs ──────────────────────────────── */}
      {/* <SectionLabel
        icon="📊"
        title="Activity Summary"
        sub="How many posts you created, published, or have waiting — compared to last month"
      /> */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        <KpiTile label="Total posts"  value={posts.length}     delta={growthPct} sub="vs last month" accent="#e65787" />
        <KpiTile label="Published"    value={published.length} delta={8}         sub="vs last month" accent="#10b981" />
        <KpiTile label="Scheduled"    value={scheduled.length} sub="waiting to go live"              accent="#e65787" />
        <KpiTile label="In review"    value={inReview.length}  sub="awaiting approval"               accent="#f59e0b" />
      </div>

      {/* ── Section 2: Connected platforms with live data ─────────────────── */}
      

      {/* ── Section 3: Calendar + Post status breakdown ───────────────────── */}
     
      <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 430px) 1fr", gap: 12, alignItems: "start" }}>
        <PostActivityCalendar posts={posts} />

        {/* Status donut */}
       
      </div>

  

      {/* ── Section 5: Recently published posts ──────────────────────────── */}
      {recentPosts.length > 0 && (
       
          <div style={{ ...card }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
  {recentPosts.slice(0, 5).map(p => (
    <div
      key={p.id}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 12,
        background: "#f8fafc",
        border: "1px solid #f0f0f0"
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          flexShrink: 0,
          overflow: "hidden",
          background: "#e2e8f0"
        }}
      >
        {p.imageUrl ? (
          <img
            src={p.imageUrl}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover"
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16
            }}
          >
            📝
          </div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "#374151",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}
        >
          {p.caption?.slice(0, 32) ?? p.topicName ?? "Untitled"}
        </div>

        <div
          style={{
            fontSize: 10,
            color: "#94a3b8",
            marginTop: 2
          }}
        >
          {new Date(p.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric"
          })}
        </div>
      </div>

      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#10b981",
          flexShrink: 0,
          display: "block"
        }}
      />
    </div>
  ))}
</div>
          </div>
        
      )}

      {/* ── Section 6: AI recommendations ────────────────────────────────── */}
      {/* <SectionLabel
        icon="🤖"
        title="AI Insights"
        sub="Smart suggestions generated from your posting habits and platform engagement"
      /> */}
      <Airecommendations posts={posts} igData={igData} fbData={fbData} token={token} />

    </div>
  );
}
