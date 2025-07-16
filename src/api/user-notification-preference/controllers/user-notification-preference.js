'use strict';

/**
 * user-notification-preference controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::user-notification-preference.user-notification-preference', ({ strapi }) => ({
  
  // Get preferences for a specific user/company/bot combination
  async findByUser(ctx) {
    const { companyId, botId, userId } = ctx.params;
    
    if (!companyId || !botId || !userId) {
      return ctx.badRequest('companyId, botId, and userId are required');
    }
    
    const preferences = await strapi.documents('api::user-notification-preference.user-notification-preference').findFirst({
      filters: {
        company: { id: parseInt(companyId) },
        bot: { id: parseInt(botId) },
        user: { id: parseInt(userId) }
      }
    });
    
    // If no preferences exist, get user's email for defaults
    if (!preferences) {
      const userRecord = await strapi.documents('plugin::users-permissions.user').findOne({
        documentId: userId,
        fields: ['email']
      });
      
      if (!userRecord) {
        return ctx.badRequest('User not found');
      }
      
      // Return defaults with user's email
      ctx.send({
        data: {
          notification_enabled: true,
          batch_size_threshold: 5,
          notification_delay_minutes: 30,
          email_format: 'html',
          include_success_details: true,
          include_error_details: true,
          email: userRecord.email
        }
      });
    } else {
      // Return existing preferences
      ctx.send({ data: preferences });
    }
  },
  
  // Create or update preferences for a user
  async upsertForUser(ctx) {
    const { company, bot, user } = ctx.request.body;
    
    if (!company || !bot || !user) {
      return ctx.badRequest('company, bot, and user are required');
    }
    
    // Get user's email address
    const userRecord = await strapi.documents('plugin::users-permissions.user').findOne({
      documentId: user,
      fields: ['email']
    });
    
    if (!userRecord) {
      return ctx.badRequest('User not found');
    }
    
    // Prepare data with user's email
    const dataWithEmail = {
      ...ctx.request.body,
      email: userRecord.email
    };
    
    // Check if preferences already exist
    const existingPreferences = await strapi.documents('api::user-notification-preference.user-notification-preference').findFirst({
      filters: {
        company: { id: parseInt(company) },
        bot: { id: parseInt(bot) },
        user: { id: parseInt(user) }
      }
    });
    
    if (existingPreferences) {
      // Update existing preferences
      const updated = await strapi.documents('api::user-notification-preference.user-notification-preference').update({
        documentId: existingPreferences.documentId,
        data: dataWithEmail
      });
      return updated;
    } else {
      // Create new preferences
      const created = await strapi.documents('api::user-notification-preference.user-notification-preference').create({
        data: dataWithEmail
      });
      return created;
    }
  }
})); 