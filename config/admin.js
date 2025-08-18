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
      // Custom head configuration for HeyChat branding
  head: {
    // Custom title for link previews and browser tab
    title: 'HeyChat!',
    // Custom favicon
    favicon: '/favicon.ico',
    // Scripts
    script: [
      {
        src: '/admin-registration-extension.js',
        async: true,
      },
    ],
    // Open Graph and social media meta tags for link previews
    meta: [
      // Primary meta tags
      { name: 'title', content: 'HeyChat!' },
      { name: 'description', content: 'Your personalized Knowledge Bot administration panel' },
      
      // Open Graph / Facebook
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: 'HeyChat!' },
      { property: 'og:description', content: 'Your personalized Knowledge Bot administration panel' },
      { property: 'og:site_name', content: 'HeyChat!' },
      
      // Twitter
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: 'HeyChat!' },
      { name: 'twitter:description', content: 'Your personalized Knowledge Bot administration panel' },
      
      // Additional meta tags
      { name: 'application-name', content: 'HeyChat!' },
      { name: 'apple-mobile-web-app-title', content: 'HeyChat!' },
    ],
  },
});
