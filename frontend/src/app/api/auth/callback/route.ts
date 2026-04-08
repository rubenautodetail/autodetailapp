import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

/**
 * GET /api/auth/callback
 * Handles Supabase email link callbacks (email confirmation, password reset).
 *
 * Supports two flows:
 *  1. PKCE code exchange  — ?code=XXX         (same-browser only)
 *  2. Token-hash OTP      — ?token_hash=XXX&type=signup  (cross-device, preferred)
 *
 * To enable cross-device confirmation, set the Supabase email template to:
 *   {{ .SiteURL }}/api/auth/callback?token_hash={{ .TokenHash }}&type=signup
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url)

    const code       = searchParams.get('code')
    const tokenHash  = searchParams.get('token_hash')
    const type       = searchParams.get('type') as EmailOtpType | null
    const rawNext    = searchParams.get('next') ?? '/en'

    // Prevent open redirect — only allow relative paths
    const next = rawNext.startsWith('/') ? rawNext : '/en'

    const localeMatch = next.match(/^\/(en|es)(\/|$)/)
    const locale      = localeMatch ? localeMatch[1] : 'en'

    const isContractorFlow = next.includes('contractor')
    const loginPath = isContractorFlow ? `/${locale}/contractor/login` : `/${locale}/login`

    // Neither code nor token_hash → just send to login
    if (!code && !tokenHash) {
        return NextResponse.redirect(`${origin}${loginPath}`)
    }

    const cookieStore = await cookies()
    let supabaseResponse = NextResponse.next({ request })

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

    let error: { message: string } | null = null
    let resolvedNext = next

    if (tokenHash && type) {
        const result = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
        error = result.error

        // If next is still the default, check user metadata for the stored redirect intent
        if (!error && (resolvedNext === '/en' || resolvedNext === '/es')) {
            const { data: { user } } = await supabase.auth.getUser()
            const pendingRedirect = user?.user_metadata?.pending_redirect
            if (pendingRedirect && pendingRedirect.startsWith('/')) {
                resolvedNext = pendingRedirect
            }
        }
    } else if (code) {
        const result = await supabase.auth.exchangeCodeForSession(code)
        error = result.error

        if (!error && (resolvedNext === '/en' || resolvedNext === '/es')) {
            const { data: { user } } = await supabase.auth.getUser()
            const pendingRedirect = user?.user_metadata?.pending_redirect
            if (pendingRedirect && pendingRedirect.startsWith('/')) {
                resolvedNext = pendingRedirect
            }
        }
    }

    if (error) {
        const loginUrl = new URL(`${loginPath}?error=auth_failed`, origin)
        const redirect = NextResponse.redirect(loginUrl)
        supabaseResponse.cookies.getAll().forEach((c) => {
            redirect.cookies.set(c.name, c.value, c)
        })
        return redirect
    }

    // Validate destination matches the user's actual role to prevent cross-role redirect
    const { data: { user: verifiedUser } } = await supabase.auth.getUser()
    if (verifiedUser) {
        const { data: cbProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', verifiedUser.id)
            .single()
        const cbRole = (cbProfile as { role?: string } | null)?.role
        const validRoles = ['user', 'contractor', 'admin'] as const
        type ValidRole = typeof validRoles[number]
        const isValidRole = (r: string | undefined): r is ValidRole =>
            r !== undefined && (validRoles as readonly string[]).includes(r)

        const goesAdmin = resolvedNext.includes('/admin')
        const goesContractor = resolvedNext.includes('/contractor') || resolvedNext.includes('/contractors')

        // If role is missing or invalid, send to a safe default
        if (!isValidRole(cbRole)) {
            resolvedNext = `/${locale}`
        } else if (cbRole === 'user' && (goesAdmin || goesContractor)) {
            resolvedNext = `/${locale}/dashboard`
        } else if (cbRole === 'contractor' && goesAdmin) {
            resolvedNext = `/${locale}/contractor/dashboard`
        } else if (cbRole === 'admin' && !goesAdmin && !goesContractor) {
            // Admin going to customer page — let it through (admins can access anything)
        }
    }

    // Success — redirect to destination with session cookies
    const redirectUrl = new URL(resolvedNext, origin)
    const successRedirect = NextResponse.redirect(redirectUrl)
    supabaseResponse.cookies.getAll().forEach((c) => {
        successRedirect.cookies.set(c.name, c.value, c)
    })
    return successRedirect
  } catch (err) {
    console.error('auth/callback error:', err)
    const origin = new URL(request.url).origin
    return NextResponse.redirect(new URL('/en/login?error=callback_failed', origin))
  }
}
