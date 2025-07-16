const { setupStrapi, cleanupStrapi } = require('./strapi-helpers');

// Global setup for all tests
beforeAll(async () => {
  await setupStrapi();
});

afterAll(async () => {
  await cleanupStrapi();
});

// Reset data before each test
beforeEach(async () => {
  await cleanupTestData();
  await seedTestData();
});

async function cleanupTestData() {
  try {
    // Clean up test data in reverse dependency order
    await strapi.documents('api::user-notification-preference.user-notification-preference').deleteMany({});
    await strapi.documents('api::bot.bot').deleteMany({});
    await strapi.documents('api::company.company').deleteMany({});
    await strapi.documents('plugin::users-permissions.user').deleteMany({
      filters: { email: { $contains: 'test' } }
    });
  } catch (error) {
    console.error('Error cleaning test data:', error);
  }
}

async function seedTestData() {
  try {
    // Create test companies
    const company1 = await strapi.documents('api::company.company').create({
      data: {
        name: 'Test Company 1',
        company_id: 'test-company-1',
        default_notifications_enabled: true,
        default_batch_size_threshold: 10,
        default_notification_delay_minutes: 30,
        notification_quota_daily: 100,
        notification_quota_monthly: 1000
      }
    });

    const company2 = await strapi.documents('api::company.company').create({
      data: {
        name: 'Test Company 2',
        company_id: 'test-company-2',
        default_notifications_enabled: true,
        default_batch_size_threshold: 5,
        default_notification_delay_minutes: 15,
        notification_quota_daily: 50,
        notification_quota_monthly: 500
      }
    });

    // Create test bots
    const bot1 = await strapi.documents('api::bot.bot').create({
      data: {
        name: 'Test Bot 1',
        bot_id: 'test-bot-1',
        processing_enabled: true,
        auto_correction_enabled: true,
        max_retry_attempts: 3,
        retry_delay_minutes: 5
      }
    });

    const bot2 = await strapi.documents('api::bot.bot').create({
      data: {
        name: 'Test Bot 2',
        bot_id: 'test-bot-2',
        processing_enabled: true,
        auto_correction_enabled: false,
        max_retry_attempts: 2,
        retry_delay_minutes: 10
      }
    });

    // Create test users
    const user1 = await strapi.documents('plugin::users-permissions.user').create({
      data: {
        username: 'testuser1',
        email: 'test1@example.com',
        password: 'testpassword123',
        confirmed: true,
        blocked: false,
        company: company1.documentId,
        bot: bot1.documentId
      }
    });

    const user2 = await strapi.documents('plugin::users-permissions.user').create({
      data: {
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'testpassword123',
        confirmed: true,
        blocked: false,
        company: company2.documentId,
        bot: bot2.documentId
      }
    });

    // Store test data globally for use in tests
    global.testData = {
      companies: [company1, company2],
      bots: [bot1, bot2],
      users: [user1, user2]
    };

  } catch (error) {
    console.error('Error seeding test data:', error);
    throw error;
  }
} 