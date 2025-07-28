const path = require('path');
const globalConfig = require('./jest.config');

module.exports = {
  ...globalConfig,
  displayName: 'Subscription Billing Tests',
  rootDir: path.resolve(__dirname, '../..'),
  testMatch: [
    '<rootDir>/tests/integration/subscription/**/*.test.js'
  ],
  collectCoverageFrom: [
    'src/extensions/users-permissions/controllers/billing.js',
    'src/extensions/users-permissions/controllers/subscription.js',
    'src/extensions/users-permissions/services/billing.js', 
    'src/extensions/users-permissions/services/subscription.js',
    'src/extensions/users-permissions/routes/billing.js',
    'src/extensions/users-permissions/routes/subscription.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 90,
      lines: 85,
      statements: 85
    }
  },
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/tests/helpers/test-setup.js']
}; 
 
 
 
 
 