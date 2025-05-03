'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('plugin::upload.file', ({ strapi }) => ({
  async find(ctx) {
    // Inject deleted: false into the query to exclude soft-deleted files
    ctx.query = {
      ...ctx.query,
      filters: {
        ...ctx.query.filters,
        deleted: false,
      },
    };

    const { data, meta } = await super.find(ctx);
    return { data, meta };
  },

  async findOne(ctx) {
    const result = await super.findOne(ctx);

    if (result?.data?.attributes?.deleted) {
      return ctx.notFound();
    }

    return result;
  },
}));
