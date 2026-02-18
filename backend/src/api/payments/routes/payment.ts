/**
 * Payment Routes
 */

export default {
    routes: [
        {
            method: 'POST',
            path: '/payments/create-intent',
            handler: 'api::payments.payment.createIntent',
            config: {
                auth: false, // TODO: Enable auth in production
            },
        },
        {
            method: 'POST',
            path: '/payments/webhook',
            handler: 'api::payments.payment.webhook',
            config: {
                auth: false, // Webhooks don't use standard auth
            },
        },
        {
            method: 'POST',
            path: '/payments/update-intent',
            handler: 'api::payments.payment.updateIntent',
            config: {
                auth: false,
            },
        },
        {
            method: 'POST',
            path: '/payments/capture',
            handler: 'api::payments.payment.capturePayment',
            config: {
                auth: false, // TODO: Restrict to admin/contractor in production
            },
        },
        {
            method: 'POST',
            path: '/payments/calculate-fees',
            handler: 'api::payments.payment.calculateFees',
            config: {
                auth: false,
            },
        },
        {
            method: 'GET',
            path: '/payments/test',
            handler: 'api::payments.payment.calculateFees',
            config: {
                auth: false,
            },
        },
    ],
};
