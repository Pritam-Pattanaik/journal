import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence, HTMLMotionProps, useReducedMotion, animate } from 'framer-motion';

// ── Shared Institutional Physics & Easings ──
export const springConfig = { type: 'spring', stiffness: 450, damping: 30 } as const;
export const springGentle = { type: 'spring', stiffness: 300, damping: 40 } as const;
export const easeEditorial = [0.16, 1, 0.3, 1] as const;
export const easeSubtle = [0.4, 0, 0.2, 1] as const;

// ── Accessible Structural Reveal Components ──

/**
 * StaggerContainer synchronizes children reveals with zero CPU jank.
 * Respects OS prefers-reduced-motion settings.
 */
export const StaggerContainer = ({
  children,
  delay = 0,
  staggerChildren = 0.07,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  staggerChildren?: number;
  className?: string;
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={{
        hidden: { opacity: shouldReduceMotion ? 1 : 0 },
        visible: {
          opacity: 1,
          transition: {
            delayChildren: shouldReduceMotion ? 0 : delay,
            staggerChildren: shouldReduceMotion ? 0 : staggerChildren,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={{
        hidden: { opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 20 },
        visible: { 
          opacity: 1, 
          y: 0, 
          transition: { duration: 0.6, ease: easeEditorial } 
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * HoverLift adds a clean, hardware-accelerated lift and tactile compression on press.
 * Automatically bypassed when reduced-motion is enabled.
 */
export const HoverLift = React.forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ children, className, ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion();

    return (
      <motion.div
        ref={ref}
        whileHover={shouldReduceMotion ? undefined : { y: -3, transition: { duration: 0.22, ease: easeEditorial } }}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.985, transition: springConfig }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
HoverLift.displayName = 'HoverLift';

/**
 * Reveal delivers clean, high-performance scroll entrances without layout shifting.
 */
export const Reveal = ({ 
  children, 
  delay = 0, 
  direction = 'up',
  className 
}: { 
  children: React.ReactNode; 
  delay?: number; 
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
}) => {
  const shouldReduceMotion = useReducedMotion();

  const getInitialPosition = () => {
    if (shouldReduceMotion || direction === 'none') return { x: 0, y: 0 };
    switch (direction) {
      case 'up': return { y: 24 };
      case 'down': return { y: -24 };
      case 'left': return { x: 24 };
      case 'right': return { x: -24 };
    }
  };

  return (
    <motion.div
      initial={{ opacity: shouldReduceMotion ? 1 : 0, ...getInitialPosition() }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.65, ease: easeEditorial, delay: shouldReduceMotion ? 0 : delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * PageTransition handles smooth route context shifts.
 */
export const PageTransition = ({ 
  children, 
  className, 
  mode = 'wait' 
}: { 
  children: React.ReactNode; 
  className?: string; 
  mode?: 'wait' | 'sync' | 'popLayout';
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode={mode}>
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, filter: 'blur(3px)', y: 8 }}
        animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
        exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, filter: 'blur(3px)', y: -8 }}
        transition={{ duration: 0.25, ease: easeEditorial }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Animated tabular numeral register that counts up to the target value with zero layout jitter.
 */
export const NumberCounter = ({ 
  value, 
  duration = 1.2,
  format = (val: number) => val.toFixed(0),
  className 
}: { 
  value: number; 
  duration?: number;
  format?: (val: number) => string;
  className?: string;
}) => {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const shouldReduceMotion = useReducedMotion();
  
  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    
    if (shouldReduceMotion) {
      node.textContent = format(value);
      return;
    }

    const controls = animate(0, value, {
      duration,
      ease: easeEditorial,
      onUpdate(latest) {
        if (node) node.textContent = format(latest);
      }
    });

    return () => controls.stop();
  }, [value, duration, format, shouldReduceMotion]);

  return <span ref={nodeRef} className={className}>{format(shouldReduceMotion ? value : 0)}</span>;
};
