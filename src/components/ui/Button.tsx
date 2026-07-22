import React from 'react';
import { cn } from '../../lib/cn';
import { Loader2 } from 'lucide-react';


type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'iris' | 'gold';
type Size = 'sm' | 'md' | 'lg' | 'icon-sm' | 'icon-md';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  children?: React.ReactNode;
}

const variants: Record<Variant, string> = {
  primary: [
    'bg-gradient-to-r from-accent to-accent/90 text-white',
    'hover:from-accent-hover hover:to-accent-hover/90',
    'shadow-xs hover:shadow-card transition-all duration-200',
    'active:scale-[0.97]',
  ].join(' '),

  secondary: [
    'bg-surface-1 border border-border text-primary',
    'hover:bg-surface-2 hover:border-border-hover hover:text-primary',
    'shadow-xs hover:shadow-card transition-all duration-200',
  ].join(' '),

  ghost: [
    'text-secondary hover:text-primary hover:bg-surface-1',
    'transition-colors duration-150',
  ].join(' '),

  danger: [
    'bg-danger/10 border border-danger/20 text-danger',
    'hover:bg-danger/20 hover:border-danger/30',
    'transition-all duration-150',
  ].join(' '),

  iris: [
    'bg-gradient-to-r from-iris to-iris/80 text-white',
    'hover:from-iris/90 hover:to-iris/70',
    'shadow-iris hover:shadow-raised transition-all duration-200',
    'active:scale-[0.97]',
  ].join(' '),

  gold: [
    'bg-gradient-to-r from-gold to-gold/80 text-white',
    'hover:from-gold/90 hover:to-gold/70',
    'shadow-gold hover:shadow-raised transition-all duration-200',
    'active:scale-[0.97]',
  ].join(' '),
};

const sizes: Record<Size, string> = {
  sm:       'h-11 sm:h-8 px-3.5 text-[12px] rounded-lg font-semibold',
  md:       'h-12 sm:h-10 px-5 text-[13px] rounded-xl font-semibold',
  lg:       'h-14 sm:h-12 px-7 text-[15px] rounded-xl font-bold',
  'icon-sm':'h-11 w-11 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center p-0',
  'icon-md':'h-12 w-12 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center p-0',
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap select-none',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
        'outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </button>
  );
}

// Default export alias for backward compatibility
export default Button;
