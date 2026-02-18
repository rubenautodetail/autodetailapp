/**
 * Contractor Connect Routes
 */

export default {
    routes: [
        {
            method: 'POST',
            path: '/contractors/create-connect-account',
            handler: 'api::contractors.connect.createConnectAccount',
            config: {
                auth: false, // TODO: Enable auth in production
            },
        },
        {
            method: 'POST',
            path: '/contractors/create-onboarding-link',
            handler: 'api::contractors.connect.createOnboardingLink',
            config: {
                auth: false, // TODO: Enable auth in production
            },
        },
        {
            method: 'GET',
            path: '/contractors/:id/connect-status',
            handler: 'api::contractors.connect.getConnectStatus',
            config: {
                auth: false, // TODO: Enable auth in production
            },
        },
    ],
};
