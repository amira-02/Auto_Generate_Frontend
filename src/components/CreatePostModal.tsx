// import { useState, useRef, useEffect } from "react";
// import type { CSSProperties } from "react";

// // ─────────────────────────────────────────────
// // TYPES
// // ─────────────────────────────────────────────
// type ChatMessage = {
//   id: string;
//   role: "user" | "bot";
//   content: string;
//   captions?: Record<string, string>; // platform -> caption
//   confirmed?: boolean;
//   raw?: any; // Pour debug
// };

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

// // ─────────────────────────────────────────────
// // CONFIG
// // ─────────────────────────────────────────────
// const API_BASE = "http://localhost:5000";

// // ─────────────────────────────────────────────
// // STYLE HELPERS
// // ─────────────────────────────────────────────
// const chip = (selected: boolean, color = "#3b82f6"): CSSProperties => ({
//   padding: "6px 11px",
//   borderRadius: 20,
//   fontSize: 11,
//   fontWeight: selected ? 700 : 400,
//   border: "1px solid",
//   borderColor: selected ? color : "#d1d5db",
//   background: selected ? color + "18" : "#fff",
//   color: selected ? color : "#6b7280",
//   cursor: "pointer",
//   transition: "all .15s",
// });

// const S: { [key: string]: CSSProperties } = {
//   col: {
//     padding: 16,
//     display: "flex",
//     flexDirection: "column",
//     gap: 12,
//     overflowY: "auto",
//   },
//   divider: { borderRight: "1px solid #e5e7eb" },
//   colTitle: { fontSize: 13, fontWeight: 700, color: "#111827" },
//   label: { fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" },
//   input: {
//     width: "100%",
//     padding: "8px 10px",
//     borderRadius: 8,
//     border: "1px solid #d1d5db",
//     fontSize: 13,
//     outline: "none",
//     boxSizing: "border-box",
//   },
// };

// // ─────────────────────────────────────────────
// // HELPER: extract captions from n8n response
// // FIXED: Handle the actual n8n output structure correctly
// // ─────────────────────────────────────────────
// function extractCaptions(data: any): Record<string, string> {
//   const captions: Record<string, string> = {};

//   // Support multiple possible response structures
//   const platformPosts = 
//     data?.platform_posts || 
//     data?.output?.platform_posts || 
//     data?.data?.platform_posts ||
//     {};

//   // Mapping selon la structure réelle de n8n
//   if (platformPosts.Instagram?.caption) {
//     captions["Instagram"] = platformPosts.Instagram.caption;
//   }
//   if (platformPosts.LinkedIn?.post) {
//     captions["LinkedIn"] = platformPosts.LinkedIn.post;
//   }
//   if (platformPosts.Facebook?.post) {
//     captions["Facebook"] = platformPosts.Facebook.post;
//   }
//   if (platformPosts["X-Twitter"]?.post) {
//     captions["X-Twitter"] = platformPosts["X-Twitter"].post;
//   }
//   if (platformPosts.TikTok?.caption) {
//     captions["TikTok"] = platformPosts.TikTok.caption;
//   }
//   if (platformPosts.Threads?.text_post) {
//     captions["Threads"] = platformPosts.Threads.text_post;
//   }
//   if (platformPosts.YouTube_Shorts?.description) {
//     captions["YouTube_Shorts"] = platformPosts.YouTube_Shorts.description;
//   }

//   // Fallback: simple caption response
//   if (Object.keys(captions).length === 0 && data?.caption) {
//     captions["Instagram"] = data.caption;
//   }

//   // Debug log
//   if (Object.keys(captions).length === 0) {
//     console.warn("⚠️ No captions extracted from:", data);
//   } else {
//     console.log("✅ Captions extracted:", Object.keys(captions));
//   }

//   return captions;
// }

// // ─────────────────────────────────────────────
// // COMPONENT
// // ─────────────────────────────────────────────
// export default function CreatePostModal(props: Props) {
//   const {
//     modal, setM, closeModal,
//     handlePublish, handleSaveDraft,
//     handleFileUpload, handleImageUpload, handleVideoUpload,
//     togglePlatform, removeImage,
//     fileInputRef, imageInputRef, videoInputRef,
//     PLATFORMS,
//   } = props;

//   const [messages, setMessages] = useState<ChatMessage[]>([]);
//   const [userInput, setUserInput] = useState("");
//   const [chatLoading, setChatLoading] = useState(false);
//   const [confirmedCaption, setConfirmedCaption] = useState<string | null>(null);
//   const [postId, setPostId] = useState<number | null>(null);
//   const [activePlatformTab, setActivePlatformTab] = useState<string>("Instagram");

//   const chatBottomRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages, chatLoading]);

//   useEffect(() => {
//     if (modal.open) {
//       setMessages([]);
//       setUserInput("");
//       setChatLoading(false);
//       setConfirmedCaption(null);
//       setPostId(null);
//       setActivePlatformTab("Instagram");
//     }
//   }, [modal.open]);

//   // ─────────────────────────────────────────
//   // STEP 1: Create post in DB, then call chatbot
//   // ─────────────────────────────────────────
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

//     let currentPostId = postId;

//     // Create post in DB first (only once per session)
//     if (!currentPostId) {
//       try {
//         const res = await fetch(`${API_BASE}/api/posts`, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//           body: JSON.stringify({
//             topic: modal.topic || "Post sans titre",
//             hashtags: modal.hashtags || "",
//             toneOfVoice: modal.tone,
//             captionLength: modal.captionLength,
//           }),
//         });

//         if (!res.ok) {
//           const err = await res.json().catch(() => ({}));
//           setM({ error: err.message || "Erreur lors de la création du post." });
//           return;
//         }

//         const data = await res.json();
//         currentPostId = data.id;
//         setPostId(data.id);
//       } catch {
//         setM({ error: "Impossible de créer le post. Vérifie ta connexion." });
//         return;
//       }
//     }

//     const initialMsg: ChatMessage = {
//       id: crypto.randomUUID(),
//       role: "user",
//       content: `Génère une caption pour les paramètres suivants :
// - Sujet : ${modal.topic || "(voir fichier)"}
// - Ton : ${modal.tone}
// - Longueur : ${modal.captionLength}
// - Hashtags : ${modal.hashtags}
// - Plateformes : ${modal.selectedPlatforms.join(", ")}
// ${modal.fileContent ? `- Contenu du fichier : ${modal.fileContent.slice(0, 500)}` : ""}`,
//     };

//     await sendToBot(initialMsg);
//   };

//   const handleUserSend = async () => {
//     if (!userInput.trim()) return;
//     const msg: ChatMessage = {
//       id: crypto.randomUUID(),
//       role: "user",
//       content: userInput.trim(),
//     };
//     setUserInput("");
//     await sendToBot(msg);
//   };

//   // ─────────────────────────────────────────
//   // STEP 2: Call backend /api/posts/chat → which proxies to n8n
//   // ─────────────────────────────────────────
//   const sendToBot = async (newMsg: ChatMessage) => {
//     const updatedMessages = [...messages, newMsg];
//     setMessages(updatedMessages);
//     setChatLoading(true);

//     try {
//       const res = await fetch(`${API_BASE}/api/posts/chat`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//         },
//         body: JSON.stringify({
//           topic: modal.topic,
//           toneOfVoice: modal.tone,
//           captionLength: modal.captionLength,
//           hashtags: modal.hashtags,
//           platforms: modal.selectedPlatforms,
//           fileContent: modal.fileContent || "",
//           message: newMsg.content,
//           // FIXED: Send proper history with both user and bot messages
//           history: updatedMessages.map((m) => ({
//             role: m.role === "user" ? "user" : "assistant",
//             content: m.content || (m.captions ? Object.values(m.captions)[0] : ""),
//           })),
//         }),
//       });

//       if (!res.ok) {
//         throw new Error(`Backend error: ${res.status}`);
//       }

//       // Parse the response
//       const rawText = await res.text();
//       let data: any = {};
//       try {
//         data = JSON.parse(rawText);
//       } catch {
//         throw new Error("Réponse invalide du serveur.");
//       }

//       console.log("📦 Raw response:", data);

//       // FIXED: Extract captions for all requested platforms
//       const captions = extractCaptions(data);
//       const hasCaptions = Object.keys(captions).length > 0;

//       // Set active tab to first requested platform that has a caption
//       const firstPlatformWithCaption = modal.selectedPlatforms.find(
//         (p: string) => captions[p]
//       );
//       if (firstPlatformWithCaption) {
//         setActivePlatformTab(firstPlatformWithCaption);
//       } else if (Object.keys(captions)[0]) {
//         setActivePlatformTab(Object.keys(captions)[0]);
//       }

//       const botMsg: ChatMessage = {
//         id: crypto.randomUUID(),
//         role: "bot",
//         content: hasCaptions
//           ? "Voici tes captions ✨"
//           : "Je n'ai pas pu générer de caption. Essaie à nouveau.",
//         captions: hasCaptions ? captions : undefined,
//         confirmed: false,
//         raw: data,
//       };

//       setMessages((prev) => [...prev, botMsg]);

//       // Update preview with first available caption
//       if (hasCaptions) {
//         const previewCaption = captions["Instagram"] || Object.values(captions)[0];
//         setM({ generatedContent: previewCaption });
//       }

//     } catch (err: any) {
//       console.error("Chat error:", err);
//       setMessages((prev) => [
//         ...prev,
//         {
//           id: crypto.randomUUID(),
//           role: "bot",
//           content: `❌ Erreur : ${err.message || "Connexion impossible. Vérifie le backend."}`,
//         },
//       ]);
//     } finally {
//       setChatLoading(false);
//     }
//   };

//   // ─────────────────────────────────────────
//   // STEP 3: Confirm caption → save to DB
//   // ─────────────────────────────────────────
//   const confirmCaption = async (captions: Record<string, string>, msgId: string) => {
//     // Use selected platform tab's caption, fallback to first
//     const caption = captions[activePlatformTab] || Object.values(captions)[0];

//     setConfirmedCaption(caption);
//     setM({ generatedContent: caption });

//     setMessages((prev) =>
//       prev.map((m) => (m.id === msgId ? { ...m, confirmed: true } : m))
//     );

//     if (!postId) {
//       console.error("postId manquant — impossible de sauvegarder la caption");
//       return;
//     }

//     try {
//       const res = await fetch(`${API_BASE}/api/posts/${postId}/confirm-caption`, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//         },
//         body: JSON.stringify({
//           caption,
//           toneOfVoice: modal.tone,
//           captionLength: modal.captionLength,
//         }),
//       });

//       if (!res.ok) {
//         console.error("Erreur HTTP confirm-caption:", res.status);
//       } else {
//         console.log("✅ Caption saved successfully");
//       }
//     } catch (err) {
//       console.error("Erreur sauvegarde caption:", err);
//     }
//   };

//   if (!modal.open) return null;

//   return (
//     <div
//       onClick={closeModal}
//       style={{
//         position: "fixed", inset: 0,
//         background: "rgba(0,0,0,0.52)",
//         backdropFilter: "blur(4px)",
//         display: "flex", alignItems: "center", justifyContent: "center",
//         padding: 20, zIndex: 1000,
//       }}
//     >
//       <div
//         onClick={(e) => e.stopPropagation()}
//         style={{
//           background: "#fff",
//           width: "95vw", maxWidth: 1380, height: "90vh",
//           borderRadius: 20,
//           display: "flex", flexDirection: "column",
//           overflow: "hidden",
//           boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
//         }}
//       >
//         {/* HEADER */}
//         <div style={{
//           padding: "14px 24px",
//           borderBottom: "1px solid #e5e7eb",
//           display: "flex", justifyContent: "space-between", alignItems: "center",
//           background: "#fafafa",
//         }}>
//           <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>✨ Create Post</h2>
//           <button
//             onClick={closeModal}
//             style={{ background: "transparent", border: "none", fontSize: 20, cursor: "pointer", color: "#6b7280" }}
//           >
//             ✕
//           </button>
//         </div>

//         {/* 3-COLUMN BODY */}
//         <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

//           {/* ═══ COL 1 — SETTINGS ═══ */}
//           <div style={{ ...S.col, ...S.divider, width: 280, minWidth: 260, flexShrink: 0 }}>
//             <div style={S.colTitle}>⚙️ Settings</div>

//             <div>
//               <label style={S.label}>Sujet / Topic</label>
//               <textarea
//                 rows={3}
//                 placeholder="De quoi parle ce post ?"
//                 value={modal.topic}
//                 onChange={(e) => setM({ topic: e.target.value, error: "" })}
//                 style={{ ...S.input, resize: "vertical" as const }}
//               />
//             </div>

//             <div>
//               <label style={S.label}>
//                 Fichier <span style={{ fontWeight: 400, color: "#9ca3af" }}>(PDF / TXT)</span>
//               </label>
//               <div
//                 onClick={() => fileInputRef.current?.click()}
//                 style={{
//                   border: "1.5px dashed #d1d5db", borderRadius: 8,
//                   padding: "12px", textAlign: "center" as const,
//                   cursor: "pointer", fontSize: 12, color: "#6b7280",
//                 }}
//               >
//                 {modal.fileName ? `✅ ${modal.fileName}` : "📄 Cliquer pour upload"}
//               </div>
//               <input ref={fileInputRef} type="file" accept=".txt,.pdf" onChange={handleFileUpload} style={{ display: "none" }} />
//             </div>

//             <div>
//               <label style={S.label}>Longueur de caption</label>
//               <div style={{ display: "flex", gap: 6 }}>
//                 {(["short", "medium", "long"] as const).map((v) => (
//                   <button key={v} onClick={() => setM({ captionLength: v })} style={{ ...chip(modal.captionLength === v), flex: 1, fontSize: 11 }}>
//                     {v.charAt(0).toUpperCase() + v.slice(1)}
//                   </button>
//                 ))}
//               </div>
//             </div>

//             <div>
//               <label style={S.label}>Ton</label>
//               <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
//                 {(["professional", "casual", "funny", "inspirational"] as const).map((v) => (
//                   <button key={v} onClick={() => setM({ tone: v })} style={chip(modal.tone === v)}>
//                     {v.charAt(0).toUpperCase() + v.slice(1)}
//                   </button>
//                 ))}
//               </div>
//             </div>

//             <div>
//               <label style={S.label}>Hashtags</label>
//               <input
//                 placeholder="#automation #n8n #ai"
//                 value={modal.hashtags}
//                 onChange={(e) => setM({ hashtags: e.target.value })}
//                 style={S.input}
//               />
//             </div>

//             <div>
//               <label style={S.label}>Plateformes</label>
//               <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
//                 {PLATFORMS.map((p) => {
//                   const sel = modal.selectedPlatforms.includes(p.id);
//                   return (
//                     <button key={p.id} onClick={() => togglePlatform(p.id)} style={chip(sel, p.color)}>
//                       {p.icon} {p.label}
//                     </button>
//                   );
//                 })}
//               </div>
//             </div>

//             {modal.error && (
//               <div style={{
//                 background: "#fef2f2", border: "1px solid #fecaca",
//                 borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#dc2626",
//               }}>
//                 ⚠️ {modal.error}
//               </div>
//             )}

//             {postId && (
//               <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "center" as const }}>
//                 Post #{postId} créé
//               </div>
//             )}

//             <button
//               onClick={handleGenerate}
//               disabled={(!modal.topic && !modal.fileContent) || modal.selectedPlatforms.length === 0 || chatLoading}
//               style={{
//                 marginTop: "auto",
//                 padding: "12px", borderRadius: 9, border: "none",
//                 background: ((!modal.topic && !modal.fileContent) || modal.selectedPlatforms.length === 0 || chatLoading)
//                   ? "#9ca3af" : "#3b82f6",
//                 color: "#fff",
//                 cursor: ((!modal.topic && !modal.fileContent) || modal.selectedPlatforms.length === 0 || chatLoading)
//                   ? "not-allowed" : "pointer",
//                 fontSize: 14, fontWeight: 700,
//               }}
//             >
//               {chatLoading ? "⏳ Génération..." : "✨ Générer"}
//             </button>
//           </div>

//           {/* ═══ COL 2 — CHATBOT ═══ */}
//           <div style={{ ...S.col, flex: 1, ...S.divider, gap: 0, padding: 0 }}>
//             <div style={{
//               padding: "12px 16px", borderBottom: "1px solid #f3f4f6",
//               fontWeight: 700, fontSize: 13, color: "#111",
//             }}>
//               💬 Assistant Caption
//             </div>

//             <div style={{
//               flex: 1, overflowY: "auto", padding: "16px",
//               display: "flex", flexDirection: "column", gap: 14,
//             }}>

//               {messages.length === 0 && (
//                 <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, marginTop: 40 }}>
//                   <div style={{ fontSize: 32, marginBottom: 8 }}>🤖</div>
//                   Configure tes settings et clique <strong>Générer</strong>.<br />
//                   Tu pourras ensuite modifier la caption ici.
//                 </div>
//               )}

//               {messages.map((msg) => (
//                 <div key={msg.id} style={{
//                   display: "flex", flexDirection: "column",
//                   alignItems: msg.role === "user" ? "flex-end" : "flex-start",
//                   width: "100%",
//                 }}>
//                   <div style={{
//                     maxWidth: "82%",
//                     padding: "10px 14px",
//                     borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
//                     background: msg.role === "user" ? "#3b82f6" : "#f3f4f6",
//                     color: msg.role === "user" ? "#fff" : "#111",
//                     fontSize: 13, lineHeight: 1.55, whiteSpace: "pre-wrap",
//                   }}>
//                     {msg.content}
//                   </div>

//                   {/* FIXED: Multi-platform caption tabs with safe fallbacks */}
//                   {msg.role === "bot" && msg.captions && Object.keys(msg.captions).length > 0 && (
//                     <div style={{ marginTop: 8, maxWidth: "90%", width: "100%" }}>
                      
//                       {/* Platform tabs (only shown if multiple platforms) */}
//                       {Object.keys(msg.captions).length > 1 && (
//                         <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" as const }}>
//                           {Object.keys(msg.captions).map((platform) => (
//                             <button
//                               key={platform}
//                               onClick={() => setActivePlatformTab(platform)}
//                               style={{
//                                 padding: "4px 10px",
//                                 borderRadius: 12,
//                                 border: "1px solid",
//                                 borderColor: activePlatformTab === platform ? "#3b82f6" : "#d1d5db",
//                                 background: activePlatformTab === platform ? "#3b82f6" : "#fff",
//                                 color: activePlatformTab === platform ? "#fff" : "#6b7280",
//                                 fontSize: 11,
//                                 fontWeight: 600,
//                                 cursor: "pointer",
//                                 transition: "all .15s",
//                               }}
//                             >
//                               {platform}
//                             </button>
//                           ))}
//                         </div>
//                       )}

//                       {/* FIXED: Caption display with SAFE fallback chain */}
//                       <div style={{
//                         background: msg.confirmed ? "#f0fdf4" : "#fff",
//                         border: msg.confirmed ? "2px solid #22c55e" : "1.5px solid #e5e7eb",
//                         borderRadius: 10,
//                         padding: "12px 14px",
//                         fontSize: 13,
//                         lineHeight: 1.6,
//                         whiteSpace: "pre-wrap",
//                         color: "#111",
//                       }}>
//                         {msg.captions?.[activePlatformTab] ?? 
//                          Object.values(msg.captions || {})[0] ?? 
//                          "Aucune caption disponible"}
//                       </div>

//                       {/* Confirm button */}
//                       {!msg.confirmed ? (
//                         <button
//                           onClick={() => confirmCaption(msg.captions!, msg.id)}
//                           style={{
//                             marginTop: 8,
//                             padding: "8px 18px",
//                             background: "#22c55e",
//                             color: "#fff",
//                             border: "none",
//                             borderRadius: 8,
//                             fontWeight: 700,
//                             fontSize: 12,
//                             cursor: "pointer",
//                             transition: "all .15s",
//                           }}
//                           onMouseEnter={(e) => {
//                             e.currentTarget.style.background = "#16a34a";
//                           }}
//                           onMouseLeave={(e) => {
//                             e.currentTarget.style.background = "#22c55e";
//                           }}
//                         >
//                           ✅ Confirmer cette caption
//                         </button>
//                       ) : (
//                         <div style={{ marginTop: 8, color: "#22c55e", fontWeight: 700, fontSize: 12 }}>
//                           ✅ Caption confirmée et sauvegardée
//                         </div>
//                       )}
//                     </div>
//                   )}
//                 </div>
//               ))}

//               {chatLoading && (
//                 <div style={{ display: "flex", alignItems: "flex-start" }}>
//                   <div style={{
//                     background: "#f3f4f6",
//                     borderRadius: "16px 16px 16px 4px",
//                     padding: "10px 16px",
//                     fontSize: 13,
//                     color: "#6b7280",
//                   }}>
//                     ⏳ Génération en cours...
//                   </div>
//                 </div>
//               )}

//               <div ref={chatBottomRef} />
//             </div>

//             {/* Input bar */}
//             <div style={{ padding: "12px 16px", borderTop: "1px solid #e5e7eb", display: "flex", gap: 8 }}>
//               <input
//                 value={userInput}
//                 onChange={(e) => setUserInput(e.target.value)}
//                 onKeyDown={(e) => {
//                   if (e.key === "Enter" && !e.shiftKey) {
//                     e.preventDefault();
//                     handleUserSend();
//                   }
//                 }}
//                 placeholder="Ex: rends-la plus courte, ajoute de l'humour..."
//                 style={{ ...S.input, flex: 1 }}
//                 disabled={chatLoading || messages.length === 0}
//               />
//               <button
//                 onClick={handleUserSend}
//                 disabled={chatLoading || !userInput.trim() || messages.length === 0}
//                 style={{
//                   padding: "8px 16px",
//                   background: "#3b82f6",
//                   color: "#fff",
//                   border: "none",
//                   borderRadius: 8,
//                   fontWeight: 700,
//                   cursor: "pointer",
//                   opacity: (!userInput.trim() || chatLoading || messages.length === 0) ? 0.5 : 1,
//                   transition: "all .15s",
//                 }}
//               >
//                 ➤
//               </button>
//             </div>
//           </div>

//           {/* ═══ COL 3 — PREVIEW ═══ */}
//           <div style={{ ...S.col, width: 300, minWidth: 260, flexShrink: 0 }}>
//             <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>📱 Preview</div>

//             {/* Simple IG mock */}
//             <div style={{
//               border: "1px solid #e5e7eb", borderRadius: 12,
//               overflow: "hidden", fontSize: 12,
//             }}>
//               <div style={{ background: "#fafafa", padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
//                 <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#e5e7eb" }} />
//                 <span style={{ fontWeight: 700, fontSize: 12 }}>your_brand</span>
//               </div>
//               {modal.uploadedImages?.[0] ? (
//                 <img src={modal.uploadedImages[0]} style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }} alt="Preview" />
//               ) : (
//                 <div style={{
//                   width: "100%", aspectRatio: "1",
//                   background: "#f3f4f6",
//                   display: "flex", alignItems: "center", justifyContent: "center",
//                   color: "#9ca3af", fontSize: 13,
//                 }}>
//                   📸 Aucune image
//                 </div>
//               )}
//               <div style={{ padding: "10px 12px" }}>
//                 <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, whiteSpace: "pre-wrap", color: "#111" }}>
//                   {modal.generatedContent || "Ta caption apparaîtra ici..."}
//                 </p>
//               </div>
//             </div>

//             {confirmedCaption && (
//               <div style={{
//                 background: "#f0fdf4", border: "1px solid #86efac",
//                 borderRadius: 8, padding: "10px 12px",
//                 fontSize: 12, color: "#166534", fontWeight: 600,
//               }}>
//                 ✅ Caption confirmée — prête à publier
//               </div>
//             )}

//             <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
//               <button
//                 onClick={() => imageInputRef.current?.click()}
//                 style={{
//                   padding: "10px 16px", borderRadius: 9,
//                   border: "none", background: "#f3f4f6",
//                   color: "#374151", fontWeight: 700, fontSize: 12, cursor: "pointer",
//                 }}
//               >
//                 📸 Upload Image
//               </button>
//               <button
//                 onClick={() => videoInputRef.current?.click()}
//                 style={{
//                   padding: "10px 16px", borderRadius: 9,
//                   border: "none", background: "#f3f4f6",
//                   color: "#374151", fontWeight: 700, fontSize: 12, cursor: "pointer",
//                 }}
//               >
//                 🎥 Upload Vidéo
//               </button>
//             </div>

//             <input ref={imageInputRef} type="file" onChange={handleImageUpload} hidden />
//             <input ref={videoInputRef} type="file" onChange={handleVideoUpload} hidden />

//             {modal.uploadedImages?.length > 0 && (
//               <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
//                 {modal.uploadedImages.map((img: string, i: number) => (
//                   <div key={i} style={{ position: "relative" }}>
//                     <img src={img} style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6 }} alt={`Upload ${i}`} />
//                     <button
//                       onClick={() => removeImage(i)}
//                       style={{
//                         position: "absolute", top: -5, right: -5,
//                         background: "red", color: "#fff", border: "none",
//                         borderRadius: "50%", width: 18, height: 18,
//                         cursor: "pointer", fontSize: 11,
//                       }}
//                     >
//                       ×
//                     </button>
//                   </div>
//                 ))}
//               </div>
//             )}

//             <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
//               <button
//                 onClick={handlePublish}
//                 disabled={!confirmedCaption}
//                 style={{
//                   padding: "12px", borderRadius: 9, border: "none",
//                   background: confirmedCaption ? "#3b82f6" : "#9ca3af",
//                   color: "#fff", fontWeight: 700, fontSize: 13,
//                   cursor: confirmedCaption ? "pointer" : "not-allowed",
//                 }}
//               >
//                 🚀 Publier
//               </button>
//               <button
//                 onClick={handleSaveDraft}
//                 disabled={!confirmedCaption}
//                 style={{
//                   padding: "10px", borderRadius: 9,
//                   border: "1px solid #d1d5db",
//                   background: confirmedCaption ? "#fff" : "#f9fafb",
//                   color: confirmedCaption ? "#374151" : "#9ca3af",
//                   fontWeight: 600, fontSize: 13,
//                   cursor: confirmedCaption ? "pointer" : "not-allowed",
//                 }}
//               >
//                 💾 Sauvegarder brouillon
//               </button>
//             </div>
//           </div>

//         </div>
//       </div>
//     </div>
//   );
// }
import { useEffect, useRef, useState } from "react";

// ─────────────────────────────
// TYPES
// ─────────────────────────────
type Message = {
  id: string;
  role: "user" | "bot";
  content: string;
  captions?: Record<string, string> | null;
};

type BotResponse = {
  reply?: string;
  message?: string;
  confirmed?: boolean;
  finalCaption?: string;
  platform_posts?: Record<string, any>;
};

// ─────────────────────────────
// COMPONENT
// ─────────────────────────────
export default function ChatBotPage() {
  const [messages, setMessages]               = useState<Message[]>([]);
  const [input, setInput]                     = useState<string>("");
  const [loading, setLoading]                 = useState<boolean>(false);
  const [isSetupDone, setIsSetupDone]         = useState(false);
  const [confirmedCaption, setConfirmedCaption] = useState<string | null>(null);
  const [saving, setSaving]                   = useState(false);
  const [saved, setSaved]                     = useState(false);

  // Fixed session ID for the whole conversation lifetime
  const sessionId = useRef<string>(crypto.randomUUID());

  const [form, setForm] = useState({
    message:       "",
    topic:         "",
    tone:          "casual",
    captionLength: "short",
    hashtags:      "",
    platforms:     [] as string[],
  });

  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ─────────────────────────────
  // SAFE JSON PARSER
  // ─────────────────────────────
  const tryParseJSON = (text: string): any => {
    try { return JSON.parse(text); } catch { return null; }
  };

  // ─────────────────────────────
  // PARSE BOT RESPONSE
  // ─────────────────────────────
  const parseBotResponse = (raw: any): BotResponse => {
    // raw may be { output: "{ ... }" } or already the object
    let parsed: any = raw;

    if (typeof raw === "string") {
      parsed = tryParseJSON(raw) ?? { reply: raw };
    }

    // n8n wraps in { output: "..." }
    if (parsed?.output) {
      const inner = tryParseJSON(parsed.output);
      if (inner) parsed = inner;
    }

    return parsed as BotResponse;
  };

  const buildBotMessage = (raw: any): { msg: Message; response: BotResponse } => {
    const response = parseBotResponse(raw);

    const captions: Record<string, string> = {};
    const p = response?.platform_posts ?? {};
    if (p?.Instagram?.caption)   captions["Instagram"] = p.Instagram.caption;
    if (p?.LinkedIn?.post)       captions["LinkedIn"]  = p.LinkedIn.post;
    if (p?.Facebook?.post)       captions["Facebook"]  = p.Facebook.post;
    if (p?.["X-Twitter"]?.post)  captions["X"]         = p["X-Twitter"].post;
    if (p?.TikTok?.caption)      captions["TikTok"]    = p.TikTok.caption;

    const msg: Message = {
      id:       crypto.randomUUID(),
      role:     "bot",
      content:  response?.reply || response?.message || "Here is your caption 👇",
      captions: Object.keys(captions).length > 0 ? captions : null,
    };

    return { msg, response };
  };

  // ─────────────────────────────
  // SHARED FETCH HELPER
  // ─────────────────────────────
  const callChat = async (messageText: string, isFirst = false) => {
    setLoading(true);
    try {
      const res = await fetch("https://localhost:7079/api/posts/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          message:       messageText,
          topic:         form.topic,
          tone:          form.tone,
          captionLength: form.captionLength,
          hashtags:      form.hashtags,
          platforms:     form.platforms,
          sessionId:     sessionId.current,   // ← same ID for entire session
        }),
      });

      const data = await res.json();
      const { msg, response } = buildBotMessage(data);

      setMessages((prev) => [...prev, msg]);

      // If n8n confirmed the caption → show save button
      if (response?.confirmed && response?.finalCaption) {
        setConfirmedCaption(response.finalCaption);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "bot", content: "❌ Error connecting to server", captions: null },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────
  // START CHAT
  // ─────────────────────────────
  const startChat = async () => {
    if (!form.message.trim()) return;

    setIsSetupDone(true);
    setSaved(false);
    setConfirmedCaption(null);

    const userMessage: Message = {
      id:       crypto.randomUUID(),
      role:     "user",
      content:  form.message,
      captions: null,
    };
    setMessages([userMessage]);

    await callChat(form.message, true);
  };

  // ─────────────────────────────
  // SEND MESSAGE
  // ─────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id:       crypto.randomUUID(),
      role:     "user",
      content:  input,
      captions: null,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    await callChat(input);
  };

  // ─────────────────────────────
  // SAVE CAPTION (manual fallback)
  // ─────────────────────────────
  const saveCaption = async () => {
    if (!confirmedCaption) return;
    setSaving(true);
    try {
      await fetch("https://localhost:7079/api/posts/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          caption:   confirmedCaption,
          sessionId: sessionId.current,
          topic:     form.topic,
          tone:      form.tone,
          platforms: form.platforms,
        }),
      });
      setSaved(true);
    } catch {
      alert("❌ Failed to save caption");
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────
  // NEW CONVERSATION
  // ─────────────────────────────
  const resetChat = () => {
    setIsSetupDone(false);
    setMessages([]);
    setConfirmedCaption(null);
    setSaved(false);
    setInput("");
    sessionId.current = crypto.randomUUID(); // new session
    setForm({ message: "", topic: "", tone: "casual", captionLength: "short", hashtags: "", platforms: [] });
  };

  // ─────────────────────────────
  // UI
  // ─────────────────────────────
  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <span>🤖 Social Media ChatBot</span>
        {isSetupDone && (
          <button onClick={resetChat} style={styles.resetBtn}>
            ＋ New Chat
          </button>
        )}
      </div>

      {/* SETUP FORM */}
      {!isSetupDone ? (
        <div style={styles.setupBox}>
          <h3 style={{ margin: "0 0 8px" }}>🎯 Start Generation</h3>
          <p style={{ margin: "0 0 16px", color: "#666", fontSize: 13 }}>
            Fill in the details once — the chat stays open until you save your caption.
          </p>

          <label style={styles.label}>Your first message</label>
          <input
            placeholder="e.g. Create a New Year post with emojis"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && startChat()}
            style={styles.input}
          />

          <label style={styles.label}>Topic</label>
          <input
            placeholder="e.g. New Year 2025"
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
            style={styles.input}
          />

          <label style={styles.label}>Tone</label>
          <select value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })} style={styles.input}>
            <option value="casual">Casual</option>
            <option value="professional">Professional</option>
            <option value="fun">Fun</option>
            <option value="inspirational">Inspirational</option>
          </select>

          <label style={styles.label}>Caption Length</label>
          <select value={form.captionLength} onChange={(e) => setForm({ ...form, captionLength: e.target.value })} style={styles.input}>
            <option value="short">Short</option>
            <option value="medium">Medium</option>
            <option value="long">Long</option>
          </select>

          <label style={styles.label}>Hashtags</label>
          <input
            placeholder="#happynewyear #celebration"
            value={form.hashtags}
            onChange={(e) => setForm({ ...form, hashtags: e.target.value })}
            style={styles.input}
          />

          <button style={styles.button} onClick={startChat}>
            Start Chat 🚀
          </button>
        </div>
      ) : (
        <>
          {/* CHAT MESSAGES */}
          <div style={styles.chatBox}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  ...styles.messageRow,
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    ...styles.bubble,
                    background: msg.role === "user" ? "#3b82f6" : "#f3f4f6",
                    color: msg.role === "user" ? "#fff" : "#111",
                  }}
                >
                  <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>

                  {msg.captions && (
                    <div style={styles.captionBox}>
                      {Object.entries(msg.captions).map(([platform, text]) => (
                        <div key={platform} style={{ marginBottom: 6 }}>
                          <strong>{platform}:</strong>
                          <p style={{ margin: "2px 0 0", whiteSpace: "pre-wrap" }}>{text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && <div style={styles.loading}>⏳ Thinking...</div>}

            {/* CONFIRMED CAPTION BANNER */}
            {confirmedCaption && (
              <div style={styles.confirmBanner}>
                <p style={{ margin: "0 0 8px", fontWeight: 600 }}>✅ Caption confirmed!</p>
                <p style={{ margin: "0 0 12px", fontSize: 13, whiteSpace: "pre-wrap" }}>
                  {confirmedCaption}
                </p>
                {saved ? (
                  <span style={styles.savedBadge}>💾 Saved!</span>
                ) : (
                  <button onClick={saveCaption} disabled={saving} style={styles.saveBtn}>
                    {saving ? "Saving..." : "💾 Save Caption"}
                  </button>
                )}
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* INPUT BAR */}
          <div style={styles.inputBar}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder='Refine or type "save it" to confirm...'
              style={{ ...styles.input, flex: 1 }}
              disabled={loading || saved}
            />
            <button onClick={sendMessage} style={styles.button} disabled={loading || saved}>
              ➤
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────
// STYLES
// ─────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  page: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    fontFamily: "Arial, sans-serif",
    background: "#fff",
  },
  header: {
    padding: "12px 16px",
    borderBottom: "1px solid #eee",
    fontWeight: 700,
    fontSize: 16,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resetBtn: {
    padding: "6px 12px",
    background: "#f3f4f6",
    border: "1px solid #ddd",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
  },
  setupBox: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: 24,
    maxWidth: 440,
    margin: "auto",
    width: "100%",
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "#555",
    marginBottom: 2,
  },
  chatBox: {
    flex: 1,
    padding: 16,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  messageRow: { display: "flex" },
  bubble: {
    maxWidth: "72%",
    padding: "10px 14px",
    borderRadius: 12,
    fontSize: 14,
    lineHeight: 1.5,
  },
  captionBox: {
    marginTop: 10,
    fontSize: 12,
    background: "#fff",
    padding: 10,
    borderRadius: 8,
    border: "1px solid #ddd",
    color: "#111",
  },
  confirmBanner: {
    margin: "8px 0",
    padding: 16,
    background: "#f0fdf4",
    border: "1px solid #86efac",
    borderRadius: 12,
    fontSize: 14,
  },
  saveBtn: {
    padding: "8px 16px",
    background: "#22c55e",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
  },
  savedBadge: {
    padding: "6px 12px",
    background: "#dcfce7",
    color: "#15803d",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 13,
  },
  inputBar: {
    display: "flex",
    padding: 10,
    borderTop: "1px solid #eee",
    gap: 8,
    alignItems: "center",
  },
  input: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #ddd",
    fontSize: 14,
    outline: "none",
  },
  button: {
    padding: "10px 16px",
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  },
  loading: {
    fontSize: 12,
    color: "#888",
    paddingLeft: 4,
  },
};