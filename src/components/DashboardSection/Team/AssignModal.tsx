import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";

const API = import.meta.env.VITE_API_URL ?? "https://localhost:7079";

type Member = { id: number; name: string | null; email: string; role: string };

type Props = {
  briefTitle: string;
  rowKey: string;
  postId: number | null;
  clientId: number;
  token: string | null;
  onClose: () => void;
  onAssigned: () => void;
  onSelf: () => void; // "Je gère moi-même" → ouvre la popup post
};

const TASK_OPTS = [
  { key: "image",   icon: "🎨", label: "Visuel",         desc: "Créer le visuel" },
  { key: "caption", icon: "✍️",  label: "Rédaction",      desc: "Rédiger le caption" },
  { key: "full",    icon: "🎯", label: "Les deux",        desc: "Visuel + Caption" },
  { key: "self",    icon: "💪", label: "Moi-même",        desc: "Je gère ce post" },
] as const;

function MemberCard({ m, selected, onClick }: {
  m: Member; selected: boolean; onClick: () => void;
}) {
  const color = m.role === "Graphiste" ? "#dc2626" : "#dc2626";
  const letter = (m.name ?? m.email).charAt(0).toUpperCase();
  return (
    <button onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
        borderRadius: 12, border: `2px solid ${selected ? color : "#e5e7eb"}`,
        background: selected ? (m.role === "Graphiste" ? "#fef2f2" : "#eff6ff") : "#fafafa",
        cursor: "pointer", fontFamily: "inherit", width: "100%", textAlign: "left",
        transition: "all .15s" }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: color,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontSize: 14, fontWeight: 800, flexShrink: 0 }}>
        {letter}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>
          {m.name ?? m.email.split("@")[0]}
        </div>
        <div style={{ fontSize: 10, color: "#94a3b8" }}>{m.email}</div>
      </div>
      {selected && <span style={{ fontSize: 16 }}>✓</span>}
    </button>
  );
}

export default function AssignModal({ briefTitle, rowKey, postId, clientId, token, onClose, onAssigned, onSelf }: Props) {
  const [taskType, setTaskType]       = useState<string | null>(null);
  const [members, setMembers]         = useState<Member[]>([]);
  const [selChefVisuel, setSelChefVisuel] = useState<number | null>(null);
  const [selChefRedac,  setSelChefRedac]  = useState<number | null>(null);
  const [notes, setNotes]             = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [msg, setMsg]                 = useState("");

  useEffect(() => {
    fetch(`${API}/api/team`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(setMembers)
      .catch(() => {});
  }, [token]);

  const chefsVisuels = members.filter(m => m.role === "ChefVisuel");
  const chefsRedacs  = members.filter(m => m.role === "ChefRedac");

  const canSubmit = () => {
    if (!taskType || taskType === "self") return false;
    if (taskType === "image")   return !!selChefVisuel;
    if (taskType === "caption") return !!selChefRedac;
    if (taskType === "full")    return !!selChefVisuel && !!selChefRedac;
    return false;
  };

  const postAssignment = async (assignedToUserId: number, type: string) => {
    const res = await fetch(`${API}/api/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ postId, clientId, rowKey, briefTitle, assignedToUserId, taskType: type, notes: notes || null }),
    });
    if (!res.ok) throw new Error("fail");
  };

  const handleAssign = async () => {
    if (!canSubmit()) return;
    setSubmitting(true); setMsg("");
    try {
      if (taskType === "image"   && selChefVisuel) await postAssignment(selChefVisuel, "image");
      if (taskType === "caption" && selChefRedac)  await postAssignment(selChefRedac,  "caption");
      if (taskType === "full") {
        await postAssignment(selChefVisuel!, "image");
        await postAssignment(selChefRedac!,  "caption");
      }
      setMsg("✅ Assigné aux chefs d'équipe !");
      setTimeout(() => { onAssigned(); onClose(); }, 1200);
    } catch { setMsg("⚠️ Erreur lors de l'assignation"); }
    finally { setSubmitting(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(8px)", display: "flex", alignItems: "center",
        justifyContent: "center", zIndex: 1000, padding: 20 }}>
      <motion.div
        initial={{ scale: 0.94, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.94, y: 16, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        onClick={e => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 480,
          maxHeight: "90vh", overflowY: "auto",
          boxShadow: "0 32px 80px rgba(0,0,0,0.2)", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f0f0f0",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>Assigner le post N°{rowKey}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2,
              maxWidth: 340, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {briefTitle}
            </div>
          </div>
          <button onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: 8, background: "#f8f9fb",
              border: "1px solid #f0f0f0", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", color: "#64748b", flexShrink: 0 }}>
            <FiX size={13} />
          </button>
        </div>

        <div style={{ padding: "18px 20px 20px", display: "flex", flexDirection: "column", gap: 16,
          overflowY: "auto", maxHeight: "calc(90vh - 70px)" }}>

          {/* Step 1: Task type */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8",
              textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
              Qui va travailler ce post ?
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {TASK_OPTS.map(opt => (
                <button key={opt.key} onClick={() => {
                    setTaskType(opt.key);
                    if (opt.key === "self") { onSelf(); onClose(); }
                  }}
                  style={{ padding: "12px 10px", borderRadius: 12, textAlign: "left",
                    border: `2px solid ${taskType === opt.key ? "#dc2626" : "#e5e7eb"}`,
                    background: taskType === opt.key ? "#fef2f2" : "#fafafa",
                    cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{opt.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700,
                    color: taskType === opt.key ? "#dc2626" : "#0f172a" }}>{opt.label}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Chef d'équipe selection */}
          <AnimatePresence>
            {taskType && taskType !== "self" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Chef Visuel — shown for image or full */}
                {(taskType === "image" || taskType === "full") && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#dc2626",
                      textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                      🎨 Chef d'équipe Visuel
                    </div>
                    {chefsVisuels.length === 0 ? (
                      <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic",
                        padding: "12px", background: "#f8fafc", borderRadius: 10,
                        border: "1px dashed #e2e8f0" }}>
                        Aucun Chef Visuel — ajoute-en un via la section Équipe.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {chefsVisuels.map((m: Member) => (
                          <MemberCard key={m.id} m={m}
                            selected={selChefVisuel === m.id}
                            onClick={() => setSelChefVisuel(selChefVisuel === m.id ? null : m.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Chef Rédaction — shown for caption or full */}
                {(taskType === "caption" || taskType === "full") && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#dc2626",
                      textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                      ✍️ Chef d'équipe Rédaction
                    </div>
                    {chefsRedacs.length === 0 ? (
                      <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic",
                        padding: "12px", background: "#f8fafc", borderRadius: 10,
                        border: "1px dashed #e2e8f0" }}>
                        Aucun Chef Rédaction — ajoute-en un via la section Équipe.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {chefsRedacs.map((m: Member) => (
                          <MemberCard key={m.id} m={m}
                            selected={selChefRedac === m.id}
                            onClick={() => setSelChefRedac(selChefRedac === m.id ? null : m.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: "#374151", display: "block",
                    marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Note (optionnel)
                  </label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)}
                    rows={2} placeholder="Consignes pour le chef d'équipe…"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 10,
                      border: "1.5px solid #e5e7eb", fontSize: 12, outline: "none",
                      boxSizing: "border-box", background: "#fafafa", resize: "none",
                      fontFamily: "inherit", transition: "border .15s" }}
                    onFocus={e => { e.target.style.borderColor = "#dc2626"; e.target.style.background = "#fff"; }}
                    onBlur={e => { e.target.style.borderColor = "#e5e7eb"; e.target.style.background = "#fafafa"; }}
                  />
                </div>

                {msg && (
                  <div style={{ fontSize: 12, fontWeight: 600, padding: "8px 12px", borderRadius: 9,
                    background: msg.startsWith("✅") ? "#f0fdf4" : "#fee2e2",
                    color: msg.startsWith("✅") ? "#16a34a" : "#dc2626",
                    border: `1px solid ${msg.startsWith("✅") ? "#bbf7d0" : "#fecaca"}` }}>
                    {msg}
                  </div>
                )}

                <button onClick={handleAssign} disabled={submitting || !canSubmit()}
                  style={{ padding: "12px", borderRadius: 11, border: "none",
                    background: submitting || !canSubmit() ? "#e5e7eb" : "#dc2626",
                    color: submitting || !canSubmit() ? "#9ca3af" : "#fff",
                    fontSize: 13, fontWeight: 700, cursor: submitting || !canSubmit() ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    boxShadow: submitting || !canSubmit() ? "none" : "0 4px 14px #dc262640" }}>
                  {submitting ? "Assignation…" : "Assigner aux chefs d'équipe"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
