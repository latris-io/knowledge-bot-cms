module.exports = (plugin) => {
  // Register the user content type with lifecycle hooks
  plugin.contentTypes.user.lifecycles = require('./content-types/user/lifecycles');
  
  return plugin;
}; 