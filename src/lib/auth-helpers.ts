import { supabase } from './supabase';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

/**
 * Get the current authenticated user from a request
 */
export async function getCurrentUser(req: NextRequest) {
  try {
    // Get the auth token from the request headers
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'No auth token provided' };
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify the token and get the user
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return { user: null, error: error?.message || 'User not found' };
    }
    
    return { user: data.user, error: null };
  } catch (error: any) {
    console.error('Error getting current user:', error);
    return { user: null, error: error.message };
  }
}

/**
 * Get the current authenticated user from server components
 */
export async function getServerUser() {
  try {
    const supabaseServer = createServerComponentClient({ cookies });
    const { data: { user } } = await supabaseServer.auth.getUser();
    return { user, error: null };
  } catch (error: any) {
    console.error('Error getting server user:', error);
    return { user: null, error: error.message };
  }
}

/**
 * Get the current authenticated session from server components
 */
export async function getServerSession() {
  try {
    const supabaseServer = createServerComponentClient({ cookies });
    const { data } = await supabaseServer.auth.getSession();
    return { 
      session: data.session, 
      user: data.session?.user || null,
      error: null 
    };
  } catch (error: any) {
    console.error('Error getting server session:', error);
    return { session: null, user: null, error: error.message };
  }
}

/**
 * Check if a user has a specific role
 */
export function hasRole(user: any, role: string): boolean {
  if (!user) return false;
  return user.user_metadata?.role === role;
}

/**
 * Verifies if the session is valid and returns auth status
 */
export async function verifySession(req: NextRequest) {
  try {
    // Check for token in cookie rather than auth header
    const cookieHeader = req.headers.get('cookie');
    
    if (!cookieHeader) {
      return { authenticated: false, error: 'No cookies provided' };
    }
    
    // Use supabase admin to verify the session without needing the token directly
    const { data, error } = await supabase.auth.getUser();
    
    if (error || !data.user) {
      return { authenticated: false, error: error?.message || 'Session invalid' };
    }
    
    return { 
      authenticated: true, 
      user: data.user,
      error: null 
    };
  } catch (error: any) {
    console.error('Session verification error:', error);
    return { authenticated: false, error: error.message };
  }
}
