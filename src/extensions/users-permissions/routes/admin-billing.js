module.exports = {
  routes: [
    // Gift subscription to company
    {
      method: 'POST',
      path: '/admin/billing/gift-subscription',
      handler: 'plugin::users-permissions.admin-billing.giftSubscription',
      config: {
        auth: false // Admin authentication handled in controller
      }
    },

    // Extend trial period
    {
      method: 'POST', 
      path: '/admin/billing/extend-trial',
      handler: 'plugin::users-permissions.admin-billing.extendTrial',
      config: {
        auth: false
      }
    },

    // Override storage limit
    {
      method: 'POST',
      path: '/admin/billing/override-storage',
      handler: 'plugin::users-permissions.admin-billing.overrideStorageLimit', 
      config: {
        auth: false
      }
    },

    // Get all companies with subscription overview
    {
      method: 'GET',
      path: '/admin/billing/subscriptions',
      handler: 'plugin::users-permissions.admin-billing.getAllSubscriptions',
      config: {
        auth: false
      }
    },

    // Cancel subscription for company
    {
      method: 'POST',
      path: '/admin/billing/cancel-subscription',
      handler: 'plugin::users-permissions.admin-billing.cancelSubscription',
      config: {
        auth: false
      }
    },

    // Get admin action logs for audit
    {
      method: 'GET',
      path: '/admin/billing/logs',
      handler: 'plugin::users-permissions.admin-billing.getAdminLogs',
      config: {
        auth: false
      }
    }
  ]
}; 