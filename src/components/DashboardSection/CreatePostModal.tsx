import { useState, useRef, useEffect } from "react";
import type { CSSProperties } from "react";

type ChatMessage = {
  id: string;
  role: "user" | "bot";
  content: string;
  captions?: Record<string, string> | null;
  confirmed?: boolean;
};

type BotResponse = {
  reply?: string;
  message?: string;
  confirmed?: boolean;
  finalCaption?: string;
  platform_posts?: Record<string, any>;
  output?: string;
};

type Props = {
  modal: any;
  setM: (data: any) => void;
  closeModal: () => void;
  handlePublish: () => void;
  handleSaveDraft: () => void;
  handleFileUpload: any;
  handleImageUpload: any;
  handleVideoUpload: any;
  handleGenerateImage?: any;
  handleGenerate?: () => void;
  togglePlatform: any;
  removeImage: any;
  copyCaption?: () => void;
  fileInputRef: any;
  imageInputRef: any;
  videoInputRef: any;
  copyDone?: boolean;
  PLATFORMS: any[];
};

const API_URL = "https://localhost:7079/api/posts/chat";
const SAVE_URL = "https://localhost:7079/api/posts/save";

const chip = (selected: boolean, color = "#3b82f6"): CSSProperties => ({
  padding: "6px 11px", borderRadius: 20, fontSize: 11,
  fontWeight: selected ? 700 : 400, border: "1px solid",
  borderColor: selected ? color : "#d1d5db",
  background: selected ? color + "18" : "#fff",
  color: selected ? color : "#6b7280",
  cursor: "pointer", transition: "all .15s",
});

const S: { [key: string]: CSSProperties } = {
  col: { padding: 16, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" },
  divider: { borderRight: "1px solid #e5e7eb" },
  colTitle: { fontSize: 13, fontWeight: 700, color: "#111827" },
  label: { fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" },
  input: {
    width: "100%", padding: "8px 10px", borderRadius: 8,
    border: "1px solid #d1d5db", fontSize: 13, outline: "none", boxSizing: "border-box",
  },
};

const tryParseJSON = (text: string): any => {
  try { return JSON.parse(text); } catch { return null; }
};

const parseBotResponse = (raw: any): BotResponse => {
  let parsed: any = raw;
  if (typeof raw === "string") parsed = tryParseJSON(raw) ?? { reply: raw };
  if (parsed?.output) {
    const inner = tryParseJSON(parsed.output);
    if (inner) parsed = inner;
  }
  return parsed as BotResponse;
};

const buildBotMessage = (raw: any): { msg: ChatMessage; response: BotResponse } => {
  const response = parseBotResponse(raw);
  const captions: Record<string, string> = {};
  const p = response?.platform_posts ?? {};
  if (p?.Instagram?.caption)          captions["Instagram"]      = p.Instagram.caption;
  if (p?.LinkedIn?.post)              captions["LinkedIn"]       = p.LinkedIn.post;
  if (p?.Facebook?.post)              captions["Facebook"]       = p.Facebook.post;
  if (p?.["X-Twitter"]?.post)         captions["X-Twitter"]      = p["X-Twitter"].post;
  if (p?.TikTok?.caption)             captions["TikTok"]         = p.TikTok.caption;
  if (p?.Threads?.text_post)          captions["Threads"]        = p.Threads.text_post;
  if (p?.YouTube_Shorts?.description) captions["YouTube_Shorts"] = p.YouTube_Shorts.description;

  const msg: ChatMessage = {
    id: crypto.randomUUID(), role: "bot",
    content: response?.reply || response?.message || "Voici tes captions ✨",
    captions: Object.keys(captions).length > 0 ? captions : null,
    confirmed: false,
  };
  return { msg, response };
};

export default function CreatePostModal(props: Props) {
  const {
    modal, setM, closeModal,
    handlePublish, handleSaveDraft,
    handleFileUpload, handleImageUpload, handleVideoUpload,
    togglePlatform, removeImage,
    fileInputRef, imageInputRef, videoInputRef,
    PLATFORMS,
  } = props;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [confirmedCaption, setConfirmedCaption] = useState<string | null>(null);
  const [activePlatformTab, setActivePlatformTab] = useState<string>("Instagram");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const sessionId = useRef<string>(crypto.randomUUID());
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading]);

  useEffect(() => {
    if (modal.open) {
      setMessages([]);
      setUserInput("");
      setChatLoading(false);
      setConfirmedCaption(null);
      setActivePlatformTab("Instagram");
      setSaved(false);
      sessionId.current = crypto.randomUUID();
    }
  }, [modal.open]);

  // ── debug: log topicId chaque fois qu'il change ──
  useEffect(() => {
    console.log("[CreatePostModal] topicId =", modal.topicId);
  }, [modal.topicId]);

  const callChat = async (messageText: string) => {
    const topicId = Number(modal.topicId);
    if (!topicId || topicId === 0) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: "bot",
        content: "❌ Erreur : topicId manquant. Ouvre ce modal depuis un Topic.",
        captions: null,
      }]);
      return;
    }

    setChatLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          message: messageText,
          topicId,
          toneOfVoice: modal.tone,
          captionLength: modal.captionLength,
          hashtags: modal.hashtags,
          platforms: modal.selectedPlatforms,
          fileContent: modal.fileContent || "",
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`${res.status} — ${errText}`);
      }

      const data = await res.json();
      const { msg, response } = buildBotMessage(data);

      if (msg.captions) {
        const firstMatch = modal.selectedPlatforms.find((p: string) => msg.captions![p]);
        setActivePlatformTab(firstMatch || Object.keys(msg.captions)[0] || "Instagram");
        const previewCaption = msg.captions["Instagram"] || Object.values(msg.captions)[0];
        setM({ generatedContent: previewCaption });
      }

      setMessages(prev => [...prev, msg]);

      if (response?.confirmed && response?.finalCaption) {
        setConfirmedCaption(response.finalCaption);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: "bot",
        content: `❌ Erreur : ${err.message || "Connexion impossible."}`,
        captions: null,
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!modal.topic && !modal.fileContent) {
      setM({ error: "Ajoute un sujet ou un fichier." }); return;
    }
    if (modal.selectedPlatforms.length === 0) {
      setM({ error: "Sélectionne au moins une plateforme." }); return;
    }
    setM({ error: "" });
    setSaved(false);
    setConfirmedCaption(null);

    const initialPrompt = `Génère une caption pour les paramètres suivants :
- Sujet : ${modal.topic || "(voir fichier)"}
- Ton : ${modal.tone}
- Longueur : ${modal.captionLength}
- Hashtags : ${modal.hashtags}
- Plateformes : ${modal.selectedPlatforms.join(", ")}
${modal.fileContent ? `- Contenu du fichier : ${modal.fileContent.slice(0, 500)}` : ""}`;

    setMessages([{ id: crypto.randomUUID(), role: "user", content: initialPrompt }]);
    await callChat(initialPrompt);
  };

  const handleUserSend = async () => {
    if (!userInput.trim() || chatLoading) return;
    const text = userInput.trim();
    setUserInput("");
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "user", content: text }]);
    await callChat(text);
  };

  const confirmCaption = (captions: Record<string, string>, msgId: string) => {
    const caption = captions[activePlatformTab] ?? Object.values(captions)[0];
    setConfirmedCaption(caption);
    setM({ generatedContent: caption });
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, confirmed: true } : m));
  };

  const saveCaption = async () => {
    if (!confirmedCaption) return;
    setSaving(true);
    try {
      const res = await fetch(SAVE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          caption: confirmedCaption,
          sessionId: sessionId.current,
          topicId: Number(modal.topicId) || 0,
          userId: 0,   // backend uses JWT, this is ignored by AllowAnonymous endpoint — see note below
          tone: modal.tone,
          captionLength: modal.captionLength,
          platforms: modal.selectedPlatforms,
          hashtags: modal.hashtags,
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }
      setSaved(true);
    } catch (err: any) {
      alert(`❌ Erreur sauvegarde : ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!modal.open) return null;

  return (
    <div onClick={closeModal} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.52)",
      backdropFilter: "blur(4px)", display: "flex", alignItems: "center",
      justifyContent: "center", padding: 20, zIndex: 1000,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", width: "95vw", maxWidth: 1380, height: "90vh",
        borderRadius: 20, display: "flex", flexDirection: "column",
        overflow: "hidden", boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
      }}>

        {/* HEADER */}
        <div style={{
          padding: "14px 24px", borderBottom: "1px solid #e5e7eb",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "#fafafa",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>✨ Create Post</h2>
            {/* debug badge — retire en prod */}
            {modal.topicId
              ? <span style={{ fontSize: 11, background: "#d1fae5", color: "#065f46", padding: "2px 8px", borderRadius: 20 }}>topic #{modal.topicId}</span>
              : <span style={{ fontSize: 11, background: "#fee2e2", color: "#991b1b", padding: "2px 8px", borderRadius: 20 }}>⚠ no topicId</span>
            }
          </div>
          <button onClick={closeModal} style={{ background: "transparent", border: "none", fontSize: 20, cursor: "pointer", color: "#6b7280" }}>✕</button>
        </div>

        {/* 3-COLUMN BODY */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* COL 1 — SETTINGS */}
          <div style={{ ...S.col, ...S.divider, width: 280, minWidth: 260, flexShrink: 0 }}>
            <div style={S.colTitle}>⚙️ Settings</div>

            <div>
              <label style={S.label}>Sujet / Topic</label>
              <textarea rows={3} placeholder="De quoi parle ce post ?"
                value={modal.topic}
                onChange={e => setM({ topic: e.target.value, error: "" })}
                style={{ ...S.input, resize: "vertical" as const }}
              />
            </div>

            <div>
              <label style={S.label}>Fichier <span style={{ fontWeight: 400, color: "#9ca3af" }}>(PDF / TXT)</span></label>
              <div onClick={() => fileInputRef.current?.click()} style={{
                border: "1.5px dashed #d1d5db", borderRadius: 8, padding: "12px",
                textAlign: "center" as const, cursor: "pointer", fontSize: 12, color: "#6b7280",
              }}>
                {modal.fileName ? `✅ ${modal.fileName}` : "📄 Cliquer pour upload"}
              </div>
              <input ref={fileInputRef} type="file" accept=".txt,.pdf" onChange={handleFileUpload} style={{ display: "none" }} />
            </div>

            <div>
              <label style={S.label}>Longueur de caption</label>
              <div style={{ display: "flex", gap: 6 }}>
                {(["short", "medium", "long"] as const).map(v => (
                  <button key={v} onClick={() => setM({ captionLength: v })}
                    style={{ ...chip(modal.captionLength === v), flex: 1, fontSize: 11 }}>
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={S.label}>Ton</label>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                {(["professional", "casual", "funny", "inspirational"] as const).map(v => (
                  <button key={v} onClick={() => setM({ tone: v })} style={chip(modal.tone === v)}>
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={S.label}>Hashtags</label>
              <input placeholder="#automation #n8n #ai" value={modal.hashtags}
                onChange={e => setM({ hashtags: e.target.value })} style={S.input} />
            </div>

            <div>
              <label style={S.label}>Plateformes</label>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                {PLATFORMS.map(p => {
                  const sel = modal.selectedPlatforms.includes(p.id);
                  return (
                    <button key={p.id} onClick={() => togglePlatform(p.id)} style={chip(sel, p.color)}>
                      {p.icon} {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {modal.error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#dc2626" }}>
                ⚠️ {modal.error}
              </div>
            )}

            <button onClick={handleGenerate}
              disabled={(!modal.topic && !modal.fileContent) || modal.selectedPlatforms.length === 0 || chatLoading}
              style={{
                marginTop: "auto", padding: "12px", borderRadius: 9, border: "none",
                background: ((!modal.topic && !modal.fileContent) || modal.selectedPlatforms.length === 0 || chatLoading) ? "#9ca3af" : "#3b82f6",
                color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700,
              }}>
              {chatLoading ? "⏳ Génération..." : "✨ Générer"}
            </button>
          </div>

          {/* COL 2 — CHATBOT */}
          <div style={{ ...S.col, flex: 1, ...S.divider, gap: 0, padding: 0 }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", fontWeight: 700, fontSize: 13, color: "#111" }}>
              💬 Assistant Caption
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>
              {messages.length === 0 && (
                <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, marginTop: 40 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🤖</div>
                  Configure tes settings et clique <strong>Générer</strong>.<br />
                  Tu pourras ensuite affiner la caption ici.
                </div>
              )}

              {messages.map(msg => (
                <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start", width: "100%" }}>
                  <div style={{
                    maxWidth: "82%", padding: "10px 14px",
                    borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: msg.role === "user" ? "#3b82f6" : "#f3f4f6",
                    color: msg.role === "user" ? "#fff" : "#111",
                    fontSize: 13, lineHeight: 1.55, whiteSpace: "pre-wrap",
                  }}>
                    {msg.content}
                  </div>

                  {msg.role === "bot" && msg.captions && Object.keys(msg.captions).length > 0 && (
                    <div style={{ marginTop: 8, maxWidth: "90%", width: "100%" }}>
                      {Object.keys(msg.captions).length > 1 && (
                        <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" as const }}>
                          {Object.keys(msg.captions).map(platform => (
                            <button key={platform} onClick={() => setActivePlatformTab(platform)} style={{
                              padding: "4px 10px", borderRadius: 12, border: "1px solid",
                              borderColor: activePlatformTab === platform ? "#3b82f6" : "#d1d5db",
                              background: activePlatformTab === platform ? "#3b82f6" : "#fff",
                              color: activePlatformTab === platform ? "#fff" : "#6b7280",
                              fontSize: 11, fontWeight: 600, cursor: "pointer",
                            }}>
                              {platform}
                            </button>
                          ))}
                        </div>
                      )}

                      <div style={{
                        background: msg.confirmed ? "#f0fdf4" : "#fff",
                        border: msg.confirmed ? "2px solid #22c55e" : "1.5px solid #e5e7eb",
                        borderRadius: 10, padding: "12px 14px",
                        fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", color: "#111",
                      }}>
                        {msg.captions?.[activePlatformTab] ?? Object.values(msg.captions)[0] ?? "Aucune caption disponible"}
                      </div>

                      {!msg.confirmed ? (
                        <button onClick={() => confirmCaption(msg.captions!, msg.id)} style={{
                          marginTop: 8, padding: "8px 18px", background: "#22c55e", color: "#fff",
                          border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer",
                        }}>
                          ✅ Confirmer cette caption
                        </button>
                      ) : (
                        <div style={{ marginTop: 8, color: "#22c55e", fontWeight: 700, fontSize: 12 }}>✅ Caption confirmée</div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {chatLoading && (
                <div style={{ display: "flex", alignItems: "flex-start" }}>
                  <div style={{ background: "#f3f4f6", borderRadius: "16px 16px 16px 4px", padding: "10px 16px", fontSize: 13, color: "#6b7280" }}>
                    ⏳ Génération en cours...
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            <div style={{ padding: "12px 16px", borderTop: "1px solid #e5e7eb", display: "flex", gap: 8 }}>
              <input value={userInput} onChange={e => setUserInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleUserSend(); } }}
                placeholder="Ex: rends-la plus courte, ajoute de l'humour..."
                style={{ ...S.input, flex: 1 }}
                disabled={chatLoading || messages.length === 0 || saved}
              />
              <button onClick={handleUserSend}
                disabled={chatLoading || !userInput.trim() || messages.length === 0 || saved}
                style={{
                  padding: "8px 16px", background: "#3b82f6", color: "#fff",
                  border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer",
                  opacity: (!userInput.trim() || chatLoading || messages.length === 0 || saved) ? 0.5 : 1,
                }}>
                ➤
              </button>
            </div>
          </div>

          {/* COL 3 — PREVIEW */}
          <div style={{ ...S.col, width: 300, minWidth: 260, flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>📱 Preview</div>

            <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", fontSize: 12 }}>
              <div style={{ background: "#fafafa", padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#e5e7eb" }} />
                <span style={{ fontWeight: 700, fontSize: 12 }}>your_brand</span>
              </div>
              {modal.uploadedImages?.[0] ? (
                <img src={modal.uploadedImages[0]} style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }} alt="Preview" />
              ) : (
                <div style={{ width: "100%", aspectRatio: "1", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 13 }}>
                  📸 Aucune image
                </div>
              )}
              <div style={{ padding: "10px 12px" }}>
                <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, whiteSpace: "pre-wrap", color: "#111" }}>
                  {modal.generatedContent || "Ta caption apparaîtra ici..."}
                </p>
              </div>
            </div>

            {confirmedCaption && (
              <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#166534", fontWeight: 600 }}>
                {saved ? "💾 Caption sauvegardée !" : (
                  <button onClick={saveCaption} disabled={saving} style={{
                    width: "100%", padding: "8px", background: "#22c55e", color: "#fff",
                    border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12,
                    cursor: saving ? "not-allowed" : "pointer",
                  }}>
                    {saving ? "Sauvegarde..." : "💾 Sauvegarder la caption"}
                  </button>
                )}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button onClick={() => imageInputRef.current?.click()} style={{ padding: "10px 16px", borderRadius: 9, border: "none", background: "#f3f4f6", color: "#374151", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                📸 Upload Image
              </button>
              <button onClick={() => videoInputRef.current?.click()} style={{ padding: "10px 16px", borderRadius: 9, border: "none", background: "#f3f4f6", color: "#374151", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                🎥 Upload Vidéo
              </button>
            </div>

            <input ref={imageInputRef} type="file" onChange={handleImageUpload} hidden />
            <input ref={videoInputRef} type="file" onChange={handleVideoUpload} hidden />

            {modal.uploadedImages?.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                {modal.uploadedImages.map((img: string, i: number) => (
                  <div key={i} style={{ position: "relative" }}>
                    <img src={img} style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6 }} alt={`Upload ${i}`} />
                    <button onClick={() => removeImage(i)} style={{
                      position: "absolute", top: -5, right: -5, background: "red", color: "#fff",
                      border: "none", borderRadius: "50%", width: 18, height: 18, cursor: "pointer", fontSize: 11,
                    }}>×</button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={handlePublish} disabled={!saved} style={{
                padding: "12px", borderRadius: 9, border: "none",
                background: saved ? "#3b82f6" : "#9ca3af", color: "#fff",
                fontWeight: 700, fontSize: 13, cursor: saved ? "pointer" : "not-allowed",
              }}>
                🚀 Publier
              </button>
              <button onClick={handleSaveDraft} disabled={!confirmedCaption} style={{
                padding: "10px", borderRadius: 9, border: "1px solid #d1d5db",
                background: confirmedCaption ? "#fff" : "#f9fafb",
                color: confirmedCaption ? "#374151" : "#9ca3af",
                fontWeight: 600, fontSize: 13, cursor: confirmedCaption ? "pointer" : "not-allowed",
              }}>
                💾 Sauvegarder brouillon
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}