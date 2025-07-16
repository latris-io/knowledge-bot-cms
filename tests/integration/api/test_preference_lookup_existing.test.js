const { createTestApiClient, generateTestData } = require('../../helpers/strapi-helpers');

describe('UC-002: Preference Lookup - Existing Preferences', () => {
  let testData;

  beforeEach(() => {
    testData = generateTestData();
  });

  describe('TC-002-001: Lookup existing preferences', () => {
    test('should return existing preferences when found', async () => {
      // Create a preference first
      const preferenceData = {
        company: global.testData.companies[0].documentId,
        bot: global.testData.bots[0].documentId,
        user_email: 'existing@example.com',
        notification_enabled: true,
        batch_size_threshold: 15,
        notification_delay_minutes: 45,
        email_format: 'text',
        include_success_details: false,
        include_error_details: true
      };

      const createdPreference = await strapi.documents('api::user-notification-preference.user-notification-preference').create({
        data: preferenceData
      });

      // Test the lookup functionality by simulating the controller logic
      const foundPreference = await strapi.documents('api::user-notification-preference.user-notification-preference').findFirst({
        filters: {
          company: { id: global.testData.companies[0].id },
          bot: { id: global.testData.bots[0].id },
          user_email: { $eq: 'existing@example.com' }
        }
      });

      expect(foundPreference).toBeDefined();
      expect(foundPreference.user_email).toBe('existing@example.com');
      expect(foundPreference.notification_enabled).toBe(true);
      expect(foundPreference.batch_size_threshold).toBe(15);
      expect(foundPreference.notification_delay_minutes).toBe(45);
      expect(foundPreference.email_format).toBe('text');
      expect(foundPreference.include_success_details).toBe(false);
      expect(foundPreference.include_error_details).toBe(true);
    });

    test('should return preferences with populated relations', async () => {
      // Create a preference
      const preferenceData = {
        company: global.testData.companies[0].documentId,
        bot: global.testData.bots[0].documentId,
        user_email: 'populated@example.com',
        notification_enabled: true
      };

      await strapi.documents('api::user-notification-preference.user-notification-preference').create({
        data: preferenceData
      });

      // Test lookup with populated relations
      const foundPreference = await strapi.documents('api::user-notification-preference.user-notification-preference').findFirst({
        filters: {
          company: { id: global.testData.companies[0].id },
          bot: { id: global.testData.bots[0].id },
          user_email: { $eq: 'populated@example.com' }
        },
        populate: ['company', 'bot']
      });

      expect(foundPreference).toBeDefined();
      expect(foundPreference.company).toBeDefined();
      expect(foundPreference.bot).toBeDefined();
      expect(foundPreference.company.name).toBe('Test Company 1');
      expect(foundPreference.bot.name).toBe('Test Bot 1');
    });
  });

  describe('TC-002-002: Lookup performance with existing preferences', () => {
    test('should lookup preferences within acceptable time limits', async () => {
      // Create multiple preferences to test performance
      const preferences = [];
      for (let i = 0; i < 10; i++) {
        const preferenceData = {
          company: global.testData.companies[i % 2].documentId,
          bot: global.testData.bots[i % 2].documentId,
          user_email: `user${i}@example.com`,
          notification_enabled: true
        };
        
        preferences.push(await strapi.documents('api::user-notification-preference.user-notification-preference').create({
          data: preferenceData
        }));
      }

      const startTime = Date.now();
      
      // Lookup a specific preference
      const foundPreference = await strapi.documents('api::user-notification-preference.user-notification-preference').findFirst({
        filters: {
          company: { id: global.testData.companies[0].id },
          bot: { id: global.testData.bots[0].id },
          user_email: { $eq: 'user0@example.com' }
        }
      });

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(foundPreference).toBeDefined();
      expect(foundPreference.user_email).toBe('user0@example.com');
      expect(executionTime).toBeLessThan(200); // Should lookup within 200ms
    });
  });

  describe('TC-002-003: Lookup with different filter combinations', () => {
    test('should correctly filter by company ID', async () => {
      // Create preferences for different companies
      const pref1 = await strapi.documents('api::user-notification-preference.user-notification-preference').create({
        data: {
          company: global.testData.companies[0].documentId,
          bot: global.testData.bots[0].documentId,
          user_email: 'company1@example.com',
          notification_enabled: true,
          batch_size_threshold: 5
        }
      });

      const pref2 = await strapi.documents('api::user-notification-preference.user-notification-preference').create({
        data: {
          company: global.testData.companies[1].documentId,
          bot: global.testData.bots[0].documentId,
          user_email: 'company2@example.com',
          notification_enabled: true,
          batch_size_threshold: 10
        }
      });

      // Lookup by company 1
      const foundPref1 = await strapi.documents('api::user-notification-preference.user-notification-preference').findFirst({
        filters: {
          company: { id: global.testData.companies[0].id },
          bot: { id: global.testData.bots[0].id },
          user_email: { $eq: 'company1@example.com' }
        }
      });

      // Lookup by company 2
      const foundPref2 = await strapi.documents('api::user-notification-preference.user-notification-preference').findFirst({
        filters: {
          company: { id: global.testData.companies[1].id },
          bot: { id: global.testData.bots[0].id },
          user_email: { $eq: 'company2@example.com' }
        }
      });

      expect(foundPref1).toBeDefined();
      expect(foundPref2).toBeDefined();
      expect(foundPref1.user_email).toBe('company1@example.com');
      expect(foundPref2.user_email).toBe('company2@example.com');
      expect(foundPref1.batch_size_threshold).toBe(5);
      expect(foundPref2.batch_size_threshold).toBe(10);
    });

    test('should correctly filter by bot ID', async () => {
      // Create preferences for different bots
      const pref1 = await strapi.documents('api::user-notification-preference.user-notification-preference').create({
        data: {
          company: global.testData.companies[0].documentId,
          bot: global.testData.bots[0].documentId,
          user_email: 'bot1@example.com',
          notification_enabled: true,
          email_format: 'html'
        }
      });

      const pref2 = await strapi.documents('api::user-notification-preference.user-notification-preference').create({
        data: {
          company: global.testData.companies[0].documentId,
          bot: global.testData.bots[1].documentId,
          user_email: 'bot2@example.com',
          notification_enabled: true,
          email_format: 'text'
        }
      });

      // Lookup by bot 1
      const foundPref1 = await strapi.documents('api::user-notification-preference.user-notification-preference').findFirst({
        filters: {
          company: { id: global.testData.companies[0].id },
          bot: { id: global.testData.bots[0].id },
          user_email: { $eq: 'bot1@example.com' }
        }
      });

      // Lookup by bot 2
      const foundPref2 = await strapi.documents('api::user-notification-preference.user-notification-preference').findFirst({
        filters: {
          company: { id: global.testData.companies[0].id },
          bot: { id: global.testData.bots[1].id },
          user_email: { $eq: 'bot2@example.com' }
        }
      });

      expect(foundPref1).toBeDefined();
      expect(foundPref2).toBeDefined();
      expect(foundPref1.user_email).toBe('bot1@example.com');
      expect(foundPref2.user_email).toBe('bot2@example.com');
      expect(foundPref1.email_format).toBe('html');
      expect(foundPref2.email_format).toBe('text');
    });
  });
}); 