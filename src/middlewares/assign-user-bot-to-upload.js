'use strict';

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

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

    // Set user and bot in fileInfo pre-upload
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

    // Proceed with upload
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
      console.log(`🔎 Fetching fresh file metadata for ID ${uploadedFile.id}`);

      // Fetch full file details from the database
      const freshFile = await strapi.entityService.findOne(
        'plugin::upload.file',
        uploadedFile.id,
        { populate: ['user', 'bot'] }
      );

      if (!freshFile?.hash || !freshFile?.ext) {
        console.error('🔴 Missing file metadata: hash or ext not populated.');
        return ctx.throw(500, 'File metadata incomplete after upload.');
      }

      const extraUpdateData = {
        user: user.id,
        bot: user.bot.id,
        source_type: 'manual_upload',
        storage_key: `${freshFile.hash}${freshFile.ext}`,
        document_uid: freshFile.document_uid || uuidv4(),
      };

      const mime = freshFile.mime || '';
      if (mime.startsWith('audio/') || mime.startsWith('video/')) {
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
      console.error('🔴 Failed to update file metadata:', err.message, err.stack);
      return ctx.throw(500, 'Error updating file metadata');
    }
  };
};
