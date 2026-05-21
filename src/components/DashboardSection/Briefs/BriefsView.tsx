import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BriefDetailPanel from "./BriefDetailPanel";

const API = import.meta.env.VITE_API_URL ?? "https://localhost:7079";

type Brief = {
  id:         number;
  cardId:     string;
  title:      string;
  sheetUrl:   string | null;
  due:        string | null;
  labelsJson: string | null;
  cardUrl:    string | null;
  assignedAt: string;
  rowCount:   number;
};

type Props = { clientId: number; token: string | null };

export default function BriefsView({ clientId, token }: Props) {
  const [briefs,   setBriefs]   = useState<Brief[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    if (!clientId || !token) return;
    setSelected(null);
    fetchBriefs();
  }, [clientId, token]);

  const fetchBriefs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/trello/briefs?clientId=${clientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setBriefs(await res.json());
    } catch {}
    finally { setLoading(false); }
  };

  if (selected !== null) {
    return (
      <BriefDetailPanel
        briefId={selected}
        clientId={clientId}
        token={token}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Briefs Trello</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
            Cartes assignées depuis Trello
          </div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
          background: "#eff6ff", color: "#1d4ed8" }}>
          {briefs.length} brief{briefs.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 80, borderRadius: 14, background: "#f8fafc",
              border: "1px solid #f0f0f0", animation: "pulse 1.5s ease infinite" }} />
          ))}
        </div>
      ) : briefs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 20px", background: "#f8fafc",
          borderRadius: 16, border: "1px dashed #e2e8f0" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🟦</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
            Aucun brief Trello assigné
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", maxWidth: 300, margin: "0 auto" }}>
            Les briefs apparaissent ici après avoir été assignés via les notifications Trello.
          </div>
        </div>
      ) : (
        <AnimatePresence>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {briefs.map((b, i) => {
              const labels: string[] = b.labelsJson ? JSON.parse(b.labelsJson) : [];
              const dueDate = b.due ? new Date(b.due) : null;
              const isOverdue = dueDate ? dueDate < new Date() : false;

              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelected(b.id)}
                  style={{ padding: "16px 18px", borderRadius: 14, border: "1.5px solid #e5e7eb",
                    background: "#fff", cursor: "pointer", transition: "all .15s" }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.border = "1.5px solid #1d4ed8";
                    (e.currentTarget as HTMLElement).style.background = "#f8faff";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.border = "1.5px solid #e5e7eb";
                    (e.currentTarget as HTMLElement).style.background = "#fff";
                  }}>

                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    {/* Icon */}
                    <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                      background: "#eff6ff", display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 18 }}>
                      🟦
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Title + arrow */}
                      <div style={{ display: "flex", alignItems: "center",
                        justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          maxWidth: "70%" }}>
                          {b.title}
                        </div>
                        <span style={{ fontSize: 14, color: "#94a3b8" }}>→</span>
                      </div>

                      {/* Badges row */}
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {b.sheetUrl && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px",
                            borderRadius: 6, background: "#f0fdf4", color: "#16a34a" }}>
                            📊 {b.rowCount} lignes
                          </span>
                        )}
                        {dueDate && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px",
                            borderRadius: 6,
                            background: isOverdue ? "#fef2f2" : "#fff7ed",
                            color:      isOverdue ? "#dc2626" : "#ea580c" }}>
                            📅 {dueDate.toLocaleDateString("fr-FR")}
                          </span>
                        )}
                        {labels.map(l => (
                          <span key={l} style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px",
                            borderRadius: 6, background: "#f1f5f9", color: "#475569" }}>
                            🏷 {l}
                          </span>
                        ))}
                        <span style={{ fontSize: 10, color: "#94a3b8", padding: "2px 0",
                          marginLeft: "auto" }}>
                          {new Date(b.assignedAt!).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </div>
  );
}
