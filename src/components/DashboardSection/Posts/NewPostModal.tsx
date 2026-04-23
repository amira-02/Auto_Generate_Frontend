// // src/components/DashboardSection/Posts/NewPostModal.tsx
// import { useState, useRef, useEffect, useContext } from "react";
// import { motion } from "framer-motion";
// import {
//   FiX, FiSend, FiZap, FiUpload, FiLink,
//   FiCheckCircle, FiRefreshCw, FiImage,
// } from "react-icons/fi";
// import { AuthContext } from "../../../hooks/AuthContext";

// const API = "https://localhost:7079";

// // ─── Types ────────────────────────────────────────────────────────────────────

// type ChatMsg = {
//   id: string;
//   role: "user" | "bot";
//   content: string;
//   captions?: Record<string, string> | null;
//   confirmed?: boolean;
// };

// type BotResponse = {
//   reply?: string;
//   message?: string;
//   output?: string;
//   platform_posts?: Record<string, any>;
//   confirmed?: boolean;
//   finalCaption?: string;
// };

// type Props = {
//   topicId: number;
//   topicName: string;
//   onClose: () => void;
//   onCreated: () => void;
// };

// // ─── Helpers ─────────────────────────────────────────────────────────────────

// const tryParse = (t: string) => { try { return JSON.parse(t); } catch { return null; } };

// const parseBotResponse = (raw: any): BotResponse => {
//   let p: any = raw;
//   if (typeof raw === "string") p = tryParse(raw) ?? { reply: raw };
//   if (p?.output) { const inner = tryParse(p.output); if (inner) p = inner; }
//   return p as BotResponse;
// };

// const buildBotMsg = (raw: any): { msg: ChatMsg; res: BotResponse } => {
//   const res = parseBotResponse(raw);
//   const captions: Record<string, string> = {};
//   const p = res?.platform_posts ?? {};
//   if (p?.Instagram?.caption)          captions["Instagram"]  = p.Instagram.caption;
//   if (p?.LinkedIn?.post)              captions["LinkedIn"]   = p.LinkedIn.post;
//   if (p?.Facebook?.post)              captions["Facebook"]   = p.Facebook.post;
//   if (p?.["X-Twitter"]?.post)         captions["X-Twitter"]  = p["X-Twitter"].post;
//   if (p?.TikTok?.caption)             captions["TikTok"]     = p.TikTok.caption;
//   if (p?.Threads?.text_post)          captions["Threads"]    = p.Threads.text_post;

//   const msg: ChatMsg = {
//     id: crypto.randomUUID(), role: "bot",
//     content: res?.reply || res?.message || "Voici tes captions ✨",
//     captions: Object.keys(captions).length > 0 ? captions : null,
//     confirmed: false,
//   };
//   return { msg, res };
// };

// const resolveUrl = (url: string) => {
//   if (!url) return url;
//   if (url.startsWith("data:") || url.startsWith("http")) return url;
//   return `${API}${url}`;
// };

// // ─── Typing dots ─────────────────────────────────────────────────────────────

// function TypingDots() {
//   return (
//     <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
//       <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#7c3aed", flexShrink: 0 }}>AI</div>
//       <div style={{ background: "#f5f5f5", borderRadius: "0 12px 12px 12px", padding: "10px 14px", display: "flex", gap: 4 }}>
//         {[0, 0.2, 0.4].map((d, i) => (
//           <motion.div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#aaa" }}
//             animate={{ y: [0, -5, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: d }} />
//         ))}
//       </div>
//     </div>
//   );
// }

// // ─── Main ─────────────────────────────────────────────────────────────────────

// export default function NewPostModal({ topicId, topicName, onClose, onCreated }: Props) {
//   const { token } = useContext(AuthContext);

//   // Post state
//   const [postId, setPostId]     = useState<number | null>(null);
//   const [saving, setSaving]     = useState(false);

//   // Caption / chat
//   const [messages, setMessages]             = useState<ChatMsg[]>([]);
//   const [chatInput, setChatInput]           = useState("");
//   const [chatLoading, setChatLoading]       = useState(false);
//   const [confirmedCaption, setConfirmedCaption] = useState<string | null>(null);
//   const [activeTab, setActiveTab]           = useState<string>("Instagram");
//   const chatEnd = useRef<HTMLDivElement>(null);

//   // Image
//   const [imgMode, setImgMode]       = useState<"generate" | "upload" | "url">("generate");
//   const [imgPrompt, setImgPrompt]   = useState("");
//   const [imgStyle, setImgStyle]     = useState("realistic");
//   const [imgLoading, setImgLoading] = useState(false);
//   const [imgPreview, setImgPreview] = useState<string | null>(null);
//   const [imgConfirmed, setImgConfirmed] = useState(false);
//   const [imgUrl, setImgUrlDraft]    = useState("");
//   const fileRef = useRef<HTMLInputElement>(null);

//   useEffect(() => {
//     chatEnd.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages, chatLoading]);

//   const jwt = () => `Bearer ${token ?? localStorage.getItem("token")}`;
//   const jh  = () => ({ "Content-Type": "application/json", Authorization: jwt() });

//   // ── Ensure post exists ───────────────────────────────────────────────────────
//   const ensurePost = async (): Promise<number> => {
//     if (postId) return postId;
//     const res = await fetch(`${API}/api/posts`, {
//       method: "POST",
//       headers: jh(),
//       body: JSON.stringify({ topicId, status: "DRAFT" }),
//     });
//     if (!res.ok) throw new Error(await res.text());
//     const data = await res.json();
//     setPostId(data.id);
//     return data.id;
//   };

//   // ── Chat ─────────────────────────────────────────────────────────────────────
//   const sendMessage = async () => {
//     const text = chatInput.trim();
//     if (!text || chatLoading) return;
//     setChatInput("");
//     const newMsgs = [...messages, { id: crypto.randomUUID(), role: "user" as const, content: text }];
//     setMessages(newMsgs);
//     setChatLoading(true);
//     try {
//       const res = await fetch(`${API}/api/posts/chat`, {
//         method: "POST",
//         headers: jh(),
//         body: JSON.stringify({ topicId, message: text }),
//       });
//       if (!res.ok) throw new Error(`${res.status} — ${await res.text()}`);
//       const data = await res.json();
//       const { msg } = buildBotMsg(data);
//       if (msg.captions) {
//         const first = Object.keys(msg.captions)[0];
//         setActiveTab(first);
//       }
//       setMessages(prev => [...prev, msg]);
//     } catch (err: any) {
//       setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "bot", content: `❌ ${err.message}`, captions: null }]);
//     } finally {
//       setChatLoading(false);
//     }
//   };

//   const confirmCaption = async (captions: Record<string, string>, msgId: string) => {
//     const cap = captions[activeTab] ?? Object.values(captions)[0];
//     setConfirmedCaption(cap);
//     setMessages(prev => prev.map(m => m.id === msgId ? { ...m, confirmed: true } : m));
//     // Save caption to post
//     try {
//       const pid = await ensurePost();
//       await fetch(`${API}/api/posts/${pid}/caption`, {
//         method: "PATCH", headers: jh(),
//         body: JSON.stringify({ content: cap, generatedBy: "ai" }),
//       });
//     } catch {}
//   };

//   // ── Image ─────────────────────────────────────────────────────────────────────
//   const generateImage = async () => {
//     setImgLoading(true); setImgPreview(null);
//     try {
//       const pid = await ensurePost();
//       const res = await fetch(`${API}/api/posts/${pid}/images/generate`, {
//         method: "POST", headers: jh(),
//         body: JSON.stringify({ prompt: imgPrompt || topicName, style: imgStyle }),
//       });
//       if (!res.ok) throw new Error((await res.json()).message ?? "Erreur");
//       const data = await res.json();
//       setImgPreview(resolveUrl(data.url));
//     } catch (err: any) {
//       alert(`Erreur génération : ${err.message}`);
//     } finally { setImgLoading(false); }
//   };

//   const confirmImage = async () => {
//     if (!imgPreview) return;
//     const pid = await ensurePost();
//     await fetch(`${API}/api/posts/${pid}/images/url`, {
//       method: "POST", headers: jh(),
//       body: JSON.stringify({ url: imgPreview }),
//     });
//     setImgConfirmed(true);
//   };

//   const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0]; if (!file) return;
//     setImgLoading(true);
//     try {
//       const pid = await ensurePost();
//       const form = new FormData(); form.append("file", file);
//       const res = await fetch(`${API}/api/posts/${pid}/images/upload`, {
//         method: "POST", headers: { Authorization: jwt() }, body: form,
//       });
//       if (!res.ok) throw new Error(await res.text());
//       const data = await res.json();
//       setImgPreview(resolveUrl(data.url));
//       setImgConfirmed(true);
//     } catch (err: any) {
//       alert(`Erreur upload : ${err.message}`);
//     } finally { setImgLoading(false); }
//   };

//   const applyUrl = async () => {
//     if (!imgUrl.trim()) return;
//     const pid = await ensurePost();
//     await fetch(`${API}/api/posts/${pid}/images/url`, {
//       method: "POST", headers: jh(), body: JSON.stringify({ url: imgUrl }),
//     });
//     setImgPreview(imgUrl); setImgConfirmed(true);
//   };

//   // ── Save with status ──────────────────────────────────────────────────────────
//   const savePost = async (status: "DRAFT" | "INREVIEW" | "APPROVED") => {
//     setSaving(true);
//     try {
//       const pid = await ensurePost();
//       await fetch(`${API}/api/posts/${pid}/status`, {
//         method: "PATCH", headers: jh(),
//         body: JSON.stringify({ status }),
//       });
//       onCreated();
//       onClose();
//     } catch (err: any) {
//       alert(`Erreur : ${err.message}`);
//     } finally { setSaving(false); }
//   };

//   // ─────────────────────────────────────────────────────────────────────────────
//   return (
//     <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
//       <motion.div
//         initial={{ opacity: 0, scale: 0.96, y: 20 }}
//         animate={{ opacity: 1, scale: 1, y: 0 }}
//         transition={{ duration: 0.22 }}
//         style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 900, maxHeight: "92vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.22)" }}
//       >
//         {/* ── Header ── */}
//         <div style={{ padding: "16px 22px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#faf9ff", flexShrink: 0 }}>
//           <div>
//             <div style={{ fontSize: 15, fontWeight: 600, color: "#111" }}>Nouveau post</div>
//             <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>Topic : <strong>{topicName}</strong></div>
//           </div>
//           <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa" }}>
//             <FiX size={18} />
//           </button>
//         </div>

//         {/* ── Body — 2 colonnes ── */}
//         <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>

//           {/* ── GAUCHE : Chatbot caption ── */}
//           <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: "1px solid #f0f0f0", minWidth: 0 }}>
//             <div style={{ padding: "10px 16px", borderBottom: "1px solid #f0f0f0", fontSize: 12, fontWeight: 600, color: "#555", background: "#fafafa" }}>
//               💬 Génération de caption
//             </div>

//             {/* Messages */}
//             <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
//               {messages.length === 0 && (
//                 <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, marginTop: 48 }}>
//                   <div style={{ fontSize: 32, marginBottom: 8 }}>🤖</div>
//                   Décris ce que tu veux et l'IA génère ta caption.<br />
//                   <span style={{ fontSize: 11, color: "#bbb" }}>Ex: "Caption inspirationnelle pour Instagram"</span>
//                 </div>
//               )}

//               {messages.map(msg => (
//                 <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
//                   <div style={{ display: "flex", gap: 7, alignItems: "flex-start", flexDirection: msg.role === "user" ? "row-reverse" : "row", maxWidth: "85%" }}>
//                     <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, background: msg.role === "bot" ? "#ede9fe" : "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: msg.role === "bot" ? "#7c3aed" : "white" }}>
//                       {msg.role === "bot" ? "AI" : "CM"}
//                     </div>
//                     <div style={{ background: msg.role === "user" ? "#7c3aed" : "#f3f4f6", color: msg.role === "user" ? "white" : "#111", borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", padding: "9px 13px", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
//                       {msg.content}
//                     </div>
//                   </div>

//                   {/* Captions par plateforme */}
//                   {msg.role === "bot" && msg.captions && (
//                     <div style={{ marginTop: 8, maxWidth: "88%", width: "100%" }}>
//                       {Object.keys(msg.captions).length > 1 && (
//                         <div style={{ display: "flex", gap: 5, marginBottom: 7, flexWrap: "wrap" }}>
//                           {Object.keys(msg.captions).map(p => (
//                             <button key={p} onClick={() => setActiveTab(p)}
//                               style={{ padding: "3px 10px", borderRadius: 12, border: "1px solid", borderColor: activeTab === p ? "#7c3aed" : "#ddd", background: activeTab === p ? "#7c3aed" : "#fff", color: activeTab === p ? "#fff" : "#666", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
//                               {p}
//                             </button>
//                           ))}
//                         </div>
//                       )}
//                       <div style={{ background: msg.confirmed ? "#f0fdf4" : "#fff", border: msg.confirmed ? "2px solid #22c55e" : "1.5px solid #e5e7eb", borderRadius: 10, padding: "11px 13px", fontSize: 13, lineHeight: 1.6, color: "#111", whiteSpace: "pre-wrap" }}>
//                         {msg.captions[activeTab] ?? Object.values(msg.captions)[0]}
//                       </div>
//                       {!msg.confirmed ? (
//                         <button onClick={() => confirmCaption(msg.captions!, msg.id)}
//                           style={{ marginTop: 7, padding: "6px 14px", background: "#22c55e", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit" }}>
//                           <FiCheckCircle size={12} /> Confirmer cette caption
//                         </button>
//                       ) : (
//                         <div style={{ marginTop: 5, color: "#22c55e", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
//                           <FiCheckCircle size={12} /> Caption confirmée ✓
//                         </div>
//                       )}
//                     </div>
//                   )}
//                 </div>
//               ))}

//               {chatLoading && <TypingDots />}
//               <div ref={chatEnd} />
//             </div>

//             {/* Suggestions rapides */}
//             <div style={{ padding: "0 14px 8px", display: "flex", gap: 5, flexWrap: "wrap" }}>
//               {["Inspirationnel ✨", "Professionnel", "Avec emojis 🎯", "Plus courte", "Plus longue"].map(s => (
//                 <button key={s} onClick={() => setChatInput(s)}
//                   style={{ fontSize: 11, background: "#f5f5f5", border: "1px solid #e5e5e5", borderRadius: 20, padding: "3px 10px", cursor: "pointer", color: "#555", fontFamily: "inherit" }}>
//                   {s}
//                 </button>
//               ))}
//             </div>

//             {/* Input */}
//             <div style={{ padding: "10px 14px 14px", borderTop: "1px solid #f0f0f0", flexShrink: 0 }}>
//               <div style={{ display: "flex", gap: 7 }}>
//                 <input value={chatInput} onChange={e => setChatInput(e.target.value)}
//                   onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
//                   placeholder='Décris ta caption ou dis "yes" pour confirmer...'
//                   disabled={chatLoading}
//                   style={{ flex: 1, border: "1px solid #e5e5e5", borderRadius: 10, padding: "9px 13px", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
//                 <button onClick={sendMessage} disabled={chatLoading || !chatInput.trim()}
//                   style={{ background: "#7c3aed", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, opacity: (!chatInput.trim() || chatLoading) ? 0.5 : 1 }}>
//                   <FiSend size={14} color="white" />
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* ── DROITE : Image ── */}
//           <div style={{ width: 360, flexShrink: 0, display: "flex", flexDirection: "column", minHeight: 0 }}>
//             <div style={{ padding: "10px 16px", borderBottom: "1px solid #f0f0f0", fontSize: 12, fontWeight: 600, color: "#555", background: "#fafafa" }}>
//               🖼 Image du post
//             </div>

//             <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>

//               {/* Mode tabs */}
//               <div style={{ display: "flex", gap: 5, marginBottom: 16 }}>
//                 {[
//                   { id: "generate", label: "Générer IA", icon: <FiZap size={12} /> },
//                   { id: "upload",   label: "Uploader",   icon: <FiUpload size={12} /> },
//                   { id: "url",      label: "URL",         icon: <FiLink size={12} /> },
//                 ].map(m => (
//                   <button key={m.id} onClick={() => { setImgMode(m.id as any); setImgPreview(null); setImgConfirmed(false); }}
//                     style={{ flex: 1, padding: "7px 0", border: "1.5px solid", borderColor: imgMode === m.id ? "#7c3aed" : "#e5e5e5", borderRadius: 9, background: imgMode === m.id ? "#ede9fe" : "white", color: imgMode === m.id ? "#5b21b6" : "#888", fontSize: 11, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontFamily: "inherit" }}>
//                     {m.icon}{m.label}
//                   </button>
//                 ))}
//               </div>

//               {/* Generate */}
//               {imgMode === "generate" && !imgConfirmed && (
//                 <div>
//                   <div style={{ fontSize: 11, color: "#888", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Description</div>
//                   <textarea value={imgPrompt} onChange={e => setImgPrompt(e.target.value)} rows={3}
//                     placeholder={`Image pour "${topicName}"...`}
//                     style={{ width: "100%", border: "1px solid #e5e5e5", borderRadius: 9, padding: "9px 11px", fontSize: 12, fontFamily: "inherit", resize: "none", outline: "none", marginBottom: 10, boxSizing: "border-box" }} />
//                   <div style={{ fontSize: 11, color: "#888", fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>Style</div>
//                   <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
//                     {["realistic", "cinematic", "minimalist", "cartoon", "watercolor"].map(s => (
//                       <button key={s} onClick={() => setImgStyle(s)}
//                         style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, border: "1px solid", borderColor: imgStyle === s ? "#7c3aed" : "#e5e5e5", background: imgStyle === s ? "#ede9fe" : "white", color: imgStyle === s ? "#5b21b6" : "#888", cursor: "pointer", fontFamily: "inherit" }}>
//                         {s}
//                       </button>
//                     ))}
//                   </div>
//                   <button onClick={generateImage} disabled={imgLoading}
//                     style={{ width: "100%", background: "#7c3aed", color: "white", border: "none", borderRadius: 9, padding: "10px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontFamily: "inherit" }}>
//                     <FiZap size={12} /> {imgLoading ? "Génération..." : "Générer"}
//                   </button>
//                 </div>
//               )}

//               {/* Upload */}
//               {imgMode === "upload" && !imgConfirmed && (
//                 <div>
//                   <div onClick={() => fileRef.current?.click()}
//                     style={{ border: "2px dashed #e5e5e5", borderRadius: 11, padding: "36px 20px", textAlign: "center", cursor: "pointer", transition: "border-color 0.15s" }}
//                     onMouseEnter={e => e.currentTarget.style.borderColor = "#7c3aed"}
//                     onMouseLeave={e => e.currentTarget.style.borderColor = "#e5e5e5"}>
//                     <FiUpload size={26} color="#ccc" style={{ display: "block", margin: "0 auto 10px" }} />
//                     <div style={{ fontSize: 13, color: "#888" }}>Cliquez pour uploader</div>
//                     <div style={{ fontSize: 11, color: "#bbb", marginTop: 3 }}>PNG, JPG, WebP</div>
//                   </div>
//                   <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={uploadFile} />
//                 </div>
//               )}

//               {/* URL */}
//               {imgMode === "url" && !imgConfirmed && (
//                 <div>
//                   <div style={{ fontSize: 11, color: "#888", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>URL de l'image</div>
//                   <input value={imgUrl} onChange={e => setImgUrlDraft(e.target.value)}
//                     placeholder="https://..."
//                     style={{ width: "100%", border: "1px solid #e5e5e5", borderRadius: 9, padding: "10px 13px", fontSize: 12, fontFamily: "inherit", outline: "none", marginBottom: 10, boxSizing: "border-box" }} />
//                   <button onClick={applyUrl}
//                     style={{ width: "100%", background: "#7c3aed", color: "white", border: "none", borderRadius: 9, padding: "10px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
//                     Appliquer
//                   </button>
//                 </div>
//               )}

//               {/* Loader */}
//               {imgLoading && !imgPreview && (
//                 <div style={{ textAlign: "center", padding: "24px 0" }}>
//                   <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
//                     style={{ width: 26, height: 26, border: "2.5px solid #e5e5e5", borderTopColor: "#7c3aed", borderRadius: "50%", margin: "0 auto 10px" }} />
//                   <div style={{ fontSize: 12, color: "#888" }}>Génération en cours...</div>
//                 </div>
//               )}

//               {/* Preview */}
//               {imgPreview && !imgConfirmed && (
//                 <div style={{ marginTop: 12 }}>
//                   <img src={imgPreview} alt="preview" style={{ width: "100%", borderRadius: 11, display: "block", aspectRatio: "1/1", objectFit: "cover", border: "2px solid #e5e5e5" }} />
//                   <div style={{ display: "flex", gap: 7, marginTop: 9 }}>
//                     <button onClick={confirmImage}
//                       style={{ flex: 1, background: "#059669", color: "white", border: "none", borderRadius: 9, padding: "9px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontFamily: "inherit" }}>
//                       <FiCheckCircle size={12} /> Utiliser
//                     </button>
//                     {imgMode === "generate" && (
//                       <button onClick={() => { setImgPreview(null); generateImage(); }} disabled={imgLoading}
//                         style={{ background: "#f5f5f5", color: "#555", border: "none", borderRadius: 9, padding: "9px 13px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit" }}>
//                         <FiRefreshCw size={11} /> Régénérer
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               )}

//               {/* Image confirmée */}
//               {imgConfirmed && imgPreview && (
//                 <div>
//                   <img src={imgPreview} alt="confirmed" style={{ width: "100%", borderRadius: 11, display: "block", aspectRatio: "1/1", objectFit: "cover", border: "2px solid #059669" }} />
//                   <div style={{ marginTop: 8, color: "#059669", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
//                     <FiCheckCircle size={13} /> Image confirmée ✓
//                   </div>
//                   <button onClick={() => { setImgConfirmed(false); setImgPreview(null); }}
//                     style={{ marginTop: 6, fontSize: 11, color: "#888", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontFamily: "inherit" }}>
//                     Changer l'image
//                   </button>
//                 </div>
//               )}

//               {/* Placeholder si rien */}
//               {!imgPreview && !imgLoading && imgMode === "generate" && (
//                 <div style={{ marginTop: 16, border: "1.5px dashed #e5e5e5", borderRadius: 11, aspectRatio: "1/1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#ccc" }}>
//                   <FiImage size={28} />
//                   <span style={{ fontSize: 12 }}>L'aperçu apparaîtra ici</span>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* ── Footer — boutons statut ── */}
//         <div style={{ padding: "14px 22px", borderTop: "1px solid #f0f0f0", background: "#fafafa", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>

//           {/* Info complétude */}
//           <div style={{ fontSize: 12, color: "#888", flex: 1 }}>
//             {confirmedCaption && imgConfirmed
//               ? <span style={{ color: "#059669", fontWeight: 600 }}>✓ Caption + image prêtes</span>
//               : confirmedCaption
//               ? <span style={{ color: "#f59e0b" }}>Caption ✓ · Image manquante</span>
//               : imgConfirmed
//               ? <span style={{ color: "#f59e0b" }}>Image ✓ · Caption manquante</span>
//               : <span style={{ color: "#aaa" }}>Génère au moins une caption ou une image</span>
//             }
//           </div>

//           {/* Boutons */}
//           <button onClick={() => savePost("DRAFT")} disabled={saving || (!confirmedCaption && !imgConfirmed)}
//             style={{ padding: "9px 18px", borderRadius: 10, border: "1.5px solid #e5e5e5", background: "white", color: "#555", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: (!confirmedCaption && !imgConfirmed) ? 0.4 : 1 }}>
//             💾 Draft
//           </button>

//           <button onClick={() => savePost("INREVIEW")} disabled={saving || !confirmedCaption}
//             style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: !confirmedCaption ? "#e5e5e5" : "#f59e0b", color: !confirmedCaption ? "#aaa" : "white", fontSize: 13, fontWeight: 600, cursor: !confirmedCaption ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
//             🔍 In Review
//           </button>

//           <button onClick={() => savePost("APPROVED")} disabled={saving || !confirmedCaption}
//             style={{ padding: "9px 18px", borderRadius: 10, border: "none", background: !confirmedCaption ? "#e5e5e5" : "#059669", color: !confirmedCaption ? "#aaa" : "white", fontSize: 13, fontWeight: 600, cursor: !confirmedCaption ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
//             ✅ Approved
//           </button>

//           {saving && <span style={{ fontSize: 12, color: "#7c3aed" }}>Sauvegarde...</span>}
//         </div>
//       </motion.div>
//     </div>
//   );
// }