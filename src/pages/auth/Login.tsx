import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { motion } from 'framer-motion';
import AuthLayout from '../../components/layout/AuthLayout';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await signIn(email, password);
    if (err) {
      setError(err);
    } else {
      navigate('/app');
    }
    setLoading(false);
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Enter your credentials to access your workspace."
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

      <form onSubmit={handleLogin} className="space-y-4">
        <Input
          id="login-email"
          type="email"
          label="Email Address"
          required
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <div>
          <Input
            id="login-password"
            type="password"
            label="Password"
            required
            autoComplete="current-password"
            minLength={6}
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <div className="flex justify-end mt-2 pr-1">
            <Link to="/forgot-password" className="text-[12px] font-bold text-secondary hover:text-primary transition-colors">
              Forgot password?
            </Link>
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            isLoading={loading}
            className="w-full h-12 text-[14px] font-bold shadow-sm rounded-xl"
          >
            {!loading && (
              <>
                Sign In <ArrowRight className="w-4 h-4 ml-2 opacity-50" />
              </>
            )}
          </Button>
        </div>
      </form>

      <p className="text-center text-sm text-tertiary mt-8">
        Don't have an account?{' '}
        <Link to="/signup" className="text-primary font-bold hover:underline transition-all">
          Sign up for free
        </Link>
      </p>
    </AuthLayout>
  );
}
