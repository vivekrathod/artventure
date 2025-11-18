import '@testing-library/jest-dom';
import { beforeAll, afterAll, afterEach } from 'vitest';
import * as dotenv from 'dotenv';
import { cleanupTestData } from './helpers/database';

// Load environment variables for testing
dotenv.config({ path: '.env.local' });

// Set test environment variables if not already set
if (!process.env.NEXT_PUBLIC_APP_URL) {
  process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
}

// Mock fetch globally if needed
global.fetch = global.fetch || fetch;

beforeAll(async () => {
  console.log('🧪 Test suite starting...');

  // Try to cleanup test data, but don't fail if network is unavailable
  try {
    console.log('🧹 Cleaning up old test data...');
    await cleanupTestData();
    console.log('✨ Test data cleaned');
  } catch (error: any) {
    // Network issues are common in CI environments, log but continue
    if (error.code === 'EAI_AGAIN' || error.message?.includes('fetch failed')) {
      console.warn('⚠️  Network unavailable for cleanup, skipping...');
    } else {
      console.error('Error during cleanup:', error.message);
    }
  }
});

afterAll(async () => {
  console.log('✅ Test suite completed');

  // Cleanup test data after tests complete
  try {
    console.log('🧹 Cleaning up test data...');
    await cleanupTestData();
    console.log('✨ Test data cleaned');
  } catch (error: any) {
    // Network issues are common in CI environments, log but continue
    if (error.code === 'EAI_AGAIN' || error.message?.includes('fetch failed')) {
      console.warn('⚠️  Network unavailable for cleanup, skipping...');
    } else {
      console.error('Error during cleanup:', error.message);
    }
  }
});

afterEach(() => {
  // Cleanup after each test
});
