/**
 * One-time migration script to translate all existing Services and Add-ons
 * Run with: npm run strapi script scripts/translate-existing-content.js
 */

module.exports = async ({ strapi }) => {
    console.log('🌍 Starting migration: Translating all existing content to Spanish...\n');

    const { autoTranslate } = require('../src/services/auto-translate');

    try {
        // Translate all Services
        console.log('📦 Translating Services...');
        const services = await strapi.documents('api::service.service').findMany({
            filters: { locale: 'en' },
            status: 'published'
        });

        console.log(`Found ${services.length} services to translate`);

        for (const service of services) {
            console.log(`  → Translating: "${service.name}" (${service.documentId})`);

            await autoTranslate('api::service.service', service.documentId, {
                name: service.name,
                description: service.description,
                checklist: service.checklist,
                basePrice: service.basePrice,
                durationMinutes: service.durationMinutes,
                sortOrder: service.sortOrder
            });
        }

        console.log('✅ Services translated!\n');

        // Translate all Add-ons
        console.log('📦 Translating Add-ons...');
        const addOns = await strapi.documents('api::add-on.add-on').findMany({
            filters: { locale: 'en' },
            status: 'published'
        });

        console.log(`Found ${addOns.length} add-ons to translate`);

        for (const addOn of addOns) {
            console.log(`  → Translating: "${addOn.name}" (${addOn.documentId})`);

            await autoTranslate('api::add-on.add-on', addOn.documentId, {
                name: addOn.name,
                description: addOn.description,
                price: addOn.price,
                sortOrder: addOn.sortOrder
            });
        }

        console.log('✅ Add-ons translated!\n');

        console.log('🎉 Migration complete! All content has been translated to Spanish.');
        console.log('\n📋 Summary:');
        console.log(`   - Services translated: ${services.length}`);
        console.log(`   - Add-ons translated: ${addOns.length}`);
        console.log(`   - Total items: ${services.length + addOns.length}`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
};
