/**
 * Creates Spanish locale + LandingHero + Testimonial models in HyGraph.
 * Uses the Permanent Auth Token (must have management permissions enabled).
 *
 * Run: node scripts/migrate-hygraph-schema.mjs
 */

import { Client, SimpleFieldType } from '@hygraph/management-sdk';

const TOKEN = process.env.HYGRAPH_TOKEN ?? 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImdjbXMtbWFpbi1wcm9kdWN0aW9uIn0.eyJ2ZXJzaW9uIjozLCJpYXQiOjE3NzI4MzE2OTMsImF1ZCI6WyJodHRwczovL2FwaS11cy13ZXN0LTIuaHlncmFwaC5jb20vdjIvY21tOXNxajQzMDEyejA3d2Qyc3JpemVxaC9tYXN0ZXIiLCJtYW5hZ2VtZW50LW5leHQuZ3JhcGhjbXMuY29tIl0sImlzcyI6Imh0dHBzOi8vbWFuYWdlbWVudC11cy13ZXN0LTIuaHlncmFwaC5jb20vIiwic3ViIjoiOTNhOTdiNjYtMjRiMi00YWQ4LWE0YjgtNjAxMzllY2IxZjkwIiwianRpIjoiY21tZmU3dG5hMDN4NzA2bXo0N2FhYzY0cyJ9.ojmv2p5lkEWFxQtexCtKdbsNypN-S3ambzg68Lfc5x0gdXUlQpbcwfIUliwRZ9OzFb6KI-sPLQfbAM3nX4mv0CB3lPskLZU_lk8GGi1xLTYgx5tqPGEOTL6bOIkx2DgosQHWT4qtjx4FBPYUqlK-up7EhT6l0ODKkqyywCFzyjzgiR5ppDygOLI1lWxx1ZO2V3mDcPe_BFidw689Q_UtHj0kcBbC-m7de0YEwRvCl2kjX5l1F-VVhMSjTomQ4GNmll666RBiy0Rp-vyTtzDZya4TuLzgzoDLqwurjIqsYvhPTXVGqWEeIp5am57oRgNAK6XMIhR19_LYMML6LvdanxFHm2NeCs7gkEsuZdINvhR1lO1c0m3yJPOIg1mktDjxntH6D43YkeE9E3HcztTSNu_GmfFmkinrwAJgHZuLz-KIY5t9nQ1AdYYe32xw2aU2ubtFZXAls-vKh4N5D_BdnOfGMn-Ocu3klpxG27SRtJl4bgnL-DJaivpWE8I22MfaAPwGBvYhTwMgtSw13aop6RkYUB0A_Xto41j4Hpbsq7SDAQYxKGebJHLxr2Kj5OJ2FTj7pqnAIpZAQJNsF-P2QSF0DIXkfZp1FlhvwODzLSDluT0dx3Kln70RkJmVhI_dVgd8128NVWryGamT1SLTZrzjj3KF7m3zTQ3p5GBFT7Q';

// endpoint = Content API URL (SDK derives management URL from this)
const ENDPOINT = 'https://api-us-west-2.hygraph.com/v2/cmm9sqj43012z07wd2srizeqh/master';

const client = new Client({
    authToken: TOKEN,
    endpoint: ENDPOINT,
    name: 'add-landing-hero-and-testimonial-models',
});

// ─── Spanish locale ────────────────────────────────────────────────────────────
client.createLocale({
    apiId: 'es',
    displayName: 'Spanish',
});

// ─── LandingHero model ─────────────────────────────────────────────────────────
client.createModel({
    apiId: 'LandingHero',
    apiIdPlural: 'LandingHeroes',
    displayName: 'Landing Hero',
    description: 'Hero section content for the landing page',
});

client.createSimpleField({
    parentApiId: 'LandingHero',
    apiId: 'heading',
    displayName: 'Heading',
    type: SimpleFieldType.String,
    isRequired: true,
    isLocalized: true,
});

client.createSimpleField({
    parentApiId: 'LandingHero',
    apiId: 'subheading',
    displayName: 'Subheading',
    type: SimpleFieldType.String,
    isRequired: true,
    isLocalized: true,
});

client.createSimpleField({
    parentApiId: 'LandingHero',
    apiId: 'ctaText',
    displayName: 'CTA Text',
    type: SimpleFieldType.String,
    isRequired: true,
    isLocalized: true,
});

client.createSimpleField({
    parentApiId: 'LandingHero',
    apiId: 'badgeText',
    displayName: 'Badge Text',
    type: SimpleFieldType.String,
    isLocalized: true,
});

// ─── Testimonial model ─────────────────────────────────────────────────────────
client.createModel({
    apiId: 'Testimonial',
    apiIdPlural: 'Testimonials',
    displayName: 'Testimonial',
    description: 'Customer testimonials shown on landing page',
});

client.createSimpleField({
    parentApiId: 'Testimonial',
    apiId: 'authorName',
    displayName: 'Author Name',
    type: SimpleFieldType.String,
    isRequired: true,
});

client.createSimpleField({
    parentApiId: 'Testimonial',
    apiId: 'location',
    displayName: 'Location',
    type: SimpleFieldType.String,
    isRequired: true,
});

client.createSimpleField({
    parentApiId: 'Testimonial',
    apiId: 'rating',
    displayName: 'Rating',
    type: SimpleFieldType.Int,
    isRequired: true,
});

client.createSimpleField({
    parentApiId: 'Testimonial',
    apiId: 'text',
    displayName: 'Review Text',
    type: SimpleFieldType.String,
    isRequired: true,
});

client.createSimpleField({
    parentApiId: 'Testimonial',
    apiId: 'vehicleType',
    displayName: 'Vehicle Type',
    type: SimpleFieldType.String,
    isRequired: true,
});

// ─── Run ───────────────────────────────────────────────────────────────────────
console.log('Running schema migration...');

client.run(true).then((result) => {
    if (result.errors) {
        console.error('Migration errors:', JSON.stringify(result.errors, null, 2));
        process.exit(1);
    }
    console.log('Schema migration complete:', result.name, '— finished at', result.finishedAt);
    console.log('\nNext: run the seed script:');
    console.log('  node scripts/seed-hygraph.mjs');
}).catch((err) => {
    console.error('Fatal:', err.message);
    process.exit(1);
});
