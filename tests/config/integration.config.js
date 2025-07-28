const path = require('path');

module.exports = {
  testEnvironment: 'node',
  displayName: 'Integration Tests',
  rootDir: path.resolve(__dirname, '../..'),
  testMatch: [
    '<rootDir>/tests/integration/**/*-integration.test.js'
  ],
  clearMocks: true,
  collectCoverageFrom: [
    'src/extensions/users-permissions/controllers/*.js',
    'src/extensions/users-permissions/services/*.js',
    'src/extensions/users-permissions/routes/*.js'
  ],
  coverageDirectory: 'coverage/integration',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },
  testTimeout: 10000, // 10 seconds should be enough for HTTP requests
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  // No setupFilesAfterEnv since we don't need Strapi instance setup
}; 
 
 
 
 
 