// // src/components/DashboardSection/Posts/ImageModal.tsx
// import { useState, useRef, useContext } from "react";
// import { motion } from "framer-motion";
// import { FiX, FiUpload, FiLink, FiZap, FiCheckCircle, FiRefreshCw } from "react-icons/fi";
// import { AuthContext } from "../../../hooks/AuthContext";

// const API = "https://localhost:7079";

// type Props = {
//   topicId: number;
//   topicName: string;
//   onClose: () => void;
//   onCreated: () => void;
// };

// export default function ImageModal({ topicId, topicName, onClose, onCreated }: Props) {
//   const { token } = useContext(AuthContext);
//   const [mode, setMode] = useState<"generate" | "upload" | "url">("upload");
//   const [postId, setPostId] = useState<number | null>(null);
//   const [prompt, setPrompt] = useState("");
//   const [style, setStyle] = useState("realistic");
//   const [urlDraft, setUrlDraft] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [preview, setPreview] = useState<string | null>(null);
//   const [done, setDone] = useState(false);
//   const fileRef = useRef<HTMLInputElement>(null);

//   const auth = () => ({ Authorization: `Bearer ${token}` });
//   const jsonHeaders = () => ({ "Content-Type": "application/json", ...auth() });

//   const ensurePost = async (): Promise<number> => {
//     if (postId) return postId;
//     const res = await fetch(`${API}/api/posts`, {
//       method: "POST",
//       headers: jsonHeaders(),
//       body: JSON.stringify({ topicId, status: "DRAFT" }),
//     });
//     const data = await res.json();
//     setPostId(data.id);
//     return data.id;
//   };

// // Fonction utilitaire à ajouter en haut du composant
// const resolveUrl = (url: string) => {
//   if (!url) return url;
//   if (url.startsWith("data:")) return url;      // base64 — ok direct
//   if (url.startsWith("http")) return url;        // URL absolue — ok
//   return `https://localhost:7079${url}`;          // URL relative — préfixe backend
// };

// // handleUpload — remplace le setPreview
// const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//   const file = e.target.files?.[0];
//   if (!file) return;
//   setLoading(true);
//   try {
//     const pid = await ensurePost();
//     const form = new FormData();
//     form.append("file", file);
//     const res = await fetch(`${API}/api/posts/${pid}/images/upload`, {
//       method: "POST",
//       headers: auth(),
//       body: form,
//     });
//     if (!res.ok) throw new Error(await res.text());
//     const data = await res.json();
//     setPreview(resolveUrl(data.url));  // ✅ préfixe l'URL
//     setDone(true);
//   } catch (err: any) {
//     alert(`Erreur upload : ${err.message}`);
//   } finally {
//     setLoading(false);
//   }
// };

// // handleGenerate — ajoute logs pour debug
// const handleGenerate = async () => {
//   setLoading(true);
//   setPreview(null);
//   try {
//     const pid = await ensurePost();
//     const res = await fetch(`${API}/api/posts/${pid}/images/generate`, {
//       method: "POST",
//       headers: jsonHeaders(),
//       body: JSON.stringify({ prompt: prompt || topicName, style }),
//     });
    
//     const data = await res.json();
//     console.log("Generate response:", data); // ← debug
    
//     if (!res.ok) throw new Error(data.message || data.details || "Erreur génération");
    
//     setPreview(resolveUrl(data.url));  // ✅ gère base64 et URL
//   } catch (err: any) {
//     alert(`Erreur génération : ${err.message}`);
//   } finally {
//     setLoading(false);
//   }
// };

//   const handleConfirmGenerated = async () => {
//     if (!preview) return;
//     const pid = await ensurePost();
//     await fetch(`${API}/api/posts/${pid}/images/url`, {
//       method: "POST",
//       headers: jsonHeaders(),
//       body: JSON.stringify({ url: preview }),
//     });
//     setDone(true);
//   };

//   const handleSetUrl = async () => {
//     if (!urlDraft.trim()) return;
//     setLoading(true);
//     try {
//       const pid = await ensurePost();
//       await fetch(`${API}/api/posts/${pid}/images/url`, {
//         method: "POST",
//         headers: jsonHeaders(),
//         body: JSON.stringify({ url: urlDraft }),
//       });
//       setPreview(urlDraft);
//       setDone(true);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleFinish = () => {
//     onCreated();
//     onClose();
//   };
  

//   return (
//     <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
//       <motion.div
//         initial={{ opacity: 0, scale: 0.95, y: 20 }}
//         animate={{ opacity: 1, scale: 1, y: 0 }}
//         style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 480, boxShadow: "0 24px 60px rgba(0,0,0,0.2)", overflow: "hidden" }}
//       >
//         {/* Header */}
//         <div style={{ padding: "18px 22px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#faf9ff" }}>
//           <div>
//             <div style={{ fontSize: 15, fontWeight: 600, color: "#111" }}>Ajouter une image</div>
//             <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>Topic : <strong>{topicName}</strong></div>
//           </div>
//           <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa" }}>
//             <FiX size={18} />
//           </button>
//         </div>

//         <div style={{ padding: 24 }}>
//           {/* Mode tabs */}
//           <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
//             {[
//               { id: "upload",   label: "Uploader",   icon: <FiUpload size={13} /> },
//               { id: "generate", label: "Générer IA",  icon: <FiZap size={13} /> },
//               { id: "url",      label: "URL",          icon: <FiLink size={13} /> },
//             ].map(m => (
//               <button key={m.id} onClick={() => { setMode(m.id as any); setPreview(null); setDone(false); }}
//                 style={{ flex: 1, padding: "8px 0", border: "1.5px solid", borderColor: mode === m.id ? "#7c3aed" : "#e5e5e5", borderRadius: 10, background: mode === m.id ? "#ede9fe" : "white", color: mode === m.id ? "#5b21b6" : "#888", fontSize: 12, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontFamily: "inherit" }}>
//                 {m.icon}{m.label}
//               </button>
//             ))}
//           </div>

//           {/* Upload */}
//           {mode === "upload" && !done && (
//             <div>
//               <div onClick={() => fileRef.current?.click()}
//                 style={{ border: "2px dashed #e5e5e5", borderRadius: 12, padding: "48px 20px", textAlign: "center", cursor: "pointer", transition: "border-color 0.15s" }}
//                 onMouseEnter={e => e.currentTarget.style.borderColor = "#7c3aed"}
//                 onMouseLeave={e => e.currentTarget.style.borderColor = "#e5e5e5"}>
//                 <FiUpload size={32} color="#ccc" style={{ display: "block", margin: "0 auto 12px" }} />
//                 <div style={{ fontSize: 14, color: "#555", fontWeight: 500 }}>Cliquez pour uploader</div>
//                 <div style={{ fontSize: 12, color: "#bbb", marginTop: 4 }}>PNG, JPG, WebP — max 10MB</div>
//               </div>
//               <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleUpload} />
//               {loading && <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#7c3aed" }}>Upload en cours...</div>}
//             </div>
//           )}

//           {/* Generate */}
//           {mode === "generate" && !done && (
//             <div>
//               <div style={{ fontSize: 11, color: "#888", fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>Description</div>
//               <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3}
//                 placeholder={`Image pour "${topicName}"...`}
//                 style={{ width: "100%", border: "1px solid #e5e5e5", borderRadius: 10, padding: "10px 12px", fontSize: 13, fontFamily: "inherit", resize: "none", outline: "none", marginBottom: 12, boxSizing: "border-box" }} />
//               <div style={{ fontSize: 11, color: "#888", fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Style</div>
//               <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
//                 {["realistic", "cinematic", "minimalist", "cartoon", "watercolor"].map(s => (
//                   <button key={s} onClick={() => setStyle(s)}
//                     style={{ fontSize: 11, padding: "4px 12px", borderRadius: 20, border: "1px solid", borderColor: style === s ? "#7c3aed" : "#e5e5e5", background: style === s ? "#ede9fe" : "white", color: style === s ? "#5b21b6" : "#888", cursor: "pointer", fontFamily: "inherit" }}>
//                     {s}
//                   </button>
//                 ))}
//               </div>
//               <button onClick={handleGenerate} disabled={loading}
//                 style={{ width: "100%", background: "#7c3aed", color: "white", border: "none", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "inherit" }}>
//                 <FiZap size={13} /> {loading ? "Génération..." : "Générer"}
//               </button>
//             </div>
//           )}

//           {/* URL */}
//           {mode === "url" && !done && (
//             <div>
//               <div style={{ fontSize: 11, color: "#888", fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>URL de l'image</div>
//               <input value={urlDraft} onChange={e => setUrlDraft(e.target.value)}
//                 placeholder="https://..."
//                 style={{ width: "100%", border: "1px solid #e5e5e5", borderRadius: 10, padding: "11px 14px", fontSize: 13, fontFamily: "inherit", outline: "none", marginBottom: 12, boxSizing: "border-box" }} />
//               <button onClick={handleSetUrl} disabled={loading}
//                 style={{ width: "100%", background: "#7c3aed", color: "white", border: "none", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
//                 Appliquer
//               </button>
//             </div>
//           )}

//           {/* Loading spinner */}
//           {loading && !preview && mode === "generate" && (
//             <div style={{ textAlign: "center", padding: "20px 0", color: "#888", fontSize: 13 }}>
//               <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
//                 style={{ width: 28, height: 28, border: "2.5px solid #e5e5e5", borderTopColor: "#7c3aed", borderRadius: "50%", margin: "16px auto 10px" }} />
//               Génération en cours...
//             </div>
//           )}

//           {/* Preview */}
//           {preview && !done && mode === "generate" && (
//             <div style={{ marginTop: 16 }}>
//               <img src={preview} alt="preview" style={{ width: "100%", borderRadius: 12, display: "block", maxHeight: 240, objectFit: "cover", border: "2px solid #e5e5e5" }} />
//               <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
//                 <button onClick={handleConfirmGenerated}
//                   style={{ flex: 1, background: "#059669", color: "white", border: "none", borderRadius: 10, padding: "10px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontFamily: "inherit" }}>
//                   <FiCheckCircle size={13} /> Utiliser cette image
//                 </button>
//                 <button onClick={() => { setPreview(null); handleGenerate(); }} disabled={loading}
//                   style={{ background: "#f5f5f5", color: "#555", border: "none", borderRadius: 10, padding: "10px 14px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit" }}>
//                   <FiRefreshCw size={12} /> Régénérer
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* Success */}
//           {done && (
//             <div>
//               {preview && (
//                 <img src={preview} alt="uploaded" style={{ width: "100%", borderRadius: 12, display: "block", maxHeight: 240, objectFit: "cover", border: "2px solid #059669", marginBottom: 16 }} />
//               )}
//               <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
//                 <FiCheckCircle size={18} color="#059669" />
//                 <span style={{ fontSize: 13, color: "#065f46", fontWeight: 500 }}>Image sauvegardée avec succès !</span>
//               </div>
//               <button onClick={handleFinish}
//                 style={{ width: "100%", background: "#7c3aed", color: "white", border: "none", borderRadius: 10, padding: "12px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
//                 Terminer
//               </button>
//             </div>
//           )}
//         </div>
//       </motion.div>
//     </div>
//   );
// }