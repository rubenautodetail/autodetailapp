/**
 * Auto-Translation Service
 * Automatically translates content from English to Spanish using Google Translate API
 */

const GOOGLE_TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;
const SOURCE_LOCALE = 'en';
const TARGET_LOCALE = 'es';

/**
 * Translate text using Google Translate API (Free tier)
 * @param {string|string[]} text - Text to translate
 * @returns {Promise<string|string[]>} Translated text
 */
async function translateText(text) {
    if (!GOOGLE_TRANSLATE_API_KEY) {
        strapi.log.warn('GOOGLE_TRANSLATE_API_KEY not set. Skipping translation.');
        return text;
    }

    const isArray = Array.isArray(text);
    const textsToTranslate = isArray ? text : [text];

    try {
        const url = `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_API_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: textsToTranslate,
                source: SOURCE_LOCALE,
                target: TARGET_LOCALE,
                format: 'text'
            })
        });

        if (!response.ok) {
            throw new Error(`Translation API error: ${response.statusText}`);
        }

        const data = await response.json();
        const translations = data.data.translations.map(t => t.translatedText);

        return isArray ? translations : translations[0];
    } catch (error) {
        strapi.log.error('Translation failed:', error);
        return text; // Return original text on error
    }
}

/**
 * Recursively translate all localizable fields in an object
 * @param {object} data - Data object to translate
 * @param {object} schema - Content type schema
 * @returns {Promise<object>} Translated data
 */
async function translateFields(data, schema) {
    const translatedData = {};

    for (const [key, value] of Object.entries(data)) {
        const attribute = schema.attributes[key];

        if (!attribute) {
            translatedData[key] = value;
            continue;
        }

        // Skip if field is not localized
        if (attribute.pluginOptions?.i18n?.localized === false) {
            translatedData[key] = value;
            continue;
        }

        // Translate based on field type
        switch (attribute.type) {
            case 'string':
            case 'text':
                translatedData[key] = value ? await translateText(value) : value;
                break;

            case 'richtext':
                // For richtext, we translate but preserve basic HTML structure
                translatedData[key] = value ? await translateText(value) : value;
                break;

            case 'json':
                // Handle JSON fields (like checklist arrays)
                if (Array.isArray(value)) {
                    translatedData[key] = await translateText(value);
                } else {
                    translatedData[key] = value;
                }
                break;

            case 'component':
                // Recursively translate components
                if (value && attribute.component) {
                    const componentSchema = strapi.components[attribute.component];
                    if (attribute.repeatable && Array.isArray(value)) {
                        translatedData[key] = await Promise.all(
                            value.map(item => translateFields(item, componentSchema))
                        );
                    } else if (value) {
                        translatedData[key] = await translateFields(value, componentSchema);
                    }
                } else {
                    translatedData[key] = value;
                }
                break;

            case 'dynamiczone':
                // Translate dynamic zones
                if (Array.isArray(value)) {
                    translatedData[key] = await Promise.all(
                        value.map(async (item) => {
                            const componentSchema = strapi.components[item.__component];
                            return {
                                ...item,
                                ...(await translateFields(item, componentSchema))
                            };
                        })
                    );
                } else {
                    translatedData[key] = value;
                }
                break;

            default:
                // For other types (numbers, dates, etc.), keep as is
                translatedData[key] = value;
        }
    }

    return translatedData;
}

/**
 * Auto-translate and create/update Spanish localization
 * @param {string} uid - Content type UID (e.g., 'api::service.service')
 * @param {string} documentId - Document ID
 * @param {object} data - English content data
 */
async function autoTranslate(uid, documentId, data) {
    try {
        // Get the content type schema
        const contentType = strapi.contentTypes[uid];
        if (!contentType) {
            strapi.log.warn(`Content type ${uid} not found`);
            return;
        }

        // Check if i18n is enabled for this content type
        if (!contentType.pluginOptions?.i18n?.localized) {
            return; // Skip if not localized
        }

        strapi.log.info(`Auto-translating ${uid} (${documentId}) to Spanish...`);

        // Translate all fields
        const translatedData = await translateFields(data, contentType);

        // Check if Spanish localization already exists
        const existingSpanish = await strapi.documents(uid).findMany({
            filters: {
                documentId: documentId,
                locale: TARGET_LOCALE
            }
        });

        if (existingSpanish.length > 0) {
            // Update existing Spanish localization
            await strapi.documents(uid).update({
                documentId: documentId,
                locale: TARGET_LOCALE,
                data: translatedData
            });
            strapi.log.info(`✅ Updated Spanish localization for ${uid} (${documentId})`);
        } else {
            // Create new Spanish localization
            await strapi.documents(uid).create({
                data: {
                    ...translatedData,
                    documentId: documentId,
                    locale: TARGET_LOCALE
                }
            });
            strapi.log.info(`✅ Created Spanish localization for ${uid} (${documentId})`);
        }
    } catch (error) {
        strapi.log.error(`Failed to auto-translate ${uid} (${documentId}):`, error);
    }
}

module.exports = {
    translateText,
    translateFields,
    autoTranslate
};
