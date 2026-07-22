import React from 'react';
import { cn } from '../../lib/cn';
import { motion } from 'framer-motion';

import { HTMLMotionProps } from 'framer-motion';

type SkeletonProps = HTMLMotionProps<"div">;

export function SkeletonShimmer({ className, ...props }: SkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "shimmer rounded-md bg-surface-2/40",
        className
      )}
      {...props}
    />
  );
}
