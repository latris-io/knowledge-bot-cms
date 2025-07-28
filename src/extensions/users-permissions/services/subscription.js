'use strict';

/**
 * Subscription service for validation and cache management
 * Extends users-permissions plugin with subscription services
 */

module.exports = ({ strapi }) => ({
  /**
   * Validate user subscription access
   */
  async validateAccess(userId, companyId, botId) {
    try {
      // Get user with company and bot relationships
      const user = await strapi.entityService.findOne('plugin::users-permissions.user', userId, {
        populate: ['company', 'bot']
      });

      if (!user) {
        return { isValid: false, reason: 'User not found' };
      }

      // Check if user belongs to the company
      if (!user.company || user.company.id !== parseInt(companyId)) {
        return { isValid: false, reason: 'User does not belong to company' };
      }

      // Check if user has access to the bot
      if (!user.bot || user.bot.id !== parseInt(botId)) {
        return { isValid: false, reason: 'User does not have access to bot' };
      }

      // Get company subscription status
      const company = await strapi.entityService.findOne('api::company.company', companyId, {
        populate: ['users']
      });

      if (!company) {
        return { isValid: false, reason: 'Company not found' };
      }

      // Check subscription status
      const subscription = {
        status: company.subscription_status || 'trial',
        planLevel: company.plan_level || 'starter',
        storageUsed: company.storage_used_bytes || 0,
        storageLimit: company.storage_limit_bytes || 2147483648,
        userCount: company.users?.length || 0
      };

      // Validate subscription
      if (subscription.status === 'canceled' || subscription.status === 'past_due') {
        return { isValid: false, reason: 'Subscription inactive', subscription };
      }

      // Check storage limits
      if (subscription.storageUsed >= subscription.storageLimit) {
        return { isValid: false, reason: 'Storage limit exceeded', subscription };
      }

      return { 
        isValid: true, 
        subscription,
        user: {
          id: user.id,
          companyId: company.id,
          botId: user.bot.id
        }
      };
    } catch (error) {
      strapi.log.error('Access validation error:', error);
      return { isValid: false, reason: 'Validation error' };
    }
  },

  /**
   * Check storage limits for upload
   */
  async checkStorageLimit(companyId, fileSize) {
    try {
      const company = await strapi.entityService.findOne('api::company.company', companyId);
      
      if (!company) {
        return { allowed: false, reason: 'Company not found' };
      }

      const currentUsage = company.storage_used_bytes || 0;
      const limit = company.storage_limit_bytes || 2147483648; // 2GB default
      const newUsage = currentUsage + fileSize;

      if (newUsage > limit) {
        return {
          allowed: false,
          reason: 'Storage limit exceeded',
          currentUsage,
          limit,
          fileSize,
          wouldExceedBy: newUsage - limit
        };
      }

      return {
        allowed: true,
        currentUsage,
        limit,
        fileSize,
        newUsage,
        remainingSpace: limit - newUsage
      };
    } catch (error) {
      strapi.log.error('Storage limit check error:', error);
      return { allowed: false, reason: 'Check failed' };
    }
  },

  /**
   * Get subscription features for plan level
   */
  getFeatures(planLevel) {
    const features = {
      starter: {
        aiChat: true,
        fileUpload: true,
        userManagement: true,
        maxUsers: 5,
        storageLimit: 2 * 1024 * 1024 * 1024, // 2GB
        customDomains: false,
        advancedAnalytics: false,
        prioritySupport: false
      },
      professional: {
        aiChat: true,
        fileUpload: true,
        userManagement: true,
        maxUsers: 25,
        storageLimit: 20 * 1024 * 1024 * 1024, // 20GB
        customDomains: true,
        advancedAnalytics: true,
        prioritySupport: false
      },
      enterprise: {
        aiChat: true,
        fileUpload: true,
        userManagement: true,
        maxUsers: -1, // Unlimited
        storageLimit: 100 * 1024 * 1024 * 1024, // 100GB
        customDomains: true,
        advancedAnalytics: true,
        prioritySupport: true
      }
    };

    return features[planLevel] || features.starter;
  },

  /**
   * Calculate storage usage for company
   */
  async calculateStorageUsage(companyId) {
    try {
      // Get all files for the company
      const files = await strapi.entityService.findMany('plugin::upload.file', {
        filters: { company: companyId },
        fields: ['size']
      });

      const totalBytes = files.reduce((sum, file) => sum + (file.size || 0), 0);

      // Update company storage usage
      await strapi.entityService.update('api::company.company', companyId, {
        data: {
          storage_used_bytes: totalBytes,
          storage_updated_at: new Date()
        }
      });

      strapi.log.debug(`Calculated storage usage for company ${companyId}: ${totalBytes} bytes`);
      
      return { totalBytes, fileCount: files.length };
    } catch (error) {
      strapi.log.error('Storage calculation error:', error);
      throw error;
    }
  },

  /**
   * Get subscription analytics
   */
  async getAnalytics(companyId, period = '30d') {
    try {
      const company = await strapi.entityService.findOne('api::company.company', companyId, {
        populate: ['users', 'files']
      });

      if (!company) {
        throw new Error('Company not found');
      }

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      // Get files uploaded in period
      const recentFiles = await strapi.entityService.findMany('plugin::upload.file', {
        filters: {
          company: companyId,
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        },
        fields: ['size', 'createdAt', 'ext']
      });

      // Calculate analytics
      const analytics = {
        period,
        startDate,
        endDate,
        subscription: {
          status: company.subscription_status || 'trial',
          planLevel: company.plan_level || 'starter',
          storageUsed: company.storage_used_bytes || 0,
          storageLimit: company.storage_limit_bytes || 2147483648,
          userCount: company.users?.length || 0
        },
        usage: {
          filesUploaded: recentFiles.length,
          bytesUploaded: recentFiles.reduce((sum, file) => sum + (file.size || 0), 0),
          avgFileSize: recentFiles.length > 0 ? 
            recentFiles.reduce((sum, file) => sum + (file.size || 0), 0) / recentFiles.length : 0
        },
        fileTypes: this.analyzeFileTypes(recentFiles)
      };

      return analytics;
    } catch (error) {
      strapi.log.error('Analytics calculation error:', error);
      throw error;
    }
  },

  /**
   * Analyze file types from file list
   */
  analyzeFileTypes(files) {
    const typeCount = {};
    const typeSize = {};

    files.forEach(file => {
      const ext = file.ext || 'unknown';
      typeCount[ext] = (typeCount[ext] || 0) + 1;
      typeSize[ext] = (typeSize[ext] || 0) + (file.size || 0);
    });

    return Object.keys(typeCount).map(ext => ({
      extension: ext,
      count: typeCount[ext],
      totalSize: typeSize[ext],
      avgSize: typeSize[ext] / typeCount[ext]
    })).sort((a, b) => b.count - a.count);
  }
}); 
 
 
 
 
 