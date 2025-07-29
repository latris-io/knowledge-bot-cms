module.exports = [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'script-src': [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            'https://cdn.jsdelivr.net',
            'https://knowledge-bot-retrieval.onrender.com',
            'https:',
          ],
          'script-src-elem': [
            "'self'",
            "'unsafe-inline'",
            'https://cdn.jsdelivr.net',
            'https://knowledge-bot-retrieval.onrender.com',
            'https:',
          ],
          'connect-src': [
            "'self'",
            'https://knowledge-bot-retrieval.onrender.com',
            'wss://knowledge-bot-retrieval.onrender.com',
            'https:',
            'wss:',
          ],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'https:',
          ],
          'style-src': [
            "'self'",
            "'unsafe-inline'",
            'https:',
          ],
          'font-src': [
            "'self'",
            'data:',
            'https:',
          ],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
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
