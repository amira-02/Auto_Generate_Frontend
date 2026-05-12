import { useState, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiPlus, FiTrash2, FiSearch, FiChevronLeft, FiChevronRight, 
  FiFolder, FiHash, FiCalendar, FiTrendingUp, FiX, FiHome
} from "react-icons/fi";
import { AuthContext } from "../../../hooks/AuthContext";
import { toast } from "react-toastify";

const API      = "https://localhost:7079";
const PAGE_SIZE = 12;

type Topic = {
  id: number;
  name: string;
  description: string | null;
  platform: string;
  createdAt: string;
  postCount: number;
};

const PLATFORMS = [
  { id: "instagram", label: "Instagram", color: "#e1306c", gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
  { id: "linkedin",  label: "LinkedIn",  color: "#0077b5", gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" },
  { id: "twitter",   label: "Twitter/X", color: "#1da1f2", gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" },
  { id: "facebook",  label: "Facebook",  color: "#1877f2", gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)" },
  { id: "tiktok",    label: "TikTok",    color: "#010101", gradient: "linear-gradient(135deg, #e65787 0%, #764ba2 100%)" },
  { id: "threads",   label: "Threads",   color: "#000000", gradient: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)" },
];

type Props = {
  onSelectTopic: (id: number, name: string) => void;
};

export default function TopicsView({ onSelectTopic }: Props) {
  const ui = {
    bg: "#f8f9fb",
    panel: "#ffffff",
    border: "#e5e7eb",
    text: "#0f172a",
    subtext: "#64748b",
    primary: "#e65787",
    primarySoft: "#fff1f3",
    danger: "#ef4444",
  } as const;

  const { token } = useContext(AuthContext);
  const [topics, setTopics]         = useState<Topic[]>([]);
  const [loading, setLoading]       = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState({ name: "", description: "", platform: "" });
  const [creating, setCreating]     = useState(false);
  const [error, setError]           = useState("");
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");

  useEffect(() => { fetchTopics(); }, [token]);
  useEffect(() => { setPage(1); }, [search, selectedPlatform]);

  const fetchTopics = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/topics`, { headers: { Authorization: `Bearer ${token}` } });
      setTopics(await res.json());
    } catch { setError("Failed to load topics"); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) { setError("Name is required"); return; }
    setCreating(true); setError("");
    try {
      const res = await fetch(`${API}/api/topics`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const created = await res.json();
      setTopics(prev => [created, ...prev]);
      setShowCreate(false);
      setForm({ name: "", description: "", platform: "" });
      toast.success("✨ Topic created successfully!");
    } catch { setError("Failed to create topic"); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("⚠️ Delete this topic and all its posts? This action cannot be undone.")) return;
    try {
      await fetch(`${API}/api/topics/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setTopics(prev => prev.filter(t => t.id !== id));
      toast.success("🗑️ Topic deleted");
    } catch { toast.error("Failed to delete topic"); }
  };

  const filtered = topics.filter(t => {
    const matchesSearch = !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesPlatform = selectedPlatform === "all" || t.platform === selectedPlatform;
    return matchesSearch && matchesPlatform;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  
  const totalPosts = topics.reduce((sum, t) => sum + (t.postCount || 0), 0);
  const avgPosts = topics.length > 0 ? Math.round(totalPosts / topics.length) : 0;

  const platformStats = PLATFORMS.map(platform => ({
    ...platform,
    count: topics.filter(t => t.platform === platform.id).length,
    posts: topics.filter(t => t.platform === platform.id).reduce((sum, t) => sum + (t.postCount || 0), 0),
  })).filter(p => p.count > 0);

  return (
    <div style={{ background: ui.bg, minHeight: "100vh", padding: "24px", fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif" }}>
      
      {/* Controls Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          background: ui.panel, borderRadius: 16, padding: "14px 16px",
          marginBottom: 32, boxShadow: "0 1px 2px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.05)",
          display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
          border: `1px solid ${ui.border}`,
        }}
      >
        <div style={{ 
          display: "flex", alignItems: "center", gap: 10, flex: 1,
          background: "#f8fafc", padding: "8px 14px", borderRadius: 12,
          border: `1px solid ${ui.border}`
        }}>
          <FiSearch size={20} color="#9ca3af" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search topics..."
            style={{ 
              flex: 1, border: "none", background: "transparent", 
              outline: "none", fontSize: 14, color: "#374151",
              padding: "4px 0"
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{
              background: "#eef2f7", border: "none", borderRadius: 10,
              cursor: "pointer", padding: "4px 8px", display: "flex",
              alignItems: "center", gap: 4, fontSize: 12, color: "#6b7280"
            }}>
              <FiX size={14} /> Clear
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, overflowX: "auto", flexWrap: "wrap" }}>
          <button
            onClick={() => setSelectedPlatform("all")}
            style={{
              padding: "8px 20px", borderRadius: 40, fontSize: 13, fontWeight: 500,
              background: selectedPlatform === "all" ? ui.primary : "transparent",
              color: selectedPlatform === "all" ? "white" : "#6b7280",
              border: selectedPlatform === "all" ? "none" : `1px solid ${ui.border}`,
              cursor: "pointer", transition: "all 0.2s",
            }}
          >
            All Topics
          </button>
          {PLATFORMS.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPlatform(p.id)}
              style={{
                padding: "8px 20px", borderRadius: 40, fontSize: 13, fontWeight: 500,
                background: selectedPlatform === p.id ? p.color : "transparent",
                color: selectedPlatform === p.id ? "white" : "#6b7280",
                border: `1px solid ${selectedPlatform === p.id ? p.color : "#e5e7eb"}`,
                cursor: "pointer", transition: "all 0.2s",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => { setShowCreate(true); setError(""); }}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 18px", borderRadius: 12, border: "none",
            background: ui.primary,
            color: "white", fontSize: 14, fontWeight: 600,
            cursor: "pointer", boxShadow: "0 4px 10px rgba(230,87,135,0.28)",
            whiteSpace: "nowrap",
          }}
        >
          <FiPlus size={18} /> New Topic
        </motion.button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 20, marginBottom: 32,
        }}
      >
        {[
          { label: "Total Topics", value: topics.length, icon: FiFolder, color: "#e65787", bg: "#fce7ef" },
          { label: "Total Posts", value: totalPosts, icon: FiHash, color: "#f59e0b", bg: "#fed7aa" },
          { label: "Avg Posts/Topic", value: avgPosts, icon: FiTrendingUp, color: "#10b981", bg: "#d1fae5" },
          { label: "Active Platforms", value: platformStats.length, icon: FiHome, color: "#ef4444", bg: "#fee2e2" },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            style={{
              background: ui.panel, borderRadius: 14, padding: "18px 20px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02), 0 8px 24px -12px rgba(0,0,0,0.1)",
              border: `1px solid ${ui.border}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, background: stat.bg,
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <stat.icon size={24} color={stat.color} />
              </div>
              <span style={{ fontSize: 26, fontWeight: 700, color: ui.text }}>{stat.value}</span>
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, color: ui.subtext, margin: 0 }}>{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Platform Chips (if filtered) */}
      {selectedPlatform !== "all" && (
        <div style={{ marginBottom: 24 }}>
          <div style={{
            background: `linear-gradient(135deg, ${PLATFORMS.find(p => p.id === selectedPlatform)?.color}15, transparent)`,
            borderRadius: 16, padding: "12px 20px", borderLeft: `4px solid ${PLATFORMS.find(p => p.id === selectedPlatform)?.color}`
          }}>
            <span style={{ fontWeight: 600, color: "#1f2937", fontSize: 14 }}>
              Showing topics for <span style={{ color: PLATFORMS.find(p => p.id === selectedPlatform)?.color }}>
                {PLATFORMS.find(p => p.id === selectedPlatform)?.label}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Search Info */}
      {search && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ fontSize: 13, color: "#6b7280", marginBottom: 20, fontWeight: 500 }}>
          Found {filtered.length} topic{filtered.length !== 1 ? "s" : ""} matching "{search}"
        </motion.div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px" }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{
              width: 48, height: 48, borderRadius: "50%",
              border: "3px solid #e5e7eb", borderTopColor: "#e65787"
            }}
          />
          <p style={{ marginTop: 16, color: "#6b7280", fontSize: 14 }}>Loading your topics...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && topics.length === 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          style={{
            background: ui.panel, borderRadius: 18, padding: "64px 28px",
            textAlign: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.02), 0 8px 24px -12px rgba(0,0,0,0.1)"
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 14 }}>🗂️</div>
          <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px", color: "#1f2937" }}>No topics created yet</h3>
          <p style={{ color: "#6b7280", marginBottom: 32, fontSize: 14 }}>Start organizing your content by creating your first topic</p>
          <button onClick={() => setShowCreate(true)} style={{
            background: ui.primary,
            color: "white", border: "none", borderRadius: 40, padding: "12px 32px",
            fontSize: 14, fontWeight: 600, cursor: "pointer", display: "inline-flex",
            alignItems: "center", gap: 8,
          }}>
            <FiPlus size={18} /> Create Your First Topic
          </button>
        </motion.div>
      )}

      {/* No Results */}
      {!loading && topics.length > 0 && filtered.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{
            background: ui.panel, borderRadius: 16, padding: "56px 28px",
            textAlign: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.05)"
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
          <h4 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 6px", color: "#1f2937" }}>No matching topics</h4>
          <p style={{ fontSize: 13, color: "#6b7280" }}>Try adjusting your search or filters</p>
        </motion.div>
      )}

      {/* Topics Grid */}
      {!loading && paginated.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 24, marginBottom: 40,
          }}
        >
          <AnimatePresence>
            {paginated.map((topic, idx) => {
              const platform = PLATFORMS.find(p => p.id === topic.platform);
              const postDensity = topic.postCount > 50 ? "🔥 High" : topic.postCount > 20 ? "📈 Medium" : "🌱 Low";
              
              return (
                <motion.div
                  key={topic.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -6 }}
                  onClick={() => onSelectTopic(topic.id, topic.name)}
                  style={{
                    background: ui.panel, borderRadius: 16, overflow: "hidden",
                    cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.05)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    border: `1px solid ${ui.border}`
                  }}
                >
                  <div style={{ padding: "20px 20px 16px" }}>
                    {/* Header Row */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 14,
                        background: platform ? `${platform.color}15` : "#f3f4f6",
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                        <FiFolder size={22} color={platform?.color || "#94a3b8"} />
                      </div>
                      <button
                        onClick={(e) => handleDelete(topic.id, e)}
                        onMouseEnter={(e) => (e.currentTarget.style.color = ui.danger)}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#d1d5db")}
                        style={{
                          background: "transparent", border: "none", cursor: "pointer",
                          color: "#d1d5db", padding: 6, borderRadius: 8,
                          transition: "all 0.2s", display: "flex"
                        }}
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>

                    {/* Title */}
                    <h3 style={{
                      fontSize: 16, fontWeight: 700, margin: "8px 0 6px",
                      color: ui.text, lineHeight: 1.4
                    }}>
                      {topic.name}
                    </h3>

                    {/* Description */}
                    {topic.description && (
                      <p style={{
                        fontSize: 13, color: ui.subtext, lineHeight: 1.5,
                        margin: "0 0 12px", display: "-webkit-box",
                        WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden"
                      }}>
                        {topic.description}
                      </p>
                    )}

                    {/* Stats Row */}
                    <div style={{
                      display: "flex", alignItems: "center", gap: 12,
                      paddingTop: 12, borderTop: `1px solid ${ui.border}`
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <FiHash size={14} color="#9ca3af" />
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
                          {topic.postCount} posts
                        </span>
                      </div>
                      <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#d1d5db" }} />
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <FiCalendar size={14} color="#9ca3af" />
                        <span style={{ fontSize: 12, color: ui.subtext }}>
                          {new Date(topic.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                    </div>

                    {/* Footer Badges */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "4px 10px",
                        borderRadius: 20, background: platform ? `${platform.color}12` : "#f3f4f6",
                        color: platform?.color || "#6b7280"
                      }}>
                        {platform?.label || "Uncategorized"}
                      </span>
                      <span style={{
                        fontSize: 11, color: topic.postCount > 50 ? "#f59e0b" : topic.postCount > 20 ? "#10b981" : "#9ca3af",
                        fontWeight: 500
                      }}>
                        {postDensity}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 8, marginTop: 32, paddingBottom: 40,
          }}
        >
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              width: 40, height: 40, borderRadius: 12, border: "1px solid #e5e7eb",
              background: "white", cursor: page === 1 ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: page === 1 ? "#d1d5db" : "#374151", transition: "all 0.2s",
            }}
          >
            <FiChevronLeft size={18} />
          </button>

          <div style={{ display: "flex", gap: 6 }}>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) pageNum = i + 1;
              else if (page <= 3) pageNum = i + 1;
              else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = page - 2 + i;
              
              if (pageNum < 1 || pageNum > totalPages) return null;
              
              return (
                <button key={pageNum} onClick={() => setPage(pageNum)} style={{
                  width: 40, height: 40, borderRadius: 12, cursor: "pointer",
                  background: page === pageNum ? "linear-gradient(135deg, #e65787 0%, #764ba2 100%)" : "white",
                  color: page === pageNum ? "white" : "#374151",
                  fontWeight: page === pageNum ? 700 : 500, fontSize: 14,
                  border: page === pageNum ? "none" : "1px solid #e5e7eb",
                  transition: "all 0.2s",
                }}>
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              width: 40, height: 40, borderRadius: 12, border: "1px solid #e5e7eb",
              background: "white", cursor: page === totalPages ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: page === totalPages ? "#d1d5db" : "#374151",
            }}
          >
            <FiChevronRight size={18} />
          </button>
        </motion.div>
      )}

      {/* Create Modal - Modern Design */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreate(false)}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(8px)", display: "flex",
              alignItems: "center", justifyContent: "center", zIndex: 1000,
              padding: 20
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: ui.panel, borderRadius: 18, padding: "26px",
                width: "100%", maxWidth: 500, position: "relative",
                boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
                border: `1px solid ${ui.border}`,
              }}
            >
              {/* Modal Header */}
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 6px", color: ui.text }}>
                  Create New Topic
                </h2>
                <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
                  Organize your content around specific themes
                </p>
              </div>

              {/* Form */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8, display: "block" }}>
                    Topic Name <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    autoFocus
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g., Product Launch, Marketing Tips..."
                    style={{
                      width: "100%", padding: "12px 16px", borderRadius: 16,
                      border: `1px solid ${ui.border}`, fontSize: 14,
                      outline: "none", transition: "all 0.2s",
                      boxSizing: "border-box"
                    }}
                    onFocus={e => e.target.style.borderColor = ui.primary}
                    onBlur={e => e.target.style.borderColor = ui.border}
                    onKeyDown={e => e.key === "Enter" && handleCreate()}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8, display: "block" }}>
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Describe what this topic covers..."
                    rows={3}
                    style={{
                      width: "100%", padding: "12px 16px", borderRadius: 16,
                      border: `1px solid ${ui.border}`, fontSize: 14, outline: "none",
                      resize: "vertical", boxSizing: "border-box", fontFamily: "inherit"
                    }}
                    onFocus={e => e.target.style.borderColor = ui.primary}
                    onBlur={e => e.target.style.borderColor = ui.border}
                  />
                </div>

                {/* <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 12, display: "block" }}>
                    Platform
                  </label>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {PLATFORMS.map(p => {
                      const isSelected = form.platform === p.id;
                      return (
                        <motion.button
                          key={p.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setForm(f => ({ ...f, platform: isSelected ? "" : p.id }))}
                          style={{
                            padding: "8px 20px", borderRadius: 40, fontSize: 13,
                            fontWeight: isSelected ? 600 : 500,
                            border: `2px solid ${isSelected ? p.color : "#e5e7eb"}`,
                            background: isSelected ? `${p.color}15` : "transparent",
                            color: isSelected ? p.color : "#6b7280",
                            cursor: "pointer", transition: "all 0.2s",
                          }}
                        >
                          {p.label}
                        </motion.button>
                      );
                    })}
                  </div>
                </div> */}

                {error && (
                  <div style={{
                    background: "#fee2e2", padding: "12px 16px",
                    borderRadius: 12, color: "#dc2626", fontSize: 13, fontWeight: 500
                  }}>
                    ⚠️ {error}
                  </div>
                )}

                <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                  <button
                    onClick={() => setShowCreate(false)}
                    style={{
                      flex: 1, padding: "12px", borderRadius: 40,
                      border: `1px solid ${ui.border}`, background: "white",
                      fontSize: 14, fontWeight: 600, cursor: "pointer",
                      color: "#6b7280", transition: "all 0.2s",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={creating}
                    style={{
                      flex: 1, padding: "12px", borderRadius: 40, border: "none",
                      background: creating ? "#d1d5db" : ui.primary,
                      color: creating ? "#9ca3af" : "white", fontSize: 14,
                      fontWeight: 600, cursor: creating ? "not-allowed" : "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {creating ? "Creating..." : "Create Topic"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}