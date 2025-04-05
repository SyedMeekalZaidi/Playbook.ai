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
 * Check if a user has a specific role
 */
export function hasRole(user: any, role: string): boolean {
  if (!user) return false;
  return user.user_metadata?.role === role;
}
