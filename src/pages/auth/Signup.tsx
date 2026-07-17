import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { motion } from 'framer-motion';
import AuthLayout from '../../components/layout/AuthLayout';

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
    <AuthLayout
      title="Create an account"
      subtitle="Enter your details to get started."
    >
      {error && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex items-start gap-2.5 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-[13px] mb-6 shadow-sm"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="font-medium">{error}</span>
        </motion.div>
      )}

      <form onSubmit={handleSignup} className="space-y-4">
        <Input
          id="signup-name"
          type="text"
          label="Full Name"
          required
          placeholder="John Doe"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
        />

        <Input
          id="signup-email"
          type="email"
          label="Email Address"
          required
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <Input
          id="signup-password"
          type="password"
          label="Password"
          required
          autoComplete="new-password"
          minLength={6}
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <div className="pt-2">
          <Button
            type="submit"
            isLoading={loading}
            className="w-full h-12 text-[14px] font-bold shadow-sm rounded-xl"
          >
            {!loading && (
              <>
                Create Account <ArrowRight className="w-4 h-4 ml-2 opacity-50" />
              </>
            )}
          </Button>
        </div>
      </form>

      <p className="text-center text-sm text-tertiary mt-8">
        Already have an account?{' '}
        <Link to="/login" className="text-primary font-bold hover:underline transition-all">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
