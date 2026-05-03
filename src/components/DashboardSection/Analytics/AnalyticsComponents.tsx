// Analytics/AnalyticsComponents.tsx
import { motion } from "framer-motion";

// ─── KpiCard ──────────────────────────────────────────────────────────────────

export function KpiCard({ label, value, sub, accent, delta, icon, delay = 0, badge, badgeColor }: {
  label: string; value: string | number; sub?: string;
  accent: string; delta?: number; icon: string; delay?: number;
  badge?: string; badgeColor?: string;
}) {
  const bc = badgeColor ?? "#e1306c";
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }}
      style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0",
        padding: "20px 22px", display: "flex", flexDirection: "column", gap: 10,
        position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80,
        borderRadius: "50%", background: accent + "15", pointerEvents: "none" }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {badge && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20,
            background: bc + "20", color: bc }}>{badge}</span>}
          {delta !== undefined && <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
            background: delta >= 0 ? "#f0fdf4" : "#fef2f2", color: delta >= 0 ? "#16a34a" : "#dc2626" }}>
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}%</span>}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a",
          fontFamily: "'DM Mono', monospace", letterSpacing: "-1.5px" }}>{value}</div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: accent, marginTop: 3, fontWeight: 500 }}>{sub}</div>}
      </div>
    </motion.div>
  );
}

// ─── CustomTooltip ────────────────────────────────────────────────────────────

export const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0f172a", borderRadius: 10, padding: "10px 14px",
      fontSize: 12, color: "#fff", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
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

// ─── SectionTitle ─────────────────────────────────────────────────────────────

export function SectionTitle({ title, sub, badge, badgeColor = "#e1306c" }: {
  title: string; sub?: string; badge?: string; badgeColor?: string;
}) {
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