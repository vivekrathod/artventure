import '@testing-library/jest-dom';
import { beforeAll, afterAll, afterEach } from 'vitest';
import * as dotenv from 'dotenv';

// Load environment variables for testing
dotenv.config({ path: '.env.local' });

// Set test environment variables if not already set
if (!process.env.NEXT_PUBLIC_APP_URL) {
  process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
}

// Mock fetch globally if needed
global.fetch = global.fetch || fetch;

beforeAll(() => {
  console.log('🧪 Test suite starting...');
});

afterAll(() => {
  console.log('✅ Test suite completed');
});

afterEach(() => {
  // Cleanup after each test
});
