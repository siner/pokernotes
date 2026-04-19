import { type NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

// Routes that require authentication
const PROTECTED_PATHS = ['/settings'];

export default function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Strip locale prefix to check path
  const pathnameWithoutLocale = pathname.replace(/^\/(en|es)/, '') || '/';
  const isProtected = PROTECTED_PATHS.some((p) => pathnameWithoutLocale.startsWith(p));

  if (isProtected) {
    const sessionCookie =
      request.cookies.get('better-auth.session_token') ??
      request.cookies.get('__Secure-better-auth.session_token');

    if (!sessionCookie) {
      const locale = pathname.split('/')[1] ?? 'en';
      const validLocale = routing.locales.includes(locale as (typeof routing.locales)[number])
        ? locale
        : routing.defaultLocale;
      const loginUrl = new URL(`/${validLocale}/login`, request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlMiddleware(request) as NextResponse;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
