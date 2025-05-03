'use strict';

module.exports = (plugin) => {
  const originalService = plugin.services.upload;

  plugin.services.upload = ({ strapi }) => {
    const baseService = originalService({ strapi });

    return {
      ...baseService,

      async remove(file) {
        try {
          // Soft-delete in DB
          await strapi.db.query('plugin::upload.file').update({
            where: { id: file.id },
            data: {
              deleted: true,
              updatedAt: new Date(),
            },
          });

          // Also remove from S3 if needed
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

      async findMany(params) {
        const results = await strapi.db.query('plugin::upload.file').findMany({
          ...params,
          where: { ...params.where, deleted: false },
        });
        return results;
      },
    };
  };

  return plugin;
};
