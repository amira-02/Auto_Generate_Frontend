// Analytics/FacebookTab.tsx
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { KpiCard, CustomTooltip, SectionTitle } from "./AnalyticsComponents";
import { fmtNum, fmtDate } from "./analyticsHelpers";
import type { FacebookSummary } from "./analyticsTypes";

type Props = { fbData: FacebookSummary | null };

export default function FacebookTab({ fbData }: Props) {
  if (!fbData) return (
    <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 16, border: "1.5px dashed #e5e7eb" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📘</div>
      <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 6px", color: "#1e293b" }}>Facebook not connected</h3>
      <p style={{ color: "#94a3b8", fontSize: 13 }}>Connect your Facebook Page in the Accounts section to see analytics.</p>
    </div>
  );

  const fbTotalImpressions = fbData.impressionsTimeline.reduce( (s, r) => s + r.value, 0);
  const fbTotalEngaged     = fbData.engagedUsersTimeline.reduce((s, r) => s + r.value, 0);
  const fbAvgDailyImp      = fbData.impressionsTimeline.length
    ? Math.round(fbTotalImpressions / fbData.impressionsTimeline.length) : 0;
  const fbEngRate          = fbData.fans > 0
    ? ((fbTotalEngaged / 30 / fbData.fans) * 100).toFixed(2) : "0.00";

  return (
    <>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 14, marginBottom: 20 }}>
        <KpiCard label="Page Fans"        value={fmtNum(fbData.fans)}        accent="#1877f2" icon="👥" delay={0}    sub="Total page likes"    badge="REAL" badgeColor="#1877f2" />
        <KpiCard label="Followers"         value={fmtNum(fbData.followers)}   accent="#1877f2" icon="📢" delay={0.05} sub="Page followers"      badge="REAL" badgeColor="#1877f2" />
        <KpiCard label="Total Impressions" value={fmtNum(fbTotalImpressions)} accent="#06b6d4" icon="👁️" delay={0.1}  sub="Last 30 days"        badge="REAL" badgeColor="#1877f2" />
        <KpiCard label="Engaged Users"     value={fmtNum(fbTotalEngaged)}     accent="#10b981" icon="💬" delay={0.15} sub="Last 30 days"        badge="REAL" badgeColor="#1877f2" />
        <KpiCard label="Avg Daily Reach"   value={fmtNum(fbAvgDailyImp)}      accent="#dc2626" icon="📊" delay={0.2}  sub="impressions/day"     badge="REAL" badgeColor="#1877f2" />
        <KpiCard label="Page Eng. Rate"    value={`${fbEngRate}%`}            accent="#f59e0b" icon="⭐" delay={0.25} sub="engaged/fans/day"    badge="REAL" badgeColor="#1877f2" />
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
            ))}
        </div>
      </motion.div>
    </>
  );
}