/**
 * Complete Seed Script - Populates all required test data
 * Run with: npx tsx src/scripts/seed-all.ts
 *
 * Creates:
 * - Services (Interior, Exterior, Full Detail)
 * - Add-ons (Wax, Tire Shine, Pet Hair, etc.)
 * - Service Zones (Miami area zip codes)
 * - Contractors (with Stripe onboarding status)
 * - Contractor Availability (30 days)
 */

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

interface TimeWindows {
    morning: { available: boolean; booked: boolean };
    afternoon: { available: boolean; booked: boolean };
    evening: { available: boolean; booked: boolean };
}

// ============ SERVICES ============
const services = [
    {
        name: 'Interior Detail',
        description: 'Complete interior cleaning and conditioning. Perfect for maintaining your vehicle\'s cabin.',
        basePrice: 89.99,
        durationMinutes: 120,
        sortOrder: 1,
        checklist: [
            'Vacuum all seats, floor, and trunk',
            'Clean and condition leather/vinyl',
            'Clean dashboard and console',
            'Clean door panels and cup holders',
            'Clean windows (interior)',
            'Air freshener application'
        ],
        locale: 'en',
        publishedAt: new Date().toISOString()
    },
    {
        name: 'Exterior Detail',
        description: 'Professional hand wash and exterior shine. Your vehicle will look showroom fresh.',
        basePrice: 79.99,
        durationMinutes: 90,
        sortOrder: 2,
        checklist: [
            'Hand wash with premium soap',
            'Wheel and tire cleaning',
            'Wheel wells cleaned',
            'Exterior trim restoration',
            'Windows cleaned (exterior)',
            'Quick spray wax application'
        ],
        locale: 'en',
        publishedAt: new Date().toISOString()
    },
    {
        name: 'Full Detail Package',
        description: 'The ultimate detail combining complete interior and exterior service. Best value!',
        basePrice: 149.99,
        durationMinutes: 180,
        sortOrder: 3,
        checklist: [
            '✨ All Interior Detail services',
            '✨ All Exterior Detail services',
            'Engine bay cleaning (exterior only)',
            'Headlight cleaning',
            'Complete vehicle inspection'
        ],
        locale: 'en',
        publishedAt: new Date().toISOString()
    }
];

// ============ ADD-ONS ============
const addOns = [
    {
        name: 'Premium Wax',
        description: 'High-grade carnauba wax for long-lasting shine and protection',
        price: 29.99,
        durationMinutes: 30,
        sortOrder: 1,
        checklist: ['Apply premium carnauba wax', 'Hand buff to high shine'],
        locale: 'en',
        publishedAt: new Date().toISOString()
    },
    {
        name: 'Tire Shine & Dressing',
        description: 'Professional tire dressing for a deep black shine',
        price: 15.99,
        durationMinutes: 15,
        sortOrder: 2,
        checklist: ['Apply tire shine to all 4 tires', 'Wheel well dressing'],
        locale: 'en',
        publishedAt: new Date().toISOString()
    },
    {
        name: 'Pet Hair Removal',
        description: 'Deep cleaning to remove pet hair from seats and carpet',
        price: 34.99,
        durationMinutes: 45,
        sortOrder: 3,
        checklist: ['Use specialized pet hair tools', 'Deep vacuum all surfaces', 'Lint roller finish'],
        locale: 'en',
        publishedAt: new Date().toISOString()
    },
    {
        name: 'Headlight Restoration',
        description: 'Restore cloudy headlights to like-new clarity',
        price: 44.99,
        durationMinutes: 60,
        sortOrder: 4,
        checklist: ['Wet sand headlights', 'Buff with compound', 'Apply UV sealant'],
        locale: 'en',
        publishedAt: new Date().toISOString()
    },
    {
        name: 'Engine Bay Cleaning',
        description: 'Thorough engine bay degreasing and detailing',
        price: 39.99,
        durationMinutes: 45,
        sortOrder: 5,
        checklist: ['Protect electrical components', 'Degrease engine', 'Rinse and dry', 'Dress plastics'],
        locale: 'en',
        publishedAt: new Date().toISOString()
    },
    {
        name: 'Clay Bar Treatment',
        description: 'Remove embedded contaminants for ultra-smooth paint',
        price: 49.99,
        durationMinutes: 60,
        sortOrder: 6,
        checklist: ['Wash vehicle', 'Clay bar entire surface', 'Wipe with detailer spray'],
        locale: 'en',
        publishedAt: new Date().toISOString()
    }
];

// ============ SERVICE ZONES (Miami Area) ============
const serviceZones = [
    { zipCode: '33186', isActive: true, coverageRadiusMiles: 5, priceMultiplier: 1.0, peakHoursPricing: 1.2, minContractorsRequired: 2, publishedAt: new Date().toISOString() },
    { zipCode: '33183', isActive: true, coverageRadiusMiles: 5, priceMultiplier: 1.0, peakHoursPricing: 1.2, minContractorsRequired: 2, publishedAt: new Date().toISOString() },
    { zipCode: '33156', isActive: true, coverageRadiusMiles: 5, priceMultiplier: 1.1, peakHoursPricing: 1.3, minContractorsRequired: 2, publishedAt: new Date().toISOString() },
    { zipCode: '33176', isActive: true, coverageRadiusMiles: 5, priceMultiplier: 1.0, peakHoursPricing: 1.2, minContractorsRequired: 2, publishedAt: new Date().toISOString() },
    { zipCode: '33173', isActive: true, coverageRadiusMiles: 5, priceMultiplier: 1.0, peakHoursPricing: 1.2, minContractorsRequired: 2, publishedAt: new Date().toISOString() },
    { zipCode: '33175', isActive: true, coverageRadiusMiles: 5, priceMultiplier: 1.05, peakHoursPricing: 1.25, minContractorsRequired: 2, publishedAt: new Date().toISOString() },
];

// ============ CONTRACTORS ============
const contractors = [
    {
        name: 'Juan Rodriguez',
        email: 'juan@testdetailer.com',
        phone: '+1-305-555-0101',
        preferredLanguage: 'es',
        status: 'active',
        performanceTier: 'preferred',
        averageRating: 4.8,
        totalJobs: 127,
        completionRate: 0.96,
        stripeOnboardingComplete: true,
        stripeChargesEnabled: true,
        stripePayoutsEnabled: true,
        homeAddress: {
            street: '8501 SW 124th Ave',
            city: 'Miami',
            state: 'FL',
            zip: '33183',
        },
        defaultAvailability: {
            monday: { morning: true, afternoon: true, evening: false },
            tuesday: { morning: true, afternoon: true, evening: false },
            wednesday: { morning: true, afternoon: true, evening: false },
            thursday: { morning: true, afternoon: true, evening: false },
            friday: { morning: true, afternoon: true, evening: false },
            saturday: { morning: true, afternoon: false, evening: false },
            sunday: { morning: false, afternoon: false, evening: false },
        },
        publishedAt: new Date().toISOString()
    },
    {
        name: 'Maria Santos',
        email: 'maria@testdetailer.com',
        phone: '+1-305-555-0102',
        preferredLanguage: 'en',
        status: 'active',
        performanceTier: 'elite',
        averageRating: 4.9,
        totalJobs: 203,
        completionRate: 0.98,
        stripeOnboardingComplete: true,
        stripeChargesEnabled: true,
        stripePayoutsEnabled: true,
        homeAddress: {
            street: '7250 SW 88th St',
            city: 'Miami',
            state: 'FL',
            zip: '33156',
        },
        defaultAvailability: {
            monday: { morning: true, afternoon: true, evening: true },
            tuesday: { morning: true, afternoon: true, evening: true },
            wednesday: { morning: false, afternoon: true, evening: true },
            thursday: { morning: true, afternoon: true, evening: true },
            friday: { morning: true, afternoon: true, evening: false },
            saturday: { morning: true, afternoon: true, evening: false },
            sunday: { morning: false, afternoon: false, evening: false },
        },
        publishedAt: new Date().toISOString()
    },
    {
        name: 'Carlos Mendez',
        email: 'carlos@testdetailer.com',
        phone: '+1-305-555-0103',
        preferredLanguage: 'en',
        status: 'active',
        performanceTier: 'standard',
        averageRating: 4.6,
        totalJobs: 78,
        completionRate: 0.94,
        stripeOnboardingComplete: true,
        stripeChargesEnabled: true,
        stripePayoutsEnabled: true,
        homeAddress: {
            street: '12501 SW 88th St',
            city: 'Miami',
            state: 'FL',
            zip: '33186',
        },
        defaultAvailability: {
            monday: { morning: true, afternoon: false, evening: false },
            tuesday: { morning: true, afternoon: false, evening: false },
            wednesday: { morning: true, afternoon: false, evening: false },
            thursday: { morning: true, afternoon: false, evening: false },
            friday: { morning: true, afternoon: true, evening: false },
            saturday: { morning: true, afternoon: true, evening: false },
            sunday: { morning: false, afternoon: false, evening: false },
        },
        publishedAt: new Date().toISOString()
    }
];

async function seedAll() {
    console.log('🌱 Starting comprehensive data seeding...\n');
    console.log('================================================\n');

    // ============ CREATE SERVICES ============
    console.log('📦 Creating services...\n');
    const createdServices: any[] = [];

    for (const service of services) {
        try {
            const response = await fetch(`${STRAPI_URL}/api/services`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: service }),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error(`❌ Failed to create ${service.name}:`, error);
                continue;
            }

            const result = await response.json();
            createdServices.push(result.data);
            console.log(`✅ Created service: ${service.name} ($${service.basePrice})`);
        } catch (error) {
            console.error(`❌ Error creating ${service.name}:`, error);
        }
    }

    console.log(`\n✨ Created ${createdServices.length}/${services.length} services\n`);

    // ============ CREATE ADD-ONS ============
    console.log('🔧 Creating add-ons...\n');
    const createdAddOns: any[] = [];

    for (const addOn of addOns) {
        try {
            const response = await fetch(`${STRAPI_URL}/api/add-ons`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: addOn }),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error(`❌ Failed to create ${addOn.name}:`, error);
                continue;
            }

            const result = await response.json();
            createdAddOns.push(result.data);
            console.log(`✅ Created add-on: ${addOn.name} (+$${addOn.price})`);
        } catch (error) {
            console.error(`❌ Error creating ${addOn.name}:`, error);
        }
    }

    console.log(`\n✨ Created ${createdAddOns.length}/${addOns.length} add-ons\n`);

    // ============ CREATE SERVICE ZONES ============
    console.log('🗺️  Creating service zones...\n');
    const createdZones: any[] = [];

    for (const zone of serviceZones) {
        try {
            const response = await fetch(`${STRAPI_URL}/api/service-zones`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: zone }),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error(`❌ Failed to create zone ${zone.zipCode}:`, error);
                continue;
            }

            const result = await response.json();
            createdZones.push(result.data);
            console.log(`✅ Created service zone: ${zone.zipCode} (radius: ${zone.coverageRadiusMiles} mi)`);
        } catch (error) {
            console.error(`❌ Error creating zone ${zone.zipCode}:`, error);
        }
    }

    console.log(`\n✨ Created ${createdZones.length}/${serviceZones.length} service zones\n`);

    // ============ CREATE CONTRACTORS ============
    console.log('👷 Creating contractors...\n');
    const createdContractors: any[] = [];

    for (const contractor of contractors) {
        try {
            const response = await fetch(`${STRAPI_URL}/api/contractors`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: contractor }),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error(`❌ Failed to create ${contractor.name}:`, error);
                continue;
            }

            const result = await response.json();
            createdContractors.push(result.data);
            console.log(`✅ Created contractor: ${contractor.name} (${contractor.performanceTier} tier)`);
        } catch (error) {
            console.error(`❌ Error creating ${contractor.name}:`, error);
        }
    }

    console.log(`\n✨ Created ${createdContractors.length}/${contractors.length} contractors\n`);

    if (createdContractors.length === 0) {
        console.log('\n⚠️ No contractors created. Skipping availability generation...');
        return;
    }

    // ============ GENERATE CONTRACTOR AVAILABILITY ============
    console.log('📅 Generating contractor availability (30 days)...\n');

    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    let totalAvailabilityCreated = 0;

    for (const contractor of createdContractors) {
        const contractorData = contractors.find(c => c.email === contractor.email);
        const defaultAvail = contractorData?.defaultAvailability;

        if (!defaultAvail) continue;

        let daysCreated = 0;

        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            const dayOfWeek = dayNames[date.getDay()];
            const dayAvail = defaultAvail[dayOfWeek];

            const timeWindows: TimeWindows = {
                morning: { available: dayAvail.morning, booked: false },
                afternoon: { available: dayAvail.afternoon, booked: false },
                evening: { available: dayAvail.evening, booked: false },
            };

            try {
                const response = await fetch(`${STRAPI_URL}/api/contractor-availabilities`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        data: {
                            contractor: contractor.id,
                            date: dateStr,
                            timeWindows,
                            publishedAt: new Date().toISOString()
                        },
                    }),
                });

                if (response.ok) {
                    daysCreated++;
                    totalAvailabilityCreated++;
                }
            } catch (error) {
                // Silently skip errors for availability
            }
        }

        console.log(`✅ Created ${daysCreated}-day availability for: ${contractorData?.name}`);
    }

    console.log(`\n✨ Created ${totalAvailabilityCreated} total availability records\n`);

    // ============ LINK CONTRACTORS TO SERVICE ZONES ============
    console.log('🔗 Linking contractors to service zones...\n');

    // Get all contractor zip codes
    const contractorZips = [...new Set(contractors.map(c => c.homeAddress.zip))];

    for (const zip of contractorZips) {
        try {
            // Find zone for this zip
            const zoneResponse = await fetch(`${STRAPI_URL}/api/service-zones?filters[zipCode][$eq]=${zip}`);
            if (!zoneResponse.ok) continue;

            const zoneData = await zoneResponse.json();
            if (!zoneData.data || zoneData.data.length === 0) continue;

            const zone = zoneData.data[0];

            // Find contractors in this zip
            const contractorsInZone = createdContractors.filter(c => {
                const contractorData = contractors.find(cd => cd.email === c.email);
                return contractorData?.homeAddress.zip === zip;
            });

            if (contractorsInZone.length === 0) continue;

            const contractorIds = contractorsInZone.map(c => c.id);

            const updateResponse = await fetch(`${STRAPI_URL}/api/service-zones/${zone.documentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: {
                        contractors: contractorIds,
                    },
                }),
            });

            if (updateResponse.ok) {
                console.log(`✅ Linked ${contractorIds.length} contractor(s) to zone ${zip}`);
            }
        } catch (error) {
            console.error(`❌ Error linking contractors to zone ${zip}`);
        }
    }

    // ============ SUMMARY ============
    console.log('\n================================================');
    console.log('✨ SEEDING COMPLETE! ✨\n');
    console.log('Created:');
    console.log(`  📦 ${createdServices.length} services`);
    console.log(`  🔧 ${createdAddOns.length} add-ons`);
    console.log(`  🗺️  ${createdZones.length} service zones`);
    console.log(`  👷 ${createdContractors.length} contractors`);
    console.log(`  📅 ${totalAvailabilityCreated} availability records`);
    console.log('\n🚀 Backend is ready for testing!\n');
    console.log('Next steps:');
    console.log('  1. Visit http://localhost:1337/admin to create admin account');
    console.log('  2. Test booking flow at http://localhost:3000');
    console.log('  3. Check API: http://localhost:1337/api/services');
    console.log('================================================\n');
}

// Run the seed
seedAll().catch((error) => {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
});
