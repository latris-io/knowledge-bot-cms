'use strict';

/**
 * Billing Management Routes
 * Routes for the billing management interface
 */

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/billing/management/overview',
      handler: 'billing.getManagementOverview',
      config: {
        auth: false // Admin panel handles auth differently
      }
    },
    {
      method: 'POST',
      path: '/billing/checkout/create',
      handler: 'billing.createCheckoutSession',
      config: {
        auth: false
      }
    },
    {
      method: 'GET',
      path: '/billing/invoice/:invoiceId/download',
      handler: 'billing.downloadInvoice',
      config: {
        auth: false
      }
    },
    {
      method: 'GET',
      path: '/billing/checkout/status/:sessionId',
      handler: 'billing.getCheckoutStatus',
      config: {
        auth: false
      }
    },
    {
      method: 'POST',
      path: '/billing/customer-portal',
      handler: 'billing.createCustomerPortal',
      config: {
        auth: false
      }
    },
    {
      method: 'POST',
      path: '/billing/cancel',
      handler: 'billing.cancelSubscription',
      config: {
        auth: false
      }
    },
    {
      method: 'POST',
      path: '/billing/reactivate',
      handler: 'billing.reactivateSubscription',
      config: {
        auth: false
      }
    },
    {
      method: 'GET',
      path: '/billing/notification-preferences/:companyId',
      handler: 'billing.getBillingNotificationPreferences',
      config: {
        auth: false
      }
    },
    {
      method: 'PUT',
      path: '/billing/notification-preferences/:companyId',
      handler: 'billing.updateBillingNotificationPreferences',
      config: {
        auth: false
      }
    }
  ]
}; 
 
 
 
 