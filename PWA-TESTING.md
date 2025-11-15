# PWA Testing Quick Guide

This guide helps you quickly test the PWA features of Omni Sales.

## Before Testing

### 1. Convert Placeholder Icons to PNG

The `/public/icons/` directory contains SVG placeholders. Convert them to PNG:

**Option A: Online Converter**
1. Visit https://cloudconvert.com/svg-to-png
2. Upload `icon-192x192.svg` and `icon-512x512.svg`
3. Convert with these settings:
   - Width: 192px (for first), 512px (for second)
   - Height: 192px (for first), 512px (for second)
4. Download and save as `icon-192x192.png` and `icon-512x512.png`

**Option B: Command Line (ImageMagick)**
```bash
cd public/icons
convert icon-192x192.svg icon-192x192.png
convert icon-512x512.svg icon-512x512.png
```

**Option C: Use Your Own Icons**
Follow the detailed guide in `/public/icons/README.md`

### 2. Build for Production

```bash
npm run build
npm start
```

Or deploy to a production environment (Vercel, Netlify, etc.)

## Testing Checklist

### ✅ Manifest Validation

1. Open Chrome DevTools (F12)
2. Go to **Application** tab
3. Click **Manifest** in left sidebar
4. Verify:
   - ✅ Name: "Omni Sales - ระบบจัดการขาย Omnichannel"
   - ✅ Short name: "Omni Sales"
   - ✅ Start URL: "/"
   - ✅ Theme color: "#2563eb"
   - ✅ Display: "standalone"
   - ✅ Icons show correctly (192×192, 512×512)

### ✅ Service Worker

1. Still in DevTools → **Application** tab
2. Click **Service Workers** in left sidebar
3. Verify:
   - ✅ Status: "Activated and running"
   - ✅ Source: /sw.js
   - ✅ Scope: /

4. Check **Cache Storage**:
   - ✅ Cache named "omni-sales-v1" exists
   - ✅ Contains static assets

### ✅ Installability

1. In DevTools → **Application** tab
2. Look at **Manifest** section
3. Check "Installability" section
4. Should show: **"Page is installable"** ✅

If errors appear:
- Fix each error listed
- Common issues: missing icons, not HTTPS, manifest errors

### ✅ Install Prompt (Desktop/Android)

**On Desktop (Chrome/Edge):**
1. Visit your production site
2. Look for install icon in address bar (desktop icon or ⊕)
3. Or check for install banner at bottom of page
4. Click to install
5. Verify app opens in standalone window

**On Android (Chrome):**
1. Visit your production site
2. Tap menu (⋮) → "Add to Home screen"
3. Or wait for automatic banner
4. Verify icon appears on home screen
5. Tap icon to open app

### ✅ Install on iOS

1. Open Safari on iPhone/iPad
2. Visit your production site
3. Tap Share button (square with arrow)
4. Scroll and tap "Add to Home Screen"
5. Verify icon on home screen
6. Open app (should run in standalone mode)

### ✅ Offline Functionality

**Test Offline Page:**
1. Visit the app online
2. Open DevTools → **Network** tab
3. Change throttling to **Offline**
4. Try to navigate to a new page you haven't visited
5. Should see offline page with:
   - "คุณออฟไลน์อยู่" message
   - Connection status indicator
   - Retry button
   - Troubleshooting tips

**Test Cached Pages:**
1. Visit Dashboard, Products, Orders while online
2. Go offline (Network tab → Offline)
3. Navigate to previously visited pages
4. Pages should load from cache instantly

**Test API Caching:**
1. Load data while online
2. Go offline
3. Reload the page
4. Cached API data should still display

### ✅ App Shortcuts (Android)

1. Install the app
2. Long-press the app icon
3. Verify shortcuts appear:
   - แดชบอร์ด (Dashboard)
   - สินค้า (Products)
   - คำสั่งซื้อ (Orders)
4. Tap a shortcut to test

### ✅ Theme Color

**Light Mode:**
1. Open app
2. Look at browser/status bar color
3. Should be blue (#2563eb)

**Dark Mode:**
1. Enable system dark mode
2. Reload app
3. Status bar should be darker blue (#1e40af)

### ✅ Update Flow

1. Make a change to the service worker
2. Increment CACHE_VERSION in `/public/sw.js`:
   ```javascript
   const CACHE_VERSION = 'v2'; // was 'v1'
   ```
3. Deploy the update
4. Visit the app (keep DevTools open)
5. Should see console log: "New service worker found"
6. Reload the page
7. New version should activate

## Lighthouse PWA Audit

### Run Audit

1. Open Chrome DevTools
2. Go to **Lighthouse** tab
3. Select:
   - ✅ Progressive Web App
   - ✅ Best practices (optional)
   - ✅ Performance (optional)
4. Click **"Generate report"**

### Target Scores

- **PWA Score**: ≥ 90 (Aim for 100)
- **Performance**: ≥ 90
- **Best Practices**: ≥ 90

### Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "Does not register a service worker" | Build in production mode |
| "Web app manifest not found" | Check `/public/manifest.json` exists |
| "Manifest doesn't have a maskable icon" | Add maskable icons or ignore (optional) |
| "Does not set a theme color" | Already set in layout.tsx |
| "Not on HTTPS" | Deploy to production (localhost is ok) |
| "No matching service worker detected" | Check service worker is active |

## Browser-Specific Testing

### Chrome (Desktop)
- ✅ Full install support
- ✅ Automatic install prompt
- ✅ Install from address bar
- ✅ Install from menu: Settings → Install Omni Sales

### Edge
- ✅ Similar to Chrome
- ✅ Install from address bar
- ✅ Better integration with Windows (Start Menu, Taskbar)

### Safari (macOS)
- ⚠️ No automatic prompt
- ✅ Manual: File → Share → Add to Dock
- ⚠️ Limited PWA support

### Firefox
- ⚠️ Limited install support (Android only)
- ✅ Service worker works
- ✅ Offline functionality works

### Samsung Internet
- ✅ Full install support
- ✅ Automatic install prompt
- ✅ Good PWA support

## Testing on Real Devices

### Android Testing

**Requirements:**
- Android 5.0+ (Lollipop)
- Chrome 80+ or Samsung Internet
- HTTPS connection (or localhost via port forwarding)

**Port Forwarding (for local testing):**
1. Connect phone via USB
2. Enable USB Debugging on phone
3. In Chrome: `chrome://inspect`
4. Set up port forwarding: 3000 → localhost:3000
5. Access `localhost:3000` on phone

**Remote Testing:**
- Deploy to Vercel/Netlify
- Use ngrok: `npx ngrok http 3000`
- Use your public URL

### iOS Testing

**Requirements:**
- iOS 11.3+ (better on iOS 13+)
- Safari browser (only Safari supports PWA on iOS)
- HTTPS connection

**Local Testing:**
1. Ensure Mac and iPhone on same WiFi
2. Find Mac's local IP: System Preferences → Network
3. Access `http://[your-ip]:3000` on iPhone
4. For HTTPS: use ngrok or deploy

**Note:** iOS has limitations:
- No automatic install prompt
- Maximum 50MB cache
- No push notifications
- Cleared after 7 days of non-use

## Advanced Testing

### Test Background Sync

```javascript
// In browser console (when online)
navigator.serviceWorker.ready.then(registration => {
  registration.sync.register('sync-orders');
});

// Go offline, then back online
// Check console for sync event
```

### Test Push Notifications

```javascript
// In browser console
Notification.requestPermission().then(permission => {
  console.log('Permission:', permission);
});
```

### Clear All Data

**To test fresh install:**
1. DevTools → Application
2. Click "Clear site data"
3. Check all boxes
4. Click "Clear site data"
5. Reload page

**Or use browser settings:**
- Chrome: Settings → Privacy → Clear browsing data
- Choose "Cached images and files" and "Site settings"

### Uninstall App

**Desktop:**
- Chrome: chrome://apps → Right-click → Remove
- Or: Settings → Apps → Uninstall

**Android:**
- Long-press icon → Uninstall
- Or: Settings → Apps → Omni Sales → Uninstall

**iOS:**
- Long-press icon → Remove App

## Performance Testing

### Cache Performance

1. Open DevTools → Network tab
2. Load a page (note load time)
3. Reload page
4. Check:
   - ✅ Resources from service worker (faster)
   - ✅ Size column shows "ServiceWorker"
   - ✅ Time reduced significantly

### Offline Performance

1. Visit app while online (cache assets)
2. Go offline
3. Open new tab/window
4. Visit app again
5. Should load instantly from cache

## Debugging Tips

### View Service Worker Logs

```javascript
// In DevTools Console
navigator.serviceWorker.ready.then(registration => {
  console.log('SW Scope:', registration.scope);
  console.log('SW State:', registration.active.state);
});
```

### Force Service Worker Update

```javascript
// In DevTools Console
navigator.serviceWorker.getRegistration().then(registration => {
  registration.update();
});
```

### Unregister Service Worker

```javascript
// In DevTools Console (or use registration script)
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
});
```

## Automated Testing

### Playwright Example

```typescript
import { test, expect } from '@playwright/test';

test('PWA manifest loads', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const manifestLink = await page.locator('link[rel="manifest"]');
  expect(await manifestLink.getAttribute('href')).toBe('/manifest.json');
});

test('Service worker registers', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const swRegistered = await page.evaluate(() => {
    return navigator.serviceWorker.getRegistration();
  });
  expect(swRegistered).toBeTruthy();
});
```

## Production Checklist

Before deploying to production:

- [ ] Icons converted to PNG (192×192, 512×512)
- [ ] Favicon.ico added
- [ ] manifest.json verified
- [ ] Service worker tested offline
- [ ] Lighthouse score ≥ 90
- [ ] Tested on real devices
- [ ] HTTPS enabled
- [ ] Theme colors match brand
- [ ] App name/description correct
- [ ] Start URL correct

## Quick Reference

**Manifest**: `/public/manifest.json`
**Service Worker**: `/public/sw.js`
**Icons**: `/public/icons/`
**Offline Page**: `/offline`
**Registration**: `/lib/pwa/register-sw.ts`
**Install Component**: `/components/InstallPWA.tsx`

**Cache Version**: Update in `/public/sw.js` → `CACHE_VERSION`

**Environment**: PWA only works in production (`NODE_ENV=production`)

## Need Help?

1. Check browser console for errors
2. Review `/PWA.md` for detailed documentation
3. Run Lighthouse audit for specific issues
4. Verify all files are properly deployed
5. Test in incognito mode (fresh state)

## Resources

- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [Chrome PWA Checklist](https://web.dev/pwa-checklist/)
- [MDN Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
