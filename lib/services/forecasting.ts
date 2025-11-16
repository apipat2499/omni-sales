import { supabase } from "@/lib/supabase/client";

// Simple moving average for sales forecasting
export async function forecastSales(days: number = 30) {
  try {
    const { data, error } = await supabase
      .from("daily_metrics")
      .select("date, total_sales")
      .order("date", { ascending: false })
      .limit(90);

    if (error || !data) return null;

    // Calculate 30-day moving average
    const sortedData = [...data].reverse();
    const movingAverages = [];

    for (let i = 29; i < sortedData.length; i++) {
      const avg = sortedData
        .slice(i - 29, i + 1)
        .reduce((sum, d: any) => sum + (d.total_sales || 0), 0) / 30;

      movingAverages.push({
        date: sortedData[i].date,
        forecast: Math.round(avg * 100) / 100,
      });
    }

    // Forecast next 'days' days using trend
    const lastAvg = movingAverages[movingAverages.length - 1]?.forecast || 0;
    const secondLastAvg = movingAverages[movingAverages.length - 2]?.forecast || lastAvg;
    const trend = lastAvg - secondLastAvg;

    const forecast = [];
    for (let i = 1; i <= days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      forecast.push({
        date: date.toISOString().split("T")[0],
        forecast: Math.round((lastAvg + trend * i) * 100) / 100,
      });
    }

    return { historical: movingAverages, forecast };
  } catch (error) {
    console.error("Sales forecast error:", error);
    return null;
  }
}

// Forecast product demand
export async function forecastProductDemand(productId: string, days: number = 30) {
  try {
    const { data, error } = await supabase
      .from("order_items")
      .select("created_at, quantity")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(60);

    if (error || !data) return null;

    // Group by date and sum quantities
    const dailyDemand: Record<string, number> = {};
    data.forEach((item: any) => {
      const date = new Date(item.created_at).toISOString().split("T")[0];
      dailyDemand[date] = (dailyDemand[date] || 0) + item.quantity;
    });

    // Calculate average daily demand
    const values = Object.values(dailyDemand);
    const avgDemand = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;

    // Forecast
    const forecast = [];
    for (let i = 1; i <= days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      forecast.push({
        date: date.toISOString().split("T")[0],
        forecast: avgDemand,
      });
    }

    return { historicalAverage: avgDemand, forecast };
  } catch (error) {
    console.error("Product forecast error:", error);
    return null;
  }
}

export default {
  forecastSales,
  forecastProductDemand,
};
