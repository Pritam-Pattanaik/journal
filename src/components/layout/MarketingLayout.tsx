import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { TrendingUp, Menu, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export default function MarketingLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const location = useLocation();
  const { token } = useAuthStore();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Pricing', path: '/pricing' },
  ];

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="flex flex-col min-h-screen text-primary font-ui overflow-x-hidden relative z-0">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 h-[70px] glass-panel !border-x-0 !border-t-0 z-50 flex items-center justify-between px-6 md:px-12">
        <Link to="/" className="flex items-center gap-2" onClick={closeMobileMenu}>
          <TrendingUp className="text-accent h-[24px] w-[24px]" />
          <span className="font-bold text-tv-lg tracking-wider select-none text-primary">
            TradeVault
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`text-tv-sm font-medium transition-colors hover:text-accent-light ${
                location.pathname === link.path ? 'text-accent-light' : 'text-secondary'
              }`}
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
              className="px-5 py-2 glass-panel text-tv-sm font-semibold hover:bg-white/10 transition-all rounded-tv-lg border border-white/10"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-tv-sm font-medium text-secondary hover:text-primary transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="px-5 py-2 bg-accent text-white font-semibold rounded-tv-lg hover:bg-accent/90 transition-all shadow-glow-profit"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-secondary hover:text-primary"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[70px] glass-panel z-40 flex flex-col p-6 animate-fade-in md:hidden">
          <nav className="flex flex-col gap-6 text-tv-lg font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={closeMobileMenu}
                className={`${
                  location.pathname === link.path ? 'text-accent-light' : 'text-primary'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <hr className="border-white/10" />
            {token ? (
              <Link
                to="/app"
                onClick={closeMobileMenu}
                className="text-accent-light"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" onClick={closeMobileMenu} className="text-secondary">Log in</Link>
                <Link to="/signup" onClick={closeMobileMenu} className="text-accent-light">Get Started Free</Link>
              </>
            )}
          </nav>
        </div>
      )}

      {/* Page Content */}
      <main className="flex-1 mt-[70px]">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="glass-panel !border-x-0 !border-b-0 py-8 px-6 md:px-12 mt-20 text-center md:text-left">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-secondary h-[18px] w-[18px]" />
            <span className="font-semibold text-tv-sm text-secondary tracking-wider">
              TradeVault
            </span>
          </div>
          <p className="text-tv-sm text-muted">
            &copy; {new Date().getFullYear()} TradeVault Inc. All rights reserved.
          </p>
          <div className="flex gap-4 text-tv-sm text-secondary">
            <Link to="#" className="hover:text-primary transition-colors">Privacy</Link>
            <Link to="#" className="hover:text-primary transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
