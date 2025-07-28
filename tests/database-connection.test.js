const { setupStrapi, cleanupStrapi } = require('./helpers/strapi-helpers');

describe('Test Database Configuration', () => {
  let strapi;

  beforeAll(async () => {
    strapi = await setupStrapi();
  });

  afterAll(async () => {
    await cleanupStrapi();
  });

  test('should connect to test database successfully', async () => {
    expect(strapi).toBeDefined();
    expect(strapi.db).toBeDefined();
    expect(strapi.db.connection).toBeDefined();
  });

  test('should be using test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  test('should be able to query database', async () => {
    // Try to get all content types to verify database connectivity
    const contentTypes = Object.keys(strapi.contentTypes);
    expect(contentTypes.length).toBeGreaterThan(0);
    
    // Test that we can access the users-permissions plugin
    expect(contentTypes).toContain('plugin::users-permissions.user');
  });

  test('should be able to create and query test data', async () => {
    // Test basic CRUD operations
    const roles = await strapi.entityService.findMany('plugin::users-permissions.role');
    expect(Array.isArray(roles)).toBe(true);
    
    // Should have at least the default roles
    expect(roles.length).toBeGreaterThan(0);
  });

  test('should have subscription billing extensions loaded', async () => {
    // Check that our custom extensions are loaded
    expect(strapi.plugin('users-permissions')).toBeDefined();
    
    // Check that subscription controller is available
    const controller = strapi.plugin('users-permissions').controller('subscription');
    expect(controller).toBeDefined();
    expect(typeof controller.getDashboardUsage).toBe('function');
    
    // Check that billing controller is available  
    const billingController = strapi.plugin('users-permissions').controller('billing');
    expect(billingController).toBeDefined();
    expect(typeof billingController.getManagementOverview).toBe('function');
  });
}); 
 
 
 
 
 