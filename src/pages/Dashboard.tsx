// src/pages/Dashboard.tsx
import { useContext, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../hooks/AuthContext";
import { jwtDecode } from "jwt-decode";
import CalendarView from "../components/DashboardSection/CalendarView";
import CreatePostModal from "../components/DashboardSection/CreatePostModal";
import { motion, AnimatePresence } from "framer-motion";
import { FiBell, FiSearch, FiArrowLeft, FiMenu, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import PostsView from "../components/DashboardSection/PostsView";
import TopicsView from "../components/DashboardSection/TopicsView";
import TopicDetailView from "../components/DashboardSection/TopicDetailView";

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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

  // Generate & Publish functions (placeholder - keep your original logic)
  const handleGenerate = async () => { /* ... your original code ... */ };
  const handleGenerateImage = async () => { /* ... your original code ... */ };
  const handlePublish = async () => { /* ... your original code ... */ };
  const handleSaveDraft = async () => { /* ... your original code ... */ };

  // Navigation Items
  const navItems = [
    { icon: "📊", label: "Dashboard", id: "dashboard" },
    { icon: "🗂️", label: "Topics",    id: "topics" },
    { icon: "📝", label: "Posts", id: "posts" },
    { icon: "📅", label: "Calendar", id: "calendar" },
    { icon: "📈", label: "Analytics", id: "analytics" },
  ];

  const manageItems = [
    { icon: "🔗", label: "Connected Accounts", id: "accounts" },
    { icon: "👥", label: "Team Members", id: "team" },
    { icon: "⚙️", label: "Settings", id: "settings" },
  ];
const [selectedTopic, setSelectedTopic] = useState<{ id: number; name: string } | null>(null);

  // Auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 font-inter overflow-hidden">
      
      {/* Collapsible Sidebar with Smooth Animation */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isSidebarCollapsed ? 80 : 256,
          transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
        }}
        className="bg-white/70 backdrop-blur-xl border-r border-gray-200 flex flex-col fixed h-full shadow-sm z-20 overflow-hidden"
      >
        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-20 bg-white border border-gray-200 rounded-full p-1.5 shadow-md hover:shadow-lg transition-all z-30"
        >
          {isSidebarCollapsed ? 
            <FiChevronRight className="text-gray-600 text-sm" /> : 
            <FiChevronLeft className="text-gray-600 text-sm" />
          }
        </button>

        {/* User Section */}
        <div className={`p-5 border-b flex items-center gap-3 transition-all duration-300 ${isSidebarCollapsed ? 'justify-center px-2' : ''}`}>
          <div className="w-10 h-10 bg-gray-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl flex-shrink-0">
            {userInitial}
          </div>
          <AnimatePresence mode="wait">
            {!isSidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="font-semibold text-gray-900 truncate max-w-[140px]">{userEmail}</div>
                <div className="text-xs text-gray-500">Personal Workspace</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* New Post Button */}
        <div className="p-4">
          <button
            onClick={openModal}
            className={`w-full bg-gray-600 hover:bg-gray-700 text-white py-3.5 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 ${isSidebarCollapsed ? 'px-2' : ''}`}
            title={isSidebarCollapsed ? "New Post" : ""}
          >
            {isSidebarCollapsed ? "✏️" : "✏️ New Post"}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all group relative ${
                activeNav === item.id
                  ? "bg-gray-100 text-gray-700 font-semibold"
                  : "hover:bg-gray-100 text-gray-700"
              } ${isSidebarCollapsed ? 'justify-center px-2' : ''}`}
              title={isSidebarCollapsed ? item.label : ""}
            >
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              <AnimatePresence mode="wait">
                {!isSidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          ))}

          <AnimatePresence mode="wait">
            {!isSidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-4 mt-6 mb-2 text-xs font-bold text-gray-400 uppercase tracking-widest"
              >
                Manage
              </motion.div>
            )}
          </AnimatePresence>

          {manageItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all group relative ${
                activeNav === item.id ? "bg-gray-100 text-gray-700" : "hover:bg-gray-100 text-gray-700"
              } ${isSidebarCollapsed ? 'justify-center px-2' : ''}`}
              title={isSidebarCollapsed ? item.label : ""}
            >
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              <AnimatePresence mode="wait">
                {!isSidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t">
          <AnimatePresence mode="wait">
            {!isSidebarCollapsed ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-gray-50 rounded-2xl p-4 text-sm"
              >
                <div className="font-semibold mb-3">Starter Plan</div>
                <div className="space-y-3 text-xs">
                  <div>🔗 Accounts: 9/10</div>
                  <div>✨ AI Credits: 42/100</div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center"
              >
                <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center text-lg">
                  📊
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button
            onClick={handleLogout}
            className={`w-full mt-4 py-2.5 text-gray-600 hover:text-red-600 transition-colors text-sm font-medium ${isSidebarCollapsed ? 'px-2' : ''}`}
            title={isSidebarCollapsed ? "Logout" : ""}
          >
            {isSidebarCollapsed ? "🚪" : "Logout"}
          </button>
        </div>
      </motion.aside>

      {/* Main Content - Dynamic Margin */}
      <motion.main 
        animate={{ 
          marginLeft: isSidebarCollapsed ? 80 : 256,
          transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
        }}
        className="flex-1 overflow-auto"
      >
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          {activeNav === "dashboard" && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-6 mb-10"
              >
                {/* TOP BAR - Perfectly Aligned */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
                  {/* LEFT SIDE */}
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                      Welcome back, {userEmail.split("@")[0]} 👋
                    </h1>
                    <p className="text-gray-500 mt-2">
                      Let's create something beautiful today
                    </p>
                  </div>

                  {/* RIGHT SIDE */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      onClick={() => navigate("/")}
                      className="flex items-center gap-2 bg-white/70 backdrop-blur-lg px-3 py-2 rounded-xl shadow-sm hover:scale-105 transition text-gray-700"
                    >
                      <FiArrowLeft />
                      <span className="hidden sm:inline">Home</span>
                    </button>

                    {/* Menu Toggle for Mobile */}
                    <button
                      onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                      className="md:hidden flex items-center gap-2 bg-white/70 backdrop-blur-lg p-3 rounded-xl shadow-sm hover:scale-105 transition text-gray-700"
                    >
                      <FiMenu />
                    </button>

                    {/* Notification */}
                    <div className="bg-white/70 backdrop-blur-lg p-3 rounded-2xl shadow-sm hover:scale-105 transition cursor-pointer">
                      <FiBell className="text-xl text-gray-700" />
                    </div>

                    {/* Search */}
                    <div className="hidden lg:flex items-center gap-2 bg-white/70 backdrop-blur-lg px-4 py-2 rounded-2xl shadow-sm w-80">
                      <FiSearch className="text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search posts..."
                        className="bg-transparent outline-none text-sm w-full"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {[
                  { label: "Total Posts", value: posts.length || 12, icon: "📝", color: "from-blue-500 to-blue-600" },
                  { label: "Published", value: 8, icon: "✅", color: "from-green-500 to-green-600" },
                  { label: "Scheduled", value: 3, icon: "📅", color: "from-purple-500 to-purple-600" },
                  { label: "AI Credits", value: "42", icon: "✨", color: "from-orange-500 to-orange-600" },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-md border border-white/40"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-3xl">{stat.icon}</span>
                      <span className="text-3xl font-bold text-gray-800">
                        {stat.value}
                      </span>
                    </div>
                    <p className="text-gray-500 mt-4">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </>
          )}
{activeNav === "topics" && !selectedTopic && (
  <TopicsView onSelectTopic={(id, name) => setSelectedTopic({ id, name })} />
)}
{activeNav === "topics" && selectedTopic && (
  <TopicDetailView
    topicId={selectedTopic.id}
    topicName={selectedTopic.name}
    onBack={() => setSelectedTopic(null)}
  />
)}
          {activeNav === "posts" && <PostsView />}
          
          {activeNav === "calendar" && <CalendarView posts={posts} />}
          
          {activeNav === "accounts" && (
            <div className="text-2xl font-bold">Connected Accounts</div>
          )}

          {!["dashboard", "posts", "calendar", "accounts"].includes(activeNav) && (
            <div className="text-center py-20">
              <p className="text-6xl mb-4">🚧</p>
              <h3 className="text-2xl font-semibold">Coming Soon</h3>
            </div>
          )}
        </div>
      </motion.main>

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