/**
 * Seeds one published, image-less HyGraph entry for each supported body style.
 * Existing entries are never overwritten or republished.
 *
 * Run from frontend/:
 *   npm run hygraph:seed:vehicle-artwork
 */

const token = process.env.HYGRAPH_TOKEN;
const endpoint = process.env.NEXT_PUBLIC_HYGRAPH_ENDPOINT ?? process.env.HYGRAPH_ENDPOINT;

if (!token || !endpoint) {
    console.error('HYGRAPH_TOKEN and NEXT_PUBLIC_HYGRAPH_ENDPOINT are required.');
    process.exit(1);
}

const bodyStyles = [
    { bodyStyle: 'sedan', name: 'Sedan', sortOrder: 10 },
    { bodyStyle: 'coupe', name: 'Coupe', sortOrder: 20 },
    { bodyStyle: 'suv', name: 'SUV', sortOrder: 30 },
    { bodyStyle: 'large_suv', name: 'Large SUV', sortOrder: 40 },
    { bodyStyle: 'pickup', name: 'Pickup', sortOrder: 50 },
    { bodyStyle: 'minivan', name: 'Minivan', sortOrder: 60 },
    { bodyStyle: 'van', name: 'Van', sortOrder: 70 },
    { bodyStyle: 'other', name: 'Other', sortOrder: 80 },
];

async function request(query, variables = undefined) {
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query, variables }),
    });
    const payload = await response.json();

    if (!response.ok || payload.errors?.length) {
        throw new Error(payload.errors?.map((error) => error.message).join('; ') || `HTTP ${response.status}`);
    }

    return payload.data;
}

const existingData = await request(`
    query ExistingVehicleBodyStyleArtwork {
        vehicleBodyStyleArtworks(first: 20, stage: DRAFT, locales: [en]) {
            bodyStyle
        }
    }
`);
const existing = new Set(existingData.vehicleBodyStyleArtworks.map((entry) => entry.bodyStyle));

let created = 0;

for (const entry of bodyStyles) {
    if (existing.has(entry.bodyStyle)) continue;

    const createdData = await request(`
        mutation CreateVehicleBodyStyleArtwork($data: VehicleBodyStyleArtworkCreateInput!) {
            createVehicleBodyStyleArtwork(data: $data) {
                id
            }
        }
    `, {
        data: {
            name: entry.name,
            bodyStyle: entry.bodyStyle,
            sortOrder: entry.sortOrder,
            isActive: true,
        },
    });

    await request(`
        mutation PublishVehicleBodyStyleArtwork($id: ID!) {
            publishVehicleBodyStyleArtwork(where: { id: $id }, to: [PUBLISHED]) {
                id
            }
        }
    `, { id: createdData.createVehicleBodyStyleArtwork.id });
    created += 1;
}

console.log(`Vehicle artwork placeholders ready. Created and published: ${created}. Existing preserved: ${existing.size}.`);
