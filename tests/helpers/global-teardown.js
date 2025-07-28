const fs = require('fs');
const path = require('path');

/**
 * Global teardown for Jest tests
 * Runs once after all test suites complete
 */
module.exports = async () => {
  console.log('🧹 Cleaning up test environment...');
  
  // Clean up test database
  const tempDir = path.join(__dirname, '..', 'temp');
  const testDbPath = path.join(tempDir, 'test.db');
  
  if (fs.existsSync(testDbPath)) {
    try {
      fs.unlinkSync(testDbPath);
      console.log('🗑️ Cleaned up test database');
    } catch (error) {
      console.warn('⚠️ Could not remove test database:', error.message);
    }
  }

  // Clean up temp directory if empty
  try {
    if (fs.existsSync(tempDir) && fs.readdirSync(tempDir).length === 0) {
      fs.rmdirSync(tempDir);
      console.log('📁 Removed empty temp directory');
    }
  } catch (error) {
    console.warn('⚠️ Could not remove temp directory:', error.message);
  }

  console.log('✅ Global test cleanup complete');
}; 
 
 
 
 
 