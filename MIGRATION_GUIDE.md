# Migration Guide for New Features

This guide will help you set up the new features: Discount System, Email Notifications, and Inventory Alerts.

## 📋 Prerequisites

- Supabase project set up
- Resend account (for email notifications)

## 🚀 Steps

### 1. Run Database Migration

Go to your Supabase project dashboard and run the migration file:

1. Navigate to **SQL Editor** in your Supabase dashboard
2. Open the migration file: `supabase/migrations/001_add_discounts_and_notifications.sql`
3. Copy and paste the entire SQL script
4. Click **Run** to execute the migration

This will create the following tables:
- `discounts` - Store discount codes and promotions
- `discount_usages` - Track discount usage
- `notifications` - System notifications
- `notification_preferences` - User preferences for notifications

### 2. Configure Environment Variables

Copy the `.env.local.example` file to `.env.local`:

```bash
cp .env.local.example .env.local
```

Then fill in your credentials:

**Supabase:**
- Get your Supabase URL and Anon Key from: Project Settings > API

**Resend (Email Service):**
1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Add your sending domain (or use the test domain)
4. Update `EMAIL_FROM` with your verified sending address

### 3. Verify the Setup

Run the development server:

```bash
npm run dev
```

Test the new features:

1. **Discounts**: Navigate to `/discounts` to create discount codes
2. **Notifications**: Check the bell icon in the sidebar
3. **Settings**: Go to Settings > Notifications to configure email preferences

## 📧 Email Notifications

Email notifications will be sent for:
- Order created
- Order status updates (shipped, delivered)
- Low stock alerts
- Out of stock alerts

**Note**: Without Resend API key, emails will be logged to console in development mode.

## 🎯 Features Added

### 1. Discount & Promotion System
- Create percentage or fixed amount discounts
- Set minimum purchase requirements
- Limit usage per code
- Set start/end dates
- Apply to all products, specific categories, or specific products

### 2. Email Notification System
- Beautiful HTML email templates
- Order confirmation emails
- Order status update emails
- Inventory alert emails to admin

### 3. Inventory Alert System
- Real-time notifications for low stock
- Configurable stock threshold
- Email alerts for out-of-stock items
- Notification center in sidebar

### 4. Notification Center
- View all notifications
- Mark as read/unread
- Delete notifications
- Real-time updates

## 🔍 Troubleshooting

**Problem**: Migration fails
- Solution: Make sure you have the UUID extension enabled in Supabase
- Run: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`

**Problem**: Emails not sending
- Solution: Check that RESEND_API_KEY is set correctly
- Verify your sending domain is verified in Resend

**Problem**: Notifications not appearing
- Solution: Check browser console for errors
- Verify the migration was run successfully

## 📝 Notes

- The notification system polls every 30 seconds for new notifications
- Low stock threshold defaults to 10 items (configurable in Settings)
- Email notifications can be completely disabled in Settings
- Discount codes are case-insensitive (automatically converted to uppercase)

## 🎉 Done!

You're all set! Enjoy the new features.
