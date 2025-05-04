'use strict';

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    // Check if request is a POST to /upload or /upload?id=..., but exclude /upload/actions/*
    if (
      ctx.method !== 'POST' ||
      !ctx.url.startsWith('/upload') ||
      ctx.url.startsWith('/upload/actions')
    ) {
      console.log('🔵 Skipping middleware: Not a POST to /upload or is /upload/actions/*', {
        method: ctx.method,
        url: ctx.url,
      });
      return await next();
    }

    console.log('🚀 File upload middleware triggered at:', new Date().toISOString());
    console.log('🔍 Request URL:', ctx.url);
    console.log('🔍 Query params:', ctx.query);
    console.log('🔍 Request body:', ctx.request.body);

    // Detect replacement action (e.g., POST /upload?id=5)
    const isReplacement = !!ctx.query.id || ctx.request.body.ref || ctx.request.body.refId || ctx.request.body.field;
    const eventType = isReplacement ? 'updated' : 'created';
    console.log('📌 Event type:', eventType, '(isReplacement:', isReplacement, ', query.id:', ctx.query.id, ')');

    // Authenticate user (for file metadata updates)
    let user = null;
    const authHeader = ctx.request.header.authorization;
    console.log('🔍 Authorization header:', authHeader ? 'Present' : 'Missing');

    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const jwtSecret = strapi.config.get('admin.jwtSecret') || process.env.ADMIN_JWT_SECRET;
        if (!jwtSecret) {
          console.error('🔴 Missing JWT secret');
          return ctx.throw(400, 'JWT secret not configured');
        }

        const decoded = jwt.verify(token, jwtSecret);
        if (decoded?.id) {
          user = await strapi.entityService.findOne(
            'plugin::users-permissions.user',
            decoded.id,
            { populate: ['bot', 'company'] }
          );
          console.log('✅ Found user:', user ? { id: user.id, bot: user.bot?.id, company: user.company?.id } : 'null');
        }
      } catch (err) {
        console.error('🔴 JWT verification failed:', err.message, err.stack);
        // Continue to allow file-events logging
      }
    }

    // Parse fileInfo
    let fileInfo = {};
    if (ctx.request.body.fileInfo) {
      try {
        fileInfo = typeof ctx.request.body.fileInfo === 'string'
          ? JSON.parse(ctx.request.body.fileInfo)
          : ctx.request.body.fileInfo;
        console.log('📝 Parsed fileInfo:', fileInfo);
      } catch (error) {
        console.error('🔴 Error parsing fileInfo:', error.message, error.stack);
        // Continue to allow file-events logging
      }
    }

    // Add user data to fileInfo if available
    if (user) {
      fileInfo.user = user.id;
      fileInfo.bot = user.bot?.id;
      fileInfo.company = user.company?.id;
      fileInfo.user_id = user.id;
      fileInfo.bot_id = user.bot?.id;
      fileInfo.company_id = user.company?.id;
      ctx.request.body.fileInfo = JSON.stringify(fileInfo);
      console.log('📝 Updated fileInfo with user data:', fileInfo);
    } else {
      console.log('⚠️ No user data added to fileInfo');
    }

    await next();

    // Check response
    const { status, body } = ctx.response;
    console.log('🔍 Response status:', status, 'body:', body);

    if (status !== 201 && status !== 200) {
      console.warn('⚠️ Upload failed:', { status, body });
      return;
    }

    const uploadedFile = Array.isArray(body) ? body[0] : body;
    console.log('📋 Full uploadedFile contents:', JSON.stringify(uploadedFile, null, 2));
    if (!uploadedFile?.id) {
      console.error('🔴 Uploaded file missing ID:', uploadedFile);
      return;
    }
    console.log('✅ Uploaded file ID:', uploadedFile.id);

    // Log file-events record
    try {
      const eventData = {
        event_type: eventType,
        file_document_id: uploadedFile.documentId,
        processed: false,
      };
      console.log('📝 Creating file-event with data:', eventData);

      await strapi.entityService.create('api::file-event.file-event', {
        data: eventData,
      });

      console.log(`📦 File event (${eventType}) logged for file ID ${uploadedFile.id}`);
    } catch (err) {
      console.error('🔴 Failed to log file event:', err.message, err.stack);
      // Don’t throw to avoid breaking the upload
    }

    // Update file metadata if user exists
    if (user && user.bot?.id && user.company?.id) {
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

        console.log('✅ File metadata updated successfully:', extraUpdateData);
      } catch (err) {
        console.error('🔴 Failed to update file metadata:', err.message, err.stack);
        // Don’t throw to avoid breaking the upload
      }
    } else {
      console.log('⚠️ Skipping file metadata update: Missing user or bot/company');
    }
  };
};