import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import AuthLayout from '../../components/layout/AuthLayout';

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

const getFriendlyErrorMessage = (err: string) => {
  if (err.toLowerCase().includes('invalid login credentials')) return 'Incorrect email or password.';
  if (err.toLowerCase().includes('user not found')) return 'No account found with this email address.';
  if (err.toLowerCase().includes('rate limit')) return 'Too many login attempts. Please wait a moment and try again.';
  if (err.toLowerCase().includes('network') || err.toLowerCase().includes('failed to fetch')) return 'Network error. Please verify your connection and try again.';
  return 'Unable to establish secure session right now. Please try again.';
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(0);
  const [emailValid, setEmailValid] = useState(true);
  
  const navigate = useNavigate();
  const { signIn } = useAuthStore();
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailValid(false);
    } else {
      setEmailValid(true);
    }
  }, [email]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid) {
      setShake(s => s + 1);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const { error: err } = await signIn(email, password);
    if (err) {
      setError(getFriendlyErrorMessage(err));
      setShake(s => s + 1);
      setLoading(false);
    } else {
      navigate('/app');
    }
  };

  return (
    <AuthLayout
      title="Welcome terminal"
      subtitle="Enter your credentials to access your algorithmic workstation."
    >
      <motion.div animate={shouldReduceMotion ? { x: 0 } : { x: shake > 0 ? [-8, 8, -6, 6, -4, 4, 0] : 0 }} transition={{ duration: 0.35 }}>
        
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -10 }}
              role="alert"
              className="flex items-start gap-3 p-3.5 rounded-xl bg-danger/10 border border-danger/25 text-danger text-[13px] font-medium mb-6 shadow-xs overflow-hidden"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-danger" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleLogin} className="space-y-4" noValidate>
          <Input
            id="login-email"
            type="email"
            label="Institutional Email Address"
            required
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            leftIcon={Mail}
            error={!emailValid && email.length > 0 ? 'Please enter a valid institutional or personal email.' : undefined}
            aria-label="Email address"
          />

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="login-password" className="text-[12.5px] font-semibold text-secondary">Terminal Password</label>
              <Link to="/forgot-password" className="text-[12px] font-bold text-iris hover:text-accent transition-colors focus-ring rounded">
                Forgot password?
              </Link>
            </div>
            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              leftIcon={Lock}
              aria-label="Password"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="text-tertiary hover:text-primary transition-colors p-1.5 focus-ring rounded-md"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              }
            />
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              isLoading={loading}
              disabled={loading || !emailValid || !email || !password}
              className="w-full min-h-[48px] text-[15px] font-bold shadow-md rounded-xl justify-center"
            >
              {!loading && (
                <>
                  Launch Workstation <ArrowRight className="w-4 h-4 ml-1 opacity-70" />
                </>
              )}
            </Button>
          </div>
          
          <div className="relative py-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
            <span className="relative bg-canvas px-3 text-[11px] font-mono-stat font-bold text-tertiary uppercase tracking-widest">
              SECURE SSO AUTHENTICATION
            </span>
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full min-h-[48px] text-[14px] font-bold rounded-xl border border-border bg-surface-0 hover:bg-surface-1 text-primary gap-2.5 transition-all justify-center shadow-xs"
            onClick={() => {/* Implement Google Auth */}}
          >
            <GoogleIcon />
            <span>Continue with Google Workspace</span>
          </Button>
        </form>
      </motion.div>

      <p className="text-center text-sm text-secondary mt-8 font-medium">
        Don't have a terminal account?{' '}
        <Link to="/signup" className="text-iris font-bold hover:text-accent underline underline-offset-4 transition-all focus-ring rounded">
          Create free starter tier
        </Link>
      </p>
    </AuthLayout>
  );
}
