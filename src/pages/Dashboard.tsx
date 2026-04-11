// src/pages/Dashboard.tsx
import { useContext, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../hooks/AuthContext";
import { API } from "../services/api";
import { jwtDecode } from "jwt-decode";
import CalendarView from "../components/UI/CalendarView";
import CreatePostModal from "../components/UI/CreatePostModal";

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
  { id: "linkedin", label: "LinkedIn", color: "#0077b5", icon: "💼" },
  { id: "twitter", label: "Twitter / X", color: "#1da1f2", icon: "𝕏" },
  { id: "instagram", label: "Instagram", color: "#e1306c", icon: "📸" },
  { id: "facebook", label: "Facebook", color: "#1877f2", icon: "f" },
  { id: "tiktok", label: "TikTok", color: "#010101", icon: "🎵" },
  { id: "threads", label: "Threads", color: "#000000", icon: "🧵" },
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [modal, setModal] = useState<ModalState>(INITIAL_MODAL);
  const [copyDone, setCopyDone] = useState(false);
  const [posts] = useState<any[]>([]);

  // Auth
  let userEmail = "User";
  let userInitial = "U";
  if (token) {
    try {
      const decoded: any = jwtDecode(token);
      userEmail = decoded.email || decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || "User";
      userInitial = userEmail.charAt(0).toUpperCase();
    } catch {}
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Modal Helpers
  const openModal = () => setModal({ ...INITIAL_MODAL, open: true });
  const closeModal = () => setModal(m => ({ ...m, open: false }));
  const setM = (patch: Partial<ModalState>) => setModal(m => ({ ...m, ...patch }));

  const togglePlatform = (id: string) => {
    setM({
      selectedPlatforms: modal.selectedPlatforms.includes(id)
        ? modal.selectedPlatforms.filter(p => p !== id)
        : [...modal.selectedPlatforms, id],
    });
  };

  // File Uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setM({ file, fileName: file.name, fileContent: ev.target?.result as string });
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

  const copyCaption = () => {
    navigator.clipboard.writeText(modal.generatedContent);
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 1800);
  };

  // Generate & Publish functions (keep your original logic)
  const handleGenerate = async () => { /* ... your original code ... */ };
  const handleGenerateImage = async () => { /* ... your original code ... */ };
  const handlePublish = async () => { /* ... your original code ... */ };
  const handleSaveDraft = async () => { /* ... your original code ... */ };

  // Navigation Items
  const navItems = [
    { icon: "📊", label: "Dashboard", id: "dashboard" },
    { icon: "📝", label: "Posts", id: "posts" },
    { icon: "📅", label: "Calendar", id: "calendar" },
    { icon: "📈", label: "Analytics", id: "analytics" },
  ];

  const manageItems = [
    { icon: "🔗", label: "Connected Accounts", id: "accounts" },
    { icon: "👥", label: "Team Members", id: "team" },
    { icon: "⚙️", label: "Settings", id: "settings" },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-inter overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full shadow-sm">
        <div className="p-5 border-b flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl">
            {userInitial}
          </div>
          <div>
            <div className="font-semibold text-gray-900">{userEmail}</div>
            <div className="text-xs text-gray-500">Personal Workspace</div>
          </div>
        </div>

        <div className="p-4">
          <button
            onClick={openModal}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            ✏️ New Post
          </button>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all ${
                activeNav === item.id
                  ? "bg-violet-100 text-violet-700 font-semibold"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </button>
          ))}

          <div className="px-4 mt-6 mb-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
            Manage
          </div>
          {manageItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all ${
                activeNav === item.id ? "bg-violet-100 text-violet-700" : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t">
          <div className="bg-gray-50 rounded-2xl p-4 text-sm">
            <div className="font-semibold mb-3">Starter Plan</div>
            <div className="space-y-3 text-xs">
              <div>🔗 Accounts: 9/10</div>
              <div>✨ AI Credits: 42/100</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-4 py-2.5 text-gray-600 hover:text-red-600 transition-colors text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 overflow-auto">
        <div className="p-10 max-w-7xl mx-auto">
          {activeNav === "dashboard" && (
            <>
              <div className="flex justify-between items-end mb-10">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">
                    Welcome back, {userEmail.split("@")[0]} 👋
                  </h1>
                  <p className="text-gray-600 mt-2 text-lg">
                    Here's what's happening with your content today
                  </p>
                </div>
                <button
                  onClick={openModal}
                  className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-3.5 rounded-2xl font-semibold flex items-center gap-3 transition-all active:scale-95"
                >
                  ✏️ Create New Post
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {[
                  { label: "Total Posts", value: posts.length || 12, icon: "📝", color: "blue" },
                  { label: "Published", value: 8, icon: "✅", color: "emerald" },
                  { label: "Scheduled", value: 3, icon: "📅", color: "violet" },
                  { label: "AI Credits", value: "42", icon: "✨", color: "amber" },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100 hover:shadow transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-4xl">{stat.icon}</span>
                      <span className={`text-5xl font-bold text-${stat.color}-600`}>
                        {stat.value}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-6 text-lg font-medium">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Quick Actions & Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-xl mb-6">AI Performance Overview</h3>
                  <div className="h-80 bg-gray-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 text-lg">📈 Performance Chart (Will be added soon)</p>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white rounded-3xl p-8 flex flex-col">
                  <h3 className="text-2xl font-semibold">Ready for your next post?</h3>
                  <p className="mt-3 opacity-90">Our AI will generate engaging content in seconds</p>
                  <button
                    onClick={openModal}
                    className="mt-auto bg-white text-violet-700 py-4 rounded-2xl font-semibold hover:bg-white/90 transition text-lg"
                  >
                    Start AI Generation →
                  </button>
                </div>
              </div>
            </>
          )}

          {activeNav === "posts" && <div className="text-2xl font-bold">Posts Section</div>}
          {activeNav === "calendar" && <CalendarView posts={posts} />}
          {activeNav === "accounts" && <div className="text-2xl font-bold">Connected Accounts</div>}

          {!["dashboard", "posts", "calendar", "accounts"].includes(activeNav) && (
            <div className="text-center py-20">
              <p className="text-6xl mb-4">🚧</p>
              <h3 className="text-2xl font-semibold">Coming Soon</h3>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
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
    </div>
  );
}