# Progressive Web App (PWA) Implementation Guide

## Overview

Omni Sales has been configured as a Progressive Web App (PWA), enabling users to install it on their devices and use it offline. This document explains the implementation and how to use the PWA features.

## What is a PWA?

A Progressive Web App combines the best of web and mobile apps:

- ✅ **Installable**: Users can add the app to their home screen
- ✅ **Offline Support**: Works without internet connection
- ✅ **Fast Loading**: Cached resources load instantly
- ✅ **App-like Experience**: Runs in standalone mode without browser UI
- ✅ **Push Notifications**: Can receive notifications (optional)
- ✅ **Auto-updates**: Updates automatically when online

## Implementation Summary

### Files Created

1. **`/public/manifest.json`**
   - Web app manifest with metadata
   - Defines app name, colors, icons, and behavior
   - Includes shortcuts to key sections

2. **`/public/sw.js`**
   - Service worker for offline functionality
   - Implements caching strategies
   - Handles offline fallbacks
   - Supports background sync and push notifications

3. **`/app/offline/page.tsx`**
   - Offline fallback page
   - Shows when user is offline and no cached version exists
   - Includes retry functionality and connection status

4. **`/lib/pwa/register-sw.ts`**
   - Service worker registration logic
   - Handles updates and lifecycle events
   - Utility functions for PWA features

5. **`/components/InstallPWA.tsx`**
   - Install prompt component
   - Shows banner when app can be installed
   - Supports both Android/Desktop and iOS devices
   - Dismissible with session storage

6. **`/app/layout.tsx`** (Updated)
   - Added PWA metadata
   - Configured viewport and theme colors
   - Added service worker registration script

7. **`/components/DashboardLayout.tsx`** (Updated)
   - Includes InstallPWA component
   - Shows install prompt throughout the dashboard

8. **`/public/icons/README.md`**
   - Guide for creating and adding PWA icons
   - Instructions and tools recommendations

## Features Implemented

### 1. Offline Support

**How it works:**
- Static assets (HTML, CSS, JS) are cached on first visit
- API responses are cached with network-first strategy
- When offline, cached versions are served
- Offline page appears when no cached version exists

**Caching Strategies:**
- **Network First**: For API calls and dynamic content
- **Stale While Revalidate**: For static assets
- **Cache First**: For images and fonts

### 2. Install Prompt

**Desktop/Android:**
- Automatic banner appears when PWA criteria are met
- Can be dismissed (won't show again in same session)
- Floating install button available after dismissal
- One-click installation

**iOS:**
- Shows instructions modal
- Guides users through Safari's "Add to Home Screen"
- Detects iOS devices automatically

### 3. App Shortcuts

Pre-configured shortcuts in the manifest:
- Dashboard (แดชบอร์ด)
- Products (สินค้า)
- Orders (คำสั่งซื้อ)

Users can long-press the app icon to access these shortcuts.

### 4. Offline Indicator

The offline page (`/offline`) includes:
- Connection status indicator
- Retry button with loading state
- Automatic redirect when back online
- Troubleshooting tips
- Dark mode support

### 5. Theme Integration

- Light mode: `#2563eb` (blue-600)
- Dark mode: `#1e40af` (blue-800)
- Matches system preferences
- Updates browser UI color

## Configuration

### Manifest Settings

Location: `/public/manifest.json`

```json
{
  "name": "Omni Sales - ระบบจัดการขาย Omnichannel",
  "short_name": "Omni Sales",
  "theme_color": "#2563eb",
  "background_color": "#ffffff",
  "display": "standalone"
}
```

**Customization:**
- Change `theme_color` to match your brand
- Update `background_color` for splash screen
- Modify `shortcuts` array for different quick actions

### Service Worker Cache Version

Location: `/public/sw.js`

```javascript
const CACHE_VERSION = 'v1';
```

**To force cache update:**
1. Increment version (e.g., 'v2', 'v3')
2. Deploy changes
3. Old caches will be automatically cleared

### Production Only

Service worker only registers in **production mode**:

```typescript
// In /app/layout.tsx
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production')
```

**To test locally:**
1. Build for production: `npm run build`
2. Start production server: `npm start`
3. Or temporarily remove the NODE_ENV check

## Testing

### Test PWA Installation

**Chrome (Desktop/Android):**
1. Build and deploy to production
2. Open DevTools → Application → Manifest
3. Check "Installability" errors
4. Click "Add to Home Screen" or install icon in address bar

**Safari (iOS):**
1. Deploy to production (must be HTTPS)
2. Open in Safari
3. Tap Share → "Add to Home Screen"
4. Icon appears on home screen

**Edge/Brave:**
- Similar to Chrome
- Look for install icon in address bar

### Test Offline Functionality

1. Open app in browser
2. Open DevTools → Network tab
3. Change throttling to "Offline"
4. Navigate around the app
5. Verify cached pages load
6. Check offline page appears for uncached pages

### Lighthouse Audit

1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Select "Progressive Web App" category
4. Click "Generate report"
5. Aim for score > 90

**Common Issues:**
- ❌ Icons missing → Add icons to `/public/icons/`
- ❌ Not served over HTTPS → Deploy to production
- ❌ Service worker not registered → Check browser console

## Browser Support

| Browser | Install Support | Offline Support | Push Notifications |
|---------|----------------|-----------------|-------------------|
| Chrome (Desktop) | ✅ Yes | ✅ Yes | ✅ Yes |
| Chrome (Android) | ✅ Yes | ✅ Yes | ✅ Yes |
| Edge | ✅ Yes | ✅ Yes | ✅ Yes |
| Safari (iOS) | ⚠️ Manual | ✅ Yes | ❌ No |
| Safari (macOS) | ⚠️ Manual | ✅ Yes | ❌ No |
| Firefox | ⚠️ Limited | ✅ Yes | ✅ Yes |
| Samsung Internet | ✅ Yes | ✅ Yes | ✅ Yes |

⚠️ Manual = Requires manual "Add to Home Screen", no automatic prompt

## Next Steps

### 1. Add Icons (Required)

Follow the guide at `/public/icons/README.md` to create and add:
- icon-192x192.png
- icon-512x512.png
- apple-touch-icon.png (optional)
- favicon.ico (optional)

### 2. Add Screenshots (Optional)

Add to `/public/screenshots/`:
- desktop-1.png (1920×1080)
- mobile-1.png (750×1334)

Screenshots appear in app installation prompts.

### 3. Configure Push Notifications (Optional)

To enable push notifications:

1. Generate VAPID keys:
```bash
npx web-push generate-vapid-keys
```

2. Add keys to environment variables:
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
```

3. Use the subscription functions in `/lib/pwa/register-sw.ts`:
```typescript
import { subscribeToPushNotifications } from '@/lib/pwa/register-sw';

const subscription = await subscribeToPushNotifications(
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
);
```

### 4. Implement Background Sync (Optional)

For offline order syncing:

1. Store offline actions in IndexedDB
2. Register sync event:
```typescript
await registration.sync.register('sync-orders');
```

3. Implement sync logic in service worker (already has placeholder)

### 5. Update Service Worker

When you make changes to the service worker:

1. Increment `CACHE_VERSION` in `/public/sw.js`
2. Deploy changes
3. Users will be prompted to update on next visit

## Troubleshooting

### Issue: Service Worker Not Registering

**Solution:**
- Check browser console for errors
- Verify you're in production mode (`npm run build && npm start`)
- Ensure HTTPS (required for service workers)
- Clear browser cache and reload

### Issue: Install Prompt Not Showing

**Possible Causes:**
1. App already installed
2. Criteria not met (need HTTPS, icons, manifest)
3. Recently dismissed (session storage)
4. iOS device (shows manual instructions instead)

**Solution:**
- Run Lighthouse audit to check installability
- Check DevTools → Application → Manifest
- Clear session storage
- Verify icons exist

### Issue: Offline Page Not Appearing

**Solution:**
- Visit `/offline` directly first to cache it
- Check service worker is active: DevTools → Application → Service Workers
- Verify STATIC_ASSETS in `/public/sw.js` includes '/offline'

### Issue: Old Content Showing After Update

**Solution:**
- Increment CACHE_VERSION in service worker
- Use "Clear Cache" button (implement if needed)
- Hard reload: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

## Development vs Production

### Development Mode
- ❌ Service worker does NOT register
- ❌ Install prompt does NOT show
- ✅ Can test offline page directly
- ✅ Can test components in isolation

### Production Mode
- ✅ Service worker registers automatically
- ✅ Install prompt shows when criteria met
- ✅ Full offline functionality
- ✅ Background sync available

**To test PWA features in development:**
```bash
# Build for production
npm run build

# Start production server
npm start

# Or use production environment variable
NODE_ENV=production npm run dev
```

## Performance Tips

1. **Optimize Icons**
   - Use PNG compression (TinyPNG, ImageOptim)
   - Keep file sizes under 100KB each
   - Use proper dimensions (192x192, 512x512)

2. **Cache Management**
   - Regularly update CACHE_VERSION
   - Remove unused assets from STATIC_ASSETS
   - Limit cached API responses

3. **Service Worker Updates**
   - Users get updates automatically
   - Show update available notification
   - Prompt users to reload for new version

4. **Bundle Size**
   - Keep service worker file small
   - Avoid external dependencies in SW
   - Use efficient caching strategies

## Security Considerations

1. **HTTPS Required**
   - Service workers only work over HTTPS
   - Exception: localhost for development
   - Use Let's Encrypt for free SSL certificates

2. **Service Worker Scope**
   - Current scope: `/` (entire site)
   - Can be restricted to specific paths if needed
   - Defined in registration: `register('/sw.js', { scope: '/' })`

3. **Cache Validation**
   - Network-first for sensitive data
   - Don't cache authentication tokens
   - Implement cache expiration if needed

## Resources

### Official Documentation
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

### Tools
- [PWA Builder](https://www.pwabuilder.com/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Workbox](https://developers.google.com/web/tools/workbox) (Advanced caching)

### Testing
- [PWA Compat](https://github.com/GoogleChromeLabs/pwa-compat) (Polyfill)
- [Manifest Validator](https://manifest-validator.appspot.com/)
- [Service Worker Cookbook](https://serviceworke.rs/)

## Support

For issues or questions about the PWA implementation:

1. Check browser console for errors
2. Run Lighthouse audit for diagnostics
3. Review this documentation
4. Check `/public/icons/README.md` for icon issues
5. Verify all files are properly deployed

## Summary

Your Omni Sales app is now a fully functional Progressive Web App with:

- ✅ Web App Manifest configured
- ✅ Service Worker with offline support
- ✅ Install prompt (Android/Desktop/iOS)
- ✅ Offline fallback page
- ✅ Caching strategies implemented
- ✅ Dark mode support
- ✅ Thai language throughout
- ⏳ Icons needed (follow `/public/icons/README.md`)

**Next Action:** Add your app icons and deploy to production to test the full PWA experience!
