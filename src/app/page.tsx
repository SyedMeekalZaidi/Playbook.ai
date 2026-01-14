'use client';

/**
 * Home Page - Landing / redirect page
 * Redirects authenticated users to dashboard, others to login
 */

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import NavBar from '@/components/NavBar';
import { useAuth } from '@/components/ClientSessionProvider';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function Home() {
  const router = useRouter();
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && session) {
      router.push('/dashboard');
    } else if (!isLoading) {
      router.push('/login');
    }
  }, [session, isLoading, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <NavBar />
      
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="mb-6">
            <Image
              src="/rose-logo.png"
              alt="ROSE Logo"
              width={80}
              height={80}
              className="mx-auto"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold text-oxford-blue mb-4">
            ROSE Playbook
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Process Mapping Made Simple
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-3 border-oxford-blue border-t-transparent" />
            <span className="text-muted-foreground">Loading...</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
