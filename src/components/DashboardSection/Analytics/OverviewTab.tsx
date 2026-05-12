// Analytics/OverviewTab.tsx
import { useContext } from "react";
import { AuthContext } from "../../../hooks/AuthContext";
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
  background: "#fff",
  borderRadius: 16,
  border: "1px solid #f0f0f0",
  padding: "20px",
};

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

// ── Main ──────────────────────────────────────────────────────────────────────
export default function OverviewTab({ posts, igData, fbData }: Props) {
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
  const growthPct  = postsLastM.length > 0
    ? Math.round(((postsThisM.length - postsLastM.length) / postsLastM.length) * 100) : 0;

  const recentPosts = [...published]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

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
