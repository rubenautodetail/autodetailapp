/**
 * Translation Controller
 * Handles bulk translation of existing content
 */

const { autoTranslate } = require('../../../services/auto-translate');

module.exports = {
    async translateAll(ctx) {
        try {
            strapi.log.info('🌍 Starting bulk translation...');

            const results = {
                services: [],
                addOns: [],
                errors: []
            };

            // Translate all Services
            strapi.log.info('📦 Translating Services...');
            const services = await strapi.documents('api::service.service').findMany({
                filters: { locale: 'en' }
            });

            strapi.log.info(`Found ${services.length} services`);

            for (const service of services) {
                try {
                    strapi.log.info(`  → Translating: "${service.name}"`);

                    await autoTranslate('api::service.service', service.documentId, {
                        name: service.name,
                        description: service.description,
                        checklist: service.checklist
                    });

                    results.services.push(service.name);
                } catch (error) {
                    strapi.log.error(`Failed to translate service ${service.name}:`, error);
                    results.errors.push({ type: 'service', name: service.name, error: error.message });
                }
            }

            // Translate all Add-ons
            strapi.log.info('📦 Translating Add-ons...');
            const addOns = await strapi.documents('api::add-on.add-on').findMany({
                filters: { locale: 'en' }
            });

            strapi.log.info(`Found ${addOns.length} add-ons`);

            for (const addOn of addOns) {
                try {
                    strapi.log.info(`  → Translating: "${addOn.name}"`);

                    await autoTranslate('api::add-on.add-on', addOn.documentId, {
                        name: addOn.name,
                        description: addOn.description
                    });

                    results.addOns.push(addOn.name);
                } catch (error) {
                    strapi.log.error(`Failed to translate add-on ${addOn.name}:`, error);
                    results.errors.push({ type: 'add-on', name: addOn.name, error: error.message });
                }
            }

            strapi.log.info('✅ Bulk translation complete!');

            ctx.body = {
                success: true,
                message: 'Translation complete',
                results: {
                    servicesTranslated: results.services.length,
                    addOnsTranslated: results.addOns.length,
                    errors: results.errors.length,
                    details: results
                }
            };

        } catch (error) {
            strapi.log.error('❌ Bulk translation failed:', error);
            ctx.status = 500;
            ctx.body = {
                success: false,
                error: error.message
            };
        }
    }
};
