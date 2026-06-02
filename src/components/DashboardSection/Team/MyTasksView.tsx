import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiRefreshCw, FiUsers, FiCheck, FiSend, FiFileText, FiClock, FiCheckCircle, FiMoreHorizontal, FiEye, FiAlignLeft, FiMessageSquare, FiPlus, FiX, FiAlertCircle } from "react-icons/fi";

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


function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

const TYPE: Record<string, { label: string }> = {
  image:   { label: "Visuel"          },
  caption: { label: "Caption"         },
  full:    { label: "Visuel + Caption" },
};

// ─── Brief helpers ────────────────────────────────────────────────────────────
const hexRe  = () => /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g;
const imgRe  = () => /https?:\/\/\S+\.(?:jpg|jpeg|png|gif|webp|svg)(?:\S*)?/gi;
const urlRe  = () => /https?:\/\/[^\s]+/g;

function getHostname(url: string) {
  try { return new URL(url).hostname.replace("www.", ""); } catch { return url.slice(0, 30); }
}

function SmartField({ label, value }: { label: string; value: string }) {
  const hexColors = [...value.matchAll(hexRe())].map(m => m[0]);
  const imgUrls   = [...value.matchAll(imgRe())].map(m => m[0]);
  const allUrls   = [...value.matchAll(urlRe())].map(m => m[0]);
  const linkUrls  = allUrls.filter(u => !imgUrls.includes(u));

  const cleanText = value
    .replace(imgRe(), "")
    .replace(urlRe(), "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Label */}
      <div style={{ fontSize: 10, color: ACCENT, textTransform: "uppercase",
        letterSpacing: "0.09em", marginBottom: 6, display: "flex",
        alignItems: "center", gap: 6 }}>
        <div style={{ width: 16, height: 2, borderRadius: 1, background: ACCENT }} />
        {label}
      </div>

      {/* Clean text */}
      {cleanText && (
        <div style={{ fontSize: 13, color: "#1e293b", lineHeight: 1.75,
          whiteSpace: "pre-wrap", wordBreak: "break-word",
          padding: "10px 12px", background: "#fafafa",
          borderRadius: 10, border: "1px solid #f0f0f5" }}>
          {cleanText}
        </div>
      )}

      {/* Color swatches */}
      {hexColors.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {hexColors.map((hex, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 7,
              padding: "5px 10px 5px 6px", borderRadius: 8,
              border: "1px solid #ebebf0", background: "#fff" }}>
              <div style={{ width: 22, height: 22, borderRadius: 6,
                background: hex, border: "1px solid rgba(0,0,0,0.1)", flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "#1e293b", fontFamily: "monospace" }}>{hex}</span>
            </div>
          ))}
        </div>
      )}

      {/* Image previews */}
      {imgUrls.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
          {imgUrls.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noreferrer"
              style={{ display: "block", borderRadius: 10, overflow: "hidden",
                border: "1px solid #ebebf0", flexShrink: 0, textDecoration: "none" }}>
              <img src={url} alt="visuel"
                style={{ width: 130, height: 90, objectFit: "cover", display: "block" }}
                onError={e => (e.currentTarget.parentElement!.style.display = "none")} />
            </a>
          ))}
        </div>
      )}

      {/* Non-image links */}
      {linkUrls.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
          {linkUrls.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 7,
                padding: "7px 12px", borderRadius: 8,
                border: "1px solid #ebebf0", background: "#fafafa",
                color: "#1e293b", fontSize: 12, textDecoration: "none",
                transition: "background .12s" }}
              onMouseEnter={e => (e.currentTarget.style.background = ACCENT_LIGHT)}
              onMouseLeave={e => (e.currentTarget.style.background = "#fafafa")}>
              <FiEye size={12} color={ACCENT} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis",
                whiteSpace: "nowrap", maxWidth: 240 }}>
                {getHostname(url)}
              </span>
              <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: 2 }}>↗</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Brief Panel ──────────────────────────────────────────────────────────────
function BriefPanel({ taskId, token }: { taskId: number; token: string | null }) {
  const [ctx, setCtx]       = useState<BriefContext | null>(null);
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
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "4px 0" }}>
      {[70, 90, 55].map((w, i) => (
        <div key={i} style={{ height: 11, borderRadius: 5, background: "#f1f5f9",
          width: `${w}%`, animation: "pulse 1.5s ease infinite" }} />
      ))}
    </div>
  );

  const hasContent = ctx && (ctx.topicName || ctx.existingCaption || briefRows.some(r => ctx[r.key]));

  if (!hasContent) return (
    <div style={{ padding: "12px 14px", borderRadius: 10,
      background: ACCENT_LIGHT, border: `1px solid ${ACCENT_MID}`,
      fontSize: 12, color: ACCENT }}>
      Aucune donnée de brief pour ce post.
    </div>
  );

  return (
    <div>
      {/* Topic */}
      {ctx?.topicName && (
        <div style={{ fontSize: 13, color: "#0f172a", marginBottom: 18,
          padding: "10px 14px", background: "#f8f9fc", borderRadius: 10,
          border: "1px solid #ebebf0", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>📌</span>
          <span>{ctx.topicName}</span>
        </div>
      )}

      {briefRows.filter(r => ctx![r.key]).map(r => (
        <SmartField key={r.key} label={r.label} value={String(ctx![r.key])} />
      ))}

      {ctx?.existingCaption && (
        <div style={{ marginTop: 4, padding: "12px 14px", borderRadius: 10,
          background: "#fafafa", border: "1px dashed #e2e8f0" }}>
          <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase",
            letterSpacing: "0.08em", marginBottom: 6 }}>
            Caption de référence
          </div>
          <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.75,
            whiteSpace: "pre-wrap" }}>
            {ctx.existingCaption}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Task Card (light mode) ───────────────────────────────────────────────────
function TaskCard({ task, active: _active, onClick }: {
  task: Assignment; active: boolean; onClick: () => void;
}) {
  const isDone = task.status === "done";

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      style={{ width: "100%", textAlign: "left", padding: 0,
        border: "none", background: "none", cursor: "pointer", fontFamily: "inherit" }}
    >
      <div
        style={{ borderRadius: 8, background: "#fff",
          border: "1px solid #e8eaf0",
          transition: "box-shadow .12s, border-color .12s",
          padding: "10px 12px" }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(9,30,66,0.12)";
          (e.currentTarget as HTMLElement).style.borderColor = "#c7cad4";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.boxShadow = "none";
          (e.currentTarget as HTMLElement).style.borderColor = "#e8eaf0";
        }}
      >
        {/* Label strip */}
        <div style={{ marginBottom: 8 }}>
          <span style={{ display: "inline-block", height: 7, width: 44, borderRadius: 4,
            background: isDone ? "#d1d5db" : ACCENT }} />
        </div>

        {/* Title */}
        <div style={{ fontSize: 13, color: "#172b4d", lineHeight: 1.5, marginBottom: 10 }}>
          {task.briefTitle}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, flex: 1 }}>
            <FiEye size={11} color="#9fadbc" />
            <FiAlignLeft size={11} color="#9fadbc" />
            {task.notes && <FiMessageSquare size={11} color="#9fadbc" />}
            {task.delegatedTo && (
              <span style={{ display: "flex", alignItems: "center", gap: 3,
                fontSize: 10, color: isDone ? "#9fadbc" : "#f59e0b" }}>
                <FiUsers size={10} />
              </span>
            )}
          </div>
          <div style={{ width: 24, height: 24, borderRadius: "50%",
            background: isDone ? "#e2e8f0" : ACCENT,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, color: isDone ? "#64748b" : "#fff",
            flexShrink: 0, letterSpacing: "0.02em" }}>
            {task.clientName.slice(0, 2).toUpperCase()}
          </div>
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
  const [sel,     setSel]     = useState<number | null>(null);
  const [notes,   setNotes]   = useState("");
  const [busy,    setBusy]    = useState(false);
  const [msg,     setMsg]     = useState<"success"|"error"|"">("");

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
      if (res.ok) {
        setMsg("success");
        setTimeout(() => { setMsg(""); setSel(null); setNotes(""); }, 2500);
        setTimeout(onRefresh, 1200);
      }
      else setMsg("error");
    } catch { setMsg("error"); }
    finally { setBusy(false); }
  };

  const selMember = members.find(m => m.id === sel);


  return (
    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column",
      gap: 20, height: "100%", overflowY: "auto", boxSizing: "border-box" }}>

      {/* Header */}
      <div>
        <div style={{ fontSize: 15, color: "#0f172a", marginBottom: 4 }}>Affecter à</div>
        <div style={{ fontSize: 12, color: "#94a3b8" }}>
          Choisis le {task.taskType === "image" ? "graphiste" : "rédacteur"} pour ce post
        </div>
      </div>

      {/* Success banner */}
      <AnimatePresence>
        {msg === "success" && (
          <motion.div key="success-banner"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
            style={{ display: "flex", alignItems: "center", gap: 10,
              padding: "12px 16px", borderRadius: 12,
              background: "#f0fdf4", border: "1px solid #bbf7d0",
              fontSize: 13, color: "#16a34a" }}>
            <FiCheckCircle size={15} />
            Assigné avec succès — tu peux modifier si besoin
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current delegation banner */}
      {task.delegatedTo && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
          borderRadius: 12, background: "#fafafa", border: "1px solid #ebebf0" }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#f1f5f9",
            border: "1px solid #e2e8f0", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 12, color: "#475569", flexShrink: 0 }}>
            {task.delegatedTo.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, fontSize: 12, color: "#475569" }}>
            Actuellement : <strong>{task.delegatedTo}</strong>
            <span style={{ color: "#94a3b8" }}> — {task.delegatedStatus === "done" ? "soumis" : "en cours"}</span>
          </div>
        </div>
      )}

      {/* Member list */}
      {members.length === 0 ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 8,
          borderRadius: 14, border: "1px dashed #ebebf0", padding: "32px" }}>
          <FiUsers size={22} color="#d1d5db" />
          <div style={{ fontSize: 13, color: "#94a3b8" }}>Aucun membre disponible</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {members.map(m => {
            const isSel = sel === m.id;
            return (
              <button key={m.id} onClick={() => setSel(isSel ? null : m.id)}
                style={{ display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px", borderRadius: 12,
                  border: `1.5px solid ${isSel ? ACCENT : "#ebebf0"}`,
                  background: isSel ? ACCENT_LIGHT : "#fff",
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "all .15s", textAlign: "left" }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%",
                  background: isSel ? ACCENT : "#f1f5f9",
                  border: `1.5px solid ${isSel ? ACCENT : "#e2e8f0"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, color: isSel ? "#fff" : "#475569", flexShrink: 0 }}>
                  {(m.name ?? m.email).slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: "#0f172a" }}>
                    {m.name ?? m.email.split("@")[0]}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.email}
                  </div>
                </div>
                <div style={{ width: 20, height: 20, borderRadius: "50%",
                  background: isSel ? ACCENT : "#f1f5f9",
                  border: `1.5px solid ${isSel ? ACCENT : "#e2e8f0"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, transition: "all .15s" }}>
                  {isSel && <FiCheck size={10} color="#fff" />}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Note + confirm — appear when member selected */}
      <AnimatePresence>
        {selMember && (
          <motion.div key="confirm"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.18 }}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}>

            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              rows={2} placeholder="Note pour le membre (optionnel)…"
              style={{ width: "100%", padding: "11px 14px", borderRadius: 12,
                border: "1.5px solid #ebebf0", fontSize: 13, outline: "none",
                boxSizing: "border-box", background: "#fafafa", resize: "none",
                fontFamily: "inherit", lineHeight: 1.6, transition: "border .15s, background .15s" }}
              onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.background = "#fff"; }}
              onBlur={e => { e.target.style.borderColor = "#ebebf0"; e.target.style.background = "#fafafa"; }}
            />

            {msg === "error" && (
              <div style={{ fontSize: 12, color: ACCENT, padding: "9px 12px",
                borderRadius: 10, background: ACCENT_LIGHT, border: `1px solid ${ACCENT_MID}` }}>
                ⚠️ Erreur — réessaie
              </div>
            )}

            <button onClick={submit} disabled={busy}
              style={{ padding: "13px", borderRadius: 12, border: "none",
                background: busy ? "#f1f5f9" : ACCENT,
                color: busy ? "#94a3b8" : "#fff", fontSize: 13,
                cursor: busy ? "not-allowed" : "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 8, transition: "all .18s" }}>
              <FiUsers size={14} />
              {busy ? "Assignation…" : `Assigner à ${selMember.name ?? selMember.email.split("@")[0]}`}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
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
  const [mode,        setMode]        = useState<"write" | "ai">("write");
  const [imageMode,   setImageMode]   = useState<"url" | "import" | "ai">("url");
  const [imageUrl,    setImageUrl]    = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<{ file: File; preview: string }[]>([]);
  const [imgPrompt,   setImgPrompt]   = useState("");
  const [generatedImg,setGeneratedImg]= useState("");
  const [imgGenLoading, setImgGenLoading] = useState(false);
  const [caption,     setCaption]     = useState(task.submittedContent ?? "");
  const [msgs,        setMsgs]        = useState<ChatMsg[]>([]);
  const [input,       setInput]       = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [busy,        setBusy]        = useState(false);
  const [submitMsg,   setSubmitMsg]   = useState("");
  const sessionId     = useRef(`team-${task.id}-${Date.now()}`);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const isCaption = task.taskType === "caption" || task.taskType === "full";
  const isImage   = task.taskType === "image"   || task.taskType === "full";

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, chatLoading]);

  const sendChat = async (text: string) => {
    if (!text.trim() || chatLoading) return;
    setMsgs(prev => [...prev, { id: crypto.randomUUID(), role: "user", content: text }]);
    setInput(""); setChatLoading(true);
    try {
      const res = await fetch(`${API}/api/assignments/${task.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text, sessionId: sessionId.current, tone: "professional" }),
      });
      const raw = await res.json();
      const generated = parseCaption(raw);
      const replyText = raw?.reply ?? raw?.message ?? (generated ? "Voici le caption généré ✨" : "Désolé, réessaie.");
      setMsgs(prev => [...prev, { id: crypto.randomUUID(), role: "bot", content: replyText, generatedCaption: generated || undefined }]);
    } catch {
      setMsgs(prev => [...prev, { id: crypto.randomUUID(), role: "bot", content: "⚠️ Erreur réseau." }]);
    } finally { setChatLoading(false); }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const items = Array.from(files).map(f => ({ file: f, preview: URL.createObjectURL(f) }));
    setUploadedFiles(prev => [...prev, ...items]);
  };

  const generateImage = async () => {
    if (!imgPrompt.trim() || imgGenLoading) return;
    setImgGenLoading(true);
    setGeneratedImg("");
    try {
      const res = await fetch(`${API}/api/assignments/${task.id}/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt: imgPrompt }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedImg(data.imageUrl ?? data.url ?? "");
      } else {
        setSubmitMsg("⚠️ Impossible de générer l'image");
      }
    } catch { setSubmitMsg("⚠️ Erreur réseau"); }
    finally { setImgGenLoading(false); }
  };

  const applyCaption = (c: string) => {
    setCaption(c);
    setMode("write");
    setSubmitMsg("✅ Caption prête — vérifie et soumets.");
  };

  const submit = async () => {
    setBusy(true);
    try {
      let finalImageUrl = imageUrl;
      if (isImage) {
        if (imageMode === "import") {
          const urls: string[] = [];
          for (const item of uploadedFiles) {
            const fd = new FormData();
            fd.append("file", item.file);
            const up = await fetch(`${API}/api/assignments/${task.id}/upload-image`, {
              method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd,
            });
            if (up.ok) { const d = await up.json(); urls.push(d.url ?? d.imageUrl ?? ""); }
          }
          finalImageUrl = urls.join(",");
        } else if (imageMode === "ai") {
          finalImageUrl = generatedImg;
        }
      }
      const res = await fetch(`${API}/api/assignments/${task.id}/submit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          content: isCaption ? caption : finalImageUrl,
          imageUrl: isImage ? finalImageUrl : null,
          caption: isCaption ? caption : null,
        }),
      });
      if (res.ok) { setSubmitMsg("✅ Tâche soumise !"); setTimeout(onRefresh, 1200); }
      else setSubmitMsg("⚠️ Erreur lors de la soumission");
    } catch { setSubmitMsg("⚠️ Erreur réseau"); }
    finally { setBusy(false); }
  };

  const canSubmit = !busy && (
    (isCaption && caption.trim().length > 0) ||
    (isImage && imageMode === "url"    && imageUrl.trim().length > 0) ||
    (isImage && imageMode === "import" && uploadedFiles.length > 0) ||
    (isImage && imageMode === "ai"     && generatedImg.length > 0)
  );

  const fieldBase: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: 12,
    border: "1.5px solid #ebebf0", fontSize: 13, outline: "none",
    boxSizing: "border-box", background: "#fafafa", fontFamily: "inherit",
    transition: "border .15s, background .15s", lineHeight: 1.7,
  };

  return (
    <div style={{ display: "flex", height: "100%", width: "100%", overflow: "hidden" }}>

      {/* ── Left: brief ── */}
      <div style={{ width: 340, flexShrink: 0, borderRight: "1px solid #f0f0f5",
        overflowY: "auto", background: "#fafafa", padding: "20px 18px" }}>
        <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase",
          letterSpacing: "0.08em", marginBottom: 14 }}>Contenu du post</div>
        <BriefPanel taskId={task.id} token={token} />
      </div>

      {/* ── Right: work area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column",
        overflow: "hidden", background: "#fff", minWidth: 0 }}>

        {/* Image mode toggle */}
        {isImage && (
          <div style={{ padding: "16px 20px 0", flexShrink: 0 }}>
            <div style={{ display: "inline-flex", background: "#f4f5f7",
              borderRadius: 12, padding: 4, gap: 2 }}>
              {([
                ["url",    "🔗 Coller une URL"],
                ["import", "📎 Importer"],
                ["ai",     "✨ Générer avec l'IA"],
              ] as const).map(([key, label]) => (
                <button key={key} onClick={() => setImageMode(key)}
                  style={{ padding: "8px 18px", borderRadius: 9, border: "none",
                    background: imageMode === key ? "#fff" : "transparent",
                    color: imageMode === key ? "#0f172a" : "#64748b",
                    fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                    boxShadow: imageMode === key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                    transition: "all .15s" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Caption mode toggle */}
        {isCaption && (
          <div style={{ padding: isImage ? "8px 20px 0" : "16px 20px 0", flexShrink: 0 }}>
            <div style={{ display: "inline-flex", background: "#f4f5f7",
              borderRadius: 12, padding: 4, gap: 2 }}>
              {([
                ["write", "✍️ Rédiger moi-même"],
                ["ai",    "✨ Générer avec l'IA"],
              ] as const).map(([key, label]) => (
                <button key={key} onClick={() => setMode(key)}
                  style={{ padding: "8px 18px", borderRadius: 9, border: "none",
                    background: mode === key ? "#fff" : "transparent",
                    color: mode === key ? "#0f172a" : "#64748b",
                    fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                    boxShadow: mode === key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                    transition: "all .15s" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content area */}
        <div style={{ flex: 1, overflowY: "auto", padding: isCaption ? "8px 20px" : "16px 20px",
          display: "flex", flexDirection: "column", gap: 12 }}>

          {/* ── Image modes ── */}
          {isImage && imageMode === "url" && (
            <div>
              <label style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase",
                letterSpacing: "0.07em", display: "block", marginBottom: 8 }}>
                URL du visuel
              </label>
              <input value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                placeholder="https://drive.google.com/…"
                style={fieldBase}
                onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.background = "#fff"; }}
                onBlur={e => { e.target.style.borderColor = "#ebebf0"; e.target.style.background = "#fafafa"; }}
              />
              {imageUrl && (
                <img src={imageUrl} alt="preview"
                  style={{ marginTop: 10, width: "100%", maxHeight: 200, objectFit: "cover",
                    borderRadius: 12, border: "1px solid #ebebf0" }}
                  onError={e => (e.currentTarget.style.display = "none")} />
              )}
            </div>
          )}

          {isImage && imageMode === "import" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input ref={fileInputRef} type="file" accept="image/*" multiple
                style={{ display: "none" }}
                onChange={e => handleFileSelect(e.target.files)} />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleFileSelect(e.dataTransfer.files); }}
                style={{ border: "2px dashed #ebebf0", borderRadius: 16, padding: "32px 20px",
                  textAlign: "center", cursor: "pointer", background: "#fafafa",
                  transition: "border-color .15s, background .15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = ACCENT; (e.currentTarget as HTMLDivElement).style.background = "#fff1f2"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#ebebf0"; (e.currentTarget as HTMLDivElement).style.background = "#fafafa"; }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📎</div>
                <div style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>Glisse tes images ici</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>ou clique pour sélectionner</div>
                <div style={{ fontSize: 11, color: "#cbd5e1", marginTop: 6 }}>PNG, JPG, WEBP — plusieurs fichiers acceptés</div>
              </div>
              {uploadedFiles.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10 }}>
                  {uploadedFiles.map((f, i) => (
                    <div key={i} style={{ position: "relative", borderRadius: 12, overflow: "hidden",
                      border: "1.5px solid #ebebf0", aspectRatio: "1" }}>
                      <img src={f.preview} alt={f.file.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      <button
                        onClick={() => setUploadedFiles(prev => prev.filter((_, j) => j !== i))}
                        style={{ position: "absolute", top: 5, right: 5, width: 22, height: 22,
                          borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.55)",
                          color: "#fff", cursor: "pointer", display: "flex",
                          alignItems: "center", justifyContent: "center", fontSize: 12 }}>
                        ×
                      </button>
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0,
                        padding: "3px 6px", background: "rgba(0,0,0,0.45)",
                        fontSize: 9, color: "#fff", overflow: "hidden",
                        whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                        {f.file.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {isImage && imageMode === "ai" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase",
                  letterSpacing: "0.07em", display: "block", marginBottom: 8 }}>
                  Décris l'image à générer
                </label>
                <textarea value={imgPrompt} onChange={e => setImgPrompt(e.target.value)}
                  rows={3} placeholder="Ex : produit boucherie sur fond blanc, style épuré, lumière naturelle…"
                  style={{ ...fieldBase, resize: "none" }}
                  onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.background = "#fff"; }}
                  onBlur={e => { e.target.style.borderColor = "#ebebf0"; e.target.style.background = "#fafafa"; }}
                />
              </div>
              <button onClick={generateImage} disabled={!imgPrompt.trim() || imgGenLoading}
                style={{ alignSelf: "flex-start", padding: "10px 20px", borderRadius: 10, border: "none",
                  background: imgPrompt.trim() && !imgGenLoading ? ACCENT : "#f1f5f9",
                  color: imgPrompt.trim() && !imgGenLoading ? "#fff" : "#94a3b8",
                  fontSize: 13, cursor: imgPrompt.trim() && !imgGenLoading ? "pointer" : "not-allowed",
                  fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8, transition: "all .18s" }}>
                {imgGenLoading
                  ? <><span style={{ animation: "pulse 1s infinite" }}>⏳</span> Génération…</>
                  : <><span>✨</span> Générer l'image</>}
              </button>
              {generatedImg && (
                <div style={{ borderRadius: 14, overflow: "hidden", border: "1.5px solid #ebebf0" }}>
                  <img src={generatedImg} alt="generated"
                    style={{ width: "100%", maxHeight: 260, objectFit: "contain", display: "block", background: "#f8f9fc" }} />
                  <div style={{ padding: "10px 14px", borderTop: "1px solid #f0f0f5",
                    fontSize: 12, color: ACCENT, background: ACCENT_LIGHT, textAlign: "center" }}>
                    ✓ Image générée — prête à soumettre
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Write mode (caption) ── */}
          {(mode === "write" || !isCaption) && (
            <>
              {isCaption && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <textarea value={caption} onChange={e => setCaption(e.target.value)}
                    placeholder="Rédige ton caption ici…"
                    style={{ ...fieldBase, flex: 1, minHeight: 200, resize: "none" }}
                    onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.background = "#fff"; }}
                    onBlur={e => { e.target.style.borderColor = "#ebebf0"; e.target.style.background = "#fafafa"; }}
                  />
                  <div style={{ textAlign: "right", fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
                    {caption.length} caractères
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── AI mode ── */}
          {mode === "ai" && isCaption && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column",
              border: "1.5px solid #ebebf0", borderRadius: 16, overflow: "hidden",
              background: "#fff" }}>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "16px",
                display: "flex", flexDirection: "column", gap: 10, minHeight: 200 }}>
                {msgs.length === 0 && (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 8,
                    padding: "32px", textAlign: "center" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: ACCENT_LIGHT,
                      display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <FiSend size={18} color={ACCENT} />
                    </div>
                    <div style={{ fontSize: 13, color: "#374151" }}>Décris ce que tu veux générer</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
                      Ex : "caption pour une promo -30%, ton dynamique"
                    </div>
                  </div>
                )}
                {msgs.map(m => (
                  <div key={m.id} style={{ display: "flex", flexDirection: "column",
                    alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
                    <div style={{ maxWidth: "82%", padding: "10px 14px", fontSize: 13,
                      lineHeight: 1.65,
                      borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      background: m.role === "user" ? ACCENT : "#f4f5f8",
                      color: m.role === "user" ? "#fff" : "#1e293b" }}>
                      {m.content}
                    </div>
                    {m.role === "bot" && m.generatedCaption && (
                      <div style={{ maxWidth: "90%", marginTop: 8, borderRadius: 14,
                        border: "1px solid #ebebf0", overflow: "hidden" }}>
                        <div style={{ padding: "12px 16px", fontSize: 13, color: "#1e293b",
                          lineHeight: 1.8, whiteSpace: "pre-wrap",
                          borderBottom: "1px solid #f0f0f5" }}>
                          {m.generatedCaption}
                        </div>
                        <button onClick={() => applyCaption(m.generatedCaption!)}
                          style={{ width: "100%", padding: "10px 16px", border: "none",
                            background: ACCENT_LIGHT, color: ACCENT, fontSize: 12,
                            cursor: "pointer", fontFamily: "inherit",
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
                  <div style={{ display: "flex", gap: 5, padding: "12px 16px",
                    borderRadius: "16px 16px 16px 4px", background: "#f4f5f8",
                    width: "fit-content" }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: "50%",
                        background: "#cbd5e1", animation: "chatdot 1.2s ease infinite",
                        animationDelay: `${i * 0.18}s` }} />
                    ))}
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat input */}
              <div style={{ padding: "10px 12px", borderTop: "1px solid #f0f0f5",
                display: "flex", gap: 8, background: "#fff" }}>
                <textarea value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(input); } }}
                  rows={2} disabled={chatLoading}
                  placeholder="Décris ce que tu veux générer…"
                  style={{ ...fieldBase, flex: 1, resize: "none", padding: "10px 12px" }}
                  onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.background = "#fff"; }}
                  onBlur={e => { e.target.style.borderColor = "#ebebf0"; e.target.style.background = "#fafafa"; }}
                />
                <button onClick={() => sendChat(input)} disabled={chatLoading || !input.trim()}
                  style={{ width: 42, height: 42, borderRadius: 12, border: "none",
                    background: chatLoading || !input.trim() ? "#f1f5f9" : ACCENT,
                    color: chatLoading || !input.trim() ? "#94a3b8" : "#fff",
                    cursor: chatLoading || !input.trim() ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    alignSelf: "flex-end", flexShrink: 0, transition: "all .15s" }}>
                  <FiSend size={15} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Submit bar ── */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid #f0f0f5",
          background: "#fff", flexShrink: 0, display: "flex",
          flexDirection: "column", gap: 8 }}>

          {submitMsg && (
            <div style={{ fontSize: 12, padding: "8px 12px", borderRadius: 10,
              background: submitMsg.startsWith("✅") ? "#f0fdf4" : ACCENT_LIGHT,
              color: submitMsg.startsWith("✅") ? "#16a34a" : ACCENT,
              border: `1px solid ${submitMsg.startsWith("✅") ? "#bbf7d0" : ACCENT_MID}` }}>
              {submitMsg}
            </div>
          )}

          <button onClick={submit} disabled={!canSubmit}
            style={{ padding: "13px", borderRadius: 12, border: "none",
              background: canSubmit ? ACCENT : "#f1f5f9",
              color: canSubmit ? "#fff" : "#94a3b8", fontSize: 13,
              cursor: canSubmit ? "pointer" : "not-allowed", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all .18s" }}>
            <FiSend size={14} />
            {busy ? "Envoi en cours…" : "Soumettre la tâche"}
          </button>
        </div>
      </div>
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

// ─── Chef Review Workspace ────────────────────────────────────────────────────
function ChefReviewWorkspace({ task, token, onRefresh }: {
  task: Assignment; token: string | null; onRefresh: () => void;
}) {
  const [note, setNote]   = useState("");
  const [busy, setBusy]   = useState(false);
  const [msg, setMsg]     = useState<"approved" | "rejected" | "error" | null>(null);

  const approve = async () => {
    setBusy(true);
    try {
      const res = await fetch(`${API}/api/assignments/${task.id}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { setMsg("approved"); setTimeout(onRefresh, 1400); }
      else setMsg("error");
    } catch { setMsg("error"); }
    finally { setBusy(false); }
  };

  const reject = async () => {
    if (!note.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`${API}/api/assignments/${task.id}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ note }),
      });
      if (res.ok) { setMsg("rejected"); setTimeout(onRefresh, 1400); }
      else setMsg("error");
    } catch { setMsg("error"); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ padding: "32px 36px", maxWidth: 720, width: "100%",
      display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: "#fef9c3",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <FiAlertCircle size={18} color="#ca8a04" />
        </div>
        <div>
          <div style={{ fontSize: 15, color: "#0f172a" }}>Travail soumis — en attente de validation</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
            Soumis par <strong>{task.delegatedTo}</strong>
            {task.submittedAt ? ` · ${fmtDate(task.submittedAt)}` : ""}
          </div>
        </div>
      </div>

      {/* Submitted content */}
      {task.submittedContent ? (
        <div style={{ borderRadius: 16, border: "1.5px solid #f0f0f5", background: "#fff", overflow: "hidden" }}>
          <div style={{ padding: "12px 18px", borderBottom: "1.5px solid #f0f0f5",
            fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Contenu soumis
          </div>
          <div style={{ padding: "18px 20px", fontSize: 14, color: "#1e293b",
            lineHeight: 1.85, whiteSpace: "pre-wrap" }}>
            {task.submittedContent}
          </div>
        </div>
      ) : (
        <div style={{ padding: "24px", textAlign: "center", borderRadius: 16,
          border: "1.5px dashed #e2e8f0", color: "#94a3b8", fontSize: 13 }}>
          Aucun contenu texte soumis (visuel uniquement)
        </div>
      )}

      {/* Feedback area */}
      {msg !== "approved" && msg !== "rejected" && (
        <>
          <div>
            <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase",
              letterSpacing: "0.07em", marginBottom: 8 }}>
              Note de retour (obligatoire pour refuser)
            </div>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
              placeholder="Explique ce qui doit être corrigé ou amélioré…"
              style={{ width: "100%", padding: "13px 16px", borderRadius: 14,
                border: "2px solid #f0f0f5", fontSize: 13, outline: "none",
                boxSizing: "border-box", background: "#fafafa", resize: "vertical",
                fontFamily: "inherit", lineHeight: 1.7, transition: "border .15s, background .15s" }}
              onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.background = "#fff"; }}
              onBlur={e => { e.target.style.borderColor = "#f0f0f5"; e.target.style.background = "#fafafa"; }}
            />
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            {/* Approve */}
            <button onClick={approve} disabled={busy}
              style={{ flex: 1, padding: "13px", borderRadius: 14, border: "none",
                background: busy ? "#f1f5f9" : "#16a34a",
                color: busy ? "#94a3b8" : "#fff", fontSize: 14,
                cursor: busy ? "not-allowed" : "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all .18s" }}>
              <FiCheck size={15} />
              {busy ? "…" : "Approuver"}
            </button>

            {/* Reject */}
            <button onClick={reject} disabled={busy || !note.trim()}
              style={{ flex: 1, padding: "13px", borderRadius: 14, border: "none",
                background: busy || !note.trim() ? "#f1f5f9" : ACCENT,
                color: busy || !note.trim() ? "#94a3b8" : "#fff", fontSize: 14,
                cursor: busy || !note.trim() ? "not-allowed" : "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all .18s" }}>
              <FiX size={15} />
              {busy ? "…" : "Refuser & renvoyer"}
            </button>
          </div>

          {msg === "error" && (
            <div style={{ padding: "12px 16px", borderRadius: 12, background: ACCENT_LIGHT,
              border: `1px solid ${ACCENT_MID}`, fontSize: 12, color: ACCENT }}>
              ⚠️ Erreur — réessaie
            </div>
          )}
        </>
      )}

      {/* Result message */}
      {msg === "approved" && (
        <div style={{ padding: "16px 20px", borderRadius: 14, background: "#f0fdf4",
          border: "1.5px solid #bbf7d0", fontSize: 13, color: "#16a34a",
          display: "flex", alignItems: "center", gap: 10 }}>
          <FiCheckCircle size={16} /> Tâche approuvée — bien joué !
        </div>
      )}
      {msg === "rejected" && (
        <div style={{ padding: "16px 20px", borderRadius: 14, background: "#fff7ed",
          border: "1.5px solid #fed7aa", fontSize: 13, color: "#92400e",
          display: "flex", alignItems: "center", gap: 10 }}>
          <FiAlertCircle size={16} /> Tâche renvoyée au membre avec ta note.
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MyTasksView({ token, role }: { token: string | null; role?: string | null }) {
  const [tasks, setTasks]       = useState<Assignment[]>([]);
  const [members, setMembers]   = useState<Member[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [activeId, setActiveId] = useState<number | null>(null);
  const isChef = role === "ChefVisuel" || role === "ChefRedac" || role === "ChefEquipe";

  const load = async () => {
    setLoading(true); setError("");
    try {
      const [taskRes, teamRes] = await Promise.all([
        fetch(`${API}/api/assignments/my`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/team`,            { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (taskRes.ok) {
        const data = await taskRes.json();
        setTasks(data);
        if (data.length > 0 && !activeId) setActiveId(data[0].id);
      } else { setError(`Erreur ${taskRes.status}`); }
      if (teamRes.ok) setMembers(await teamRes.json());
    } catch (e: any) { setError(`Réseau : ${e?.message}`); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const active = tasks.find(t => t.id === activeId) ?? null;

  // Chef columns: 4 stages
  const toDelegate = tasks.filter(t => t.status === "pending" && !t.delegatedTo);
  const inProgress = tasks.filter(t => t.status === "pending" && t.delegatedTo && t.delegatedStatus !== "done");
  const toReview   = tasks.filter(t => t.status === "pending" && t.delegatedTo && t.delegatedStatus === "done");
  const completed  = tasks.filter(t => t.status === "done");

  // Member columns: 2 stages
  const pending = tasks.filter(t => t.status === "pending");
  const done    = tasks.filter(t => t.status === "done");

  const chefColumns = [
    { label: "À affecter",  color: "#f59e0b", tasks: toDelegate, icon: FiAlertCircle },
    { label: "En cours",    color: "#3b82f6", tasks: inProgress, icon: FiClock       },
    { label: "À valider",   color: ACCENT,    tasks: toReview,   icon: FiEye         },
    { label: "Validées",    color: "#16a34a", tasks: completed,  icon: FiCheckCircle },
  ];

  const memberColumns = [
    { label: "En attente", color: ACCENT,    tasks: pending, icon: FiClock       },
    { label: "Terminées",  color: "#6b7280", tasks: done,    icon: FiCheckCircle },
  ];

  const columns = isChef ? chefColumns : memberColumns;

  const closeModal = () => setActiveId(null);

  // Each chef sees only their own team type
  const visibleMembers = role === "ChefVisuel" ? members.filter(m => m.role === "Graphiste")
                       : role === "ChefRedac"  ? members.filter(m => m.role === "Redacteur")
                       : members; // ChefEquipe sees everyone

  return (
    <div style={{ display: "flex", width: "100%", height: "100%",
      background: "#fff", fontFamily: "inherit",
      boxSizing: "border-box", overflow: "hidden" }}>

      {/* ── Chef: team sidebar ── */}
      {isChef && (
        <div style={{ width: 220, flexShrink: 0, background: "#fff",
          borderRight: "1px solid #ebebf0", borderRadius: "0 14px 14px 0",
          margin: "12px 0 12px 12px",
          display: "flex", flexDirection: "column", overflow: "hidden",
          border: "1px solid #ebebf0" }}>

          <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid #f0f0f5" }}>
            <div style={{ fontSize: 13, color: "#172b4d" }}>Mon équipe</div>
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
              {visibleMembers.length} membre{visibleMembers.length !== 1 ? "s" : ""}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px" }}>
            {loading ? (
              [1,2,3].map(i => (
                <div key={i} style={{ height: 56, borderRadius: 10, background: "#f4f5f7",
                  marginBottom: 8, animation: "pulse 1.5s ease infinite" }} />
              ))
            ) : visibleMembers.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 8px",
                fontSize: 12, color: "#94a3b8" }}>
                Aucun membre
              </div>
            ) : visibleMembers.map(m => {
              const memberTasks = tasks.filter(t =>
                t.delegatedTo === (m.name ?? m.email.split("@")[0])
              );
              const active_  = memberTasks.filter(t => t.delegatedStatus !== "done" && t.status !== "done").length;
              const waiting  = memberTasks.filter(t => t.delegatedStatus === "done"  && t.status !== "done").length;
              return (
                <div key={m.id} style={{ padding: "10px 12px", borderRadius: 10,
                  background: "#fff", border: "1px solid #ebebf0", marginBottom: 6,
                  display: "flex", alignItems: "center", gap: 8 }}>

                  {/* Name + role */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: "#172b4d",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.name ?? m.email.split("@")[0]}
                    </div>
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>{m.role}</div>
                  </div>

                  {/* Circles */}
                  <div title="En cours"
                    style={{ width: 30, height: 30, borderRadius: "50%",
                      background: "#f1f5f9", border: "1px solid #e2e8f0",
                      display: "flex", flexDirection: "column", alignItems: "center",
                      justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: "#475569", lineHeight: 1 }}>{active_}</span>
                    <span style={{ fontSize: 7, color: "#94a3b8", lineHeight: 1.2 }}>cours</span>
                  </div>

                  <div title="À valider"
                    style={{ width: 30, height: 30, borderRadius: "50%",
                      background: ACCENT + "12", border: `1px solid ${ACCENT}30`,
                      display: "flex", flexDirection: "column", alignItems: "center",
                      justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: ACCENT, lineHeight: 1 }}>{waiting}</span>
                    <span style={{ fontSize: 7, color: ACCENT + "99", lineHeight: 1.2 }}>valid.</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Right: header + kanban ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column",
        overflow: "hidden", padding: "0", boxSizing: "border-box",
        background: "#fff", margin: "12px 12px 12px 8px",
        border: "1px solid #ebebf0", borderRadius: 14 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 18px 12px" }}>
          <div>
            <div style={{ fontSize: 15, color: "#1d2125" }}>
              {isChef ? "Tableau des tâches" : "Mes tâches"}
            </div>
            <div style={{ fontSize: 11, color: "#5e6c84", marginTop: 2 }}>
              {isChef ? (
                <>
                  <span style={{ color: "#f59e0b" }}>{toDelegate.length}</span> à affecter ·{" "}
                  <span style={{ color: "#3b82f6" }}>{inProgress.length}</span> en cours ·{" "}
                  <span style={{ color: ACCENT }}>{toReview.length}</span> à valider ·{" "}
                  <span style={{ color: "#16a34a" }}>{completed.length}</span> validées
                </>
              ) : (
                <>
                  <span style={{ color: ACCENT }}>{pending.length}</span> en attente
                  {" · "}{done.length} terminée(s)
                </>
              )}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {error && <span style={{ fontSize: 11, color: ACCENT }}>{error}</span>}
            <button onClick={load}
              style={{ width: 34, height: 34, borderRadius: 11,
                border: "1.5px solid #ebebf0", background: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#94a3b8", transition: "all .15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#f8f9fc"; e.currentTarget.style.color = ACCENT; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#94a3b8"; }}>
              <FiRefreshCw size={13} />
            </button>
          </div>
        </div>

      {/* ── Kanban columns ── */}
      <div style={{ flex: 1, display: "flex", gap: 10, overflow: "hidden",
        alignItems: "flex-start", padding: "14px" }}>
        {loading ? (
          [0, 1].map(col => (
            <div key={col} style={{ width: 272, flexShrink: 0, borderRadius: 12,
              background: "#ebecf0", padding: "12px 8px",
              display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ height: 10, borderRadius: 5, background: "#d5d7db", width: "55%",
                marginBottom: 4, animation: "pulse 1.5s ease infinite" }} />
              {[1, 2].map(i => (
                <div key={i} style={{ height: 72, borderRadius: 8, background: "#fff",
                  animation: "pulse 1.5s ease infinite" }} />
              ))}
            </div>
          ))
        ) : tasks.length === 0 ? (
          <div style={{ width: 272, borderRadius: 12, background: "#ebecf0",
            padding: "32px 16px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 13, color: "#5e6c84" }}>Aucune tâche assignée</p>
          </div>
        ) : columns.map(col => (
          <div key={col.label} style={{ width: 272, flexShrink: 0, borderRadius: 12,
            background: "#ebecf0",
            display: "flex", flexDirection: "column", maxHeight: "100%", overflow: "hidden" }}>

            {/* Column header */}
            <div style={{ padding: "12px 12px 8px", display: "flex",
              alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, color: "#172b4d" }}>
                  {col.label}
                </span>
                <span style={{ fontSize: 12, color: "#5e6c84",
                  background: "rgba(9,30,66,0.08)",
                  padding: "1px 7px", borderRadius: 100 }}>
                  {col.tasks.length}
                </span>
              </div>
              <button style={{ background: "none", border: "none", cursor: "pointer",
                color: "#5e6c84", borderRadius: 6, width: 28, height: 28,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background .12s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(9,30,66,0.08)")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                <FiMoreHorizontal size={15} />
              </button>
            </div>

            {/* Cards */}
            <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px",
              display: "flex", flexDirection: "column", gap: 6 }}>
              {col.tasks.length === 0 ? (
                <div style={{ padding: "20px 8px", textAlign: "center",
                  fontSize: 12, color: "#9fadbc" }}>
                  Aucune tâche
                </div>
              ) : col.tasks.map(t => (
                <TaskCard key={t.id} task={t} active={false}
                  onClick={() => setActiveId(t.id)} />
              ))}
            </div>

            {/* Footer */}
            <div style={{ padding: "6px 8px 10px", flexShrink: 0 }}>
              <button style={{ width: "100%", padding: "7px 10px", borderRadius: 8,
                background: "none", border: "none", color: "#5e6c84",
                display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
                fontSize: 13, fontFamily: "inherit", transition: "background .12s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(9,30,66,0.08)")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                <FiPlus size={14} /> Ajouter une carte
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Modal popup ── */}
      <AnimatePresence>
        {active && (
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={closeModal}
            style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 1000, padding: "24px", backdropFilter: "blur(3px)" }}>

            <motion.div
              key="modal-panel"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={e => e.stopPropagation()}
              style={{ width: "92%", maxWidth: 1140, height: "88vh",
                borderRadius: 24, background: "#fff",
                border: "1.5px solid #ebebf0",
                display: "flex", flexDirection: "column", overflow: "hidden" }}>

              {/* Modal header */}
              <div style={{ padding: "18px 26px 16px", borderBottom: "1.5px solid #f0f0f5",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ ...badge(ACCENT, ACCENT_LIGHT) }}>
                      {TYPE[active.taskType]?.label}
                    </span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>N° {active.rowKey}</span>
                    <span style={{ ...badge(
                      active.status === "done" ? "#16a34a" : "#92400e",
                      active.status === "done" ? "#dcfce7" : "#fef9c3",
                    )}}>
                      {active.status === "done" ? "✓ Terminé" : "⏳ En cours"}
                    </span>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 500, color: "#0f172a",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {active.briefTitle}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                  {[
                    { label: "Client",      value: active.clientName },
                    { label: "Assigné par", value: active.assignedBy },
                  ].map(item => (
                    <div key={item.label} style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 9, color: "#94a3b8", textTransform: "uppercase",
                        letterSpacing: "0.07em", marginBottom: 2 }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: 12, color: "#374151" }}>{item.value}</div>
                    </div>
                  ))}
                  <button onClick={closeModal}
                    style={{ width: 34, height: 34, borderRadius: 11,
                      border: "1.5px solid #f0f0f5", background: "#f8f9fc",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", color: "#94a3b8", fontSize: 18, fontWeight: 400,
                      lineHeight: 1, transition: "all .15s", flexShrink: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.background = ACCENT_LIGHT; e.currentTarget.style.color = ACCENT; e.currentTarget.style.borderColor = ACCENT_MID; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#f8f9fc"; e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.borderColor = "#f0f0f5"; }}>
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal body */}
              <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
                {isChef ? (
                  /* Chef: brief always on left, action on right */
                  <>
                    <div style={{ width: 360, flexShrink: 0, borderRight: "1.5px solid #f0f0f5",
                      overflowY: "auto", background: "#f8f9fc", padding: "18px 16px",
                      display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase",
                        letterSpacing: "0.07em", marginBottom: 4 }}>
                        Contenu du post
                      </div>
                      <BriefPanel taskId={active.id} token={token} />
                    </div>
                    <div style={{ flex: 1, overflowY: "auto", background: "#fff" }}>
                      <AnimatePresence mode="wait">
                        <motion.div key={active.id}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          transition={{ duration: 0.12 }}
                          style={{ minHeight: "100%" }}>
                          {active.status === "done" ? (
                            <DoneWorkspace task={active} />
                          ) : active.delegatedTo && active.delegatedStatus === "done" ? (
                            <ChefReviewWorkspace task={active} token={token} onRefresh={() => { load(); closeModal(); }} />
                          ) : (
                            <DelegateWorkspace task={active} token={token} onRefresh={() => { load(); closeModal(); }} />
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </>
                ) : (
                  /* Member: existing behavior */
                  <AnimatePresence mode="wait">
                    <motion.div key={active.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                      style={{ width: "100%", height: "100%", overflowY: "auto",
                        background: "#f8f9fc", display: "flex", justifyContent: "flex-start" }}>
                      <SubmitWorkspace task={active} token={token} onRefresh={() => { load(); closeModal(); }} />
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes chatdot { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-4px);opacity:1} }
      `}</style>
      </div>
    </div>
  );
}
