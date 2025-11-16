# Sentry Error Monitoring Integration

This document provides comprehensive information about the Sentry error monitoring integration in the Omni Sales application.

## Table of Contents

1. [Overview](#overview)
2. [Setup](#setup)
3. [Configuration](#configuration)
4. [Usage](#usage)
5. [API Examples](#api-examples)
6. [Breadcrumbs Tracking](#breadcrumbs-tracking)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Overview

Sentry is integrated into the application to provide:

- **Error Tracking**: Automatic capture of unhandled exceptions and errors
- **Performance Monitoring**: Track application performance and slow transactions
- **Session Replay**: Record user sessions when errors occur
- **Breadcrumbs**: Track user actions leading up to errors
- **Custom Context**: Add user, request, and application context to errors

## Setup

### 1. Create a Sentry Account

1. Go to [sentry.io](https://sentry.io) and create an account
2. Create a new project for your application
3. Select "Next.js" as the platform
4. Copy your DSN (Data Source Name)

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and update the values:

```bash
cp .env.example .env.local
```

Update the following variables in `.env.local`:

```env
# Required: Your Sentry DSN
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/your-project-id

# Optional: Environment name
NEXT_PUBLIC_SENTRY_ENVIRONMENT=development

# Optional: Performance monitoring sample rate (0.0 to 1.0)
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=1.0

# Optional: Enable Sentry (true/false)
NEXT_PUBLIC_SENTRY_ENABLED=true
```

### 3. Install Dependencies

Dependencies are already installed via `@sentry/nextjs` package.

### 4. Build and Run

```bash
npm run dev       # Development
npm run build     # Production build
npm run start     # Production server
```

## Configuration

### Environment-Specific Settings

The Sentry configuration automatically adjusts based on the environment:

**Development:**
- Traces Sample Rate: 100% (1.0)
- Replays: Disabled
- Console logging: Enabled

**Production:**
- Traces Sample Rate: 10% (0.1)
- Replays on Error: 100% (1.0)
- Session Replays: 10% (0.1)
- Console logging: Filtered

### Configuration Files

- **`/lib/sentry/config.ts`**: Environment-specific settings
- **`/lib/sentry/init.ts`**: Core initialization and utilities
- **`/sentry.client.config.ts`**: Client-side (browser) configuration
- **`/sentry.server.config.ts`**: Server-side (Node.js) configuration
- **`/next.config.ts`**: Next.js integration with Sentry

## Usage

### 1. Error Boundaries (React Components)

The root layout already includes an `ErrorBoundary` that catches React errors:

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Wrap components that might throw errors
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// With custom fallback UI
<ErrorBoundary fallback={<CustomErrorUI />}>
  <YourComponent />
</ErrorBoundary>

// With user feedback dialog
<ErrorBoundary showDialog>
  <YourComponent />
</ErrorBoundary>
```

### 2. Manual Error Capturing

```tsx
import { captureException, captureMessage } from '@/lib/sentry';

try {
  // Your code here
  throw new Error('Something went wrong');
} catch (error) {
  // Capture exception with context
  captureException(error, {
    tags: {
      feature: 'checkout',
      user_action: 'payment',
    },
    extra: {
      orderId: '12345',
      amount: 100.00,
    },
    level: 'error',
  });
}

// Capture informational messages
captureMessage('User completed checkout', {
  level: 'info',
  tags: { feature: 'checkout' },
});
```

### 3. User Context

Track which users experience errors:

```tsx
import { setSentryUser, clearSentryUser } from '@/lib/sentry';

// After user login
setSentryUser({
  id: user.id,
  email: user.email,
  username: user.name,
});

// After user logout
clearSentryUser();
```

### 4. Custom Tags and Context

```tsx
import { setSentryTags, setSentryContext } from '@/lib/sentry';

// Set tags (searchable in Sentry)
setSentryTags({
  feature: 'products',
  page: 'listing',
  view_mode: 'grid',
});

// Set custom context (additional data)
setSentryContext('shopping_cart', {
  items_count: 3,
  total_value: 299.99,
  currency: 'THB',
});
```

## API Examples

### Wrapping API Routes

Use the `withSentry` middleware to automatically capture errors in API routes:

```tsx
// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withSentry } from '@/lib/sentry';

export const GET = withSentry(async (req: NextRequest) => {
  // Your API logic here
  const products = await fetchProducts();
  
  return NextResponse.json({ products });
});

export const POST = withSentry(async (req: NextRequest) => {
  const body = await req.json();
  
  // Errors thrown here will be automatically captured
  const result = await createProduct(body);
  
  return NextResponse.json({ result });
});
```

### Type-Safe API Routes

```tsx
import { createAPIRoute } from '@/lib/sentry';

export const GET = createAPIRoute(async (req) => {
  // Return data directly - it will be wrapped in NextResponse.json()
  return {
    products: await fetchProducts(),
    total: 100,
  };
});
```

### Manual Error Response

```tsx
import { createErrorResponse } from '@/lib/sentry';

export async function GET(req: NextRequest) {
  try {
    const data = await fetchData();
    return NextResponse.json(data);
  } catch (error) {
    // Automatically captures error and returns formatted response
    return createErrorResponse(error as Error, 500);
  }
}
```

## Breadcrumbs Tracking

Breadcrumbs help you understand user actions leading up to an error.

### User Actions

```tsx
import { trackUserAction } from '@/lib/sentry';

// Button clicks
trackUserAction.click('checkout-button', {
  cart_value: 299.99,
  items_count: 3,
});

// Form submissions
trackUserAction.submit('contact-form', {
  form_type: 'inquiry',
});

// Search actions
trackUserAction.search('laptop', {
  category: 'electronics',
  filters: { price_max: 50000 },
});

// Filter changes
trackUserAction.filter('price_range', {
  min: 1000,
  max: 5000,
});
```

### API Calls

```tsx
import { trackAPICall } from '@/lib/sentry';

// Track API request
const startTime = Date.now();
trackAPICall.start('/api/products', 'GET');

try {
  const response = await fetch('/api/products');
  const duration = Date.now() - startTime;
  
  if (response.ok) {
    trackAPICall.success('/api/products', response.status, duration);
  } else {
    trackAPICall.error('/api/products', response.status, 'Request failed', duration);
  }
} catch (error) {
  trackAPICall.error('/api/products', 0, error.message);
}
```

### Navigation Events

```tsx
import { trackNavigation } from '@/lib/sentry';

// Track page navigation
trackNavigation.navigate('/products', '/products/123', 'push');

// Track route changes
trackNavigation.routeChange('/dashboard', { userId: '123' });

// Track external links
trackNavigation.externalLink('https://external-site.com');
```

### Data Operations

```tsx
import { trackDataOperation } from '@/lib/sentry';

// Track CRUD operations
trackDataOperation.fetch('products', { category: 'electronics' });
trackDataOperation.create('order', 'order-123');
trackDataOperation.update('user', 'user-456', ['email', 'name']);
trackDataOperation.delete('product', 'product-789');
```

### Authentication Events

```tsx
import { trackAuth } from '@/lib/sentry';

// Login/logout
trackAuth.login('email', 'user-123');
trackAuth.logout('user-123');
trackAuth.refresh();

// Auth errors
trackAuth.error('Invalid credentials', 'email');
```

### State Changes

```tsx
import { trackStateChange } from '@/lib/sentry';

// UI state changes
trackStateChange.theme('dark');
trackStateChange.language('th');
trackStateChange.modal('open', 'product-details');
```

### Performance Tracking

```tsx
import { trackPerformance } from '@/lib/sentry';

// Page load performance
const loadTime = Date.now() - navigationStart;
trackPerformance.pageLoad(loadTime, '/products');

// Component render performance
const renderTime = Date.now() - renderStart;
trackPerformance.componentRender('ProductList', renderTime);
```

## Best Practices

### 1. Add Context to Errors

Always provide relevant context when capturing errors:

```tsx
captureException(error, {
  tags: {
    feature: 'checkout',
    step: 'payment',
  },
  extra: {
    orderId: order.id,
    paymentMethod: order.paymentMethod,
    amount: order.total,
  },
});
```

### 2. Use Breadcrumbs Strategically

Track key user actions, but avoid over-tracking:

```tsx
// ✅ Good: Track important actions
trackUserAction.click('complete-purchase');

// ❌ Avoid: Too granular
trackUserAction.click('mouse-moved');
```

### 3. Sanitize Sensitive Data

Never send sensitive data to Sentry:

```tsx
// ❌ Bad: Contains sensitive data
captureException(error, {
  extra: {
    password: userInput.password,
    creditCard: userInput.cardNumber,
  },
});

// ✅ Good: Sanitized
captureException(error, {
  extra: {
    hasPassword: !!userInput.password,
    cardType: userInput.cardNumber.substring(0, 4),
  },
});
```

### 4. Use Appropriate Severity Levels

```tsx
captureMessage('User logged in', { level: 'info' });
captureMessage('API deprecated', { level: 'warning' });
captureException(error, { level: 'error' });
captureException(criticalError, { level: 'fatal' });
```

### 5. Filter Noise in Production

The configuration already filters common non-critical errors:
- Network errors
- Browser extension errors
- Cancelled requests
- ResizeObserver errors

### 6. Set User Context Early

Set user context as soon as authentication is established:

```tsx
// In your auth context or after login
useEffect(() => {
  if (user) {
    setSentryUser({
      id: user.id,
      email: user.email,
      username: user.name,
    });
  } else {
    clearSentryUser();
  }
}, [user]);
```

## Troubleshooting

### Sentry Not Capturing Errors

1. **Check if Sentry is enabled:**
   ```tsx
   import { isSentryConfigured } from '@/lib/sentry';
   
   console.log('Sentry configured:', isSentryConfigured());
   ```

2. **Verify DSN is set:**
   ```bash
   echo $NEXT_PUBLIC_SENTRY_DSN
   ```

3. **Check environment:**
   - In development, Sentry is disabled by default
   - Set `NEXT_PUBLIC_SENTRY_ENABLED=true` to enable in development

### Source Maps Not Working

1. **Add Sentry auth token to environment:**
   ```env
   SENTRY_AUTH_TOKEN=your-auth-token
   SENTRY_ORG=your-org-slug
   SENTRY_PROJECT=your-project-name
   ```

2. **Create auth token in Sentry:**
   - Go to Settings → Auth Tokens
   - Create new token with `project:releases` scope

### Too Many Events

1. **Adjust sample rates:**
   ```env
   NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1  # 10%
   ```

2. **Add more ignored errors in `/lib/sentry/config.ts`**

### Testing Sentry Integration

```tsx
// Test error capture
import { captureException } from '@/lib/sentry';

function TestSentry() {
  const testError = () => {
    try {
      throw new Error('Test error from Sentry integration');
    } catch (error) {
      captureException(error, {
        tags: { test: 'true' },
      });
    }
  };

  return <button onClick={testError}>Test Sentry</button>;
}
```

## Additional Resources

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Best Practices](https://docs.sentry.io/product/best-practices/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Session Replay](https://docs.sentry.io/product/session-replay/)

## Support

For issues or questions about the Sentry integration:

1. Check the Sentry dashboard for error details
2. Review this documentation
3. Contact the development team
