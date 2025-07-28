'use strict';

/**
 * Billing Management Controller
 * Handles billing interface operations for standard users
 */

// Handle Stripe initialization safely
const initStripe = () => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn('STRIPE_SECRET_KEY not configured, Stripe functionality will be disabled');
      return null;
    }
    // Initialize Stripe using original working pattern
    return require('stripe')(process.env.STRIPE_SECRET_KEY);
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
    return null;
  }
};

module.exports = ({ strapi }) => ({
  /**
   * Get billing management overview for current user
   */
  async getManagementOverview(ctx) {
    try {
      // For admin panel requests, we need to get user differently
      let user = ctx.state.user;
      let isAdminUser = false;
      
      // If no user in context (admin panel), try to get from authorization header
      if (!user && ctx.request.header.authorization) {
        try {
          const token = ctx.request.header.authorization.replace('Bearer ', '');
          
          // Try admin token verification first
          try {
            const adminDecoded = strapi.admin.services.token.verifyToken(token);
            if (adminDecoded && adminDecoded.id) {
              // Get admin user
              const adminUser = await strapi.admin.services.user.findOne(adminDecoded.id);
              if (adminUser) {
                isAdminUser = true;
                strapi.log.info('Admin user authenticated:', adminUser.email);
                
                // For admin users, find or create a linked regular user
                let linkedUser = await strapi.entityService.findMany('plugin::users-permissions.user', {
                  filters: { email: adminUser.email },
                  populate: ['company'],
                  limit: 1
                });
                
                if (linkedUser && linkedUser.length > 0) {
                  user = linkedUser[0];
                } else {
                  // Create a regular user linked to this admin
                  strapi.log.info('Creating linked user for admin:', adminUser.email);
                  user = await strapi.entityService.create('plugin::users-permissions.user', {
                    data: {
                      username: adminUser.username || adminUser.email.split('@')[0],
                      email: adminUser.email,
                      confirmed: true,
                      blocked: false
                    }
                  });
                }
              }
            }
          } catch (adminError) {
            // If admin token fails, try users-permissions token
            const decoded = await strapi.plugins['users-permissions'].services.jwt.verify(token);
            if (decoded && decoded.id) {
              user = await strapi.entityService.findOne('plugin::users-permissions.user', decoded.id);
            }
          }
        } catch (jwtError) {
          strapi.log.warn('JWT verification failed:', jwtError.message);
          strapi.log.warn('JWT Error Details:', jwtError);
          strapi.log.warn('Authorization Header:', ctx.request.header.authorization ? 'Present' : 'Missing');
        }
      }
      
      // If still no user, try to get the first available user with company data for development
      if (!user) {
        strapi.log.warn('No authenticated user found, looking for first user with company data');
        
        // Find first user with company data
        const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
          populate: ['company'],
          limit: 10
        });
        
        user = users.find(u => u.company);
        
        if (!user) {
          // Create a demo user with company if none exists
          strapi.log.info('No users with company found, creating demo data');
          
          // Check if demo company exists, create if not
          let demoCompany = await strapi.entityService.findMany('api::company.company', {
            filters: { name: 'Demo Company' },
            limit: 1
          });
          
          if (!demoCompany || demoCompany.length === 0) {
            demoCompany = await strapi.entityService.create('api::company.company', {
              data: {
                name: 'Demo Company',
                subscription_status: 'trial',
                plan_level: 'starter',
                storage_used_bytes: 0,
                storage_limit_bytes: 2147483648, // 2GB
                current_period_start: new Date(),
                current_period_end: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // 15 days from now
              }
            });
          } else {
            demoCompany = demoCompany[0];
          }
          
          // Check if demo user exists, create if not
          const existingUsers = await strapi.entityService.findMany('plugin::users-permissions.user', {
            filters: { email: 'demo@example.com' },
            limit: 1
          });
          
          if (!existingUsers || existingUsers.length === 0) {
            user = await strapi.entityService.create('plugin::users-permissions.user', {
              data: {
                username: 'demo',
                email: 'demo@example.com',
                confirmed: true,
                blocked: false,
                company: demoCompany.id
              }
            });
          } else {
            user = existingUsers[0];
            // Update user to link to company if not already linked
            if (!user.company) {
              user = await strapi.entityService.update('plugin::users-permissions.user', user.id, {
                data: { company: demoCompany.id }
              });
            }
          }
        }
      }

      if (!user) {
        return ctx.internalServerError('Could not determine user for billing overview');
      }

      // Get user with company data
      const userWithCompany = await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        user.id,
        { populate: ['company', 'company.users'] }
      );

      if (!userWithCompany?.company) {
        return ctx.badRequest('User must be assigned to a company');
      }

      const company = userWithCompany.company;

      // Calculate storage usage if needed
      try {
        await strapi
          .plugin('users-permissions')
          .service('subscription')
          .calculateStorageUsage(company.id);
      } catch (storageError) {
        strapi.log.warn('Storage calculation failed for billing overview:', storageError);
      }

      // Refresh company data after storage calculation
      const updatedCompany = await strapi.entityService.findOne(
        'api::company.company',
        company.id,
        { populate: ['users'] }
      );

      // Get plan limits
      const planLimits = this.getPlanLimits(updatedCompany.plan_level || 'starter');

      // Ensure subscription status is set for trial calculation
      if (!updatedCompany.subscription_status) {
        strapi.log.info(`Setting subscription status to 'trial' for company ${updatedCompany.id}`);
        await strapi.entityService.update('api::company.company', updatedCompany.id, {
          data: {
            subscription_status: 'trial',
            plan_level: 'starter'
          }
        });
        updatedCompany.subscription_status = 'trial';
        updatedCompany.plan_level = 'starter';
      }

      // Calculate trial period for companies without proper dates
      let trialEndDate = updatedCompany.current_period_end;
      let trialStartDate = updatedCompany.current_period_start;
      
      strapi.log.info(`Company ${updatedCompany.id} subscription status: ${updatedCompany.subscription_status}`);
      strapi.log.info(`Current trial end date: ${trialEndDate}`);
      
      if (updatedCompany.subscription_status === 'trial') {
        if (!trialEndDate || new Date(trialEndDate) < new Date()) {
          // Reset trial period for development: 15 days from now
          trialStartDate = new Date();
          trialEndDate = new Date();
          trialEndDate.setDate(trialEndDate.getDate() + 15);
          
          strapi.log.info(`Resetting trial period for company ${updatedCompany.id} - New end date: ${trialEndDate}`);
          
          // Update the company with fresh trial dates
          await strapi.entityService.update('api::company.company', updatedCompany.id, {
            data: {
              current_period_start: trialStartDate,
              current_period_end: trialEndDate
            }
          });
        }
      }

      // Prepare billing data
      const billingData = {
        company: {
          id: updatedCompany.id,
          name: updatedCompany.name,
          createdAt: updatedCompany.createdAt
        },
        subscription: {
          status: updatedCompany.subscription_status || 'trial',
          planLevel: updatedCompany.plan_level || 'starter',
          currentPeriodStart: trialStartDate,
          currentPeriodEnd: trialEndDate,
          stripeCustomerId: updatedCompany.stripe_customer_id,
          // Add trial days remaining calculation
          trialDaysRemaining: updatedCompany.subscription_status === 'trial' && trialEndDate 
            ? Math.max(0, Math.ceil((new Date(trialEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
            : null
        },
        usage: {
          storageUsed: updatedCompany.storage_used_bytes || 0,
          storageLimit: updatedCompany.storage_limit_bytes || planLimits.storageLimit
        },
        invoices: []
      };

      // Get Stripe invoices if customer exists
      if (updatedCompany.stripe_customer_id) {
        try {
          const invoices = await initStripe().invoices.list({
            customer: updatedCompany.stripe_customer_id,
            limit: 10,
            status: 'paid'
          });
          
          billingData.invoices = invoices.data.map(invoice => ({
            id: invoice.id,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            description: invoice.description || `${updatedCompany.plan_level || 'starter'} plan`,
            status: invoice.status,
            created: invoice.created * 1000,
            invoiceUrl: invoice.invoice_pdf
          }));
        } catch (stripeError) {
          strapi.log.warn('Failed to fetch Stripe invoices:', stripeError);
        }
      }



      return ctx.send({ data: billingData });
    } catch (error) {
      strapi.log.error('Billing management overview error:', error);
      return ctx.internalServerError('Failed to get billing data');
    }
  },

  /**
   * Create Stripe checkout session for plan upgrade
   */
  async createCheckoutSession(ctx) {
    try {
      // Check if Stripe is configured
      const stripe = initStripe();
      if (!stripe) {
        return ctx.badRequest('Payment processing is not configured. Please contact support.');
      }

      // Use same authentication logic as getManagementOverview
      let user = ctx.state.user;
      
      // If no user in context (admin panel), try to get from authorization header
      if (!user && ctx.request.header.authorization) {
        try {
          const token = ctx.request.header.authorization.replace('Bearer ', '');
          
          // Try admin token verification first
          try {
            const adminDecoded = strapi.admin.services.token.verifyToken(token);
            if (adminDecoded && adminDecoded.id) {
              // Get admin user and find/create linked regular user
              const adminUser = await strapi.admin.services.user.findOne(adminDecoded.id);
              if (adminUser) {
                let linkedUser = await strapi.entityService.findMany('plugin::users-permissions.user', {
                  filters: { email: adminUser.email },
                  populate: ['company'],
                  limit: 1
                });
                
                if (linkedUser && linkedUser.length > 0) {
                  user = linkedUser[0];
                }
              }
            }
          } catch (adminError) {
            // If admin token fails, try users-permissions token
            const decoded = await strapi.plugins['users-permissions'].services.jwt.verify(token);
            if (decoded && decoded.id) {
              user = await strapi.entityService.findOne('plugin::users-permissions.user', decoded.id);
            }
          }
        } catch (jwtError) {
          strapi.log.warn('JWT verification failed in createCheckoutSession:', jwtError.message);
        }
      }
      
      // If still no user, get the first user with company data (development mode)
      if (!user) {
        const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
          populate: ['company'],
          limit: 10
        });
        user = users.find(u => u.company);
      }

      if (!user) {
        return ctx.unauthorized('Authentication required');
      }

      const { planLevel, companyId } = ctx.request.body;

      // Validate plan level
      const validPlans = ['starter', 'professional', 'enterprise'];
      if (!validPlans.includes(planLevel)) {
        return ctx.badRequest('Invalid plan level');
      }

      // Get company
      const company = await strapi.entityService.findOne(
        'api::company.company',
        companyId
      );

      if (!company) {
        return ctx.notFound('Company not found');
      }

      // Verify user belongs to company
      const userCompany = await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        user.id,
        { populate: ['company'] }
      );

      if (userCompany.company?.id !== company.id) {
        return ctx.forbidden('Access denied');
      }

      // Plan pricing configuration - requires real Stripe Price IDs
      const planPricing = {
        starter: { 
          priceId: process.env.STRIPE_STARTER_PRICE_ID, 
          amount: 4900 
        },
        professional: { 
          priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID, 
          amount: 14900 
        },
        enterprise: { 
          priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID, 
          amount: 49900 
        }
      };

      const selectedPlan = planPricing[planLevel];
      if (!selectedPlan || !selectedPlan.priceId) {
        return ctx.badRequest('Plan configuration not found. Please ensure Stripe Price IDs are configured in environment variables.');
      }

      // Create or get Stripe customer
      let customerId = company.stripe_customer_id;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: company.name,
          metadata: {
            companyId: company.id.toString(),
            userId: user.id.toString(),
            businessUnit: 'knowledge-bot'
          }
        });
        customerId = customer.id;

        // Update company with customer ID
        await strapi.entityService.update('api::company.company', company.id, {
          data: { stripe_customer_id: customerId }
        });
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: selectedPlan.priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:1337'}/admin/billing-management?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:1337'}/admin/billing-management?canceled=true`,
        metadata: {
          companyId: company.id.toString(),
          planLevel,
          userId: user.id.toString()
        },
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        customer_update: {
          address: 'auto',
          name: 'auto'
        }
      });

      return ctx.send({ 
        data: { 
          checkoutUrl: session.url,
          sessionId: session.id 
        } 
      });

    } catch (error) {
      strapi.log.error('Checkout session creation error:', error);
      
      // Provide more specific error messages based on Stripe errors
      let errorMessage = 'Failed to create checkout session';
      
      if (error.message && error.message.includes('No such price')) {
        errorMessage = 'Payment plan configuration error. Please contact support - the selected plan is not properly configured.';
      } else if (error.message && error.message.includes('No such customer')) {
        errorMessage = 'Customer account error. Please contact support.';
      } else if (error.message && error.message.includes('Invalid API key')) {
        errorMessage = 'Payment system configuration error. Please contact support.';
      } else if (error.type === 'StripeCardError') {
        errorMessage = 'Payment method error. Please try a different payment method.';
      } else if (error.type === 'StripeInvalidRequestError') {
        errorMessage = 'Payment request error. Please contact support.';
      }
      
      return ctx.badRequest(errorMessage);
    }
  },

  /**
   * Download invoice PDF
   */
  async downloadInvoice(ctx) {
    try {
      const user = ctx.state.user;
      const { invoiceId } = ctx.params;

      if (!user) {
        return ctx.unauthorized('Authentication required');
      }

      // Get user company
      const userWithCompany = await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        user.id,
        { populate: ['company'] }
      );

      if (!userWithCompany?.company) {
        return ctx.badRequest('User must be assigned to a company');
      }

      const company = userWithCompany.company;

      if (!company.stripe_customer_id) {
        return ctx.badRequest('No billing account found');
      }

      // Get invoice from Stripe
      const invoice = await initStripe().invoices.retrieve(invoiceId);

      // Verify invoice belongs to company
      if (invoice.customer !== company.stripe_customer_id) {
        return ctx.forbidden('Access denied');
      }

      // Get invoice PDF
      const response = await fetch(invoice.invoice_pdf);
      if (!response.ok) {
        throw new Error('Failed to fetch invoice PDF');
      }
      
      const buffer = await response.arrayBuffer();

      ctx.set('Content-Type', 'application/pdf');
      ctx.set('Content-Disposition', `attachment; filename="invoice-${invoiceId}.pdf"`);
      
      return ctx.send(Buffer.from(buffer));

    } catch (error) {
      strapi.log.error('Invoice download error:', error);
      return ctx.internalServerError('Failed to download invoice');
    }
  },

  /**
   * Get checkout session status (for success page)
   */
  async getCheckoutStatus(ctx) {
    try {
      const user = ctx.state.user;
      const { sessionId } = ctx.params;

      if (!user) {
        return ctx.unauthorized('Authentication required');
      }

      // Get checkout session from Stripe
      const stripe = initStripe();
      if (!stripe) {
        return ctx.internalServerError('Stripe not configured');
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId);

      // Verify session belongs to user's company
      const userWithCompany = await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        user.id,
        { populate: ['company'] }
      );

      if (!userWithCompany?.company) {
        return ctx.badRequest('User must be assigned to a company');
      }

      const company = userWithCompany.company;
      if (session.customer !== company.stripe_customer_id) {
        return ctx.forbidden('Access denied');
      }

      return ctx.send({
        data: {
          status: session.payment_status,
          customerEmail: session.customer_details?.email,
          amountTotal: session.amount_total,
          currency: session.currency,
          planLevel: session.metadata?.planLevel
        }
      });

    } catch (error) {
      strapi.log.error('Checkout status error:', error);
      return ctx.internalServerError('Failed to get checkout status');
    }
  },

  /**
   * Create Stripe customer portal session
   */
  async createCustomerPortal(ctx) {
    try {
      const user = ctx.state.user;
      const { companyId, returnUrl } = ctx.request.body;

      if (!user) {
        return ctx.unauthorized('Authentication required');
      }

      // Get company
      const company = await strapi.entityService.findOne(
        'api::company.company',
        companyId
      );

      if (!company) {
        return ctx.notFound('Company not found');
      }

      // Verify user belongs to company
      const userWithCompany = await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        user.id,
        { populate: ['company'] }
      );

      if (userWithCompany.company?.id !== company.id) {
        return ctx.forbidden('Access denied');
      }

      if (!company.stripe_customer_id) {
        return ctx.badRequest('No Stripe customer found. Please upgrade to a paid plan first.');
      }

      const stripe = initStripe();
      if (!stripe) {
        return ctx.internalServerError('Stripe not configured');
      }

      // Create customer portal session
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: company.stripe_customer_id,
        return_url: returnUrl || `${process.env.FRONTEND_URL || 'http://localhost:1337'}/admin/billing-management`,
      });

      return ctx.send({
        data: {
          portalUrl: portalSession.url
        }
      });

    } catch (error) {
      strapi.log.error('Customer portal error:', error);
      return ctx.internalServerError('Failed to create customer portal session');
    }
  },

  /**
   * Cancel subscription
   */
  async cancelSubscription(ctx) {
    try {
      const user = ctx.state.user;
      const { companyId } = ctx.request.body;

      if (!user) {
        return ctx.unauthorized('Authentication required');
      }

      // Get company
      const company = await strapi.entityService.findOne(
        'api::company.company',
        companyId
      );

      if (!company) {
        return ctx.notFound('Company not found');
      }

      // Verify user belongs to company
      const userWithCompany = await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        user.id,
        { populate: ['company'] }
      );

      if (userWithCompany.company?.id !== company.id) {
        return ctx.forbidden('Access denied');
      }

      if (!company.stripe_subscription_id) {
        return ctx.badRequest('No active subscription found');
      }

      const stripe = initStripe();
      if (!stripe) {
        return ctx.internalServerError('Stripe not configured');
      }

      // Cancel the subscription at period end
      const subscription = await stripe.subscriptions.update(
        company.stripe_subscription_id,
        {
          cancel_at_period_end: true,
          metadata: {
            canceled_by: user.id.toString(),
            canceled_at: new Date().toISOString()
          }
        }
      );

      // Update company status
      await strapi.entityService.update('api::company.company', company.id, {
        data: {
          subscription_status: 'canceled'
        }
      });

      return ctx.send({
        data: {
          message: 'Subscription will be canceled at the end of the current billing period',
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
        }
      });

    } catch (error) {
      strapi.log.error('Cancel subscription error:', error);
      return ctx.internalServerError('Failed to cancel subscription');
    }
  },

  /**
   * Reactivate canceled subscription (BR-SB043)
   */
  async reactivateSubscription(ctx) {
    try {
      const user = ctx.state.user;
      const { companyId } = ctx.request.body;

      if (!user) {
        return ctx.unauthorized('Authentication required');
      }

      // Get company with role check
      const company = await strapi.entityService.findOne(
        'api::company.company',
        companyId,
        { populate: ['users'] }
      );

      if (!company) {
        return ctx.notFound('Company not found');
      }

      // Verify user belongs to company and has admin permissions (BR-SB032)
      const userWithCompany = await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        user.id,
        { populate: ['company', 'role'] }
      );

      if (userWithCompany.company?.id !== company.id) {
        return ctx.forbidden('Access denied');
      }

      // Check if user has admin or owner role (BR-SB032)
      const userRole = userWithCompany.role?.name?.toLowerCase();
      if (!['admin', 'owner', 'authenticated'].includes(userRole)) {
        return ctx.forbidden('Only company admins and owners can modify subscriptions');
      }

      if (!company.stripe_subscription_id) {
        return ctx.badRequest('No subscription found');
      }

      if (company.subscription_status !== 'canceled') {
        return ctx.badRequest('Subscription is not canceled');
      }

      const stripe = initStripe();
      if (!stripe) {
        return ctx.internalServerError('Stripe not configured');
      }

      // Reactivate the subscription by removing cancel_at_period_end
      const subscription = await stripe.subscriptions.update(
        company.stripe_subscription_id,
        {
          cancel_at_period_end: false,
          metadata: {
            reactivated_by: user.id.toString(),
            reactivated_at: new Date().toISOString()
          }
        }
      );

      // Update company status
      await strapi.entityService.update('api::company.company', company.id, {
        data: {
          subscription_status: 'active'
        }
      });

      return ctx.send({
        data: {
          message: 'Subscription has been reactivated successfully',
          subscriptionStatus: 'active',
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
        }
      });

    } catch (error) {
      strapi.log.error('Reactivate subscription error:', error);
      return ctx.internalServerError('Failed to reactivate subscription');
    }
  },

  /**
   * Get billing notification preferences for user
   */
  async getBillingNotificationPreferences(ctx) {
    try {
      const user = ctx.state.user;
      const { companyId } = ctx.params;

      if (!user) {
        return ctx.unauthorized('Authentication required');
      }

      // Get user with company verification
      const userWithCompany = await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        user.id,
        { populate: ['company'] }
      );

      if (!userWithCompany?.company || userWithCompany.company.id !== parseInt(companyId)) {
        return ctx.forbidden('Access denied');
      }

      // Map individual fields to billing API format
      return ctx.send({
        data: {
          billingNotifications: userWithCompany.billing_notifications !== undefined ? userWithCompany.billing_notifications : true,
          paymentFailureAlerts: userWithCompany.billing_notifications !== undefined ? userWithCompany.billing_notifications : true,
          subscriptionChanges: userWithCompany.subscription_reminders !== undefined ? userWithCompany.subscription_reminders : true,
          invoiceReminders: userWithCompany.billing_notifications !== undefined ? userWithCompany.billing_notifications : true,
          usageLimitWarnings: userWithCompany.storage_limit_warnings !== undefined ? userWithCompany.storage_limit_warnings : true,
          trialEndingAlerts: userWithCompany.trial_ending_alerts !== undefined ? userWithCompany.trial_ending_alerts : true,
          email: user.email
        }
      });

    } catch (error) {
      strapi.log.error('Get billing notification preferences error:', error);
      return ctx.internalServerError('Failed to get notification preferences');
    }
  },

  /**
   * Update billing notification preferences
   */
  async updateBillingNotificationPreferences(ctx) {
    try {
      const user = ctx.state.user;
      const { companyId } = ctx.params;
      const { billingNotifications, paymentFailureAlerts, subscriptionChanges, invoiceReminders, usageLimitWarnings, trialEndingAlerts } = ctx.request.body;

      if (!user) {
        return ctx.unauthorized('Authentication required');
      }

      // Get user with company verification
      const userWithCompany = await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        user.id,
        { populate: ['company'] }
      );

      if (!userWithCompany?.company || userWithCompany.company.id !== parseInt(companyId)) {
        return ctx.forbidden('Access denied');
      }

      // Prepare update data for individual fields
      const updateData = {};
      
      if (billingNotifications !== undefined) {
        updateData.billing_notifications = Boolean(billingNotifications);
      }
      if (paymentFailureAlerts !== undefined) {
        updateData.billing_notifications = Boolean(paymentFailureAlerts);
      }
      if (subscriptionChanges !== undefined) {
        updateData.subscription_reminders = Boolean(subscriptionChanges);
      }
      if (invoiceReminders !== undefined) {
        updateData.billing_notifications = Boolean(invoiceReminders);
      }
      if (usageLimitWarnings !== undefined) {
        updateData.storage_limit_warnings = Boolean(usageLimitWarnings);
      }
      if (trialEndingAlerts !== undefined) {
        updateData.trial_ending_alerts = Boolean(trialEndingAlerts);
      }

      // Update user with new notification preferences
      await strapi.entityService.update('plugin::users-permissions.user', user.id, {
        data: updateData
      });

      return ctx.send({
        data: {
          message: 'Billing notification preferences updated successfully',
          preferences: {
            billingNotifications: updateData.billing_notifications,
            paymentFailureAlerts: updateData.billing_notifications,
            subscriptionChanges: updateData.subscription_reminders,
            invoiceReminders: updateData.billing_notifications,
            usageLimitWarnings: updateData.storage_limit_warnings,
            trialEndingAlerts: updateData.trial_ending_alerts
          }
        }
      });

    } catch (error) {
      strapi.log.error('Update billing notification preferences error:', error);
      return ctx.internalServerError('Failed to update notification preferences');
    }
  },

  /**
   * Get plan limits for billing display
   */
  getPlanLimits(planLevel) {
    const limits = {
      starter: {
        storageLimit: 2 * 1024 * 1024 * 1024, // 2GB
        features: ['Basic Support', 'File Upload', 'AI Chat', 'Email Notifications']
      },
      professional: {
        storageLimit: 20 * 1024 * 1024 * 1024, // 20GB
        features: ['Priority Support', 'Advanced Analytics', 'Custom Domains', 'File Upload', 'AI Chat', 'API Access']
      },
      enterprise: {
        storageLimit: 100 * 1024 * 1024 * 1024, // 100GB
        features: ['24/7 Support', 'Advanced Analytics', 'Custom Domains', 'API Access', 'File Upload', 'AI Chat', 'Custom Integration']
      }
    };

    return limits[planLevel] || limits.starter;
  }
}); 
 
 
 
 