export default {
    routes: [
        {
            method: 'POST',
            path: '/assignments/assign/:bookingId',
            handler: 'assignment.assignToBooking',
            config: {
                auth: false, // Public for webhook triggers
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'GET',
            path: '/assignments/:bookingId',
            handler: 'assignment.getAssignment',
            config: {
                auth: false,
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/assignments/reassign/:bookingId',
            handler: 'assignment.reassignBooking',
            config: {
                auth: false, // Can be restricted to admin later
                policies: [],
                middlewares: [],
            },
        },
    ],
};
