import { useState } from "react";

type Platform =
  | "linkedin"
  | "twitter"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "threads";

type Post = {
  id: number;
  topicId: number;
  topicName: string;
  hashtags: string;
  caption: string | null;
  tone: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  platforms: Platform[];
  scheduledAt: string | null;
  status: string;
  createdAt: string;
};

type Props = {
  posts: Post[];
};

// ─── helpers ──────────────────────────────────────────────────────────────────

const toUTCParts = (value: string): { y: number; m: number; d: number } | null => {
  if (!value) return null;
  const raw = value.endsWith("Z") ? value : value + "Z";
  const dt = new Date(raw);
  if (isNaN(dt.getTime())) return null;
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth(), d: dt.getUTCDate() };
};

const parseDate = (value: string | null): Date | null => {
  if (!value) return null;
  const raw = value.endsWith("Z") ? value : value + "Z";
  const dt = new Date(raw);
  return isNaN(dt.getTime()) ? null : dt;
};

const isToday = (date: Date) => {
  const t = new Date();
  return (
    date.getFullYear() === t.getFullYear() &&
    date.getMonth() === t.getMonth() &&
    date.getDate() === t.getDate()
  );
};

const PLATFORM_ICONS: Record<string, string> = {
  linkedin: "💼",
  twitter: "𝕏",
  instagram: "📸",
  facebook: "📘",
  tiktok: "🎵",
  threads: "🧵",
};

const getPlatformIcon = (platform?: string) =>
  PLATFORM_ICONS[platform?.toLowerCase() ?? ""] ?? "📝";

// 🎨 pastel colors
const colors = {
  primary: "#f08080",
  light: "#fff5f5",
  softer: "#ffeaea",
  border: "#f3d6d6",
  text: "#5a3e3e",
  muted: "#a88",
};

// ─── component ────────────────────────────────────────────────────────────────

export default function CalendarView({ posts }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const getPostsForDay = (calendarDate: Date) =>
    posts.filter((p) => {
      if (!p.scheduledAt) return false;
      const parts = toUTCParts(p.scheduledAt);
      if (!parts) return false;
      return (
        parts.y === calendarDate.getFullYear() &&
        parts.m === calendarDate.getMonth() &&
        parts.d === calendarDate.getDate()
      );
    });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const offset = (firstOfMonth.getDay() + 6) % 7;

  const monthDays: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: lastOfMonth.getDate() }, (_, i) => i + 1),
  ];

  const startOfWeek = new Date(currentDate);
  const dow = currentDate.getDay();
  startOfWeek.setDate(currentDate.getDate() - (dow === 0 ? 6 : dow - 1));

  const weekDays: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const navigate = (dir: -1 | 1) => {
    const d = new Date(currentDate);
    if (viewMode === "month") d.setMonth(d.getMonth() + dir);
    else if (viewMode === "week") d.setDate(d.getDate() + dir * 7);
    else if (viewMode === "day" && selectedDay) {
      const nd = new Date(selectedDay);
      nd.setDate(nd.getDate() + dir);
      setSelectedDay(nd);
      setCurrentDate(nd);
      return;
    }
    setCurrentDate(d);
  };

  const cellStyle = (date: Date): React.CSSProperties => ({
    border: isToday(date) ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`,
    minHeight: 110,
    padding: 10,
    borderRadius: 14,
    cursor: "pointer",
    background: "#fff",
    boxShadow: "0 4px 10px rgba(0,0,0,0.04)",
    transition: "0.2s",
  });

  const postChipStyle: React.CSSProperties = {
    fontSize: 12,
    background: colors.softer,
    borderRadius: 8,
    padding: "4px 6px",
    marginTop: 6,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    color: colors.text,
  };

  const headerLabel = () => {
    if (viewMode === "month")
      return currentDate.toLocaleString("default", { month: "long", year: "numeric" });
    if (viewMode === "week")
      return `${weekDays[0].toLocaleDateString()} – ${weekDays[6].toLocaleDateString()}`;
    if (viewMode === "day" && selectedDay)
      return selectedDay.toLocaleDateString("default", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    return "";
  };

  const navBtn: React.CSSProperties = {
    padding: "6px 12px",
    borderRadius: 20,
    border: `1px solid ${colors.border}`,
    cursor: "pointer",
    background: "#fff",
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", fontFamily: "sans-serif" }}>

      {/* HEADER */}
      <div
        style={{
          padding: "14px 20px",
          background: "#fff",
          borderBottom: `1px solid ${colors.border}`,
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
        }}
      >
        <button
          onClick={() => {
            const today = new Date();
            setCurrentDate(today);
            setSelectedDay(today);
          }}
          style={{
            padding: "6px 14px",
            borderRadius: 20,
            border: `1px solid ${colors.border}`,
            background: colors.light,
            cursor: "pointer"
          }}
        >
          Today
        </button>

        <button onClick={() => navigate(-1)} style={navBtn}>‹</button>
        <button onClick={() => navigate(1)} style={navBtn}>›</button>

        <h2 style={{ margin: 0, fontSize: 18, flex: 1, color: colors.text }}>
          {headerLabel()}
        </h2>

        <div style={{ display: "flex", gap: 6 }}>
          {(["month", "week", "day"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setViewMode(m);
                if (m === "day" && !selectedDay) setSelectedDay(currentDate);
              }}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                border: `1px solid ${colors.border}`,
                cursor: "pointer",
                background: viewMode === m ? colors.primary : "#fff",
                color: viewMode === m ? "#fff" : colors.text,
              }}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* BODY */}
      <div style={{ flex: 1, overflow: "auto", padding: 16, background: colors.light }}>

        {viewMode === "month" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8 }}>
              {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
                <div key={d} style={{ textAlign: "center", fontSize: 12, color: colors.muted }}>
                  {d}
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 10 }}>
              {monthDays.map((day, i) => {
                if (!day) return <div key={i} />;
                const date = new Date(year, month, day);
                const dayPosts = getPostsForDay(date);

                return (
                  <div key={i} onClick={() => { setViewMode("day"); setSelectedDay(date); }} style={cellStyle(date)}>
                    <strong style={{ color: isToday(date) ? colors.primary : colors.text }}>{day}</strong>
                    {dayPosts.map((p) => (
                      <div key={p.id} style={postChipStyle}>
                        {getPlatformIcon(p.platforms?.[0])} {p.caption?.slice(0, 20) ?? p.topicName}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {viewMode === "week" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 10 }}>
            {weekDays.map((date, i) => {
              const dayPosts = getPostsForDay(date);
              return (
                <div key={i} onClick={() => { setViewMode("day"); setSelectedDay(date); }} style={cellStyle(date)}>
                  <strong>{date.getDate()}</strong>
                  {dayPosts.map((p) => (
                    <div key={p.id} style={postChipStyle}>
                      {getPlatformIcon(p.platforms?.[0])} {p.caption?.slice(0, 20) ?? p.topicName}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {viewMode === "day" && selectedDay && (
          <div style={{ maxWidth: 620, margin: "0 auto" }}>
            <h3>{selectedDay.toLocaleDateString()}</h3>

            {getPostsForDay(selectedDay).map((p) => (
              <div key={p.id} style={{
                background: "#fff",
                border: `1px solid ${colors.border}`,
                borderRadius: 16,
                padding: 18,
                marginBottom: 14
              }}>
                <strong>{p.topicName}</strong>
                {p.caption && <p>{p.caption}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}