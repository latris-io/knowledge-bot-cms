'use strict';

/**
 * company router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

// Create the core router with default CRUD routes
const coreRouter = createCoreRouter('api::company.company');

// Add custom routes
const customRoutes = [
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
];

// Combine custom routes with core routes
module.exports = {
  routes: [
    ...customRoutes,
    ...(Array.isArray(coreRouter.routes) ? coreRouter.routes : []),
  ],
};
