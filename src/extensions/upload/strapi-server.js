'use strict';

console.log('[INFO] Loading custom upload extension for Strapi v5.12.6');

module.exports = (plugin) => {
  const defaultUploadService = plugin.services.upload;

  plugin.services.upload = ({ strapi }) => {
    const baseService = defaultUploadService({ strapi });

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

          // Log the deletion event for vector DB cleanup
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
            // Continue with deletion even if event logging fails
          }

          // ✅ Remove file from S3
          const provider = strapi.plugins.upload.provider;

          if (provider && typeof provider.delete === 'function') {
            await provider.delete(file); // ✅ Pass full file object
            strapi.log.info(`✅ Removed file ID ${file.id} from S3 (key: ${file.hash}${file.ext})`);
          } else {
            strapi.log.warn('⚠️ S3 provider.delete is not available or invalid');
          }

          // Hard-delete from DB
          await strapi.db.query('plugin::upload.file').delete({
            where: { id: fileId },
          });

          console.log(`✅ File ID ${fileId} hard-deleted from DB`);

          return file;
        } catch (error) {
          console.error('🔴 Error hard-deleting file:', error.message, error.stack);
          throw error;
        }
      },
    };
  };

  return plugin;
};