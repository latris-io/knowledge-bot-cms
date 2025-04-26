module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('RENDER_EXTERNAL_URL'), // Optional: use Render URL in production
  app: {
    keys: env.array('APP_KEYS'),
  },
});
