const { createStrapi } = require('@strapi/strapi');
const fs = require('fs');
const path = require('path');

let instance;

/**
 * Setups Strapi for testing
 */
async function setupStrapi() {
  if (!instance) {
    // Ensure temp directory exists
    const tempDir = path.join(__dirname, '..', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Set up test environment - this is critical for config loading
    process.env.NODE_ENV = 'test';
    
    // Clear any existing test database
    const testDbPath = path.join(tempDir, 'test.db');
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    try {
      // Create Strapi instance - use test environment configuration
      instance = await createStrapi({
        appDir: path.join(__dirname, '..', '..'),
        distDir: path.join(__dirname, '..', '..', 'dist'),
        autoReload: false,
        serveAdminPanel: false
      }).load();

      // Make strapi available globally
      global.strapi = instance;
      
      console.log('✅ Strapi test instance created successfully');
    } catch (error) {
      console.error('❌ Failed to create Strapi test instance:', error);
      throw error;
    }
  }

  return instance;
}

/**
 * Cleanup Strapi after testing
 */
async function cleanupStrapi() {
  if (instance) {
    await instance.destroy();
    instance = null;
    global.strapi = null;
  }

  // Clean up test database
  const testDb = path.join(__dirname, '..', 'temp', 'test.db');
  if (fs.existsSync(testDb)) {
    fs.unlinkSync(testDb);
  }
}

/**
 * Create authenticated request for API testing
 */
async function createAuthenticatedRequest(app) {
  const supertest = require('supertest');
  const request = supertest(app);

  // Create admin user for testing
  const adminUser = {
    email: 'admin@test.com',
    password: 'testpassword123',
    username: 'admin'
  };

  // Register admin user
  await request.post('/api/auth/local/register').send(adminUser);

  // Login to get JWT token
  const loginResponse = await request.post('/api/auth/local').send({
    identifier: adminUser.email,
    password: adminUser.password
  });

  const token = loginResponse.body.jwt;

  return {
    request,
    token,
    authenticatedRequest: (method, url) => {
      return request[method](url).set('Authorization', `Bearer ${token}`);
    }
  };
}

/**
 * Create test API client
 */
function createTestApiClient(token) {
  const supertest = require('supertest');
  const request = supertest(strapi.server.httpServer);

  return {
    get: (url) => request.get(url).set('Authorization', `Bearer ${token}`),
    post: (url, data) => request.post(url).set('Authorization', `Bearer ${token}`).send(data),
    put: (url, data) => request.put(url).set('Authorization', `Bearer ${token}`).send(data),
    delete: (url) => request.delete(url).set('Authorization', `Bearer ${token}`),
    
    // Preference-specific methods
    getPreferences: (companyId, botId, userEmail) => {
      return request
        .get(`/api/user-notification-preferences/by-user/${companyId}/${botId}/${userEmail}`)
        .set('Authorization', `Bearer ${token}`);
    },
    
    upsertPreferences: (data) => {
      return request
        .post('/api/user-notification-preferences/upsert')
        .set('Authorization', `Bearer ${token}`)
        .send(data);
    },
    
    createPreferences: (data) => {
      return request
        .post('/api/user-notification-preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({ data });
    },
    
    updatePreferences: (id, data) => {
      return request
        .put(`/api/user-notification-preferences/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ data });
    },
    
    deletePreferences: (id) => {
      return request
        .delete(`/api/user-notification-preferences/${id}`)
        .set('Authorization', `Bearer ${token}`);
    }
  };
}

/**
 * Generate test data
 */
function generateTestData() {
  return {
    validPreference: {
      company: 1,
      bot: 1,
      user_email: 'test@example.com',
      notification_enabled: true,
      batch_size_threshold: 5,
      notification_delay_minutes: 30,
      email_format: 'html',
      include_success_details: true,
      include_error_details: true
    },
    
    invalidPreference: {
      company: 1,
      bot: 1,
      user_email: 'invalid-email',
      notification_enabled: 'not-boolean',
      batch_size_threshold: 0, // Below minimum
      notification_delay_minutes: 2000, // Above maximum
      email_format: 'invalid-format',
      include_success_details: 'not-boolean',
      include_error_details: 'not-boolean'
    },
    
    preferenceUpdates: {
      notification_enabled: false,
      batch_size_threshold: 10,
      notification_delay_minutes: 60,
      email_format: 'text',
      include_success_details: false,
      include_error_details: false
    }
  };
}

module.exports = {
  setupStrapi,
  cleanupStrapi,
  createAuthenticatedRequest,
  createTestApiClient,
  generateTestData
}; 