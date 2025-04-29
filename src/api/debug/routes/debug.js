module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/debug/content-type',
      handler: 'debug.getContentType',
      config: { policies: [] },
    },
  ],
};