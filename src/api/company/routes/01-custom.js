'use strict';

/**
 * Custom company validation route
 */

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/companies/validate-unique',
      handler: 'company.validateUnique',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
}; 