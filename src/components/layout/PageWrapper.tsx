import React from 'react';
import { cn } from '../../lib/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface PageWrapperProps {
  children: React.ReactNode;
}

import { PageTransition } from '../ui/Motion';

export default function PageWrapper({ children }: PageWrapperProps) {
  const location = useLocation();

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden w-full relative bg-canvas">
      <PageTransition key={location.pathname} className={cn("p-6 w-full max-w-7xl mx-auto min-h-full pb-24")}>
        {children}
      </PageTransition>
    </div>
  );
}
