import React from 'react';
import { cn } from '../../lib/cn';
import { motion } from 'framer-motion';

import { HTMLMotionProps } from 'framer-motion';

function Skeleton({
  className,
  ...props
}: HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('animate-pulse rounded-md bg-surface-2/60', className)}
      {...props}
    />
  );
}

export { Skeleton };
