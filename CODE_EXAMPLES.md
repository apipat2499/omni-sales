# Code Examples: Understanding Current Implementation

## 1. Order Structure in Types

**Location**: `/types/index.ts` (lines 50-67)

```typescript
export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];           // Array of line items
  subtotal: number;             // Sum of item totals before tax
  tax: number;                  // Tax amount
  shipping: number;             // Shipping cost
  total: number;                // Final total with everything
  status: OrderStatus;          // Current order status
  channel: OrderChannel;        // Where order came from
  paymentMethod?: string;       // How they paid
  shippingAddress?: string;     // Where to ship
  notes?: string;               // Internal notes
  createdAt: Date;
  updatedAt: Date;
  deliveredAt?: Date;           // When delivered (if applicable)
}

export interface OrderItem {
  productId: string;            // Reference to product
  productName: string;          // Name of product
  quantity: number;             // How many units
  price: number;                // Price per unit at time of order
  // MISSING: id field (needed to update/delete items)
  // MISSING: totalPrice field (calculated field)
}
```

---

## 2. How Orders Are Currently Fetched

**Location**: `/lib/hooks/useOrders.ts` (entire file)

```typescript
import { useState, useEffect, useCallback } from 'react';
import type { Order, OrderStatus, OrderChannel } from '@/types';

export function useOrders(options: UseOrdersOptions = {}): UseOrdersReturn {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      // Build query parameters for filtering
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status && status !== 'all') params.append('status', status);
      if (channel && channel !== 'all') params.append('channel', channel);

      // Call API
      const url = `/api/orders${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data);  // Save to state
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [search, status, channel]);

  // Fetch when component mounts or filters change
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, error, refresh: () => setOrders([]) };
}
```

**Key Insight**: This hook ONLY reads orders. It doesn't create, update, or delete them. We need similar hooks for managing order items.

---

## 3. Current API: Get Orders

**Location**: `/app/api/orders/route.ts` (GET method)

```typescript
export async function GET(req: NextRequest) {
  try {
    // Parse query parameters
    const customerId = req.nextUrl.searchParams.get('customerId');
    const status = req.nextUrl.searchParams.get('status');
    const channel = req.nextUrl.searchParams.get('channel');
    const search = req.nextUrl.searchParams.get('search');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');

    // Build Supabase query
    let query = supabase
      .from('orders')
      .select('*, order_items (*), order_shipping (*)', { count: 'exact' });

    // Apply filters
    if (customerId) query = query.eq('customer_id', customerId);
    if (status && status !== 'all') query = query.eq('status', status);
    if (channel && channel !== 'all') query = query.eq('channel', channel);
    if (search) {
      query = query.or(`id.ilike.%${search}%,customer_name.ilike.%${search}%`);
    }

    // Execute query with pagination
    const { data: orders, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    // Transform database format to frontend format
    const transformedOrders = (orders || []).map((order: any) => ({
      id: order.id,
      customerId: order.customer_id,
      customerName: order.customer_name || 'Unknown',
      subtotal: parseFloat(order.subtotal || 0),
      tax: parseFloat(order.tax || 0),
      shipping: parseFloat(order.shipping || 0),
      total: parseFloat(order.total || 0),
      status: order.status || 'pending',
      channel: order.channel || 'online',
      paymentMethod: order.payment_method,
      shippingAddress: order.shipping_address,
      notes: order.notes,
      createdAt: new Date(order.created_at),
      updatedAt: new Date(order.updated_at),
      deliveredAt: order.delivered_at ? new Date(order.delivered_at) : undefined,
      // Note: order_items are included but need to be mapped similarly
      items: (order.order_items || []).map((item: any) => ({
        productId: item.product_id,
        productName: item.product_name || 'Unknown',
        quantity: item.quantity,
        price: parseFloat(item.price || 0),
      })),
    }));

    return NextResponse.json(transformedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
```

**Key Insights**:
- Data transforms from snake_case (database) to camelCase (frontend)
- Prices are stored as DECIMAL in DB, converted to numbers in API
- order_items are fetched and mapped to items array
- Only GET is implemented. POST is missing!

---

## 4. How Order Service Works

**Location**: `/lib/order/service.ts` (example function)

```typescript
export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  reason?: string,
  notes?: string,
  changedBy?: string
): Promise<boolean> {
  try {
    // Step 1: Update the order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: newStatus,
        updated_at: new Date(),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order status:', updateError);
      return false;
    }

    // Step 2: Create audit trail record
    const { error: historyError } = await supabase
      .from('order_status_history')
      .insert({
        order_id: orderId,
        status: newStatus,
        reason,
        notes,
        changed_by: changedBy,
      });

    if (historyError) {
      console.error('Error creating status history:', historyError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    return false;
  }
}
```

**Key Pattern**: 
1. Do main operation
2. Log change to history table
3. Return true/false success status
4. We need to follow this same pattern for item operations

---

## 5. Current Order Details Display

**Location**: `/components/orders/OrderDetailsModal.tsx` (lines 158-200)

```typescript
{/* Items Table */}
<div>
  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
    รายการสินค้า
  </h3>
  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
    <table className="w-full">
      <thead className="bg-gray-50 dark:bg-gray-700">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
            สินค้า
          </th>
          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
            ราคา/หน่วย
          </th>
          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
            จำนวน
          </th>
          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
            ยอดรวม
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
        {order.items.map((item, index) => (
          <tr key={index} className="bg-white dark:bg-gray-800">
            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
              {item.productName}
            </td>
            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">
              {formatCurrency(item.price)}
            </td>
            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-center">
              {item.quantity}
            </td>
            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right font-medium">
              {formatCurrency(item.price * item.quantity)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

**Note**: This displays items as read-only. We need to add edit buttons to modify quantities and remove items.

---

## 6. Database Schema (Supabase)

**Location**: DATABASE (not in codebase, but documented in ORDER_MANAGEMENT.md)

### orders table
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,           -- Multi-tenant owner
  customer_id TEXT NOT NULL,
  order_number TEXT UNIQUE,
  status TEXT,                      -- pending, paid, shipped, delivered, cancelled
  total DECIMAL(15,2),
  subtotal DECIMAL(15,2),
  tax_amount DECIMAL(15,2),
  shipping_cost DECIMAL(15,2),
  discount_amount DECIMAL(15,2),
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX orders_user_id_idx ON orders(user_id);
CREATE INDEX orders_customer_id_idx ON orders(customer_id);
CREATE INDEX orders_status_idx ON orders(status);
CREATE INDEX orders_created_at_idx ON orders(created_at);
```

### order_items table
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY,              -- IMPORTANT: This ID is needed for updates/deletes
  user_id UUID NOT NULL,
  order_id UUID NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,        -- How many units
  unit_price DECIMAL(15,2) NOT NULL, -- Price per unit
  total_price DECIMAL(15,2) NOT NULL, -- quantity * unit_price
  sku TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  
  INDEX order_items_order_id_idx (order_id),
  INDEX order_items_product_id_idx (product_id)
);
```

---

## 7. What We Need to Add: Item Management Functions

**Location**: To be added in `/lib/order/service.ts`

```typescript
/**
 * Add a new item to an order
 */
export async function addOrderItem(
  orderId: string,
  item: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;  // Price per unit
  }
): Promise<OrderItem | null> {
  try {
    // Step 1: Insert new order_item
    const { data: newItem, error: itemError } = await supabase
      .from('order_items')
      .insert({
        order_id: orderId,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.quantity * item.price,
      })
      .select()
      .single();

    if (itemError) {
      console.error('Error adding order item:', itemError);
      return null;
    }

    // Step 2: Recalculate order totals
    await recalculateOrderTotals(orderId);

    // Step 3: Return the new item
    return {
      id: newItem.id,
      productId: newItem.product_id,
      productName: newItem.product_name,
      quantity: newItem.quantity,
      price: parseFloat(newItem.unit_price),
    };
  } catch (error) {
    console.error('Error in addOrderItem:', error);
    return null;
  }
}

/**
 * Update quantity for an order item
 */
export async function updateOrderItem(
  orderId: string,
  itemId: string,
  newQuantity: number,
  newPrice?: number
): Promise<OrderItem | null> {
  try {
    // Validate quantity
    if (newQuantity <= 0 || !Number.isInteger(newQuantity)) {
      console.error('Invalid quantity:', newQuantity);
      return null;
    }

    // Step 1: Get current item to calculate new total
    const { data: currentItem } = await supabase
      .from('order_items')
      .select('unit_price')
      .eq('id', itemId)
      .single();

    if (!currentItem) {
      console.error('Item not found:', itemId);
      return null;
    }

    // Step 2: Update the item
    const unitPrice = newPrice || parseFloat(currentItem.unit_price);
    const { data: updatedItem, error } = await supabase
      .from('order_items')
      .update({
        quantity: newQuantity,
        unit_price: unitPrice,
        total_price: newQuantity * unitPrice,
        updated_at: new Date(),
      })
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      console.error('Error updating order item:', error);
      return null;
    }

    // Step 3: Recalculate order totals
    await recalculateOrderTotals(orderId);

    return {
      id: updatedItem.id,
      productId: updatedItem.product_id,
      productName: updatedItem.product_name,
      quantity: updatedItem.quantity,
      price: parseFloat(updatedItem.unit_price),
    };
  } catch (error) {
    console.error('Error in updateOrderItem:', error);
    return null;
  }
}

/**
 * Remove item from order
 */
export async function removeOrderItem(
  orderId: string,
  itemId: string
): Promise<boolean> {
  try {
    // Step 1: Delete the item
    const { error } = await supabase
      .from('order_items')
      .delete()
      .eq('id', itemId)
      .eq('order_id', orderId);  // Extra safety check

    if (error) {
      console.error('Error removing order item:', error);
      return false;
    }

    // Step 2: Recalculate order totals
    const result = await recalculateOrderTotals(orderId);
    return result !== null;
  } catch (error) {
    console.error('Error in removeOrderItem:', error);
    return false;
  }
}

/**
 * Recalculate order totals based on current items
 */
export async function recalculateOrderTotals(
  orderId: string,
  taxRate: number = 0.07,  // 7% tax by default
  shippingCost: number = 0
): Promise<Order | null> {
  try {
    // Step 1: Get all items for this order
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('quantity, unit_price')
      .eq('order_id', orderId);

    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
      return null;
    }

    // Step 2: Calculate totals
    const subtotal = (items || []).reduce((sum, item) => {
      return sum + (item.quantity * parseFloat(item.unit_price));
    }, 0);

    const tax = subtotal * taxRate;
    const total = subtotal + tax + shippingCost;

    // Step 3: Update order with new totals
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        subtotal,
        tax_amount: tax,
        shipping_cost: shippingCost,
        total,
        updated_at: new Date(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating order totals:', updateError);
      return null;
    }

    return {
      id: updatedOrder.id,
      customerId: updatedOrder.customer_id,
      customerName: updatedOrder.customer_name,
      items: [],  // Would need to fetch these separately
      subtotal: parseFloat(updatedOrder.subtotal),
      tax: parseFloat(updatedOrder.tax_amount),
      shipping: parseFloat(updatedOrder.shipping_cost),
      total: parseFloat(updatedOrder.total),
      status: updatedOrder.status,
      channel: updatedOrder.channel,
      createdAt: new Date(updatedOrder.created_at),
      updatedAt: new Date(updatedOrder.updated_at),
    };
  } catch (error) {
    console.error('Error in recalculateOrderTotals:', error);
    return null;
  }
}
```

---

## 8. Next: API Endpoints to Create

These API endpoints are missing and need to be created:

```
// Files to create:

// 1. /app/api/orders/[orderId]/items/route.ts
//    POST - Add item to order
//    GET - List items in order (optional)

// 2. /app/api/orders/[orderId]/items/[itemId]/route.ts
//    PATCH - Update item quantity
//    DELETE - Remove item from order

// Example structure:
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const body = await request.json();

  // Validate input
  if (!body.productId || !body.quantity || !body.price) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  // Call service function
  const item = await addOrderItem(orderId, {
    productId: body.productId,
    productName: body.productName,
    quantity: body.quantity,
    price: body.price,
  });

  if (!item) {
    return NextResponse.json(
      { error: 'Failed to add item' },
      { status: 500 }
    );
  }

  // Return updated order
  const order = await getOrderWithDetails(orderId);
  return NextResponse.json({ success: true, item, order });
}
```

---

## Summary of What Exists vs. What's Missing

| Capability | Exists | Missing |
|------------|--------|---------|
| View orders | YES | - |
| View order details | YES | - |
| Create order header | Partial | POST /api/orders |
| Add items to order | NO | Full implementation |
| Remove items | NO | Full implementation |
| Update item quantity | NO | Full implementation |
| Recalculate totals | NO | Calculation logic |
| Update order status | YES | - |
| Record payment | YES | - |
| Manage shipping | YES | - |
| Handle returns | YES | - |

