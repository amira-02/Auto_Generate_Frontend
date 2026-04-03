import { useContext, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../hooks/AuthContext";
import { API } from "../services/api";
import { jwtDecode } from "jwt-decode";

type Step = "form" | "generating" | "preview";
type CaptionLength = "short" | "medium" | "long";
type Tone = "professional" | "casual" | "funny" | "inspirational";
type ScheduleType = "now" | "schedule";

type ModalState = {
  open: boolean;
  step: Step;
  topic: string;
  hashtags: string;
  captionLength: CaptionLength;
  tone: Tone;
  file: File | null;
  fileName: string;
  fileContent: string;
  selectedPlatforms: string[];
  scheduleType: ScheduleType;
  scheduledAt: string;
  generatedContent: string;
  generatedImage: string;
  loading: boolean;
  error: string;
  postId: number;
  uploadedImages: string[];
  uploadedVideo: string | null;
};

const PLATFORMS = [
  { id: "linkedin",   label: "LinkedIn",    color: "#0077b5", icon: "💼" },
  { id: "twitter",    label: "Twitter / X", color: "#1da1f2", icon: "𝕏"  },
  { id: "instagram",  label: "Instagram",   color: "#e1306c", icon: "📸" },
  { id: "facebook",   label: "Facebook",    color: "#1877f2", icon: "f"  },
  { id: "tiktok",     label: "TikTok",      color: "#010101", icon: "🎵" },
  { id: "threads",    label: "Threads",     color: "#000000", icon: "🧵" },
];

const INITIAL_MODAL: ModalState = {
  open: false,
  step: "form",
  topic: "",
  hashtags: "",
  captionLength: "medium",
  tone: "professional",
  file: null,
  fileName: "",
  fileContent: "",
  selectedPlatforms: [],
  scheduleType: "now",
  scheduledAt: "",
  generatedContent: "",
  generatedImage: "",
  loading: false,
  error: "",
  postId: 0,
  uploadedImages: [],
  uploadedVideo: null,
};

export default function Dashboard() {
  const { logout, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("dashboard");
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [modal, setModal] = useState<ModalState>(INITIAL_MODAL);
  const [copyDone, setCopyDone] = useState(false);

  // ─── Auth ────────────────────────────────────────────────────────────────────
  let userEmail   = "User";
  let userInitial = "U";
  if (token) {
    try {
      const decoded: any = jwtDecode(token);
      userEmail =
        decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
        decoded.email ||
        "User";
      userInitial = userEmail.charAt(0).toUpperCase();
    } catch {}
  }

  const handleLogout = () => { logout(); navigate("/"); };

  // ─── Modal helpers ───────────────────────────────────────────────────────────
  const openModal  = () => setModal({ ...INITIAL_MODAL, open: true });
  const closeModal = () => setModal(m => ({ ...m, open: false }));
  const setM       = (patch: Partial<ModalState>) => setModal(m => ({ ...m, ...patch }));

  const togglePlatform = (id: string) =>
    setM({ selectedPlatforms: modal.selectedPlatforms.includes(id)
      ? modal.selectedPlatforms.filter(p => p !== id)
      : [...modal.selectedPlatforms, id] });

  // ─── File uploads ────────────────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev =>
      setM({ file, fileName: file.name, fileContent: ev.target?.result as string });
    reader.readAsText(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const urls = Array.from(files).map(f => URL.createObjectURL(f));
    setM({ uploadedImages: [...modal.uploadedImages, ...urls] });
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setM({ uploadedVideo: URL.createObjectURL(file) });
  };

  const removeImage = (idx: number) =>
    setM({ uploadedImages: modal.uploadedImages.filter((_, i) => i !== idx) });

  // ─── Copy caption ────────────────────────────────────────────────────────────
  const copyCaption = () => {
    navigator.clipboard.writeText(modal.generatedContent);
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 1800);
  };

  // ─── Generate (calls backend → waits for n8n callback) ───────────────────────
  const handleGenerate = async () => {
    if (!modal.topic && !modal.fileContent)
      return setM({ error: "Topic or file is required." });
    if (modal.selectedPlatforms.length === 0)
      return setM({ error: "Please select at least one platform." });

    setM({ loading: true, error: "", step: "generating" });

    try {
      // This POST blocks until n8n calls /api/posts/{id}/result (long-poll)
      const res = await API.post(
        "/posts",
        {
          topic:         modal.topic,
          hashtags:      modal.hashtags,
          platforms:     modal.selectedPlatforms,
          captionLength: modal.captionLength,
          toneOfVoice:   modal.tone,
          fileContent:   modal.fileContent,
          fileName:      modal.fileName,
        },
        {
          headers:  { Authorization: `Bearer ${token}` },
          timeout:  130_000, // 2 min + buffer — matches backend timeout
        }
      );

      setM({
        loading:          false,
        step:             "preview",
        postId:           res.data.id,
        generatedContent: res.data.caption  ?? "",
        generatedImage:   res.data.imageUrl ?? "",
      });
    } catch (err: any) {
      setM({
        loading: false,
        step:    "form",
        error:   err.response?.data?.message || err.message || "Error generating content.",
      });
    }
  };

  // ─── AI image (optional separate endpoint) ───────────────────────────────────
  const handleGenerateImage = async () => {
    if (!modal.generatedContent) return;
    setM({ loading: true });
    try {
      const res = await API.post(
        "/generate-image",
        { caption: modal.generatedContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setM({ loading: false, generatedImage: res.data.imageUrl });
    } catch {
      setM({ loading: false, error: "Error generating image." });
    }
  };

  // ─── Publish ─────────────────────────────────────────────────────────────────
  const handlePublish = async () => {
    setM({ loading: true });
    try {
      await API.put(
        `/posts/${modal.postId}/approve`,
        {
          caption:        modal.generatedContent,
          images:         modal.uploadedImages,
          video:          modal.uploadedVideo,
          generatedImage: modal.generatedImage,
          scheduleType:   modal.scheduleType,
          scheduledAt:    modal.scheduleType === "schedule" ? modal.scheduledAt : null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      closeModal();
    } catch {
      setM({ loading: false, error: "Error publishing post." });
    }
  };

  const handleSaveDraft = async () => {
    setM({ loading: true });
    try {
      await API.put(
        `/posts/${modal.postId}/draft`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      closeModal();
    } catch {
      setM({ loading: false, error: "Error saving draft." });
    }
  };

  // ─── Styles (shared tokens) ──────────────────────────────────────────────────
  const S = {
    col: {
      flex: 1,
      padding: 24,
      overflowY: "auto" as const,
      display: "flex",
      flexDirection: "column" as const,
      gap: 16,
    },
    divider: { borderRight: "1px solid #e5e7eb" },
    label: { fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" } as React.CSSProperties,
    input: {
      width: "100%",
      padding: "9px 12px",
      borderRadius: 8,
      border: "1px solid #d1d5db",
      fontSize: 13,
      fontFamily: "inherit",
      color: "#111",
      outline: "none",
    } as React.CSSProperties,
    colTitle: { fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 4 },
  };

  // ─── Sidebar items ───────────────────────────────────────────────────────────
  const navItems   = [
    { icon: "📊", label: "Dashboard", id: "dashboard" },
    { icon: "📝", label: "Posts",     id: "posts"     },
    { icon: "📅", label: "Calendar",  id: "calendar"  },
    { icon: "📈", label: "Analytics", id: "analytics" },
  ];
  const manageItems = [
    { icon: "🔗", label: "Connected Accounts", id: "accounts" },
    { icon: "👥", label: "Team Members",        id: "team"     },
    { icon: "⚙️",  label: "Settings",           id: "settings" },
  ];

  const NavBtn = ({ icon, label, id }: { icon: string; label: string; id: string }) => {
    const active = activeNav === id;
    return (
      <button
        onClick={() => setActiveNav(id)}
        style={{
          width: "100%", background: active ? "#eff6ff" : "transparent",
          border: "none", borderRadius: 8, padding: "9px 12px",
          display: "flex", alignItems: "center", gap: 10,
          color: active ? "#3b82f6" : "#374151",
          fontWeight: active ? 600 : 400, fontSize: 13,
          cursor: "pointer", textAlign: "left", fontFamily: "inherit",
        }}
      >
        <span style={{ fontSize: 15 }}>{icon}</span>{label}
      </button>
    );
  };

  // ─── Instagram mock shared component ────────────────────────────────────────
  const IgMock = () => (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
      {/* header */}
      <div style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)", flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 12, fontWeight: 700 }}>workflows.diy</div>
          <div style={{ fontSize: 10, color: "#9ca3af" }}>Just now</div>
        </div>
        <span style={{ marginLeft: "auto", color: "#9ca3af", fontSize: 18 }}>···</span>
      </div>

      {/* media */}
      <div style={{ background: "#f3f4f6", minHeight: 240, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, position: "relative", overflow: "hidden" }}>
        {modal.generatedImage ? (
          <img src={modal.generatedImage} alt="AI" style={{ width: "100%", maxHeight: 320, objectFit: "cover" }} />
        ) : modal.uploadedImages[0] ? (
          <img src={modal.uploadedImages[0]} alt="upload" style={{ width: "100%", maxHeight: 320, objectFit: "cover" }} />
        ) : modal.uploadedVideo ? (
          <video src={modal.uploadedVideo} controls style={{ width: "100%", maxHeight: 280 }} />
        ) : (
          <div style={{ textAlign: "center", color: "#9ca3af" }}>
            <div style={{ fontSize: 40, marginBottom: 6 }}>📷</div>
            <div style={{ fontSize: 11 }}>No media yet</div>
          </div>
        )}
      </div>

      {/* actions */}
      <div style={{ padding: "8px 12px", display: "flex", gap: 14, fontSize: 20, borderBottom: "1px solid #f3f4f6" }}>
        ❤️ 💬 📤
      </div>

      {/* caption */}
      <div style={{ padding: "8px 12px 12px" }}>
        <span style={{ fontSize: 12, fontWeight: 700 }}>workflows.diy </span>
        <span style={{ fontSize: 12, color: "#374151" }}>
          {modal.generatedContent
            ? modal.generatedContent.slice(0, 140) + (modal.generatedContent.length > 140 ? "…" : "")
            : <span style={{ color: "#9ca3af" }}>Caption will appear here…</span>}
        </span>
        {modal.hashtags && (
          <div style={{ fontSize: 12, color: "#3b82f6", marginTop: 4 }}>{modal.hashtags}</div>
        )}
      </div>
    </div>
  );

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", height: "100vh", background: "#f9fafb", fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ═══════════════ SIDEBAR ═══════════════ */}
      <aside style={{
        width: 230, background: "#fff", borderRight: "1px solid #e5e7eb",
        display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0,
      }}>
        {/* Logo / user */}
        <div style={{ padding: "18px 16px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
            {userInitial}
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userEmail}</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>Personal Workspace</div>
          </div>
        </div>

        {/* New post btn */}
        <div style={{ padding: "14px 12px 8px" }}>
          <button
            onClick={openModal}
            style={{ width: "100%", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 9, padding: "10px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit" }}
          >
            ✏️ New Post
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "4px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
          {navItems.map(i => <NavBtn key={i.id} {...i} />)}
          <div style={{ margin: "10px 0 4px", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9ca3af", padding: "0 4px" }}>Manage</div>
          {manageItems.map(i => <NavBtn key={i.id} {...i} />)}
        </nav>

        {/* Bottom: plan + logout */}
        <div style={{ padding: 14, borderTop: "1px solid #e5e7eb" }}>
          <div style={{ background: "#f9fafb", borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 10 }}>⭐ Starter Plan</div>
            {[
              { label: "🔗 Accounts", val: "9/10",  pct: 90  },
              { label: "✨ AI Credits", val: "0/50", pct: 0   },
            ].map(row => (
              <div key={row.label} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b7280", marginBottom: 3 }}>
                  <span>{row.label}</span><span style={{ fontWeight: 600, color: "#374151" }}>{row.val}</span>
                </div>
                <div style={{ background: "#e5e7eb", borderRadius: 4, height: 4 }}>
                  <div style={{ width: `${row.pct}%`, height: "100%", background: "#3b82f6", borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleLogout}
            style={{ width: "100%", background: "transparent", border: "1px solid #e5e7eb", color: "#6b7280", padding: "8px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* ═══════════════ MAIN ═══════════════ */}
      <main style={{ flex: 1, marginLeft: 230, overflowY: "auto" }}>
        <div style={{ padding: 40, maxWidth: 1200, margin: "0 auto" }}>
          {activeNav === "dashboard" && (
            <>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Dashboard</h1>
              <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 28 }}>Welcome back! Ready to create engaging content?</p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, marginBottom: 36 }}>
                {[
                  { label: "Total Posts",  value: "0", color: "#3b82f6", icon: "📝" },
                  { label: "Published",    value: "0", color: "#10b981", icon: "✅" },
                  { label: "Drafts",       value: "0", color: "#f59e0b", icon: "💾" },
                  { label: "Engagement",   value: "0%", color: "#8b5cf6", icon: "📊" },
                ].map((s, i) => (
                  <div key={i} style={{ background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #e5e7eb" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontSize: 28 }}>{s.icon}</span>
                      <span style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 48, textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 14 }}>📭</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6, color: "#111827" }}>No posts yet</h3>
                <p style={{ color: "#6b7280", marginBottom: 20, fontSize: 13 }}>Create your first post to get started</p>
                <button onClick={openModal} style={{ padding: "10px 22px", borderRadius: 8, border: "none", background: "#3b82f6", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Create Post →</button>
              </div>
            </>
          )}

          {activeNav !== "dashboard" && (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: 48, textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 14 }}>🚧</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>Coming soon</h3>
              <p style={{ color: "#6b7280", fontSize: 13, marginTop: 6 }}>This section is under construction.</p>
            </div>
          )}
        </div>
      </main>

      {/* ═══════════════ MODAL ═══════════════ */}
      {modal.open && (
        <div
          onClick={closeModal}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.52)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 1000 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: "#fff", width: "95vw", maxWidth: 1380, height: "90vh", borderRadius: 20, boxShadow: "0 25px 60px -10px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column", overflow: "hidden" }}
          >
            {/* Modal header */}
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Create Post</h2>
                {/* step indicator */}
                <div style={{ display: "flex", gap: 6 }}>
                  {(["form","generating","preview"] as Step[]).map((s, i) => (
                    <div key={s} style={{ width: 8, height: 8, borderRadius: "50%", background: modal.step === s ? "#3b82f6" : i < (["form","generating","preview"].indexOf(modal.step)) ? "#10b981" : "#e5e7eb" }} />
                  ))}
                </div>
              </div>
              <button onClick={closeModal} style={{ background: "transparent", border: "none", fontSize: 22, cursor: "pointer", color: "#9ca3af", lineHeight: 1 }}>✕</button>
            </div>

            {/* ── STEP: FORM ── */}
            {modal.step === "form" && (
              <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

                {/* COL 1 — Inputs */}
                <div style={{ ...S.col, ...S.divider, maxWidth: 320, minWidth: 280 }}>
                  <div style={S.colTitle}>📝 Content Settings</div>

                  <div>
                    <label style={S.label}>Topic</label>
                    <textarea
                      rows={3}
                      placeholder="What's your post about?"
                      value={modal.topic}
                      onChange={e => setM({ topic: e.target.value, error: "" })}
                      style={{ ...S.input, resize: "vertical" }}
                    />
                  </div>

                  <div>
                    <label style={S.label}>Upload file <span style={{ fontWeight: 400, color: "#9ca3af" }}>(PDF / TXT)</span></label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      style={{ border: "1.5px dashed #d1d5db", borderRadius: 8, padding: "12px", textAlign: "center", cursor: "pointer", fontSize: 12, color: "#6b7280" }}
                    >
                      {modal.fileName ? `✅ ${modal.fileName}` : "📄 Click to upload"}
                    </div>
                    <input ref={fileInputRef} type="file" accept=".txt,.pdf" onChange={handleFileUpload} style={{ display: "none" }} />
                  </div>

                  <div>
                    <label style={S.label}>Caption length</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      {(["short","medium","long"] as CaptionLength[]).map(v => (
                        <button key={v} onClick={() => setM({ captionLength: v })}
                          style={{ flex: 1, padding: "7px 4px", borderRadius: 7, fontSize: 11, fontWeight: modal.captionLength === v ? 700 : 400, border: "1px solid", borderColor: modal.captionLength === v ? "#3b82f6" : "#d1d5db", background: modal.captionLength === v ? "#eff6ff" : "#fff", color: modal.captionLength === v ? "#3b82f6" : "#6b7280", cursor: "pointer" }}>
                          {v.charAt(0).toUpperCase() + v.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={S.label}>Tone of voice</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {(["professional","casual","funny","inspirational"] as Tone[]).map(v => (
                        <button key={v} onClick={() => setM({ tone: v })}
                          style={{ padding: "6px 10px", borderRadius: 7, fontSize: 11, fontWeight: modal.tone === v ? 700 : 400, border: "1px solid", borderColor: modal.tone === v ? "#3b82f6" : "#d1d5db", background: modal.tone === v ? "#eff6ff" : "#fff", color: modal.tone === v ? "#3b82f6" : "#6b7280", cursor: "pointer" }}>
                          {v.charAt(0).toUpperCase() + v.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={S.label}>Hashtags</label>
                    <input
                      placeholder="#automation #n8n #ai"
                      value={modal.hashtags}
                      onChange={e => setM({ hashtags: e.target.value })}
                      style={S.input}
                    />
                  </div>

                  <div>
                    <label style={S.label}>Platforms</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {PLATFORMS.map(p => {
                        const sel = modal.selectedPlatforms.includes(p.id);
                        return (
                          <button key={p.id} onClick={() => togglePlatform(p.id)}
                            style={{ padding: "6px 10px", borderRadius: 20, fontSize: 11, fontWeight: sel ? 700 : 400, border: "1px solid", borderColor: sel ? p.color : "#d1d5db", background: sel ? p.color + "18" : "#fff", color: sel ? p.color : "#6b7280", cursor: "pointer" }}>
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

                  <button
                    onClick={handleGenerate}
                    disabled={(!modal.topic && !modal.fileContent) || modal.selectedPlatforms.length === 0}
                    style={{
                      marginTop: "auto",
                      padding: "12px",
                      borderRadius: 9,
                      border: "none",
                      background: (!modal.topic && !modal.fileContent) || modal.selectedPlatforms.length === 0 ? "#9ca3af" : "#3b82f6",
                      color: "#fff",
                      cursor: (!modal.topic && !modal.fileContent) || modal.selectedPlatforms.length === 0 ? "not-allowed" : "pointer",
                      fontSize: 14,
                      fontWeight: 700,
                      fontFamily: "inherit",
                    }}
                  >
                    ✨ Generate Content
                  </button>
                </div>

                {/* COL 2 — Output preview */}
                <div style={{ ...S.col, ...S.divider, flex: 1, background: "#f9fafb" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={S.colTitle}>📄 Caption Output</div>
                    {modal.generatedContent && (
                      <button onClick={copyCaption}
                        style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #d1d5db", background: "#fff", fontSize: 11, cursor: "pointer", color: "#374151" }}>
                        {copyDone ? "✅ Copied!" : "📋 Copy"}
                      </button>
                    )}
                  </div>

                  {modal.generatedContent ? (
                    <textarea
                      value={modal.generatedContent}
                      onChange={e => setM({ generatedContent: e.target.value })}
                      style={{ ...S.input, flex: 1, resize: "none", lineHeight: 1.65 }}
                    />
                  ) : (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#9ca3af", textAlign: "center", gap: 12 }}>
                      <div style={{ fontSize: 52 }}>✨</div>
                      <div style={{ fontSize: 13 }}>Fill in the form and click<br /><strong style={{ color: "#3b82f6" }}>Generate Content</strong> to start</div>
                    </div>
                  )}
                </div>

                {/* COL 3 — Instagram preview + media */}
                <div style={{ ...S.col, maxWidth: 320, minWidth: 280 }}>
                  <div style={S.colTitle}>📱 Instagram Preview</div>

                  <IgMock />

                  {/* Media controls */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Media</div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <button
                        onClick={handleGenerateImage}
                        disabled={!modal.generatedContent || modal.loading}
                        style={{ flex: 1, padding: "9px", background: !modal.generatedContent ? "#e5e7eb" : "#8b5cf6", color: "#fff", border: "none", borderRadius: 8, cursor: !modal.generatedContent ? "not-allowed" : "pointer", fontSize: 11, fontWeight: 600 }}>
                        🎨 AI Image
                      </button>
                      <button
                        onClick={() => imageInputRef.current?.click()}
                        style={{ flex: 1, padding: "9px", background: "#10b981", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                        📸 Upload
                      </button>
                      <button
                        onClick={() => videoInputRef.current?.click()}
                        style={{ flex: 1, padding: "9px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                        🎥 Reel
                      </button>
                    </div>
                    <input ref={imageInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: "none" }} />
                    <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoUpload} style={{ display: "none" }} />

                    {/* Thumbs */}
                    {modal.uploadedImages.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                        {modal.uploadedImages.map((img, idx) => (
                          <div key={idx} style={{ position: "relative" }}>
                            <img src={img} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8, border: "1px solid #e5e7eb" }} />
                            <button onClick={() => removeImage(idx)}
                              style={{ position: "absolute", top: -5, right: -5, width: 18, height: 18, borderRadius: "50%", background: "#ef4444", color: "#fff", border: "none", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {modal.uploadedVideo && (
                      <div style={{ marginTop: 8, fontSize: 11, color: "#10b981" }}>🎥 Video uploaded</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP: GENERATING ── */}
            {modal.step === "generating" && (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20 }}>
                <div style={{ position: "relative", width: 64, height: 64 }}>
                  <div style={{ width: 64, height: 64, border: "4px solid #e5e7eb", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.9s linear infinite" }} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>✨</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Generating your content…</h3>
                  <p style={{ color: "#6b7280", fontSize: 13 }}>n8n is crafting your post. This can take up to 2 minutes.</p>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP: PREVIEW ── */}
            {modal.step === "preview" && (
              <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

                {/* COL 1 — Edit caption */}
                <div style={{ ...S.col, ...S.divider, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={S.colTitle}>✏️ Edit Caption</div>
                    <button onClick={copyCaption}
                      style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #d1d5db", background: "#fff", fontSize: 11, cursor: "pointer", color: "#374151" }}>
                      {copyDone ? "✅ Copied!" : "📋 Copy"}
                    </button>
                  </div>
                  <textarea
                    value={modal.generatedContent}
                    onChange={e => setM({ generatedContent: e.target.value })}
                    style={{ ...S.input, flex: 1, resize: "none", lineHeight: 1.65 }}
                  />
                </div>

                {/* COL 2 — Final Instagram preview */}
                <div style={{ ...S.col, ...S.divider, flex: 1, background: "#f9fafb" }}>
                  <div style={S.colTitle}>📱 Final Preview</div>
                  <IgMock />

                  {/* extra uploaded media if multiple */}
                  {modal.uploadedImages.length > 1 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {modal.uploadedImages.slice(1).map((img, i) => (
                        <img key={i} src={img} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, border: "1px solid #e5e7eb" }} />
                      ))}
                    </div>
                  )}
                </div>

                {/* COL 3 — Publish options */}
                <div style={{ ...S.col, maxWidth: 300, minWidth: 260 }}>
                  <div style={S.colTitle}>🚀 Publish</div>

                  <div>
                    <label style={S.label}>Schedule</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      {(["now","schedule"] as ScheduleType[]).map(v => (
                        <button key={v} onClick={() => setM({ scheduleType: v })}
                          style={{ flex: 1, padding: "9px", borderRadius: 8, fontSize: 12, fontWeight: modal.scheduleType === v ? 700 : 400, border: "1px solid", borderColor: modal.scheduleType === v ? "#3b82f6" : "#d1d5db", background: modal.scheduleType === v ? "#eff6ff" : "#fff", color: modal.scheduleType === v ? "#3b82f6" : "#6b7280", cursor: "pointer" }}>
                          {v === "now" ? "Publish now" : "Schedule"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {modal.scheduleType === "schedule" && (
                    <div>
                      <label style={S.label}>Date & time</label>
                      <input
                        type="datetime-local"
                        value={modal.scheduledAt}
                        onChange={e => setM({ scheduledAt: e.target.value })}
                        style={S.input}
                      />
                    </div>
                  )}

                  <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
                    {modal.error && (
                      <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#dc2626" }}>
                        ⚠️ {modal.error}
                      </div>
                    )}
                    <button onClick={handleSaveDraft} disabled={modal.loading}
                      style={{ padding: "11px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit" }}>
                      💾 Save as Draft
                    </button>
                    <button onClick={handlePublish} disabled={modal.loading}
                      style={{ padding: "11px", borderRadius: 8, border: "none", background: modal.loading ? "#9ca3af" : "#3b82f6", color: "#fff", cursor: modal.loading ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>
                      {modal.loading ? "Publishing…" : "🚀 Publish"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%,100%{ transform:translateY(0) } 50%{ transform:translateY(-8px) } }
      `}</style>
    </div>
  );
}