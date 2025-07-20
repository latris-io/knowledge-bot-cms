'use strict';

console.log('[INFO] Loading custom upload extension for Strapi v5.12.6');

module.exports = (plugin) => {
  // Apply policies to upload routes for file access control - CONTENT-API ONLY
  if (plugin.routes && plugin.routes['content-api']) {
    plugin.routes['content-api'].routes.forEach(route => {
      if (route.handler === 'upload.find' || 
          route.handler === 'upload.findOne' ||
          route.handler === 'upload.destroy') {
        route.config.policies = route.config.policies || [];
        route.config.policies.push('global::isOwner');
      }
    });
  }

  // DO NOT apply policies to admin routes - this interferes with admin panel permissions
  // The controller-level filtering handles standard user file access instead

  const defaultUploadService = plugin.services.upload;

  // File extension validation is handled in the middleware

  // Add notification message to upload response AND customize find controller
  if (plugin.controllers && plugin.controllers.upload) {
    // Customize the find controller to filter files by user for standard users
    const originalFind = plugin.controllers.upload.find;
    if (originalFind) {
      plugin.controllers.upload.find = async (ctx) => {
        const { user } = ctx.state;
        
        // Check if user is standard user
        if (user && user.roles) {
          const isStandardUser = user.roles.some(role => role.code === 'standard-user');
          const isAdmin = user.roles.some(role => 
            role.code === 'strapi-super-admin' || role.code === 'strapi-editor'
          );
          
          if (isStandardUser && !isAdmin) {
            // Add filter to only show files created by this user
            ctx.query.filters = {
              ...ctx.query.filters,
              createdBy: user.id
            };
          }
        }
        
        return await originalFind(ctx);
      };
    }

    // Existing upload controller modification
    const originalUploadController = plugin.controllers.upload.upload;
    if (originalUploadController) {
      plugin.controllers.upload.upload = async (ctx) => {
        // Call the original upload controller
        const result = await originalUploadController(ctx);
        
        // Add notification message to response
        if (ctx.response.status === 201 && ctx.response.body) {
          const files = Array.isArray(ctx.response.body) ? ctx.response.body : [ctx.response.body];
          const fileCount = files.length;
          const fileWord = fileCount === 1 ? 'file' : 'files';
          
          // Add notification message
          ctx.response.body = {
            data: ctx.response.body,
            message: `✅ ${fileCount} ${fileWord} uploaded successfully! You will receive an email notification once your ${fileWord} ${fileCount === 1 ? 'has' : 'have'} been processed and ${fileCount === 1 ? 'is' : 'are'} ready for use by your AI bot.`,
            notification: {
              type: 'success',
              title: 'Upload Complete',
              message: `Your ${fileWord} will be processed shortly and you'll be notified via email when ready.`
            }
          };
        }
        
        return result;
      };
    }
  }

  plugin.services.upload = ({ strapi }) => {
    const baseService = defaultUploadService({ strapi });
    const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
    const { fromEnv } = require('@aws-sdk/credential-provider-env');

    return {
      ...baseService,

      async remove(file) {
        const fileId = file.id || file.documentId;
        console.log('🚀 Custom upload.remove called for file:', {
          id: fileId,
          name: file.name,
          documentId: file.documentId,
        });

        // Log the deletion event
        try {
          // Get file with populated relationships to extract user, bot, and company info
          const fileWithRelations = await strapi.entityService.findOne(
            'plugin::upload.file',
            fileId,
            { populate: ['user', 'bot', 'company'] }
          );

          const eventData = {
            event_type: 'deleted',
            file_document_id: file.documentId,
            processed: false,
            bot_id: fileWithRelations?.bot?.id || null,
            company_id: fileWithRelations?.company?.id || null,
            user_id: fileWithRelations?.user?.id || null,
            file_name: file.name || null,
          };
          console.log('📝 Creating file-event with data:', eventData);
          await strapi.entityService.create('api::file-event.file-event', {
            data: eventData,
          });
          console.log(`📦 File event (deleted) logged for file ID ${fileId}`);
        } catch (eventError) {
          console.error('🔴 Failed to log file event:', eventError.message, eventError.stack);
        }

        // DEBUG ENV VARS
        console.log('[DEBUG] AWS credentials from environment:', {
          AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
          AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
          AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME,
          AWS_REGION: process.env.AWS_REGION,
        });

        // Initialize AWS S3 client
        let s3;
        try {
          s3 = new S3Client({
            region: process.env.AWS_REGION,
            credentials: fromEnv(),
          });

          // Explicitly verify credentials
          const creds = await s3.config.credentials();
          console.log('[DEBUG] ✅ Resolved AWS credentials:', creds);
        } catch (credError) {
          console.error('🔴 Failed to resolve AWS credentials:', credError.message, credError.stack);
          throw new Error('Could not resolve AWS credentials. Check environment variables.');
        }

        // Attempt S3 deletion
        try {
          const s3Key = file.storage_key || `${file.hash}${file.ext}`;
          console.log(`[S3] 🗑️ Attempting to delete from bucket: ${process.env.AWS_BUCKET_NAME}, key: ${s3Key}`);

          const deleteResult = await s3.send(new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: s3Key,
          }));

          console.log(`[S3] ✅ S3 deletion response:`, deleteResult);
        } catch (s3Error) {
          console.error('🔴 Failed to delete from S3:', s3Error.message, s3Error.stack);
          throw s3Error;
        }

        // Remove file from DB
        try {
          await strapi.db.query('plugin::upload.file').delete({
            where: { id: fileId },
          });

          console.log(`✅ File ID ${fileId} hard-deleted from DB`);
          return file;
        } catch (dbError) {
          console.error('🔴 Error deleting from DB:', dbError.message, dbError.stack);
          throw dbError;
        }
      },
    };
  };

  return plugin;
};
