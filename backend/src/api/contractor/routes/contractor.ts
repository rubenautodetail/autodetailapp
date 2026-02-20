export default {
    routes: [
        {
            method: 'POST',
            path: '/contractors/register',
            handler: 'contractor.register',
            config: {
                auth: false,
            },
        },
        {
            method: 'GET',
            path: '/contractors/dashboard',
            handler: 'contractor.dashboard',
            config: {
                policies: ['global::contractor-only'],
            },
        },
        {
            method: 'POST',
            path: '/contractors/accept-job/:bookingId',
            handler: 'contractor.acceptJob',
            config: {
                policies: ['global::contractor-only'],
            },
        },
        {
            method: 'POST',
            path: '/contractors/reject-job/:bookingId',
            handler: 'contractor.rejectJob',
            config: {
                policies: ['global::contractor-only'],
            },
        },
        {
            method: 'POST',
            path: '/contractors/onboard',
            handler: 'contractor.onboard',
            config: {
                policies: ['global::contractor-only'],
            },
        },
        {
            method: 'GET',
            path: '/contractors/onboarding-status',
            handler: 'contractor.onboardingStatus',
            config: {
                policies: ['global::contractor-only'],
            },
        },
        // Admin routes
        {
            method: 'GET',
            path: '/admin/contractors',
            handler: 'contractor.adminList',
            config: {
                policies: ['global::is-admin'],
            },
        },
        {
            method: 'PUT',
            path: '/admin/contractors/:id/approve',
            handler: 'contractor.adminApprove',
            config: {
                policies: ['global::is-admin'],
            },
        },
        {
            method: 'PUT',
            path: '/admin/contractors/:id/reject',
            handler: 'contractor.adminReject',
            config: {
                policies: ['global::is-admin'],
            },
        },
        {
            method: 'GET',
            path: '/admin/bookings',
            handler: 'contractor.adminBookings',
            config: {
                policies: ['global::is-admin'],
            },
        },
        {
            method: 'GET',
            path: '/admin/stats',
            handler: 'contractor.adminStats',
            config: {
                policies: ['global::is-admin'],
            },
        },
    ],
};
