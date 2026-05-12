import { useState, useRef, useCallback, useEffect } from "react";

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
  token: string;
  apiBase: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth()    === b.getMonth()    &&
  a.getDate()     === b.getDate();

const isToday = (date: Date) => isSameDay(date, new Date());

const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const parseDate = (raw: string | null): Date | null => {
  if (!raw) return null;
  const s = raw.endsWith("Z") ? raw : raw + "Z";
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

const isPublished = (p: Post) => p.status?.toLowerCase() === "published";

const PLATFORM_ICONS: Record<string, string> = {
  linkedin: "💼", twitter: "𝕏", instagram: "📸",
  facebook: "📘", tiktok: "🎵", threads: "🧵",
};
const getIcon = (p?: string) => PLATFORM_ICONS[p?.toLowerCase() ?? ""] ?? "📝";

const normalizePlatforms = (platforms: unknown): string[] => {
  if (Array.isArray(platforms)) return platforms.map(String);
  if (typeof platforms === "string") {
    const raw = platforms.trim();
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch { /* fallback */ }
    return raw.split(",").map(s => s.trim()).filter(Boolean);
  }
  return [];
};

// Palette de couleurs pour les post cards (comme l'image)
const POST_COLORS = [
  { bg: "#e8f4fd", text: "#1a6fa8", border: "#bde0f5" },
  { bg: "#fef3e2", text: "#b45309", border: "#fcd89a" },
  { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
  { bg: "#fdf4ff", text: "#7e22ce", border: "#e9d5ff" },
  { bg: "#fff1f2", text: "#be123c", border: "#fecdd3" },
  { bg: "#f0f9ff", text: "#0369a1", border: "#bae6fd" },
];
const getPostColor = (id: number) => POST_COLORS[id % POST_COLORS.length];

// ─── API ──────────────────────────────────────────────────────────────────────

const rescheduleApi = async (postId: number, scheduledAt: string, token: string, apiBase: string) => {
  const res = await fetch(`${apiBase}/api/posts/${postId}/params`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ scheduledAt }),
  });
  if (!res.ok) throw new Error(await res.text());
};

// ─── Mini Calendar (left panel) ───────────────────────────────────────────────

function MiniCalendar({
  currentDate, selectedDay,
  onSelectDay, onNavigate,
}: {
  currentDate: Date;
  selectedDay: Date | null;
  onSelectDay: (d: Date) => void;
  onNavigate: (dir: -1 | 1) => void;
}) {
  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth  = new Date(year, month + 1, 0);
  const offset = (firstOfMonth.getDay() + 6) % 7;

  const days: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: lastOfMonth.getDate() }, (_, i) => i + 1),
  ];

  const monthName = currentDate.toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div style={{ padding: "20px 16px" }}>
      {/* Month nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{monthName}</span>
        <div style={{ display: "flex", gap: 4 }}>
          {([-1, 1] as const).map(dir => (
            <button key={dir} onClick={() => onNavigate(dir)} style={{
              width: 26, height: 26, borderRadius: 8, border: "1px solid #f0f0f0",
              background: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 12, color: "#64748b",
            }}>
              {dir === -1 ? "‹" : "›"}
            </button>
          ))}
        </div>
      </div>

      {/* Day labels */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
        {["S","M","T","W","T","F","S"].map((d, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 10, color: "#94a3b8", fontWeight: 600, padding: "4px 0" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {days.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const date = new Date(year, month, day);
          const today = isToday(date);
          const selected = selectedDay ? isSameDay(date, selectedDay) : false;
          return (
            <button key={day} onClick={() => onSelectDay(date)} style={{
              width: "100%", aspectRatio: "1", borderRadius: 8, border: "none",
              background: today ? "#e65787" : selected ? "#fff1f3" : "transparent",
              color: today ? "#fff" : selected ? "#e65787" : "#374151",
              fontSize: 12, fontWeight: today || selected ? 700 : 400,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CalendarView({ posts: initialPosts, token, apiBase }: Props) {
  const [posts, setPosts]             = useState<Post[]>(initialPosts);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode]       = useState<"month" | "week" | "day">("week");
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [toast, setToast]             = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const dragIdRef      = useRef<number | null>(null);
  const dragCounterRef = useRef<Record<string, number>>({});
  const dayTimelineRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { setPosts(initialPosts); }, [initialPosts]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${apiBase}/api/posts`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setPosts(await res.json());
      } catch (err) { console.error("Auto-refresh failed:", err); }
    }, 60_000);
    return () => clearInterval(interval);
  }, [token, apiBase]);

  useEffect(() => {
    if (viewMode !== "day" || !dayTimelineRef.current) return;
    const timeline = dayTimelineRef.current;
    const hourSlotHeight = 84;
    const now = new Date();
    const targetHour = isSameDay(selectedDay, now) ? now.getHours() : 8;
    timeline.scrollTo({
      top: Math.max(0, (targetHour - 1) * hourSlotHeight),
      behavior: "smooth",
    });
  }, [viewMode, selectedDay]);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── Reschedule ─────────────────────────────────────────────────────────────

  const reschedulePost = useCallback(async (postId: number, newDate: Date) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    if (isPublished(post)) { showToast("Already published — cannot reschedule.", "err"); return; }

    const oldDate = parseDate(post.scheduledAt);
    const oldTime = oldDate
      ? `${String(oldDate.getUTCHours()).padStart(2, "0")}:${String(oldDate.getUTCMinutes()).padStart(2, "0")}:00`
      : "09:00:00";

    const newISO =
      `${newDate.getFullYear()}-` +
      `${String(newDate.getMonth() + 1).padStart(2, "0")}-` +
      `${String(newDate.getDate()).padStart(2, "0")}T${oldTime}`;

    setPosts(prev => prev.map(p => p.id === postId ? { ...p, scheduledAt: newISO } : p));
    try {
      await rescheduleApi(postId, newISO, token, apiBase);
      showToast(`Moved to ${newDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`);
    } catch {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, scheduledAt: post.scheduledAt } : p));
      showToast("Failed to reschedule", "err");
    }
  }, [posts, token, apiBase]);

  // ─── Drag ────────────────────────────────────────────────────────────────────

  const onChipDragStart = (e: React.DragEvent, post: Post) => {
    if (isPublished(post)) { e.preventDefault(); return; }
    dragIdRef.current = post.id;
    e.dataTransfer.effectAllowed = "move";
    (e.currentTarget as HTMLElement).style.opacity = "0.5";
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
  const onCellDragOver  = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const onCellDragLeave = (key: string) => {
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

  // ─── Calendar logic ──────────────────────────────────────────────────────────

  const getPostsForDay = (date: Date) =>
    posts.filter(p => { const d = parseDate(p.scheduledAt); return d !== null && isSameDay(d, date); });

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const offset = (firstOfMonth.getDay() + 6) % 7;
  const monthCells = Array.from({ length: 42 }, (_, i) => {
    const dayOffset = i - offset;
    return new Date(year, month, dayOffset + 1);
  });

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
    else { const nd = new Date(selectedDay); nd.setDate(nd.getDate() + dir); setSelectedDay(nd); setCurrentDate(nd); return; }
    setCurrentDate(d);
  };

  const headerDate = () => {
    if (viewMode === "month") return currentDate.toLocaleString("en-US", { month: "long", year: "numeric" });
    if (viewMode === "week")  return `${weekDays[0].toLocaleString("en-US", { month: "long", day: "numeric" })} – ${weekDays[6].toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;
    return selectedDay.toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  };

  // ─── Post card renderer ───────────────────────────────────────────────────────

  const renderPostCard = (p: Post, compact = false) => {
    const published = isPublished(p);
    const color = published
      ? { bg: "#f3f4f6", text: "#9ca3af", border: "#e5e7eb" }
      : getPostColor(p.id);
    const platforms = normalizePlatforms(p.platforms);
    const d = parseDate(p.scheduledAt);

    if (compact) {
      return (
        <div
          key={p.id}
          draggable={!published}
          onDragStart={e => onChipDragStart(e, p)}
          onDragEnd={onChipDragEnd}
          title={published ? "✅ Published" : (p.caption ?? p.topicName)}
          style={{
            background: color.bg,
            border: `1px solid ${color.border}`,
            borderRadius: 8,
            padding: "6px 8px",
            marginTop: 4,
            cursor: published ? "not-allowed" : "grab",
            opacity: published ? 0.65 : 1,
            transition: "opacity .15s",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: color.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {published ? "✅ " : `${getIcon(platforms[0])} `}
            {(p.caption ?? p.topicName).slice(0, 22)}
          </div>
          {d && (
            <div style={{ fontSize: 10, color: color.text, opacity: 0.75, marginTop: 2 }}>
              {d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </div>
          )}
        </div>
      );
    }

    // Full card (week/day view)
    return (
      <div
        key={p.id}
        draggable={!published}
        onDragStart={e => onChipDragStart(e, p)}
        onDragEnd={onChipDragEnd}
        style={{
          background: color.bg,
          border: `1px solid ${color.border}`,
          borderRadius: 12,
          padding: "10px 12px",
          marginBottom: 8,
          cursor: published ? "not-allowed" : "grab",
          opacity: published ? 0.65 : 1,
          transition: "opacity .15s, transform .1s",
        }}
        onMouseEnter={e => { if (!published) (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: color.text, marginBottom: 2 }}>
          {p.topicName}
        </div>
        {p.caption && (
          <div style={{
            fontSize: 11, color: color.text, opacity: 0.8, lineHeight: 1.4,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {p.caption}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
          {d && (
            <div style={{ fontSize: 10, color: color.text, opacity: 0.7, display: "flex", alignItems: "center", gap: 3 }}>
              🕐 {d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </div>
          )}
          <div style={{ display: "flex", gap: 3 }}>
            {platforms.slice(0, 2).map(pl => (
              <span key={pl} style={{ fontSize: 12 }}>{getIcon(pl)}</span>
            ))}
            {published && <span style={{ fontSize: 10, background: "#d1fae5", color: "#065f46", padding: "1px 6px", borderRadius: 10, fontWeight: 600 }}>Published</span>}
          </div>
        </div>
      </div>
    );
  };

  // ─── Month cell ───────────────────────────────────────────────────────────────

  const renderMonthCell = (date: Date) => {
    const key      = toDateKey(date);
    const dayPosts = getPostsForDay(date);
    const isOver   = dragOverKey === key;
    const today    = isToday(date);
    const selected = isSameDay(date, selectedDay);
    const isCurrentMonth = date.getMonth() === month;
    const dayNum = date.getDate();

    return (
      <div
        key={key}
        onClick={() => { setSelectedDay(date); setCurrentDate(date); setViewMode("day"); }}
        onDragEnter={e => onCellDragEnter(e, key)}
        onDragOver={onCellDragOver}
        onDragLeave={() => onCellDragLeave(key)}
        onDrop={e => onCellDrop(e, date, key)}
        style={{
          minHeight: 100, padding: "8px 6px", borderRadius: 10, cursor: "pointer",
          background: isOver ? "#fff1f3" : selected ? "#fafafe" : isCurrentMonth ? "#fff" : "#f8fafc",
          border: today ? "2px solid #e65787" : isOver ? "2px dashed #e65787" : "1px solid #f0f0f0",
          transition: "background .1s, border .1s",
        }}
      >
        <div style={{
          width: 24, height: 24, borderRadius: "50%", marginBottom: 4,
          background: today ? "#e65787" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: today ? "#fff" : isCurrentMonth ? "#374151" : "#94a3b8" }}>
            {dayNum}
          </span>
        </div>
        {dayPosts.slice(0, 2).map(p => renderPostCard(p, true))}
        {dayPosts.length > 2 && (
          <div style={{ fontSize: 10, color: "#e65787", fontWeight: 600, marginTop: 4 }}>
            +{dayPosts.length - 2} more
          </div>
        )}
      </div>
    );
  };

  // ─── Week column ─────────────────────────────────────────────────────────────

  const renderWeekCol = (date: Date) => {
    const key      = toDateKey(date);
    const dayPosts = getPostsForDay(date);
    const isOver   = dragOverKey === key;
    const today    = isToday(date);
    const selected = isSameDay(date, selectedDay);

    return (
      <div key={key} style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Day header */}
        <div
          onClick={() => { setSelectedDay(date); setCurrentDate(date); }}
          style={{
            padding: "12px 8px", borderRadius: "10px 10px 0 0", cursor: "pointer",
            background: today ? "#e65787" : selected ? "#fff1f3" : "#fff",
            border: "1px solid #f0f0f0", borderBottom: "none", textAlign: "center",
            transition: "background .1s",
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 600, color: today ? "#ed8faf" : "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {date.toLocaleString("en-US", { weekday: "short" })}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: today ? "#fff" : "#0f172a", lineHeight: 1.2, marginTop: 2 }}>
            {date.getDate()}
          </div>
        </div>

        {/* Posts */}
        <div
          onDragEnter={e => onCellDragEnter(e, key)}
          onDragOver={onCellDragOver}
          onDragLeave={() => onCellDragLeave(key)}
          onDrop={e => onCellDrop(e, date, key)}
          style={{
            flex: 1, padding: 8, minHeight: 200,
            background: isOver ? "#f8f8ff" : "#fafafa",
            border: `1px solid ${isOver ? "#e65787" : "#f0f0f0"}`,
            borderTop: "none", borderRadius: "0 0 10px 10px",
            transition: "background .1s, border .1s",
          }}
        >
          {dayPosts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 8px", color: "#cbd5e1", fontSize: 11 }}>
              No posts
            </div>
          ) : (
            dayPosts.map(p => renderPostCard(p, false))
          )}
        </div>
      </div>
    );
  };

  // ─── JSX ─────────────────────────────────────────────────────────────────────

  return (
    <div style={{
      height: "100%", display: "flex", flexDirection: "column",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      background: "#f8f9fb",
    }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          background: toast.type === "err" ? "#ef4444" : "#0f172a",
          color: "#fff", padding: "10px 20px", borderRadius: 10,
          fontSize: 13, boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
          pointerEvents: "none", animation: "fadeIn .2s ease",
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: "#fff", borderRadius: 14,
        border: "1px solid #f0f0f0",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        padding: "12px 18px",
        display: "flex", alignItems: "center", gap: 12,
        marginBottom: 16, flexShrink: 0, flexWrap: "wrap",
      }}>

        {/* Title */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: "#fff1f3",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15,
          }}>▦</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Calendar</span>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 22, background: "#f0f0f0" }} />

        {/* Stats pills */}
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { label: "Scheduled", value: posts.filter(p => p.status?.toLowerCase() === "scheduled").length, accent: "#e65787" },
            { label: "Published",  value: posts.filter(p => p.status?.toLowerCase() === "published").length,  accent: "#10b981" },
            { label: "Total",      value: posts.length,                                                        accent: "#e65787" },
          ].map(({ label, value, accent }) => (
            <div key={label} style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "4px 11px", borderRadius: 20,
              background: accent + "10", border: `1px solid ${accent}20`,
            }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: accent }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{value}</span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* View switcher */}
        <div style={{
          display: "flex", background: "#f8f9fb",
          borderRadius: 10, padding: 3, border: "1px solid #f0f0f0",
        }}>
          {(["day", "week", "month"] as const).map(m => (
            <button
              key={m}
              onClick={() => { setViewMode(m); if (m === "day") setSelectedDay(selectedDay ?? currentDate); }}
              style={{
                padding: "5px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                background: viewMode === m ? "#fff" : "transparent",
                color: viewMode === m ? "#0f172a" : "#94a3b8",
                fontSize: 12, fontWeight: viewMode === m ? 600 : 400,
                boxShadow: viewMode === m ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                transition: "all .15s",
              }}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        {/* Nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={() => navigate(-1)} style={{
            width: 30, height: 30, borderRadius: 8, border: "1px solid #f0f0f0",
            background: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 13, color: "#64748b",
          }}>‹</button>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", minWidth: 180, textAlign: "center" }}>
            {headerDate()}
          </span>
          <button onClick={() => navigate(1)} style={{
            width: 30, height: 30, borderRadius: 8, border: "1px solid #f0f0f0",
            background: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 13, color: "#64748b",
          }}>›</button>
        </div>

        {/* Today */}
        <button
          onClick={() => { const t = new Date(); setCurrentDate(t); setSelectedDay(t); }}
          style={{
            padding: "6px 14px", borderRadius: 8, border: "1px solid #f0f0f0",
            background: "#fff", cursor: "pointer", fontSize: 12, color: "#64748b",
            fontWeight: 500,
          }}
        >
          Today
        </button>
      </div>

      {/* ── Main layout ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, gap: 16, overflow: "hidden" }}>

        {/* ── Left Panel ──────────────────────────────────────────────────── */}
        <div style={{
          width: 240, flexShrink: 0, background: "#fff",
          borderRadius: 16, border: "1px solid #f0f0f0",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>
          <MiniCalendar
            currentDate={currentDate}
            selectedDay={selectedDay}
            onSelectDay={d => { setSelectedDay(d); setCurrentDate(d); setViewMode("day"); }}
            onNavigate={dir => {
              const d = new Date(currentDate);
              d.setMonth(d.getMonth() + dir);
              setCurrentDate(d);
            }}
          />

          {/* Upcoming posts */}
          <div className="hide-scrollbar" style={{ flex: 1, padding: "0 16px 16px", overflow: "auto" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              Upcoming
            </div>
            {posts
              .filter(p => {
                const d = parseDate(p.scheduledAt);
                return d && d >= new Date() && !isPublished(p);
              })
              .sort((a, b) => (parseDate(a.scheduledAt)?.getTime() ?? 0) - (parseDate(b.scheduledAt)?.getTime() ?? 0))
              .slice(0, 4)
              .map(p => {
                const d = parseDate(p.scheduledAt);
                const platforms = normalizePlatforms(p.platforms);
                return (
                  <div key={p.id} style={{
                    padding: "8px 10px", borderRadius: 10, marginBottom: 6,
                    background: "#f8f9fb", border: "1px solid #f0f0f0",
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 2 }}>
                      {getIcon(platforms[0])} {p.topicName}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>
                      {d?.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {d?.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                );
              })}
            {posts.filter(p => { const d = parseDate(p.scheduledAt); return d && d >= new Date() && !isPublished(p); }).length === 0 && (
              <div style={{ fontSize: 12, color: "#cbd5e1", textAlign: "center", padding: "16px 0" }}>
                Nothing scheduled
              </div>
            )}
          </div>
        </div>

        {/* ── Right Panel ─────────────────────────────────────────────────── */}
        <div style={{
          flex: 1, background: "#fff", borderRadius: 16,
          border: "1px solid #f0f0f0", display: "flex",
          flexDirection: "column", overflow: "hidden",
        }}>

          {/* Calendar body */}
          <div className="hide-scrollbar" style={{ flex: 1, overflow: "auto", padding: 16 }}>

            {/* WEEK */}
            {viewMode === "week" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8, height: "100%" }}>
                {weekDays.map(date => renderWeekCol(date))}
              </div>
            )}

            {/* MONTH */}
            {viewMode === "month" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, marginBottom: 6 }}>
                  {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
                    <div key={d} style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", fontWeight: 600, padding: "4px 0" }}>
                      {d}
                    </div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
                  {monthCells.map(date => renderMonthCell(date))}
                </div>
              </>
            )}

            {/* DAY */}
            {viewMode === "day" && (
              <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "16px 0 20px",
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: isToday(selectedDay) ? "#e65787" : "#fff1f3",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 10, color: isToday(selectedDay) ? "#ed8faf" : "#e65787", fontWeight: 700, textTransform: "uppercase" }}>
                      {selectedDay.toLocaleString("en-US", { weekday: "short" })}
                    </span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: isToday(selectedDay) ? "#fff" : "#e65787", lineHeight: 1 }}>
                      {selectedDay.getDate()}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                      {selectedDay.toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>
                      {getPostsForDay(selectedDay).length} post{getPostsForDay(selectedDay).length !== 1 ? "s" : ""} scheduled
                    </div>
                  </div>
                </div>

                <div
                  className="hide-scrollbar"
                  ref={dayTimelineRef}
                  style={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: "auto",
                    paddingRight: 4,
                  }}
                >
                  {Array.from({ length: 24 }, (_, hour) => {
                    const hourPosts = getPostsForDay(selectedDay)
                      .filter(p => {
                        const d = parseDate(p.scheduledAt);
                        return d !== null && d.getHours() === hour;
                      })
                      .sort((a, b) => (parseDate(a.scheduledAt)?.getTime() ?? 0) - (parseDate(b.scheduledAt)?.getTime() ?? 0));

                    const hourLabel = new Date(2000, 0, 1, hour, 0).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    });

                    return (
                      <div key={`slot-${hour}`} style={{ display: "flex", gap: 10, minHeight: 84 }}>
                        <div style={{ width: 64, flexShrink: 0, paddingTop: 10 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>{hourLabel}</span>
                        </div>
                        <div style={{ flex: 1, paddingBottom: 8 }}>
                          <div style={{ borderTop: "1px solid #eef2f7", marginBottom: 8 }} />
                          {hourPosts.map(p => {
                            const published = isPublished(p);
                            const color = published
                              ? { bg: "#f3f4f6", text: "#9ca3af", border: "#e5e7eb" }
                              : getPostColor(p.id);
                            const platforms = normalizePlatforms(p.platforms);
                            const d = parseDate(p.scheduledAt);
                            return (
                              <div key={p.id} style={{
                                background: color.bg, border: `1px solid ${color.border}`,
                                borderRadius: 14, padding: 12, marginBottom: 10,
                                opacity: published ? 0.7 : 1,
                              }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                                  <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: color.text }}>{p.topicName}</div>
                                    {d && (
                                      <div style={{ fontSize: 11, color: color.text, opacity: 0.7, marginTop: 2 }}>
                                        🕐 {d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                                      </div>
                                    )}
                                  </div>
                                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                                    {platforms.map(pl => (
                                      <span key={pl} style={{ fontSize: 14 }}>{getIcon(pl)}</span>
                                    ))}
                                    {published && (
                                      <span style={{ fontSize: 10, background: "#d1fae5", color: "#065f46", padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>
                                        Published
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {p.caption && (
                                  <p style={{ margin: 0, fontSize: 13, color: color.text, lineHeight: 1.6 }}>
                                    {p.caption}
                                  </p>
                                )}
                                {p.hashtags && (
                                  <p style={{ margin: "6px 0 0", fontSize: 11, color: color.text, opacity: 0.7 }}>
                                    {p.hashtags}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {getPostsForDay(selectedDay).length === 0 && (
                    <div style={{
                      textAlign: "center", padding: "24px 20px 8px",
                      color: "#94a3b8", fontSize: 13,
                    }}>
                      No posts scheduled for this day
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .hide-scrollbar::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
        }
      `}</style>
    </div>
  );
}