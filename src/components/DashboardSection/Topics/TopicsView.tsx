import { useState, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus, FiTrash2, FiGrid, FiX, FiSearch, FiChevronLeft, FiChevronRight } from "react-icons/fi";
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
  const [topics, setTopics]         = useState<Topic[]>([]);
  const [loading, setLoading]       = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState({ name: "", description: "", platform: "" });
  const [creating, setCreating]     = useState(false);
  const [error, setError]           = useState("");
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);

  useEffect(() => { fetchTopics(); }, [token]);
  useEffect(() => { setPage(1); }, [search]);

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
      toast.success("Topic created!");
    } catch { setError("Failed to create topic"); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this topic and all its posts?")) return;
    try {
      await fetch(`${API}/api/topics/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setTopics(prev => prev.filter(t => t.id !== id));
      toast.success("Topic deleted ✅");
    } catch { toast.error("Failed to delete topic"); }
  };

  // ── Filter & Pagination ──────────────────────────────────────────────────────

  const filtered   = topics.filter(t =>
    !search ||
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.description ?? "").toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Stats ────────────────────────────────────────────────────────────────────

  const totalPosts = topics.reduce((sum, t) => sum + (t.postCount || 0), 0);
  const avgPosts   = topics.length > 0 ? Math.round(totalPosts / topics.length) : 0;

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: "#fff", borderRadius: 14,
        border: "1px solid #f0f0f0",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        padding: "12px 18px",
        display: "flex", alignItems: "center", gap: 12,
        marginBottom: 20, flexWrap: "wrap",
      }}>

        {/* Stats pills */}
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { label: "Topics",     value: topics.length, accent: "#6366f1" },
            { label: "Posts",      value: totalPosts,    accent: "#10b981" },
            { label: "Avg / Topic",value: avgPosts,      accent: "#f59e0b" },
          ].map(({ label, value, accent }) => (
            <div key={label} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 12px", borderRadius: 20,
              background: accent + "10", border: `1px solid ${accent}20`,
            }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: accent }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{value}</span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 24, background: "#f0f0f0" }} />

        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#f8f9fb", borderRadius: 10,
          padding: "7px 14px", border: "1px solid #f0f0f0",
          flex: 1, minWidth: 180, maxWidth: 280,
        }}>
          <FiSearch size={14} color="#94a3b8" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search topics..."
            style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, color: "#374151", width: "100%" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0, display: "flex" }}>
              <FiX size={13} />
            </button>
          )}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* New Topic button */}
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={() => { setShowCreate(true); setError(""); }}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "9px 18px", borderRadius: 10, border: "none",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "#fff", fontSize: 13, fontWeight: 600,
            cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.25)",
            flexShrink: 0,
          }}
        >
          <FiPlus size={15} /> New Topic
        </motion.button>
      </div>

      {/* ── Search result info ───────────────────────────────────────────────── */}
      {search && (
        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14, paddingLeft: 2 }}>
          {filtered.length} result{filtered.length !== 1 ? "s" : ""} for «{search}»
        </div>
      )}

      {/* ── Create Modal ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowCreate(false)}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(6px)", display: "flex",
              alignItems: "center", justifyContent: "center", zIndex: 1000,
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: "#fff", borderRadius: 20, padding: "28px 28px 24px",
                width: "100%", maxWidth: 460,
                boxShadow: "0 24px 64px rgba(0,0,0,0.12)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a" }}>New Topic</h2>
                  <p style={{ margin: "3px 0 0", fontSize: 12, color: "#94a3b8" }}>Organize your content by subject</p>
                </div>
                <button onClick={() => setShowCreate(false)}
                  style={{ background: "#f8f9fb", border: "1px solid #f0f0f0", borderRadius: 8, cursor: "pointer", color: "#64748b", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FiX size={15} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" }}>Topic Name *</label>
                  <input
                    autoFocus value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Product Launch, Italian Recipes…"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none", boxSizing: "border-box", transition: "border .15s" }}
                    onFocus={e => e.target.style.borderColor = "#6366f1"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                    onKeyDown={e => e.key === "Enter" && handleCreate()}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" }}>Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="What will this topic be about?"
                    rows={3}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box", transition: "border .15s", fontFamily: "inherit" }}
                    onFocus={e => e.target.style.borderColor = "#6366f1"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8, display: "block" }}>Primary Platform</label>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {PLATFORMS.map(p => {
                      const sel = form.platform === p.id;
                      return (
                        <button key={p.id}
                          onClick={() => setForm(f => ({ ...f, platform: sel ? "" : p.id }))}
                          style={{
                            padding: "5px 13px", borderRadius: 20, fontSize: 12,
                            border: `1.5px solid ${sel ? p.color : "#e5e7eb"}`,
                            background: sel ? p.color + "12" : "#fff",
                            color: sel ? p.color : "#64748b",
                            fontWeight: sel ? 600 : 400, cursor: "pointer", transition: "all .15s",
                          }}
                        >{p.label}</button>
                      );
                    })}
                  </div>
                </div>

                {error && <div style={{ color: "#dc2626", fontSize: 12, background: "#fef2f2", padding: "9px 12px", borderRadius: 8 }}>{error}</div>}

                <button
                  onClick={handleCreate} disabled={creating}
                  style={{
                    padding: "12px", borderRadius: 10, border: "none",
                    background: creating ? "#e5e7eb" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    color: creating ? "#9ca3af" : "#fff",
                    fontSize: 14, fontWeight: 600, cursor: creating ? "not-allowed" : "pointer",
                    marginTop: 4, boxShadow: creating ? "none" : "0 4px 12px rgba(99,102,241,0.25)",
                  }}
                >
                  {creating ? "Creating…" : "Create Topic"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Loading ───────────────────────────────────────────────────────────── */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 20px", color: "#94a3b8" }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#6366f1", marginBottom: 10 }}
          />
          <span style={{ fontSize: 13 }}>Loading topics…</span>
        </div>
      )}

      {/* ── Empty ────────────────────────────────────────────────────────────── */}
      {!loading && topics.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 20px", background: "#fff", borderRadius: 16, border: "1.5px dashed #e5e7eb" }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>🗂️</div>
          <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 600, color: "#1e293b" }}>No topics yet</h3>
          <p style={{ color: "#94a3b8", marginBottom: 20, fontSize: 13 }}>Create your first topic to get started</p>
          <button onClick={() => setShowCreate(true)} style={{
            background: "#0f172a", color: "white", border: "none", borderRadius: 10,
            padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            <FiPlus size={14} /> Create First Topic
          </button>
        </div>
      )}

      {/* ── No results ───────────────────────────────────────────────────────── */}
      {!loading && topics.length > 0 && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8", fontSize: 13, background: "#fff", borderRadius: 14, border: "1px solid #f0f0f0" }}>
          No topics match «{search}»
        </div>
      )}

      {/* ── Grid — full width ────────────────────────────────────────────────── */}
      {!loading && paginated.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 14,
        }}>
          <AnimatePresence>
            {paginated.map((topic, i) => {
              const plat = PLATFORMS.find(p => p.id === topic.platform);
              return (
                <motion.div
                  key={topic.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03, type: "spring", stiffness: 340 }}
                  whileHover={{ y: -3 }}
                  onClick={() => onSelectTopic(topic.id, topic.name)}
                  className="group"
                  style={{
                    background: "#fff", border: "1px solid #f0f0f0",
                    borderRadius: 14, padding: "18px 16px", cursor: "pointer",
                    transition: "box-shadow .15s, border-color .15s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px -6px rgba(0,0,0,0.1)"; (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.borderColor = "#f0f0f0"; }}
                >
                  {/* Top row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: plat ? plat.color + "12" : "#f1f5f9",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <FiGrid size={17} color={plat?.color ?? "#94a3b8"} />
                    </div>
                    <button
                      onClick={e => handleDelete(topic.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                      style={{ background: "none", border: "none", color: "#e2e8f0", padding: 4, borderRadius: 6, cursor: "pointer" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#e2e8f0")}
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>

                  {/* Name */}
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 5px", color: "#0f172a", lineHeight: 1.3 }}>
                    {topic.name}
                  </h3>

                  {/* Description */}
                  {topic.description && (
                    <p style={{
                      fontSize: 12, color: "#64748b", lineHeight: 1.5, margin: 0,
                      display: "-webkit-box", WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {topic.description}
                    </p>
                  )}

                  {/* Footer */}
                  <div style={{
                    marginTop: 14, paddingTop: 10, borderTop: "1px solid #f5f5f5",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>
                      <strong style={{ color: "#374151", fontWeight: 600 }}>{topic.postCount}</strong> posts
                    </span>
                    {plat ? (
                      <span style={{
                        fontSize: 10, padding: "2px 8px", borderRadius: 20,
                        background: plat.color + "12", color: plat.color, fontWeight: 600,
                      }}>
                        {plat.label}
                      </span>
                    ) : (
                      <span style={{ fontSize: 10, color: "#cbd5e1" }}>
                        {new Date(topic.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ── Pagination ───────────────────────────────────────────────────────── */}
      {filtered.length > PAGE_SIZE && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 6, marginTop: 24,
        }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{
              width: 32, height: 32, borderRadius: 8, border: "1px solid #f0f0f0",
              background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: page === 1 ? "#cbd5e1" : "#374151",
            }}
          >
            <FiChevronLeft size={15} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
            <button key={n} onClick={() => setPage(n)} style={{
              width: 32, height: 32, borderRadius: 8, cursor: "pointer",
              background: page === n ? "#6366f1" : "#fff",
              color: page === n ? "#fff" : "#374151",
              fontWeight: page === n ? 700 : 400, fontSize: 13,
              border: page === n ? "none" : "1px solid #f0f0f0",
            }}>
              {n}
            </button>
          ))}

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{
              width: 32, height: 32, borderRadius: 8, border: "1px solid #f0f0f0",
              background: "#fff", cursor: page === totalPages ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: page === totalPages ? "#cbd5e1" : "#374151",
            }}
          >
            <FiChevronRight size={15} />
          </button>

          <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 4 }}>
            {filtered.length} topics · page {page}/{totalPages}
          </span>
        </div>
      )}
    </div>
  );
}