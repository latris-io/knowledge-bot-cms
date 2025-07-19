module.exports = {
  testEnvironment: 'node',
  clearMocks: true,
  collectCoverage: false, // Disable coverage for faster execution
  testMatch: [
    '**/tests/integration/use-cases/*.test.js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/dist/'
  ],
  // NOTE: No setupFilesAfterEnv - this prevents Strapi initialization
  testTimeout: 10000, // Shorter timeout for unit tests
  verbose: true,
  roots: ['<rootDir>'],
  moduleFileExtensions: ['js', 'json'],
  transform: {},
  globals: {}
}; 