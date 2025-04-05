import { supabase } from './supabase';

// Helper function to add debug info to the console
export function setupAuthDebug() {
  if (typeof window !== 'undefined') {
    // Expose debug function globally
    (window as any).checkAuthState = async () => {
      try {
        const sessionResult = await supabase.auth.getSession();
        const userResult = await supabase.auth.getUser();
        
        const localStorageAuth = localStorage.getItem('supabase-auth');
        let parsedStorage = null;
        
        try {
          parsedStorage = localStorageAuth ? JSON.parse(localStorageAuth) : null;
        } catch (e) {
          console.error('Error parsing auth from localStorage', e);
        }
        
        console.group('Auth Debug Info');
        console.log('Has session:', !!sessionResult.data.session);
        console.log('Session expiry:', sessionResult.data.session?.expires_at 
            ? new Date(sessionResult.data.session.expires_at * 1000).toLocaleString()
            : 'N/A');
        console.log('User from session:', sessionResult.data.session?.user?.email || 'None');
        console.log('User from getUser():', userResult.data.user?.email || 'None');
        console.log('Auth in localStorage:', !!parsedStorage);
        console.log('User role:', userResult.data.user?.user_metadata?.role || 'None');
        console.groupEnd();
        
        return {
          hasSession: !!sessionResult.data.session,
          hasUser: !!userResult.data.user,
          userEmail: userResult.data.user?.email,
          userRole: userResult.data.user?.user_metadata?.role,
          hasLocalStorage: !!parsedStorage
        };
      } catch (error) {
        console.error('Auth debug error:', error);
        return { error: 'Failed to get auth debug info' };
      }
    };
    
    // Add reference to auth module
    (window as any).supabaseAuth = supabase.auth;
    
    console.log('Auth debug utilities loaded. Use window.checkAuthState() to view auth state.');
  }
}
