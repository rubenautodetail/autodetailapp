import { MetadataRoute } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://dtailwash.com';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: ['/', '/en/', '/es/'],
                disallow: [
                    '/en/admin/',
                    '/es/admin/',
                    '/en/contractor/',
                    '/es/contractor/',
                    '/en/dashboard/',
                    '/es/dashboard/',
                    '/api/',
                ],
            },
        ],
        sitemap: `${APP_URL}/sitemap.xml`,
    };
}
