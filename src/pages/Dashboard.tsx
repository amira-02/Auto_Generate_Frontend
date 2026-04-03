import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../hooks/AuthContext";
import { API } from "../services/api";
import { jwtDecode } from "jwt-decode";

type ModalState = {
  open: boolean;
  step: "form" | "generating" | "preview";
  topic: string;
  hashtags: string;
  file: File | null;
  fileName: string;
  selectedPlatforms: string[];
  scheduleType: "now" | "schedule";
  scheduledAt: string;
  generatedContent: string;
  generatedImage?: string;
  loading: boolean;
  error: string;
  postId: number;
};

const PLATFORMS = [
  { id: "linkedin", label: "LinkedIn", color: "#0077b5", icon: "in" },
  { id: "twitter", label: "Twitter / X", color: "#1da1f2", icon: "𝕏" },
  { id: "instagram", label: "Instagram", color: "#e1306c", icon: "📸" },
  { id: "facebook", label: "Facebook", color: "#1877f2", icon: "f" },
];

export default function Dashboard() {
  const { logout, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("dashboard");

  const navItems = [
    { icon: "📊", label: "Dashboard", action: "dashboard" },
    { icon: "📝", label: "Posts", action: "posts" },
    { icon: "📅", label: "Calendar", action: "calendar" },
    { icon: "📈", label: "Analytics", action: "analytics" },
  ];

  const manageItems = [
    { icon: "🔗", label: "Connected Accounts", action: "accounts" },
    { icon: "👥", label: "Team Members", action: "team" },
    { icon: "⚙️", label: "Settings", action: "settings" },
  ];

  const [modal, setModal] = useState<ModalState>({
    open: false,
    step: "form",
    topic: "",
    hashtags: "",
    file: null,
    fileName: "",
    selectedPlatforms: [],
    scheduleType: "now",
    scheduledAt: "",
    generatedContent: "",
    generatedImage: "",
    loading: false,
    error: "",
    postId: 0,
  });

  let userEmail = "User";
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

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const openModal = () =>
    setModal((m) => ({
      ...m,
      open: true,
      step: "form",
      topic: "",
      hashtags: "",
      generatedContent: "",
      generatedImage: "",
      error: "",
    }));

  const closeModal = () =>
    setModal((m) => ({ ...m, open: false }));

  const togglePlatform = (id: string) => {
    setModal((m) => ({
      ...m,
      selectedPlatforms: m.selectedPlatforms.includes(id)
        ? m.selectedPlatforms.filter((p) => p !== id)
        : [...m.selectedPlatforms, id],
    }));
  };

  const handleGenerate = async () => {
    if (!modal.topic) {
      return setModal((m) => ({ ...m, error: "Topic is required." }));
    }

    if (modal.selectedPlatforms.length === 0) {
      return setModal((m) => ({ ...m, error: "Please select at least one platform." }));
    }

    try {
      setModal((m) => ({
        ...m,
        loading: true,
        error: "",
        step: "generating",
      }));

      const res = await API.post(
        "/posts",
        {
          topic: modal.topic,
          hashtags: modal.hashtags,
          platforms: modal.selectedPlatforms,
          scheduleType: modal.scheduleType,
          scheduledAt: modal.scheduleType === "schedule" ? modal.scheduledAt : null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setModal((m) => ({
        ...m,
        loading: false,
        step: "preview",
        postId: res.data.id,
        generatedContent: res.data.caption,
        generatedImage: res.data.imageUrl,
      }));
    } catch (err: any) {
      setModal((m) => ({
        ...m,
        loading: false,
        step: "form",
        error: err.response?.data?.message || "Error generating content",
      }));
    }
  };

  const handlePublish = async () => {
    try {
      setModal((m) => ({ ...m, loading: true }));

      await API.put(
        `/posts/${modal.postId}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      closeModal();
    } catch {
      setModal((m) => ({
        ...m,
        loading: false,
        error: "Error publishing post.",
      }));
    }
  };

  const handleSaveDraft = async () => {
    try {
      setModal((m) => ({ ...m, loading: true }));

      await API.put(
        `/posts/${modal.postId}/draft`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      closeModal();
    } catch {
      setModal((m) => ({
        ...m,
        loading: false,
        error: "Error saving draft.",
      }));
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f9fafb", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      
      {/* SIDEBAR - Version sans vert */}
      <aside style={{ width: 230, background: "#fff", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0 }}>
        <div style={{ padding: "20px 16px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14 }}>{userInitial}</div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userEmail}</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>Personal Workspace</div>
          </div>
        </div>

        <div style={{ padding: "16px 12px 8px" }}>
          <button onClick={openModal}
            style={{ width: "100%", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit" }}>
            ✏️ New Post
          </button>
        </div>

        <nav style={{ flex: 1, padding: "8px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
          {navItems.map((item) => (
            <button key={item.action} onClick={() => setActiveNav(item.action)}
              style={{ width: "100%", background: activeNav === item.action ? "#eff6ff" : "transparent", border: "none", borderRadius: 8, padding: "9px 12px", display: "flex", alignItems: "center", gap: 10, color: activeNav === item.action ? "#3b82f6" : "#374151", fontWeight: activeNav === item.action ? 600 : 400, fontSize: 13, cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "all 0.15s" }}
              onMouseEnter={(e) => { if (activeNav !== item.action) e.currentTarget.style.background = "#f9fafb"; }}
              onMouseLeave={(e) => { if (activeNav !== item.action) e.currentTarget.style.background = "transparent"; }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>{item.label}
            </button>
          ))}

          <div style={{ margin: "12px 0 4px", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9ca3af", padding: "0 4px" }}>Manage</div>

          {manageItems.map((item) => (
            <button key={item.action} onClick={() => setActiveNav(item.action)}
              style={{ width: "100%", background: activeNav === item.action ? "#eff6ff" : "transparent", border: "none", borderRadius: 8, padding: "9px 12px", display: "flex", alignItems: "center", gap: 10, color: activeNav === item.action ? "#3b82f6" : "#374151", fontWeight: activeNav === item.action ? 600 : 400, fontSize: 13, cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "all 0.15s" }}
              onMouseEnter={(e) => { if (activeNav !== item.action) e.currentTarget.style.background = "#f9fafb"; }}
              onMouseLeave={(e) => { if (activeNav !== item.action) e.currentTarget.style.background = "transparent"; }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: "16px", borderTop: "1px solid #e5e7eb" }}>
          <div style={{ background: "#f9fafb", borderRadius: 10, padding: "12px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8 }}>⭐ Starter</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b7280", marginBottom: 4 }}>
              <span>🔗 Accounts</span><span style={{ fontWeight: 600, color: "#374151" }}>9/10</span>
            </div>
            <div style={{ background: "#e5e7eb", borderRadius: 4, height: 4, marginBottom: 8 }}>
              <div style={{ width: "90%", height: "100%", background: "#3b82f6", borderRadius: 4 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b7280", marginBottom: 4 }}>
              <span>✨ AI Credits</span><span style={{ fontWeight: 600, color: "#374151" }}>0/50</span>
            </div>
            <div style={{ background: "#e5e7eb", borderRadius: 4, height: 4 }}>
              <div style={{ width: "0%", height: "100%", background: "#3b82f6", borderRadius: 4 }} />
            </div>
          </div>
          <button onClick={handleLogout}
            style={{ width: "100%", marginTop: 10, background: "transparent", border: "1px solid #e5e7eb", color: "#6b7280", padding: "8px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT - Ajusté pour le sidebar fixe */}
      <div style={{ flex: 1, marginLeft: 230, overflowY: "auto" }}>
        <div style={{ padding: 48, maxWidth: 1200, margin: "0 auto" }}>
          {/* Content based on activeNav */}
          {activeNav === "dashboard" && (
            <>
              <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 36, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
                  Dashboard
                </h1>
                <p style={{ color: "#6b7280", fontSize: 16 }}>
                  Welcome back! Ready to create engaging content?
                </p>
              </div>

              {/* Stats Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 40 }}>
                {[
                  { label: "Total Posts", value: "0", color: "#3b82f6", icon: "📝" },
                  { label: "Published", value: "0", color: "#10b981", icon: "✅" },
                  { label: "Drafts", value: "0", color: "#f59e0b", icon: "💾" },
                  { label: "Engagement", value: "0%", color: "#8b5cf6", icon: "📊" },
                ].map((stat, i) => (
                  <div
                    key={i}
                    style={{
                      background: "#ffffff",
                      borderRadius: 12,
                      padding: 20,
                      border: "1px solid #e5e7eb",
                      transition: "transform 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <span style={{ fontSize: 32 }}>{stat.icon}</span>
                      <span style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</span>
                    </div>
                    <div style={{ fontSize: 14, color: "#6b7280" }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Recent Activity Placeholder */}
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  padding: 32,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "#111827" }}>
                  No posts yet
                </h3>
                <p style={{ color: "#6b7280", marginBottom: 20 }}>
                  Create your first post to get started
                </p>
                <button
                  onClick={openModal}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: "none",
                    background: "#3b82f6",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  Create Post →
                </button>
              </div>
            </>
          )}

          {activeNav === "posts" && (
            <div style={{ textAlign: "center", padding: 60 }}>
              <h2>Posts Management</h2>
              <p style={{ color: "#6b7280" }}>Coming soon...</p>
            </div>
          )}

          {activeNav === "calendar" && (
            <div style={{ textAlign: "center", padding: 60 }}>
              <h2>Content Calendar</h2>
              <p style={{ color: "#6b7280" }}>Coming soon...</p>
            </div>
          )}

          {activeNav === "analytics" && (
            <div style={{ textAlign: "center", padding: 60 }}>
              <h2>Analytics Dashboard</h2>
              <p style={{ color: "#6b7280" }}>Coming soon...</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL - reste identique */}
      {modal.open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 1000,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: "#ffffff",
              width: 560,
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 32,
              borderRadius: 20,
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              style={{
                position: "absolute",
                right: 24,
                top: 24,
                background: "transparent",
                border: "none",
                fontSize: 24,
                cursor: "pointer",
                color: "#9ca3af",
              }}
            >
              ✕
            </button>

            {modal.step === "form" && (
              <>
                <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Create New Post</h2>
                <p style={{ color: "#6b7280", marginBottom: 24, fontSize: 14 }}>
                  Generate AI-powered content for your social media
                </p>

                <label style={{ fontSize: 14, fontWeight: 500, marginBottom: 6, display: "block", color: "#374151" }}>
                  Topic *
                </label>
                <input
                  placeholder="e.g., Artificial Intelligence trends in 2024"
                  value={modal.topic}
                  onChange={(e) => setModal(m => ({ ...m, topic: e.target.value, error: "" }))}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: "1px solid #d1d5db",
                    marginBottom: 16,
                    fontSize: 14,
                  }}
                />

                <label style={{ fontSize: 14, fontWeight: 500, marginBottom: 6, display: "block", color: "#374151" }}>
                  Hashtags
                </label>
                <input
                  placeholder="#socialmedia #marketing"
                  value={modal.hashtags}
                  onChange={(e) => setModal(m => ({ ...m, hashtags: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: "1px solid #d1d5db",
                    marginBottom: 16,
                    fontSize: 14,
                  }}
                />

                <label style={{ fontSize: 14, fontWeight: 500, marginBottom: 12, display: "block", color: "#374151" }}>
                  Platforms *
                </label>
                <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
                  {PLATFORMS.map(platform => (
                    <button
                      key={platform.id}
                      onClick={() => togglePlatform(platform.id)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 20,
                        border: `1px solid ${modal.selectedPlatforms.includes(platform.id) ? platform.color : "#d1d5db"}`,
                        background: modal.selectedPlatforms.includes(platform.id) ? `${platform.color}10` : "#fff",
                        color: modal.selectedPlatforms.includes(platform.id) ? platform.color : "#6b7280",
                        cursor: "pointer",
                        fontSize: 14,
                        fontWeight: 500,
                      }}
                    >
                      {platform.icon} {platform.label}
                    </button>
                  ))}
                </div>

                <label style={{ fontSize: 14, fontWeight: 500, marginBottom: 12, display: "block", color: "#374151" }}>
                  Schedule
                </label>
                <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                  <button
                    onClick={() => setModal(m => ({ ...m, scheduleType: "now" }))}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: 8,
                      border: `1px solid ${modal.scheduleType === "now" ? "#3b82f6" : "#d1d5db"}`,
                      background: modal.scheduleType === "now" ? "#eff6ff" : "#fff",
                      color: modal.scheduleType === "now" ? "#3b82f6" : "#6b7280",
                      cursor: "pointer",
                    }}
                  >
                    Publish Now
                  </button>
                  <button
                    onClick={() => setModal(m => ({ ...m, scheduleType: "schedule" }))}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: 8,
                      border: `1px solid ${modal.scheduleType === "schedule" ? "#3b82f6" : "#d1d5db"}`,
                      background: modal.scheduleType === "schedule" ? "#eff6ff" : "#fff",
                      color: modal.scheduleType === "schedule" ? "#3b82f6" : "#6b7280",
                      cursor: "pointer",
                    }}
                  >
                    Schedule Later
                  </button>
                </div>

                {modal.scheduleType === "schedule" && (
                  <input
                    type="datetime-local"
                    value={modal.scheduledAt}
                    onChange={(e) => setModal(m => ({ ...m, scheduledAt: e.target.value }))}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: "1px solid #d1d5db",
                      marginBottom: 24,
                      fontSize: 14,
                    }}
                  />
                )}

                <button
                  onClick={handleGenerate}
                  disabled={!modal.topic || modal.selectedPlatforms.length === 0}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: 10,
                    border: "none",
                    background: (!modal.topic || modal.selectedPlatforms.length === 0) ? "#9ca3af" : "#3b82f6",
                    color: "#fff",
                    cursor: (!modal.topic || modal.selectedPlatforms.length === 0) ? "not-allowed" : "pointer",
                    fontSize: 16,
                    fontWeight: 500,
                  }}
                >
                  Generate Content ✨
                </button>

                {modal.error && (
                  <div style={{
                    marginTop: 16,
                    padding: 12,
                    background: "#fef2f2",
                    borderRadius: 8,
                    color: "#dc2626",
                    fontSize: 13,
                  }}>
                    ⚠️ {modal.error}
                  </div>
                )}
              </>
            )}

            {modal.step === "generating" && (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{
                  width: 48,
                  height: 48,
                  border: "3px solid #e5e7eb",
                  borderTopColor: "#3b82f6",
                  borderRadius: "50%",
                  margin: "0 auto 20px",
                  animation: "spin 1s linear infinite",
                }} />
                <h3 style={{ fontSize: 18, marginBottom: 8 }}>Generating your content...</h3>
                <p style={{ color: "#6b7280", fontSize: 14 }}>AI is creating engaging posts for you</p>
              </div>
            )}

            {modal.step === "preview" && (
              <>
                <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Preview & Edit</h2>
                <p style={{ color: "#6b7280", marginBottom: 24, fontSize: 14 }}>
                  Review and customize your generated content
                </p>

                <label style={{ fontSize: 14, fontWeight: 500, marginBottom: 8, display: "block", color: "#374151" }}>
                  Caption
                </label>
                <textarea
                  value={modal.generatedContent}
                  onChange={(e) => setModal(m => ({ ...m, generatedContent: e.target.value }))}
                  rows={5}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 10,
                    border: "1px solid #d1d5db",
                    marginBottom: 20,
                    fontSize: 14,
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />

                {modal.generatedImage && (
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ fontSize: 14, fontWeight: 500, marginBottom: 8, display: "block", color: "#374151" }}>
                      Image
                    </label>
                    <img
                      src={modal.generatedImage}
                      alt="Generated"
                      style={{
                        width: "100%",
                        borderRadius: 10,
                        border: "1px solid #e5e7eb",
                      }}
                    />
                  </div>
                )}

                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    onClick={handleSaveDraft}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: 10,
                      border: "1px solid #d1d5db",
                      background: "#fff",
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                  >
                    💾 Save Draft
                  </button>
                  <button
                    onClick={handlePublish}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: 10,
                      border: "none",
                      background: "#3b82f6",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                  >
                    🚀 Publish Now
                  </button>
                </div>

                {modal.error && (
                  <div style={{
                    marginTop: 16,
                    padding: 12,
                    background: "#fef2f2",
                    borderRadius: 8,
                    color: "#dc2626",
                    fontSize: 13,
                  }}>
                    ⚠️ {modal.error}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}