/**
 * Link Contractors to Users
 * Maintenance script to connect contractor profiles with their corresponding user accounts based on email
 * 
 * Run with: STRAPI_TELEMETRY_DISABLED=true npx strapi console
 * Then paste this script.
 */

async function linkContractorsToUsers() {
    console.log('--- Starting Contractor-User Mapping ---');

    try {
        // 1. Get all contractors
        const contractors = await strapi.documents('api::contractor.contractor').findMany({
            populate: ['user']
        });

        console.log(`Found ${contractors.length} contractors total.`);

        let linkedCount = 0;
        let skippedCount = 0;

        for (const contractor of contractors) {
            if (contractor.user) {
                console.log(`[SKIPPED] Contractor ${contractor.email} already linked to User ID ${contractor.user.id}`);
                skippedCount++;
                continue;
            }

            // 2. Find user with same email
            const user = await strapi.db.query('plugin::users-permissions.user').findOne({
                where: { email: contractor.email }
            });

            if (user) {
                // 3. Link them
                await strapi.documents('api::contractor.contractor').update({
                    documentId: contractor.documentId,
                    data: {
                        user: user.id
                    }
                });

                console.log(`[LINKED] Contractor ${contractor.email} -> User ID ${user.id}`);
                linkedCount++;
            } else {
                console.log(`[WARNING] No User found for Contractor email: ${contractor.email}`);
            }
        }

        console.log(`--- Finished mapping ---`);
        console.log(`Linked: ${linkedCount}`);
        console.log(`Skipped (already linked): ${skippedCount}`);

    } catch (error) {
        console.error('Error in mapping script:', error);
    }
}

// Execute
linkContractorsToUsers();
