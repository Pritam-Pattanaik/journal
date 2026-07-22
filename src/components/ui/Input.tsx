import React from 'react';
import { cn } from '../../lib/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ElementType;
  rightElement?: React.ReactNode;
}

export function Input({ label, error, leftIcon: Icon, rightElement, className, id: userProvidedId, ...props }: InputProps) {
  const [focused, setFocused] = React.useState(false);
  const fallbackId = React.useId();
  const id = userProvidedId || fallbackId;
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className={cn(
            'text-[12.5px] font-semibold transition-colors duration-200',
            focused ? 'text-primary' : 'text-secondary',
            error && 'text-danger'
          )}
        >
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className={cn(
            'absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 z-10 pointer-events-none',
            focused ? 'text-primary' : 'text-tertiary group-hover:text-secondary'
          )}>
            <Icon size={16} strokeWidth={2} />
          </div>
        )}
        <input
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          aria-required={props.required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={cn(
            'w-full h-[46px] rounded-xl border bg-surface-0/50 text-[14px] text-primary font-medium',
            'placeholder:text-tertiary outline-none transition-all duration-300 shadow-sm',
            'border-border hover:border-border-hover',
            'focus:border-accent/40 focus:bg-surface-0 focus:shadow-[0_0_0_3px_rgba(var(--color-accent),0.08)] focus:ring-1 focus:ring-accent/40',
            error && 'border-danger/40 focus:border-danger/60 focus:shadow-[0_0_0_3px_rgba(var(--color-danger),0.12)] focus:ring-danger/40 text-danger',
            Icon ? 'pl-10' : 'px-4',
            rightElement ? 'pr-12' : 'pr-4',
            className
          )}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center z-10">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p id={errorId} className="text-[12px] font-medium text-danger mt-0.5 animate-in slide-in-from-top-1 fade-in duration-200">{error}</p>
      )}
    </div>
  );
}
