/**
 * Policy to restrict access to admin users only
 * Checks for ADMIN_SECRET header (simple token-based admin auth for MVP)
 * or Strapi user with admin role
 */
export default (policyContext, config, { strapi }) => {
    const { user } = policyContext.state;
    const adminSecret = process.env.ADMIN_SECRET;

    // Option 1: Header-based admin secret (for internal dashboard use)
    const headerSecret = policyContext.request.headers['x-admin-secret'];
    if (adminSecret && headerSecret === adminSecret) {
        return true;
    }

    // Option 2: Strapi user with admin role
    if (!user) {
        return false;
    }

    return user.role?.type === 'admin' || user.role?.name === 'Admin';
};
