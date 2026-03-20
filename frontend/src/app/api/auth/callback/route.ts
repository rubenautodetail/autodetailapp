import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/auth/callback
 * Handles Supabase email link callbacks (password reset, email confirmation).
 * Exchanges the PKCE code for a session and redirects to the appropriate page.
 */
export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const rawNext = searchParams.get('next') ?? '/en'

    // Prevent open redirect — only allow relative paths
    const next = rawNext.startsWith('/') ? rawNext : '/en'

    // Extract locale from `next` for error redirects (e.g. /es/reset-password → es)
    const localeMatch = next.match(/^\/(en|es)(\/|$)/)
    const locale = localeMatch ? localeMatch[1] : 'en'

    const isContractorFlow = next.includes('contractor')
    const loginPath = isContractorFlow ? `/${locale}/contractor/login` : `/${locale}/login`

    if (!code) {
        return NextResponse.redirect(`${origin}${loginPath}`)
    }

    // Initialize response that will be returned
    let supabaseResponse = NextResponse.next({ request })

    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
        // Redirect to login with error, preserving cookies
        const loginUrl = new URL(`${loginPath}?error=auth_failed`, origin)
        // Copy cookies from supabaseResponse to redirect response
        const redirect = NextResponse.redirect(loginUrl)
        supabaseResponse.cookies.getAll().forEach((cookie) => {
            redirect.cookies.set(cookie.name, cookie.value, cookie)
        })
        return redirect
    }

    // Redirect to next URL, preserving cookies
    const redirectUrl = new URL(next, origin)
    const redirect = NextResponse.redirect(redirectUrl)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirect.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirect
}
