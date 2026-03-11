/**
 * Seed HyGraph with LandingHero + Testimonial content.
 *
 * Prerequisites:
 *   1. Create models in HyGraph dashboard first (see HYGRAPH_SETUP.md).
 *   2. Run: node scripts/seed-hygraph.mjs
 *
 * Uses the content API token already in frontend/.env.local
 */

const ENDPOINT = 'https://api-us-west-2.hygraph.com/v2/cmm9sqj43012z07wd2srizeqh/master';
const TOKEN = process.env.HYGRAPH_TOKEN;

if (!TOKEN) {
    console.error('Missing HYGRAPH_TOKEN. Run: HYGRAPH_TOKEN=<token> node scripts/seed-hygraph.mjs');
    process.exit(1);
}

async function gql(query, variables = {}) {
    const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify({ query, variables }),
    });
    const json = await res.json();
    if (json.errors?.length) {
        throw new Error(JSON.stringify(json.errors, null, 2));
    }
    return json.data;
}

// ─── Hero Content ─────────────────────────────────────────────────────────────

async function seedHero() {
    console.log('Seeding LandingHero (EN)...');
    const heroEn = await gql(`
        mutation CreateHeroEN {
            createLandingHero(data: {
                heading: "Premium Auto Detailing, At Your Door"
                subheading: "Book a certified detailer in minutes. We come to you — home, office, or anywhere."
                ctaText: "Check Your ZIP"
                badgeText: "Now available in Texas"
            }) { id }
        }
    `);
    console.log('  Created EN hero:', heroEn.createLandingHero.id);

    // Publish
    await gql(`
        mutation PublishHeroEN($id: ID!) {
            publishLandingHero(where: { id: $id }) { id }
        }
    `, { id: heroEn.createLandingHero.id });
    console.log('  Published EN hero');

    // Create ES locale variant
    console.log('Seeding LandingHero (ES)...');
    await gql(`
        mutation CreateHeroES($id: ID!) {
            updateLandingHero(
                where: { id: $id }
                data: {
                    localizations: {
                        upsert: {
                            locale: es
                            create: {
                                heading: "Detallado Premium, Directo a Tu Puerta"
                                subheading: "Reserva un detallador certificado en minutos. Vamos a donde estés."
                                ctaText: "Verifica Tu ZIP"
                                badgeText: "Ahora disponible en Texas"
                            }
                            update: {
                                heading: "Detallado Premium, Directo a Tu Puerta"
                                subheading: "Reserva un detallador certificado en minutos. Vamos a donde estés."
                                ctaText: "Verifica Tu ZIP"
                                badgeText: "Ahora disponible en Texas"
                            }
                        }
                    }
                }
            ) { id }
        }
    `, { id: heroEn.createLandingHero.id });

    await gql(`
        mutation PublishHeroES($id: ID!) {
            publishLandingHero(where: { id: $id }, locales: [es]) { id }
        }
    `, { id: heroEn.createLandingHero.id });
    console.log('  Published ES hero');
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

const TESTIMONIALS = [
    {
        authorName: 'Marcus T.',
        location: 'Austin, TX',
        rating: 5,
        text: "My car hasn't looked this good since I drove it off the lot. Rubens did an incredible job on the full detail.",
        vehicleType: '2022 BMW M3',
    },
    {
        authorName: 'Sofia R.',
        location: 'San Antonio, TX',
        rating: 5,
        text: 'Booked online in 2 minutes, they showed up on time, and my SUV looks brand new. Absolutely worth every penny.',
        vehicleType: '2023 Range Rover Sport',
    },
    {
        authorName: 'James K.',
        location: 'Dallas, TX',
        rating: 5,
        text: 'The engine bay cleaning alone was worth it. These guys are true professionals. Booking monthly from now on.',
        vehicleType: '2021 Porsche 911 Carrera',
    },
    {
        authorName: 'Daniela M.',
        location: 'Houston, TX',
        rating: 5,
        text: 'Scheduled for 9 AM, they were there at 8:58. My Tesla looks like it just rolled off the factory floor.',
        vehicleType: '2023 Tesla Model S',
    },
    {
        authorName: 'Carlos V.',
        location: 'Austin, TX',
        rating: 5,
        text: 'Best mobile detailing service in Austin, hands down. Paint correction was flawless.',
        vehicleType: '2020 Audi RS7',
    },
];

async function seedTestimonials() {
    for (const t of TESTIMONIALS) {
        console.log(`Seeding testimonial: ${t.authorName}...`);
        const result = await gql(`
            mutation CreateTestimonial(
                $authorName: String!
                $location: String!
                $rating: Int!
                $text: String!
                $vehicleType: String!
            ) {
                createTestimonial(data: {
                    authorName: $authorName
                    location: $location
                    rating: $rating
                    text: $text
                    vehicleType: $vehicleType
                }) { id }
            }
        `, t);

        const id = result.createTestimonial.id;
        await gql(`
            mutation PublishTestimonial($id: ID!) {
                publishTestimonial(where: { id: $id }) { id }
            }
        `, { id });
        console.log(`  Published ${t.authorName} (${id})`);
    }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    try {
        await seedHero();
        await seedTestimonials();
        console.log('\nDone! All content seeded and published.');
    } catch (err) {
        console.error('\nError seeding HyGraph:', err.message);
        process.exit(1);
    }
}

main();
