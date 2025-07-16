const { createTestApiClient, generateTestData } = require('../../helpers/strapi-helpers');

describe('UC-001: User Notification Preference Creation', () => {
  let apiClient;
  let testData;

  beforeEach(() => {
    testData = generateTestData();
    // apiClient will be initialized when we have auth token
  });

  describe('TC-001-001: Happy path preference creation', () => {
    test('should create new user notification preferences with valid data', async () => {
      // This would need proper API token setup
      // For now, using direct document creation
      
      const preferenceData = {
        company: global.testData.companies[0].documentId,
        bot: global.testData.bots[0].documentId,
        user_email: 'test@example.com',
        notification_enabled: true,
        batch_size_threshold: 5,
        notification_delay_minutes: 30,
        email_format: 'html',
        include_success_details: true,
        include_error_details: true
      };

      const createdPreference = await strapi.documents('api::user-notification-preference.user-notification-preference').create({
        data: preferenceData
      });

      expect(createdPreference).toBeDefined();
      expect(createdPreference.user_email).toBe(preferenceData.user_email);
      expect(createdPreference.notification_enabled).toBe(true);
      expect(createdPreference.batch_size_threshold).toBe(5);
      expect(createdPreference.notification_delay_minutes).toBe(30);
      expect(createdPreference.email_format).toBe('html');
      expect(createdPreference.include_success_details).toBe(true);
      expect(createdPreference.include_error_details).toBe(true);
    });

    test('should create preferences with default values when not provided', async () => {
      const minimalPreferenceData = {
        company: global.testData.companies[0].documentId,
        bot: global.testData.bots[0].documentId,
        user_email: 'minimal@example.com'
      };

      const createdPreference = await strapi.documents('api::user-notification-preference.user-notification-preference').create({
        data: minimalPreferenceData
      });

      expect(createdPreference).toBeDefined();
      expect(createdPreference.user_email).toBe(minimalPreferenceData.user_email);
      
      // Check that defaults are applied
      expect(createdPreference.notification_enabled).toBe(true);
      expect(createdPreference.batch_size_threshold).toBe(5);
      expect(createdPreference.notification_delay_minutes).toBe(30);
      expect(createdPreference.email_format).toBe('html');
      expect(createdPreference.include_success_details).toBe(true);
      expect(createdPreference.include_error_details).toBe(true);
    });

    test('should create preferences with relations to company and bot', async () => {
      const preferenceData = {
        company: global.testData.companies[0].documentId,
        bot: global.testData.bots[0].documentId,
        user_email: 'relations@example.com',
        notification_enabled: true
      };

      const createdPreference = await strapi.documents('api::user-notification-preference.user-notification-preference').create({
        data: preferenceData,
        populate: ['company', 'bot']
      });

      expect(createdPreference).toBeDefined();
      expect(createdPreference.company).toBeDefined();
      expect(createdPreference.bot).toBeDefined();
      expect(createdPreference.company.documentId).toBe(global.testData.companies[0].documentId);
      expect(createdPreference.bot.documentId).toBe(global.testData.bots[0].documentId);
    });
  });

  describe('TC-001-002: Multiple preferences for same user', () => {
    test('should allow multiple preferences for same user with different company/bot combinations', async () => {
      const basePreferenceData = {
        user_email: 'multi@example.com',
        notification_enabled: true,
        batch_size_threshold: 10
      };

      // Create preference for company1/bot1
      const preference1 = await strapi.documents('api::user-notification-preference.user-notification-preference').create({
        data: {
          ...basePreferenceData,
          company: global.testData.companies[0].documentId,
          bot: global.testData.bots[0].documentId
        }
      });

      // Create preference for company2/bot2
      const preference2 = await strapi.documents('api::user-notification-preference.user-notification-preference').create({
        data: {
          ...basePreferenceData,
          company: global.testData.companies[1].documentId,
          bot: global.testData.bots[1].documentId,
          batch_size_threshold: 15 // Different threshold
        }
      });

      expect(preference1).toBeDefined();
      expect(preference2).toBeDefined();
      expect(preference1.documentId).not.toBe(preference2.documentId);
      expect(preference1.batch_size_threshold).toBe(10);
      expect(preference2.batch_size_threshold).toBe(15);
    });
  });

  describe('TC-001-003: Preference creation performance', () => {
    test('should create preferences within acceptable time limits', async () => {
      const preferenceData = {
        company: global.testData.companies[0].documentId,
        bot: global.testData.bots[0].documentId,
        user_email: 'performance@example.com',
        notification_enabled: true
      };

      const startTime = Date.now();
      
      const createdPreference = await strapi.documents('api::user-notification-preference.user-notification-preference').create({
        data: preferenceData
      });

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(createdPreference).toBeDefined();
      expect(executionTime).toBeLessThan(500); // Should create within 500ms
    });
  });
}); 