#!/usr/bin/env node

/**
 * Run All Use Case Regression Tests
 * 
 * This script executes all use case tests and provides a comprehensive summary
 * Usage: node tests/integration/use-cases/run-all-use-case-tests.js
 */

const { execSync } = require('child_process');
const path = require('path');

// Use case test files
const useCases = [
  {
    id: 'UC-001',
    name: 'User Validation and Management',
    file: 'test-uc001-user-validation.test.js',
    description: 'Bot/Company validation, JWT generation, widget instructions'
  },
  {
    id: 'UC-002', 
    name: 'Toast Notification System',
    file: 'test-uc002-toast-notifications.test.js',
    description: 'File upload notifications, validation errors, batching'
  },
  {
    id: 'UC-003',
    name: 'JWT Token Generation and Widget Instructions', 
    file: 'test-uc003-jwt-widget.test.js',
    description: 'Complete HTML widget code, CMS platform support'
  },
  {
    id: 'UC-004',
    name: 'File Upload Processing and User Assignment',
    file: 'test-uc004-file-upload.test.js', 
    description: 'Metadata assignment, file-event creation'
  },
  {
    id: 'UC-005',
    name: 'AI Chat Interface',
    file: 'test-uc005-ai-chat.test.js',
    description: 'Streaming responses, intelligent spacing, source extraction'
  }
];

// ANSI color codes for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printHeader() {
  console.log('');
  console.log('═'.repeat(80));
  console.log(colorize('🧪 KNOWLEDGE BOT - USE CASE REGRESSION TESTS', 'cyan'));
  console.log('═'.repeat(80));
  console.log('');
}

function printUseCaseHeader(useCase) {
  console.log(colorize(`📋 Running ${useCase.id}: ${useCase.name}`, 'bright'));
  console.log(colorize(`   ${useCase.description}`, 'white'));
  console.log('─'.repeat(50));
}

async function runUseCaseTest(useCase) {
  const testFile = path.join(__dirname, useCase.file);
  
  try {
    // Check if test file exists
    require.resolve(testFile);
    
    // Run the test using Jest with custom config (no Strapi setup)
    const command = `npx jest --config=tests/integration/use-cases/jest.config.use-cases.js "${testFile}" --verbose`;
    const output = execSync(command, { 
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    // Parse Jest output for summary
    const lines = output.split('\n');
    const summaryLine = lines.find(line => line.includes('Tests:') && line.includes('passed'));
    const passedMatch = summaryLine?.match(/(\d+) passed/);
    const totalMatch = summaryLine?.match(/(\d+) total/);
    
    const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
    const total = totalMatch ? parseInt(totalMatch[1]) : 0;
    const failed = total - passed;
    
    return {
      success: failed === 0,
      passed,
      total,
      failed,
      output: output
    };
    
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      return {
        success: false,
        error: 'Test file not found',
        message: `Test file ${useCase.file} does not exist`
      };
    } else {
      // Parse Jest failure output
      const output = error.stdout || error.message;
      const lines = output.split('\n');
      const summaryLine = lines.find(line => line.includes('Tests:'));
      
      let passed = 0, total = 0, failed = 0;
      if (summaryLine) {
        const passedMatch = summaryLine.match(/(\d+) passed/);
        const failedMatch = summaryLine.match(/(\d+) failed/);
        passed = passedMatch ? parseInt(passedMatch[1]) : 0;
        failed = failedMatch ? parseInt(failedMatch[1]) : 0;
        total = passed + failed;
      }
      
      return {
        success: false,
        passed,
        total, 
        failed,
        output: output,
        error: 'Test execution failed'
      };
    }
  }
}

function printResults(results) {
  console.log('');
  console.log('═'.repeat(80));
  console.log(colorize('📊 USE CASE REGRESSION TEST RESULTS', 'cyan'));
  console.log('═'.repeat(80));
  console.log('');
  
  let totalPassed = 0;
  let totalTests = 0;
  let totalUseCasesPassed = 0;
  
  results.forEach(({ useCase, result }) => {
    const status = result.success ? 
      colorize('✅ PASSED', 'green') : 
      colorize('❌ FAILED', 'red');
    
    if (result.error) {
      console.log(`${useCase.id}: ${status} - ${colorize(result.error, 'red')}`);
      if (result.message) {
        console.log(`    ${result.message}`);
      }
    } else {
      const successRate = result.total > 0 ? Math.round((result.passed / result.total) * 100) : 0;
      console.log(`${useCase.id}: ${status} - ${result.passed}/${result.total} tests (${successRate}%)`);
      console.log(`    ${useCase.name}`);
      
      totalPassed += result.passed;
      totalTests += result.total;
      
      if (result.success) {
        totalUseCasesPassed++;
      }
    }
  });
  
  console.log('');
  console.log('─'.repeat(50));
  
  const overallSuccessRate = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;
  const useCaseSuccessRate = Math.round((totalUseCasesPassed / useCases.length) * 100);
  
  console.log(colorize(`🏆 Overall Test Results:`, 'bright'));
  console.log(`   Individual Tests: ${totalPassed}/${totalTests} passed (${overallSuccessRate}%)`);
  console.log(`   Use Cases: ${totalUseCasesPassed}/${useCases.length} passed (${useCaseSuccessRate}%)`);
  
  if (useCaseSuccessRate === 100) {
    console.log('');
    console.log(colorize('🎉 ALL USE CASES PASSED! System is ready for production.', 'green'));
  } else if (useCaseSuccessRate >= 80) {
    console.log('');
    console.log(colorize('⚠️  MOSTLY PASSING - Some issues need attention before production.', 'yellow'));
  } else {
    console.log('');
    console.log(colorize('🚨 CRITICAL ISSUES - System needs significant fixes before production.', 'red'));
  }
  
  console.log('');
}

async function main() {
  printHeader();
  
  console.log(colorize('Running regression tests for all documented use cases...', 'white'));
  console.log('');
  
  const results = [];
  
  for (const useCase of useCases) {
    printUseCaseHeader(useCase);
    
    const result = await runUseCaseTest(useCase);
    results.push({ useCase, result });
    
    if (result.success) {
      console.log(colorize('✅ PASSED', 'green'));
    } else {
      console.log(colorize('❌ FAILED', 'red'));
      if (result.error && result.error !== 'Test execution failed') {
        console.log(colorize(`   Error: ${result.error}`, 'red'));
      }
    }
    console.log('');
  }
  
  printResults(results);
  
  // Exit with appropriate code
  const allPassed = results.every(r => r.result.success);
  process.exit(allPassed ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error(colorize('❌ Fatal error running use case tests:', 'red'), error);
    process.exit(1);
  });
}

module.exports = { runUseCaseTest, useCases }; 