import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums transition-colors',
  {
    variants: {
      variant: {
        default:   'bg-surface-2 text-secondary border border-border',
        primary:   'bg-accent/10 text-accent border border-accent/20',
        iris:      'bg-iris/10 text-iris border border-iris/20',
        success:   'bg-success/10 text-success border border-success/20',
        danger:    'bg-danger/10 text-danger border border-danger/20',
        warning:   'bg-warning/10 text-warning border border-warning/20',
        info:      'bg-info/10 text-info border border-info/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export default Badge;
