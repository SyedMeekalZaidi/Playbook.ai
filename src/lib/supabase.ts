import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', { 
    hasUrl: !!supabaseUrl, 
    hasKey: !!supabaseAnonKey 
  });
  throw new Error('Supabase environment variables are missing');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'supabase-auth',
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Explicitly define storage to ensure consistency
    storage: {
      getItem: (key) => {
        if (typeof window === 'undefined') {
          return null;
        }
        const itemStr = window.localStorage.getItem(key);
        
        // Log for debugging
        if (key === 'supabase-auth') {
          console.log('[Supabase Client] Getting auth from localStorage:', !!itemStr);
        }
        
        return itemStr ? JSON.parse(itemStr) : null;
      },
      setItem: (key, value) => {
        if (typeof window !== 'undefined') {
          // Log for debugging
          if (key === 'supabase-auth') {
            console.log('[Supabase Client] Setting auth in localStorage');
          }
          window.localStorage.setItem(key, JSON.stringify(value));
        }
      },
      removeItem: (key) => {
        if (typeof window !== 'undefined') {
          // Log for debugging
          if (key === 'supabase-auth') {
            console.log('[Supabase Client] Removing auth from localStorage');
          }
          window.localStorage.removeItem(key);
        }
      },
    },
  },
  // Use cookies as persistent storage for server-side auth
  cookies: {
    name: 'sb-auth-token',
    lifetime: 60 * 60 * 24 * 7, // 7 days
    domain: '',
    path: '/',
    sameSite: 'lax'
  }
});

// Debug helper function to check auth state
export async function getAuthDebugInfo() {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    // Also check localStorage
    let localStorageData = null;
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem('supabase-auth');
        localStorageData = stored ? JSON.parse(stored) : null;
      } catch (e) {
        console.error('Error parsing localStorage:', e);
      }
    }
    
    return {
      hasSession: !!sessionData.session,
      sessionError: sessionError?.message || null,
      hasUser: !!userData.user,
      userError: userError?.message || null,
      hasLocalStorage: !!localStorageData,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return { error: 'Failed to get debug info', timestamp: new Date().toISOString() };
  }
}
