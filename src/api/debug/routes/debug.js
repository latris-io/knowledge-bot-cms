module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/debug/content-type',
      handler: 'debug.getContentType',
      config: { policies: [] },
    },
    {
      method: 'POST',
      path: '/debug/test-bot-lifecycle',
      handler: 'debug.testBotLifecycle',
      config: { 
        policies: [],
        auth: false 
      },
    },
  ],
};