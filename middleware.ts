import { NextRequest, NextResponse } from 'next/server';

function shouldEnforceHttps(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'production') {
    return false;
  }

  if (process.env.SECURITY_ENFORCE_HTTPS === '0') {
    return false;
  }

  const forwardedProto = request.headers.get('x-forwarded-proto');
  return forwardedProto === 'http';
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-site');
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  return response;
}

export function middleware(request: NextRequest) {
  if (shouldEnforceHttps(request)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.protocol = 'https:';
    return applySecurityHeaders(NextResponse.redirect(redirectUrl, 308));
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
