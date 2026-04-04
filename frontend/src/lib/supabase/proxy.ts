import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getProfile, isAdmin, isContractor, isApprovedContractor, type UserProfile } from '@/lib/auth/guards'

/**
 * Extract locale from path (/en/... or /es/...).
 * Falls back to 'en' for unlocalized paths.
 */
const VALID_LOCALES = ['en', 'es'] as const;
type Locale = typeof VALID_LOCALES[number];

function getLocale(path: string): Locale {
    const match = path.match(/^\/([a-z]{2})(\/|$)/)
    const candidate = match?.[1]
    return (VALID_LOCALES as readonly string[]).includes(candidate ?? '') ? candidate as Locale : 'en'
}

/**
 * Create a redirect response that forwards all Supabase session cookies.
 * Without this, refreshed tokens are lost when middleware returns a redirect,
 * causing a stale-cookie loop that only clears in incognito mode.
 */
function cookiedRedirect(supabaseResponse: NextResponse, destination: URL): NextResponse {
    const redirect = NextResponse.redirect(destination)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirect.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirect
}

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Required for SSR — refresh the session on every request
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname
    const locale = getLocale(path)

    // ─── Route classification ──────────────────────────────────────────────────

    const isPublicApi =
        path.startsWith('/api/auth/') ||
        path.startsWith('/api/booking/validate-zip') ||
        path.startsWith('/api/booking/availability') ||
        path.startsWith('/api/booking/approve') ||
        path.startsWith('/api/services/') ||        // public service catalog
        path.startsWith('/api/admin/') ||
        path.startsWith('/api/payments/webhook') ||
        path === '/api/contractors/register'

    const isAuthPage =
        !path.startsWith('/api/') && (
            path.includes('/login') ||
            path.includes('/register')
        )

    const isLandingPage =
        path === `/${locale}` ||
        path === `/${locale}/` ||
        path === '/' ||
        path === ''

    const isBookingRoute =
        (/\/[a-z]{2}\/booking(\/|$)/.test(path) && !path.includes('/booking/approve')) ||
        path.startsWith('/api/booking/create') ||
        path.startsWith('/api/payments/')

    const isContractorRoute =
        /\/[a-z]{2}\/contractor(\/|$)/.test(path) ||
        (path.startsWith('/api/contractors/') && path !== '/api/contractors/register')

    const isAdminRoute =
        (path.includes('/admin') && !path.includes('/admin/login')) ||
        path.startsWith('/api/admin/')

    // ─── Redirect unauthenticated users ───────────────────────────────────────

    const isCustomerRoute = path.includes('/dashboard') || path.includes('/customer')
    const isProtectedRoute = isContractorRoute || isAdminRoute || isCustomerRoute || isBookingRoute
    if (!isPublicApi && !isAuthPage && !isLandingPage && isProtectedRoute) {
        if (!user) {
            if (path.startsWith('/api/')) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }
            const loginUrl = request.nextUrl.clone()
            loginUrl.pathname = isAdminRoute
                ? `/${locale}/admin/login`
                : isContractorRoute
                    ? `/${locale}/contractor/login`
                    : `/${locale}/login`
            loginUrl.searchParams.set('next', path)
            return cookiedRedirect(supabaseResponse, loginUrl)
        }
    }

    // ─── Single profile fetch for all remaining guard checks ──────────────────
    // Only fetch when we have a logged-in user and might need role info.
    let profile: UserProfile | null = null
    const needsProfile = user && (isAuthPage || isAnyLoginPage() || isCustomerRoute || isAdminRoute || isContractorRoute)

    function isAnyLoginPage(): boolean {
        return path.includes('/contractor/login') || path.includes('/admin/login') || path.endsWith('/login')
    }

    if (needsProfile) {
        profile = await getProfile(supabase, user.id)
    }

    const isContractorLogin = path.includes('/contractor/login')
    const isAdminLogin = path.includes('/admin/login')
    const anyLoginPage = isAnyLoginPage()

    // ─── Redirect authenticated users away from auth pages ─────────────────────
    // For contractor flow: send them straight to /contractors/apply (skip register)
    if (user && isAuthPage && !anyLoginPage) {
        const next = request.nextUrl.searchParams.get('next')
        const dest = request.nextUrl.clone()
        dest.search = ''

        // Only honor ?next= if it matches the user's role (prevent cross-role redirect)
        const nextAllowed = next && next.startsWith('/') &&
            (isAdmin(profile) ? next.includes('/admin') :
             isContractor(profile) ? (next.includes('/contractor') || next.includes('/contractors')) :
             !next.includes('/admin') && !next.includes('/contractor'))

        if (nextAllowed) {
            dest.pathname = next
        } else {
            // Default destination by role
            dest.pathname = isAdmin(profile) ? `/${locale}/admin`
                : isContractor(profile) ? `/${locale}/contractor/dashboard`
                : `/${locale}/dashboard`
        }
        return cookiedRedirect(supabaseResponse, dest)
    }

    // ─── Redirect logged-in users on login pages to their correct portal ────────
    // Prevents e.g. a contractor sitting on user login, or user sitting on contractor login
    if (user && anyLoginPage && profile?.role) {
        // Already on correct login page → let client-side handle it
        const onCorrectPage =
            (profile.role === 'user' && !isContractorLogin && !isAdminLogin) ||
            (profile.role === 'contractor' && isContractorLogin) ||
            (profile.role === 'admin' && isAdminLogin)

        if (!onCorrectPage) {
            const dest = request.nextUrl.clone()
            dest.search = ''
            if (isAdmin(profile)) {
                dest.pathname = `/${locale}/admin`
            } else if (isContractor(profile)) {
                dest.pathname = isApprovedContractor(profile)
                    ? `/${locale}/contractor/dashboard`
                    : !profile.approval_status
                        ? `/${locale}/contractors/apply`
                        : `/${locale}/contractor/pending`
            } else {
                dest.pathname = `/${locale}/dashboard`
            }
            return cookiedRedirect(supabaseResponse, dest)
        }
    }

    // ─── Role enforcement for customer dashboard — redirect non-users ─────────
    if (user && isCustomerRoute && !isAdminRoute && !isContractorRoute) {
        if (isContractor(profile)) {
            const dest = request.nextUrl.clone()
            dest.pathname = `/${locale}/contractor/dashboard`
            dest.search = ''
            return cookiedRedirect(supabaseResponse, dest)
        }
        if (isAdmin(profile)) {
            const dest = request.nextUrl.clone()
            dest.pathname = `/${locale}/admin`
            dest.search = ''
            return cookiedRedirect(supabaseResponse, dest)
        }
    }

    // ─── Role enforcement for admin & contractor pages ─────────────────────────
    if (user && ((isAdminRoute && !isAdminLogin) || (isContractorRoute && !isContractorLogin))) {
        if (!profile) {
            if (isAdminRoute) {
                const loginUrl = request.nextUrl.clone()
                loginUrl.pathname = `/${locale}/admin/login`
                loginUrl.search = ''
                return cookiedRedirect(supabaseResponse, loginUrl)
            }
            if (isContractorRoute) {
                const loginUrl = request.nextUrl.clone()
                loginUrl.pathname = `/${locale}/contractor/login`
                loginUrl.search = ''
                return cookiedRedirect(supabaseResponse, loginUrl)
            }
        }

        if (isAdminRoute && !isAdmin(profile)) {
            if (path.startsWith('/api/')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            const loginUrl = request.nextUrl.clone()
            loginUrl.pathname = `/${locale}/admin/login`
            loginUrl.search = ''
            return cookiedRedirect(supabaseResponse, loginUrl)
        }

        if (isContractorRoute && !isContractor(profile) && !isAdmin(profile)) {
            if (path.startsWith('/api/')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            const loginUrl = request.nextUrl.clone()
            loginUrl.pathname = `/${locale}/contractor/login`
            loginUrl.search = ''
            return cookiedRedirect(supabaseResponse, loginUrl)
        }

        if (isContractorRoute && isContractor(profile) && !isApprovedContractor(profile)) {
            // No application submitted yet → send to apply form
            if (!profile?.approval_status && !path.includes('/contractors/apply')) {
                const applyUrl = request.nextUrl.clone()
                applyUrl.pathname = `/${locale}/contractors/apply`
                applyUrl.search = ''
                return cookiedRedirect(supabaseResponse, applyUrl)
            }
            // Applied but not yet approved → send to pending
            if (profile?.approval_status && !path.includes('/contractor/pending')) {
                const pendingUrl = request.nextUrl.clone()
                pendingUrl.pathname = `/${locale}/contractor/pending`
                pendingUrl.search = ''
                return cookiedRedirect(supabaseResponse, pendingUrl)
            }
        }
    }

    return supabaseResponse
}
