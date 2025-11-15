/**
 * Automated Screenshot Capture Script
 * Captures high-quality screenshots for PWA manifest
 *
 * Requirements:
 * - npm install -D playwright
 * - App running on http://localhost:3000
 * - Logged in user session (or disable auth in middleware temporarily)
 *
 * Usage:
 * 1. Start dev server: npm run dev
 * 2. Run script: node scripts/capture-screenshots.js
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'public', 'screenshots');

const PAGES = [
  {
    url: '/dashboard',
    name: 'dashboard',
    waitFor: 2000, // Wait for charts to render
    description: 'Dashboard - ภาพรวมยอดขาย',
  },
  {
    url: '/products',
    name: 'products',
    waitFor: 1500,
    description: 'Products - จัดการสินค้า',
  },
  {
    url: '/orders',
    name: 'orders',
    waitFor: 1500,
    description: 'Orders - จัดการคำสั่งซื้อ',
  },
  {
    url: '/customers',
    name: 'customers',
    waitFor: 1500,
    description: 'Customers - จัดการลูกค้า',
  },
  {
    url: '/reports',
    name: 'reports',
    waitFor: 2000, // Wait for charts
    description: 'Reports - รายงานและวิเคราะห์',
  },
];

const VIEWPORTS = {
  desktop: { width: 1280, height: 800, suffix: 'desktop', form_factor: 'wide' },
  mobile: { width: 540, height: 960, suffix: 'mobile', form_factor: 'narrow' },
  tablet: { width: 1024, height: 768, suffix: 'tablet', form_factor: 'wide' },
};

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  console.log('📁 Created screenshots directory');
}

async function captureScreenshots() {
  console.log('🚀 Starting screenshot capture...');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`📂 Output directory: ${SCREENSHOTS_DIR}\n`);

  const browser = await chromium.launch({
    headless: true, // Set to false to see browser
  });

  const manifestScreenshots = [];

  try {
    // Desktop screenshots
    console.log('🖥️  Capturing DESKTOP screenshots...');
    const desktopContext = await browser.newContext({
      viewport: {
        width: VIEWPORTS.desktop.width,
        height: VIEWPORTS.desktop.height,
      },
    });
    const desktopPage = await desktopContext.newPage();

    for (const page of PAGES) {
      const url = `${BASE_URL}${page.url}`;
      console.log(`  📸 ${page.name}-desktop...`);

      await desktopPage.goto(url, { waitUntil: 'networkidle' });
      await desktopPage.waitForTimeout(page.waitFor);

      const filename = `${page.name}-${VIEWPORTS.desktop.suffix}.png`;
      const filepath = path.join(SCREENSHOTS_DIR, filename);

      await desktopPage.screenshot({
        path: filepath,
        fullPage: false,
        type: 'png',
      });

      manifestScreenshots.push({
        src: `/screenshots/${filename}`,
        sizes: `${VIEWPORTS.desktop.width}x${VIEWPORTS.desktop.height}`,
        type: 'image/png',
        form_factor: VIEWPORTS.desktop.form_factor,
        label: page.description,
      });

      console.log(`  ✅ Saved: ${filename}`);
    }

    await desktopContext.close();

    // Mobile screenshots (main pages only)
    console.log('\n📱 Capturing MOBILE screenshots...');
    const mobileContext = await browser.newContext({
      viewport: {
        width: VIEWPORTS.mobile.width,
        height: VIEWPORTS.mobile.height,
      },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    });
    const mobilePage = await mobileContext.newPage();

    // Capture top 3 pages for mobile
    const mobilePages = PAGES.slice(0, 3);
    for (const page of mobilePages) {
      const url = `${BASE_URL}${page.url}`;
      console.log(`  📸 ${page.name}-mobile...`);

      await mobilePage.goto(url, { waitUntil: 'networkidle' });
      await mobilePage.waitForTimeout(page.waitFor);

      const filename = `${page.name}-${VIEWPORTS.mobile.suffix}.png`;
      const filepath = path.join(SCREENSHOTS_DIR, filename);

      await mobilePage.screenshot({
        path: filepath,
        fullPage: false,
        type: 'png',
      });

      manifestScreenshots.push({
        src: `/screenshots/${filename}`,
        sizes: `${VIEWPORTS.mobile.width}x${VIEWPORTS.mobile.height}`,
        type: 'image/png',
        form_factor: VIEWPORTS.mobile.form_factor,
        label: `${page.description} (Mobile)`,
      });

      console.log(`  ✅ Saved: ${filename}`);
    }

    await mobileContext.close();

    // Generate manifest snippet
    console.log('\n📝 Generating manifest.json snippet...');
    const manifestSnippet = JSON.stringify({ screenshots: manifestScreenshots }, null, 2);
    const snippetPath = path.join(SCREENSHOTS_DIR, 'manifest-screenshots.json');
    fs.writeFileSync(snippetPath, manifestSnippet);
    console.log(`  ✅ Saved manifest snippet: ${snippetPath}`);

    console.log('\n✨ Screenshot capture complete!');
    console.log('\n📋 Next steps:');
    console.log('  1. Review screenshots in public/screenshots/');
    console.log('  2. Copy contents of manifest-screenshots.json');
    console.log('  3. Add to your public/manifest.json file');
    console.log('  4. Optimize images if needed (TinyPNG, etc.)');
    console.log('  5. Test PWA install experience\n');

  } catch (error) {
    console.error('\n❌ Error capturing screenshots:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(BASE_URL);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Main execution
(async () => {
  const serverRunning = await checkServer();

  if (!serverRunning) {
    console.error('❌ Error: Development server is not running!');
    console.log('\n📋 Please start the server first:');
    console.log('   npm run dev\n');
    console.log('Then run this script again:');
    console.log('   node scripts/capture-screenshots.js\n');
    process.exit(1);
  }

  try {
    await captureScreenshots();
    process.exit(0);
  } catch (error) {
    console.error('Failed to capture screenshots');
    process.exit(1);
  }
})();
