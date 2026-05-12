import { cn } from "@/lib/utils";
import React from "react";
import {
  FaInstagram, FaYoutube, FaFacebook, FaLinkedinIn,
  FaTelegramPlane, FaSnapchatGhost,
} from "react-icons/fa";
import { FaXTwitter, FaTiktok } from "react-icons/fa6";

// SVG viewBox is "0 0 200 100"
// CSS overlay: left = (cx/200*100)%, top = (cy/100*100)%
const IG_BG = "radial-gradient(circle at 30% 107%, #fdf497 0%, #fd5949 45%, #d6249f 60%, #285AEB 90%)";

const NODES = [
  { name: "Instagram", Icon: FaInstagram,     bg: IG_BG,     color: "#fff", cx: 10,   cy: 20 },
  { name: "Facebook",  Icon: FaFacebook,      bg: "#1877F2", color: "#fff", cx: 180,  cy: 10 },
  { name: "YouTube",   Icon: FaYoutube,       bg: "#FF0000", color: "#fff", cx: 130,  cy: 20 },
  { name: "LinkedIn",  Icon: FaLinkedinIn,    bg: "#0A66C2", color: "#fff", cx: 170,  cy: 80 },
  { name: "Telegram",  Icon: FaTelegramPlane, bg: "#229ED9", color: "#fff", cx: 135,  cy: 65 },
  { name: "Twitter",   Icon: FaXTwitter,      bg: "#111111", color: "#fff", cx: 94.8, cy: 95 },
  { name: "Snapchat",  Icon: FaSnapchatGhost, bg: "#FFFC00", color: "#000", cx: 88,   cy: 88 },
  { name: "TikTok",    Icon: FaTiktok,        bg: "#111111", color: "#fff", cx: 30,   cy: 30 },
];

export interface SocialHubCircuitProps {
  className?: string;
  showConnections?: boolean;
  animateLines?: boolean;
  animateMarkers?: boolean;
}

export function SocialHubCircuit({
  className,
  showConnections = true,
  animateLines = true,
  animateMarkers = true,
}: SocialHubCircuitProps) {
  return (
    <div className={cn("w-full", className)}>

      {/* ── Desktop: circuit diagram ── */}
      <div className="relative hidden md:block w-full" style={{ paddingBottom: "50%" }}>

        {/* Dot-grid background */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: "radial-gradient(circle, #fce7ef 1.2px, transparent 1.2px)",
            backgroundSize: "22px 22px",
          }} />
          <div className="absolute inset-0" style={{
            background: "radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.96) 5%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0.06) 100%)",
          }} />
        </div>

        {/* SVG: paths + animated light orbs */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 200 100"
          preserveAspectRatio="xMidYMid meet"
          style={{ color: "#fce7ef" }}
        >
          {/* ── Paths ── */}
          <g
            stroke="currentColor"
            fill="none"
            strokeWidth="0.3"
            strokeDasharray="100 100"
            pathLength="100"
            markerStart="url(#sh-circle-marker)"
          >
            {/* 1 – Instagram  (top-left → left side of hub) */}
            <path strokeDasharray="100 100" pathLength="100"
              d="M 10 20 h 79.5 q 5 0 5 5 v 30" />
            {/* 2 – Facebook   (top-right → right side of hub) */}
            <path strokeDasharray="100 100" pathLength="100"
              d="M 180 10 h -69.7 q -5 0 -5 5 v 30" />
            {/* 3 – YouTube    (upper-right → top of hub) */}
            <path d="M 130 20 v 21.8 q 0 5 -5 5 h -10" />
            {/* 4 – LinkedIn   (lower-right → right of hub) */}
            <path d="M 170 80 v -21.8 q 0 -5 -5 -5 h -50" />
            {/* 5 – Telegram   (loop bottom-right → bottom of hub) */}
            <path strokeDasharray="100 100" pathLength="100"
              d="M 135 65 h 15 q 5 0 5 5 v 10 q 0 5 -5 5 h -39.8 q -5 0 -5 -5 v -20" />
            {/* 6 – Twitter    (bottom-center → bottom of hub) */}
            <path d="M 94.8 95 v -36" />
            {/* 7 – Snapchat   (bottom-left → left of hub) */}
            <path d="M 88 88 v -15 q 0 -5 -5 -5 h -10 q -5 0 -5 -5 v -5 q 0 -5 5 -5 h 14" />
            {/* 8 – TikTok     (left → left side of hub) */}
            <path d="M 30 30 h 25 q 5 0 5 5 v 6.5 q 0 5 5 5 h 20" />

            {animateLines && (
              <animate
                attributeName="stroke-dashoffset"
                from="100" to="0" dur="1s" fill="freeze"
                calcMode="spline" keySplines="0.25,0.1,0.5,1" keyTimes="0; 1"
              />
            )}
          </g>

          {/* ── Colored light orbs (masked to their path) ── */}
          <g mask="url(#sh-mask-1)">
            <circle className="social-hub social-line-1" cx="0" cy="0" r="8" fill="url(#sh-ig-grad)" />
          </g>
          <g mask="url(#sh-mask-2)">
            <circle className="social-hub social-line-2" cx="0" cy="0" r="8" fill="url(#sh-fb-grad)" />
          </g>
          <g mask="url(#sh-mask-3)">
            <circle className="social-hub social-line-3" cx="0" cy="0" r="8" fill="url(#sh-yt-grad)" />
          </g>
          <g mask="url(#sh-mask-4)">
            <circle className="social-hub social-line-4" cx="0" cy="0" r="8" fill="url(#sh-li-grad)" />
          </g>
          <g mask="url(#sh-mask-5)">
            <circle className="social-hub social-line-5" cx="0" cy="0" r="8" fill="url(#sh-tg-grad)" />
          </g>
          <g mask="url(#sh-mask-6)">
            <circle className="social-hub social-line-6" cx="0" cy="0" r="8" fill="url(#sh-tw-grad)" />
          </g>
          <g mask="url(#sh-mask-7)">
            <circle className="social-hub social-line-7" cx="0" cy="0" r="8" fill="url(#sh-sc-grad)" />
          </g>
          <g mask="url(#sh-mask-8)">
            <circle className="social-hub social-line-8" cx="0" cy="0" r="8" fill="url(#sh-tt-grad)" />
          </g>

          {/* ── Center hub box ── */}
          {showConnections && (
            <g fill="url(#sh-pin-grad)">
              <rect x="93"    y="37"    width="2.5" height="5" rx="0.7" />
              <rect x="104"   y="37"    width="2.5" height="5" rx="0.7" />
              <rect x="116.3" y="44"    width="2.5" height="5" rx="0.7" transform="rotate(90 116.25 45.5)" />
              <rect x="122.8" y="44"    width="2.5" height="5" rx="0.7" transform="rotate(90 116.25 45.5)" />
              <rect x="104"   y="16"    width="2.5" height="5" rx="0.7" transform="rotate(180 105.25 39.5)" />
              <rect x="114.5" y="16"    width="2.5" height="5" rx="0.7" transform="rotate(180 105.25 39.5)" />
              <rect x="80"    y="-13.6" width="2.5" height="5" rx="0.7" transform="rotate(270 115.25 19.5)" />
              <rect x="87"    y="-13.6" width="2.5" height="5" rx="0.7" transform="rotate(270 115.25 19.5)" />
            </g>
          )}

          {/* Box body */}
          <rect x="85" y="40" width="30" height="20" rx="2"
            fill="#1a0a10" filter="url(#sh-glow)" />
          <rect x="85" y="40" width="30" height="20" rx="2"
            fill="none" stroke="#e65787" strokeWidth="0.45" strokeOpacity="0.75" />
          <text x="91.5" y="53" fontSize="6.5" fill="url(#sh-text-grad)"
            fontWeight="700" letterSpacing="0.08em">AUTO</text>

          <defs>
            {/* ── Masks (slightly extended so light enters the hub) ── */}
            <mask id="sh-mask-1">
              <path d="M 10 20 h 79.5 q 5 0 5 5 v 24"    strokeWidth="0.5" stroke="white" />
            </mask>
            <mask id="sh-mask-2">
              <path d="M 180 10 h -69.7 q -5 0 -5 5 v 24" strokeWidth="0.5" stroke="white" />
            </mask>
            <mask id="sh-mask-3">
              <path d="M 130 20 v 21.8 q 0 5 -5 5 h -25"  strokeWidth="0.5" stroke="white" />
            </mask>
            <mask id="sh-mask-4">
              <path d="M 170 80 v -21.8 q 0 -5 -5 -5 h -65" strokeWidth="0.5" stroke="white" />
            </mask>
            <mask id="sh-mask-5">
              <path d="M 135 65 h 15 q 5 0 5 5 v 10 q 0 5 -5 5 h -39.8 q -5 0 -5 -5 v -35"
                strokeWidth="0.5" stroke="white" />
            </mask>
            <mask id="sh-mask-6">
              <path d="M 94.8 95 v -46"                    strokeWidth="0.5" stroke="white" />
            </mask>
            <mask id="sh-mask-7">
              <path d="M 88 88 v -15 q 0 -5 -5 -5 h -10 q -5 0 -5 -5 v -5 q 0 -5 5 -5 h 28"
                strokeWidth="0.5" stroke="white" />
            </mask>
            <mask id="sh-mask-8">
              <path d="M 30 30 h 25 q 5 0 5 5 v 6.5 q 0 5 5 5 h 35" strokeWidth="0.5" stroke="white" />
            </mask>

            {/* ── Brand-colored radial gradients ── */}
            <radialGradient id="sh-ig-grad" fx="1">
              <stop offset="0%"   stopColor="#fdf497" />
              <stop offset="45%"  stopColor="#fd5949" />
              <stop offset="70%"  stopColor="#d6249f" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <radialGradient id="sh-fb-grad" fx="1">
              <stop offset="0%"   stopColor="#74b3fe" />
              <stop offset="55%"  stopColor="#1877F2" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <radialGradient id="sh-yt-grad" fx="1">
              <stop offset="0%"   stopColor="#ff8080" />
              <stop offset="55%"  stopColor="#FF0000" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <radialGradient id="sh-li-grad" fx="1">
              <stop offset="0%"   stopColor="#60aee8" />
              <stop offset="55%"  stopColor="#0A66C2" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <radialGradient id="sh-tg-grad" fx="1">
              <stop offset="0%"   stopColor="#7dd8f5" />
              <stop offset="55%"  stopColor="#229ED9" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <radialGradient id="sh-tw-grad" fx="1">
              <stop offset="0%"   stopColor="#cccccc" />
              <stop offset="55%"  stopColor="#666666" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <radialGradient id="sh-sc-grad" fx="1">
              <stop offset="0%"   stopColor="#ffffff" />
              <stop offset="55%"  stopColor="#FFFC00" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <radialGradient id="sh-tt-grad" fx="1">
              <stop offset="0%"   stopColor="#ff9fc3" />
              <stop offset="55%"  stopColor="#EE1D52" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>

            {/* ── Hub glow filter ── */}
            <filter id="sh-glow" x="-80%" y="-80%" width="260%" height="260%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5"
                floodColor="#e65787" floodOpacity="0.5" />
            </filter>

            {/* ── Dot marker at path start ── */}
            <marker id="sh-circle-marker" viewBox="0 0 10 10"
              refX="5" refY="5" markerWidth="18" markerHeight="18">
              <circle cx="5" cy="5" r="2" fill="#1a0a10" stroke="#e65787" strokeWidth="0.5">
                {animateMarkers && (
                  <animate attributeName="r" values="0; 3; 2" dur="0.5s" />
                )}
              </circle>
            </marker>

            {/* ── Pin connector gradient ── */}
            <linearGradient id="sh-pin-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="#6b3040" />
              <stop offset="60%" stopColor="#2d1020" />
            </linearGradient>

            {/* ── Shimmer text gradient on hub label ── */}
            <linearGradient id="sh-text-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#888888">
                <animate attributeName="offset" values="-2;-1;0" dur="5s"
                  repeatCount="indefinite" calcMode="spline"
                  keyTimes="0;0.5;1" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" />
              </stop>
              <stop offset="25%" stopColor="white">
                <animate attributeName="offset" values="-1;0;1" dur="5s"
                  repeatCount="indefinite" calcMode="spline"
                  keyTimes="0;0.5;1" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" />
              </stop>
              <stop offset="50%" stopColor="#888888">
                <animate attributeName="offset" values="0;1;2" dur="5s"
                  repeatCount="indefinite" calcMode="spline"
                  keyTimes="0;0.5;1" keySplines="0.4 0 0.2 1;0.4 0 0.2 1" />
              </stop>
            </linearGradient>
          </defs>
        </svg>

        {/* ── Platform icon overlays (HTML over SVG) ── */}
        {NODES.map((node, i) => {
          const left = `${(node.cx / 200) * 100}%`;
          const top  = `${(node.cy / 100) * 100}%`;
          return (
            <div key={i}
              className="absolute flex flex-col items-center gap-1 pointer-events-none select-none"
              style={{ left, top, transform: "translate(-50%, -50%)" }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: node.bg,
                  color: node.color,
                  boxShadow: "0 0 0 2.5px rgba(255,255,255,0.95), 0 4px 14px rgba(0,0,0,0.15)",
                }}
              >
                <node.Icon size={15} />
              </div>
              <span className="text-[9px] font-semibold whitespace-nowrap" style={{ color: "#94a3b8" }}>
                {node.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Mobile: 4-column icon grid ── */}
      <div className="md:hidden grid grid-cols-4 gap-5 px-2 py-4">
        {NODES.map((node, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                background: node.bg,
                color: node.color,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                border: "2px solid rgba(255,255,255,0.9)",
              }}>
              <node.Icon size={20} />
            </div>
            <span className="text-[10px] font-medium text-center leading-tight"
              style={{ color: "#64748b" }}>
              {node.name}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}
