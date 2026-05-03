// Analytics/analyticsHelpers.ts

export const API = "https://localhost:7079";

export const PLATFORM_META: Record<string, { color: string; icon: string; label: string }> = {
  instagram: { color: "#e1306c", icon: "instagram", label: "Instagram" },
  linkedin:  { color: "#0077b5", icon: "linkedin",  label: "LinkedIn"  },
  twitter:   { color: "#000000", icon: "twitter",   label: "Twitter/X" },
  facebook:  { color: "#1877f2", icon: "facebook",  label: "Facebook"  },
  tiktok:    { color: "#ff0050", icon: "tiktok",    label: "TikTok"    },
  threads:   { color: "#000000", icon: "threads",   label: "Threads"   },
};

export const STATUS_COLOR: Record<string, string> = {
  published: "#10b981", scheduled: "#8b5cf6",
  draft: "#94a3b8", inreview: "#f59e0b",
  approved: "#06b6d4", failed: "#ef4444",
};

export const ENGAGEMENT_MULTIPLIERS: Record<string, number> = {
  instagram: 1.4, tiktok: 1.8, facebook: 1.1,
  twitter: 0.9, linkedin: 1.2, threads: 0.7,
};

export const normalizePlatforms = (raw: unknown): string[] => {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") {
    try { const p = JSON.parse(raw); if (Array.isArray(p)) return p; } catch {}
    return raw.split(",").map(s => s.trim()).filter(Boolean);
  }
  return [];
};

export function getMonthLabel(offset: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - offset);
  return d.toLocaleString("en-US", { month: "short" });
}

export function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
  catch { return iso; }
}

export function fmtNum(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000)    return (n / 1000).toFixed(1)    + "K";
  return String(n);
}