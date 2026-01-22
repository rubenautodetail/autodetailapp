import { NextRequest, NextResponse } from 'next/server';
import { i18n, type Locale } from './i18n-config';

function getLocale(request: NextRequest): string {
    // Check for locale cookie first
    const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
    if (cookieLocale && i18n.locales.includes(cookieLocale as Locale)) {
        return cookieLocale;
    }

    // Then check Accept-Language header
    const acceptLanguage = request.headers.get('accept-language');
    if (acceptLanguage) {
        const preferredLocale = acceptLanguage
            .split(',')
            .map(lang => lang.split(';')[0].trim().substring(0, 2))
            .find(lang => i18n.locales.includes(lang as Locale));

        if (preferredLocale) {
            return preferredLocale;
        }
    }

    return i18n.defaultLocale;
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip middleware for static files, API routes, and Next.js internals
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.includes('.') // Static files like .svg, .png, etc.
    ) {
        return NextResponse.next();
    }

    // Check if pathname already has a locale
    const pathnameHasLocale = i18n.locales.some(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    if (pathnameHasLocale) {
        return NextResponse.next();
    }

    // Redirect to the localized path
    const locale = getLocale(request);
    const newUrl = new URL(`/${locale}${pathname}`, request.url);

    return NextResponse.redirect(newUrl);
}

export const config = {
    matcher: [
        // Match all paths except static files and API routes
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
    ],
};
