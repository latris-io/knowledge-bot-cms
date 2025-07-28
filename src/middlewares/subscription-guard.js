'use strict';

/**
 * Subscription guard middleware
 * Validates subscription status and enforces storage limits
 */

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    const { method, path } = ctx.request;
    
    // Skip validation for certain paths
    const skipPaths = [
      '/billing/webhook',
      '/subscription/validate-daily',
      '/subscription/validate-batch',
      '/admin',
      '/auth'
    ];
    
    if (skipPaths.some(skipPath => path.startsWith(skipPath))) {
      return await next();
    }

    // Get user from context
    const user = ctx.state.user;
    if (!user) {
      return await next(); // No user, continue without validation
    }

    try {
      // Get user with company relationship
      const userWithCompany = await strapi.entityService.findOne(
        'plugin::users-permissions.user', 
        user.id,
        { populate: ['company'] }
      );

      if (!userWithCompany?.company) {
        return await next(); // No company, continue
      }

      const company = userWithCompany.company;

      // Check subscription status
      if (company.subscription_status === 'canceled' || company.subscription_status === 'past_due') {
        return ctx.forbidden('Subscription inactive. Please update your billing information.');
      }

      // For file upload requests, check storage limits
      if (path.includes('/upload') && method === 'POST') {
        const fileSize = ctx.request.files?.files?.size || 0;
        const currentUsage = company.storage_used_bytes || 0;
        const limit = company.storage_limit_bytes || 2147483648; // 2GB default

        if (currentUsage + fileSize > limit) {
          return ctx.forbidden('Storage limit exceeded. Please upgrade your plan or delete some files.');
        }

        // Update storage usage after successful upload
        ctx.request.updateStorageUsage = async () => {
          try {
            await strapi.plugin('users-permissions').service('subscription').calculateStorageUsage(company.id);
          } catch (error) {
            strapi.log.error('Failed to update storage usage:', error);
          }
        };
      }

      // Add subscription info to context for controllers to use
      ctx.subscription = {
        status: company.subscription_status || 'trial',
        planLevel: company.plan_level || 'starter',
        storageUsed: company.storage_used_bytes || 0,
        storageLimit: company.storage_limit_bytes || 2147483648,
        companyId: company.id
      };

      await next();

      // Update storage usage after successful upload
      if (ctx.request.updateStorageUsage && ctx.response.status === 201) {
        await ctx.request.updateStorageUsage();
      }

    } catch (error) {
      strapi.log.error('Subscription guard error:', error);
      await next(); // Continue on error to avoid breaking the app
    }
  };
}; 
 
 
 
 
 