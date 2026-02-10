#!/usr/bin/env node

const API_TOKEN = '2800605944a0f90a8a8cb1d463becf90e342788020c707a97463bbb12994c3d51bc69d0f4bd2b2dd58e783117c800f1bc20613b7b7fdbe6f0baa995cd05eba7bcd0e446d35aad5b02e7a4a0d9de71f3f825f65fb8742e127c059cb838afeff4eaf39822733e49995537fde49dc87a8c519c38b0956faebc991bad4990b25cb3e';

async function createAvailability() {
    console.log('🌱 Creating availability for next 30 days...\n');

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    // Contractor 1: Juan - Mon-Fri morning/afternoon, Sat morning only
    const contractor1Default = {
        sunday: { morning: false, afternoon: false, evening: false },
        monday: { morning: true, afternoon: true, evening: false },
        tuesday: { morning: true, afternoon: true, evening: false },
        wednesday: { morning: true, afternoon: true, evening: false },
        thursday: { morning: true, afternoon: true, evening: false },
        friday: { morning: true, afternoon: true, evening: false },
        saturday: { morning: true, afternoon: false, evening: false },
    };

    // Contractor 2: Maria - Mon-Thu all slots, Fri-Sat morning/afternoon
    const contractor2Default = {
        sunday: { morning: false, afternoon: false, evening: false },
        monday: { morning: true, afternoon: true, evening: true },
        tuesday: { morning: true, afternoon: true, evening: true },
        wednesday: { morning: true, afternoon: true, evening: true },
        thursday: { morning: true, afternoon: true, evening: true },
        friday: { morning: true, afternoon: true, evening: false },
        saturday: { morning: true, afternoon: true, evening: false },
    };

    const today = new Date();
    let created = 0;

    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const dayOfWeek = dayNames[date.getDay()];

        // Contractor 1
        const c1Avail = contractor1Default[dayOfWeek];
        const tw1 = {
            morning: { available: c1Avail.morning, booked: false },
            afternoon: { available: c1Avail.afternoon, booked: false },
            evening: { available: c1Avail.evening, booked: false },
        };

        try {
            const res1 = await fetch('http://localhost:1337/api/contractor-availabilities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_TOKEN}`,
                },
                body: JSON.stringify({
                    data: { contractor: 1, date: dateStr, timeWindows: tw1 }
                }),
            });

            if (res1.ok) created++;
            else {
                const err = await res1.json();
                console.error(`Failed for C1 ${dateStr}:`, err.error?.message || err);
            }
        } catch (e) {
            console.error(`Error C1 ${dateStr}:`, e.message);
        }

        // Contractor 2
        const c2Avail = contractor2Default[dayOfWeek];
        const tw2 = {
            morning: { available: c2Avail.morning, booked: false },
            afternoon: { available: c2Avail.afternoon, booked: false },
            evening: { available: c2Avail.evening, booked: false },
        };

        try {
            const res2 = await fetch('http://localhost:1337/api/contractor-availabilities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_TOKEN}`,
                },
                body: JSON.stringify({
                    data: { contractor: 2, date: dateStr, timeWindows: tw2 }
                }),
            });

            if (res2.ok) created++;
            else {
                const err = await res2.json();
                console.error(`Failed for C2 ${dateStr}:`, err.error?.message || err);
            }
        } catch (e) {
            console.error(`Error C2 ${dateStr}:`, e.message);
        }

        console.log(`✓ ${dateStr}`);
    }

    console.log(`\n✨ Done! Created ${created} availability records`);
}

createAvailability().catch(console.error);
