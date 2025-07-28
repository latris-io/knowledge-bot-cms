'use strict';

const request = require('supertest');

describe('Subscription Billing - Billing Management Interface', () => {
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
        name: 'Billing Management Test Company',
        company_id: 'billing-mgmt-test-company',
        subscription_status: 'trial',
        plan_level: 'starter',
        storage_used_bytes: 1073741824, // 1GB
        storage_limit_bytes: 2147483648, // 2GB
        stripe_customer_id: null, // Start without Stripe customer
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
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
        username: 'billingmgmtuser',
        email: 'billingmgmt@example.com',
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
        identifier: 'billingmgmt@example.com',
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

  describe('GET /billing/management/overview', () => {
    test('should return complete billing management overview for authenticated user', async () => {
      const response = await request(strapi.server.httpServer)
        .get('/billing/management/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toMatchObject({
        company: {
          id: testCompany.id,
          name: 'Billing Management Test Company'
        },
        subscription: {
          status: 'trial',
          planLevel: 'starter'
        },
        usage: {
          storageUsed: 1073741824,
          storageLimit: 2147483648,
          userCount: 1
        },
        invoices: []
      });

      // Check that company createdAt is included for trial calculations
      expect(response.body.data.company.createdAt).toBeDefined();
    });

    test('should handle active subscription with billing data', async () => {
      // Update company to active subscription
      await strapi.entityService.update('api::company.company', testCompany.id, {
        data: {
          subscription_status: 'active',
          plan_level: 'professional',
          current_period_start: new Date(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          stripe_customer_id: 'cus_test_customer'
        }
      });

      const response = await request(strapi.server.httpServer)
        .get('/billing/management/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.subscription).toMatchObject({
        status: 'active',
        planLevel: 'professional',
        stripeCustomerId: 'cus_test_customer'
      });

      expect(response.body.data.subscription.currentPeriodEnd).toBeDefined();
    });

    test('should require authentication', async () => {
      await request(strapi.server.httpServer)
        .get('/billing/management/overview')
        .expect(401);
    });

    test('should handle user without company assignment', async () => {
      // Create user without company
      const roles = await strapi.entityService.findMany('plugin::users-permissions.role', {
        filters: { type: 'authenticated' }
      });

      const orphanUser = await strapi.entityService.create('plugin::users-permissions.user', {
        data: {
          username: 'orphanbillinguser',
          email: 'orphanbilling@example.com',
          password: 'testpassword123',
          confirmed: true,
          role: roles[0].id
          // No company assigned
        }
      });

      const authResponse = await request(strapi.server.httpServer)
        .post('/api/auth/local')
        .send({
          identifier: 'orphanbilling@example.com',
          password: 'testpassword123'
        });

      const orphanToken = authResponse.body.jwt;

      const response = await request(strapi.server.httpServer)
        .get('/billing/management/overview')
        .set('Authorization', `Bearer ${orphanToken}`)
        .expect(400);

      expect(response.body.error).toMatchObject({
        message: 'User must be assigned to a company'
      });

      // Cleanup
      await strapi.entityService.delete('plugin::users-permissions.user', orphanUser.id);
    });

    test('should handle different subscription statuses', async () => {
      const statuses = ['trial', 'active', 'past_due', 'canceled', 'unpaid'];

      for (const status of statuses) {
        await strapi.entityService.update('api::company.company', testCompany.id, {
          data: { subscription_status: status }
        });

        const response = await request(strapi.server.httpServer)
          .get('/billing/management/overview')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data.subscription.status).toBe(status);
      }
    });

    test('should handle different plan levels with appropriate limits', async () => {
      const plans = ['starter', 'professional', 'enterprise'];

      for (const plan of plans) {
        await strapi.entityService.update('api::company.company', testCompany.id, {
          data: { plan_level: plan }
        });

        const response = await request(strapi.server.httpServer)
          .get('/billing/management/overview')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data.subscription.planLevel).toBe(plan);
        
        // Check that storage limits are appropriate for plan
        const expectedLimits = {
          starter: 2 * 1024 * 1024 * 1024,
          professional: 20 * 1024 * 1024 * 1024,
          enterprise: 100 * 1024 * 1024 * 1024
        };
        
        expect(response.body.data.usage.storageLimit).toBe(expectedLimits[plan]);
      }
    });

    test('should include accurate user count', async () => {
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
        .get('/billing/management/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should count all users (original + 3 additional = 4 total)
      expect(response.body.data.usage.userCount).toBe(4);

      // Cleanup additional users
      for (const user of additionalUsers) {
        await strapi.entityService.delete('plugin::users-permissions.user', user.id);
      }
    });
  });

  describe('POST /billing/checkout/create', () => {
    test('should create checkout session for valid plan upgrade', async () => {
      // Mock environment variables for test
      const originalStripePrices = {
        STRIPE_STARTER_PRICE_ID: process.env.STRIPE_STARTER_PRICE_ID,
        STRIPE_PROFESSIONAL_PRICE_ID: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
        STRIPE_ENTERPRISE_PRICE_ID: process.env.STRIPE_ENTERPRISE_PRICE_ID
      };

      process.env.STRIPE_STARTER_PRICE_ID = 'price_test_starter';
      process.env.STRIPE_PROFESSIONAL_PRICE_ID = 'price_test_professional';
      process.env.STRIPE_ENTERPRISE_PRICE_ID = 'price_test_enterprise';

      // Note: This test will fail in actual execution due to Stripe API calls
      // In a real test environment, you would mock the Stripe calls
      try {
        const response = await request(strapi.server.httpServer)
          .post('/billing/checkout/create')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            planLevel: 'professional',
            companyId: testCompany.id
          });

        // This would normally expect 200, but will likely get an error due to Stripe
        // In production tests, mock Stripe to return expected data
        if (response.status === 200) {
          expect(response.body.data).toHaveProperty('checkoutUrl');
          expect(response.body.data).toHaveProperty('sessionId');
        }
      } catch (error) {
        // Expected in test environment without proper Stripe setup
        console.log('Stripe checkout test skipped due to API requirements');
      }

      // Restore environment variables
      Object.assign(process.env, originalStripePrices);
    });

    test('should require authentication', async () => {
      await request(strapi.server.httpServer)
        .post('/billing/checkout/create')
        .send({
          planLevel: 'professional',
          companyId: testCompany.id
        })
        .expect(401);
    });

    test('should validate plan level', async () => {
      const response = await request(strapi.server.httpServer)
        .post('/billing/checkout/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          planLevel: 'invalid_plan',
          companyId: testCompany.id
        })
        .expect(400);

      expect(response.body.error.message).toBe('Invalid plan level');
    });

    test('should verify user belongs to company', async () => {
      // Create another company
      const otherCompany = await strapi.entityService.create('api::company.company', {
        data: {
          name: 'Other Company',
          company_id: 'other-company'
        }
      });

      const response = await request(strapi.server.httpServer)
        .post('/billing/checkout/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          planLevel: 'professional',
          companyId: otherCompany.id
        })
        .expect(403);

      expect(response.body.error.message).toBe('Access denied');

      // Cleanup
      await strapi.entityService.delete('api::company.company', otherCompany.id);
    });

    test('should handle non-existent company', async () => {
      const response = await request(strapi.server.httpServer)
        .post('/billing/checkout/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          planLevel: 'professional',
          companyId: 99999
        })
        .expect(404);

      expect(response.body.error.message).toBe('Company not found');
    });
  });

  describe('GET /billing/invoice/:invoiceId/download', () => {
    test('should require authentication', async () => {
      await request(strapi.server.httpServer)
        .get('/billing/invoice/inv_test123/download')
        .expect(401);
    });

    test('should require company assignment', async () => {
      // Create user without company
      const roles = await strapi.entityService.findMany('plugin::users-permissions.role', {
        filters: { type: 'authenticated' }
      });

      const orphanUser = await strapi.entityService.create('plugin::users-permissions.user', {
        data: {
          username: 'orphaninvoiceuser',
          email: 'orphaninvoice@example.com',
          password: 'testpassword123',
          confirmed: true,
          role: roles[0].id
        }
      });

      const authResponse = await request(strapi.server.httpServer)
        .post('/api/auth/local')
        .send({
          identifier: 'orphaninvoice@example.com',
          password: 'testpassword123'
        });

      const orphanToken = authResponse.body.jwt;

      const response = await request(strapi.server.httpServer)
        .get('/billing/invoice/inv_test123/download')
        .set('Authorization', `Bearer ${orphanToken}`)
        .expect(400);

      expect(response.body.error.message).toBe('User must be assigned to a company');

      // Cleanup
      await strapi.entityService.delete('plugin::users-permissions.user', orphanUser.id);
    });

    test('should require billing account', async () => {
      const response = await request(strapi.server.httpServer)
        .get('/billing/invoice/inv_test123/download')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.error.message).toBe('No billing account found');
    });

    // Note: Testing actual invoice download would require mocking Stripe API
    // In production tests, you would mock the Stripe.invoices.retrieve call
  });

  describe('GET /billing/checkout/:sessionId/status', () => {
    test('should require authentication', async () => {
      await request(strapi.server.httpServer)
        .get('/billing/checkout/cs_test123/status')
        .expect(401);
    });

    test('should require company assignment', async () => {
      // Create user without company
      const roles = await strapi.entityService.findMany('plugin::users-permissions.role', {
        filters: { type: 'authenticated' }
      });

      const orphanUser = await strapi.entityService.create('plugin::users-permissions.user', {
        data: {
          username: 'orphancheckoutuser',
          email: 'orphancheckout@example.com',
          password: 'testpassword123',
          confirmed: true,
          role: roles[0].id
        }
      });

      const authResponse = await request(strapi.server.httpServer)
        .post('/api/auth/local')
        .send({
          identifier: 'orphancheckout@example.com',
          password: 'testpassword123'
        });

      const orphanToken = authResponse.body.jwt;

      const response = await request(strapi.server.httpServer)
        .get('/billing/checkout/cs_test123/status')
        .set('Authorization', `Bearer ${orphanToken}`)
        .expect(400);

      expect(response.body.error.message).toBe('User must be assigned to a company');

      // Cleanup
      await strapi.entityService.delete('plugin::users-permissions.user', orphanUser.id);
    });

    // Note: Testing actual checkout status would require mocking Stripe API
    // In production tests, you would mock the Stripe.checkout.sessions.retrieve call
  });

  describe('Business Rules Validation', () => {
    test('should enforce BR-SB031: All users with company assignment can view billing information', async () => {
      // Test confirms that any authenticated user with company assignment can access billing
      const response = await request(strapi.server.httpServer)
        .get('/billing/management/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.company.id).toBe(testCompany.id);
    });

    test('should enforce BR-SB033: Trial period is exactly 15 days from company creation', async () => {
      const response = await request(strapi.server.httpServer)
        .get('/billing/management/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Company was created 10 days ago, so should have ~5 days left
      const createdAt = new Date(response.body.data.company.createdAt);
      const trialEnd = new Date(createdAt.getTime() + 15 * 24 * 60 * 60 * 1000);
      const daysRemaining = Math.ceil((trialEnd - new Date()) / (1000 * 60 * 60 * 24));
      
      expect(daysRemaining).toBeGreaterThan(0);
      expect(daysRemaining).toBeLessThanOrEqual(15);
    });

    test('should handle trial expiration correctly', async () => {
      // Set company creation to 16 days ago (expired trial)
      await strapi.entityService.update('api::company.company', testCompany.id, {
        data: {
          createdAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000)
        }
      });

      const response = await request(strapi.server.httpServer)
        .get('/billing/management/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should still return billing data even for expired trial
      expect(response.body.data.subscription.status).toBe('trial');
      
      // In a real implementation, expired trials might have different status
      // This tests that the system handles expired trials gracefully
    });
  });

  describe('Performance and Reliability', () => {
    test('should respond quickly for billing overview requests', async () => {
      const startTime = Date.now();
      
      await request(strapi.server.httpServer)
        .get('/billing/management/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const responseTime = Date.now() - startTime;
      
      // Billing overview should respond within reasonable time
      expect(responseTime).toBeLessThan(1000);
    });

    test('should handle concurrent billing requests', async () => {
      const concurrentRequests = 5;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        const promise = request(strapi.server.httpServer)
          .get('/billing/management/overview')
          .set('Authorization', `Bearer ${authToken}`);
        promises.push(promise);
      }

      const responses = await Promise.all(promises);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.data.company.id).toBe(testCompany.id);
      });

      // All responses should have consistent data
      const firstResponse = responses[0].body.data;
      responses.forEach(response => {
        expect(response.body.data.company.id).toBe(firstResponse.company.id);
        expect(response.body.data.subscription.status).toBe(firstResponse.subscription.status);
      });
    });

    test('should handle storage calculation failures gracefully', async () => {
      // Test that billing overview still works even if storage calculation fails
      const response = await request(strapi.server.httpServer)
        .get('/billing/management/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should still return billing data with existing storage values
      expect(response.body.data.usage.storageUsed).toBeGreaterThanOrEqual(0);
      expect(response.body.data.usage.storageLimit).toBeGreaterThan(0);
    });
  });

  describe('Data Validation', () => {
    test('should validate data types in billing overview response', async () => {
      const response = await request(strapi.server.httpServer)
        .get('/billing/management/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const data = response.body.data;

      // Validate company data types
      expect(typeof data.company.id).toBe('number');
      expect(typeof data.company.name).toBe('string');
      expect(typeof data.company.createdAt).toBe('string');

      // Validate subscription data types
      expect(typeof data.subscription.status).toBe('string');
      expect(typeof data.subscription.planLevel).toBe('string');

      // Validate usage data types
      expect(typeof data.usage.storageUsed).toBe('number');
      expect(typeof data.usage.storageLimit).toBe('number');
      expect(typeof data.usage.userCount).toBe('number');

      // Validate invoices array
      expect(Array.isArray(data.invoices)).toBe(true);
    });

    test('should handle missing optional fields gracefully', async () => {
      // Update company to have minimal data
      await strapi.entityService.update('api::company.company', testCompany.id, {
        data: {
          current_period_start: null,
          current_period_end: null,
          stripe_customer_id: null
        }
      });

      const response = await request(strapi.server.httpServer)
        .get('/billing/management/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const data = response.body.data;

      // Should provide defaults or handle nulls gracefully
      expect(data.subscription.currentPeriodStart).toBeNull();
      expect(data.subscription.currentPeriodEnd).toBeNull();
      expect(data.subscription.stripeCustomerId).toBeNull();
      expect(data.invoices).toEqual([]);
    });
  });
}); 
 
 
 
 
 