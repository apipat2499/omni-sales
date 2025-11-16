# Codebase Analysis: Menu and Order Features

## Project Overview
This is a comprehensive **omni-sales platform** built with:
- **Framework**: Next.js 16+ (App Router)
- **Database**: Supabase (PostgreSQL)
- **Language**: TypeScript + React
- **Styling**: Tailwind CSS
- **Localization**: Thai (th) and English (en)

Current Branch: `claude/add-menu-order-features-01EFdjWk2FUivmcKn4XqtbKU`

---

## 1. CURRENT MENU IMPLEMENTATION

### What Exists
**Menu is currently implemented as "Products"** - there is no separate menu/restaurant system:

#### Product Types and Structure
```typescript
// From types/index.ts
export interface Product {
  id: string;
  name: string;
  category: ProductCategory;  // Electronics, Clothing, Food & Beverage, etc.
  price: number;              // Retail price
  cost: number;               // Cost price
  stock: number;              // Inventory level
  sku: string;
  image?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductCategory = 
  | 'Electronics'
  | 'Clothing'
  | 'Food & Beverage'  // <-- Used for restaurant items
  | 'Home & Garden'
  | 'Sports'
  | 'Books'
  | 'Other';
```

#### Where Products are Managed
- **Page**: `/app/products/page.tsx`
- **Hook**: `/lib/hooks/useProducts.ts`
- **Features**:
  - View all products with pagination
  - Filter by category
  - Search by name and SKU
  - Add/Edit/Delete products
  - Low stock alerts
  - Stock value calculation

#### Product API Endpoints
```
GET /api/products                 - List all products
POST /api/products                - Create new product
GET /api/products/[productId]     - Get product details
PATCH/PUT /api/products/[productId] - Update product
DELETE /api/products/[productId]  - Delete product
```

---

## 2. CURRENT ORDER IMPLEMENTATION

### Order Data Structure

#### Core Types
```typescript
// Order
export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];           // Line items
  subtotal: number;             // Before tax/shipping
  tax: number;
  shipping: number;
  total: number;
  status: OrderStatus;          // pending | processing | shipped | delivered | cancelled
  channel: OrderChannel;        // online | offline | mobile | phone
  paymentMethod?: string;
  shippingAddress?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deliveredAt?: Date;
}

// Order Item
export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;              // Price per unit at time of order
}
```

#### Database Schema (Supabase)
**Main Tables:**
- `orders` - Order header information
- `order_items` - Individual line items
- `order_status_history` - Audit trail
- `order_payments` - Payment records
- `order_shipping` - Shipping information
- `order_returns` - Return requests
- `return_items` - Items in returns
- `refunds` - Refund processing
- `fulfillment_tasks` - Pick/pack/ship tasks
- `order_discounts` - Applied discounts

#### Where Orders are Managed
- **Page**: `/app/orders/page.tsx`
- **Hook**: `/lib/hooks/useOrders.ts`
- **Service**: `/lib/order/service.ts`
- **Components**:
  - `OrderDetailsModal.tsx` - View order details
  - `UpdateOrderStatusModal.tsx` - Update status

#### Order Status Workflow
```
pending -> processing -> shipped -> delivered
                     \-> cancelled (from any state)
```

---

## 3. HOW ORDERS ARE CURRENTLY MANAGED

### Available Order Operations

#### 1. **View Orders** (READ)
```typescript
// useOrders hook
const { orders, loading, error, refresh } = useOrders({
  search?: string,
  status?: OrderStatus | 'all',
  channel?: OrderChannel | 'all'
});
```

**Supported filters**:
- Search by order ID or customer name
- Filter by status (pending, processing, shipped, delivered, cancelled)
- Filter by channel (online, offline, mobile, phone)
- Pagination (default limit: 50)

#### 2. **Get Order Details** (READ)
```typescript
// From order service
export async function getOrderWithDetails(orderId: string): Promise<OrderWithDetails | null>
```
Returns complete order with:
- Order items (product details)
- Payment history
- Shipping information
- Returns and refunds
- Status history
- Fulfillment tasks

#### 3. **Update Order Status** (UPDATE)
```typescript
// From order service
export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  reason?: string,
  notes?: string,
  changedBy?: string
): Promise<boolean>
```

#### 4. **Payment Recording** (CREATE/UPDATE)
```typescript
export async function recordOrderPayment(
  orderId: string,
  payment: {
    paymentMethod: string;
    amount: number;
    currency?: string;
    transactionId?: string;
    gatewayResponse?: Record<string, any>;
  }
): Promise<OrderPayment | null>
```

#### 5. **Shipping Management** (CREATE/UPDATE)
- Create shipping record
- Update shipping status
- Track shipping numbers

#### 6. **Returns & Refunds** (CREATE/UPDATE)
- Create return request
- Approve return
- Process refund

#### 7. **Fulfillment Tasks** (CREATE/UPDATE)
- Create pick/pack/ship tasks
- Update task status

### API Endpoints Overview
```
Orders:
GET    /api/orders                    - List orders
GET    /api/orders/[orderId]          - Get order details
PUT    /api/orders/[orderId]          - Update order status

Items:
POST   /api/orders/[orderId]/items    - Add item (NOT IMPLEMENTED)
PATCH  /api/orders/[orderId]/items    - Update item quantity (NOT IMPLEMENTED)
DELETE /api/orders/[orderId]/items    - Remove item (NOT IMPLEMENTED)

Payments:
GET    /api/orders/[orderId]/payments
POST   /api/orders/[orderId]/payments

Shipping:
GET    /api/orders/[orderId]/shipping
POST   /api/orders/[orderId]/shipping
PATCH  /api/orders/[orderId]/shipping

Returns:
GET    /api/orders/[orderId]/returns
POST   /api/orders/[orderId]/returns
PUT    /api/orders/[orderId]/returns

Fulfillment:
GET    /api/orders/[orderId]/fulfillment
POST   /api/orders/[orderId]/fulfillment
PATCH  /api/orders/[orderId]/fulfillment
```

---

## 4. MISSING FUNCTIONALITY FOR ADD/REDUCE ORDERS

### Critical Missing Features

#### 1. **Create Order** (POST endpoint)
- **Missing**: `POST /api/orders` endpoint to create new orders
- **What's needed**:
  - Create order header with customer info
  - Create associated order_items
  - Calculate subtotal, tax, shipping
  - Set initial status (pending)

#### 2. **Add Items to Order**
- **Missing**: `POST /api/orders/[orderId]/items`
- **What's needed**:
  - Add new item to existing order
  - Update order totals (subtotal, tax, total)
  - Check product stock availability
  - Recalculate order amounts

#### 3. **Remove Items from Order**
- **Missing**: `DELETE /api/orders/[orderId]/items`
- **What's needed**:
  - Remove order_item by item ID
  - Recalculate order totals
  - Update order updated_at timestamp

#### 4. **Update Item Quantity**
- **Missing**: `PATCH /api/orders/[orderId]/items/[itemId]`
- **What's needed**:
  - Modify quantity for specific order item
  - Check stock availability for increased quantity
  - Recalculate line item total and order totals
  - Prevent negative quantities
  - Validate quantity is an integer

#### 5. **Clear Order Items**
- **Missing**: `DELETE /api/orders/[orderId]/items` (clear all)
- **What's needed**:
  - Remove all items from an order
  - Option to delete the entire order if empty

#### 6. **Bulk Operations**
- **Missing**: Batch add/update items
- **What's needed**:
  - Add multiple items in one request
  - Update multiple items in one request

---

## 5. SUGGESTED STRUCTURE FOR ADD/REDUCE FUNCTIONALITY

### A. Database Schema Enhancements

#### 1. Extend `order_items` Table
```sql
-- Already exists, but needs usage verification
CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,           -- Multi-tenancy
  order_id UUID NOT NULL,          -- FK to orders
  product_id TEXT NOT NULL,        -- FK to products
  product_name TEXT NOT NULL,      -- Denormalized
  quantity INTEGER NOT NULL,       -- How many
  unit_price DECIMAL NOT NULL,     -- Price per unit
  total_price DECIMAL NOT NULL,    -- quantity * unit_price
  sku TEXT,                        -- Denormalized
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX order_items_order_id_idx (order_id),
  INDEX order_items_product_id_idx (product_id)
);
```

#### 2. Optional: Add `cart_items` Table (for temporary carts)
```sql
CREATE TABLE cart_items (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,           -- Merchant/shop owner
  session_id TEXT,                 -- Or customer_id for persistent carts
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX cart_items_session_idx (session_id),
  INDEX cart_items_user_id_idx (user_id)
);
```

### B. TypeScript Types (types/index.ts)

```typescript
// Extend existing OrderItem
export interface OrderItem {
  id?: string;                      // Add ID field
  orderId?: string;                 // Add FK reference
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  unitPrice?: number;               // Add explicit unit price
  totalPrice?: number;              // Calculated field
  sku?: string;
}

// New: Request/Response types for order item operations
export interface AddOrderItemRequest {
  productId: string;
  quantity: number;
  price?: number;                   // Optional: override product price
}

export interface UpdateOrderItemRequest {
  quantity: number;                 // New quantity
  price?: number;                   // Optional: new price
}

export interface OrderItemResponse extends OrderItem {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Cart types (optional)
export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Cart {
  id?: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}
```

### C. Service Layer (lib/order/service.ts)

```typescript
/**
 * Add item to order
 */
export async function addOrderItem(
  orderId: string,
  item: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }
): Promise<OrderItem | null>

/**
 * Update item quantity in order
 */
export async function updateOrderItem(
  orderId: string,
  itemId: string,
  quantity: number,
  price?: number
): Promise<OrderItem | null>

/**
 * Remove item from order
 */
export async function removeOrderItem(
  orderId: string,
  itemId: string
): Promise<boolean>

/**
 * Recalculate order totals
 */
export async function recalculateOrderTotals(
  orderId: string,
  taxRate?: number,
  shippingCost?: number
): Promise<Order | null>

/**
 * Clear all items from order
 */
export async function clearOrderItems(
  orderId: string
): Promise<boolean>
```

### D. API Endpoints (app/api/orders/)

#### 1. **Create Order** - POST `/api/orders`
```typescript
// Request
{
  customerId: string;
  customerName: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  channel: 'online' | 'offline' | 'mobile' | 'phone';
  shippingAddress?: string;
  notes?: string;
  taxRate?: number;      // e.g., 0.07 for 7% tax
  shippingCost?: number;
  paymentMethod?: string;
}

// Response
{
  success: boolean;
  order: Order & { items: OrderItem[] };
  message: string;
}
```

#### 2. **Add Item to Order** - POST `/api/orders/[orderId]/items`
```typescript
// Request
{
  productId: string;
  productName: string;
  quantity: number;
  price: number;           // Price per unit
}

// Response
{
  success: boolean;
  item: OrderItemResponse;
  order: Order;            // Updated order with new totals
  message: string;
}
```

#### 3. **Update Item Quantity** - PATCH `/api/orders/[orderId]/items/[itemId]`
```typescript
// Request
{
  quantity: number;        // New quantity
  price?: number;          // Optional: new price
}

// Response
{
  success: boolean;
  item: OrderItemResponse;
  order: Order;            // Updated order with new totals
  message: string;
}
```

#### 4. **Remove Item** - DELETE `/api/orders/[orderId]/items/[itemId]`
```typescript
// Response
{
  success: boolean;
  order: Order;            // Updated order with new totals
  message: string;
}
```

#### 5. **Clear All Items** - DELETE `/api/orders/[orderId]/items`
```typescript
// Response
{
  success: boolean;
  order?: Order;           // Order with empty items array
  message: string;
}
```

### E. React Hook for Order Management

```typescript
// lib/hooks/useOrderItems.ts
export function useOrderItems(orderId: string) {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItem = async (item: AddOrderItemRequest) => {
    // POST /api/orders/[orderId]/items
  };

  const updateItem = async (itemId: string, quantity: number) => {
    // PATCH /api/orders/[orderId]/items/[itemId]
  };

  const removeItem = async (itemId: string) => {
    // DELETE /api/orders/[orderId]/items/[itemId]
  };

  const clearAll = async () => {
    // DELETE /api/orders/[orderId]/items
  };

  return { items, loading, error, addItem, updateItem, removeItem, clearAll };
}
```

### F. UI Components

#### 1. **OrderItemsTable.tsx**
- Display order items with quantity controls
- Add/Remove buttons per item
- Inline quantity editor with +/- buttons

#### 2. **AddItemModal.tsx**
- Search and select product
- Input quantity
- Show price
- Confirm add

#### 3. **CartSummary.tsx**
- Display subtotal, tax, shipping
- Show total
- Refresh calculations

### G. Error Handling & Validation

```typescript
// Request validation
- Quantity must be positive integer
- ProductId must exist in products table
- Price must be non-negative decimal
- Order must exist and not be in cancelled/delivered state
- Stock availability check for new quantity

// Response handling
- Return detailed error messages
- Validate all calculations before return
- Log changes for audit trail
- Update order updated_at timestamp
```

---

## 6. IMPLEMENTATION ROADMAP

### Phase 1: Core Infrastructure (Priority 1)
1. Create order item CRUD endpoints
2. Implement item add/remove/update service functions
3. Add request validation and error handling
4. Update types for order items

### Phase 2: Business Logic (Priority 1)
1. Implement total recalculation logic
2. Add stock validation
3. Add tax calculation
4. Add shipping calculation

### Phase 3: UI Components (Priority 2)
1. Create order item table component
2. Add item quantity controls
3. Create add item modal
4. Create cart summary component

### Phase 4: Advanced Features (Priority 3)
1. Add cart persistence (optional cart_items table)
2. Bulk operations (add multiple items)
3. Item history/audit trail
4. Order cloning from previous orders

---

## 7. CURRENT GAPS SUMMARY

| Feature | Status | Gap |
|---------|--------|-----|
| View Orders | Implemented | None |
| Get Order Details | Implemented | None |
| Create Order | Partially | Missing API endpoint |
| Add Items to Order | Missing | Needs full implementation |
| Remove Items from Order | Missing | Needs full implementation |
| Update Item Quantity | Missing | Needs full implementation |
| Recalculate Totals | Missing | Needs algorithm implementation |
| Order Status Update | Implemented | None |
| Payment Recording | Implemented | None |
| Shipping Management | Implemented | None |
| Returns & Refunds | Implemented | None |

---

## 8. KEY FILES TO MODIFY/CREATE

### Files to Create
```
/app/api/orders/create/route.ts
/app/api/orders/[orderId]/items/route.ts
/app/api/orders/[orderId]/items/[itemId]/route.ts
/lib/hooks/useOrderItems.ts
/lib/order/item-service.ts
/components/orders/OrderItemsTable.tsx
/components/orders/AddItemModal.tsx
/components/orders/CartSummary.tsx
```

### Files to Modify
```
/types/index.ts                    - Extend OrderItem types
/lib/order/service.ts              - Add item management functions
/app/orders/page.tsx               - Add new item UI
/app/api/orders/route.ts           - Update to support POST for order creation
```

---

## 9. RECOMMENDATIONS

### Best Practices to Follow
1. **Multi-tenancy**: All operations must filter by `user_id`
2. **Audit Trail**: Log all item changes in order_status_history or new table
3. **Data Validation**: Validate on both client and server
4. **Concurrency**: Handle simultaneous item updates safely
5. **Stock Management**: Integrate with inventory system
6. **Error Messages**: Return user-friendly Thai/English messages
7. **Testing**: Create unit tests for calculation functions
8. **Performance**: Add indexes on frequently queried columns

### Future Enhancements
1. Shopping cart functionality with session persistence
2. Wishlist and saved order templates
3. Bulk order creation from templates
4. Order splitting/consolidation
5. Item bundling and promotions
6. Smart stock allocation during order creation

