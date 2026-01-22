export default {
    routes: [
        {
            method: 'POST',
            path: '/booking/validate-zip',
            handler: 'custom-booking.validateZip',
            config: {
                auth: false, // Public endpoint - no authentication required
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/booking/geolocation',
            handler: 'custom-booking.geolocation',
            config: {
                auth: false, // Public endpoint - no authentication required
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/booking/calculate-price',
            handler: 'custom-booking.calculatePrice',
            config: {
                auth: false, // Public endpoint - no authentication required
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/booking/availability',
            handler: 'custom-booking.getAvailability',
            config: {
                auth: false, // Public endpoint
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/booking/hold-slot',
            handler: 'custom-booking.holdSlot',
            config: {
                auth: false, // Public endpoint
                policies: [],
                middlewares: [],
            },
        },
    ],
};
