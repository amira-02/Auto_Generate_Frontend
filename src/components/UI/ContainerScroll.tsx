import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface ContainerScrollProps {
  titleComponent: ReactNode;
  children?: ReactNode;
}

export function ContainerScroll({ titleComponent, children }: ContainerScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const rotate = useTransform(scrollYProgress, [0, 0.6], [16, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.6], [0.86, 1]);
  const titleY = useTransform(scrollYProgress, [0, 0.6], [0, -48]);
  const cardY = useTransform(scrollYProgress, [0, 0.6], [0, 24]);
  const shadowOpacity = useTransform(scrollYProgress, [0, 0.6], [0.7, 0.2]);

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: children ? "180vh" : "100vh" }}
    >
      {/* Sticky viewport — pins the whole hero while container scrolls */}
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-start overflow-hidden pt-40 pb-0 px-6">
        {/* Title block */}
        <motion.div
          style={{ y: titleY }}
          className="w-full max-w-4xl mx-auto text-center mb-10 md:mb-12"
        >
          {titleComponent}
        </motion.div>

        {/* Card with perspective origin at top-center */}
        {children && (
          <motion.div
            style={{ y: cardY }}
            className="w-full max-w-5xl mx-auto"
          >
            <div
              style={{
                perspective: "1200px",
                perspectiveOrigin: "50% -10%",
              }}
            >
              <motion.div
                style={{
                  rotateX: rotate,
                  scale,
                  transformOrigin: "50% 0%",
                  willChange: "transform",
                  filter: useTransform(
                    shadowOpacity,
                    (v) => `drop-shadow(0 60px 80px rgba(0,0,0,${v}))`
                  ),
                }}
              >
                {children}
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
