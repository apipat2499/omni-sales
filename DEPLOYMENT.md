# 🚀 Deployment Guide - Omni Sales

This guide will help you deploy your Omni Sales application to production and start earning money!

## 📋 Pre-Deployment Checklist

Before deploying, make sure you have:

- [ ] Generated PWA icons (run `scripts/generate-icons.html`)
- [ ] Captured app screenshots (run `node scripts/capture-screenshots.js`)
- [ ] Set up Supabase project (see [Supabase Setup](#supabase-setup))
- [ ] Configured environment variables
- [ ] Tested locally with `npm run build`
- [ ] Reviewed security settings
- [ ] Updated contact information in app

---

## 🗄️ Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name:** Omni Sales Production
   - **Database Password:** (generate strong password)
   - **Region:** Choose closest to your users
4. Wait for project to be created (~2 minutes)

### 2. Run Database Migration

1. In Supabase Dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy contents of `supabase/schema.sql`
4. Paste and click "Run"
5. Verify tables created: products, customers, orders, order_items

### 3. Seed Database (Optional)

1. In SQL Editor, create new query
2. Copy contents of `supabase/seed.sql`
3. Run query to populate sample data
4. Verify data in **Table Editor**

### 4. Set Up Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure:
   - ✅ Enable Email provider
   - ✅ Confirm email (enable for production security)
   - ✅ Secure email change (recommended)

4. **Create Admin User:**
   - Go to **Authentication** → **Users**
   - Click "Add user"
   - Enter email and password for admin
   - User can now login to the app

### 5. Configure Row Level Security (RLS)

For production security, enable RLS:

```sql
-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access (adjust based on your needs)
CREATE POLICY "Allow authenticated users" ON products
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON customers
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON orders
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON order_items
  FOR ALL USING (auth.role() = 'authenticated');
```

### 6. Get Environment Variables

1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon public:** `eyJhbGc...` (public key)
   - **service_role:** `eyJhbGc...` (keep secret!)

---

## 🌐 Deploy to Vercel (Recommended)

Vercel is the easiest option for Next.js apps with zero config needed.

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Deploy

From your project root:

```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** Yes
- **Which scope?** Your account
- **Link to existing project?** No
- **Project name?** omni-sales
- **Directory?** ./
- **Override settings?** No

### 4. Add Environment Variables

In Vercel Dashboard:

1. Go to your project
2. Click **Settings** → **Environment Variables**
3. Add these variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
```

### 5. Redeploy

```bash
vercel --prod
```

Your app is now live! 🎉

### 6. Custom Domain (Optional)

1. In Vercel Dashboard → **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records as instructed
4. SSL certificate auto-generated

---

## 🐳 Deploy to Railway

Railway offers great PostgreSQL hosting along with app hosting.

### 1. Install Railway CLI

```bash
npm i -g @railway/cli
```

### 2. Login

```bash
railway login
```

### 3. Initialize Project

```bash
railway init
```

### 4. Add PostgreSQL

```bash
railway add postgresql
```

### 5. Set Environment Variables

```bash
railway variables set NEXT_PUBLIC_SUPABASE_URL=your-url
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

### 6. Deploy

```bash
railway up
```

---

## ☁️ Deploy to Netlify

### 1. Install Netlify CLI

```bash
npm i -g netlify-cli
```

### 2. Login

```bash
netlify login
```

### 3. Build Configuration

Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NEXT_PUBLIC_SUPABASE_URL = "https://xxxxx.supabase.co"
  NEXT_PUBLIC_SUPABASE_ANON_KEY = "your-anon-key"
```

### 4. Deploy

```bash
netlify deploy --prod
```

---

## 🔒 Security Best Practices

### 1. Environment Variables

Never commit `.env` files! Use platform-specific environment variables:

- **Vercel:** Dashboard → Environment Variables
- **Railway:** `railway variables set`
- **Netlify:** Dashboard → Site settings → Environment

### 2. Supabase Security

```sql
-- Limit access by user
CREATE POLICY "Users can only see their own data" ON orders
  FOR SELECT USING (auth.uid()::text = user_id);

-- Prevent deletion of old records
CREATE POLICY "Prevent deletion" ON orders
  FOR DELETE USING (created_at > NOW() - INTERVAL '30 days');
```

### 3. Rate Limiting

Add to `middleware.ts`:

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});
```

### 4. HTTPS Only

All platforms (Vercel, Railway, Netlify) provide HTTPS by default. Never use HTTP in production.

---

## 📱 PWA Configuration

### 1. Generate Icons

1. Open `scripts/generate-icons.html` in browser
2. Download all PNG icons
3. Replace files in `public/icons/`
4. Add `favicon.png` and `apple-touch-icon.png` to `public/`

### 2. Capture Screenshots

```bash
# Install Playwright
npm install -D playwright

# Start dev server
npm run dev

# In another terminal, run:
node scripts/capture-screenshots.js
```

### 3. Update Manifest

Add generated screenshots to `public/manifest.json`:

```json
{
  "screenshots": [
    {
      "src": "/screenshots/dashboard-desktop.png",
      "sizes": "1280x800",
      "type": "image/png",
      "form_factor": "wide",
      "label": "Dashboard - ภาพรวมยอดขาย"
    }
  ]
}
```

### 4. Test PWA

1. Deploy to production
2. Open in Chrome (mobile or desktop)
3. Check Lighthouse PWA score (should be 90+)
4. Test install functionality
5. Verify offline mode works

---

## 🧪 Testing Before Launch

### 1. Local Production Build

```bash
npm run build
npm start
```

Visit `http://localhost:3000` and test all features.

### 2. Lighthouse Audit

1. Open Chrome DevTools
2. Go to **Lighthouse** tab
3. Check all categories
4. Click "Generate report"
5. Fix any issues

Target scores:
- ✅ Performance: 90+
- ✅ Accessibility: 90+
- ✅ Best Practices: 90+
- ✅ SEO: 90+
- ✅ PWA: 90+

### 3. Cross-Browser Testing

Test on:
- ✅ Chrome (Desktop & Mobile)
- ✅ Safari (iOS)
- ✅ Firefox
- ✅ Edge

### 4. Mobile Testing

Test on actual devices:
- ✅ Android phone
- ✅ iPhone
- ✅ Tablet

---

## 💰 Monetization Strategies

Now that your app is deployed, here's how to earn money:

### 1. SaaS Model (Recommended)

**Pricing tiers:**

- **Free:** 100 products, 50 orders/month
- **Starter:** ฿299/month - 1,000 products, 500 orders
- **Pro:** ฿999/month - Unlimited products & orders
- **Enterprise:** ฿2,999/month - Multi-location, API access

**Implementation:**
- Use Stripe for payments
- Add subscription management to settings
- Implement usage limits per plan
- Add plan upgrade prompts

### 2. One-time License

- **Small Business:** ฿4,999 (one-time)
- **Enterprise:** ฿19,999 (one-time + support)

### 3. Freemium + Add-ons

Free core features, charge for:
- ✅ Advanced analytics (฿199/month)
- ✅ Multi-channel sync (฿299/month)
- ✅ Inventory management (฿149/month)
- ✅ Email marketing (฿249/month)

### 4. White Label

Sell customized versions to businesses:
- **Setup fee:** ฿15,000 - ฿50,000
- **Monthly maintenance:** ฿2,000 - ฿5,000
- Include custom branding, domain, training

### 5. Commission Model

For marketplace features:
- Take 2-5% of transactions
- Monthly platform fee + commission
- Good for multi-vendor scenarios

---

## 📊 Analytics & Monitoring

### 1. Add Google Analytics

```typescript
// app/layout.tsx
import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX');
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### 2. Error Tracking (Sentry)

```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

### 3. Performance Monitoring

Use Vercel Analytics (built-in) or:
- PostHog (open-source)
- Plausible (privacy-focused)
- Mixpanel (advanced)

---

## 🚦 Post-Launch Checklist

- [ ] App deployed and accessible
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (HTTPS)
- [ ] Database migrations run
- [ ] Admin user created
- [ ] Environment variables set
- [ ] PWA installable on mobile
- [ ] Offline mode working
- [ ] Analytics tracking
- [ ] Error monitoring active
- [ ] Backup strategy in place
- [ ] Documentation updated
- [ ] Pricing page created
- [ ] Payment integration tested
- [ ] Customer support email set up
- [ ] Terms of Service & Privacy Policy added

---

## 🆘 Troubleshooting

### Build Fails

```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### Environment Variables Not Working

- Check variable names match exactly
- Redeploy after adding variables
- Variables starting with `NEXT_PUBLIC_` are exposed to browser

### Supabase Connection Issues

- Verify URL and keys are correct
- Check RLS policies aren't blocking access
- Ensure tables exist in correct schema

### PWA Not Installing

- Must be served over HTTPS
- Check manifest.json is valid
- Ensure icons are PNG, not SVG
- Service worker must be registered

---

## 📞 Support & Resources

- **Next.js Docs:** https://nextjs.org/docs
- **Supabase Docs:** https://supabase.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **PWA Docs:** https://web.dev/progressive-web-apps/

---

## 🎉 You're Ready to Launch!

Your Omni Sales application is production-ready. Follow this guide, deploy, and start earning money!

**Recommended Launch Sequence:**
1. Deploy to Vercel (fastest)
2. Set up Supabase
3. Generate PWA assets
4. Test thoroughly
5. Add payment integration
6. Launch marketing campaign
7. Iterate based on user feedback

Good luck! 🚀
