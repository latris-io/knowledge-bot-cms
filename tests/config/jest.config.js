module.exports = {
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/tests/'
  ],
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/dist/'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/helpers/test-setup.js'],
  testTimeout: 10000,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  globals: {
    strapi: true
  }
}; 