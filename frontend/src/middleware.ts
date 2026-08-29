import { type NextRequest, NextResponse } from 'next/server'
import { i18n } from './i18n-config'
import { updateSession } from '@/lib/supabase/proxy'

export default async function proxy(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    // ── 1. Locale redirect for UI routes ──────────────────────────────────────
    if (!pathname.startsWith('/api/')) {
        const pathnameIsMissingLocale = i18n.locales.every(
            (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
        )
        
        // If it's missing the locale (e.g., accessed /dashboard instead of /en/dashboard)
        if (pathnameIsMissingLocale) {
            const locale = i18n.defaultLocale
            return NextResponse.redirect(
                new URL(`/${locale}${pathname.startsWith('/') ? '' : '/'}${pathname}`, request.url)
            )
        }
    }

    // ── 2. Handle Session & Auth Protection ──────────────────────────────────
    // updateSession handles session refresh AND route/role protection
const locale = i18n.locales.find((l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`) || i18n.defaultLocale
const response = await updateSession(request)
response.headers.set('x-locale', locale)
return response
}

export const config = {
    matcher: [
        // Do NOT exclude /api/! We must run middleware on /api/ to refresh Supabase cookies
        // Metadata routes (robots.txt, sitemap.xml, llms.txt, opengraph-image, etc.) live at
        // the root, not under /en or /es — the locale redirect above would otherwise 404 them.
        '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|llms.txt|opengraph-image|twitter-image|icon\\.png|apple-icon\\.png|manifest.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
