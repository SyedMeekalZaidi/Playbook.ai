'use client';

/**
 * Signup Page - Modern split-panel registration with brand storytelling
 * Features AuthLayout with BrandStoryPanel + clean form design
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info' | '';
    message: string;
  }>({ type: '', message: '' });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage({ type: 'info', message: 'Creating your account...' });

    // Validation
    if (password !== confirmPassword) {
      setStatusMessage({ type: 'error', message: 'Passwords do not match' });
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setStatusMessage({ type: 'error', message: 'Password must be at least 8 characters long' });
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) {
        setStatusMessage({
          type: 'error',
          message: error.message || 'Failed to sign up'
        });
        setIsLoading(false);
        return;
      }

      if (data?.user) {
        setStatusMessage({
          type: 'success',
          message: 'Account created! Redirecting to login...'
        });
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    } catch (error: any) {
      setStatusMessage({
        type: 'error',
        message: error.message || 'An unexpected error occurred'
      });
    } finally {
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

          <h1 className="text-3xl font-bold text-oxford-blue mb-2">Create Account</h1>
          <p className="text-muted-foreground">
            Join Playbook.ai today
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

          <form onSubmit={handleSignup} className="space-y-4">
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
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={passwordVisible ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a secure password"
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
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters long
              </p>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={confirmPasswordVisible ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {confirmPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </motion.div>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link 
                href="/login" 
                className="font-semibold text-oxford-blue hover:text-gold transition-colors"
              >
                Log In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </AuthLayout>
  );
}
