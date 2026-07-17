import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, BarChart3, Activity, Brain } from 'lucide-react';
import { AuroraBackground } from '../ui/AuroraBackground';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen w-full bg-canvas text-primary selection:bg-black/20 dark:selection:bg-white/20">
      {/* Left Panel: Graphic / Brand (Hidden on Mobile) */}
      <div className="hidden lg:flex w-[55%] flex-col justify-between border-r border-black/5 dark:border-white/5 relative overflow-hidden">
        <AuroraBackground className="absolute inset-0 z-0 h-full w-full" showRadialGradient={false} />
        
        {/* Dark overlay for better text contrast if needed */}
        <div className="absolute inset-0 bg-canvas/40 backdrop-blur-[2px] z-0" />

        {/* Brand Header */}
        <div className="relative z-10 p-12">
          <Link to="/" className="flex items-center gap-3 outline-none group w-fit">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-canvas shrink-0 shadow-md transition-transform group-hover:scale-105">
              <TrendingUp className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight text-primary">TradeVault</span>
          </Link>
        </div>

        {/* Abstract Product Illustration */}
        <div className="relative z-10 flex-1 flex items-center justify-center py-12 px-12 perspective-[1000px]">
          <motion.div 
            initial={{ opacity: 0, rotateY: -15, rotateX: 5, scale: 0.9 }}
            animate={{ opacity: 1, rotateY: 0, rotateX: 0, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-lg aspect-square relative transform-style-3d"
          >
            {/* Main Floating Dashboard Glass Card */}
            <motion.div 
              animate={{ y: [0, -15, 0] }} 
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-x-0 top-[20%] bottom-[20%] glass-panel rounded-3xl p-6 shadow-2xl border border-white/20 dark:border-white/10"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-danger/80" />
                  <div className="w-3 h-3 rounded-full bg-warning/80" />
                  <div className="w-3 h-3 rounded-full bg-success/80" />
                </div>
                <div className="h-4 w-24 bg-black/5 dark:bg-white/5 rounded-full" />
              </div>

              <div className="flex gap-6 h-[60%]">
                <div className="flex-1 flex flex-col justify-end gap-3">
                  <div className="w-full bg-accent/20 rounded-t-lg h-[40%]" />
                  <div className="w-full bg-accent/40 rounded-t-lg h-[70%]" />
                  <div className="w-full bg-accent/60 rounded-t-lg h-[50%]" />
                  <div className="w-full bg-accent/80 rounded-t-lg h-[90%]" />
                  <div className="w-full bg-accent rounded-t-lg h-[100%]" />
                </div>
                <div className="w-[40%] flex flex-col gap-4">
                  <div className="flex-1 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-tertiary" />
                  </div>
                  <div className="flex-1 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-center">
                    <Brain className="w-6 h-6 text-tertiary" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating Metric Card 1 */}
            <motion.div 
              animate={{ y: [0, 15, 0] }} 
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -right-8 top-[10%] w-[45%] aspect-[2/1] glass-island rounded-2xl p-5 shadow-2xl border border-white/20 dark:border-white/10 z-20"
            >
              <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center mb-3">
                <Activity className="w-4 h-4 text-success" />
              </div>
              <div className="h-3 w-1/2 bg-black/10 dark:bg-white/10 rounded-full mb-2" />
              <div className="h-6 w-3/4 bg-success/20 rounded-md" />
            </motion.div>

            {/* Floating Metric Card 2 */}
            <motion.div 
              animate={{ y: [0, -10, 0] }} 
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute -left-8 bottom-[10%] w-[50%] aspect-[4/3] glass-island rounded-2xl p-5 shadow-2xl border border-white/20 dark:border-white/10 z-20"
            >
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                <TrendingUp className="w-4 h-4 text-accent" />
              </div>
              <div className="space-y-2">
                <div className="h-2 w-full bg-black/5 dark:bg-white/5 rounded-full" />
                <div className="h-2 w-[90%] bg-black/5 dark:bg-white/5 rounded-full" />
                <div className="h-2 w-[80%] bg-black/5 dark:bg-white/5 rounded-full" />
                <div className="h-2 w-[60%] bg-black/5 dark:bg-white/5 rounded-full" />
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Footer Text */}
        <div className="relative z-10 p-12 max-w-md">
          <h3 className="text-2xl font-bold tracking-tight mb-3 text-gradient">Master your trading edge.</h3>
          <p className="text-secondary leading-relaxed text-sm">
            Log every trade, analyze your performance, and let our AI coach help you build unbreakable discipline.
          </p>
        </div>
      </div>

      {/* Right Panel: Form with Shared Layout Transition */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 relative bg-canvas z-10 shadow-[-20px_0_40px_rgba(0,0,0,0.05)]">
        {/* Mobile Logo */}
        <div className="lg:hidden absolute top-8 left-8">
          <Link to="/" className="flex items-center gap-3 outline-none">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-canvas shrink-0 shadow-sm">
              <TrendingUp className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold tracking-tight text-primary">TradeVault</span>
          </Link>
        </div>

        <div className="w-full max-w-[380px] mx-auto">
          {/* Framer Motion AnimatePresence for morphing between Login and Signup */}
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-primary tracking-tight mb-2">
                  {title}
                </h1>
                <p className="text-sm text-secondary">
                  {subtitle}
                </p>
              </div>

              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
