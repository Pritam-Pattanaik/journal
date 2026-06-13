import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // Disable body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-overlay backdrop-blur-[8px] transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="glass-panel rounded-tv-3xl max-w-[560px] w-full max-h-[90vh] flex flex-col z-10 modal-enter overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-tv-md font-semibold text-primary font-ui select-none">
            {title || ''}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded text-secondary hover:text-primary transition-all hover:bg-white/10 active:bg-white/20"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 font-ui">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
