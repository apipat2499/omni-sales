# Order Management Features - Complete Reference

ระบบจัดการออเดอร์แบบครบครัน (Order Items CRUD + History + Validation)

## 📊 สิ่งที่สร้าง

### ✅ Phase 1: Core CRUD Operations
- ✅ Add/Remove/Update order items
- ✅ Automatic total recalculation
- ✅ Quantity control (increment/decrement)

### ✅ Phase 2: Validation & Stock
- ✅ Request validation (Zod schemas)
- ✅ Stock availability checking
- ✅ Enhanced UI with stock warnings
- ✅ Error handling & messages

### ✅ Phase 3: History & Audit Trail
- ✅ Automatic history logging
- ✅ Audit trail for all changes
- ✅ History retrieval APIs
- ✅ UI component for display

---

## 🗂️ Directory Structure

```
app/
  api/
    orders/
      [orderId]/
        items/
          route.ts              ← GET, POST items
          [itemId]/
            route.ts            ← PUT, DELETE item
            history/
              route.ts          ← GET item history
          history/
              route.ts          ← GET all history

lib/
  order/
    service.ts                  ← Core CRUD service
    item-service.ts             ← Item operations
    item-history.ts             ← History tracking
  hooks/
    useOrderItems.ts            ← React hook
  validations/
    order-items.ts              ← Zod schemas

components/
  orders/
    OrderItemsTable.tsx         ← Display items table
    OrderItemsManager.tsx       ← Complete component (recommended)
    AddItemModal.tsx            ← Modal to add items
    CartSummary.tsx             ← Price summary
    OrderItemHistory.tsx        ← History display

supabase/
  migrations/
    add_order_item_history.sql  ← DB migration

Documentation/
  IMPLEMENTATION_GUIDE.md       ← How to use
  ORDER_ITEMS_HISTORY.md        ← History system
  ORDER_MANAGEMENT_FEATURES.md  ← This file
```

---

## 🚀 Quick Start

### 1. Simplest Usage (Recommended)
```typescript
import OrderItemsManager from '@/components/orders/OrderItemsManager';

export default function OrderPage() {
  return (
    <OrderItemsManager
      orderId="order-123"
      tax={50}
      shipping={100}
    />
  );
}
```

That's it! Everything included:
- Add/remove/update items
- Stock validation
- Price summary
- Error handling

---

## 📋 Complete Feature List

### 1. CRUD Operations
| Feature | Implemented | Location |
|---------|-------------|----------|
| Add item | ✅ | API, Hook, UI |
| Update quantity | ✅ | API, Hook, UI |
| Update price | ✅ | API, Hook, UI |
| Delete item | ✅ | API, Hook, UI |
| Auto recalculate total | ✅ | API |
| Bulk add items | ✅ | Service |

### 2. Validation
| Feature | Implemented | Location |
|---------|-------------|----------|
| Product ID validation | ✅ | Zod schema |
| Quantity validation | ✅ | Zod + UI |
| Price validation | ✅ | Zod schema |
| Stock checking | ✅ | API + Modal |
| Product exists check | ✅ | API |

### 3. UI Features
| Feature | Implemented | Location |
|---------|-------------|----------|
| Item table display | ✅ | OrderItemsTable |
| +/- quantity buttons | ✅ | OrderItemsTable |
| Delete button | ✅ | OrderItemsTable |
| Add item modal | ✅ | AddItemModal |
| Product search | ✅ | AddItemModal |
| Stock warning | ✅ | AddItemModal |
| Price summary | ✅ | CartSummary |
| Error messages | ✅ | All components |
| Dark mode support | ✅ | All components |
| Thai language | ✅ | All components |

### 4. History & Audit
| Feature | Implemented | Location |
|---------|-------------|----------|
| Log added items | ✅ | item-history |
| Log quantity changes | ✅ | item-history |
| Log price changes | ✅ | item-history |
| Log deleted items | ✅ | item-history |
| Retrieve history | ✅ | API + Service |
| History UI display | ✅ | OrderItemHistory |
| Change statistics | ✅ | Service |

---

## 🔌 API Reference

### Items CRUD

```
GET    /api/orders/[orderId]/items
POST   /api/orders/[orderId]/items
PUT    /api/orders/[orderId]/items/[itemId]
DELETE /api/orders/[orderId]/items/[itemId]
```

### History

```
GET    /api/orders/[orderId]/items/history
GET    /api/orders/[orderId]/items/[itemId]/history
```

---

## 🪝 React Hook

```typescript
const {
  items,              // OrderItem[]
  loading,           // boolean
  error,             // string | null
  addItem,           // (pid, name, qty, price) => Promise<bool>
  updateItemQuantity,// (itemId, qty) => Promise<bool>
  updateItem,        // (itemId, qty?, price?) => Promise<bool>
  deleteItem,        // (itemId) => Promise<bool>
  fetchItems,        // (orderId) => Promise<void>
  refresh,           // (orderId?) => Promise<void>
} = useOrderItems(orderId);
```

---

## 💾 Database Schema

### order_items (existing)
```sql
id, order_id, product_id, product_name, quantity, price, created_at
```

### order_item_history (new)
```sql
id, order_id, item_id, action, product_id, product_name,
old_quantity, new_quantity, old_price, new_price,
changed_by, notes, changed_at, created_at
```

---

## 📦 Type Definitions

### OrderItem
```typescript
interface OrderItem {
  id?: string;           // unique identifier
  productId: string;     // product reference
  productName: string;   // product display name
  quantity: number;      // item count
  price: number;         // unit price
  totalPrice?: number;   // calculated total (qty * price)
}
```

### OrderItemHistory
```typescript
interface OrderItemHistory {
  id: string;
  orderId: string;
  itemId: string;
  action: 'added' | 'updated' | 'deleted' | 'quantity_changed' | 'price_changed';
  productId: string;
  productName: string;
  oldQuantity?: number;
  newQuantity?: number;
  oldPrice?: number;
  newPrice?: number;
  changedAt: Date;
  changedBy?: string;
  notes?: string;
}
```

---

## 🎨 Components Used

### 1. OrderItemsManager (Most Complete)
```typescript
<OrderItemsManager
  orderId={string}
  tax={number}
  shipping={number}
  discount={number}
/>
```
✅ Recommended - includes everything

### 2. OrderItemsTable
```typescript
<OrderItemsTable
  items={OrderItem[]}
  loading={boolean}
  onAddClick={() => void}
  onQuantityChange={(id, qty) => Promise<void>}
  onDelete={(id) => Promise<void>}
/>
```

### 3. AddItemModal
```typescript
<AddItemModal
  isOpen={boolean}
  onClose={() => void}
  onAdd={(pid, name, qty, price) => Promise<bool>}
  loading={boolean}
/>
```

### 4. CartSummary
```typescript
<CartSummary
  items={OrderItem[]}
  tax={number}
  shipping={number}
  discount={number}
/>
```

### 5. OrderItemHistory
```typescript
<OrderItemHistory
  orderId={string}
  itemId={string}  // optional
/>
```

---

## 🔐 Validation

### Request Body Validation
- **addOrderItem schema**:
  - `productId`: UUID
  - `productName`: string (1-255 chars)
  - `quantity`: integer > 0, max 10000
  - `price`: number > 0, max 999999.99

- **updateOrderItem schema**:
  - `quantity`?: integer > 0, max 10000
  - `price`?: number > 0, max 999999.99
  - At least one field required

### Stock Validation
- ✅ Check product exists
- ✅ Check stock availability
- ✅ Return stock info on error

---

## ⚠️ Error Handling

### API Errors
```
400 Bad Request
- Validation failed
- Missing required fields
- Insufficient stock

404 Not Found
- Product not found
- Item not found in order

500 Server Error
- Database error
- Unexpected error
```

### Hook Errors
```typescript
if (error) {
  // Display error message to user
  // Specific errors: stock, product not found, validation
}
```

### UI Warnings
- Stock availability alerts
- Quantity limit enforcement
- Form validation feedback

---

## 📈 Performance

### Optimization
- ✅ Indexed database queries
- ✅ Lazy state updates
- ✅ Memoized callbacks
- ✅ Efficient API calls

### Indexes
```sql
idx_order_items_order_id       -- find by order
idx_order_item_history_order_id -- find by order
idx_order_item_history_item_id  -- find by item
idx_order_item_history_changed_at -- sort by time
```

---

## 🧪 Testing Checklist

### Functional
- [ ] Add item to order
- [ ] Update item quantity
- [ ] Delete item
- [ ] Verify total recalculates
- [ ] Check stock validation works

### UI/UX
- [ ] Form validation feedback
- [ ] Error messages display
- [ ] Stock warnings show
- [ ] Dark mode looks good
- [ ] Responsive on mobile

### History
- [ ] History records on add
- [ ] History records on update
- [ ] History records on delete
- [ ] History displays correctly
- [ ] Can retrieve by order/item

### Edge Cases
- [ ] Insufficient stock
- [ ] Invalid product
- [ ] Negative/zero quantity
- [ ] Non-existent item
- [ ] Concurrent updates

---

## 🚀 Future Enhancements

### Roadmap
- [ ] Bulk operations
- [ ] Cart persistence
- [ ] Item notes/special instructions
- [ ] Item images
- [ ] Undo/Redo functionality
- [ ] Advanced filters
- [ ] Export to PDF/CSV
- [ ] Real-time updates
- [ ] Item recommendations
- [ ] Discount codes

### Phase 4+
- [ ] Order cloning
- [ ] Recurring orders
- [ ] Order templates
- [ ] Smart inventory
- [ ] Batch operations

---

## 📚 Documentation Files

1. **IMPLEMENTATION_GUIDE.md** - How to use the features
2. **ORDER_ITEMS_HISTORY.md** - History system guide
3. **ORDER_MANAGEMENT_FEATURES.md** - This file
4. **API Documentation** - In code comments

---

## 🔗 Related Files

### Core Files (Must Read)
- `/types/index.ts` - OrderItem type
- `/lib/order/item-service.ts` - Service logic
- `/lib/hooks/useOrderItems.ts` - React hook
- `/components/orders/OrderItemsManager.tsx` - Main component

### API Endpoints
- `/app/api/orders/[orderId]/items/route.ts` - CRUD
- `/app/api/orders/[orderId]/items/[itemId]/route.ts` - Detail
- `/app/api/orders/[orderId]/items/history/route.ts` - History

### UI Components
- All in `/components/orders/`
- Responsive design
- Dark mode support
- Thai language

---

## 💡 Tips & Tricks

### 1. Auto Recalculation
Every item operation automatically recalculates the order total:
- Subtotal = sum of (quantity × price) for all items
- Total = subtotal + tax + shipping - discount

### 2. Stock Checking
Stock is checked at:
- API level (prevents invalid data)
- Modal level (UI feedback)
- Hook level (error reporting)

### 3. History Tracking
History is non-blocking - if recording fails, the main operation succeeds.
Good for audit without impacting user experience.

### 4. Error Messages
- API returns specific error messages
- Hook processes them into Thai messages
- UI displays them prominently

### 5. Component Composition
Combine components as needed:
```typescript
// Simple: just items table
<OrderItemsTable {...props} />

// Complete: everything included
<OrderItemsManager orderId="id" />

// Custom: pick what you need
<>
  <OrderItemsTable {...props} />
  <OrderItemHistory orderId="id" />
</>
```

---

## 🎯 Common Use Cases

### Use Case 1: Edit Existing Order
```typescript
<OrderItemsManager orderId={orderId} />
```

### Use Case 2: Create New Order
```typescript
const [orderId, setOrderId] = useState(null);

if (!orderId) {
  return <CreateOrderButton onCreated={setOrderId} />;
}

return <OrderItemsManager orderId={orderId} />;
```

### Use Case 3: Review History
```typescript
<OrderItemHistory orderId={orderId} />
```

### Use Case 4: Custom Layout
```typescript
<div className="grid grid-cols-3 gap-6">
  <OrderItemsTable {...props} />
  <CartSummary items={items} />
  <OrderItemHistory orderId={orderId} />
</div>
```

---

## 📞 Support & Troubleshooting

See individual documentation files for:
- **IMPLEMENTATION_GUIDE.md** - Setup and usage
- **ORDER_ITEMS_HISTORY.md** - History system
- Code comments for implementation details

---

## 📝 Summary

This system provides:
- ✅ Complete order item management
- ✅ Stock validation & checking
- ✅ Automatic total calculation
- ✅ Full audit trail
- ✅ Professional UI components
- ✅ Thai language support
- ✅ Dark mode support
- ✅ Comprehensive error handling
- ✅ Production-ready code

**Start with `<OrderItemsManager />` - it includes everything!**
