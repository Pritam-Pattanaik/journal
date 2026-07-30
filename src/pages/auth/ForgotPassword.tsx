import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import AuthLayout from '../../components/layout/AuthLayout';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(0);
  const [emailValid, setEmailValid] = useState(true);
  
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailValid(false);
    } else {
      setEmailValid(true);
    }
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid || !email) {
      setShake(s => s + 1);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send recovery email. Please try again.');
      setShake(s => s + 1);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout
        title="Check your inbox"
        subtitle="We've sent a password recovery link to your email."
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
            If an account exists for <span className="text-primary font-semibold">{email}</span>, you will receive an email with instructions on how to reset your password.
          </p>
          <Link to="/login" className="w-full">
            <Button variant="secondary" className="w-full justify-center min-h-[48px] rounded-xl shadow-xs">
              Return to Login
            </Button>
          </Link>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Recover Access"
      subtitle="Enter your email to receive a password reset link."
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
          <Input
            id="forgot-email"
            type="email"
            label="Institutional Email Address"
            required
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            leftIcon={Mail}
            error={!emailValid && email.length > 0 ? 'Please enter a valid email address.' : undefined}
            aria-label="Email address"
          />

          <div className="pt-4">
            <Button
              type="submit"
              isLoading={loading}
              disabled={loading || !emailValid || !email}
              className="w-full min-h-[48px] text-[15px] font-bold shadow-md rounded-xl justify-center"
            >
              {!loading && (
                <>
                  Send Recovery Link <ArrowRight className="w-4 h-4 ml-1 opacity-70" />
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>

      <div className="mt-8 flex justify-center">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary hover:text-primary transition-colors focus-ring rounded">
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>
      </div>
    </AuthLayout>
  );
}
