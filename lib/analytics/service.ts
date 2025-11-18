import { createClient } from "@supabase/supabase-js";

// Create Supabase client lazily to handle missing environment variables during build
let supabaseClient: any = null;

function getSupabase() {
  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.warn('Supabase environment variables not set');
      return null;
    }

    supabaseClient = createClient(url, key);
  }
  return supabaseClient;
}

export async function getOperationalAnalytics(userId: string, date: string): Promise<any> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('operational_analytics')
      .select('*')
      .eq('user_id', userId)
      .eq('analytics_date', date);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching operational analytics:', err);
    return [];
  }
}

export async function recordOperationalAnalytics(
  userId: string,
  data: Record<string, any>
): Promise<any> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data: result, error } = await supabase
      .from('operational_analytics')
      .insert({
        user_id: userId,
        ...data,
        recorded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  } catch (err) {
    console.error('Error recording operational analytics:', err);
    return null;
  }
}

export async function getSalesAnalyticsHistory(userId: string, days?: number): Promise<any[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('sales_analytics')
      .select('*')
      .eq('user_id', userId)
      .order('analytics_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching sales analytics history:', err);
    return [];
  }
}

export async function recordSalesAnalytics(
  userId: string,
  data: Record<string, any>
): Promise<any> {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data: result, error } = await supabase
      .from('sales_analytics')
      .insert({
        user_id: userId,
        ...data,
        recorded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  } catch (err) {
    console.error('Error recording sales analytics:', err);
    return null;
  }
}

export async function getTopProducts(userId: string): Promise<any[]> {
  return [];
}

export async function recordProductAnalytics(userId: string, data: Record<string, any>): Promise<any> {
  return data;
}

export async function getCustomerAnalytics(userId: string): Promise<any> {
  return {};
}

export async function recordCustomerAnalytics(userId: string, data: Record<string, any>): Promise<any> {
  return data;
}

export async function getFinancialAnalytics(userId: string): Promise<any> {
  return {};
}

export async function recordFinancialAnalytics(userId: string, data: Record<string, any>): Promise<any> {
  return data;
}

export async function getAnalyticsDashboard(userId: string): Promise<any> {
  return {};
}

export async function getAnalyticsDashboardData(userId: string, date?: string): Promise<any> {
  // Return mock data for demo mode
  return {
    salesAnalytics: {
      totalOrders: 342,
      totalRevenue: 125430.50,
      averageOrderValue: 366.76,
      totalItemsSold: 1245,
      totalDiscountGiven: 5420.00,
      totalRefunds: 2100.00,
      netRevenue: 117910.50,
      ordersByStatus: {
        pending: 15,
        processing: 42,
        shipped: 89,
        delivered: 186,
        cancelled: 10
      },
      revenueByChannel: {
        online: 75000,
        pos: 35000,
        phone: 10000,
        other: 5430
      },
      revenueByCategory: {
        'กาแฟพร้อมดื่ม': 52000,
        'อุปกรณ์': 38000,
        'เมล็ดกาแฟ': 24000,
        'อื่น ๆ': 11430
      },
      topProducts: []
    },
    customerAnalytics: {
      totalCustomers: 1245,
      newCustomers: 156,
      returningCustomers: 1089,
      activeCustomers: 856,
      customerRetentionRate: 87.5,
      averageCustomerLifetimeValue: 2850.75,
      totalCustomerSpend: 3547683.75,
      customerAcquisitionCost: 45.20,
      churnRate: 12.5,
      repeatPurchaseRate: 68.3
    },
    financialAnalytics: {
      totalRevenue: 125430.50,
      totalCost: 65220.30,
      grossProfit: 60210.20,
      operatingExpenses: 28500.00,
      netProfit: 31710.20,
      grossMargin: 48.0,
      operatingMargin: 25.3,
      netMargin: 25.3,
      revenueBySource: {},
      expenseByCategory: {},
      cashFlowData: {}
    },
    operationalAnalytics: {
      orderFulfillmentRate: 94.5,
      averageFulfillmentTime: 2.3,
      shippingOnTimeRate: 92.1,
      inventoryAccuracy: 98.7,
      stockOutIncidents: 3,
      warehouseUtilization: 78.5,
      averageComplaintResolutionTime: 4.2,
      complaintRate: 1.8,
      returnRate: 2.5,
      customerSatisfactionScore: 4.6,
      npsScore: 72
    },
    marketingAnalytics: [],
    topProducts: [],
    kpiTracking: []
  };
}
