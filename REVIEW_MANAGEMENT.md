# Review & Rating Management System Documentation

## Overview

The Review & Rating Management System provides complete product review functionality with moderation, helpful/unhelpful voting, reporting, rating aggregation, and comprehensive analytics. Built with community safety, transparency, and SEO in mind.

## Database Schema

### Core Tables

#### `product_reviews`
Main product review records.

**Columns:**
- `id` (uuid, PK) - Unique review identifier
- `user_id` (uuid, FK) - Merchant/owner ID
- `product_id` (uuid, FK) - Reference to product
- `customer_id` (uuid) - Customer who left review
- `order_id` (uuid) - Associated order (for purchase verification)
- `customer_name` (varchar) - Reviewer name
- `customer_email` (varchar) - Reviewer email
- `title` (varchar) - Review title
- `content` (text) - Review body
- `rating` (integer) - 1-5 star rating
- `helpful_count` (integer) - Helpful votes
- `unhelpful_count` (integer) - Unhelpful votes
- `status` (enum) - pending, approved, rejected, hidden
- `moderation_notes` (text) - Moderator comments
- `verified_purchase` (boolean) - Verified as buyer
- `is_featured` (boolean) - Featured on product page
- `response_text` (text) - Seller response
- `response_by` (uuid) - Who responded
- `response_at` (timestamp) - Response time
- `reported_count` (integer) - Number of reports
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**
- `idx_product_reviews_user` - Filter by merchant
- `idx_product_reviews_product` - Product review list
- `idx_product_reviews_status` - Filter by status
- `idx_product_reviews_rating` - Filter by rating
- `idx_product_reviews_verified` - Verified purchase filter
- `idx_product_reviews_created` - Timeline queries
- `idx_product_reviews_order` - Purchase verification

#### `review_images`
Review images/attachments.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `review_id` (uuid, FK) - Reference to review
- `image_url` (varchar) - Image URL
- `alt_text` (varchar) - Accessibility text
- `display_order` (integer) - Display sequence
- `created_at` (timestamp)

#### `review_votes`
Helpful/unhelpful votes on reviews.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `review_id` (uuid, FK)
- `voter_email` (varchar) - Who voted (anonymized)
- `vote_type` (enum) - helpful, unhelpful
- `created_at` (timestamp)
- UNIQUE constraint: (review_id, voter_email, vote_type)

#### `review_reports`
Flagged/reported reviews.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `review_id` (uuid, FK)
- `reporter_email` (varchar)
- `report_reason` (enum) - inappropriate, fake, spam, offensive, factually_incorrect
- `report_description` (text)
- `status` (enum) - pending, reviewed, actioned, dismissed
- `action_taken` (varchar) - deleted, hidden, flagged, no_action
- `reviewed_by` (uuid) - Who reviewed the report
- `reviewed_at` (timestamp)
- `created_at` (timestamp)

#### `product_rating_summaries`
Denormalized rating aggregates (performance).

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `product_id` (uuid, unique, FK)
- `total_reviews` (integer)
- `approved_reviews` (integer)
- `average_rating` (decimal) - 0.00 to 5.00
- `rating_5_count` (integer) - Count of 5-star reviews
- `rating_4_count` (integer)
- `rating_3_count` (integer)
- `rating_2_count` (integer)
- `rating_1_count` (integer)
- `recommendation_count` (integer) - 4-5 star count
- `last_review_date` (timestamp)
- `updated_at` (timestamp)

#### `review_analytics`
Performance metrics and daily stats.

**Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK)
- `date` (timestamp) - Metric date
- `product_id` (uuid, FK)
- `total_new_reviews` (integer)
- `approved_reviews` (integer)
- `rejected_reviews` (integer)
- `average_rating` (decimal)
- `positive_reviews` (integer) - 4-5 stars
- `negative_reviews` (integer) - 1-2 stars
- `total_helpful_votes` (integer)
- `response_rate` (decimal) - Percentage
- `created_at` (timestamp)

## TypeScript Types

```typescript
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'hidden';
export type ReportReason = 'inappropriate' | 'fake' | 'spam' | 'offensive' | 'factually_incorrect';
export type ReportStatus = 'pending' | 'reviewed' | 'actioned' | 'dismissed';
export type VoteType = 'helpful' | 'unhelpful';

export interface ProductReview {
  id: string;
  userId: string;
  productId: string;
  customerId?: string;
  orderId?: string;
  customerName: string;
  customerEmail: string;
  title: string;
  content: string;
  rating: number; // 1-5
  helpfulCount: number;
  unhelpfulCount: number;
  status: ReviewStatus;
  moderationNotes?: string;
  verifiedPurchase: boolean;
  isFeatured: boolean;
  responseText?: string;
  responseBy?: string;
  responseAt?: Date;
  reportedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductRatingSummary {
  id: string;
  userId: string;
  productId: string;
  totalReviews: number;
  approvedReviews: number;
  averageRating: number;
  rating5Count: number;
  rating4Count: number;
  rating3Count: number;
  rating2Count: number;
  rating1Count: number;
  recommendationCount: number;
  lastReviewDate?: Date;
  updatedAt: Date;
}

export interface ReviewAnalytics {
  id: string;
  userId: string;
  date: Date;
  productId?: string;
  totalNewReviews: number;
  approvedReviews: number;
  rejectedReviews: number;
  averageRating: number;
  positiveReviews: number;
  negativeReviews: number;
  totalHelpfulVotes: number;
  responseRate: number;
  createdAt: Date;
}
```

## Service Functions

### Review Creation & Management

#### `createProductReview(userId, review): Promise<ProductReview | null>`
Create a new product review.

```typescript
const review = await createProductReview(userId, {
  productId: 'product-123',
  customerId: 'customer-456',
  orderId: 'order-789',
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  title: 'Great product!',
  content: 'Exactly what I needed. High quality and fast delivery.',
  rating: 5,
  verifiedPurchase: true
});
```

#### `addReviewImages(userId, reviewId, images): Promise<ReviewImage[]>`
Add images to a review.

```typescript
await addReviewImages(userId, reviewId, [
  {
    imageUrl: 'https://example.com/review1.jpg',
    altText: 'Product in use',
    displayOrder: 0
  }
]);
```

### Moderation

#### `moderateReview(reviewId, status, notes?): Promise<boolean>`
Approve or reject a review.

```typescript
await moderateReview(reviewId, 'approved', 'Verified purchase, genuine review');
```

#### `respondToReview(reviewId, responseText, respondedBy): Promise<boolean>`
Seller response to a review.

```typescript
await respondToReview(
  reviewId,
  'Thank you for your kind words! We appreciate your business.',
  userId
);
```

### Community Engagement

#### `voteOnReview(userId, reviewId, voterEmail, voteType): Promise<ReviewVote | null>`
Vote on review helpfulness.

```typescript
await voteOnReview(
  userId,
  reviewId,
  'user@example.com',
  'helpful'
);
```

#### `reportReview(userId, reviewId, reporterEmail, reason, description?): Promise<ReviewReport | null>`
Report inappropriate review.

```typescript
await reportReview(
  userId,
  reviewId,
  'reporter@example.com',
  'spam',
  'This review appears to be promotional content'
);
```

### Retrieval

#### `getProductReviews(productId, filters?): Promise<{reviews, total}>`
Fetch product reviews with filtering.

```typescript
const { reviews, total } = await getProductReviews(productId, {
  status: 'approved',
  rating: 5,
  onlyVerified: true,
  sortBy: 'helpful',
  limit: 10,
  offset: 0
});
```

#### `getPendingReviews(userId, limit?, offset?): Promise<{reviews, total}>`
Get reviews awaiting moderation.

```typescript
const { reviews, total } = await getPendingReviews(userId, 20, 0);
```

#### `getProductRatingSummary(productId): Promise<ProductRatingSummary | null>`
Get rating aggregate for product.

```typescript
const summary = await getProductRatingSummary(productId);
console.log(summary?.averageRating); // 4.5
console.log(summary?.totalReviews); // 127
```

### Analytics

#### `recordReviewAnalytics(userId, analytics): Promise<ReviewAnalytics | null>`
Record daily review metrics.

```typescript
await recordReviewAnalytics(userId, {
  date: new Date(),
  totalNewReviews: 15,
  approvedReviews: 14,
  rejectedReviews: 1,
  averageRating: 4.3,
  positiveReviews: 12,
  negativeReviews: 2,
  totalHelpfulVotes: 89,
  responseRate: 78.5
});
```

#### `getReviewAnalytics(userId, productId?, startDate?, endDate?): Promise<ReviewAnalytics[]>`
Get analytics for date range.

```typescript
const analytics = await getReviewAnalytics(
  userId,
  undefined,
  new Date('2024-01-01'),
  new Date('2024-01-31')
);
```

## API Endpoints

### Create Review
**POST** `/api/reviews/create`

**Request:**
```json
{
  "userId": "merchant-123",
  "productId": "product-456",
  "customerId": "customer-789",
  "orderId": "order-101",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "title": "Great product!",
  "content": "Exactly what I needed.",
  "rating": 5,
  "verifiedPurchase": true,
  "images": [
    {
      "imageUrl": "https://example.com/image.jpg",
      "altText": "Product in use"
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "id": "review-123",
  "productId": "product-456",
  "title": "Great product!",
  "rating": 5,
  "status": "pending",
  "verifiedPurchase": true,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Get Product Reviews
**GET** `/api/reviews/product?productId=...&status=approved&sortBy=helpful&limit=10`

**Query Parameters:**
- `productId` (required)
- `status` (optional) - Filter by approval status
- `rating` (optional) - Filter by star rating (1-5)
- `onlyVerified` (optional) - Show only verified purchases
- `sortBy` (optional) - recent, helpful, rating
- `limit` (default: 10)
- `offset` (default: 0)

**Response:**
```json
{
  "data": [
    {
      "id": "review-123",
      "productId": "product-456",
      "customerName": "John Doe",
      "title": "Great product!",
      "content": "Exactly what I needed.",
      "rating": 5,
      "helpfulCount": 45,
      "unhelpfulCount": 2,
      "verifiedPurchase": true,
      "status": "approved",
      "images": [...],
      "votes": [...]
    }
  ],
  "total": 127,
  "ratingSummary": {
    "averageRating": 4.5,
    "totalReviews": 127,
    "rating5Count": 95,
    "rating4Count": 20,
    "recommendation_count": 115
  }
}
```

### Get Pending Reviews (Moderation)
**GET** `/api/reviews/moderate?userId=...&limit=20`

**Response:**
```json
{
  "data": [
    {
      "id": "review-123",
      "productId": "product-456",
      "customerName": "John Doe",
      "title": "Great product!",
      "content": "Exactly what I needed.",
      "rating": 5,
      "status": "pending",
      "verifiedPurchase": true
    }
  ],
  "total": 5
}
```

### Moderate Review
**PATCH** `/api/reviews/moderate`

**Approve:**
```json
{
  "reviewId": "review-123",
  "action": "moderate",
  "status": "approved",
  "notes": "Verified authentic review"
}
```

**Respond:**
```json
{
  "reviewId": "review-123",
  "action": "respond",
  "responseText": "Thank you for your feedback!",
  "respondedBy": "merchant-123"
}
```

### Vote on Review
**POST** `/api/reviews/vote`

```json
{
  "userId": "merchant-123",
  "reviewId": "review-123",
  "voterEmail": "user@example.com",
  "voteType": "helpful"
}
```

### Report Review
**POST** `/api/reviews/report`

```json
{
  "userId": "merchant-123",
  "reviewId": "review-123",
  "reporterEmail": "reporter@example.com",
  "reason": "spam",
  "description": "This appears to be promotional content"
}
```

### Analytics
**GET/POST** `/api/reviews/analytics`

## Moderation Workflow

### 1. Review Submission
- Customer submits review with title, content, and rating (1-5 stars)
- Optional: Attach images from order
- Status: **pending**

### 2. Moderation
- Admin reviews pending reviews
- Check for:
  - Authenticity (verified purchase badge helps)
  - Appropriateness
  - Spam/promotional content
  - Offensive language
- Actions:
  - **Approve** - Becomes visible
  - **Reject** - Deleted or hidden
  - **Request changes** - Ask for edit (optional)

### 3. Seller Response
- Seller can respond to approved reviews
- Response appears below review
- Tracked for response rate analytics

### 4. Community Engagement
- Visitors vote reviews as helpful/unhelpful
- Report inappropriate reviews
- Featured reviews highlighted on product page

## Features

### Rating Display
- 5-star system with visual indicators
- Distribution breakdown (5★ 95, 4★ 20, etc.)
- Average rating prominently shown
- Recommendation percentage

### Verified Purchase Badge
- Reviews from verified customers highlighted
- Linked to order history
- Builds trust in review authenticity

### Rich Content
- Text reviews with title
- Image attachments (up to 5 per review)
- Seller responses
- Helpful/unhelpful voting

### Moderation Tools
- Bulk moderation dashboard
- Review filtering and search
- Report management
- Moderation notes/history

### Analytics
- Daily review metrics
- Rating trends
- Response rate tracking
- Positive/negative sentiment analysis

## SEO Benefits

- Reviews improve SEO (fresh content, keywords)
- Star ratings in search results
- Schema markup for structured data
- User-generated content
- Increased dwell time

## Anti-Spam Measures

- Verify purchase (order association)
- Report system for fake reviews
- Duplicate review detection
- Rate limiting (reviews per customer/IP)
- Keyword filtering for spam

## Best Practices

### For Customers
- Be honest and specific
- Mention if verified purchase
- Attach photos/videos
- Follow community guidelines
- No promotional content

### For Sellers
- Respond to all reviews
- Be professional and helpful
- Never ask for fake reviews
- Address negative feedback
- Thank reviewers

### For Platform
- Monitor for abuse
- Enforce guidelines consistently
- Protect reviewer privacy
- Encourage participation
- Showcase best reviews

## Performance Optimization

- Denormalized rating_summaries table
- Index on product_id, status, rating
- Cache rating aggregates
- Batch analytics recording
- Archive old reviews

## Compliance

### Privacy
- Anonymize voter email hashes
- Don't expose customer IDs
- GDPR deletion support (soft delete)

### Trust & Safety
- Report system prevents abuse
- Content moderation
- Verified purchase tracking
- Transparent guidelines

## Troubleshooting

### Review Not Appearing
- Check moderation status (must be approved)
- Verify verified_purchase flag
- Check for reports/blocks

### Rating Not Updating
- Refresh product_rating_summaries
- Verify approved review count
- Check for calculation errors

### Vote Count Issues
- Ensure unique voter email per vote type
- Check review vote aggregation
- Verify helpful_count field update
