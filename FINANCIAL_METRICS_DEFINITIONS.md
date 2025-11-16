# Financial Metrics Definitions

Comprehensive guide to all financial metrics, formulas, and calculations used in the Omni Sales advanced financial reporting system.

## Table of Contents
1. [Revenue Metrics](#revenue-metrics)
2. [Expense Metrics](#expense-metrics)
3. [Profitability Metrics](#profitability-metrics)
4. [Cash Flow Metrics](#cash-flow-metrics)
5. [Tax Metrics](#tax-metrics)
6. [Balance Sheet Metrics](#balance-sheet-metrics)

---

## Revenue Metrics

### Total Revenue
**Definition:** The total amount of income generated from all sales before any deductions.

**Formula:**
```
Total Revenue = Sum of all order amounts
```

**Usage:**
- Primary indicator of business size and growth
- Used in calculating profit margins
- Base for percentage-based metrics

---

### Paid Revenue
**Definition:** Revenue from orders where payment has been successfully received.

**Formula:**
```
Paid Revenue = Sum of order amounts where payment_status = 'paid'
```

**Usage:**
- Actual cash received by the business
- More conservative revenue metric
- Used in cash flow analysis

---

### Pending Revenue
**Definition:** Revenue from orders awaiting payment confirmation.

**Formula:**
```
Pending Revenue = Sum of order amounts where payment_status = 'pending'
```

**Usage:**
- Expected future cash inflow
- Working capital planning
- Risk assessment

---

### Average Order Value (AOV)
**Definition:** The average amount spent per order.

**Formula:**
```
AOV = Total Revenue / Number of Orders
```

**Usage:**
- Customer spending behavior analysis
- Marketing effectiveness measurement
- Revenue optimization strategy

---

## Expense Metrics

### Cost of Goods Sold (COGS)
**Definition:** Direct costs attributable to the production of goods sold.

**Formula:**
```
COGS = Sum of expenses where category_type = 'cogs'
```

**Includes:**
- Inventory purchases
- Shipping and fulfillment costs
- Payment processing fees
- Direct labor costs

**Usage:**
- Calculating gross profit
- Product pricing decisions
- Supply chain optimization

---

### Operating Expenses
**Definition:** Costs incurred during normal business operations, excluding COGS.

**Formula:**
```
Operating Expenses = Sum of expenses where category_type = 'operating'
```

**Includes:**
- Salaries and wages
- Rent and utilities
- Marketing and advertising
- Software subscriptions
- Insurance
- Professional services
- Office supplies
- Telecommunications

**Usage:**
- Calculating operating profit
- Budget planning
- Cost control measures

---

### Capital Expenditures (CapEx)
**Definition:** Funds used to acquire or upgrade physical assets.

**Formula:**
```
CapEx = Sum of expenses where category_type = 'capital'
```

**Includes:**
- Equipment purchases
- Property acquisitions
- Major facility improvements

**Usage:**
- Investment analysis
- Cash flow projections
- Depreciation calculations

---

### Total Expenses
**Definition:** Sum of all business expenses across all categories.

**Formula:**
```
Total Expenses = COGS + Operating Expenses + Capital Expenses + Tax Expenses + Other Expenses
```

---

## Profitability Metrics

### Gross Profit
**Definition:** Revenue remaining after deducting the cost of goods sold.

**Formula:**
```
Gross Profit = Revenue - COGS
```

**Usage:**
- Product profitability analysis
- Pricing strategy
- Supplier negotiation leverage

---

### Gross Margin
**Definition:** Gross profit as a percentage of revenue.

**Formula:**
```
Gross Margin (%) = (Gross Profit / Revenue) × 100
```

**Interpretation:**
- **Above 50%:** Excellent - Strong pricing power or low production costs
- **30-50%:** Good - Healthy margin for most businesses
- **Below 30%:** Concerning - May indicate pricing pressure or high costs

---

### Operating Profit (EBIT)
**Definition:** Earnings before interest and taxes; profit from core operations.

**Formula:**
```
Operating Profit = Gross Profit - Operating Expenses
```

**Alternative Name:** EBIT (Earnings Before Interest and Taxes)

**Usage:**
- Operational efficiency measurement
- Comparing businesses with different capital structures
- Performance trending

---

### Operating Margin
**Definition:** Operating profit as a percentage of revenue.

**Formula:**
```
Operating Margin (%) = (Operating Profit / Revenue) × 100
```

**Interpretation:**
- **Above 20%:** Excellent - Highly efficient operations
- **10-20%:** Good - Healthy operational efficiency
- **Below 10%:** Concerning - May need cost optimization

---

### Net Profit
**Definition:** The bottom line; profit remaining after all expenses.

**Formula:**
```
Net Profit = Operating Profit - Other Expenses - Tax Expenses
```

**Usage:**
- Overall business profitability
- Shareholder returns
- Reinvestment capacity

---

### Net Margin
**Definition:** Net profit as a percentage of revenue.

**Formula:**
```
Net Margin (%) = (Net Profit / Revenue) × 100
```

**Interpretation:**
- **Above 15%:** Excellent - Very profitable
- **5-15%:** Good - Sustainable profitability
- **Below 5%:** Concerning - Thin margins

---

### EBITDA
**Definition:** Earnings before interest, taxes, depreciation, and amortization.

**Formula:**
```
EBITDA = Operating Profit + Depreciation + Amortization
```

**Note:** Currently simplified to Operating Profit (depreciation/amortization tracking to be added)

**Usage:**
- Company valuation
- Cash generation capacity
- Industry comparisons

---

## Cash Flow Metrics

### Operating Cash Flow
**Definition:** Cash generated from normal business operations.

**Formula:**
```
Operating Cash Flow = Cash from Sales - Cash Paid to Suppliers - Cash Paid for Operating Expenses
```

**Components:**
- **Cash from Sales:** Payments received from customers
- **Cash Paid to Suppliers:** COGS payments made
- **Operating Expenses Paid:** Operating expense payments made

**Usage:**
- Business sustainability assessment
- Working capital management
- Dividend payment capability

---

### Investing Cash Flow
**Definition:** Cash used for or generated from investments.

**Formula:**
```
Investing Cash Flow = Sale of Assets - Purchase of Equipment - Purchase of Property
```

**Components:**
- **Purchase of Equipment:** Capital expenditure on equipment
- **Purchase of Property:** Real estate investments
- **Sale of Assets:** Proceeds from asset sales

**Usage:**
- Growth investment tracking
- Capital allocation decisions
- Asset management

---

### Financing Cash Flow
**Definition:** Cash from or used for financing activities.

**Formula:**
```
Financing Cash Flow = Proceeds from Loans - Repayment of Debt - Dividends Paid
```

**Components:**
- **Proceeds from Loans:** New borrowings
- **Repayment of Debt:** Loan principal payments
- **Dividends Paid:** Distributions to owners

**Usage:**
- Capital structure analysis
- Debt management
- Shareholder return planning

---

### Net Cash Flow
**Definition:** Total change in cash position.

**Formula:**
```
Net Cash Flow = Operating Cash Flow + Investing Cash Flow + Financing Cash Flow
```

**Usage:**
- Overall cash position tracking
- Liquidity management
- Financial health assessment

---

### Free Cash Flow (FCF)
**Definition:** Cash available after capital expenditures.

**Formula:**
```
Free Cash Flow = Operating Cash Flow - Capital Expenditures
```

**Usage:**
- Business valuation
- Dividend sustainability
- Debt repayment capacity

---

### Cash Position
**Definition:** Current and projected cash balance.

**Metrics:**
- **Current Balance:** Cash on hand today
- **Projected Balance (30/60/90 days):** Expected future cash
- **Burn Rate:** Monthly cash consumption
- **Runway:** Months until cash depletion

**Burn Rate Formula:**
```
Burn Rate = |Average Monthly Net Cash Flow| (if negative)
```

**Runway Formula:**
```
Runway (months) = Current Balance / Burn Rate
```

---

## Tax Metrics

### Taxable Income
**Definition:** Income subject to taxation after deductions.

**Formula:**
```
Taxable Income = Total Revenue - Tax Deductions
```

**Usage:**
- Income tax calculation
- Tax planning
- Deduction optimization

---

### Tax Deductions
**Definition:** Expenses that reduce taxable income.

**Formula:**
```
Tax Deductions = COGS + Operating Expenses + Depreciation + Interest Expense + Other Deductible Expenses
```

**Components:**
- Cost of Goods Sold
- Operating Expenses
- Depreciation (when tracked)
- Interest on business loans
- Other qualifying expenses

---

### Estimated Income Tax
**Definition:** Projected corporate income tax liability.

**Formula:**
```
Estimated Income Tax = Taxable Income × Income Tax Rate
```

**Default Rate:** 21% (US corporate tax rate; customizable)

---

### Sales Tax Collected
**Definition:** Sales tax collected from customers.

**Formula:**
```
Sales Tax Collected = Sum of sales tax on taxable orders
```

**Usage:**
- Sales tax remittance
- Compliance reporting
- Cash flow planning

---

### Estimated Payroll Tax
**Definition:** Employer's payroll tax obligations.

**Formula:**
```
Estimated Payroll Tax = Salary Expenses × Payroll Tax Rate
```

**Default Rate:** 15.3% (FICA; customizable)

**Components:**
- Social Security tax
- Medicare tax
- Unemployment tax (if applicable)

---

### Total Tax Liability
**Definition:** Total estimated tax obligations.

**Formula:**
```
Total Tax Liability = Income Tax + Sales Tax + Payroll Tax
```

---

### Effective Tax Rate
**Definition:** Actual tax burden as percentage of revenue.

**Formula:**
```
Effective Tax Rate (%) = (Total Tax Liability / Total Revenue) × 100
```

**Usage:**
- Tax efficiency analysis
- Business structure optimization
- Cash flow planning

---

## Balance Sheet Metrics

### Beginning Cash Balance
**Definition:** Cash balance at the start of a period.

**Usage:**
- Cash flow statement starting point
- Period-over-period comparison

---

### Ending Cash Balance
**Definition:** Cash balance at the end of a period.

**Formula:**
```
Ending Cash Balance = Beginning Cash Balance + Net Cash Flow
```

**Usage:**
- Liquidity assessment
- Next period's beginning balance

---

## Growth Metrics

### Year-over-Year (YoY) Revenue Growth
**Definition:** Revenue change compared to same period last year.

**Formula:**
```
YoY Revenue Growth (%) = ((Current Revenue - Prior Year Revenue) / Prior Year Revenue) × 100
```

**Interpretation:**
- **Above 20%:** High growth
- **10-20%:** Healthy growth
- **Below 10%:** Slow growth

---

### Year-over-Year Expense Growth
**Definition:** Expense change compared to same period last year.

**Formula:**
```
YoY Expense Growth (%) = ((Current Expenses - Prior Year Expenses) / Prior Year Expenses) × 100
```

**Interpretation:**
- Should ideally be lower than revenue growth
- Higher growth may indicate cost control issues

---

### Year-over-Year Profit Growth
**Definition:** Profit change compared to same period last year.

**Formula:**
```
YoY Profit Growth (%) = ((Current Profit - Prior Year Profit) / |Prior Year Profit|) × 100
```

---

## Period Types

### Monthly
- Most granular view
- Ideal for operational decisions
- Best for trend analysis

### Quarterly
- Standard for tax reporting
- Good for strategic planning
- Balances detail with big picture

### Yearly
- Annual performance review
- Long-term planning
- Compliance reporting

---

## Data Sources

### Orders Table
- Revenue calculations
- Customer metrics
- Sales tax data

### Expenses Table
- All expense categories
- Payment status tracking
- Vendor information

### Stripe Tables
- Payment confirmations
- Refund tracking
- Transaction history

### Database Views
- `revenue_summary_view`
- `expense_summary_view`
- `profit_analysis_view`
- `cash_flow_view`

---

## Best Practices

### Accrual vs. Cash Basis
- **P&L Reports:** Use accrual basis (when earned/incurred)
- **Cash Flow:** Use cash basis (when paid/received)
- Be consistent within each report type

### Period Selection
- Compare like periods (e.g., Q1 to Q1)
- Consider seasonality
- Use rolling periods for trends

### Data Quality
- Ensure all expenses are categorized
- Regular reconciliation with bank statements
- Review and approve large transactions

### Reporting Frequency
- **Daily:** Cash position monitoring
- **Weekly:** Key metrics dashboard
- **Monthly:** Full P&L and cash flow
- **Quarterly:** Tax planning and board reports
- **Yearly:** Annual review and planning

---

## API Endpoints

### P&L Report
```
GET /api/financial/p-and-l?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&includeYoY=true
```

### Cash Flow
```
GET /api/financial/cash-flow?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&periodType=monthly
```

### Expenses
```
GET /api/financial/expenses?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
POST /api/financial/expenses
```

### Tax Summary
```
GET /api/financial/tax-summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

---

## Glossary

- **COGS:** Cost of Goods Sold
- **EBIT:** Earnings Before Interest and Taxes
- **EBITDA:** Earnings Before Interest, Taxes, Depreciation, and Amortization
- **FCF:** Free Cash Flow
- **P&L:** Profit and Loss
- **YoY:** Year-over-Year
- **CapEx:** Capital Expenditures
- **AOV:** Average Order Value

---

## Notes

1. All currency values are in USD by default
2. Percentages are calculated to 2 decimal places
3. Negative values in parentheses indicate expenses or losses
4. Tax rates are configurable per jurisdiction
5. Custom date ranges supported for all reports

---

**Last Updated:** November 16, 2025
**Version:** 1.0
