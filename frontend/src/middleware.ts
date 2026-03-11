import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
    return updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Run on all paths except:
         * - _next/static (static files)
         * - _next/image  (image optimization)
         * - favicon.ico, sitemap.xml, robots.txt (metadata)
         * - Public assets
         */
        '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
