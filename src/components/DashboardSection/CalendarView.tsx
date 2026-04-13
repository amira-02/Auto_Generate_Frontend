import { useState } from "react";

type Props = {
  posts: any[];
};

export default function CalendarView({ posts }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Helper functions
  const goPrev = () => {
    if (viewMode === "day" && selectedDay) {
      const newDate = new Date(selectedDay);
      newDate.setDate(newDate.getDate() - 1);
      setSelectedDay(newDate);
      setCurrentDate(newDate);
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    }
  };

  const goNext = () => {
    if (viewMode === "day" && selectedDay) {
      const newDate = new Date(selectedDay);
      newDate.setDate(newDate.getDate() + 1);
      setSelectedDay(newDate);
      setCurrentDate(newDate);
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    }
  };

  const getPostsForDay = (date: Date) => {
    return posts.filter((p) => {
      if (!p.scheduledAt) return false;
      const postDate = new Date(p.scheduledAt);
      return (
        postDate.getDate() === date.getDate() &&
        postDate.getMonth() === date.getMonth() &&
        postDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Pastel Colors
  const getPlatformColor = (platform: string) => {
    const colors: { [key: string]: string } = {
      linkedin: "#a5d6ff",
      twitter: "#b3e0ff",
      instagram: "#ffc2d1",
      facebook: "#c4d0ff",
      tiktok: "#b8e6d8",
    };
    return colors[platform?.toLowerCase()] || "#e0d4ff";
  };

  const getPlatformIcon = (platform: string) => {
    const icons: { [key: string]: string } = {
      linkedin: "💼",
      twitter: "𝕏",
      instagram: "📸",
      facebook: "📘",
      tiktok: "🎵",
    };
    return icons[platform?.toLowerCase()] || "📝";
  };

  // Generate days for Month view
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay();
  const daysInMonth = endOfMonth.getDate();
  const offset = startDay === 0 ? 6 : startDay - 1;

  const monthDays: (number | null)[] = [];
  for (let i = 0; i < offset; i++) monthDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) monthDays.push(d);

  // Generate days for Week view
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + (currentDate.getDay() === 0 ? -6 : 1)); // Monday start

  const weekDays: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    weekDays.push(day);
  }

  return (
    <div style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      background: "#fdfaf7",
      borderRadius: "20px",
      overflow: "hidden",
      boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
    }}>
      {/* HEADER */}
      <div style={{ padding: "28px 32px", borderBottom: "1px solid #f0e9e2", background: "white" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <button onClick={() => { setCurrentDate(new Date()); setSelectedDay(null); }} 
              style={{ padding: "10px 20px", border: "none", borderRadius: "9999px", background: "#f8e8d9", color: "#e07a5f", fontWeight: 600, cursor: "pointer" }}>
              Today
            </button>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={goPrev} style={{ width: 42, height: 42, borderRadius: "50%", background: "#f8f4ef", fontSize: "18px", border: "none", cursor: "pointer" }}>←</button>
              <button onClick={goNext} style={{ width: 42, height: 42, borderRadius: "50%", background: "#f8f4ef", fontSize: "18px", border: "none", cursor: "pointer" }}>→</button>
            </div>

            <h2 style={{ margin: 0, fontSize: "28px", fontWeight: 700, color: "#2c2c2c" }}>
              {viewMode === "month" && currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
              {viewMode === "week" && `${weekDays[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${weekDays[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`}
              {viewMode === "day" && selectedDay?.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h2>
          </div>

          {/* View Switch */}
          <div style={{ display: "flex", background: "#f8f4ef", borderRadius: "9999px", padding: "4px" }}>
            {(["month", "week", "day"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setViewMode(mode);
                  if (mode === "day" && !selectedDay) setSelectedDay(currentDate);
                }}
                style={{
                  padding: "8px 20px",
                  borderRadius: "9999px",
                  border: "none",
                  background: viewMode === mode ? "#e07a5f" : "transparent",
                  color: viewMode === mode ? "white" : "#6b5e55",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.3s"
                }}
              >
                {mode === "month" ? "Mois" : mode === "week" ? "Semaine" : "Jour"}
              </button>
            ))}
          </div>
        </div>

        {/* Weekday Headers (Month & Week) */}
        {(viewMode === "month" || viewMode === "week") && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", fontSize: "13px", fontWeight: 600, color: "#9c8e7f", textAlign: "center" }}>
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
              <div key={d} style={{ padding: "12px 0" }}>{d}</div>
            ))}
          </div>
        )}
      </div>

      {/* CONTENT AREA */}
      <div style={{ flex: 1, padding: "24px", overflow: "auto" }}>
        {/* ==================== MONTH VIEW ==================== */}
        {viewMode === "month" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "12px" }}>
            {monthDays.map((day, i) => {
              if (!day) return <div key={i} style={{ minHeight: "148px" }} />;
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              const dayPosts = getPostsForDay(date);
              const today = isToday(date);

              return (
                <div
                  key={i}
                  onClick={() => { setViewMode("day"); setSelectedDay(date); }}
                  className="calendar-day"
                  style={{
                    background: "white",
                    border: today ? "2px solid #e07a5f" : "1px solid #f0e9e2",
                    borderRadius: "20px",
                    minHeight: "148px",
                    padding: "14px",
                    cursor: "pointer",
                    transition: "all 0.3s",
                  }}
                >
                  {/* ... same beautiful day card as before ... */}
                  <div style={{ fontWeight: today ? 700 : 600, fontSize: "17px", color: today ? "#e07a5f" : "#4a4038", marginBottom: "12px" }}>
                    {day}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {dayPosts.slice(0, 3).map((p, idx) => (
                      <div key={idx} style={{
                        fontSize: "12.5px",
                        padding: "7px 10px",
                        borderRadius: "12px",
                        background: getPlatformColor(p.platform) + "88",
                        color: "#3f2e2a",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}>
                        <span>{getPlatformIcon(p.platform)}</span>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{p.caption?.slice(0, 25)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ==================== WEEK VIEW ==================== */}
        {viewMode === "week" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "12px" }}>
            {weekDays.map((date, i) => {
              const dayPosts = getPostsForDay(date);
              const today = isToday(date);

              return (
                <div
                  key={i}
                  onClick={() => { setViewMode("day"); setSelectedDay(date); }}
                  style={{
                    background: "white",
                    border: today ? "2px solid #e07a5f" : "1px solid #f0e9e2",
                    borderRadius: "20px",
                    padding: "16px",
                    minHeight: "520px",
                    cursor: "pointer",
                    transition: "all 0.3s"
                  }}
                >
                  <div style={{ textAlign: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: "15px", color: "#9c8e7f" }}>{date.toLocaleDateString('fr-FR', { weekday: 'short' })}</div>
                    <div style={{ fontSize: "28px", fontWeight: 700, color: today ? "#e07a5f" : "#2c2c2c" }}>
                      {date.getDate()}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {dayPosts.length > 0 ? (
                      dayPosts.map((p, idx) => (
                        <div key={idx} style={{
                          padding: "10px",
                          borderRadius: "14px",
                          background: getPlatformColor(p.platform) + "99",
                          fontSize: "13px"
                        }}>
                          <span style={{ marginRight: 8 }}>{getPlatformIcon(p.platform)}</span>
                          {p.caption}
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: "center", color: "#aaa", marginTop: 40 }}>Aucun post</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ==================== DAY VIEW ==================== */}
        {viewMode === "day" && selectedDay && (
          <div style={{ maxWidth: "700px", margin: "0 auto" }}>
            <div style={{
              background: "white",
              borderRadius: "24px",
              padding: "32px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.06)"
            }}>
              <h3 style={{ textAlign: "center", marginBottom: 24, fontSize: "26px" }}>
                {selectedDay.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {getPostsForDay(selectedDay).length > 0 ? (
                  getPostsForDay(selectedDay).map((p, idx) => (
                    <div key={idx} style={{
                      padding: "18px",
                      borderRadius: "16px",
                      background: getPlatformColor(p.platform) + "55",
                      borderLeft: `5px solid ${getPlatformColor(p.platform)}`
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                        <span style={{ fontSize: "24px" }}>{getPlatformIcon(p.platform)}</span>
                        <strong>{p.platform}</strong>
                      </div>
                      <p style={{ margin: 0, lineHeight: 1.5 }}>{p.caption}</p>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: "center", padding: "60px", color: "#aaa" }}>
                    Aucun post prévu ce jour-là
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .calendar-day:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 30px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}