import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, Eye, EyeOff, Mail, Lock, User, Check, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import AuthLayout from '../../components/layout/AuthLayout';

function GoogleIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

const getFriendlyErrorMessage = (err: string) => {
  if (err.toLowerCase().includes('already registered')) return 'An account with this email already exists.';
  if (err.toLowerCase().includes('weak password')) return 'Your password is too weak. Please meet all requirements.';
  if (err.toLowerCase().includes('network') || err.toLowerCase().includes('failed to fetch')) return 'Network error. Please check your connection and try again.';
  return 'We couldn\'t create your account right now. Please try again.';
};

export default function Signup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(0);

  const [emailValid, setEmailValid] = useState(true);

  // Password rules
  const lengthValid = password.length >= 8;
  const upperValid = /[A-Z]/.test(password);
  const lowerValid = /[a-z]/.test(password);
  const numberValid = /[0-9]/.test(password);
  const specialValid = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordValid = lengthValid && upperValid && lowerValid && numberValid && specialValid;
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const navigate = useNavigate();
  const { signUp } = useAuthStore();

  useEffect(() => {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailValid(false);
    } else {
      setEmailValid(true);
    }
  }, [email]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid || !passwordValid || !passwordsMatch || !fullName) {
      setShake(s => s + 1);
      return;
    }
    
    setLoading(true);
    setError(null);
    const { error: err } = await signUp(email, password, fullName);
    if (err) {
      setError(getFriendlyErrorMessage(err));
      setShake(s => s + 1);
      setLoading(false);
    } else {
      navigate('/app');
    }
  };

  const Rule = ({ valid, text }: { valid: boolean, text: string }) => (
    <div className={`flex items-center gap-1.5 text-[11.5px] font-medium transition-colors ${valid ? 'text-green-500' : 'text-tertiary'}`}>
      {valid ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} className="opacity-40" />}
      {text}
    </div>
  );

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Enter your details to get started."
    >
      <motion.div animate={{ x: shake > 0 ? [-8, 8, -6, 6, -4, 4, 0] : 0 }} transition={{ duration: 0.4 }}>
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="flex items-start gap-2.5 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-[13px] mb-6 shadow-sm overflow-hidden"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSignup} className="space-y-4">
          <Input
            id="signup-name"
            type="text"
            label="Full Name"
            required
            placeholder="John Doe"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            leftIcon={User}
          />

          <Input
            id="signup-email"
            type="email"
            label="Email Address"
            required
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            leftIcon={Mail}
            error={!emailValid && email.length > 0 ? 'Please enter a valid email address.' : undefined}
          />

          <div>
            <label htmlFor="signup-password" className="block text-[12.5px] font-semibold text-secondary mb-1.5">Password</label>
            <Input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              leftIcon={Lock}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-tertiary hover:text-primary transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
            
            {/* Live Password Checklist */}
            <AnimatePresence>
              {password.length > 0 && !passwordValid && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-2 gap-y-1.5 mt-2.5 overflow-hidden"
                >
                  <Rule valid={lengthValid} text="8+ characters" />
                  <Rule valid={upperValid} text="1 uppercase" />
                  <Rule valid={lowerValid} text="1 lowercase" />
                  <Rule valid={numberValid} text="1 number" />
                  <Rule valid={specialValid} text="1 special character" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Input
            id="signup-confirm"
            type={showPassword ? 'text' : 'password'}
            label="Confirm Password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            leftIcon={Lock}
            error={confirmPassword.length > 0 && !passwordsMatch ? 'Passwords do not match.' : undefined}
          />

          <div className="pt-4">
            <Button
              type="submit"
              isLoading={loading}
              disabled={loading || !emailValid || !passwordValid || !passwordsMatch || !fullName}
              className="w-full h-[46px] text-[14px] font-bold shadow-sm rounded-xl"
            >
              {!loading && (
                <>
                  Create Account <ArrowRight className="w-4 h-4 ml-2 opacity-50" />
                </>
              )}
            </Button>
          </div>
          
          <div className="relative py-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
            <span className="relative bg-surface-0 px-4 text-xs font-medium text-tertiary">OR</span>
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full h-[46px] text-[14px] font-bold rounded-xl border-border bg-surface-1 hover:bg-surface-2 text-primary gap-2 transition-all"
            onClick={() => {/* Implement Google Auth */}}
          >
            <GoogleIcon />
            Continue with Google
          </Button>
        </form>
      </motion.div>

      <p className="text-center text-sm text-tertiary mt-8">
        Already have an account?{' '}
        <Link to="/login" className="text-primary font-bold hover:underline transition-all">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
