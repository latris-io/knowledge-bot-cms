'use strict';

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    if (ctx.method !== 'POST' || ctx.url !== '/upload') {
      return await next();
    }

    console.log('🚀 Assign user/bot/company middleware triggered at:', new Date().toISOString());

    let user = null;

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
            { populate: ['bot', 'company'] }
          );
        }
      } catch (err) {
        console.error('🔴 JWT verification failed:', err.message);
        return ctx.throw(401, 'Invalid JWT token');
      }
    }

    if (!user?.id || !user.bot?.id || !user.company?.id) {
      console.warn('⚠️ Missing user/bot/company info.');
      return await next();
    }

    console.log(`✅ Authenticated user ID ${user.id}, bot ID ${user.bot.id}, company ID ${user.company.id}`);

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

    // Set both relations and flattened IDs
    fileInfo.user = user.id;
    fileInfo.bot = user.bot.id;
    fileInfo.company = user.company.id;
    fileInfo.user_id = user.id;
    fileInfo.bot_id = user.bot.id;
    fileInfo.company_id = user.company.id;

    ctx.request.body.fileInfo = JSON.stringify(fileInfo);
    console.log('📝 fileInfo with flattened fields:', fileInfo);

    await next();

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
      const freshFile = await strapi.entityService.findOne(
        'plugin::upload.file',
        uploadedFile.id,
        { populate: ['user', 'bot', 'company'] }
      );

      const extraUpdateData = {
        user: user.id,
        bot: user.bot.id,
        company: user.company.id,
        user_id: user.id,
        bot_id: user.bot.id,
        company_id: user.company.id,
        source_type: 'manual_upload',
        storage_key: `${freshFile.hash}${freshFile.ext}`,
        document_uid: freshFile.document_uid || uuidv4(),
      };

      if (freshFile.mime?.startsWith('audio/') || freshFile.mime?.startsWith('video/')) {
        extraUpdateData.transcription_status = 'pending';
      }

      if (freshFile.folderPath) {
        extraUpdateData.folderPath = freshFile.folderPath.replace(/\/+/g, '/');
      }

      await strapi.entityService.update(
        'plugin::upload.file',
        uploadedFile.id,
        { data: extraUpdateData }
      );

      console.log('✅ File metadata updated successfully:', JSON.stringify(extraUpdateData, null, 2));
    } catch (err) {
      console.error('🔴 Failed to update file metadata:', err.message);
      return ctx.throw(500, 'Error updating file metadata');
    }
  };
};


