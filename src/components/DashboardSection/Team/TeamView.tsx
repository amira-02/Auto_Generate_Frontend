import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus, FiTrash2, FiX } from "react-icons/fi";

const API = import.meta.env.VITE_API_URL ?? "https://localhost:7079";

type Member = { id: number; name: string | null; email: string; role: string; createdAt: string };

const ROLE_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  ChefVisuel: { bg: "#fef2f2", color: "#dc2626", label: "👑 Chef Visuel" },
  ChefRedac:  { bg: "#fef2f2", color: "#dc2626", label: "👑 Chef Rédaction" },
  Graphiste:  { bg: "#fef2f2", color: "#dc2626", label: "🎨 Graphiste" },
  Redacteur:  { bg: "#fef2f2", color: "#dc2626", label: "✍️ Rédacteur" },
};

function Avatar({ name, email }: { name: string | null; email: string }) {
  const letter = (name ?? email).charAt(0).toUpperCase();
  return (
    <div style={{ width: 40, height: 40, borderRadius: 12,
      background: "linear-gradient(135deg,#dc2626,#dc2626)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontSize: 16, fontWeight: 800, flexShrink: 0 }}>
      {letter}
    </div>
  );
}

function AddMemberModal({ token, onClose, onAdded }: {
  token: string | null; onClose: () => void; onAdded: () => void;
}) {
  const [form, setForm]     = useState({ name: "", email: "", password: "", role: "ChefVisuel" });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const handleSubmit = async () => {
    if (!form.email || !form.password) { setError("Email et mot de passe requis"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch(`${API}/api/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "Erreur"); return; }
      onAdded(); onClose();
    } catch { setError("Erreur réseau"); }
    finally { setSaving(false); }
  };

  const inp: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e5e7eb",
    fontSize: 13, outline: "none", boxSizing: "border-box", background: "#fafafa",
    fontFamily: "inherit", transition: "border .15s",
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
        backdropFilter: "blur(8px)", display: "flex", alignItems: "center",
        justifyContent: "center", zIndex: 1000, padding: 20 }}>
      <motion.div
        initial={{ scale: 0.94, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.94, y: 16, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        onClick={e => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 440,
          boxShadow: "0 32px 80px rgba(0,0,0,0.18)", overflow: "hidden" }}>

        <div style={{ padding: "20px 22px 16px", borderBottom: "1px solid #f0f0f0",
          display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Ajouter un membre</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Chef d'équipe, Graphiste ou Rédacteur</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8,
            background: "#f8f9fb", border: "1px solid #f0f0f0", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
            <FiX size={13} />
          </button>
        </div>

        <div style={{ padding: "20px 22px 22px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Role selector */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {([
              { r: "ChefVisuel", label: "👑 Chef Visuel" },
              { r: "ChefRedac",  label: "👑 Chef Rédac" },
              { r: "Graphiste",  label: "🎨 Graphiste" },
              { r: "Redacteur",  label: "✍️ Rédacteur" },
            ] as const).map(({ r, label }) => (
              <button key={r} onClick={() => setForm(f => ({ ...f, role: r }))}
                style={{ padding: "12px 8px", borderRadius: 12,
                  border: `2px solid ${form.role === r ? "#dc2626" : "#e5e7eb"}`,
                  background: form.role === r ? "#fef2f2" : "#fafafa", cursor: "pointer",
                  fontSize: 11, fontWeight: 700,
                  color: form.role === r ? "#dc2626" : "#94a3b8",
                  fontFamily: "inherit", transition: "all .15s" }}>
                {label}
              </button>
            ))}
          </div>

          {[
            { key: "name",     label: "Nom",          placeholder: "Prénom Nom",         required: false },
            { key: "email",    label: "Email",         placeholder: "membre@agence.com",  required: true  },
            { key: "password", label: "Mot de passe",  placeholder: "Temporaire…",        required: true, type: "password" },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#374151", display: "block",
                marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {f.label} {f.required && <span style={{ color: "#dc2626" }}>*</span>}
              </label>
              <input
                type={(f as any).type ?? "text"}
                value={(form as any)[f.key]}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                style={inp}
                onFocus={e => { e.target.style.borderColor = "#dc2626"; e.target.style.background = "#fff"; }}
                onBlur={e => { e.target.style.borderColor = "#e5e7eb"; e.target.style.background = "#fafafa"; }}
              />
            </div>
          ))}

          {error && (
            <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 8,
              padding: "9px 12px", fontSize: 12, color: "#dc2626" }}>⚠️ {error}</div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button onClick={onClose}
              style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1.5px solid #f0f0f0",
                background: "#f8f9fb", color: "#64748b", fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit" }}>
              Annuler
            </button>
            <button onClick={handleSubmit} disabled={saving}
              style={{ flex: 2, padding: "11px", borderRadius: 10, border: "none",
                background: saving ? "#e5e7eb" : "#dc2626", color: saving ? "#9ca3af" : "#fff",
                fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
                fontFamily: "inherit", boxShadow: saving ? "none" : "0 4px 14px #dc262640" }}>
              {saving ? "Création…" : "Créer le compte"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function TeamView({ token }: { token: string | null }) {
  const [members, setMembers]   = useState<Member[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showAdd, setShowAdd]   = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetch_ = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/team`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setMembers(await res.json());
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetch_(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce membre ?")) return;
    setDeleting(id);
    try {
      await fetch(`${API}/api/team/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      setMembers(m => m.filter(x => x.id !== id));
    } catch {}
    finally { setDeleting(null); }
  };

  const chefsVisuels = members.filter(m => m.role === "ChefVisuel");
  const chefsRedacs  = members.filter(m => m.role === "ChefRedac");
  const graphistes   = members.filter(m => m.role === "Graphiste");
  const redacteurs   = members.filter(m => m.role === "Redacteur");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Équipe</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Chefs d'équipe, Graphistes & Rédacteurs</div>
        </div>
        <button onClick={() => setShowAdd(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
            borderRadius: 10, border: "none", background: "#dc2626", color: "#fff",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 4px 14px #dc262640" }}>
          <FiPlus size={13} /> Ajouter un membre
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 70, borderRadius: 14, background: "#f8fafc",
              border: "1px solid #f0f0f0", animation: "pulse 1.5s ease infinite" }} />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 20px", background: "#f8fafc",
          borderRadius: 16, border: "1px dashed #e2e8f0" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
            Aucun membre d'équipe
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", maxWidth: 280, margin: "0 auto" }}>
            Ajoute des graphistes et rédacteurs pour leur assigner des tâches depuis les briefs.
          </div>
        </div>
      ) : (
        <>
          {[
            { title: "👑 Chefs Visuel",    list: chefsVisuels },
            { title: "👑 Chefs Rédaction", list: chefsRedacs  },
            { title: "🎨 Graphistes",      list: graphistes   },
            { title: "✍️ Rédacteurs",     list: redacteurs   },
          ].map(group => group.list.length > 0 && (
            <div key={group.title}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8",
                textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                {group.title} ({group.list.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {group.list.map((m: Member) => (
                  <motion.div key={m.id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    style={{ display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 16px", borderRadius: 14,
                      border: "1.5px solid #e5e7eb", background: "#fff",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                    <Avatar name={m.name} email={m.email} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                        {m.name ?? m.email.split("@")[0]}
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{m.email}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px",
                      borderRadius: 20, background: "#fef2f2", color: "#dc2626" }}>
                      {ROLE_STYLE[m.role]?.label ?? m.role}
                    </span>
                    <button onClick={() => handleDelete(m.id)} disabled={deleting === m.id}
                      style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #fee2e2",
                        background: "#fff", cursor: "pointer", display: "flex",
                        alignItems: "center", justifyContent: "center", color: "#dc2626",
                        opacity: deleting === m.id ? 0.4 : 1 }}>
                      <FiTrash2 size={13} />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      <AnimatePresence>
        {showAdd && (
          <AddMemberModal token={token} onClose={() => setShowAdd(false)} onAdded={fetch_} />
        )}
      </AnimatePresence>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </div>
  );
}
