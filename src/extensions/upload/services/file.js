'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('plugin::upload.file', ({ strapi }) => ({
  async findMany(params) {
    params.populate = ['user', 'bot'];

    return await strapi.query('plugin::upload.file').findMany(params);
  },

  async findOne(id, params = {}) {
    params.populate = ['user', 'bot'];

    return await strapi.query('plugin::upload.file').findOne({ where: { id }, ...params });
  }
}));
