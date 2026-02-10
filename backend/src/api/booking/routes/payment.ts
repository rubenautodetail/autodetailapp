/**
 * Custom payment routes for bookings
 */

export default {
    routes: [
        {
            method: 'POST',
            path: '/bookings/:id/create-payment-intent',
            handler: 'payment.createPaymentIntent',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/bookings/:id/confirm-payment',
            handler: 'payment.confirmPayment',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/bookings/calculate-price',
            handler: 'payment.calculatePrice',
            config: {
                policies: [],
                middlewares: [],
            },
        },
    ],
};
