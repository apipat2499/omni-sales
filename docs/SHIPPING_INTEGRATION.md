# Thai Shipping Providers Integration

Complete integration with major Thai shipping providers: Kerry Express, Flash Express, and Thailand Post.

## Table of Contents

- [Overview](#overview)
- [Supported Providers](#supported-providers)
- [Features](#features)
- [Provider Comparison](#provider-comparison)
- [Setup](#setup)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Components](#components)

## Overview

The shipping integration provides a unified interface to manage shipments across multiple Thai shipping providers. The system automatically creates shipments, tracks packages, generates shipping labels, and updates order statuses.

## Supported Providers

### 1. Kerry Express
- **Code**: `kerry`
- **Website**: https://th.kerryexpress.com/
- **API Documentation**: https://api.kerryexpress.co.th/
- **Coverage**: Nationwide Thailand
- **Service Types**: Standard, Express, Same Day

### 2. Flash Express
- **Code**: `flash`
- **Website**: https://www.flashexpress.com/
- **API Documentation**: https://developer.flashexpress.com/
- **Coverage**: Nationwide Thailand
- **Service Types**: Standard, Express, Economy

### 3. Thailand Post
- **Code**: `thailand-post`
- **Website**: https://www.thailandpost.com/
- **API Documentation**: https://trackapi.thailandpost.co.th/
- **Coverage**: Nationwide Thailand + International
- **Service Types**: EMS, Registered, Parcel, Express

## Features

### Core Features

✅ **Rate Quotation**
- Get real-time shipping rates from all providers
- Compare prices across providers
- Automatic caching (24-hour TTL)

✅ **Shipment Creation**
- Create shipments with any provider
- Auto-generate tracking numbers
- Support for COD (Cash on Delivery)
- Parcel insurance options

✅ **Tracking**
- Real-time tracking updates
- Detailed tracking history
- Estimated delivery dates
- Delivery confirmation

✅ **Label Printing**
- Generate shipping labels (PDF)
- Download labels individually or in bulk
- Auto-print capability

✅ **Cancellation**
- Cancel shipments before pickup
- Automatic status updates
- Refund processing integration

### Order Integration

✅ **Automatic Shipment Creation**
- Create shipments when order status changes to "shipped"
- Auto-populate sender/recipient addresses
- Calculate parcel weight from order items

✅ **Status Synchronization**
- Sync tracking status with order status
- Automatic email notifications
- Real-time updates

✅ **Bulk Operations**
- Create multiple shipments at once
- Bulk label printing
- Batch tracking updates

### Customer Portal

✅ **Tracking Information**
- View shipment status in order details
- Detailed tracking timeline
- Estimated delivery date
- Proof of delivery

✅ **Direct Tracking Links**
- One-click tracking on provider website
- Mobile-optimized tracking pages

### Admin Features

✅ **Shipping Management Dashboard**
- View all shipments
- Filter by status, provider, date
- Bulk actions

✅ **Provider Selection**
- Choose provider per order
- Compare rates before shipping
- Set default provider

✅ **Label Management**
- Download labels individually
- Bulk label printing
- Print history

✅ **Rate Negotiation**
- Configure custom rates
- Volume-based pricing
- Provider contracts management

## Provider Comparison

| Feature | Kerry Express | Flash Express | Thailand Post |
|---------|--------------|---------------|---------------|
| **Coverage** | ✅ Nationwide | ✅ Nationwide | ✅ Nationwide + International |
| **API Quality** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Good | ⭐⭐⭐ Fair |
| **Speed** | 1-2 days | 1-2 days | 2-5 days (EMS: 1-2) |
| **Price** | 💰💰💰 Medium-High | 💰💰 Medium | 💰 Low |
| **COD Support** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Insurance** | ✅ Yes (up to 50,000 THB) | ✅ Yes (up to 30,000 THB) | ✅ Yes (up to 100,000 THB) |
| **Same Day** | ✅ Yes (Bangkok) | ❌ No | ❌ No |
| **Weekend Delivery** | ✅ Yes | ✅ Yes | ❌ No |
| **Real-time Tracking** | ✅ Excellent | ✅ Good | ⭐ Basic |
| **Label Quality** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Customer Service** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Best For** | Premium e-commerce | Cost-effective volume | Budget shipping |

### Service Type Comparison

| Provider | Service | Speed | Price Range | Best Use Case |
|----------|---------|-------|-------------|---------------|
| **Kerry** | Same Day | 4-8 hours | 150-300 THB | Urgent Bangkok deliveries |
| **Kerry** | Express | 1-2 days | 60-120 THB | Premium shipping |
| **Kerry** | Standard | 2-3 days | 40-80 THB | Regular deliveries |
| **Flash** | Express | 1-2 days | 50-100 THB | Fast & affordable |
| **Flash** | Standard | 2-3 days | 35-70 THB | Balanced option |
| **Flash** | Economy | 3-5 days | 25-50 THB | Budget shipping |
| **Thailand Post** | EMS | 1-2 days | 45-85 THB | Government reliability |
| **Thailand Post** | Registered | 3-5 days | 20-40 THB | Most affordable |
| **Thailand Post** | Express | 2-3 days | 35-65 THB | Mid-range option |

## Setup

### 1. Environment Variables

Add the following to your `.env` file:

```bash
# Kerry Express
KERRY_API_KEY=your_kerry_api_key
KERRY_ENVIRONMENT=production

# Flash Express
FLASH_API_KEY=your_flash_api_key
FLASH_MERCHANT_ID=your_merchant_id
FLASH_ENVIRONMENT=production

# Thailand Post
THAILAND_POST_API_KEY=your_thailand_post_token
THAILAND_POST_ENVIRONMENT=production

# Default Sender Address
COMPANY_NAME=Your Company Name
COMPANY_PHONE=0123456789
COMPANY_ADDRESS=123 Your Address
COMPANY_DISTRICT=District
COMPANY_PROVINCE=Bangkok
COMPANY_POSTAL_CODE=10100
```

### 2. Database Migration

Run the shipping integration migration:

```bash
# Apply the migration
supabase migration up add_shipping_integration.sql
```

### 3. Initialize Providers

The providers are automatically initialized on first use. Verify in the admin panel:

```typescript
// Check available providers
const providers = await getShippingManager().getAvailableProviders();
console.log(providers); // Should show Kerry, Flash, Thailand Post
```

## Usage

### Get Shipping Rates

```typescript
import { getShippingManager } from '@/lib/shipping/shipping-manager';

const manager = getShippingManager();

// Get rates from all providers
const rates = await manager.getRates(
  '10100', // Origin postal code
  '50000', // Destination postal code
  1.5,     // Weight in kg
  {        // Optional dimensions
    width: 20,
    height: 10,
    length: 30
  }
);

// Rates are sorted by price (lowest first)
console.log(rates);
// [
//   { provider: 'flash', serviceType: 'economy', price: 35, ... },
//   { provider: 'thailand-post', serviceType: 'registered', price: 38, ... },
//   { provider: 'kerry', serviceType: 'standard', price: 45, ... }
// ]
```

### Create Shipment

```typescript
const shipment = await manager.createShipment({
  provider: 'kerry',
  orderId: 'order-uuid',
  senderAddress: {
    name: 'Company Name',
    phone: '0123456789',
    address: '123 Company St',
    district: 'Pathum Wan',
    province: 'Bangkok',
    postalCode: '10330'
  },
  recipientAddress: {
    name: 'Customer Name',
    phone: '0987654321',
    address: '456 Customer Rd',
    district: 'Mueang',
    province: 'Chiang Mai',
    postalCode: '50000'
  },
  parcel: {
    weight: 1.5,
    width: 20,
    height: 10,
    length: 30,
    codAmount: 1500, // Optional COD
    insuranceValue: 5000, // Optional insurance
    description: 'Electronics'
  },
  serviceType: 'standard'
});

console.log(shipment.trackingNumber); // KEX123456789
```

### Track Shipment

```typescript
const tracking = await manager.trackShipment(
  'kerry',
  'KEX123456789'
);

console.log(tracking);
// {
//   trackingNumber: 'KEX123456789',
//   status: 'in_transit',
//   statusDescription: 'In transit to destination',
//   estimatedDeliveryDate: '2024-01-15',
//   trackingHistory: [...]
// }
```

### Auto-Create Shipment from Order

```typescript
import { autoCreateShipmentForOrder } from '@/lib/shipping/order-integration';

const result = await autoCreateShipmentForOrder(
  'order-uuid',
  'flash',
  'express'
);

if (result.success) {
  console.log('Shipment created:', result.trackingNumber);
  // Automatically updates order status to "shipped"
  // Sends email notification to customer
}
```

## API Endpoints

### GET /api/shipping/rates

Get shipping rate quotes.

**Query Parameters:**
- `origin` (required): Origin postal code
- `destination` (required): Destination postal code
- `weight` (required): Weight in kg
- `width` (optional): Width in cm
- `height` (optional): Height in cm
- `length` (optional): Length in cm

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "provider": "kerry",
      "serviceType": "standard",
      "serviceName": "Kerry Standard",
      "price": 45,
      "currency": "THB",
      "estimatedDays": 2
    }
  ]
}
```

### POST /api/shipping/create

Create a new shipment.

**Request Body:**
```json
{
  "provider": "kerry",
  "orderId": "order-uuid",
  "senderAddress": { ... },
  "recipientAddress": { ... },
  "parcel": { ... },
  "serviceType": "standard"
}
```

### GET /api/shipping/[shipmentId]/track

Track a shipment.

**Response:**
```json
{
  "success": true,
  "data": {
    "trackingNumber": "KEX123456789",
    "status": "in_transit",
    "trackingHistory": [...]
  }
}
```

### PUT /api/shipping/[shipmentId]/cancel

Cancel a shipment.

**Request Body:**
```json
{
  "reason": "Customer request"
}
```

### GET /api/shipping/[shipmentId]/label

Get shipping label URL.

### GET /api/shipping/providers

Get list of available providers.

### POST /api/shipping/bulk

Create multiple shipments.

### POST /api/shipping/sync

Sync all active shipments.

## Components

### Customer Components

#### TrackingInfo
Display full tracking information with timeline.

```tsx
import { TrackingInfo } from '@/components/shipping/TrackingInfo';

<TrackingInfo orderId="order-uuid" />
```

#### TrackingLink
Simple tracking link to provider website.

```tsx
import { TrackingLink } from '@/components/shipping/TrackingLink';

<TrackingLink provider="kerry" trackingNumber="KEX123456789" />
```

### Admin Components

#### ShippingManager
Bulk shipment creation and management.

```tsx
import { ShippingManager } from '@/components/shipping/ShippingManager';

<ShippingManager />
```

#### ShipmentList
View and manage all shipments.

```tsx
import { ShipmentList } from '@/components/shipping/ShipmentList';

<ShipmentList />
```

## Best Practices

### 1. Provider Selection

**For High-Value Items:**
- Use Kerry Express for best tracking and customer service
- Enable insurance
- Use express or same-day service

**For Cost-Sensitive Shipping:**
- Use Flash Express for volume shipping
- Thailand Post for budget-conscious customers
- Standard or economy service

**For International:**
- Thailand Post EMS is the only option
- Consider DHL/FedEx for premium international (future integration)

### 2. Rate Caching

- Rates are cached for 24 hours
- Clear cache after provider rate changes
- Use fresh quotes for accurate pricing

### 3. Tracking Updates

- Sync active shipments daily (cron job)
- Real-time sync on customer view
- Webhook integration (future enhancement)

### 4. Error Handling

```typescript
try {
  const shipment = await manager.createShipment(request);
} catch (error) {
  if (error.message.includes('Invalid postal code')) {
    // Handle address validation error
  } else if (error.message.includes('API error')) {
    // Handle provider API error
  }
  // Log and notify admin
}
```

### 5. Testing

- Use sandbox/test environments for development
- Test with real addresses in production
- Verify webhook notifications
- Test label printing

## Future Enhancements

- [ ] DHL/FedEx integration for international
- [ ] Lalamove/Grab Express for same-day
- [ ] Webhook support for real-time updates
- [ ] Automated rate negotiation
- [ ] Delivery route optimization
- [ ] Customer pickup options
- [ ] Returns management integration
- [ ] Analytics and reporting dashboard

## Support

For issues or questions:
1. Check provider API documentation
2. Review error logs in Sentry
3. Contact provider customer service
4. Check integration status page

## License

MIT License - See LICENSE file for details
