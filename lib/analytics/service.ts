import { createClient } from '@supabase/supabase-js';
import { SalesAnalytics, CustomerAnalytics, ProductAnalytics, FinancialAnalytics, MarketingAnalytics, OperationalAnalytics, DashboardReport, ReportSnapshot, KPITracking, AnalyticsDashboardData, AnalyticsFilter } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// SALES ANALYTICS
export async function getSalesAnalytics(userId: string, analyticsDate: string): Promise<SalesAnalytics | null> {
  try {
    const { data, error } = await supabase
      .from('sales_analytics')
      .select('*')
      .eq('user_id', userId)
      .eq('analytics_date', analyticsDate)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as SalesAnalytics | null;
  } catch (err) {
    console.error('Error fetching sales analytics:', err);
    return null;
  }
}

export async function getSalesAnalyticsHistory(userId: string, days: number = 30): Promise<SalesAnalytics[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('sales_analytics')
      .select('*')
      .eq('user_id', userId)
      .gte('analytics_date', startDate.toISOString().split('T')[0])
      .order('analytics_date', { ascending: false });

    if (error) throw error;
    return (data || []) as SalesAnalytics[];
  } catch (err) {
    console.error('Error fetching sales history:', err);
    return [];
  }
}

export async function recordSalesAnalytics(userId: string, analyticsData: Partial<SalesAnalytics>): Promise<SalesAnalytics | null> {
  try {
    const { data, error } = await supabase
      .from('sales_analytics')
      .insert({
        user_id: userId,
        analytics_date: analyticsData.analyticsDate,
        total_orders: analyticsData.totalOrders || 0,
        total_revenue: analyticsData.totalRevenue || 0,
        average_order_value: analyticsData.averageOrderValue,
        total_items_sold: analyticsData.totalItemsSold || 0,
        total_discount_given: analyticsData.totalDiscountGiven || 0,
        total_refunds: analyticsData.totalRefunds || 0,
        net_revenue: analyticsData.netRevenue,
        orders_by_status: analyticsData.ordersByStatus,
        revenue_by_channel: analyticsData.revenueByChannel,
        revenue_by_category: analyticsData.revenueByCategory,
        top_products: analyticsData.topProducts,
        created_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as SalesAnalytics;
  } catch (err) {
    console.error('Error recording sales analytics:', err);
    return null;
  }
}

// CUSTOMER ANALYTICS
export async function getCustomerAnalytics(userId: string, analyticsDate: string): Promise<CustomerAnalytics | null> {
  try {
    const { data, error } = await supabase
      .from('customer_analytics')
      .select('*')
      .eq('user_id', userId)
      .eq('analytics_date', analyticsDate)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as CustomerAnalytics | null;
  } catch (err) {
    console.error('Error fetching customer analytics:', err);
    return null;
  }
}

export async function recordCustomerAnalytics(userId: string, analyticsData: Partial<CustomerAnalytics>): Promise<CustomerAnalytics | null> {
  try {
    const { data, error } = await supabase
      .from('customer_analytics')
      .insert({
        user_id: userId,
        analytics_date: analyticsData.analyticsDate,
        total_customers: analyticsData.totalCustomers || 0,
        new_customers: analyticsData.newCustomers || 0,
        returning_customers: analyticsData.returningCustomers || 0,
        active_customers: analyticsData.activeCustomers || 0,
        customer_retention_rate: analyticsData.customerRetentionRate,
        average_customer_lifetime_value: analyticsData.averageCustomerLifetimeValue,
        total_customer_spend: analyticsData.totalCustomerSpend,
        customer_acquisition_cost: analyticsData.customerAcquisitionCost,
        churn_rate: analyticsData.churnRate,
        customers_by_segment: analyticsData.customersBySegment,
        customers_by_location: analyticsData.customersByLocation,
        repeat_purchase_rate: analyticsData.repeatPurchaseRate,
        created_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as CustomerAnalytics;
  } catch (err) {
    console.error('Error recording customer analytics:', err);
    return null;
  }
}

// PRODUCT ANALYTICS
export async function getProductAnalytics(userId: string, productId: string, analyticsDate: string): Promise<ProductAnalytics | null> {
  try {
    const { data, error } = await supabase
      .from('product_analytics')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .eq('analytics_date', analyticsDate)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as ProductAnalytics | null;
  } catch (err) {
    console.error('Error fetching product analytics:', err);
    return null;
  }
}

export async function getTopProducts(userId: string, analyticsDate: string, limit: number = 10): Promise<ProductAnalytics[]> {
  try {
    const { data, error } = await supabase
      .from('product_analytics')
      .select('*')
      .eq('user_id', userId)
      .eq('analytics_date', analyticsDate)
      .order('revenue', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as ProductAnalytics[];
  } catch (err) {
    console.error('Error fetching top products:', err);
    return [];
  }
}

export async function recordProductAnalytics(userId: string, analyticsData: Partial<ProductAnalytics>): Promise<ProductAnalytics | null> {
  try {
    const { data, error } = await supabase
      .from('product_analytics')
      .insert({
        user_id: userId,
        product_id: analyticsData.productId,
        analytics_date: analyticsData.analyticsDate,
        units_sold: analyticsData.unitsSold || 0,
        revenue: analyticsData.revenue || 0,
        cost_of_goods: analyticsData.costOfGoods,
        gross_profit: analyticsData.grossProfit,
        gross_margin: analyticsData.grossMargin,
        average_rating: analyticsData.averageRating,
        review_count: analyticsData.reviewCount,
        return_rate: analyticsData.returnRate,
        stock_level: analyticsData.stockLevel,
        turnover_rate: analyticsData.turnoverRate,
        inventory_value: analyticsData.inventoryValue,
        created_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as ProductAnalytics;
  } catch (err) {
    console.error('Error recording product analytics:', err);
    return null;
  }
}

// FINANCIAL ANALYTICS
export async function getFinancialAnalytics(userId: string, analyticsDate: string): Promise<FinancialAnalytics | null> {
  try {
    const { data, error } = await supabase
      .from('financial_analytics')
      .select('*')
      .eq('user_id', userId)
      .eq('analytics_date', analyticsDate)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as FinancialAnalytics | null;
  } catch (err) {
    console.error('Error fetching financial analytics:', err);
    return null;
  }
}

export async function recordFinancialAnalytics(userId: string, analyticsData: Partial<FinancialAnalytics>): Promise<FinancialAnalytics | null> {
  try {
    const { data, error } = await supabase
      .from('financial_analytics')
      .insert({
        user_id: userId,
        analytics_date: analyticsData.analyticsDate,
        period_type: analyticsData.periodType,
        total_revenue: analyticsData.totalRevenue || 0,
        total_cost: analyticsData.totalCost || 0,
        gross_profit: analyticsData.grossProfit,
        operating_expenses: analyticsData.operatingExpenses,
        net_profit: analyticsData.netProfit,
        gross_margin: analyticsData.grossMargin,
        operating_margin: analyticsData.operatingMargin,
        net_margin: analyticsData.netMargin,
        revenue_by_source: analyticsData.revenueBySource,
        expense_by_category: analyticsData.expenseByCategory,
        cash_flow_data: analyticsData.cashFlowData,
        created_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as FinancialAnalytics;
  } catch (err) {
    console.error('Error recording financial analytics:', err);
    return null;
  }
}

// MARKETING ANALYTICS
export async function getMarketingAnalytics(userId: string, channel?: string, days: number = 30): Promise<MarketingAnalytics[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = supabase
      .from('marketing_analytics')
      .select('*')
      .eq('user_id', userId)
      .gte('analytics_date', startDate.toISOString().split('T')[0]);

    if (channel) {
      query = query.eq('channel', channel);
    }

    const { data, error } = await query.order('analytics_date', { ascending: false });

    if (error) throw error;
    return (data || []) as MarketingAnalytics[];
  } catch (err) {
    console.error('Error fetching marketing analytics:', err);
    return [];
  }
}

export async function recordMarketingAnalytics(userId: string, analyticsData: Partial<MarketingAnalytics>): Promise<MarketingAnalytics | null> {
  try {
    const { data, error } = await supabase
      .from('marketing_analytics')
      .insert({
        user_id: userId,
        analytics_date: analyticsData.analyticsDate,
        campaign_name: analyticsData.campaignName,
        channel: analyticsData.channel,
        impressions: analyticsData.impressions || 0,
        clicks: analyticsData.clicks || 0,
        conversions: analyticsData.conversions || 0,
        spend: analyticsData.spend || 0,
        revenue: analyticsData.revenue || 0,
        email_sent: analyticsData.emailSent || 0,
        email_opened: analyticsData.emailOpened || 0,
        email_clicked: analyticsData.emailClicked || 0,
        sms_sent: analyticsData.smsSent || 0,
        sms_conversion: analyticsData.smsConversion || 0,
        engagement_rate: analyticsData.engagementRate,
        conversion_rate: analyticsData.conversionRate,
        roi: analyticsData.roi,
        created_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as MarketingAnalytics;
  } catch (err) {
    console.error('Error recording marketing analytics:', err);
    return null;
  }
}

// OPERATIONAL ANALYTICS
export async function getOperationalAnalytics(userId: string, analyticsDate: string): Promise<OperationalAnalytics | null> {
  try {
    const { data, error } = await supabase
      .from('operational_analytics')
      .select('*')
      .eq('user_id', userId)
      .eq('analytics_date', analyticsDate)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as OperationalAnalytics | null;
  } catch (err) {
    console.error('Error fetching operational analytics:', err);
    return null;
  }
}

export async function recordOperationalAnalytics(userId: string, analyticsData: Partial<OperationalAnalytics>): Promise<OperationalAnalytics | null> {
  try {
    const { data, error } = await supabase
      .from('operational_analytics')
      .insert({
        user_id: userId,
        analytics_date: analyticsData.analyticsDate,
        order_fulfillment_rate: analyticsData.orderFulfillmentRate,
        average_fulfillment_time: analyticsData.averageFulfillmentTime,
        shipping_on_time_rate: analyticsData.shippingOnTimeRate,
        inventory_accuracy: analyticsData.inventoryAccuracy,
        stock_out_incidents: analyticsData.stockOutIncidents || 0,
        warehouse_utilization: analyticsData.warehouseUtilization,
        average_complaint_resolution_time: analyticsData.averageComplaintResolutionTime,
        complaint_rate: analyticsData.complaintRate,
        return_rate: analyticsData.returnRate,
        customer_satisfaction_score: analyticsData.customerSatisfactionScore,
        nps_score: analyticsData.npsScore,
        created_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as OperationalAnalytics;
  } catch (err) {
    console.error('Error recording operational analytics:', err);
    return null;
  }
}

// KPI TRACKING
export async function getKPITracking(userId: string, currentDate: string): Promise<KPITracking[]> {
  try {
    const { data, error } = await supabase
      .from('kpi_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('current_date', currentDate);

    if (error) throw error;
    return (data || []) as KPITracking[];
  } catch (err) {
    console.error('Error fetching KPI tracking:', err);
    return [];
  }
}

export async function recordKPITracking(userId: string, kpiData: Partial<KPITracking>): Promise<KPITracking | null> {
  try {
    const { data, error } = await supabase
      .from('kpi_tracking')
      .insert({
        user_id: userId,
        kpi_name: kpiData.kpiName,
        kpi_category: kpiData.kpiCategory,
        target_value: kpiData.targetValue,
        actual_value: kpiData.actualValue,
        current_date: kpiData.currentDate,
        status: kpiData.status,
        trend: kpiData.trend,
        notes: kpiData.notes,
        created_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as KPITracking;
  } catch (err) {
    console.error('Error recording KPI tracking:', err);
    return null;
  }
}

// DASHBOARD REPORTS
export async function getDashboardReports(userId: string): Promise<DashboardReport[]> {
  try {
    const { data, error } = await supabase
      .from('dashboard_reports')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as DashboardReport[];
  } catch (err) {
    console.error('Error fetching reports:', err);
    return [];
  }
}

export async function createDashboardReport(userId: string, reportData: Partial<DashboardReport>): Promise<DashboardReport | null> {
  try {
    const { data, error } = await supabase
      .from('dashboard_reports')
      .insert({
        user_id: userId,
        report_name: reportData.reportName,
        report_type: reportData.reportType,
        report_description: reportData.reportDescription,
        report_config: reportData.reportConfig,
        refresh_frequency: reportData.refreshFrequency,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as DashboardReport;
  } catch (err) {
    console.error('Error creating report:', err);
    return null;
  }
}

// REPORT SNAPSHOTS
export async function getReportSnapshots(reportId: string, limit: number = 10): Promise<ReportSnapshot[]> {
  try {
    const { data, error } = await supabase
      .from('report_snapshots')
      .select('*')
      .eq('report_id', reportId)
      .order('snapshot_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as ReportSnapshot[];
  } catch (err) {
    console.error('Error fetching snapshots:', err);
    return [];
  }
}

export async function recordReportSnapshot(snapshotData: Partial<ReportSnapshot>): Promise<ReportSnapshot | null> {
  try {
    const { data, error } = await supabase
      .from('report_snapshots')
      .insert({
        report_id: snapshotData.reportId,
        snapshot_date: snapshotData.snapshotDate,
        snapshot_data: snapshotData.snapshotData,
        metrics_summary: snapshotData.metricsSummary,
        created_at: new Date(),
      })
      .select()
      .single();

    if (error) throw error;
    return data as ReportSnapshot;
  } catch (err) {
    console.error('Error recording snapshot:', err);
    return null;
  }
}

// ANALYTICS DASHBOARD DATA
export async function getAnalyticsDashboardData(userId: string, analyticsDate: string): Promise<AnalyticsDashboardData | null> {
  try {
    const [sales, customer, financial, operational, marketing, topProducts, kpis] = await Promise.all([
      getSalesAnalytics(userId, analyticsDate),
      getCustomerAnalytics(userId, analyticsDate),
      getFinancialAnalytics(userId, analyticsDate),
      getOperationalAnalytics(userId, analyticsDate),
      getMarketingAnalytics(userId, undefined, 30),
      getTopProducts(userId, analyticsDate, 5),
      getKPITracking(userId, analyticsDate),
    ]);

    return {
      salesAnalytics: sales,
      customerAnalytics: customer,
      financialAnalytics: financial,
      operationalAnalytics: operational,
      marketingAnalytics: marketing || [],
      topProducts: topProducts || [],
      kpiTracking: kpis || [],
      period: {
        startDate: new Date(analyticsDate),
        endDate: new Date(analyticsDate),
      },
    };
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    return null;
  }
}
