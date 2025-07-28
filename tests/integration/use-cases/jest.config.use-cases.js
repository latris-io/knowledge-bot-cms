module.exports = {
  testEnvironment: 'node',
  clearMocks: true,
  collectCoverage: false,
  testMatch: [
    '**/tests/integration/use-cases/*.test.js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/dist/'
  ],
  testTimeout: 30000,
  verbose: true,
  roots: ['<rootDir>'],
  moduleFileExtensions: ['js', 'json'],
  transform: {},
  globals: {}
}; 