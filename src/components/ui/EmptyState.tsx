import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`flex flex-col items-center justify-center p-12 text-center card glass-float ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center mb-6 iris-glow">
        <Icon className="w-8 h-8 text-iris" />
      </div>
      <h3 className="text-xl font-display font-semibold text-primary mb-2">
        {title}
      </h3>
      <p className="text-secondary max-w-md mb-8">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
