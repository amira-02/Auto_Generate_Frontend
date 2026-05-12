import { useRef, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useSpring, useTransform, useInView, type Variants } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Sparkles, BarChart2, Globe, Clock, Shield,
  ArrowRight, Check, Users, Star, Plus, Zap,
  TrendingUp,
} from "lucide-react";
import {
  FaInstagram, FaYoutube, FaFacebook, FaLinkedinIn,
} from "react-icons/fa";
import { FaXTwitter, FaTiktok } from "react-icons/fa6";
import { SocialHubCircuit } from "../components/UI/social-hub-circuit";
import NavBar from "../components/NavigationBar/NavBar";
import Footer from "../components/Footer/Footer";
import { AuthContext } from "../hooks/AuthContext";
import { CinematicHero } from "../components/UI/cinematic-landing-hero";
import { WorldMap } from "../components/UI/map";

// ── Types ─────────────────────────────────────────────────────────────────────
interface StatItem    { value: string; label: string; icon: LucideIcon; color: string; bg: string }
interface FeatureItem { icon: LucideIcon; title: string; desc: string; large: boolean }
interface PlanItem    { name: string; price: string; desc: string; features: string[]; cta: string; highlight: boolean }
interface TItem       { name: string; role: string; text: string; rating: number; avatar: string }
interface FaqItem     { q: string; a: string }
// ── Data ──────────────────────────────────────────────────────────────────────

const STATS: StatItem[] = [
  { value: "10K+", label: "Active creators", icon: Users,    color: "#e1306c", bg: "#fff1f3" },
  { value: "2M+",  label: "Posts generated", icon: Sparkles, color: "#e65787", bg: "#fff1f3" },
  { value: "6",    label: "Platforms",        icon: Globe,    color: "#e65787", bg: "#fff1f3" },
  { value: "70%",  label: "Time saved",       icon: Zap,      color: "#10b981", bg: "#ecfdf5" },
];

// § 3 — Map icon background (shared)
const IG_BG = "radial-gradient(circle at 30% 107%, #fdf497 0%, #fd5949 45%, #d6249f 60%, #285AEB 90%)";

// § 4 — Features bento (platform pills inside feature card)
const PLATFORMS = [
  { name: "Instagram", color: "#E1306C", bg: "#fce7f3" },
  { name: "LinkedIn",  color: "#0A66C2", bg: "#dbeafe" },
  { name: "TikTok",    color: "#374151", bg: "#f3f4f6" },
  { name: "Facebook",  color: "#1877F2", bg: "#eff6ff" },
  { name: "Twitter/X", color: "#374151", bg: "#f9fafb" },
  { name: "YouTube",   color: "#FF0000", bg: "#fee2e2" },
];

const FEATURES: FeatureItem[] = [
  { icon: Sparkles, title: "AI Post Generation",       desc: "Describe your idea and get polished, platform-specific content in seconds — in your exact brand voice.", large: true  },
  { icon: BarChart2, title: "Deep Analytics",          desc: "Track reach, engagement, and growth across every channel in real time.",                                  large: false },
  { icon: Globe,     title: "Multi-Platform",          desc: "Publish to Instagram, LinkedIn, TikTok, and more from one single dashboard.",                            large: false },
  { icon: Clock,     title: "Smart Scheduling",        desc: "Post at peak engagement moments with AI-driven timing recommendations.",                                   large: false },
  { icon: Shield,    title: "Brand Voice",             desc: "Train the AI on your tone and style for content that's always on-brand.",                                 large: false },
];

const STEPS = [
  { number: "01", title: "Describe your idea",       desc: "Type a brief — a topic, a goal, or just a mood. The AI handles the rest.", icon: Sparkles },
  { number: "02", title: "AI crafts your content",   desc: "Get multiple variations tailored per platform, ready to review and edit.",  icon: Zap      },
  { number: "03", title: "Publish or schedule",      desc: "Push live instantly or schedule for the perfect moment. Done.",            icon: TrendingUp },
];

const PLANS: PlanItem[] = [
  {
    name: "Starter", price: "0", desc: "Try AutoGenerate free", highlight: false,
    features: ["5 AI posts / month", "2 platforms", "Basic analytics", "Community support"],
    cta: "Get Started Free",
  },
  {
    name: "Pro", price: "19", desc: "For serious creators", highlight: true,
    features: ["Unlimited AI posts", "All 6 platforms", "Advanced analytics", "Smart scheduling", "Brand voice training", "Priority support"],
    cta: "Start Free Trial",
  },
  {
    name: "Business", price: "49", desc: "For agencies & teams", highlight: false,
    features: ["Everything in Pro", "5 team seats", "White-label exports", "API access", "Custom integrations", "Dedicated manager"],
    cta: "Contact Sales",
  },
];

const TESTIMONIALS: TItem[] = [
  { name: "Sarah Chen",   role: "Content Strategist · Novo Agency",        avatar: "#e1306c",
    text: "AutoGenerate cut our production time by 70%. The quality is genuinely impressive — it sounds like us, not a robot.", rating: 5 },
  { name: "Marcus Osei",  role: "Founder · GrowthLab",                      avatar: "#e65787",
    text: "We went from twice a week to daily posting. The analytics alone are worth the subscription.",                       rating: 5 },
  { name: "Léa Moreau",   role: "Social Media Manager · Lumière Brand",     avatar: "#ed8faf",
    text: "One brief, five platform-ready posts. The multi-platform support is an absolute game-changer.",                    rating: 5 },
];

const FAQ: FaqItem[] = [
  { q: "How does AutoGenerate create content?",
    a: "Our AI is trained on millions of high-performing posts. Provide a brief and it generates platform-specific content optimized for engagement — in your brand voice." },
  { q: "Which platforms are supported?",
    a: "Instagram, LinkedIn, TikTok, Facebook, Twitter/X, and YouTube — all managed from one dashboard." },
  { q: "Can I customize the AI's writing style?",
    a: "Yes. Brand Voice lets you upload your existing content and the AI learns your tone, vocabulary, and style over time." },
  { q: "Is there a free plan?",
    a: "Yes — Starter is free forever with 5 AI posts/month and 2 platform connections. No credit card required." },
  { q: "How does smart scheduling work?",
    a: "AutoGenerate analyzes your audience's engagement patterns and surfaces the best posting windows. Approve and schedule in one click." },
  { q: "Can I try Pro before paying?",
    a: "Every paid plan includes a 14-day free trial. Cancel anytime, no questions asked." },
];

// ── Map icon helper ───────────────────────────────────────────────────────────
const mapIcon = (bg: string, Icon: React.ElementType, color = "#fff"): React.ReactNode => (
  <div style={{ width: "100%", height: "100%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", color }}>
    <Icon size={13} />
  </div>
);

// ── Map routes ────────────────────────────────────────────────────────────────
const MAP_DOTS = [
  { start: { lat: 34.05,  lng: -118.24, label: "Instagram", color: "#E1306C", icon: mapIcon(IG_BG,     FaInstagram)  },
    end:   { lat: 51.51,  lng:   -0.13, label: "LinkedIn",  color: "#0A66C2", icon: mapIcon("#0A66C2", FaLinkedinIn) } },
  { start: { lat: 31.23,  lng:  121.47, label: "TikTok",    color: "#010101", icon: mapIcon("#010101", FaTiktok)     },
    end:   { lat: 35.68,  lng:  139.69, label: "YouTube",   color: "#FF0000", icon: mapIcon("#FF0000", FaYoutube)    } },
  { start: { lat: -23.55, lng:  -46.63, label: "Facebook",  color: "#1877F2", icon: mapIcon("#1877F2", FaFacebook)   },
    end:   { lat: 52.52,  lng:   13.40, label: "LinkedIn",  color: "#0A66C2", icon: mapIcon("#0A66C2", FaLinkedinIn) } },
  { start: { lat: -33.87, lng:  151.21, label: "YouTube",   color: "#FF0000", icon: mapIcon("#FF0000", FaYoutube)    },
    end:   { lat: 25.20,  lng:   55.27, label: "Instagram", color: "#E1306C", icon: mapIcon(IG_BG,     FaInstagram)  } },
  { start: { lat: 37.77,  lng: -122.42, label: "Twitter/X", color: "#000000", icon: mapIcon("#000000", FaXTwitter)   },
    end:   { lat: 19.08,  lng:   72.88, label: "Facebook",  color: "#1877F2", icon: mapIcon("#1877F2", FaFacebook)   } },
  { start: { lat:  6.52,  lng:    3.38, label: "TikTok",    color: "#010101", icon: mapIcon("#010101", FaTiktok)     },
    end:   { lat: 40.71,  lng:  -74.01, label: "Twitter/X", color: "#000000", icon: mapIcon("#000000", FaXTwitter)   } },
];

// ── Variants ──────────────────────────────────────────────────────────────────
const up:    Variants = { hidden: { opacity: 0, y: 40 },      visible: { opacity: 1, y: 0 } };
const down:  Variants = { hidden: { opacity: 0, y: -40 },     visible: { opacity: 1, y: 0 } };
const left:  Variants = { hidden: { opacity: 0, x: -50 },     visible: { opacity: 1, x: 0 } };
const right: Variants = { hidden: { opacity: 0, x: 50 },      visible: { opacity: 1, x: 0 } };
const scale: Variants = { hidden: { opacity: 0, scale: 0.82 },visible: { opacity: 1, scale: 1 } };
const fade:  Variants = { hidden: { opacity: 0 },              visible: { opacity: 1 } };
const list:  Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } };

// ── ScrollSection helper — triggers once when 20% visible ─────────────────────
function ScrollSection({ children, variant = up, delay = 0, className = "", style = {} }: {
  children: React.ReactNode;
  variant?: Variants;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null!);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  return (
    <motion.div
      ref={ref}
      variants={variant}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// ── Label ─────────────────────────────────────────────────────────────────────
function Label({ text }: { text: string }) {
  return (
    <div className="inline-flex items-center gap-2 mb-4">
      <span className="w-4 h-[2px] rounded-full" style={{ background: "#e1306c" }} />
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "#e1306c" }}>{text}</p>
    </div>
  );
}



// ── FAQ row ───────────────────────────────────────────────────────────────────
function FaqRow({ q, a }: FaqItem) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid #ed8faf" }}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center text-left py-5 gap-6 group"
      >
        <span className="text-sm font-medium transition-colors duration-200 group-hover:text-[#e65787]"
          style={{ color: "#0f172a" }}>{q}
        </span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.22, ease: "easeOut" }}
          className="flex-shrink-0" style={{ color: "#94a3b8" }}>
          <Plus size={16} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.26, ease: "easeOut" }}
            className="overflow-hidden">
            <p className="text-sm leading-relaxed pb-5" style={{ color: "#475569" }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Orb ───────────────────────────────────────────────────────────────────────
function Orb({ color, size, top, left, right, bottom, delay = 0 }: {
  color: string; size: number; top?: string; left?: string; right?: string; bottom?: string; delay?: number;
}) {
  return (
    <motion.div
      animate={{ scale: [1, 1.12, 1], opacity: [0.45, 0.65, 0.45] }}
      transition={{ duration: 8 + delay, repeat: Infinity, ease: "easeInOut", delay }}
      className="absolute rounded-full blur-3xl pointer-events-none"
      style={{ width: size, height: size, background: color, top, left, right, bottom }}
    />
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const navigate  = useNavigate();
  const { token } = useContext(AuthContext);

  const aboutRef            = useRef<HTMLDivElement>(null!);
  const generateRef         = useRef<HTMLDivElement>(null!);
  const contactRef          = useRef<HTMLDivElement>(null!);
  const phoneRef            = useRef<HTMLDivElement>(null!);
  const pricingRef          = useRef<HTMLDivElement>(null!);
  const dashboardPreviewRef = useRef<HTMLDivElement>(null!);
  const blogRef             = useRef<HTMLDivElement>(null!);
  const previewRef          = useRef<HTMLDivElement>(null!);

  const sections = {
    about: aboutRef, generate: generateRef, contact: contactRef,
    phone: phoneRef, pricing: pricingRef,  dashboardPreview: dashboardPreviewRef,
    blog:  blogRef,  preview: previewRef,
  };

  // ── Scroll progress bar ───────────────────────────────────────────────────
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // ── Parallax for map section ──────────────────────────────────────────────
  const mapRef = useRef<HTMLDivElement>(null!);
  const { scrollYProgress: mapScroll } = useScroll({ target: mapRef, offset: ["start end", "end start"] });
  const mapY = useTransform(mapScroll, [0, 1], [40, -40]);

  return (
    <div style={{ background: "#fff", color: "#0f172a", minHeight: "100h" }}>
      {/* ── Scroll progress bar ── */}
      <motion.div
        style={{ scaleX, transformOrigin: "left", position: "fixed", top: 0, left: 0, right: 0, height: 3, background: "#e1306c", zIndex: 9999 }}
      />
      <NavBar sections={sections} />

      {/* ═══════════════════════════════════════════════════════════════
          § 1  HERO — CinematicHero
      ═══════════════════════════════════════════════════════════════ */}
      <div ref={aboutRef}>
        <CinematicHero
          tagline1="Create content that"
          tagline2="actually converts."
          cardHeading="AI-powered social media."
          cardDescription={
            <>
              <span className="font-semibold" style={{ color: "#e1306c" }}>AutoGenerate</span>{" "}
              writes, schedules, and analyzes your social media content across every platform —
              so you focus on what matters.
            </>
          }
          metricValue={2000000}
          metricLabel="Posts Generated"
        />
      </div>


      {/* ═══════════════════════════════════════════════════════════════
          § 2  STATS
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6" style={{ borderTop: "1px solid #ed8faf" }}>
        <motion.div variants={list} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-15% 0px" }}
          className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {STATS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={i} variants={scale} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl p-6 flex flex-col items-center text-center"
                style={{ background: s.bg, border: `1px solid ${s.color}25` }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${s.color}18` }}>
                  <Icon size={18} style={{ color: s.color }} />
                </div>
                <span className="text-3xl font-bold tracking-tight mb-1" style={{ color: "#0f172a" }}>{s.value}</span>
                <span className="text-xs font-medium" style={{ color: "#ed8faf" }}>{s.label}</span>
              </motion.div>
            );
          })}
        </motion.div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════
          § 3  INTEGRATIONS HUB
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6" style={{ borderTop: "1px solid #fce7ef" }}>
        <div className="max-w-5xl mx-auto">
          <ScrollSection variant={up} className="text-center mb-14">
            <Label text="Integrations" />
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4" style={{ color: "#0f172a" }}>
              Connect every platform<br />from one place
            </h2>
            <p className="text-base max-w-md mx-auto" style={{ color: "#94a3b8" }}>
              AutoGenerate connects seamlessly with all your favorite social media platforms — publish everywhere without switching tabs.
            </p>
          </ScrollSection>
          <SocialHubCircuit />
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════════
          § 4  FEATURES BENTO
      ═══════════════════════════════════════════════════════════════ */}
      <section ref={generateRef} className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollSection variant={left} className="mb-16">
            <Label text="Features" />
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4" style={{ color: "#0f172a" }}>
              Everything you need<br />to grow on social
            </h2>
            <p className="text-base max-w-sm" style={{ color: "#ed8faf" }}>
              One platform to write, schedule, analyze, and scale your presence.
            </p>
          </ScrollSection>

          <motion.div variants={list} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-10% 0px" }}
            className="grid md:grid-cols-3 gap-4"
          >
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div key={i} variants={i % 2 === 0 ? up : scale} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(230,87,135,0.1)" }}
                  className={`p-7 rounded-2xl cursor-default transition-colors duration-300${f.large ? " md:col-span-2" : ""}`}
                  style={{ background: "#fff", border: "1px solid #ed8faf" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#ed8faf")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#ed8faf")}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: "#fff1f3" }}>
                    <Icon size={16} color="#e1306c" />
                  </div>
                  <h3 className="text-sm font-semibold mb-1.5" style={{ color: "#0f172a" }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#ed8faf" }}>{f.desc}</p>

                  {/* ── Card illustrations ── */}
                  {i === 0 && (
                    <div className="mt-5 rounded-xl overflow-hidden"
                      style={{ background: "#f8fafc", border: "1px solid #ed8faf" }}>
                      <div className="px-3 pt-3 pb-1 flex gap-1.5 flex-wrap">
                        {[["Instagram","#fff1f3","#ed8faf","#e1306c"],["LinkedIn","#fff1f3","#ed8faf","#e1306c"],["TikTok","#f3f4f6","#ed8faf","#9ca3af"]].map(([name,bg,border,color],j) => (
                          <span key={j} className="text-[9px] px-2.5 py-0.5 rounded-full font-medium"
                            style={{ background: bg, border: `1px solid ${border}`, color }}>{name}</span>
                        ))}
                      </div>
                      <div className="px-3 pb-3 pt-1.5 text-[11px] font-mono leading-relaxed" style={{ color: "#374151" }}>
                        "Announcing our product launch — highlight the speed, simplicity and how it saves time..."
                        <span className="inline-block w-[2px] h-3 ml-0.5 align-middle animate-pulse"
                          style={{ background: "#e1306c", borderRadius: "1px" }} />
                      </div>
                    </div>
                  )}

                  {i === 1 && (
                    <div className="mt-5">
                      <div className="flex items-end gap-1.5 h-14 mb-1.5">
                        {[38, 56, 44, 80, 52, 95, 68].map((h, j) => (
                          <motion.div key={j}
                            initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.5 + j * 0.06, duration: 0.4, ease: "easeOut" }}
                            className="flex-1 rounded-t-sm" style={{ height: `${h}%`,
                              background: j === 5 ? "#e1306c" : "#fce7ef", transformOrigin: "bottom" }}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between">
                        {["M","T","W","T","F","S","S"].map((d, j) => (
                          <span key={j} className="flex-1 text-center text-[9px]" style={{ color: "#94a3b8" }}>{d}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {i === 2 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {PLATFORMS.map((p, j) => (
                        <div key={j} className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-medium"
                          style={{ background: p.bg, border: `1px solid ${p.color}22`, color: "#374151" }}>
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
                          {p.name}
                        </div>
                      ))}
                    </div>
                  )}

                  {i === 3 && (
                    <div className="mt-5">
                      <div className="grid grid-cols-7 gap-1 mb-1">
                        {["M","T","W","T","F","S","S"].map((d, j) => (
                          <div key={j} className="text-center text-[9px] font-medium pb-0.5" style={{ color: "#94a3b8" }}>{d}</div>
                        ))}
                        {Array.from({ length: 21 }).map((_, j) => {
                          const on = [2,5,9,13,16,20].includes(j);
                          return (
                            <div key={j} className="aspect-square rounded-md flex items-center justify-center text-[9px] font-medium"
                              style={{ background: on ? "#e1306c" : "#f8fafc", color: on ? "#fff" : "#94a3b8" }}>
                              {j + 1}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {i === 4 && (
                    <div className="mt-5 space-y-2">
                      <p className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: "#94a3b8" }}>Generic</p>
                      <div className="p-2.5 rounded-lg text-[11px] leading-snug"
                        style={{ background: "#fef9c3", border: "1px solid #fde04799", color: "#713f12" }}>
                        "We are excited to announce our new feature..."
                      </div>
                      <p className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: "#e1306c" }}>Your voice</p>
                      <div className="p-2.5 rounded-lg text-[11px] leading-snug"
                        style={{ background: "#dcfce7", border: "1px solid #86efac99", color: "#166534" }}>
                        "Something we've been quietly building is finally here..."
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          § 5  HOW IT WORKS
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-32 px-6 relative overflow-hidden"
        style={{ background: "#f8fafc", borderTop: "1px solid #ed8faf", borderBottom: "1px solid #ed8faf" }}
      >
        <Orb color="rgba(230,87,135,0.07)" size={400} top="-100px" right="-80px" />
        <div className="max-w-5xl mx-auto relative">
          <ScrollSection variant={down} className="text-center mb-20">
            <Label text="How it works" />
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight" style={{ color: "#0f172a" }}>
              From idea to published<br />in 60 seconds
            </h2>
          </ScrollSection>

          <div className="grid md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-10 left-[calc(16.7%+36px)] right-[calc(16.7%+36px)] h-px"
              style={{ borderTop: "2px dashed #ed8faf" }} />

            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const stepVariant = i === 0 ? left : i === 2 ? right : up;
              return (
                <motion.div key={i} variants={stepVariant} initial="hidden" whileInView="visible"
                  viewport={{ once: true, margin: "-10% 0px" }} transition={{ duration: 0.65, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -4 }}
                  className="flex flex-col items-center text-center p-7 rounded-2xl"
                  style={{ background: "#fff", border: "1px solid #ed8faf" }}
                >
                  <div className="relative mb-6 z-10">
                    <div className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #fff1f3, #fce7ef)" }}>
                      <span className="text-[10px] font-bold mb-0.5" style={{ color: "#ed8faf" }}>{step.number}</span>
                      <Icon size={22} color="#e1306c" />
                    </div>
                  </div>
                  <h3 className="text-base font-semibold mb-2" style={{ color: "#0f172a" }}>{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#ed8faf" }}>{step.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          § 6  TESTIMONIALS
      ═══════════════════════════════════════════════════════════════ */}
      <section ref={blogRef} className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollSection variant={right} className="text-center mb-16">
            <Label text="Testimonials" />
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight" style={{ color: "#0f172a" }}>
              Loved by creators worldwide
            </h2>
          </ScrollSection>

          <motion.div variants={list} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-10% 0px" }}
            className="grid md:grid-cols-3 gap-5"
          >
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i} variants={scale} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4 }}
                className="p-8 rounded-2xl flex flex-col relative overflow-hidden"
                style={{ background: "#fff", border: "1px solid #ed8faf" }}
              >
                {/* Decorative quote */}
                <span className="absolute top-4 right-5 text-7xl font-serif leading-none select-none"
                  style={{ color: "#f1f5f9" }}>"</span>

                <div className="flex gap-1 mb-5 relative z-10">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={13} fill="#f59e0b" color="#f59e0b" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed flex-1 mb-6 relative z-10" style={{ color: "#475569" }}>
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3 pt-5 relative z-10"
                  style={{ borderTop: "1px solid #f1f5f9" }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: t.avatar }}>
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>{t.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          § 6.5  GLOBAL REACH MAP
      ═══════════════════════════════════════════════════════════════ */}
      <section ref={mapRef} className="py-24 px-6" style={{ borderTop: "1px solid #ed8faf" }}>
        <div className="max-w-6xl mx-auto">
          <ScrollSection variant={up} className="text-center mb-12">
            <Label text="Global reach" />
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4" style={{ color: "#0f172a" }}>
              Creators everywhere,<br />posting everywhere
            </h2>
            <p className="text-base max-w-md mx-auto" style={{ color: "#ed8faf" }}>
              AutoGenerate is used by teams across 60+ countries to schedule, publish, and grow on every major platform.
            </p>
          </ScrollSection>

          <motion.div
            style={{ y: mapY }}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <WorldMap
              lineColor="#e1306c"
              dots={MAP_DOTS}
            />
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          § 7  PRICING
      ═══════════════════════════════════════════════════════════════ */}
      <section ref={pricingRef} className="py-32 px-6 relative overflow-hidden"
        style={{ background: "#f8fafc", borderTop: "1px solid #ed8faf", borderBottom: "1px solid #ed8faf" }}
      >
        <Orb color="rgba(237,143,175,0.08)" size={380} bottom="-60px" left="-60px" delay={2} />
        <div className="max-w-5xl mx-auto relative">
          <ScrollSection variant={up} className="text-center mb-16">
            <Label text="Pricing" />
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4" style={{ color: "#0f172a" }}>
              Simple, transparent pricing
            </h2>
            <p className="text-base" style={{ color: "#ed8faf" }}>Start free. Upgrade when ready. Cancel anytime.</p>
          </ScrollSection>

          <motion.div variants={list} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-10% 0px" }}
            className="grid md:grid-cols-3 gap-4 items-start"
          >
            {PLANS.map((plan, i) => (
              <motion.div key={i} variants={i === 1 ? scale : i === 0 ? left : right} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: plan.highlight ? -6 : -3 }}
                className="relative p-8 rounded-2xl flex flex-col"
                style={{
                  background: plan.highlight
                    ? "linear-gradient(145deg, #fff1f3 0%, #fce7ef 100%)"
                    : "#fff",
                  border: plan.highlight ? "2px solid #e1306c" : "1px solid #ed8faf",
                  boxShadow: plan.highlight ? "0 0 0 4px rgba(230,87,135,0.08), 0 16px 40px rgba(230,87,135,0.12)" : "none",
                }}
              >
                {plan.highlight && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-bold"
                    style={{ background: "#e1306c", color: "#fff", boxShadow: "0 4px 12px rgba(230,87,135,0.4)" }}>
                    ✦ Most Popular
                  </span>
                )}
                <p className="text-sm font-bold mb-1" style={{ color: "#0f172a" }}>{plan.name}</p>
                <p className="text-xs mb-6" style={{ color: "#94a3b8" }}>{plan.desc}</p>
                <div className="flex items-baseline gap-1 mb-7">
                  <span className="text-5xl font-bold tracking-tight" style={{ color: "#0f172a" }}>${plan.price}</span>
                  <span className="text-xs" style={{ color: "#94a3b8" }}>/month</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feat, j) => (
                    <li key={j} className="flex items-center gap-2.5 text-sm" style={{ color: "#475569" }}>
                      <Check size={13} color="#e1306c" strokeWidth={2.5} />
                      {feat}
                    </li>
                  ))}
                </ul>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => navigate("/auth")}
                  className="w-full py-3 rounded-xl font-semibold text-sm"
                  style={{
                    background: plan.highlight ? "#e1306c" : "transparent",
                    border: plan.highlight ? "none" : "1px solid #ed8faf",
                    color: plan.highlight ? "#fff" : "#374151",
                    boxShadow: plan.highlight ? "0 4px 16px rgba(230,87,135,0.3)" : "none",
                  }}
                >
                  {plan.cta}
                </motion.button>
              </motion.div>
            ))}
          </motion.div>

          <motion.p variants={fade} initial="hidden" whileInView="visible"
            viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center text-xs mt-8" style={{ color: "#94a3b8" }}
          >
            30-day money-back guarantee · No credit card required for free plan
          </motion.p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          § 8  FAQ
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-32 px-6">
        <div className="max-w-2xl mx-auto">
          <ScrollSection variant={up} className="text-center mb-14">
            <Label text="FAQ" />
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight" style={{ color: "#0f172a" }}>
              Common questions
            </h2>
          </ScrollSection>

          <motion.div variants={list} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-5% 0px" }}
            style={{ borderTop: "1px solid #ed8faf" }}
          >
            {FAQ.map((f, i) => (
              <motion.div key={i} variants={i % 2 === 0 ? left : right} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
                <FaqRow q={f.q} a={f.a} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          § 9  FINAL CTA
      ═══════════════════════════════════════════════════════════════ */}
      <section ref={contactRef} className="py-32 px-6 relative overflow-hidden"
        style={{ borderTop: "1px solid #ed8faf" }}
      >
        <Orb color="rgba(230,87,135,0.12)"  size={500} top="-100px"  left="50%" />
        <Orb color="rgba(237,143,175,0.10)"  size={350} bottom="-60px" right="-40px" delay={3} />
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "linear-gradient(rgba(230,87,135,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(230,87,135,0.025) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }} />

        <motion.div variants={list} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-10% 0px" }}
          className="max-w-2xl mx-auto text-center relative z-10"
        >
          <motion.div variants={scale} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium mb-8"
            style={{ background: "#fff1f3", border: "1px solid #fce7ef", color: "#e1306c" }}
          >
            <Users size={11} /> Join 10,000+ creators
          </motion.div>

          <motion.h2 variants={up} transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-5"
            style={{ color: "#0f172a" }}
          >
            Ready to grow faster?
          </motion.h2>

          <motion.p variants={up} transition={{ duration: 0.6 }}
            className="text-base mb-10" style={{ color: "#ed8faf" }}
          >
            Start generating content today. Your first 5 posts are on us.
          </motion.p>

          <motion.div variants={up} transition={{ duration: 0.6 }} className="flex flex-col sm:flex-row gap-3 justify-center">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate(token ? "/dashboard" : "/auth")}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-sm"
              style={{ background: "#e1306c", color: "#fff", boxShadow: "0 8px 32px rgba(230,87,135,0.35)" }}
            >
              Get started for free <ArrowRight size={15} />
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/auth")}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-sm"
              style={{ color: "#374151", border: "1px solid #ed8faf", background: "#fff" }}
            >
              View pricing
            </motion.button>
          </motion.div>

          <motion.p variants={fade} transition={{ duration: 0.5 }}
            className="mt-6 text-xs" style={{ color: "#94a3b8" }}
          >
            No credit card required · Cancel anytime
          </motion.p>
        </motion.div>
      </section>



      <Footer />
    </div>
  );
}
