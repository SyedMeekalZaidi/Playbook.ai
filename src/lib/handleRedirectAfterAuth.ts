import { NextResponse } from 'next/server';

/**
 * Handles redirection after authentication
 * 
 * @param req - The Next.js request object
 * @param redirectPath - The path to redirect to if no redirectTo parameter exists
 * @returns NextResponse with redirect
 */
export function handleRedirectAfterAuth(req: Request, redirectPath: string = '/dashboard') {
  const url = new URL(req.url);
  // Check if there's a redirectTo parameter
  const redirectTo = url.searchParams.get('redirectTo');
  
  // If redirectTo exists and is a relative path (not absolute URL), use it
  if (redirectTo && !redirectTo.includes('://')) {
    return NextResponse.redirect(new URL(redirectTo, url.origin));
  }
  
  // Otherwise redirect to the default path
  return NextResponse.redirect(new URL(redirectPath, url.origin));
}
