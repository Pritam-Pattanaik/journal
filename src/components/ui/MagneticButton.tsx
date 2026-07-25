import React, { useRef, useState } from "react";
import { motion, HTMLMotionProps, useReducedMotion } from "framer-motion";
import { cn } from "../../lib/cn";

interface MagneticButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  className?: string;
  magneticPull?: number;
  variant?: "primary" | "secondary" | "iris";
}

export const MagneticButton = ({
  children,
  className,
  magneticPull = 0.3,
  variant = "primary",
  ...props
}: MagneticButtonProps) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const shouldReduceMotion = useReducedMotion();

  const handleMouse = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (shouldReduceMotion || !ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * magneticPull, y: middleY * magneticPull });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  const { x, y } = position;

  const variantStyles = {
    primary: "bg-gradient-to-r from-accent to-accent-hover text-white shadow-[0_4px_24px_rgba(59,114,255,0.35)] hover:shadow-[0_8px_32px_rgba(59,114,255,0.5)] border border-white/10",
    secondary: "bg-surface-1/90 backdrop-blur-md text-primary border border-border hover:bg-surface-2 hover:border-border-hover shadow-card",
    iris: "bg-gradient-to-r from-iris to-accent text-white shadow-[0_4px_24px_rgba(122,110,255,0.35)] hover:shadow-[0_8px_32px_rgba(122,110,255,0.5)] border border-white/10",
  };

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: shouldReduceMotion ? 0 : x, y: shouldReduceMotion ? 0 : y }}
      whileTap={{ scale: shouldReduceMotion ? 1 : 0.97 }}
      transition={{ type: "spring", stiffness: 450, damping: 25, mass: 0.5 }}
      className={cn(
        "relative inline-flex items-center justify-center gap-2.5 rounded-2xl px-8 py-4 font-display font-bold text-[15px] sm:text-base transition-all duration-300 select-none",
        "min-h-[48px] min-w-[48px]", // Mandatory WCAG 2.2 touch target standard
        "focus-ring outline-none",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {/* Subtle interior lighting sheen */}
      <span className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/10 to-white/15 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300" />
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </motion.button>
  );
};
