import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  children,
  className = '',
  type = 'button',
  onClick,
  ...props
}: ButtonProps) {
  
  // Base styles
  let baseClass = "inline-flex items-center justify-center font-ui font-medium rounded-tv-md transition-all duration-150 outline-none select-none";

  // Variant styles
  const variantClasses = {
    primary: "glass-panel text-accent-light hover:bg-white/10 active:bg-white/20",
    ghost: "text-accent-light hover:bg-white/10 active:bg-white/20",
    danger: "glass-panel text-loss hover:bg-white/10 active:bg-white/20"
  };

  // Size styles
  const sizeClasses = {
    sm: "h-[28px] px-3 text-tv-xs gap-1.5",
    md: "h-[36px] px-4 text-tv-sm gap-2",
    lg: "h-[44px] px-6 text-tv-base gap-2.5"
  };

  // Disabled and Loading states
  const stateClass = (disabled || loading)
    ? "opacity-40 cursor-not-allowed pointer-events-none"
    : "";

  return (
    <button
      type={type}
      className={`${baseClass} ${variantClasses[variant]} ${sizeClasses[size]} ${stateClass} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-[14px] w-[14px] animate-spin-slow shrink-0" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
}
