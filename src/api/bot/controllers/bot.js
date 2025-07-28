'use strict';

/**
 * bot controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::bot.bot', ({ strapi }) => ({
  async find(ctx) {
    // Get the authenticated user
    const user = ctx.state.user;
    
    if (!user) {
      return ctx.unauthorized('You must be logged in to view bots');
    }

    let company;

    // For API requests, the user is a users-permissions user
    if (user.company) {
      company = user.company;
    } else {
      // If company is not populated, fetch the user with company
      const userWithCompany = await strapi.documents('plugin::users-permissions.user').findOne({
        documentId: user.documentId,
        populate: ['company']
      });

      if (!userWithCompany?.company) {
        return ctx.badRequest('User must be associated with a company');
      }
      
      company = userWithCompany.company;
    }

    // Filter bots by company
    const existingFilters = ctx.query && ctx.query.filters ? ctx.query.filters : {};
    ctx.query = {
      ...(ctx.query || {}),
      filters: {
        ...existingFilters,
        company: {
          id: company.id
        }
      }
    };

    // Call the default find method with company filter
    const response = await super.find(ctx);
    return response;
  },

  async findOne(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in to view bots');
    }

    // Get the user's company
    const userWithCompany = await strapi.documents('plugin::users-permissions.user').findOne({
      documentId: user.documentId,
      populate: ['company']
    });

    if (!userWithCompany?.company) {
      return ctx.badRequest('User must be associated with a company');
    }

    // Find the bot and check if it belongs to the user's company
    const bot = await strapi.documents('api::bot.bot').findOne({
      documentId: id,
      populate: ['company']
    });

    if (!bot) {
      return ctx.notFound('Bot not found');
    }

    if (bot.company?.id !== userWithCompany.company.id) {
      return ctx.forbidden('You can only view bots from your company');
    }

    return bot;
  },

  async create(ctx) {
    // Get the authenticated user
    const user = ctx.state.user;
    
    if (!user) {
      return ctx.unauthorized('You must be logged in to create bots');
    }

    // Get the user's company
    const userWithCompany = await strapi.documents('plugin::users-permissions.user').findOne({
      documentId: user.documentId,
      populate: ['company']
    });

    if (!userWithCompany?.company) {
      return ctx.badRequest('User must be associated with a company');
    }

    // Add company to the bot data
    ctx.request.body.data = {
      ...ctx.request.body.data,
      company: userWithCompany.company.documentId,
      publishedAt: new Date() // Auto-publish
    };

    // Call the default create method
    const response = await super.create(ctx);
    return response;
  },

  async update(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in to update bots');
    }

    // Get the user's company
    const userWithCompany = await strapi.documents('plugin::users-permissions.user').findOne({
      documentId: user.documentId,
      populate: ['company']
    });

    if (!userWithCompany?.company) {
      return ctx.badRequest('User must be associated with a company');
    }

    // Check if the bot belongs to the user's company
    const bot = await strapi.documents('api::bot.bot').findOne({
      documentId: id,
      populate: ['company']
    });

    if (!bot) {
      return ctx.notFound('Bot not found');
    }

    if (bot.company?.id !== userWithCompany.company.id) {
      return ctx.forbidden('You can only update bots from your company');
    }

    // Ensure company cannot be changed
    if (ctx.request.body.data?.company) {
      delete ctx.request.body.data.company;
    }

    // Call the default controller
    const response = await super.update(ctx);
    return response;
  },

  async delete(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in to delete bots');
    }

    // Get the user's company
    const userWithCompany = await strapi.documents('plugin::users-permissions.user').findOne({
      documentId: user.documentId,
      populate: ['company']
    });

    if (!userWithCompany?.company) {
      return ctx.badRequest('User must be associated with a company');
    }

    // Check if the bot belongs to the user's company
    const bot = await strapi.documents('api::bot.bot').findOne({
      documentId: id,
      populate: ['company']
    });

    if (!bot) {
      return ctx.notFound('Bot not found');
    }

    if (bot.company?.id !== userWithCompany.company.id) {
      return ctx.forbidden('You can only delete bots from your company');
    }

    // Call the default controller
    const response = await super.delete(ctx);
    return response;
  }
}));
