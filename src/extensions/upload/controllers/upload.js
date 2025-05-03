'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('plugin::upload.file', ({ strapi }) => ({
  async find(ctx) {
    ctx.query = {
      ...ctx.query,
      filters: {
        ...ctx.query.filters,
        deleted: false, // 🧼 Hide soft-deleted files in Admin UI
      },
    };
    return await super.find(ctx);
  },

  async findOne(ctx) {
    const result = await super.findOne(ctx);
    if (result?.data?.attributes?.deleted) {
      return ctx.notFound();
    }
    return result;
  },
}));
