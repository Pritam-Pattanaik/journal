import React, { useRef } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from "framer-motion";
import { cn } from "../../lib/cn";

export const GlareCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 40 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 40 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["4deg", "-4deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-4deg", "4deg"]);

  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["120%", "-20%"]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["120%", "-20%"]);
  const glareOpacity = useTransform(mouseXSpring, [-0.5, 0.5], [0, 0.08]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        transformPerspective: "1000px",
      }}
      className={cn(
        "relative rounded-2xl overflow-hidden border border-border bg-surface",
        "shadow-card hover:shadow-raised transition-shadow duration-300",
        className
      )}
    >
      {/* Subtle glare sheen */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          opacity: glareOpacity,
          background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.8), transparent 60%)`,
        }}
      />
      {children}
    </motion.div>
  );
};
