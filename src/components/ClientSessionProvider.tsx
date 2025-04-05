'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User, Session } from '@supabase/supabase-js'; 
import { supabase } from '@/lib/supabase';

// Define the shape of the auth context
type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: Error | null }>;
  signUp: (email: string, password: string, role: string, secretKey?: string) => Promise<{ user: User | null; error: Error | null }>;
  signOut: () => Promise<void>;
};

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signIn: async () => ({ user: null, error: new Error('Not implemented') }),
  signUp: async () => ({ user: null, error: new Error('Not implemented') }),
  signOut: async () => {},
});

// Custom hook for using auth context
export const useAuth = () => useContext(AuthContext);

// List of routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/', '/about'];

export function ClientSessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();

  // Check if the current route is public
  const isPublicRoute = publicRoutes.includes(pathname || '');

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      console.log('Initializing auth state...');
      
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session check error:', error);
          return;
        }

        setSession(data.session);
        
        if (data.session?.user) {
          console.log('User is logged in:', data.session.user.email);
          setUser(data.session.user);
          
          // Store role in localStorage if available
          if (data.session.user.user_metadata?.role) {
            localStorage.setItem('userRole', data.session.user.user_metadata.role);
          }
        } else {
          console.log('No active session found');
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
        setInitialized(true);
      }
    };

    initAuth();

    // Auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event);
        
        setSession(session);
        setUser(session?.user || null);
        
        // Store role if available
        if (session?.user?.user_metadata?.role) {
          localStorage.setItem('userRole', session.user.user_metadata.role);
        } else if (!session) {
          // Clear role on signout
          localStorage.removeItem('userRole');
        }
        
        // Handle redirects on auth state change
        if (event === 'SIGNED_IN') {
          console.log('SIGNED_IN event detected');
          if (pathname === '/login' || pathname === '/signup') {
            // Get redirectTo from URL parameters or default to dashboard
            const url = new URL(window.location.href);
            const redirectTo = url.searchParams.get('redirectTo') || '/dashboard';
            console.log(`Redirecting to: ${redirectTo}`);
            router.push(redirectTo);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('SIGNED_OUT event detected');
          if (!isPublicRoute) {
            router.push('/login');
          }
        }
      }
    );

    // Cleanup listener on unmount
    return () => {
      console.log('Cleaning up auth listener');
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Handle redirects based on auth state
  useEffect(() => {
    if (!isLoading && initialized) {
      if (!session && !isPublicRoute) {
        console.log('Redirecting to login - no session for protected route:', pathname);
        router.push(`/login?redirectTo=${encodeURIComponent(pathname || '/dashboard')}`);
      }
    }
  }, [session, isLoading, pathname, router, isPublicRoute, initialized]);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    console.log('Provider signIn called');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log('Supabase auth response:', {
        success: !!data.user,
        error: !!error,
        session: !!data.session
      });

      if (error) throw error;

      if (data.user) {
        // Update state
        setUser(data.user);
        setSession(data.session);
        
        // CRITICAL FIX - handle redirection directly from signIn
        // Get the current URL to extract any redirectTo parameter
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          const redirectTo = url.searchParams.get('redirectTo') || '/dashboard';
          
          console.log('Login successful! Redirecting directly to:', redirectTo);
          
          // Use window.location for a FULL PAGE RELOAD which is critical
          // This ensures the browser makes a fresh request with the new auth cookies
          window.location.href = redirectTo;
        }
        
        return { user: data.user, error: null };
      }

      return { user: data.user, error: null };
    } catch (error: any) {
      console.error('Error signing in:', error);
      return { user: null, error };
    }
  };

  // Sign up new user
  const signUp = async (email: string, password: string, role: string, secretKey?: string) => {
    // Validate admin secret key if role is ADMIN
    const ADMIN_SECRET_KEY = process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY;
    if (role === 'ADMIN' && secretKey !== ADMIN_SECRET_KEY) {
      return {
        user: null,
        error: new Error('Invalid admin secret key')
      };
    }

    try {
      // Register user with Supabase Auth - include role in metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role // Store role in Supabase Auth user metadata
          }
        }
      });

      if (error) throw error;

      return {
        user: data.user,
        error: null
      };
    } catch (error: any) {
      console.error('Error signing up:', error);
      return {
        user: null,
        error: error
      };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('userRole');
      
      // Navigation handled by onAuthStateChange listener
    } catch (error) {
      console.error('Error signing out:', error);
      router.push('/login');
    }
  };

  // Value object for the context provider
  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
