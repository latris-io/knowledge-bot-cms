'use strict';

module.exports = (plugin) => {
  plugin.services['upload'] = ({ strapi }) => ({
    ...plugin.services['upload']({ strapi }),
    async remove(file) {
      try {
        // Step 1: Update the file record to set deleted = true
        await strapi.db.query('plugin::upload.file').update({
          where: { id: file.id },
          data: {
            deleted: true,
            updatedAt: new Date(),
          },
        });

        // Step 2: Delete the file from S3
        const provider = strapi.plugins.upload.provider;
        if (provider && provider.delete) {
          await provider.delete(file);
        }

        // Return the file object to maintain compatibility
        return file;
      } catch (error) {
        strapi.log.error(`Error in custom upload.remove for file ID ${file.id}: ${error.message}`);
        throw error;
      }
    },
  });

  // Optionally, filter out deleted files in the Media Library
  plugin.services['upload'] = ({ strapi }) => ({
    ...plugin.services['upload']({ strapi }),
    async findMany(params) {
      const results = await strapi.db.query('plugin::upload.file').findMany({
        ...params,
        where: { ...params.where, deleted: false },
      });
      return results;
    },
  });

  return plugin;
};