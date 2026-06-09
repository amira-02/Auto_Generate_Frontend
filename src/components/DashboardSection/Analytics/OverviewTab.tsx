// Analytics/OverviewTab.tsx
import { useContext } from "react";
import {
  AreaChart, Area, BarChart, Bar, ComposedChart, Line, LineChart,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Cell, PieChart, Pie,
} from "recharts";

import { AuthContext } from "../../../hooks/AuthContext";
import { CustomTooltip } from "./AnalyticsComponents";
import { fmtNum, fmtDate } from "./analyticsHelpers";
import type { Post, InstagramSummary, FacebookSummary, LinkedInSummary, TikTokSummary } from "./analyticsTypes";
import Airecommendations from "./Airecommendations";

type Props = {
  posts: Post[];
  igData: InstagramSummary | null;
  fbData: FacebookSummary  | null;
  liData: LinkedInSummary  | null;
  ttData: TikTokSummary    | null;
};

const card: React.CSSProperties = {
  background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", padding: "20px",
};

// ── KPI tile ──────────────────────────────────────────────────────────────────
function KpiTile({ label, value, delta, sub }: {
  label: string; value: string | number; delta?: number; sub?: string;
}) {
  return (
    <div style={{ ...card, padding: "14px 16px" }}>
      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", letterSpacing: "-1px", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
        {delta !== undefined && (
          <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 20,
            background: delta >= 0 ? "#f0fdf4" : "#fef2f2",
            color: delta >= 0 ? "#16a34a" : "#dc2626" }}>
            {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}%
          </span>
        )}
        {sub && <span style={{ fontSize: 10, color: "#94a3b8" }}>{sub}</span>}
      </div>
    </div>
  );
}

// ── Chart card header ─────────────────────────────────────────────────────────
function ChartHead({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

// ── Legend dot ────────────────────────────────────────────────────────────────
function Dot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
      <span style={{ fontSize: 10, color: "#94a3b8" }}>{label}</span>
    </div>
  );
}

// ── Post activity calendar ────────────────────────────────────────────────────
function PostActivityCalendar({ posts }: { posts: Post[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const offset = firstDay.getDay();
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
    if (isToday) return { width: 32, height: 32, borderRadius: "50%", background: "#dc2626", color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 };
    if (count === 0) return { width: 32, height: 32, borderRadius: "50%", background: "#f1f5f9", color: "#94a3b8",
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 };
    const alpha = 0.3 + intensity * 0.7;
    return { width: 32, height: 32, borderRadius: "50%", background: `rgba(230,87,135,${alpha})`,
      color: intensity > 0.5 ? "#fff" : "#dc2626",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 12, fontWeight: 600, position: "relative" };
  };

  const monthName = now.toLocaleString("en-US", { month: "long", year: "numeric" });
  const thisMonthPosts = posts.filter(p => { const d = new Date(p.createdAt); return d.getMonth() === month; });
  const stats = [
    { label: "Created",   value: thisMonthPosts.length },
    { label: "Published", value: thisMonthPosts.filter(p => p.status?.toLowerCase() === "published").length },
    { label: "Scheduled", value: posts.filter(p => p.status?.toLowerCase() === "scheduled").length },
  ];

  return (
    <div style={{ ...card, height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Post Calendar</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{monthName}</div>
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
                <div style={{ position: "absolute", top: -2, right: -2, width: 12, height: 12,
                  borderRadius: "50%", background: "#10b981", border: "2px solid #fff",
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

// ── Insight card (Meta/TikTok style) ─────────────────────────────────────────
function InsightCard({ title, sub, value, delta, timeline, color, subMetrics }: {
  title: string; sub: string; value: string | number; delta?: number;
  timeline?: { date?: string; value: number }[];
  color: string;
  subMetrics?: { label: string; value: string | number }[];
}) {
  const sparkData = (timeline ?? []).map((d, i) => ({ i, v: d.value }));
  return (
    <div style={{ ...card, padding: "16px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{title}</div>
          <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{sub}</div>
        </div>
        {sparkData.length > 0 && (
          <ResponsiveContainer width={72} height={34}>
            <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
              <defs>
                <linearGradient id={`gic-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
                fill={`url(#gic-${title})`} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 8, margin: "10px 0 0" }}>
        <span style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", letterSpacing: "-1px", lineHeight: 1 }}>
          {value}
        </span>
        {delta !== undefined && (
          <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 6px", borderRadius: 20,
            background: delta >= 0 ? "#f0fdf4" : "#fef2f2",
            color: delta >= 0 ? "#16a34a" : "#dc2626" }}>
            {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}%
          </span>
        )}
      </div>

      {subMetrics && subMetrics.length > 0 && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #f0f0f5",
          display: "flex", flexDirection: "column", gap: 5 }}>
          {subMetrics.map(s => (
            <div key={s.label} style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 10, color: "#94a3b8" }}>{s.label}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>{s.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function OverviewTab({ posts, igData, fbData, liData, ttData }: Props) {
  const { token } = useContext(AuthContext);

  const now          = new Date();
  const thisMonth    = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth    = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const postsThisM = posts.filter(p => new Date(p.createdAt) >= thisMonth);
  const postsLastM = posts.filter(p => { const d = new Date(p.createdAt); return d >= lastMonth && d <= lastMonthEnd; });
  const published  = posts.filter(p => p.status?.toLowerCase() === "published");
  const scheduled  = posts.filter(p => p.status?.toLowerCase() === "scheduled");
  const inReview   = posts.filter(p => ["inreview", "approved"].includes(p.status?.toLowerCase() ?? ""));
  const drafts     = posts.filter(p => p.status?.toLowerCase() === "draft");
  const growthPct  = postsLastM.length > 0
    ? Math.round(((postsThisM.length - postsLastM.length) / postsLastM.length) * 100) : 0;

  // ── Audience bar chart data ───────────────────────────────────────────────
  const audienceData = [
    igData ? { platform: "Instagram", followers: igData.followers,     color: "#e1306c" } : null,
    fbData ? { platform: "Facebook",  followers: fbData.fans,          color: "#1877f2" } : null,
    liData ? { platform: "LinkedIn",  followers: liData.followers,     color: "#0077b5" } : null,
    ttData ? { platform: "TikTok",    followers: ttData.followers,     color: "#010101" } : null,
  ].filter(Boolean) as { platform: string; followers: number; color: string }[];

  // ── Monthly posts trend (last 6 months) ──────────────────────────────────
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const offset = 5 - i;
    const mStart = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const mEnd   = new Date(now.getFullYear(), now.getMonth() - offset + 1, 0);
    const label  = mStart.toLocaleString("en-US", { month: "short" });
    const mPosts = posts.filter(p => { const d = new Date(p.createdAt); return d >= mStart && d <= mEnd; });
    return {
      month:     label,
      total:     mPosts.length,
      published: mPosts.filter(p => p.status?.toLowerCase() === "published").length,
    };
  });

  // ── Cross-platform reach timeline ─────────────────────────────────────────
  // Always show last 15 days from today — fill missing days with 0
  const reachDays = Array.from({ length: 15 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (14 - i));
    return fmtDate(d.toISOString());
  });
  const reachMap = new Map<string, { date: string; ig: number; fb: number }>();
  reachDays.forEach(label => reachMap.set(label, { date: label, ig: 0, fb: 0 }));
  (igData?.reachTimeline ?? []).forEach(r => {
    const d = fmtDate(r.date);
    if (reachMap.has(d)) reachMap.get(d)!.ig = r.value;
  });
  (fbData?.impressionsTimeline ?? []).forEach(r => {
    const d = fmtDate(r.date);
    if (reachMap.has(d)) reachMap.get(d)!.fb = r.value;
  });
  const reachData  = reachDays.map(label => reachMap.get(label)!);
  const igTimeline = igData?.reachTimeline ?? [];
  const fbTimeline = fbData?.impressionsTimeline ?? [];
  const hasReach   = igTimeline.length > 0 || fbTimeline.length > 0;


  const topPosts = [...published]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Posts by day of week
  const dowCounts = [0, 0, 0, 0, 0, 0, 0];
  posts.forEach(p => { dowCounts[new Date(p.createdAt).getDay()]++; });
  const dowLabels = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const postsByDayOfWeek = dowLabels.map((day, i) => ({ day, posts: dowCounts[i] }));
  const bestDayIndex = dowCounts.indexOf(Math.max(...dowCounts));

  // Insight card delta helper
  const calcDelta = (tl: {date:string;value:number}[]) => {
    if (tl.length < 14) return undefined;
    const recent = tl.slice(-7).reduce((s,d) => s + d.value, 0);
    const prev   = tl.slice(-14,-7).reduce((s,d) => s + d.value, 0);
    if (prev === 0) return undefined;
    return Math.round((recent - prev) / prev * 100);
  };

  // Content health score
  const publishRate  = posts.length > 0 ? Math.round((published.length / posts.length) * 100) : 0;
  const captionRate  = posts.length > 0 ? Math.round((posts.filter(p => p.caption && p.caption.length > 20).length / posts.length) * 100) : 0;
  const imageRate    = posts.length > 0 ? Math.round((posts.filter(p => p.imageUrl).length / posts.length) * 100) : 0;
  const scheduleRate = posts.length > 0 ? Math.round(((scheduled.length + published.length) / posts.length) * 100) : 0;
  const healthMetrics = [
    { label: "Taux de publication", score: publishRate,  color: "#dc2626" },
    { label: "Posts avec caption",  score: captionRate,  color: "#0f172a" },
    { label: "Posts avec visuel",   score: imageRate,    color: "#10b981" },
    { label: "Posts planifiés",     score: scheduleRate, color: "#94a3b8" },
  ];
  const overallScore = Math.round(healthMetrics.reduce((s, h) => s + h.score, 0) / healthMetrics.length);

  // ── Peak hours — posts grouped by 4-hour blocks ───────────────────────────
  const hourCounts = Array(24).fill(0);
  posts.forEach(p => { hourCounts[new Date(p.createdAt).getHours()]++; });
  const peakHoursData = ["0-4h", "4-8h", "8-12h", "12-16h", "16-20h", "20-24h"].map((label, i) => ({
    hour:  label,
    posts: hourCounts.slice(i * 4, i * 4 + 4).reduce((s, c) => s + c, 0),
  }));
  const peakBlockIndex = peakHoursData.reduce((bi, b, i, arr) => b.posts > arr[bi].posts ? i : bi, 0);

  // ── Engagement rate per platform ──────────────────────────────────────────
  const engagementRates = [
    igData && igData.followers > 0 ? { platform: "Instagram", color: "#e1306c",
      rate: +((igData.totalLikes + igData.totalComments) / igData.followers * 100).toFixed(2) } : null,
    fbData && fbData.fans > 0      ? { platform: "Facebook",  color: "#1877f2",
      rate: +((fbData.totalEngagedUsers) / fbData.fans * 100).toFixed(2) } : null,
    liData && liData.followers > 0 ? { platform: "LinkedIn",  color: "#0077b5",
      rate: +((liData.totalReactions) / liData.followers * 100).toFixed(2) } : null,
    ttData && ttData.followers > 0 ? { platform: "TikTok",    color: "#010101",
      rate: +((ttData.totalLikes) / ttData.followers * 100).toFixed(2) } : null,
  ].filter(Boolean) as { platform: string; color: string; rate: number }[];

  // ── Total impressions per platform ────────────────────────────────────────
  const totalImpressionsData = [
    fbData ? { platform: "Facebook",  value: fbData.totalImpressions,  color: "#1877f2" } : null,
    liData ? { platform: "LinkedIn",  value: liData.totalImpressions,  color: "#0077b5" } : null,
    ttData ? { platform: "TikTok",    value: ttData.totalViews,        color: "#010101" } : null,
    igData ? { platform: "Instagram", value: igData.reachTimeline?.reduce((s, d) => s + d.value, 0) ?? 0, color: "#e1306c" } : null,
  ].filter(Boolean) as { platform: string; value: number; color: string }[];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── 1. KPIs ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <KpiTile label="Total Posts"  value={posts.length}     delta={growthPct} sub="vs mois dernier" />
        <KpiTile label="Publiés"      value={published.length}                   sub="tous les temps"  />
        <KpiTile label="Planifiés"    value={scheduled.length}                   sub="à venir"         />
        <KpiTile label="En révision"  value={inReview.length}                    sub="en attente"      />
      </div>

      {/* ── 2. Insight cards ────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <InsightCard
          title="Portée"
          sub="Comptes touchés"
          value={fmtNum(igData?.reachTimeline?.slice(-14).reduce((s,d) => s + d.value, 0) ?? 0)}
          delta={calcDelta(igData?.reachTimeline ?? [])}
          timeline={igData?.reachTimeline?.slice(-14) ?? []}
          color="#e1306c"
          subMetrics={[
            { label: "Total likes",    value: fmtNum(igData?.totalLikes    ?? 0) },
            { label: "Total comments", value: fmtNum(igData?.totalComments ?? 0) },
          ]}
        />
        <InsightCard
          title="Impressions"
          sub="Facebook · total vues"
          value={fmtNum(fbData?.totalImpressions ?? 0)}
          delta={calcDelta(fbData?.impressionsTimeline ?? [])}
          timeline={fbData?.impressionsTimeline?.slice(-14) ?? []}
          color="#1877f2"
          subMetrics={[
            { label: "Engagés", value: fmtNum(fbData?.totalEngagedUsers ?? 0) },
            { label: "Fans",    value: fmtNum(fbData?.fans              ?? 0) },
          ]}
        />
        <InsightCard
          title="Vues TikTok"
          sub="Vidéos · cumul"
          value={fmtNum(ttData?.totalViews ?? 0)}
          delta={calcDelta(ttData?.viewsTimeline ?? [])}
          timeline={ttData?.viewsTimeline?.slice(-14) ?? []}
          color="#69C9D0"
          subMetrics={[
            { label: "Likes",    value: fmtNum(ttData?.totalLikes  ?? 0) },
            { label: "Partages", value: fmtNum(ttData?.totalShares ?? 0) },
          ]}
        />
        <InsightCard
          title="Abonnés"
          sub="Instagram followers"
          value={fmtNum(igData?.followers ?? 0)}
          delta={calcDelta(igData?.followerTimeline ?? [])}
          timeline={igData?.followerTimeline?.slice(-14) ?? []}
          color="#10b981"
          subMetrics={[
            { label: "Posts",    value: igData?.mediaCount ?? 0 },
            { label: "Connecté", value: igData ? "✓" : "--"    },
          ]}
        />
      </div>

      {/* ── 3. Content trend + Audience + Posting by day ────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>

        <div style={{ ...card }}>
          <ChartHead
            title="Monthly Content Trend"
            sub="Posts created vs published — last 6 months"
            right={
              <div style={{ display: "flex", gap: 12 }}>
                <Dot color="#dc2626" label="Created" />
                <Dot color="#10b981" label="Published" />
              </div>
            }
          />
          <ResponsiveContainer width="100%" height={190}>
            <ComposedChart data={monthlyData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" name="Created" fill="#dc262615" stroke="#dc2626" strokeWidth={1} radius={[4, 4, 0, 0]} barSize={18} />
              <Line dataKey="published" name="Published" type="monotone" stroke="#10b981" strokeWidth={2}
                dot={{ fill: "#10b981", r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div style={{ ...card }}>
          <ChartHead
            title="Audience Overview"
            sub="Total followers per platform"
            right={<span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "#f0fdf4", color: "#16a34a", fontWeight: 600 }}>LIVE</span>}
          />
          {audienceData.length === 0
            ? <div style={{ textAlign: "center", padding: "50px 0", color: "#cbd5e1", fontSize: 12 }}>No platform connected</div>
            : <ResponsiveContainer width="100%" height={190}>
                <BarChart data={audienceData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                  <XAxis dataKey="platform" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtNum(v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="followers" name="Followers" radius={[6, 6, 0, 0]} minPointSize={4}>
                    {audienceData.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
          }
        </div>

        <div style={{ ...card }}>
          <ChartHead title="Posts par jour" sub="Activité de publication par jour de la semaine" />
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={postsByDayOfWeek} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gDow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#dc2626" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="posts" name="Posts" stroke="#dc2626" strokeWidth={2.5}
                dot={(props: any) => {
                  const best = props.index === bestDayIndex;
                  return <circle key={props.index} cx={props.cx} cy={props.cy} r={best ? 6 : 3}
                    fill={best ? "#dc2626" : "#fff"} stroke="#dc2626" strokeWidth={2} />;
                }}
                activeDot={{ r: 5, fill: "#dc2626" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 4. Cross-platform reach + Platform engagement + Top posts ─────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>

        {/* Cross-platform reach */}
        <div style={{ ...card }}>
          <ChartHead
            title="Cross-Platform Reach"
            sub="Instagram reach · Facebook impressions"
            right={
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {igTimeline.length > 0 && <Dot color="#e1306c" label="IG Reach" />}
                {fbTimeline.length > 0 && <Dot color="#1877f2" label="FB Impressions" />}
                <span title="Meta publie les stats avec 2-3 jours de délai"
                  style={{ fontSize: 10, color: "#94a3b8", background: "#f8f9fc",
                    border: "1px solid #ebebf0", borderRadius: 6,
                    padding: "2px 7px", cursor: "default" }}>
                  ⏱ délai Meta ~2j
                </span>
              </div>
            }
          />
          {!hasReach
            ? <div style={{ textAlign: "center", padding: "50px 0", color: "#cbd5e1", fontSize: 12 }}>
                Connect Instagram or Facebook to see reach data
              </div>
            : <ResponsiveContainer width="100%" height={190}>
                <AreaChart data={reachData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gOvIg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#e1306c" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#e1306c" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gOvFb" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#1877f2" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#1877f2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtNum(v)} />
                  <Tooltip content={<CustomTooltip />} />
                  {igTimeline.length > 0 && (
                    <Area type="monotone" dataKey="ig" name="IG Reach"
                      stroke="#e1306c" strokeWidth={2} fill="url(#gOvIg)" dot={false} activeDot={{ r: 4, fill: "#e1306c" }} />
                  )}
                  {fbTimeline.length > 0 && (
                    <Area type="monotone" dataKey="fb" name="FB Impressions"
                      stroke="#1877f2" strokeWidth={2} fill="url(#gOvFb)" dot={false} activeDot={{ r: 4, fill: "#1877f2" }} />
                  )}
                </AreaChart>
              </ResponsiveContainer>
          }
        </div>

        <div style={{ ...card }}>
          <ChartHead title="Engagement par plateforme" sub="Métriques clés des comptes connectés" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {igData && (
              <PlatformRow color="#e1306c" name="Instagram"
                metrics={[
                  { label: "Followers", value: fmtNum(igData.followers) },
                  { label: "Likes",     value: fmtNum(igData.totalLikes) },
                  { label: "Comments",  value: fmtNum(igData.totalComments) },
                ]} />
            )}
            {fbData && (
              <PlatformRow color="#1877f2" name="Facebook"
                metrics={[
                  { label: "Fans",        value: fmtNum(fbData.fans) },
                  { label: "Impressions", value: fmtNum(fbData.totalImpressions) },
                  { label: "Engagés",     value: fmtNum(fbData.totalEngagedUsers) },
                ]} />
            )}
            <PlatformRow color="#0077b5" name="LinkedIn"
              notConnected={!liData}
              metrics={[
                { label: "Followers",   value: liData ? fmtNum(liData.followers)        : "—" },
                { label: "Impressions", value: liData ? fmtNum(liData.totalImpressions) : "—" },
                { label: "Réactions",   value: liData ? fmtNum(liData.totalReactions)   : "—" },
              ]} />
            {ttData && (
              <PlatformRow color="#010101" name="TikTok"
                metrics={[
                  { label: "Followers", value: fmtNum(ttData.followers) },
                  { label: "Vues",      value: fmtNum(ttData.totalViews) },
                  { label: "Likes",     value: fmtNum(ttData.totalLikes) },
                ]} />
            )}
            {!igData && !fbData && !liData && !ttData && (
              <div style={{ textAlign: "center", padding: "30px 0", color: "#cbd5e1", fontSize: 12 }}>Aucune plateforme connectée</div>
            )}
          </div>
        </div>

        <div style={{ ...card }}>
          <ChartHead title="Top Posts" sub="Posts les plus récents publiés" />
          {topPosts.length === 0
            ? <div style={{ textAlign: "center", padding: "40px 0", color: "#cbd5e1", fontSize: 12 }}>Aucun post publié</div>
            : <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
                {topPosts.map((p, i) => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 10px", borderRadius: 10, background: "#f8fafc", border: "1px solid #f0f0f0" }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: i === 0 ? "#dc2626" : "#f1f5f9",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 700, color: i === 0 ? "#fff" : "#94a3b8", flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: "#374151", fontWeight: 500,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {p.caption?.slice(0, 35) ?? p.topicName ?? "Sans titre"}
                      </div>
                      <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>
                        {new Date(p.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                      </div>
                    </div>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", flexShrink: 0 }} />
                  </div>
                ))}
              </div>
          }
        </div>
      </div>

      {/* ── 5. Peak Hours + Engagement Rate + Total Impressions ─────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>

        {/* Peak Hours */}
        <div style={{ ...card }}>
          <ChartHead title="Heures de pointe" sub="Activité par tranche horaire" />
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={peakHoursData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="posts" name="Posts" radius={[6, 6, 0, 0]}>
                {peakHoursData.map((_, i) => (
                  <Cell key={i} fill={i === peakBlockIndex ? "#dc2626" : "#f1f5f9"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {peakHoursData[peakBlockIndex]?.posts > 0 && (
            <div style={{ textAlign: "center", marginTop: 6, fontSize: 11, color: "#64748b" }}>
              Pic : <span style={{ fontWeight: 700, color: "#dc2626" }}>{peakHoursData[peakBlockIndex].hour}</span>
            </div>
          )}
        </div>

        {/* Engagement Rate */}
        <div style={{ ...card }}>
          <ChartHead title="Taux d'engagement" sub="(Likes + Commentaires) / Abonnés" />
          {engagementRates.length === 0
            ? <div style={{ textAlign: "center", padding: "50px 0", color: "#cbd5e1", fontSize: 12 }}>Aucune plateforme connectée</div>
            : <ResponsiveContainer width="100%" height={190}>
                <BarChart data={engagementRates} margin={{ top: 4, right: 4, left: -10, bottom: 0 }} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                  <XAxis dataKey="platform" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={(v: any) => [`${v}%`, "Taux"]} />
                  <Bar dataKey="rate" name="Engagement" radius={[6, 6, 0, 0]}>
                    {engagementRates.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
          }
        </div>

        {/* Total Impressions */}
        <div style={{ ...card }}>
          <ChartHead title="Impressions totales" sub="Portée cumulée par plateforme" />
          {totalImpressionsData.length === 0
            ? <div style={{ textAlign: "center", padding: "50px 0", color: "#cbd5e1", fontSize: 12 }}>Aucune donnée disponible</div>
            : <ResponsiveContainer width="100%" height={190}>
                <BarChart data={totalImpressionsData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                  <XAxis dataKey="platform" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => fmtNum(v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Impressions" radius={[6, 6, 0, 0]}>
                    {totalImpressionsData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
          }
        </div>
      </div>

      {/* ── 6. Calendar + Santé du contenu + Pipeline ───────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, alignItems: "stretch" }}>
        <PostActivityCalendar posts={posts} />

        {/* Santé du contenu */}
        <div style={{ ...card, display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 20px 20px" }}>
          <ChartHead title="Santé du contenu" sub="Indicateurs clés de qualité" />
          <div style={{ position: "relative" }}>
            <PieChart width={220} height={220}>
              <Pie
                data={healthMetrics.map(h => ({ name: h.label, value: h.score, color: h.color }))}
                cx={110} cy={110}
                innerRadius={62} outerRadius={96}
                paddingAngle={4} dataKey="value"
                startAngle={90} endAngle={-270}
                strokeWidth={0}
                cornerRadius={8}
                label={({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
                  const RADIAN = Math.PI / 180;
                  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
                  const x = cx + r * Math.cos(-(midAngle ?? 0) * RADIAN);
                  const y = cy + r * Math.sin(-(midAngle ?? 0) * RADIAN);
                  return value > 6 ? (
                    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central"
                      fontSize={12} fontWeight={700}>{value}%</text>
                  ) : null;
                }}
                labelLine={false}>
                {healthMetrics.map((h, i) => (
                  <Cell key={i} fill={h.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any, n: any) => [`${v}%`, n]} />
            </PieChart>
            <div style={{ position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", letterSpacing: "-1px" }}>
                {overallScore}
              </div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>/100</div>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 16px", marginTop: 12 }}>
            {healthMetrics.map(h => (
              <div key={h.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: h.color }} />
                <span style={{ fontSize: 11, color: "#64748b" }}>{h.label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: h.color }}>{h.score}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendations */}
        <Airecommendations posts={posts} igData={igData} fbData={fbData} token={token} />
      </div>
    </div>
  );
}

// ── Platform icons (SVG) ──────────────────────────────────────────────────────
const PlatformIcon = {
  Instagram: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
      <defs>
        <radialGradient id="ig1" cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497"/>
          <stop offset="10%" stopColor="#fdf497"/>
          <stop offset="50%" stopColor="#fd5949"/>
          <stop offset="68%" stopColor="#d6249f"/>
          <stop offset="100%" stopColor="#285AEB"/>
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig1)"/>
      <circle cx="12" cy="12" r="4.5" stroke="#fff" strokeWidth="1.8" fill="none"/>
      <circle cx="17.5" cy="6.5" r="1.2" fill="#fff"/>
    </svg>
  ),
  Facebook: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
      <rect x="2" y="2" width="20" height="20" rx="6" fill="#1877f2"/>
      <path d="M13.5 21v-7.5h2.5l.5-3H13.5V9c0-.83.42-1.5 1.5-1.5h1.5V5s-1-.1-2-.1c-2.5 0-4 1.5-4 4v1.5H8v3h2.5V21h3z" fill="#fff"/>
    </svg>
  ),
  LinkedIn: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
      <rect x="2" y="2" width="20" height="20" rx="6" fill="#0077b5"/>
      <path d="M7 10h2v7H7v-7zm1-3a1.1 1.1 0 110 2.2A1.1 1.1 0 018 7zm4 3h2v1h.03C14.4 10.4 15.2 10 16 10c2 0 3 1.3 3 3.5V17h-2v-3.3c0-.8-.3-1.7-1.3-1.7-1.1 0-1.7.8-1.7 1.7V17h-2v-7z" fill="#fff"/>
    </svg>
  ),
  TikTok: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
      <rect x="2" y="2" width="20" height="20" rx="6" fill="#010101"/>
      <path d="M17 8.5a3.5 3.5 0 01-3.5-3.5h-2v9.5a1.5 1.5 0 11-2-1.4V11a4 4 0 105.5 3.7V11a6 6 0 003.5 1.1V9.9A3.5 3.5 0 0117 8.5z" fill="white"/>
      <path d="M17 8.5a3.5 3.5 0 01-2-.6v.1a3.5 3.5 0 002 .5z" fill="#69C9D0"/>
      <path d="M13.5 5a3.5 3.5 0 003.5 3.5v-1a2.5 2.5 0 01-2.5-2.5h-1z" fill="#EE1D52"/>
    </svg>
  ),
};

// ── Platform card (pretty) ────────────────────────────────────────────────────
function PlatformRow({ color, name, metrics, notConnected }: {
  color: string; name: keyof typeof PlatformIcon;
  metrics: { label: string; value: string }[];
  notConnected?: boolean;
}) {
  const Icon = PlatformIcon[name];
  return (
    <div style={{ borderRadius: 16, border: `1.5px solid ${notConnected ? "#f0f0f5" : "#f0f0f5"}`,
      overflow: "hidden", background: notConnected ? "#fafafa" : "#fff",
      opacity: notConnected ? 0.7 : 1, transition: "box-shadow .15s" }}>
      {/* header strip */}
      <div style={{ background: notConnected ? "#f4f5f7" : color + "0f", padding: "12px 14px",
        display: "flex", alignItems: "center", gap: 10,
        borderBottom: `1.5px solid ${notConnected ? "#ebebf0" : color + "18"}` }}>
        <Icon />
        <span style={{ fontSize: 13, fontWeight: 400, color: notConnected ? "#94a3b8" : "#0f172a" }}>{name}</span>
        {notConnected ? (
          <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, padding: "2px 8px",
            borderRadius: 20, background: "#f1f5f9", color: "#94a3b8",
            textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Non connecté
          </span>
        ) : (
          <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%",
            background: "#10b981", boxShadow: "0 0 0 3px #dcfce7" }} />
        )}
      </div>
      {/* metrics */}
      <div style={{ display: "flex", padding: "12px 14px", gap: 0 }}>
        {metrics.map((m, i) => (
          <div key={m.label} style={{ flex: 1, textAlign: "center",
            borderLeft: i > 0 ? "1px solid #f0f0f5" : "none" }}>
            <div style={{ fontSize: 15, fontWeight: 400, color: notConnected ? "#cbd5e1" : "#0f172a" }}>{m.value}</div>
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
