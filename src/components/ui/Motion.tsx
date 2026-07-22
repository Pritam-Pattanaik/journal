import React from 'react';
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';

// --- Shared physics & easings ---
export const springConfig = { type: 'spring', stiffness: 400, damping: 30 } as any;
export const springGentle = { type: 'spring', stiffness: 300, damping: 40 } as any;
export const easeExpo = [0.16, 1, 0.3, 1] as any;

// --- Primitives ---

/**
 * A container that staggers its children when it mounts.
 * Usage: Wrap a list in <StaggerContainer> and children in <StaggerItem>
 */
export const StaggerContainer = ({
  children,
  delay = 0,
  staggerChildren = 0.05,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  staggerChildren?: number;
  className?: string;
}) => (
  <motion.div
    initial="hidden"
    animate="visible"
    exit="hidden"
    variants={{
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          delayChildren: delay,
          staggerChildren,
        },
      },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

export const StaggerItem = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 15 },
      visible: { opacity: 1, y: 0, transition: springConfig },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

/**
 * Adds a subtle lift and scale effect on hover and tap.
 */
export const HoverLift = React.forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ children, ...props }, ref) => (
    <motion.div
      ref={ref}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={springConfig}
      {...props}
    >
      {children}
    </motion.div>
  )
);
HoverLift.displayName = 'HoverLift';

/**
 * Simple fade-in and slide-up reveal
 */
export const Reveal = ({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.5, ease: easeExpo, delay }}
    className={className}
  >
    {children}
  </motion.div>
);

/**
 * Page transition wrapper
 */
export const PageTransition = ({ children, className, mode = 'wait' }: { children: React.ReactNode; className?: string; mode?: 'wait' | 'sync' | 'popLayout' }) => (
  <AnimatePresence mode={mode}>
    <motion.div
      initial={{ opacity: 0, filter: 'blur(4px)', y: 10 }}
      animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
      exit={{ opacity: 0, filter: 'blur(4px)', y: -10 }}
      transition={{ duration: 0.3, ease: easeExpo }}
      className={className}
    >
      {children}
    </motion.div>
  </AnimatePresence>
);

/**
 * Animated number counter that counts up to the target value.
 */
export const NumberCounter = ({ 
  value, 
  duration = 1,
  format = (val: number) => val.toFixed(0),
  className 
}: { 
  value: number; 
  duration?: number;
  format?: (val: number) => string;
  className?: string;
}) => {
  const nodeRef = React.useRef<HTMLSpanElement>(null);
  
  React.useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    
    // Animate from 0 to target value
    import('framer-motion').then(({ animate }) => {
      animate(0, value, {
        duration,
        ease: [0.16, 1, 0.3, 1], // easeExpo
        onUpdate(latest) {
          node.textContent = format(latest);
        }
      });
    });
  }, [value, duration, format]);

  return <span ref={nodeRef} className={className}>{format(value)}</span>;
};
