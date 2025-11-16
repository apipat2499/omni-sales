# Analytics & Reporting Management System

## Overview

The Analytics & Reporting Management System is a comprehensive solution for tracking, aggregating, and visualizing business metrics across sales, customer, financial, operational, and marketing domains. It provides real-time KPI tracking, historical trend analysis, and actionable business insights through an interactive dashboard.

## Architecture

### Database Schema

#### Core Analytics Tables

1. **sales_analytics** - Daily sales performance metrics
   - `id` (UUID) - Primary key
   - `user_id` (VARCHAR) - Tenant identifier (RLS policy)
   - `analytics_date` (DATE) - Metrics date
   - `total_orders` (INT) - Number of orders processed
   - `total_revenue` (DECIMAL) - Gross revenue
   - `average_order_value` (DECIMAL) - AOV metric
   - `total_items_sold` (INT) - Total units sold
   - `total_discount_given` (DECIMAL) - Total discounts applied
   - `total_refunds` (DECIMAL) - Total refund amount
   - `net_revenue` (DECIMAL) - Revenue after refunds
   - `orders_by_status` (JSONB) - Breakdown by order status
   - `revenue_by_channel` (JSONB) - Revenue by sales channel
   - `revenue_by_category` (JSONB) - Revenue by product category
   - `top_products` (JSONB) - Top selling products
   - `created_at` (TIMESTAMP) - Record creation time
   - `updated_at` (TIMESTAMP) - Last update time

2. **customer_analytics** - Customer cohort and behavior metrics
   - `id` (UUID) - Primary key
   - `user_id` (VARCHAR) - Tenant identifier
   - `analytics_date` (DATE) - Metrics date
   - `total_customers` (INT) - Total active customers
   - `new_customers` (INT) - New customer acquisitions
   - `returning_customers` (INT) - Returning customer count
   - `active_customers` (INT) - Currently active customers
   - `customer_retention_rate` (DECIMAL) - Retention percentage
   - `average_customer_lifetime_value` (DECIMAL) - Customer LTV
   - `total_customer_spend` (DECIMAL) - Total customer spending
   - `customer_acquisition_cost` (DECIMAL) - CAC metric
   - `churn_rate` (DECIMAL) - Customer churn rate
   - `repeat_purchase_rate` (DECIMAL) - Repeat purchase percentage
   - `customers_by_segment` (JSONB) - Segmentation breakdown
   - `customers_by_location` (JSONB) - Geographic distribution
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

3. **product_analytics** - Per-product performance tracking
   - `id` (UUID) - Primary key
   - `user_id` (VARCHAR) - Tenant identifier
   - `product_id` (VARCHAR) - Product identifier
   - `analytics_date` (DATE) - Metrics date
   - `units_sold` (INT) - Units sold
   - `revenue` (DECIMAL) - Product revenue
   - `cost_of_goods` (DECIMAL) - COGS
   - `gross_profit` (DECIMAL) - Gross profit
   - `gross_margin` (DECIMAL) - Margin percentage
   - `average_rating` (DECIMAL) - Product rating
   - `review_count` (INT) - Number of reviews
   - `return_rate` (DECIMAL) - Return rate percentage
   - `stock_level` (INT) - Current stock
   - `turnover_rate` (DECIMAL) - Inventory turnover
   - `inventory_value` (DECIMAL) - Stock value
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

4. **financial_analytics** - Financial P&L and margin metrics
   - `id` (UUID) - Primary key
   - `user_id` (VARCHAR) - Tenant identifier
   - `analytics_date` (DATE) - Metrics date
   - `period_type` (VARCHAR) - daily|weekly|monthly|quarterly|yearly
   - `total_revenue` (DECIMAL) - Total revenue
   - `total_cost` (DECIMAL) - Total costs
   - `gross_profit` (DECIMAL) - Gross profit
   - `operating_expenses` (DECIMAL) - Operating expenses
   - `net_profit` (DECIMAL) - Net profit
   - `gross_margin` (DECIMAL) - Gross margin %
   - `operating_margin` (DECIMAL) - Operating margin %
   - `net_margin` (DECIMAL) - Net margin %
   - `revenue_by_source` (JSONB) - Revenue by source
   - `expense_by_category` (JSONB) - Expenses by category
   - `cash_flow_data` (JSONB) - Cash flow details
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

5. **marketing_analytics** - Campaign and channel performance
   - `id` (UUID) - Primary key
   - `user_id` (VARCHAR) - Tenant identifier
   - `analytics_date` (DATE) - Metrics date
   - `channel` (VARCHAR) - Marketing channel
   - `impressions` (INT) - Campaign impressions
   - `clicks` (INT) - Click count
   - `conversions` (INT) - Conversion count
   - `spend` (DECIMAL) - Marketing spend
   - `revenue` (DECIMAL) - Revenue generated
   - `email_sent` (INT) - Emails sent
   - `email_opened` (INT) - Email opens
   - `email_clicked` (INT) - Email clicks
   - `sms_sent` (INT) - SMS sent
   - `sms_conversion` (INT) - SMS conversions
   - `engagement_rate` (DECIMAL) - Engagement rate %
   - `conversion_rate` (DECIMAL) - Conversion rate %
   - `roi` (DECIMAL) - ROI percentage
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

6. **operational_analytics** - Fulfillment, quality, and service metrics
   - `id` (UUID) - Primary key
   - `user_id` (VARCHAR) - Tenant identifier
   - `analytics_date` (DATE) - Metrics date
   - `order_fulfillment_rate` (DECIMAL) - % orders fulfilled
   - `average_fulfillment_time` (DECIMAL) - Avg days to fulfill
   - `shipping_on_time_rate` (DECIMAL) - % on-time shipments
   - `inventory_accuracy` (DECIMAL) - Inventory accuracy %
   - `stock_out_incidents` (INT) - Number of stock-outs
   - `warehouse_utilization` (DECIMAL) - Warehouse usage %
   - `average_complaint_resolution_time` (DECIMAL) - Avg resolution days
   - `complaint_rate` (DECIMAL) - Complaints per order %
   - `return_rate` (DECIMAL) - Return rate percentage
   - `customer_satisfaction_score` (DECIMAL) - CSAT score (0-5)
   - `nps_score` (INT) - Net Promoter Score
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

7. **dashboard_reports** - Saved report configurations
   - `id` (UUID) - Primary key
   - `user_id` (VARCHAR) - Tenant identifier
   - `report_name` (VARCHAR) - Report name
   - `report_type` (VARCHAR) - Type of report
   - `report_config` (JSONB) - Report configuration
   - `refresh_frequency` (VARCHAR) - Refresh interval
   - `is_active` (BOOLEAN) - Active status
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

8. **report_snapshots** - Historical report snapshots
   - `id` (UUID) - Primary key
   - `report_id` (UUID) - Report reference
   - `snapshot_date` (TIMESTAMP) - Snapshot timestamp
   - `snapshot_data` (JSONB) - Report data snapshot
   - `metrics_summary` (JSONB) - Metrics summary
   - `created_at` (TIMESTAMP)

9. **kpi_tracking** - Daily KPI tracking
   - `id` (UUID) - Primary key
   - `user_id` (VARCHAR) - Tenant identifier
   - `kpi_name` (VARCHAR) - KPI identifier
   - `kpi_category` (VARCHAR) - KPI category
   - `target_value` (DECIMAL) - Target value
   - `actual_value` (DECIMAL) - Actual value
   - `status` (VARCHAR) - on_track|at_risk|exceeded
   - `trend` (DECIMAL) - Trend percentage
   - `analytics_date` (DATE) - Metrics date
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

### Indexing Strategy

```sql
-- Performance indexes on frequently queried columns
CREATE INDEX idx_sales_analytics_user_date ON sales_analytics(user_id, analytics_date);
CREATE INDEX idx_customer_analytics_user_date ON customer_analytics(user_id, analytics_date);
CREATE INDEX idx_product_analytics_user_product ON product_analytics(user_id, product_id);
CREATE INDEX idx_financial_analytics_user_period ON financial_analytics(user_id, period_type);
CREATE INDEX idx_marketing_analytics_user_channel ON marketing_analytics(user_id, channel);
CREATE INDEX idx_operational_analytics_user_date ON operational_analytics(user_id, analytics_date);
CREATE INDEX idx_kpi_tracking_user_date ON kpi_tracking(user_id, analytics_date);
CREATE INDEX idx_dashboard_reports_user ON dashboard_reports(user_id);
CREATE INDEX idx_report_snapshots_report ON report_snapshots(report_id);
```

### Row Level Security (RLS)

All analytics tables have RLS policies enabled:

```sql
-- Example RLS policy (applied to all tables)
CREATE POLICY enable_read_access ON sales_analytics
  FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY enable_write_access ON sales_analytics
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);
```

## TypeScript Types

### SalesAnalytics
```typescript
interface SalesAnalytics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalItemsSold: number;
  totalDiscountGiven: number;
  totalRefunds: number;
  netRevenue: number;
  ordersByStatus?: Record<string, any>;
  revenueByChannel?: Record<string, any>;
  revenueByCategory?: Record<string, any>;
  topProducts?: Record<string, any>;
}
```

### CustomerAnalytics
```typescript
interface CustomerAnalytics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  activeCustomers: number;
  customerRetentionRate: number;
  averageCustomerLifetimeValue: number;
  totalCustomerSpend: number;
  customerAcquisitionCost: number;
  churnRate: number;
  repeatPurchaseRate: number;
}
```

### ProductAnalytics
```typescript
interface ProductAnalytics {
  productId: string;
  analyticsDate: string;
  unitsSold: number;
  revenue: number;
  costOfGoods: number;
  grossProfit: number;
  grossMargin: number;
  averageRating: number;
  reviewCount: number;
  returnRate: number;
  stockLevel: number;
  turnoverRate: number;
  inventoryValue: number;
}
```

### FinancialAnalytics
```typescript
interface FinancialAnalytics {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  operatingExpenses: number;
  netProfit: number;
  grossMargin: number;
  operatingMargin: number;
  netMargin: number;
  revenueBySource?: Record<string, any>;
  expenseByCategory?: Record<string, any>;
  cashFlowData?: Record<string, any>;
}
```

### MarketingAnalytics
```typescript
interface MarketingAnalytics {
  channel: string;
  analyticsDate: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  emailSent: number;
  emailOpened: number;
  emailClicked: number;
  smsSent: number;
  smsConversion: number;
  engagementRate: number;
  conversionRate: number;
  roi: number;
}
```

### OperationalAnalytics
```typescript
interface OperationalAnalytics {
  orderFulfillmentRate: number;
  averageFulfillmentTime: number;
  shippingOnTimeRate: number;
  inventoryAccuracy: number;
  stockOutIncidents: number;
  warehouseUtilization: number;
  averageComplaintResolutionTime: number;
  complaintRate: number;
  returnRate: number;
  customerSatisfactionScore: number;
  npsScore: number;
}
```

## Service Layer (/lib/analytics/service.ts)

### Sales Analytics Functions

#### getSalesAnalytics(userId, analyticsDate)
Retrieves sales metrics for a specific date.
- **Parameters**: userId (string), analyticsDate (string)
- **Returns**: SalesAnalytics | null
- **Usage**: Fetch daily sales data for dashboard

#### getSalesAnalyticsHistory(userId, days)
Retrieves sales history for trend analysis.
- **Parameters**: userId (string), days (number, default: 30)
- **Returns**: SalesAnalytics[]
- **Usage**: Display historical sales trends

#### recordSalesAnalytics(userId, analyticsData)
Records new sales analytics entry.
- **Parameters**: userId (string), analyticsData (Partial<SalesAnalytics>)
- **Returns**: SalesAnalytics | null
- **Usage**: Store daily sales metrics

### Customer Analytics Functions

#### getCustomerAnalytics(userId, analyticsDate)
Retrieves customer metrics for a specific date.
- **Parameters**: userId (string), analyticsDate (string)
- **Returns**: CustomerAnalytics | null

#### recordCustomerAnalytics(userId, analyticsData)
Records customer analytics entry.
- **Parameters**: userId (string), analyticsData (Partial<CustomerAnalytics>)
- **Returns**: CustomerAnalytics | null

### Product Analytics Functions

#### getProductAnalytics(userId, productId, analyticsDate)
Retrieves metrics for specific product.
- **Parameters**: userId (string), productId (string), analyticsDate (string)
- **Returns**: ProductAnalytics | null

#### getTopProducts(userId, analyticsDate, limit)
Retrieves top performing products.
- **Parameters**: userId (string), analyticsDate (string), limit (number, default: 10)
- **Returns**: ProductAnalytics[]
- **Usage**: Display top products on dashboard

#### recordProductAnalytics(userId, analyticsData)
Records product analytics entry.
- **Parameters**: userId (string), analyticsData (Partial<ProductAnalytics>)
- **Returns**: ProductAnalytics | null

### Financial Analytics Functions

#### getFinancialAnalytics(userId, analyticsDate)
Retrieves financial metrics for date.
- **Parameters**: userId (string), analyticsDate (string)
- **Returns**: FinancialAnalytics | null

#### recordFinancialAnalytics(userId, analyticsData)
Records financial analytics entry.
- **Parameters**: userId (string), analyticsData (Partial<FinancialAnalytics>)
- **Returns**: FinancialAnalytics | null

### Marketing Analytics Functions

#### getMarketingAnalytics(userId, channel?, days)
Retrieves marketing metrics by channel.
- **Parameters**: userId (string), channel (string, optional), days (number, default: 30)
- **Returns**: MarketingAnalytics[]

#### recordMarketingAnalytics(userId, analyticsData)
Records marketing analytics entry.
- **Parameters**: userId (string), analyticsData (Partial<MarketingAnalytics>)
- **Returns**: MarketingAnalytics | null

### Operational Analytics Functions

#### getOperationalAnalytics(userId, analyticsDate)
Retrieves operational metrics for date.
- **Parameters**: userId (string), analyticsDate (string)
- **Returns**: OperationalAnalytics | null

#### recordOperationalAnalytics(userId, analyticsData)
Records operational analytics entry.
- **Parameters**: userId (string), analyticsData (Partial<OperationalAnalytics>)
- **Returns**: OperationalAnalytics | null

### KPI Tracking Functions

#### getKPITracking(userId, currentDate)
Retrieves KPI tracking for date.
- **Parameters**: userId (string), currentDate (string)
- **Returns**: KPITracking[]

#### recordKPITracking(userId, kpiData)
Records KPI tracking entry.
- **Parameters**: userId (string), kpiData (Partial<KPITracking>)
- **Returns**: KPITracking | null

### Dashboard Report Functions

#### getDashboardReports(userId)
Retrieves all saved reports.
- **Parameters**: userId (string)
- **Returns**: DashboardReport[]

#### createDashboardReport(userId, reportData)
Creates new dashboard report configuration.
- **Parameters**: userId (string), reportData (Partial<DashboardReport>)
- **Returns**: DashboardReport | null

#### getAnalyticsDashboardData(userId, analyticsDate)
Retrieves comprehensive dashboard data.
- **Parameters**: userId (string), analyticsDate (string)
- **Returns**: AnalyticsDashboardData | null
- **Usage**: Fetch all analytics data for dashboard in single call

## API Endpoints

### GET /api/analytics/dashboard
Retrieves comprehensive analytics dashboard data.

**Query Parameters**:
- `userId` (required): User identifier
- `date` (optional): Analytics date (default: today)

**Response**:
```json
{
  "data": {
    "salesAnalytics": { ... },
    "customerAnalytics": { ... },
    "financialAnalytics": { ... },
    "operationalAnalytics": { ... },
    "marketingAnalytics": [ ... ],
    "topProducts": [ ... ],
    "kpiTracking": [ ... ],
    "period": {
      "startDate": "2024-01-01",
      "endDate": "2024-01-31"
    }
  }
}
```

**Error Response**:
```json
{
  "error": "Missing userId"
}
```

### GET /api/analytics/sales
Retrieves sales analytics history.

**Query Parameters**:
- `userId` (required): User identifier
- `days` (optional): Number of days (default: 30)

**Response**:
```json
{
  "data": [ ... ],
  "total": 30
}
```

### POST /api/analytics/sales
Records new sales analytics.

**Request Body**:
```json
{
  "userId": "user-123",
  "analyticsDate": "2024-01-15",
  "totalOrders": 45,
  "totalRevenue": 12500.00,
  "averageOrderValue": 277.78,
  "totalItemsSold": 120,
  "totalDiscountGiven": 500.00,
  "totalRefunds": 100.00,
  "netRevenue": 12400.00
}
```

### GET /api/analytics/customer
Retrieves customer analytics.

**Query Parameters**:
- `userId` (required): User identifier
- `date` (optional): Analytics date

**Response**:
```json
{
  "data": {
    "totalCustomers": 5000,
    "newCustomers": 150,
    "returningCustomers": 4850,
    "activeCustomers": 3200,
    "customerRetentionRate": 97.0,
    "averageCustomerLifetimeValue": 2500.00,
    "totalCustomerSpend": 12500000.00,
    "customerAcquisitionCost": 25.00,
    "churnRate": 3.0,
    "repeatPurchaseRate": 65.0
  }
}
```

### GET /api/analytics/product
Retrieves top products.

**Query Parameters**:
- `userId` (required): User identifier
- `date` (optional): Analytics date
- `limit` (optional): Number of products (default: 10)

**Response**:
```json
{
  "data": [ ... ],
  "total": 10
}
```

### GET /api/analytics/financial
Retrieves financial analytics.

**Query Parameters**:
- `userId` (required): User identifier
- `date` (optional): Analytics date

**Response**:
```json
{
  "data": {
    "totalRevenue": 1000000.00,
    "totalCost": 600000.00,
    "grossProfit": 400000.00,
    "operatingExpenses": 150000.00,
    "netProfit": 250000.00,
    "grossMargin": 40.0,
    "operatingMargin": 25.0,
    "netMargin": 25.0
  }
}
```

### GET /api/analytics/operational
Retrieves operational metrics.

**Query Parameters**:
- `userId` (required): User identifier
- `date` (optional): Analytics date

**Response**:
```json
{
  "data": {
    "orderFulfillmentRate": 98.5,
    "averageFulfillmentTime": 2.3,
    "shippingOnTimeRate": 96.8,
    "inventoryAccuracy": 99.2,
    "stockOutIncidents": 2,
    "warehouseUtilization": 78.5,
    "averageComplaintResolutionTime": 24.0,
    "complaintRate": 1.2,
    "returnRate": 3.5,
    "customerSatisfactionScore": 4.5,
    "npsScore": 72
  }
}
```

## Dashboard Features

### Multi-Tab Interface
- **Overview Tab**: Summary of all key metrics
- **Sales Tab**: Sales metrics and top products
- **Customer Tab**: Customer cohort and health metrics
- **Financial Tab**: P&L statement and profitability
- **Operational Tab**: Fulfillment and quality metrics

### Key Metrics Display
- Total Revenue (formatted in thousands)
- Total Orders
- Active Customers
- Fulfillment Rate
- Trend comparison with previous period

### Interactive Features
- Date picker for historical data analysis
- Refresh button for real-time updates
- Download report as JSON
- Responsive grid layout
- Dark mode support

### Data Visualization
- KPI cards with trend indicators
- Summary sections with formatted metrics
- Responsive two-column grid layout
- Color-coded status indicators

## Usage Examples

### Recording Daily Sales Metrics
```typescript
const salesData = {
  userId: 'user-123',
  analyticsDate: new Date().toISOString().split('T')[0],
  totalOrders: 45,
  totalRevenue: 12500,
  averageOrderValue: 277.78,
  totalItemsSold: 120,
  totalDiscountGiven: 500,
  totalRefunds: 100,
  netRevenue: 12400,
  ordersByStatus: {
    completed: 40,
    pending: 3,
    cancelled: 2
  },
  revenueByChannel: {
    web: 8000,
    mobile: 3500,
    store: 1000
  }
};

const response = await fetch('/api/analytics/sales', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(salesData)
});
```

### Fetching Dashboard Data
```typescript
const userId = localStorage.getItem('userId');
const date = new Date().toISOString().split('T')[0];

const response = await fetch(
  `/api/analytics/dashboard?userId=${userId}&date=${date}`
);
const dashboardData = await response.json();
```

### Retrieving Historical Trends
```typescript
const response = await fetch(
  `/api/analytics/sales?userId=${userId}&days=90`
);
const historicalData = await response.json();
```

### Getting Top Products
```typescript
const response = await fetch(
  `/api/analytics/product?userId=${userId}&date=${date}&limit=5`
);
const topProducts = await response.json();
```

## Best Practices

### Data Recording
1. **Record metrics daily** at consistent times for trend analysis
2. **Include aggregated breakdowns** (by category, channel, status) in JSONB fields
3. **Validate metrics** before recording to ensure data quality
4. **Use proper date formats** (ISO 8601) for consistency

### Dashboard Usage
1. **Select appropriate time periods** for meaningful comparisons
2. **Monitor trend indicators** for early warning signs
3. **Cross-reference metrics** between tabs for insights
4. **Export data regularly** for external analysis

### Performance Optimization
1. **Query with date ranges** rather than fetching all history
2. **Use limit parameter** when retrieving top products/channels
3. **Cache dashboard data** on the client for 5-minute intervals
4. **Batch record operations** when inserting multiple analytics entries

## KPI Calculations

### Sales KPIs
- **Average Order Value** = Total Revenue / Total Orders
- **Net Revenue** = Total Revenue - Total Refunds - Total Discounts
- **Revenue Growth** = (Current Period Revenue - Previous Period Revenue) / Previous Period Revenue

### Customer KPIs
- **Customer Retention Rate** = (Returning Customers / Total Customers) × 100
- **Customer Acquisition Cost** = Marketing Spend / New Customers
- **Repeat Purchase Rate** = (Customers with 2+ purchases / Total Customers) × 100
- **Churn Rate** = 100 - Retention Rate

### Financial KPIs
- **Gross Margin** = (Gross Profit / Total Revenue) × 100
- **Operating Margin** = (Operating Profit / Total Revenue) × 100
- **Net Margin** = (Net Profit / Total Revenue) × 100

### Operational KPIs
- **On-Time Rate** = (On-Time Shipments / Total Shipments) × 100
- **Return Rate** = (Returned Items / Total Items Sold) × 100
- **Fulfillment Time** = Average days from order to shipment

### Marketing KPIs
- **Conversion Rate** = (Conversions / Clicks) × 100
- **ROI** = (Revenue - Spend) / Spend × 100
- **Engagement Rate** = (Email Opens / Email Sent) × 100

## Troubleshooting

### Dashboard Not Loading
1. Check userId is passed correctly
2. Verify user has analytics data recorded
3. Check browser console for API errors
4. Ensure date format is correct (YYYY-MM-DD)

### Metrics Not Updating
1. Verify data is being recorded to the database
2. Check that RLS policies allow read access
3. Ensure analytics_date matches the queried date
4. Validate data types match interface requirements

### Performance Issues
1. Add appropriate database indexes (see schema section)
2. Limit historical queries to reasonable date ranges
3. Cache dashboard data on the client side
4. Use pagination for large datasets

## Future Enhancements

1. **Advanced Filtering** - Time range, metric, and segment filters
2. **Custom Reports** - User-defined report configurations
3. **Alerts & Notifications** - Threshold-based alerts for KPIs
4. **Forecasting** - Trend prediction using ML models
5. **Comparison Analysis** - Year-over-year, month-over-month comparisons
6. **Data Export** - CSV, Excel, PDF export options
7. **Real-time Updates** - WebSocket support for live metrics
8. **Benchmarking** - Industry benchmarking and comparisons

## Security

All analytics data is protected by Supabase RLS policies ensuring:
- Users can only access their own (user_id) analytics data
- APIs require userId parameter for authentication
- Data isolation at the database level
- Compliance with multi-tenant architecture

## Related Documentation

- [Inventory Management](./INVENTORY_MANAGEMENT.md)
- [Returns Management](./RETURNS_MANAGEMENT.md)
- [Complaints Management](./COMPLAINTS_MANAGEMENT.md)
- [Database Schema](./supabase/schema.sql)
- [API Documentation](./API_DOCUMENTATION.md)
