import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const { pathname } = request.nextUrl;

  // Public paths (chess-test and socket endpoint are intentionally public)
  if (
    pathname === '/' ||
    pathname.startsWith('/api/auth') ||
    pathname === '/api/setup' ||
    pathname.startsWith('/api/socket') ||
    pathname.startsWith('/chess-test')
  ) {
    if (token && pathname === '/') {
      // Redirect authenticated users away from login
      try {
        const payload = await verifyToken(token);
        if (payload) {
          return NextResponse.redirect(new URL(`/dashboard/${payload.role.toLowerCase()}`, request.url));
        }
      } catch (e) {
        // Token invalid, continue to login
      }
    }
    return NextResponse.next();
  }

  // Protected paths
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api')) {
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Role-based routing
    if (pathname.startsWith('/dashboard/admin') && payload.role !== 'ADMIN') {
      return NextResponse.redirect(new URL(`/dashboard/${payload.role.toLowerCase()}`, request.url));
    }
    if (pathname.startsWith('/dashboard/coach') && payload.role !== 'COACH') {
      return NextResponse.redirect(new URL(`/dashboard/${payload.role.toLowerCase()}`, request.url));
    }
    if (pathname.startsWith('/dashboard/student') && payload.role !== 'STUDENT') {
      return NextResponse.redirect(new URL(`/dashboard/${payload.role.toLowerCase()}`, request.url));
    }

    // Attach user info to headers for API routes if needed
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.id);
    requestHeaders.set('x-user-role', payload.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|api/socket|favicon.ico).*)'],
};
