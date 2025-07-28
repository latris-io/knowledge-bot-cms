const request = require('supertest');

/**
 * Integration Tests for Billing Endpoints
 * Tests billing functionality against a running Strapi server
 */

const BASE_URL = 'http://localhost:1337';

describe('Billing Endpoints Integration Tests', () => {
  let authToken;
  let testUser;
  let testCompany;

  beforeAll(async () => {
    // Test server availability
    const healthCheck = await request(BASE_URL)
      .get('/')
      .expect(302); // Should redirect to /admin
    
    console.log('✅ Server is running and accessible');
  });

  describe('Server Health and Billing Routes', () => {
    test('should have server running', async () => {
      const response = await request(BASE_URL)
        .get('/')
        .expect(302);
      
      expect(response.headers.location).toBe('/admin');
    });

    test('should respond to admin panel requests', async () => {
      const response = await request(BASE_URL)
        .get('/admin')
        .expect(200);
      
      expect(response.text).toContain('strapi');
    });

    // Test if billing management route exists (even without auth)
    test('should have billing management route available', async () => {
      const response = await request(BASE_URL)
        .get('/billing/management/overview')
        .expect(401); // Should require authentication
      
      expect(response.body.error).toBeDefined();
    });

    // Test if subscription routes exist
    test('should have subscription routes available', async () => {
      const response = await request(BASE_URL)
        .get('/subscription/usage/dashboard')
        .expect(401); // Should require authentication
      
      expect(response.body.error).toBeDefined();
    });
  });

  describe('API Endpoint Availability', () => {
    test('should have all required billing endpoints available', async () => {
      const endpoints = [
        '/billing/management/overview',
        '/billing/checkout/create',
        '/subscription/usage/dashboard'
      ];

      for (const endpoint of endpoints) {
        const response = await request(BASE_URL)
          .get(endpoint)
          .expect(401); // Should require auth but route should exist
        
        expect(response.body.error).toBeDefined();
        console.log(`✅ Endpoint ${endpoint} is available`);
      }
    });

    test('should have proper CORS headers', async () => {
      const response = await request(BASE_URL)
        .options('/billing/management/overview')
        .expect(204);
      
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });
  });

  describe('Error Responses', () => {
    test('should return proper error format for unauthorized requests', async () => {
      const response = await request(BASE_URL)
        .get('/billing/management/overview')
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
    });

    test('should handle non-existent routes gracefully', async () => {
      const response = await request(BASE_URL)
        .get('/billing/nonexistent/route')
        .expect(404);
      
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Content-Type Validation', () => {
    test('should accept JSON requests', async () => {
      const response = await request(BASE_URL)
        .post('/billing/checkout/create')
        .set('Content-Type', 'application/json')
        .send({ test: 'data' })
        .expect(401); // Auth required but should accept JSON
      
      expect(response.body.error).toBeDefined();
    });
  });
}); 
 
 
 
 
 