'use strict';

/**
 * Subscription routes for validation and management
 * Extends users-permissions plugin with subscription endpoints
 */

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/subscription/validate-daily',
      handler: 'subscription.validateDaily',
      config: {
        auth: false
      }
    },
    {
      method: 'POST',
      path: '/subscription/validate-batch',
      handler: 'subscription.validateBatch',
      config: {
        auth: false
      }
    },
    {
      method: 'GET',
      path: '/subscription/cache-stats',
      handler: 'subscription.getCacheStats',
      config: {
        auth: false
      }
    },
    {
      method: 'POST',
      path: '/subscription/clear-cache',
      handler: 'subscription.clearCache',
      config: {
        auth: false
      }
    },
    {
      method: 'GET',
      path: '/subscription/dashboard-usage',
      handler: 'subscription.getDashboardUsage',
      config: {
        auth: false
      }
    },
    {
      method: 'GET',
      path: '/subscription/usage-report',
      handler: 'subscription.getUsageReport',
      config: {
        auth: false
      }
    }
  ]
}; 
 
 
 
 