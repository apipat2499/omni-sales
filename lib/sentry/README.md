# Sentry Integration - Quick Reference

## Quick Start

### 1. Set Environment Variables

```bash
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_SENTRY_ENABLED=true
```

### 2. Import and Use

```tsx
import {
  captureException,
  captureMessage,
  setSentryUser,
  trackUserAction,
} from '@/lib/sentry';
```

## Common Usage Patterns

### Error Capturing

```tsx
// Try-catch
try {
  riskyOperation();
} catch (error) {
  captureException(error, {
    tags: { feature: 'checkout' },
    extra: { orderId: '123' },
  });
}

// Manual message
captureMessage('Important event occurred', {
  level: 'info',
});
```

### API Routes

```tsx
import { withSentry } from '@/lib/sentry';

export const GET = withSentry(async (req) => {
  // Your code here
  return NextResponse.json({ data });
});
```

### User Tracking

```tsx
// After login
setSentryUser({
  id: user.id,
  email: user.email,
});

// After logout
clearSentryUser();
```

### Breadcrumbs

```tsx
// User actions
trackUserAction.click('button-name');
trackUserAction.submit('form-name');

// API calls
trackAPICall.start('/api/endpoint', 'GET');
trackAPICall.success('/api/endpoint', 200, 150);

// Navigation
trackNavigation.navigate('/from', '/to');
```

## Files Structure

```
lib/sentry/
├── config.ts          # Environment configuration
├── init.ts            # Core utilities
├── middleware.ts      # API route wrappers
├── breadcrumbs.ts     # Breadcrumb tracking
└── index.ts           # Main exports

components/
└── ErrorBoundary.tsx  # React error boundary

Root files:
├── sentry.client.config.ts    # Client-side setup
├── sentry.server.config.ts    # Server-side setup
└── instrumentation.ts         # Next.js instrumentation
```

## Documentation

See `/SENTRY_INTEGRATION.md` for complete documentation.
