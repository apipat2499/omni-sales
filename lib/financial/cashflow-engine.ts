/**
 * Cash Flow Analysis Engine
 * Tracks cash inflows and outflows across operating, investing, and financing activities
 */

import { createClient } from '@/lib/supabase/server';

export interface CashFlowPeriod {
  startDate: Date;
  endDate: Date;
  label: string;
}

export interface OperatingCashFlow {
  cashFromSales: number;
  cashPaidToSuppliers: number;
  cashPaidForOperatingExpenses: number;
  netOperatingCashFlow: number;
}

export interface InvestingCashFlow {
  purchaseOfEquipment: number;
  purchaseOfProperty: number;
  saleOfAssets: number;
  netInvestingCashFlow: number;
}

export interface FinancingCashFlow {
  proceedsFromLoans: number;
  repaymentOfDebt: number;
  dividendsPaid: number;
  netFinancingCashFlow: number;
}

export interface CashFlowStatement {
  period: CashFlowPeriod;
  operating: OperatingCashFlow;
  investing: InvestingCashFlow;
  financing: FinancingCashFlow;
  netCashFlow: number;
  beginningCashBalance: number;
  endingCashBalance: number;
}

export interface CashPosition {
  currentBalance: number;
  projectedBalance30Days: number;
  projectedBalance60Days: number;
  projectedBalance90Days: number;
  burnRate: number; // Monthly cash burn
  runwayMonths: number; // Months until cash runs out
}

/**
 * Calculate operating cash flow
 */
export async function calculateOperatingCashFlow(
  startDate: Date,
  endDate: Date,
  options?: {
    tenantId?: string;
  }
): Promise<OperatingCashFlow> {
  const supabase = await createClient();

  // Cash from sales (paid orders)
  let ordersQuery = supabase
    .from('orders')
    .select('total_amount')
    .eq('payment_status', 'paid')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (options?.tenantId) {
    ordersQuery = ordersQuery.eq('tenant_id', options.tenantId);
  }

  const { data: orders } = await ordersQuery;
  const cashFromSales = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

  // Cash paid to suppliers (COGS expenses)
  let cogsQuery = supabase
    .from('expenses')
    .select(`
      amount,
      expense_categories (
        category_type
      )
    `)
    .eq('payment_status', 'paid')
    .gte('expense_date', startDate.toISOString().split('T')[0])
    .lte('expense_date', endDate.toISOString().split('T')[0]);

  if (options?.tenantId) {
    cogsQuery = cogsQuery.eq('tenant_id', options.tenantId);
  }

  const { data: expenses } = await cogsQuery;

  const cashPaidToSuppliers = expenses?.filter((e: any) =>
    e.expense_categories?.category_type === 'cogs'
  ).reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;

  const cashPaidForOperatingExpenses = expenses?.filter((e: any) =>
    e.expense_categories?.category_type === 'operating'
  ).reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;

  const netOperatingCashFlow = cashFromSales - cashPaidToSuppliers - cashPaidForOperatingExpenses;

  return {
    cashFromSales,
    cashPaidToSuppliers,
    cashPaidForOperatingExpenses,
    netOperatingCashFlow,
  };
}

/**
 * Calculate investing cash flow
 */
export async function calculateInvestingCashFlow(
  startDate: Date,
  endDate: Date,
  options?: {
    tenantId?: string;
  }
): Promise<InvestingCashFlow> {
  const supabase = await createClient();

  // Capital expenditures
  let capitalQuery = supabase
    .from('expenses')
    .select(`
      amount,
      expense_categories (
        category_type,
        name
      )
    `)
    .eq('payment_status', 'paid')
    .gte('expense_date', startDate.toISOString().split('T')[0])
    .lte('expense_date', endDate.toISOString().split('T')[0]);

  if (options?.tenantId) {
    capitalQuery = capitalQuery.eq('tenant_id', options.tenantId);
  }

  const { data: capitalExpenses } = await capitalQuery;

  const purchaseOfEquipment = capitalExpenses?.filter((e: any) =>
    e.expense_categories?.category_type === 'capital' &&
    e.expense_categories?.name === 'Equipment'
  ).reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;

  const purchaseOfProperty = capitalExpenses?.filter((e: any) =>
    e.expense_categories?.category_type === 'capital' &&
    e.expense_categories?.name === 'Property'
  ).reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;

  // For now, no asset sales (would need separate tracking)
  const saleOfAssets = 0;

  const netInvestingCashFlow = saleOfAssets - purchaseOfEquipment - purchaseOfProperty;

  return {
    purchaseOfEquipment,
    purchaseOfProperty,
    saleOfAssets,
    netInvestingCashFlow,
  };
}

/**
 * Calculate financing cash flow
 */
export async function calculateFinancingCashFlow(
  startDate: Date,
  endDate: Date,
  options?: {
    tenantId?: string;
  }
): Promise<FinancingCashFlow> {
  const supabase = await createClient();

  // Get financing-related expenses
  let financingQuery = supabase
    .from('expenses')
    .select(`
      amount,
      description,
      expense_categories (
        name
      )
    `)
    .eq('payment_status', 'paid')
    .gte('expense_date', startDate.toISOString().split('T')[0])
    .lte('expense_date', endDate.toISOString().split('T')[0]);

  if (options?.tenantId) {
    financingQuery = financingQuery.eq('tenant_id', options.tenantId);
  }

  const { data: financingExpenses } = await financingQuery;

  // Interest expenses indicate debt service
  const repaymentOfDebt = financingExpenses?.filter((e: any) =>
    e.expense_categories?.name === 'Interest Expense'
  ).reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;

  // For now, no loan proceeds or dividends (would need separate tracking)
  const proceedsFromLoans = 0;
  const dividendsPaid = 0;

  const netFinancingCashFlow = proceedsFromLoans - repaymentOfDebt - dividendsPaid;

  return {
    proceedsFromLoans,
    repaymentOfDebt,
    dividendsPaid,
    netFinancingCashFlow,
  };
}

/**
 * Generate complete cash flow statement
 */
export async function generateCashFlowStatement(
  startDate: Date,
  endDate: Date,
  options?: {
    tenantId?: string;
    beginningBalance?: number;
  }
): Promise<CashFlowStatement> {
  const operating = await calculateOperatingCashFlow(startDate, endDate, options);
  const investing = await calculateInvestingCashFlow(startDate, endDate, options);
  const financing = await calculateFinancingCashFlow(startDate, endDate, options);

  const netCashFlow =
    operating.netOperatingCashFlow +
    investing.netInvestingCashFlow +
    financing.netFinancingCashFlow;

  const beginningCashBalance = options?.beginningBalance || 0;
  const endingCashBalance = beginningCashBalance + netCashFlow;

  return {
    period: {
      startDate,
      endDate,
      label: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
    },
    operating,
    investing,
    financing,
    netCashFlow,
    beginningCashBalance,
    endingCashBalance,
  };
}

/**
 * Generate cash flow statements by period
 */
export async function generateCashFlowByPeriod(
  startDate: Date,
  endDate: Date,
  periodType: 'monthly' | 'quarterly' | 'yearly',
  options?: {
    tenantId?: string;
    beginningBalance?: number;
  }
): Promise<CashFlowStatement[]> {
  const statements: CashFlowStatement[] = [];
  let currentStart = new Date(startDate);
  let runningBalance = options?.beginningBalance || 0;

  while (currentStart < endDate) {
    let currentEnd = new Date(currentStart);

    switch (periodType) {
      case 'monthly':
        currentEnd.setMonth(currentEnd.getMonth() + 1);
        currentEnd.setDate(0);
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

    const statement = await generateCashFlowStatement(currentStart, currentEnd, {
      ...options,
      beginningBalance: runningBalance,
    });

    statements.push(statement);

    // Update running balance for next period
    runningBalance = statement.endingCashBalance;

    // Move to next period
    currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate() + 1);
  }

  return statements;
}

/**
 * Calculate current cash position and projections
 */
export async function calculateCashPosition(
  options?: {
    tenantId?: string;
  }
): Promise<CashPosition> {
  // Calculate last 3 months of cash flow to determine burn rate
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 3);

  const statements = await generateCashFlowByPeriod(
    startDate,
    endDate,
    'monthly',
    options
  );

  // Calculate average monthly burn rate
  const monthlyNetCashFlows = statements.map(s => s.netCashFlow);
  const avgMonthlyCashFlow = monthlyNetCashFlows.reduce((sum, flow) => sum + flow, 0) / monthlyNetCashFlows.length;
  const burnRate = avgMonthlyCashFlow < 0 ? Math.abs(avgMonthlyCashFlow) : 0;

  // Get current balance (last statement's ending balance)
  const currentBalance = statements[statements.length - 1]?.endingCashBalance || 0;

  // Project future balances
  const projectedBalance30Days = currentBalance + avgMonthlyCashFlow;
  const projectedBalance60Days = currentBalance + (avgMonthlyCashFlow * 2);
  const projectedBalance90Days = currentBalance + (avgMonthlyCashFlow * 3);

  // Calculate runway (months until cash runs out)
  let runwayMonths = Infinity;
  if (burnRate > 0 && currentBalance > 0) {
    runwayMonths = currentBalance / burnRate;
  }

  return {
    currentBalance,
    projectedBalance30Days,
    projectedBalance60Days,
    projectedBalance90Days,
    burnRate,
    runwayMonths,
  };
}

/**
 * Analyze cash flow trends
 */
export interface CashFlowTrend {
  period: string;
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  netCashFlow: number;
  trend: 'improving' | 'declining' | 'stable';
}

export async function analyzeCashFlowTrends(
  startDate: Date,
  endDate: Date,
  options?: {
    tenantId?: string;
  }
): Promise<CashFlowTrend[]> {
  const statements = await generateCashFlowByPeriod(startDate, endDate, 'monthly', options);

  return statements.map((statement, index) => {
    let trend: 'improving' | 'declining' | 'stable' = 'stable';

    if (index > 0) {
      const prevStatement = statements[index - 1];
      const cashFlowChange = statement.netCashFlow - prevStatement.netCashFlow;

      if (cashFlowChange > 0) {
        trend = 'improving';
      } else if (cashFlowChange < 0) {
        trend = 'declining';
      }
    }

    return {
      period: statement.period.label,
      operatingCashFlow: statement.operating.netOperatingCashFlow,
      investingCashFlow: statement.investing.netInvestingCashFlow,
      financingCashFlow: statement.financing.netFinancingCashFlow,
      netCashFlow: statement.netCashFlow,
      trend,
    };
  });
}

/**
 * Calculate free cash flow
 * Free Cash Flow = Operating Cash Flow - Capital Expenditures
 */
export async function calculateFreeCashFlow(
  startDate: Date,
  endDate: Date,
  options?: {
    tenantId?: string;
  }
): Promise<number> {
  const operating = await calculateOperatingCashFlow(startDate, endDate, options);
  const investing = await calculateInvestingCashFlow(startDate, endDate, options);

  const capitalExpenditures = investing.purchaseOfEquipment + investing.purchaseOfProperty;
  const freeCashFlow = operating.netOperatingCashFlow - capitalExpenditures;

  return freeCashFlow;
}
