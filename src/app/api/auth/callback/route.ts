import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (code) {
    console.log("Auth callback received with code, exchanging for session...");
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Get the redirect URL from the query parameters or default to dashboard
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';
  console.log(`Auth callback redirecting to: ${redirectTo}`);
  return NextResponse.redirect(new URL(redirectTo, req.url));
}
