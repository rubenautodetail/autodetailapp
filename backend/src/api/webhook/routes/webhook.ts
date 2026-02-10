/**
 * Webhook routes
 */

export default {
    routes: [
        {
            method: 'POST',
            path: '/webhooks/stripe',
            handler: 'webhook.stripe',
            config: {
                auth: false, // Webhooks don't use authentication
                policies: [],
                middlewares: [],
            },
        },
    ],
};
