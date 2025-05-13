'use strict';

const AWS = require('aws-sdk');

module.exports = (plugin) => {
  const originalUploadService = plugin.services.upload;

  plugin.services.upload = ({ strapi }) => {
    const baseService = originalUploadService({ strapi });

    // Initialize AWS S3 client
    const s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });

    const bucketName = process.env.AWS_BUCKET_NAME;

    return {
      ...baseService,

      async remove(file) {
        try {
          const fileId = file.id || file.documentId;
          console.log('🚀 Custom upload.remove called for file:', {
            id: fileId,
            name: file.name,
            documentId: file.documentId,
          });

          // ✅ Create file-event for downstream deletion
          try {
            await strapi.entityService.create('api::file-event.file-event', {
              data: {
                event_type: 'deleted',
                file_document_id: file.documentId,
                processed: false,
              },
            });
            console.log(`📦 File event (deleted) logged for file ID ${fileId}`);
          } catch (eventError) {
            console.error('🔴 Failed to log file event:', eventError.message, eventError.stack);
          }

          // ✅ Delete manually from S3 using storage_key
          const key = file.storage_key || `${file.hash}${file.ext}`;
          const params = {
            Bucket: bucketName,
            Key: key,
          };

          await s3.deleteObject(params).promise();
          strapi.log.info(`✅ Deleted file from S3: ${key}`);

          // ✅ Hard-delete from DB
          await strapi.db.query('plugin::upload.file').delete({
            where: { id: fileId },
          });
          console.log(`✅ File ID ${fileId} hard-deleted from DB`);

          return file;
        } catch (error) {
          console.error('🔴 Error during custom file removal:', error.message, error.stack);
          throw error;
        }
      },

      async findMany(params = {}) {
        const results = await strapi.db.query('plugin::upload.file').findMany({
          ...params,
          where: { ...params.where, deleted: false },
        });
        return results;
      },
    };
  };

  //plugin.controllers.upload = require('./controllers/upload');

  return plugin;
};
