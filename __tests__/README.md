# Test Suite Documentation

This directory contains the comprehensive test suite for the Omni-Sales application.

## Test Structure

```
__tests__/
├── setup.ts                 # Jest test environment setup
├── factories.ts             # Test data factories
├── helpers/                 # Test utilities and helpers
│   ├── test-utils.ts       # General test utilities
│   └── api-mocks.ts        # API mocking utilities
├── utils/                   # Unit tests for lib/utils/
│   ├── cache.test.ts
│   ├── export.test.ts
│   └── ...
├── integration/             # API integration tests
│   ├── setup.ts
│   ├── api-orders.test.ts
│   └── api-products.test.ts
└── e2e/                     # End-to-end tests with Playwright
    ├── auth-login.spec.ts
    └── order-creation.spec.ts
```

## Running Tests

### Unit Tests
Run unit tests only (excludes integration tests):
```bash
npm run test:unit
```

Watch mode for development:
```bash
npm run test:watch
```

### Integration Tests
Run API integration tests:
```bash
npm run test:integration
```

### E2E Tests
Run end-to-end tests with Playwright:
```bash
npm run test:e2e
```

Run E2E tests in headed mode (see browser):
```bash
npm run test:e2e:headed
```

Debug E2E tests:
```bash
npm run test:e2e:debug
```

Interactive UI mode:
```bash
npm run test:e2e:ui
```

### Coverage Reports
Generate code coverage report:
```bash
npm run test:coverage
```

Coverage for unit tests only:
```bash
npm run test:coverage:unit
```

### Run All Tests
Run all test suites (unit, integration, and E2E):
```bash
npm run test:all
```

### CI/CD Tests
Run tests suitable for CI environment:
```bash
npm run test:ci
```

## Test Configuration

### Jest Configuration
- **jest.config.js** - Main configuration for unit tests
- **jest.integration.config.js** - Configuration for integration tests

### Playwright Configuration
- **playwright.config.ts** - E2E test configuration
- Supports Chrome, Firefox, Safari, and mobile viewports
- Automatic screenshots and videos on failure
- Trace collection for debugging

## Writing Tests

### Unit Tests

Use the test factories to create mock data:

```typescript
import { createMockOrderItem, createMockProduct } from '../factories';

describe('My Feature', () => {
  it('should work correctly', () => {
    const item = createMockOrderItem({ price: 100 });
    // Your test logic
  });
});
```

### Integration Tests

Mock API responses using the provided helpers:

```typescript
import { mockApiResponse, mockApiError } from './setup';

describe('API Integration', () => {
  it('should fetch data', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockApiResponse({ data: 'test' })
    );

    // Your test logic
  });
});
```

### E2E Tests

Write user-centric tests with Playwright:

```typescript
import { test, expect } from '@playwright/test';

test('user can create order', async ({ page }) => {
  await page.goto('/orders');
  await page.getByRole('button', { name: /create/i }).click();
  // More interactions...
});
```

## Test Utilities

### Test Factories (`factories.ts`)
- `createMockOrderItem()` - Generate order items
- `createMockProduct()` - Generate products
- `createMockStockLevel()` - Generate stock levels
- `mockFetchSuccess()` - Mock successful fetch
- `mockFetchError()` - Mock failed fetch

### Test Utilities (`helpers/test-utils.ts`)
- `sleep(ms)` - Async delay
- `retry(fn, options)` - Retry logic
- `waitForCondition()` - Wait for conditions
- `randomString()` - Generate random strings
- `expectThrowsAsync()` - Assert async errors
- `measureTime()` - Performance measurements

### API Mocks (`helpers/api-mocks.ts`)
- `createSuccessResponse()` - Create success response
- `createErrorResponse()` - Create error response
- `mockPaginatedResponse()` - Mock pagination
- `createMockSupabaseClient()` - Mock Supabase
- `createMockStripeClient()` - Mock Stripe

## Coverage Thresholds

The test suite maintains minimum coverage thresholds:
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

Coverage reports are generated in the `coverage/` directory.

## Best Practices

1. **Isolate Tests**: Each test should be independent
2. **Use Factories**: Use test factories for consistent data
3. **Mock External APIs**: Always mock external dependencies
4. **Descriptive Names**: Use clear, descriptive test names
5. **Arrange-Act-Assert**: Follow the AAA pattern
6. **Clean Up**: Reset mocks and state after each test
7. **Test Edge Cases**: Cover error scenarios and edge cases

## Debugging Tests

### Debug Unit Tests
```bash
npm run test:verbose
```

### Debug Integration Tests
Add `debugger` statements and run:
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Debug E2E Tests
Use Playwright's debug mode:
```bash
npm run test:e2e:debug
```

Or use the UI mode for interactive debugging:
```bash
npm run test:e2e:ui
```

## CI/CD Integration

The test suite is designed for CI/CD pipelines:
- Fast feedback with parallel execution
- Automatic retries for flaky E2E tests
- JSON reporters for result parsing
- Screenshot/video capture on failures

## Troubleshooting

### Tests Running Slowly
- Use `test:unit` instead of `test:all` during development
- Run specific test files: `jest path/to/test.ts`
- Increase test timeout if needed

### Flaky E2E Tests
- Check for race conditions
- Use proper waits instead of fixed delays
- Enable retries in Playwright config
- Review screenshots/videos in `test-results/`

### Coverage Issues
- Ensure all new code has tests
- Check `coverage/lcov-report/index.html` for details
- Focus on critical paths first

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
