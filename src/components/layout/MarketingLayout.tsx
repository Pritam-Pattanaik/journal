import React, { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { TrendingUp, Menu, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../lib/cn';
import Lenis from '@studio-freight/lenis';

export default function MarketingLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const location = useLocation();
  const { token } = useAuthStore();

  useEffect(() => {
    // Initialize Lenis for smooth scrolling on marketing pages
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home',    path: '/' },
    { name: 'About',   path: '/about' },
    { name: 'Pricing', path: '/pricing' },
  ];

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <div className="flex flex-col min-h-screen bg-canvas text-primary font-sans overflow-x-hidden selection:bg-accent/20">
      
      {/* Header */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-between px-6 md:px-12 transition-all duration-300 ease-out",
          scrolled 
            ? "bg-canvas/80 backdrop-blur-md border-b border-border shadow-sm" 
            : "bg-transparent border-b border-transparent"
        )}
      >
        <Link to="/" onClick={closeMobileMenu} className="flex items-center gap-2 group outline-none">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
            <TrendingUp size={18} strokeWidth={2} className="text-accent" />
          </div>
          <span className="text-lg font-bold tracking-tight text-primary">TradeVault</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <Link
              key={link.name}
              to={link.path}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary outline-none",
                isActive(link.path) ? "text-primary" : "text-secondary"
              )}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          {token ? (
            <Link
              to="/app"
              className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-surface-1 border border-border text-primary text-sm font-medium transition-colors hover:bg-surface-2 hover:text-primary shadow-sm outline-none focus-ring"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-secondary hover:text-primary transition-colors outline-none"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors shadow-md shadow-accent/20 outline-none focus-ring"
              >
                Get Started Free
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-secondary hover:text-primary transition-colors outline-none"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-canvas/95 backdrop-blur-xl z-40 flex flex-col p-6 border-t border-border animate-in fade-in slide-in-from-top-4">
          <nav className="flex flex-col gap-1">
            {navLinks.map(link => (
              <Link
                key={link.name}
                to={link.path}
                onClick={closeMobileMenu}
                className={cn(
                  "text-lg font-semibold py-4 border-b border-border/50",
                  isActive(link.path) ? "text-primary" : "text-secondary"
                )}
              >
                {link.name}
              </Link>
            ))}
          </nav>
          <div className="mt-8 flex flex-col gap-4">
            {token ? (
              <Link
                to="/app"
                onClick={closeMobileMenu}
                className="w-full py-3 bg-accent text-white text-center rounded-lg font-semibold shadow-md shadow-accent/20"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="w-full py-3 bg-surface-1 border border-border text-primary text-center rounded-lg font-medium"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  onClick={closeMobileMenu}
                  className="w-full py-3 bg-accent text-white text-center rounded-lg font-semibold shadow-md shadow-accent/20"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Page Content */}
      <main className="flex-1 mt-16 page-enter">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6 bg-surface-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} strokeWidth={2} className="text-tertiary" />
            <span className="text-sm font-bold text-tertiary tracking-tight">
              TradeVault
            </span>
          </div>
          <p className="text-sm text-tertiary">
            &copy; {new Date().getFullYear()} TradeVault Inc. All rights reserved.
          </p>
          <div className="flex gap-6">
            {['Privacy', 'Terms', 'Contact'].map(link => (
              <Link
                key={link}
                to="#"
                className="text-sm text-tertiary hover:text-primary transition-colors"
              >
                {link}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
