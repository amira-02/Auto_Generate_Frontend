// Analytics/index.tsx
import { useState, useEffect, useContext, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../../../hooks/AuthContext";
import OverviewTab  from "./OverviewTab";
import InstagramTab from "./InstagramTab";
import FacebookTab  from "./FacebookTab";
import LinkedinTab  from "./LinkedinTab";
import TiktokTab    from "./TiktokTab";
import ContentTab   from "./ContentTab";
import { fmtNum }   from "./analyticsHelpers";
import type { Post, InstagramSummary, FacebookSummary, LinkedInSummary, TikTokSummary } from "./analyticsTypes";
import NotificationBell from "../Notifications/NotificationBell";

const API: string = import.meta.env.VITE_API_URL ?? "https://localhost:7079";

type ConnectedAccount = {
  id: number;
  platformId: number;
  username?: string;
  profilePicture?: string;
  followersCount?: number;
  isConnected: boolean;
};

// "overview" | "content" | account.id (number)
type View = "overview" | "content" | number;

const PLAT: Record<number, { display: string; color: string; badge: string; icon: string }> = {
  1: { display: "Instagram", color: "#e1306c", badge: "IG", icon: "📸" },
  2: { display: "Facebook",  color: "#1877f2", badge: "FB", icon: "📘" },
  3: { display: "LinkedIn",  color: "#0077b5", badge: "LI", icon: "💼" },
  4: { display: "TikTok",    color: "#ff0050", badge: "TT", icon: "🎵" },
};

const SUMMARY_URL: Record<number, string> = {
  1: `${API}/api/social/instagram/summary`,
  2: `${API}/api/social/facebook/summary`,
  3: `${API}/api/social/linkedin/summary`,
  4: `${API}/api/social/tiktok/summary`,
};

type Props = {
  onExternalTask?: (taskId: number) => void;
  onTrelloTask?:   (title: string, sheetUrl: string) => void;
  clientId: number;
};

export default function Analytics({ onExternalTask, onTrelloTask, clientId }: Props) {
  const { token } = useContext(AuthContext);

  // ── Global data (used by Overview + Content) ─────────────────────────────
  const [posts,       setPosts]       = useState<Post[]>([]);
  const [igData,      setIgData]      = useState<InstagramSummary | null>(null);
  const [fbData,      setFbData]      = useState<FacebookSummary  | null>(null);
  const [liData,      setLiData]      = useState<LinkedInSummary  | null>(null);
  const [ttData,      setTtData]      = useState<TikTokSummary    | null>(null);
  const [allAccounts, setAllAccounts] = useState<ConnectedAccount[]>([]);
  const [loading,     setLoading]     = useState(false);

  // ── Per-account view state ───────────────────────────────────────────────
  const [view,           setView]           = useState<View>("overview");
  const [dropdownOpen,   setDropdownOpen]   = useState(false);
  const [selAccData,     setSelAccData]     = useState<InstagramSummary | FacebookSummary | LinkedInSummary | TikTokSummary | null>(null);
  const [selAccLoading,  setSelAccLoading]  = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    setPosts([]); setIgData(null); setFbData(null); setLiData(null); setTtData(null);
    setAllAccounts([]); setView("overview"); setSelAccData(null);
    if (!token || clientId === 0) { setLoading(false); return; }
    setLoading(true);
    const ctrl = new AbortController();
    const q = `?clientId=${clientId}`;
    (async () => {
      try {
        const [postsRes, igRes, fbRes, liRes, ttRes, acctRes] = await Promise.all([
          fetch(`${API}/api/posts${q}`,                    { headers: { Authorization: `Bearer ${token}` }, signal: ctrl.signal }),
          fetch(`${API}/api/social/instagram/summary${q}`, { headers: { Authorization: `Bearer ${token}` }, signal: ctrl.signal }),
          fetch(`${API}/api/social/facebook/summary${q}`,  { headers: { Authorization: `Bearer ${token}` }, signal: ctrl.signal }),
          fetch(`${API}/api/social/linkedin/summary${q}`,  { headers: { Authorization: `Bearer ${token}` }, signal: ctrl.signal }),
          fetch(`${API}/api/social/tiktok/summary${q}`,    { headers: { Authorization: `Bearer ${token}` }, signal: ctrl.signal }),
          fetch(`${API}/api/accounts${q}`,                 { headers: { Authorization: `Bearer ${token}` }, signal: ctrl.signal }),
        ]);
        if (postsRes.ok) setPosts(await postsRes.json());
        if (igRes.ok)    setIgData(await igRes.json());
        if (fbRes.ok)    setFbData(await fbRes.json());
        if (liRes.ok)    setLiData(await liRes.json());
        if (ttRes.ok)    setTtData(await ttRes.json());
        if (acctRes.ok)  setAllAccounts(await acctRes.json());
      } catch {}
      finally { setLoading(false); }
    })();
    return () => ctrl.abort();
  }, [token, clientId]);

  // ── Fetch data for the selected account ──────────────────────────────────
  useEffect(() => {
    if (typeof view !== "number") { setSelAccData(null); return; }
    const acc = allAccounts.find(a => a.id === view);
    if (!acc || !token || clientId === 0) return;
    const url = SUMMARY_URL[acc.platformId];
    if (!url) return;
    setSelAccLoading(true);
    setSelAccData(null);
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(`${url}?clientId=${clientId}&accountId=${view}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: ctrl.signal,
        });
        if (res.ok) setSelAccData(await res.json());
      } catch {}
      finally { setSelAccLoading(false); }
    })();
    return () => ctrl.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, token, clientId]);

  // ── Close dropdown on outside click ──────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Derived ──────────────────────────────────────────────────────────────
  const connected      = allAccounts.filter(a => a.isConnected);
  const selectedAcc    = typeof view === "number" ? allAccounts.find(a => a.id === view) : null;
  const selPlat        = selectedAcc ? PLAT[selectedAcc.platformId] : null;
  const platformGroups = ([1, 2, 3, 4] as const)
    .map(pid => ({ pid, accounts: connected.filter(a => a.platformId === pid) }))
    .filter(g => g.accounts.length > 0);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#dc2626" }} />
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div style={{
        background: "#fff", borderRadius: 14, border: "1px solid #f0f0f0",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)", padding: "10px 18px",
        display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap",
      }}>

        {/* Title */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 4 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "#fef2f2",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>📈</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Analytics</span>
        </div>

        <div style={{ width: 1, height: 22, background: "#f0f0f0" }} />

        {/* Overview button */}
        <NavBtn active={view === "overview"} onClick={() => setView("overview")}>Overview</NavBtn>

        {/* Account dropdown */}
        {connected.length > 0 && (
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <button
              onClick={() => setDropdownOpen(o => !o)}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "6px 12px", borderRadius: 8, cursor: "pointer",
                border: `1.5px solid ${typeof view === "number" ? (selPlat?.color ?? "#dc2626") + "55" : "#e5e7eb"}`,
                background: typeof view === "number" ? (selPlat?.color ?? "#dc2626") + "0e" : "#f8f9fb",
                transition: "all .15s", fontFamily: "inherit",
              }}
            >
              {selectedAcc ? (
                selectedAcc.profilePicture
                  ? <img src={selectedAcc.profilePicture} alt="" style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover" }} />
                  : <span style={{ width: 20, height: 20, borderRadius: "50%", background: selPlat!.color + "20",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9, fontWeight: 700, color: selPlat!.color }}>{selPlat!.badge}</span>
              ) : (
                <span style={{ fontSize: 13 }}>👤</span>
              )}
              <span style={{ fontSize: 12, fontWeight: 600, color: selectedAcc ? selPlat?.color ?? "#0f172a" : "#64748b" }}>
                {selectedAcc
                  ? (selectedAcc.username ? `@${selectedAcc.username.replace("@", "")}` : `Account #${selectedAcc.id}`)
                  : "Select Account"}
              </span>
              {selectedAcc && selPlat && (
                <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 5,
                  background: selPlat.color + "18", color: selPlat.color }}>
                  {selPlat.display}
                </span>
              )}
              <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: 2 }}>{dropdownOpen ? "▲" : "▼"}</span>
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.13 }}
                  style={{
                    position: "absolute", top: "calc(100% + 8px)", left: 0,
                    minWidth: 230, background: "#fff", borderRadius: 12,
                    border: "1px solid #f0f0f0", boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                    zIndex: 100, overflow: "hidden",
                  }}
                >
                  {platformGroups.map(({ pid, accounts }) => {
                    const p = PLAT[pid];
                    return (
                      <div key={pid}>
                        <div style={{ padding: "8px 14px 4px", display: "flex", alignItems: "center", gap: 6,
                          background: "#fafafa", borderBottom: "1px solid #f0f0f0" }}>
                          <span style={{ fontSize: 12 }}>{p.icon}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: p.color, letterSpacing: 0.3 }}>
                            {p.display.toUpperCase()}
                          </span>
                        </div>
                        {accounts.map(acc => {
                          const isActive = view === acc.id;
                          return (
                            <button
                              key={acc.id}
                              onClick={() => { setView(acc.id); setDropdownOpen(false); }}
                              style={{
                                width: "100%", display: "flex", alignItems: "center", gap: 10,
                                padding: "9px 14px", border: "none", cursor: "pointer",
                                background: isActive ? p.color + "0e" : "transparent",
                                transition: "background .1s", fontFamily: "inherit",
                              }}
                              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "#f8f9fb"; }}
                              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                            >
                              {acc.profilePicture
                                ? <img src={acc.profilePicture} alt="" style={{
                                    width: 30, height: 30, borderRadius: "50%", objectFit: "cover", flexShrink: 0,
                                    border: `2px solid ${isActive ? p.color + "55" : "#f0f0f0"}`,
                                  }} />
                                : <div style={{
                                    width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                                    background: p.color + "18", display: "flex", alignItems: "center",
                                    justifyContent: "center", fontSize: 11, color: p.color, fontWeight: 700,
                                    border: `2px solid ${isActive ? p.color + "40" : "transparent"}`,
                                  }}>{p.badge}</div>
                              }
                              <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                                <div style={{ fontSize: 12, fontWeight: 600,
                                  color: isActive ? p.color : "#374151",
                                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {acc.username ? `@${acc.username.replace("@", "")}` : `Account #${acc.id}`}
                                </div>
                                {acc.followersCount != null && acc.followersCount > 0 && (
                                  <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>
                                    {fmtNum(acc.followersCount)} followers
                                  </div>
                                )}
                              </div>
                              {isActive && <span style={{ fontSize: 13, color: p.color, flexShrink: 0 }}>✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Content button */}
        <NavBtn active={view === "content"} onClick={() => setView("content")}>Content</NavBtn>

        <div style={{ flex: 1 }} />
        <NotificationBell token={token} onExternalTask={onExternalTask} onTrelloTask={onTrelloTask} />
      </div>

      {/* ── Tab Content ──────────────────────────────────────────────────── */}

      {view === "overview" && (
        <OverviewTab posts={posts} igData={igData} fbData={fbData} liData={liData} ttData={ttData} />
      )}

      {view === "content" && (
        <ContentTab posts={posts} igData={igData} fbData={fbData} />
      )}

      {typeof view === "number" && (() => {
        const acc = allAccounts.find(a => a.id === view);
        if (!acc) return null;
        const p = PLAT[acc.platformId];

        if (selAccLoading) return (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "40vh", gap: 12 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid #e2e8f0",
                borderTopColor: p?.color ?? "#dc2626" }} />
            <span style={{ fontSize: 12, color: "#94a3b8" }}>Loading {p?.display ?? ""} data…</span>
          </div>
        );

        if (acc.platformId === 1) return <InstagramTab igData={selAccData as InstagramSummary} token={token} />;
        if (acc.platformId === 2) return <FacebookTab  fbData={selAccData as FacebookSummary} />;
        if (acc.platformId === 3) return <LinkedinTab  liData={selAccData as LinkedInSummary} />;
        if (acc.platformId === 4) return <TiktokTab    ttData={selAccData as TikTokSummary} />;
        return null;
      })()}
    </div>
  );
}

// ── Small helper for nav pills ────────────────────────────────────────────────
function NavBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
      background: active ? "#fef2f2" : "transparent",
      color: active ? "#dc2626" : "#64748b",
      fontSize: 12, fontWeight: active ? 700 : 400,
      transition: "all .15s", fontFamily: "inherit",
    }}>
      {children}
    </button>
  );
}
