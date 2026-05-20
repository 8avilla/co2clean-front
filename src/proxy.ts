import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for route protection.
 * Redirects unauthenticated users to the login page and
 * prevents authenticated users from accessing the login page.
 */
export function proxy(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');

  // If there's no token and the user is NOT on the login page, redirect to /login
  if (!token && !isLoginPage) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If there's a token and the user IS on the login page, redirect to the dashboard (/)
  if (token && isLoginPage) {
    const dashboardUrl = new URL('/', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

/**
 * Configure which routes the middleware should run on.
 * Excludes API routes, static files, images, and favicon.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - logo-app.png, login-imag.png (login assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|logo-app.png|login-imag.png).*)',
  ],
};
