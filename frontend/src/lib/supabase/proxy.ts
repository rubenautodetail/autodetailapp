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

/**
 * Create a redirect response that forwards all Supabase session cookies.
 * Without this, refreshed tokens are lost when middleware returns a redirect,
 * causing a stale-cookie loop that only clears in incognito mode.
 */
function cookiedRedirect(supabaseResponse: NextResponse, destination: URL): NextResponse {
    const redirect = NextResponse.redirect(destination)
    supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
        redirect.cookies.set(name, value)
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

    const isPublicApi =
        path.startsWith('/api/auth/') ||
        path.startsWith('/api/booking/validate-zip') ||
        path.startsWith('/api/booking/availability') ||
        path.startsWith('/api/booking/approve') ||
        path.startsWith('/api/services/') ||        // public service catalog
        path.startsWith('/api/admin/') ||
        path === '/api/contractors/register'

    const isAuthPage =
        path.includes('/login') ||
        path.includes('/register')

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
        path.startsWith('/api/contractors/')

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

    // ─── Redirect authenticated users away from /register ─────────────────────
    const isContractorLogin = path.includes('/contractor/login')
    const isAdminLogin = path.includes('/admin/login')
    const isAnyLoginPage = isContractorLogin || isAdminLogin || path.endsWith('/login')
    if (user && isAuthPage && !isAnyLoginPage) {
        const next = request.nextUrl.searchParams.get('next')
        const dest = request.nextUrl.clone()
        dest.search = ''
        if (next && next.startsWith('/')) {
            dest.pathname = next
        } else {
            dest.pathname = `/${locale}`
        }
        return cookiedRedirect(supabaseResponse, dest)
    }

    // ─── Role enforcement for admin & contractor pages ─────────────────────────
    if (user && ((isAdminRoute && !isAdminLogin) || (isContractorRoute && !isContractorLogin))) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, approval_status')
            .eq('id', user.id)
            .single()

        const role = (profile as { role?: string } | null)?.role

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

        if (isAdminRoute && role !== 'admin') {
            if (path.startsWith('/api/')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            const loginUrl = request.nextUrl.clone()
            loginUrl.pathname = `/${locale}/admin/login`
            loginUrl.search = ''
            return cookiedRedirect(supabaseResponse, loginUrl)
        }

        if (isContractorRoute && role !== 'contractor' && role !== 'admin') {
            if (path.startsWith('/api/')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            const loginUrl = request.nextUrl.clone()
            loginUrl.pathname = `/${locale}/contractor/login`
            loginUrl.search = ''
            return cookiedRedirect(supabaseResponse, loginUrl)
        }

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
            return cookiedRedirect(supabaseResponse, pendingUrl)
        }
    }

    return supabaseResponse
}
