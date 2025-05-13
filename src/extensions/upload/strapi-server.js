'use strict';

console.log('[INFO] Loading custom upload extension for Strapi v5.12.6');

module.exports = (plugin) => {
  const defaultUploadService = plugin.services.upload;

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
          const eventData = {
            event_type: 'deleted',
            file_document_id: file.documentId,
            processed: false,
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
