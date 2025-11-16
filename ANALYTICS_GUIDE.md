# Advanced Analytics & Reporting Guide

This guide explains the advanced analytics features in Omni Sales that help businesses understand their sales performance, customer behavior, and optimize their operations.

## Overview

The Analytics module provides:
- **Real-time KPI Dashboard** - Key metrics at a glance
- **Product Performance Analysis** - Identify best/worst sellers
- **Customer Insights** - RFM analysis, segmentation, churn prediction
- **Channel Analytics** - Compare performance across sales channels
- **Anomaly Detection** - Alert on unusual patterns
- **Sales Forecasting** - Predict future performance
- **Custom Reports** - PDF/Excel export for stakeholders

## Features

### 1. Real-Time KPI Dashboard

The main analytics page shows:

- **Total Revenue** - Sum of all order amounts
- **Total Orders** - Number of orders
- **Unique Customers** - Count of individual customers
- **Average Order Value** - Revenue divided by orders
- **Growth Metrics** - Compare with previous period

```
GET /api/analytics/dashboard?userId={userId}&daysBack={days}
```

### 2. Product Performance

Analyze which products are:
- **Best sellers** - By units sold
- **Revenue generators** - By total revenue
- **Most profitable** - By profit margin

```
GET /api/analytics/products?userId={userId}&daysBack=30&sortBy=revenue
```

#### Response:
```json
{
  "data": [
    {
      "productId": "uuid",
      "name": "Product Name",
      "totalUnitsSold": 150,
      "totalRevenue": 75000,
      "totalProfit": 30000,
      "avgProfit": 200
    }
  ],
  "count": 20,
  "period": {
    "daysBack": 30,
    "startDate": "2024-10-15"
  }
}
```

### 3. Customer Analytics

Understand customer behavior:

- **Lifetime Value (LTV)** - Total amount spent by customer
- **Purchase Frequency** - How often they buy
- **Recency** - Days since last purchase
- **Segmentation** - VIP, Loyal, At-Risk, New
- **RFM Score** - Recency-Frequency-Monetary scoring
- **Churn Risk** - Probability of customer leaving

```
GET /api/analytics/customers?userId={userId}&segment=vip&limit=50
```

#### Customer Segments:

| Segment | Criteria | Action |
|---------|----------|--------|
| **VIP** | Lifetime Value > ฿5,000 | White-glove service, exclusive offers |
| **Loyal** | 5+ orders | Retention rewards, referral programs |
| **At-Risk** | 90+ days since purchase, churn risk > 0.5 | Win-back campaigns, discounts |
| **New** | First order within 30 days | Onboarding, second purchase incentive |

### 4. Channel Performance

Compare sales across channels:

```
GET /api/analytics/channels?userId={userId}&daysBack=30
```

Example channels:
- **Shopee** - Marketplace 1
- **Lazada** - Marketplace 2
- **Facebook** - Social commerce
- **Direct** - Own website/phone

#### Metrics:
- **Orders by channel** - Volume
- **Revenue by channel** - Total sales
- **Profit by channel** - Net income
- **Average Order Value** - AOV per channel
- **ROI** - Return on investment

### 5. Anomaly Detection

Automatically detect:
- **Unusual spike in returns**
- **Drop in conversion rate**
- **Revenue spike/crash**
- **Unexpected customer churn**
- **Inventory discrepancies**

#### Severity Levels:
- 🔴 **High** - Immediate action required
- 🟡 **Medium** - Investigate within 24h
- 🔵 **Low** - Monitor for trends

### 6. Sales Forecasting

Predict future performance using:
- **Moving Average** - Simple 7-day average
- **Trend Analysis** - Growth/decline patterns
- **Seasonality** - Account for seasonal variations

Example forecast:
```json
{
  "forecastDate": "2024-11-15",
  "predictedOrders": 45,
  "predictedRevenue": 22500,
  "predictedProfit": 9000,
  "confidenceScore": 0.85
}
```

## Database Schema

### daily_metrics
Aggregated daily metrics for fast dashboard loading
- `date` - Day of metrics
- `total_orders` - Count of orders
- `total_revenue` - Sum of revenues
- `total_profit` - Net profit
- `unique_customers` - Count of unique customers
- `returned_orders` - Returns/cancellations

### product_performance
Per-product daily metrics
- `product_id` - Reference to product
- `units_sold` - Quantity sold
- `revenue` - Total sales amount
- `profit` - Net profit
- `trend` - % change from previous day

### customer_analytics
Aggregated customer metrics (updated daily)
- `lifetime_value` - Total spent
- `order_count` - Number of orders
- `purchase_frequency` - Orders per month
- `segment` - VIP/Loyal/At-Risk/New
- `churn_risk` - 0-1 score
- `rfm_score` - RFM segmentation

### channel_performance
Per-channel daily metrics
- `channel` - Sales channel name
- `orders` - Order count
- `revenue` - Total sales
- `roi` - Return on investment

### anomalies
Detected anomalies and alerts
- `anomaly_type` - Type of anomaly
- `severity` - low/medium/high
- `description` - Human-readable explanation
- `is_resolved` - Resolution status

## API Endpoints

### Dashboard
```
GET /api/analytics/dashboard
Parameters:
  - userId (required): User UUID
  - daysBack (optional): Days to analyze (default: 30)

Returns: Complete dashboard data with all metrics
```

### Products
```
GET /api/analytics/products
Parameters:
  - userId (required): User UUID
  - daysBack (optional): Days to analyze (default: 30)
  - sortBy (optional): 'revenue' | 'profit' | 'units' (default: 'revenue')
  - limit (optional): Max results (default: 20)

Returns: Aggregated product performance data
```

### Customers
```
GET /api/analytics/customers
Parameters:
  - userId (required): User UUID
  - segment (optional): Filter by segment
  - limit (optional): Max results (default: 50)
  - offset (optional): Pagination offset (default: 0)

Returns: Customer analytics with segment distribution
```

### Channels
```
GET /api/analytics/channels
Parameters:
  - userId (required): User UUID
  - daysBack (optional): Days to analyze (default: 30)

Returns: Channel performance comparison
```

## Utility Functions

### Calculate Daily Metrics
```typescript
import { calculateDailyMetrics } from '@/lib/analytics/utils';

const metrics = await calculateDailyMetrics(userId, '2024-11-15');
```

### Calculate Customer Analytics
```typescript
import { calculateCustomerAnalytics } from '@/lib/analytics/utils';

const analytics = await calculateCustomerAnalytics(userId, customerId);
```

### Detect Anomalies
```typescript
import { detectAnomalies } from '@/lib/analytics/utils';

const isAnomaly = detectAnomalies(currentValue, historicalAverage, stdDev);
```

### Generate Forecast
```typescript
import { generateSimpleForcast } from '@/lib/analytics/utils';

const forecast = generateSimpleForcast(historicalRevenue, 7); // 7-day forecast
```

## Best Practices

### Data Accuracy
- Ensure costs are accurately recorded for profit calculation
- Keep customer data clean and up-to-date
- Regularly audit order data for inconsistencies
- Update metrics daily for accurate analytics

### Using Analytics
- Review dashboard weekly to spot trends
- Pay attention to anomaly alerts
- Use RFM segmentation for targeted marketing
- Track channel performance to optimize spend
- Monitor churn risk to reduce customer loss

### Advanced Usage
- Export monthly reports for stakeholder updates
- Compare YoY performance for growth tracking
- Use customer segments for personalized campaigns
- Forecast inventory needs based on sales predictions
- Identify slow-moving products for promotions

## Pricing Tiers

Analytics is a **Premium Feature**:

| Plan | Features | Price |
|------|----------|-------|
| **Free** | Basic sales dashboard only | $0 |
| **Pro** | Full analytics + forecasting | $19/month |
| **Enterprise** | Custom analytics + BI integration | Custom |

## Performance Optimization

### Dashboard Speed
The dashboard uses pre-aggregated tables for fast queries:
- `daily_metrics` - One row per day
- `product_performance` - One row per product per day
- `channel_performance` - One row per channel per day

This provides <100ms response time for dashboards.

### Background Jobs
Create a cron job to update metrics daily:

```typescript
// runs every day at midnight
export async function POST(req: NextRequest) {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const users = await getActiveUsers();

  for (const user of users) {
    await calculateDailyMetrics(user.id, yesterday);
    await updateCustomerAnalytics(user.id);
    await detectAnomalies(user.id);
  }
}
```

## Example Queries

### Top Products Last 30 Days
```
GET /api/analytics/products?userId=xxx&daysBack=30&sortBy=revenue&limit=10
```

### VIP Customers
```
GET /api/analytics/customers?userId=xxx&segment=vip&limit=100
```

### Channel Comparison
```
GET /api/analytics/channels?userId=xxx&daysBack=90
```

### Real-Time Dashboard
```
GET /api/analytics/dashboard?userId=xxx&daysBack=1
```

## Troubleshooting

### Dashboard Showing No Data
- Check that orders exist in the database
- Verify daily_metrics table is populated
- Run `calculateDailyMetrics` for the date range

### Anomalies Not Detected
- Ensure anomaly detection cron job is running
- Check historical data is sufficient (7+ days)
- Verify anomaly thresholds are appropriate

### Slow Dashboard
- Add indexes on user_id + date columns
- Archive old metrics to separate tables
- Consider caching results for 5-10 minutes

## Future Enhancements

Planned features:
- [ ] Cohort analysis
- [ ] Attribution modeling
- [ ] Predictive churn modeling
- [ ] Inventory optimization
- [ ] Price elasticity analysis
- [ ] A/B testing framework
- [ ] BI tool integration (Tableau, Metabase)
- [ ] Real-time streaming analytics
- [ ] Custom dimension support
- [ ] ML-powered recommendations
