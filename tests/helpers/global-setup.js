const fs = require('fs');
const path = require('path');

/**
 * Global setup for Jest tests
 * Runs once before all test suites
 */
module.exports = async () => {
  console.log('🚀 Setting up test environment...');
  
  // Ensure temp directory exists
  const tempDir = path.join(__dirname, '..', 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    console.log('📁 Created test temp directory:', tempDir);
  }

  // Clean up any existing test database
  const testDbPath = path.join(tempDir, 'test.db');
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
    console.log('🗑️ Removed existing test database');
  }

  // Set test environment
  process.env.NODE_ENV = 'test';
  
  console.log('✅ Global test setup complete');
}; 
 
 
 
 
 