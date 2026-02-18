import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_API_URL || '';
const supabaseKey = process.env.SUPABASE_API_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Middleware to support Supabase Authentication in Strapi
 * 
 * This middleware:
 * 1. Checks for a Supabase Access Token in the Authorization header
 * 2. Verifies the token with Supabase
 * 3. Maps the Supabase user to a Strapi user (creating one if needed)
 * 4. Sets ctx.state.user so Strapi's internal logic and controllers work
 */
export default (config, { strapi }) => {
    return async (ctx, next) => {
        const authHeader = ctx.request.header.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return await next();
        }

        const token = authHeader.split(' ')[1];

        // Basic heuristic: Strapi JWTs are usually much shorter or have different structures than Supabase JWTs
        // But we should try to verify it with Supabase first if we want to prioritize Supabase auth
        try {
            // 1. Verify with Supabase
            const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);

            if (error || !supabaseUser) {
                // If Supabase fails, it might be a standard Strapi JWT, let it pass to next middleware
                return await next();
            }

            strapi.log.debug(`Supabase user authenticated: ${supabaseUser.email}`);

            // 2. Find or Create Strapi User
            let strapiUser = await strapi.db.query('plugin::users-permissions.user').findOne({
                where: { email: supabaseUser.email },
                populate: ['role', 'contractor']
            });

            if (!strapiUser) {
                strapi.log.info(`Creating new Strapi user for Supabase user: ${supabaseUser.email}`);

                // Find 'Authenticated' role
                const role = await strapi.db.query('plugin::users-permissions.role').findOne({
                    where: { type: 'authenticated' }
                });

                strapiUser = await strapi.db.query('plugin::users-permissions.user').create({
                    data: {
                        username: supabaseUser.email,
                        email: supabaseUser.email,
                        confirmed: true,
                        role: role?.id,
                        provider: 'local', // We mark it as local even though it's synced
                    }
                });
            }

            // 3. Set the state for Strapi controllers and other middlewares
            ctx.state.user = strapiUser;
            ctx.state.isAuthenticated = true;

            // Continue to next middleware
            return await next();
        } catch (err) {
            strapi.log.error('Supabase Auth Middleware Error:', err);
            return await next();
        }
    };
};
