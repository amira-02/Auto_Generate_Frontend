// Analytics/LinkedinTab.tsx
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { KpiCard, CustomTooltip, SectionTitle } from "./AnalyticsComponents";
import { fmtNum, fmtDate } from "./analyticsHelpers";
import type { LinkedInSummary } from "./analyticsTypes";

type Props = { liData: LinkedInSummary | null };

export default function LinkedinTab({ liData }: Props) {
  if (!liData) return (
    <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 16, border: "1.5px dashed #e5e7eb" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>💼</div>
      <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 6px", color: "#1e293b" }}>LinkedIn not connected</h3>
      <p style={{ color: "#94a3b8", fontSize: 13 }}>Connect your LinkedIn account in the Accounts section to see analytics.</p>
    </div>
  );

  const engRate = liData.followers > 0 && liData.totalImpressions > 0
    ? ((liData.totalReactions / liData.totalImpressions) * 100).toFixed(2)
    : "0.00";

  const impData      = liData.impressionsTimeline.map(r => ({ date: fmtDate(r.date), value: r.value }));
  const reactData    = liData.reactionsTimeline.map(r => ({ date: fmtDate(r.date), value: r.value }));
  const clicksData   = liData.clicksTimeline.map(r => ({ date: fmtDate(r.date), value: r.value }));

  return (
    <>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 14, marginBottom: 20 }}>
        <KpiCard label="Followers"         value={fmtNum(liData.followers)}        accent="#0077b5" icon="👥" delay={0}    sub="LinkedIn followers"   badge="REAL" badgeColor="#0077b5" />
        <KpiCard label="Connections"        value={fmtNum(liData.connectionsCount)} accent="#0077b5" icon="🤝" delay={0.05} sub="1st degree"           badge="REAL" badgeColor="#0077b5" />
        <KpiCard label="Total Impressions"  value={fmtNum(liData.totalImpressions)} accent="#06b6d4" icon="👁️" delay={0.1}  sub="Last 30 days"         badge="REAL" badgeColor="#0077b5" />
        <KpiCard label="Total Reactions"    value={fmtNum(liData.totalReactions)}   accent="#10b981" icon="👍" delay={0.15} sub="Last 30 days"         badge="REAL" badgeColor="#0077b5" />
        <KpiCard label="Total Clicks"       value={fmtNum(liData.totalClicks)}      accent="#dc2626" icon="🖱️" delay={0.2}  sub="Last 30 days"         badge="REAL" badgeColor="#0077b5" />
        <KpiCard label="Eng. Rate"          value={`${engRate}%`}                   accent="#f59e0b" icon="📊" delay={0.25} sub="reactions/impressions" badge="REAL" badgeColor="#0077b5" />
      </div>

      {/* Charts row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", padding: "20px 24px" }}>
          <SectionTitle title="Daily Impressions" sub="Post impressions per day" badge="REAL" badgeColor="#0077b5" />
          <div style={{ marginTop: 16 }} />
          {impData.length === 0
            ? <div style={{ textAlign: "center", padding: "60px 0", color: "#cbd5e1", fontSize: 12 }}>No data yet</div>
            : <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={impData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gLiImp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#0077b5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0077b5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" name="Impressions" stroke="#0077b5" strokeWidth={2} fill="url(#gLiImp)" dot={{ fill: "#0077b5", r: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          }
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", padding: "20px 24px" }}>
          <SectionTitle title="Daily Reactions" sub="Likes, comments and shares per day" badge="REAL" badgeColor="#0077b5" />
          <div style={{ marginTop: 16 }} />
          {reactData.length === 0
            ? <div style={{ textAlign: "center", padding: "60px 0", color: "#cbd5e1", fontSize: 12 }}>No data yet</div>
            : <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={reactData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gLiReact" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" name="Reactions" stroke="#10b981" strokeWidth={2} fill="url(#gLiReact)" dot={{ fill: "#10b981", r: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          }
        </motion.div>
      </div>

      {/* Clicks chart */}
      {clicksData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
          style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", padding: "20px 24px", marginBottom: 16 }}>
          <SectionTitle title="Daily Clicks" sub="Link clicks on posts" badge="REAL" badgeColor="#0077b5" />
          <div style={{ marginTop: 16 }} />
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={clicksData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Clicks" fill="#0077b5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Recent posts */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", padding: "20px 24px" }}>
        <SectionTitle title="Recent LinkedIn Posts" sub="Latest published content" badge="REAL" badgeColor="#0077b5" />
        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {liData.recentPosts.length === 0
            ? <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px 0", color: "#cbd5e1", fontSize: 12 }}>No posts found</div>
            : liData.recentPosts.map(p => (
              <div key={p.id} style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #f0f0f0", background: "#f8fafc" }}>
                {p.imageUrl
                  ? <div style={{ position: "relative", paddingBottom: "56%" }}>
                      <img src={p.imageUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  : <div style={{ height: 70, background: "#e8f4fd", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>💼</div>
                }
                <div style={{ padding: "10px 12px" }}>
                  <p style={{ margin: 0, fontSize: 11, color: "#475569", lineHeight: 1.4,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {p.text || "No text"}
                  </p>
                  <div style={{ marginTop: 8, display: "flex", gap: 10, fontSize: 10, color: "#94a3b8" }}>
                    <span>👍 {p.likes}</span>
                    <span>💬 {p.comments}</span>
                    <span>🔁 {p.shares}</span>
                  </div>
                  <div style={{ marginTop: 4, fontSize: 10, color: "#cbd5e1" }}>{fmtDate(p.createdAt)}</div>
                </div>
              </div>
            ))
          }
        </div>
      </motion.div>
    </>
  );
}