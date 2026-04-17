import { useState, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus, FiTrash2, FiChevronRight, FiGrid, FiX, FiSearch,  } from "react-icons/fi";
import { AuthContext } from "../../../hooks/AuthContext";
import { toast } from "react-toastify";

const API = "https://localhost:7079";

type Topic = {
  id: number;
  name: string;
  description: string | null;
  platform: string;
  createdAt: string;
  postCount: number;
};

const PLATFORMS = [
  { id: "instagram", label: "Instagram", color: "#e1306c" },
  { id: "linkedin",  label: "LinkedIn",  color: "#0077b5" },
  { id: "twitter",   label: "Twitter/X", color: "#1da1f2" },
  { id: "facebook",  label: "Facebook",  color: "#1877f2" },
  { id: "tiktok",    label: "TikTok",    color: "#010101" },
  { id: "threads",   label: "Threads",   color: "#000000" },
];

type Props = {
  onSelectTopic: (id: number, name: string) => void;
};

export default function TopicsView({ onSelectTopic }: Props) {
  const { token } = useContext(AuthContext);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", platform: "" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTopics();
  }, [token]);

  const fetchTopics = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/topics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTopics(data);
    } catch {
      setError("Failed to load topics");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/topics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const created = await res.json();
      setTopics(prev => [created, ...prev]);
      setShowCreate(false);
      setForm({ name: "", description: "", platform: "" });
      toast.success("Topic created successfully!");
    } catch {
      setError("Failed to create topic");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this topic and all its posts?")) return;

    try {
      await fetch(`${API}/api/topics/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setTopics(prev => prev.filter(t => t.id !== id));
      toast.success("Topic deleted successfully ✅");
    } catch {
      toast.error("Failed to delete topic");
    }
  };

  // Statistiques
  const totalTopics = topics.length;
  const totalPosts = topics.reduce((sum, t) => sum + (t.postCount || 0), 0);
  const avgPosts = totalTopics > 0 ? Math.round(totalPosts / totalTopics) : 0;

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Header */}
<div className="flex items-center justify-between mb-8 gap-3 flex-wrap">
  <div>
    <h1 className="text-2xl font-semibold text-gray-900">Topics</h1>
    <p className="text-gray-500 text-sm mt-1">Organize your content by subject</p>
  </div>

  <div className="flex items-center gap-3 flex-wrap">
    <div className="hidden lg:flex items-center gap-3 border border-gray-300 px-4 py-2 rounded-2xl w-72 focus-within:border-gray-400">
      <FiSearch size={17} className="text-gray-500" />
      <input
        type="text"
        placeholder="Search topics..."
        className="bg-transparent outline-none text-sm w-full placeholder-gray-400"
      />
    </div>
    <button
      onClick={() => { setShowCreate(true); setError(""); }}
      className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-2xl hover:bg-gray-700 transition"
    >
      <FiPlus size={17} /> New Topic
    </button>
  </div>
</div>

      {/* Stats Grid */}
      {!loading && totalTopics > 0 && (
        <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
          <div style={{
            background: "white", borderRadius: 16, padding: "18px 24px",
            border: "1px solid #e2e8f0", flex: 1, minWidth: 160
          }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#334155" }}>{totalTopics}</div>
            <div style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Total Topics</div>
          </div>

          <div style={{
            background: "white", borderRadius: 16, padding: "18px 24px",
            border: "1px solid #e2e8f0", flex: 1, minWidth: 160
          }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#334155" }}>{totalPosts}</div>
            <div style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Total Posts</div>
          </div>

          <div style={{
            background: "white", borderRadius: 16, padding: "18px 24px",
            border: "1px solid #e2e8f0", flex: 1, minWidth: 160
          }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#334155" }}>{avgPosts}</div>
            <div style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Avg. Posts per Topic</div>
          </div>
        </div>
      )}

      {/* Create Topic Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreate(false)}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(6px)", display: "flex",
              alignItems: "center", justifyContent: "center", zIndex: 1000,
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: "white", borderRadius: 20, padding: 28,
                width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Create New Topic</h2>
                <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#888" }}>
                  <FiX size={22} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" }}>
                    Topic Name *
                  </label>
                  <input
                    autoFocus
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Product Launch, Italian Recipes..."
                    style={{
                      width: "100%", padding: "11px 14px", borderRadius: 10,
                      border: "1.5px solid #e5e7eb", fontSize: 15, outline: "none"
                    }}
                    onKeyDown={e => e.key === "Enter" && handleCreate()}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" }}>
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="What will this topic be about?"
                    rows={3}
                    style={{
                      width: "100%", padding: "11px 14px", borderRadius: 10,
                      border: "1.5px solid #e5e7eb", fontSize: 15, outline: "none", resize: "vertical"
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8, display: "block" }}>
                    Primary Platform
                  </label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {PLATFORMS.map(p => {
                      const isSelected = form.platform === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setForm(f => ({ ...f, platform: isSelected ? "" : p.id }))}
                          style={{
                            padding: "7px 14px", borderRadius: 20, fontSize: 13,
                            border: `1.5px solid ${isSelected ? p.color : "#e5e7eb"}`,
                            background: isSelected ? p.color + "15" : "white",
                            color: isSelected ? p.color : "#6b7280",
                            fontWeight: isSelected ? 600 : 400,
                            cursor: "pointer",
                          }}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {error && <div style={{ color: "#dc2626", fontSize: 13, background: "#fee2e2", padding: "10px", borderRadius: 8 }}>{error}</div>}

                <button
                  onClick={handleCreate}
                  disabled={creating}
                  style={{
                    padding: "13px", background: creating ? "#9ca3af" : "#334155",
                    color: "white", border: "none", borderRadius: 12,
                    fontSize: 15, fontWeight: 700, cursor: creating ? "not-allowed" : "pointer",
                    marginTop: 8
                  }}
                >
                  {creating ? "Creating..." : "Create Topic"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: "center", padding: "80px 20px", color: "#aaa" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
          <div>Loading topics...</div>
        </div>
      )}

      {/* Empty State */}
      {!loading && topics.length === 0 && (
        <div style={{
          textAlign: "center", padding: "80px 20px", background: "white",
          borderRadius: 20, border: "1.5px dashed #e5e7eb"
        }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🗂️</div>
          <h3 style={{ margin: "0 0 8px", fontSize: 19 }}>No topics yet</h3>
          <p style={{ color: "#888", marginBottom: 24 }}>Create your first topic to get started</p>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              background: "#334155", color: "white", border: "none",
              borderRadius: 12, padding: "12px 24px", fontSize: 15, fontWeight: 600
            }}
          >
            <FiPlus style={{ marginRight: 8 }} /> Create First Topic
          </button>
        </div>
      )}

      {/* Topics Grid */}
      {!loading && topics.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
          gap: 20
        }}>
          <AnimatePresence>
            {topics.map((topic, i) => {
              const plat = PLATFORMS.find(p => p.id === topic.platform);
              return (
                <motion.div
                  key={topic.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ y: -4 }}
                  onClick={() => onSelectTopic(topic.id, topic.name)}
                  style={{
                    background: "white",
                    border: "1.5px solid #e8e8e8",
                    borderRadius: 18,
                    padding: "20px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: plat ? plat.color + "15" : "#f1f5f9",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 22,
                    }}>
                      <FiGrid color={plat?.color ?? "#94a3b8"} />
                    </div>

                    <button
                      onClick={(e) => handleDelete(topic.id, e)}
                      style={{ background: "none", border: "none", color: "#cbd5e1", padding: 6, borderRadius: 8 }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#cbd5e1")}
                    >
                      <FiTrash2 size={17} />
                    </button>
                  </div>

                  <h3 style={{ fontSize: 16.5, fontWeight: 700, margin: "0 0 8px 0" }}>{topic.name}</h3>

                  {topic.description && (
                    <p style={{
                      fontSize: 13.5, color: "#64748b", lineHeight: 1.5,
                      display: "-webkit-box", WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical", overflow: "hidden"
                    }}>
                      {topic.description}
                    </p>
                  )}

                  <div style={{
                    marginTop: 18, paddingTop: 14, borderTop: "1px solid #f1f5f9",
                    display: "flex", justifyContent: "space-between", alignItems: "center"
                  }}>
                    <span style={{ fontSize: 13.5, color: "#64748b" }}>
                      📝 <strong style={{ color: "#1f2937" }}>{topic.postCount}</strong> posts
                    </span>
                    {plat && (
                      <span style={{
                        fontSize: 12, padding: "3px 10px", borderRadius: 20,
                        background: plat.color + "15", color: plat.color, fontWeight: 500
                      }}>
                        {plat.label}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}