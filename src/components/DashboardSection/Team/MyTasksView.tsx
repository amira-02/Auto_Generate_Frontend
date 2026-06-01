import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiRefreshCw, FiUsers, FiCheck, FiSend, FiFileText, FiClock, FiCheckCircle } from "react-icons/fi";

const API = import.meta.env.VITE_API_URL ?? "https://localhost:7079";

type Assignment = {
  id: number; rowKey: string; briefTitle: string; taskType: string;
  status: string; notes: string | null; submittedContent: string | null;
  assignedAt: string; submittedAt: string | null;
  clientName: string; assignedBy: string; postId: number | null; clientId: number;
  delegatedTo: string | null; delegatedStatus: string | null; subAssignmentId: number | null;
};
type Member = { id: number; name: string | null; email: string; role: string };
type BriefContext = {
  topicName: string | null; existingCaption: string | null;
  brief: string | null; charte: string | null; format: string | null;
  texteVisuel: string | null; imagesPhotos: string | null; infosPost: string | null;
  objectif: string | null; audience: string | null; commentaires: string | null;
};

const ACCENT = "#e11d48";
const ACCENT_LIGHT = "#fff1f2";
const ACCENT_MID = "#fecdd3";

const briefRows: { label: string; key: keyof BriefContext }[] = [
  { label: "Brief",           key: "brief"        },
  { label: "Objectif",        key: "objectif"     },
  { label: "Format",          key: "format"       },
  { label: "Texte visuel",    key: "texteVisuel"  },
  { label: "Images / Photos", key: "imagesPhotos" },
  { label: "Infos du post",   key: "infosPost"    },
  { label: "Audience",        key: "audience"     },
  { label: "Charte",          key: "charte"       },
  { label: "Commentaires",    key: "commentaires" },
];

// ─── Shared styles ────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  borderRadius: 20,
  background: "#fff",
  border: "1.5px solid #f0f0f5",
  overflow: "hidden",
};

const badge = (color: string, bg: string): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", gap: 4,
  padding: "4px 12px", borderRadius: 100,
  fontSize: 11, fontWeight: 400,
  color, background: bg,
  letterSpacing: "0.03em",
});

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, email, size = 36, bg = ACCENT }: {
  name: string | null; email: string; size?: number; bg?: string;
}) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.32,
      background: bg, color: "#fff", fontSize: size * 0.36,
      fontWeight: 500, display: "flex", alignItems: "center",
      justifyContent: "center", flexShrink: 0, letterSpacing: "0.02em",
    }}>
      {(name ?? email).slice(0, 2).toUpperCase()}
    </div>
  );
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

const TYPE: Record<string, { label: string }> = {
  image:   { label: "Visuel"          },
  caption: { label: "Caption"         },
  full:    { label: "Visuel + Caption" },
};

// ─── Brief Panel ──────────────────────────────────────────────────────────────
function BriefPanel({ taskId, token }: { taskId: number; token: string | null }) {
  const [ctx, setCtx]     = useState<BriefContext | null>(null);
  const [open, setOpen]   = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/assignments/${taskId}/context`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => setCtx(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [taskId, token]);

  if (loading) return (
    <div style={{ ...card, padding: "18px 20px" }}>
      <div style={{ height: 12, borderRadius: 6, background: "#f1f5f9", width: "55%", marginBottom: 10, animation: "pulse 1.5s ease infinite" }} />
      <div style={{ height: 10, borderRadius: 6, background: "#f1f5f9", width: "80%", animation: "pulse 1.5s ease infinite" }} />
    </div>
  );

  const hasContent = ctx && (ctx.topicName || ctx.existingCaption || briefRows.some(r => ctx[r.key]));

  if (!hasContent) return (
    <div style={{ ...card, padding: "18px 20px", background: "#fff9f9", borderColor: ACCENT_MID }}>
      <p style={{ margin: 0, fontSize: 12, color: "#9f1239" }}>Aucune donnée de brief pour ce post.</p>
    </div>
  );

  return (
    <div style={card}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", padding: "16px 20px", border: "none",
        background: "transparent", cursor: "pointer", fontFamily: "inherit",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: open ? "1.5px solid #f0f0f5" : "none",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 10, background: ACCENT_LIGHT,
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FiFileText size={14} color={ACCENT} />
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 13, fontWeight: 400, color: "#0f172a" }}>Brief client</div>
            {ctx?.topicName && (
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{ctx.topicName}</div>
            )}
          </div>
        </div>
        <span style={{ ...badge(ACCENT, ACCENT_LIGHT) }}>{open ? "Réduire" : "Voir"}</span>
      </button>

      {open && (
        <div style={{ maxHeight: 320, overflowY: "auto", padding: "16px 20px",
          display: "flex", flexDirection: "column", gap: 12 }}>
          {briefRows.filter(r => ctx![r.key]).map(r => (
            <div key={r.key} style={{ borderRadius: 14, background: "#fafafa",
              border: "1px solid #f0f0f5", padding: "12px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 500, color: ACCENT,
                textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                {r.label}
              </div>
              <div style={{ fontSize: 13, color: "#1e293b", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                {String(ctx![r.key])}
              </div>
            </div>
          ))}
          {ctx?.existingCaption && (
            <div style={{ borderRadius: 14, background: "#f8fafc",
              border: "1px solid #e2e8f0", padding: "12px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 500, color: "#64748b",
                textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                Caption de référence
              </div>
              <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                {ctx.existingCaption}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────
function TaskCard({ task, active, onClick }: {
  task: Assignment; active: boolean; onClick: () => void;
}) {
  const isDone = task.status === "done";

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.012 }}
      whileTap={{ scale: 0.99 }}
      style={{
        width: "100%", textAlign: "left", padding: 0, border: "none",
        background: "none", cursor: "pointer", fontFamily: "inherit",
      }}
    >
      <div style={{
        borderRadius: 18, padding: "14px 16px",
        border: `2px solid ${active ? ACCENT : "#f0f0f5"}`,
        background: active ? ACCENT_LIGHT : "#fff",
        boxShadow: active ? `0 4px 20px ${ACCENT}20` : "0 1px 6px rgba(0,0,0,0.04)",
        transition: "all .18s ease",
        position: "relative", overflow: "hidden",
      }}>
        {/* Left accent bar */}
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 4,
          background: isDone ? "#d1d5db" : ACCENT,
          borderRadius: "18px 0 0 18px",
        }} />

        <div style={{ paddingLeft: 8 }}>
          {/* Top row */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <span style={{ ...badge(active ? ACCENT : "#64748b", active ? ACCENT_LIGHT : "#f1f5f9") }}>
              {TYPE[task.taskType]?.label ?? "—"}
            </span>
            <span style={{
              marginLeft: "auto",
              ...badge(isDone ? "#64748b" : "#92400e", isDone ? "#f1f5f9" : "#fef9c3"),
            }}>
              {isDone ? <><FiCheckCircle size={9} /> Terminé</> : <><FiClock size={9} /> En attente</>}
            </span>
          </div>

          {/* Title */}
          <div style={{ fontSize: 13, fontWeight: 400, color: "#0f172a",
            lineHeight: 1.45, marginBottom: 10,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <span style={{ color: ACCENT }}>#{task.rowKey}</span>
            {" "}{task.briefTitle}
          </div>

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar name={task.clientName} email={task.clientName} size={22} bg="#e2e8f0" />
            <span style={{ fontSize: 11, color: "#94a3b8", flex: 1,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 }}>
              {task.clientName}
            </span>
            <span style={{ fontSize: 10, color: "#cbd5e1", flexShrink: 0 }}>
              {fmtDate(task.assignedAt)}
            </span>
          </div>

          {task.delegatedTo && (
            <div style={{ marginTop: 8, ...badge(
              task.delegatedStatus === "done" ? "#64748b" : "#92400e",
              task.delegatedStatus === "done" ? "#f1f5f9" : "#fef9c3",
            ), fontSize: 10 }}>
              <FiUsers size={9} />
              {task.delegatedTo}
              {task.delegatedStatus === "done" ? " — fait" : " — en cours"}
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}

// ─── Delegate Workspace ───────────────────────────────────────────────────────
function DelegateWorkspace({ task, token, onRefresh }: {
  task: Assignment; token: string | null; onRefresh: () => void;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [sel, setSel]         = useState<number | null>(null);
  const [notes, setNotes]     = useState("");
  const [busy, setBusy]       = useState(false);
  const [msg, setMsg]         = useState("");

  useEffect(() => {
    fetch(`${API}/api/team`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then((list: Member[]) => {
        const need = task.taskType === "image" ? "Graphiste" : "Redacteur";
        setMembers(list.filter(m => m.role === need));
      }).catch(() => {});
  }, [token, task.taskType]);

  const submit = async () => {
    if (!sel) return;
    setBusy(true);
    try {
      const res = await fetch(`${API}/api/assignments/${task.id}/delegate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ assignedToUserId: sel, notes: notes || null }),
      });
      if (res.ok) { setMsg("success"); setTimeout(onRefresh, 1200); }
      else setMsg("error");
    } catch { setMsg("error"); }
    finally { setBusy(false); }
  };

  const roleLabel = task.taskType === "image" ? "Graphiste" : "Rédacteur";

  return (
    <div style={{ padding: "32px 36px", maxWidth: 700, width: "100%", display: "flex",
      flexDirection: "column", gap: 24 }}>

      <div>
        <h3 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 500, color: "#0f172a" }}>
          Déléguer cette tâche
        </h3>
        <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
          Sélectionne un {roleLabel} pour traiter ce post
        </p>
      </div>

      {task.delegatedTo && (
        <div style={{ ...card, padding: "16px 20px", background: "#fff7ed",
          borderColor: "#fed7aa" }}>
          <div style={{ fontSize: 12, fontWeight: 400, color: "#92400e", marginBottom: 4 }}>
            Actuellement délégué à {task.delegatedTo}
          </div>
          <div style={{ fontSize: 11, color: "#b45309" }}>
            {task.delegatedStatus === "done" ? "✅ Tâche terminée" : "⏳ En cours de traitement"}
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: "#b45309", fontWeight: 600 }}>
            Tu peux changer la délégation ci-dessous
          </div>
        </div>
      )}

      <div>
        <div style={{ fontSize: 11, fontWeight: 500, color: "#64748b",
          textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
          {roleLabel}s disponibles
        </div>
        {members.length === 0 ? (
          <div style={{ ...card, padding: "32px", textAlign: "center",
            background: "#fafafa", borderStyle: "dashed" }}>
            <FiUsers size={24} color="#d1d5db" style={{ marginBottom: 8 }} />
            <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>Aucun {roleLabel} dans l'équipe</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {members.map(m => {
              const isSel = sel === m.id;
              return (
                <button key={m.id} onClick={() => setSel(isSel ? null : m.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "14px 16px", borderRadius: 16,
                    border: `2px solid ${isSel ? "#6366f1" : "#f0f0f5"}`,
                    background: isSel ? "#eef2ff" : "#fff",
                    cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
                    boxShadow: isSel ? "0 0 0 4px #6366f115" : "0 1px 4px rgba(0,0,0,0.04)",
                  }}>
                  <Avatar name={m.name} email={m.email} size={40} bg={isSel ? "#6366f1" : "#94a3b8"} />
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontSize: 13, fontWeight: 400, color: "#0f172a" }}>
                      {m.name ?? m.email.split("@")[0]}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                      {m.role === "Graphiste" ? "🎨 Graphiste" : "✍️ Rédacteur"}
                    </div>
                  </div>
                  {isSel && (
                    <div style={{ width: 22, height: 22, borderRadius: 8, background: "#6366f1",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <FiCheck size={12} color="#fff" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <div style={{ fontSize: 11, fontWeight: 500, color: "#64748b",
          textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
          Note (optionnel)
        </div>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
          placeholder="Instructions spécifiques pour le membre…"
          style={{ width: "100%", padding: "14px 16px", borderRadius: 16,
            border: "2px solid #f0f0f5", fontSize: 13, outline: "none",
            boxSizing: "border-box", background: "#fafafa", resize: "vertical",
            fontFamily: "inherit", lineHeight: 1.7, transition: "border .15s, background .15s" }}
          onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.background = "#fff"; }}
          onBlur={e => { e.target.style.borderColor = "#f0f0f5"; e.target.style.background = "#fafafa"; }}
        />
      </div>

      {msg && (
        <div style={{ ...card, padding: "14px 18px",
          background: msg === "success" ? "#f0fdf4" : "#fff1f2",
          borderColor: msg === "success" ? "#bbf7d0" : ACCENT_MID,
          fontSize: 13, fontWeight: 600,
          color: msg === "success" ? "#16a34a" : ACCENT }}>
          {msg === "success" ? "✅ Délégué avec succès !" : "⚠️ Erreur lors de la délégation"}
        </div>
      )}

      <button onClick={submit} disabled={!sel || busy}
        style={{ padding: "15px 24px", borderRadius: 16, border: "none",
          background: !sel || busy ? "#f1f5f9" : "#6366f1",
          color: !sel || busy ? "#94a3b8" : "#fff",
          fontSize: 14, fontWeight: 400, cursor: !sel || busy ? "not-allowed" : "pointer",
          fontFamily: "inherit", display: "flex", alignItems: "center",
          justifyContent: "center", gap: 8,
          boxShadow: sel && !busy ? "0 6px 24px #6366f135" : "none",
          transition: "all .2s" }}>
        <FiUsers size={15} />
        {busy ? "Délégation en cours…" : "Déléguer la tâche"}
      </button>
    </div>
  );
}

// ─── Caption helpers ──────────────────────────────────────────────────────────
type ChatMsg = { id: string; role: "user" | "bot"; content: string; generatedCaption?: string };

function parseCaption(raw: any): string {
  let parsed = raw;
  if (typeof raw === "string") { try { parsed = JSON.parse(raw); } catch { return raw; } }
  if (parsed?.output) { try { parsed = JSON.parse(parsed.output); } catch { parsed = { reply: parsed.output }; } }
  return parsed?.finalCaption ?? parsed?.platform_posts?.Instagram?.caption
    ?? parsed?.reply ?? parsed?.message ?? "";
}

// ─── Submit Workspace ─────────────────────────────────────────────────────────
function SubmitWorkspace({ task, token, onRefresh }: {
  task: Assignment; token: string | null; onRefresh: () => void;
}) {
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption]   = useState(task.submittedContent ?? "");
  const [msgs, setMsgs]         = useState<ChatMsg[]>([]);
  const [input, setInput]       = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [busy, setBusy]         = useState(false);
  const [submitMsg, setSubmitMsg] = useState("");
  const sessionId = useRef(`team-${task.id}-${Date.now()}`);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const isCaption = task.taskType === "caption" || task.taskType === "full";
  const isImage   = task.taskType === "image"   || task.taskType === "full";

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, chatLoading]);

  const sendChat = async (text: string) => {
    if (!text.trim() || chatLoading) return;
    const userMsg: ChatMsg = { id: crypto.randomUUID(), role: "user", content: text };
    setMsgs(prev => [...prev, userMsg]);
    setInput("");
    setChatLoading(true);
    try {
      const res = await fetch(`${API}/api/assignments/${task.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text, sessionId: sessionId.current, tone: "professional" }),
      });
      const raw = await res.json();
      const generated = parseCaption(raw);
      const replyText = raw?.reply ?? raw?.message ?? (generated ? "Voici le caption généré ✨" : "Désolé, je n'ai pas pu générer de caption.");
      setMsgs(prev => [...prev, {
        id: crypto.randomUUID(), role: "bot",
        content: replyText, generatedCaption: generated || undefined,
      }]);
    } catch {
      setMsgs(prev => [...prev, { id: crypto.randomUUID(), role: "bot", content: "⚠️ Erreur réseau — réessaie." }]);
    } finally { setChatLoading(false); }
  };

  const useCaption = (c: string) => {
    setCaption(c);
    setSubmitMsg("✅ Caption prête — modifie si besoin puis soumets.");
  };

  const submit = async () => {
    setBusy(true);
    try {
      const res = await fetch(`${API}/api/assignments/${task.id}/submit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          content: isCaption ? caption : imageUrl,
          imageUrl: isImage ? imageUrl : null,
          caption: isCaption ? caption : null,
        }),
      });
      if (res.ok) { setSubmitMsg("✅ Tâche soumise avec succès !"); setTimeout(onRefresh, 1200); }
      else setSubmitMsg("⚠️ Erreur lors de la soumission");
    } catch { setSubmitMsg("⚠️ Erreur réseau"); }
    finally { setBusy(false); }
  };

  const fieldStyle: React.CSSProperties = {
    width: "100%", padding: "13px 16px", borderRadius: 16,
    border: "2px solid #f0f0f5", fontSize: 13, outline: "none",
    boxSizing: "border-box", background: "#fafafa", fontFamily: "inherit",
    transition: "all .15s", lineHeight: 1.7,
  };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>

      {/* Work panel */}
      <div style={{ width: 420, flexShrink: 0, borderRight: "1.5px solid #f0f0f5",
        display: "flex", flexDirection: "column", background: "#f8f9fc", overflowY: "auto" }}>

        <div style={{ padding: "20px 22px 16px", background: "#fff",
          borderBottom: "1.5px solid #f0f0f5" }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#0f172a" }}>Espace de travail</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>
            {isCaption ? "Consulte le brief puis rédige ou génère le caption" : "Consulte le brief puis fournis le visuel"}
          </div>
        </div>

        <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 16 }}>

          <BriefPanel taskId={task.id} token={token} />

          <div style={card}>
            <div style={{ padding: "14px 20px", borderBottom: "1.5px solid #f0f0f5",
              display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: ACCENT }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: "#374151", letterSpacing: "0.04em" }}>
                {isCaption ? "Rédaction du caption" : "URL du visuel"}
              </span>
            </div>

            <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
              {isImage && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 400, color: "#64748b",
                    textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 8 }}>
                    URL du visuel
                  </label>
                  <input value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                    placeholder="https://drive.google.com/…"
                    style={fieldStyle}
                    onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.background = "#fff"; }}
                    onBlur={e => { e.target.style.borderColor = "#f0f0f5"; e.target.style.background = "#fafafa"; }}
                  />
                  {imageUrl && (
                    <img src={imageUrl} alt="preview"
                      style={{ marginTop: 10, width: "100%", maxHeight: 160, objectFit: "cover",
                        borderRadius: 14, border: "1.5px solid #f0f0f5" }}
                      onError={e => (e.currentTarget.style.display = "none")} />
                  )}
                </div>
              )}

              {isCaption && (
                <div>
                  <textarea value={caption} onChange={e => setCaption(e.target.value)}
                    placeholder="Rédige ici…"
                    style={{ ...fieldStyle, minHeight: 160, resize: "vertical" }}
                    onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.background = "#fff"; }}
                    onBlur={e => { e.target.style.borderColor = "#f0f0f5"; e.target.style.background = "#fafafa"; }}
                  />
                  <div style={{ marginTop: 6, textAlign: "right", fontSize: 11, color: "#94a3b8" }}>
                    {caption.length} caractères
                  </div>
                </div>
              )}
            </div>
          </div>

          {submitMsg && (
            <div style={{ ...card, padding: "14px 18px",
              background: submitMsg.startsWith("✅") ? "#f0fdf4" : ACCENT_LIGHT,
              borderColor: submitMsg.startsWith("✅") ? "#bbf7d0" : ACCENT_MID,
              fontSize: 12, fontWeight: 400,
              color: submitMsg.startsWith("✅") ? "#16a34a" : ACCENT }}>
              {submitMsg}
            </div>
          )}

          <button onClick={submit}
            disabled={busy || (isCaption && !caption.trim()) || (isImage && !imageUrl.trim())}
            style={{ padding: "14px", borderRadius: 16, border: "none",
              background: busy ? "#f1f5f9" : ACCENT,
              color: busy ? "#9ca3af" : "#fff",
              fontSize: 14, fontWeight: 400,
              cursor: busy ? "not-allowed" : "pointer",
              fontFamily: "inherit", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8,
              boxShadow: !busy ? `0 6px 20px ${ACCENT}35` : "none",
              transition: "all .2s" }}>
            <FiSend size={15} />
            {busy ? "Envoi en cours…" : "Soumettre la tâche"}
          </button>
        </div>
      </div>

      {/* Caption generator */}
      {isCaption && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fff", minWidth: 0 }}>

          <div style={{ padding: "20px 24px", borderBottom: "1.5px solid #f0f0f5" }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#0f172a" }}>Générateur de caption ✨</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>
              Décris ce que tu veux — utilise le caption généré ou modifie-le
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px",
            display: "flex", flexDirection: "column", gap: 12 }}>
            {msgs.length === 0 && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", padding: "40px 20px",
                textAlign: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: ACCENT_LIGHT,
                  display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <FiSend size={22} color={ACCENT} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 400, color: "#374151", marginBottom: 8 }}>
                  Prêt à générer
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7, maxWidth: 260 }}>
                  Décris ton post ci-dessous.<br />
                  Ex : "caption pour une promo -30%, ton dynamique"
                </div>
              </div>
            )}

            {msgs.map(m => (
              <div key={m.id} style={{ display: "flex", flexDirection: "column",
                alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "80%", padding: "12px 16px", lineHeight: 1.7, fontSize: 13,
                  borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: m.role === "user" ? ACCENT : "#f4f5f8",
                  color: m.role === "user" ? "#fff" : "#1e293b",
                }}>
                  {m.content}
                </div>
                {m.role === "bot" && m.generatedCaption && (
                  <div style={{ maxWidth: "88%", marginTop: 10, ...card }}>
                    <div style={{ padding: "14px 18px", fontSize: 13, color: "#1e293b",
                      lineHeight: 1.8, whiteSpace: "pre-wrap",
                      borderBottom: "1.5px solid #f0f0f5" }}>
                      {m.generatedCaption}
                    </div>
                    <button onClick={() => useCaption(m.generatedCaption!)}
                      style={{ width: "100%", padding: "12px 18px", border: "none",
                        background: ACCENT_LIGHT, color: ACCENT,
                        fontSize: 12, fontWeight: 500, cursor: "pointer",
                        fontFamily: "inherit", borderRadius: "0 0 20px 20px",
                        transition: "background .15s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = ACCENT_MID)}
                      onMouseLeave={e => (e.currentTarget.style.background = ACCENT_LIGHT)}>
                      ✓ Utiliser ce caption
                    </button>
                  </div>
                )}
              </div>
            ))}

            {chatLoading && (
              <div style={{ display: "flex", gap: 6, padding: "14px 18px",
                borderRadius: "18px 18px 18px 4px", background: "#f4f5f8",
                width: "fit-content" }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: "50%",
                    background: "#cbd5e1", animation: "chatdot 1.2s ease infinite",
                    animationDelay: `${i * 0.18}s` }} />
                ))}
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          <div style={{ padding: "14px 20px", borderTop: "1.5px solid #f0f0f5",
            display: "flex", gap: 10, background: "#fff" }}>
            <textarea value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(input); } }}
              rows={2} disabled={chatLoading}
              placeholder="Décris ce que tu veux générer…"
              style={{ flex: 1, padding: "12px 16px", borderRadius: 16,
                border: "2px solid #f0f0f5", fontSize: 13, resize: "none",
                fontFamily: "inherit", outline: "none", background: "#fafafa",
                transition: "border .15s, background .15s", color: "#1e293b", lineHeight: 1.6 }}
              onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.background = "#fff"; }}
              onBlur={e => { e.target.style.borderColor = "#f0f0f5"; e.target.style.background = "#fafafa"; }}
            />
            <button onClick={() => sendChat(input)} disabled={chatLoading || !input.trim()}
              style={{ padding: "0 20px", borderRadius: 16, border: "none",
                background: chatLoading || !input.trim() ? "#f1f5f9" : ACCENT,
                color: chatLoading || !input.trim() ? "#94a3b8" : "#fff",
                cursor: chatLoading || !input.trim() ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: !chatLoading && input.trim() ? `0 4px 14px ${ACCENT}40` : "none",
                transition: "all .15s", flexShrink: 0 }}>
              <FiSend size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Done Workspace ───────────────────────────────────────────────────────────
function DoneWorkspace({ task }: { task: Assignment }) {
  return (
    <div style={{ padding: "36px 40px", maxWidth: 680, width: "100%",
      display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
        <div style={{ width: 36, height: 36, borderRadius: 12, background: "#dcfce7",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <FiCheckCircle size={18} color="#16a34a" />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 500, color: "#0f172a" }}>Tâche terminée</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
            {task.submittedAt ? fmtDate(task.submittedAt) : "—"}
            {" · "}{TYPE[task.taskType]?.label ?? "—"}
          </div>
        </div>
      </div>

      {/* Result */}
      {task.submittedContent ? (
        <div style={{ borderRadius: 20, border: "1.5px solid #f0f0f5",
          background: "#fff", overflow: "hidden",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          <div style={{ padding: "22px 26px", fontSize: 14, color: "#1e293b",
            lineHeight: 1.9, whiteSpace: "pre-wrap" }}>
            {task.submittedContent}
          </div>
        </div>
      ) : (
        <div style={{ padding: "32px", textAlign: "center", borderRadius: 20,
          border: "1.5px dashed #e2e8f0", color: "#94a3b8", fontSize: 13 }}>
          Aucun contenu soumis
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MyTasksView({ token, role }: { token: string | null; role?: string | null }) {
  const [tasks, setTasks]       = useState<Assignment[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [activeId, setActiveId] = useState<number | null>(null);
  const isChef = role === "ChefVisuel" || role === "ChefRedac" || role === "ChefEquipe";

  const load = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/api/assignments/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
        if (data.length > 0 && !activeId) setActiveId(data[0].id);
      } else {
        setError(`Erreur ${res.status}`);
      }
    } catch (e: any) { setError(`Réseau : ${e?.message}`); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const pending = tasks.filter(t => t.status === "pending");
  const done    = tasks.filter(t => t.status === "done");
  const active  = tasks.find(t => t.id === activeId) ?? null;

  const groups = [
    { label: "En attente", color: ACCENT,   icon: FiClock,        tasks: pending },
    { label: "Terminées",  color: "#6b7280", icon: FiCheckCircle,  tasks: done    },
  ];

  return (
    <div style={{ display: "flex", width: "100%", height: "100%",
      background: "#f0f1f5", fontFamily: "inherit",
      padding: "12px", gap: 10, boxSizing: "border-box", alignItems: "stretch" }}>

      {/* ── Sidebar ── */}
      <div style={{ width: 280, flexShrink: 0, background: "#fff",
        borderRadius: 20, border: "1.5px solid #ebebf0",
        display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "22px 20px 18px", borderBottom: "1.5px solid #f0f0f5" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 500, color: "#0f172a", letterSpacing: "-0.01em" }}>
                Mes tâches
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, fontWeight: 500 }}>
                <span style={{ color: ACCENT, fontWeight: 400 }}>{pending.length}</span> en attente
                {" · "}
                <span style={{ fontWeight: 400 }}>{done.length}</span> terminée(s)
              </div>
            </div>
            <button onClick={load}
              style={{ width: 36, height: 36, borderRadius: 12,
                border: "1.5px solid #f0f0f5", background: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#94a3b8", transition: "all .15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#f8f9fc"; e.currentTarget.style.color = ACCENT; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#94a3b8"; }}>
              <FiRefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px" }}>
          {error && (
            <div style={{ ...card, padding: "12px 16px",
              background: ACCENT_LIGHT, borderColor: ACCENT_MID,
              fontSize: 11, color: ACCENT, marginBottom: 14 }}>
              {error}
            </div>
          )}

          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} style={{ height: 96, borderRadius: 18, background: "#f4f5f8",
                marginBottom: 10, animation: "pulse 1.5s ease infinite" }} />
            ))
          ) : tasks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 16px" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>📋</div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#374151" }}>
                Aucune tâche assignée
              </p>
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "#94a3b8" }}>
                Tu n'as pas encore de tâches
              </p>
            </div>
          ) : groups.map(g => g.tasks.length > 0 && (
            <div key={g.label} style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8,
                marginBottom: 12, padding: "0 4px" }}>
                <g.icon size={11} color={g.color} />
                <span style={{ fontSize: 10, fontWeight: 500, color: "#94a3b8",
                  textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {g.label}
                </span>
                <span style={{ marginLeft: "auto", ...badge(g.color, g.color + "18"), fontSize: 10 }}>
                  {g.tasks.length}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {g.tasks.map(t => (
                  <TaskCard key={t.id} task={t} active={activeId === t.id}
                    onClick={() => setActiveId(t.id)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main panel ── */}
      <div style={{ flex: 1, overflow: "hidden",
        borderRadius: 20, border: "1.5px solid #ebebf0",
        display: "flex", flexDirection: "column", background: "#fff", minWidth: 0 }}>

        {!active ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 10 }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: "#f4f5f8",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FiFileText size={24} color="#d1d5db" />
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 15, fontWeight: 400, color: "#374151" }}>
              Sélectionne une tâche
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
              Clique sur une tâche dans la liste à gauche
            </p>
          </div>
        ) : (
          <>
            {/* Workspace header */}
            <div style={{ padding: "20px 28px 18px", background: "#fff",
              borderBottom: "1.5px solid #f0f0f5", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 20,
                justifyContent: "space-between", flexWrap: "wrap" }}>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
                    flexWrap: "wrap" }}>
                    <span style={{ ...badge(ACCENT, ACCENT_LIGHT) }}>
                      {TYPE[active.taskType]?.label}
                    </span>
                    <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>
                      N° {active.rowKey}
                    </span>
                    <span style={{
                      ...badge(
                        active.status === "done" ? "#16a34a" : "#92400e",
                        active.status === "done" ? "#dcfce7" : "#fef9c3",
                      ),
                    }}>
                      {active.status === "done" ? "✓ Terminé" : "⏳ En cours"}
                    </span>
                  </div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500, color: "#0f172a",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    letterSpacing: "-0.01em" }}>
                    {active.briefTitle}
                  </h2>
                </div>

                <div style={{ display: "flex", gap: 16, flexShrink: 0, flexWrap: "wrap" }}>
                  {[
                    { label: "Client",      value: active.clientName  },
                    { label: "Assigné par", value: active.assignedBy  },
                    ...(active.notes ? [{ label: "Note", value: active.notes }] : []),
                  ].map(item => (
                    <div key={item.label} style={{ padding: "10px 16px", borderRadius: 14,
                      background: "#f8f9fc", border: "1.5px solid #f0f0f5" }}>
                      <div style={{ fontSize: 10, fontWeight: 400, color: "#94a3b8",
                        textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 400, color: "#1e293b",
                        maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis",
                        whiteSpace: "nowrap" }}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Workspace body */}
            <div style={{ flex: 1, overflow: "hidden" }}>
              <AnimatePresence mode="wait">
                <motion.div key={active.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  style={{ height: "100%", overflowY: "auto", background: "#f8f9fc",
                    display: "flex", justifyContent: "flex-start" }}>
                  {active.status === "done" ? (
                    <DoneWorkspace task={active} />
                  ) : isChef ? (
                    <DelegateWorkspace task={active} token={token} onRefresh={load} />
                  ) : (
                    <SubmitWorkspace task={active} token={token} onRefresh={load} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes chatdot { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-4px);opacity:1} }
      `}</style>
    </div>
  );
}
