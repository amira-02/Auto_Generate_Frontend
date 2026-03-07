import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../hooks/AuthContext";

const stats = [
  { label: "Posts Generated", value: "128", change: "+12%", icon: "⚡", color: "#00bfff" },
  { label: "Published", value: "94", change: "+8%", icon: "🚀", color: "#00ff99" },
  { label: "Scheduled", value: "17", change: "+3", icon: "🕐", color: "#ffaa00" },
  { label: "Drafts", value: "34", change: "-2", icon: "📝", color: "#ff6680" },
];

const recentPosts = [
  { id: 1, title: "AI trends in 2026", platform: "LinkedIn", status: "Published", date: "Today", score: 94 },
  { id: 2, title: "How to build with React TSX", platform: "Twitter", status: "Scheduled", date: "Tomorrow", score: 87 },
  { id: 3, title: "Backend best practices", platform: "Instagram", status: "Draft", date: "Mar 5", score: 72 },
  { id: 4, title: "10 tips for productivity", platform: "LinkedIn", status: "Published", date: "Mar 4", score: 91 },
  { id: 5, title: "Why TypeScript matters", platform: "Twitter", status: "Published", date: "Mar 3", score: 88 },
];

const platforms = [
  { name: "LinkedIn", posts: 54, color: "#0077b5" },
  { name: "Twitter", posts: 38, color: "#1da1f2" },
  { name: "Instagram", posts: 23, color: "#e1306c" },
  { name: "Facebook", posts: 13, color: "#1877f2" },
];

const activity = [4, 7, 3, 9, 5, 12, 8, 6, 11, 4, 9, 7, 14, 6, 8, 10, 5, 13, 7, 9, 11, 6, 8, 12, 4, 7, 15, 9, 6, 10];

const statusColor: Record<string, string> = {
  Published: "#00c97a",
  Scheduled: "#ffaa00",
  Draft: "#888",
};

type Theme = {
  bg: string;
  sidebar: string;
  card: string;
  border: string;
  text: string;
  subtext: string;
  muted: string;
  hover: string;
  inputBg: string;
};

const dark: Theme = {
  bg: "#0a0a0a",
  sidebar: "#111",
  card: "#111",
  border: "#1f1f1f",
  text: "#eeeeee",
  subtext: "#888",
  muted: "#444",
  hover: "#ffffff08",
  inputBg: "#0f0f0f",
};

const light: Theme = {
  bg: "#f4f6fa",
  sidebar: "#ffffff",
  card: "#ffffff",
  border: "#e8eaf0",
  text: "#111111",
  subtext: "#666",
  muted: "#bbb",
  hover: "#00000005",
  inputBg: "#f9fafc",
};

export default function Dashboard() {
  const { logout, role } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("Overview");
  const [isDark, setIsDark] = useState(true);

  const t = isDark ? dark : light;
  const navItems = ["Overview", "Posts", "Analytics", "Schedule", "Settings"];
  const maxActivity = Math.max(...activity);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: t.bg, fontFamily: "'JetBrains Mono', monospace", color: t.text, transition: "all 0.3s ease" }}>

      {/* Sidebar */}
      <aside style={{ width: 220, background: t.sidebar, borderRight: `1px solid ${t.border}`, display: "flex", flexDirection: "column", padding: "24px 0", position: "fixed", top: 0, bottom: 0, transition: "all 0.3s ease" }}>
        <div style={{ padding: "0 24px 32px", borderBottom: `1px solid ${t.border}` }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#00bfff", letterSpacing: 1 }}>
            AUTO<span style={{ color: t.text }}>GEN</span>
          </div>
          <div style={{ fontSize: 11, color: t.subtext, marginTop: 4 }}>Content Platform</div>
        </div>

        <nav style={{ flex: 1, padding: "24px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
          {navItems.map((item) => (
            <button key={item} onClick={() => setActiveNav(item)}
              style={{
                background: activeNav === item ? "#00bfff18" : "transparent",
                border: activeNav === item ? "1px solid #00bfff44" : "1px solid transparent",
                color: activeNav === item ? "#00bfff" : t.subtext,
                padding: "10px 16px", borderRadius: 8, cursor: "pointer",
                textAlign: "left", fontSize: 13, fontFamily: "inherit",
                transition: "all 0.2s",
              }}>
              {item}
            </button>
          ))}
        </nav>

        <div style={{ padding: "24px", borderTop: `1px solid ${t.border}` }}>
          <div style={{ fontSize: 12, color: t.muted, marginBottom: 4 }}>Logged as</div>
          <div style={{ fontSize: 13, color: t.text, marginBottom: 2 }}>test@test.com</div>
          <div style={{ fontSize: 11, color: "#00bfff", marginBottom: 16 }}>{role || "Editor"}</div>
          <button onClick={handleLogout}
            style={{ width: "100%", background: "#ff336615", border: "1px solid #ff336640", color: "#ff6680", padding: "8px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontFamily: "inherit", transition: "all 0.2s" }}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 220, flex: 1, padding: 32, display: "flex", flexDirection: "column", gap: 28 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: t.text }}>Overview</h1>
            <p style={{ color: t.subtext, fontSize: 13, margin: "4px 0 0" }}>Saturday, March 07, 2026</p>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {/* Theme Toggle */}
            <button onClick={() => setIsDark(!isDark)}
              style={{
                background: t.card, border: `1px solid ${t.border}`,
                borderRadius: 20, padding: "6px 14px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8,
                fontSize: 13, color: t.text, fontFamily: "inherit",
                transition: "all 0.3s",
              }}>
              <span style={{ fontSize: 16 }}>{isDark ? "☀️" : "🌙"}</span>
              <span>{isDark ? "Light" : "Dark"}</span>
            </button>

            <button onClick={() => navigate("/generate")}
              style={{ background: "#00bfff", color: "#000", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>
              ⚡ New Post
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {stats.map((stat) => (
            <div key={stat.label}
              style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: 20, position: "relative", overflow: "hidden", transition: "all 0.3s" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: stat.color, opacity: 0.7 }} />
              <div style={{ fontSize: 24, marginBottom: 8 }}>{stat.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: t.subtext, margin: "4px 0" }}>{stat.label}</div>
              <div style={{ fontSize: 11, color: stat.change.startsWith("+") ? "#00c97a" : "#ff6680" }}>
                {stat.change} this month
              </div>
            </div>
          ))}
        </div>

        {/* Activity + Platforms */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>

          {/* Activity Chart */}
          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: 24, transition: "all 0.3s" }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 20, color: t.text }}>Post Activity — Last 30 days</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
              {activity.map((val, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                  <div style={{
                    width: "100%",
                    background: isDark
                      ? `#00bfff${Math.round((val / maxActivity) * 200 + 55).toString(16).padStart(2, "0")}`
                      : `#00bfff${Math.round((val / maxActivity) * 180 + 55).toString(16).padStart(2, "0")}`,
                    borderRadius: 3,
                    height: `${(val / maxActivity) * 100}%`,
                    border: "1px solid #00bfff33",
                    transition: "all 0.3s",
                  }} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10, color: t.muted }}>
              <span>Mar 1</span><span>Mar 10</span><span>Mar 20</span><span>Mar 30</span>
            </div>
          </div>

          {/* Platforms */}
          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: 24, transition: "all 0.3s" }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 20, color: t.text }}>By Platform</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {platforms.map((p) => (
                <div key={p.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
                    <span style={{ color: t.subtext }}>{p.name}</span>
                    <span style={{ color: p.color, fontWeight: 600 }}>{p.posts}</span>
                  </div>
                  <div style={{ background: isDark ? "#1f1f1f" : "#eee", borderRadius: 4, height: 6, overflow: "hidden" }}>
                    <div style={{ width: `${(p.posts / 54) * 100}%`, height: "100%", background: p.color, borderRadius: 4, transition: "width 1s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Posts */}
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: 24, transition: "all 0.3s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>Recent Posts</div>
            <button style={{ background: "transparent", border: `1px solid ${t.border}`, color: t.subtext, padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
              View All
            </button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                {["Title", "Platform", "Status", "Date", "Score"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, color: t.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentPosts.map((post) => (
                <tr key={post.id}
                  style={{ borderBottom: `1px solid ${t.border}`, transition: "background 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = t.hover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "12px", fontSize: 13, color: t.text }}>{post.title}</td>
                  <td style={{ padding: "12px", fontSize: 12, color: t.subtext }}>{post.platform}</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{
                      background: `${statusColor[post.status]}18`,
                      color: statusColor[post.status],
                      padding: "3px 10px", borderRadius: 20, fontSize: 11,
                      border: `1px solid ${statusColor[post.status]}44`
                    }}>
                      {post.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px", fontSize: 12, color: t.subtext }}>{post.date}</td>
                  <td style={{ padding: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ background: isDark ? "#1f1f1f" : "#eee", borderRadius: 4, height: 4, width: 60, overflow: "hidden" }}>
                        <div style={{
                          width: `${post.score}%`, height: "100%",
                          background: post.score > 85 ? "#00c97a" : post.score > 70 ? "#ffaa00" : "#ff6680",
                          borderRadius: 4
                        }} />
                      </div>
                      <span style={{ fontSize: 12, color: t.subtext }}>{post.score}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}