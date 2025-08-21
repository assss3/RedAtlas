#!/usr/bin/env ts-node

import { execSync } from 'child_process';

const runTests = () => {
  console.log('🧪 Running Red Atlas Express Tests\n');

  try {
    // Run unit tests
    console.log('📋 Running Unit Tests...');
    execSync('npm run test:unit', { stdio: 'inherit' });
    
    console.log('\n✅ All tests passed!\n');
    
    // Generate coverage report
    console.log('📊 Generating Coverage Report...');
    execSync('npm run test:coverage', { stdio: 'inherit' });
    
  } catch (error) {
    console.error('\n❌ Tests failed!');
    process.exit(1);
  }
};

if (require.main === module) {
  runTests();
}