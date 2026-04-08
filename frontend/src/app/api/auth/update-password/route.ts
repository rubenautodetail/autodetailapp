import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        let body;
        try {
            body = await request.json()
        } catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
        }

        const { password } = body

        if (!password || password.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
        }

        const cookieStore = await cookies()
        const pendingCookies: { name: string; value: string; options: Record<string, unknown> }[] = []

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll(cookiesToSet) {
                        pendingCookies.push(...cookiesToSet)
                    },
                },
            }
        )

        const { error } = await supabase.auth.updateUser({ password })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        // Sign out so the user is forced to log in with the new password
        await supabase.auth.signOut({ scope: 'global' })

        const response = NextResponse.json({ success: true })
        pendingCookies.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
        })
        return response
    } catch (err) {
        console.error('update-password error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
