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
  ENGAGEMENT_MULTIPLIERS, normalizePlatforms, getMonthLabel,
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

// Card plateforme générique avec vrai logo SVG
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
        {/* Photo de profil ou logo SVG */}
        <div style={{ position: "relative", width: 36, height: 36, flexShrink: 0 }}>
          {profilePicture
            ? <img src={profilePicture} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: `2px solid ${color}30` }} />
            : <div style={{ width: 36, height: 36, borderRadius: 10, overflow: "hidden" }}>
                <PlatformIcon platform={platformKey} size={36} />
              </div>
          }
          {/* Badge logo en bas à droite si photo de profil */}
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

const COMPARE_METRICS = {
  audience:   { label: "Audience",   igKey: "followers", fbKey: "fans"       },
  engagement: { label: "Engagement", igKey: "likes",     fbKey: "engaged"    },
  reach:      { label: "Reach",      igKey: "reach",     fbKey: "impressions"},
} as const;

export default function OverviewTab({ posts, igData, fbData, liData, ttData }: Props) {
  const { token } = useContext(AuthContext);
  const [cMetric, setCMetric] = useState<keyof typeof COMPARE_METRICS>("audience");

  const now          = new Date();
  const thisMonth    = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth    = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const postsThisM   = posts.filter(p => new Date(p.createdAt) >= thisMonth);
  const postsLastM   = posts.filter(p => { const d = new Date(p.createdAt); return d >= lastMonth && d <= lastMonthEnd; });
  const published    = posts.filter(p => p.status?.toLowerCase() === "published");
  const scheduled    = posts.filter(p => p.status?.toLowerCase() === "scheduled");
  const inReview     = posts.filter(p => ["inreview","approved"].includes(p.status?.toLowerCase() ?? ""));
  const growthPct    = postsLastM.length > 0
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
    .map(([id, count]) => ({ id, count, color: PLATFORM_META[id]?.color ?? "#94a3b8", label: PLATFORM_META[id]?.label ?? id, icon: PLATFORM_META[id]?.icon ?? "?" }))
    .sort((a, b) => b.count - a.count);

  const statusMap = posts.reduce<Record<string, number>>((acc, p) => {
    const s = p.status?.toLowerCase() ?? "draft"; acc[s] = (acc[s] ?? 0) + 1; return acc;
  }, {});
  const statusData = Object.entries(statusMap).map(([s, v]) => ({
    name: s === "inreview" ? "In Review" : s.charAt(0).toUpperCase() + s.slice(1),
    value: v, color: STATUS_COLOR[s] ?? "#94a3b8",
  }));

  // IG
  const igFollowers = igData?.followers     ?? 0;
  const igLikes     = igData?.totalLikes    ?? 0;
  const igComments  = igData?.totalComments ?? 0;
  const igPosts     = igData?.mediaCount    ?? 0;
  const igEngRate   = igPosts > 0 && igFollowers > 0
    ? ((igLikes + igComments) / igPosts / igFollowers * 100).toFixed(2) : "0.00";
  const igReach     = (igData?.reachTimeline ?? []).slice(-14).map((r, i) => ({ i, v: r.value }));

  // FB
  const fbFans      = fbData?.fans ?? 0;
  const fbFollowers = fbData?.followers ?? 0;
  const fbImp       = fbData?.impressionsTimeline.reduce((s, r) => s + r.value, 0) ?? 0;
  const fbEngaged   = fbData?.engagedUsersTimeline.reduce((s, r) => s + r.value, 0) ?? 0;
  const fbEngRate   = fbFans > 0 ? ((fbEngaged / 30 / fbFans) * 100).toFixed(2) : "0.00";
  const fbImpChart  = (fbData?.impressionsTimeline ?? []).slice(-14).map((r, i) => ({ i, v: r.value }));

  // LI
  const liFollowers = liData?.followers ?? 0;
  const liImp       = liData?.totalImpressions ?? 0;
  const liReactions = liData?.totalReactions   ?? 0;
  const liEngRate   = liImp > 0 ? ((liReactions / liImp) * 100).toFixed(2) : "0.00";
  const liChart     = (liData?.impressionsTimeline ?? []).slice(-14).map((r, i) => ({ i, v: r.value }));

  // TT
  const ttFollowers = ttData?.followers  ?? 0;
  const ttViews     = ttData?.totalViews ?? 0;
  const ttLikes     = ttData?.totalLikes ?? 0;
  const ttEngRate   = ttViews > 0 ? (((ttLikes + (ttData?.totalComments ?? 0)) / ttViews) * 100).toFixed(2) : "0.00";
  const ttChart     = (ttData?.viewsTimeline ?? []).slice(-14).map((r, i) => ({ i, v: r.value }));

  // compare
  const cData = {
    audience:   { ig: igFollowers,         fb: fbFans,   igLabel: fmtNum(igFollowers),         fbLabel: fmtNum(fbFans)   },
    engagement: { ig: igLikes + igComments, fb: fbEngaged, igLabel: fmtNum(igLikes + igComments), fbLabel: fmtNum(fbEngaged) },
    reach:      { ig: igLikes * 10,        fb: fbImp,    igLabel: fmtNum(igLikes * 10),        fbLabel: fmtNum(fbImp)    },
  };
  const c      = cData[cMetric];
  const cTotal = c.ig + c.fb;
  const igPct  = cTotal > 0 ? Math.round((c.ig / cTotal) * 100) : 50;
  const fbPct  = 100 - igPct;

  const recentPosts = [...published]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Compte les plateformes connectées pour adapter la grille
  const connectedPlatforms = [igData, fbData, liData, ttData].filter(Boolean).length;
  const platformGridCols = connectedPlatforms <= 2
    ? `repeat(${connectedPlatforms}, 1fr) 1.7fr`
    : connectedPlatforms === 3
      ? "1fr 1fr 1fr 1.5fr"
      : "1fr 1fr 1fr 1fr";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── Row 1: KPI tiles ─────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        <KpiTile label="Total posts" value={posts.length}     delta={growthPct} sub="vs last month" accent="#6366f1" />
        <KpiTile label="Published"   value={published.length} delta={8}         sub="vs last month" accent="#10b981" />
        <KpiTile label="Scheduled"   value={scheduled.length} sub="upcoming"                        accent="#8b5cf6" />
        <KpiTile label="In review"   value={inReview.length}  sub="awaiting"                        accent="#f59e0b" />
      </div>

      {/* ── Row 2: Platform cards + Bar chart ────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: platformGridCols, gap: 12 }}>

        {igData && (
          <PlatformCard
            color="#e1306c" platformKey="instagram" name={`@${igData.name}`} sub="Instagram account" badge="REAL"
            profilePicture={igData.profilePicture}
            stats={[
              { label: "Followers", value: fmtNum(igFollowers) },
              { label: "Posts",     value: igPosts             },
              { label: "Likes",     value: fmtNum(igLikes)     },
              { label: "Eng. rate", value: `${igEngRate}%`     },
            ]}
            chartData={igReach}
            chartLabel="Reach · 14 days"
          />
        )}

        {fbData && (
          <PlatformCard
            color="#1877f2" platformKey="facebook" name={fbData.name} sub="Facebook page" badge="REAL"
            profilePicture={fbData.profilePicture}
            stats={[
              { label: "Fans",        value: fmtNum(fbFans)      },
              { label: "Followers",   value: fmtNum(fbFollowers) },
              { label: "Impressions", value: fmtNum(fbImp)       },
              { label: "Eng. rate",   value: `${fbEngRate}%`     },
            ]}
            chartData={fbImpChart}
            chartLabel="Impressions · 14 days"
          />
        )}

        {liData && (
          <PlatformCard
            color="#0077b5" platformKey="linkedin" name={liData.name} sub="LinkedIn account" badge="REAL"
            profilePicture={liData.profilePicture}
            stats={[
              { label: "Followers",   value: fmtNum(liFollowers) },
              { label: "Impressions", value: fmtNum(liImp)       },
              { label: "Reactions",   value: fmtNum(liReactions) },
              { label: "Eng. rate",   value: `${liEngRate}%`     },
            ]}
            chartData={liChart}
            chartLabel="Impressions · 14 days"
          />
        )}

        {ttData && (
          <PlatformCard
            color="#ff0050" platformKey="tiktok" name={`@${ttData.name}`} sub="TikTok account" badge="REAL"
            profilePicture={ttData.profilePicture}
            stats={[
              { label: "Followers", value: fmtNum(ttFollowers) },
              { label: "Views",     value: fmtNum(ttViews)     },
              { label: "Likes",     value: fmtNum(ttLikes)     },
              { label: "Eng. rate", value: `${ttEngRate}%`     },
            ]}
            chartData={ttChart}
            chartLabel="Views · 14 days"
          />
        )}

        {/* Post activity bar chart */}
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Post activity</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Monthly creation</div>
            </div>
            <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#94a3b8" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: "#6366f1", display: "inline-block" }} />Total
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: "#10b981", display: "inline-block" }} />Published
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={14} barGap={3}>
              <defs>
                <linearGradient id="bG1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#8b5cf6" /></linearGradient>
                <linearGradient id="bG2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#059669" /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8f9fb", radius: 6 }} />
              <Bar dataKey="total"     name="Total"     fill="url(#bG1)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="published" name="Published" fill="url(#bG2)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Row 3: Compare + Status + Platforms & Recent ─────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 12 }}>

        {/* Compare widget */}
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Platform comparison</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Instagram vs Facebook</div>
            </div>
            <div style={{ display: "flex", gap: 4, background: "#f8f9fb", borderRadius: 10, padding: 3, border: "1px solid #f0f0f0" }}>
              {(Object.keys(COMPARE_METRICS) as (keyof typeof COMPARE_METRICS)[]).map(m => (
                <button key={m} onClick={() => setCMetric(m)} style={{
                  padding: "4px 10px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: cMetric === m ? "#fff" : "transparent",
                  color: cMetric === m ? "#0f172a" : "#94a3b8",
                  fontSize: 10, fontWeight: cMetric === m ? 700 : 400,
                  boxShadow: cMetric === m ? "0 1px 3px rgba(0,0,0,.08)" : "none",
                  fontFamily: "inherit", transition: "all .15s", textTransform: "capitalize",
                }}>{m}</button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={cMetric} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 10, color: "#e1306c", fontWeight: 700, marginBottom: 4 }}>📸 Instagram</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", letterSpacing: "-1.5px" }}>{c.igLabel}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 3 }}>{igPct}% share</div>
                </div>
                <div style={{ fontSize: 11, color: "#cbd5e1", fontWeight: 700 }}>vs</div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: "#1877f2", fontWeight: 700, marginBottom: 4 }}>Facebook 📘</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", letterSpacing: "-1.5px" }}>{c.fbLabel}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 3 }}>{fbPct}% share</div>
                </div>
              </div>

              <div style={{ height: 12, borderRadius: 12, overflow: "hidden", display: "flex", marginBottom: 6 }}>
                <motion.div animate={{ width: `${igPct}%` }} transition={{ duration: 0.5, ease: "easeOut" }}
                  style={{ height: "100%", background: "linear-gradient(90deg,#e1306c,#f77737)" }} />
                <motion.div animate={{ width: `${fbPct}%` }} transition={{ duration: 0.5, ease: "easeOut" }}
                  style={{ height: "100%", background: "linear-gradient(90deg,#1877f2,#0c5ae0)" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: 10 }}>
                <span style={{ color: "#e1306c", fontWeight: 700 }}>{igPct}%</span>
                <span style={{ color: "#1877f2", fontWeight: 700 }}>{fbPct}%</span>
              </div>

              {[
                { label: "Eng. rate", ig: Number(igEngRate), fb: Number(fbEngRate), igS: `${igEngRate}%`, fbS: `${fbEngRate}%` },
                { label: "Content",   ig: igPosts,           fb: fbData?.recentPosts.length ?? 0, igS: `${igPosts}`, fbS: `${fbData?.recentPosts.length ?? 0}` },
                { label: "Reactions", ig: igLikes,           fb: fbEngaged, igS: fmtNum(igLikes), fbS: fmtNum(fbEngaged) },
              ].map(row => {
                const t  = row.ig + row.fb;
                const ip = t > 0 ? Math.round((row.ig / t) * 100) : 50;
                return (
                  <div key={row.label} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8", marginBottom: 4 }}>
                      <span>{row.label}</span>
                      <span style={{ color: "#0f172a", fontWeight: 600 }}>{row.igS} vs {row.fbS}</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 10, background: "#f1f5f9", overflow: "hidden", display: "flex" }}>
                      <motion.div animate={{ width: `${ip}%` }} transition={{ duration: 0.5 }}
                        style={{ height: "100%", background: "#e1306c", borderRadius: "10px 0 0 10px" }} />
                      <motion.div animate={{ width: `${100 - ip}%` }} transition={{ duration: 0.5 }}
                        style={{ height: "100%", background: "#1877f2", borderRadius: "0 10px 10px 0" }} />
                    </div>
                  </div>
                );
              })}

              {/* LinkedIn + TikTok mini rows si connectés */}
              {(liData || ttData) && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 8, fontWeight: 600 }}>Other platforms</div>
                  {liData && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 11, color: "#0077b5", fontWeight: 600 }}>💼 LinkedIn</span>
                      <div style={{ display: "flex", gap: 10, fontSize: 10, color: "#64748b" }}>
                        <span>{fmtNum(liFollowers)} followers</span>
                        <span>{fmtNum(liImp)} impressions</span>
                        <span style={{ fontWeight: 700, color: "#0077b5" }}>{liEngRate}% eng.</span>
                      </div>
                    </div>
                  )}
                  {ttData && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "#ff0050", fontWeight: 600 }}>🎵 TikTok</span>
                      <div style={{ display: "flex", gap: 10, fontSize: 10, color: "#64748b" }}>
                        <span>{fmtNum(ttFollowers)} followers</span>
                        <span>{fmtNum(ttViews)} views</span>
                        <span style={{ fontWeight: 700, color: "#ff0050" }}>{ttEngRate}% eng.</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Status donut */}
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Post status</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, marginBottom: 4 }}>All posts breakdown</div>
          {statusData.length === 0
            ? <div style={{ textAlign: "center", padding: "40px 0", color: "#cbd5e1", fontSize: 12 }}>No data</div>
            : <>
              <div style={{ position: "relative" }}>
                <ResponsiveContainer width="100%" height={130}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={58} dataKey="value" paddingAngle={3} strokeWidth={0}>
                      {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none" }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", letterSpacing: "-1px" }}>{posts.length}</div>
                  <div style={{ fontSize: 9, color: "#94a3b8" }}>total</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                {statusData.map(s => (
                  <div key={s.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748b" }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.color, display: "inline-block", flexShrink: 0 }} />
                      {s.name}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 36, height: 4, borderRadius: 10, background: "#f1f5f9", overflow: "hidden" }}>
                        <div style={{ width: `${posts.length > 0 ? (s.value / posts.length * 100) : 0}%`, height: "100%", background: s.color, borderRadius: 10 }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#374151", minWidth: 18, textAlign: "right" }}>{s.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          }
        </div>

        {/* Platforms + Recent */}
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>Platforms</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 12 }}>Post distribution</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {platData.length === 0
              ? <div style={{ textAlign: "center", padding: "20px 0", color: "#cbd5e1", fontSize: 12 }}>No posts yet</div>
              : platData.map(pl => {
                const pct = posts.length > 0 ? Math.round((pl.count / posts.length) * 100) : 0;
                return (
                  <div key={pl.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, overflow: "hidden", flexShrink: 0 }}>
                      <PlatformIcon platform={pl.id} size={26} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>{pl.label}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: pl.color }}>{pl.count}</span>
                      </div>
                      <div style={{ height: 5, borderRadius: 10, background: "#f1f5f9", overflow: "hidden" }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                          style={{ height: "100%", borderRadius: 10, background: pl.color }} />
                      </div>
                    </div>
                    <span style={{ fontSize: 10, color: "#94a3b8", flexShrink: 0, width: 26, textAlign: "right" }}>{pct}%</span>
                  </div>
                );
              })
            }
          </div>

          {recentPosts.length > 0 && (
            <>
              <div style={{ height: 1, background: "#f0f0f0", margin: "14px 0 10px" }} />
              <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 8 }}>Recent published</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {recentPosts.map(p => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, overflow: "hidden", background: "#f8fafc" }}>
                      {p.imageUrl
                        ? <img src={p.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>📝</div>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 500, color: "#374151", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {p.caption?.slice(0, 28) ?? p.topicName}
                      </div>
                      <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 1 }}>
                        {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", flexShrink: 0, display: "block" }} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Row 4: AI Recommendations ────────────────────────────────── */}
      <Airecommendations posts={posts} igData={igData} fbData={fbData} token={token} />

    </div>
  );
}