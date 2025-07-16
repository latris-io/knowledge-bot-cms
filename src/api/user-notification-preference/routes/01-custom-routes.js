'use strict';

/**
 * Custom routes for user-notification-preference
 */

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/user-notification-preferences/by-user/:companyId/:botId/:userId',
      handler: 'user-notification-preference.findByUser',
      config: {
        policies: [],
        middlewares: ['global::assign-user-bot-to-upload']
      }
    },
    {
      method: 'POST',
      path: '/user-notification-preferences/upsert',
      handler: 'user-notification-preference.upsertForUser',
      config: {
        policies: [],
        middlewares: ['global::assign-user-bot-to-upload']
      }
    }
  ]
}; 