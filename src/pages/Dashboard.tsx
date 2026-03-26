import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../hooks/AuthContext";
import { API } from "../services/api";
import { jwtDecode } from "jwt-decode";

const stats = [
  { label: "Posts Generated", value: "128", change: "+12%", icon: "⚡", color: "#16a34a" },
  { label: "Published", value: "94", change: "+8%", icon: "🚀", color: "#059669" },
  { label: "Scheduled", value: "17", change: "+3", icon: "🕐", color: "#d97706" },
  { label: "Drafts", value: "34", change: "-2", icon: "📝", color: "#dc2626" },
];

const recentPosts = [
  { id: 1, title: "AI trends in 2026", platform: "LinkedIn", status: "Published", date: "Today", score: 94 },
  { id: 2, title: "How to build with React TSX", platform: "Twitter", status: "Scheduled", date: "Tomorrow", score: 87 },
  { id: 3, title: "Backend best practices", platform: "Instagram", status: "Draft", date: "Mar 5", score: 72 },
  { id: 4, title: "10 tips for productivity", platform: "LinkedIn", status: "Published", date: "Mar 4", score: 91 },
  { id: 5, title: "Why TypeScript matters", platform: "Twitter", status: "Published", date: "Mar 3", score: 88 },
];

const platforms = [
  { name: "LinkedIn", posts: 54, color: "#0077b5" },
  { name: "Twitter", posts: 38, color: "#1da1f2" },
  { name: "Instagram", posts: 23, color: "#e1306c" },
  { name: "Facebook", posts: 13, color: "#1877f2" },
];

const activity = [4, 7, 3, 9, 5, 12, 8, 6, 11, 4, 9, 7, 14, 6, 8, 10, 5, 13, 7, 9, 11, 6, 8, 12, 4, 7, 15, 9, 6, 10];

const statusColor: Record<string, string> = {
  Published: "#16a34a",
  Scheduled: "#d97706",
  Draft: "#9ca3af",
};

const navItems = [
  { icon: "📅", label: "Calendar", action: "calendar" },
  { icon: "📋", label: "All Posts", action: "posts" },
  { icon: "📣", label: "Campaigns", action: "campaigns" },
  { icon: "✨", label: "AI Studio", action: "ai-studio" },
  { icon: "🖼️", label: "Media", action: "media" },
  { icon: "🔗", label: "Accounts", action: "accounts" },
  { icon: "📊", label: "Analytics", action: "analytics" },
];

const manageItems = [
  { icon: "⚙️", label: "Settings", action: "settings" },
  { icon: "👥", label: "Team", action: "team" },
  { icon: "</>", label: "Developers", action: "developers" },
];

const PLATFORMS = [
  { id: "linkedin", label: "LinkedIn", color: "#0077b5", icon: "in" },
  { id: "twitter", label: "Twitter / X", color: "#1da1f2", icon: "𝕏" },
  { id: "instagram", label: "Instagram", color: "#e1306c", icon: "📸" },
  { id: "facebook", label: "Facebook", color: "#1877f2", icon: "f" },
];

type ModalState = {
  open: boolean;
  step: "form" | "generating" | "preview";
  prompt: string;
  file: File | null;
  fileName: string;
  selectedPlatforms: string[];
  scheduleType: "now" | "schedule";
  scheduledAt: string;
  generatedContent: string;
  loading: boolean;
  error: string;
};

export default function Dashboard() {
  const { logout, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("analytics");

  const [modal, setModal] = useState<ModalState>({
    open: false,
    step: "form",
    prompt: "",
    file: null,
    fileName: "",
    selectedPlatforms: [],
    scheduleType: "now",
    scheduledAt: "",
    generatedContent: "",
    loading: false,
    error: "",
  });

  let userEmail = "User";
  let userInitial = "U";
  if (token) {
    try {
      const decoded: any = jwtDecode(token);
      userEmail = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || decoded.email || "User";
      userInitial = userEmail.charAt(0).toUpperCase();
    } catch {}
  }

  const maxActivity = Math.max(...activity);

  const handleLogout = () => { logout(); navigate("/"); };

  const openModal = () => setModal(m => ({ ...m, open: true, step: "form", prompt: "", file: null, fileName: "", selectedPlatforms: [], generatedContent: "", error: "" }));
  const closeModal = () => setModal(m => ({ ...m, open: false }));

  const togglePlatform = (id: string) => {
    setModal(m => ({
      ...m,
      selectedPlatforms: m.selectedPlatforms.includes(id)
        ? m.selectedPlatforms.filter(p => p !== id)
        : [...m.selectedPlatforms, id]
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setModal(m => ({ ...m, file: f, fileName: f?.name || "" }));
  };

  const handleGenerate = async () => {
    if (!modal.prompt && !modal.file) return setModal(m => ({ ...m, error: "Prompt or JSON file is required." }));
    if (modal.selectedPlatforms.length === 0) return setModal(m => ({ ...m, error: "Select at least one platform." }));

    try {
      setModal(m => ({ ...m, loading: true, error: "", step: "generating" }));
      const formData = new FormData();
      formData.append("Prompt", modal.prompt);
      if (modal.file) formData.append("JsonFile", modal.file);

      const res = await API.post("/ai/generate", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setModal(m => ({ ...m, loading: false, step: "preview", generatedContent: res.data.post }));
    } catch (err: any) {
      setModal(m => ({ ...m, loading: false, step: "form", error: err.response?.data?.message || "Error generating post." }));
    }
  };

  const handlePublish = async () => {
    try {
      setModal(m => ({ ...m, loading: true }));
      await API.post("/post/publish", {
        content: modal.generatedContent,
        platforms: modal.selectedPlatforms,
        scheduledAt: modal.scheduleType === "schedule" ? modal.scheduledAt : null,
        status: "Published",
      }, { headers: { Authorization: `Bearer ${token}` } });
      closeModal();
      alert("Post published successfully!");
    } catch {
      setModal(m => ({ ...m, loading: false, error: "Error publishing post." }));
    }
  };

  const handleSaveDraft = async () => {
    try {
      setModal(m => ({ ...m, loading: true }));
      await API.post("/post/publish", {
        content: modal.generatedContent,
        platforms: modal.selectedPlatforms,
        scheduledAt: null,
        status: "Draft",
      }, { headers: { Authorization: `Bearer ${token}` } });
      closeModal();
      alert("Saved as draft!");
    } catch {
      setModal(m => ({ ...m, loading: false, error: "Error saving draft." }));
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f9fafb", fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#111" }}>

      {/* ── MODAL ── */}
      {modal.open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>

          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.2)" }}>

            {/* Modal Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                  {modal.step === "form" ? "✏️ New Post" : modal.step === "generating" ? "⚡ Generating..." : "👁️ Preview & Publish"}
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280" }}>
                  {modal.step === "form" ? "Fill in the details to generate your post" : modal.step === "generating" ? "AI is creating your content..." : "Review and publish your post"}
                </p>
              </div>
              <button onClick={closeModal} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>

            {/* Step Indicator */}
            <div style={{ padding: "12px 24px", display: "flex", gap: 8, alignItems: "center" }}>
              {["form", "generating", "preview"].map((s, i) => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: modal.step === s ? "#16a34a" : ["form", "generating", "preview"].indexOf(modal.step) > i ? "#16a34a" : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: ["form", "generating", "preview"].indexOf(modal.step) >= i ? "#fff" : "#9ca3af", fontWeight: 700 }}>
                    {i + 1}
                  </div>
                  <span style={{ fontSize: 11, color: modal.step === s ? "#16a34a" : "#9ca3af", fontWeight: modal.step === s ? 600 : 400 }}>
                    {s === "form" ? "Details" : s === "generating" ? "Generate" : "Publish"}
                  </span>
                  {i < 2 && <div style={{ width: 24, height: 1, background: "#e5e7eb" }} />}
                </div>
              ))}
            </div>

            <div style={{ padding: "0 24px 24px" }}>

              {/* ── STEP 1: FORM ── */}
              {modal.step === "form" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                  {/* Prompt */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Prompt *</label>
                    <div style={{ position: "relative" }}>
                      <textarea
                        value={modal.prompt}
                        onChange={(e) => setModal(m => ({ ...m, prompt: e.target.value }))}
                        placeholder="E.g., Write a LinkedIn post about AI trends in 2026..."
                        maxLength={500}
                        rows={4}
                        style={{ width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "10px 40px 10px 12px", fontSize: 13, fontFamily: "inherit", resize: "none", outline: "none", boxSizing: "border-box", color: "#111" }}
                        onFocus={(e) => (e.target.style.border = "1.5px solid #16a34a")}
                        onBlur={(e) => (e.target.style.border = "1.5px solid #e5e7eb")}
                      />
                      <input type="file" accept=".json" onChange={handleFileChange} id="jsonFile" style={{ display: "none" }} />
                      <label htmlFor="jsonFile" style={{ position: "absolute", bottom: 10, right: 10, cursor: "pointer", color: modal.fileName ? "#16a34a" : "#9ca3af", fontSize: 18 }} title="Upload JSON">
                        📎
                      </label>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: "#16a34a" }}>{modal.fileName && `📄 ${modal.fileName}`}</span>
                      <span style={{ fontSize: 11, color: "#9ca3af" }}>{modal.prompt.length}/500</span>
                    </div>
                  </div>

                  {/* Platforms */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 10 }}>Platforms *</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {PLATFORMS.map((p) => {
                        const selected = modal.selectedPlatforms.includes(p.id);
                        return (
                          <button key={p.id} onClick={() => togglePlatform(p.id)}
                            style={{ border: selected ? `2px solid ${p.color}` : "1.5px solid #e5e7eb", borderRadius: 10, padding: "10px 14px", background: selected ? `${p.color}10` : "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontFamily: "inherit", transition: "all 0.15s" }}>
                            <span style={{ width: 28, height: 28, borderRadius: 8, background: p.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>{p.icon}</span>
                            <span style={{ fontSize: 13, fontWeight: selected ? 600 : 400, color: selected ? p.color : "#374151" }}>{p.label}</span>
                            {selected && <span style={{ marginLeft: "auto", color: p.color, fontSize: 14 }}>✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Schedule */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 10 }}>Publication</label>
                    <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                      {(["now", "schedule"] as const).map((type) => (
                        <button key={type} onClick={() => setModal(m => ({ ...m, scheduleType: type }))}
                          style={{ flex: 1, padding: "9px", borderRadius: 8, border: modal.scheduleType === type ? "2px solid #16a34a" : "1.5px solid #e5e7eb", background: modal.scheduleType === type ? "#f0fdf4" : "#fff", color: modal.scheduleType === type ? "#16a34a" : "#374151", fontWeight: modal.scheduleType === type ? 600 : 400, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                          {type === "now" ? "🚀 Publish Now" : "🕐 Schedule"}
                        </button>
                      ))}
                    </div>
                    {modal.scheduleType === "schedule" && (
                      <input type="datetime-local" value={modal.scheduledAt}
                        onChange={(e) => setModal(m => ({ ...m, scheduledAt: e.target.value }))}
                        style={{ width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "9px 12px", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                    )}
                  </div>

                  {modal.error && <p style={{ color: "#dc2626", fontSize: 12, margin: 0, background: "#fef2f2", padding: "8px 12px", borderRadius: 8 }}>{modal.error}</p>}

                  <button onClick={handleGenerate} disabled={modal.loading}
                    style={{ width: "100%", background: "#16a34a", color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                    ⚡ Generate Post
                  </button>
                </div>
              )}

              {/* ── STEP 2: GENERATING ── */}
              {modal.step === "generating" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "32px 0" }}>
                  <div style={{ width: 60, height: 60, borderRadius: "50%", border: "4px solid #e5e7eb", borderTopColor: "#16a34a", animation: "spin 0.8s linear infinite" }} />
                  <p style={{ color: "#374151", fontWeight: 600, margin: 0 }}>AI is generating your post...</p>
                  <p style={{ color: "#9ca3af", fontSize: 12, margin: 0 }}>This usually takes a few seconds</p>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              )}

              {/* ── STEP 3: PREVIEW ── */}
              {modal.step === "preview" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                  {/* Platforms selected */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {modal.selectedPlatforms.map(pid => {
                      const p = PLATFORMS.find(x => x.id === pid)!;
                      return (
                        <span key={pid} style={{ background: `${p.color}15`, color: p.color, border: `1px solid ${p.color}44`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
                          {p.label}
                        </span>
                      );
                    })}
                    {modal.scheduleType === "schedule" && modal.scheduledAt && (
                      <span style={{ background: "#fff7ed", color: "#d97706", border: "1px solid #fde68a", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
                        🕐 {new Date(modal.scheduledAt).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Generated content */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Generated Content</label>
                    <textarea
                      value={modal.generatedContent}
                      onChange={(e) => setModal(m => ({ ...m, generatedContent: e.target.value }))}
                      rows={8}
                      style={{ width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "12px", fontSize: 13, fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box", color: "#111", lineHeight: 1.6 }}
                      onFocus={(e) => (e.target.style.border = "1.5px solid #16a34a")}
                      onBlur={(e) => (e.target.style.border = "1.5px solid #e5e7eb")}
                    />
                  </div>

                  {modal.error && <p style={{ color: "#dc2626", fontSize: 12, margin: 0, background: "#fef2f2", padding: "8px 12px", borderRadius: 8 }}>{modal.error}</p>}

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setModal(m => ({ ...m, step: "form" }))}
                      style={{ flex: 0, padding: "10px 16px", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
                      ← Back
                    </button>
                    <button onClick={handleSaveDraft} disabled={modal.loading}
                      style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}>
                      💾 Save as Draft
                    </button>
                    <button onClick={handlePublish} disabled={modal.loading}
                      style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "#16a34a", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>
                      {modal.scheduleType === "schedule" ? "🕐 Schedule" : "🚀 Publish"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside style={{ width: 230, background: "#fff", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0 }}>
        <div style={{ padding: "20px 16px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14 }}>{userInitial}</div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userEmail}</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>Personal Workspace</div>
          </div>
        </div>

        <div style={{ padding: "16px 12px 8px" }}>
          <button onClick={openModal}
            style={{ width: "100%", background: "#16a34a", color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit" }}>
            ✏️ New Post
          </button>
        </div>

        <nav style={{ flex: 1, padding: "8px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
          {navItems.map((item) => (
            <button key={item.action} onClick={() => setActiveNav(item.action)}
              style={{ width: "100%", background: activeNav === item.action ? "#f0fdf4" : "transparent", border: "none", borderRadius: 8, padding: "9px 12px", display: "flex", alignItems: "center", gap: 10, color: activeNav === item.action ? "#16a34a" : "#374151", fontWeight: activeNav === item.action ? 600 : 400, fontSize: 13, cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "all 0.15s" }}
              onMouseEnter={(e) => { if (activeNav !== item.action) e.currentTarget.style.background = "#f9fafb"; }}
              onMouseLeave={(e) => { if (activeNav !== item.action) e.currentTarget.style.background = "transparent"; }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>{item.label}
            </button>
          ))}

          <div style={{ margin: "12px 0 4px", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9ca3af", padding: "0 4px" }}>Manage</div>

          {manageItems.map((item) => (
            <button key={item.action} onClick={() => setActiveNav(item.action)}
              style={{ width: "100%", background: activeNav === item.action ? "#f0fdf4" : "transparent", border: "none", borderRadius: 8, padding: "9px 12px", display: "flex", alignItems: "center", gap: 10, color: activeNav === item.action ? "#16a34a" : "#374151", fontWeight: activeNav === item.action ? 600 : 400, fontSize: 13, cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "all 0.15s" }}
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
              <div style={{ width: "90%", height: "100%", background: "#16a34a", borderRadius: 4 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b7280", marginBottom: 4 }}>
              <span>✨ AI Credits</span><span style={{ fontWeight: 600, color: "#374151" }}>0/50</span>
            </div>
            <div style={{ background: "#e5e7eb", borderRadius: 4, height: 4 }}>
              <div style={{ width: "0%", height: "100%", background: "#16a34a", borderRadius: 4 }} />
            </div>
          </div>
          <button onClick={handleLogout}
            style={{ width: "100%", marginTop: 10, background: "transparent", border: "1px solid #e5e7eb", color: "#6b7280", padding: "8px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 230, flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "14px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#111" }}>Analytics</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "#6b7280" }}>{userEmail}</span>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14 }}>{userInitial}</div>
          </div>
        </div>

        <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {stats.map((stat) => (
              <div key={stat.label} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: stat.color }} />
                <div style={{ fontSize: 22, marginBottom: 8 }}>{stat.icon}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: "#6b7280", margin: "4px 0" }}>{stat.label}</div>
                <div style={{ fontSize: 11, color: stat.change.startsWith("+") ? "#16a34a" : "#dc2626" }}>{stat.change} this month</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 20, color: "#111" }}>Post Activity — Last 30 days</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
                {activity.map((val, i) => (
                  <div key={i} style={{ flex: 1, height: "100%", display: "flex", alignItems: "flex-end" }}>
                    <div style={{ width: "100%", background: `rgba(22,163,74,${0.3 + (val / maxActivity) * 0.7})`, borderRadius: 3, height: `${(val / maxActivity) * 100}%`, transition: "all 0.3s" }} />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10, color: "#9ca3af" }}>
                <span>Mar 1</span><span>Mar 10</span><span>Mar 20</span><span>Mar 30</span>
              </div>
            </div>

            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 20, color: "#111" }}>By Platform</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {platforms.map((p) => (
                  <div key={p.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
                      <span style={{ color: "#6b7280" }}>{p.name}</span>
                      <span style={{ color: p.color, fontWeight: 600 }}>{p.posts}</span>
                    </div>
                    <div style={{ background: "#f3f4f6", borderRadius: 4, height: 6 }}>
                      <div style={{ width: `${(p.posts / 54) * 100}%`, height: "100%", background: p.color, borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>Recent Posts</div>
              <button style={{ background: "transparent", border: "1px solid #e5e7eb", color: "#6b7280", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>View All</button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  {["Title", "Platform", "Status", "Date", "Score"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentPosts.map((post) => (
                  <tr key={post.id} style={{ borderBottom: "1px solid #f9fafb", transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ padding: "12px", fontSize: 13, color: "#111" }}>{post.title}</td>
                    <td style={{ padding: "12px", fontSize: 12, color: "#6b7280" }}>{post.platform}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{ background: `${statusColor[post.status]}18`, color: statusColor[post.status], padding: "3px 10px", borderRadius: 20, fontSize: 11, border: `1px solid ${statusColor[post.status]}44` }}>
                        {post.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px", fontSize: 12, color: "#6b7280" }}>{post.date}</td>
                    <td style={{ padding: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ background: "#f3f4f6", borderRadius: 4, height: 4, width: 60 }}>
                          <div style={{ width: `${post.score}%`, height: "100%", background: post.score > 85 ? "#16a34a" : post.score > 70 ? "#d97706" : "#dc2626", borderRadius: 4 }} />
                        </div>
                        <span style={{ fontSize: 12, color: "#6b7280" }}>{post.score}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}