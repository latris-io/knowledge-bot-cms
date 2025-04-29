// src/middlewares/assign-user-bot-to-upload.js
'use strict';

const jwt = require('jsonwebtoken');

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    if (ctx.method !== 'POST' || ctx.url !== '/upload') {
      return await next();
    }

    console.log('🚀 Assign user/bot middleware triggered at:', new Date().toISOString());

    let user = null;

    // Extract and verify JWT token
    const authHeader = ctx.request.header.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const jwtSecret = strapi.config.get('admin.jwtSecret') || process.env.ADMIN_JWT_SECRET;
        if (!jwtSecret) {
          console.error('🔴 Missing JWT secret.');
          return ctx.throw(400, 'JWT secret not configured');
        }

        const decoded = jwt.verify(token, jwtSecret);
        if (decoded?.id) {
          user = await strapi.entityService.findOne(
            'plugin::users-permissions.user',
            decoded.id,
            { populate: ['bot'] }
          );
        }
      } catch (err) {
        console.error('🔴 JWT verification failed:', err.message);
        return ctx.throw(401, 'Invalid JWT token');
      }
    }

    if (!user?.id) {
      console.warn('⚠️ No authenticated user found.');
      return await next();
    }

    if (!user.bot?.id) {
      console.warn('⚠️ User has no bot assigned:', user);
      return await next();
    }

    console.log(`✅ Authenticated user ID ${user.id} assigned to bot ID ${user.bot.id}`);

    // Set user and bot in fileInfo
    let fileInfo = {};
    if (ctx.request.body.fileInfo) {
      try {
        fileInfo = typeof ctx.request.body.fileInfo === 'string'
          ? JSON.parse(ctx.request.body.fileInfo)
          : ctx.request.body.fileInfo;
      } catch (error) {
        console.error('🔴 Error parsing fileInfo:', error.message);
        return ctx.throw(400, 'Invalid fileInfo format');
      }
    }

    fileInfo.user = user.id;
    fileInfo.bot = user.bot.id;
    ctx.request.body.fileInfo = JSON.stringify(fileInfo);

    console.log('📝 fileInfo with user and bot:', fileInfo);

    // Proceed to upload
    await next();

    // After upload
    const { status, body } = ctx.response;
    if (status !== 201 || !body) {
      console.warn('⚠️ Upload did not succeed or response body missing:', { status, body });
      return;
    }

    const uploadedFile = Array.isArray(body) ? body[0] : body;

    if (!uploadedFile?.id) {
      console.error('🔴 Uploaded file missing ID:', uploadedFile);
      return;
    }

    try {
      // Update file with user and bot relations using ORM
      await strapi.entityService.update(
        'plugin::upload.file',
        uploadedFile.id,
        {
          data: {
            user: user.id,
            bot: user.bot.id,
          },
        }
      );
      console.log(`📝 File ID ${uploadedFile.id} updated with user ID ${user.id} and bot ID ${user.bot.id}`);

      // Verify update
      const updatedFile = await strapi.entityService.findOne(
        'plugin::upload.file',
        uploadedFile.id,
        { populate: ['user', 'bot'] }
      );
      console.log('✅ Verified file after update:', JSON.stringify(updatedFile, null, 2));
    } catch (err) {
      console.error('🔴 Failed to update file relations:', err.message, err.stack);
      return ctx.throw(500, 'Error updating file relations');
    }
  };
};