import { useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DottedMap from "dotted-map";

interface DotPoint {
  lat: number;
  lng: number;
  label?: string;
  icon?: React.ReactNode;
  color?: string;
}

interface MapProps {
  dots?: Array<{ start: DotPoint; end: DotPoint }>;
  lineColor?: string;
  showLabels?: boolean;
  animationDuration?: number;
  loop?: boolean;
  theme?: "light" | "dark";
}

export function WorldMap({
  dots = [],
  lineColor = "#6366f1",
  showLabels = true,
  animationDuration = 2,
  loop = true,
  theme = "light",
}: MapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const map = useMemo(() => new (DottedMap as any)({ height: 100, grid: "diagonal" }), []);

  const svgMap = useMemo(
    () =>
      map.getSVG({
        radius: 0.22,
        color: theme === "dark" ? "#FFFFFF30" : "#00000025",
        shape: "circle",
        backgroundColor: theme === "dark" ? "#000000" : "#ffffff",
      }),
    [map, theme]
  );

  const projectPoint = (lat: number, lng: number) => ({
    x: (lng + 180) * (800 / 360),
    y: (90 - lat) * (400 / 180),
  });

  const createCurvedPath = (
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => {
    const midX = (start.x + end.x) / 2;
    const midY = Math.min(start.y, end.y) - 50;
    return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
  };

  const staggerDelay = 0.3;
  const totalAnimationTime = dots.length * staggerDelay + animationDuration;
  const pauseTime = 2;
  const fullCycleDuration = totalAnimationTime + pauseTime;

  return (
    <div
      className="w-full aspect-[2/1] md:aspect-[2.5/1] lg:aspect-[2/1] rounded-xl relative font-sans overflow-hidden"
      style={{ background: theme === "dark" ? "#000" : "#fff" }}
    >
      {/* Dotted base map */}
      <img
        src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
        className="h-full w-full pointer-events-none select-none object-cover"
        style={{
          maskImage: "linear-gradient(to bottom, transparent, white 10%, white 90%, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, white 10%, white 90%, transparent)",
        }}
        alt="world map"
        draggable={false}
      />

      {/* SVG overlay */}
      <svg
        ref={svgRef}
        viewBox="0 0 800 400"
        className="w-full h-full absolute inset-0 pointer-events-auto select-none"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="white"     stopOpacity="0" />
            <stop offset="5%"   stopColor={lineColor} stopOpacity="1" />
            <stop offset="95%"  stopColor={lineColor} stopOpacity="1" />
            <stop offset="100%" stopColor="white"     stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feMorphology operator="dilate" radius="0.5" />
            <feGaussianBlur stdDeviation="1" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Animated paths */}
        {dots.map((dot, i) => {
          const startPoint = projectPoint(dot.start.lat, dot.start.lng);
          const endPoint   = projectPoint(dot.end.lat,   dot.end.lng);
          const pathD      = createCurvedPath(startPoint, endPoint);
          const dotColor   = dot.start.color || lineColor;

          const startTime = (i * staggerDelay) / fullCycleDuration;
          const endTime   = (i * staggerDelay + animationDuration) / fullCycleDuration;
          const resetTime = totalAnimationTime / fullCycleDuration;

          return (
            <g key={`path-group-${i}`}>
              <motion.path
                d={pathD}
                fill="none"
                stroke="url(#path-gradient)"
                strokeWidth="1"
                initial={{ pathLength: 0 }}
                animate={loop ? { pathLength: [0, 0, 1, 1, 0] } : { pathLength: 1 }}
                transition={
                  loop
                    ? { duration: fullCycleDuration, times: [0, startTime, endTime, resetTime, 1], ease: "easeInOut", repeat: Infinity }
                    : { duration: animationDuration, delay: i * staggerDelay, ease: "easeInOut" }
                }
              />
              {loop && (
                <motion.circle
                  r="4"
                  fill={dotColor}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0, 1, 0, 0] }}
                  transition={{
                    duration: fullCycleDuration,
                    times: [0, startTime, endTime, resetTime, 1],
                    ease: "easeInOut",
                    repeat: Infinity,
                  }}
                  style={{
                    offsetPath: `path('${pathD}')`,
                    offsetDistance: "50%",
                  } as React.CSSProperties}
                />
              )}
            </g>
          );
        })}

        {/* Platform icon dots */}
        {dots.map((dot, i) => {
          const startPoint = projectPoint(dot.start.lat, dot.start.lng);
          const endPoint   = projectPoint(dot.end.lat,   dot.end.lng);

          const PlatformDot = ({
            cx, cy, point, animDelay = 0, dotIndex,
          }: {
            cx: number; cy: number; point: DotPoint; animDelay?: number; dotIndex: number;
          }) => {
            const color = point.color || lineColor;
            const name  = point.label || "";

            return (
              <g>
                {/* Pulsing ring */}
                <motion.g
                  onHoverStart={() => name && setHoveredLocation(name)}
                  onHoverEnd={() => setHoveredLocation(null)}
                  className="cursor-pointer"
                  whileHover={{ scale: 1.2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <circle cx={cx} cy={cy} r="4" fill={color} filter="url(#glow)" />
                  <circle cx={cx} cy={cy} r="4" fill={color} opacity="0.4">
                    <animate attributeName="r"       from="4" to="14" dur="2s" begin={`${animDelay}s`} repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.5" to="0" dur="2s" begin={`${animDelay}s`} repeatCount="indefinite" />
                  </circle>
                </motion.g>

                {/* Icon badge or text label */}
                {showLabels && (point.icon || name) && (
                  <motion.g
                    className="pointer-events-none"
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      // Each icon floats at its own speed & amplitude — never in sync
                      y: [0, -(5 + (dotIndex % 4) * 2.5), 0],
                    }}
                    transition={{
                      opacity: { delay: 0.25 * dotIndex + 0.2, duration: 0.4 },
                      scale:   { delay: 0.25 * dotIndex + 0.2, duration: 0.5, type: "spring", stiffness: 180, damping: 14 },
                      y: {
                        delay:      dotIndex * 0.55,            // staggered start
                        duration:   2.2 + dotIndex * 0.2,      // different float speed
                        repeat:     Infinity,
                        ease:       "easeInOut",
                        repeatType: "mirror",
                      },
                    }}
                  >
                    {point.icon ? (
                      /* Self-contained brand icon */
                      <foreignObject
                        x={cx - 13}
                        y={cy - (38 + (dotIndex % 3) * 4)}
                        width="26"
                        height="26"
                      >
                        <div style={{
                          width: 26, height: 26,
                          borderRadius: 7,
                          overflow: "hidden",
                          boxShadow: "0 3px 10px rgba(0,0,0,0.25), 0 0 0 1.5px rgba(255,255,255,0.9)",
                          filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.18))",
                        }}>
                          {point.icon}
                        </div>
                      </foreignObject>
                    ) : (
                      /* Fallback text label */
                      <foreignObject x={cx - 50} y={cy - 38} width="100" height="26">
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                          <span style={{
                            fontSize: 11, fontWeight: 500, padding: "2px 8px",
                            borderRadius: 6, whiteSpace: "nowrap",
                            background: theme === "dark" ? "rgba(0,0,0,0.9)" : "rgba(255,255,255,0.95)",
                            color: theme === "dark" ? "#fff" : "#0f172a",
                            border: `1px solid ${color}40`,
                            boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                          }}>
                            {name}
                          </span>
                        </div>
                      </foreignObject>
                    )}
                  </motion.g>
                )}
              </g>
            );
          };

          return (
            <g key={`points-group-${i}`}>
              <PlatformDot cx={startPoint.x} cy={startPoint.y} point={dot.start} animDelay={0}   dotIndex={i * 2} />
              <PlatformDot cx={endPoint.x}   cy={endPoint.y}   point={dot.end}   animDelay={0.5} dotIndex={i * 2 + 1} />
            </g>
          );
        })}
      </svg>

      {/* Mobile tooltip */}
      <AnimatePresence>
        {hoveredLocation && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-4 left-4 px-3 py-2 rounded-lg text-sm font-medium sm:hidden"
            style={{
              background: theme === "dark" ? "rgba(0,0,0,0.9)" : "rgba(255,255,255,0.92)",
              color: theme === "dark" ? "#fff" : "#0f172a",
              border: "1px solid #e2e8f0",
              backdropFilter: "blur(8px)",
            }}
          >
            {hoveredLocation}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
