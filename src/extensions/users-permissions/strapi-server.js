module.exports = (plugin) => {
  console.log('🔧 Loading users-permissions extension...');
  
  // Register the user content type with lifecycle hooks
  plugin.contentTypes.user.lifecycles = require('./content-types/user/lifecycles');
  console.log('✅ User lifecycles registered');
  
  // Add subscription billing controllers
  plugin.controllers.billing = require('./controllers/billing');
  plugin.controllers.subscription = require('./controllers/subscription');
  plugin.controllers['admin-billing'] = require('./controllers/admin-billing');
  console.log('✅ Billing, subscription, and admin billing controllers registered');
  
  // Add subscription billing services  
  plugin.services.billing = require('./services/billing');
  plugin.services.subscription = require('./services/subscription');
  console.log('✅ Billing and subscription services registered');
  
  // Add subscription billing routes
  const billingRoutesModule = require('./routes/billing');
  const subscriptionRoutesModule = require('./routes/subscription');
  const adminBillingRoutesModule = require('./routes/admin-billing');
  
  // Extract routes arrays
  const billingRoutes = Array.isArray(billingRoutesModule) ? billingRoutesModule : billingRoutesModule.routes;
  const subscriptionRoutes = Array.isArray(subscriptionRoutesModule) ? subscriptionRoutesModule : subscriptionRoutesModule.routes;
  const adminBillingRoutes = Array.isArray(adminBillingRoutesModule) ? adminBillingRoutesModule : adminBillingRoutesModule.routes;
  
  plugin.routes['content-api'].routes.push(...billingRoutes);
  plugin.routes['content-api'].routes.push(...subscriptionRoutes);
  plugin.routes['content-api'].routes.push(...adminBillingRoutes);
  
  console.log(`✅ Added ${billingRoutes.length} billing routes, ${subscriptionRoutes.length} subscription routes, and ${adminBillingRoutes.length} admin billing routes`);
  console.log('🚀 Users-permissions extension loaded successfully!');
  
  return plugin;
}; 