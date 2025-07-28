'use strict';

/**
 * Bot Management Routes
 */

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/bot-management/list',
      handler: 'bot-management.list',
      config: {
        auth: false,  // Admin panel handles auth differently
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'POST',
      path: '/bot-management/create',
      handler: 'bot-management.create',
      config: {
        auth: false,  // Admin panel handles auth differently
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'PUT',
      path: '/bot-management/:id',
      handler: 'bot-management.update',
      config: {
        auth: false,  // Admin panel handles auth differently
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'DELETE',
      path: '/bot-management/:id',
      handler: 'bot-management.delete',
      config: {
        auth: false,  // Admin panel handles auth differently
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'GET',
      path: '/bot-management/:id',
      handler: 'bot-management.findOne',
      config: {
        auth: false,  // Admin panel handles auth differently
        policies: [],
        middlewares: []
        }
    },
    {
      method: 'GET',
      path: '/bot-management/upload-bots',
      handler: 'bot-management.getUploadBots',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ]
}; 