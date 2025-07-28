'use strict';

/**
 * Bot Management Controller
 * Handles bot CRUD operations for the current user's company
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::bot.bot', ({ strapi }) => ({
  /**
   * Helper function to authenticate user from admin panel or API
   */
  async authenticateUser(ctx) {
    let user = ctx.state.user;
    let userWithCompany;
    
    console.log('🔍 Authenticating user - ctx.state.user:', !!user);
    console.log('🔍 Authorization header:', !!ctx.request.header.authorization);
    
    // If no user in context (admin panel), try to get from authorization header
    if (!user && ctx.request.header.authorization) {
      try {
        const token = ctx.request.header.authorization.replace('Bearer ', '');
        console.log('🔑 Attempting admin token verification...');
        
        // Try to verify the token using JWT directly
        const jwt = require('jsonwebtoken');
        const adminJwtSecret = strapi.config.get('admin.auth.secret');
        
        if (!adminJwtSecret) {
          console.error('❌ Admin JWT secret not configured');
          throw new Error('Admin JWT secret not configured');
        }
        
        let adminDecoded;
        try {
          adminDecoded = jwt.verify(token, adminJwtSecret);
          console.log('✅ JWT verification successful:', !!adminDecoded, adminDecoded?.id);
        } catch (jwtError) {
          console.log('❌ JWT verification failed:', jwtError.message);
          throw jwtError;
        }
        
        if (adminDecoded && adminDecoded.id) {
          // Get admin user
          const adminUser = await strapi.admin.services.user.findOne(adminDecoded.id);
          if (adminUser) {
            console.log('✅ Admin user authenticated:', adminUser.email);
            
            // For admin users, find the associated users-permissions user by email
            const usersPermissionsUser = await strapi.documents('plugin::users-permissions.user').findMany({
              filters: {
                email: adminUser.email
              },
              populate: ['company']
            });

            if (usersPermissionsUser && usersPermissionsUser.length > 0) {
              userWithCompany = usersPermissionsUser[0];
              console.log('✅ Found users-permissions user with company:', !!userWithCompany.company);
            } else {
              console.log('❌ No users-permissions user found for admin email:', adminUser.email);
            }
          }
        }
      } catch (error) {
        console.error('❌ Token verification error:', error.message);
        // Don't return null here, continue to check other auth methods
      }
    }
    
    // If still no user, check if it's a regular API user
    if (!userWithCompany && user) {
      console.log('🔍 Checking regular API user...');
      userWithCompany = await strapi.documents('plugin::users-permissions.user').findOne({
        documentId: user.documentId,
        populate: ['company']
      });
      console.log('✅ Regular API user found with company:', !!userWithCompany?.company);
    }
    
    return userWithCompany;
  },
  /**
   * Get all bots for the current user's company
   */
  async list(ctx) {
    try {
      // Authenticate user
      const userWithCompany = await this.authenticateUser(ctx);
      
      if (!userWithCompany) {
        return ctx.unauthorized('Authentication required');
      }

      if (!userWithCompany?.company) {
        return ctx.badRequest('User must be assigned to a company');
      }

      const company = userWithCompany.company;
      const companyId = company.id;

      // Fetch bots for the company
      const bots = await strapi.documents('api::bot.bot').findMany({
        filters: {
          company: {
            id: companyId
          }
        },
        populate: ['company']
      });

      return {
        data: bots || []
      };
    } catch (error) {
      console.error('Error listing bots:', error);
      return ctx.internalServerError('Failed to list bots');
    }
  },

  /**
   * Create a new bot for the current user's company
   */
  async create(ctx) {
    try {
      // Authenticate user (handles both admin and regular users)
      const authResult = await this.authenticateUser(ctx);
      if (!authResult) {
        return ctx.unauthorized('Authentication required');
      }

      const { user: userWithCompany, company } = authResult;
      const { data } = ctx.request.body;

      console.log('🚀 [BOT-MANAGEMENT] Creating bot with data:', {
        data,
        companyId: company.id,
        companyDocumentId: company.documentId
      });

      console.log('📝 [BOT-MANAGEMENT] About to call strapi.documents().create...');
      
      // Create bot with company association using company ID for lifecycle hooks
      const bot = await strapi.documents('api::bot.bot').create({
        data: {
          ...data,
          company: company.id, // Use ID instead of documentId for lifecycle hooks
          publishedAt: new Date()
        }
      });

      console.log('✅ [BOT-MANAGEMENT] Bot created:', bot);
      console.log('🔍 [BOT-MANAGEMENT] Bot JWT token:', bot.jwt_token ? 'SET' : 'NOT SET');

      return {
        data: bot
      };
    } catch (error) {
      console.error('Error creating bot:', error);
      return ctx.internalServerError('Failed to create bot');
    }
  },

  /**
   * Update an existing bot
   */
  async update(ctx) {
    try {
      // Authenticate user (handles both admin and regular users)
      const authResult = await this.authenticateUser(ctx);
      if (!authResult) {
        return ctx.unauthorized('Authentication required');
      }
      
      const { user: userWithCompany, company } = authResult;
      const companyId = company.id;

      const { id } = ctx.params;
      const { data } = ctx.request.body;

      // Check if bot belongs to user's company
      const existingBot = await strapi.documents('api::bot.bot').findOne({
        documentId: id,
        populate: ['company']
      });

      if (!existingBot) {
        return ctx.notFound('Bot not found');
      }

      if (existingBot.company?.id !== companyId) {
        return ctx.forbidden('You can only update bots from your company');
      }

      // Update bot
      const bot = await strapi.documents('api::bot.bot').update({
        documentId: id,
        data: data
      });

      return {
        data: bot
      };
    } catch (error) {
      console.error('Error updating bot:', error);
      return ctx.internalServerError('Failed to update bot');
    }
  },

  /**
   * Delete a bot
   */
  async delete(ctx) {
    try {
      const { id } = ctx.params;
      
      // Authenticate user
      const userWithCompany = await this.authenticateUser(ctx);
      
      if (!userWithCompany) {
        return ctx.unauthorized('Authentication required');
      }

      if (!userWithCompany?.company) {
        return ctx.badRequest('User must be assigned to a company');
      }

      // Get the bot to check ownership
      const bot = await strapi.documents('api::bot.bot').findOne({
        documentId: id,
        populate: ['company']
      });

      if (!bot) {
        return ctx.notFound('Bot not found');
      }

      // Check if bot belongs to user's company
      if (bot.company?.id !== userWithCompany.company.id) {
        return ctx.forbidden('You can only delete bots from your own company');
      }

      // Try to delete the bot
      await strapi.documents('api::bot.bot').delete({
        documentId: id
      });

      return ctx.send({ 
          message: 'Bot deleted successfully'
      });
    } catch (error) {
      console.error('Bot deletion error:', error);
      
      // Check if it's a validation error from the lifecycle hook
      if (error.name === 'ValidationError' || error.message.includes('Cannot delete bot')) {
        // Return a user-friendly error message
        return ctx.badRequest(error.message);
      }
      
      return ctx.internalServerError('Failed to delete bot');
    }
  },

  /**
   * Get details for a specific bot
   */
  async findOne(ctx) {
    try {
      // Authenticate user (handles both admin and regular users)
      const authResult = await this.authenticateUser(ctx);
      if (!authResult) {
        return ctx.unauthorized('Authentication required');
      }

      const { user: userWithCompany, company } = authResult;
      const companyId = company.id;

      const { id } = ctx.params;

      // Get the bot with full details
      const bot = await strapi.documents('api::bot.bot').findOne({ 
        documentId: id,
        populate: {
          files: true
        }
      });
      
      if (!bot) {
        return ctx.notFound('Bot not found');
      }

      // TODO: Add company ownership check when we update bot schema

      // Add stats
      const botWithStats = {
        ...bot,
        file_count: bot.files?.length || 0,
        total_file_size: bot.files?.reduce((sum, file) => sum + (file.size || 0), 0) || 0
      };

      return ctx.send({ data: botWithStats });
    } catch (error) {
      console.error('Bot details error:', error);
      return ctx.internalServerError('Failed to fetch bot details');
    }
  },

  async getUploadBots(ctx) {
    try {
      const authResult = await this.authenticateUser(ctx);
      
      if (!authResult) {
        return ctx.unauthorized('Authentication required');
      }
      
      const { user: userWithCompany, company } = authResult;
      
      if (!company) {
        return ctx.badRequest('User has no associated company');
      }
      
      // Get all active bots for the user's company
      const bots = await strapi.documents('api::bot.bot').findMany({
        filters: {
          company: company.id,
          publishedAt: { $notNull: true }
        },
        fields: ['id', 'name', 'bot_id', 'documentId'],
        sort: { name: 'asc' }
      });
      
      // Format for easy selection in upload UI
      const formattedBots = bots.map(bot => ({
        id: bot.id,
        documentId: bot.documentId,
        name: bot.name,
        bot_id: bot.bot_id,
        folderPath: `/bots/${bot.bot_id}`
      }));
      
      return ctx.send({
        data: formattedBots,
        meta: {
          total: formattedBots.length
        }
      });
    } catch (error) {
      console.error('Error fetching upload bots:', error);
      ctx.throw(500, error.message);
    }
  }
})); 