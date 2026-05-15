// src/components/DashboardSection/Notifications/NotificationBell.tsx
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiBell, FiX } from "react-icons/fi";

const API: string = import.meta.env.VITE_API_URL ?? "https://localhost:7079";

type Notif = {
  id:          number;
  title:       string;
  message:     string;
  type:        string;
  referenceId: string;
  isRead:      boolean;
  createdAt:   string;
};

type Props = {
  token:           string | null;
  onExternalTask?: (taskId: number) => void;
};

export default function NotificationBell({ token, onExternalTask }: Props) {
  const [open,    setOpen]    = useState(false);
  const [notifs,  setNotifs]  = useState<Notif[]>([]);
  const [count,   setCount]   = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  // Ferme si clic en dehors
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Poll toutes les 30 secondes
  useEffect(() => {
    if (!token) return;
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const fetchCount = async () => {
    try {
      const res = await fetch(`${API}/api/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCount(data.count);
      }
    } catch {}
  };

  const fetchNotifs = async () => {
    try {
      const res = await fetch(`${API}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setNotifs(await res.json());
    } catch {}
  };

  const handleOpen = () => {
    setOpen(o => !o);
    if (!open) fetchNotifs();
  };

  const markRead = async (id: number) => {
    try {
      await fetch(`${API}/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setCount(c => Math.max(0, c - 1));
    } catch {}
  };

  const handleClick = async (notif: Notif) => {
    if (!notif.isRead) await markRead(notif.id);

    // Si c'est une tâche externe → ouvre le modal de sélection de topic
    if (notif.type === "external_task" && onExternalTask) {
      onExternalTask(Number(notif.referenceId));
      setOpen(false);
    }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Cloche */}
      <button onClick={handleOpen} style={{
        position: "relative", width: 36, height: 36, borderRadius: 10,
        border: "1px solid #f0f0f0", background: open ? "#f8f9fb" : "#fff",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        color: "#64748b",
      }}>
        <FiBell size={16} />
        {count > 0 && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            style={{ position: "absolute", top: -4, right: -4,
              width: 16, height: 16, borderRadius: "50%",
              background: "#ef4444", border: "2px solid #fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, fontWeight: 700, color: "#fff" }}>
            {count > 9 ? "9+" : count}
          </motion.div>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{ position: "absolute", top: 44, right: 0, width: 340,
              background: "#fff", borderRadius: 16,
              border: "1px solid #f0f0f0", zIndex: 9999,
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>

            {/* Header */}
            <div style={{ padding: "14px 16px 10px", display: "flex",
              justifyContent: "space-between", alignItems: "center",
              borderBottom: "1px solid #f0f0f0" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                Notifications {count > 0 && (
                  <span style={{ fontSize: 11, background: "#fef2f2", color: "#ef4444",
                    padding: "1px 6px", borderRadius: 8, marginLeft: 4 }}>{count} new</span>
                )}
              </span>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none",
                cursor: "pointer", color: "#94a3b8", padding: 4 }}>
                <FiX size={14} />
              </button>
            </div>

            {/* Liste */}
            <div style={{ maxHeight: 360, overflowY: "auto" }}>
              {notifs.length === 0 ? (
                <div style={{ padding: "32px 16px", textAlign: "center",
                  fontSize: 12, color: "#cbd5e1" }}>
                  <FiBell size={24} style={{ marginBottom: 8, opacity: 0.4 }} />
                  <div>No notifications yet</div>
                </div>
              ) : notifs.map(n => (
                <div key={n.id}
                  onClick={() => handleClick(n)}
                  style={{ padding: "12px 16px", cursor: "pointer",
                    background: n.isRead ? "transparent" : "#f8faff",
                    borderBottom: "1px solid #f8fafc",
                    display: "flex", gap: 10, alignItems: "flex-start",
                    transition: "background .1s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#f8f9fb"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = n.isRead ? "transparent" : "#f8faff"}>

                  {/* Icône type */}
                  <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                    background: n.type === "external_task" ? "#fef2f2"
                              : n.type === "trello_task"   ? "#eff6ff"
                              : "#f8fafc",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14 }}>
                    {n.type === "external_task" ? "🔗"
                   : n.type === "trello_task"   ? "🟦"
                   : "🔔"}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: n.isRead ? 500 : 700,
                      color: "#0f172a", marginBottom: 4 }}>{n.title}</div>

                    {n.type === "trello_task" ? (
                      <div style={{ fontSize: 11, color: "#374151", lineHeight: 1.6 }}>
                        {n.message.split("\n").map((line, i) => (
                          <div key={i}>{line}</div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.4,
                        display: "-webkit-box", WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {n.message}
                      </div>
                    )}

                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>
                      {timeAgo(n.createdAt)}
                      {n.type === "external_task" && (
                        <span style={{ marginLeft: 6, color: "#dc2626", fontWeight: 600 }}>
                          → Click to assign topic
                        </span>
                      )}
                    </div>
                  </div>

                  {!n.isRead && (
                    <div style={{ width: 8, height: 8, borderRadius: "50%",
                      background: "#dc2626", flexShrink: 0, marginTop: 4 }} />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}