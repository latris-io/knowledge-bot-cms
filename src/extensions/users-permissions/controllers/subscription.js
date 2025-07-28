'use strict';

/**
 * Subscription controller for validation and management
 * Extends users-permissions plugin with subscription validation
 */

// In-memory cache for subscription validations
const subscriptionCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

console.log('🚀 Subscription controller loading...');

module.exports = ({ strapi }) => ({
  /**
   * Daily subscription validation with caching
   * This replaces thousands of API calls with cached responses
   */
  async validateDaily(ctx) {
    try {
      console.log('📊 validateDaily called');
      const { companyId, botId } = ctx.request.body;
      
      if (!companyId || !botId) {
        return ctx.badRequest('Company ID and Bot ID are required');
      }

      // Check cache first
      const cacheKey = `${companyId}-${botId}`;
      const cached = subscriptionCache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        strapi.log.debug(`Subscription cache HIT for ${cacheKey}`);
        return ctx.send({
          ...cached.data,
          cached: true,
          cacheAge: Date.now() - cached.timestamp
        });
      }

      strapi.log.debug(`Subscription cache MISS for ${cacheKey}`);

      // Get company with subscription data
      const company = await strapi.entityService.findOne('api::company.company', companyId, {
        populate: ['users']
      });

      if (!company) {
        return ctx.notFound('Company not found');
      }

      // Validate subscription
      const validation = {
        companyId: parseInt(companyId),
        botId: parseInt(botId),
        isValid: true,
        subscriptionStatus: company.subscription_status || 'trial',
        planLevel: company.plan_level || 'starter',
        storageUsed: company.storage_used_bytes || 0,
        storageLimit: company.storage_limit_bytes || 2147483648,
        features: {
          aiChat: true,
          fileUpload: true,
          userManagement: true,
          customDomains: company.plan_level !== 'starter'
        },
        timestamp: new Date().toISOString()
      };

      // Check storage limits
      if (validation.storageUsed >= validation.storageLimit) {
        validation.isValid = false;
        validation.reason = 'Storage limit exceeded';
      }

      // Check subscription status
      if (company.subscription_status === 'canceled' || company.subscription_status === 'past_due') {
        validation.isValid = false;
        validation.reason = 'Subscription inactive';
      }

      // Cache the result
      subscriptionCache.set(cacheKey, {
        data: validation,
        timestamp: Date.now()
      });

      return ctx.send(validation);
    } catch (error) {
      strapi.log.error('Subscription validation error:', error);
      return ctx.internalServerError('Failed to validate subscription');
    }
  },

  /**
   * Batch validation for multiple company/bot pairs
   */
  async validateBatch(ctx) {
    try {
      const { validations } = ctx.request.body;
      
      if (!Array.isArray(validations)) {
        return ctx.badRequest('Validations array is required');
      }

      const results = await Promise.all(
        validations.map(async ({ companyId, botId }) => {
          // Use the same validation logic as single validation
          const mockCtx = {
            request: { body: { companyId, botId } },
            send: (data) => data,
            badRequest: (msg) => ({ error: msg }),
            notFound: (msg) => ({ error: msg }),
            internalServerError: (msg) => ({ error: msg })
          };
          
          return await this.validateDaily(mockCtx);
        })
      );

      return ctx.send({ validations: results });
    } catch (error) {
      strapi.log.error('Batch validation error:', error);
      return ctx.internalServerError('Failed to validate subscriptions');
    }
  },

  /**
   * Get subscription cache statistics
   */
  async getCacheStats(ctx) {
    try {
      console.log('📊 getCacheStats called');
      const stats = {
        cacheSize: subscriptionCache.size,
        cacheKeys: Array.from(subscriptionCache.keys()),
        cacheAges: Array.from(subscriptionCache.values()).map(entry => ({
          age: Date.now() - entry.timestamp,
          valid: (Date.now() - entry.timestamp) < CACHE_TTL
        }))
      };

      return ctx.send(stats);
    } catch (error) {
      strapi.log.error('Cache stats error:', error);
      return ctx.internalServerError('Failed to get cache stats');
    }
  },

  /**
   * Clear subscription cache
   */
  async clearCache(ctx) {
    try {
      const { companyId, botId } = ctx.request.body;
      
      if (companyId && botId) {
        // Clear specific cache entry
        const cacheKey = `${companyId}-${botId}`;
        subscriptionCache.delete(cacheKey);
        return ctx.send({ message: `Cache cleared for ${cacheKey}` });
      } else {
        // Clear entire cache
        subscriptionCache.clear();
        return ctx.send({ message: 'Entire cache cleared' });
      }
    } catch (error) {
      strapi.log.error('Cache clear error:', error);
      return ctx.internalServerError('Failed to clear cache');
    }
  },

  /**
   * Get dashboard usage data for admin widget
   */
  async getDashboardUsage(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) {
        return ctx.unauthorized('Authentication required');
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

      // Get plan limits based on current plan level
      const planLimits = this.getPlanLimits(company.plan_level || 'starter');

      // Calculate real-time storage usage
      try {
        await strapi
          .plugin('users-permissions')
          .service('subscription')
          .calculateStorageUsage(company.id);
      } catch (storageError) {
        strapi.log.warn('Storage calculation failed, using cached value:', storageError);
      }

      // Refresh company data after storage calculation
      const updatedCompany = await strapi.entityService.findOne(
        'api::company.company',
        company.id,
        { populate: ['users'] }
      );

      // Prepare dashboard data
      const dashboardData = {
        companyId: updatedCompany.id,
        companyName: updatedCompany.name,
        subscriptionStatus: updatedCompany.subscription_status || 'trial',
        planLevel: updatedCompany.plan_level || 'starter',
        storageUsed: updatedCompany.storage_used_bytes || 0,
        storageLimit: updatedCompany.storage_limit_bytes || planLimits.storageLimit,
        planLimits: {
          storageLimit: planLimits.storageLimit,
          features: planLimits.features
        },
        nextBillingDate: updatedCompany.current_period_end,
        lastUpdated: new Date().toISOString(),
        usagePercentages: {
          storage: ((updatedCompany.storage_used_bytes || 0) / (updatedCompany.storage_limit_bytes || planLimits.storageLimit)) * 100
        },
        upgradeUrl: this.getUpgradeUrl(updatedCompany.plan_level)
      };

      // Cache for 60 seconds
      ctx.set('Cache-Control', 'public, max-age=60');
      
      return ctx.send({ data: dashboardData });
    } catch (error) {
      strapi.log.error('Dashboard usage error:', error);
      return ctx.internalServerError('Failed to get dashboard data');
    }
  },

  /**
   * Get usage report for company (CSV format)
   */
  async getUsageReport(ctx) {
    try {
      const user = ctx.state.user;
      const { companyId, format = 'csv' } = ctx.query;

      if (!user) {
        return ctx.unauthorized('Authentication required');
      }

      // Get user with company data
      const userWithCompany = await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        user.id,
        { populate: ['company'] }
      );

      if (!userWithCompany?.company) {
        return ctx.badRequest('User must be assigned to a company');
      }

      const company = userWithCompany.company;
      const targetCompanyId = companyId ? parseInt(companyId) : company.id;

      // Verify user can access this company data
      if (targetCompanyId !== company.id) {
        return ctx.forbidden('Access denied');
      }

      // Get comprehensive company data
      const companyData = await strapi.entityService.findOne(
        'api::company.company',
        targetCompanyId,
        { 
          populate: ['users', 'bots'] 
        }
      );

      if (!companyData) {
        return ctx.notFound('Company not found');
      }

      // Get file statistics
      const files = await strapi.entityService.findMany('plugin::upload.file', {
        filters: {
          company: { id: targetCompanyId }
        },
        populate: ['company', 'createdBy']
      });

      // Generate report data
      const reportData = {
        company: {
          id: companyData.id,
          name: companyData.name,
          createdAt: companyData.createdAt
        },
        subscription: {
          status: companyData.subscription_status || 'trial',
          planLevel: companyData.plan_level || 'starter',
          currentPeriodStart: companyData.current_period_start,
          currentPeriodEnd: companyData.current_period_end
        },
        usage: {
          storageUsed: companyData.storage_used_bytes || 0,
          storageLimit: companyData.storage_limit_bytes || 2147483648,
          userCount: companyData.users?.length || 0,
          fileCount: files.length,
          averageFileSize: files.length > 0 ? Math.round(files.reduce((sum, file) => sum + (file.size || 0), 0) / files.length) : 0
        },
        files: files.map(file => ({
          id: file.id,
          name: file.name,
          size: file.size,
          mimeType: file.mime,
          uploadedAt: file.createdAt,
          uploadedBy: file.createdBy?.username || 'Unknown'
        }))
      };

      if (format === 'csv') {
        // Generate CSV format
        let csvContent = '';
        
        // Company overview
        csvContent += 'Company Report\n';
        csvContent += `Company ID,${reportData.company.id}\n`;
        csvContent += `Company Name,${reportData.company.name}\n`;
        csvContent += `Created At,${reportData.company.createdAt}\n`;
        csvContent += `Subscription Status,${reportData.subscription.status}\n`;
        csvContent += `Plan Level,${reportData.subscription.planLevel}\n`;
        csvContent += `Storage Used (bytes),${reportData.usage.storageUsed}\n`;
        csvContent += `Storage Limit (bytes),${reportData.usage.storageLimit}\n`;
        csvContent += `User Count,${reportData.usage.userCount}\n`;
        csvContent += `File Count,${reportData.usage.fileCount}\n`;
        csvContent += `Average File Size (bytes),${reportData.usage.averageFileSize}\n`;
        csvContent += '\n';
        
        // Files detail
        csvContent += 'Files Detail\n';
        csvContent += 'File ID,File Name,Size (bytes),MIME Type,Uploaded At,Uploaded By\n';
        reportData.files.forEach(file => {
          csvContent += `${file.id},"${file.name}",${file.size},${file.mimeType},${file.uploadedAt},"${file.uploadedBy}"\n`;
        });

        ctx.set('Content-Type', 'text/csv');
        ctx.set('Content-Disposition', `attachment; filename="usage-report-${targetCompanyId}-${new Date().toISOString().split('T')[0]}.csv"`);
        
        return ctx.send(csvContent);
      } else {
        // Return JSON format
        return ctx.send({ data: reportData });
      }

    } catch (error) {
      strapi.log.error('Usage report error:', error);
      return ctx.internalServerError('Failed to generate usage report');
    }
  },

  /**
   * Get plan limits for dashboard display
   */
  getPlanLimits(planLevel) {
    const limits = {
      starter: {
        storageLimit: 2 * 1024 * 1024 * 1024, // 2GB
        features: ['Basic Support', 'File Upload', 'AI Chat']
      },
      professional: {
        storageLimit: 20 * 1024 * 1024 * 1024, // 20GB
        features: ['Priority Support', 'Advanced Analytics', 'Custom Domains', 'File Upload', 'AI Chat']
      },
      enterprise: {
        storageLimit: 100 * 1024 * 1024 * 1024, // 100GB
        features: ['24/7 Support', 'Advanced Analytics', 'Custom Domains', 'API Access', 'File Upload', 'AI Chat']
      }
    };

    return limits[planLevel] || limits.starter;
  },

  /**
   * Get upgrade URL based on current plan
   */
  getUpgradeUrl(currentPlan) {
    const upgradeUrls = {
      starter: '/billing/checkout?plan=professional',
      professional: '/billing/checkout?plan=enterprise',
      enterprise: null // Already highest plan
    };

    return upgradeUrls[currentPlan] || upgradeUrls.starter;
  }
}); 
 
 
 
 