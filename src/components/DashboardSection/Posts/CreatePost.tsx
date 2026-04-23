// import { useState, useRef, useEffect } from "react";
// import type { CSSProperties } from "react";

// // ─── Types ────────────────────────────────────────────────────────────────────

// type ChatMessage = {
//   id: string;
//   role: "user" | "bot";
//   content: string;
//   captions?: Record<string, string> | null;
//   confirmed?: boolean;
// };

// type BotResponse = {
//   reply?: string;
//   message?: string;
//   confirmed?: boolean;
//   finalCaption?: string;
//   platform_posts?: Record<string, any>;
//   output?: string;
// };

// type PostStatus = "Draft" | "InReview" | "Approved" | "Scheduled" | "Published" | "Failed";

// type Props = {
//   modal: any;
//   setM: (data: any) => void;
//   closeModal: () => void;
//   handlePublish: () => void;
//   handleSaveDraft: () => void;
//   handleFileUpload: any;
//   handleImageUpload: any;
//   handleVideoUpload: any;
//   togglePlatform: any;
//   removeImage: any;
//   fileInputRef: any;
//   imageInputRef: any;
//   videoInputRef: any;
//   PLATFORMS: any[];
// };

// // ─── Constants ────────────────────────────────────────────────────────────────

// const BASE_URL    = "https://localhost:7079";
// const API_URL     = `${BASE_URL}/api/posts/chat`;
// const SAVE_URL    = `${BASE_URL}/api/posts/save`;
// const GEN_IMG_URL = `${BASE_URL}/api/images/generate`;

// const S: { [key: string]: CSSProperties } = {
//   label: { fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" },
//   input: {
//     width: "100%", padding: "8px 10px", borderRadius: 8,
//     border: "1px solid #e5e7eb", fontSize: 12, outline: "none", boxSizing: "border-box",
//     background: "#fafafa", transition: "all 0.2s",
//   },
// };

// // ─── Helpers ──────────────────────────────────────────────────────────────────

// const tryParseJSON = (text: string): any => {
//   try { return JSON.parse(text); } catch { return null; }
// };

// const parseBotResponse = (raw: any): BotResponse => {
//   let parsed: any = raw;
//   if (typeof raw === "string") parsed = tryParseJSON(raw) ?? { reply: raw };
//   if (parsed?.output) {
//     const inner = tryParseJSON(parsed.output);
//     if (inner) parsed = inner;
//   }
//   return parsed as BotResponse;
// };

// const buildBotMessage = (raw: any): { msg: ChatMessage; response: BotResponse } => {
//   const response = parseBotResponse(raw);

//   const captions: Record<string, string> = {};
//   const p = response?.platform_posts ?? {};
//   if (p?.Instagram?.caption)   captions["Instagram"] = p.Instagram.caption;
//   if (p?.LinkedIn?.post)       captions["LinkedIn"]  = p.LinkedIn.post;
//   if (p?.Facebook?.post)       captions["Facebook"]  = p.Facebook.post;
//   if (p?.["X-Twitter"]?.post)  captions["X-Twitter"] = p["X-Twitter"].post;

//   const msg: ChatMessage = {
//     id: crypto.randomUUID(),
//     role: "bot",
//     content: response?.reply || response?.message || "Voici ta caption ✨",
//     captions: Object.keys(captions).length > 0 ? captions : null,
//     confirmed: false,
//   };
//   return { msg, response };
// };

// // ─── Component ────────────────────────────────────────────────────────────────

// export default function CreatePostModal(props: Props) {
//   const {
//     modal, setM, closeModal,
//     handleSaveDraft, handlePublish,
//     handleFileUpload, handleImageUpload, handleVideoUpload,
//     togglePlatform, removeImage,
//     fileInputRef, imageInputRef, videoInputRef,
//     PLATFORMS,
//   } = props;

//   const [messages,          setMessages]          = useState<ChatMessage[]>([]);
//   const [userInput,         setUserInput]         = useState("");
//   const [chatLoading,       setChatLoading]       = useState(false);
//   const [confirmedCaption,  setConfirmedCaption]  = useState<string | null>(null);
//   const [activePlatformTab, setActivePlatformTab] = useState<string>("Instagram");
//   const [saving,            setSaving]            = useState(false);
//   const [postStatus,        setPostStatus]        = useState<PostStatus>("Draft");
//   const [imagePrompt,       setImagePrompt]       = useState("");
//   const [imageStyle,        setImageStyle]        = useState("realistic");
//   const [generatingImage,   setGeneratingImage]   = useState(false);

//   const sessionId     = useRef<string>(crypto.randomUUID());
//   const chatBottomRef = useRef<HTMLDivElement>(null);

//   // ── Effects ─────────────────────────────────────────────────────────────────

//   useEffect(() => {
//     chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages, chatLoading]);

//   useEffect(() => {
//     if (modal.open) {
//       setMessages([]);
//       setUserInput("");
//       setChatLoading(false);
//       setConfirmedCaption(null);
//       setActivePlatformTab("Instagram");
//       setPostStatus("Draft");
//       setImagePrompt("");
//       setImageStyle("realistic");
//       setM({ generatedImage: "", success: "", error: "", postId: 0 });
//       sessionId.current = crypto.randomUUID();
//     }
//   }, [modal.open]);

//   // ── Chat ────────────────────────────────────────────────────────────────────

//   const callChat = async (messageText: string) => {
//     const topicId = Number(modal.topicId);
//     if (!topicId || topicId === 0) {
//       setMessages(prev => [...prev, {
//         id: crypto.randomUUID(), role: "bot",
//         content: "❌ Erreur : topicId manquant. Ouvre ce modal depuis un Topic.",
//         captions: null,
//       }]);
//       return;
//     }

//     setChatLoading(true);
//     try {
//       const res = await fetch(API_URL, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//         },
//         body: JSON.stringify({
//           message:       messageText,
//           topicId,
//           toneOfVoice:   modal.tone,
//           captionLength: modal.captionLength,
//           hashtags:      modal.hashtags,
//           platforms:     modal.selectedPlatforms,
//           fileContent:   modal.fileContent || "",
//           sessionId:     sessionId.current,
//         }),
//       });

//       if (!res.ok) throw new Error(await res.text());

//       const data = await res.json();
//       const { msg, response } = buildBotMessage(data);

//       // Sync captions preview
//       if (msg.captions) {
//         const firstMatch = modal.selectedPlatforms.find((p: string) => msg.captions![p]);
//         setActivePlatformTab(firstMatch || Object.keys(msg.captions)[0] || "Instagram");
//         const previewCaption = msg.captions["Instagram"] || Object.values(msg.captions)[0];
//         setM({ generatedContent: previewCaption });
//       }

//       // ✅ Si l'IA confirme → stocker finalCaption localement, PAS de save en DB ici
//       if (response?.confirmed && response?.finalCaption) {
//         setConfirmedCaption(response.finalCaption);
//         setM({ generatedContent: response.finalCaption });
//       }

//       setMessages(prev => [...prev, msg]);
//     } catch (err: any) {
//       setMessages(prev => [...prev, {
//         id: crypto.randomUUID(), role: "bot",
//         content: `❌ Erreur : ${err.message}`,
//         captions: null,
//       }]);
//     } finally {
//       setChatLoading(false);
//     }
//   };

//   const handleGenerate = async () => {
//     if (!modal.topic && !modal.fileContent) {
//       setM({ error: "Ajoute un sujet ou un fichier." });
//       return;
//     }
//     if (modal.selectedPlatforms.length === 0) {
//       setM({ error: "Sélectionne au moins une plateforme." });
//       return;
//     }
//     setM({ error: "" });

//     const initialPrompt = `Génère une caption pour :
// - Sujet : ${modal.topic || "(voir fichier)"}
// - Ton : ${modal.tone}
// - Longueur : ${modal.captionLength}
// - Hashtags : ${modal.hashtags}
// - Plateformes : ${modal.selectedPlatforms.join(", ")}`;

//     setMessages([{ id: crypto.randomUUID(), role: "user", content: initialPrompt }]);
//     await callChat(initialPrompt);
//   };

//   const handleUserSend = async () => {
//     if (!userInput.trim() || chatLoading) return;
//     const text = userInput.trim();
//     setUserInput("");
//     setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "user", content: text }]);
//     await callChat(text);
//   };

//   const confirmCaption = (captions: Record<string, string>, msgId: string) => {
//     const caption = captions[activePlatformTab] ?? Object.values(captions)[0];
//     setConfirmedCaption(caption);
//     setM({ generatedContent: caption });
//     setMessages(prev => prev.map(m => m.id === msgId ? { ...m, confirmed: true } : m));
//   };

//   // ── Image Generation ─────────────────────────────────────────────────────────
//   // ✅ Si postId existe (post déjà sauvegardé) → attache l'image directement au post
//   // Sinon → preview local, sera envoyée dans imageUrl lors du save

//   const generateImage = async () => {
//     if (!imagePrompt.trim()) {
//       setM({ error: "Entre un prompt pour générer l'image." });
//       return;
//     }

//     setGeneratingImage(true);
//     try {
//       const postId = modal.postId as number | undefined;
//       let imageUrl: string;

//       if (postId) {
//         // ✅ Post déjà créé → attacher l'image directement
//         const res = await fetch(`${BASE_URL}/api/posts/${postId}/images/generate`, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//           body: JSON.stringify({ prompt: imagePrompt, style: imageStyle }),
//         });
//         if (!res.ok) throw new Error(await res.text());
//         const data = await res.json();
//         imageUrl = data.url;
//       } else {
//         // ⚠️ Post pas encore créé → preview uniquement
//         const res = await fetch(GEN_IMG_URL, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//           body: JSON.stringify({ prompt: imagePrompt, style: imageStyle }),
//         });
//         if (!res.ok) throw new Error(await res.text());
//         const data = await res.json();
//         imageUrl = data.imageUrl || data.url;
//       }

//       const currentImages = modal.uploadedImages || [];
//       setM({
//         generatedImage: imageUrl,
//         uploadedImages: [imageUrl, ...currentImages.filter((u: string) => u !== imageUrl)],
//       });
//       setImagePrompt("");
//     } catch (err: any) {
//       setM({ error: `❌ ${err.message}` });
//     } finally {
//       setGeneratingImage(false);
//     }
//   };

//   // ── Save ─────────────────────────────────────────────────────────────────────
//   // ✅ SEUL endroit qui crée/met à jour un post en DB.
//   // n8n ne touche plus jamais la base de données.

//   const savePostWithStatus = async (status: PostStatus) => {
//     if (!confirmedCaption && status !== "Draft") {
//       setM({ error: "Confirme d'abord une caption." });
//       return;
//     }

//     setSaving(true);
//     try {
//       const finalCaption = confirmedCaption || modal.generatedContent || "";
//       const imageToSave  =
//         modal.generatedImage ||
//         (modal.uploadedImages || []).find((url: string) => typeof url === "string" && url.startsWith("http")) ||
//         "";

//       const payload: any = {
//         caption:       finalCaption,
//         sessionId:     sessionId.current,
//         topicId:       Number(modal.topicId) || 0,
//         tone:          modal.tone,
//         captionLength: modal.captionLength,
//         platforms:     modal.selectedPlatforms,
//         hashtags:      modal.hashtags,
//         status,
//         imageUrl:      imageToSave,
//       };

//       if (status === "Scheduled" && modal.scheduleDate && modal.scheduleTime) {
//         payload.scheduledFor = `${modal.scheduleDate}T${modal.scheduleTime}:00`;
//       }

//       const res = await fetch(SAVE_URL, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//         },
//         body: JSON.stringify(payload),
//       });

//       if (!res.ok) throw new Error(await res.text());

//       const saved = await res.json();

//       // ✅ Stocker le postId pour les actions suivantes (ex: générer image après save)
//       if (saved?.postId) {
//         setM({ postId: saved.postId });
//       }

//       setPostStatus(status);

//       if (status === "Draft") {
//         await handleSaveDraft();
//         return;
//       }
//       if (status === "Published") {
//         await handlePublish();
//         return;
//       }

//       setM({ success: `✅ Post sauvegardé en tant que ${status}` });
//     } catch (err: any) {
//       setM({ error: `❌ ${err.message}` });
//     } finally {
//       setSaving(false);
//     }
//   };

//   // ── Helpers UI ───────────────────────────────────────────────────────────────

//   const getStatusColor = (status: PostStatus): string => ({
//     Draft:     "#6b7280",
//     InReview:  "#f59e0b",
//     Approved:  "#10b981",
//     Scheduled: "#3b82f6",
//     Published: "#8b5cf6",
//     Failed:    "#ef4444",
//   }[status]);

//   if (!modal.open) return null;

//   // ── Render ───────────────────────────────────────────────────────────────────

//   return (
//     <div
//       onClick={closeModal}
//       style={{
//         position: "fixed", inset: 0, background: "rgba(0,0,0,0.52)",
//         backdropFilter: "blur(4px)", display: "flex", alignItems: "center",
//         justifyContent: "center", padding: 20, zIndex: 1000,
//       }}
//     >
//       <div
//         onClick={e => e.stopPropagation()}
//         style={{
//           background: "#fff", width: "95vw", maxWidth: 1480, height: "90vh",
//           borderRadius: 20, display: "flex", flexDirection: "column",
//           overflow: "hidden", boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
//         }}
//       >

//         {/* ── HEADER ── */}
//         <div style={{
//           padding: "14px 24px", borderBottom: "1px solid #e5e7eb",
//           display: "flex", justifyContent: "space-between", alignItems: "center",
//           background: "#fafafa",
//         }}>
//           <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//             <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>✨ Create Post</h2>
//             {modal.topicId && (
//               <span style={{ fontSize: 11, background: "#d1fae5", color: "#065f46", padding: "2px 8px", borderRadius: 20 }}>
//                 topic #{modal.topicId}
//               </span>
//             )}
//             <span style={{
//               fontSize: 11,
//               background: getStatusColor(postStatus) + "20",
//               color: getStatusColor(postStatus),
//               padding: "2px 8px", borderRadius: 20, fontWeight: 600,
//             }}>
//               {postStatus}
//             </span>
//             {modal.postId ? (
//               <span style={{ fontSize: 11, background: "#ede9fe", color: "#6d28d9", padding: "2px 8px", borderRadius: 20 }}>
//                 post #{modal.postId}
//               </span>
//             ) : null}
//           </div>
//           <button
//             onClick={closeModal}
//             style={{ background: "transparent", border: "none", fontSize: 20, cursor: "pointer", color: "#6b7280" }}
//           >✕</button>
//         </div>

//         {/* ── 3-COLUMN BODY ── */}
//         <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

//           {/* ════════════ COL 1 — SETTINGS ════════════ */}
//           <div style={{
//             width: 280, minWidth: 260, flexShrink: 0, background: "#f9fafb",
//             padding: 16, display: "flex", flexDirection: "column", gap: 16,
//             overflowY: "auto", scrollbarWidth: "none",
//           }}>

//             {/* Contenu */}
//             <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
//               <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
//                 <span>📝</span> Contenu
//               </div>
//               <textarea
//                 rows={3}
//                 placeholder="De quoi parle ce post ?"
//                 value={modal.topic}
//                 onChange={e => setM({ topic: e.target.value, error: "" })}
//                 style={{ ...S.input, resize: "vertical" }}
//               />
//               <div style={{ marginTop: 12 }}>
//                 <div
//                   onClick={() => fileInputRef.current?.click()}
//                   style={{
//                     border: "2px dashed #e5e7eb", borderRadius: 12, padding: "12px",
//                     textAlign: "center", cursor: "pointer", fontSize: 12, color: "#6b7280", background: "#fafafa",
//                   }}
//                 >
//                   {modal.fileName ? `✅ ${modal.fileName}` : "📄 Cliquer pour uploader"}
//                 </div>
//                 <input ref={fileInputRef} type="file" accept=".txt,.pdf" onChange={handleFileUpload} hidden />
//               </div>
//             </div>

//             {/* Style */}
//             <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
//               <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
//                 <span>🎨</span> Style
//               </div>
//               <div style={{ marginBottom: 12 }}>
//                 <label style={S.label}>Longueur</label>
//                 <div style={{ display: "flex", gap: 6 }}>
//                   {(["short", "medium", "long"] as const).map(v => (
//                     <button key={v} onClick={() => setM({ captionLength: v })} style={{
//                       flex: 1, padding: "6px", borderRadius: 10, border: "1px solid",
//                       borderColor: modal.captionLength === v ? "#3b82f6" : "#e5e7eb",
//                       background: modal.captionLength === v ? "#eff6ff" : "#fff",
//                       color: modal.captionLength === v ? "#3b82f6" : "#6b7280",
//                       fontSize: 11, cursor: "pointer",
//                     }}>
//                       {v === "short" ? "Courte" : v === "medium" ? "Moyenne" : "Longue"}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//               <div>
//                 <label style={S.label}>Ton</label>
//                 <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
//                   {(["professional", "casual", "funny", "inspirational"] as const).map(v => (
//                     <button key={v} onClick={() => setM({ tone: v })} style={{
//                       padding: "6px 12px", borderRadius: 20, border: "1px solid",
//                       borderColor: modal.tone === v ? "#3b82f6" : "#e5e7eb",
//                       background: modal.tone === v ? "#eff6ff" : "#fff",
//                       color: modal.tone === v ? "#3b82f6" : "#6b7280",
//                       fontSize: 11, cursor: "pointer",
//                     }}>
//                       {v === "professional" ? "Pro" : v === "casual" ? "Détendu" : v === "funny" ? "Drôle" : "Inspi"}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             </div>

//             {/* Hashtags & Plateformes */}
//             <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
//               <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
//                 <span>🏷️</span> Hashtags & Plateformes
//               </div>
//               <input
//                 placeholder="#automation #n8n #ai"
//                 value={modal.hashtags}
//                 onChange={e => setM({ hashtags: e.target.value })}
//                 style={{ ...S.input, marginBottom: 12 }}
//               />
//               <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
//                 {PLATFORMS.map(p => {
//                   const sel = modal.selectedPlatforms.includes(p.id);
//                   return (
//                     <button key={p.id} onClick={() => togglePlatform(p.id)} style={{
//                       padding: "6px 12px", borderRadius: 20, border: "1px solid",
//                       borderColor: sel ? p.color : "#e5e7eb",
//                       background: sel ? p.color + "18" : "#fff",
//                       color: sel ? p.color : "#6b7280",
//                       fontSize: 11, cursor: "pointer",
//                       display: "flex", alignItems: "center", gap: 4,
//                     }}>
//                       {p.icon} {p.label}
//                     </button>
//                   );
//                 })}
//               </div>
//             </div>

//             {modal.error && (
//               <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 12, fontSize: 12, color: "#dc2626" }}>
//                 ⚠️ {modal.error}
//               </div>
//             )}
//             {modal.success && (
//               <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 12, padding: 12, fontSize: 12, color: "#059669" }}>
//                 {modal.success}
//               </div>
//             )}

//             <button
//               onClick={handleGenerate}
//               disabled={(!modal.topic && !modal.fileContent) || modal.selectedPlatforms.length === 0 || chatLoading}
//               style={{
//                 padding: "14px", borderRadius: 12, border: "none", marginTop: "auto",
//                 background: ((!modal.topic && !modal.fileContent) || modal.selectedPlatforms.length === 0 || chatLoading)
//                   ? "#e5e7eb" : "#3b82f6",
//                 color: ((!modal.topic && !modal.fileContent) || modal.selectedPlatforms.length === 0 || chatLoading)
//                   ? "#9ca3af" : "#fff",
//                 cursor: "pointer", fontSize: 14, fontWeight: 700,
//                 display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
//               }}
//             >
//               {chatLoading ? "⏳ Génération..." : "✨ Générer la caption"}
//             </button>
//           </div>

//           {/* ════════════ COL 2 — CHATBOT ════════════ */}
//           <div style={{
//             flex: 1, background: "#fff", display: "flex", flexDirection: "column", overflow: "hidden",
//             borderLeft: "1px solid #e5e7eb", borderRight: "1px solid #e5e7eb",
//           }}>

//             {/* Header chat */}
//             <div style={{
//               padding: "16px 20px", background: "#fff", borderBottom: "1px solid #e5e7eb",
//               display: "flex", alignItems: "center", gap: 10,
//             }}>
//               <div style={{ width: 36, height: 36, borderRadius: 12, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
//                 <span style={{ fontSize: 20 }}>💬</span>
//               </div>
//               <div>
//                 <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>Assistant Caption</div>
//                 <div style={{ fontSize: 11, color: "#6b7280" }}>
//                   {confirmedCaption
//                     ? "✅ Caption confirmée — clique sur un bouton pour sauvegarder"
//                     : 'Affine ta caption avec l\'IA, puis dis "yes" pour confirmer'}
//                 </div>
//               </div>
//             </div>

//             {/* Messages */}
//             <div style={{
//               flex: 1, overflowY: "auto", padding: "20px",
//               display: "flex", flexDirection: "column", gap: 16, scrollbarWidth: "none",
//             }}>
//               {messages.length === 0 && (
//                 <div style={{
//                   textAlign: "center", padding: "60px 20px",
//                   background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb",
//                 }}>
//                   <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
//                   <div style={{ fontWeight: 700, fontSize: 14, color: "#374151", marginBottom: 8 }}>Prêt à créer ta caption ?</div>
//                   <div style={{ fontSize: 12, color: "#6b7280" }}>Configure tes paramètres et clique sur Générer</div>
//                 </div>
//               )}

//               {messages.map(msg => (
//                 <div key={msg.id} style={{
//                   display: "flex", flexDirection: "column",
//                   alignItems: msg.role === "user" ? "flex-end" : "flex-start", width: "100%",
//                 }}>
//                   <div style={{
//                     maxWidth: "85%", padding: "12px 16px",
//                     borderRadius: msg.role === "user" ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
//                     background: msg.role === "user" ? "#3b82f6" : "#fff",
//                     color: msg.role === "user" ? "#fff" : "#111827",
//                     fontSize: 13, lineHeight: 1.55,
//                     boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
//                     border: msg.role === "bot" ? "1px solid #e5e7eb" : "none",
//                   }}>
//                     {msg.content}
//                   </div>

//                   {msg.role === "bot" && msg.captions && Object.keys(msg.captions).length > 0 && (
//                     <div style={{ marginTop: 12, maxWidth: "95%", width: "100%" }}>
//                       {Object.keys(msg.captions).length > 1 && (
//                         <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
//                           {Object.keys(msg.captions).map(platform => (
//                             <button key={platform} onClick={() => setActivePlatformTab(platform)} style={{
//                               padding: "6px 14px", borderRadius: 20, border: "1px solid",
//                               borderColor: activePlatformTab === platform ? "#3b82f6" : "#e5e7eb",
//                               background: activePlatformTab === platform ? "#eff6ff" : "#fff",
//                               color: activePlatformTab === platform ? "#3b82f6" : "#6b7280",
//                               fontSize: 11, fontWeight: 600, cursor: "pointer",
//                             }}>
//                               {platform}
//                             </button>
//                           ))}
//                         </div>
//                       )}
//                       <div style={{
//                         background: msg.confirmed ? "#f0fdf4" : "#fff",
//                         border: msg.confirmed ? "2px solid #22c55e" : "1px solid #e5e7eb",
//                         borderRadius: 12, padding: "16px", fontSize: 13, lineHeight: 1.6,
//                       }}>
//                         {msg.captions?.[activePlatformTab] ?? Object.values(msg.captions)[0]}
//                       </div>
//                       {!msg.confirmed ? (
//                         <button onClick={() => confirmCaption(msg.captions!, msg.id)} style={{
//                           marginTop: 12, padding: "8px 20px", background: "#22c55e", color: "#fff",
//                           border: "none", borderRadius: 10, fontWeight: 600, fontSize: 12, cursor: "pointer",
//                         }}>✅ Confirmer cette caption</button>
//                       ) : (
//                         <div style={{
//                           marginTop: 12, padding: "8px 16px", background: "#f0fdf4",
//                           borderRadius: 10, color: "#166534", fontWeight: 600, fontSize: 12,
//                         }}>✅ Caption confirmée</div>
//                       )}
//                     </div>
//                   )}
//                 </div>
//               ))}

//               {chatLoading && (
//                 <div style={{ display: "flex", alignItems: "flex-start" }}>
//                   <div style={{
//                     background: "#fff", borderRadius: "20px 20px 20px 4px",
//                     padding: "12px 18px", border: "1px solid #e5e7eb",
//                     display: "flex", alignItems: "center", gap: 8,
//                   }}>
//                     <div style={{
//                       width: 16, height: 16, borderRadius: "50%",
//                       border: "2px solid #e5e7eb", borderTopColor: "#3b82f6",
//                       animation: "spin 0.8s linear infinite",
//                     }} />
//                     <span style={{ fontSize: 13, color: "#6b7280" }}>Génération en cours...</span>
//                   </div>
//                 </div>
//               )}
//               <div ref={chatBottomRef} />
//             </div>

//             {/* Input */}
//             <div style={{ padding: "16px 20px", background: "#fff", borderTop: "1px solid #e5e7eb" }}>
//               <div style={{ display: "flex", gap: 12 }}>
//                 <textarea
//                   value={userInput}
//                   onChange={e => setUserInput(e.target.value)}
//                   onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleUserSend(); } }}
//                   placeholder='Ex: rends-la plus courte... ou tape "yes" pour confirmer'
//                   rows={2}
//                   disabled={chatLoading || messages.length === 0}
//                   style={{
//                     flex: 1, padding: "10px 12px", borderRadius: 12,
//                     border: "1px solid #e5e7eb", fontSize: 13, resize: "none",
//                     fontFamily: "inherit", background: "#fafafa",
//                   }}
//                 />
//                 <button
//                   onClick={handleUserSend}
//                   disabled={chatLoading || !userInput.trim() || messages.length === 0}
//                   style={{
//                     padding: "10px 20px",
//                     background: (!userInput.trim() || chatLoading || messages.length === 0) ? "#e5e7eb" : "#3b82f6",
//                     color: (!userInput.trim() || chatLoading || messages.length === 0) ? "#9ca3af" : "#fff",
//                     border: "none", borderRadius: 12, fontWeight: 700, cursor: "pointer",
//                   }}
//                 >Envoyer</button>
//               </div>
//             </div>
//           </div>

//           {/* ════════════ COL 3 — MEDIA & ACTIONS ════════════ */}
//           <div style={{
//             width: 340, minWidth: 300, flexShrink: 0, background: "#f9fafb",
//             padding: 16, display: "flex", flexDirection: "column", gap: 16,
//             overflowY: "auto", scrollbarWidth: "none",
//           }}>

//             {/* Médias */}
//             <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
//               <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>🎬 Médias du post</div>
//               <div
//                 onClick={() => imageInputRef.current?.click()}
//                 style={{
//                   border: "2px dashed #e5e7eb", borderRadius: 12, background: "#fafafa",
//                   minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center",
//                   position: "relative", overflow: "hidden", cursor: "pointer",
//                 }}
//               >
//                 {modal.uploadedImages?.[0] ? (
//                   <>
//                     <img
//                       src={modal.uploadedImages[0]}
//                       style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute" }}
//                       alt="Preview"
//                     />
//                     <div style={{
//                       position: "absolute", bottom: 8, right: 8,
//                       background: "rgba(0,0,0,0.7)", borderRadius: 20,
//                       padding: "4px 8px", fontSize: 11, color: "#fff",
//                     }}>
//                       📸 {modal.uploadedImages.length}
//                     </div>
//                   </>
//                 ) : (
//                   <div style={{ textAlign: "center", padding: 20 }}>
//                     <div style={{ fontSize: 48, marginBottom: 8 }}>📸</div>
//                     <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Aucun média</div>
//                     <div style={{ fontSize: 11, color: "#6b7280" }}>Clique pour uploader</div>
//                   </div>
//                 )}
//               </div>
//               <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
//                 <button onClick={() => imageInputRef.current?.click()} style={{ flex: 1, padding: "8px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", fontSize: 12, cursor: "pointer" }}>📸 Image</button>
//                 <button onClick={() => videoInputRef.current?.click()} style={{ flex: 1, padding: "8px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", fontSize: 12, cursor: "pointer" }}>🎥 Vidéo</button>
//               </div>
//               {modal.uploadedImages?.length > 1 && (
//                 <div style={{ marginTop: 12 }}>
//                   <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 8 }}>Autres médias</div>
//                   <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
//                     {modal.uploadedImages.slice(1).map((img: string, i: number) => (
//                       <div key={i} style={{ position: "relative", width: 60, height: 60 }}>
//                         <img src={img} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} alt="" />
//                         <button
//                           onClick={() => removeImage(i + 1)}
//                           style={{ position: "absolute", top: -6, right: -6, background: "#ef4444", color: "#fff", border: "2px solid #fff", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", fontSize: 11 }}
//                         >×</button>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Génération IA Image */}
//             <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
//               <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>✨ Générer une image IA</div>
//               {!confirmedCaption && (
//                 <div style={{ fontSize: 11, color: "#f59e0b", marginBottom: 8, padding: "6px 10px", background: "#fffbeb", borderRadius: 8 }}>
//                   ⚠️ Confirme d'abord une caption pour que l'image soit liée au post.
//                 </div>
//               )}
//               <textarea
//                 rows={2}
//                 placeholder="Ex: une jeune femme souriante avec un smartphone..."
//                 value={imagePrompt}
//                 onChange={e => setImagePrompt(e.target.value)}
//                 style={{ ...S.input, resize: "vertical", marginBottom: 8 }}
//               />
//               <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
//                 {["realistic", "artistic", "cartoon", "minimalist"].map(style => (
//                   <button key={style} onClick={() => setImageStyle(style)} style={{
//                     flex: 1, padding: "4px", borderRadius: 20, border: "1px solid",
//                     borderColor: imageStyle === style ? "#3b82f6" : "#e5e7eb",
//                     background: imageStyle === style ? "#eff6ff" : "#fff",
//                     color: imageStyle === style ? "#3b82f6" : "#6b7280",
//                     fontSize: 10, cursor: "pointer",
//                   }}>{style}</button>
//                 ))}
//               </div>
//               <button
//                 onClick={generateImage}
//                 disabled={generatingImage || !imagePrompt.trim()}
//                 style={{
//                   width: "100%", padding: "10px", borderRadius: 10, border: "none",
//                   background: (!imagePrompt.trim() || generatingImage) ? "#e5e7eb" : "#3b82f6",
//                   color: (!imagePrompt.trim() || generatingImage) ? "#9ca3af" : "#fff",
//                   fontWeight: 600, cursor: "pointer",
//                 }}
//               >{generatingImage ? "⏳ Génération..." : "🎨 Générer"}</button>
//             </div>

//             {/* Actions */}
//             <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
//               <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>📋 Actions</div>

//               <button
//                 onClick={() => savePostWithStatus("Draft")}
//                 disabled={saving}
//                 style={{
//                   width: "100%", padding: "10px", borderRadius: 10,
//                   border: "1px solid #e5e7eb", background: "#fff",
//                   color: "#6b7280", fontWeight: 600, marginBottom: 8, cursor: "pointer",
//                 }}
//               >📄 Sauvegarder en Draft</button>

//               <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
//                 <button
//                   onClick={() => savePostWithStatus("InReview")}
//                   disabled={!confirmedCaption || saving}
//                   style={{
//                     flex: 1, padding: "10px", borderRadius: 10, border: "none",
//                     background: (!confirmedCaption || saving) ? "#e5e7eb" : "#f59e0b",
//                     color: "#fff", fontWeight: 600, cursor: "pointer",
//                   }}
//                 >🔍 InReview</button>
//                 <button
//                   onClick={() => savePostWithStatus("Approved")}
//                   disabled={!confirmedCaption || saving}
//                   style={{
//                     flex: 1, padding: "10px", borderRadius: 10, border: "none",
//                     background: (!confirmedCaption || saving) ? "#e5e7eb" : "#10b981",
//                     color: "#fff", fontWeight: 600, cursor: "pointer",
//                   }}
//                 >✅ Approved</button>
//               </div>

//               <div style={{ display: "flex", gap: 8 }}>
//                 <button
//                   onClick={() => savePostWithStatus("Scheduled")}
//                   disabled={!confirmedCaption || saving || (!modal.scheduleDate && !modal.scheduleTime)}
//                   style={{
//                     flex: 1, padding: "10px", borderRadius: 10, border: "none",
//                     background: (!confirmedCaption || saving || (!modal.scheduleDate && !modal.scheduleTime)) ? "#e5e7eb" : "#3b82f6",
//                     color: "#fff", fontWeight: 600, cursor: "pointer",
//                   }}
//                 >📅 Scheduled</button>
//                 <button
//                   onClick={() => savePostWithStatus("Published")}
//                   disabled={!confirmedCaption || saving}
//                   style={{
//                     flex: 1, padding: "10px", borderRadius: 10, border: "none",
//                     background: (!confirmedCaption || saving) ? "#e5e7eb" : "#8b5cf6",
//                     color: "#fff", fontWeight: 600, cursor: "pointer",
//                   }}
//                 >🚀 Published</button>
//               </div>
//             </div>

//             {/* Planification */}
//             <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
//               <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>📅 Planification</div>
//               <div style={{ display: "flex", gap: 8 }}>
//                 <input
//                   type="date"
//                   value={modal.scheduleDate || ""}
//                   onChange={e => setM({ scheduleDate: e.target.value })}
//                   style={{ ...S.input, flex: 1 }}
//                 />
//                 <input
//                   type="time"
//                   value={modal.scheduleTime || ""}
//                   onChange={e => setM({ scheduleTime: e.target.value })}
//                   style={{ ...S.input, flex: 1 }}
//                 />
//               </div>
//             </div>

//             <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} hidden multiple />
//             <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoUpload} hidden />
//           </div>
//         </div>
//       </div>

//       <style>{`
//         @keyframes spin { to { transform: rotate(360deg); } }
//         ::-webkit-scrollbar { display: none; }
//         * { scrollbar-width: none; -ms-overflow-style: none; }
//       `}</style>
//     </div>
//   );
// }