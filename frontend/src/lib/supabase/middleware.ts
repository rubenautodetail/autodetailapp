import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

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
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname

    console.log('[Middleware] Checking path:', path)
    console.log('[Middleware] User authenticated:', !!user)

    // Check for protected routes (ignoring locale prefix)
    // Matches /dashboard, /en/dashboard, /es/dashboard, etc.
    const isProtectedRoute =
        path.includes('/dashboard') ||
        path.includes('/contractor')

    // Check for auth routes
    const isAuthRoute =
        path.includes('/login') ||
        path.includes('/auth') ||
        path.includes('/register')

    if (!user && isProtectedRoute && !isAuthRoute) {
        console.log('[Middleware] Redirecting unauthenticated user to login')
        const url = request.nextUrl.clone()

        // Preserve locale if present
        // If path is /en/dashboard, redirect to /en/login
        const localeMatch = path.match(/^\/([a-z]{2})\//)
        const locale = localeMatch ? localeMatch[1] : 'en'

        url.pathname = `/${locale}/login`
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
