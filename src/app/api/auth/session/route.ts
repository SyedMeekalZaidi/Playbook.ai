import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Using a simpler approach with a single client
    // Create a response object first
    const response = NextResponse.next();
    
    // Get the cookie store
    const cookieStore = cookies();
    
    // Create the Supabase client with proper cookie handling
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });
    
    // Get the session directly
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[API] Auth error:', error);
      return NextResponse.json({ error: 'Authentication error', details: error }, { status: 500 });
    }
    
    // Return session info with auth status
    return NextResponse.json({ 
      session: data.session,
      user: data.session?.user || null,
      authenticated: !!data.session,
    });
    
  } catch (error) {
    console.error('[API] Session route error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 });
  }
}
