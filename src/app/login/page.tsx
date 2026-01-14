'use client';

/**
 * Login Page - Modern split-panel authentication with brand storytelling
 * Features AuthLayout with BrandStoryPanel + clean form design
 */

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { BrandStoryPanel } from '@/components/auth/BrandStoryPanel';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info' | '';
    message: string;
  }>({ type: '', message: '' });
  const [passwordVisible, setPasswordVisible] = useState(false);
  
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage({ type: 'info', message: 'Logging in...' });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        let errorMsg = error.message || 'Invalid email or password';
        if (
          errorMsg.toLowerCase().includes('email not confirmed') ||
          errorMsg.toLowerCase().includes('email confirmation required') ||
          errorMsg.toLowerCase().includes('user has not confirmed')
        ) {
          errorMsg = 'Please confirm your email before logging in. Check your inbox for a confirmation link.';
        }
        setStatusMessage({ type: 'error', message: errorMsg });
        setIsLoading(false);
        return;
      }

      if (data?.user) {
        setStatusMessage({
          type: 'success',
          message: 'Login successful! Redirecting...'
        });
        window.location.href = redirectTo;
      }
    } catch (error: any) {
      setStatusMessage({
        type: 'error',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <BrandStoryPanel />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          {/* Mobile logo (hidden on desktop where BrandStoryPanel shows) */}
          <motion.div 
            className="flex justify-center mb-6 lg:hidden"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          >
            <div className="bg-oxford-blue/10 rounded-full p-3">
              <Image
                src="/rose-logo.png"
                alt="Playbook.ai Logo"
                width={48}
                height={48}
                className="object-contain"
                priority
              />
            </div>
          </motion.div>

          <h1 className="text-3xl font-bold text-oxford-blue mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">
            Sign in to your Playbook.ai account
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {statusMessage.type && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <Alert variant={statusMessage.type === 'error' ? 'destructive' : 'default'}
                className={statusMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : ''}
              >
                {statusMessage.type === 'error' && <AlertCircle className="h-4 w-4" />}
                {statusMessage.type === 'success' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                {statusMessage.type === 'info' && <Loader2 className="h-4 w-4 animate-spin" />}
                <AlertDescription>{statusMessage.message}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="pl-10"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                <Link 
                  href="/forgot-password"
                  className="text-sm text-oxford-blue hover:text-gold transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={passwordVisible ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Button 
                type="submit" 
                className="w-full bg-oxford-blue hover:bg-oxford-blue/90 mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Log In'
                )}
              </Button>
            </motion.div>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link 
                href="/signup" 
                className="font-semibold text-oxford-blue hover:text-gold transition-colors"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </AuthLayout>
  );
}

// Wrap with Suspense for useSearchParams (Next.js 15 requirement)
export default function Login() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-oxford-blue border-t-transparent" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
