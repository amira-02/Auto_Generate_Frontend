// Analytics/SocialIcons.tsx

const LOGOS: Record<string, string> = {
  instagram: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg",
  facebook:  "https://upload.wikimedia.org/wikipedia/commons/b/b9/2023_Facebook_icon.svg",
  linkedin:  "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/linkedin.svg",
  tiktok:    "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/tiktok.svg",
  twitter:   "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/x.svg",
  threads:   "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/threads.svg",
};

export function PlatformIcon({ platform, size = 24 }: { platform: string; size?: number }) {
  const src = LOGOS[platform.toLowerCase()];
  if (!src) return <span style={{ fontSize: size * 0.7 }}>🌐</span>;
  return <img src={src} alt={platform} width={size} height={size} style={{ borderRadius: 6, display: "block" }} />;
}