# Dynamic Pricing Engine

## Overview

The Dynamic Pricing Engine is a sophisticated system for implementing intelligent, data-driven pricing strategies that maximize revenue and profit while remaining competitive. It supports multiple pricing algorithms, real-time competitor price tracking, demand-based adjustments, and comprehensive analytics.

## Key Features

- **Multiple Pricing Strategies**: Demand-based, competition-based, seasonality, inventory-based, customer segment-based pricing
- **Dynamic Price Calculation**: Real-time price optimization based on configurable rules
- **Competitor Price Tracking**: Monitor competitor prices and adjust accordingly
- **Demand Indicators**: Track demand signals (inventory, views, conversions, ratings)
- **Price Elasticity Analysis**: Calculate price elasticity coefficients and optimal pricing
- **Price Testing**: A/B test price changes and measure effectiveness
- **Historical Tracking**: Complete audit trail of all price changes
- **Revenue & Margin Analytics**: Measure impact of pricing decisions
- **Multi-rule Engine**: Stack and combine multiple pricing rules with priority ordering

## Database Schema

### 1. pricing_strategies
Stores pricing strategy configurations.

```sql
Table: pricing_strategies
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- strategy_name: VARCHAR (Strategy name)
- strategy_type: VARCHAR (demand_based|competition_based|seasonality|inventory_based|customer_segment|time_based)
- description: TEXT (Strategy description)
- base_strategy_id: UUID (Parent strategy for inheritance)
- is_active: BOOLEAN (Active status)
- apply_to_all: BOOLEAN (Apply to all products)
- priority: INTEGER (Execution priority)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

**Strategy Types**:
- **Demand-Based**: Price increases with demand (high demand = higher price)
- **Competition-Based**: Track and match competitor prices
- **Seasonality**: Adjust prices based on seasonal demand
- **Inventory-Based**: Increase price when stock is low
- **Customer Segment**: Different prices for different customer segments
- **Time-Based**: Time-based pricing (flash sales, peak hours)

**Example Strategies**:
```json
{
  "strategy_name": "Q4 Holiday Premium Pricing",
  "strategy_type": "demand_based",
  "priority": 10,
  "description": "Increase prices 15% during high-demand holiday season"
}
```

### 2. pricing_rules
Configurable rules within pricing strategies.

```sql
Table: pricing_rules
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- strategy_id: UUID (Foreign Key)
- rule_name: VARCHAR
- rule_type: VARCHAR (percentage|fixed_amount|cost_plus|value_based|bundle|threshold)
- condition_field: VARCHAR (Field to check)
- condition_operator: VARCHAR (>, <, ==, >=, <=)
- condition_value: VARCHAR (Value to compare)
- price_adjustment_type: VARCHAR (percentage|fixed_amount|absolute)
- price_adjustment_value: DECIMAL (Adjustment amount)
- min_price: DECIMAL (Minimum price boundary)
- max_price: DECIMAL (Maximum price boundary)
- is_active: BOOLEAN
- priority: INTEGER (Execution order)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

**Rule Types**:
- **Percentage**: Adjust price by percentage (+10%, -5%)
- **Fixed Amount**: Add/subtract fixed amount (+$5, -$2)
- **Cost Plus**: Price = Cost + Markup %
- **Value-Based**: Price based on perceived value
- **Bundle**: Special pricing for bundled products
- **Threshold**: Different prices at different thresholds

**Example Rules**:
```json
{
  "rule_name": "Low Stock Premium",
  "rule_type": "percentage",
  "condition_field": "stock_level",
  "condition_operator": "<",
  "condition_value": "10",
  "price_adjustment_type": "percentage",
  "price_adjustment_value": 15,
  "max_price": 999.99
}
```

### 3. competitor_prices
Track competitor pricing for products.

```sql
Table: competitor_prices
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- product_id: UUID (Foreign Key)
- competitor_name: VARCHAR (Competitor name)
- competitor_sku: VARCHAR (Competitor SKU)
- competitor_price: DECIMAL
- our_price: DECIMAL
- price_difference: DECIMAL (our_price - competitor_price)
- last_checked_at: TIMESTAMP
- is_available: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

**Use Cases**:
- Monitor competitor pricing
- Identify under/over-pricing opportunities
- Implement competitive matching
- Price comparison analytics

### 4. product_pricing_history
Complete audit trail of price changes.

```sql
Table: product_pricing_history
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- product_id: UUID (Foreign Key)
- old_price: DECIMAL
- new_price: DECIMAL
- price_change_percentage: DECIMAL
- change_reason: VARCHAR
- change_type: VARCHAR
- strategy_id: UUID (Strategy that triggered change)
- rule_id: UUID (Rule that triggered change)
- changed_by: VARCHAR (User or system)
- changed_at: TIMESTAMP
- effective_at: TIMESTAMP (When price became effective)
- created_at: TIMESTAMP
```

### 5. demand_indicators
Tracks demand signals for products.

```sql
Table: demand_indicators
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- product_id: UUID (Foreign Key)
- date: DATE
- demand_level: VARCHAR (very_low|low|medium|high|very_high)
- stock_level: INTEGER
- conversion_rate: DECIMAL
- views_count: INTEGER (Page views)
- add_to_cart_count: INTEGER
- purchase_count: INTEGER
- average_rating: DECIMAL
- review_count: INTEGER
- days_in_stock: INTEGER
- seasonality_index: DECIMAL
- trend_score: DECIMAL
- created_at: TIMESTAMP
```

**Demand Calculation**:
- Conversion Rate: (purchases / views) * 100
- Views/Stock Ratio: High ratio = high demand
- Trend Score: Momentum indicator
- Seasonality Index: Seasonal demand factor

### 6. price_elasticity
Price elasticity analysis for products.

```sql
Table: price_elasticity
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- product_id: UUID (Foreign Key)
- elasticity_coefficient: DECIMAL (Price elasticity of demand)
- price_range_min: DECIMAL (Tested price range)
- price_range_max: DECIMAL
- optimal_price: DECIMAL (Profit-maximizing price)
- confidence_score: DECIMAL (0-100)
- calculated_at: TIMESTAMP
- is_current: BOOLEAN (Latest calculation)
- created_at: TIMESTAMP
```

**Elasticity Interpretation**:
- Elasticity = -1.5 (elastic): 1% price increase → 1.5% quantity decrease
- Elasticity = -0.5 (inelastic): 1% price increase → 0.5% quantity decrease
- Elasticity = 0 (perfectly inelastic): Quantity unchanged by price
- Elasticity > 0: Unusual (Giffen/Veblen goods)

### 7. price_tests
A/B testing for price optimization.

```sql
Table: price_tests
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- product_id: UUID (Foreign Key)
- test_name: VARCHAR
- test_type: VARCHAR
- control_price: DECIMAL (Original price)
- test_price: DECIMAL (New price variant)
- test_percentage: INTEGER (% of traffic)
- start_date: TIMESTAMP
- end_date: TIMESTAMP
- status: VARCHAR (planning|active|completed|paused)
- winner_price: DECIMAL (Winning price)
- revenue_control: DECIMAL (Revenue at control price)
- revenue_test: DECIMAL (Revenue at test price)
- conversion_control: DECIMAL (Conversion rate - control)
- conversion_test: DECIMAL (Conversion rate - test)
- created_at: TIMESTAMP
```

### 8. dynamic_pricing_analytics
Daily pricing performance metrics.

```sql
Table: dynamic_pricing_analytics
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key)
- date: DATE
- strategy_id: UUID
- total_products_affected: INTEGER
- total_price_changes: INTEGER
- average_price_change: DECIMAL (%)
- revenue_impact: DECIMAL (Revenue change)
- margin_impact: DECIMAL (Margin change)
- demand_response: DECIMAL (Demand elasticity response)
- conversion_rate_change: DECIMAL (%)
- customer_satisfaction_impact: DECIMAL
- created_at: TIMESTAMP
```

## Service Layer

### Strategy Management

#### createPricingStrategy(userId, strategy)
Creates a new pricing strategy.

```typescript
async function createPricingStrategy(
  userId: string,
  strategy: Partial<PricingStrategy>
): Promise<PricingStrategy | null>
```

#### getPricingStrategies(userId)
Fetches all strategies for a user.

```typescript
async function getPricingStrategies(userId: string): Promise<PricingStrategy[]>
```

#### updatePricingStrategy(strategyId, updates)
Updates strategy configuration.

```typescript
async function updatePricingStrategy(
  strategyId: string,
  updates: Partial<PricingStrategy>
): Promise<boolean>
```

### Pricing Rules

#### createPricingRule(userId, rule)
Creates a pricing rule.

```typescript
async function createPricingRule(
  userId: string,
  rule: Partial<PricingRule>
): Promise<PricingRule | null>
```

#### getPricingRules(strategyId)
Fetches rules for a strategy.

```typescript
async function getPricingRules(strategyId: string): Promise<PricingRule[]>
```

### Price Calculation

#### calculateDynamicPrice(userId, productId, basePrice)
Calculates dynamic price applying all rules.

```typescript
async function calculateDynamicPrice(
  userId: string,
  productId: string,
  basePrice: number
): Promise<number>
```

**Algorithm**:
1. Load all active strategies sorted by priority
2. For each strategy, load its rules
3. Apply rules in priority order
4. Apply price adjustments (percentage, fixed, or absolute)
5. Apply min/max boundaries
6. Return final calculated price

#### updateProductPrice(userId, productId, newPrice, changeReason)
Updates product price and records history.

```typescript
async function updateProductPrice(
  userId: string,
  productId: string,
  newPrice: number,
  changeReason: string,
  strategyId?: string,
  ruleId?: string
): Promise<boolean>
```

### Competitor Tracking

#### recordCompetitorPrice(userId, productId, competitorName, competitorPrice, ourPrice)
Records competitor price.

```typescript
async function recordCompetitorPrice(
  userId: string,
  productId: string,
  competitorName: string,
  competitorPrice: number,
  ourPrice: number,
  competitorSku?: string
): Promise<CompetitorPrice | null>
```

#### getCompetitorPrices(productId)
Fetches competitor prices for a product.

```typescript
async function getCompetitorPrices(productId: string): Promise<CompetitorPrice[]>
```

### Demand Tracking

#### recordDemandIndicator(userId, productId, indicator)
Records demand indicators.

```typescript
async function recordDemandIndicator(
  userId: string,
  productId: string,
  indicator: Partial<DemandIndicator>
): Promise<DemandIndicator | null>
```

#### getDemandIndicators(productId, days)
Gets demand history.

```typescript
async function getDemandIndicators(
  productId: string,
  days: number = 30
): Promise<DemandIndicator[]>
```

### Price Elasticity

#### calculatePriceElasticity(userId, productId, historicalData)
Analyzes price elasticity from historical data.

```typescript
async function calculatePriceElasticity(
  userId: string,
  productId: string,
  historicalData: { price: number; quantity: number }[]
): Promise<PriceElasticity | null>
```

**Elasticity Formula**:
```
Elasticity = (% Change in Quantity Demanded) / (% Change in Price)
           = ((Q2 - Q1) / Q1) / ((P2 - P1) / P1)
```

### Price Testing

#### createPriceTest(userId, test)
Creates A/B test for price optimization.

```typescript
async function createPriceTest(
  userId: string,
  test: Partial<PriceTest>
): Promise<PriceTest | null>
```

#### getPriceTests(userId, status)
Gets price tests filtered by status.

```typescript
async function getPriceTests(
  userId: string,
  status?: string
): Promise<PriceTest[]>
```

#### updatePriceTest(testId, updates)
Updates test results and status.

```typescript
async function updatePriceTest(
  testId: string,
  updates: Partial<PriceTest>
): Promise<boolean>
```

### Analytics

#### recordPricingAnalytics(userId, analytics)
Records daily pricing analytics.

```typescript
async function recordPricingAnalytics(
  userId: string,
  analytics: Partial<DynamicPricingAnalytics>
): Promise<DynamicPricingAnalytics | null>
```

#### getPricingAnalytics(userId, days)
Gets historical pricing analytics.

```typescript
async function getPricingAnalytics(
  userId: string,
  days: number = 30
): Promise<DynamicPricingAnalytics[]>
```

#### getPricingHistory(productId, days)
Gets price change history.

```typescript
async function getPricingHistory(
  productId: string,
  days: number = 30
): Promise<ProductPricingHistory[]>
```

## API Endpoints

### 1. GET /api/pricing/strategies
Gets all pricing strategies.

**Query Parameters**:
- `userId` (required)

**Response**:
```json
{
  "data": [
    {
      "id": "str_123",
      "strategyName": "Demand-Based Pricing",
      "strategyType": "demand_based",
      "priority": 10,
      "isActive": true
    }
  ],
  "total": 1
}
```

### 2. POST /api/pricing/strategies
Creates a new strategy.

**Request Body**:
```json
{
  "userId": "user_123",
  "strategyName": "Holiday Pricing",
  "strategyType": "demand_based",
  "description": "Increase prices 20% during holiday season",
  "priority": 10
}
```

### 3. GET /api/pricing/rules
Gets rules for a strategy.

**Query Parameters**:
- `strategyId` (required)

### 4. POST /api/pricing/rules
Creates a pricing rule.

**Request Body**:
```json
{
  "userId": "user_123",
  "strategyId": "str_123",
  "ruleName": "Low Stock Premium",
  "ruleType": "percentage",
  "priceAdjustmentType": "percentage",
  "priceAdjustmentValue": 15,
  "minPrice": 10,
  "maxPrice": 999.99
}
```

### 5. POST /api/pricing/calculate
Calculates dynamic price.

**Request Body**:
```json
{
  "userId": "user_123",
  "productId": "prod_456",
  "basePrice": 99.99
}
```

**Response**:
```json
{
  "basePrice": 99.99,
  "dynamicPrice": 114.99,
  "priceChange": 15.00,
  "priceChangePercentage": 15.01
}
```

### 6. GET /api/pricing/competitors
Gets competitor prices.

**Query Parameters**:
- `productId` (required)

### 7. POST /api/pricing/competitors
Records competitor price.

**Request Body**:
```json
{
  "userId": "user_123",
  "productId": "prod_456",
  "competitorName": "Competitor A",
  "competitorPrice": 89.99,
  "ourPrice": 99.99
}
```

### 8. GET /api/pricing/analytics
Gets pricing analytics or history.

**Query Parameters**:
- `userId` (required for analytics)
- `productId` (optional, for history)
- `days` (optional, default 30)

## Implementation Examples

### Example 1: Create Demand-Based Pricing Strategy

```typescript
const strategy = await createPricingStrategy(userId, {
  strategyName: "Holiday Season Demand-Based",
  strategyType: "demand_based",
  priority: 10,
  description: "Automatically increase prices when demand is high"
});

// Add rule: If views > 1000 daily, increase price 15%
await createPricingRule(userId, {
  strategyId: strategy.id,
  ruleName: "High Demand Premium",
  ruleType: "percentage",
  condition_field: "views_count",
  condition_operator: ">",
  condition_value: "1000",
  priceAdjustmentType: "percentage",
  priceAdjustmentValue: 15,
  maxPrice: 999.99
});
```

### Example 2: Calculate and Apply Dynamic Price

```typescript
const dynamicPrice = await calculateDynamicPrice(userId, productId, 99.99);

// Update product with dynamic price
await updateProductPrice(
  userId,
  productId,
  dynamicPrice,
  "Dynamic pricing applied",
  strategyId,
  ruleId
);
```

### Example 3: Track Competitor Pricing

```typescript
// Record competitor prices
const competitors = [
  { name: "Amazon", price: 79.99 },
  { name: "BestBuy", price: 89.99 },
  { name: "WalMart", price: 84.99 }
];

for (const comp of competitors) {
  await recordCompetitorPrice(
    userId,
    productId,
    comp.name,
    comp.price,
    currentPrice
  );
}

// Get all competitor prices
const compPrices = await getCompetitorPrices(productId);
const avgCompPrice = compPrices.reduce((sum, c) => sum + c.competitorPrice, 0) / compPrices.length;
```

### Example 4: Price Elasticity Analysis

```typescript
// Collect historical pricing and quantity data
const historicalData = [
  { price: 100, quantity: 1000 },
  { price: 110, quantity: 900 },
  { price: 120, quantity: 750 },
  { price: 90, quantity: 1200 }
];

// Calculate elasticity
const elasticity = await calculatePriceElasticity(userId, productId, historicalData);

console.log(`Elasticity: ${elasticity?.elasticityCoefficient}`);
console.log(`Optimal Price: ${elasticity?.optimalPrice}`);
console.log(`Confidence: ${elasticity?.confidenceScore}%`);
```

### Example 5: Price A/B Testing

```typescript
// Create price test
const test = await createPriceTest(userId, {
  productId,
  testName: "$89.99 vs $99.99 Test",
  controlPrice: 99.99,
  testPrice: 89.99,
  testPercentage: 20, // 20% of traffic
  startDate: new Date(),
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  status: "planning"
});

// After test completes, update with results
await updatePriceTest(test.id, {
  status: "completed",
  revenueControl: 15000,
  revenueTest: 16500, // Test price generated more revenue
  conversionControl: 8.5,
  conversionTest: 10.2,
  winnerPrice: 89.99
});
```

## Best Practices

### 1. Strategy Design
- Start with one simple strategy before combining multiple
- Set clear priorities when combining strategies
- Document business logic for each strategy
- Review strategy effectiveness monthly

### 2. Rule Configuration
- Use conservative initial adjustments (5-10%)
- Set min/max price boundaries to prevent extreme prices
- Combine rules logically (AND conditions before OR)
- Monitor impact of each rule separately

### 3. Competitor Tracking
- Update competitor prices at least daily
- Track multiple competitors for accuracy
- Don't blindly match competitors
- Consider product quality differences

### 4. Demand Management
- Track inventory levels carefully
- Use low-stock pricing to manage inventory
- Avoid price wars on commodity items
- Implement surge pricing during peaks

### 5. Price Testing
- Test one variable at a time
- Ensure statistical significance (large enough sample)
- Run tests long enough to capture variations
- Document learnings from each test

### 6. Analytics & Monitoring
- Review pricing impact weekly
- Track revenue, margin, and demand response
- Monitor customer satisfaction
- Alert on unusual price changes

### 7. Compliance & Ethics
- Respect fair trade regulations
- Avoid price discrimination (when illegal)
- Be transparent with customers
- Monitor for margin erosion

## Troubleshooting

### Prices Not Changing
- Verify strategies and rules are active
- Check rule conditions are being met
- Ensure base price is set correctly
- Review priority ordering of strategies

### Unexpected Price Increases
- Check for rule overlap or conflicts
- Review minimum/maximum price bounds
- Verify condition operators (>, <, >=, <=)
- Check rule priority ordering

### Poor Revenue Impact
- Analyze price elasticity for products
- Test different price points
- Review competitor pricing
- Consider customer perception

### Performance Issues
- Archive old pricing history (> 1 year)
- Index frequently filtered columns
- Cache calculated prices
- Batch price update operations

## Future Enhancements

- Machine learning for demand forecasting
- Real-time competitor price scraping
- Margin optimization algorithms
- Psychological pricing strategies
- Personalized pricing per customer
- Inventory-aware replenishment pricing
- Promotion integration
- Geographic pricing variations
- Channel-specific pricing
