'use strict';

/**
 * Custom routes for user-notification-preference
 */

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/user-notification-preferences/by-user/:companyId/:botId/:userEmail',
      handler: 'user-notification-preference.findByUser',
      config: {
        middlewares: [],
      },
    },
    {
      method: 'POST', 
      path: '/user-notification-preferences/upsert',
      handler: 'user-notification-preference.upsertForUser',
      config: {
        middlewares: [],
      },
    },
  ],
}; 