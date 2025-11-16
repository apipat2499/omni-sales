# Wishlist & Favorites Management System Documentation

## Overview

The Wishlist & Favorites Management System enables customers to create and manage multiple wishlists, track product prices, share wishlists with others, and receive notifications about price drops. Built with sharing, price tracking, and customer engagement in mind.

## Database Schema

### Core Tables

#### `wishlists`
Customer wishlist containers.

**Columns:**
- `id` (uuid, PK) - Unique wishlist identifier
- `user_id` (uuid, FK) - Merchant/owner ID
- `customer_email` (varchar) - Customer email
- `wishlist_name` (varchar) - User-defined name
- `description` (text) - Wishlist description
- `is_public` (boolean) - Public or private visibility
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**
- `idx_wishlists_user` - Filter by merchant
- `idx_wishlists_customer` - Filter by customer email
- `idx_wishlists_visibility` - Public wishlist discovery

#### `wishlist_items`
Products added to wishlists with price tracking.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `wishlist_id` (uuid, FK)
- `product_id` (varchar) - Reference to product
- `product_name` (varchar)
- `product_image` (varchar) - Product image URL
- `price_at_added` (decimal) - Original price when added
- `current_price` (decimal) - Latest known price
- `priority` (integer) - Display order (0-3)
- `notes` (text) - Customer notes
- `quantity_desired` (integer) - Desired purchase quantity
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**
- `idx_wishlist_items_wishlist` - Items per wishlist
- `idx_wishlist_items_product` - Product discovery
- `idx_wishlist_items_priority` - Sorting

#### `wishlist_shares`
Shared wishlist access tokens and metadata.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `wishlist_id` (uuid, FK)
- `share_email` (varchar) - Recipient email
- `share_name` (varchar) - Recipient name
- `share_token` (varchar, unique) - URL-safe share token
- `share_type` (enum) - email, link, public
- `can_edit` (boolean) - Edit permissions
- `expires_at` (timestamp) - Expiration date
- `view_count` (integer) - Number of views
- `accessed_at` (timestamp) - Last access time
- `created_at` (timestamp)

**Indexes:**
- `idx_wishlist_shares_token` - Fast token lookup
- `idx_wishlist_shares_wishlist` - Shares per wishlist
- `idx_wishlist_shares_email` - Email-based sharing

#### `wishlist_price_history`
Price tracking for wishlist items.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `wishlist_item_id` (uuid, FK)
- `old_price` (decimal) - Previous price
- `new_price` (decimal) - New price
- `price_drop_amount` (decimal) - Absolute change
- `price_drop_percent` (decimal) - Percentage change
- `price_checked_at` (timestamp) - When price was updated
- `created_at` (timestamp)

**Indexes:**
- `idx_price_history_item` - Item price timeline
- `idx_price_history_date` - Date range queries

#### `wishlist_analytics`
Daily wishlist metrics and statistics.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `wishlist_id` (uuid, FK)
- `date` (timestamp) - Metric date
- `total_items` (integer) - Item count
- `total_value` (decimal) - Combined item value
- `average_price` (decimal) - Mean item price
- `share_count` (integer) - Active shares
- `created_at` (timestamp)

**Indexes:**
- `idx_analytics_wishlist` - Wishlist analytics timeline
- `idx_analytics_date` - Date-based queries

#### `wishlist_preferences`
Customer notification and visibility preferences.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `customer_email` (varchar, unique) - Customer identifier
- `notify_price_drops` (boolean) - Price change alerts
- `price_drop_threshold` (integer) - Minimum % drop to notify
- `notify_back_in_stock` (boolean) - Stock availability alerts
- `notify_shared_wishlists` (boolean) - Share activity alerts
- `weekly_digest` (boolean) - Summary emails
- `default_wishlist_visibility` (varchar) - private/public
- `updated_at` (timestamp)

**Indexes:**
- `idx_preferences_email` - Customer preferences lookup

## TypeScript Types

```typescript
export type WishlistVisibility = 'private' | 'public';
export type WishlistItemPriority = 0 | 1 | 2 | 3;
export type ShareType = 'email' | 'link' | 'public';

export interface Wishlist {
  id: string;
  userId: string;
  customerEmail: string;
  wishlistName: string;
  description?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WishlistItem {
  id: string;
  userId: string;
  wishlistId: string;
  productId: string;
  productName: string;
  productImage?: string;
  priceAtAdded: number;
  currentPrice: number;
  priority: number;
  notes?: string;
  quantityDesired: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WishlistShare {
  id: string;
  userId: string;
  wishlistId: string;
  shareEmail?: string;
  shareName?: string;
  shareToken: string;
  shareType: string;
  canEdit: boolean;
  expiresAt?: Date;
  viewCount: number;
  accessedAt?: Date;
  createdAt: Date;
}

export interface WishlistPriceHistory {
  id: string;
  userId: string;
  wishlistItemId: string;
  oldPrice: number;
  newPrice: number;
  priceDropAmount: number;
  priceDropPercent: number;
  priceCheckedAt: Date;
  createdAt: Date;
}

export interface WishlistAnalytics {
  id: string;
  userId: string;
  wishlistId: string;
  date: Date;
  totalItems: number;
  totalValue: number;
  averagePrice: number;
  shareCount: number;
  createdAt: Date;
}

export interface WishlistPreferences {
  id: string;
  userId: string;
  customerEmail: string;
  notifyPriceDrops: boolean;
  priceDropThreshold: number;
  notifyBackInStock: boolean;
  notifySharedWishlists: boolean;
  weeklyDigest: boolean;
  defaultWishlistVisibility: string;
  updatedAt: Date;
}

export interface WishlistWithItems extends Wishlist {
  items: WishlistItem[];
  itemCount: number;
  totalValue: number;
}
```

## Service Functions

### Wishlist Management

#### `createWishlist(userId, wishlist): Promise<Wishlist | null>`
Create a new wishlist.

```typescript
const wishlist = await createWishlist(userId, {
  customerEmail: 'customer@example.com',
  wishlistName: 'Birthday Gifts 2024',
  description: 'Ideas for my birthday',
  isPublic: false
});
```

#### `getWishlistWithItems(wishlistId): Promise<WishlistWithItems | null>`
Fetch wishlist with all items and calculated values.

```typescript
const wishlist = await getWishlistWithItems('wishlist-123');
console.log(wishlist?.itemCount);    // 5
console.log(wishlist?.totalValue);   // 245.50
```

#### `getUserWishlists(userId, customerEmail): Promise<WishlistWithItems[]>`
Get all wishlists for a customer.

```typescript
const wishlists = await getUserWishlists(userId, 'customer@example.com');
```

#### `updateWishlistVisibility(wishlistId, isPublic): Promise<boolean>`
Toggle wishlist public/private status.

```typescript
await updateWishlistVisibility('wishlist-123', true);
```

#### `deleteWishlist(wishlistId): Promise<boolean>`
Delete a wishlist and all associated items.

```typescript
const deleted = await deleteWishlist('wishlist-123');
```

### Item Management

#### `addWishlistItem(userId, wishlistId, item): Promise<WishlistItem | null>`
Add product to wishlist.

```typescript
const item = await addWishlistItem(userId, wishlistId, {
  productId: 'prod-456',
  productName: 'Premium Headphones',
  productImage: 'https://example.com/img.jpg',
  priceAtAdded: 199.99,
  currentPrice: 199.99,
  priority: 1,
  notes: 'Want the black color',
  quantityDesired: 1
});
```

#### `removeWishlistItem(userId, wishlistId, itemId): Promise<boolean>`
Remove item from wishlist.

```typescript
await removeWishlistItem(userId, wishlistId, 'item-123');
```

### Sharing

#### `shareWishlist(userId, wishlistId, share): Promise<WishlistShare | null>`
Create shareable wishlist access.

```typescript
const share = await shareWishlist(userId, wishlistId, {
  shareEmail: 'recipient@example.com',
  shareName: 'John Doe',
  shareType: 'email',
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  canEdit: false
});
```

#### `getSharedWishlist(shareToken): Promise<WishlistWithItems | null>`
Access shared wishlist via token.

```typescript
const wishlist = await getSharedWishlist('wl_1234567890abc');
// Updates view count and access timestamp
```

### Price Tracking

#### `trackPriceChange(userId, wishlistItemId, newPrice): Promise<WishlistPriceHistory | null>`
Record price change for item.

```typescript
const history = await trackPriceChange(userId, 'item-123', 179.99);
console.log(history?.priceDropAmount);  // 20.00
console.log(history?.priceDropPercent); // 10.0
```

#### `getItemPriceHistory(wishlistItemId): Promise<WishlistPriceHistory[]>`
Fetch historical price data for item.

```typescript
const history = await getItemPriceHistory('item-123');
// Returns array sorted by newest first
```

### Preferences

#### `updateWishlistPreferences(userId, customerEmail, preferences): Promise<WishlistPreferences | null>`
Update customer notification settings.

```typescript
const prefs = await updateWishlistPreferences(userId, 'customer@example.com', {
  notifyPriceDrops: true,
  priceDropThreshold: 5,
  notifyBackInStock: true,
  notifySharedWishlists: true,
  weeklyDigest: true,
  defaultWishlistVisibility: 'private'
});
```

#### `getWishlistPreferences(customerEmail): Promise<WishlistPreferences | null>`
Retrieve customer preferences.

```typescript
const prefs = await getWishlistPreferences('customer@example.com');
```

### Analytics

#### `updateWishlistAnalytics(userId, wishlistId): Promise<WishlistAnalytics | null>`
Calculate and store daily metrics.

```typescript
const analytics = await updateWishlistAnalytics(userId, 'wishlist-123');
```

#### `getWishlistAnalytics(wishlistId, days?): Promise<WishlistAnalytics[]>`
Fetch historical analytics data.

```typescript
const analytics = await getWishlistAnalytics('wishlist-123', 30);
```

## API Endpoints

### List & Create Wishlists
**GET/POST** `/api/wishlists`

**Query Parameters (GET):**
- `userId` (required)
- `customerEmail` (required)

**Request (POST):**
```json
{
  "userId": "user-123",
  "customerEmail": "customer@example.com",
  "wishlistName": "Birthday Gifts",
  "description": "Ideas for my birthday",
  "isPublic": false
}
```

**Response:**
```json
{
  "id": "wishlist-123",
  "userId": "user-123",
  "customerEmail": "customer@example.com",
  "wishlistName": "Birthday Gifts",
  "description": "Ideas for my birthday",
  "isPublic": false,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Get/Update/Delete Individual Wishlist
**GET/PATCH/DELETE** `/api/wishlists/[wishlistId]`

**PATCH Request (Update Visibility):**
```json
{
  "isPublic": true
}
```

**GET Response:**
```json
{
  "id": "wishlist-123",
  "wishlistName": "Birthday Gifts",
  "description": "Ideas for my birthday",
  "isPublic": false,
  "items": [
    {
      "id": "item-456",
      "productId": "prod-789",
      "productName": "Headphones",
      "currentPrice": 199.99,
      "quantity_desired": 1
    }
  ],
  "itemCount": 1,
  "totalValue": 199.99
}
```

### Manage Wishlist Items
**POST/DELETE** `/api/wishlists/[wishlistId]/items`

**POST Request (Add Item):**
```json
{
  "userId": "user-123",
  "productId": "prod-456",
  "productName": "Premium Headphones",
  "productImage": "https://example.com/img.jpg",
  "priceAtAdded": 199.99,
  "currentPrice": 199.99,
  "priority": 1,
  "notes": "Want the black color",
  "quantityDesired": 1
}
```

**DELETE Request (Remove Item):**
```json
{
  "userId": "user-123",
  "itemId": "item-123"
}
```

### Share Wishlist
**POST** `/api/wishlists/[wishlistId]/share`

**Request:**
```json
{
  "userId": "user-123",
  "shareEmail": "recipient@example.com",
  "shareName": "John Doe",
  "shareType": "email",
  "expiresAt": "2024-02-15T10:30:00Z",
  "canEdit": false
}
```

**Response:**
```json
{
  "id": "share-123",
  "shareToken": "wl_1704196200000_a1b2c3d4e5",
  "shareEmail": "recipient@example.com",
  "shareType": "email",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Access Shared Wishlist
**GET** `/api/wishlists/share/[shareToken]`

**Response:** Same as wishlist detail with view count incremented

### Price Tracking
**POST/GET** `/api/wishlists/[wishlistId]/prices`

**POST Request (Track Price):**
```json
{
  "userId": "user-123",
  "wishlistItemId": "item-123",
  "newPrice": 179.99
}
```

**GET Query Parameters:**
- `itemId` - Wishlist item ID

**Response (POST):**
```json
{
  "id": "history-456",
  "wishlistItemId": "item-123",
  "oldPrice": 199.99,
  "newPrice": 179.99,
  "priceDropAmount": 20.00,
  "priceDropPercent": 10.0,
  "priceCheckedAt": "2024-01-15T10:30:00Z"
}
```

### Preferences Management
**GET/POST** `/api/wishlists/preferences`

**Query Parameters (GET):**
- `customerEmail` (required)

**POST Request:**
```json
{
  "userId": "user-123",
  "customerEmail": "customer@example.com",
  "notifyPriceDrops": true,
  "priceDropThreshold": 5,
  "notifyBackInStock": true,
  "notifySharedWishlists": true,
  "weeklyDigest": false,
  "defaultWishlistVisibility": "private"
}
```

### Analytics
**GET** `/api/wishlists/[wishlistId]/analytics`

**Query Parameters:**
- `days` (optional, default: 30)

**Response:**
```json
{
  "data": [
    {
      "id": "analytics-123",
      "date": "2024-01-15T00:00:00Z",
      "totalItems": 5,
      "totalValue": 1245.50,
      "averagePrice": 249.10,
      "shareCount": 2
    }
  ],
  "total": 30
}
```

## UI Components

### Wishlist Dashboard Page
**Location:** `/app/wishlists/page.tsx`

Features:
- KPI cards (total wishlists, items, value, avg price)
- Multi-tab interface (My Wishlists, Shared, Analytics)
- Create wishlist modal
- Wishlist list with actions
- Share modal with email/link options
- Wishlist detail view

### Shared Wishlist Page
**Location:** `/app/wishlists/shared/[shareToken]/page.tsx`

Features:
- Wishlist display without edit permissions
- Price change indicators
- Price history visualization
- Stats cards
- Product information with images
- Back to home link
- Expiration handling

## User Workflows

### Creating a Wishlist
1. Click "New Wishlist" button
2. Enter wishlist name and optional description
3. Create wishlist (private by default)
4. View created wishlist in list

### Adding Items
1. Open wishlist
2. Click "Add Item" button
3. Enter product details (name, price, image URL, notes)
4. Set priority and desired quantity
5. Item added to wishlist

### Sharing a Wishlist
1. Open wishlist in dashboard
2. Click share button
3. Choose share type (email or link)
4. For email: enter recipient details, send
5. For link: generate shareable URL, copy
6. Recipient opens link without authentication

### Tracking Prices
1. Automatic: Daily price updates via cron job
2. Manual: Admin updates product price
3. System tracks old/new prices, calculates change
4. Notifies customer if drop exceeds threshold
5. History accessible in shared wishlist view

### Configuring Preferences
1. Go to Settings → Wishlist Preferences
2. Toggle notifications:
   - Price drops (with % threshold)
   - Back in stock alerts
   - Share activity
   - Weekly digest
3. Set default visibility
4. Save preferences

## Features

### Multiple Wishlists
- Create unlimited wishlists
- Organize by occasion or category
- Separate budgets and priorities
- Unique sharing for each

### Smart Price Tracking
- Automatic price monitoring
- Drop notifications
- Historical price graphs
- Wishlist valuation trends

### Flexible Sharing
- Email-based sharing with recipient names
- Public shareable links
- Temporary access with expiration
- View count tracking

### Customer Preferences
- Notification settings (opt-in/out)
- Price drop thresholds
- Stock alerts
- Weekly digest emails
- Default visibility preference

### Rich Product Information
- Product images
- Price comparisons (at-added vs current)
- Customer notes/specifications
- Desired quantity tracking
- Priority sorting

### Analytics
- Daily item count tracking
- Total wishlist value trending
- Average item prices
- Share engagement metrics
- Price change statistics

## Best Practices

### For Customers
- Create wishlists for different occasions
- Add notes for specific variations
- Update priorities regularly
- Share with family for gift planning
- Check analytics for budget planning

### For Merchants
- Monitor wishlist trends for inventory
- Highlight items from popular wishlists
- Offer notifications for price changes
- Use share data for marketing
- Feature items in wish lists

### For Platform
- Batch price updates nightly
- Archive old wishlists (90+ days inactive)
- Optimize analytics queries
- Implement expiring share tokens
- Clean up stale preference records

## Performance Optimization

- Index on `customer_email` for fast preference lookups
- Denormalized analytics table for reporting
- Paginate item lists in shared wishlists
- Cache wishlist summaries (30-min TTL)
- Archive old analytics after 1 year
- Batch email notifications

## Compliance & Privacy

- Soft delete for wishlists (status field)
- Customer control over preferences
- No third-party sharing without consent
- Anonymous view count (not tracked by user)
- GDPR deletion support
- Data retention policies

## Troubleshooting

### Wishlist Not Showing
- Verify user_id and customer_email match
- Check is_public flag
- Confirm no soft delete
- Verify share token not expired

### Price Not Updating
- Check product_id references
- Verify price tracking is enabled
- Check notification threshold settings
- Review price history records

### Share Not Working
- Verify share token is valid
- Check expiration date
- Confirm wishlist exists
- Verify customer email for email shares

### Analytics Missing
- Run updateWishlistAnalytics() manually
- Check date range queries
- Verify wishlist_id exists
- Review created_at timestamps
