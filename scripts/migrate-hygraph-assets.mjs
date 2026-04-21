/**
 * Adds Asset (image upload) fields to LandingHero, GalleryImage, and
 * ContractorLandingHero models in HyGraph.
 *
 * After this migration, editors can upload/replace images directly in
 * the HyGraph dashboard instead of pasting URLs manually.
 *
 * Run: HYGRAPH_TOKEN=<token> node scripts/migrate-hygraph-assets.mjs
 */

import pkg from '@hygraph/management-sdk';
const { Client, RelationalFieldType } = pkg;

const TOKEN = process.env.HYGRAPH_TOKEN;
if (!TOKEN) {
    console.error('Set HYGRAPH_TOKEN env var (needs management permissions)');
    process.exit(1);
}

const ENDPOINT = 'https://api-us-west-2.hygraph.com/v2/cmm9sqj43012z07wd2srizeqh/master';

const client = new Client({
    authToken: TOKEN,
    endpoint: ENDPOINT,
    name: 'add-asset-upload-fields',
});

// ─── LandingHero → heroImage (Asset) ──────────────────────────────────────────
client.createRelationalField({
    parentApiId: 'LandingHero',
    apiId: 'heroImage',
    displayName: 'Hero Image',
    description: 'Upload a hero background image (replaces heroImageUrl)',
    type: RelationalFieldType.Asset,
    isRequired: false,
    reverseField: {
        apiId: 'landingHeroHeroImage',
        displayName: 'Landing Hero (Hero Image)',
        modelApiId: 'Asset',
        isHidden: true,
    },
});

// ─── GalleryImage → image (Asset) ─────────────────────────────────────────────
client.createRelationalField({
    parentApiId: 'GalleryImage',
    apiId: 'image',
    displayName: 'Image',
    description: 'Upload a gallery image (replaces imageUrl)',
    type: RelationalFieldType.Asset,
    isRequired: false,
    reverseField: {
        apiId: 'galleryImageImage',
        displayName: 'Gallery Image (Image)',
        modelApiId: 'Asset',
        isHidden: true,
    },
});

// ─── ContractorLandingHero → heroImage (Asset) ────────────────────────────────
client.createRelationalField({
    parentApiId: 'ContractorLandingHero',
    apiId: 'heroImage',
    displayName: 'Hero Image',
    description: 'Upload a hero background image (replaces heroImageUrl)',
    type: RelationalFieldType.Asset,
    isRequired: false,
    reverseField: {
        apiId: 'contractorHeroImage',
        displayName: 'Contractor Hero (Hero Image)',
        modelApiId: 'Asset',
        isHidden: true,
    },
});

// ─── Run ──────────────────────────────────────────────────────────────────────
console.log('Adding asset upload fields...');

client.run(true).then((result) => {
    if (result.errors) {
        console.error('Migration errors:', JSON.stringify(result.errors, null, 2));
        process.exit(1);
    }
    console.log('Done:', result.name, '— finished at', result.finishedAt);
    console.log('\nAsset fields added. You can now upload images in the HyGraph dashboard.');
    console.log('The frontend will prefer uploaded assets over pasted URLs.');
}).catch((err) => {
    console.error('Fatal:', err.message);
    process.exit(1);
});
