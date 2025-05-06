import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-utils'; // Assuming lib is at src/lib

export async function GET() {
  try {
    // Using a simpler approach with a single client
    // Create a response object first
    // const response = NextResponse.next(); // Not needed if not setting cookies directly in this response
    
    // Get the cookie store
    const cookieStore = cookies();
    
    // Create the Supabase client with proper cookie handling
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });
    
    // Get the session directly
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      // Use handleApiError for Supabase client errors during session fetching
      console.error('[API] Supabase auth.getSession() error:', error);
      // Pass the Supabase error object to handleApiError
      return handleApiError(error, 'Authentication error retrieving session');
    }
    
    // Return session info with auth status
    return NextResponse.json({ 
      session: data.session,
      user: data.session?.user || null,
      authenticated: !!data.session,
    });
    
  } catch (error: any) {
    // Catch any other unexpected errors in the route handler
    console.error('[API] Session route unexpected error:', error);
    return handleApiError(error, 'Internal server error in session route');
  }
}
