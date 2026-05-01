import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);
const COURSE_SALES_PATH = '/de/kurse/eu-ai-act-officer';

function shouldEnforceHttps(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'production') {
    return false;
  }

  if (process.env.SECURITY_ENFORCE_HTTPS === '0') {
    return false;
  }

  const hostname = getRequestHostname(request);
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
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

function getRequestHostname(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = forwardedHost ?? request.headers.get('host') ?? '';
  if (host.startsWith('[')) {
    const closingBracketIndex = host.indexOf(']');
    return closingBracketIndex > 0
      ? host.slice(1, closingBracketIndex).toLowerCase()
      : host.toLowerCase();
  }

  return host.split(':')[0]?.toLowerCase() ?? '';
}

function isCourseSalesDomain(request: NextRequest): boolean {
  const hostname = getRequestHostname(request);
  return hostname === 'eukigesetz.com' || hostname === 'www.eukigesetz.com';
}

function shouldServeCourseLanding(pathname: string): boolean {
  return pathname === '/' || pathname === '/de' || pathname === '/de/';
}

function shouldServeArchivedLegacyHome(pathname: string): boolean {
  return pathname === '/legacy-home' || pathname === '/legacy-home/';
}

export default function middleware(request: NextRequest) {
  if (shouldEnforceHttps(request)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.protocol = 'https:';
    return applySecurityHeaders(NextResponse.redirect(redirectUrl, 308));
  }

  // Affiliate link: /ref/{slug} -> set cookie and redirect to home.
  const refMatch = request.nextUrl.pathname.match(/^\/ref\/([a-z0-9_-]+)$/i);
  if (refMatch) {
    const slug = refMatch[1];
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.set('kiregister_ref', slug, {
      maxAge: 90 * 24 * 60 * 60,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    return applySecurityHeaders(response);
  }

  if (
    isCourseSalesDomain(request) &&
    shouldServeArchivedLegacyHome(request.nextUrl.pathname)
  ) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/legacy-home/index.html';
    return applySecurityHeaders(NextResponse.redirect(redirectUrl, 308));
  }

  if (
    isCourseSalesDomain(request) &&
    shouldServeCourseLanding(request.nextUrl.pathname)
  ) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = COURSE_SALES_PATH;
    return applySecurityHeaders(NextResponse.rewrite(rewriteUrl));
  }

  return applySecurityHeaders(intlMiddleware(request));
}

export const config = {
  // Match all routes except:
  // - API routes (/api/...)
  // - Next.js internals (/_next/...)
  // - Static files (files with extensions like .png, .jpg, .ico, etc.)
  // - Vercel internals (/_vercel/...)
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',
    // Also run for root
    '/',
  ],
};
