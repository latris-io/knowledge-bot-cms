'use strict';

/**
 * Billing service for Stripe integration
 * Extends users-permissions plugin with billing services
 */

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null;
  }
  if (!global.stripeInstance) {
    global.stripeInstance = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }
  return global.stripeInstance;
};

module.exports = ({ strapi }) => ({
  /**
   * Process Stripe webhook events
   */
  async processWebhook(event, signature) {
    try {
      const stripe = getStripe();
      if (!stripe) {
        throw new Error('Stripe not configured');
      }

      // Verify webhook signature
      if (process.env.STRIPE_WEBHOOK_SECRET) {
        try {
          stripe.webhooks.constructEvent(
            event,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
          );
        } catch (err) {
          strapi.log.error('Webhook signature verification failed:', err.message);
          throw new Error('Invalid webhook signature');
        }
      }

      const eventData = typeof event === 'string' ? JSON.parse(event) : event;
      
      // Filter for knowledge-bot business unit
      const metadata = eventData.data?.object?.metadata;
      if (metadata?.businessUnit !== 'knowledge-bot') {
        strapi.log.debug('Skipping webhook - not for knowledge-bot business unit');
        return { processed: false, reason: 'Not for business unit' };
      }

      strapi.log.info(`Processing Stripe webhook: ${eventData.type}`);

      switch (eventData.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionChange(eventData.data.object);
          break;
          
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCanceled(eventData.data.object);
          break;
          
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(eventData.data.object);
          break;
          
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(eventData.data.object);
          break;
          
        default:
          strapi.log.debug(`Unhandled webhook type: ${eventData.type}`);
      }

      return { processed: true, type: eventData.type };
    } catch (error) {
      strapi.log.error('Webhook processing error:', error);
      throw error;
    }
  },

  /**
   * Handle subscription created/updated
   */
  async handleSubscriptionChange(subscription) {
    try {
      const companyId = subscription.metadata?.companyId;
      if (!companyId) {
        strapi.log.warn('No companyId in subscription metadata');
        return;
      }

      // Determine plan level from price ID
      let planLevel = 'starter';
      const priceId = subscription.items.data[0]?.price?.id;
      
      if (priceId?.includes('professional')) {
        planLevel = 'professional';
      } else if (priceId?.includes('enterprise')) {
        planLevel = 'enterprise';
      }

      // Update company subscription data
      await strapi.entityService.update('api::company.company', companyId, {
        data: {
          subscription_status: subscription.status,
          plan_level: planLevel,
          stripe_subscription_id: subscription.id,
          current_period_start: new Date(subscription.current_period_start * 1000),
          current_period_end: new Date(subscription.current_period_end * 1000),
          storage_limit_bytes: this.getStorageLimitForPlan(planLevel)
        }
      });

      strapi.log.info(`Updated company ${companyId} subscription: ${subscription.status} - ${planLevel}`);
    } catch (error) {
      strapi.log.error('Failed to handle subscription change:', error);
      throw error;
    }
  },

  /**
   * Handle subscription canceled
   */
  async handleSubscriptionCanceled(subscription) {
    try {
      const companyId = subscription.metadata?.companyId;
      if (!companyId) {
        strapi.log.warn('No companyId in subscription metadata');
        return;
      }

      await strapi.entityService.update('api::company.company', companyId, {
        data: {
          subscription_status: 'canceled',
          plan_level: 'starter', // Downgrade to starter
          storage_limit_bytes: this.getStorageLimitForPlan('starter')
        }
      });

      strapi.log.info(`Canceled subscription for company ${companyId}`);
    } catch (error) {
      strapi.log.error('Failed to handle subscription cancellation:', error);
      throw error;
    }
  },

  /**
   * Handle successful payment
   */
  async handlePaymentSucceeded(invoice) {
    try {
      const customerId = invoice.customer;
      
      // Find company by Stripe customer ID
      const companies = await strapi.entityService.findMany('api::company.company', {
        filters: { stripe_customer_id: customerId },
        limit: 1
      });

      if (companies.length === 0) {
        strapi.log.warn(`No company found for Stripe customer ${customerId}`);
        return;
      }

      const company = companies[0];
      
      // Log the successful payment
      strapi.log.info(`Payment succeeded for company ${company.id}: $${invoice.amount_paid / 100}`);
      
      // Here you could create a payment record or send notifications
    } catch (error) {
      strapi.log.error('Failed to handle payment success:', error);
      throw error;
    }
  },

  /**
   * Handle failed payment
   */
  async handlePaymentFailed(invoice) {
    try {
      const customerId = invoice.customer;
      
      // Find company by Stripe customer ID
      const companies = await strapi.entityService.findMany('api::company.company', {
        filters: { stripe_customer_id: customerId },
        limit: 1
      });

      if (companies.length === 0) {
        strapi.log.warn(`No company found for Stripe customer ${customerId}`);
        return;
      }

      const company = companies[0];
      
      // Update subscription status
      await strapi.entityService.update('api::company.company', company.id, {
        data: {
          subscription_status: 'past_due'
        }
      });

      strapi.log.warn(`Payment failed for company ${company.id}`);
      
      // Here you could send failure notifications
    } catch (error) {
      strapi.log.error('Failed to handle payment failure:', error);
      throw error;
    }
  },

  /**
   * Get storage limit for plan level
   */
  getStorageLimitForPlan(planLevel) {
    const limits = {
      starter: 2 * 1024 * 1024 * 1024,      // 2GB
      professional: 20 * 1024 * 1024 * 1024, // 20GB
      enterprise: 100 * 1024 * 1024 * 1024   // 100GB
    };
    
    return limits[planLevel] || limits.starter;
  },

  /**
   * Update storage usage for company
   */
  async updateStorageUsage(companyId, bytesUsed) {
    try {
      await strapi.entityService.update('api::company.company', companyId, {
        data: {
          storage_used_bytes: bytesUsed,
          storage_updated_at: new Date()
        }
      });
      
      strapi.log.debug(`Updated storage usage for company ${companyId}: ${bytesUsed} bytes`);
    } catch (error) {
      strapi.log.error('Failed to update storage usage:', error);
      throw error;
    }
  }
}); 
 
 
 
 
 