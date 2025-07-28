#!/usr/bin/env node

/**
 * Subscription Billing Test Runner
 * Runs comprehensive regression tests for the subscription billing system
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 SUBSCRIPTION BILLING SYSTEM - REGRESSION TEST SUITE');
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('');

const testFiles = [
  'test-billing-endpoints.test.js',
  'test-subscription-validation.test.js',
  'test-dashboard-widget.test.js',
  'test-billing-management.test.js'
];

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
let totalTime = 0;

async function runTestSuite(suite) {
  console.log(`📋 Running ${suite.name}`);
  console.log(`   ${suite.description}`);
  console.log('──────────────────────────────────────────────────');
  
  const startTime = Date.now();
  
  try {
    const result = execSync(
      `npx jest --config=tests/config/subscription-billing.config.js tests/integration/subscription/${suite.file} --verbose`,
      { 
        cwd: process.cwd(),
        stdio: 'pipe',
        encoding: 'utf8'
      }
    );
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    totalTime += duration;
    
    // Parse Jest output to extract test counts
    const lines = result.split('\n');
    const testLine = lines.find(line => line.includes('Tests:'));
    
    if (testLine) {
      const passed = parseInt(testLine.match(/(\d+) passed/)?.[1] || '0');
      const failed = parseInt(testLine.match(/(\d+) failed/)?.[1] || '0');
      
      totalTests += passed + failed;
      passedTests += passed;
      failedTests += failed;
      
      console.log(`✅ PASSED - ${passed}/${passed + failed} tests (${duration}ms)`);
    } else {
      console.log(`✅ PASSED (${duration}ms)`);
    }
    
    console.log('');
    return true;
    
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    totalTime += duration;
    
    console.log(`❌ FAILED (${duration}ms)`);
    console.log('Error output:');
    console.log(error.stdout || error.message);
    console.log('');
    
    failedTests += 1;
    return false;
  }
}

async function main() {
  console.log('🚀 Starting subscription billing regression tests...');
  console.log('');
  
  const results = [];
  
  for (const testFile of testFiles) {
    const testName = testFile.replace('.test.js', '').replace('test-', '');
    const result = await runTestSuite({ name: testName, file: testFile });
    results.push({ name: testName, file: testFile, passed: result });
  }
  
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('📊 SUBSCRIPTION BILLING REGRESSION TEST RESULTS');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('');
  
  results.forEach((result) => {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`${result.name.toUpperCase()}: ${status}`);
  });

  console.log('');
  console.log('──────────────────────────────────────────────────');
  console.log(`🏆 Overall Test Results:`);
  const passedCount = results.filter(r => r.passed).length;
  console.log(`   Test Suites: ${passedCount}/${results.length} passed (${((passedCount/results.length)*100).toFixed(1)}%)`);
  console.log('');
  
  if (passedCount === results.length) {
    console.log('🎉 ALL SUBSCRIPTION BILLING TESTS PASSED!');
    process.exit(0);
  } else {
    console.log(`❌ ${results.length - passedCount} TEST SUITE(S) FAILED - Please check the errors above`);
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
  });
} 
 
 
 
 
 