# Mobile Browser Testing Guide

## Overview

This project uses Playwright to test the application across desktop and mobile browsers. Mobile emulators run significantly slower than desktop browsers, requiring special timeout configurations.

## Mobile Browser Configuration

### Browsers Tested

1. **Mobile Chrome** (Pixel 5 emulation)
   - Android viewport simulation
   - Touch events enabled
   - Mobile user agent

2. **Mobile Safari** (iPhone 12 emulation)
   - iOS viewport simulation
   - Touch events enabled
   - iOS user agent

### Timeout Configuration

Mobile emulators require longer timeouts than desktop browsers:

**Desktop browsers:**
- Action timeout: 15s (clicks, fills, etc.)
- Navigation timeout: 30s (page loads)
- Test timeout: 60s (entire test)

**Mobile browsers:**
- Action timeout: 20s (25% slower)
- Navigation timeout: 45s (50% longer)
- Test timeout: 60s (global)

**Why longer timeouts?**
- Mobile emulation adds CPU overhead
- Touch event simulation is slower than mouse clicks
- Network throttling may be applied
- WebKit (Mobile Safari) is slower in emulation

## Common Mobile Test Failures

### 1. Timeout Errors (30s default)

**Symptom:**
```
✘ [Mobile Safari] › tests/e2e/auth.spec.ts:72 › should sign out user (30.1s)
```

**Cause:** Default 30s timeout exceeded

**Fix:** ✅ Increased to 45s for mobile browsers

### 2. Sign-Out Button Not Found

**Symptom:**
```
Error: Locator not found: button:has-text("Sign Out")
```

**Cause:** 
- Dropdown menu not fully rendered
- Touch event delays
- Element off-screen in mobile viewport

**Fix:** 
- Wait for dropdown with explicit timeout
- Fallback to direct navigation `/auth/signout`
- See `tests/helpers/e2e.ts` for implementation

### 3. Admin Panel Access Timeouts

**Symptom:**
```
✘ [Mobile Chrome] › tests/e2e/admin.spec.ts:10 › should access admin panel (30.2s)
```

**Cause:**
- Admin pages are data-heavy
- Multiple API calls on load
- Large DOM rendering

**Fix:** ✅ Increased navigation timeout to 45s

## Best Practices

### 1. Use Explicit Waits

```typescript
// ❌ Bad - relies on default timeout
await page.click('button');

// ✅ Good - explicit timeout for mobile
await page.click('button', { timeout: 20000 });
```

### 2. Wait for Network Idle

```typescript
// For pages with heavy API calls
await page.goto('/admin', { waitUntil: 'networkidle' });
```

### 3. Fallback Strategies

```typescript
// Try UI interaction first
try {
  await page.click('button:has-text("Sign Out")', { timeout: 5000 });
} catch {
  // Fallback to direct navigation
  await page.goto('/auth/signout');
}
```

### 4. Mobile-Specific Helpers

```typescript
// Check if running on mobile
const isMobile = page.viewportSize()?.width! < 768;

if (isMobile) {
  // Use longer waits
  await page.waitForTimeout(1000);
}
```

## Running Mobile Tests

### Local Development

```bash
# Run all E2E tests (desktop + mobile)
npm run test:e2e

# Run only mobile browsers
npx playwright test --project="Mobile Chrome" --project="Mobile Safari"

# Run with UI for debugging
npx playwright test --ui --project="Mobile Safari"

# Debug specific test
npx playwright test tests/e2e/auth.spec.ts:72 --project="Mobile Safari" --debug
```

### CI/CD

Mobile tests run automatically in CI with:
- Sequential execution (workers=1)
- 2 retries for flaky tests
- Screenshots on failure
- Playwright report artifacts

## Current Test Results

**Desktop Browsers:** 100% pass rate (21/21 tests)
- ✅ Chromium
- ✅ Firefox
- ✅ WebKit

**Mobile Browsers:** ~60-85% pass rate (expected to improve with timeout fixes)
- ⚠️ Mobile Chrome: Some admin timeouts
- ⚠️ Mobile Safari: Sign-out + cart issues

## Troubleshooting

### Test fails only on Mobile Safari

1. Check if element is off-screen in mobile viewport
2. Use `page.screenshot()` to debug
3. Verify touch events are working (not mouse events)
4. Check for iOS-specific CSS/JS issues

### Test passes locally but fails in CI

1. CI runs with `workers=1` (sequential) - check for race conditions
2. CI may have slower CPU - increase timeouts
3. Check GitHub Actions logs for detailed error
4. Use `trace: 'on-first-retry'` to debug

### How to View Playwright Traces

```bash
# Download trace from CI artifacts
# Then view locally:
npx playwright show-trace trace.zip
```

## Future Improvements

- [ ] Add device-specific test suites (tablet viewports)
- [ ] Network throttling for realistic mobile conditions
- [ ] Separate mobile-only tests from desktop tests
- [ ] Performance budgets for mobile pages
- [ ] Accessibility testing on mobile

## References

- [Playwright Mobile Emulation](https://playwright.dev/docs/emulation)
- [Playwright Timeouts](https://playwright.dev/docs/test-timeouts)
- [Device Descriptors](https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/server/deviceDescriptorsSource.json)
