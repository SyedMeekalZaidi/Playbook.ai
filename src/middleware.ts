import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

// Routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/', '/about'];

// Routes that should bypass authentication checks (assets, api routes, etc.)
const excludedPaths = [
  '/api/',
  '/_next/',
  '/favicon.ico',
  '/rose-logo.svg',
  '/static/',
  '/images/',
];

export async function middleware(req: NextRequest) {
  // Create a response object
  const res = NextResponse.next();
  
  // Get the pathname
  const path = req.nextUrl.pathname;
  
  // Log the URL for debugging
  console.log(`[Middleware] Processing URL: ${req.url}`);
  
  // Skip excluded paths
  const isExcludedPath = excludedPaths.some(excludedPath => path.startsWith(excludedPath));
  if (isExcludedPath) {
    console.log(`[Middleware] Excluded path: ${path}`);
    return res;
  }
  
  // Check if this is a public route
  const isPublicRoute = publicRoutes.includes(path);
  if (isPublicRoute) {
    console.log(`[Middleware] Public route: ${path}, skipping auth check`);
    return res;
  }
  
  // Initialize Supabase client with appropriate options
  const supabase = createMiddlewareClient({ req, res });
  
  try {
    // Check if we have a session
    const { data: { session } } = await supabase.auth.getSession();
    
    console.log(`[Middleware] Auth check for ${path}: Session exists: ${!!session}`);

    // If we don't have a session and this isn't a public route, redirect to login
    if (!session) {
      console.log(`[Middleware] No session for protected route ${path}, redirecting to login`);
      
      // Check if this request already comes from a redirect attempt to prevent loops
      const referer = req.headers.get('referer') || '';
      const isFromLogin = referer.includes('/login');
      
      // If we're already coming from login and still have no session,
      // something is wrong with auth flow - let the client handle it
      if (isFromLogin && path !== '/login') {
        console.log('[Middleware] Potential redirect loop detected, allowing client to handle');
        return res;
      }
      
      // Get the base URL for redirection
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.search = `?redirectTo=${encodeURIComponent(path)}`;
      
      return NextResponse.redirect(redirectUrl);
    }
    
    // User is authenticated, allow access
    return res;
    
  } catch (error) {
    console.error(`[Middleware] Auth error:`, error);
    
    // In case of error, redirect to login as a fallback
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    
    return NextResponse.redirect(redirectUrl);
  }
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
