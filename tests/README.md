# Test Suite Documentation

This directory contains comprehensive automated tests for the ArtVenture e-commerce platform.

## Test Structure

```
tests/
├── setup.ts              # Global test setup
├── helpers/              # Test utilities
│   ├── api.ts           # API request helpers
│   ├── database.ts      # Database test helpers (used by all tests)
│   └── e2e.ts           # E2E-specific helpers (user creation/signin)
├── unit/                 # Unit tests
│   ├── slug.test.ts     # Slug generation tests
│   └── cart-store.test.ts # Cart store logic tests
├── api/                  # API integration tests
│   ├── products.test.ts # Products API tests
│   ├── cart.test.ts     # Cart API tests
│   └── checkout.test.ts # Checkout API tests
└── e2e/                  # End-to-end tests
    ├── auth.spec.ts     # Authentication flow tests
    ├── shopping.spec.ts # Shopping flow tests
    └── admin.spec.ts    # Admin panel tests
```

## Test Types

### Unit Tests
- **Location**: `tests/unit/`
- **Purpose**: Test individual functions and components in isolation
- **Run**: `npm test -- unit`
- **Coverage**: Utility functions, store logic, helpers

### API Integration Tests
- **Location**: `tests/api/`
- **Purpose**: Test API endpoints with real database
- **Run**: `npm test -- api`
- **Coverage**: All `/api/*` routes, validation, error handling

### E2E Tests (End-to-End)
- **Location**: `tests/e2e/`
- **Purpose**: Test complete user workflows in browser
- **Run**: `npm run test:e2e`
- **Coverage**: Full user journeys, UI interactions

## Prerequisites

### 1. Install Dependencies

```bash
npm install
```

This installs:
- `vitest` - Fast unit test framework
- `@testing-library/react` - React component testing
- `@playwright/test` - E2E testing framework
- Coverage tools

### 2. Environment Variables

Create `.env.local` with test database credentials:

```bash
# Required for all tests
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Required for E2E tests
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional
STRIPE_SECRET_KEY=sk_test_...
RESEND_API_KEY=re_...
```

⚠️ **Important**: Use a **test database**, not production!

### 3. Test Database Setup

1. Create a separate Supabase project for testing
2. Run `supabase-schema.sql` to set up tables
3. **User creation is automatic** - E2E tests create users via Supabase Admin API
   - No need to manually create test users
   - Admin users are created automatically for admin tests
   - Test users are cleaned up after each test

### 4. Install Playwright Browsers

```bash
npx playwright install
```

## Running Tests

### All Tests
```bash
npm run test:all
```

### Unit + API Tests (Vitest)
```bash
npm test
```

### Watch Mode (for development)
```bash
npm test -- --watch
```

### With UI (visual test runner)
```bash
npm run test:ui
```

### Coverage Report
```bash
npm run test:coverage
```

### E2E Tests (Playwright)
```bash
npm run test:e2e
```

### E2E with UI (visual browser)
```bash
npm run test:e2e:ui
```

### E2E Debug Mode
```bash
npm run test:e2e:debug
```

### Run Specific Test File
```bash
npm test -- tests/unit/slug.test.ts
npm run test:e2e -- tests/e2e/auth.spec.ts
```

### Run Tests by Pattern
```bash
npm test -- -t "should add item to cart"
npm run test:e2e -- -g "authentication"
```

## Test Database Cleanup

Tests automatically clean up test data, but you can manually clean:

```sql
-- Delete test products
DELETE FROM product_images WHERE product_id IN (
  SELECT id FROM products WHERE slug LIKE 'test-%'
);
DELETE FROM products WHERE slug LIKE 'test-%';

-- Delete test users
DELETE FROM profiles WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'test-%'
);
-- Then delete from Supabase Auth UI
```

## Writing New Tests

### Unit Test Example

```typescript
// tests/unit/my-function.test.ts
import { describe, it, expect } from 'vitest';

describe('myFunction', () => {
  it('should do something', () => {
    const result = myFunction(input);
    expect(result).toBe(expected);
  });
});
```

### API Test Example

```typescript
// tests/api/my-endpoint.test.ts
import { describe, it, expect } from 'vitest';
import { apiRequest } from '../helpers/api';

describe('POST /api/my-endpoint', () => {
  it('should return success', async () => {
    const { status, data } = await apiRequest('/api/my-endpoint', {
      method: 'POST',
      body: JSON.stringify({ foo: 'bar' }),
    });

    expect(status).toBe(200);
    expect(data).toHaveProperty('success');
  });
});
```

### E2E Test Example

```typescript
// tests/e2e/my-flow.spec.ts
import { test, expect } from '@playwright/test';
import { createAndSignInUser, cleanupUser } from '../helpers/e2e';

test('should complete user flow', async ({ page }) => {
  // Create user via admin API and sign in
  const { user } = await createAndSignInUser(page);

  await page.goto('/');
  await page.click('text=Click Me');
  await expect(page).toHaveURL('/expected-page');

  // Cleanup
  await cleanupUser(user.id);
});
```

**Available E2E Helpers** (`tests/helpers/e2e.ts`):
- `createAndSignInUser(page, email?)` - Create regular user via admin API and sign them in
- `createAndSignInAdmin(page)` - Create admin user via admin API and sign them in
- `signOut(page)` - Sign out current user
- `cleanupUser(userId)` - Delete test user after test completes

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm test

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.TEST_SUPABASE_KEY }}
```

## Test Coverage Goals

| Category | Goal | Current |
|----------|------|---------|
| Unit Tests | 80%+ | TBD |
| API Tests | 100% critical paths | TBD |
| E2E Tests | All user journeys | TBD |

## Common Issues

### "Cannot connect to database"
- Check `.env.local` has correct Supabase credentials
- Verify test database is accessible

### "Port 3000 already in use"
- Kill existing Next.js dev server: `lsof -ti:3000 | xargs kill -9`
- Or use different port in playwright.config.ts

### "Timeout waiting for page"
- Increase timeout in playwright.config.ts
- Check dev server is running
- Verify NEXT_PUBLIC_APP_URL is correct

### "Test data not cleaning up"
- Call `cleanupTestData()` in afterAll hooks
- Manually run cleanup SQL

## Best Practices

### DO
✅ Clean up test data in `afterAll` hooks
✅ Use descriptive test names
✅ Test both success and failure cases
✅ Mock external services (Stripe, Resend) in unit tests
✅ Use real services in E2E tests
✅ Keep tests independent and isolated
✅ Use `data-testid` attributes for stable selectors

### DON'T
❌ Use production database for tests
❌ Hardcode passwords or secrets
❌ Leave test data in database
❌ Make tests depend on each other
❌ Test implementation details
❌ Skip error case testing

## Debugging Tests

### Vitest Debug
```bash
# Add debugger statement in test
npm test -- --inspect-brk

# Then open chrome://inspect in Chrome
```

### Playwright Debug
```bash
# Debug mode (opens headed browser)
npm run test:e2e:debug

# Or add this to test
await page.pause();
```

### Visual Debugging
```bash
# Vitest UI
npm run test:ui

# Playwright UI
npm run test:e2e:ui
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Test-Driven Development Guide](https://testdriven.io/)

## Contributing

When adding new features:
1. Write tests first (TDD)
2. Ensure all tests pass
3. Add tests to this directory
4. Update this README if needed
5. Run `npm run test:coverage` and check coverage

---

**Last Updated**: Test suite created with comprehensive coverage
**Maintainer**: Development Team
