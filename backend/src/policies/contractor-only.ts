/**
 * Policy to restrict access to authenticated contractors only
 */
export default (policyContext, config, { strapi }) => {
    const { user } = policyContext.state;

    if (!user) {
        return false;
    }

    // Check if user has an associated contractor profile
    // The 'contractor' field should be populated by the supabase-auth middleware
    if (user.contractor) {
        return true;
    }

    // If not populated yet (e.g. if authentication came from Strapi JWT), 
    // we do a final check in the database
    return strapi.db.query('api::contractor.contractor').findOne({
        where: { user: user.id }
    }).then(contractor => {
        if (contractor) {
            // Set it on the state for the controller to use
            policyContext.state.contractor = contractor;
            return true;
        }
        return false;
    });
};
