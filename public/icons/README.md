# PWA Icons Guide

This directory contains the app icons for the Omni Sales Progressive Web App (PWA).

## Required Icons

To complete the PWA setup, you need to add the following icon files to this directory:

### 1. App Icons

- **icon-192x192.png** (192×192 pixels)
  - Standard app icon for Android devices
  - Used on home screen and app drawer
  - Should have a transparent background or solid background matching your brand

- **icon-512x512.png** (512×512 pixels)
  - High-resolution app icon
  - Used for splash screens and high-DPI displays
  - Should have a transparent background or solid background matching your brand

### 2. Apple Touch Icon (Optional but Recommended)

- **apple-touch-icon.png** (180×180 pixels)
  - Used for iOS home screen
  - Should NOT have rounded corners (iOS adds them automatically)
  - Should have a solid background (no transparency)

### 3. Favicon (Optional but Recommended)

- **favicon.ico** (multiple sizes: 16×16, 32×32, 48×48)
  - Browser tab icon
  - Should be placed in the `/public` directory root

## How to Create Icons

### Option 1: Online Tools (Recommended)

1. **PWA Asset Generator**
   - Visit: https://www.pwabuilder.com/imageGenerator
   - Upload your base logo (at least 512×512 pixels)
   - Download the generated icons
   - Place them in this directory

2. **Favicon.io**
   - Visit: https://favicon.io/
   - Create icons from text, image, or emoji
   - Download and extract the ZIP file
   - Copy the required sizes to this directory

3. **RealFaviconGenerator**
   - Visit: https://realfavicongenerator.net/
   - Upload your base image
   - Customize for different platforms
   - Download and extract the icons

### Option 2: Design Tools

**Using Figma:**
1. Create a 512×512 artboard
2. Design your icon with safe area (48px padding)
3. Export as PNG in required sizes (192×192, 512×512)

**Using Photoshop:**
1. Create a new document: 512×512 pixels, 72 DPI
2. Design your icon
3. Save for Web: PNG-24 with transparency
4. Use Image → Image Size to create 192×192 version

**Using GIMP:**
1. Create new image: 512×512 pixels
2. Design your icon
3. Export as PNG
4. Scale image for 192×192 version

### Option 3: Command Line (ImageMagick)

```bash
# Install ImageMagick first
# Ubuntu/Debian: sudo apt-get install imagemagick
# macOS: brew install imagemagick

# Convert and resize your base image
convert logo.png -resize 192x192 icon-192x192.png
convert logo.png -resize 512x512 icon-512x512.png
convert logo.png -resize 180x180 apple-touch-icon.png

# Create favicon.ico with multiple sizes
convert logo.png -resize 48x48 -background transparent -flatten favicon-48.png
convert logo.png -resize 32x32 -background transparent -flatten favicon-32.png
convert logo.png -resize 16x16 -background transparent -flatten favicon-16.png
convert favicon-48.png favicon-32.png favicon-16.png ../favicon.ico
```

## Icon Design Guidelines

### Design Principles

1. **Simplicity**
   - Use simple, recognizable shapes
   - Avoid complex details that won't be visible at small sizes
   - Use 2-3 colors maximum

2. **Safe Area**
   - Keep important content within the inner 80% of the icon
   - Leave 48px padding for 512×512 icon
   - Accounts for different device masks (circle, rounded square, etc.)

3. **Consistency**
   - Match your brand colors
   - Use the same design across all sizes
   - Maintain visual consistency with your app

4. **Contrast**
   - Ensure good contrast against various backgrounds
   - Test on both light and dark backgrounds
   - Avoid pure white or pure black backgrounds

### File Requirements

- **Format**: PNG (PNG-24 with alpha channel)
- **Color Mode**: RGB
- **Bit Depth**: 24-bit color + 8-bit alpha (32-bit total)
- **Compression**: Optimized (use tools like TinyPNG)
- **File Size**: Keep under 100KB per icon

### Maskable Icons

Modern PWAs support "maskable" icons that work with any device mask:

```
  Safe Zone (80%)    Mask Area (100%)
  ┌──────────────┐
  │  ┌────────┐  │
  │  │        │  │ ← Your important content
  │  │  LOGO  │  │    should be here
  │  │        │  │
  │  └────────┘  │
  └──────────────┘
```

## Testing Your Icons

### Test Locally

1. Place your icons in this directory
2. Run the development server: `npm run dev`
3. Open DevTools → Application → Manifest
4. Check if icons appear correctly

### Test on Real Devices

**Android:**
1. Deploy to production
2. Visit your site in Chrome
3. Tap "Add to Home Screen"
4. Check home screen icon

**iOS:**
1. Deploy to production
2. Visit your site in Safari
3. Tap Share → "Add to Home Screen"
4. Check home screen icon

### Online Testing Tools

- **Favicon Checker**: https://realfavicongenerator.net/favicon_checker
- **PWA Testing**: https://www.pwabuilder.com/
- **Lighthouse**: Use Chrome DevTools → Lighthouse → Progressive Web App

## After Adding Icons

Once you've added your icons to this directory:

1. ✅ Verify files exist:
   - `/public/icons/icon-192x192.png`
   - `/public/icons/icon-512x512.png`

2. ✅ The manifest.json already references these icons

3. ✅ Test the PWA install process

4. ✅ Verify icons appear in:
   - Browser tab
   - Home screen (after install)
   - Task switcher
   - Splash screen

## Screenshots (Optional)

Place app screenshots in `/public/screenshots/` for the app store:

- **desktop-1.png** (1920×1080 pixels) - Desktop view
- **mobile-1.png** (750×1334 pixels) - Mobile view

Screenshots help users understand your app before installing it.

## Need Help?

- PWA Documentation: https://web.dev/progressive-web-apps/
- Icon Guidelines: https://web.dev/add-manifest/
- Maskable Icons: https://web.dev/maskable-icon/

## Current Status

❌ Icons not yet added - Follow the instructions above to create and add your icons.

Once added, update this README to track your progress.
