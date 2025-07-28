module.exports = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
  {
    name: 'global::admin-registration-extension',
    config: {}
  },
  {
    name: 'global::assign-user-bot-to-upload',
    config: {},
  },
  {
    name: 'global::subscription-guard',
    config: {
      enabled: true
    }
  }
];
