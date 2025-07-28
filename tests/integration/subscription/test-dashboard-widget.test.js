'use strict';

const request = require('supertest');

describe('Subscription Billing - Dashboard Usage Widget', () => {
  let strapi;
  let testCompany;
  let testUser;
  let authToken;

  beforeAll(async () => {
    strapi = global.strapi;
  });

  beforeEach(async () => {
    // Create test company with subscription data
    testCompany = await strapi.entityService.create('api::company.company', {
      data: {
        name: 'Widget Test Company',
        company_id: 'widget-test-company',
        subscription_status: 'active',
        plan_level: 'professional',
        storage_used_bytes: 5368709120, // 5GB
        storage_limit_bytes: 21474836480, // 20GB
        stripe_customer_id: 'cus_widget_test',
        current_period_start: new Date(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    });

    // Get authenticated role
    const roles = await strapi.entityService.findMany('plugin::users-permissions.role', {
      filters: { type: 'authenticated' }
    });
    const authenticatedRole = roles[0];

    // Create test user
    testUser = await strapi.entityService.create('plugin::users-permissions.user', {
      data: {
        username: 'widgettestuser',
        email: 'widgettest@example.com',
        password: 'testpassword123',
        confirmed: true,
        company: testCompany.id,
        role: authenticatedRole.id
      }
    });

    // Get auth token
    const authResponse = await request(strapi.server.httpServer)
      .post('/api/auth/local')
      .send({
        identifier: 'widgettest@example.com',
        password: 'testpassword123'
      });

    authToken = authResponse.body.jwt;
  });

  afterEach(async () => {
    // Cleanup test data
    if (testUser) {
      try {
        await strapi.entityService.delete('plugin::users-permissions.user', testUser.id);
      } catch (error) {
        console.log('Error cleaning up user:', error.message);
      }
    }
    if (testCompany) {
      try {
        await strapi.entityService.delete('api::company.company', testCompany.id);
      } catch (error) {
        console.log('Error cleaning up company:', error.message);
      }
    }
  });

  describe('GET /subscription/usage/dashboard', () => {
    test('should return complete dashboard usage data for authenticated user', async () => {
      const response = await request(strapi.server.httpServer)
        .get('/subscription/usage/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toMatchObject({
        companyId: testCompany.id,
        companyName: 'Widget Test Company',
        subscriptionStatus: 'active',
        planLevel: 'professional',
        storageUsed: 5368709120,
        storageLimit: 21474836480,
        userCount: 1
      });

      // Check plan limits structure
      expect(response.body.data.planLimits).toMatchObject({
        maxUsers: 25,
        storageLimit: 21474836480,
        features: expect.arrayContaining(['Priority Support', 'Advanced Analytics', 'Custom Domains'])
      });

      // Check usage percentages are calculated correctly
      expect(response.body.data.usagePercentages).toMatchObject({
        storage: expect.any(Number),
        users: expect.any(Number)
      });

      const storagePercentage = (5368709120 / 21474836480) * 100;
      expect(response.body.data.usagePercentages.storage).toBeCloseTo(storagePercentage, 1);

      // Check metadata
      expect(response.body.data).toHaveProperty('lastUpdated');
      expect(response.body.data).toHaveProperty('nextBillingDate');
      expect(response.body.data).toHaveProperty('upgradeUrl');
    });

    test('should handle different subscription statuses correctly', async () => {
      // Test trial status
      await strapi.entityService.update('api::company.company', testCompany.id, {
        data: { 
          subscription_status: 'trial',
          plan_level: 'starter'
        }
      });

      const trialResponse = await request(strapi.server.httpServer)
        .get('/subscription/usage/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(trialResponse.body.data.subscriptionStatus).toBe('trial');
      expect(trialResponse.body.data.planLevel).toBe('starter');
      expect(trialResponse.body.data.planLimits.maxUsers).toBe(5);

      // Test past_due status
      await strapi.entityService.update('api::company.company', testCompany.id, {
        data: { subscription_status: 'past_due' }
      });

      const pastDueResponse = await request(strapi.server.httpServer)
        .get('/subscription/usage/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(pastDueResponse.body.data.subscriptionStatus).toBe('past_due');

      // Test canceled status
      await strapi.entityService.update('api::company.company', testCompany.id, {
        data: { subscription_status: 'canceled' }
      });

      const canceledResponse = await request(strapi.server.httpServer)
        .get('/subscription/usage/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(canceledResponse.body.data.subscriptionStatus).toBe('canceled');
    });

    test('should handle different plan levels with correct limits', async () => {
      // Test starter plan
      await strapi.entityService.update('api::company.company', testCompany.id, {
        data: { 
          plan_level: 'starter',
          storage_limit_bytes: 2147483648 // 2GB
        }
      });

      const starterResponse = await request(strapi.server.httpServer)
        .get('/subscription/usage/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(starterResponse.body.data.planLimits).toMatchObject({
        maxUsers: 5,
        storageLimit: 2147483648,
        features: expect.arrayContaining(['Basic Support', 'File Upload', 'AI Chat'])
      });

      // Test enterprise plan
      await strapi.entityService.update('api::company.company', testCompany.id, {
        data: { 
          plan_level: 'enterprise',
          storage_limit_bytes: 107374182400 // 100GB
        }
      });

      const enterpriseResponse = await request(strapi.server.httpServer)
        .get('/subscription/usage/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(enterpriseResponse.body.data.planLimits).toMatchObject({
        maxUsers: -1, // Unlimited
        storageLimit: 107374182400,
        features: expect.arrayContaining(['24/7 Support', 'API Access'])
      });

      expect(enterpriseResponse.body.data.upgradeUrl).toBeNull(); // Enterprise is highest plan
    });

    test('should calculate usage percentages correctly', async () => {
      // Set specific values for precise calculation testing
      await strapi.entityService.update('api::company.company', testCompany.id, {
        data: {
          storage_used_bytes: 1073741824, // 1GB
          storage_limit_bytes: 2147483648, // 2GB
          plan_level: 'starter'
        }
      });

      const response = await request(strapi.server.httpServer)
        .get('/subscription/usage/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Storage should be 50% (1GB / 2GB)
      expect(response.body.data.usagePercentages.storage).toBeCloseTo(50, 1);

      // Users should be 20% (1 user / 5 max users for starter)
      expect(response.body.data.usagePercentages.users).toBeCloseTo(20, 1);
    });

    test('should handle storage limit exceeded scenarios', async () => {
      // Set storage usage above limit
      await strapi.entityService.update('api::company.company', testCompany.id, {
        data: {
          storage_used_bytes: 2200000000, // 2.2GB
          storage_limit_bytes: 2147483648, // 2GB
          plan_level: 'starter'
        }
      });

      const response = await request(strapi.server.httpServer)
        .get('/subscription/usage/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should calculate over 100%
      expect(response.body.data.usagePercentages.storage).toBeGreaterThan(100);
      
      // Should still return valid data
      expect(response.body.data.storageUsed).toBe(2200000000);
      expect(response.body.data.storageLimit).toBe(2147483648);
    });

    test('should require authentication', async () => {
      await request(strapi.server.httpServer)
        .get('/subscription/usage/dashboard')
        .expect(401);
    });

    test('should handle user without company', async () => {
      // Create user without company
      const roles = await strapi.entityService.findMany('plugin::users-permissions.role', {
        filters: { type: 'authenticated' }
      });

      const orphanUser = await strapi.entityService.create('plugin::users-permissions.user', {
        data: {
          username: 'orphanuser',
          email: 'orphan@example.com',
          password: 'testpassword123',
          confirmed: true,
          role: roles[0].id
          // No company assigned
        }
      });

      const authResponse = await request(strapi.server.httpServer)
        .post('/api/auth/local')
        .send({
          identifier: 'orphan@example.com',
          password: 'testpassword123'
        });

      const orphanToken = authResponse.body.jwt;

      const response = await request(strapi.server.httpServer)
        .get('/subscription/usage/dashboard')
        .set('Authorization', `Bearer ${orphanToken}`)
        .expect(400);

      expect(response.body.error).toMatchObject({
        message: 'User must be assigned to a company'
      });

      // Cleanup
      await strapi.entityService.delete('plugin::users-permissions.user', orphanUser.id);
    });

    test('should set appropriate cache headers', async () => {
      const response = await request(strapi.server.httpServer)
        .get('/subscription/usage/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers['cache-control']).toBe('public, max-age=60');
    });

    test('should handle multiple users in company correctly', async () => {
      // Create additional users for the company
      const roles = await strapi.entityService.findMany('plugin::users-permissions.role', {
        filters: { type: 'authenticated' }
      });

      const additionalUsers = [];
      for (let i = 0; i < 3; i++) {
        const user = await strapi.entityService.create('plugin::users-permissions.user', {
          data: {
            username: `additionaluser${i}`,
            email: `additional${i}@example.com`,
            password: 'testpassword123',
            confirmed: true,
            company: testCompany.id,
            role: roles[0].id
          }
        });
        additionalUsers.push(user);
      }

      const response = await request(strapi.server.httpServer)
        .get('/subscription/usage/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should count all users (original + 3 additional = 4 total)
      expect(response.body.data.userCount).toBe(4);

      // Calculate expected user percentage for professional plan (25 max users)
      const expectedUserPercentage = (4 / 25) * 100;
      expect(response.body.data.usagePercentages.users).toBeCloseTo(expectedUserPercentage, 1);

      // Cleanup additional users
      for (const user of additionalUsers) {
        await strapi.entityService.delete('plugin::users-permissions.user', user.id);
      }
    });

    test('should handle enterprise unlimited users correctly', async () => {
      await strapi.entityService.update('api::company.company', testCompany.id, {
        data: { plan_level: 'enterprise' }
      });

      const response = await request(strapi.server.httpServer)
        .get('/subscription/usage/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.planLimits.maxUsers).toBe(-1); // Unlimited
      expect(response.body.data.usagePercentages.users).toBe(0); // 0% for unlimited plans
    });

    test('should return correct upgrade URLs for each plan', async () => {
      // Test starter plan upgrade URL
      await strapi.entityService.update('api::company.company', testCompany.id, {
        data: { plan_level: 'starter' }
      });

      let response = await request(strapi.server.httpServer)
        .get('/subscription/usage/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.upgradeUrl).toBe('/billing/checkout?plan=professional');

      // Test professional plan upgrade URL
      await strapi.entityService.update('api::company.company', testCompany.id, {
        data: { plan_level: 'professional' }
      });

      response = await request(strapi.server.httpServer)
        .get('/subscription/usage/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.upgradeUrl).toBe('/billing/checkout?plan=enterprise');

      // Test enterprise plan (no upgrade available)
      await strapi.entityService.update('api::company.company', testCompany.id, {
        data: { plan_level: 'enterprise' }
      });

      response = await request(strapi.server.httpServer)
        .get('/subscription/usage/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.upgradeUrl).toBeNull();
    });
  });

  describe('Performance and Reliability', () => {
    test('should handle storage calculation failures gracefully', async () => {
      // This test simulates a scenario where storage calculation might fail
      // but the dashboard should still return data with cached storage values
      
      const response = await request(strapi.server.httpServer)
        .get('/subscription/usage/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should still return valid data even if storage calculation has issues
      expect(response.body.data).toHaveProperty('storageUsed');
      expect(response.body.data).toHaveProperty('storageLimit');
      expect(response.body.data.storageUsed).toBeGreaterThanOrEqual(0);
      expect(response.body.data.storageLimit).toBeGreaterThan(0);
    });

    test('should respond quickly for dashboard requests', async () => {
      const startTime = Date.now();
      
      await request(strapi.server.httpServer)
        .get('/subscription/usage/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const responseTime = Date.now() - startTime;
      
      // Dashboard should respond within 500ms for good user experience
      expect(responseTime).toBeLessThan(500);
    });

    test('should handle concurrent dashboard requests', async () => {
      const concurrentRequests = 10;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        const promise = request(strapi.server.httpServer)
          .get('/subscription/usage/dashboard')
          .set('Authorization', `Bearer ${authToken}`);
        promises.push(promise);
      }

      const responses = await Promise.all(promises);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.data.companyId).toBe(testCompany.id);
      });

      // All responses should have consistent data
      const firstResponse = responses[0].body.data;
      responses.forEach(response => {
        expect(response.body.data.companyId).toBe(firstResponse.companyId);
        expect(response.body.data.subscriptionStatus).toBe(firstResponse.subscriptionStatus);
        expect(response.body.data.planLevel).toBe(firstResponse.planLevel);
      });
    });
  });

  describe('Data Validation and Edge Cases', () => {
    test('should handle missing/null subscription fields gracefully', async () => {
      // Create company with minimal data
      const minimalCompany = await strapi.entityService.create('api::company.company', {
        data: {
          name: 'Minimal Company',
          company_id: 'minimal-company'
          // No subscription fields
        }
      });

      // Update user to belong to minimal company
      await strapi.entityService.update('plugin::users-permissions.user', testUser.id, {
        data: { company: minimalCompany.id }
      });

      const response = await request(strapi.server.httpServer)
        .get('/subscription/usage/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should provide defaults for missing fields
      expect(response.body.data).toMatchObject({
        subscriptionStatus: 'trial',
        planLevel: 'starter',
        storageUsed: 0,
        userCount: 1
      });

      expect(response.body.data.planLimits).toMatchObject({
        maxUsers: 5,
        storageLimit: 2147483648 // 2GB default
      });

      await strapi.entityService.delete('api::company.company', minimalCompany.id);
    });

    test('should handle invalid plan levels gracefully', async () => {
      // Set invalid plan level
      await strapi.entityService.update('api::company.company', testCompany.id, {
        data: { plan_level: 'invalid_plan' }
      });

      const response = await request(strapi.server.httpServer)
        .get('/subscription/usage/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should default to starter plan limits
      expect(response.body.data.planLimits).toMatchObject({
        maxUsers: 5,
        storageLimit: 2147483648,
        features: expect.arrayContaining(['Basic Support'])
      });
    });

    test('should validate data types in response', async () => {
      const response = await request(strapi.server.httpServer)
        .get('/subscription/usage/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const data = response.body.data;

      // Validate numeric fields
      expect(typeof data.companyId).toBe('number');
      expect(typeof data.storageUsed).toBe('number');
      expect(typeof data.storageLimit).toBe('number');
      expect(typeof data.userCount).toBe('number');

      // Validate string fields
      expect(typeof data.companyName).toBe('string');
      expect(typeof data.subscriptionStatus).toBe('string');
      expect(typeof data.planLevel).toBe('string');
      expect(typeof data.lastUpdated).toBe('string');

      // Validate nested objects
      expect(typeof data.planLimits).toBe('object');
      expect(typeof data.usagePercentages).toBe('object');
      expect(Array.isArray(data.planLimits.features)).toBe(true);

      // Validate percentage calculations
      expect(data.usagePercentages.storage).toBeGreaterThanOrEqual(0);
      expect(data.usagePercentages.users).toBeGreaterThanOrEqual(0);
    });
  });
}); 
 
 
 
 
 