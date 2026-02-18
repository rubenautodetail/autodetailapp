export default ({ env }) => ({
    i18n: {
        enabled: true,
        config: {
            defaultLocale: 'en',
            locales: ['en', 'es'],
        },
    },
    upload: {
        config: {
            provider: 'strapi-provider-upload-supabase',
            providerOptions: {
                apiUrl: env('SUPABASE_API_URL'),
                apiKey: env('SUPABASE_API_KEY'),
                bucket: env('SUPABASE_BUCKET', 'strapi-uploads'),
                directory: env('SUPABASE_DIRECTORY', ''),
                options: {}
            },
            actionOptions: {
                upload: {},
                uploadStream: {},
                delete: {},
            },
        },
    },
    email: {
        config: {
            provider: 'strapi-provider-email-resend',
            providerOptions: {
                apiKey: env('RESEND_API_KEY'),
            },
            settings: {
                defaultFrom: 'onboarding@resend.dev',
                defaultReplyTo: 'contact@rubensautodetail.com',
            },
        },
    },
});
