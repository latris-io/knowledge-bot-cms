'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('plugin::upload.file', ({ strapi }) => ({
  async find(ctx) {
    ctx.query = {
      ...ctx.query,
      populate: ['user', 'bot'],
    };
    const { data, meta } = await super.find(ctx);
    return { data, meta };
  },
  async findOne(ctx) {
    ctx.query = {
      ...ctx.query,
      populate: ['user', 'bot'],
    };
    const { data, meta } = await super.findOne(ctx);
    return { data, meta };
  }
}));
