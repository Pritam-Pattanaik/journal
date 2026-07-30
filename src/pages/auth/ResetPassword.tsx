import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Lock, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import AuthLayout from '../../components/layout/AuthLayout';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(0);
  
  const shouldReduceMotion = useReducedMotion();

  // Basic validation rules matching the backend
  const isValid = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !token) {
      setShake(s => s + 1);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The link might have expired.');
      setShake(s => s + 1);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout
        title="Password Reset"
        subtitle="Your password has been successfully updated."
      >
        <motion.div 
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-6 text-center"
        >
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <p className="text-secondary text-[15px] mb-8 leading-relaxed max-w-sm">
            Redirecting you to the login terminal...
          </p>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create New Password"
      subtitle="Secure your terminal access."
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

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <Input
              id="reset-password"
              type={showPassword ? 'text' : 'password'}
              label="New Terminal Password"
              required
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              leftIcon={Lock}
              aria-label="New Password"
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
            {/* Password requirements hint */}
            <div className="mt-2.5 flex flex-col gap-1.5 px-1">
              <div className={`text-[11px] font-medium flex items-center gap-1.5 ${password.length >= 8 ? 'text-success' : 'text-tertiary'}`}>
                <div className={`w-1 h-1 rounded-full ${password.length >= 8 ? 'bg-success' : 'bg-tertiary'}`} />
                At least 8 characters
              </div>
              <div className={`text-[11px] font-medium flex items-center gap-1.5 ${/[A-Z]/.test(password) ? 'text-success' : 'text-tertiary'}`}>
                <div className={`w-1 h-1 rounded-full ${/[A-Z]/.test(password) ? 'bg-success' : 'bg-tertiary'}`} />
                Contains uppercase letter
              </div>
              <div className={`text-[11px] font-medium flex items-center gap-1.5 ${/[0-9]/.test(password) ? 'text-success' : 'text-tertiary'}`}>
                <div className={`w-1 h-1 rounded-full ${/[0-9]/.test(password) ? 'bg-success' : 'bg-tertiary'}`} />
                Contains number
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              isLoading={loading}
              disabled={loading || !isValid || !token}
              className="w-full min-h-[48px] text-[15px] font-bold shadow-md rounded-xl justify-center"
            >
              {!loading && "Update Password"}
            </Button>
          </div>
        </form>
      </motion.div>
      
      {!token && (
        <div className="mt-8 flex justify-center">
          <Link to="/forgot-password" className="text-sm font-bold text-iris hover:text-accent transition-colors">
            Request new reset link
          </Link>
        </div>
      )}
    </AuthLayout>
  );
}
