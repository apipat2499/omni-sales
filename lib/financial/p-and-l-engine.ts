/**
 * Profit & Loss (P&L) Report Engine
 * Calculates revenue, expenses, and profitability metrics
 */

import { createClient } from '@/lib/supabase/server';

export interface PandLPeriod {
  startDate: Date;
  endDate: Date;
  label: string;
}

export interface RevenueBreakdown {
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  refundedRevenue: number;
  orderCount: number;
  customerCount: number;
  averageOrderValue: number;
  byChannel?: Record<string, number>;
  byCategory?: Record<string, number>;
}

export interface ExpenseBreakdown {
  totalExpenses: number;
  costOfGoodsSold: number;
  operatingExpenses: number;
  capitalExpenses: number;
  taxExpenses: number;
  otherExpenses: number;
  byCategory: Record<string, number>;
}

export interface ProfitMetrics {
  grossProfit: number;
  grossMargin: number; // Percentage
  operatingProfit: number;
  operatingMargin: number; // Percentage
  netProfit: number;
  netMargin: number; // Percentage
  ebitda?: number; // Earnings before interest, taxes, depreciation, amortization
}

export interface PandLReport {
  period: PandLPeriod;
  revenue: RevenueBreakdown;
  expenses: ExpenseBreakdown;
  profit: ProfitMetrics;
  yearOverYear?: {
    revenueGrowth: number; // Percentage
    expenseGrowth: number; // Percentage
    profitGrowth: number; // Percentage
  };
  comparisonPeriod?: {
    revenue: number;
    expenses: number;
    profit: number;
  };
}

/**
 * Calculate revenue for a given period
 */
export async function calculateRevenue(
  startDate: Date,
  endDate: Date,
  options?: {
    includeByChannel?: boolean;
    includeByCategory?: boolean;
    tenantId?: string;
  }
): Promise<RevenueBreakdown> {
  const supabase = await createClient();

  // Get revenue from orders
  let ordersQuery = supabase
    .from('orders')
    .select('id, user_id, total_amount, payment_status, created_at')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (options?.tenantId) {
    ordersQuery = ordersQuery.eq('tenant_id', options.tenantId);
  }

  const { data: orders, error } = await ordersQuery;

  if (error) {
    throw new Error(`Failed to fetch orders: ${error.message}`);
  }

  // Calculate metrics
  const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
  const paidRevenue = orders?.filter(o => o.payment_status === 'paid')
    .reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
  const pendingRevenue = orders?.filter(o => o.payment_status === 'pending')
    .reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

  // Get refunds
  const { data: refunds } = await supabase
    .from('stripe_refunds')
    .select('amount')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  const refundedRevenue = refunds?.reduce((sum, refund) => sum + (refund.amount || 0), 0) || 0;

  const uniqueCustomers = new Set(orders?.map(o => o.user_id) || []);
  const orderCount = orders?.length || 0;
  const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

  return {
    totalRevenue,
    paidRevenue,
    pendingRevenue,
    refundedRevenue,
    orderCount,
    customerCount: uniqueCustomers.size,
    averageOrderValue,
  };
}

/**
 * Calculate expenses for a given period
 */
export async function calculateExpenses(
  startDate: Date,
  endDate: Date,
  options?: {
    tenantId?: string;
  }
): Promise<ExpenseBreakdown> {
  const supabase = await createClient();

  // Get expenses with categories
  let expensesQuery = supabase
    .from('expenses')
    .select(`
      id,
      amount,
      payment_status,
      expense_categories (
        id,
        name,
        category_type
      )
    `)
    .gte('expense_date', startDate.toISOString().split('T')[0])
    .lte('expense_date', endDate.toISOString().split('T')[0])
    .eq('payment_status', 'paid'); // Only count paid expenses

  if (options?.tenantId) {
    expensesQuery = expensesQuery.eq('tenant_id', options.tenantId);
  }

  const { data: expenses, error } = await expensesQuery;

  if (error) {
    throw new Error(`Failed to fetch expenses: ${error.message}`);
  }

  // Categorize expenses
  let costOfGoodsSold = 0;
  let operatingExpenses = 0;
  let capitalExpenses = 0;
  let taxExpenses = 0;
  let otherExpenses = 0;
  const byCategory: Record<string, number> = {};

  expenses?.forEach((expense: any) => {
    const amount = expense.amount || 0;
    const category = expense.expense_categories;
    const categoryName = category?.name || 'Uncategorized';
    const categoryType = category?.category_type || 'other';

    // Add to category breakdown
    byCategory[categoryName] = (byCategory[categoryName] || 0) + amount;

    // Add to type totals
    switch (categoryType) {
      case 'cogs':
        costOfGoodsSold += amount;
        break;
      case 'operating':
        operatingExpenses += amount;
        break;
      case 'capital':
        capitalExpenses += amount;
        break;
      case 'tax':
        taxExpenses += amount;
        break;
      default:
        otherExpenses += amount;
    }
  });

  const totalExpenses = costOfGoodsSold + operatingExpenses + capitalExpenses + taxExpenses + otherExpenses;

  return {
    totalExpenses,
    costOfGoodsSold,
    operatingExpenses,
    capitalExpenses,
    taxExpenses,
    otherExpenses,
    byCategory,
  };
}

/**
 * Calculate profit metrics
 */
export function calculateProfitMetrics(
  revenue: RevenueBreakdown,
  expenses: ExpenseBreakdown
): ProfitMetrics {
  const actualRevenue = revenue.paidRevenue; // Only count paid revenue for profit calculations

  // Gross Profit = Revenue - COGS
  const grossProfit = actualRevenue - expenses.costOfGoodsSold;
  const grossMargin = actualRevenue > 0 ? (grossProfit / actualRevenue) * 100 : 0;

  // Operating Profit = Gross Profit - Operating Expenses
  const operatingProfit = grossProfit - expenses.operatingExpenses;
  const operatingMargin = actualRevenue > 0 ? (operatingProfit / actualRevenue) * 100 : 0;

  // Net Profit = Operating Profit - Other Expenses - Taxes
  const netProfit = operatingProfit - expenses.otherExpenses - expenses.taxExpenses;
  const netMargin = actualRevenue > 0 ? (netProfit / actualRevenue) * 100 : 0;

  // EBITDA = Operating Profit (simplified, would need depreciation/amortization data)
  const ebitda = operatingProfit;

  return {
    grossProfit,
    grossMargin,
    operatingProfit,
    operatingMargin,
    netProfit,
    netMargin,
    ebitda,
  };
}

/**
 * Generate complete P&L report for a period
 */
export async function generatePandLReport(
  startDate: Date,
  endDate: Date,
  options?: {
    includeYoY?: boolean;
    includeComparison?: boolean;
    tenantId?: string;
  }
): Promise<PandLReport> {
  // Calculate current period
  const revenue = await calculateRevenue(startDate, endDate, options);
  const expenses = await calculateExpenses(startDate, endDate, options);
  const profit = calculateProfitMetrics(revenue, expenses);

  const report: PandLReport = {
    period: {
      startDate,
      endDate,
      label: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
    },
    revenue,
    expenses,
    profit,
  };

  // Calculate year-over-year comparison
  if (options?.includeYoY) {
    const yoyStartDate = new Date(startDate);
    yoyStartDate.setFullYear(yoyStartDate.getFullYear() - 1);
    const yoyEndDate = new Date(endDate);
    yoyEndDate.setFullYear(yoyEndDate.getFullYear() - 1);

    const yoyRevenue = await calculateRevenue(yoyStartDate, yoyEndDate, options);
    const yoyExpenses = await calculateExpenses(yoyStartDate, yoyEndDate, options);
    const yoyProfit = calculateProfitMetrics(yoyRevenue, yoyExpenses);

    report.yearOverYear = {
      revenueGrowth: yoyRevenue.paidRevenue > 0
        ? ((revenue.paidRevenue - yoyRevenue.paidRevenue) / yoyRevenue.paidRevenue) * 100
        : 0,
      expenseGrowth: yoyExpenses.totalExpenses > 0
        ? ((expenses.totalExpenses - yoyExpenses.totalExpenses) / yoyExpenses.totalExpenses) * 100
        : 0,
      profitGrowth: yoyProfit.netProfit !== 0
        ? ((profit.netProfit - yoyProfit.netProfit) / Math.abs(yoyProfit.netProfit)) * 100
        : 0,
    };

    report.comparisonPeriod = {
      revenue: yoyRevenue.paidRevenue,
      expenses: yoyExpenses.totalExpenses,
      profit: yoyProfit.netProfit,
    };
  }

  return report;
}

/**
 * Generate P&L report by period (monthly, quarterly, yearly)
 */
export async function generatePandLByPeriod(
  startDate: Date,
  endDate: Date,
  periodType: 'monthly' | 'quarterly' | 'yearly',
  options?: {
    tenantId?: string;
  }
): Promise<PandLReport[]> {
  const reports: PandLReport[] = [];
  let currentStart = new Date(startDate);

  while (currentStart < endDate) {
    let currentEnd = new Date(currentStart);

    switch (periodType) {
      case 'monthly':
        currentEnd.setMonth(currentEnd.getMonth() + 1);
        currentEnd.setDate(0); // Last day of month
        break;
      case 'quarterly':
        currentEnd.setMonth(currentEnd.getMonth() + 3);
        currentEnd.setDate(0);
        break;
      case 'yearly':
        currentEnd.setFullYear(currentEnd.getFullYear() + 1);
        currentEnd.setDate(0);
        break;
    }

    if (currentEnd > endDate) {
      currentEnd = new Date(endDate);
    }

    const report = await generatePandLReport(currentStart, currentEnd, options);
    reports.push(report);

    // Move to next period
    currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate() + 1);
  }

  return reports;
}

/**
 * Calculate margin analysis
 */
export interface MarginAnalysis {
  period: string;
  grossMargin: number;
  operatingMargin: number;
  netMargin: number;
  trend: 'improving' | 'declining' | 'stable';
}

export async function analyzeMargins(
  startDate: Date,
  endDate: Date,
  options?: {
    tenantId?: string;
  }
): Promise<MarginAnalysis[]> {
  const monthlyReports = await generatePandLByPeriod(startDate, endDate, 'monthly', options);

  return monthlyReports.map((report, index) => {
    let trend: 'improving' | 'declining' | 'stable' = 'stable';

    if (index > 0) {
      const prevReport = monthlyReports[index - 1];
      const marginChange = report.profit.netMargin - prevReport.profit.netMargin;

      if (marginChange > 1) {
        trend = 'improving';
      } else if (marginChange < -1) {
        trend = 'declining';
      }
    }

    return {
      period: report.period.label,
      grossMargin: report.profit.grossMargin,
      operatingMargin: report.profit.operatingMargin,
      netMargin: report.profit.netMargin,
      trend,
    };
  });
}
