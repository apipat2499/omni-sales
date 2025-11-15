# Product Recommendations Engine

## Overview

The Product Recommendations Engine is a sophisticated system designed to provide personalized product recommendations to customers based on their behavior, preferences, and purchasing history. It supports multiple recommendation algorithms, rule-based recommendations, and comprehensive performance tracking.

## Key Features

- **Multiple Algorithms**: Support for collaborative filtering, content-based, popularity-based, rule-based, and hybrid approaches
- **Product Embeddings**: Vector-based product similarity for advanced recommendations
- **Product Relationships**: Explicit upsell, cross-sell, complement, and similar product relationships
- **Rule-Based Recommendations**: Define custom rules for specific customer segments or conditions
- **Real-Time Tracking**: Track clicks, impressions, and conversions on recommendations
- **Performance Analytics**: Detailed metrics on recommendation effectiveness
- **Personalization Preferences**: Allow customers to customize their recommendation settings
- **Multi-Context Delivery**: Generate recommendations for different contexts (product page, cart, email, home, search)

## Database Schema

### 1. recommendation_algorithms
Stores configuration for different recommendation algorithms.

```sql
Table: recommendation_algorithms
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- algorithm_type: VARCHAR (collaborative|content_based|popularity|rule_based|hybrid)
- algorithm_name: VARCHAR (Algorithm name/version)
- description: TEXT (Algorithm description)
- config: JSONB (Algorithm-specific configuration)
- is_active: BOOLEAN (Active status)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

**Example Algorithm Configuration**:
```json
{
  "type": "collaborative",
  "min_support": 3,
  "similarity_threshold": 0.7,
  "weighting": {
    "recency": 0.3,
    "frequency": 0.4,
    "monetary": 0.3
  }
}
```

### 2. product_embeddings
Vector embeddings for products used in similarity calculations.

```sql
Table: product_embeddings
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- product_id: UUID (Foreign Key)
- embedding_model: VARCHAR (Model used)
- embedding_vector: FLOAT8[] (Dense vector)
- category_embedding: FLOAT8[] (Category-specific vector)
- quality_score: DECIMAL (0-100)
- updated_at: TIMESTAMP
```

**Use Cases**:
- Find similar products using vector similarity
- Cluster products into semantic groups
- Recommend based on product characteristics

### 3. product_relationships
Explicit relationships between products for manual recommendation rules.

```sql
Table: product_relationships
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- product_id_1: UUID (Source product)
- product_id_2: UUID (Related product)
- relationship_type: VARCHAR (upsell|cross_sell|complement|similar|bundle)
- strength: DECIMAL (0-100, relationship strength)
- frequency: INTEGER (Co-purchase frequency)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

**Relationship Types**:
- **Upsell**: Higher price/value product
- **Cross-Sell**: Complementary category
- **Complement**: Works well together
- **Similar**: Alternative option
- **Bundle**: Sold as a package

**Example Relationships**:
```json
{
  "product_id_1": "laptop_pro",
  "product_id_2": "laptop_case",
  "relationship_type": "complement",
  "strength": 95,
  "frequency": 342
}
```

### 4. product_recommendations
Generated recommendations for customers.

```sql
Table: product_recommendations
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- customer_id: UUID (Foreign Key)
- recommended_product_id: UUID (Product being recommended)
- recommendation_reason: VARCHAR (Why recommended)
- rank_position: INTEGER (Position in recommendation list)
- relevance_score: DECIMAL (0-100)
- algorithm_type: VARCHAR (Which algorithm generated this)
- recommendation_context: VARCHAR (product_page|cart|email|home|search)
- is_shown: BOOLEAN (Delivered to customer)
- shown_at: TIMESTAMP
- is_clicked: BOOLEAN (Customer clicked)
- clicked_at: TIMESTAMP
- is_purchased: BOOLEAN (Customer purchased)
- purchased_at: TIMESTAMP
- created_at: TIMESTAMP
```

**Context Examples**:
- **product_page**: Recommended on product detail pages
- **cart**: Shown in shopping cart
- **email**: Included in email campaigns
- **home**: Featured on homepage
- **search**: Integrated into search results

### 5. recommendation_clicks
Tracks clicks on recommendations.

```sql
Table: recommendation_clicks
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- customer_id: UUID (Foreign Key)
- recommendation_id: UUID (Reference)
- product_id: UUID (Clicked product)
- clicked_at: TIMESTAMP
- device_type: VARCHAR (desktop|mobile|tablet)
- referrer_page: VARCHAR (Page clicked from)
```

### 6. recommendation_conversions
Tracks purchases from recommendations.

```sql
Table: recommendation_conversions
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- customer_id: UUID (Foreign Key)
- recommendation_id: UUID (Reference)
- product_id: UUID (Purchased product)
- order_id: UUID (Order reference)
- revenue: DECIMAL (Transaction amount)
- converted_at: TIMESTAMP
```

### 7. recommendation_rules
Custom rules for generating recommendations.

```sql
Table: recommendation_rules
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- rule_name: VARCHAR (Rule name)
- rule_type: VARCHAR (if_purchase|if_category|if_segment|if_price_range|if_brand)
- condition_product_id: UUID (Trigger product)
- condition_category: VARCHAR (Trigger category)
- condition_segment_id: UUID (Trigger segment)
- condition_price_min: DECIMAL (Price threshold)
- condition_price_max: DECIMAL (Price threshold)
- recommended_product_ids: UUID[] (Products to recommend)
- is_active: BOOLEAN
- priority: INTEGER (Execution priority)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

**Example Rules**:
```json
{
  "rule_name": "Laptop Accessories",
  "rule_type": "if_category",
  "condition_category": "Laptops",
  "recommended_product_ids": ["laptop_case", "screen_protector", "keyboard"],
  "priority": 10
}
```

### 8. recommendation_analytics
Daily aggregated recommendation metrics.

```sql
Table: recommendation_analytics
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- date: DATE
- algorithm_type: VARCHAR
- total_recommendations: INTEGER
- total_impressions: INTEGER
- total_clicks: INTEGER
- total_conversions: INTEGER
- click_through_rate: DECIMAL
- conversion_rate: DECIMAL
- revenue_generated: DECIMAL
- avg_relevance_score: DECIMAL
- created_at: TIMESTAMP
```

### 9. recommendation_product_performance
Performance metrics per product.

```sql
Table: recommendation_product_performance
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- product_id: UUID (Foreign Key)
- date: DATE
- times_recommended: INTEGER
- times_clicked: INTEGER
- times_purchased: INTEGER
- revenue: DECIMAL
- click_rate: DECIMAL
- conversion_rate: DECIMAL
- created_at: TIMESTAMP
```

### 10. personalization_preferences
Customer preferences for recommendations.

```sql
Table: personalization_preferences
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- customer_id: UUID (Foreign Key)
- max_recommendations: INTEGER (Default: 5)
- preferred_categories: VARCHAR[]
- excluded_categories: VARCHAR[]
- preferred_price_range_min: DECIMAL
- preferred_price_range_max: DECIMAL
- exclude_already_viewed: BOOLEAN
- exclude_already_purchased: BOOLEAN
- enable_trending: BOOLEAN
- enable_similar: BOOLEAN
- enable_seasonal: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## Service Layer

### Algorithm Management

#### createAlgorithm(userId, algorithm)
Creates a new recommendation algorithm configuration.

```typescript
async function createAlgorithm(
  userId: string,
  algorithm: Partial<RecommendationAlgorithm>
): Promise<RecommendationAlgorithm | null>
```

#### getAlgorithms(userId)
Fetches all active algorithms for a user.

```typescript
async function getAlgorithms(userId: string): Promise<RecommendationAlgorithm[]>
```

#### updateAlgorithm(algorithmId, updates)
Updates algorithm configuration.

```typescript
async function updateAlgorithm(
  algorithmId: string,
  updates: Partial<RecommendationAlgorithm>
): Promise<boolean>
```

### Product Embeddings & Relationships

#### createProductEmbedding(userId, embedding)
Creates or updates product vector embeddings.

```typescript
async function createProductEmbedding(
  userId: string,
  embedding: Partial<ProductEmbedding>
): Promise<ProductEmbedding | null>
```

#### getProductEmbedding(productId)
Retrieves product embedding.

```typescript
async function getProductEmbedding(productId: string): Promise<ProductEmbedding | null>
```

#### createProductRelationship(userId, relationship)
Defines explicit relationship between products.

```typescript
async function createProductRelationship(
  userId: string,
  relationship: Partial<ProductRelationship>
): Promise<ProductRelationship | null>
```

#### getProductRelationships(productId, relationshipType?)
Fetches related products.

```typescript
async function getProductRelationships(
  productId: string,
  relationshipType?: string
): Promise<ProductRelationship[]>
```

### Recommendation Generation

#### generateRecommendations(userId, customerId, context, maxRecommendations)
Generates personalized recommendations for a customer.

```typescript
async function generateRecommendations(
  userId: string,
  customerId: string,
  context: string = 'product_page',
  maxRecommendations: number = 5
): Promise<ProductRecommendation[]>
```

**Recommendation Process**:
1. Fetch customer behavior history
2. Get active algorithms
3. Apply collaborative filtering
4. Apply content-based filtering
5. Apply rule-based recommendations
6. Rank and combine results
7. Store recommendation records

#### recordRecommendationImpression(recommendationId)
Marks recommendation as shown to customer.

```typescript
async function recordRecommendationImpression(
  recommendationId: string
): Promise<boolean>
```

#### getRecommendations(customerId, context?)
Retrieves stored recommendations for a customer.

```typescript
async function getRecommendations(
  customerId: string,
  context?: string
): Promise<ProductRecommendation[]>
```

### Tracking

#### trackRecommendationClick(userId, customerId, recommendationId, productId, deviceType?)
Records when customer clicks a recommendation.

```typescript
async function trackRecommendationClick(
  userId: string,
  customerId: string,
  recommendationId: string,
  productId: string,
  deviceType?: string
): Promise<boolean>
```

#### trackRecommendationConversion(userId, customerId, recommendationId, productId, orderId, revenue)
Records purchase from recommendation.

```typescript
async function trackRecommendationConversion(
  userId: string,
  customerId: string,
  recommendationId: string,
  productId: string,
  orderId: string,
  revenue: number
): Promise<boolean>
```

### Recommendation Rules

#### createRecommendationRule(userId, rule)
Creates a rule-based recommendation rule.

```typescript
async function createRecommendationRule(
  userId: string,
  rule: Partial<RecommendationRule>
): Promise<RecommendationRule | null>
```

#### getRecommendationRules(userId)
Fetches all active rules.

```typescript
async function getRecommendationRules(userId: string): Promise<RecommendationRule[]>
```

#### updateRecommendationRule(ruleId, updates)
Updates rule configuration.

```typescript
async function updateRecommendationRule(
  ruleId: string,
  updates: Partial<RecommendationRule>
): Promise<boolean>
```

### Analytics

#### recordRecommendationAnalytics(userId, analytics)
Records daily recommendation metrics.

```typescript
async function recordRecommendationAnalytics(
  userId: string,
  analytics: Partial<RecommendationAnalytics>
): Promise<RecommendationAnalytics | null>
```

#### getRecommendationAnalytics(userId, days)
Fetches historical recommendation metrics.

```typescript
async function getRecommendationAnalytics(
  userId: string,
  days: number = 30
): Promise<RecommendationAnalytics[]>
```

#### recordProductPerformance(userId, performance)
Records product recommendation performance.

```typescript
async function recordProductPerformance(
  userId: string,
  performance: Partial<RecommendationProductPerformance>
): Promise<RecommendationProductPerformance | null>
```

#### getProductPerformance(productId, days)
Fetches product recommendation performance.

```typescript
async function getProductPerformance(
  productId: string,
  days: number = 30
): Promise<RecommendationProductPerformance[]>
```

### Personalization

#### setPersonalizationPreferences(userId, customerId, preferences)
Sets customer recommendation preferences.

```typescript
async function setPersonalizationPreferences(
  userId: string,
  customerId: string,
  preferences: Partial<PersonalizationPreferences>
): Promise<PersonalizationPreferences | null>
```

#### getPersonalizationPreferences(customerId)
Gets customer recommendation preferences.

```typescript
async function getPersonalizationPreferences(
  customerId: string
): Promise<PersonalizationPreferences | null>
```

## API Endpoints

### 1. POST /api/recommendations/generate
Generates recommendations for a customer.

**Request Body**:
```json
{
  "userId": "user_123",
  "customerId": "cust_456",
  "context": "product_page",
  "maxRecommendations": 5
}
```

**Response**:
```json
{
  "data": [
    {
      "id": "rec_123",
      "customerId": "cust_456",
      "recommendedProductId": "prod_789",
      "recommendationReason": "Based on collaborative filtering",
      "rankPosition": 1,
      "relevanceScore": 87.5,
      "algorithmType": "collaborative",
      "recommendationContext": "product_page"
    }
  ],
  "total": 5
}
```

### 2. GET /api/recommendations/generate
Retrieves stored recommendations for a customer.

**Query Parameters**:
- `customerId` (required): Customer identifier
- `context` (optional): Recommendation context

**Response**:
```json
{
  "data": [{ /* recommendation object */ }],
  "total": 5
}
```

### 3. POST /api/recommendations/track
Tracks clicks and conversions on recommendations.

**Request Body for Click**:
```json
{
  "userId": "user_123",
  "customerId": "cust_456",
  "recommendationId": "rec_123",
  "productId": "prod_789",
  "trackingType": "click",
  "deviceType": "mobile"
}
```

**Request Body for Conversion**:
```json
{
  "userId": "user_123",
  "customerId": "cust_456",
  "recommendationId": "rec_123",
  "productId": "prod_789",
  "trackingType": "conversion",
  "orderId": "order_123",
  "revenue": 49.99
}
```

### 4. GET /api/recommendations/track
Retrieves tracking data for recommendations.

**Query Parameters**:
- `customerId` (required): Customer identifier
- `type` (required): "clicks" or "conversions"
- `days` (optional): Days of history (default 30)

### 5. GET /api/recommendations/analytics
Fetches recommendation analytics.

**Query Parameters**:
- `userId` (required): User identifier
- `productId` (optional): Specific product ID for product performance
- `days` (optional): Days of history (default 30)

**Response**:
```json
{
  "data": [
    {
      "date": "2024-01-15",
      "totalRecommendations": 1250,
      "totalImpressions": 1250,
      "totalClicks": 125,
      "totalConversions": 25,
      "clickThroughRate": 10.0,
      "conversionRate": 2.0,
      "revenueGenerated": 1247.50,
      "avgRelevanceScore": 78.5
    }
  ],
  "total": 30
}
```

## Implementation Examples

### 1. Generate Recommendations on Product Page

```typescript
const recommendations = await generateRecommendations(
  userId,
  customerId,
  'product_page',
  5
);

// Display recommendations to customer
recommendations.forEach((rec) => {
  // Track impression
  await recordRecommendationImpression(rec.id);
});
```

### 2. Track Recommendation Click

```typescript
const trackClick = async (recommendationId: string, productId: string) => {
  await fetch('/api/recommendations/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      customerId,
      recommendationId,
      productId,
      trackingType: 'click',
      deviceType: 'mobile'
    })
  });
};
```

### 3. Track Purchase from Recommendation

```typescript
const trackConversion = async (orderId: string, items: any[]) => {
  for (const item of items) {
    // Find corresponding recommendation
    const recommendation = await findRecommendation(item.productId, customerId);

    if (recommendation) {
      await fetch('/api/recommendations/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          customerId,
          recommendationId: recommendation.id,
          productId: item.productId,
          trackingType: 'conversion',
          orderId,
          revenue: item.price * item.quantity
        })
      });
    }
  }
};
```

### 4. Create Rule-Based Recommendations

```typescript
const createUpselRule = async () => {
  await createRecommendationRule(userId, {
    ruleName: 'Laptop Accessories Upsell',
    ruleType: 'if_category',
    conditionCategory: 'Laptops',
    recommendedProductIds: [
      'laptop_case_id',
      'laptop_stand_id',
      'keyboard_id'
    ],
    priority: 10,
    isActive: true
  });
};
```

### 5. Analyze Recommendation Performance

```typescript
const analyzePerformance = async () => {
  const analytics = await getRecommendationAnalytics(userId, 30);

  const summary = {
    avgCTR: analytics.reduce((sum, a) => sum + (a.clickThroughRate || 0), 0) / analytics.length,
    totalRevenue: analytics.reduce((sum, a) => sum + (a.revenueGenerated || 0), 0),
    avgRelevance: analytics.reduce((sum, a) => sum + (a.avgRelevanceScore || 0), 0) / analytics.length
  };

  return summary;
};
```

## Best Practices

### 1. Algorithm Selection
- Start with collaborative filtering for most use cases
- Use content-based for new products without purchase history
- Combine multiple algorithms (hybrid approach) for best results
- Regularly evaluate and update algorithm weights

### 2. Recommendation Context
- Product page: Similar and complementary products
- Cart: Upsell and cross-sell opportunities
- Email: Personalized high-relevance products
- Home page: Popular and trending products
- Search: Results matching user intent

### 3. Performance Optimization
- Cache frequently generated recommendations
- Use batch processing for analytics calculations
- Implement recommendation scheduling for off-peak times
- Monitor CTR and conversion rates by algorithm

### 4. Data Quality
- Ensure product embeddings are regularly updated
- Maintain accurate product relationship data
- Track and validate customer behavior events
- Clean old recommendation data regularly

### 5. User Experience
- Limit recommendations to 5-10 per context
- Explain why products are recommended
- Respect customer preferences and exclusions
- Test different recommendation strategies (A/B testing)

### 6. Privacy & Compliance
- Allow customers to opt out of personalization
- Respect GDPR and data privacy regulations
- Anonymize user data in analytics
- Maintain audit logs for recommendations

## Troubleshooting

### No Recommendations Generated
- Check that algorithms are configured and active
- Verify customer has behavior history
- Ensure product relationships are defined
- Check recommendation rules are properly configured

### Low Click-Through Rate
- Review recommendation relevance scores
- Check if recommendations are visible/prominent
- Validate product embeddings quality
- Test different algorithms

### Conversion Rate Below Expectations
- Analyze which products have low conversion rates
- Check if recommended products are in stock
- Review pricing competitiveness
- Evaluate product recommendations vs customer intent

### Performance Issues
- Index database queries on frequently filtered columns
- Archive old recommendation records (> 1 year)
- Use materialized views for complex analytics
- Consider denormalization for hot tables

## Future Enhancements

- Machine learning models for churn prediction
- A/B testing framework for recommendation variants
- Real-time personalization using edge computing
- Multi-language and locale-aware recommendations
- Integration with external recommendation services
- Deep learning models for image-based recommendations
- Social influence-based recommendations
- Seasonal and trend-based recommendations
- Recommendation diversity algorithms
- Explainable AI for recommendation reasoning
