'use strict';

const request = require('supertest');

describe('Subscription Billing - Billing API Endpoints', () => {
  let strapi;
  let testCompany;
  let testUser;
  let authToken;

  beforeAll(async () => {
    strapi = global.strapi;
  });

  beforeEach(async () => {
    // Create test company with subscription fields
    testCompany = await strapi.entityService.create('api::company.company', {
      data: {
        name: 'Test Billing Company',
        company_id: 'test-billing-company-001',
        subscription_status: 'active',
        plan_level: 'professional',
        storage_used_bytes: 1073741824, // 1GB
        storage_limit_bytes: 21474836480, // 20GB
        stripe_customer_id: 'cus_test_customer',
        stripe_subscription_id: 'sub_test_subscription',
        current_period_start: new Date(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
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
        username: 'billingtestuser',
        email: 'billingtest@example.com',
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
        identifier: 'billingtest@example.com',
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

  describe('GET /billing/status/:companyId', () => {
    test('should return billing status for valid company with proper authentication', async () => {
      const response = await request(strapi.server.httpServer)
        .get(`/billing/status/${testCompany.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        companyId: testCompany.id,
        companyName: 'Test Billing Company',
        subscriptionStatus: 'active',
        planLevel: 'professional',
        storageUsed: 1073741824,
        storageLimit: 21474836480,
        userCount: 1
      });

      expect(response.body).toHaveProperty('currentPeriodStart');
      expect(response.body).toHaveProperty('currentPeriodEnd');
    });

    test('should return 404 for non-existent company', async () => {
      const response = await request(strapi.server.httpServer)
        .get('/billing/status/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toMatchObject({
        message: 'Company not found'
      });
    });

    test('should return 401 without authentication', async () => {
      await request(strapi.server.httpServer)
        .get(`/billing/status/${testCompany.id}`)
        .expect(401);
    });

    test('should handle company with default subscription values', async () => {
      // Create company with minimal data (testing defaults)
      const basicCompany = await strapi.entityService.create('api::company.company', {
        data: {
          name: 'Basic Company',
          company_id: 'basic-company-test'
        }
      });

      // Update user to belong to basic company
      await strapi.entityService.update('plugin::users-permissions.user', testUser.id, {
        data: { company: basicCompany.id }
      });

      const response = await request(strapi.server.httpServer)
        .get(`/billing/status/${basicCompany.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        companyId: basicCompany.id,
        subscriptionStatus: 'trial',
        planLevel: 'starter',
        storageUsed: 0,
        storageLimit: 2147483648, // 2GB default
        userCount: 1
      });

      await strapi.entityService.delete('api::company.company', basicCompany.id);
    });
  });

  describe('POST /billing/checkout', () => {
    test('should validate request body and require necessary fields', async () => {
      // Test missing fields
      await request(strapi.server.httpServer)
        .post('/billing/checkout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      // Test with only priceId
      await request(strapi.server.httpServer)
        .post('/billing/checkout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          priceId: 'price_test_professional'
        })
        .expect(400);

      // Test with only companyId
      await request(strapi.server.httpServer)
        .post('/billing/checkout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          companyId: testCompany.id
        })
        .expect(400);
    });

    test('should handle missing Stripe configuration gracefully', async () => {
      const originalKey = process.env.STRIPE_SECRET_KEY;
      delete process.env.STRIPE_SECRET_KEY;

      const response = await request(strapi.server.httpServer)
        .post('/billing/checkout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          priceId: 'price_test_professional',
          companyId: testCompany.id
        })
        .expect(400);

      expect(response.body.error).toMatchObject({
        message: 'Stripe not configured'
      });

      // Restore original key
      if (originalKey) {
        process.env.STRIPE_SECRET_KEY = originalKey;
      }
    });

    test('should handle non-existent company', async () => {
      await request(strapi.server.httpServer)
        .post('/billing/checkout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          priceId: 'price_test_professional',
          companyId: 99999
        })
        .expect(404);
    });

    test('should require authentication', async () => {
      await request(strapi.server.httpServer)
        .post('/billing/checkout')
        .send({
          priceId: 'price_test_professional',
          companyId: testCompany.id
        })
        .expect(401);
    });
  });

  describe('GET /billing/history/:companyId', () => {
    test('should return empty invoice history for company without Stripe customer', async () => {
      // Create company without Stripe customer ID
      const newCompany = await strapi.entityService.create('api::company.company', {
        data: {
          name: 'New Company',
          company_id: 'new-company-billing-test'
        }
      });

      // Update user to belong to new company
      await strapi.entityService.update('plugin::users-permissions.user', testUser.id, {
        data: { company: newCompany.id }
      });

      const response = await request(strapi.server.httpServer)
        .get(`/billing/history/${newCompany.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual({ invoices: [] });

      await strapi.entityService.delete('api::company.company', newCompany.id);
    });

    test('should require authentication', async () => {
      await request(strapi.server.httpServer)
        .get(`/billing/history/${testCompany.id}`)
        .expect(401);
    });

    test('should return empty array when Stripe is not configured', async () => {
      const originalKey = process.env.STRIPE_SECRET_KEY;
      delete process.env.STRIPE_SECRET_KEY;

      const response = await request(strapi.server.httpServer)
        .get(`/billing/history/${testCompany.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual({ invoices: [] });

      if (originalKey) {
        process.env.STRIPE_SECRET_KEY = originalKey;
      }
    });
  });

  describe('POST /billing/webhook', () => {
    test('should accept webhook without authentication (external endpoint)', async () => {
      const webhookPayload = {
        id: 'evt_test_webhook',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_test_subscription',
            customer: 'cus_test_customer',
            status: 'active'
          }
        }
      };

      // Webhook endpoint should accept requests without auth
      const response = await request(strapi.server.httpServer)
        .post('/billing/webhook')
        .send(webhookPayload)
        .expect(200);

      expect(response.body).toHaveProperty('received');
    });

    test('should handle malformed webhook data', async () => {
      const response = await request(strapi.server.httpServer)
        .post('/billing/webhook')
        .send({ invalid: 'data' })
        .expect(500);

      expect(response.body.error).toBeDefined();
    });

    test('should process different webhook event types', async () => {
      const eventTypes = [
        'customer.subscription.created',
        'customer.subscription.updated', 
        'customer.subscription.deleted',
        'invoice.payment_succeeded'
      ];

      for (const eventType of eventTypes) {
        const webhookPayload = {
          id: `evt_test_${eventType}`,
          type: eventType,
          data: {
            object: {
              id: 'sub_test_subscription',
              customer: 'cus_test_customer',
              status: 'active'
            }
          }
        };

        await request(strapi.server.httpServer)
          .post('/billing/webhook')
          .send(webhookPayload)
          .expect(200);
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle database connection errors gracefully', async () => {
      // This test would require mocking database errors
      // For now, we test that the endpoints don't crash on edge cases
      
      const response = await request(strapi.server.httpServer)
        .get(`/billing/status/${testCompany.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
    });

    test('should handle concurrent requests to same endpoint', async () => {
      const promises = [];
      const concurrentRequests = 10;

      for (let i = 0; i < concurrentRequests; i++) {
        const promise = request(strapi.server.httpServer)
          .get(`/billing/status/${testCompany.id}`)
          .set('Authorization', `Bearer ${authToken}`);
        promises.push(promise);
      }

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.companyId).toBe(testCompany.id);
      });
    });

    test('should validate JWT token properly', async () => {
      // Test with invalid token
      await request(strapi.server.httpServer)
        .get(`/billing/status/${testCompany.id}`)
        .set('Authorization', 'Bearer invalid.jwt.token')
        .expect(401);

      // Test with malformed authorization header
      await request(strapi.server.httpServer)
        .get(`/billing/status/${testCompany.id}`)
        .set('Authorization', 'InvalidFormat')
        .expect(401);
    });
  });
}); 
 
 
 
 
 