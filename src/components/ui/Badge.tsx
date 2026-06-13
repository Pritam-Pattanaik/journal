import React from 'react';

type BadgeVariant = 'win' | 'loss' | 'breakeven' | 'accent' | 'manual';

interface BadgeProps {
  variant: BadgeVariant;
  children?: React.ReactNode;
}

export default function Badge({ variant, children }: BadgeProps) {
  // Map variant to styling classes
  const getBadgeClass = (v: BadgeVariant) => {
    switch (v) {
      case 'win':
        return 'badge-win';
      case 'loss':
        return 'badge-loss';
      case 'breakeven':
        return 'badge-breakeven';
      case 'accent':
      case 'manual':
        return 'badge-accent';
      default:
        return 'badge-accent';
    }
  };

  const getLabel = (v: BadgeVariant) => {
    if (v === 'manual') return 'Manual';
    return v.toUpperCase();
  };

  return (
    <span className={`badge ${getBadgeClass(variant)} select-none`}>
      {children || getLabel(variant)}
    </span>
  );
}
