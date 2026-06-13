import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, AlertCircle, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export default function Signup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuthStore();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await signUp(email, password, fullName);
    if (err) {
      setError(err);
    } else {
      navigate('/app');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-[calc(100vh-150px)] w-full items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center">
          <div className="h-14 w-14 bg-accent/20 border border-accent/30 rounded-2xl flex items-center justify-center mb-4">
            <TrendingUp className="w-7 h-7 text-accent" />
          </div>
          <h1 className="text-tv-xl font-bold text-primary font-ui">Create your account</h1>
          <p className="text-tv-sm text-secondary mt-1">Start journaling and analyzing your trades</p>
        </div>

        {error && (
          <div className="p-3.5 bg-loss-dim border border-loss-border rounded-tv-lg flex items-start gap-3 text-loss text-tv-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSignup} className="card space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] text-secondary font-medium uppercase tracking-wider block">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
              <input
                id="signup-name"
                type="text"
                required
                autoComplete="name"
                className="input-base pl-9"
                placeholder="Vikram Mehta"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-secondary font-medium uppercase tracking-wider block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
              <input
                id="signup-email"
                type="email"
                required
                autoComplete="email"
                className="input-base pl-9"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-secondary font-medium uppercase tracking-wider block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
              <input
                id="signup-password"
                type="password"
                required
                autoComplete="new-password"
                minLength={6}
                className="input-base pl-9"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-accent text-white hover:bg-accent/90 rounded-tv-lg font-semibold text-tv-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-ui"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>


        <div className="text-center text-tv-sm text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:underline font-semibold">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
