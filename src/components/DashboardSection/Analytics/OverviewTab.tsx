// Analytics/OverviewTab.tsx
import { useContext } from "react";
import {
  AreaChart, Area, BarChart, Bar, ComposedChart, Line, LineChart,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Cell, PieChart, Pie, RadialBarChart, RadialBar,
} from "recharts";

const PASTEL_COLORS = ["#c4b5fd", "#fde68a", "#fca5a5", "#86efac"];
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
function KpiTile({ label, value, delta, sub, accent }: {
  label: string; value: string | number; delta?: number; sub?: string; accent: string;
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
    ttData ? { platform: "TikTok",    followers: ttData.followers,     color: "#69C9D0" } : null,
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
  const igTimeline = (igData?.reachTimeline ?? []).slice(-21);
  const fbTimeline = (fbData?.impressionsTimeline ?? []).slice(-21);
  const reachMap = new Map<string, { date: string; ig: number; fb: number }>();
  igTimeline.forEach(r => { const d = fmtDate(r.date); reachMap.set(d, { date: d, ig: r.value, fb: 0 }); });
  fbTimeline.forEach(r => {
    const d = fmtDate(r.date);
    const e = reachMap.get(d);
    if (e) e.fb = r.value; else reachMap.set(d, { date: d, ig: 0, fb: r.value });
  });
  const reachData = [...reachMap.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14);
  const hasReach = igTimeline.length > 0 || fbTimeline.length > 0;


  const recentPosts = [...published]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const topPosts = [...published]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Posts by day of week
  const dowCounts = [0, 0, 0, 0, 0, 0, 0];
  posts.forEach(p => { dowCounts[new Date(p.createdAt).getDay()]++; });
  const dowLabels = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const postsByDayOfWeek = dowLabels.map((day, i) => ({ day, posts: dowCounts[i] }));
  const bestDayIndex = dowCounts.indexOf(Math.max(...dowCounts));

  // Posts by hour of day
  const hourCounts = Array(24).fill(0);
  posts.forEach(p => { hourCounts[new Date(p.createdAt).getHours()]++; });
  const postsByHour = Array.from({ length: 8 }, (_, i) => {
    const from = i * 3;
    const to   = from + 2;
    return { hour: `${String(from).padStart(2,"0")}h`, posts: hourCounts.slice(from, to + 1).reduce((a, b) => a + b, 0) };
  });
  const bestHourIndex = postsByHour.indexOf(postsByHour.reduce((a, b) => b.posts > a.posts ? b : a));

  // Content health score
  const publishRate  = posts.length > 0 ? Math.round((published.length / posts.length) * 100) : 0;
  const captionRate  = posts.length > 0 ? Math.round((posts.filter(p => p.caption && p.caption.length > 20).length / posts.length) * 100) : 0;
  const imageRate    = posts.length > 0 ? Math.round((posts.filter(p => p.imageUrl).length / posts.length) * 100) : 0;
  const scheduleRate = posts.length > 0 ? Math.round(((scheduled.length + published.length) / posts.length) * 100) : 0;
  const healthMetrics = [
    { label: "📢 Taux de publication", score: publishRate  },
    { label: "✍️ Posts avec caption",   score: captionRate  },
    { label: "🖼️ Posts avec visuel",    score: imageRate    },
    { label: "📅 Posts planifiés",      score: scheduleRate },
  ];
  const overallScore = Math.round(healthMetrics.reduce((s, h) => s + h.score, 0) / healthMetrics.length);

  // Engagement rates per platform
  const engagementRates = [
    igData && igData.followers > 0
      ? { platform: "Instagram", color: "#e1306c", rate: +((igData.totalLikes + igData.totalComments) / igData.followers * 100).toFixed(2) }
      : null,
    fbData && fbData.fans > 0
      ? { platform: "Facebook",  color: "#1877f2", rate: +((fbData.totalEngagedUsers) / fbData.fans * 100).toFixed(2) }
      : null,
    liData && liData.followers > 0
      ? { platform: "LinkedIn",  color: "#0077b5", rate: +((liData.totalReactions) / liData.followers * 100).toFixed(2) }
      : null,
    ttData && ttData.followers > 0
      ? { platform: "TikTok",   color: "#69C9D0", rate: +((ttData.totalLikes) / ttData.followers * 100).toFixed(2) }
      : null,
  ].filter(Boolean) as { platform: string; color: string; rate: number }[];

  // Total interactions by type (mapped to actual fields from each type)
  const totalInteractions = [
    { label: "❤️ Likes",        value: (igData?.totalLikes ?? 0) + (ttData?.totalLikes ?? 0) + (liData?.totalReactions ?? 0), color: "#e1306c" },
    { label: "💬 Commentaires",  value: (igData?.totalComments ?? 0) + (ttData?.totalComments ?? 0),                           color: "#f59e0b" },
    { label: "👁️ Impressions",   value: (fbData?.totalImpressions ?? 0) + (liData?.totalImpressions ?? 0),                    color: "#3b82f6" },
    { label: "🔗 Engagés FB",    value: fbData?.totalEngagedUsers ?? 0,                                                        color: "#1877f2" },
    { label: "▶️ Vues TikTok",   value: ttData?.totalViews ?? 0,                                                               color: "#ff0050" },
  ].filter(e => e.value > 0);

  // Pipeline
  const pipelineData = [
    { label: "Brouillon",    icon: "📝", count: drafts.length,     color: "#94a3b8" },
    { label: "En révision",  icon: "🔍", count: inReview.length,   color: "#f59e0b" },
    { label: "Planifié",     icon: "📅", count: scheduled.length,  color: "#dc2626" },
    { label: "Publié",       icon: "✅", count: published.length,  color: "#10b981" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── 1. KPIs ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <KpiTile label="Total Posts"  value={posts.length}     delta={growthPct} sub="vs mois dernier" accent="#dc2626" />
        <KpiTile label="Publiés"      value={published.length}                   sub="tous les temps"  accent="#10b981" />
        <KpiTile label="Planifiés"    value={scheduled.length}                   sub="à venir"         accent="#6366f1" />
        <KpiTile label="En révision"  value={inReview.length}                    sub="en attente"      accent="#f59e0b" />
      </div>

      {/* ── 2. Content trend + Audience + Posting by day ────────────────────── */}
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

      {/* ── 3. Cross-platform reach + Engagement rate + Total interactions ───── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 14 }}>

        {/* Cross-platform reach */}
        <div style={{ ...card }}>
          <ChartHead
            title="Cross-Platform Reach"
            sub="Instagram reach · Facebook impressions — last 14 days"
            right={
              <div style={{ display: "flex", gap: 12 }}>
                {igTimeline.length > 0 && <Dot color="#e1306c" label="IG Reach" />}
                {fbTimeline.length > 0 && <Dot color="#1877f2" label="FB Impressions" />}
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

        {/* Interactions totales — Radial Bar chart */}
        <div style={{ ...card }}>
          <ChartHead title="Interactions totales" sub="Cumul toutes plateformes" />
          {totalInteractions.length === 0
            ? <div style={{ textAlign: "center", padding: "50px 0", color: "#cbd5e1", fontSize: 12 }}>Aucune donnée</div>
            : <>
                <ResponsiveContainer width="100%" height={160}>
                  <RadialBarChart
                    cx="50%" cy="50%"
                    innerRadius={18} outerRadius={74}
                    barSize={13}
                    data={totalInteractions.map(e => ({ ...e, value: e.value, fill: e.color }))}
                    startAngle={90} endAngle={-270}>
                    <RadialBar dataKey="value" cornerRadius={6} background={{ fill: "#f1f5f9" }} />
                    <Tooltip formatter={(v: any, _: any, p: any) => [fmtNum(p.payload.value), p.payload.label]} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", justifyContent: "center", marginTop: 2 }}>
                  {totalInteractions.map(e => (
                    <div key={e.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: e.color }} />
                      <span style={{ fontSize: 10, color: "#64748b" }}>{e.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#0f172a" }}>{fmtNum(e.value)}</span>
                    </div>
                  ))}
                </div>
              </>
          }
        </div>

        {/* Taux d'engagement — Bar chart */}
        <div style={{ ...card }}>
          <ChartHead title="Taux d'engagement" sub="(Likes + Commentaires) / Abonnés" />
          {engagementRates.length === 0
            ? <div style={{ textAlign: "center", padding: "50px 0", color: "#cbd5e1", fontSize: 12 }}>Aucune plateforme connectée</div>
            : <ResponsiveContainer width="100%" height={190}>
                <BarChart data={engagementRates} margin={{ top: 4, right: 4, left: -10, bottom: 0 }} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                  <XAxis dataKey="platform" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                    tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={(v: any) => [`${v}%`, "Taux"]} />
                  <Bar dataKey="rate" name="Engagement" radius={[6, 6, 0, 0]}>
                    {engagementRates.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
          }
        </div>
      </div>

      {/* ── 4. Platform engagement + Top posts ──────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

        <div style={{ ...card }}>
          <ChartHead title="Engagement par plateforme" sub="Métriques clés des comptes connectés" />
          <div style={{ display: "grid", gridTemplateColumns: igData && fbData ? "1fr 1fr" : "1fr", gap: 10 }}>
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
            {liData && (
              <PlatformRow color="#0077b5" name="LinkedIn"
                metrics={[
                  { label: "Followers",   value: fmtNum(liData.followers) },
                  { label: "Impressions", value: fmtNum(liData.totalImpressions) },
                  { label: "Réactions",   value: fmtNum(liData.totalReactions) },
                ]} />
            )}
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
        {/* Top 5 posts by caption length as proxy for effort — replace with real engagement when available */}
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

      {/* ── 5. Calendar + Recent posts + Pipeline ───────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, alignItems: "start" }}>
        <PostActivityCalendar posts={posts} />

        {recentPosts.length > 0 ? (
          <div style={{ ...card }}>
            <ChartHead title="Recent Posts" sub="Latest published content" />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentPosts.map(p => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 12px", borderRadius: 12, background: "#f8fafc", border: "1px solid #f0f0f0" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    overflow: "hidden", background: "#e2e8f0" }}>
                    {p.imageUrl
                      ? <img src={p.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: "100%", background: "#f1f5f9", borderRadius: 10 }} />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "#374151",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p.caption?.slice(0, 40) ?? p.topicName ?? "Untitled"}
                    </div>
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                      {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  </div>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ ...card, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center", color: "#cbd5e1", fontSize: 12 }}>No published posts yet</div>
          </div>
        )}

        {/* Publishing pipeline — Pie chart */}
        <div style={{ ...card }}>
          <ChartHead title="Pipeline de publication" sub="Répartition des statuts" />
          {posts.length === 0
            ? <div style={{ textAlign: "center", padding: "40px 0", color: "#cbd5e1", fontSize: 12 }}>Aucun post</div>
            : <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pipelineData.filter(s => s.count > 0)} dataKey="count" nameKey="label"
                      cx="50%" cy="50%" innerRadius={42} outerRadius={70}
                      paddingAngle={3} strokeWidth={0}>
                      {pipelineData.filter(s => s.count > 0).map((_, i) => (
                        <Cell key={i} fill={PASTEL_COLORS[i % PASTEL_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [`${v} posts`, n]} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", justifyContent: "center", marginTop: 4 }}>
                  {pipelineData.filter(s => s.count > 0).map((s, i) => (
                    <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: PASTEL_COLORS[i % PASTEL_COLORS.length], flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: "#374151" }}>{s.icon} {s.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#0f172a" }}>{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
          }
        </div>
      </div>

      {/* ── 6. Follower growth + Best hour + Content health ─────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 14 }}>

        {/* Follower growth (IG timeline) */}
        <div style={{ ...card }}>
          <ChartHead
            title="Croissance des abonnés"
            sub="Instagram — évolution des followers"
            right={igData ? <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "#fce7f3", color: "#e1306c", fontWeight: 600 }}>IG</span> : undefined}
          />
          {!igData || igData.followerTimeline.length === 0
            ? <div style={{ textAlign: "center", padding: "50px 0", color: "#cbd5e1", fontSize: 12 }}>Connecte Instagram pour voir la croissance</div>
            : <ResponsiveContainer width="100%" height={190}>
                <AreaChart data={igData.followerTimeline.slice(-21).map(d => ({ date: fmtDate(d.date), value: d.value }))}
                  margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gFollowers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#e1306c" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#e1306c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} interval={6} />
                  <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => fmtNum(v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" name="Abonnés"
                    stroke="#e1306c" strokeWidth={2.5} fill="url(#gFollowers)"
                    dot={false} activeDot={{ r: 4, fill: "#e1306c" }} />
                </AreaChart>
              </ResponsiveContainer>
          }
        </div>

        {/* Best hour to post */}
        <div style={{ ...card }}>
          <ChartHead title="Meilleure heure" sub="Activité de publication par tranche horaire" />
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={postsByHour} margin={{ top: 4, right: 4, left: -14, bottom: 0 }} barSize={10}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="posts" name="Posts" radius={[4, 4, 0, 0]}>
                {postsByHour.map((_, i) => (
                  <Cell key={i} fill={i === bestHourIndex ? "#dc2626" : "#f1a1b0"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {bestHourIndex >= 0 && (
            <div style={{ textAlign: "center", fontSize: 11, color: "#64748b", marginTop: 6 }}>
              Pic à <strong style={{ color: "#dc2626" }}>{postsByHour[bestHourIndex].hour}</strong>
            </div>
          )}
        </div>

        {/* Content health score */}
        <div style={{ ...card, display: "flex", flexDirection: "column", gap: 12 }}>
          <ChartHead title="Santé du contenu" sub="Indicateurs clés de qualité" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {healthMetrics.map(h => (
              <div key={h.label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "#374151" }}>{h.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: h.score >= 70 ? "#16a34a" : h.score >= 40 ? "#f59e0b" : "#dc2626" }}>
                    {h.score}%
                  </span>
                </div>
                <div style={{ height: 7, borderRadius: 6, background: "#f1f5f9", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 6, transition: "width .7s ease",
                    width: `${h.score}%`,
                    background: h.score >= 70 ? "linear-gradient(90deg,#86efac,#16a34a)"
                      : h.score >= 40 ? "linear-gradient(90deg,#fde68a,#f59e0b)"
                      : "linear-gradient(90deg,#fca5a5,#dc2626)",
                  }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 4, padding: "10px 12px", borderRadius: 10,
              background: overallScore >= 70 ? "#f0fdf4" : overallScore >= 40 ? "#fefce8" : "#fff1f2",
              border: `1px solid ${overallScore >= 70 ? "#bbf7d0" : overallScore >= 40 ? "#fde68a" : "#fecdd3"}`,
              display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>Score global</span>
              <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-1px",
                color: overallScore >= 70 ? "#16a34a" : overallScore >= 40 ? "#ca8a04" : "#dc2626" }}>
                {overallScore}<span style={{ fontSize: 11, fontWeight: 400 }}>/100</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 7. AI recommendations ───────────────────────────────────────────── */}
      <Airecommendations posts={posts} igData={igData} fbData={fbData} token={token} />
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
function PlatformRow({ color, name, metrics }: {
  color: string; name: keyof typeof PlatformIcon;
  metrics: { label: string; value: string }[];
}) {
  const Icon = PlatformIcon[name];
  return (
    <div style={{ borderRadius: 16, border: "1.5px solid #f0f0f5", overflow: "hidden",
      background: "#fff", transition: "box-shadow .15s" }}>
      {/* header strip */}
      <div style={{ background: color + "0f", padding: "12px 14px",
        display: "flex", alignItems: "center", gap: 10,
        borderBottom: `1.5px solid ${color}18` }}>
        <Icon />
        <span style={{ fontSize: 13, fontWeight: 400, color: "#0f172a" }}>{name}</span>
        <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%",
          background: "#10b981", boxShadow: "0 0 0 3px #dcfce7" }} />
      </div>
      {/* metrics */}
      <div style={{ display: "flex", padding: "12px 14px", gap: 0 }}>
        {metrics.map((m, i) => (
          <div key={m.label} style={{ flex: 1, textAlign: "center",
            borderLeft: i > 0 ? "1px solid #f0f0f5" : "none" }}>
            <div style={{ fontSize: 15, fontWeight: 400, color: "#0f172a" }}>{m.value}</div>
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
