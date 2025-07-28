'use strict';

module.exports = {
  async getContentType(ctx) {
    try {
      const contentType = strapi.contentTypes['plugin::upload.file'];
      return contentType;
    } catch (error) {
      ctx.throw(500, error.message);
    }
  },
  
  async testBotLifecycle(ctx) {
    try {
      console.log('🧪 [DEBUG] Testing bot lifecycle...');
      
      // Create a test bot
      const testBot = await strapi.documents('api::bot.bot').create({
        data: {
          name: 'Lifecycle Test Bot',
          bot_id: 'lifecycle-test-bot',
          description: 'Testing if lifecycle is triggered',
          company: 39, // Using the existing company ID
          processing_enabled: true,
          auto_correction_enabled: false,
          max_retry_attempts: 3,
          retry_delay_minutes: 5,
          publishedAt: new Date()
        }
      });
      
      console.log('🧪 [DEBUG] Test bot created:', testBot);
      console.log('🧪 [DEBUG] JWT token:', testBot.jwt_token ? 'SET' : 'NOT SET');
      
      return {
        success: true,
        bot: testBot,
        jwtTokenSet: !!testBot.jwt_token
      };
    } catch (error) {
      console.error('🧪 [DEBUG] Error creating test bot:', error);
      ctx.throw(500, error.message);
    }
  }
};