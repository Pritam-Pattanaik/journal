import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  footer?: React.ReactNode;
}

const sizeMap: Record<string, number> = {
  sm: 480,
  md: 640,
  lg: 800,
};

export default function Modal({ isOpen, onClose, title, children, size = 'md', footer }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    previousFocusRef.current = document.activeElement as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    setTimeout(() => {
      const focusables = modalRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusables?.[0]?.focus();
    }, 50);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4">
          {/* Backdrop */}
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            onClick={onClose}
            className="absolute inset-0 bg-surface-primary/60 backdrop-blur-md"
            style={{
              background: 'rgba(2, 11, 24, 0.60)',
            }}
            aria-hidden="true"
          />

          {/* Modal Box */}
          <motion.div
            key="modal-box"
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            initial={{ opacity: 0, y: '100%', scale: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: '100%', scale: 1 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              maxWidth: sizeMap[size] || 640,
            }}
            className={cn(
              "relative z-10 w-full max-h-[90vh] flex flex-col overflow-hidden",
              "glass-float rounded-t-3xl sm:rounded-2xl rounded-b-none sm:rounded-b-2xl shadow-floating"
            )}
          >
            {/* Drag Handle for Mobile */}
            <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-12 h-1.5 rounded-full bg-border opacity-50" />
            </div>

            {/* Modal Header */}
            {title && (
              <div className="flex items-center justify-between px-6 pb-4 pt-2 sm:pt-5 border-b border-border/50 shrink-0">
                <h2 id="modal-title" className="text-lg font-display font-semibold text-primary">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  aria-label="Close modal"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-secondary hover:bg-surface-2 hover:text-primary transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  <X size={18} strokeWidth={2} />
                </button>
              </div>
            )}

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {children}
            </div>

            {/* Modal Footer */}
            {footer && (
              <div className="flex justify-end gap-3 border-t border-border/50 px-6 py-4 shrink-0 bg-surface-0/50">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
