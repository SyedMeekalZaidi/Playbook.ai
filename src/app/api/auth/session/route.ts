import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session fetch error:', sessionError);
      return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
    }
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('User fetch error:', userError);
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      session,
      user,
      authenticated: !!session,
    });
    
  } catch (error) {
    console.error('Session route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
