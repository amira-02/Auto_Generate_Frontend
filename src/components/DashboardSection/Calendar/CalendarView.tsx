// src/components/DashboardSection/Calendar/CalendarView.tsx
import { useState, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Platform =
  | "linkedin" | "twitter" | "instagram"
  | "facebook" | "tiktok"  | "threads";

type Post = {
  id: number;
  topicId: number;
  topicName: string;
  hashtags: string | null;
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
  token: string;    // ✅ JWT passé depuis Dashboard
  apiBase: string;  // ✅ ex: "https://localhost:7079"
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth()    === b.getMonth()    &&
  a.getDate()     === b.getDate();

const isToday = (date: Date) => isSameDay(date, new Date());

const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const parsePost = (raw: string | null): Date | null => {
  if (!raw) return null;
  const s = raw.endsWith("Z") ? raw : raw + "Z";
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

const PLATFORM_ICONS: Record<string, string> = {
  linkedin: "💼", twitter: "𝕏", instagram: "📸",
  facebook: "📘", tiktok: "🎵", threads: "🧵",
};
const getIcon = (p?: string) => PLATFORM_ICONS[p?.toLowerCase() ?? ""] ?? "📝";

const colors = {
  primary: "#f08080",
  light:   "#fff5f5",
  softer:  "#ffeaea",
  border:  "#f3d6d6",
  text:    "#5a3e3e",
  muted:   "#a88",
};

// ─── API ──────────────────────────────────────────────────────────────────────

const rescheduleApi = async (
  postId: number,
  scheduledAt: string,
  token: string,
  apiBase: string,
): Promise<void> => {
  const res = await fetch(`${apiBase}/api/posts/${postId}/reschedule`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ scheduledAt }),
  });
  if (!res.ok) throw new Error(await res.text());
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function CalendarView({ posts: initialPosts, token, apiBase }: Props) {
  const [posts, setPosts]               = useState<Post[]>(initialPosts);
  const [currentDate, setCurrentDate]   = useState(new Date());
  const [viewMode, setViewMode]         = useState<"month" | "week" | "day">("month");
  const [selectedDay, setSelectedDay]   = useState<Date | null>(null);
  const [dragOverKey, setDragOverKey]   = useState<string | null>(null);
  const [toast, setToast]               = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const dragIdRef      = useRef<number | null>(null);
  const dragCounterRef = useRef<Record<string, number>>({});

  // ─── Toast ────────────────────────────────────────────────────────────────

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── Reschedule ───────────────────────────────────────────────────────────

  const reschedulePost = useCallback(async (postId: number, newDate: Date) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const oldDate = parsePost(post.scheduledAt);
    const oldTime = oldDate
      ? `${String(oldDate.getUTCHours()).padStart(2, "0")}:${String(oldDate.getUTCMinutes()).padStart(2, "0")}:00`
      : "09:00:00";

    const newISO =
      `${newDate.getFullYear()}-` +
      `${String(newDate.getMonth() + 1).padStart(2, "0")}-` +
      `${String(newDate.getDate()).padStart(2, "0")}T${oldTime}`;

    // Optimistic update
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, scheduledAt: newISO } : p));

    try {
      await rescheduleApi(postId, newISO, token, apiBase);
      showToast(`Déplacé au ${newDate.toLocaleDateString("fr-FR")}`);
    } catch (err) {
      console.error("Reschedule failed:", err);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, scheduledAt: post.scheduledAt } : p));
      showToast("Erreur lors du déplacement", "err");
    }
  }, [posts, token, apiBase]);

  // ─── Drag handlers ────────────────────────────────────────────────────────

  const onChipDragStart = (e: React.DragEvent, postId: number) => {
    dragIdRef.current = postId;
    e.dataTransfer.effectAllowed = "move";
    (e.currentTarget as HTMLElement).style.opacity = "0.4";
  };

  const onChipDragEnd = (e: React.DragEvent) => {
    dragIdRef.current = null;
    (e.currentTarget as HTMLElement).style.opacity = "1";
  };

  const onCellDragEnter = (e: React.DragEvent, key: string) => {
    e.preventDefault();
    dragCounterRef.current[key] = (dragCounterRef.current[key] ?? 0) + 1;
    setDragOverKey(key);
  };

  const onCellDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onCellDragLeave = (e: React.DragEvent, key: string) => {
    dragCounterRef.current[key] = (dragCounterRef.current[key] ?? 1) - 1;
    if (dragCounterRef.current[key] <= 0) {
      dragCounterRef.current[key] = 0;
      setDragOverKey(prev => prev === key ? null : prev);
    }
  };

  const onCellDrop = (e: React.DragEvent, date: Date, key: string) => {
    e.preventDefault();
    dragCounterRef.current[key] = 0;
    setDragOverKey(null);
    if (dragIdRef.current !== null) reschedulePost(dragIdRef.current, date);
  };

  // ─── Calendar logic ───────────────────────────────────────────────────────

  const getPostsForDay = (date: Date) =>
    posts.filter(p => {
      const d = parsePost(p.scheduledAt);
      return d !== null && isSameDay(d, date);
    });

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth  = new Date(year, month + 1, 0);
  const offset       = (firstOfMonth.getDay() + 6) % 7;

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
    if (viewMode === "month")     d.setMonth(d.getMonth() + dir);
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

  // ─── Styles ───────────────────────────────────────────────────────────────

  const cellStyle = (date: Date): React.CSSProperties => {
    const isOver = dragOverKey === toDateKey(date);
    return {
      border:       isToday(date)
        ? `2px solid ${colors.primary}`
        : isOver
          ? `2px dashed ${colors.primary}`
          : `1px solid ${colors.border}`,
      minHeight:    110,
      padding:      10,
      borderRadius: 14,
      cursor:       "pointer",
      background:   isOver ? colors.softer : "#fff",
      boxShadow:    "0 4px 10px rgba(0,0,0,0.04)",
      transition:   "background .15s, border .15s",
    };
  };

  const chipStyle: React.CSSProperties = {
    fontSize:     12,
    background:   colors.softer,
    borderRadius: 8,
    padding:      "4px 6px",
    marginTop:    6,
    whiteSpace:   "nowrap",
    overflow:     "hidden",
    textOverflow: "ellipsis",
    color:        colors.text,
    cursor:       "grab",
    userSelect:   "none",
    display:      "flex",
    alignItems:   "center",
    gap:          4,
    transition:   "opacity .15s",
  };

  const navBtn: React.CSSProperties = {
    padding:      "6px 12px",
    borderRadius: 20,
    border:       `1px solid ${colors.border}`,
    cursor:       "pointer",
    background:   "#fff",
    color:        colors.text,
  };

  const headerLabel = () => {
    if (viewMode === "month")
      return currentDate.toLocaleString("fr-FR", { month: "long", year: "numeric" });
    if (viewMode === "week")
      return `${weekDays[0].toLocaleDateString("fr-FR")} – ${weekDays[6].toLocaleDateString("fr-FR")}`;
    if (viewMode === "day" && selectedDay)
      return selectedDay.toLocaleDateString("fr-FR", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      });
    return "";
  };

  // ─── Renderers ────────────────────────────────────────────────────────────

  const renderChip = (p: Post) => (
    <div
      key={p.id}
      draggable
      onDragStart={e => onChipDragStart(e, p.id)}
      onDragEnd={onChipDragEnd}
      style={chipStyle}
      title={p.caption ?? p.topicName}
    >
      <span style={{ fontSize: 14, lineHeight: 1 }}>{getIcon(p.platforms?.[0])}</span>
      <span>{(p.caption ?? p.topicName).slice(0, 18)}</span>
    </div>
  );

  const renderCell = (date: Date, dayNum: number) => {
    const key      = toDateKey(date);
    const dayPosts = getPostsForDay(date);
    return (
      <div
        key={key}
        style={cellStyle(date)}
        onClick={() => { setViewMode("day"); setSelectedDay(date); }}
        onDragEnter={e => onCellDragEnter(e, key)}
        onDragOver={onCellDragOver}
        onDragLeave={e => onCellDragLeave(e, key)}
        onDrop={e => onCellDrop(e, date, key)}
      >
        <strong style={{ fontSize: 13, color: isToday(date) ? colors.primary : colors.text }}>
          {dayNum}
        </strong>
        {dayPosts.map(renderChip)}
      </div>
    );
  };

  // ─── JSX ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", fontFamily: "sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position:      "fixed",
          bottom:        24,
          right:         24,
          zIndex:        9999,
          background:    toast.type === "err" ? "#c0392b" : "#2c3e50",
          color:         "#fff",
          padding:       "10px 20px",
          borderRadius:  10,
          fontSize:      13,
          boxShadow:     "0 4px 14px rgba(0,0,0,0.2)",
          pointerEvents: "none",
          animation:     "fadeIn .2s ease",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{
        padding:      "14px 20px",
        background:   "#fff",
        borderBottom: `1px solid ${colors.border}`,
        display:      "flex",
        alignItems:   "center",
        gap:          12,
        flexWrap:     "wrap",
        boxShadow:    "0 2px 6px rgba(0,0,0,0.03)",
      }}>
        <button
          onClick={() => { const t = new Date(); setCurrentDate(t); setSelectedDay(t); }}
          style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${colors.border}`, background: colors.light, cursor: "pointer", color: colors.text }}
        >
          Aujourd'hui
        </button>

        <button onClick={() => navigate(-1)} style={navBtn}>‹</button>
        <button onClick={() => navigate(1)}  style={navBtn}>›</button>

        <h2 style={{ margin: 0, fontSize: 18, flex: 1, color: colors.text, textTransform: "capitalize" }}>
          {headerLabel()}
        </h2>

        <div style={{ display: "flex", gap: 6 }}>
          {(["month", "week", "day"] as const).map(m => (
            <button
              key={m}
              onClick={() => { setViewMode(m); if (m === "day" && !selectedDay) setSelectedDay(currentDate); }}
              style={{
                padding:      "6px 14px",
                borderRadius: 20,
                border:       `1px solid ${colors.border}`,
                cursor:       "pointer",
                background:   viewMode === m ? colors.primary : "#fff",
                color:        viewMode === m ? "#fff" : colors.text,
              }}
            >
              {m === "month" ? "Mois" : m === "week" ? "Semaine" : "Jour"}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: "auto", padding: 16, background: colors.light }}>

        {/* MONTH */}
        {viewMode === "month" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8, marginBottom: 6 }}>
              {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map(d => (
                <div key={d} style={{ textAlign: "center", fontSize: 12, color: colors.muted }}>{d}</div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 10 }}>
              {monthDays.map((day, i) =>
                day === null
                  ? <div key={`e-${i}`} />
                  : renderCell(new Date(year, month, day), day)
              )}
            </div>
          </>
        )}

        {/* WEEK */}
        {viewMode === "week" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 10 }}>
            {weekDays.map(date => renderCell(date, date.getDate()))}
          </div>
        )}

        {/* DAY */}
        {viewMode === "day" && selectedDay && (
          <div style={{ maxWidth: 620, margin: "0 auto" }}>
            <h3 style={{ color: colors.text, textTransform: "capitalize", marginBottom: 16 }}>
              {selectedDay.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </h3>

            {getPostsForDay(selectedDay).length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0", color: colors.muted, fontSize: 14 }}>
                Aucun post planifié ce jour.
              </div>
            )}

            {getPostsForDay(selectedDay).map(p => {
              const d = parsePost(p.scheduledAt);
              return (
                <div key={p.id} style={{
                  background:   "#fff",
                  border:       `1px solid ${colors.border}`,
                  borderRadius: 16,
                  padding:      18,
                  marginBottom: 14,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <strong style={{ color: colors.text, fontSize: 15 }}>{p.topicName}</strong>
                      {d && (
                        <div style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                          {d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {p.platforms?.map(plat => (
                        <span key={plat} style={{
                          fontSize: 11, background: colors.softer,
                          color: colors.text, padding: "2px 8px", borderRadius: 20,
                        }}>
                          {getIcon(plat)} {plat}
                        </span>
                      ))}
                    </div>
                  </div>

                  {p.caption && (
                    <p style={{ margin: "10px 0 0", color: colors.text, fontSize: 14, lineHeight: 1.6 }}>
                      {p.caption}
                    </p>
                  )}

                  {p.hashtags && (
                    <p style={{ margin: "6px 0 0", fontSize: 12, color: colors.primary }}>
                      {p.hashtags}
                    </p>
                  )}

                  {p.imageUrl && (
                    <img
                      src={p.imageUrl}
                      alt=""
                      style={{ marginTop: 10, width: "100%", borderRadius: 10, objectFit: "cover", maxHeight: 200 }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>
    </div>
  );
}