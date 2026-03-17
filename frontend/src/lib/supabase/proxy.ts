import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
    // Note: /api/admin/* and /api/contractors/register are excluded here —
    // those routes run their own auth checks internally.
    const isPublicApi =
        path.startsWith('/api/auth/') ||
        path.startsWith('/api/booking/validate-zip') ||
        path.startsWith('/api/booking/availability') ||
        path.startsWith('/api/booking/approve') ||   // email-link code-protected
        path.startsWith('/api/admin/') ||            // route handlers own their auth
        path === '/api/contractors/register'         // applicant has role='user', route checks auth itself

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
    // Use regex to avoid false-match on /admin/bookings (which also contains '/booking')
    const isBookingRoute =
        (/\/[a-z]{2}\/booking(\/|$)/.test(path) && !path.includes('/booking/approve')) ||
        path.startsWith('/api/booking/create') ||
        path.startsWith('/api/payments/')

    // Contractor-facing pages & APIs
    // Use regex to avoid false-match on /contractors (public landing) — only match /contractor/ or /contractor end
    const isContractorRoute =
        /\/[a-z]{2}\/contractor(\/|$)/.test(path) ||
        path.startsWith('/api/contractors/')

    // Admin-facing pages & APIs (exclude /admin/login — it's an auth page)
    const isAdminRoute =
        (path.includes('/admin') && !path.includes('/admin/login')) ||
        path.startsWith('/api/admin/')

    // ─── Redirect unauthenticated users ───────────────────────────────────────

    // Enforce authentication for ALL protected routes (including booking)
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
            return NextResponse.redirect(loginUrl)
        }
    }

    // ─── Redirect authenticated users away from auth pages ────────────────────
    // Skip contractor login — it has its own role-based redirect logic
    const isContractorLogin = path.includes('/contractor/login')
    if (user && isAuthPage && !isContractorLogin) {
        const homeUrl = request.nextUrl.clone()
        homeUrl.pathname = `/${locale}`
        homeUrl.search = ''
        return NextResponse.redirect(homeUrl)
    }

    // ─── Role enforcement for admin & contractor pages ─────────────────────────
    if (user && (isAdminRoute || (isContractorRoute && !isContractorLogin))) {
        // Fetch role from profiles (single lightweight query)
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, approval_status')
            .eq('id', user.id)
            .single()

        const role = (profile as { role?: string } | null)?.role

        // Admin routes: must have role='admin'
        if (isAdminRoute && role !== 'admin') {
            if (path.startsWith('/api/')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            const redirectUrl = request.nextUrl.clone()
            redirectUrl.search = ''
            // Send user to their own area, not someone else's
            if (role === 'contractor') {
                redirectUrl.pathname = `/${locale}/contractor/dashboard`
            } else {
                redirectUrl.pathname = `/${locale}/dashboard`
            }
            return NextResponse.redirect(redirectUrl)
        }

        // Contractor pages: must have role='contractor' or 'admin'
        if (isContractorRoute && role !== 'contractor' && role !== 'admin') {
            if (path.startsWith('/api/')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            const redirectUrl = request.nextUrl.clone()
            redirectUrl.search = ''
            // Send user to their own area
            if (role === 'admin') {
                redirectUrl.pathname = `/${locale}/admin`
            } else {
                redirectUrl.pathname = `/${locale}/dashboard`
            }
            return NextResponse.redirect(redirectUrl)
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
