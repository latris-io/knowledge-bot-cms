'use strict';

module.exports = {
  async getContentType(ctx) {
    try {
      const contentType = strapi.contentTypes['plugin::upload.file'];
      return contentType;
    } catch (error) {
      ctx.throw(500, error.message);
    }
  },
};