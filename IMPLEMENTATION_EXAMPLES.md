# Implementation Examples - Top Priority Improvements

This document provides code examples and patterns for the most impactful improvements.

## 1. PAGINATION IMPLEMENTATION

### Database Query with Pagination
```typescript
// /app/api/products/route.ts - ADD PAGINATION
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Add pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    
    // Get total count
    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    // Get paginated data
    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
```

### Custom Hook with Pagination
```typescript
// /lib/hooks/useProductsPaginated.ts - NEW FILE
import { useState, useEffect, useCallback } from 'react';
import type { Product } from '@/types';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface UseProductsPaginatedReturn {
  products: Product[];
  pagination: PaginationMeta;
  loading: boolean;
  error: string | null;
  goToPage: (page: number) => void;
  setLimit: (limit: number) => void;
}

export function useProductsPaginated(
  initialPage = 1,
  initialLimit = 20
): UseProductsPaginatedReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (page: number, limit: number) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) throw new Error('Failed to fetch products');

      const { data, pagination: newPagination } = await response.json();

      setProducts(data);
      setPagination(newPagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(pagination.page, pagination.limit);
  }, [pagination.page, pagination.limit, fetchProducts]);

  return {
    products,
    pagination,
    loading,
    error,
    goToPage: (page: number) =>
      setPagination((prev) => ({ ...prev, page })),
    setLimit: (limit: number) =>
      setPagination((prev) => ({ ...prev, limit, page: 1 })),
  };
}
```

### UI Component with Pagination
```typescript
// Example usage in products page
import PaginationControls from '@/components/PaginationControls';

export default function ProductsPage() {
  const { products, pagination, loading, goToPage, setLimit } =
    useProductsPaginated(1, 20);

  return (
    <div className="space-y-4">
      {/* Table */}
      <table>{/* ... */}</table>

      {/* Pagination Controls */}
      <PaginationControls
        currentPage={pagination.page}
        totalPages={pagination.pages}
        pageSize={pagination.limit}
        onPageChange={goToPage}
        onPageSizeChange={setLimit}
        disabled={loading}
      />
    </div>
  );
}
```

---

## 2. DATA CACHING WITH REACT QUERY

### Setup React Query
```typescript
// /lib/react-query.ts - NEW FILE
import {
  QueryClient,
  DefaultOptions,
} from '@tanstack/react-query';

const queryConfig: DefaultOptions = {
  queries: {
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    retry: 1,
    refetchOnWindowFocus: false,
  },
};

export const queryClient = new QueryClient({ defaultOptions: queryConfig });
```

### Add to App Layout
```typescript
// /app/layout.tsx - MODIFY
'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/react-query';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

### Use Query Hook
```typescript
// /lib/hooks/useProductsWithQuery.ts - NEW FILE
import { useQuery } from '@tanstack/react-query';
import type { Product } from '@/types';

export function useProductsWithQuery() {
  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch');
      const { data } = await response.json();
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
```

---

## 3. TABLE IMPROVEMENTS WITH TANSTACK TABLE

### Install & Setup
```bash
npm install @tanstack/react-table
```

### Create Advanced Table Component
```typescript
// /components/DataTable.tsx - NEW FILE
'use client';

import { useState } from 'react';
import {
  ColumnDef,
  SortingState,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  onRowClick?: (row: TData) => void;
  rowSelection?: Record<string, boolean>;
  onRowSelectionChange?: (selection: Record<string, boolean>) => void;
}

export default function DataTable<TData extends { id: string }>({
  columns,
  data,
  onRowClick,
  rowSelection = {},
  onRowSelectionChange,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-6 py-3 text-left text-xs font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center gap-2">
                    {header.isPlaceholder
                      ? null
                      : header.getContext().renderValue()}
                    {header.column.getCanSort() && (
                      <span className="text-gray-400">
                        {header.column.getIsSorted() === 'asc' && (
                          <ChevronUp className="h-4 w-4" />
                        )}
                        {header.column.getIsSorted() === 'desc' && (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              onClick={() => onRowClick?.(row.original)}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-6 py-4 text-sm">
                  {cell.getContext().renderValue()}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 4. BULK IMPORT/EXPORT

### CSV Import Handler
```typescript
// /lib/utils/import.ts - NEW FILE
import type { Product } from '@/types';

export async function importProductsFromCSV(
  file: File
): Promise<{ data: any[]; errors: string[] }> {
  const text = await file.text();
  const lines = text.split('\n');
  const headers = lines[0].split(',');
  const data = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const values = lines[i].split(',');
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || '';
    });

    // Validate row
    if (!row['name'] || !row['sku'] || !row['price']) {
      errors.push(`Row ${i}: Missing required fields`);
      continue;
    }

    try {
      data.push({
        name: row['name'],
        sku: row['sku'],
        category: row['category'] || 'Other',
        price: parseFloat(row['price']),
        cost: parseFloat(row['cost'] || '0'),
        stock: parseInt(row['stock'] || '0'),
        description: row['description'] || '',
      });
    } catch (error) {
      errors.push(`Row ${i}: Invalid data format`);
    }
  }

  return { data, errors };
}

// Bulk import API endpoint
export async function bulkImportProducts(
  products: Partial<Product>[]
): Promise<{ success: number; failed: number; errors: string[] }> {
  const errors: string[] = [];
  let success = 0;
  let failed = 0;

  for (const product of products) {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });

      if (response.ok) {
        success++;
      } else {
        failed++;
        errors.push(`Failed to import: ${product.name}`);
      }
    } catch (error) {
      failed++;
      errors.push(`Error importing ${product.name}: ${error}`);
    }
  }

  return { success, failed, errors };
}
```

### Import UI Component
```typescript
// /components/BulkImportModal.tsx - NEW FILE
'use client';

import { useState } from 'react';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { importProductsFromCSV } from '@/lib/utils/import';

export default function BulkImportModal() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const { data, errors } = await importProductsFromCSV(selectedFile);
    setPreview(data.slice(0, 5)); // Show first 5 rows
    setErrors(errors);
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed rounded-lg p-6 text-center">
        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <input
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
          id="file-input"
        />
        <label htmlFor="file-input" className="cursor-pointer">
          Click to upload CSV
        </label>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex gap-2 text-red-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Import Errors:</p>
              <ul className="text-sm mt-2">
                {errors.slice(0, 5).map((error, i) => (
                  <li key={i}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {preview.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex gap-2 text-green-800">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">
                {preview.length} items ready to import
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 5. ADVANCED CUSTOMER ANALYTICS (RFM SEGMENTATION)

```typescript
// /lib/analytics/rfm.ts - NEW FILE
import { supabase } from '@/lib/supabase/client';
import type { Customer } from '@/types';

interface RFMScore {
  customerId: string;
  recency: number; // Days since last order
  frequency: number; // Total orders
  monetary: number; // Total spent
  rfmScore: string; // e.g., "5-5-5" for VIP
  segment: string; // VIP, Loyal, At-Risk, New, etc.
}

export async function calculateRFMScores(): Promise<RFMScore[]> {
  const today = new Date();
  const { data: orders } = await supabase
    .from('orders')
    .select('customer_id, total, created_at');

  if (!orders) return [];

  const rfmData: Record<string, RFMScore> = {};

  orders.forEach((order) => {
    if (!rfmData[order.customer_id]) {
      rfmData[order.customer_id] = {
        customerId: order.customer_id,
        recency: Math.floor(
          (today.getTime() - new Date(order.created_at).getTime()) /
            (1000 * 60 * 60 * 24)
        ),
        frequency: 1,
        monetary: order.total,
        rfmScore: '',
        segment: '',
      };
    } else {
      rfmData[order.customer_id].frequency++;
      rfmData[order.customer_id].monetary += order.total;
      rfmData[order.customer_id].recency = Math.min(
        rfmData[order.customer_id].recency,
        Math.floor(
          (today.getTime() - new Date(order.created_at).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );
    }
  });

  // Score each metric (1-5, where 5 is best)
  return Object.values(rfmData).map((score) => ({
    ...score,
    rfmScore: `${scoreRecency(score.recency)}-${scoreFrequency(
      score.frequency
    )}-${scoreMonetary(score.monetary)}`,
    segment: getSegment(
      score.recency,
      score.frequency,
      score.monetary
    ),
  }));
}

function scoreRecency(days: number): number {
  if (days <= 30) return 5;
  if (days <= 60) return 4;
  if (days <= 90) return 3;
  if (days <= 180) return 2;
  return 1;
}

function scoreFrequency(count: number): number {
  if (count >= 10) return 5;
  if (count >= 7) return 4;
  if (count >= 4) return 3;
  if (count >= 2) return 2;
  return 1;
}

function scoreMonetary(amount: number): number {
  if (amount >= 50000) return 5;
  if (amount >= 30000) return 4;
  if (amount >= 15000) return 3;
  if (amount >= 5000) return 2;
  return 1;
}

function getSegment(
  recency: number,
  frequency: number,
  monetary: number
): string {
  const rScore = scoreRecency(recency);
  const fScore = scoreFrequency(frequency);
  const mScore = scoreMonetary(monetary);

  if (rScore >= 4 && fScore >= 4 && mScore >= 4) return 'VIP';
  if (rScore >= 3 && fScore >= 3 && mScore >= 3) return 'Loyal';
  if (rScore <= 2 && fScore >= 3) return 'At-Risk';
  if (rScore >= 4 && fScore === 1) return 'New';
  if (rScore <= 2) return 'Churned';
  return 'Regular';
}
```

---

## 6. ERROR BOUNDARY & BETTER ERROR HANDLING

```typescript
// /components/ErrorBoundary.tsx - NEW FILE
'use client';

import { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Could send to error tracking service here
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full space-y-4">
            <div className="flex justify-center">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-center">
              Something went wrong
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-center">
              {this.state.error?.message ||
                'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## 7. FORM VALIDATION WITH ZOD

```typescript
// /lib/validations/product.ts - NEW FILE
import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  sku: z.string().min(1, 'SKU is required').max(100),
  category: z.enum([
    'Electronics',
    'Clothing',
    'Food & Beverage',
    'Home & Garden',
    'Sports',
    'Books',
    'Other',
  ]),
  price: z.number().min(0, 'Price must be positive'),
  cost: z.number().min(0, 'Cost must be positive'),
  stock: z.number().int().min(0, 'Stock must be non-negative'),
  description: z.string().optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;

export function validateProduct(data: unknown) {
  return productSchema.safeParse(data);
}
```

---

## NEXT STEPS

1. **Pagination First**: This is blocking scalability
   - Implement pagination endpoints in API routes
   - Add useProductsPaginated hook
   - Update products/orders/customers pages

2. **Add React Query**: Dramatically improves performance
   - Install @tanstack/react-query
   - Set up QueryClientProvider in layout
   - Replace fetch calls with useQuery

3. **Improve Tables**: Users will love column sorting and bulk actions
   - Install @tanstack/react-table
   - Create DataTable component
   - Add to all list pages

4. **Add Error Boundaries**: Prevent white screen of death
   - Create ErrorBoundary component
   - Wrap main app sections

5. **Validation**: Prevent bad data
   - Install zod for schema validation
   - Add to all forms and API handlers

These improvements will make the biggest impact with reasonable effort!
