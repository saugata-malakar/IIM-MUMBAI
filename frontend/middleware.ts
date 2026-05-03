import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple middleware — no Clerk, no external keys needed
// Protects /dashboard routes by checking for auth cookie
export function middleware(request: NextRequest) {
  const token = request.cookies.get('medshield_auth')?.value;
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard');

  if (isDashboard && !token) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
