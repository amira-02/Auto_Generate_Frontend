// Analytics/index.tsx
import { useState, useEffect, useContext } from "react";
import { motion } from "framer-motion";
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

const API = "https://localhost:7079";
type Tab = "overview" | "instagram" | "facebook" | "linkedin" | "tiktok" | "content";

type Props = {
  onExternalTask?: (taskId: number) => void;
};

export default function Analytics({ onExternalTask }: Props) {
  const { token } = useContext(AuthContext);
  const [posts,   setPosts]   = useState<Post[]>([]);
  const [igData,  setIgData]  = useState<InstagramSummary | null>(null);
  const [fbData,  setFbData]  = useState<FacebookSummary  | null>(null);
  const [liData,  setLiData]  = useState<LinkedInSummary  | null>(null);
  const [ttData,  setTtData]  = useState<TikTokSummary    | null>(null);
  const [loading, setLoading] = useState(true);
  const [period,  setPeriod]  = useState<"7d" | "30d" | "90d">("30d");
  const [tab,     setTab]     = useState<Tab>("overview");

  useEffect(() => {
    (async () => {
      try {
        const [postsRes, igRes, fbRes, liRes, ttRes] = await Promise.all([
          fetch(`${API}/api/posts`,                    { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/api/social/instagram/summary`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/api/social/facebook/summary`,  { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/api/social/linkedin/summary`,  { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/api/social/tiktok/summary`,    { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (postsRes.ok) setPosts(await postsRes.json());
        if (igRes.ok)    setIgData(await igRes.json());
        if (fbRes.ok)    setFbData(await fbRes.json());
        if (liRes.ok)    setLiData(await liRes.json());
        if (ttRes.ok)    setTtData(await ttRes.json());
      } catch {}
      finally { setLoading(false); }
    })();
  }, [token]);

  const igFollowers = igData?.followers ?? 0;

  const TAB_CONFIG: { id: Tab; label: string; color: string }[] = [
    { id: "overview", label: "Overview",     color: "#e65787" },
    { id: "instagram", label: " Instagram", color: "#e1306c" },
    { id: "facebook",  label: "Facebook",  color: "#1877f2" },
    { id: "linkedin",  label: "LinkedIn",  color: "#0077b5" },
    { id: "tiktok",    label: " TikTok",    color: "#ff0050" },
    { id: "content",   label: "Content",      color: "#e65787" },
  ];

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#e65787" }} />
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── Top Bar with NotificationBell ──────────────────────────────── */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f0f0f0",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)", padding: "12px 18px",
        display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "#fff1f3",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>📈</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Analytics</span>
        </div>

        {/* Platform badges */}
        {igData && (
          <>
            <div style={{ width: 1, height: 22, background: "#f0f0f0" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {igData.profilePicture && <img src={igData.profilePicture} alt="" style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover", border: "2px solid #e1306c30" }} />}
              <span style={{ fontSize: 12, fontWeight: 600, color: "#e1306c" }}>@{igData.name}</span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>{fmtNum(igFollowers)} followers</span>
              <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 10, background: "#e1306c15", color: "#e1306c" }}>IG</span>
            </div>
          </>
        )}
        {fbData && (
          <>
            <div style={{ width: 1, height: 22, background: "#f0f0f0" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {fbData.profilePicture && <img src={fbData.profilePicture} alt="" style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }} />}
              <span style={{ fontSize: 12, fontWeight: 600, color: "#1877f2" }}>{fbData.name}</span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>{fmtNum(fbData.fans)} fans</span>
              <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 10, background: "#1877f215", color: "#1877f2" }}>FB</span>
            </div>
          </>
        )}
        {liData && (
          <>
            <div style={{ width: 1, height: 22, background: "#f0f0f0" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {liData.profilePicture && <img src={liData.profilePicture} alt="" style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }} />}
              <span style={{ fontSize: 12, fontWeight: 600, color: "#0077b5" }}>{liData.name}</span>
              <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 10, background: "#0077b515", color: "#0077b5" }}>LI</span>
            </div>
          </>
        )}
        {ttData && (
          <>
            <div style={{ width: 1, height: 22, background: "#f0f0f0" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {ttData.profilePicture && <img src={ttData.profilePicture} alt="" style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }} />}
              <span style={{ fontSize: 12, fontWeight: 600, color: "#ff0050" }}>@{ttData.name}</span>
              <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 10, background: "#ff005015", color: "#ff0050" }}>TT</span>
            </div>
          </>
        )}

        <div style={{ flex: 1 }} />

        {/* Tabs */}
        <div style={{ display: "flex", background: "#f8f9fb", borderRadius: 10, padding: 3, border: "1px solid #f0f0f0", flexWrap: "wrap", gap: 2 }}>
          {TAB_CONFIG.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "5px 14px", borderRadius: 8, border: "none", cursor: "pointer",
              background: tab === t.id ? "#fff" : "transparent",
              color: tab === t.id ? t.color : "#94a3b8",
              fontSize: 12, fontWeight: tab === t.id ? 700 : 400,
              boxShadow: tab === t.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              transition: "all .15s",
            }}>{t.label}</button>
          ))}
        </div>

        {/* Period */}
        {/* <div style={{ display: "flex", background: "#f8f9fb", borderRadius: 10, padding: 3, border: "1px solid #f0f0f0" }}>
          {(["7d", "30d", "90d"] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer",
              background: period === p ? "#fff" : "transparent",
              color: period === p ? "#0f172a" : "#94a3b8",
              fontSize: 11, fontWeight: period === p ? 600 : 400,
              boxShadow: period === p ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              transition: "all .15s",
            }}>{p}</button>
          ))}
        </div> */}

        {/* 🔔 NotificationBell — only here in Analytics */}
        <NotificationBell
          token={token}
          onExternalTask={onExternalTask}
        />
      </div>

      {/* ── Tab Content ── */}
      {tab === "overview"  && <OverviewTab  posts={posts} igData={igData} fbData={fbData} liData={liData} ttData={ttData} />}
      {tab === "instagram" && <InstagramTab igData={igData} token={token} />}
      {tab === "facebook"  && <FacebookTab  fbData={fbData} />}
      {tab === "linkedin"  && <LinkedinTab  liData={liData} />}
      {tab === "tiktok"    && <TiktokTab    ttData={ttData} />}
      {tab === "content"   && <ContentTab   posts={posts} igData={igData} fbData={fbData} />}

      {/* Footer */}
      {/* <div style={{ marginTop: 20, padding: "10px 16px", borderRadius: 10, background: "#f0f9ff",
        border: "1px solid #bae6fd", fontSize: 11, color: "#0369a1", display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 8, background: "#e1306c", color: "#fff" }}>REAL</span>
        Instagram &amp; Facebook data is live from the API.
        <span style={{ color: "#94a3b8" }}>· LinkedIn &amp; TikTok shown when connected · Content engagement estimates are simulated.</span>
      </div> */}
    </div>
  );
}