// Analytics/OverviewTab.tsx
import { useContext, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, ComposedChart, Line, LineChart,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie,
} from "recharts";

import { AuthContext } from "../../../hooks/AuthContext";
import { CustomTooltip } from "./AnalyticsComponents";
import { fmtNum, fmtDate, normalizePlatforms } from "./analyticsHelpers";
import type { Post, InstagramSummary, FacebookSummary, LinkedInSummary, TikTokSummary } from "./analyticsTypes";
import Airecommendations from "./Airecommendations";

// ── Mock data (set MOCK_MODE = false to use real API data) ────────────────────
const MOCK_MODE = false;

function makeTl(base: number, variance: number, days = 14) {
  let seed = base;
  return Array.from({ length: days }, (_, i) => {
    seed = (seed * 9301 + 49297) % 233280;
    const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
    return { date: d.toISOString(), value: Math.max(0, Math.round(base + (seed / 233280 - 0.5) * variance)) };
  });
}

const MOCK_POSTS: Post[] = [
  { id:1,  status:"published", topicName:"Summer Campaign",    platforms:'["instagram","facebook"]', scheduledAt:null,                    createdAt:"2026-06-01T10:00:00Z", caption:"Discover our summer collection ☀️", imageUrl:null },
  { id:2,  status:"published", topicName:"Product Launch",     platforms:'["instagram"]',             scheduledAt:null,                    createdAt:"2026-06-02T14:00:00Z", caption:"Introducing something new 🚀",       imageUrl:null },
  { id:3,  status:"published", topicName:"Brand Story",        platforms:'["linkedin","facebook"]',   scheduledAt:null,                    createdAt:"2026-06-03T09:00:00Z", caption:"Our story started with a vision and grew from there.", imageUrl:null },
  { id:4,  status:"published", topicName:"Engagement Post",    platforms:'["instagram"]',             scheduledAt:null,                    createdAt:"2026-06-04T11:00:00Z", caption:"What is your favorite product? 💬",  imageUrl:null },
  { id:5,  status:"published", topicName:"TikTok Trend",       platforms:'["tiktok"]',                scheduledAt:null,                    createdAt:"2026-05-20T15:00:00Z", caption:"Trending sound #viral",              imageUrl:null },
  { id:6,  status:"published", topicName:"Behind the Scenes",  platforms:'["instagram","tiktok"]',    scheduledAt:null,                    createdAt:"2026-05-25T08:00:00Z", caption:"Behind the scenes magic ✨",          imageUrl:null },
  { id:7,  status:"published", topicName:"Weekly Tips",        platforms:'["linkedin"]',              scheduledAt:null,                    createdAt:"2026-05-15T10:00:00Z", caption:"5 tips for better engagement 📈",    imageUrl:null },
  { id:8,  status:"published", topicName:"Community Story",    platforms:'["facebook","instagram"]',  scheduledAt:null,                    createdAt:"2026-05-10T12:00:00Z", caption:"Real stories from our community 💙", imageUrl:null },
  { id:9,  status:"published", topicName:"Flash Sale",         platforms:'["facebook","instagram"]',  scheduledAt:null,                    createdAt:"2026-04-15T10:00:00Z", caption:"Flash sale today only! ⚡",           imageUrl:null },
  { id:10, status:"published", topicName:"Monthly Recap",      platforms:'["linkedin","facebook"]',   scheduledAt:null,                    createdAt:"2026-05-01T09:00:00Z", caption:"May recap highlights 📊",            imageUrl:null },
  { id:11, status:"scheduled", topicName:"June Event",         platforms:'["instagram","facebook"]',  scheduledAt:"2026-06-15T10:00:00Z",  createdAt:"2026-06-07T09:00:00Z", caption:"Do not miss our event!",            imageUrl:null },
  { id:12, status:"scheduled", topicName:"Summer Sale",        platforms:'["instagram"]',             scheduledAt:"2026-06-18T12:00:00Z",  createdAt:"2026-06-07T10:00:00Z", caption:"Big sale coming soon 🔥",           imageUrl:null },
  { id:13, status:"scheduled", topicName:"Podcast Episode",    platforms:'["linkedin"]',              scheduledAt:"2026-06-20T09:00:00Z",  createdAt:"2026-06-06T08:00:00Z", caption:"New episode dropping soon...",      imageUrl:null },
  { id:14, status:"scheduled", topicName:"TikTok Challenge",   platforms:'["tiktok"]',                scheduledAt:"2026-06-22T14:00:00Z",  createdAt:"2026-06-06T11:00:00Z", caption:"Join the challenge!",               imageUrl:null },
  { id:15, status:"draft",     topicName:"Q3 Campaign",        platforms:'["instagram","facebook"]',  scheduledAt:null,                    createdAt:"2026-06-05T14:00:00Z", caption:"Draft ideas for Q3...",             imageUrl:null },
  { id:16, status:"draft",     topicName:"Influencer Collab",  platforms:'["instagram"]',             scheduledAt:null,                    createdAt:"2026-06-04T16:00:00Z", caption:null,                                imageUrl:null },
  { id:17, status:"draft",     topicName:"New Product Teaser", platforms:'["tiktok","instagram"]',    scheduledAt:null,                    createdAt:"2026-06-03T10:00:00Z", caption:"Coming soon...",                    imageUrl:null },
  { id:18, status:"inreview",  topicName:"Partnership Post",   platforms:'["linkedin","facebook"]',   scheduledAt:null,                    createdAt:"2026-06-06T09:00:00Z", caption:"Excited to announce our partnership!", imageUrl:null },
  { id:19, status:"inreview",  topicName:"Testimonial",        platforms:'["instagram"]',             scheduledAt:null,                    createdAt:"2026-06-07T08:00:00Z", caption:"Hear from our customers 💬",         imageUrl:null },
  { id:20, status:"published", topicName:"Community Post",     platforms:'["instagram"]',             scheduledAt:null,                    createdAt:"2026-04-20T11:00:00Z", caption:"Thank you to our community 🙏",     imageUrl:null },
];

const MOCK_IG: InstagramSummary = {
  followers: 4823, mediaCount: 42, name: "AutoGenerate", profilePicture: "",
  totalLikes: 1250, totalComments: 347,
  reachTimeline:    makeTl(320, 200), followerTimeline: makeTl(4760, 80), topPosts: [],
};
const MOCK_FB: FacebookSummary = {
  fans: 3241, followers: 3241, name: "AutoGenerate", profilePicture: "",
  totalImpressions: 18750, totalEngagedUsers: 892,
  impressionsTimeline: makeTl(1300, 600), engagedUsersTimeline: makeTl(62, 28),
  fanAddsTimeline: makeTl(6, 8), recentPosts: [],
};
const MOCK_LI: LinkedInSummary = {
  followers: 1456, name: "AutoGenerate", profilePicture: "", connectionsCount: 312,
  totalImpressions: 9200, totalReactions: 340, totalClicks: 210,
  impressionsTimeline: makeTl(650, 280), clicksTimeline: makeTl(15, 10), reactionsTimeline: makeTl(24, 14), recentPosts: [],
};
const MOCK_TT: TikTokSummary = {
  followers: 7856, following: 124, likes: 24300, videoCount: 38, name: "AutoGenerate", profilePicture: "",
  totalViews: 124300, totalLikes: 8920, totalComments: 1240, totalShares: 567,
  viewsTimeline: makeTl(8900, 4000), likesTimeline: makeTl(640, 280), recentVideos: [],
};

// ── Body Rings ────────────────────────────────────────────────────────────────
function BodyRings({ metrics }: {
  metrics: { label: string; score: number; max: number; unit: string; color: string }[];
}) {
  const cx = 90, cy = 90, trackW = 13, gap = 7;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24, justifyContent: "center", paddingTop: 8 }}>
      <svg width={180} height={180} style={{ flexShrink: 0 }}>
        {metrics.map((m, i) => {
          const r = cx - trackW / 2 - i * (trackW + gap);
          const circ = 2 * Math.PI * r;
          const dash = (m.score / m.max) * circ;
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={trackW} />
              <circle cx={cx} cy={cy} r={r} fill="none" stroke={m.color} strokeWidth={trackW}
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circ}`}
                transform={`rotate(-90 ${cx} ${cy})`} />
            </g>
          );
        })}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {metrics.map((m, i) => (
          <div key={i}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8",
              letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 3 }}>
              {m.label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: m.color, lineHeight: 1 }}>
              {m.score}
              <span style={{ fontSize: 11, fontWeight: 500, color: "#94a3b8" }}>/{m.max} {m.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type Props = {
  posts: Post[];
  igData: InstagramSummary | null;
  fbData: FacebookSummary  | null;
  liData: LinkedInSummary  | null;
  ttData: TikTokSummary    | null;
};

const card: React.CSSProperties = {
  background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", padding: "20px",
};

// ── KPI tile ──────────────────────────────────────────────────────────────────
function KpiTile({ label, value, delta, sub }: {
  label: string; value: string | number; delta?: number; sub?: string;
}) {
  return (
    <div style={{ ...card, padding: "14px 16px" }}>
      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", letterSpacing: "-1px", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
        {delta !== undefined && (
          <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 20,
            background: delta >= 0 ? "#f0fdf4" : "#fef2f2",
            color: delta >= 0 ? "#16a34a" : "#dc2626" }}>
            {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}%
          </span>
        )}
        {sub && <span style={{ fontSize: 10, color: "#94a3b8" }}>{sub}</span>}
      </div>
    </div>
  );
}

// ── Chart card header ─────────────────────────────────────────────────────────
function ChartHead({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

// ── Legend dot ────────────────────────────────────────────────────────────────
function Dot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
      <span style={{ fontSize: 10, color: "#94a3b8" }}>{label}</span>
    </div>
  );
}

// ── Post activity calendar ────────────────────────────────────────────────────
function PostActivityCalendar({ posts }: { posts: Post[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const offset = firstDay.getDay();
  const days = Array.from({ length: lastDay.getDate() }, (_, i) => i + 1);

  const postsByDay: Record<number, number> = {};
  posts.forEach((p) => {
    const d = new Date(p.createdAt);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      postsByDay[day] = (postsByDay[day] || 0) + 1;
    }
  });

  const maxCount = Math.max(...Object.values(postsByDay), 1);
  const today = now.getDate();

  const getCircleStyle = (day: number): React.CSSProperties => {
    const count = postsByDay[day] || 0;
    const intensity = count / maxCount;
    const isToday = day === today;
    if (isToday) return { width: 32, height: 32, borderRadius: "50%", background: "#dc2626", color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 };
    if (count === 0) return { width: 32, height: 32, borderRadius: "50%", background: "#f1f5f9", color: "#94a3b8",
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 };
    const alpha = 0.3 + intensity * 0.7;
    return { width: 32, height: 32, borderRadius: "50%", background: `rgba(230,87,135,${alpha})`,
      color: intensity > 0.5 ? "#fff" : "#dc2626",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 12, fontWeight: 600, position: "relative" };
  };

  const monthName = now.toLocaleString("en-US", { month: "long", year: "numeric" });
  const thisMonthPosts = posts.filter(p => { const d = new Date(p.createdAt); return d.getMonth() === month; });
  const stats = [
    { label: "Created",   value: thisMonthPosts.length },
    { label: "Published", value: thisMonthPosts.filter(p => p.status?.toLowerCase() === "published").length },
    { label: "Scheduled", value: posts.filter(p => p.status?.toLowerCase() === "scheduled").length },
  ];

  return (
    <div style={{ ...card, height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Post Calendar</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{monthName}</div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", letterSpacing: "-1px" }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {Array(offset).fill(null).map((_, i) => <div key={`e${i}`} />)}
        {days.map((day) => (
          <div key={day} style={{ display: "flex", justifyContent: "center" }}>
            <div style={getCircleStyle(day)}>
              {day}
              {(postsByDay[day] || 0) > 0 && day !== today && (
                <div style={{ position: "absolute", top: -2, right: -2, width: 12, height: 12,
                  borderRadius: "50%", background: "#10b981", border: "2px solid #fff",
                  fontSize: 7, color: "#fff", fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>{postsByDay[day]}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Insight card (Meta/TikTok style) ─────────────────────────────────────────
function InsightCard({ title, sub, value, delta, timeline, color, subMetrics, icon }: {
  title: string; sub: string; value: string | number; delta?: number;
  timeline?: { date?: string; value: number }[];
  color: string;
  subMetrics?: { label: string; value: string | number }[];
  icon?: React.ReactNode;
}) {
  const sparkData = (timeline ?? []).map((d, i) => ({ i, v: d.value }));
  return (
    <div style={{ ...card, padding: "16px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {icon && <div style={{ flexShrink: 0 }}>{icon}</div>}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{title}</div>
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{sub}</div>
          </div>
        </div>
        {sparkData.length > 0 && (
          <ResponsiveContainer width={72} height={34}>
            <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
              <defs>
                <linearGradient id={`gic-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
                fill={`url(#gic-${title})`} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 8, margin: "10px 0 0" }}>
        <span style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", letterSpacing: "-1px", lineHeight: 1 }}>
          {value}
        </span>
        {delta !== undefined && (
          <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 6px", borderRadius: 20,
            background: delta >= 0 ? "#f0fdf4" : "#fef2f2",
            color: delta >= 0 ? "#16a34a" : "#dc2626" }}>
            {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}%
          </span>
        )}
      </div>

      {subMetrics && subMetrics.length > 0 && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #f0f0f5",
          display: "flex", flexDirection: "column", gap: 5 }}>
          {subMetrics.map(s => (
            <div key={s.label} style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 10, color: "#94a3b8" }}>{s.label}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>{s.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const PLAT_COLORS: Record<string, string> = {
  instagram: "#e1306c", facebook: "#1877f2", linkedin: "#0077b5",
  tiktok: "#010101",    twitter:  "#1da1f2", threads:  "#000000",
};

// ── Hashtag Word Cloud ────────────────────────────────────────────────────────
const HASHTAG_DATA: { word: string; count: number; color: string }[] = [
  { word: "#reels",         count: 48, color: "#e1306c" },
  { word: "#instagood",     count: 42, color: "#e1306c" },
  { word: "#photooftheday", count: 36, color: "#e1306c" },
  { word: "#fashion",       count: 32, color: "#e1306c" },
  { word: "#travel",        count: 29, color: "#e1306c" },
  { word: "#viral",         count: 26, color: "#e1306c" },
  { word: "#love",          count: 24, color: "#e1306c" },
  { word: "#summer",        count: 22, color: "#e1306c" },
  { word: "#fyp",           count: 21, color: "#555" },
  { word: "#trending",      count: 17, color: "#555" },
  { word: "#challenge",     count: 14, color: "#555" },
  { word: "#foryou",        count: 11, color: "#555" },
  { word: "#community",     count: 18, color: "#1877f2" },
  { word: "#share",         count: 15, color: "#1877f2" },
  { word: "#event",         count: 13, color: "#1877f2" },
  { word: "#family",        count: 10, color: "#1877f2" },
  { word: "#networking",    count:  9, color: "#0077b5" },
  { word: "#leadership",    count:  7, color: "#0077b5" },
  { word: "#innovation",    count:  6, color: "#0077b5" },
  { word: "#career",        count:  5, color: "#0077b5" },
  { word: "#growth",        count:  4, color: "#0077b5" },
  { word: "#content",       count: 20, color: "#e1306c" },
  { word: "#local",         count:  8, color: "#1877f2" },
  { word: "#professional",  count:  4, color: "#0077b5" },
];

const PLAT_OPTS = [
  { label: "Instagram", value: "#e1306c" },
  { label: "Facebook",  value: "#1877f2" },
  { label: "LinkedIn",  value: "#0077b5" },
  { label: "TikTok",    value: "#555555" },
];

function HashtagCloud({ words, onRemove }: {
  words: { word: string; count: number; color: string }[];
  onRemove: (word: string) => void;
}) {
  const W = 420, H = 150, cx = W / 2, cy = H / 2;
  const max = words[0]?.count ?? 1;
  const placed: { x: number; y: number; pw: number; ph: number }[] = [];

  const overlaps = (x: number, y: number, pw: number, ph: number) =>
    placed.some(p => Math.abs(x - p.x) < (pw + p.pw) / 2 + 2 &&
                     Math.abs(y - p.y) < (ph + p.ph) / 2 + 2);

  const elements = words.map(item => {
    const fontSize = 11 + Math.round((item.count / max) * 28);
    const pw = item.word.length * fontSize * 0.52;
    const ph = fontSize * 1.3;
    let t = 0, x = cx, y = cy;
    while (t < 1000) {
      const r = 0.42 * t;
      x = cx + r * Math.cos(t);
      y = cy + r * Math.sin(t) * 0.62;
      if (x - pw / 2 > 4 && x + pw / 2 < W - 4 &&
          y - ph / 2 > 4 && y + ph / 2 < H - 4 &&
          !overlaps(x, y, pw, ph)) break;
      t += 0.16;
    }
    placed.push({ x, y, pw, ph });
    return { ...item, x, y, fontSize };
  });

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ minHeight: 110 }}>
      {elements.map(e => (
        <text key={e.word} x={e.x} y={e.y}
          fontSize={e.fontSize}
          fontWeight={e.fontSize > 24 ? 800 : e.fontSize > 16 ? 700 : 500}
          fill={e.color} textAnchor="middle" dominantBaseline="middle"
          onClick={() => onRemove(e.word)}
          style={{ cursor: "pointer", opacity: 0.5 + (e.count / max) * 0.5,
            transition: "opacity .15s" }}>
          {e.word}
        </text>
      ))}
    </svg>
  );
}

function InteractiveHashtagCard() {
  const [words, setWords] = useState(HASHTAG_DATA);
  const [input, setInput] = useState("");
  const [color, setColor] = useState("#e1306c");

  const remove = (word: string) => setWords(ws => ws.filter(w => w.word !== word));

  const add = () => {
    let tag = input.trim();
    if (!tag) return;
    if (!tag.startsWith("#")) tag = "#" + tag;
    if (words.find(w => w.word.toLowerCase() === tag.toLowerCase())) { setInput(""); return; }
    setWords(ws => [...ws, { word: tag, count: Math.max(6, Math.round((ws[0]?.count ?? 20) * 0.25)), color }]);
    setInput("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <HashtagCloud words={words} onRemove={remove} />

      {/* Chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 6px", maxHeight: 52,
        overflowY: "auto", padding: "4px 0" }}>
        {words.map(w => (
          <div key={w.word} style={{ display: "flex", alignItems: "center", gap: 3,
            padding: "3px 8px 3px 9px", borderRadius: 20,
            background: w.color + "12", border: `1px solid ${w.color}30` }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: w.color }}>{w.word}</span>
            <button onClick={() => remove(w.word)} style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 13, lineHeight: 1, color: w.color, opacity: 0.6,
              padding: "0 0 0 2px", display: "flex", alignItems: "center" }}>×</button>
          </div>
        ))}
      </div>

      {/* Add row */}
      <div style={{ display: "flex", gap: 6 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && add()}
          placeholder="#hashtag..."
          style={{ flex: 1, borderRadius: 8, border: "1px solid #e2e8f0",
            padding: "6px 10px", fontSize: 12, outline: "none", color: "#374151" }} />
        <select value={color} onChange={e => setColor(e.target.value)}
          style={{ borderRadius: 8, border: "1px solid #e2e8f0", padding: "4px 6px",
            fontSize: 11, color: "#374151", background: "#fff", cursor: "pointer" }}>
          {PLAT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button onClick={add} style={{ padding: "6px 14px", borderRadius: 8, border: "none",
          background: "#dc2626", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
          +
        </button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function OverviewTab(rawProps: Props) {
  const { token } = useContext(AuthContext);

  const posts  = MOCK_MODE ? MOCK_POSTS : rawProps.posts;
  const igData = MOCK_MODE ? MOCK_IG    : rawProps.igData;
  const fbData = MOCK_MODE ? MOCK_FB    : rawProps.fbData;
  const liData = MOCK_MODE ? MOCK_LI    : rawProps.liData;
  const ttData = MOCK_MODE ? MOCK_TT    : rawProps.ttData;

  const now          = new Date();
  const thisMonth    = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth    = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const postsThisM = posts.filter(p => new Date(p.createdAt) >= thisMonth);
  const postsLastM = posts.filter(p => { const d = new Date(p.createdAt); return d >= lastMonth && d <= lastMonthEnd; });
  const published  = posts.filter(p => p.status?.toLowerCase() === "published");
  const scheduled  = posts.filter(p => p.status?.toLowerCase() === "scheduled");
  const inReview   = posts.filter(p => ["inreview", "approved"].includes(p.status?.toLowerCase() ?? ""));
  const growthPct  = postsLastM.length > 0
    ? Math.round(((postsThisM.length - postsLastM.length) / postsLastM.length) * 100) : 0;

  // ── Audience bar chart data ───────────────────────────────────────────────
  const audienceData = [
    igData ? { platform: "Instagram", followers: igData.followers,     color: "#e1306c" } : null,
    fbData ? { platform: "Facebook",  followers: fbData.fans,          color: "#1877f2" } : null,
    liData ? { platform: "LinkedIn",  followers: liData.followers,     color: "#0077b5" } : null,
    ttData ? { platform: "TikTok",    followers: ttData.followers,     color: "#010101" } : null,
  ].filter(Boolean) as { platform: string; followers: number; color: string }[];

  // ── Monthly posts trend (last 6 months) ──────────────────────────────────
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const offset = 5 - i;
    const mStart = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const mEnd   = new Date(now.getFullYear(), now.getMonth() - offset + 1, 0);
    const label  = mStart.toLocaleString("en-US", { month: "short" });
    const mPosts = posts.filter(p => { const d = new Date(p.createdAt); return d >= mStart && d <= mEnd; });
    return {
      month:     label,
      total:     mPosts.length,
      published: mPosts.filter(p => p.status?.toLowerCase() === "published").length,
    };
  });

  // ── Cross-platform reach timeline ─────────────────────────────────────────
  // Always show last 15 days from today — fill missing days with 0
  const reachDays = Array.from({ length: 15 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (14 - i));
    return fmtDate(d.toISOString());
  });
  const reachMap = new Map<string, { date: string; ig: number; fb: number }>();
  reachDays.forEach(label => reachMap.set(label, { date: label, ig: 0, fb: 0 }));
  (igData?.reachTimeline ?? []).forEach(r => {
    const d = fmtDate(r.date);
    if (reachMap.has(d)) reachMap.get(d)!.ig = r.value;
  });
  (fbData?.impressionsTimeline ?? []).forEach(r => {
    const d = fmtDate(r.date);
    if (reachMap.has(d)) reachMap.get(d)!.fb = r.value;
  });
  const reachData  = reachDays.map(label => reachMap.get(label)!);
  const igTimeline = igData?.reachTimeline ?? [];
  const fbTimeline = fbData?.impressionsTimeline ?? [];
  const hasReach   = igTimeline.length > 0 || fbTimeline.length > 0;


  const topPosts = [...published]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Posts by day of week
  const dowCounts = [0, 0, 0, 0, 0, 0, 0];
  posts.forEach(p => { dowCounts[new Date(p.createdAt).getDay()]++; });
  const dowLabels = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const postsByDayOfWeek = dowLabels.map((day, i) => ({ day, posts: dowCounts[i] }));
  const bestDayIndex = dowCounts.indexOf(Math.max(...dowCounts));

  // Insight card delta helper
  const calcDelta = (tl: {date:string;value:number}[]) => {
    if (tl.length < 14) return undefined;
    const recent = tl.slice(-7).reduce((s,d) => s + d.value, 0);
    const prev   = tl.slice(-14,-7).reduce((s,d) => s + d.value, 0);
    if (prev === 0) return undefined;
    return Math.round((recent - prev) / prev * 100);
  };

  // Content health score
  const publishRate  = posts.length > 0 ? Math.round((published.length / posts.length) * 100) : 0;
  const captionRate  = posts.length > 0 ? Math.round((posts.filter(p => p.caption && p.caption.length > 20).length / posts.length) * 100) : 0;
  const imageRate    = posts.length > 0 ? Math.round((posts.filter(p => p.imageUrl).length / posts.length) * 100) : 0;
  const scheduleRate = posts.length > 0 ? Math.round(((scheduled.length + published.length) / posts.length) * 100) : 0;
  const healthMetrics = [
    { label: "Taux de publication", score: publishRate,  color: "#dc2626" },
    { label: "Posts avec caption",  score: captionRate,  color: "#0f172a" },
    { label: "Posts avec visuel",   score: imageRate,    color: "#10b981" },
    { label: "Posts planifiés",     score: scheduleRate, color: "#94a3b8" },
  ];
  const overallScore = Math.round(healthMetrics.reduce((s, h) => s + h.score, 0) / healthMetrics.length);

  // ── Peak hours — posts grouped by 4-hour blocks ───────────────────────────
  const hourCounts = Array(24).fill(0);
  posts.forEach(p => { hourCounts[new Date(p.createdAt).getHours()]++; });
  const peakHoursData = ["0-4h", "4-8h", "8-12h", "12-16h", "16-20h", "20-24h"].map((label, i) => ({
    hour:  label,
    posts: hourCounts.slice(i * 4, i * 4 + 4).reduce((s, c) => s + c, 0),
  }));
  const peakBlockIndex = peakHoursData.reduce((bi, b, i, arr) => b.posts > arr[bi].posts ? i : bi, 0);

  // ── Follower growth (IG, last 30 days) ───────────────────────────────────
  const followerGrowthData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    const label = fmtDate(d.toISOString());
    const ig = igData?.followerTimeline?.find(r => fmtDate(r.date) === label)?.value ?? null;
    const tt = ttData?.viewsTimeline?.find(r => fmtDate(r.date) === label)?.value ?? null;
    return { date: label, ig, tt };
  }).filter(r => r.ig !== null || r.tt !== null) as { date: string; ig: number; tt: number }[];
  const hasFollowerData = followerGrowthData.length > 0;

  // ── Posts per platform ────────────────────────────────────────────────────
  const platCounts: Record<string, number> = {};
  posts.forEach(p => {
    normalizePlatforms(p.platforms).forEach(pl => {
      platCounts[pl] = (platCounts[pl] || 0) + 1;
    });
  });
  const platDistData = Object.entries(platCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      platform: name.charAt(0).toUpperCase() + name.slice(1),
      count,
      color: PLAT_COLORS[name.toLowerCase()] ?? "#94a3b8",
    }));

  // ── Engagement rate per platform ──────────────────────────────────────────
  const engagementRates = [
    igData && igData.followers > 0 ? { platform: "Instagram", color: "#e1306c",
      rate: +((igData.totalLikes + igData.totalComments) / igData.followers * 100).toFixed(2) } : null,
    fbData && fbData.fans > 0      ? { platform: "Facebook",  color: "#1877f2",
      rate: +((fbData.totalEngagedUsers) / fbData.fans * 100).toFixed(2) } : null,
    liData && liData.followers > 0 ? { platform: "LinkedIn",  color: "#0077b5",
      rate: +((liData.totalReactions) / liData.followers * 100).toFixed(2) } : null,
    ttData && ttData.followers > 0 ? { platform: "TikTok",    color: "#010101",
      rate: +((ttData.totalLikes) / ttData.followers * 100).toFixed(2) } : null,
  ].filter(Boolean) as { platform: string; color: string; rate: number }[];

  // ── Total impressions per platform ────────────────────────────────────────
  const totalImpressionsData = [
    fbData ? { platform: "Facebook",  value: fbData.totalImpressions,  color: "#1877f2" } : null,
    liData ? { platform: "LinkedIn",  value: liData.totalImpressions,  color: "#0077b5" } : null,
    ttData ? { platform: "TikTok",    value: ttData.totalViews,        color: "#010101" } : null,
    igData ? { platform: "Instagram", value: igData.reachTimeline?.reduce((s, d) => s + d.value, 0) ?? 0, color: "#e1306c" } : null,
  ].filter(Boolean) as { platform: string; value: number; color: string }[];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── 1. Insight cards ────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <InsightCard
          title="Instagram"
          sub="Portée · abonnés"
          value={fmtNum(igData?.followers ?? 0)}
          delta={calcDelta(igData?.followerTimeline ?? [])}
          timeline={igData?.followerTimeline?.slice(-14) ?? []}
          color="#e1306c"
          icon={<PlatformIcon.Instagram />}
          subMetrics={[
            { label: "Portée 14j",  value: fmtNum(igData?.reachTimeline?.slice(-14).reduce((s,d) => s + d.value, 0) ?? 0) },
            { label: "Total likes", value: fmtNum(igData?.totalLikes ?? 0) },
          ]}
        />
        <InsightCard
          title="Facebook"
          sub="Impressions · fans"
          value={fmtNum(fbData?.totalImpressions ?? 0)}
          delta={calcDelta(fbData?.impressionsTimeline ?? [])}
          timeline={fbData?.impressionsTimeline?.slice(-14) ?? []}
          color="#1877f2"
          icon={<PlatformIcon.Facebook />}
          subMetrics={[
            { label: "Engagés", value: fmtNum(fbData?.totalEngagedUsers ?? 0) },
            { label: "Fans",    value: fmtNum(fbData?.fans              ?? 0) },
          ]}
        />
        <InsightCard
          title="TikTok"
          sub="Vues · cumul"
          value={fmtNum(ttData?.totalViews ?? 0)}
          delta={calcDelta(ttData?.viewsTimeline ?? [])}
          timeline={ttData?.viewsTimeline?.slice(-14) ?? []}
          color="#69C9D0"
          icon={<PlatformIcon.TikTok />}
          subMetrics={[
            { label: "Likes",    value: fmtNum(ttData?.totalLikes  ?? 0) },
            { label: "Partages", value: fmtNum(ttData?.totalShares ?? 0) },
          ]}
        />
        <InsightCard
          title="LinkedIn"
          sub="Abonnés · impressions"
          value={fmtNum(liData?.followers ?? 0)}
          delta={calcDelta(liData?.impressionsTimeline ?? [])}
          timeline={liData?.impressionsTimeline?.slice(-14) ?? []}
          color="#0077b5"
          icon={<PlatformIcon.LinkedIn />}
          subMetrics={[
            { label: "Impressions", value: fmtNum(liData?.totalImpressions ?? 0) },
            { label: "Réactions",   value: fmtNum(liData?.totalReactions   ?? 0) },
          ]}
        />
      </div>

      {/* ── 3. Content trend + Audience + Posting by day ────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>

        <div style={{ ...card }}>
          <ChartHead
            title="Monthly Content Trend"
            sub="Posts created vs published — last 6 months"
            right={
              <div style={{ display: "flex", gap: 12 }}>
                <Dot color="#dc2626" label="Created" />
                <Dot color="#10b981" label="Published" />
              </div>
            }
          />
          <ResponsiveContainer width="100%" height={190}>
            <ComposedChart data={monthlyData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" name="Created" fill="#dc262615" stroke="#dc2626" strokeWidth={1} radius={[4, 4, 0, 0]} barSize={18} />
              <Line dataKey="published" name="Published" type="monotone" stroke="#10b981" strokeWidth={2}
                dot={{ fill: "#10b981", r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div style={{ ...card }}>
          <ChartHead
            title="Audience Overview"
            sub="Total followers per platform"
            right={<span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "#f0fdf4", color: "#16a34a", fontWeight: 600 }}>LIVE</span>}
          />
          {audienceData.length === 0
            ? <div style={{ textAlign: "center", padding: "50px 0", color: "#cbd5e1", fontSize: 12 }}>No platform connected</div>
            : <ResponsiveContainer width="100%" height={190}>
                <BarChart data={audienceData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                  <XAxis dataKey="platform" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtNum(v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="followers" name="Followers" radius={[6, 6, 0, 0]} minPointSize={4}>
                    {audienceData.map((entry, i) => <Cell key={`cell-${i}`} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
          }
        </div>

        <div style={{ ...card }}>
          <ChartHead title="Posts par jour" sub="Activité de publication par jour de la semaine" />
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={postsByDayOfWeek} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gDow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#dc2626" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="posts" name="Posts" stroke="#dc2626" strokeWidth={2.5}
                dot={(props: any) => {
                  const best = props.index === bestDayIndex;
                  return <circle key={props.index} cx={props.cx} cy={props.cy} r={best ? 6 : 3}
                    fill={best ? "#dc2626" : "#fff"} stroke="#dc2626" strokeWidth={2} />;
                }}
                activeDot={{ r: 5, fill: "#dc2626" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 4. Cross-platform reach + Platform engagement + Top posts ─────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>

        {/* Cross-platform reach */}
        <div style={{ ...card, display: "flex", flexDirection: "column" }}>
          <ChartHead
            title="Cross-Platform Reach"
            sub="Instagram reach · Facebook impressions"
            right={
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {igTimeline.length > 0 && <Dot color="#e1306c" label="IG Reach" />}
                {fbTimeline.length > 0 && <Dot color="#1877f2" label="FB Impressions" />}
                <span title="Meta publie les stats avec 2-3 jours de délai"
                  style={{ fontSize: 10, color: "#94a3b8", background: "#f8f9fc",
                    border: "1px solid #ebebf0", borderRadius: 6,
                    padding: "2px 7px", cursor: "default" }}>
                  ⏱ délai Meta ~2j
                </span>
              </div>
            }
          />
          <div style={{ flex: 1, display: "flex", alignItems: "center", minHeight: 190 }}>
          {!hasReach
            ? <div style={{ width: "100%", textAlign: "center", color: "#cbd5e1", fontSize: 12 }}>
                Connect Instagram or Facebook to see reach data
              </div>
            : <ResponsiveContainer width="100%" height={190}>
                <AreaChart data={reachData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gOvIg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#e1306c" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#e1306c" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gOvFb" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#1877f2" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#1877f2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => fmtNum(v)} />
                  <Tooltip content={<CustomTooltip />} />
                  {igTimeline.length > 0 && (
                    <Area type="monotone" dataKey="ig" name="IG Reach"
                      stroke="#e1306c" strokeWidth={2} fill="url(#gOvIg)" dot={false} activeDot={{ r: 4, fill: "#e1306c" }} />
                  )}
                  {fbTimeline.length > 0 && (
                    <Area type="monotone" dataKey="fb" name="FB Impressions"
                      stroke="#1877f2" strokeWidth={2} fill="url(#gOvFb)" dot={false} activeDot={{ r: 4, fill: "#1877f2" }} />
                  )}
                </AreaChart>
              </ResponsiveContainer>
          }
          </div>
        </div>

        <div style={{ ...card }}>
          <ChartHead title="Engagement par plateforme" sub="Métriques clés des comptes connectés" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {igData && (
              <PlatformRow color="#e1306c" name="Instagram"
                metrics={[
                  { label: "Followers", value: fmtNum(igData.followers) },
                  { label: "Likes",     value: fmtNum(igData.totalLikes) },
                  { label: "Comments",  value: fmtNum(igData.totalComments) },
                ]} />
            )}
            {fbData && (
              <PlatformRow color="#1877f2" name="Facebook"
                metrics={[
                  { label: "Fans",        value: fmtNum(fbData.fans) },
                  { label: "Impressions", value: fmtNum(fbData.totalImpressions) },
                  { label: "Engagés",     value: fmtNum(fbData.totalEngagedUsers) },
                ]} />
            )}
            <PlatformRow color="#0077b5" name="LinkedIn"
              notConnected={!liData}
              metrics={[
                { label: "Followers",   value: liData ? fmtNum(liData.followers)        : "—" },
                { label: "Impressions", value: liData ? fmtNum(liData.totalImpressions) : "—" },
                { label: "Réactions",   value: liData ? fmtNum(liData.totalReactions)   : "—" },
              ]} />
            {ttData && (
              <PlatformRow color="#010101" name="TikTok"
                metrics={[
                  { label: "Followers", value: fmtNum(ttData.followers) },
                  { label: "Vues",      value: fmtNum(ttData.totalViews) },
                  { label: "Likes",     value: fmtNum(ttData.totalLikes) },
                ]} />
            )}
            {!igData && !fbData && !liData && !ttData && (
              <div style={{ textAlign: "center", padding: "30px 0", color: "#cbd5e1", fontSize: 12 }}>Aucune plateforme connectée</div>
            )}
          </div>
        </div>

        <div style={{ ...card }}>
          <ChartHead title="Top Posts" sub="Posts les plus récents publiés" />
          {topPosts.length === 0
            ? <div style={{ textAlign: "center", padding: "40px 0", color: "#cbd5e1", fontSize: 12 }}>Aucun post publié</div>
            : <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
                {topPosts.map((p, i) => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 10px", borderRadius: 10, background: "#f8fafc", border: "1px solid #f0f0f0" }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: i === 0 ? "#dc2626" : "#f1f5f9",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 700, color: i === 0 ? "#fff" : "#94a3b8", flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: "#374151", fontWeight: 500,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {p.caption?.slice(0, 35) ?? p.topicName ?? "Sans titre"}
                      </div>
                      <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>
                        {new Date(p.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                      </div>
                    </div>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", flexShrink: 0 }} />
                  </div>
                ))}
              </div>
          }
        </div>
      </div>

      {/* ── 4. KPIs ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <KpiTile label="Total Posts"  value={posts.length}     delta={growthPct} sub="vs mois dernier" />
        <KpiTile label="Publiés"      value={published.length}                   sub="tous les temps"  />
        <KpiTile label="Planifiés"    value={scheduled.length}                   sub="à venir"         />
        <KpiTile label="En révision"  value={inReview.length}                    sub="en attente"      />
      </div>

      {/* ── 5. Peak Hours + Engagement Rate + Total Impressions ─────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>

        {/* Peak Hours */}
        <div style={{ ...card }}>
          <ChartHead title="Heures de pointe" sub="Activité par tranche horaire" />
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={peakHoursData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="posts" name="Posts" radius={[6, 6, 0, 0]}>
                {peakHoursData.map((_, i) => (
                  <Cell key={i} fill={i === peakBlockIndex ? "#dc2626" : "#f1f5f9"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {peakHoursData[peakBlockIndex]?.posts > 0 && (
            <div style={{ textAlign: "center", marginTop: 6, fontSize: 11, color: "#64748b" }}>
              Pic : <span style={{ fontWeight: 700, color: "#dc2626" }}>{peakHoursData[peakBlockIndex].hour}</span>
            </div>
          )}
        </div>

        {/* Engagement Rate */}
        <div style={{ ...card }}>
          <ChartHead title="Taux d'engagement" sub="(Likes + Commentaires) / Abonnés" />
          {engagementRates.length === 0
            ? <div style={{ textAlign: "center", padding: "50px 0", color: "#cbd5e1", fontSize: 12 }}>Aucune plateforme connectée</div>
            : <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ResponsiveContainer width="60%" height={160}>
                  <PieChart>
                    <Pie data={engagementRates} dataKey="rate" nameKey="platform"
                      cx="50%" cy="50%" innerRadius={44} outerRadius={72}
                      paddingAngle={4} cornerRadius={6} strokeWidth={0}>
                      {engagementRates.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => [`${v}%`, "Taux"]} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {engagementRates.map(e => (
                    <div key={e.platform} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: e.color, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1 }}>{e.platform}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: e.color, lineHeight: 1.2 }}>{e.rate}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
          }
        </div>

        {/* Total Impressions */}
        <div style={{ ...card }}>
          <ChartHead title="Impressions totales" sub="Portée cumulée par plateforme" />
          {totalImpressionsData.length === 0
            ? <div style={{ textAlign: "center", padding: "50px 0", color: "#cbd5e1", fontSize: 12 }}>Aucune donnée disponible</div>
            : <ResponsiveContainer width="100%" height={190}>
                <BarChart data={totalImpressionsData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                  <XAxis dataKey="platform" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => fmtNum(v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Impressions" radius={[6, 6, 0, 0]}>
                    {totalImpressionsData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
          }
        </div>
      </div>

      {/* ── 6. Word Cloud + Follower Growth + Posts par plateforme ──────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>

        {/* Hashtag Word Cloud */}
        <div style={{ ...card }}>
          <ChartHead title="Hashtags tendance" sub="Cliquer sur un mot pour le supprimer" />
          <InteractiveHashtagCard />
        </div>

        {/* Follower Growth */}
        <div style={{ ...card }}>
          <ChartHead
            title="Croissance abonnés"
            sub="Évolution sur les 30 derniers jours"
            right={
              <div style={{ display: "flex", gap: 10 }}>
                {igData && <Dot color="#e1306c" label="Instagram" />}
              </div>
            }
          />
          {!hasFollowerData
            ? <div style={{ textAlign:"center", padding:"50px 0", color:"#cbd5e1", fontSize:12 }}>Aucune donnée de croissance</div>
            : <ResponsiveContainer width="100%" height={190}>
                <AreaChart data={followerGrowthData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gFolIg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#e1306c" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#e1306c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                    interval={Math.floor(followerGrowthData.length / 5)} />
                  <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                    tickFormatter={v => fmtNum(v)} domain={["auto", "auto"]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="ig" name="Instagram" stroke="#e1306c" strokeWidth={2}
                    fill="url(#gFolIg)" dot={false} activeDot={{ r: 4, fill: "#e1306c" }} connectNulls />
                </AreaChart>
              </ResponsiveContainer>
          }
        </div>

        {/* Posts per platform */}
        <div style={{ ...card }}>
          <ChartHead title="Posts par plateforme" sub="Répartition du contenu créé" />
          {platDistData.length === 0
            ? <div style={{ textAlign:"center", padding:"50px 0", color:"#cbd5e1", fontSize:12 }}>Aucun post</div>
            : <ResponsiveContainer width="100%" height={190}>
                <BarChart data={platDistData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                  <XAxis dataKey="platform" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Posts" radius={[6, 6, 0, 0]}>
                    {platDistData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
          }
        </div>
      </div>

      {/* ── 7. Calendar + Santé du contenu + Pipeline ───────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, alignItems: "stretch" }}>
        <PostActivityCalendar posts={posts} />

        {/* Santé du contenu — Body Rings */}
        <div style={{ ...card, padding: "20px 20px 20px" }}>
          <ChartHead title="Santé du contenu" sub="Indicateurs clés de qualité" />
          <BodyRings metrics={[
            { label: "Taux de publication", score: publishRate,  max: 100, unit: "pts", color: "#dc2626" },
            { label: "Posts avec caption",  score: captionRate,  max: 100, unit: "%",   color: "#0f172a" },
            { label: "Posts avec visuel",   score: imageRate,    max: 100, unit: "%",   color: "#10b981" },
            { label: "Posts planifiés",     score: scheduleRate, max: 100, unit: "%",   color: "#94a3b8" },
          ]} />
        </div>

        {/* AI Recommendations */}
        <Airecommendations posts={posts} igData={igData} fbData={fbData} token={token} />
      </div>
    </div>
  );
}

// ── Platform icons (SVG — flat icon style, no background) ────────────────────
const PlatformIcon = {
  Instagram: () => (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
      <defs>
        <linearGradient id="pi-ig-ln" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
          <stop stopColor="#feda75"/>
          <stop offset="0.25" stopColor="#fa7e1e"/>
          <stop offset="0.55" stopColor="#d62976"/>
          <stop offset="1"    stopColor="#4f5bd5"/>
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="6" stroke="url(#pi-ig-ln)" strokeWidth="2"/>
      <circle cx="12" cy="12" r="4.5" stroke="url(#pi-ig-ln)" strokeWidth="2"/>
      <circle cx="17.5" cy="6.5" r="1.3" fill="#d62976"/>
    </svg>
  ),
  Facebook: () => (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="#1877f2">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
    </svg>
  ),
  LinkedIn: () => (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="#0077b5">
      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4V9h4v1.5A6 6 0 0116 8z"/>
      <rect x="2" y="9" width="4" height="12"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>
  ),
  TikTok: () => (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="#010101">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05A6.34 6.34 0 003.15 15.3a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.97a8.16 8.16 0 004.77 1.52V8.04a4.85 4.85 0 01-1-.35z"/>
    </svg>
  ),
};

// ── Platform card (pretty) ────────────────────────────────────────────────────
function PlatformRow({ color, name, metrics, notConnected }: {
  color: string; name: keyof typeof PlatformIcon;
  metrics: { label: string; value: string }[];
  notConnected?: boolean;
}) {
  const Icon = PlatformIcon[name];
  return (
    <div style={{ borderRadius: 16, border: `1.5px solid ${notConnected ? "#f0f0f5" : "#f0f0f5"}`,
      overflow: "hidden", background: notConnected ? "#fafafa" : "#fff",
      opacity: notConnected ? 0.7 : 1, transition: "box-shadow .15s" }}>
      {/* header strip */}
      <div style={{ background: notConnected ? "#f4f5f7" : color + "0f", padding: "12px 14px",
        display: "flex", alignItems: "center", gap: 10,
        borderBottom: `1.5px solid ${notConnected ? "#ebebf0" : color + "18"}` }}>
        <Icon />
        <span style={{ fontSize: 13, fontWeight: 400, color: notConnected ? "#94a3b8" : "#0f172a" }}>{name}</span>
        {notConnected ? (
          <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, padding: "2px 8px",
            borderRadius: 20, background: "#f1f5f9", color: "#94a3b8",
            textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Non connecté
          </span>
        ) : (
          <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%",
            background: "#10b981", boxShadow: "0 0 0 3px #dcfce7" }} />
        )}
      </div>
      {/* metrics */}
      <div style={{ display: "flex", padding: "12px 14px", gap: 0 }}>
        {metrics.map((m, i) => (
          <div key={m.label} style={{ flex: 1, textAlign: "center",
            borderLeft: i > 0 ? "1px solid #f0f0f5" : "none" }}>
            <div style={{ fontSize: 15, fontWeight: 400, color: notConnected ? "#cbd5e1" : "#0f172a" }}>{m.value}</div>
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
