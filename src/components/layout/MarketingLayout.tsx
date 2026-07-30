import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { TrendingUp, Menu, X, Shield, Terminal, Lock, Sparkles, Activity, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../lib/cn';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

export default function MarketingLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { token } = useAuthStore();
  const shouldReduceMotion = useReducedMotion();
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Trap focus and lock body scroll when mobile menu is active
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setMobileMenuOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [mobileMenuOpen]);

  const navLinks = [
    { name: 'Workspace', path: '#workspace' },
    { name: 'Core Pillars', path: '#features' },
    { name: 'AI Coach', path: '#ai-coach' },
    { name: 'Prop Traders', path: '#social-proof' },
    { name: 'Investment', path: '#pricing' },
    { name: 'FAQ', path: '#faq' },
  ];

  const isActive = (path: string) => location.hash === path;

  return (
    <div id="main-content" className="flex flex-col min-h-screen bg-canvas text-primary font-sans overflow-x-hidden selection:bg-iris/25">
      
      {/* ── Sleek Glassmorphic Navigation Bar (Linear / Vercel Grade) ── */}
      <header
        className={cn(
          "fixed top-4 left-1/2 -translate-x-1/2 h-14 sm:h-[60px] z-50 flex items-center justify-between px-6 transition-all duration-300 ease-out rounded-full border w-[94%] max-w-[1120px]",
          scrolled 
            ? "bg-surface-1/90 backdrop-blur-2xl border-border-hover shadow-[0_8px_32px_rgba(0,0,0,0.35)]" 
            : "bg-surface-0/60 backdrop-blur-lg border-border/50 shadow-sm"
        )}
        aria-label="Main Navigation"
      >
        <Link to="/" className="flex items-center gap-3 group outline-none focus-ring rounded-xl">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-iris flex items-center justify-center shadow-sm group-hover:opacity-95 transition-all">
            <TrendingUp size={17} strokeWidth={2.5} className="text-white" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-primary">TradeVault</span>
        </Link>

        {/* Desktop Navigation Shortcuts */}
        <nav className="hidden lg:flex items-center gap-8" aria-label="Section shortcuts">
          {navLinks.map(link => (
            <a
              key={link.name}
              href={link.path}
              className={cn(
                "text-sm font-medium transition-colors duration-200 hover:text-primary outline-none focus-ring rounded-md py-1",
                isActive(link.path) ? "text-primary font-semibold" : "text-secondary"
              )}
            >
              {link.name}
            </a>
          ))}
        </nav>
        {/* Desktop Actions */}
        <div className="hidden sm:flex items-center gap-4">
          {token ? (
            <Link
              to="/app"
              className="inline-flex items-center justify-center h-9 px-5 rounded-full bg-primary text-canvas text-xs font-semibold hover:opacity-95 transition-all shadow-sm focus-ring"
            >
              Launch Terminal
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-secondary hover:text-primary transition-colors px-2 py-1 rounded-lg focus-ring"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-primary text-canvas text-xs font-semibold hover:opacity-90 transition-all shadow-sm focus-ring"
              >
                <span>Get Started</span>
                <ArrowRight size={13} className="opacity-80" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle Button */}
        <button
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          className="sm:hidden touch-target p-2 text-secondary hover:text-primary transition-colors rounded-xl focus-ring"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* ── Accessible Mobile Menu Drawer ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="mobile-navigation"
            ref={mobileMenuRef}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -15 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="sm:hidden fixed inset-x-0 top-0 h-screen bg-canvas/95 backdrop-blur-2xl z-40 pt-24 px-6 pb-12 flex flex-col justify-between border-b border-border overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            <nav className="flex flex-col gap-1" aria-label="Mobile Navigation">
              {navLinks.map(link => (
                <a
                  key={link.name}
                  href={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-display font-semibold text-secondary hover:text-primary py-3.5 px-4 rounded-xl hover:bg-surface-1 transition-colors border-b border-border/40 flex items-center justify-between"
                >
                  <span>{link.name}</span>
                  <span className="text-tertiary text-xs">↗</span>
                </a>
              ))}
            </nav>

            <div className="flex flex-col gap-3 mt-8 pt-6 border-t border-border">
              {token ? (
                <Link
                  to="/app"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full min-h-[48px] inline-flex items-center justify-center bg-primary text-canvas rounded-xl font-bold text-base shadow-md"
                >
                  Launch Terminal
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full min-h-[48px] inline-flex items-center justify-center bg-surface-1 border border-border text-primary rounded-xl font-semibold text-base"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full min-h-[48px] inline-flex items-center justify-center bg-primary text-canvas rounded-xl font-bold text-base shadow-md"
                  >
                    Start Free Tier (No CC Req)
                  </Link>
                </>
              )}

              <div className="flex items-center justify-center gap-2 mt-3 text-xs text-tertiary font-medium">
                <Shield size={14} className="text-success" />
                <span>Bank-Grade Read-Only OAuth Security</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Page Content ── */}
      <main className="flex-1 mt-14 sm:mt-18">
        <Outlet />
      </main>

      {/* ── Executive Institutional Footer ── */}
      <footer className="border-t border-border bg-surface-0/80 pt-20 pb-12 px-6 lg:px-12 text-secondary" aria-label="Institutional resources">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-8 gap-y-12 pb-14 border-b border-border/60">
          
          {/* Column 1: Brand, Description, Socials (Takes 2 cols on desktop) */}
          <div className="col-span-2 lg:col-span-2 flex flex-col justify-between gap-8 pr-4">
            <div className="space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-iris flex items-center justify-center text-white font-bold shadow-sm">
                  <TrendingUp size={14} strokeWidth={2.5} />
                </div>
                <span className="font-display text-lg font-bold text-primary tracking-tight">TradeVault</span>
              </div>
              <p className="text-[13px] text-tertiary max-w-sm leading-relaxed font-medium">
                The institutional quantitative workspace built for funded prop traders and rule-based speculators. Replace emotional willpower with mathematically verified discipline.
              </p>
              
              {/* Social Links (Placeholders) */}
              <div className="flex items-center gap-4 pt-2">
                {['Twitter', 'GitHub', 'Discord', 'LinkedIn'].map((platform) => (
                  <a key={platform} href="#" aria-label={platform} className="text-tertiary hover:text-primary transition-colors">
                    <div className="w-8 h-8 rounded-full bg-surface-1 border border-border flex items-center justify-center hover:bg-surface-2 transition-colors">
                      <span className="text-[10px] font-bold">{platform[0]}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
            
            {/* Live Status Indicator */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-1 border border-border w-fit shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              <span className="text-[11px] font-semibold text-primary">Systems Operational</span>
            </div>
          </div>

          {/* Column 2: Product */}
          <div className="flex flex-col gap-4">
            <p className="text-[13px] font-bold text-primary">Product</p>
            <ul className="space-y-3 text-[13px] font-medium text-tertiary">
              <li><a href="#workspace" className="hover:text-primary transition-colors">Interactive Workspace</a></li>
              <li><a href="#ai-coach" className="hover:text-primary transition-colors">AI Behavioral Coach</a></li>
              <li><a href="#features" className="hover:text-primary transition-colors">Risk Guardrails</a></li>
              <li><a href="#pricing" className="hover:text-primary transition-colors">Automated Broker Sync</a></li>
              <li><a href="#social-proof" className="hover:text-primary transition-colors">Prop Trader Analytics</a></li>
              <li><a href="#" className="hover:text-primary transition-colors flex items-center gap-1.5">Changelog <span className="px-1.5 py-0.5 rounded-md bg-surface-2 text-[9px] font-bold text-primary">NEW</span></a></li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div className="flex flex-col gap-4">
            <p className="text-[13px] font-bold text-primary">Resources</p>
            <ul className="space-y-3 text-[13px] font-medium text-tertiary">
              <li><a href="#" className="hover:text-primary transition-colors">Trading Hub</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">API Documentation</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">System Status</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Engineering Blog</a></li>
            </ul>
          </div>

          {/* Column 4: Contact / Company */}
          <div className="flex flex-col gap-4">
            <p className="text-[13px] font-bold text-primary">Company</p>
            <ul className="space-y-3 text-[13px] font-medium text-tertiary">
              <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contact Sales</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Partners</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Press Kit</a></li>
            </ul>
          </div>

          {/* Column 5: Legal */}
          <div className="flex flex-col gap-4">
            <p className="text-[13px] font-bold text-primary">Legal</p>
            <ul className="space-y-3 text-[13px] font-medium text-tertiary">
              <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><a href="#" className="hover:text-primary transition-colors">Cookie Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Security Overview</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Data Processing</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 pt-8 text-[12px] text-tertiary font-medium">
          <p>© 2026 TradeVault, Inc. Designed and implemented by the TradeVault Team.</p>
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="text-secondary font-semibold hidden sm:inline-block">Discipline Over Dopamine</span>
            <span className="hidden sm:inline-block">·</span>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <span>All rights reserved</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
