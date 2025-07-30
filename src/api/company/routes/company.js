'use strict';

/**
 * company router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

// Get default routes
const defaultRouter = createCoreRouter('api::company.company');

// Extract routes array properly
const defaultRoutes = Array.isArray(defaultRouter.routes) 
  ? defaultRouter.routes 
  : (typeof defaultRouter.routes === 'function' ? defaultRouter.routes() : []);

// Add custom routes
const customRoutes = {
  routes: [
    // 🛡️ SECURE MULTI-TENANT: Company uniqueness validation endpoint
    {
      method: 'GET',
      path: '/companies/validate-unique',
      handler: 'company.validateUnique',
      config: {
        auth: false, // Allow unauthenticated access for registration
        policies: [],
        middlewares: [],
      },
    },
    // Include all default CRUD routes
    ...defaultRoutes,
  ],
};

module.exports = customRoutes;
