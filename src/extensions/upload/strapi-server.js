'use strict';

module.exports = (plugin) => {
  const originalUploadService = plugin.services.upload;

  plugin.services.upload = ({ strapi }) => {
    const baseService = originalUploadService({ strapi });

    return {
      ...baseService,

      async remove(file) {
        try {
          await strapi.db.query('plugin::upload.file').update({
            where: { id: file.id },
            data: {
              deleted: true,
              updatedAt: new Date(),
            },
          });

          const provider = strapi.plugins.upload.provider;
          if (provider && provider.delete) {
            await provider.delete(file);
          }

          return file;
        } catch (error) {
          strapi.log.error(`Error in custom upload.remove for file ID ${file.id}: ${error.message}`);
          throw error;
        }
      },

      async findMany(params = {}) {
        strapi.log.debug('Custom upload.findMany called with params:', params);
        const results = await strapi.db.query('plugin::upload.file').findMany({
          ...params,
          where: { ...params.where, deleted: false },
        });
        strapi.log.debug('Custom upload.findMany returned:', results.length, 'files');
        return results;
      },
    };
  };

  // Ensure deleted files are hidden from Admin UI
  plugin.controllers.upload = require('./controllers/upload');

  return plugin;
};

