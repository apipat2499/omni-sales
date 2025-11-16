/**
 * Report Templates Manager
 * Pre-built report templates and template utilities
 */

import { Dimension, Metric, Filter, Sort } from "./custom-report-engine";

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: "sales" | "customer" | "financial" | "operational" | "product";
  dimensions: Dimension[];
  metrics: Metric[];
  filters?: Filter[];
  sorting?: Sort[];
  chartType: "table" | "bar" | "line" | "pie" | "area";
  isFeatured?: boolean;
  tags: string[];
}

/**
 * Pre-built report templates
 */
export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: "sales-by-category",
    name: "Sales by Category",
    description: "Analyze revenue and orders by product category",
    category: "sales",
    dimensions: [
      { field: "category", label: "Category", type: "string" },
    ],
    metrics: [
      { field: "revenue", label: "Revenue", aggregation: "sum", format: "currency" },
      { field: "orders", label: "Orders", aggregation: "count" },
      { field: "avg_order_value", label: "Avg Order Value", aggregation: "avg", format: "currency" },
    ],
    sorting: [
      { field: "revenue", direction: "desc" },
    ],
    chartType: "bar",
    isFeatured: true,
    tags: ["sales", "category", "revenue"],
  },
  {
    id: "revenue-by-channel",
    name: "Revenue by Channel",
    description: "Compare sales performance across different channels",
    category: "sales",
    dimensions: [
      { field: "channel", label: "Channel", type: "string" },
    ],
    metrics: [
      { field: "revenue", label: "Revenue", aggregation: "sum", format: "currency" },
      { field: "orders", label: "Orders", aggregation: "count" },
      { field: "avg_order_value", label: "Avg Order Value", aggregation: "avg", format: "currency" },
    ],
    sorting: [
      { field: "revenue", direction: "desc" },
    ],
    chartType: "pie",
    isFeatured: true,
    tags: ["sales", "channel", "revenue"],
  },
  {
    id: "customer-acquisition-cost",
    name: "Customer Acquisition Cost",
    description: "Track CAC and customer acquisition metrics over time",
    category: "customer",
    dimensions: [
      { field: "date", label: "Date", type: "date", granularity: "month" },
    ],
    metrics: [
      { field: "new_customers", label: "New Customers", aggregation: "count" },
      { field: "revenue", label: "Revenue", aggregation: "sum", format: "currency" },
    ],
    sorting: [
      { field: "date", direction: "asc" },
    ],
    chartType: "line",
    isFeatured: true,
    tags: ["customer", "cac", "acquisition"],
  },
  {
    id: "product-performance",
    name: "Product Performance",
    description: "Detailed performance metrics for each product",
    category: "product",
    dimensions: [
      { field: "product_name", label: "Product", type: "string" },
    ],
    metrics: [
      { field: "units_sold", label: "Units Sold", aggregation: "sum" },
      { field: "revenue", label: "Revenue", aggregation: "sum", format: "currency" },
      { field: "profit", label: "Profit", aggregation: "sum", format: "currency" },
      { field: "profit_margin", label: "Profit Margin", aggregation: "avg", format: "percentage" },
    ],
    sorting: [
      { field: "revenue", direction: "desc" },
    ],
    chartType: "table",
    isFeatured: true,
    tags: ["product", "performance", "revenue", "profit"],
  },
  {
    id: "daily-sales-summary",
    name: "Daily Sales Summary",
    description: "Daily overview of key sales metrics",
    category: "sales",
    dimensions: [
      { field: "date", label: "Date", type: "date", granularity: "day" },
    ],
    metrics: [
      { field: "revenue", label: "Revenue", aggregation: "sum", format: "currency" },
      { field: "orders", label: "Orders", aggregation: "count" },
      { field: "avg_order_value", label: "AOV", aggregation: "avg", format: "currency" },
      { field: "unique_customers", label: "Customers", aggregation: "count_distinct" },
    ],
    sorting: [
      { field: "date", direction: "desc" },
    ],
    chartType: "area",
    isFeatured: true,
    tags: ["sales", "daily", "summary"],
  },
  {
    id: "top-customers",
    name: "Top Customers by Revenue",
    description: "Identify your most valuable customers",
    category: "customer",
    dimensions: [
      { field: "customer_name", label: "Customer", type: "string" },
    ],
    metrics: [
      { field: "revenue", label: "Total Revenue", aggregation: "sum", format: "currency" },
      { field: "orders", label: "Order Count", aggregation: "count" },
      { field: "avg_order_value", label: "Avg Order Value", aggregation: "avg", format: "currency" },
    ],
    sorting: [
      { field: "revenue", direction: "desc" },
    ],
    chartType: "table",
    isFeatured: false,
    tags: ["customer", "revenue", "top"],
  },
  {
    id: "sales-trend",
    name: "Sales Trend Analysis",
    description: "Track sales trends over time",
    category: "sales",
    dimensions: [
      { field: "date", label: "Date", type: "date", granularity: "week" },
    ],
    metrics: [
      { field: "revenue", label: "Revenue", aggregation: "sum", format: "currency" },
      { field: "orders", label: "Orders", aggregation: "count" },
    ],
    sorting: [
      { field: "date", direction: "asc" },
    ],
    chartType: "line",
    isFeatured: false,
    tags: ["sales", "trend", "time-series"],
  },
  {
    id: "order-status-breakdown",
    name: "Order Status Breakdown",
    description: "Distribution of orders by status",
    category: "operational",
    dimensions: [
      { field: "status", label: "Status", type: "string" },
    ],
    metrics: [
      { field: "orders", label: "Order Count", aggregation: "count" },
      { field: "revenue", label: "Revenue", aggregation: "sum", format: "currency" },
    ],
    sorting: [
      { field: "orders", direction: "desc" },
    ],
    chartType: "pie",
    isFeatured: false,
    tags: ["operational", "status", "orders"],
  },
  {
    id: "payment-method-analysis",
    name: "Payment Method Analysis",
    description: "Revenue breakdown by payment method",
    category: "financial",
    dimensions: [
      { field: "payment_method", label: "Payment Method", type: "string" },
    ],
    metrics: [
      { field: "revenue", label: "Revenue", aggregation: "sum", format: "currency" },
      { field: "orders", label: "Orders", aggregation: "count" },
    ],
    sorting: [
      { field: "revenue", direction: "desc" },
    ],
    chartType: "bar",
    isFeatured: false,
    tags: ["financial", "payment", "revenue"],
  },
  {
    id: "monthly-revenue-comparison",
    name: "Monthly Revenue Comparison",
    description: "Compare revenue across months",
    category: "financial",
    dimensions: [
      { field: "date", label: "Month", type: "date", granularity: "month" },
    ],
    metrics: [
      { field: "revenue", label: "Revenue", aggregation: "sum", format: "currency" },
      { field: "profit", label: "Profit", aggregation: "sum", format: "currency" },
      { field: "profit_margin", label: "Margin", aggregation: "avg", format: "percentage" },
    ],
    sorting: [
      { field: "date", direction: "asc" },
    ],
    chartType: "bar",
    isFeatured: false,
    tags: ["financial", "monthly", "revenue", "profit"],
  },
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): ReportTemplate | undefined {
  return REPORT_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(
  category: ReportTemplate["category"]
): ReportTemplate[] {
  return REPORT_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get featured templates
 */
export function getFeaturedTemplates(): ReportTemplate[] {
  return REPORT_TEMPLATES.filter((t) => t.isFeatured);
}

/**
 * Search templates by name or tags
 */
export function searchTemplates(query: string): ReportTemplate[] {
  const lowerQuery = query.toLowerCase();
  return REPORT_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get all categories
 */
export function getCategories(): ReportTemplate["category"][] {
  return ["sales", "customer", "financial", "operational", "product"];
}

/**
 * Create a custom template from a report configuration
 */
export function createCustomTemplate(
  name: string,
  description: string,
  category: ReportTemplate["category"],
  dimensions: Dimension[],
  metrics: Metric[],
  filters: Filter[] = [],
  sorting: Sort[] = [],
  chartType: ReportTemplate["chartType"] = "table",
  tags: string[] = []
): Omit<ReportTemplate, "id"> {
  return {
    name,
    description,
    category,
    dimensions,
    metrics,
    filters,
    sorting,
    chartType,
    isFeatured: false,
    tags,
  };
}
