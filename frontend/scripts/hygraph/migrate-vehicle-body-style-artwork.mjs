/**
 * Creates the HyGraph model used to replace vehicle body-style illustrations.
 *
 * Run from frontend/:
 *   npm run hygraph:migrate:vehicle-artwork
 */

import {
    Client,
    RelationalFieldType,
    SimpleFieldType,
    VisibilityTypes,
} from '@hygraph/management-sdk';

const token = process.env.HYGRAPH_TOKEN;
const endpoint = process.env.NEXT_PUBLIC_HYGRAPH_ENDPOINT ?? process.env.HYGRAPH_ENDPOINT;

if (!token || !endpoint) {
    console.error('HYGRAPH_TOKEN and NEXT_PUBLIC_HYGRAPH_ENDPOINT are required.');
    process.exit(1);
}

const client = new Client({
    authToken: token,
    endpoint,
    name: 'create-vehicle-body-style-artwork-v2',
});

client.createModel({
    apiId: 'VehicleBodyStyleArtwork',
    apiIdPlural: 'VehicleBodyStyleArtworks',
    displayName: 'Vehicle Body Style Artwork',
    description: 'Editable images for the vehicle body-style selector. A missing image uses the built-in illustration.',
});

client.createSimpleField({
    parentApiId: 'VehicleBodyStyleArtwork',
    apiId: 'name',
    displayName: 'Name',
    description: 'Editor-facing body-style name.',
    type: SimpleFieldType.String,
    isRequired: true,
    isTitle: true,
    visibility: VisibilityTypes.ReadOnly,
});

client.createSimpleField({
    parentApiId: 'VehicleBodyStyleArtwork',
    apiId: 'bodyStyle',
    displayName: 'Body Style Key',
    description: 'Stable application key. Do not change this value.',
    type: SimpleFieldType.String,
    isRequired: true,
    isUnique: true,
    visibility: VisibilityTypes.ReadOnly,
});

client.createRelationalField({
    parentApiId: 'VehicleBodyStyleArtwork',
    apiId: 'image',
    displayName: 'Vehicle Image',
    description: 'Upload a transparent SVG, PNG, or WebP. The image is contained inside the existing fixed-size frame.',
    type: RelationalFieldType.Asset,
    isRequired: false,
    reverseField: {
        apiId: 'vehicleBodyStyleArtworkImage',
        displayName: 'Vehicle Body Style Artwork (Image)',
        modelApiId: 'Asset',
        isHidden: true,
    },
});

client.createSimpleField({
    parentApiId: 'VehicleBodyStyleArtwork',
    apiId: 'altText',
    displayName: 'Alternative Text',
    description: 'Accessible image description. Localized for English and Spanish.',
    type: SimpleFieldType.String,
    isLocalized: true,
    isRequired: false,
});

client.createSimpleField({
    parentApiId: 'VehicleBodyStyleArtwork',
    apiId: 'sortOrder',
    displayName: 'Sort Order',
    type: SimpleFieldType.Int,
    isRequired: true,
    initialValue: '0',
});

client.createSimpleField({
    parentApiId: 'VehicleBodyStyleArtwork',
    apiId: 'isActive',
    displayName: 'Use Uploaded Image',
    description: 'Turn off to immediately return to the built-in illustration.',
    type: SimpleFieldType.Boolean,
    isRequired: true,
    initialValue: 'true',
});

if (process.argv.includes('--dry-run')) {
    console.log(JSON.stringify(client.dryRun(), null, 2));
    process.exit(0);
}

console.log('Creating Vehicle Body Style Artwork model...');

try {
    const result = await client.run(true);
    if (result.errors) {
        console.error('Migration errors:', JSON.stringify(result.errors, null, 2));
        process.exit(1);
    }
    console.log('Schema migration complete:', result.name, '— finished at', result.finishedAt);
} catch (error) {
    console.error('Fatal:', error instanceof Error ? error.message : String(error));
    process.exit(1);
}
