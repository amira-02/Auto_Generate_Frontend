// Analytics/OverviewTab.tsx
import { useContext } from "react";
import {
  AreaChart, Area, BarChart, Bar, ComposedChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Cell,
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
function KpiTile({ label, value, delta, sub, accent }: {
  label: string; value: string | number; delta?: number; sub?: string; accent: string;
}) {
  return (
    <div style={{ ...card, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -28, right: -28, width: 80, height: 80,
        borderRadius: "50%", background: accent + "14", pointerEvents: "none" }} />
      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", letterSpacing: "-1.5px", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
        {delta !== undefined && (
          <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 20,
            background: delta >= 0 ? "#f0fdf4" : "#fef2f2",
            color: delta >= 0 ? "#16a34a" : "#dc2626" }}>
            {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}%
          </span>
        )}
        {sub && <span style={{ fontSize: 11, color: "#94a3b8" }}>{sub}</span>}
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
    ttData ? { platform: "TikTok",    followers: ttData.followers,     color: "#ff0050" } : null,
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

  // ── Status breakdown ─────────────────────────────────────────────────────
  const statusData = [
    { label: "Published", count: published.length, color: "#10b981" },
    { label: "Scheduled", count: scheduled.length, color: "#dc2626" },
    { label: "In Review", count: inReview.length,  color: "#f59e0b" },
    { label: "Draft",     count: drafts.length,    color: "#94a3b8" },
  ].filter(s => s.count > 0);
  const totalPosts = posts.length;

  const recentPosts = [...published]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── 1. KPI tiles ───────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        <KpiTile label="Total posts"  value={posts.length}     delta={growthPct} sub="vs last month" accent="#dc2626" />
        <KpiTile label="Published"    value={published.length}                   sub="all time"      accent="#10b981" />
        <KpiTile label="Scheduled"    value={scheduled.length}                   sub="waiting"       accent="#dc2626" />
        <KpiTile label="In review"    value={inReview.length}                    sub="pending"       accent="#f59e0b" />
      </div>

      {/* ── 2. Audience + Monthly trend ────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 14 }}>

        {/* Audience bar chart */}
        <div style={{ ...card }}>
          <ChartHead
            title="Audience Overview"
            sub="Total followers per connected platform"
            right={<span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "#f0fdf4", color: "#16a34a", fontWeight: 600 }}>LIVE</span>}
          />
          {audienceData.length === 0
            ? <div style={{ textAlign: "center", padding: "50px 0", color: "#cbd5e1", fontSize: 12 }}>
                No platform connected yet
              </div>
            : <ResponsiveContainer width="100%" height={200}>
                <BarChart data={audienceData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                  <XAxis dataKey="platform" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => fmtNum(v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="followers" name="Followers" radius={[6, 6, 0, 0]}>
                    {audienceData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
          }
        </div>

        {/* Monthly posts trend */}
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
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={monthlyData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" name="Created" fill="#dc262615" stroke="#dc2626" strokeWidth={1} radius={[4, 4, 0, 0]} barSize={22} />
              <Line dataKey="published" name="Published" type="monotone" stroke="#10b981" strokeWidth={2}
                dot={{ fill: "#10b981", r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 3. Cross-platform reach + Status ───────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14 }}>

        {/* Cross-platform reach timeline */}
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
                <AreaChart data={reachData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
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
                  <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => fmtNum(v)} />
                  <Tooltip content={<CustomTooltip />} />
                  {igTimeline.length > 0 && (
                    <Area type="monotone" dataKey="ig" name="IG Reach"
                      stroke="#e1306c" strokeWidth={2} fill="url(#gOvIg)"
                      dot={false} activeDot={{ r: 4, fill: "#e1306c" }} />
                  )}
                  {fbTimeline.length > 0 && (
                    <Area type="monotone" dataKey="fb" name="FB Impressions"
                      stroke="#1877f2" strokeWidth={2} fill="url(#gOvFb)"
                      dot={false} activeDot={{ r: 4, fill: "#1877f2" }} />
                  )}
                </AreaChart>
              </ResponsiveContainer>
          }
        </div>

        {/* Status breakdown */}
        <div style={{ ...card }}>
          <ChartHead title="Post Status Breakdown" sub="Distribution across all posts" />
          {statusData.length === 0
            ? <div style={{ textAlign: "center", padding: "50px 0", color: "#cbd5e1", fontSize: 12 }}>No posts yet</div>
            : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 4 }}>
                {statusData.map(s => {
                  const pct = totalPosts > 0 ? Math.round((s.count / totalPosts) * 100) : 0;
                  return (
                    <div key={s.label}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
                          <span style={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>{s.label}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{s.count}</span>
                          <span style={{ fontSize: 10, color: "#94a3b8" }}>{pct}%</span>
                        </div>
                      </div>
                      <div style={{ height: 6, borderRadius: 6, background: "#f1f5f9", overflow: "hidden" }}>
                        <div style={{
                          height: "100%", borderRadius: 6,
                          background: s.color,
                          width: `${pct}%`,
                          transition: "width .6s ease",
                        }} />
                      </div>
                    </div>
                  );
                })}

                {/* Total at bottom */}
                <div style={{ marginTop: 4, paddingTop: 12, borderTop: "1px solid #f0f0f0",
                  display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>Total posts</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>{totalPosts}</span>
                </div>
              </div>
            )
          }
        </div>
      </div>

      {/* ── 4. Calendar + Engagement KPIs ──────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 430px) 1fr", gap: 14, alignItems: "start" }}>
        <PostActivityCalendar posts={posts} />

        {/* Platform engagement summary */}
        <div style={{ ...card }}>
          <ChartHead title="Platform Engagement" sub="Key metrics from connected accounts" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {igData && (
              <PlatformRow color="#e1306c" badge="IG" name="Instagram"
                metrics={[
                  { label: "Followers", value: fmtNum(igData.followers) },
                  { label: "Likes",     value: fmtNum(igData.totalLikes) },
                  { label: "Comments",  value: fmtNum(igData.totalComments) },
                ]} />
            )}
            {fbData && (
              <PlatformRow color="#1877f2" badge="FB" name="Facebook"
                metrics={[
                  { label: "Fans",         value: fmtNum(fbData.fans) },
                  { label: "Impressions",  value: fmtNum(fbData.totalImpressions) },
                  { label: "Engaged",      value: fmtNum(fbData.totalEngagedUsers) },
                ]} />
            )}
            {liData && (
              <PlatformRow color="#0077b5" badge="LI" name="LinkedIn"
                metrics={[
                  { label: "Followers",    value: fmtNum(liData.followers) },
                  { label: "Impressions",  value: fmtNum(liData.totalImpressions) },
                  { label: "Reactions",    value: fmtNum(liData.totalReactions) },
                ]} />
            )}
            {ttData && (
              <PlatformRow color="#ff0050" badge="TT" name="TikTok"
                metrics={[
                  { label: "Followers", value: fmtNum(ttData.followers) },
                  { label: "Views",     value: fmtNum(ttData.totalViews) },
                  { label: "Likes",     value: fmtNum(ttData.totalLikes) },
                ]} />
            )}
            {!igData && !fbData && !liData && !ttData && (
              <div style={{ textAlign: "center", padding: "30px 0", color: "#cbd5e1", fontSize: 12 }}>
                No platforms connected
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 5. Recently published posts ────────────────────────────────────── */}
      {recentPosts.length > 0 && (
        <div style={{ ...card }}>
          <ChartHead title="Recent Posts" sub="Latest published content" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
            {recentPosts.map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 12, background: "#f8fafc", border: "1px solid #f0f0f0" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  overflow: "hidden", background: "#e2e8f0" }}>
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: 16 }}>📝</div>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "#374151",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.caption?.slice(0, 32) ?? p.topicName ?? "Untitled"}
                  </div>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                    {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </div>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", flexShrink: 0, display: "block" }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 6. AI recommendations ──────────────────────────────────────────── */}
      <Airecommendations posts={posts} igData={igData} fbData={fbData} token={token} />
    </div>
  );
}

// ── Platform row (engagement summary) ────────────────────────────────────────
function PlatformRow({ color, badge, name, metrics }: {
  color: string;
  badge: string;
  name: string;
  metrics: { label: string; value: string }[];
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
      borderRadius: 10, background: color + "08", border: `1px solid ${color}20` }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: color + "20",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 10, fontWeight: 700, color, flexShrink: 0 }}>{badge}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#374151", width: 68, flexShrink: 0 }}>{name}</div>
      <div style={{ display: "flex", gap: 16, flex: 1 }}>
        {metrics.map(m => (
          <div key={m.label}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.3px" }}>{m.value}</div>
            <div style={{ fontSize: 9, color: "#94a3b8" }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
