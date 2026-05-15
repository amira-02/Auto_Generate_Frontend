// Analytics/ContentTab.tsx
import { motion } from "framer-motion";
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { CustomTooltip, SectionTitle } from "./AnalyticsComponents";
import { fmtNum, PLATFORM_META, ENGAGEMENT_MULTIPLIERS, normalizePlatforms, getMonthLabel } from "./analyticsHelpers";
import type { Post, InstagramSummary, FacebookSummary } from "./analyticsTypes";

type Props = {
  posts: Post[];
  igData: InstagramSummary | null;
  fbData: FacebookSummary | null;
};

export default function ContentTab({ posts, igData, fbData }: Props) {
  const now = new Date();

  const engagementScore = (p: Post) => {
    const plats = normalizePlatforms(p.platforms);
    const base  = 120 + (p.id % 80);
    const mult  = plats.reduce((acc, pl) => acc + (ENGAGEMENT_MULTIPLIERS[pl] ?? 1), 0) || 1;
    return Math.round(base * mult);
  };

  const published = posts.filter(p => p.status?.toLowerCase() === "published");
  const topPosts  = [...published].sort((a, b) => engagementScore(b) - engagementScore(a)).slice(0, 5);

  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const offset = 5 - i;
    const mStart = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const mEnd   = new Date(now.getFullYear(), now.getMonth() - offset + 1, 0);
    const mPosts = posts.filter(p => { const d = new Date(p.createdAt); return d >= mStart && d <= mEnd; });
    const mPub   = mPosts.filter(p => p.status?.toLowerCase() === "published");
    return { month: getMonthLabel(offset), total: mPosts.length, published: mPub.length,
      engagement: mPub.reduce((s, p) => s + engagementScore(p), 0) };
  });

  const platformCounts = posts.reduce<Record<string, number>>((acc, p) => {
    normalizePlatforms(p.platforms).forEach(pl => { acc[pl] = (acc[pl] ?? 0) + 1; });
    return acc;
  }, {});
  const platformData = Object.entries(platformCounts)
    .map(([id, count]) => ({ id, name: PLATFORM_META[id]?.label ?? id, count, color: PLATFORM_META[id]?.color ?? "#94a3b8" }))
    .sort((a, b) => b.count - a.count);

  const igFollowers     = igData?.followers     ?? 0;
  const igTotalLikes    = igData?.totalLikes    ?? 0;
  const igTotalComments = igData?.totalComments ?? 0;
  const igMediaCount    = igData?.mediaCount    ?? 0;
  const fbTotalImpressions = fbData?.impressionsTimeline.reduce((s, r) => s + r.value, 0) ?? 0;
  const fbTotalEngaged     = fbData?.engagedUsersTimeline.reduce((s, r) => s + r.value, 0) ?? 0;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Top posts */}
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
                      {p.imageUrl ? <img src={p.imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>📝</div>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: "#374151", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {p.caption?.slice(0, 36) ?? p.topicName}
                      </div>
                      <div style={{ height: 4, borderRadius: 10, background: "#f1f5f9", overflow: "hidden", marginTop: 4 }}>
                        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 10, background: "#dc2626" }} />
                      </div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", flexShrink: 0 }}>{score.toLocaleString()}</div>
                  </div>
                );
              })}
          </div>
        </motion.div>

        {/* Engagement trend */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", padding: "20px 24px" }}>
          <SectionTitle title="Engagement Trend" sub="Estimated total reach per month" />
          <div style={{ marginTop: 16 }} />
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={monthlyTrend} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <defs><linearGradient id="lG" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#dc2626" /><stop offset="100%" stopColor="#dc2626" /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="engagement" name="Engagement" stroke="url(#lG)" strokeWidth={3}
                dot={{ fill: "#dc2626", r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: "#dc2626" }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Platform engagement */}
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

        {/* Instagram vs Facebook */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", padding: "20px 24px" }}>
          <SectionTitle title="Instagram vs Facebook" sub="Key metrics comparison" />
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "Audience",    ig: igFollowers,                        fb: fbData?.fans ?? 0,               igLabel: "Followers", fbLabel: "Fans"       },
              { label: "Content",     ig: igMediaCount,                       fb: fbData?.recentPosts.length ?? 0, igLabel: "IG Posts",  fbLabel: "FB Posts"   },
              { label: "Impressions", ig: igTotalLikes * 10,                  fb: fbTotalImpressions,              igLabel: "IG Est.",   fbLabel: "FB Real"    },
              { label: "Engagement",  ig: igTotalLikes + igTotalComments,     fb: fbTotalEngaged,                  igLabel: "Likes+Cmts",fbLabel: "Eng. Users" },
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
                    <div style={{ width: `${igPct}%`, height: "100%", background: "#e1306c", borderRadius: "10px 0 0 10px", transition: "width 0.8s ease" }} />
                    <div style={{ width: `${fbPct}%`, height: "100%", background: "#1877f2", borderRadius: "0 10px 10px 0", transition: "width 0.8s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </>
  );
}