const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = ({ strapi }) => ({
  /**
   * Gift subscription to a company (Admin only)
   */
  async giftSubscription(ctx) {
    try {
      // Verify admin permissions
      const user = ctx.state.user;
      if (!user) {
        return ctx.unauthorized('Authentication required');
      }

      const userWithRole = await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        user.id,
        { populate: ['role'] }
      );

      if (!['Super Admin', 'Admin'].includes(userWithRole.role?.name)) {
        return ctx.forbidden('Admin access required for subscription gifting');
      }

      const { companyId, planLevel, durationMonths, reason } = ctx.request.body;

      // Validate inputs
      if (!companyId || !planLevel || !durationMonths) {
        return ctx.badRequest('Company ID, plan level, and duration are required');
      }

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

      // Calculate new period dates
      const currentPeriodStart = new Date();
      const currentPeriodEnd = new Date();
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + durationMonths);

      // Update storage limits based on plan
      const planLimits = {
        starter: 2 * 1024 * 1024 * 1024,      // 2GB
        professional: 20 * 1024 * 1024 * 1024, // 20GB
        enterprise: 100 * 1024 * 1024 * 1024   // 100GB
      };

      // Create or update Stripe customer if needed
      let customerId = company.stripe_customer_id;
      if (!customerId) {
        const customer = await stripe.customers.create({
          name: company.name,
          metadata: {
            companyId: company.id.toString(),
            giftedBy: user.id.toString(),
            giftedAt: new Date().toISOString()
          }
        });
        customerId = customer.id;
      }

      // Update company subscription
      const updatedCompany = await strapi.entityService.update(
        'api::company.company',
        companyId,
        {
          data: {
            subscription_status: 'active',
            plan_level: planLevel,
            storage_limit_bytes: planLimits[planLevel],
            stripe_customer_id: customerId,
            current_period_start: currentPeriodStart,
            current_period_end: currentPeriodEnd
          }
        }
      );

      // Log admin action for audit
      await strapi.entityService.create('api::admin-action-log.admin-action-log', {
        data: {
          admin_user: user.id,
          action: 'gift_subscription',
          target_company: companyId,
          details: {
            planLevel,
            durationMonths,
            reason: reason || 'Admin gifted subscription',
            previousStatus: company.subscription_status,
            previousPlan: company.plan_level
          },
          timestamp: new Date()
        }
      });

      strapi.log.info('Admin gifted subscription', {
        adminId: user.id,
        companyId,
        planLevel,
        durationMonths
      });

      return ctx.send({
        data: {
          message: 'Subscription gifted successfully',
          company: updatedCompany,
          giftDetails: {
            planLevel,
            durationMonths,
            periodStart: currentPeriodStart,
            periodEnd: currentPeriodEnd
          }
        }
      });

    } catch (error) {
      strapi.log.error('Gift subscription error:', error);
      return ctx.internalServerError('Failed to gift subscription');
    }
  },

  /**
   * Extend trial period for a company (Admin only)
   */
  async extendTrial(ctx) {
    try {
      // Verify admin permissions
      const user = ctx.state.user;
      if (!user) {
        return ctx.unauthorized('Authentication required');
      }

      const userWithRole = await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        user.id,
        { populate: ['role'] }
      );

      if (!['Super Admin', 'Admin'].includes(userWithRole.role?.name)) {
        return ctx.forbidden('Admin access required for trial extension');
      }

      const { companyId, additionalDays, reason } = ctx.request.body;

      // Validate inputs
      if (!companyId || !additionalDays) {
        return ctx.badRequest('Company ID and additional days are required');
      }

      if (additionalDays < 1 || additionalDays > 90) {
        return ctx.badRequest('Additional days must be between 1 and 90');
      }

      // Get company
      const company = await strapi.entityService.findOne(
        'api::company.company',
        companyId
      );

      if (!company) {
        return ctx.notFound('Company not found');
      }

      // Calculate new trial end date
      const currentTrialEnd = company.current_period_end ? 
        new Date(company.current_period_end) : 
        new Date(Date.now() + (15 * 24 * 60 * 60 * 1000)); // Default 15 days from now

      const newTrialEnd = new Date(currentTrialEnd);
      newTrialEnd.setDate(newTrialEnd.getDate() + additionalDays);

      // Update company
      const updatedCompany = await strapi.entityService.update(
        'api::company.company',
        companyId,
        {
          data: {
            current_period_end: newTrialEnd,
            // Keep as trial if currently trial, otherwise don't change status
            subscription_status: company.subscription_status === 'trial' ? 'trial' : company.subscription_status
          }
        }
      );

      // Log admin action
      await strapi.entityService.create('api::admin-action-log.admin-action-log', {
        data: {
          admin_user: user.id,
          action: 'extend_trial',
          target_company: companyId,
          details: {
            additionalDays,
            reason: reason || 'Admin extended trial',
            previousTrialEnd: currentTrialEnd,
            newTrialEnd: newTrialEnd
          },
          timestamp: new Date()
        }
      });

      strapi.log.info('Admin extended trial', {
        adminId: user.id,
        companyId,
        additionalDays
      });

      return ctx.send({
        data: {
          message: 'Trial extended successfully',
          company: updatedCompany,
          extensionDetails: {
            additionalDays,
            newTrialEnd: newTrialEnd
          }
        }
      });

    } catch (error) {
      strapi.log.error('Extend trial error:', error);
      return ctx.internalServerError('Failed to extend trial');
    }
  },

  /**
   * Override storage limit for a company (Admin only)
   */
  async overrideStorageLimit(ctx) {
    try {
      // Verify admin permissions
      const user = ctx.state.user;
      if (!user) {
        return ctx.unauthorized('Authentication required');
      }

      const userWithRole = await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        user.id,
        { populate: ['role'] }
      );

      if (!['Super Admin', 'Admin'].includes(userWithRole.role?.name)) {
        return ctx.forbidden('Admin access required for storage override');
      }

      const { companyId, newLimitGB, reason } = ctx.request.body;

      // Validate inputs
      if (!companyId || !newLimitGB || !reason) {
        return ctx.badRequest('Company ID, new limit, and reason are required');
      }

      if (newLimitGB < 1 || newLimitGB > 1000) {
        return ctx.badRequest('Storage limit must be between 1GB and 1000GB');
      }

      // Get company
      const company = await strapi.entityService.findOne(
        'api::company.company',
        companyId
      );

      if (!company) {
        return ctx.notFound('Company not found');
      }

      const newLimitBytes = newLimitGB * 1024 * 1024 * 1024;
      const previousLimitGB = Math.round((company.storage_limit_bytes || 0) / 1024 / 1024 / 1024);

      // Update company storage limit
      const updatedCompany = await strapi.entityService.update(
        'api::company.company',
        companyId,
        {
          data: {
            storage_limit_bytes: newLimitBytes
          }
        }
      );

      // Log admin action
      await strapi.entityService.create('api::admin-action-log.admin-action-log', {
        data: {
          admin_user: user.id,
          action: 'override_storage_limit',
          target_company: companyId,
          details: {
            newLimitGB,
            previousLimitGB,
            reason,
            newLimitBytes,
            previousLimitBytes: company.storage_limit_bytes
          },
          timestamp: new Date()
        }
      });

      strapi.log.info('Admin overrode storage limit', {
        adminId: user.id,
        companyId,
        newLimitGB,
        reason
      });

      return ctx.send({
        data: {
          message: 'Storage limit overridden successfully',
          company: updatedCompany,
          overrideDetails: {
            newLimitGB,
            previousLimitGB,
            reason
          }
        }
      });

    } catch (error) {
      strapi.log.error('Override storage limit error:', error);
      return ctx.internalServerError('Failed to override storage limit');
    }
  },

  /**
   * Get all companies with subscription overview (Admin only)
   */
  async getAllSubscriptions(ctx) {
    try {
      // Verify admin permissions
      const user = ctx.state.user;
      if (!user) {
        return ctx.unauthorized('Authentication required');
      }

      const userWithRole = await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        user.id,
        { populate: ['role'] }
      );

      if (!['Super Admin', 'Admin'].includes(userWithRole.role?.name)) {
        return ctx.forbidden('Admin access required');
      }

      const { page = 1, pageSize = 25, status, planLevel } = ctx.query;

      // Build filters
      const filters = {};
      if (status) {
        filters.subscription_status = { $eq: status };
      }
      if (planLevel) {
        filters.plan_level = { $eq: planLevel };
      }

      // Get companies with pagination
      const companies = await strapi.entityService.findMany(
        'api::company.company',
        {
          filters,
          populate: ['users'],
          start: (page - 1) * pageSize,
          limit: pageSize,
          sort: 'createdAt:desc'
        }
      );

      // Get total count
      const total = await strapi.entityService.count('api::company.company', { filters });

      // Format response with subscription details
      const subscriptionOverview = companies.map(company => ({
        id: company.id,
        name: company.name,
        subscriptionStatus: company.subscription_status || 'trial',
        planLevel: company.plan_level || 'starter',
        storageUsed: company.storage_used_bytes || 0,
        storageLimit: company.storage_limit_bytes || (2 * 1024 * 1024 * 1024),
        userCount: company.users?.length || 0,
        currentPeriodStart: company.current_period_start,
        currentPeriodEnd: company.current_period_end,
        stripeCustomerId: company.stripe_customer_id,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt
      }));

      return ctx.send({
        data: subscriptionOverview,
        meta: {
          pagination: {
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            pageCount: Math.ceil(total / pageSize),
            total
          }
        }
      });

    } catch (error) {
      strapi.log.error('Get all subscriptions error:', error);
      return ctx.internalServerError('Failed to get subscription overview');
    }
  },

  /**
   * Cancel subscription for a company (Admin only)
   */
  async cancelSubscription(ctx) {
    try {
      // Verify admin permissions
      const user = ctx.state.user;
      if (!user) {
        return ctx.unauthorized('Authentication required');
      }

      const userWithRole = await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        user.id,
        { populate: ['role'] }
      );

      if (!['Super Admin', 'Admin'].includes(userWithRole.role?.name)) {
        return ctx.forbidden('Admin access required');
      }

      const { companyId, reason, immediate = false } = ctx.request.body;

      if (!companyId || !reason) {
        return ctx.badRequest('Company ID and reason are required');
      }

      // Get company
      const company = await strapi.entityService.findOne(
        'api::company.company',
        companyId
      );

      if (!company) {
        return ctx.notFound('Company not found');
      }

      // Cancel Stripe subscription if exists
      if (company.stripe_subscription_id) {
        try {
          await stripe.subscriptions.update(company.stripe_subscription_id, {
            cancel_at_period_end: !immediate,
            ...(immediate && { cancel_now: true })
          });
        } catch (stripeError) {
          strapi.log.warn('Stripe cancellation failed:', stripeError);
        }
      }

      // Update company status
      const updatedCompany = await strapi.entityService.update(
        'api::company.company',
        companyId,
        {
          data: {
            subscription_status: immediate ? 'canceled' : 'canceled',
            ...(immediate && { current_period_end: new Date() })
          }
        }
      );

      // Log admin action
      await strapi.entityService.create('api::admin-action-log.admin-action-log', {
        data: {
          admin_user: user.id,
          action: 'cancel_subscription',
          target_company: companyId,
          details: {
            reason,
            immediate,
            previousStatus: company.subscription_status,
            stripeSubscriptionId: company.stripe_subscription_id
          },
          timestamp: new Date()
        }
      });

      return ctx.send({
        data: {
          message: 'Subscription canceled successfully',
          company: updatedCompany,
          cancellationDetails: {
            immediate,
            reason
          }
        }
      });

    } catch (error) {
      strapi.log.error('Cancel subscription error:', error);
      return ctx.internalServerError('Failed to cancel subscription');
    }
  },

  /**
   * Get admin action logs for audit trail
   */
  async getAdminLogs(ctx) {
    try {
      // Verify admin permissions
      const user = ctx.state.user;
      if (!user) {
        return ctx.unauthorized('Authentication required');
      }

      const userWithRole = await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        user.id,
        { populate: ['role'] }
      );

      if (!['Super Admin', 'Admin'].includes(userWithRole.role?.name)) {
        return ctx.forbidden('Admin access required');
      }

      const { page = 1, pageSize = 50, companyId, action } = ctx.query;

      // Build filters
      const filters = {};
      if (companyId) {
        filters.target_company = { $eq: companyId };
      }
      if (action) {
        filters.action = { $eq: action };
      }

      // Get logs with pagination
      const logs = await strapi.entityService.findMany(
        'api::admin-action-log.admin-action-log',
        {
          filters,
          populate: ['admin_user', 'target_company'],
          start: (page - 1) * pageSize,
          limit: pageSize,
          sort: 'timestamp:desc'
        }
      );

      const total = await strapi.entityService.count('api::admin-action-log.admin-action-log', { filters });

      return ctx.send({
        data: logs,
        meta: {
          pagination: {
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            pageCount: Math.ceil(total / pageSize),
            total
          }
        }
      });

    } catch (error) {
      strapi.log.error('Get admin logs error:', error);
      return ctx.internalServerError('Failed to get admin logs');
    }
  }
}); 