'use strict';

console.log('🤖 [BOT API] index.js loading...');

/**
 * Bot API registration
 */
module.exports = {
  /**
   * Register phase
   */
  register({ strapi }) {
    console.log('🤖 [BOT API] Registering bot API...');
    // Register lifecycles for the bot content type
    const botContentType = strapi.contentTypes['api::bot.bot'];
    if (botContentType) {
      console.log('🤖 [BOT API] Found bot content type, registering lifecycles...');
      botContentType.lifecycles = require('./content-types/bot/lifecycles');
      console.log('✅ [BOT API] Bot lifecycles registered successfully!');
    } else {
      console.error('❌ [BOT API] Bot content type not found!');
    }
  },

  /**
   * Bootstrap phase
   */
  bootstrap({ strapi }) {
    console.log('🤖 [BOT API] Bot API bootstrapped');
  }
}; 