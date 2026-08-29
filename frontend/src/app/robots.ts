import { MetadataRoute } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://dtailwash.com';

const PUBLIC_ALLOW = ['/', '/en/', '/es/'];
const PRIVATE_DISALLOW = [
    '/en/admin/',
    '/es/admin/',
    '/en/contractor/',
    '/es/contractor/',
    '/en/dashboard/',
    '/es/dashboard/',
    '/en/customer/',
    '/es/customer/',
    '/en/login',
    '/es/login',
    '/en/register',
    '/es/register',
    '/en/forgot-password',
    '/es/forgot-password',
    '/en/reset-password',
    '/es/reset-password',
    '/api/',
];

// AI crawlers, as of the 2026 taxonomy (training, search/retrieval, and
// user-triggered fetchers). Marketing content only, no confidential data —
// allowed everywhere the wildcard rule is, to maximize AI-search citation
// surface (Google-Extended/Applebot-Extended included: we want training
// inclusion too, not just search inclusion).
const AI_CRAWLERS = [
    'GPTBot',
    'OAI-SearchBot',
    'ChatGPT-User',
    'ClaudeBot',
    'Claude-User',
    'Claude-SearchBot',
    'PerplexityBot',
    'Perplexity-User',
    'Amazonbot',
    'Meta-ExternalAgent',
    'CCBot',
    'Applebot',
    'Applebot-Extended',
    'Google-Extended',
    'Google-CloudVertexBot',
    'Bingbot',
    'DuckAssistBot',
    'MistralAI-User',
];

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: PUBLIC_ALLOW,
                disallow: PRIVATE_DISALLOW,
            },
            {
                userAgent: AI_CRAWLERS,
                allow: PUBLIC_ALLOW,
                disallow: PRIVATE_DISALLOW,
            },
        ],
        sitemap: `${APP_URL}/sitemap.xml`,
    };
}
