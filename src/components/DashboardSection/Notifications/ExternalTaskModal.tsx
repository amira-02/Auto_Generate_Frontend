// src/components/DashboardSection/Notifications/ExternalTaskModal.tsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiPlus, FiCheck, FiSearch } from "react-icons/fi";

const API = "https://localhost:7079";

type Topic = { id: number; name: string };

type ExternalTask = {
  id:          number;
  taskId:      string;
  description: string;
  scheduledAt: string;
  status:      string;
};

type Props = {
  taskId:     number | null;
  token:      string | null;
  onClose:    () => void;
  onAssigned: (data: {
    postId:         number;
    topicId:        number;
    description:    string;
    scheduledAt:    string;
    externalTaskId: number;
  }) => void;
};

export default function ExternalTaskModal({ taskId, token, onClose, onAssigned }: Props) {
  const [task,          setTask]          = useState<ExternalTask | null>(null);
  const [topics,        setTopics]        = useState<Topic[]>([]);
  const [search,        setSearch]        = useState("");
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [newTopicName,  setNewTopicName]  = useState("");
  const [showNewTopic,  setShowNewTopic]  = useState(false);
  const [description,   setDescription]  = useState("");
  const [loading,       setLoading]       = useState(false);
  const [creating,      setCreating]      = useState(false);

  useEffect(() => {
    if (!taskId || !token) return;
    fetchTask();
    fetchTopics();
  }, [taskId, token]);

  const fetchTask = async () => {
    try {
      const res = await fetch(`${API}/api/external/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTask(data);
        setDescription(data.description ?? "");
      }
    } catch {}
  };

  const fetchTopics = async () => {
    try {
      const res = await fetch(`${API}/api/topics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setTopics(await res.json());
    } catch {}
  };

  const filteredTopics = topics.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateTopic = async () => {
    if (!newTopicName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${API}/api/topics`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newTopicName.trim() }),
      });
      if (res.ok) {
        const created = await res.json();
        setTopics(prev => [...prev, created]);
        setSelectedTopic(created.id);
        setNewTopicName("");
        setShowNewTopic(false);
        setSearch("");
      }
    } catch {}
    finally { setCreating(false); }
  };

  const handleAssign = async () => {
    if (!selectedTopic || !taskId || !task) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/external/tasks/${taskId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ topicId: selectedTopic, description }),
      });
      if (!res.ok) return;
      const data = await res.json();
      onAssigned({
        postId:         data.postId,
        topicId:        selectedTopic,
        description,
        scheduledAt:    task.scheduledAt,
        externalTaskId: taskId,
      });
      onClose();
    } catch {}
    finally { setLoading(false); }
  };

  if (!taskId) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
          backdropFilter: "blur(8px)", zIndex: 9998,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>

        <motion.div
          initial={{ scale: 0.94, y: 16, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.94, y: 16, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          onClick={e => e.stopPropagation()}
          style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 480,
            overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }}>

          {/* Header */}
          <div style={{ background: "#f8faff", borderBottom: "1px solid #f0f0f0",
            padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                🔗 External Post Request
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                {task && `Scheduled: ${new Date(task.scheduledAt).toLocaleString("fr-FR")}`}
              </div>
            </div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8,
              border: "1px solid #f0f0f0", background: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
              <FiX size={14} />
            </button>
          </div>

          <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Description éditable */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#374151",
                textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>
                Post Description
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder="Edit the post description..."
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10,
                  border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none",
                  fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                  lineHeight: 1.6, color: "#374151" }}
                onFocus={e => e.target.style.borderColor = "#6366f1"}
                onBlur={e  => e.target.style.borderColor = "#e2e8f0"}
              />
            </div>

            {/* Choix du topic avec search */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#374151",
                textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>
                Assign to Topic
              </label>

              {/* Search */}
              <div style={{ position: "relative", marginBottom: 8 }}>
                <FiSearch size={13} style={{ position: "absolute", left: 10, top: "50%",
                  transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search topics..."
                  style={{ width: "100%", padding: "9px 12px 9px 30px", borderRadius: 10,
                    border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none",
                    boxSizing: "border-box", color: "#374151" }}
                  onFocus={e => e.target.style.borderColor = "#6366f1"}
                  onBlur={e  => e.target.style.borderColor = "#e2e8f0"}
                />
              </div>

              {/* Liste topics filtrée */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6,
                maxHeight: 160, overflowY: "auto" }}>
                {filteredTopics.length === 0 && !showNewTopic ? (
                  <div style={{ textAlign: "center", padding: "16px", fontSize: 12, color: "#94a3b8" }}>
                    No topics found — create one below
                  </div>
                ) : filteredTopics.map(t => (
                  <div key={t.id}
                    onClick={() => setSelectedTopic(t.id)}
                    style={{ padding: "9px 14px", borderRadius: 10, cursor: "pointer",
                      border: `1.5px solid ${selectedTopic === t.id ? "#6366f1" : "#f0f0f0"}`,
                      background: selectedTopic === t.id ? "#f0f4ff" : "#fafafa",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      transition: "all .15s" }}>
                    <span style={{ fontSize: 13,
                      fontWeight: selectedTopic === t.id ? 600 : 400,
                      color: selectedTopic === t.id ? "#4f46e5" : "#374151" }}>
                      {t.name}
                    </span>
                    {selectedTopic === t.id && <FiCheck size={14} color="#4f46e5" />}
                  </div>
                ))}
              </div>

              {/* Créer un nouveau topic */}
              {!showNewTopic ? (
                <button onClick={() => setShowNewTopic(true)}
                  style={{ width: "100%", padding: "9px", borderRadius: 10, marginTop: 8,
                    border: "1.5px dashed #e2e8f0", background: "transparent",
                    cursor: "pointer", fontSize: 12, color: "#64748b",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <FiPlus size={13} /> Create new topic
                </button>
              ) : (
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <input
                    autoFocus
                    value={newTopicName}
                    onChange={e => setNewTopicName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCreateTopic()}
                    placeholder="Topic name..."
                    style={{ flex: 1, padding: "9px 12px", borderRadius: 10,
                      border: "1.5px solid #6366f1", fontSize: 13, outline: "none" }}
                  />
                  <button onClick={handleCreateTopic} disabled={creating}
                    style={{ padding: "9px 14px", borderRadius: 10, border: "none",
                      background: "#6366f1", color: "#fff", fontSize: 12,
                      fontWeight: 600, cursor: "pointer" }}>
                    {creating ? "..." : "Add"}
                  </button>
                  <button onClick={() => setShowNewTopic(false)}
                    style={{ padding: "9px", borderRadius: 10, border: "1px solid #f0f0f0",
                      background: "#fff", cursor: "pointer", color: "#94a3b8" }}>
                    <FiX size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* Info scheduledAt */}
            {task && (
              <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "10px 14px",
                border: "1px solid #bbf7d0", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14 }}>📅</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#16a34a" }}>Auto-scheduled</div>
                  <div style={{ fontSize: 12, color: "#374151" }}>
                    Will be published on {new Date(task.scheduledAt).toLocaleString("fr-FR")}
                  </div>
                </div>
              </div>
            )}

            {/* Bouton Confirm */}
            <button
              onClick={handleAssign}
              disabled={!selectedTopic || !description.trim() || loading}
              style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none",
                cursor: !selectedTopic || !description.trim() || loading ? "not-allowed" : "pointer",
                background: !selectedTopic || !description.trim()
                  ? "#f1f5f9"
                  : "linear-gradient(135deg,#6366f1,#8b5cf6)",
                color: !selectedTopic || !description.trim() ? "#94a3b8" : "#fff",
                fontSize: 14, fontWeight: 700,
                boxShadow: selectedTopic && description.trim()
                  ? "0 4px 14px rgba(99,102,241,0.3)" : "none" }}>
              {loading ? "Creating post..." : "✓ Confirm & Open Post Editor →"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}