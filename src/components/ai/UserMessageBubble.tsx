import React from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export function UserMessageBubble({ content, timestamp }: { content: string; timestamp?: Date }) {
  const { profile } = useAuthStore();
  const displayTime = (timestamp || new Date()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-4 md:gap-6 flex-row-reverse"
    >
      <div className="w-8 h-8 shrink-0 rounded-full bg-accent border border-accent-hover flex items-center justify-center">
        <User className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 space-y-2 min-w-0 flex flex-col items-end">
        <div className="flex items-center gap-3 flex-row-reverse">
          <span className="text-xs font-bold text-primary">{profile?.fullName || 'You'}</span>
          <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest">
            {displayTime}
          </span>
        </div>
        <div className="px-5 py-4 bg-accent text-white rounded-3xl rounded-tr-sm w-fit max-w-[85%] shadow-iris text-sm leading-relaxed">
          {content}
        </div>
      </div>
    </motion.div>
  );
}

