# PWA Quick Start Guide

Get your Omni Sales PWA up and running in 5 minutes!

## Step 1: Add Icons (Required)

You have **placeholder SVG icons** in `/public/icons/`. Convert them to PNG:

### Quick Option: Online Converter

1. Go to https://cloudconvert.com/svg-to-png
2. Upload both SVG files from `/public/icons/`:
   - `icon-192x192.svg` → Set size to 192×192
   - `icon-512x512.svg` → Set size to 512×512
3. Download as PNG files
4. Save them in `/public/icons/` with these exact names:
   - `icon-192x192.png`
   - `icon-512x512.png`

### Alternative: Create Your Own

Follow the detailed guide in `/public/icons/README.md`

## Step 2: Build & Deploy

### Local Testing

```bash
# Build for production
npm run build

# Start production server
npm start

# Open http://localhost:3000
```

### Deploy to Production

**Vercel (Recommended):**
```bash
npm install -g vercel
vercel --prod
```

**Or use Vercel CLI:**
```bash
vercel deploy --prod
```

**Other platforms:**
- Netlify
- Railway
- Render
- Digital Ocean

## Step 3: Test Installation

### On Desktop (Chrome/Edge)

1. Visit your production URL
2. Look for **install icon** in address bar (⊕ or desktop icon)
3. Click to install
4. App opens in standalone window ✅

### On Android

1. Visit your production URL in Chrome
2. Look for **"Add to Home screen"** banner
3. Or tap menu (⋮) → "Add to Home screen"
4. Icon appears on home screen ✅

### On iOS (iPhone/iPad)

1. Visit your production URL in **Safari** (must use Safari!)
2. Tap **Share** button (□↑)
3. Scroll down → Tap **"Add to Home Screen"**
4. Tap **"Add"**
5. Icon appears on home screen ✅

## Step 4: Test Offline

1. Open the installed app
2. Visit a few pages (Dashboard, Products, Orders)
3. Turn off WiFi or enable Airplane Mode
4. Try navigating the app
5. Previously visited pages should work! ✅
6. New pages show offline message ✅

## Step 5: Verify PWA Quality

### Run Lighthouse Audit

1. Open Chrome DevTools (F12)
2. Go to **Lighthouse** tab
3. Select **"Progressive Web App"**
4. Click **"Generate report"**
5. **Target Score: 90+** (100 is perfect!)

### Check Manifest

1. DevTools → **Application** tab
2. Click **Manifest** in sidebar
3. Verify all fields are correct ✅

### Check Service Worker

1. DevTools → **Application** tab
2. Click **Service Workers**
3. Should show: **"Activated and running"** ✅

## That's It! 🎉

Your Omni Sales app is now a Progressive Web App!

## What You Get

✅ **Installable** - Users can add to home screen
✅ **Offline Support** - Works without internet
✅ **Fast Loading** - Cached resources load instantly
✅ **App-like** - No browser UI when installed
✅ **Auto-updates** - Updates automatically when online

## Next Steps (Optional)

### Customize Theme Colors

Edit `/public/manifest.json`:
```json
{
  "theme_color": "#2563eb",      // ← Change this
  "background_color": "#ffffff"  // ← And this
}
```

### Add More Shortcuts

Edit shortcuts in `/public/manifest.json` to add quick actions

### Enable Push Notifications

See full guide in `/PWA.md` → "Configure Push Notifications"

### Add Screenshots

Add images to `/public/screenshots/` for app stores:
- `desktop-1.png` (1920×1080)
- `mobile-1.png` (750×1334)

### Custom Install Prompt

The install banner already appears automatically! But you can customize it in `/components/InstallPWA.tsx`

## Troubleshooting

### "Install button doesn't appear"

- ✅ Make sure you're on HTTPS (or localhost)
- ✅ Check icons exist (PNG files, not SVG)
- ✅ Run Lighthouse to see what's missing
- ✅ Clear browser cache and reload

### "Service worker not working"

- ✅ Must be in production mode (`npm run build && npm start`)
- ✅ Check browser console for errors
- ✅ Make sure you're on HTTPS

### "Offline mode not working"

- ✅ Visit pages while online first (to cache them)
- ✅ Check service worker is active (DevTools → Application)
- ✅ Make sure you built in production mode

### "Icons not showing"

- ✅ Convert SVG placeholders to PNG
- ✅ Check files are exactly named: `icon-192x192.png` and `icon-512x512.png`
- ✅ Clear cache and reinstall app

## More Information

- **Full Documentation**: See `/PWA.md`
- **Testing Guide**: See `/PWA-TESTING.md`
- **Icons Guide**: See `/public/icons/README.md`

## File Locations

| What | Where |
|------|-------|
| Manifest | `/public/manifest.json` |
| Service Worker | `/public/sw.js` |
| Icons | `/public/icons/` |
| Offline Page | `/app/offline/page.tsx` |
| Install Component | `/components/InstallPWA.tsx` |

## Support

**DevTools → Console** shows PWA logs (search for `[PWA]` or `[SW]`)

**DevTools → Application** shows manifest, service worker, and cache status

**Lighthouse** identifies specific issues and how to fix them

---

Need help? Check the full documentation in `/PWA.md` or testing guide in `/PWA-TESTING.md`
