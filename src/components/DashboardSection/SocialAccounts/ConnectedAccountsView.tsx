// src/components/DashboardSection/Accounts/ConnectedAccountsView.tsx
import React, { useState, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiRefreshCw, FiX, FiCheck, FiPlus, FiEye, FiEyeOff, FiEdit2 } from "react-icons/fi";
import { AuthContext } from "../../../hooks/AuthContext";
import { toast } from "react-toastify";

const API_BASE: string = import.meta.env.VITE_API_URL ?? "https://localhost:7079";

// ─── Real platform SVG logos ──────────────────────────────────────────────────

const LOGOS: Record<string, React.ReactElement> = {
  instagram: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
      <defs>
        <radialGradient id="ig1" cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497"/>
          <stop offset="5%" stopColor="#fdf497"/>
          <stop offset="45%" stopColor="#fd5949"/>
          <stop offset="60%" stopColor="#d6249f"/>
          <stop offset="90%" stopColor="#285AEB"/>
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5.5" fill="url(#ig1)"/>
      <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="2" fill="none"/>
      <circle cx="17.5" cy="6.5" r="1.2" fill="white"/>
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="#0077b5">
      <rect width="24" height="24" rx="4" fill="#0077b5"/>
      <path d="M7 9h2.5v8H7zm1.25-3a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5zM11 9h2.4v1.1h.03C13.77 9.45 14.72 9 15.9 9c2.4 0 2.85 1.58 2.85 3.63V17h-2.5v-3.87c0-.92-.02-2.1-1.28-2.1-1.28 0-1.48 1-1.48 2.03V17H11V9z" fill="white"/>
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" width="22" height="22">
      <rect width="24" height="24" rx="4" fill="#1877f2"/>
      <path d="M16.5 4H14c-1.66 0-3 1.34-3 3v2H9v3h2v8h3v-8h2.5l.5-3H14V7c0-.55.45-1 1-1h1.5V4z" fill="white"/>
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" width="22" height="22">
      <rect width="24" height="24" rx="4" fill="#010101"/>
      <path d="M17 5.5c-.5 0-1-.1-1.5-.3v6.3a5 5 0 11-3-4.6v2.3a2.8 2.8 0 100 5.6V4H17V5.5z" fill="white"/>
      <path d="M17 5.5c.3 1.2 1.2 2.1 2.3 2.3v-2c-.8-.2-1.5-.6-2-1.2l-.3-.6V5.5z" fill="#69c9d0"/>
      <path d="M12.5 7.5v6.3a2.8 2.8 0 110-5.6v-2.3a5 5 0 100 9.9V7.5h-2.3V5.5H14v8.8" fill="#ee1d52"/>
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" width="22" height="22">
      <rect width="24" height="24" rx="4" fill="#000"/>
      <path d="M17.5 4h2.5L14.5 10.7 21 20h-5l-3.8-5-4.3 5H5.5l5.9-6.9L4 4h5.1l3.4 4.5L17.5 4zm-1 14.4h1.4L7.7 5.4H6.2l10.3 13z" fill="white"/>
    </svg>
  ),
  threads: (
    <svg viewBox="0 0 24 24" width="22" height="22">
      <rect width="24" height="24" rx="4" fill="#101010"/>
      <path d="M12 4c-2.3 0-4.2.8-5.5 2.2C5.2 7.6 4.5 9.6 4.5 12s.7 4.4 2 5.8C7.8 19.2 9.7 20 12 20c2 0 3.7-.6 5-1.8 1.1-1 1.8-2.4 2-4h-1.5c-.3 1.2-.8 2.2-1.6 2.9-1 .9-2.3 1.4-3.9 1.4-1.8 0-3.2-.6-4.3-1.7-1-1.1-1.6-2.7-1.6-4.8 0-2 .6-3.7 1.6-4.8 1-1.1 2.5-1.7 4.3-1.7 1.4 0 2.5.4 3.4 1.1.6.5 1 1.1 1.3 1.8h1.5c-.3-1.1-.9-2-1.7-2.7C15.3 4.7 13.8 4 12 4zm.5 5c-.8 0-1.5.2-2 .6-.6.4-1 1-1 1.8 0 .7.3 1.2.8 1.6.4.3 1 .5 1.7.5.5 0 1-.1 1.4-.4.5-.3.8-.7 1-1.3.1-.4.2-.9.1-1.4 0-.5-.2-.9-.5-1.1-.4-.2-.9-.3-1.5-.3z" fill="white"/>
    </svg>
  ),
};

// ─── Platform config ──────────────────────────────────────────────────────────

type PlatformField = { key: string; label: string; placeholder: string; type: string };

type Platform = {
  id: string;
  platformId: number;  // FK to Platforms table
  label: string;
  color: string;
  pastel: string;
  pastelBorder: string;
  gradient: string;
  description: string;
  fields: PlatformField[];
  docsUrl: string;
  docsLabel: string;
  oauthUrl?: string;
};

const PLATFORMS: Platform[] = [
  {
    id: "instagram", platformId: 1, label: "Instagram", color: "#e1306c",
    pastel: "#fff0f5", pastelBorder: "#ffd6e7",
    gradient: "linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
    description: "Photos, Reels & Stories",
    fields: [
      { key: "accessToken", label: "Access Token", placeholder: "EAAxxxxxxx...", type: "password" },
      { key: "accountId",   label: "Account ID",   placeholder: "17841443629498680", type: "text" },
      { key: "username",    label: "Username",      placeholder: "autoogenerate", type: "text" },
    ],
    docsUrl: "https://developers.facebook.com/tools/explorer",
    docsLabel: "Graph API Explorer",
  },
  {
    id: "linkedin", platformId: 3, label: "LinkedIn", color: "#0077b5",
    pastel: "#f0f7ff", pastelBorder: "#bfdfff",
    gradient: "linear-gradient(135deg, #0077b5, #00a0dc)",
    description: "Professional content & network",
    fields: [
      { key: "accessToken", label: "Access Token", placeholder: "AQxxxxxxx...", type: "password" },
      { key: "username",    label: "Profile Name", placeholder: "John Doe", type: "text" },
    ],
    docsUrl: "https://www.linkedin.com/developers/apps",
    docsLabel: "LinkedIn Developer Portal",
  },
  {
    id: "facebook", platformId: 2, label: "Facebook", color: "#1877f2",
    pastel: "#fef2f2", pastelBorder: "#c3d4ff",
    gradient: "linear-gradient(135deg, #1877f2, #42a5f5)",
    description: "Pages, groups & ads",
    fields: [
      { key: "accessToken", label: "Page Access Token", placeholder: "EAAxxxxxxx...", type: "password" },
      { key: "accountId",   label: "Page ID",           placeholder: "123456789", type: "text" },
    ],
    docsUrl: "https://developers.facebook.com/tools/explorer",
    docsLabel: "Graph API Explorer",
  },
  {
    id: "tiktok", platformId: 4, label: "TikTok", color: "#ff0050",
    pastel: "#fff0f2", pastelBorder: "#ffc0cc",
    gradient: "linear-gradient(135deg, #010101, #ff0050)",
    description: "Short-form video content",
    oauthUrl: `${API_BASE}/api/social/tiktok/auth`,
    fields: [],
    docsUrl: "https://developers.tiktok.com/",
    docsLabel: "TikTok Developer Portal",
  },
  {
    id: "twitter", platformId: 5, label: "Twitter / X", color: "#000",
    pastel: "#f5f5f5", pastelBorder: "#d0d0d0",
    gradient: "linear-gradient(135deg, #333, #000)",
    description: "Tweets, threads & spaces",
    fields: [
      { key: "accessToken",  label: "Access Token",        placeholder: "xxxxxxx-xxxxxxx", type: "password" },
      { key: "refreshToken", label: "Access Token Secret", placeholder: "xxxxxxx", type: "password" },
      { key: "username",     label: "Username",            placeholder: "@username", type: "text" },
    ],
    docsUrl: "https://developer.twitter.com/en/portal/dashboard",
    docsLabel: "Twitter Developer Portal",
  },
  {
    id: "threads", platformId: 6, label: "Threads", color: "#101010",
    pastel: "#f5f5f5", pastelBorder: "#d0d0d0",
    gradient: "linear-gradient(135deg, #444, #101010)",
    description: "Text updates & conversations",
    fields: [
      { key: "accessToken", label: "Access Token", placeholder: "EAAxxxxxxx...", type: "password" },
      { key: "username",    label: "Username",     placeholder: "@username", type: "text" },
    ],
    docsUrl: "https://developers.facebook.com/docs/threads",
    docsLabel: "Meta for Developers",
  },
];

type Account = {
  id: number;
  platformId: number;
  platformName: string;
  username?: string;
  profilePicture?: string;
  followersCount?: number;
  isConnected: boolean;
  connectedAt: string;
  accountId?: string;
  hasToken: boolean;
};

// ─── Connect / Update Modal ───────────────────────────────────────────────────

function ConnectModal({
  platform, onClose, onSave, saving, existingAccount,
}: {
  platform: Platform;
  onClose: () => void;
  onSave: (data: Record<string, string>) => void;
  saving: boolean;
  existingAccount?: Account;
}) {
  const [form, setForm]         = useState<Record<string, string>>({
    username:  existingAccount?.username  ?? "",
    accountId: existingAccount?.accountId ?? "",
  });
  const [showPass, setShowPass] = useState<Record<string, boolean>>({});
  const isUpdate = !!existingAccount;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(15,23,42,0.6)",
        backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: 20,
      }}
    >
      <motion.div
        initial={{ scale: 0.93, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.93, y: 20, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 24,
          width: "100%", maxWidth: 480,
          overflow: "hidden",
          boxShadow: "0 40px 100px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.06)",
        }}
      >
        {/* Header */}
        <div style={{
          background: platform.pastel,
          borderBottom: `1px solid ${platform.pastelBorder}`,
          padding: "22px 24px 18px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16, background: "#fff",
              boxShadow: `0 4px 16px ${platform.color}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {LOGOS[platform.id]}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>
                {isUpdate ? `Update ${platform.label}` : `Connect ${platform.label}`}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{platform.description}</div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 34, height: 34, borderRadius: 10,
            background: "rgba(0,0,0,0.06)", border: "none",
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", color: "#64748b",
          }}>
            <FiX size={16} />
          </button>
        </div>

        <div style={{ padding: "20px 24px 24px" }}>
          <a href={platform.docsUrl} target="_blank" rel="noreferrer" style={{
            display: "flex", alignItems: "center", gap: 8,
            background: platform.pastel, borderRadius: 10, padding: "9px 14px",
            fontSize: 12, color: platform.color, fontWeight: 600,
            textDecoration: "none", marginBottom: 20,
            border: `1px solid ${platform.pastelBorder}`,
          }}>
            <span>🔗</span> {platform.docsLabel} →
          </a>

          {isUpdate && existingAccount?.username && (
            <div style={{
              background: "#f8f9fb", borderRadius: 10, padding: "10px 14px",
              marginBottom: 16, display: "flex", alignItems: "center", gap: 10,
              border: "1px solid #f0f0f0",
            }}>
              {existingAccount.profilePicture ? (
                <img src={existingAccount.profilePicture} alt="" style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: platform.pastel, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {LOGOS[platform.id]}
                </div>
              )}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>@{existingAccount.username.replace("@", "")}</div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>Currently connected · updating token</div>
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {platform.fields.map(field => (
              <div key={field.key}>
                <label style={{
                  fontSize: 11, fontWeight: 700, color: "#374151",
                  display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em",
                }}>
                  {field.label}
                  {field.key === "accessToken" && <span style={{ color: "#ef4444" }}> *</span>}
                  {isUpdate && field.key === "accessToken" && (
                    <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 400, textTransform: "none", letterSpacing: 0, marginLeft: 6 }}>
                      leave blank to keep current
                    </span>
                  )}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={field.type === "password" && !showPass[field.key] ? "password" : "text"}
                    value={form[field.key] ?? ""}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    placeholder={isUpdate && field.key === "accessToken" ? "••••••• (unchanged)" : field.placeholder}
                    style={{
                      width: "100%",
                      padding: field.type === "password" ? "11px 42px 11px 14px" : "11px 14px",
                      borderRadius: 10, border: "1.5px solid #e5e7eb",
                      fontSize: 13, outline: "none",
                      fontFamily: field.type === "password" ? "monospace" : "inherit",
                      boxSizing: "border-box", transition: "border .15s, box-shadow .15s",
                      background: "#fafafa",
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = platform.color;
                      e.target.style.boxShadow = `0 0 0 3px ${platform.color}15`;
                      e.target.style.background = "#fff";
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = "#e5e7eb";
                      e.target.style.boxShadow = "none";
                      e.target.style.background = "#fafafa";
                    }}
                  />
                  {field.type === "password" && (
                    <button type="button"
                      onClick={() => setShowPass(p => ({ ...p, [field.key]: !p[field.key] }))}
                      style={{
                        position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                        background: "none", border: "none", cursor: "pointer", color: "#94a3b8",
                        display: "flex", alignItems: "center",
                      }}>
                      {showPass[field.key] ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              onClick={() => onSave(form)}
              disabled={(!isUpdate && !form.accessToken?.trim()) || saving}
              style={{
                padding: "13px", borderRadius: 11, border: "none", marginTop: 6,
                background: (!isUpdate && !form.accessToken?.trim()) || saving ? "#e5e7eb" : platform.gradient,
                color: (!isUpdate && !form.accessToken?.trim()) || saving ? "#9ca3af" : "#fff",
                fontSize: 14, fontWeight: 700,
                cursor: (!isUpdate && !form.accessToken?.trim()) || saving ? "not-allowed" : "pointer",
                boxShadow: (!isUpdate && !form.accessToken?.trim()) || saving ? "none" : `0 6px 20px ${platform.color}40`,
                transition: "all .2s", letterSpacing: "-0.2px",
              }}>
              {saving ? "Saving…" : isUpdate ? `✓ Update ${platform.label}` : `✓ Connect ${platform.label}`}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ConnectedAccountsView({ clientId }: { clientId: number }) {
  const { token } = useContext(AuthContext);

  const [accounts,       setAccounts]       = useState<Account[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [modalPlatform,  setModalPlatform]  = useState<Platform | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | undefined>(undefined);
  const [saving,         setSaving]         = useState(false);

  // ── Handle OAuth callback (e.g. ?connected=tiktok) ──────────────────────
  useEffect(() => {
    const params    = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    if (connected) {
      toast.success(`${connected.charAt(0).toUpperCase() + connected.slice(1)} connected successfully! ✅`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Clear stale data immediately when client switches
  useEffect(() => { setAccounts([]); }, [clientId]);
  useEffect(() => { if (clientId > 0) fetchAccounts(); }, [token, clientId]);

  const fetchAccounts = async () => {
    if (!token || clientId === 0) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/accounts?clientId=${clientId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setAccounts(await res.json());
    } catch {}
    finally { setLoading(false); }
  };

  const handleConnect = (plat: Platform) => {
    // OAuth platforms → redirect with token + clientId
    if (plat.oauthUrl) {
      window.location.href = `${plat.oauthUrl}?token=${encodeURIComponent(token ?? "")}&clientId=${clientId}`;
      return;
    }
    setEditingAccount(undefined);
    setModalPlatform(plat);
  };

  const handleUpdate = (plat: Platform, account: Account) => {
    // OAuth platforms → re-authenticate via OAuth
    if (plat.oauthUrl) {
      window.location.href = plat.oauthUrl;
      return;
    }
    setEditingAccount(account);
    setModalPlatform(plat);
  };

  const handleSave = async (data: Record<string, string>) => {
    if (!modalPlatform || clientId === 0) return;
    setSaving(true);
    try {
      const body: Record<string, any> = {
        id:           editingAccount?.id ?? 0,
        clientId:     clientId,
        platformId:   modalPlatform.platformId,
        accountId:    data.accountId    || editingAccount?.accountId || null,
        username:     data.username     || editingAccount?.username  || null,
        refreshToken: data.refreshToken ?? null,
      };
      if (data.accessToken?.trim()) body.accessToken = data.accessToken.trim();

      const res = await fetch(`${API_BASE}/api/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());

      await fetchAccounts();
      setModalPlatform(null);
      setEditingAccount(undefined);
      toast.success(`${modalPlatform.label} ${editingAccount ? "updated" : "connected"} ✅`);
    } catch (err: any) {
      toast.error("Failed: " + err.message);
    } finally { setSaving(false); }
  };

  const handleDisconnect = async (account: Account) => {
    if (!confirm(`Disconnect this account?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/accounts/${account.id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setAccounts(prev => prev.filter(a => a.id !== account.id));
      toast.success("Account disconnected");
    } catch { toast.error("Failed to disconnect"); }
  };

  const accountsByPlatform = Object.fromEntries(
    PLATFORMS.map(p => [p.id, accounts.filter(a => a.platformId === p.platformId)])
  );
  const connectedPlats = PLATFORMS.filter(p => accountsByPlatform[p.id].length > 0);
  const availablePlats = PLATFORMS.filter(p => accountsByPlatform[p.id].length === 0);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "40vh" }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#dc2626" }} />
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div style={{
        background: "#fff", borderRadius: 14, border: "1px solid #f0f0f0",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)", padding: "12px 18px",
        display: "flex", alignItems: "center", gap: 12, marginBottom: 28,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🔗</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Connected Accounts</span>
        </div>
        <div style={{ width: 1, height: 22, background: "#f0f0f0" }} />
        <div style={{ display: "flex", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#f0fdf4", color: "#16a34a" }}>
            {connectedPlats.length} connected
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#f8f9fb", color: "#94a3b8" }}>
            {availablePlats.length} available
          </span>
        </div>
        <div style={{ flex: 1 }} />
        <motion.button whileHover={{ rotate: 180 }} transition={{ duration: 0.4 }}
          onClick={fetchAccounts}
          style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #f0f0f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
          <FiRefreshCw size={13} />
        </motion.button>
      </div>

      {/* ── Connected accounts ────────────────────────────────────────────── */}
      {connectedPlats.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
            Connected
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {connectedPlats.map((plat, i) => {
              const platAccounts = accountsByPlatform[plat.id];
              return (
                <motion.div key={plat.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, type: "spring", stiffness: 340 }}
                  style={{ background: plat.pastel, borderRadius: 16, border: `1px solid ${plat.pastelBorder}`, overflow: "hidden" }}>

                  {/* Platform header */}
                  <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid ${plat.pastelBorder}` }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fff", flexShrink: 0,
                      boxShadow: `0 2px 8px ${plat.color}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {LOGOS[plat.id]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>{plat.label}</span>
                      <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 8 }}>
                        {platAccounts.length} account{platAccounts.length > 1 ? "s" : ""}
                      </span>
                      {plat.oauthUrl && (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 20, marginLeft: 6,
                          background: plat.pastel, color: plat.color, border: `1px solid ${plat.pastelBorder}` }}>OAuth</span>
                      )}
                    </div>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => handleConnect(plat)}
                      style={{ height: 30, padding: "0 12px", borderRadius: 8, border: `1.5px solid ${plat.pastelBorder}`,
                        background: "#fff", cursor: "pointer", fontSize: 11, color: plat.color, fontWeight: 700,
                        display: "flex", alignItems: "center", gap: 4 }}>
                      <FiPlus size={11} /> Add account
                    </motion.button>
                  </div>

                  {/* Account rows */}
                  {platAccounts.map((account, j) => (
                    <div key={account.id} style={{
                      padding: "12px 20px", display: "flex", alignItems: "center", gap: 12,
                      background: "rgba(255,255,255,0.55)",
                      borderBottom: j < platAccounts.length - 1 ? `1px solid ${plat.pastelBorder}` : "none",
                    }}>
                      {/* Profile pic */}
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        {account.profilePicture ? (
                          <img src={account.profilePicture} alt=""
                            style={{ width: 42, height: 42, borderRadius: 12, objectFit: "cover", border: `1.5px solid ${plat.pastelBorder}` }} />
                        ) : (
                          <div style={{ width: 42, height: 42, borderRadius: 12, background: plat.pastel,
                            border: `1.5px solid ${plat.pastelBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {LOGOS[plat.id]}
                          </div>
                        )}
                        <div style={{ position: "absolute", bottom: -2, right: -2, width: 14, height: 14,
                          borderRadius: "50%", background: "#10b981", border: "2px solid #fff",
                          display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <FiCheck size={7} color="#fff" strokeWidth={3} />
                        </div>
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                          {account.username ? `@${account.username.replace("@", "")}` : `Account #${account.id}`}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
                          {account.followersCount != null && account.followersCount > 0 && (
                            <span style={{ fontSize: 10, color: "#64748b" }}>{account.followersCount.toLocaleString()} followers ·</span>
                          )}
                          <div style={{ width: 5, height: 5, borderRadius: "50%", background: account.hasToken ? "#10b981" : "#f59e0b" }} />
                          <span style={{ fontSize: 10, color: account.hasToken ? "#059669" : "#d97706", fontWeight: 600 }}>
                            {account.hasToken ? "Token active" : "Token missing"}
                          </span>
                          <span style={{ fontSize: 10, color: "#94a3b8" }}>
                            · {new Date(account.connectedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => handleUpdate(plat, account)}
                          style={{ height: 30, padding: "0 12px", borderRadius: 8, background: "#fff",
                            border: `1.5px solid ${plat.pastelBorder}`, cursor: "pointer",
                            fontSize: 11, color: plat.color, fontWeight: 700,
                            display: "flex", alignItems: "center", gap: 4 }}>
                          {plat.oauthUrl ? "🔄" : <><FiEdit2 size={10} /> Update</>}
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => handleDisconnect(account)}
                          style={{ width: 30, height: 30, borderRadius: 8, border: "1.5px solid #fecaca",
                            background: "#fff", cursor: "pointer", display: "flex",
                            alignItems: "center", justifyContent: "center", color: "#ef4444" }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#fef2f2"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#fff"}>
                          <FiX size={12} />
                        </motion.button>
                      </div>
                    </div>
                  ))}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Available to connect ──────────────────────────────────────────── */}
      {availablePlats.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
            Available to connect
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
            {availablePlats.map((plat, i) => (
              <motion.div key={plat.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, type: "spring", stiffness: 320 }}
                whileHover={{ y: -2 }}
                style={{ background: "#fff", borderRadius: 14, border: "1px solid #f0f0f0",
                  padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                onClick={() => handleConnect(plat)}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = plat.pastelBorder; (e.currentTarget as HTMLElement).style.background = plat.pastel; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#f0f0f0"; (e.currentTarget as HTMLElement).style.background = "#fff"; }}>

                <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                  background: plat.pastel, border: `1px solid ${plat.pastelBorder}`,
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {LOGOS[plat.id]}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{plat.label}</span>
                    {plat.oauthUrl && (
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 6,
                        background: plat.pastel, color: plat.color, border: `1px solid ${plat.pastelBorder}` }}>OAuth</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{plat.description}</div>
                </div>

                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  style={{ width: 30, height: 30, borderRadius: 8,
                    background: plat.pastel, border: `1px solid ${plat.pastelBorder}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: plat.color, flexShrink: 0 }}>
                  <FiPlus size={14} strokeWidth={2.5} />
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* All connected */}
      {availablePlats.length === 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: "center", padding: "44px 40px",
            background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)",
            borderRadius: 20, border: "1px solid #bbf7d0", marginTop: 16 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#059669", letterSpacing: "-0.3px" }}>All platforms connected!</div>
          <div style={{ fontSize: 13, color: "#34d399", marginTop: 6 }}>Your content will be published everywhere automatically.</div>
        </motion.div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalPlatform && (
          <ConnectModal
            platform={modalPlatform}
            onClose={() => { setModalPlatform(null); setEditingAccount(undefined); }}
            onSave={handleSave}
            saving={saving}
            existingAccount={editingAccount}
          />
        )}
      </AnimatePresence>
    </div>
  );
}