// src/components/DashboardSection/Accounts/ConnectedAccountsView.tsx
import { useState, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiCheckCircle, FiAlertCircle, FiRefreshCw, FiX, FiExternalLink, FiCopy } from "react-icons/fi";
import { AuthContext } from "../../../hooks/AuthContext";

const API_BASE = "https://localhost:7079";

// ─── Types ────────────────────────────────────────────────────────────────────

type IgProfile = {
  followers: number;
  mediaCount: number;
  name: string;
  profilePicture: string;
};

// ─── Platforms config ─────────────────────────────────────────────────────────

const PLATFORMS = [
  {
    id: "instagram", label: "Instagram", color: "#e1306c",
    gradient: "linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
    icon: "📸", description: "Publish photos, reels and stories",
    docsUrl: "https://developers.facebook.com/docs/instagram-api",
  },
  {
    id: "linkedin", label: "LinkedIn", color: "#0077b5",
    gradient: "linear-gradient(135deg, #0077b5, #00a0dc)",
    icon: "💼", description: "Share professional content",
    docsUrl: "https://www.linkedin.com/developers/",
  },
  {
    id: "facebook", label: "Facebook", color: "#1877f2",
    gradient: "linear-gradient(135deg, #1877f2, #42a5f5)",
    icon: "📘", description: "Post to your page and groups",
    docsUrl: "https://developers.facebook.com/",
  },
  {
    id: "tiktok", label: "TikTok", color: "#ff0050",
    gradient: "linear-gradient(135deg, #010101, #ff0050)",
    icon: "🎵", description: "Publish short-form videos",
    docsUrl: "https://developers.tiktok.com/",
  },
  {
    id: "twitter", label: "Twitter / X", color: "#1da1f2",
    gradient: "linear-gradient(135deg, #1da1f2, #0d8bd9)",
    icon: "𝕏", description: "Tweet and engage your audience",
    docsUrl: "https://developer.twitter.com/",
  },
  {
    id: "threads", label: "Threads", color: "#000",
    gradient: "linear-gradient(135deg, #333, #000)",
    icon: "🧵", description: "Share text updates",
    docsUrl: "https://developers.facebook.com/docs/threads",
  },
];

// ─── Token modal ──────────────────────────────────────────────────────────────

function TokenModal({
  platform, onClose, onSave,
}: {
  platform: typeof PLATFORMS[0];
  onClose: () => void;
  onSave: (token: string, accountId: string) => void;
}) {
  const [accessToken, setAccessToken] = useState("");
  const [accountId,   setAccountId]   = useState("");
  const [saving,      setSaving]       = useState(false);

  const handleSave = async () => {
    if (!accessToken.trim()) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 400));
    onSave(accessToken.trim(), accountId.trim());
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(6px)", display: "flex", alignItems: "center",
        justifyContent: "center", zIndex: 1000, padding: 20,
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 20, padding: "28px 28px 24px",
          width: "100%", maxWidth: 480,
          boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: platform.gradient,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
            }}>
              {platform.icon}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Connect {platform.label}</div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>Enter your access token</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "#f8f9fb", border: "1px solid #f0f0f0", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}>
            <FiX size={14} />
          </button>
        </div>

        {/* Instructions */}
        <div style={{ background: "#f8f9fb", borderRadius: 12, padding: "12px 14px", marginBottom: 18, fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>
          <div style={{ fontWeight: 600, color: "#374151", marginBottom: 4 }}>How to get your token:</div>
          {platform.id === "instagram" ? (
            <ol style={{ margin: 0, paddingLeft: 16 }}>
              <li>Go to <a href="https://developers.facebook.com/tools/explorer" target="_blank" rel="noreferrer" style={{ color: platform.color }}>Graph API Explorer</a></li>
              <li>Select your app → Generate Access Token</li>
              <li>Add permissions: <code style={{ background: "#f0f0f0", padding: "1px 4px", borderRadius: 4 }}>instagram_basic</code>, <code style={{ background: "#f0f0f0", padding: "1px 4px", borderRadius: 4 }}>instagram_manage_insights</code></li>
              <li>Copy the token below</li>
            </ol>
          ) : (
            <div>Visit <a href={platform.docsUrl} target="_blank" rel="noreferrer" style={{ color: platform.color }}>developer docs</a> to generate your access token.</div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Access Token */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
              Access Token *
            </label>
            <textarea
              value={accessToken}
              onChange={e => setAccessToken(e.target.value)}
              placeholder="EAAxxxxxxxxxxxxxxxxxxxxxxx..."
              rows={3}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10,
                border: "1.5px solid #e5e7eb", fontSize: 12, outline: "none",
                resize: "none", fontFamily: "monospace", boxSizing: "border-box",
                transition: "border .15s",
              }}
              onFocus={e => e.target.style.borderColor = platform.color}
              onBlur={e => e.target.style.borderColor = "#e5e7eb"}
            />
          </div>

          {/* Account ID (Instagram only) */}
          {platform.id === "instagram" && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                Instagram Account ID
              </label>
              <input
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                placeholder="17841443629498680"
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 10,
                  border: "1.5px solid #e5e7eb", fontSize: 13, outline: "none",
                  fontFamily: "monospace", boxSizing: "border-box", transition: "border .15s",
                }}
                onFocus={e => e.target.style.borderColor = platform.color}
                onBlur={e => e.target.style.borderColor = "#e5e7eb"}
              />
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                Your IG Business account ID (e.g. 17841443629498680)
              </div>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={!accessToken.trim() || saving}
            style={{
              padding: "12px", borderRadius: 10, border: "none",
              background: !accessToken.trim() || saving ? "#e5e7eb" : platform.gradient,
              color: !accessToken.trim() || saving ? "#9ca3af" : "#fff",
              fontSize: 14, fontWeight: 600,
              cursor: !accessToken.trim() || saving ? "not-allowed" : "pointer",
              boxShadow: !accessToken.trim() || saving ? "none" : `0 4px 12px ${platform.color}30`,
            }}
          >
            {saving ? "Connecting…" : `Connect ${platform.label}`}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ConnectedAccountsView() {
  const { token } = useContext(AuthContext);

  // Store connections in local state (keyed by platform id)
  // In production this would come from your backend /api/accounts
  const [connections, setConnections] = useState<Record<string, {
    id?: number; token: string; accountId?: string; connectedAt: string; profile?: IgProfile;
  }>>({});

  const [modalPlatform, setModalPlatform] = useState<typeof PLATFORMS[0] | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<string | null>(null);

  // ✅ Fetch accounts from backend on mount
  useEffect(() => {
    fetchAccounts();
  }, [token]);

  // Load IG profile if Instagram is connected
  useEffect(() => {
    const ig = connections["instagram"];
    if (ig && !ig.profile) {
      loadIgProfile();
    }
  }, [connections]);

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data: { id: number; platform: string; username?: string; profilePicture?: string; followersCount?: number; connectedAt: string }[] = await res.json();
      const map: Record<string, any> = {};
      data.forEach(a => {
        map[a.platform] = {
          id: a.id,
          token: "",
          connectedAt: a.connectedAt,
          profile: a.platform === "instagram" ? {
            followers: a.followersCount ?? 0,
            mediaCount: 0,
            name: a.username ?? "",
            profilePicture: a.profilePicture ?? "",
          } : undefined,
        };
      });
      setConnections(map);
    } catch {}
  };

  const loadIgProfile = async () => {
    setLoadingProfile("instagram");
    try {
      const res = await fetch(`${API_BASE}/api/social/instagram/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConnections(prev => ({
          ...prev,
          instagram: {
            ...prev.instagram,
            profile: {
              followers:      data.followers      ?? 0,
              mediaCount:     data.mediaCount     ?? 0,
              name:           data.name           ?? "",
              profilePicture: data.profilePicture ?? "",
            },
          },
        }));
      }
    } catch {}
    finally { setLoadingProfile(null); }
  };

  const handleSave = async (platformId: string, accessToken: string, accountId: string) => {
    try {
      // ✅ Save to backend
      const res = await fetch(`${API_BASE}/api/accounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          platform:    platformId,
          accessToken: accessToken,
          accountId:   accountId || null,
          username:    platformId === "instagram" ? "autoogenerate" : null,
        }),
      });

      if (!res.ok) throw new Error("Failed to save account");

      // ✅ Refresh accounts list from backend
      await fetchAccounts();
      setModalPlatform(null);

      // If Instagram, reload profile stats
      if (platformId === "instagram") {
        setTimeout(loadIgProfile, 600);
      }
    } catch (err: any) {
      alert("Error connecting account: " + err.message);
    }
  };

  const handleDisconnect = async (platformId: string) => {
    if (!confirm(`Disconnect ${platformId}?`)) return;
    const conn = connections[platformId];
    if (!conn?.id) {
      // Not in DB yet, just remove from state
      setConnections(prev => { const next = { ...prev }; delete next[platformId]; return next; });
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/accounts/${conn.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to disconnect");
      setConnections(prev => { const next = { ...prev }; delete next[platformId]; return next; });
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  const connected   = PLATFORMS.filter(p => connections[p.id]);
  const unconnected = PLATFORMS.filter(p => !connections[p.id]);

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", maxWidth: 900, margin: "0 auto" }}>

      {/* Top bar */}
      <div style={{
        background: "#fff", borderRadius: 14, border: "1px solid #f0f0f0",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)", padding: "12px 18px",
        display: "flex", alignItems: "center", gap: 12, marginBottom: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "#f0f0fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🔗</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Connected Accounts</span>
        </div>
        <div style={{ width: 1, height: 22, background: "#f0f0f0" }} />
        <div style={{ fontSize: 12, color: "#94a3b8" }}>
          {connected.length} connected · {unconnected.length} available
        </div>
      </div>

      {/* Connected accounts */}
      {connected.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
            Connected
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {connected.map(plat => {
              const conn    = connections[plat.id];
              const profile = conn.profile as IgProfile | undefined;
              const isIg    = plat.id === "instagram";

              return (
                <motion.div
                  key={plat.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: "#fff", borderRadius: 16,
                    border: "1px solid #f0f0f0",
                    padding: "16px 20px",
                    display: "flex", alignItems: "center", gap: 14,
                  }}
                >
                  {/* Avatar or icon */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    {isIg && profile?.profilePicture ? (
                      <img src={profile.profilePicture} alt="" style={{ width: 44, height: 44, borderRadius: 12, objectFit: "cover" }} />
                    ) : (
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: plat.gradient,
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                      }}>
                        {plat.icon}
                      </div>
                    )}
                    {/* Connected dot */}
                    <div style={{
                      position: "absolute", bottom: -2, right: -2,
                      width: 14, height: 14, borderRadius: "50%",
                      background: "#10b981", border: "2px solid #fff",
                    }} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{plat.label}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: "#f0fdf4", color: "#16a34a" }}>
                        ✓ Connected
                      </span>
                    </div>
                    {isIg && profile ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
                        <span style={{ fontSize: 12, color: "#94a3b8" }}>@{profile.name}</span>
                        <span style={{ fontSize: 11, color: "#374151", fontWeight: 600 }}>{profile.followers.toLocaleString()} followers</span>
                        <span style={{ fontSize: 11, color: "#374151", fontWeight: 600 }}>{profile.mediaCount} posts</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>
                        Connected {new Date(conn.connectedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {isIg && (
                      <button
                        onClick={loadIgProfile}
                        disabled={loadingProfile === "instagram"}
                        title="Refresh profile"
                        style={{
                          width: 32, height: 32, borderRadius: 8, border: "1px solid #f0f0f0",
                          background: "#fff", cursor: "pointer", display: "flex",
                          alignItems: "center", justifyContent: "center", color: "#64748b",
                        }}
                      >
                        <FiRefreshCw size={13} style={{ animation: loadingProfile === "instagram" ? "spin 1s linear infinite" : "none" }} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDisconnect(plat.id)}
                      title="Disconnect"
                      style={{
                        width: 32, height: 32, borderRadius: 8, border: "1px solid #fee2e2",
                        background: "#fff", cursor: "pointer", display: "flex",
                        alignItems: "center", justifyContent: "center", color: "#ef4444",
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#fef2f2"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#fff"}
                    >
                      <FiX size={13} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available to connect */}
      {unconnected.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
            Available
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {unconnected.map((plat, i) => (
              <motion.div
                key={plat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                style={{
                  background: "#fff", borderRadius: 16,
                  border: "1px solid #f0f0f0", padding: "16px 18px",
                  display: "flex", alignItems: "center", gap: 12,
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: plat.gradient,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                }}>
                  {plat.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{plat.label}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {plat.description}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => setModalPlatform(plat)}
                  style={{
                    padding: "7px 14px", borderRadius: 9, border: "none",
                    background: plat.gradient, color: "#fff",
                    fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0,
                    boxShadow: `0 3px 10px ${plat.color}30`,
                  }}
                >
                  Connect
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* All connected message */}
      {unconnected.length === 0 && connected.length === PLATFORMS.length && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ textAlign: "center", padding: "40px 20px", background: "#f0fdf4", borderRadius: 16, border: "1px solid #bbf7d0" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🎉</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#16a34a" }}>All accounts connected!</div>
          <div style={{ fontSize: 13, color: "#4ade80", marginTop: 4 }}>Your content will be published across all platforms.</div>
        </motion.div>
      )}

      {/* Token modal */}
      <AnimatePresence>
        {modalPlatform && (
          <TokenModal
            platform={modalPlatform}
            onClose={() => setModalPlatform(null)}
            onSave={(t, id) => handleSave(modalPlatform.id, t, id)}
          />
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}