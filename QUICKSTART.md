# ⚡ Quick Start Guide - Omni Sales

Get your Omni Sales app running in **5 minutes**!

## 🚀 Super Fast Setup

### 1. Install Dependencies (30 seconds)

```bash
npm install
```

### 2. Set Up Supabase (2 minutes)

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Name: `omni-sales-prod`
3. Generate password → **Create**
4. Wait ~2 minutes for setup

### 3. Configure Database (1 minute)

In Supabase Dashboard:

1. Go to **SQL Editor**
2. **New Query** → Paste contents of `supabase/schema.sql` → **Run**
3. **New Query** → Paste contents of `supabase/seed.sql` → **Run**

### 4. Get API Keys (30 seconds)

In Supabase Dashboard:

1. **Settings** → **API**
2. Copy:
   - Project URL
   - anon/public key

### 5. Configure Environment (30 seconds)

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-key
```

### 6. Create Admin User (30 seconds)

In Supabase Dashboard:

1. **Authentication** → **Users**
2. **Add user** → **Create new user**
3. Email: `admin@yourdomain.com`
4. Password: (choose strong password)
5. **Create User**

### 7. Run Development Server (10 seconds)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 8. Login! 🎉

Use the credentials from step 6.

---

## 🎨 Optional: PWA Assets

### Generate Icons (2 minutes)

```bash
npm run generate:icons
```

1. HTML page opens in browser
2. Click "Download PNG" for each icon
3. Move files to `public/icons/`

### Generate Screenshots (3 minutes)

```bash
# One-time setup
npm run setup:playwright

# Start dev server (if not running)
npm run dev

# In another terminal
npm run generate:screenshots
```

Screenshots saved to `public/screenshots/`

---

## 🌐 Deploy to Production (5 minutes)

### Option 1: Vercel (Easiest)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variables in Vercel Dashboard
# Then deploy to production
vercel --prod
```

### Option 2: Railway

```bash
npm i -g @railway/cli
railway login
railway init
railway up
```

### Option 3: Netlify

```bash
npm i -g netlify-cli
netlify login
netlify deploy --prod
```

**Don't forget to add environment variables in your hosting platform dashboard!**

---

## 📋 Troubleshooting

### Can't connect to Supabase?

✅ Check `.env.local` has correct URL and key
✅ Restart dev server after adding env vars
✅ Verify tables exist in Supabase Dashboard

### Can't login?

✅ User must exist in Supabase Auth → Users
✅ Check email/password are correct
✅ Confirm email if required in Auth settings

### Build fails?

```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### PWA not installing?

✅ Must use HTTPS (works on localhost)
✅ Icons must be PNG, not SVG
✅ Check manifest.json is valid
✅ Service worker registered (check DevTools)

---

## 🎯 Next Steps

1. ✅ Customize branding (logo, colors in `tailwind.config.ts`)
2. ✅ Add your business data
3. ✅ Generate PWA assets
4. ✅ Deploy to production
5. ✅ Add custom domain
6. ✅ Set up analytics
7. ✅ Add payment integration (Stripe/Omise)
8. ✅ Start selling! 💰

---

## 📚 Resources

- **Full Deployment Guide:** [DEPLOYMENT.md](./DEPLOYMENT.md)
- **PWA Documentation:** [docs/PWA.md](./docs/PWA.md)
- **Supabase Setup:** [supabase/README.md](./supabase/README.md)
- **Next.js Docs:** [nextjs.org/docs](https://nextjs.org/docs)
- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)

---

## 💡 Pro Tips

**Development:**
- Use `npm run dev` for development
- Use `npm run build && npm start` to test production locally
- Check Supabase logs for API errors

**Performance:**
- Enable caching in your hosting platform
- Optimize images (use WebP)
- Enable compression (Gzip/Brotli)

**Security:**
- Enable RLS on all Supabase tables
- Use strong passwords for admin users
- Keep dependencies updated: `npm outdated`
- Never commit `.env` files

**SEO:**
- Add meta tags in `app/layout.tsx`
- Create sitemap.xml
- Submit to Google Search Console

---

**Need help?** Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed guides!

**Ready to earn money?** See monetization strategies in [DEPLOYMENT.md](./DEPLOYMENT.md#-monetization-strategies)
