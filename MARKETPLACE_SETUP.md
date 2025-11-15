# Marketplace Integration Setup Guide

This guide explains how to set up and use marketplace integrations (Shopee, Lazada, Facebook Shop) in Omni Sales.

## Overview

Marketplace integrations allow you to:

- **Connect multiple marketplace shops** to a single Omni Sales account
- **Automatically sync orders** from all connected marketplaces
- **Manage inventory** across all platforms from one dashboard
- **Track performance** by marketplace

## Supported Marketplaces

### 1. Shopee (Thailand)
- **Website**: https://www.shopee.co.th/
- **Seller Portal**: https://partner.shopeemall.com/
- **API Docs**: https://partner.shopeemall.com/docs/api

### 2. Lazada (Thailand)
- **Website**: https://www.lazada.co.th/
- **Seller Portal**: https://sellercenter.lazada.co.th/
- **API Docs**: https://open.lazada.com/

### 3. Facebook Shop
- **Platform**: Meta Business Suite
- **Shop Manager**: https://business.facebook.com/
- **API Docs**: https://developers.facebook.com/docs/commerce

## Setup Instructions

### Step 1: Navigate to Marketplace Settings

1. Log in to Omni Sales
2. Go to **Marketplace Integrations** page
3. You'll see a list of available marketplaces

### Step 2: Connect a Marketplace

#### For Shopee

1. Click **"Connect"** on the Shopee card
2. Get your credentials:
   - Go to https://partner.shopeemall.com/
   - Navigate to **Settings → API**
   - Create an API account if you haven't
   - Copy the following:
     - **Shop ID**
     - **API Key**
     - **API Secret**
     - **Access Token**
     - **Refresh Token** (optional)

3. Fill in the form with your credentials
4. Click **"Connect"**

#### For Lazada

1. Click **"Connect"** on the Lazada card
2. Get your credentials:
   - Go to https://sellercenter.lazada.co.th/
   - Navigate to **Settings → API**
   - Create an API application if you haven't
   - Copy the following:
     - **Shop ID**
     - **App Key**
     - **App Secret**
     - **Access Token**
     - **Refresh Token**

3. Fill in the form with your credentials
4. Click **"Connect"**

#### For Facebook Shop

1. Click **"Connect"** on the Facebook Shop card
2. Get your credentials:
   - Go to https://business.facebook.com/
   - Navigate to **Business Settings → Users and Access**
   - Create a System User if needed
   - Generate Access Token with:
     - `pages_read_engagement`
     - `pages_manage_metadata`
     - `commerce_management_api` permissions
   - Copy the following:
     - **Shop ID** (Facebook Page ID)
     - **App ID**
     - **App Secret**
     - **Access Token**

3. Fill in the form with your credentials
4. Click **"Connect"**

### Step 3: Sync Orders

After connecting a marketplace:

1. Click **"Sync Orders"** on the connected marketplace card
2. The system will fetch all orders from that marketplace
3. Orders are saved to your local database with full details
4. You'll see a summary of synced orders

### Step 4: View Synced Orders

1. Go to **Orders** section in your dashboard
2. You'll see orders from all connected marketplaces
3. Filter by marketplace using the **"Platform"** filter
4. Orders from different marketplaces are unified in one view

## Database Schema

### marketplace_platforms
Stores available marketplace platforms (Shopee, Lazada, Facebook)

### marketplace_connections
Stores your API credentials for each connected marketplace

### marketplace_orders
Stores orders synced from marketplaces

### marketplace_products
Stores product listings from marketplaces (for future use)

### marketplace_sync_logs
Tracks sync history and logs

### marketplace_webhooks
Stores incoming webhook events (for real-time updates)

## API Endpoints

### Get Available Platforms
```
GET /api/marketplace/platforms
```

### Get User's Connections
```
GET /api/marketplace/connections?userId={userId}
```

### Create New Connection
```
POST /api/marketplace/connections
Body: {
  userId: string,
  platformCode: 'shopee' | 'lazada' | 'facebook',
  shopId: string,
  shopName?: string,
  accessToken: string,
  apiKey: string,
  apiSecret: string,
  refreshToken?: string
}
```

### Sync Orders
```
POST /api/marketplace/sync-orders
Body: {
  connectionId: string,
  userId: string
}
```

### Get Marketplace Orders
```
GET /api/marketplace/orders?userId={userId}&platformCode={code}&limit=50&offset=0
```

## Features

### Order Syncing
- Automatic order fetching from connected marketplaces
- Real-time order details (customer info, items, amounts)
- Support for multiple order statuses

### Inventory Management
- Track products across multiple platforms
- Sync product information
- Monitor stock levels by platform

### Analytics
- Orders by marketplace
- Revenue by platform
- Performance metrics

### Webhook Support
- Real-time order updates
- Automatic status synchronization
- Event logging

## Troubleshooting

### Connection Failed

**Problem**: "Failed to connect marketplace"

**Solutions**:
- Verify API credentials are correct
- Check that your API account has proper permissions
- Ensure tokens haven't expired
- Check firewall/VPN settings

### Orders Not Syncing

**Problem**: No orders appear after sync

**Solutions**:
- Check if you have recent orders on the marketplace
- Verify API credentials are still valid
- Check sync logs for error messages
- Retry sync operation

### Missing Credentials

**Problem**: "Missing required fields" error

**Solutions**:
- Review the platform setup instructions
- Get all required credentials before connecting
- Check that credentials are copied correctly (no extra spaces)

### API Rate Limiting

**Problem**: Sync fails with rate limit error

**Solutions**:
- Wait before retrying
- Spread sync operations across different times
- Check marketplace API documentation for limits

## Best Practices

### Credential Security
- Never share your API credentials
- Use separate API accounts per marketplace if possible
- Regularly rotate tokens and secrets
- Enable two-factor authentication on marketplace accounts

### Order Management
- Sync orders regularly (daily or more frequently)
- Archive old orders after 6 months
- Keep track of sync logs for audit purposes

### Integration Testing
- Test each marketplace connection after setup
- Verify orders sync correctly
- Check that order details are accurate
- Test with a test order first

## Advanced Configuration

### Custom Sync Schedule

To set up automatic syncing on a schedule, you can use:
- Vercel Cron (for Vercel deployments)
- AWS EventBridge (for AWS deployments)
- GitHub Actions (scheduled workflows)
- Node-cron (for self-hosted)

Example with Node-cron:
```typescript
import cron from 'node-cron';

// Sync orders every hour
cron.schedule('0 * * * *', async () => {
  const connections = await getConnections(userId);
  for (const connection of connections) {
    await syncMarketplaceOrders(connection);
  }
});
```

### Webhook Integration

To receive real-time order updates:

1. Register webhook URL with marketplace
2. Webhook URL format: `https://yourdomain.com/api/webhooks/marketplace`
3. Verify webhook signatures in handler
4. Process events and update orders in real-time

## API Documentation

### Shopee Partner API
- Base URL: `https://partner.shopeemall.com/api/v2`
- Auth: HMAC-SHA256 signature
- Rate Limit: Check partner portal

### Lazada Open Platform
- Base URL: `https://api.lazada.co.th/rest/api/2.0`
- Auth: HMAC-SHA256 signature
- Rate Limit: 1000 requests/minute

### Facebook Commerce API
- Base URL: `https://graph.facebook.com/v18.0`
- Auth: Bearer token (access token)
- Rate Limit: Check developer dashboard

## Support & Resources

For issues specific to each marketplace:

- **Shopee**: https://partner.shopeemall.com/help
- **Lazada**: https://open.lazada.com/support
- **Facebook**: https://developers.facebook.com/community

## Future Enhancements

Planned features:
- [ ] Automatic order sync (cron jobs)
- [ ] Product sync from marketplaces
- [ ] Order fulfillment automation
- [ ] Inventory level synchronization
- [ ] Multi-channel analytics dashboard
- [ ] Customer unified view
- [ ] Review aggregation
- [ ] Bulk operations
