// Analytics/TiktokTab.tsx
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { KpiCard, CustomTooltip, SectionTitle } from "./AnalyticsComponents";
import { fmtNum, fmtDate } from "./analyticsHelpers";
import type { TikTokSummary } from "./analyticsTypes";

type Props = { ttData: TikTokSummary | null };

export default function TiktokTab({ ttData }: Props) {
  if (!ttData) return (
    <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 16, border: "1.5px dashed #e5e7eb" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🎵</div>
      <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 6px", color: "#1e293b" }}>TikTok not connected</h3>
      <p style={{ color: "#94a3b8", fontSize: 13 }}>Connect your TikTok account in the Accounts section to see analytics.</p>
    </div>
  );

  const engRate = ttData.totalViews > 0
    ? (((ttData.totalLikes + ttData.totalComments + ttData.totalShares) / ttData.totalViews) * 100).toFixed(2)
    : "0.00";

  const viewsData = ttData.viewsTimeline.map(r => ({ date: fmtDate(r.date), value: r.value }));
  const likesData = ttData.likesTimeline.map(r => ({ date: fmtDate(r.date), value: r.value }));

  return (
    <>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 14, marginBottom: 20 }}>
        <KpiCard label="Followers"      value={fmtNum(ttData.followers)}     accent="#ff0050" icon="👥" delay={0}    sub="TikTok followers"   badge="REAL" badgeColor="#ff0050" />
        <KpiCard label="Total Videos"   value={ttData.videoCount}            accent="#dc2626" icon="🎬" delay={0.05} sub="published videos"   badge="REAL" badgeColor="#ff0050" />
        <KpiCard label="Total Views"    value={fmtNum(ttData.totalViews)}    accent="#06b6d4" icon="👁️" delay={0.1}  sub="all time"           badge="REAL" badgeColor="#ff0050" />
        <KpiCard label="Total Likes"    value={fmtNum(ttData.totalLikes)}    accent="#f59e0b" icon="❤️" delay={0.15} sub="all time"           badge="REAL" badgeColor="#ff0050" />
        <KpiCard label="Total Shares"   value={fmtNum(ttData.totalShares)}   accent="#10b981" icon="🔁" delay={0.2}  sub="all time"           badge="REAL" badgeColor="#ff0050" />
        <KpiCard label="Eng. Rate"      value={`${engRate}%`}               accent="#dc2626" icon="📊" delay={0.25} sub="(likes+cmts+shares)/views" badge="REAL" badgeColor="#ff0050" />
      </div>

      {/* Charts row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", padding: "20px 24px" }}>
          <SectionTitle title="Daily Views" sub="Video views per day" badge="REAL" badgeColor="#ff0050" />
          <div style={{ marginTop: 16 }} />
          {viewsData.length === 0
            ? <div style={{ textAlign: "center", padding: "60px 0", color: "#cbd5e1", fontSize: 12 }}>No data yet</div>
            : <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={viewsData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gTtViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ff0050" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ff0050" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" name="Views" stroke="#ff0050" strokeWidth={2} fill="url(#gTtViews)" dot={{ fill: "#ff0050", r: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          }
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", padding: "20px 24px" }}>
          <SectionTitle title="Daily Likes" sub="Likes per day" badge="REAL" badgeColor="#ff0050" />
          <div style={{ marginTop: 16 }} />
          {likesData.length === 0
            ? <div style={{ textAlign: "center", padding: "60px 0", color: "#cbd5e1", fontSize: 12 }}>No data yet</div>
            : <ResponsiveContainer width="100%" height={200}>
              <BarChart data={likesData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Likes" fill="#ff0050" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          }
        </motion.div>
      </div>

      {/* Recent videos */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", padding: "20px 24px" }}>
        <SectionTitle title="Recent TikTok Videos" sub="Latest published videos with stats" badge="REAL" badgeColor="#ff0050" />
        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
          {ttData.recentVideos.length === 0
            ? <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px 0", color: "#cbd5e1", fontSize: 12 }}>No videos found</div>
            : ttData.recentVideos.map(v => (
              <a key={v.id} href={v.shareUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #f0f0f0", background: "#f8fafc",
                  transition: "box-shadow .15s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(255,0,80,0.15)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}>
                  <div style={{ position: "relative", paddingBottom: "177%" }}>
                    {v.coverUrl
                      ? <img src={v.coverUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 32, background: "#111" }}>🎵</div>
                    }
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0,
                      background: "linear-gradient(transparent, rgba(0,0,0,0.7))", padding: "16px 8px 8px",
                      display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 10, color: "#fff", fontWeight: 600 }}>👁️ {fmtNum(v.playCount)}</span>
                      <span style={{ fontSize: 10, color: "#fff", fontWeight: 600 }}>❤️ {fmtNum(v.likeCount)}</span>
                    </div>
                  </div>
                  <div style={{ padding: "8px 10px" }}>
                    <p style={{ margin: 0, fontSize: 11, color: "#475569", lineHeight: 1.4,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {v.title || "No title"}
                    </p>
                    <div style={{ marginTop: 6, display: "flex", gap: 8, fontSize: 10, color: "#94a3b8" }}>
                      <span>💬 {v.commentCount}</span>
                      <span>🔁 {v.shareCount}</span>
                    </div>
                    <div style={{ marginTop: 2, fontSize: 10, color: "#cbd5e1" }}>{fmtDate(v.createTime)}</div>
                  </div>
                </div>
              </a>
            ))
          }
        </div>
      </motion.div>
    </>
  );
}