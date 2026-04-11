import { useState } from "react";

type Props = {
  posts: any[];
};

export default function CalendarView({ posts }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const startDay = startOfMonth.getDay();
  const daysInMonth = endOfMonth.getDate();

  const offset = startDay === 0 ? 6 : startDay - 1;

  const days: (number | null)[] = [];

  for (let i = 0; i < offset; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const goPrev = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const goNext = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const getPostsForDay = (day: number | null) => {
    if (!day) return [];
    return posts.filter((p) => {
      if (!p.scheduledAt) return false;
      const d = new Date(p.scheduledAt);
      return (
        d.getDate() === day &&
        d.getMonth() === currentDate.getMonth() &&
        d.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const getPlatformIcon = (platform: string) => {
    const icons: { [key: string]: string } = {
      linkedin: "💼",
      twitter: "𝕏",
      instagram: "📸",
      facebook: "f",
      tiktok: "🎵",
    };
    return icons[platform?.toLowerCase()] || "📝";
  };

  const getPlatformColor = (platform: string) => {
    const colors: { [key: string]: string } = {
      linkedin: "#0077b5",
      twitter: "#1da1f2",
      instagram: "#e1306c",
      facebook: "#1877f2",
      tiktok: "#000000",
    };
    return colors[platform?.toLowerCase()] || "#6b7280";
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#fff" }}>
      
      {/* HEADER */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              onClick={() => setCurrentDate(new Date())}
              style={{
                padding: "8px 16px",
                border: "1px solid #dadce0",
                borderRadius: 6,
                background: "#fff",
                cursor: "pointer",
              }}
            >
              Today
            </button>

            <button onClick={goPrev}>⬅️</button>
            <button onClick={goNext}>➡️</button>

            <h2 style={{ margin: 0 }}>
              {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
            </h2>
          </div>

          {/* VIEW SWITCH */}
          <div style={{ display: "flex", border: "1px solid #dadce0", borderRadius: 6 }}>
            {(["month", "week", "day"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: "6px 12px",
                  background: viewMode === mode ? "#3b82f6" : "#fff",
                  color: viewMode === mode ? "#fff" : "#111",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* WEEK DAYS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", fontSize: 12 }}>
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
            <div key={d} style={{ textAlign: "center", padding: 8 }}>
              {d}
            </div>
          ))}
        </div>
      </div>

      {/* GRID */}
      <div style={{ flex: 1, padding: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
          
          {days.map((day, i) => {
            const dayPosts = getPostsForDay(day);
            const today = isToday(day);

            return (
              <div
                key={i}
                className="calendar-day"
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  minHeight: 120,
                  padding: 8,
                  position: "relative",
                }}
              >
                {day && (
                  <div
                    style={{
                      fontWeight: today ? 700 : 400,
                      background: today ? "#3b82f6" : "transparent",
                      color: today ? "#fff" : "#111",
                      borderRadius: "50%",
                      width: 26,
                      height: 26,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginLeft: "auto",
                      marginBottom: 6,
                    }}
                  >
                    {day}
                  </div>
                )}

                {/* POSTS */}
                {dayPosts.slice(0, 3).map((p, idx) => (
                  <div
                    key={idx}
                    style={{
                      fontSize: 11,
                      padding: "4px 6px",
                      borderRadius: 6,
                      marginBottom: 4,
                      background: getPlatformColor(p.platform) + "20",
                      color: getPlatformColor(p.platform),
                      display: "flex",
                      gap: 4,
                      alignItems: "center",
                    }}
                  >
                    <span>{getPlatformIcon(p.platform)}</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p.caption?.slice(0, 25)}
                    </span>
                  </div>
                ))}

                {dayPosts.length > 3 && (
                  <div style={{ fontSize: 11, textAlign: "center" }}>
                    +{dayPosts.length - 3} more
                  </div>
                )}

                {/* ADD BUTTON */}
                {day && (
                  <button
                    className="add-btn"
                    style={{
                      position: "absolute",
                      bottom: 6,
                      right: 6,
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      border: "none",
                      background: "#eee",
                      cursor: "pointer",
                      opacity: 0,
                    }}
                  >
                    +
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* HOVER FIX */}
      <style>{`
        .calendar-day:hover .add-btn {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}