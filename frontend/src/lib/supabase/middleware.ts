import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Extract locale from path (/en/... or /es/...).
 * Falls back to 'en' for unlocalized paths.
 */
function getLocale(path: string): string {
    const match = path.match(/^\/([a-z]{2})\//)
    return match ? match[1] : 'en'
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
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({ request })
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

    // Public API routes that never require auth
    const isPublicApi =
        path.startsWith('/api/auth/') ||
        path.startsWith('/api/booking/validate-zip') ||
        path.startsWith('/api/booking/availability') ||
        path.startsWith('/api/booking/approve')   // email-link code-protected

    // Auth pages (login / register)
    const isAuthPage =
        path.includes('/login') ||
        path.includes('/register')

    // Landing page — always public (root locale paths like /en or /en/)
    const isLandingPage =
        path === `/${locale}` ||
        path === `/${locale}/` ||
        path === '/' ||
        path === ''

    // Any booking page or API (requires authenticated customer)
    const isBookingRoute =
        (path.includes('/booking') && !path.includes('/booking/approve')) ||
        path.startsWith('/api/booking/create') ||
        path.startsWith('/api/payments/')

    // Contractor-facing pages & APIs
    const isContractorRoute =
        path.includes('/contractor') ||
        path.startsWith('/api/contractors/')

    // Admin-facing pages & APIs
    const isAdminRoute =
        path.includes('/admin') ||
        path.startsWith('/api/admin/')

    // ─── Redirect unauthenticated users ───────────────────────────────────────

    // Enforce authentication for protected routes only
    const isCustomerRoute = path.includes('/dashboard') || path.includes('/customer')
    const isProtectedRoute = isContractorRoute || isAdminRoute || isCustomerRoute
    if (!isPublicApi && !isAuthPage && !isLandingPage && !isBookingRoute && isProtectedRoute) {
        if (!user) {
            const loginUrl = request.nextUrl.clone()
            loginUrl.pathname = `/${locale}/login`
            loginUrl.searchParams.set('next', path)
            return NextResponse.redirect(loginUrl)
        }
    }

    // ─── Redirect authenticated users away from auth pages ────────────────────
    if (user && isAuthPage) {
        const homeUrl = request.nextUrl.clone()
        homeUrl.pathname = `/${locale}`
        homeUrl.search = ''
        return NextResponse.redirect(homeUrl)
    }

    // ─── Role enforcement for admin & contractor pages ─────────────────────────
    if (user && (isAdminRoute || isContractorRoute)) {
        // Fetch role from profiles (single lightweight query)
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, approval_status')
            .eq('id', user.id)
            .single()

        const role = (profile as { role?: string } | null)?.role

        // Admin routes: must have role='admin'
        if (isAdminRoute && role !== 'admin') {
            const homeUrl = request.nextUrl.clone()
            homeUrl.pathname = `/${locale}`
            homeUrl.search = ''
            return NextResponse.redirect(homeUrl)
        }

        // Contractor pages: must have role='contractor' or 'admin'
        if (isContractorRoute && role !== 'contractor' && role !== 'admin') {
            const homeUrl = request.nextUrl.clone()
            homeUrl.pathname = `/${locale}`
            homeUrl.search = ''
            return NextResponse.redirect(homeUrl)
        }

        // Contractor approval check — pending contractors see the pending page only
        const approvalStatus = (profile as { approval_status?: string } | null)?.approval_status
        if (
            isContractorRoute &&
            role === 'contractor' &&
            approvalStatus !== 'approved' &&
            !path.includes('/contractor/pending')
        ) {
            const pendingUrl = request.nextUrl.clone()
            pendingUrl.pathname = `/${locale}/contractor/pending`
            pendingUrl.search = ''
            return NextResponse.redirect(pendingUrl)
        }
    }

    return supabaseResponse
}
