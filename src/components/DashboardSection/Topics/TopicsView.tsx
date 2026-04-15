import { useState, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus, FiTrash2, FiChevronRight, FiGrid, FiX } from "react-icons/fi";
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
    if (!form.name.trim()) { setError("Name is required"); return; }
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
    } catch {
      setError("Failed to create topic");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this topic and all its posts?")) return;
    await fetch(`${API}/api/topics/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setTopics(prev => prev.filter(t => t.id !== id));
    toast.success("Topic deleted successfully ✅");
  };





  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>Topics</h1>
          <p style={{ color: "#888", marginTop: 4, fontSize: 14, margin: "4px 0 0" }}>
            Organise your content by subject
          </p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setError(""); }}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            background: "#7c3aed", color: "white", border: "none",
            borderRadius: 12, padding: "10px 18px", fontSize: 14,
            fontWeight: 600, cursor: "pointer",
          }}
        >
          <FiPlus size={16} /> New Topic
        </button>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreate(false)}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(4px)", display: "flex",
              alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20,
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: "white", borderRadius: 20, padding: 28,
                width: "100%", maxWidth: 480,
                boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Create Topic</h2>
                <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#888" }}>
                  <FiX size={20} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                    Name *
                  </label>
                  <input
                    autoFocus
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Italian Cuisine, Tech Tips..."
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: 10,
                      border: "1.5px solid #e5e7eb", fontSize: 14,
                      outline: "none", boxSizing: "border-box", fontFamily: "inherit",
                    }}
                    onKeyDown={e => e.key === "Enter" && handleCreate()}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="What is this topic about?"
                    rows={3}
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: 10,
                      border: "1.5px solid #e5e7eb", fontSize: 14,
                      outline: "none", resize: "vertical", boxSizing: "border-box",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>
                    Main Platform
                  </label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {PLATFORMS.map(p => {
                      const sel = form.platform === p.id;
                      return (
                        <button key={p.id} onClick={() => setForm(f => ({ ...f, platform: sel ? "" : p.id }))}
                          style={{
                            padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: sel ? 600 : 400,
                            border: "1.5px solid", borderColor: sel ? p.color : "#e5e7eb",
                            background: sel ? p.color + "15" : "white",
                            color: sel ? p.color : "#6b7280", cursor: "pointer", fontFamily: "inherit",
                          }}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {error && (
                  <div style={{ background: "#fee2e2", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#dc2626" }}>
                    {error}
                  </div>
                )}

                <button
                  onClick={handleCreate}
                  disabled={creating}
                  style={{
                    marginTop: 4, padding: "12px", background: creating ? "#9ca3af" : "#7c3aed",
                    color: "white", border: "none", borderRadius: 12,
                    fontSize: 14, fontWeight: 700, cursor: creating ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {creating ? "Creating..." : "Create Topic"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#aaa" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
          <div style={{ fontSize: 14 }}>Loading topics...</div>
        </div>
      )}

      {/* Empty */}
      {!loading && topics.length === 0 && (
        <div style={{
          textAlign: "center", padding: "80px 20px",
          background: "white", borderRadius: 20, border: "1.5px dashed #e5e7eb",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🗂️</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1a1a1a", margin: "0 0 8px" }}>No topics yet</h3>
          <p style={{ color: "#888", fontSize: 14, margin: "0 0 20px" }}>
            Create your first topic to start organising your posts
          </p>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              background: "#7c3aed", color: "white", border: "none",
              borderRadius: 12, padding: "10px 20px", fontSize: 14,
              fontWeight: 600, cursor: "pointer",
            }}
          >
            <FiPlus size={14} style={{ marginRight: 6 }} /> Create Topic
          </button>
        </div>
      )}

      {/* Grid */}
      {!loading && topics.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          <AnimatePresence>
            {topics.map((topic, i) => {
              const plat = PLATFORMS.find(p => p.id === topic.platform);
              return (
                <motion.div
                  key={topic.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -3 }}
                  onClick={() => onSelectTopic(topic.id, topic.name)}
                  style={{
                    background: "white", border: "1.5px solid #e8e8e8",
                    borderRadius: 18, padding: "20px 20px 16px",
                    cursor: "pointer", position: "relative",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    transition: "border-color 0.2s",
                  }}
                >
                  {/* Top row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: plat ? plat.color + "18" : "#f3f4f6",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 20,
                    }}>
                      <FiGrid size={20} color={plat?.color ?? "#888"} />
                    </div>
                    <button
                      onClick={e => handleDelete(topic.id, e)}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "#ddd", padding: 4, borderRadius: 8,
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#ddd")}
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </div>

                  {/* Name */}
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", marginBottom: 6 }}>
                    {topic.name}
                  </div>

                  {/* Description */}
                  {topic.description && (
                    <div style={{
                      fontSize: 13, color: "#888", lineHeight: 1.5,
                      marginBottom: 12,
                      display: "-webkit-box", WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {topic.description}
                    </div>
                  )}

                  {/* Footer */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTop: "1px solid #f0f0f0" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "#888" }}>
                        📝 <strong style={{ color: "#333" }}>{topic.postCount}</strong> posts
                      </span>
                      {plat && (
                        <span style={{
                          fontSize: 11, padding: "2px 8px", borderRadius: 20,
                          background: plat.color + "15", color: plat.color, fontWeight: 500,
                        }}>
                          {plat.label}
                        </span>
                      )}
                    </div>
                    <FiChevronRight size={16} color="#ccc" />
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