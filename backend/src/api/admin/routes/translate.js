/**
 * Admin API Route to trigger translation migration
 * Access via: GET http://localhost:1337/api/admin/translate-all
 */

module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/admin/translate-all',
            handler: 'translate.translateAll',
            config: {
                auth: false, // Set to true in production to require admin auth
            },
        },
    ],
};
