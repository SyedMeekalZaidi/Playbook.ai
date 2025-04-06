'use client';

import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
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
  // Flag to track if user just completed authentication
  const justAuthenticated = useRef(false);
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Check if the current route is public
  const isPublicRoute = publicRoutes.includes(pathname || '');

  // Check URL for any auth-related parameters
  useEffect(() => {
    // Check if we have code in the URL (from auth callback)
    const hasAuthCode = searchParams?.has('code');
    
    if (hasAuthCode) {
      console.log('[Auth] Auth code detected in URL, setting justAuthenticated flag');
      justAuthenticated.current = true;
    }
  }, [searchParams]);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      console.log('[Auth] Initializing auth state...');
      
      try {
        // Fetch session from API endpoint to ensure server-client consistency
        const response = await fetch('/api/auth/session');
        const sessionData = await response.json();
        
        if (sessionData.error) {
          console.error('[Auth] Session API error:', sessionData.error);
          setSession(null);
          setUser(null);
        } else {
          console.log('[Auth] Session API status:', 
            sessionData.authenticated ? 'Authenticated' : 'Not authenticated');
          
          setSession(sessionData.session);
          setUser(sessionData.user);
          
          // Store role in localStorage if available
          if (sessionData.user?.user_metadata?.role) {
            localStorage.setItem('userRole', sessionData.user.user_metadata.role);
          }
        }
      } catch (error) {
        console.error('[Auth] Auth initialization error:', error);
        
        // Fallback to client-side session check if API fails
        try {
          const { data, error: supabaseError } = await supabase.auth.getSession();
          
          if (supabaseError) {
            console.error('[Auth] Fallback session check error:', supabaseError);
            return;
          }

          setSession(data.session);
          
          if (data.session?.user) {
            console.log('[Auth] User is logged in via client check:', data.session.user.email);
            setUser(data.session.user);
            
            // Store role in localStorage if available
            if (data.session.user.user_metadata?.role) {
              localStorage.setItem('userRole', data.session.user.user_metadata.role);
            }
          }
        } catch (fallbackError) {
          console.error('[Auth] Fallback auth check failed:', fallbackError);
        }
      } finally {
        setIsLoading(false);
        setInitialized(true);
      }
    };

    initAuth();

    // Auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[Auth] Auth state changed:', event);
        
        // If signed in, set the justAuthenticated flag
        if (event === 'SIGNED_IN') {
          justAuthenticated.current = true;
        }
        
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
          console.log('[Auth] SIGNED_IN event detected');
          if (pathname === '/login' || pathname === '/signup') {
            // Get redirectTo from URL parameters or default to dashboard
            const url = new URL(window.location.href);
            const redirectTo = url.searchParams.get('redirectTo') || '/dashboard';
            console.log(`[Auth] Redirecting to: ${redirectTo}`);
            router.push(redirectTo);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('[Auth] SIGNED_OUT event detected');
          if (!isPublicRoute) {
            router.push('/login');
          }
        }
      }
    );

    // Cleanup listener on unmount
    return () => {
      console.log('[Auth] Cleaning up auth listener');
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Handle redirects based on auth state
  useEffect(() => {
    if (!isLoading && initialized) {
      // Only redirect to login if:
      // 1. There's no session (user isn't authenticated)
      // 2. We're on a protected route
      // 3. User hasn't just authenticated (prevents redirect loops)
      if (!session && !isPublicRoute && !justAuthenticated.current) {
        console.log('[Auth] Redirecting to login - no session for protected route:', pathname);
        router.push(`/login?redirectTo=${encodeURIComponent(pathname || '/dashboard')}`);
      } else if (session && justAuthenticated.current) {
        // Reset the justAuthenticated flag after we've handled it
        console.log('[Auth] Resetting justAuthenticated flag');
        justAuthenticated.current = false;
      }
    }
  }, [session, isLoading, pathname, router, isPublicRoute, initialized]);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    console.log('[Auth] Provider signIn called');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log('[Auth] Supabase auth response:', {
        success: !!data.user,
        error: !!error,
        session: !!data.session
      });

      if (error) throw error;

      if (data.user) {
        // Set the auth flag
        justAuthenticated.current = true;
        
        // Update state
        setUser(data.user);
        setSession(data.session);
        
        // Get the current URL to extract any redirectTo parameter
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          const redirectTo = url.searchParams.get('redirectTo') || '/dashboard';
          
          console.log('[Auth] Login successful! Redirecting to:', redirectTo);
          
          // Use window.location for a full page reload to refresh auth state
          window.location.href = redirectTo;
        }
        
        return { user: data.user, error: null };
      }

      return { user: data.user, error: null };
    } catch (error: any) {
      console.error('[Auth] Error signing in:', error);
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

      // Set the auth flag
      justAuthenticated.current = true;

      return {
        user: data.user,
        error: null
      };
    } catch (error: any) {
      console.error('[Auth] Error signing up:', error);
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
      console.error('[Auth] Error signing out:', error);
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
