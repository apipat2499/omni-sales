/**
 * Advanced reporting utilities
 */

import type { OrderItem } from '@/types';

export type ReportType = 'sales' | 'inventory' | 'product' | 'customer' | 'financial' | 'custom';
export type ReportFormat = 'pdf' | 'csv' | 'json' | 'excel';
export type ReportFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

/**
 * Report configuration
 */
export interface Report {
  id: string;
  name: string;
  type: ReportType;
  description?: string;
  startDate: Date;
  endDate: Date;
  metrics: ReportMetric[];
  filters?: Record<string, any>;
  data?: any;
  generatedAt: Date;
  generatedBy?: string;
}

/**
 * Report metric
 */
export interface ReportMetric {
  name: string;
  value: number | string;
  unit?: string;
  comparison?: {
    previous: number | string;
    change: number;
    changePercent: number;
  };
}

/**
 * Sales report
 */
export interface SalesReport extends Report {
  type: 'sales';
  data: {
    totalRevenue: number;
    totalOrders: number;
    totalItems: number;
    averageOrderValue: number;
    averageItemPrice: number;
    topProducts: Array<{ name: string; quantity: number; revenue: number }>;
    revenueByDay: Record<string, number>;
    revenueByProduct: Record<string, number>;
  };
}

/**
 * Inventory report
 */
export interface InventoryReport extends Report {
  type: 'inventory';
  data: {
    totalItems: number;
    totalValue: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
    fastMovers: Array<{ name: string; quantity: number; velocity: number }>;
    slowMovers: Array<{ name: string; quantity: number; velocity: number }>;
    valueByCategory: Record<string, number>;
  };
}

/**
 * Product report
 */
export interface ProductReport extends Report {
  type: 'product';
  data: {
    totalProducts: number;
    topByRevenue: Array<{ id: string; name: string; revenue: number; units: number }>;
    topByUnits: Array<{ id: string; name: string; units: number; revenue: number }>;
    profitability: Array<{ id: string; name: string; profit: number; margin: number }>;
    performance: Record<string, any>;
  };
}

/**
 * Report schedule
 */
export interface ReportSchedule {
  id: string;
  name: string;
  reportType: ReportType;
  frequency: ReportFrequency;
  enabled: boolean;
  recipients?: string[];
  createdAt: Date;
  updatedAt: Date;
  lastGenerated?: Date;
  nextGeneration?: Date;
}

/**
 * Generate sales report
 */
export function generateSalesReport(
  items: OrderItem[],
  startDate: Date,
  endDate: Date
): SalesReport {
  const filteredItems = items.filter((item) => {
    const itemDate = item.orderDate || new Date();
    return itemDate >= startDate && itemDate <= endDate;
  });

  const totalRevenue = filteredItems.reduce((sum, item) => {
    return sum + item.quantity * item.price - (item.discount || 0);
  }, 0);

  const totalOrders = new Set(
    filteredItems.map((item) => item.orderId || `order_${item.id}`)
  ).size;

  const totalItems = filteredItems.reduce((sum, item) => sum + item.quantity, 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const averageItemPrice = totalItems > 0 ? totalRevenue / totalItems : 0;

  // Top products
  const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
  filteredItems.forEach((item) => {
    if (!productSales[item.productId]) {
      productSales[item.productId] = { name: item.productName, quantity: 0, revenue: 0 };
    }
    productSales[item.productId].quantity += item.quantity;
    productSales[item.productId].revenue += item.quantity * item.price - (item.discount || 0);
  });

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Revenue by day
  const revenueByDay: Record<string, number> = {};
  filteredItems.forEach((item) => {
    const date = (item.orderDate || new Date()).toISOString().split('T')[0];
    revenueByDay[date] = (revenueByDay[date] || 0) + item.quantity * item.price - (item.discount || 0);
  });

  // Revenue by product
  const revenueByProduct: Record<string, number> = {};
  Object.entries(productSales).forEach(([id, data]) => {
    revenueByProduct[id] = data.revenue;
  });

  return {
    id: `report_${Date.now()}`,
    name: `Sales Report ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
    type: 'sales',
    startDate,
    endDate,
    metrics: [
      { name: 'Total Revenue', value: Math.round(totalRevenue * 100) / 100, unit: 'THB' },
      { name: 'Total Orders', value: totalOrders },
      { name: 'Total Items', value: totalItems },
      { name: 'Average Order Value', value: Math.round(averageOrderValue * 100) / 100, unit: 'THB' },
      { name: 'Average Item Price', value: Math.round(averageItemPrice * 100) / 100, unit: 'THB' },
    ],
    data: {
      totalRevenue,
      totalOrders,
      totalItems,
      averageOrderValue,
      averageItemPrice,
      topProducts,
      revenueByDay,
      revenueByProduct,
    },
    generatedAt: new Date(),
  };
}

/**
 * Generate inventory report
 */
export function generateInventoryReport(startDate: Date, endDate: Date): InventoryReport {
  // Placeholder for inventory data that would come from stock management
  return {
    id: `report_${Date.now()}`,
    name: `Inventory Report ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
    type: 'inventory',
    startDate,
    endDate,
    metrics: [
      { name: 'Total Items', value: 0 },
      { name: 'Total Value', value: 0, unit: 'THB' },
      { name: 'In Stock', value: 0 },
      { name: 'Low Stock', value: 0 },
      { name: 'Out of Stock', value: 0 },
    ],
    data: {
      totalItems: 0,
      totalValue: 0,
      inStock: 0,
      lowStock: 0,
      outOfStock: 0,
      fastMovers: [],
      slowMovers: [],
      valueByCategory: {},
    },
    generatedAt: new Date(),
  };
}

/**
 * Generate product report
 */
export function generateProductReport(
  items: OrderItem[],
  startDate: Date,
  endDate: Date
): ProductReport {
  const filteredItems = items.filter((item) => {
    const itemDate = item.orderDate || new Date();
    return itemDate >= startDate && itemDate <= endDate;
  });

  // Product performance
  const productStats: Record<
    string,
    { name: string; revenue: number; units: number; count: number }
  > = {};

  filteredItems.forEach((item) => {
    if (!productStats[item.productId]) {
      productStats[item.productId] = {
        name: item.productName,
        revenue: 0,
        units: 0,
        count: 0,
      };
    }
    productStats[item.productId].revenue += item.quantity * item.price - (item.discount || 0);
    productStats[item.productId].units += item.quantity;
    productStats[item.productId].count += 1;
  });

  const topByRevenue = Object.entries(productStats)
    .map(([id, data]) => ({
      id,
      name: data.name,
      revenue: data.revenue,
      units: data.units,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const topByUnits = Object.entries(productStats)
    .map(([id, data]) => ({
      id,
      name: data.name,
      units: data.units,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.units - a.units)
    .slice(0, 10);

  // Profitability (simplified: assuming 40% cost)
  const profitability = topByRevenue
    .map((product) => ({
      id: product.id,
      name: product.name,
      profit: product.revenue * 0.4,
      margin: 40,
    }))
    .sort((a, b) => b.profit - a.profit);

  return {
    id: `report_${Date.now()}`,
    name: `Product Report ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
    type: 'product',
    startDate,
    endDate,
    metrics: [
      { name: 'Total Products', value: Object.keys(productStats).length },
      { name: 'Top Product (Revenue)', value: topByRevenue[0]?.name || 'N/A' },
      { name: 'Top Product (Units)', value: topByUnits[0]?.name || 'N/A' },
    ],
    data: {
      totalProducts: Object.keys(productStats).length,
      topByRevenue,
      topByUnits,
      profitability,
      performance: productStats,
    },
    generatedAt: new Date(),
  };
}

/**
 * Get all reports
 */
export function getAllReports(): Report[] {
  try {
    const stored = localStorage.getItem('reports');
    if (!stored) return [];

    return JSON.parse(stored).map((r: any) => ({
      ...r,
      startDate: new Date(r.startDate),
      endDate: new Date(r.endDate),
      generatedAt: new Date(r.generatedAt),
    }));
  } catch {
    return [];
  }
}

/**
 * Save report
 */
export function saveReport(report: Report): void {
  const reports = getAllReports();
  const index = reports.findIndex((r) => r.id === report.id);

  if (index >= 0) {
    reports[index] = report;
  } else {
    reports.push(report);
  }

  // Keep last 100 reports
  if (reports.length > 100) {
    reports.shift();
  }

  localStorage.setItem('reports', JSON.stringify(reports));
}

/**
 * Delete report
 */
export function deleteReport(id: string): boolean {
  const reports = getAllReports();
  const filtered = reports.filter((r) => r.id !== id);

  if (filtered.length === reports.length) {
    return false;
  }

  localStorage.setItem('reports', JSON.stringify(filtered));
  return true;
}

/**
 * Export report as CSV
 */
export function exportReportAsCSV(report: Report): string {
  const lines: string[] = [];

  lines.push(`"${report.name}"`);
  lines.push(`"Generated: ${report.generatedAt.toISOString()}"`);
  lines.push('');

  lines.push('Metrics');
  lines.push('Name,Value,Unit');
  report.metrics.forEach((metric) => {
    lines.push(`"${metric.name}","${metric.value}","${metric.unit || ''}"`);
  });

  return lines.join('\n');
}

/**
 * Export report as JSON
 */
export function exportReportAsJSON(report: Report): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Get report statistics
 */
export function getReportStatistics(): {
  totalReports: number;
  recentReports: Report[];
  reportsByType: Record<ReportType, number>;
} {
  const allReports = getAllReports();

  const reportsByType: Record<ReportType, number> = {
    sales: 0,
    inventory: 0,
    product: 0,
    customer: 0,
    financial: 0,
    custom: 0,
  };

  allReports.forEach((report) => {
    reportsByType[report.type]++;
  });

  const recentReports = allReports
    .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())
    .slice(0, 5);

  return {
    totalReports: allReports.length,
    recentReports,
    reportsByType,
  };
}

/**
 * Get report schedules
 */
export function getReportSchedules(): ReportSchedule[] {
  try {
    const stored = localStorage.getItem('report_schedules');
    if (!stored) return [];

    return JSON.parse(stored).map((s: any) => ({
      ...s,
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt),
      lastGenerated: s.lastGenerated ? new Date(s.lastGenerated) : undefined,
      nextGeneration: s.nextGeneration ? new Date(s.nextGeneration) : undefined,
    }));
  } catch {
    return [];
  }
}

/**
 * Save report schedule
 */
export function saveReportSchedule(schedule: ReportSchedule): void {
  const schedules = getReportSchedules();
  const index = schedules.findIndex((s) => s.id === schedule.id);

  if (index >= 0) {
    schedules[index] = schedule;
  } else {
    schedules.push(schedule);
  }

  localStorage.setItem('report_schedules', JSON.stringify(schedules));
}

/**
 * Delete report schedule
 */
export function deleteReportSchedule(id: string): boolean {
  const schedules = getReportSchedules();
  const filtered = schedules.filter((s) => s.id !== id);

  if (filtered.length === schedules.length) {
    return false;
  }

  localStorage.setItem('report_schedules', JSON.stringify(filtered));
  return true;
}

/**
 * Create custom report
 */
export function createCustomReport(
  name: string,
  metrics: ReportMetric[],
  startDate: Date,
  endDate: Date,
  filters?: Record<string, any>
): Report {
  return {
    id: `report_${Date.now()}`,
    name,
    type: 'custom',
    metrics,
    startDate,
    endDate,
    filters,
    generatedAt: new Date(),
  };
}
