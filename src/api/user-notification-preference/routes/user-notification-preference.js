'use strict';

/**
 * user-notification-preference router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::user-notification-preference.user-notification-preference', {
  config: {
    find: {
      middlewares: ['global::assign-user-bot-to-upload']
    },
    findOne: {
      middlewares: ['global::assign-user-bot-to-upload']
    },
    create: {
      middlewares: ['global::assign-user-bot-to-upload']
    },
    update: {
      middlewares: ['global::assign-user-bot-to-upload']
    },
    delete: {
      middlewares: ['global::assign-user-bot-to-upload']
    }
  }
}); 