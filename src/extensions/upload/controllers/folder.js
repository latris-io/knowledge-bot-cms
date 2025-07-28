'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('plugin::upload.folder', ({ strapi }) => ({
  // Removed find method - filtering is handled by middleware
  
  async findOne(ctx) {
    console.log('📁 [FOLDER CONTROLLER] FindOne method called');
    console.log('   ID:', ctx.params.id);
    
    // Get the authenticated user
    let user = ctx.state.user;
    
    if (!user && ctx.state.admin) {
      // For admin users, find the corresponding users-permissions user
      const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
        filters: { email: ctx.state.admin.email },
        limit: 1,
        populate: ['company']
      });
      user = users[0];
    } else if (user) {
      // Reload user to get company
      const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
        filters: { documentId: user.documentId },
        limit: 1,
        populate: ['company']
      });
      if (users && users.length > 0) {
        user = users[0];
      }
    }
    
    // First get the folder to check if user has access
    const folder = await strapi.entityService.findOne('plugin::upload.folder', ctx.params.id, {
      populate: ['company']
    });
    
    if (!folder) {
      return ctx.notFound();
    }
    
    // Check if user has access to this folder
    if (user && user.company) {
      const companyId = user.company.id || user.company;
      
      // Get all bots for this company
      const companyBots = await strapi.entityService.findMany('api::bot.bot', {
        filters: { company: companyId },
        fields: ['id']
      });
      const botIds = companyBots.map(bot => bot.id);
      
      // Check if folder belongs to user's company
      const hasAccess = 
        folder.company?.id === companyId || // Explicit company match
        botIds.some(id => folder.path === `/bot-${id}`) || // Bot folder match
        (folder.path === '/' && !folder.company); // Root folder with no company
      
      if (!hasAccess) {
        console.log(`📁 [FOLDER CONTROLLER] Access denied for folder ${folder.id}`);
        return ctx.forbidden();
      }
    }
    
    // Call the default findOne method
    return super.findOne(ctx);
  }
})); 