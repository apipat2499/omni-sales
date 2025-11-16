import * as XLSX from "xlsx";
import { supabase } from "@/lib/auth";

export interface ProductExportData {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  cost_price: number;
  selling_price: number;
  description?: string;
}

export interface OrderExportData {
  id: string;
  order_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
  channel: string;
}

export interface CustomerExportData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  total_orders: number;
  total_spent: number;
  tags?: string;
}

// Export Products to Excel
export function exportProductsToExcel(products: ProductExportData[]) {
  const ws = XLSX.utils.json_to_sheet(products);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Products");

  // Add styles
  ws["!cols"] = [
    { wch: 10 },
    { wch: 25 },
    { wch: 15 },
    { wch: 15 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 30 },
  ];

  const filename = `products_${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// Export Orders to Excel
export function exportOrdersToExcel(orders: OrderExportData[]) {
  const ws = XLSX.utils.json_to_sheet(orders);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Orders");

  ws["!cols"] = [
    { wch: 10 },
    { wch: 15 },
    { wch: 20 },
    { wch: 15 },
    { wch: 12 },
    { wch: 20 },
    { wch: 15 },
  ];

  const filename = `orders_${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// Export Customers to Excel
export function exportCustomersToExcel(customers: CustomerExportData[]) {
  const ws = XLSX.utils.json_to_sheet(customers);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Customers");

  ws["!cols"] = [
    { wch: 10 },
    { wch: 15 },
    { wch: 15 },
    { wch: 25 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
    { wch: 20 },
  ];

  const filename = `customers_${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// Import Products from Excel
export async function importProductsFromExcel(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const products = XLSX.utils.sheet_to_json(ws) as any[];

        // Validate and transform data
        const validProducts = products
          .filter((p) => p.name && p.sku)
          .map((p) => ({
            name: p.name || "",
            sku: p.sku || "",
            category: p.category || "Other",
            stock: parseInt(p.stock) || 0,
            cost_price: parseFloat(p.cost_price) || 0,
            selling_price: parseFloat(p.selling_price) || 0,
            description: p.description || "",
          }));

        resolve(validProducts);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsBinaryString(file);
  });
}

// Import Orders from Excel
export async function importOrdersFromExcel(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const orders = XLSX.utils.sheet_to_json(ws) as any[];

        const validOrders = orders
          .filter((o) => o.order_number)
          .map((o) => ({
            order_number: o.order_number || "",
            customer_name: o.customer_name || "",
            total_amount: parseFloat(o.total_amount) || 0,
            status: o.status || "pending",
            channel: o.channel || "online",
          }));

        resolve(validOrders);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsBinaryString(file);
  });
}

// Import Customers from Excel
export async function importCustomersFromExcel(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const customers = XLSX.utils.sheet_to_json(ws) as any[];

        const validCustomers = customers
          .filter((c) => c.first_name || c.email)
          .map((c) => ({
            first_name: c.first_name || "",
            last_name: c.last_name || "",
            email: c.email || "",
            phone: c.phone || "",
            tags: c.tags ? c.tags.split(",").map((t: string) => t.trim()) : [],
          }));

        resolve(validCustomers);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsBinaryString(file);
  });
}

// Batch insert products
export async function batchInsertProducts(products: any[]) {
  try {
    const { data, error } = await supabase
      .from("products")
      .insert(products);

    if (error) throw error;
    return { success: true, count: data?.length || 0 };
  } catch (error) {
    console.error("Error inserting products:", error);
    throw error;
  }
}

// Batch insert customers
export async function batchInsertCustomers(customers: any[]) {
  try {
    const { data, error } = await supabase
      .from("customers")
      .insert(customers);

    if (error) throw error;
    return { success: true, count: data?.length || 0 };
  } catch (error) {
    console.error("Error inserting customers:", error);
    throw error;
  }
}

// Export with filters
export async function exportProductsFiltered(filters: {
  category?: string;
  minStock?: number;
  maxPrice?: number;
}) {
  try {
    let query = supabase.from("products").select("*");

    if (filters.category) {
      query = query.eq("category", filters.category);
    }

    if (filters.minStock !== undefined) {
      query = query.gte("stock", filters.minStock);
    }

    if (filters.maxPrice !== undefined) {
      query = query.lte("selling_price", filters.maxPrice);
    }

    const { data, error } = await query;

    if (error) throw error;

    if (data) {
      exportProductsToExcel(data);
    }

    return { success: true };
  } catch (error) {
    console.error("Error exporting filtered products:", error);
    throw error;
  }
}
