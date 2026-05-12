import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import AboutUs from "../HomeSection/AboutUs";
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const INJECTED_STYLES = `
  .gsap-reveal { visibility: hidden; }

  .film-grain {
      position: absolute; inset: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 50; opacity: 0.03; mix-blend-mode: overlay;
      background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noiseFilter)"/></svg>');
  }

  .bg-grid-theme {
      background-size: 60px 60px;
      background-image:
          linear-gradient(to right, color-mix(in srgb, var(--color-foreground) 4%, transparent) 1px, transparent 1px),
          linear-gradient(to bottom, color-mix(in srgb, var(--color-foreground) 4%, transparent) 1px, transparent 1px);
      mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
      -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  }

  /* Hero text outside the card — dark on white */
  .text-3d-matte {
      color: #0f172a;
      text-shadow:
          0 10px 30px rgba(230,87,135,0.12),
          0 2px 4px rgba(0,0,0,0.06);
  }

  .text-silver-matte {
      background: linear-gradient(128deg, #e65787 0%, #e65787 50%, #ed8faf 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      transform: translateZ(0);
      filter:
          drop-shadow(0px 8px 16px rgba(230,87,135,0.25))
          drop-shadow(0px 2px 4px rgba(230,87,135,0.12));
  }

  /* Brand name inside the light card — indigo gradient */
  .text-card-brand {
      background: linear-gradient(160deg, #7a1d3e 0%, #d94470 50%, #e65787 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      transform: translateZ(0);
      filter:
          drop-shadow(0px 4px 10px rgba(230,87,135,0.2))
          drop-shadow(0px 1px 3px rgba(230,87,135,0.10));
  }

  /* Light premium card — white / very light indigo */
  .premium-depth-card {
      background: linear-gradient(145deg, #ffffff 0%, #fff1f3 100%);
      box-shadow:
          0 60px 120px -20px rgba(230, 87, 135, 0.18),
          0 25px 50px -15px rgba(230, 87, 135, 0.10),
          inset 0 1px 2px rgba(255, 255, 255, 1),
          inset 0 -2px 4px rgba(230, 87, 135, 0.04);
      border: 1px solid rgba(230, 87, 135, 0.12);
      position: relative;
  }

  /* Mouse-tracking sheen — soft indigo tint */
  .card-sheen {
      position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 50;
      background: radial-gradient(700px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(230,87,135,0.07) 0%, transparent 40%);
      mix-blend-mode: multiply; transition: opacity 0.3s ease;
  }

  /* iPhone hardware */
  .iphone-bezel {
      background-color: #111;
      box-shadow:
          inset 0 0 0 2px #52525B,
          inset 0 0 0 7px #000,
          0 40px 80px -15px rgba(0,0,0,0.5),
          0 15px 25px -5px rgba(0,0,0,0.3);
      transform-style: preserve-3d;
  }

  .hardware-btn {
      background: linear-gradient(90deg, #404040 0%, #171717 100%);
      box-shadow:
          -2px 0 5px rgba(0,0,0,0.8),
          inset -1px 0 1px rgba(255,255,255,0.15),
          inset 1px 0 2px rgba(0,0,0,0.8);
      border-left: 1px solid rgba(255,255,255,0.05);
  }

  .screen-glare {
      background: linear-gradient(110deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 45%);
  }

  .widget-depth {
      background: linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%);
      box-shadow:
          0 10px 20px rgba(0,0,0,0.3),
          inset 0 1px 1px rgba(255,255,255,0.05),
          inset 0 -1px 1px rgba(0,0,0,0.5);
      border: 1px solid rgba(255,255,255,0.03);
  }

  /* Light glassmorphism floating badges */
  .floating-ui-badge {
      background: rgba(255, 255, 255, 0.88);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      box-shadow:
          0 0 0 1px rgba(230, 87, 135, 0.10),
          0 20px 40px -10px rgba(230, 87, 135, 0.14),
          inset 0 1px 1px rgba(255,255,255,1),
          inset 0 -1px 1px rgba(230,87,135,0.04);
  }

  /* Tactile buttons */
  .btn-modern-primary {
      transition: all 0.35s cubic-bezier(0.25, 1, 0.5, 1);
      background: linear-gradient(180deg, #e65787 0%, #d94470 100%);
      color: #ffffff;
      box-shadow:
          0 0 0 1px rgba(230,87,135,0.2),
          0 2px 4px rgba(230,87,135,0.3),
          0 12px 24px -4px rgba(230,87,135,0.5),
          inset 0 1px 1px rgba(255,255,255,0.25),
          inset 0 -3px 6px rgba(0,0,0,0.15);
  }
  .btn-modern-primary:hover {
      transform: translateY(-3px);
      background: linear-gradient(180deg, #ed8faf 0%, #e65787 100%);
      box-shadow:
          0 0 0 1px rgba(230,87,135,0.25),
          0 6px 12px -2px rgba(230,87,135,0.35),
          0 20px 32px -6px rgba(230,87,135,0.6),
          inset 0 1px 1px rgba(255,255,255,0.3),
          inset 0 -3px 6px rgba(0,0,0,0.15);
  }
  .btn-modern-primary:active {
      transform: translateY(1px);
      box-shadow: 0 0 0 1px rgba(230,87,135,0.3), inset 0 3px 6px rgba(0,0,0,0.2);
  }

  .btn-modern-secondary {
      transition: all 0.35s cubic-bezier(0.25, 1, 0.5, 1);
      background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
      color: #0f172a;
      box-shadow:
          0 0 0 1px rgba(0,0,0,0.06),
          0 2px 4px rgba(0,0,0,0.06),
          0 12px 24px -4px rgba(0,0,0,0.12),
          inset 0 1px 1px rgba(255,255,255,1),
          inset 0 -3px 6px rgba(0,0,0,0.04);
  }
  .btn-modern-secondary:hover {
      transform: translateY(-3px);
      box-shadow:
          0 0 0 1px rgba(230,87,135,0.12),
          0 6px 12px -2px rgba(0,0,0,0.10),
          0 20px 32px -6px rgba(0,0,0,0.18),
          inset 0 1px 1px rgba(255,255,255,1),
          inset 0 -3px 6px rgba(0,0,0,0.04);
  }
  .btn-modern-secondary:active {
      transform: translateY(1px);
      background: #f1f5f9;
      box-shadow: 0 0 0 1px rgba(0,0,0,0.08), inset 0 3px 6px rgba(0,0,0,0.06);
  }

  .progress-ring {
      transform: rotate(-90deg);
      transform-origin: center;
      stroke-dasharray: 402;
      stroke-dashoffset: 402;
      stroke-linecap: round;
  }
`;

// ── FloatingPaths ─────────────────────────────────────────────────────────────
function FloatingPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position} -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${152 - i * 5 * position} ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${684 - i * 5 * position} ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    opacity: 0.03 + i * 0.012,
    width:   0.35 + i * 0.022,
  }));
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <svg className="w-full h-full" viewBox="0 0 696 316" fill="none">
        {paths.map((p) => (
          <motion.path
            key={p.id}
            d={p.d}
            stroke="rgba(230,87,135,1)"
            strokeWidth={p.width}
            strokeOpacity={p.opacity}
            initial={{ pathLength: 0.2, opacity: 0 }}
            animate={{ pathLength: 1, opacity: [0, p.opacity * 3, p.opacity], pathOffset: [0, 1, 0] }}
            transition={{ duration: 18 + p.id * 0.6, repeat: Infinity, ease: "linear" }}
          />
        ))}
      </svg>
    </div>
  );
}

// ── AnimatedTagline ────────────────────────────────────────────────────────────
function AnimatedTagline({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  return (
    <h1 className={className}>
      {text.split(" ").map((word, wi) => (
        <span key={wi} className="inline-block mr-[0.28em] last:mr-0">
          {word.split("").map((letter, li) => (
            <motion.span
              key={`${wi}-${li}`}
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: delay + wi * 0.08 + li * 0.03, type: "spring", stiffness: 160, damping: 22 }}
              className="inline-block"
            >
              {letter}
            </motion.span>
          ))}
        </span>
      ))}
    </h1>
  );
}

export interface CinematicHeroProps extends React.HTMLAttributes<HTMLDivElement> {
  tagline1?: string;
  tagline2?: string;
  brandName?: React.ReactNode;
  cardHeading?: string;
  cardDescription?: React.ReactNode;
  metricValue?: number;
  metricLabel?: string;
}

export function CinematicHero({
  tagline1 = "Create content that",
  tagline2 = "actually converts.",
  brandName = <>Auto<br />Generate</>,
  cardHeading = "AI-powered social media.",
  cardDescription = (
    <>
      <span className="font-semibold" style={{ color: "#e65787" }}>AutoGenerate</span>{" "}
      writes, schedules, and analyzes your content across every platform — so you focus on what matters.
    </>
  ),
  metricValue = 2000000,
  metricLabel = "Posts Generated",
  className,
  ...props
}: CinematicHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCardRef  = useRef<HTMLDivElement>(null);
  const requestRef   = useRef<number>(0);

  // Mouse sheen only (no 3D rotation — cheaper)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!mainCardRef.current || window.scrollY > window.innerHeight) return;
      cancelAnimationFrame(requestRef.current);
      requestRef.current = requestAnimationFrame(() => {
        if (!mainCardRef.current) return;
        const rect = mainCardRef.current.getBoundingClientRect();
        mainCardRef.current.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
        mainCardRef.current.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
      });
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => { window.removeEventListener("mousemove", handleMouseMove); cancelAnimationFrame(requestRef.current); };
  }, []);

  // Cinematic scroll timeline
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(".main-card",   { y: window.innerHeight + 150, autoAlpha: 1 });
      gsap.set([".card-left-text", ".card-right-text", ".mockup-scroll-wrapper", ".floating-badge", ".phone-widget"], { autoAlpha: 0 });

      // Scroll-driven timeline — 3000px instead of 7000px, no blur filters
      gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=3000",
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
        },
      })
        .to(".hero-text-wrapper", { opacity: 0, y: -30, ease: "power2.in", duration: 1 }, 0)
        .to(".main-card", { y: 0, ease: "power3.inOut", duration: 2 }, 0)
        .to(".main-card", { width: "100%", height: "100%", borderRadius: "0px", ease: "power3.inOut", duration: 1.5 })
        .fromTo(".mockup-scroll-wrapper",
          { y: 60, autoAlpha: 0, scale: 0.92 },
          { y: 0, autoAlpha: 1, scale: 1, ease: "power2.out", duration: 1.5 }, "-=0.8"
        )
        .fromTo(".phone-widget",   { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.1, ease: "power2.out", duration: 1 }, "-=1.0")
        .to(".progress-ring",      { strokeDashoffset: 60, duration: 1.5, ease: "power3.inOut" }, "-=0.8")
        .to(".counter-val",        { innerHTML: metricValue, snap: { innerHTML: 1 }, duration: 1.5, ease: "expo.out" }, "-=1.5")
        .fromTo(".floating-badge", { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.15, ease: "power2.out", duration: 1 }, "-=1.2")
        .fromTo(".card-left-text", { x: -30, autoAlpha: 0 }, { x: 0, autoAlpha: 1, ease: "power3.out", duration: 1 }, "-=0.8")
        .fromTo(".card-right-text",{ x: 30, autoAlpha: 0 }, { x: 0, autoAlpha: 1, ease: "power3.out", duration: 1 }, "<")
        .to([".mockup-scroll-wrapper", ".floating-badge", ".card-left-text", ".card-right-text"], {
          y: -30, autoAlpha: 0, ease: "power2.in", duration: 0.8, stagger: 0.04,
        })
        .to(".main-card", { y: -window.innerHeight - 200, ease: "power3.in", duration: 1 });
    }, containerRef);

    return () => ctx.revert();
  }, [metricValue]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-screen h-screen overflow-hidden flex items-center justify-center bg-background text-foreground font-sans antialiased",
        className
      )}
      style={{ perspective: "1500px" }}
      {...props}
    >
      <style dangerouslySetInnerHTML={{ __html: INJECTED_STYLES }} />
      <div className="film-grain" aria-hidden="true" />
      <div className="bg-grid-theme absolute inset-0 z-0 pointer-events-none opacity-60" aria-hidden="true" />

      {/* ── Ambient orbs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="absolute rounded-full blur-3xl opacity-30"
          style={{ width: 500, height: 500, background: "rgba(230,87,135,0.15)", top: "-80px", right: "-60px" }} />
        <div className="absolute rounded-full blur-3xl opacity-20"
          style={{ width: 420, height: 420, background: "rgba(237,143,175,0.12)", bottom: 0, left: "-80px" }} />
        <div className="absolute rounded-full blur-3xl opacity-15"
          style={{ width: 280, height: 280, background: "rgba(237,143,175,0.10)", top: "30%", right: "20%" }} />
      </div>

      {/* ── Layer 1: Hero taglines ── */}
      <div className="hero-text-wrapper absolute inset-0 z-10 w-screen h-screen overflow-auto will-change-transform">
        <AboutUs />
      </div>

      {/* ── Layer 2: Light card ── */}
      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none" style={{ perspective: "1500px" }}>
        <div
          ref={mainCardRef}
          className="main-card premium-depth-card relative overflow-hidden gsap-reveal flex items-center justify-center pointer-events-auto w-[92vw] md:w-[85vw] h-[92vh] md:h-[85vh] rounded-[32px] md:rounded-[40px]"
        >
          <div className="card-sheen" aria-hidden="true" />

          {/* Subtle indigo gradient accent top-right */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none"
            style={{ background: "rgba(230,87,135,0.08)", transform: "translate(30%, -30%)" }} aria-hidden="true" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl pointer-events-none"
            style={{ background: "rgba(237,143,175,0.06)", transform: "translate(-30%, 30%)" }} aria-hidden="true" />

          <div className="relative w-full h-full max-w-7xl mx-auto px-4 lg:px-12 flex flex-col justify-evenly lg:grid lg:grid-cols-3 items-center lg:gap-8 z-10 py-6 lg:py-0">

            {/* Right column: Brand name */}
            <div className="card-right-text gsap-reveal order-1 lg:order-3 flex justify-center lg:justify-end z-20 w-full">
              <h3
                style={{ fontFamily: '"Poppins", sans-serif', fontWeight: 900 }}
                className="text-card-brand text-4xl md:text-5xl lg:text-6xl  tracking-tighter leading-none text-right"
              >
                {brandName}
              </h3>
            </div>  

            {/* Center column: iPhone mockup */}
            <div className="mockup-scroll-wrapper order-2 lg:order-2 relative w-full h-[380px] lg:h-[600px] flex items-center justify-center z-10" style={{ perspective: "1000px" }}>
              <div className="relative w-full h-full flex items-center justify-center transform scale-[0.65] md:scale-[0.85] lg:scale-100">

                <div className="relative w-[280px] h-[580px] rounded-[3rem] iphone-bezel flex flex-col">
                  {/* Hardware buttons */}
                  <div className="absolute top-[120px] -left-[3px] w-[3px] h-[25px] hardware-btn rounded-l-md z-0" aria-hidden="true" />
                  <div className="absolute top-[160px] -left-[3px] w-[3px] h-[45px] hardware-btn rounded-l-md z-0" aria-hidden="true" />
                  <div className="absolute top-[220px] -left-[3px] w-[3px] h-[45px] hardware-btn rounded-l-md z-0" aria-hidden="true" />
                  <div className="absolute top-[170px] -right-[3px] w-[3px] h-[70px] hardware-btn rounded-r-md z-0 scale-x-[-1]" aria-hidden="true" />

                  {/* Screen */}
                  <div className="absolute inset-[7px] bg-[#050914] rounded-[2.5rem] overflow-hidden text-white z-10"
                    style={{ boxShadow: "inset 0 0 15px rgba(0,0,0,1)" }}>
                    <div className="absolute inset-0 screen-glare z-40 pointer-events-none" aria-hidden="true" />

                    {/* Dynamic Island */}
                    <div className="absolute top-[5px] left-1/2 -translate-x-1/2 w-[100px] h-[28px] bg-black rounded-full z-50 flex items-center justify-end px-3"
                      style={{ boxShadow: "inset 0 -1px 2px rgba(255,255,255,0.1)" }}>
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"
                        style={{ boxShadow: "0 0 8px rgba(34,197,94,0.8)" }} />
                    </div>

                    {/* App UI */}
                    <div className="relative w-full h-full pt-12 px-5 pb-8 flex flex-col">
                      <div className="phone-widget flex justify-between items-center mb-8">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold mb-1">Dashboard</span>
                          <span className="text-xl font-bold tracking-tight text-white">AutoGenerate</span>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-white/5 text-neutral-200 flex items-center justify-center font-bold text-sm border border-white/10">AG</div>
                      </div>

                      <div className="phone-widget relative w-44 h-44 mx-auto flex items-center justify-center mb-8"
                        style={{ filter: "drop-shadow(0 15px 25px rgba(0,0,0,0.7))" }}>
                        <svg className="absolute inset-0 w-full h-full" aria-hidden="true">
                          <circle cx="88" cy="88" r="64" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="12" />
                          <circle className="progress-ring" cx="88" cy="88" r="64" fill="none" stroke="#e65787" strokeWidth="12" />
                        </svg>
                        <div className="text-center z-10 flex flex-col items-center">
                          <span className="counter-val text-4xl font-extrabold tracking-tighter text-white">0</span>
                          <span className="text-[8px] text-pink-300/60 uppercase tracking-[0.1em] font-bold mt-0.5">{metricLabel}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="phone-widget widget-depth rounded-2xl p-3 flex items-center">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-600/5 flex items-center justify-center mr-3 border border-pink-400/20 shadow-inner">
                            <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="h-2 w-20 bg-white/20 rounded-full mb-2" />
                            <div className="h-1.5 w-12 bg-white/10 rounded-full" />
                          </div>
                        </div>
                        <div className="phone-widget widget-depth rounded-2xl p-3 flex items-center">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 flex items-center justify-center mr-3 border border-emerald-400/20 shadow-inner">
                            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="h-2 w-16 bg-white/20 rounded-full mb-2" />
                            <div className="h-1.5 w-24 bg-white/10 rounded-full" />
                          </div>
                        </div>
                      </div>

                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[120px] h-[4px] bg-white/20 rounded-full"
                        style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.5)" }} />
                    </div>
                  </div>
                </div>

                {/* Floating badge — top left */}
                <div className="floating-badge absolute flex top-6 lg:top-12 left-[-15px] lg:left-[-80px] floating-ui-badge rounded-xl lg:rounded-2xl p-3 lg:p-4 items-center gap-3 lg:gap-4 z-30">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center border border-pink-200/60"
                    style={{ background: "linear-gradient(135deg, #fff1f3, #fce7ef)" }}>
                    <span className="text-base lg:text-xl" aria-hidden="true">✨</span>
                  </div>
                  <div>
                    <p className="text-xs lg:text-sm font-bold tracking-tight" style={{ color: "#0f172a" }}>Post Generated</p>
                    <p className="text-[10px] lg:text-xs font-medium" style={{ color: "#e65787" }}>6 platforms · 3 seconds</p>
                  </div>
                </div>

                {/* Floating badge — bottom right */}
                <div className="floating-badge absolute flex bottom-12 lg:bottom-20 right-[-15px] lg:right-[-80px] floating-ui-badge rounded-xl lg:rounded-2xl p-3 lg:p-4 items-center gap-3 lg:gap-4 z-30">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center border border-emerald-200/60"
                    style={{ background: "linear-gradient(135deg, #ecfdf5, #d1fae5)" }}>
                    <span className="text-base lg:text-lg" aria-hidden="true">📈</span>
                  </div>
                  <div>
                    <p className="text-xs lg:text-sm font-bold tracking-tight" style={{ color: "#0f172a" }}>+340% Engagement</p>
                    <p className="text-[10px] lg:text-xs font-medium" style={{ color: "#10b981" }}>This week</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Left column: Description */}
            <div className="card-left-text gsap-reveal order-3 lg:order-1 flex flex-col justify-center text-center lg:text-left z-20 w-full px-4 lg:px-0">
              <div className="inline-flex items-center gap-1.5 mb-4 self-center lg:self-start">
                <span className="w-4 h-[2px] rounded-full" style={{ background: "#e65787" }} />
                <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "#e65787" }}>AI-Powered</span>
              </div>
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 tracking-tight" style={{ color: "#0f172a" }}>
                {cardHeading}
              </h3>
              <p className="hidden md:block text-sm md:text-base lg:text-lg font-normal leading-relaxed mx-auto lg:mx-0 max-w-sm lg:max-w-none"
                style={{ color: "#64748b" }}>
                {cardDescription}
              </p>

              {/* Platform pill strip */}
              <div className="hidden lg:flex flex-wrap gap-1.5 mt-6">
                {["Instagram","LinkedIn","TikTok","Facebook","Twitter/X","YouTube"].map((p) => (
                  <span key={p} className="text-[10px] px-2.5 py-1 rounded-full font-medium"
                    style={{ background: "#fff1f3", border: "1px solid #fce7ef", color: "#e65787" }}>
                    {p}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
