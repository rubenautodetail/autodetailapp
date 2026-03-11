import { type NextRequest, NextResponse } from 'next/server'
import { i18n } from './i18n-config'
import { createServerClient } from '@supabase/ssr'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Next.js proxy (middleware).
 *
 * Order of operations:
 *  1. Redirect missing-locale paths to the default locale.
 *  2. Refresh the Supabase session cookie.
 *  3. Enforce role-based route protection:
 *     - /dashboard, /customer/**  → any authenticated user
 *     - /contractor/**            → role: contractor | admin
 *     - /admin/**                 → role: admin
 *     - /booking/**               → public (guest checkout allowed)
 *     - /login, /register, etc.  → redirect logged-in users to their dashboard
 */
export default async function proxy(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    // ── 1. Locale redirect ────────────────────────────────────────────────────
    const pathnameIsMissingLocale = i18n.locales.every(
        (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
    )
    if (pathnameIsMissingLocale) {
        const locale = i18n.defaultLocale
        return NextResponse.redirect(
            new URL(`/${locale}${pathname.startsWith('/') ? '' : '/'}${pathname}`, request.url)
        )
    }

    // ── 2. Refresh Supabase session (must happen on every matched request) ────
    const supabaseResponse = await updateSession(request)

    // ── 3. Extract locale from path ───────────────────────────────────────────
    const localeMatch = pathname.match(/^\/([a-z]{2})(\/|$)/)
    const locale = localeMatch ? localeMatch[1] : i18n.defaultLocale

    // ── 4. Categorise the request ─────────────────────────────────────────────
    // Booking is intentionally public — guests can book without an account.
    const isBookingRoute     = pathname.includes(`/${locale}/booking`)
    const isCustomerRoute    = pathname.includes(`/${locale}/dashboard`) || pathname.includes(`/${locale}/customer`)
    const isContractorRoute  = pathname.includes(`/${locale}/contractor`)
    const isAdminRoute       = pathname.includes(`/${locale}/admin`)
    const isAuthRoute        = pathname.includes(`/${locale}/login`) ||
                               pathname.includes(`/${locale}/register`) ||
                               pathname.includes(`/${locale}/forgot-password`)

    // Nothing to guard — pass through
    if (!isBookingRoute && !isCustomerRoute && !isContractorRoute && !isAdminRoute && !isAuthRoute) {
        return supabaseResponse
    }

    // Booking routes are always open
    if (isBookingRoute) return supabaseResponse

    // ── 5. Read the current user ──────────────────────────────────────────────
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return request.cookies.getAll() },
                setAll() { /* already handled by updateSession */ },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // ── 6. Unauthenticated → redirect to login ────────────────────────────────
    if (!user && (isCustomerRoute || isContractorRoute || isAdminRoute)) {
        const url = request.nextUrl.clone()
        url.pathname = `/${locale}/login`
        url.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(url)
    }

    // ── 7. Role-based guards for contractor / admin routes ────────────────────
    if (user && (isContractorRoute || isAdminRoute)) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const role = profile?.role as string | undefined

        if (isAdminRoute && role !== 'admin') {
            const url = request.nextUrl.clone()
            url.pathname = role === 'contractor'
                ? `/${locale}/contractor/dashboard`
                : `/${locale}/dashboard`
            url.search = ''
            return NextResponse.redirect(url)
        }

        if (isContractorRoute && role !== 'contractor' && role !== 'admin') {
            const url = request.nextUrl.clone()
            url.pathname = `/${locale}/dashboard`
            url.search = ''
            return NextResponse.redirect(url)
        }
    }

    // ── 8. Redirect logged-in users away from auth pages ─────────────────────
    if (user && isAuthRoute) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const role = profile?.role as string | undefined
        const url = request.nextUrl.clone()
        url.pathname = role === 'admin'
            ? `/${locale}/admin`
            : role === 'contractor'
            ? `/${locale}/contractor/dashboard`
            : `/${locale}/dashboard`
        url.search = ''
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}

