import { useContext, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../hooks/AuthContext";
import { API } from "../services/api";
import { jwtDecode } from "jwt-decode";
import CalendarView from "../components/CalendarView";
import CreatePostModal from "../components/CreatePostModal";


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
  // const IgMock = () => (
  //   <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
  //     {/* header */}
  //     <div style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 8 }}>
  //       <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)", flexShrink: 0 }} />
  //       <div>
  //         <div style={{ fontSize: 12, fontWeight: 700 }}>workflows.diy</div>
  //         <div style={{ fontSize: 10, color: "#9ca3af" }}>Just now</div>
  //       </div>
  //       <span style={{ marginLeft: "auto", color: "#9ca3af", fontSize: 18 }}>···</span>
  //     </div>

  //     {/* media */}
  //     <div style={{ background: "#f3f4f6", minHeight: 240, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, position: "relative", overflow: "hidden" }}>
  //       {modal.generatedImage ? (
  //         <img src={modal.generatedImage} alt="AI" style={{ width: "100%", maxHeight: 320, objectFit: "cover" }} />
  //       ) : modal.uploadedImages[0] ? (
  //         <img src={modal.uploadedImages[0]} alt="upload" style={{ width: "100%", maxHeight: 320, objectFit: "cover" }} />
  //       ) : modal.uploadedVideo ? (
  //         <video src={modal.uploadedVideo} controls style={{ width: "100%", maxHeight: 280 }} />
  //       ) : (
  //         <div style={{ textAlign: "center", color: "#9ca3af" }}>
  //           <div style={{ fontSize: 40, marginBottom: 6 }}>📷</div>
  //           <div style={{ fontSize: 11 }}>No media yet</div>
  //         </div>
  //       )}
  //     </div>

  //     {/* actions */}
  //     <div style={{ padding: "8px 12px", display: "flex", gap: 14, fontSize: 20, borderBottom: "1px solid #f3f4f6" }}>
  //       ❤️ 💬 📤
  //     </div>

  //     {/* caption */}
  //     <div style={{ padding: "8px 12px 12px" }}>
  //       <span style={{ fontSize: 12, fontWeight: 700 }}>workflows.diy </span>
  //       <span style={{ fontSize: 12, color: "#374151" }}>
  //         {modal.generatedContent
  //           ? modal.generatedContent.slice(0, 140) + (modal.generatedContent.length > 140 ? "…" : "")
  //           : <span style={{ color: "#9ca3af" }}>Caption will appear here…</span>}
  //       </span>
  //       {modal.hashtags && (
  //         <div style={{ fontSize: 12, color: "#3b82f6", marginTop: 4 }}>{modal.hashtags}</div>
  //       )}
  //     </div>
  //   </div>
  // );


    const [posts, setPosts] = useState<any[]>([]);

      // useEffect(() => {
      //   const fetchPosts = async () => {
      //     const res = await API.get("/posts", {
      //       headers: { Authorization: `Bearer ${token}` },
      //     });
      //     setPosts(res.data);
      //   };

      //   fetchPosts();
      // }, []);


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

    {/* ================= DASHBOARD ================= */}
    {activeNav === "dashboard" && (
      <>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111827", marginBottom: 4 }}>
          Dashboard
        </h1>

        <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 28 }}>
          Welcome back! Ready to create engaging content?
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 16,
          marginBottom: 36
        }}>
          {[
            { label: "Total Posts", value: posts.length, color: "#3b82f6", icon: "📝" },
            { label: "Published", value: posts.filter(p => p.status === "published").length, color: "#10b981", icon: "✅" },
            { label: "Drafts", value: posts.filter(p => p.status === "draft").length, color: "#f59e0b", icon: "💾" },
            { label: "Scheduled", value: posts.filter(p => p.status === "scheduled").length, color: "#8b5cf6", icon: "📅" },
          ].map((s, i) => (
            <div key={i} style={{
              background: "#fff",
              borderRadius: 12,
              padding: 20,
              border: "1px solid #e5e7eb"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 28 }}>{s.icon}</span>
                <span style={{ fontSize: 26, fontWeight: 800, color: s.color }}>
                  {s.value}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <button
          onClick={openModal}
          style={{
            padding: "12px 24px",
            borderRadius: 8,
            border: "none",
            background: "#3b82f6",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          Create Post →
        </button>
      </>
    )}

    {/* ================= POSTS ================= */}
    {activeNav === "posts" && (
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 20 }}>📝 Posts</h1>

        {posts.length === 0 ? (
          <p>No posts yet</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {posts.map((p, i) => (
              <div key={i} style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 16
              }}>
                <div style={{ fontWeight: 700 }}>
                  {p.caption?.slice(0, 100)}
                </div>

                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                  Platforms: {p.platforms?.join(", ")}
                </div>

                <div style={{ fontSize: 12, marginTop: 4 }}>
                  Status: <b>{p.status}</b>
                </div>

                {p.scheduledAt && (
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>
                    📅 {new Date(p.scheduledAt).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )}

    {/* ================= CALENDAR ================= */}
    {/* {activeNav === "calendar" && (
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 20 }}>📅 Calendar</h1>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 10
        }}>
          {Array.from({ length: 30 }).map((_, i) => {
            const dayPosts = posts.filter(p => {
              if (!p.scheduledAt) return false;
              return new Date(p.scheduledAt).getDate() === i + 1;
            });

            return (
              <div key={i} style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                minHeight: 120,
                padding: 8
              }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>
                  Day {i + 1}
                </div>

                {dayPosts.map((p, idx) => (
                  <div key={idx} style={{
                    marginTop: 6,
                    fontSize: 11,
                    background: "#eff6ff",
                    padding: 4,
                    borderRadius: 6
                  }}>
                    {p.caption?.slice(0, 40)}...
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    )} */}
    {activeNav === "calendar" && <CalendarView posts={posts} />}

    {/* ================= ACCOUNTS ================= */}
    {activeNav === "accounts" && (
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 20 }}>
          🔗 Connected Accounts
        </h1>

        {PLATFORMS.map((p) => (
          <div key={p.id} style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 16,
            marginBottom: 10
          }}>
            <div style={{ display: "flex", gap: 10 }}>
              <span>{p.icon}</span>
              <span style={{ fontWeight: 600 }}>{p.label}</span>
            </div>

            <button style={{
              background: "#3b82f6",
              color: "#fff",
              border: "none",
              padding: "6px 12px",
              borderRadius: 6,
              cursor: "pointer"
            }}>
              Connect
            </button>
          </div>
        ))}
      </div>
    )}

    {/* ================= FALLBACK ================= */}
    {!["dashboard", "posts", "calendar", "accounts"].includes(activeNav) && (
      <div style={{
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        padding: 48,
        textAlign: "center"
      }}>
        <div style={{ fontSize: 48 }}>🚧</div>
        <h3>Coming soon</h3>
      </div>
    )}

  </div>
     </main>

      {/* ═══════════════ MODAL ═══════════════ */}
<CreatePostModal
  modal={modal}
  setM={setM}
  closeModal={closeModal}

  handleGenerate={handleGenerate}
  handlePublish={handlePublish}
  handleSaveDraft={handleSaveDraft}

  handleFileUpload={handleFileUpload}
  handleImageUpload={handleImageUpload}
  handleVideoUpload={handleVideoUpload}
  handleGenerateImage={handleGenerateImage}

  togglePlatform={togglePlatform}
  removeImage={removeImage}
  copyCaption={copyCaption}

  fileInputRef={fileInputRef}
  imageInputRef={imageInputRef}
  videoInputRef={videoInputRef}

  copyDone={copyDone}
  PLATFORMS={PLATFORMS}
/>

      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%,100%{ transform:translateY(0) } 50%{ transform:translateY(-8px) } }
      `}</style>

      
    </div>
  );
}