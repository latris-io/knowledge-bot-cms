'use strict';

const request = require('supertest');

describe('Subscription Billing - Subscription Validation System', () => {
  let strapi;
  let activeCompany;
  let canceledCompany;
  let trialCompany;
  let overLimitCompany;

  beforeAll(async () => {
    strapi = global.strapi;
  });

  beforeEach(async () => {
    // Create companies with different subscription states
    activeCompany = await strapi.entityService.create('api::company.company', {
      data: {
        name: 'Active Subscription Company',
        company_id: 'active-subscription-company',
        subscription_status: 'active',
        plan_level: 'professional',
        storage_used_bytes: 5368709120, // 5GB
        storage_limit_bytes: 21474836480 // 20GB
      }
    });

    canceledCompany = await strapi.entityService.create('api::company.company', {
      data: {
        name: 'Canceled Subscription Company',
        company_id: 'canceled-subscription-company',
        subscription_status: 'canceled',
        plan_level: 'starter',
        storage_used_bytes: 1073741824, // 1GB
        storage_limit_bytes: 2147483648 // 2GB
      }
    });

    trialCompany = await strapi.entityService.create('api::company.company', {
      data: {
        name: 'Trial Company',
        company_id: 'trial-company-validation',
        subscription_status: 'trial',
        plan_level: 'starter',
        storage_used_bytes: 1073741824, // 1GB
        storage_limit_bytes: 2147483648 // 2GB
      }
    });

    overLimitCompany = await strapi.entityService.create('api::company.company', {
      data: {
        name: 'Over Limit Company',
        company_id: 'over-limit-company',
        subscription_status: 'active',
        plan_level: 'starter',
        storage_used_bytes: 2200000000, // 2.2GB (over 2GB limit)
        storage_limit_bytes: 2147483648 // 2GB
      }
    });

    // Clear cache before each test
    try {
      await request(strapi.server.httpServer)
        .post('/subscription/cache/clear')
        .send({});
    } catch (error) {
      // Cache clear might fail if service not ready, ignore
    }
  });

  afterEach(async () => {
    // Cleanup test companies
    const companies = [activeCompany, canceledCompany, trialCompany, overLimitCompany];
    
    for (const company of companies) {
      if (company) {
        try {
          await strapi.entityService.delete('api::company.company', company.id);
        } catch (error) {
          console.log(`Error cleaning up company ${company.id}:`, error.message);
        }
      }
    }
  });

  describe('POST /subscription/validate-daily', () => {
    test('should validate active subscription successfully', async () => {
      const response = await request(strapi.server.httpServer)
        .post('/subscription/validate-daily')
        .send({
          companyId: activeCompany.id,
          botId: 1
        })
        .expect(200);

      expect(response.body).toMatchObject({
        companyId: activeCompany.id,
        botId: 1,
        isValid: true,
        subscriptionStatus: 'active',
        planLevel: 'professional',
        storageUsed: 5368709120,
        storageLimit: 21474836480,
        userCount: 0,
        features: {
          aiChat: true,
          fileUpload: true,
          userManagement: true,
          customDomains: true
        }
      });

      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.cached).toBeFalsy(); // First call should not be cached
    });

    test('should reject canceled subscription', async () => {
      const response = await request(strapi.server.httpServer)
        .post('/subscription/validate-daily')
        .send({
          companyId: canceledCompany.id,
          botId: 1
        })
        .expect(200);

      expect(response.body).toMatchObject({
        companyId: canceledCompany.id,
        botId: 1,
        isValid: false,
        reason: 'Subscription inactive',
        subscriptionStatus: 'canceled',
        planLevel: 'starter'
      });
    });

    test('should reject when storage limit exceeded', async () => {
      const response = await request(strapi.server.httpServer)
        .post('/subscription/validate-daily')
        .send({
          companyId: overLimitCompany.id,
          botId: 1
        })
        .expect(200);

      expect(response.body).toMatchObject({
        companyId: overLimitCompany.id,
        botId: 1,
        isValid: false,
        reason: 'Storage limit exceeded',
        subscriptionStatus: 'active',
        storageUsed: 2200000000,
        storageLimit: 2147483648
      });
    });

    test('should validate trial subscription within limits', async () => {
      const response = await request(strapi.server.httpServer)
        .post('/subscription/validate-daily')
        .send({
          companyId: trialCompany.id,
          botId: 1
        })
        .expect(200);

      expect(response.body).toMatchObject({
        companyId: trialCompany.id,
        botId: 1,
        isValid: true,
        subscriptionStatus: 'trial',
        planLevel: 'starter',
        storageUsed: 1073741824,
        storageLimit: 2147483648,
        features: {
          aiChat: true,
          fileUpload: true,
          userManagement: true,
          customDomains: false
        }
      });
    });

    test('should return cached results on subsequent calls', async () => {
      // First call
      const response1 = await request(strapi.server.httpServer)
        .post('/subscription/validate-daily')
        .send({
          companyId: activeCompany.id,
          botId: 1
        })
        .expect(200);

      expect(response1.body.cached).toBeFalsy();

      // Second call should be cached
      const response2 = await request(strapi.server.httpServer)
        .post('/subscription/validate-daily')
        .send({
          companyId: activeCompany.id,
          botId: 1
        })
        .expect(200);

      expect(response2.body.cached).toBe(true);
      expect(response2.body.cacheAge).toBeGreaterThan(0);
      
      // Data should be identical except for cache info
      expect(response2.body.companyId).toBe(response1.body.companyId);
      expect(response2.body.isValid).toBe(response1.body.isValid);
      expect(response2.body.subscriptionStatus).toBe(response1.body.subscriptionStatus);
    });

    test('should validate required fields', async () => {
      // Missing botId
      const response1 = await request(strapi.server.httpServer)
        .post('/subscription/validate-daily')
        .send({
          companyId: activeCompany.id
        })
        .expect(400);

      expect(response1.body.error).toMatchObject({
        message: 'Company ID and Bot ID are required'
      });

      // Missing companyId
      const response2 = await request(strapi.server.httpServer)
        .post('/subscription/validate-daily')
        .send({
          botId: 1
        })
        .expect(400);

      expect(response2.body.error).toMatchObject({
        message: 'Company ID and Bot ID are required'
      });

      // Missing both
      await request(strapi.server.httpServer)
        .post('/subscription/validate-daily')
        .send({})
        .expect(400);
    });

    test('should handle non-existent company', async () => {
      const response = await request(strapi.server.httpServer)
        .post('/subscription/validate-daily')
        .send({
          companyId: 99999,
          botId: 1
        })
        .expect(404);

      expect(response.body.error).toMatchObject({
        message: 'Company not found'
      });
    });

    test('should handle invalid data types', async () => {
      // String instead of number for companyId
      await request(strapi.server.httpServer)
        .post('/subscription/validate-daily')
        .send({
          companyId: 'invalid',
          botId: 1
        })
        .expect(404); // Will be treated as company not found

      // String instead of number for botId (should still work)
      const response = await request(strapi.server.httpServer)
        .post('/subscription/validate-daily')
        .send({
          companyId: activeCompany.id,
          botId: 'string-bot-id'
        })
        .expect(200);

      expect(response.body.botId).toBe('string-bot-id'); // Should preserve original type
    });

    test('should not require authentication (external API)', async () => {
      // This endpoint should work without authentication as it's for external validation
      const response = await request(strapi.server.httpServer)
        .post('/subscription/validate-daily')
        .send({
          companyId: activeCompany.id,
          botId: 1
        })
        .expect(200);

      expect(response.body.isValid).toBe(true);
    });
  });

  describe('POST /subscription/validate-batch', () => {
    test('should validate multiple subscriptions in batch', async () => {
      const response = await request(strapi.server.httpServer)
        .post('/subscription/validate-batch')
        .send({
          validations: [
            { companyId: activeCompany.id, botId: 1 },
            { companyId: canceledCompany.id, botId: 2 },
            { companyId: overLimitCompany.id, botId: 3 },
            { companyId: trialCompany.id, botId: 4 }
          ]
        })
        .expect(200);

      expect(response.body.validations).toHaveLength(4);
      
      // Check active company validation
      expect(response.body.validations[0]).toMatchObject({
        companyId: activeCompany.id,
        botId: 1,
        isValid: true,
        subscriptionStatus: 'active'
      });

      // Check canceled company validation
      expect(response.body.validations[1]).toMatchObject({
        companyId: canceledCompany.id,
        botId: 2,
        isValid: false,
        subscriptionStatus: 'canceled'
      });

      // Check over limit company validation
      expect(response.body.validations[2]).toMatchObject({
        companyId: overLimitCompany.id,
        botId: 3,
        isValid: false,
        reason: 'Storage limit exceeded'
      });

      // Check trial company validation
      expect(response.body.validations[3]).toMatchObject({
        companyId: trialCompany.id,
        botId: 4,
        isValid: true,
        subscriptionStatus: 'trial'
      });
    });

    test('should handle empty validations array', async () => {
      const response = await request(strapi.server.httpServer)
        .post('/subscription/validate-batch')
        .send({
          validations: []
        })
        .expect(200);

      expect(response.body.validations).toEqual([]);
    });

    test('should require validations array', async () => {
      const response = await request(strapi.server.httpServer)
        .post('/subscription/validate-batch')
        .send({})
        .expect(400);

      expect(response.body.error).toMatchObject({
        message: 'Validations array is required'
      });
    });

    test('should handle mixed valid and invalid companies in batch', async () => {
      const response = await request(strapi.server.httpServer)
        .post('/subscription/validate-batch')
        .send({
          validations: [
            { companyId: activeCompany.id, botId: 1 },
            { companyId: 99999, botId: 2 }, // Non-existent company
            { companyId: canceledCompany.id, botId: 3 }
          ]
        })
        .expect(200);

      expect(response.body.validations).toHaveLength(3);
      
      // First should succeed
      expect(response.body.validations[0].isValid).toBe(true);
      
      // Second should have error
      expect(response.body.validations[1]).toHaveProperty('error');
      
      // Third should fail validation
      expect(response.body.validations[2].isValid).toBe(false);
    });

    test('should process batch requests efficiently', async () => {
      const startTime = Date.now();
      
      // Create a larger batch request
      const validations = [];
      for (let i = 0; i < 10; i++) {
        validations.push({
          companyId: activeCompany.id,
          botId: i + 1
        });
      }

      const response = await request(strapi.server.httpServer)
        .post('/subscription/validate-batch')
        .send({ validations })
        .expect(200);

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(response.body.validations).toHaveLength(10);
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      // All should be valid
      response.body.validations.forEach(validation => {
        expect(validation.isValid).toBe(true);
      });
    });
  });

  describe('Performance and Caching', () => {
    test('should demonstrate cache performance improvement', async () => {
      // Measure uncached request time
      const uncachedStart = Date.now();
      await request(strapi.server.httpServer)
        .post('/subscription/validate-daily')
        .send({
          companyId: activeCompany.id,
          botId: 999 // Unique to avoid interference
        })
        .expect(200);
      const uncachedTime = Date.now() - uncachedStart;

      // Measure cached request time
      const cachedStart = Date.now();
      const cachedResponse = await request(strapi.server.httpServer)
        .post('/subscription/validate-daily')
        .send({
          companyId: activeCompany.id,
          botId: 999
        })
        .expect(200);
      const cachedTime = Date.now() - cachedStart;

      expect(cachedResponse.body.cached).toBe(true);
      expect(cachedTime).toBeLessThan(uncachedTime); // Cached should be faster
      
      console.log(`Performance test: Uncached ${uncachedTime}ms, Cached ${cachedTime}ms`);
    });

    test('should handle concurrent requests without issues', async () => {
      const concurrentRequests = 20;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        const promise = request(strapi.server.httpServer)
          .post('/subscription/validate-daily')
          .send({
            companyId: activeCompany.id,
            botId: Math.floor(i / 5) + 1 // Group requests to test caching
          });
        promises.push(promise);
      }

      const responses = await Promise.all(promises);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.isValid).toBe(true);
        expect(response.body.companyId).toBe(activeCompany.id);
      });

      // Some should be cached
      const cachedResponses = responses.filter(r => r.body.cached);
      expect(cachedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Data Consistency and Edge Cases', () => {
    test('should handle past_due subscription status', async () => {
      // Update company to past_due status
      await strapi.entityService.update('api::company.company', activeCompany.id, {
        data: { subscription_status: 'past_due' }
      });

      // Clear cache to get fresh data
      await request(strapi.server.httpServer)
        .post('/subscription/cache/clear')
        .send({
          companyId: activeCompany.id,
          botId: 1
        });

      const response = await request(strapi.server.httpServer)
        .post('/subscription/validate-daily')
        .send({
          companyId: activeCompany.id,
          botId: 1
        })
        .expect(200);

      expect(response.body).toMatchObject({
        isValid: false,
        reason: 'Subscription inactive',
        subscriptionStatus: 'past_due'
      });
    });

    test('should handle unpaid subscription status', async () => {
      // Update company to unpaid status
      await strapi.entityService.update('api::company.company', trialCompany.id, {
        data: { subscription_status: 'unpaid' }
      });

      // Clear cache
      await request(strapi.server.httpServer)
        .post('/subscription/cache/clear')
        .send({});

      const response = await request(strapi.server.httpServer)
        .post('/subscription/validate-daily')
        .send({
          companyId: trialCompany.id,
          botId: 1
        })
        .expect(200);

      expect(response.body.isValid).toBe(true); // Unpaid should still be valid (grace period)
      expect(response.body.subscriptionStatus).toBe('unpaid');
    });

    test('should provide consistent features for different plan levels', async () => {
      const plans = ['starter', 'professional', 'enterprise'];
      const results = [];

      for (const plan of plans) {
        // Create company with specific plan
        const company = await strapi.entityService.create('api::company.company', {
          data: {
            name: `${plan} Plan Company`,
            company_id: `${plan}-plan-company`,
            subscription_status: 'active',
            plan_level: plan
          }
        });

        const response = await request(strapi.server.httpServer)
          .post('/subscription/validate-daily')
          .send({
            companyId: company.id,
            botId: 1
          })
          .expect(200);

        results.push({
          plan,
          features: response.body.features
        });

        await strapi.entityService.delete('api::company.company', company.id);
      }

      // Validate feature differences by plan
      expect(results[0].features.customDomains).toBe(false); // starter
      expect(results[1].features.customDomains).toBe(true);  // professional
      expect(results[2].features.customDomains).toBe(true);  // enterprise

      // All plans should have basic features
      results.forEach(result => {
        expect(result.features.aiChat).toBe(true);
        expect(result.features.fileUpload).toBe(true);
        expect(result.features.userManagement).toBe(true);
      });
    });
  });
}); 
 
 
 
 
 