/**
 * Add-on Lifecycle Hooks
 * Auto-translates add-on content to Spanish when saved in English
 */

const { autoTranslate } = require('../../../../services/auto-translate');

module.exports = {
    async afterCreate(event) {
        const { result, params } = event;

        // Only auto-translate if this is the English (default) locale
        if (params.data.locale === 'en' || !params.data.locale) {
            await autoTranslate('api::add-on.add-on', result.documentId, params.data);
        }
    },

    async afterUpdate(event) {
        const { result, params } = event;

        // Only auto-translate if this is the English (default) locale
        if (params.data.locale === 'en' || !params.data.locale) {
            await autoTranslate('api::add-on.add-on', result.documentId, params.data);
        }
    }
};
