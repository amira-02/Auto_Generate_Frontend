import { useState, useRef, useEffect } from "react";
import type { CSSProperties } from "react";

type ChatMessage = {
  id: string; role: "user" | "bot"; content: string;
  captions?: Record<string, string> | null; confirmed?: boolean;
};
type BotResponse = {
  reply?: string; message?: string; confirmed?: boolean;
  finalCaption?: string; platform_posts?: Record<string, any>; output?: string;
};
type PostStatus = "Draft" | "InReview" | "Approved" | "Scheduled" | "Published" | "Failed";
type Props = {
  modal: any; setM: (data: any) => void; closeModal: () => void;
  handlePublish: () => void; handleSaveDraft: () => void;
  handleFileUpload: any; handleImageUpload: any; handleVideoUpload: any;
  togglePlatform: any; removeImage: any; fileInputRef: any;
  imageInputRef: any; videoInputRef: any; PLATFORMS: any[];
};

const BASE_URL: string = import.meta.env.VITE_API_URL ?? "https://localhost:7079";
const API_URL     = `${BASE_URL}/api/posts/chat`;
const SAVE_URL    = `${BASE_URL}/api/posts/save`;
const GEN_IMG_URL = `${BASE_URL}/api/images/generate`;

const S: { [key: string]: CSSProperties } = {
  label: { fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" },
  input: {
    width: "100%", padding: "8px 10px", borderRadius: 8,
    border: "1px solid #e5e7eb", fontSize: 12, outline: "none",
    boxSizing: "border-box", background: "#fafafa", transition: "all 0.2s",
  },
};

const tryParseJSON = (text: string): any => { try { return JSON.parse(text); } catch { return null; } };

const parseBotResponse = (raw: any): BotResponse => {
  let parsed: any = raw;
  if (typeof raw === "string") parsed = tryParseJSON(raw) ?? { reply: raw };
  if (parsed?.output) { const inner = tryParseJSON(parsed.output); if (inner) parsed = inner; }
  return parsed as BotResponse;
};

const buildBotMessage = (raw: any): { msg: ChatMessage; response: BotResponse } => {
  const response = parseBotResponse(raw);
  const captions: Record<string, string> = {};
  const p = response?.platform_posts ?? {};
  if (p?.Instagram?.caption)  captions["Instagram"] = p.Instagram.caption;
  if (p?.LinkedIn?.post)      captions["LinkedIn"]  = p.LinkedIn.post;
  if (p?.Facebook?.post)      captions["Facebook"]  = p.Facebook.post;
  if (p?.["X-Twitter"]?.post) captions["X-Twitter"] = p["X-Twitter"].post;
  const msg: ChatMessage = {
    id: crypto.randomUUID(), role: "bot",
    content: response?.reply || response?.message || "Voici ta caption ✨",
    captions: Object.keys(captions).length > 0 ? captions : null, confirmed: false,
  };
  return { msg, response };
};

export default function CreatePostModal(props: Props) {
  const {
    modal, setM, closeModal, handleSaveDraft, handlePublish,
    handleFileUpload, togglePlatform, fileInputRef, imageInputRef, videoInputRef, PLATFORMS,
  } = props;

  const [messages,          setMessages]          = useState<ChatMessage[]>([]);
  const [userInput,         setUserInput]         = useState("");
  const [chatLoading,       setChatLoading]       = useState(false);
  const [confirmedCaption,  setConfirmedCaption]  = useState<string | null>(null);
  const [activePlatformTab, setActivePlatformTab] = useState<string>("Instagram");
  const [saving,            setSaving]            = useState(false);
  const [postStatus,        setPostStatus]        = useState<PostStatus>("Draft");
  const [imagePrompt,       setImagePrompt]       = useState("");
  const [imageStyle,        setImageStyle]        = useState("realistic");
  const [generatingImage,   setGeneratingImage]   = useState(false);
  const [localImages,       setLocalImages]       = useState<string[]>([]);
  const [localVideo,        setLocalVideo]        = useState<string | null>(null);
  const [isExternalTask,    setIsExternalTask]    = useState(false);

  const sessionId     = useRef<string>(crypto.randomUUID());
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading]);

  useEffect(() => {
    if (modal.open) {
    const hasExternalContent = !!modal.scheduledAt;
      setIsExternalTask(hasExternalContent);

      setMessages([]);
      setUserInput("");
      setChatLoading(false);
      setActivePlatformTab("Instagram");
      setImagePrompt("");
      setImageStyle("realistic");
      setLocalImages([]);
      setLocalVideo(null);
      sessionId.current = crypto.randomUUID();

      // Ne pas écraser generatedContent / scheduledAt / topicId / postId
      setM({ generatedImage: "", success: "", error: "", uploadedImages: [], uploadedVideo: null });

      // Si tâche externe → pré-confirme la caption et met en Scheduled
      if (hasExternalContent) {
        setConfirmedCaption(modal.generatedContent || "");
        setPostStatus("Approved");
      } else {
        setConfirmedCaption(null);
        setPostStatus("Draft");
      }
    }
  }, [modal.open]);

  const callChat = async (messageText: string) => {
    const topicId = Number(modal.topicId);
    if (!topicId || topicId === 0) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "bot", content: "❌ Erreur : topicId manquant.", captions: null }]);
      return;
    }
    setChatLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({
          message: messageText, topicId,
          toneOfVoice: modal.tone, captionLength: modal.captionLength,
          hashtags: modal.hashtags, platforms: modal.selectedPlatforms,
          fileContent: modal.fileContent || "", sessionId: sessionId.current,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const { msg, response } = buildBotMessage(data);
      if (msg.captions) {
        const firstMatch = modal.selectedPlatforms.find((p: string) => msg.captions![p]);
        setActivePlatformTab(firstMatch || Object.keys(msg.captions)[0] || "Instagram");
        setM({ generatedContent: msg.captions["Instagram"] || Object.values(msg.captions)[0] });
      }
      if (response?.confirmed && response?.finalCaption) {
        setConfirmedCaption(response.finalCaption);
        setM({ generatedContent: response.finalCaption });
      }
      setMessages(prev => [...prev, msg]);
    } catch (err: any) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "bot", content: `❌ Erreur : ${err.message}`, captions: null }]);
    } finally { setChatLoading(false); }
  };

  const handleGenerate = async () => {
    if (!modal.topic && !modal.fileContent) { setM({ error: "Ajoute un sujet ou un fichier." }); return; }
    if (modal.selectedPlatforms.length === 0) { setM({ error: "Sélectionne au moins une plateforme." }); return; }
    setM({ error: "" });
    const prompt = `Génère une caption pour :\n- Sujet : ${modal.topic || "(voir fichier)"}\n- Ton : ${modal.tone}\n- Longueur : ${modal.captionLength}\n- Hashtags : ${modal.hashtags}\n- Plateformes : ${modal.selectedPlatforms.join(", ")}`;
    setMessages([{ id: crypto.randomUUID(), role: "user", content: prompt }]);
    await callChat(prompt);
  };

  const handleUserSend = async () => {
    if (!userInput.trim() || chatLoading) return;
    const text = userInput.trim(); setUserInput("");
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "user", content: text }]);
    await callChat(text);
  };

  const confirmCaption = (captions: Record<string, string>, msgId: string) => {
    const caption = captions[activePlatformTab] ?? Object.values(captions)[0];
    setConfirmedCaption(caption);
    setM({ generatedContent: caption });
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, confirmed: true } : m));
  };

  const handleImageUploadInternal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []); if (files.length === 0) return;
    const results = await Promise.allSettled(files.map(async (file) => {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch(`${BASE_URL}/api/images/upload-temp`, {
        method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }, body: fd,
      });
      if (!res.ok) throw new Error(await res.text());
      return (await res.json()).url as string;
    }));
    const succeeded = results.filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled").map(r => r.value);
    const failed    = results.filter(r => r.status === "rejected").length;
    if (succeeded.length > 0) setLocalImages(prev => [...prev, ...succeeded]);
    if (failed > 0) setM({ error: `❌ ${failed} file(s) failed to upload` });
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleVideoUploadInternal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch(`${BASE_URL}/api/images/upload-temp`, {
        method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }, body: fd,
      });
      if (!res.ok) throw new Error(await res.text());
      setLocalVideo((await res.json()).url);
    } catch (err: any) { setM({ error: `❌ Video upload failed: ${err.message}` }); }
    if (videoInputRef.current) videoInputRef.current.value = "";
  };

  const generateImage = async () => {
    if (!imagePrompt.trim()) { setM({ error: "Entre un prompt pour générer l'image." }); return; }
    setGeneratingImage(true);
    try {
      const postId = modal.postId as number | undefined;
      let imageUrl: string;
      if (postId) {
        const res = await fetch(`${BASE_URL}/api/posts/${postId}/images/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
          body: JSON.stringify({ prompt: imagePrompt, style: imageStyle }),
        });
        if (!res.ok) throw new Error(await res.text());
        imageUrl = (await res.json()).url;
      } else {
        const res = await fetch(GEN_IMG_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
          body: JSON.stringify({ prompt: imagePrompt, style: imageStyle }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json(); imageUrl = data.imageUrl || data.url;
      }
      setLocalImages(prev => [imageUrl, ...prev.filter(u => u !== imageUrl)]);
      setM({ generatedImage: imageUrl }); setImagePrompt("");
    } catch (err: any) { setM({ error: `❌ ${err.message}` }); }
    finally { setGeneratingImage(false); }
  };

  const savePostWithStatus = async (status: PostStatus) => {
    if (!confirmedCaption && status !== "Draft") { setM({ error: "Confirme d'abord une caption." }); return; }
    setSaving(true);
    try {
      const finalCaption = confirmedCaption || modal.generatedContent || "";
      const allImages    = localImages.filter(u => u?.startsWith("http"));
      const videoUrl     = localVideo?.startsWith("http") ? localVideo : undefined;

      const payload: any = {
        caption: finalCaption, sessionId: sessionId.current,
        topicId: Number(modal.topicId) || 0,
        tone: modal.tone, captionLength: modal.captionLength,
        platforms: modal.selectedPlatforms, hashtags: modal.hashtags,
        status, imageUrl: allImages[0] ?? "", imageUrls: allImages, videoUrl: videoUrl ?? null,
      };

      // ── Planification ──────────────────────────────────────────────
      if (status === "Scheduled") {
        if (modal.scheduledAt) {
          // Vient d'une tâche externe — ISO string direct
          payload.scheduledFor = modal.scheduledAt;
        } else if (modal.scheduleDate && modal.scheduleTime) {
          payload.scheduledFor = `${modal.scheduleDate}T${modal.scheduleTime}:00`;
        }
      }

      const res = await fetch(SAVE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const saved = await res.json();
      if (saved?.postId) setM({ postId: saved.postId });
      setPostStatus(status);
      if (status === "Draft")     { await handleSaveDraft(); return; }
      if (status === "Published") { await handlePublish();   return; }
      setM({ success: `✅ Post sauvegardé en tant que ${status}` });
    } catch (err: any) { setM({ error: `❌ ${err.message}` }); }
    finally { setSaving(false); }
  };

  const getStatusColor = (s: PostStatus) => ({
    Draft: "#6b7280", InReview: "#f59e0b", Approved: "#10b981",
    Scheduled: "#dc2626", Published: "#dc2626", Failed: "#ef4444",
  }[s]);

  if (!modal.open) return null;

  return (
    <div onClick={closeModal} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.52)",
      backdropFilter: "blur(4px)", display: "flex", alignItems: "center",
      justifyContent: "center", padding: 20, zIndex: 1000,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", width: "95vw", maxWidth: 1480, height: "90vh",
        borderRadius: 20, display: "flex", flexDirection: "column",
        overflow: "hidden", boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
      }}>

        {/* HEADER */}
        <div style={{ padding: "14px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fafafa" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>✨ Create Post</h2>
            {isExternalTask && (
              <span style={{ fontSize: 11, background: "#fef2f2", color: "#dc2626", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>
                🔗 External Task
              </span>
            )}
            {modal.topicId && (
              <span style={{ fontSize: 11, background: "#d1fae5", color: "#065f46", padding: "2px 8px", borderRadius: 20 }}>
                topic #{modal.topicId}
              </span>
            )}
            <span style={{ fontSize: 11, background: getStatusColor(postStatus) + "20", color: getStatusColor(postStatus), padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>
              {postStatus}
            </span>
            {modal.postId ? (
              <span style={{ fontSize: 11, background: "#ede9fe", color: "#6d28d9", padding: "2px 8px", borderRadius: 20 }}>post #{modal.postId}</span>
            ) : null}
          </div>
          <button onClick={closeModal} style={{ background: "transparent", border: "none", fontSize: 20, cursor: "pointer", color: "#6b7280" }}>✕</button>
        </div>

        {/* 3-COLUMN BODY */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* COL 1 — SETTINGS */}
          <div style={{ width: 280, minWidth: 260, flexShrink: 0, background: "#f9fafb", padding: 16, display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", scrollbarWidth: "none" }}>

            {/* External task banner */}
            {isExternalTask && (
              <div style={{ background: "#fef2f2", borderRadius: 12, padding: "12px 14px", border: "1px solid #ed8faf" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", marginBottom: 4 }}>🔗 External Post Request</div>
                <div style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.5 }}>{modal.generatedContent}</div>
                {modal.scheduledAt && (
                  <div style={{ marginTop: 8, fontSize: 11, background: "#f0fdf4", color: "#16a34a", padding: "6px 10px", borderRadius: 8, fontWeight: 600, border: "1px solid #bbf7d0" }}>
                    📅 Auto-scheduled: {new Date(modal.scheduledAt).toLocaleString("fr-FR")}
                  </div>
                )}
              </div>
            )}

            {/* Contenu */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><span>📝</span> Contenu</div>
              <textarea rows={3} placeholder="De quoi parle ce post ?" value={modal.topic} onChange={e => setM({ topic: e.target.value, error: "" })} style={{ ...S.input, resize: "vertical" }} />
              <div style={{ marginTop: 12 }}>
                <div onClick={() => fileInputRef.current?.click()} style={{ border: "2px dashed #e5e7eb", borderRadius: 12, padding: "12px", textAlign: "center", cursor: "pointer", fontSize: 12, color: "#6b7280", background: "#fafafa" }}>
                  {modal.fileName ? `✅ ${modal.fileName}` : "📄 Cliquer pour uploader"}
                </div>
                <input ref={fileInputRef} type="file" accept=".txt,.pdf" onChange={handleFileUpload} hidden />
              </div>
            </div>

            {/* Style */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><span>🎨</span> Style</div>
              <div style={{ marginBottom: 12 }}>
                <label style={S.label}>Longueur</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {(["short", "medium", "long"] as const).map(v => (
                    <button key={v} onClick={() => setM({ captionLength: v })} style={{ flex: 1, padding: "6px", borderRadius: 10, border: "1px solid", borderColor: modal.captionLength === v ? "#dc2626" : "#e5e7eb", background: modal.captionLength === v ? "#eff6ff" : "#fff", color: modal.captionLength === v ? "#dc2626" : "#6b7280", fontSize: 11, cursor: "pointer" }}>
                      {v === "short" ? "Courte" : v === "medium" ? "Moyenne" : "Longue"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={S.label}>Ton</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {(["professional", "casual", "funny", "inspirational"] as const).map(v => (
                    <button key={v} onClick={() => setM({ tone: v })} style={{ padding: "6px 12px", borderRadius: 20, border: "1px solid", borderColor: modal.tone === v ? "#dc2626" : "#e5e7eb", background: modal.tone === v ? "#eff6ff" : "#fff", color: modal.tone === v ? "#dc2626" : "#6b7280", fontSize: 11, cursor: "pointer" }}>
                      {v === "professional" ? "Pro" : v === "casual" ? "Détendu" : v === "funny" ? "Drôle" : "Inspi"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Hashtags & Plateformes */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><span>🏷️</span> Hashtags & Plateformes</div>
              <input placeholder="#automation #n8n #ai" value={modal.hashtags} onChange={e => setM({ hashtags: e.target.value })} style={{ ...S.input, marginBottom: 12 }} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {PLATFORMS.map(p => {
                  const sel = modal.selectedPlatforms.includes(p.id);
                  return (
                    <button key={p.id} onClick={() => togglePlatform(p.id)} style={{ padding: "6px 12px", borderRadius: 20, border: "1px solid", borderColor: sel ? p.color : "#e5e7eb", background: sel ? p.color + "18" : "#fff", color: sel ? p.color : "#6b7280", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                      {p.icon} {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {modal.error   && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 12, fontSize: 12, color: "#dc2626" }}>⚠️ {modal.error}</div>}
            {modal.success && <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 12, padding: 12, fontSize: 12, color: "#059669" }}>{modal.success}</div>}

           <button onClick={handleGenerate} disabled={(!modal.topic && !modal.fileContent) || modal.selectedPlatforms.length === 0 || chatLoading}
            style={{ padding: "14px", borderRadius: 12, border: "none", marginTop: "auto",
              background: ((!modal.topic && !modal.fileContent) || modal.selectedPlatforms.length === 0 || chatLoading) ? "#e5e7eb" : "#dc2626",
              color: ((!modal.topic && !modal.fileContent) || modal.selectedPlatforms.length === 0 || chatLoading) ? "#9ca3af" : "#fff",
              cursor: "pointer", fontSize: 14, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {chatLoading ? "⏳ Génération..." : "✨ Générer la caption"}
          </button>
          </div>

          {/* COL 2 — CHATBOT */}
          <div style={{ flex: 1, background: "#fff", display: "flex", flexDirection: "column", overflow: "hidden", borderLeft: "1px solid #e5e7eb", borderRight: "1px solid #e5e7eb" }}>
            <div style={{ padding: "16px 20px", background: "#fff", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 20 }}>💬</span>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>Assistant Caption</div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>
                  {confirmedCaption ? "✅ Caption confirmée — clique sur un bouton pour sauvegarder"
                    : 'Affine ta caption avec l\'IA, puis dis "yes" pour confirmer'}
                </div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 16, scrollbarWidth: "none" }}>
              {/* External task caption preview */}
              {isExternalTask && confirmedCaption && messages.length === 0 && (
                <div style={{ background: "#fef2f2", borderRadius: 16, padding: "16px 20px", border: "1px solid #ed8faf" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", marginBottom: 8 }}>📋 Caption from external request</div>
                  <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{confirmedCaption}</div>
                  <div style={{ marginTop: 10, padding: "6px 10px", background: "#f0fdf4", borderRadius: 8, fontSize: 11, color: "#16a34a", fontWeight: 600 }}>
                    ✅ Caption auto-confirmed
                  </div>
                </div>
              )}

              {messages.length === 0 && !isExternalTask && (
                <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#374151", marginBottom: 8 }}>Prêt à créer ta caption ?</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>Configure tes paramètres et clique sur Générer</div>
                </div>
              )}

              {messages.map(msg => (
                <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start", width: "100%" }}>
                  <div style={{ maxWidth: "85%", padding: "12px 16px", borderRadius: msg.role === "user" ? "20px 20px 4px 20px" : "20px 20px 20px 4px", background: msg.role === "user" ? "#dc2626" : "#fff", color: msg.role === "user" ? "#fff" : "#111827", fontSize: 13, lineHeight: 1.55, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", border: msg.role === "bot" ? "1px solid #e5e7eb" : "none" }}>
                    {msg.content}
                  </div>
                  {msg.role === "bot" && msg.captions && Object.keys(msg.captions).length > 0 && (
                    <div style={{ marginTop: 12, maxWidth: "95%", width: "100%" }}>
                      {Object.keys(msg.captions).length > 1 && (
                        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                          {Object.keys(msg.captions).map(platform => (
                            <button key={platform} onClick={() => setActivePlatformTab(platform)} style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid", borderColor: activePlatformTab === platform ? "#dc2626" : "#e5e7eb", background: activePlatformTab === platform ? "#eff6ff" : "#fff", color: activePlatformTab === platform ? "#dc2626" : "#6b7280", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                              {platform}
                            </button>
                          ))}
                        </div>
                      )}
                      <div style={{ background: msg.confirmed ? "#f0fdf4" : "#fff", border: msg.confirmed ? "2px solid #22c55e" : "1px solid #e5e7eb", borderRadius: 12, padding: "16px", fontSize: 13, lineHeight: 1.6 }}>
                        {msg.captions?.[activePlatformTab] ?? Object.values(msg.captions)[0]}
                      </div>
                      {!msg.confirmed
                        ? <button onClick={() => confirmCaption(msg.captions!, msg.id)} style={{ marginTop: 12, padding: "8px 20px", background: "#22c55e", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>✅ Confirmer cette caption</button>
                        : <div style={{ marginTop: 12, padding: "8px 16px", background: "#f0fdf4", borderRadius: 10, color: "#166534", fontWeight: 600, fontSize: 12 }}>✅ Caption confirmée</div>
                      }
                    </div>
                  )}
                </div>
              ))}

              {chatLoading && (
                <div style={{ display: "flex", alignItems: "flex-start" }}>
                  <div style={{ background: "#fff", borderRadius: "20px 20px 20px 4px", padding: "12px 18px", border: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #e5e7eb", borderTopColor: "#dc2626", animation: "spin 0.8s linear infinite" }} />
                    <span style={{ fontSize: 13, color: "#6b7280" }}>Génération en cours...</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            <div style={{ padding: "16px 20px", background: "#fff", borderTop: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", gap: 12 }}>
                <textarea value={userInput} onChange={e => setUserInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleUserSend(); } }}
                  placeholder='Ex: rends-la plus courte... ou tape "yes" pour confirmer' rows={2}
                  disabled={chatLoading || (messages.length === 0 && !isExternalTask)}
                  style={{ flex: 1, padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 13, resize: "none", fontFamily: "inherit", background: "#fafafa" }} />
                <button onClick={handleUserSend} disabled={chatLoading || !userInput.trim()}
                  style={{ padding: "10px 20px", background: (!userInput.trim() || chatLoading) ? "#e5e7eb" : "#dc2626", color: (!userInput.trim() || chatLoading) ? "#9ca3af" : "#fff", border: "none", borderRadius: 12, fontWeight: 700, cursor: "pointer" }}>
                  Envoyer
                </button>
              </div>
            </div>
          </div>

          {/* COL 3 — MEDIA & ACTIONS */}
          <div style={{ width: 340, minWidth: 300, flexShrink: 0, background: "#f9fafb", padding: 16, display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", scrollbarWidth: "none" }}>

            {/* Médias */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>🎬 Médias du post</div>
              <div onClick={() => imageInputRef.current?.click()} style={{ border: "2px dashed #e5e7eb", borderRadius: 12, background: "#fafafa", minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", cursor: "pointer" }}>
                {localImages[0] ? (
                  <><img src={localImages[0]} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute" }} alt="Preview" />
                  <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.7)", borderRadius: 20, padding: "4px 8px", fontSize: 11, color: "#fff" }}>📸 {localImages.length}</div></>
                ) : (
                  <div style={{ textAlign: "center", padding: 20 }}>
                    <div style={{ fontSize: 48, marginBottom: 8 }}>📸</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Aucun média</div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>Clique pour uploader</div>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={() => imageInputRef.current?.click()} style={{ flex: 1, padding: "8px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", fontSize: 12, cursor: "pointer" }}>📸 Image</button>
                <button onClick={() => videoInputRef.current?.click()} style={{ flex: 1, padding: "8px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", fontSize: 12, cursor: "pointer" }}>🎥 Vidéo</button>
              </div>
              {localImages.length > 1 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 8 }}>Autres médias ({localImages.length})</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {localImages.slice(1).map((img, i) => (
                      <div key={i} style={{ position: "relative", width: 60, height: 60 }}>
                        <img src={img} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} alt="" />
                        <button onClick={() => setLocalImages(prev => prev.filter((_, idx) => idx !== i + 1))} style={{ position: "absolute", top: -6, right: -6, background: "#ef4444", color: "#fff", border: "2px solid #fff", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", fontSize: 11 }}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {localVideo && (
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, background: "#f0fdf4", borderRadius: 8, padding: "6px 10px" }}>
                  <span style={{ fontSize: 12 }}>🎥</span>
                  <span style={{ fontSize: 11, color: "#059669", flex: 1 }}>Video uploaded</span>
                  <button onClick={() => setLocalVideo(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 14 }}>×</button>
                </div>
              )}
            </div>

            {/* Génération IA Image */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>✨ Générer une image IA</div>
              {!confirmedCaption && (
                <div style={{ fontSize: 11, color: "#f59e0b", marginBottom: 8, padding: "6px 10px", background: "#fffbeb", borderRadius: 8 }}>
                  ⚠️ Confirme d'abord une caption pour que l'image soit liée au post.
                </div>
              )}
              <textarea rows={2} placeholder="Ex: une jeune femme souriante avec un smartphone..." value={imagePrompt} onChange={e => setImagePrompt(e.target.value)} style={{ ...S.input, resize: "vertical", marginBottom: 8 }} />
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {["realistic", "artistic", "cartoon", "minimalist"].map(style => (
                  <button key={style} onClick={() => setImageStyle(style)} style={{ flex: 1, padding: "4px", borderRadius: 20, border: "1px solid", borderColor: imageStyle === style ? "#dc2626" : "#e5e7eb", background: imageStyle === style ? "#eff6ff" : "#fff", color: imageStyle === style ? "#dc2626" : "#6b7280", fontSize: 10, cursor: "pointer" }}>{style}</button>
                ))}
              </div>
              <button onClick={generateImage} disabled={generatingImage || !imagePrompt.trim()} style={{ width: "100%", padding: "10px", borderRadius: 10, border: "none", background: (!imagePrompt.trim() || generatingImage) ? "#e5e7eb" : "#dc2626", color: (!imagePrompt.trim() || generatingImage) ? "#9ca3af" : "#fff", fontWeight: 600, cursor: "pointer" }}>
                {generatingImage ? "⏳ Génération..." : "🎨 Générer"}
              </button>
            </div>

            {/* Statut + Save */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>📋 Statut du post</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 14 }}>Choisis un statut puis clique sur Save</div>

              {[
                { value: "Draft",    icon: "📄", label: "Draft",     sub: "Brouillon, pas de planification", color: "#6b7280", active: "#f1f5f9", activeBorder: "#94a3b8" },
                { value: "InReview", icon: "🔍", label: "In Review", sub: "Nécessite validation",            color: "#d97706", active: "#fffbeb", activeBorder: "#f59e0b" },
                { value: "Approved", icon: "✅", label: "Approved",  sub: "Prêt à publier ou planifier",     color: "#059669", active: "#f0fdf4", activeBorder: "#10b981" },
              ].map(opt => {
                const isSelected = postStatus === opt.value;
                const disabled   = opt.value !== "Draft" && !confirmedCaption;
                return (
                  <button key={opt.value} onClick={() => !disabled && setPostStatus(opt.value as PostStatus)} disabled={disabled}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, marginBottom: 8, background: isSelected ? opt.active : "#fff", color: disabled ? "#9ca3af" : opt.color, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10, border: `1.5px solid ${isSelected ? opt.activeBorder : "#f0f0f0"}`, transition: "all .15s", opacity: disabled ? 0.5 : 1 }}>
                    <span style={{ fontSize: 18 }}>{opt.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{opt.label}</div>
                      <div style={{ fontSize: 10, fontWeight: 400, color: "#94a3b8" }}>{opt.sub}</div>
                    </div>
                    {isSelected && <div style={{ width: 8, height: 8, borderRadius: "50%", background: opt.color, flexShrink: 0 }} />}
                  </button>
                );
              })}

              {/* Planification */}
              {postStatus === "Approved" && confirmedCaption && (
                <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 14, marginBottom: 14 }}>
                  {/* Si tâche externe → affiche la date auto */}
                  {isExternalTask && modal.scheduledAt ? (
                    <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "10px 12px", border: "1px solid #bbf7d0" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", marginBottom: 2 }}>📅 Planification automatique</div>
                      <div style={{ fontSize: 12, color: "#374151" }}>{new Date(modal.scheduledAt).toLocaleString("fr-FR")}</div>
                      <div style={{ fontSize: 10, color: "#16a34a", marginTop: 4 }}>✓ Le post sera publié automatiquement à cette heure</div>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                        📅 Planifier <span style={{ color: "#94a3b8", fontWeight: 400 }}>(optionnel)</span>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input type="date" value={modal.scheduleDate || ""} onChange={e => setM({ scheduleDate: e.target.value })} style={{ ...S.input, flex: 1 }} />
                        <input type="time" value={modal.scheduleTime || ""} onChange={e => setM({ scheduleTime: e.target.value })} style={{ ...S.input, flex: 1 }} />
                      </div>
                      {modal.scheduleDate && modal.scheduleTime && (
                        <div style={{ fontSize: 10, color: "#dc2626", marginTop: 6, fontWeight: 600 }}>
                          ✓ Sera planifié le {modal.scheduleDate} à {modal.scheduleTime}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={() => {
                  const finalStatus: PostStatus =
                    isExternalTask && modal.scheduledAt ? "Scheduled"
                    : postStatus === "Approved" && modal.scheduleDate && modal.scheduleTime ? "Scheduled"
                    : postStatus;
                  savePostWithStatus(finalStatus);
                }}
                disabled={saving}
                style={{ width: "100%", padding: "13px", borderRadius: 11, border: "none", marginTop: 4, background: saving ? "#e5e7eb" : "linear-gradient(135deg, #dc2626, #dc2626)", color: saving ? "#9ca3af" : "#fff", fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: saving ? "none" : "0 4px 14px rgba(230,87,135,0.3)", transition: "all .15s" }}>
                {saving ? "⏳ Saving..." : (
                  isExternalTask && modal.scheduledAt ? `📅 Schedule & Approve`
                  : postStatus === "Approved" && modal.scheduleDate && modal.scheduleTime ? `📅 Schedule for ${modal.scheduleDate} ${modal.scheduleTime}`
                  : postStatus === "Approved" ? "🚀 Save & Approve"
                  : postStatus === "InReview" ? "🔍 Save for Review"
                  : "💾 Save as Draft"
                )}
              </button>

              {!confirmedCaption && (
                <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", marginTop: 8 }}>
                  ↑ Confirme une caption pour débloquer InReview et Approved
                </div>
              )}
            </div>

            <input ref={imageInputRef} type="file" accept="image/*,image/heic,image/heif" onChange={handleImageUploadInternal} hidden multiple />
            <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoUploadInternal} hidden />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { display: none; }
        * { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>
    </div>
  );
}