/**
 * Tax Calculation Engine
 * Handles tax summaries, deductions, and liability estimates
 */

import { createClient } from '@/lib/supabase/server';

export interface TaxPeriod {
  startDate: Date;
  endDate: Date;
  label: string;
  taxYear: number;
  quarter?: number;
}

export interface TaxableSales {
  totalSales: number;
  taxableSales: number;
  taxExemptSales: number;
  salesTaxCollected: number;
  salesTaxRate: number;
}

export interface TaxDeductions {
  totalDeductions: number;
  costOfGoodsSold: number;
  operatingExpenses: number;
  depreciation: number;
  interestExpense: number;
  otherDeductions: number;
  byCategory: Record<string, number>;
}

export interface TaxLiability {
  taxableIncome: number;
  estimatedIncomeTax: number;
  estimatedSalesTax: number;
  estimatedPayrollTax: number;
  totalEstimatedTax: number;
  effectiveTaxRate: number; // Percentage
}

export interface TaxSummary {
  period: TaxPeriod;
  sales: TaxableSales;
  deductions: TaxDeductions;
  liability: TaxLiability;
  payments: {
    totalPaid: number;
    incomeTaxPaid: number;
    salesTaxPaid: number;
    payrollTaxPaid: number;
  };
  balance: {
    amountDue: number;
    amountOverpaid: number;
  };
}

/**
 * Calculate taxable sales for a period
 */
export async function calculateTaxableSales(
  startDate: Date,
  endDate: Date,
  options?: {
    salesTaxRate?: number;
    tenantId?: string;
  }
): Promise<TaxableSales> {
  const supabase = await createClient();
  const salesTaxRate = options?.salesTaxRate || 0.07; // Default 7%

  // Get all paid orders
  let ordersQuery = supabase
    .from('orders')
    .select('total_amount, metadata')
    .eq('payment_status', 'paid')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (options?.tenantId) {
    ordersQuery = ordersQuery.eq('tenant_id', options.tenantId);
  }

  const { data: orders } = await ordersQuery;

  let totalSales = 0;
  let taxExemptSales = 0;
  let salesTaxCollected = 0;

  orders?.forEach((order: any) => {
    const amount = order.total_amount || 0;
    totalSales += amount;

    // Check if order is tax exempt (from metadata)
    const isExempt = order.metadata?.taxExempt || false;
    if (isExempt) {
      taxExemptSales += amount;
    } else {
      // Calculate sales tax
      const taxAmount = order.metadata?.salesTax || (amount * salesTaxRate);
      salesTaxCollected += taxAmount;
    }
  });

  const taxableSales = totalSales - taxExemptSales;

  return {
    totalSales,
    taxableSales,
    taxExemptSales,
    salesTaxCollected,
    salesTaxRate,
  };
}

/**
 * Calculate tax deductions
 */
export async function calculateTaxDeductions(
  startDate: Date,
  endDate: Date,
  options?: {
    tenantId?: string;
  }
): Promise<TaxDeductions> {
  const supabase = await createClient();

  // Get all tax-deductible expenses
  let expensesQuery = supabase
    .from('expenses')
    .select(`
      amount,
      is_tax_deductible,
      expense_categories (
        name,
        category_type
      )
    `)
    .eq('payment_status', 'paid')
    .eq('is_tax_deductible', true)
    .gte('expense_date', startDate.toISOString().split('T')[0])
    .lte('expense_date', endDate.toISOString().split('T')[0]);

  if (options?.tenantId) {
    expensesQuery = expensesQuery.eq('tenant_id', options.tenantId);
  }

  const { data: expenses } = await expensesQuery;

  let costOfGoodsSold = 0;
  let operatingExpenses = 0;
  let interestExpense = 0;
  let otherDeductions = 0;
  const byCategory: Record<string, number> = {};

  expenses?.forEach((expense: any) => {
    const amount = expense.amount || 0;
    const category = expense.expense_categories;
    const categoryName = category?.name || 'Uncategorized';
    const categoryType = category?.category_type || 'other';

    // Add to category breakdown
    byCategory[categoryName] = (byCategory[categoryName] || 0) + amount;

    // Categorize for tax purposes
    switch (categoryType) {
      case 'cogs':
        costOfGoodsSold += amount;
        break;
      case 'operating':
        operatingExpenses += amount;
        break;
      default:
        if (categoryName === 'Interest Expense') {
          interestExpense += amount;
        } else {
          otherDeductions += amount;
        }
    }
  });

  // Depreciation would be calculated separately (not implemented here)
  const depreciation = 0;

  const totalDeductions =
    costOfGoodsSold +
    operatingExpenses +
    depreciation +
    interestExpense +
    otherDeductions;

  return {
    totalDeductions,
    costOfGoodsSold,
    operatingExpenses,
    depreciation,
    interestExpense,
    otherDeductions,
    byCategory,
  };
}

/**
 * Estimate tax liability
 */
export async function estimateTaxLiability(
  startDate: Date,
  endDate: Date,
  options?: {
    incomeTaxRate?: number;
    salesTaxRate?: number;
    payrollTaxRate?: number;
    tenantId?: string;
  }
): Promise<TaxLiability> {
  // Default tax rates (customize based on jurisdiction)
  const incomeTaxRate = options?.incomeTaxRate || 0.21; // 21% corporate tax
  const salesTaxRate = options?.salesTaxRate || 0.07; // 7% sales tax
  const payrollTaxRate = options?.payrollTaxRate || 0.153; // 15.3% (FICA)

  const sales = await calculateTaxableSales(startDate, endDate, {
    salesTaxRate,
    tenantId: options?.tenantId,
  });

  const deductions = await calculateTaxDeductions(startDate, endDate, {
    tenantId: options?.tenantId,
  });

  // Taxable income = Revenue - Deductions
  const taxableIncome = Math.max(0, sales.totalSales - deductions.totalDeductions);

  // Estimated income tax
  const estimatedIncomeTax = taxableIncome * incomeTaxRate;

  // Sales tax (already collected)
  const estimatedSalesTax = sales.salesTaxCollected;

  // Estimated payroll tax (based on salary expenses)
  const salaryExpenses = deductions.byCategory['Salaries & Wages'] || 0;
  const estimatedPayrollTax = salaryExpenses * payrollTaxRate;

  const totalEstimatedTax =
    estimatedIncomeTax +
    estimatedSalesTax +
    estimatedPayrollTax;

  const effectiveTaxRate =
    sales.totalSales > 0 ? (totalEstimatedTax / sales.totalSales) * 100 : 0;

  return {
    taxableIncome,
    estimatedIncomeTax,
    estimatedSalesTax,
    estimatedPayrollTax,
    totalEstimatedTax,
    effectiveTaxRate,
  };
}

/**
 * Calculate tax payments made
 */
export async function calculateTaxPayments(
  startDate: Date,
  endDate: Date,
  options?: {
    tenantId?: string;
  }
): Promise<TaxSummary['payments']> {
  const supabase = await createClient();

  // Get all tax payments
  let taxPaymentsQuery = supabase
    .from('expenses')
    .select(`
      amount,
      expense_categories (
        name,
        category_type
      )
    `)
    .eq('payment_status', 'paid')
    .gte('expense_date', startDate.toISOString().split('T')[0])
    .lte('expense_date', endDate.toISOString().split('T')[0]);

  if (options?.tenantId) {
    taxPaymentsQuery = taxPaymentsQuery.eq('tenant_id', options.tenantId);
  }

  const { data: expenses } = await taxPaymentsQuery;

  let incomeTaxPaid = 0;
  let salesTaxPaid = 0;
  let payrollTaxPaid = 0;

  expenses?.forEach((expense: any) => {
    const amount = expense.amount || 0;
    const categoryName = expense.expense_categories?.name || '';
    const categoryType = expense.expense_categories?.category_type || '';

    if (categoryType === 'tax') {
      switch (categoryName) {
        case 'Income Tax':
          incomeTaxPaid += amount;
          break;
        case 'Sales Tax':
          salesTaxPaid += amount;
          break;
        case 'Payroll Tax':
          payrollTaxPaid += amount;
          break;
      }
    }
  });

  const totalPaid = incomeTaxPaid + salesTaxPaid + payrollTaxPaid;

  return {
    totalPaid,
    incomeTaxPaid,
    salesTaxPaid,
    payrollTaxPaid,
  };
}

/**
 * Generate comprehensive tax summary
 */
export async function generateTaxSummary(
  startDate: Date,
  endDate: Date,
  options?: {
    incomeTaxRate?: number;
    salesTaxRate?: number;
    payrollTaxRate?: number;
    tenantId?: string;
  }
): Promise<TaxSummary> {
  const sales = await calculateTaxableSales(startDate, endDate, {
    salesTaxRate: options?.salesTaxRate,
    tenantId: options?.tenantId,
  });

  const deductions = await calculateTaxDeductions(startDate, endDate, {
    tenantId: options?.tenantId,
  });

  const liability = await estimateTaxLiability(startDate, endDate, options);

  const payments = await calculateTaxPayments(startDate, endDate, {
    tenantId: options?.tenantId,
  });

  const amountDue = Math.max(0, liability.totalEstimatedTax - payments.totalPaid);
  const amountOverpaid = Math.max(0, payments.totalPaid - liability.totalEstimatedTax);

  const taxYear = startDate.getFullYear();
  const quarter = Math.ceil((startDate.getMonth() + 1) / 3);

  return {
    period: {
      startDate,
      endDate,
      label: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      taxYear,
      quarter,
    },
    sales,
    deductions,
    liability,
    payments,
    balance: {
      amountDue,
      amountOverpaid,
    },
  };
}

/**
 * Generate quarterly tax summaries
 */
export async function generateQuarterlyTaxSummaries(
  year: number,
  options?: {
    incomeTaxRate?: number;
    salesTaxRate?: number;
    payrollTaxRate?: number;
    tenantId?: string;
  }
): Promise<TaxSummary[]> {
  const summaries: TaxSummary[] = [];

  for (let quarter = 1; quarter <= 4; quarter++) {
    const startMonth = (quarter - 1) * 3;
    const startDate = new Date(year, startMonth, 1);
    const endDate = new Date(year, startMonth + 3, 0); // Last day of quarter

    const summary = await generateTaxSummary(startDate, endDate, options);
    summaries.push(summary);
  }

  return summaries;
}

/**
 * Export tax data for accountant
 */
export interface TaxExportData {
  period: TaxPeriod;
  revenue: {
    totalRevenue: number;
    taxableRevenue: number;
    salesTaxCollected: number;
  };
  expenses: {
    totalExpenses: number;
    byCategory: Record<string, number>;
    taxDeductible: number;
  };
  taxLiability: {
    incomeTax: number;
    salesTax: number;
    payrollTax: number;
    total: number;
  };
  taxPayments: {
    total: number;
    byType: Record<string, number>;
  };
  balance: {
    amountDue: number;
    amountOverpaid: number;
  };
}

export async function exportTaxDataForAccountant(
  startDate: Date,
  endDate: Date,
  options?: {
    incomeTaxRate?: number;
    salesTaxRate?: number;
    payrollTaxRate?: number;
    tenantId?: string;
  }
): Promise<TaxExportData> {
  const summary = await generateTaxSummary(startDate, endDate, options);

  return {
    period: summary.period,
    revenue: {
      totalRevenue: summary.sales.totalSales,
      taxableRevenue: summary.sales.taxableSales,
      salesTaxCollected: summary.sales.salesTaxCollected,
    },
    expenses: {
      totalExpenses: summary.deductions.totalDeductions,
      byCategory: summary.deductions.byCategory,
      taxDeductible: summary.deductions.totalDeductions,
    },
    taxLiability: {
      incomeTax: summary.liability.estimatedIncomeTax,
      salesTax: summary.liability.estimatedSalesTax,
      payrollTax: summary.liability.estimatedPayrollTax,
      total: summary.liability.totalEstimatedTax,
    },
    taxPayments: {
      total: summary.payments.totalPaid,
      byType: {
        'Income Tax': summary.payments.incomeTaxPaid,
        'Sales Tax': summary.payments.salesTaxPaid,
        'Payroll Tax': summary.payments.payrollTaxPaid,
      },
    },
    balance: summary.balance,
  };
}
