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
  console.log('🧹 Cleaning up old test data...');
  await cleanupTestData();
  console.log('✨ Test data cleaned');
});

afterAll(() => {
  console.log('✅ Test suite completed');
});

afterEach(() => {
  // Cleanup after each test
});
