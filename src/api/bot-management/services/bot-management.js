'use strict';

/**
 * bot-management service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::bot-management.bot-management'); 