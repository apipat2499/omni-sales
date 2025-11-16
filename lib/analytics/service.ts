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

export async function getAnalyticsDashboardData(userId: string): Promise<any> {
  return {};
}
