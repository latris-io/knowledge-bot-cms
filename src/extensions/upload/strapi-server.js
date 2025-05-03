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
          strapi.log.debug('Custom upload.remove called for file:', {
            id: file.id || file.documentId,
            name: file.name,
          });

          // Log the deletion event for vector DB cleanup
          await strapi.entityService.create('api::file-event.file-event', {
            data: {
              event_type: 'deleted',
              file: file.id,
              processed: false,
            },
          });

          // Remove from S3
          const provider = strapi.plugin('upload').provider;
          if (provider && typeof provider.delete === 'function') {
            await provider.delete(file);
            strapi.log.debug(`Removed file ID ${file.id || file.documentId} from S3`);
          }

          // Hard-delete from DB
          await strapi.db.query('plugin::upload.file').delete({
            where: { id: file.id || file.documentId },
          });

          strapi.log.debug(`✅ File ID ${file.id || file.documentId} hard-deleted from DB`);

          return file;
        } catch (error) {
          strapi.log.error(`🔴 Error hard-deleting file: ${error.message}`);
          throw error;
        }
      },
    };
  };

  return plugin;
};
