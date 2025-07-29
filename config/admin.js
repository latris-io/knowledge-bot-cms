module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
  },
  // Add custom script for registration extension
  rateLimit: {
    enabled: false,
  },
  // Inject our registration extension script
  serveAdminPanel: env.bool('SERVE_ADMIN', true),
  // Custom head configuration to inject our registration script
  head: {
    script: [
      {
        src: '/admin-registration-extension.js',
        async: true,
      },
    ],
  },
});
