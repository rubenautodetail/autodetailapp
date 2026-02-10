#!/usr/bin/env node
/**
 * Seed Script for Test Data
 * Run with: node scripts/seed-test-data.mjs
 * 
 * Creates test contractors and their availability for the next 30 days
 */

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

async function seedTestData() {
    console.log('🌱 Starting test data seeding...\n');

    // Test contractors data
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
        },
    ];

    console.log('📦 Creating contractors...\n');

    const createdContractors = [];

    for (const contractor of contractors) {
        try {
            const response = await fetch(`${STRAPI_URL}/api/contractors`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: contractor }),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error(`❌ Failed to create ${contractor.name}:`, error.error?.message || error);
                continue;
            }

            const result = await response.json();
            createdContractors.push(result.data);
            console.log(`✅ Created contractor: ${contractor.name} (ID: ${result.data.documentId})`);
        } catch (error) {
            console.error(`❌ Error creating ${contractor.name}:`, error.message);
        }
    }

    if (createdContractors.length === 0) {
        console.log('\n⚠️ No contractors created. Exiting...');
        return;
    }

    // Generate availability for next 30 days
    console.log('\n📅 Generating availability for next 30 days...\n');

    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    for (const contractor of createdContractors) {
        const contractorData = contractors.find(c => c.email === contractor.email);
        const defaultAvail = contractorData?.defaultAvailability;

        if (!defaultAvail) continue;

        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            const dayOfWeek = dayNames[date.getDay()];
            const dayAvail = defaultAvail[dayOfWeek];

            const timeWindows = {
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
                        },
                    }),
                });

                if (!response.ok) {
                    const error = await response.json();
                    console.error(`❌ Failed to create availability for ${contractor.name} on ${dateStr}:`, error.error?.message || error);
                }
            } catch (error) {
                console.error(`❌ Error creating availability:`, error.message);
            }
        }
        console.log(`✅ Created 30-day availability for: ${contractor.name}`);
    }

    // Link contractors to service zones
    console.log('\n🔗 Linking contractors to service zones...\n');

    try {
        const zonesResponse = await fetch(`${STRAPI_URL}/api/service-zones?filters[zipCode][$eq]=33186`);
        if (zonesResponse.ok) {
            const zonesData = await zonesResponse.json();
            if (zonesData.data && zonesData.data.length > 0) {
                const zone = zonesData.data[0];
                const contractorIds = createdContractors.map(c => c.id);

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
                    console.log(`✅ Linked ${contractorIds.length} contractors to zone 33186`);
                } else {
                    const error = await updateResponse.json();
                    console.error('❌ Failed to link contractors:', error.error?.message || error);
                }
            } else {
                console.log('⚠️ No service zone found for ZIP 33186');
            }
        }
    } catch (error) {
        console.error('❌ Error linking contractors to zones:', error.message);
    }

    console.log('\n✨ Test data seeding complete!');
    console.log('\nCreated:');
    console.log(`  - ${createdContractors.length} contractors`);
    console.log(`  - ${createdContractors.length * 30} availability records`);
}

// Run the seed
seedTestData().catch(console.error);
