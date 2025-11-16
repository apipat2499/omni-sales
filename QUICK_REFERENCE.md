# Quick Reference: Menu & Order Implementation Guide

## Key File Locations

### Type Definitions
```
/types/index.ts
  - Order, OrderItem, OrderStatus, OrderChannel
  - Product, ProductCategory
  - Customer, OrderPayment, OrderShipping, etc.
```

### Services
```
/lib/order/service.ts
  - getOrderWithDetails()
  - updateOrderStatus()
  - recordOrderPayment()
  - createShipping()
  - createReturn()
  - approveReturn()
  - processRefund()
  - createFulfillmentTask()
  - updateFulfillmentTask()
  - getPendingOrders()
  - getOrderMetrics()
  - getOrdersByStatus()
```

### Hooks
```
/lib/hooks/useOrders.ts
  - useOrders(options)  // Get list of orders

/lib/hooks/useProducts.ts
  - useProducts(options)  // Get list of products
```

### Pages & Components
```
/app/orders/page.tsx
  - Main orders list page
  - Filters by status, channel, search
  - View order details modal
  - Update order status modal

/app/products/page.tsx
  - Main products list page
  - Add/edit/delete products
  - Filter by category
  - Low stock alerts

/components/orders/
  - OrderDetailsModal.tsx
  - UpdateOrderStatusModal.tsx

/components/products/
  - ProductModal.tsx
  - DeleteProductModal.tsx
```

### API Routes
```
/app/api/orders/
  - route.ts (GET)
  - [orderId]/route.ts (GET, PUT)
  - [orderId]/payments/route.ts
  - [orderId]/shipping/route.ts
  - [orderId]/returns/route.ts
  - [orderId]/refunds/route.ts
  - [orderId]/fulfillment/route.ts
  - [orderId]/status/route.ts
```

---

## What to Implement

### MUST DO (Critical)
- [ ] Add POST /api/orders - Create order with items
- [ ] Add POST /api/orders/[orderId]/items - Add item to order
- [ ] Add PATCH /api/orders/[orderId]/items/[itemId] - Update item quantity
- [ ] Add DELETE /api/orders/[orderId]/items/[itemId] - Remove item
- [ ] Implement addOrderItem() service function
- [ ] Implement updateOrderItem() service function
- [ ] Implement removeOrderItem() service function
- [ ] Implement recalculateOrderTotals() service function

### SHOULD DO (High Priority)
- [ ] Create useOrderItems hook
- [ ] Create OrderItemsTable component with quantity controls
- [ ] Create AddItemModal component
- [ ] Create CartSummary component
- [ ] Add request validation (quantity, price, stock)
- [ ] Extend OrderItem type with ID field
- [ ] Add unit tests for calculation logic

### NICE TO HAVE (Nice to have)
- [ ] Create cart_items table for temporary carts
- [ ] Implement bulk add/update operations
- [ ] Order item history/audit trail
- [ ] Order cloning from previous orders
- [ ] Shopping cart persistence

---

## Current Order Structure (Database)

```
orders (header)
  ├── order_items (line items)
  │   ├── product_id
  │   ├── product_name
  │   ├── quantity
  │   └── unit_price
  ├── order_payments (payment tracking)
  ├── order_shipping (shipping info)
  ├── order_returns (return requests)
  ├── order_status_history (audit trail)
  ├── order_discounts (discounts applied)
  └── fulfillment_tasks (workflow)
```

---

## Flow Diagrams

### Current Order Reading Flow
```
OrdersPage
  ↓
useOrders hook
  ↓
/api/orders (GET)
  ↓
Supabase query
  ↓
Transform & return Order[]
```

### Missing: Order Creation Flow (TO IMPLEMENT)
```
CreateOrderForm/Modal
  ↓
addOrder() service function
  ↓
POST /api/orders
  ↓
Create order header
Create order_items
Calculate totals
  ↓
Return Order with items
```

### Missing: Add Item Flow (TO IMPLEMENT)
```
AddItemModal
  ↓
addOrderItem() service function
  ↓
POST /api/orders/[orderId]/items
  ↓
Create order_item
Recalculate order totals
  ↓
Return updated Order
```

### Missing: Update Quantity Flow (TO IMPLEMENT)
```
OrderItemsTable (quantity input)
  ↓
updateOrderItem() service function
  ↓
PATCH /api/orders/[orderId]/items/[itemId]
  ↓
Update quantity
Recalculate line item & order totals
  ↓
Return updated Order
```

---

## API Request/Response Templates

### Create Order
```bash
POST /api/orders
Content-Type: application/json

{
  "customerId": "cust-123",
  "customerName": "John Doe",
  "items": [
    {
      "productId": "prod-1",
      "productName": "Burger",
      "quantity": 2,
      "price": 50
    }
  ],
  "channel": "online",
  "shippingAddress": "123 Main St",
  "taxRate": 0.07,
  "shippingCost": 10
}
```

### Add Item to Order
```bash
POST /api/orders/order-123/items
Content-Type: application/json

{
  "productId": "prod-2",
  "productName": "Fries",
  "quantity": 1,
  "price": 25
}
```

### Update Item Quantity
```bash
PATCH /api/orders/order-123/items/item-456
Content-Type: application/json

{
  "quantity": 3
}
```

### Remove Item
```bash
DELETE /api/orders/order-123/items/item-456
```

---

## Order Item Calculation Logic

### When Adding/Updating Item:
```
lineItemTotal = quantity × unitPrice
orderSubtotal = SUM(all lineItemTotals)
orderTax = orderSubtotal × taxRate
orderTotal = orderSubtotal + orderTax + shippingCost
```

### Validation Rules:
- quantity > 0
- quantity is integer
- price >= 0
- productId exists
- order status not in ['cancelled', 'delivered']
- stock availability (if checking)

---

## Important Notes

1. **Multi-tenancy**: All queries must filter by `user_id` for merchant isolation
2. **Stock Integration**: Need to check inventory/stock table for availability
3. **Timezone**: Handle timestamps carefully (stored in UTC, display in local)
4. **Currency**: Currently supports USD, but make it configurable
5. **Rounding**: Use proper decimal handling for financial calculations
6. **Audit Trail**: Log all item changes in order_status_history
7. **Localization**: Support Thai (th) and English (en) messages

---

## Testing Checklist

### Unit Tests Needed
- [ ] recalculateOrderTotals() with various inputs
- [ ] validateQuantity() edge cases
- [ ] validatePrice() edge cases
- [ ] Tax calculation with different rates
- [ ] Stock validation logic

### Integration Tests Needed
- [ ] Create order with items
- [ ] Add item to existing order
- [ ] Update quantity (increase/decrease)
- [ ] Remove item from order
- [ ] Clear all items
- [ ] Verify order totals update correctly

### Manual Testing Scenarios
- [ ] Create order with multiple items
- [ ] Add item to order
- [ ] Update quantity multiple times
- [ ] Remove items one by one
- [ ] Verify math is correct at each step
- [ ] Test with different tax rates
- [ ] Test with/without shipping cost

---

## Dependencies to Add (if needed)
```json
{
  "date-fns": "^2.30.0",        // Already present
  "zustand": "^4.4.0",          // State management (optional)
  "zod": "^3.22.0"              // Runtime validation (optional)
}
```

---

## Database Indexes to Consider
```sql
-- For performance optimization
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);
```

