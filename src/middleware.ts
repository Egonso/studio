import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

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
