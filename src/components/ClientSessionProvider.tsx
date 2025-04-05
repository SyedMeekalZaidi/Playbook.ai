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
const publicRoutes = ['/login', '/signup', '/', '/about', '/forgot-password'];

export function ClientSessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();

  // Check if the current route is public
  const isPublicRoute = publicRoutes.includes(pathname || '') || 
                        publicRoutes.some(route => pathname?.startsWith(route));

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      console.log('[Provider] Initializing auth state...');
      
      try {
        // First check local storage for the session
        const storedSession = localStorage.getItem('supabase-auth');
        const hasStoredSession = storedSession && JSON.parse(storedSession)?.currentSession;
        
        console.log('[Provider] Has stored session:', !!hasStoredSession);
        
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Provider] Session check error:', error);
          setUser(null);
          setSession(null);
        } else if (data.session?.user) {
          console.log('[Provider] User is logged in:', data.session.user.email);
          setUser(data.session.user);
          setSession(data.session);
          
          // Store session info for resilience
          if (data.session.user.user_metadata?.role) {
            localStorage.setItem('userRole', data.session.user.user_metadata.role);
          }
        } else {
          console.log('[Provider] No active session found');
          setUser(null);
          setSession(null);
        }
      } catch (error) {
        console.error('[Provider] Auth initialization error:', error);
        setUser(null);
        setSession(null);
      } finally {
        setIsLoading(false);
        setInitialized(true);
        setAuthChecked(true);
      }
    };

    initAuth();

    // Auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('[Provider] Auth state changed:', event);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          console.log('[Provider] User signed in or token refreshed');
          setSession(newSession);
          setUser(newSession?.user || null);
          
          // Store role if available
          if (newSession?.user?.user_metadata?.role) {
            localStorage.setItem('userRole', newSession.user.user_metadata.role);
          }
          
          // Only redirect for explicit sign-in events, not token refreshes
          if (event === 'SIGNED_IN' && (pathname === '/login' || pathname === '/signup')) {
            // Get redirectTo from URL parameters or default to dashboard
            const url = new URL(window.location.href);
            const redirectTo = url.searchParams.get('redirectTo') || '/dashboard';
            console.log(`[Provider] Redirecting after sign in to: ${redirectTo}`);
            
            // Use router.push but with a small delay to ensure state is updated
            setTimeout(() => {
              router.push(redirectTo);
            }, 100);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('[Provider] User signed out');
          setSession(null);
          setUser(null);
          localStorage.removeItem('userRole');
          
          if (!isPublicRoute) {
            router.push('/login');
          }
        } else if (event === 'USER_UPDATED') {
          // Just update the user data
          setSession(newSession);
          setUser(newSession?.user || null);
        }
        
        setAuthChecked(true);
      }
    );

    // Cleanup listener on unmount
    return () => {
      console.log('[Provider] Cleaning up auth listener');
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Handle redirects based on auth state
  useEffect(() => {
    // Skip redirects during loading or for public routes
    if (isLoading || !authChecked || isPublicRoute) return;

    // If we're at a protected route but have no session, redirect to login
    if (!session && !isPublicRoute) {
      console.log('[Provider] Redirecting to login - no session for protected route:', pathname);
      router.push(`/login?redirectTo=${encodeURIComponent(pathname || '/dashboard')}`);
    }
  }, [session, isLoading, pathname, router, isPublicRoute, authChecked]);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    console.log('[Provider] signIn called');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      console.log('[Provider] Sign in successful');
      
      // No need to set state here as onAuthStateChange will handle it
      // Let onAuthStateChange handle the redirection
      return { user: data.user, error: null };
    } catch (error: any) {
      console.error('[Provider] Error signing in:', error);
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
      console.error('[Provider] Error signing up:', error);
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
      console.error('[Provider] Error signing out:', error);
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
