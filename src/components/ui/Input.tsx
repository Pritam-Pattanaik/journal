import React, { useState } from 'react';
import { cn } from '../../lib/cn';
import { Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
    const hasValue = Boolean(props.value || props.defaultValue);

    return (
      <div className="relative w-full group">
        <input
          id={id}
          type={inputType}
          className={cn(
            'peer flex h-14 w-full rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] px-4 text-[15px] text-primary shadow-sm outline-none transition-all',
            'focus:border-accent focus:bg-surface-0 focus:ring-1 focus:ring-accent/50',
            'disabled:cursor-not-allowed disabled:opacity-50',
            label ? 'pt-5 pb-1' : 'py-2',
            isPassword && 'pr-12',
            className
          )}
          ref={ref}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        
        {label && (
          <label
            htmlFor={id}
            className={cn(
              "absolute left-4 top-4 text-[15px] text-tertiary transition-all duration-200 pointer-events-none select-none",
              (isFocused || hasValue) 
                ? "text-[11px] font-semibold -translate-y-2.5 text-accent uppercase tracking-widest"
                : "peer-focus:text-[11px] peer-focus:font-semibold peer-focus:-translate-y-2.5 peer-focus:text-accent peer-focus:uppercase peer-focus:tracking-widest"
            )}
          >
            {label}
          </label>
        )}

        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-tertiary hover:bg-black/5 hover:text-primary dark:hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={showPassword ? 'eye-off' : 'eye'}
                initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
                transition={{ duration: 0.2 }}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </motion.div>
            </AnimatePresence>
          </button>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
