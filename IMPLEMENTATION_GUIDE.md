# Order Items Management - Implementation Guide

ไฟล์นี้อธิบายวิธีใช้ระบบจัดการรายการออเดอร์ที่เพิ่มเติมใหม่ (เพิ่ม ลด ลบ อัพเดต quantity)

## 📋 ภาพรวม

ระบบแบ่งออกเป็น 3 ส่วนหลัก:
1. **API Endpoints** - Backend API สำหรับ CRUD operations
2. **React Hooks** - `useOrderItems` hook สำหรับจัดการ state
3. **UI Components** - Components พร้อมใช้งาน

---

## 🔌 API Endpoints

### GET `/api/orders/[orderId]/items`
ดึงรายการทั้งหมดในออเดอร์

```bash
curl GET /api/orders/{orderId}/items
```

**Response:**
```json
[
  {
    "id": "item-id",
    "orderId": "order-id",
    "productId": "product-id",
    "productName": "ชื่อสินค้า",
    "quantity": 2,
    "price": 150,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### POST `/api/orders/[orderId]/items`
เพิ่มรายการใหม่ในออเดอร์ (จะ auto recalculate total)

```bash
curl -X POST /api/orders/{orderId}/items \
  -H "Content-Type: application/json" \
  -d {
    "productId": "product-123",
    "productName": "ชื่อสินค้า",
    "quantity": 2,
    "price": 150
  }
```

**Response:** ข้อมูล item ที่เพิ่มใหม่

### PUT `/api/orders/[orderId]/items/[itemId]`
อัพเดต quantity หรือ price ของ item (จะ auto recalculate total)

```bash
curl -X PUT /api/orders/{orderId}/items/{itemId} \
  -H "Content-Type: application/json" \
  -d {
    "quantity": 3,
    "price": 150  # optional
  }
```

### DELETE `/api/orders/[orderId]/items/[itemId]`
ลบรายการ (จะ auto recalculate total)

```bash
curl -X DELETE /api/orders/{orderId}/items/{itemId}
```

---

## 🪝 React Hook: useOrderItems

### พื้นฐาน

```typescript
import { useOrderItems } from '@/lib/hooks/useOrderItems';

export default function MyComponent() {
  const {
    items,           // OrderItem[]
    loading,         // boolean
    error,           // string | null
    addItem,         // (productId, productName, quantity, price) => Promise<boolean>
    updateItemQuantity, // (itemId, quantity) => Promise<boolean>
    updateItem,      // (itemId, quantity?, price?) => Promise<boolean>
    deleteItem,      // (itemId) => Promise<boolean>
    fetchItems,      // (orderId) => Promise<void>
    refresh,         // (orderId?) => Promise<void>
  } = useOrderItems('order-id-123');

  // ... use functions
}
```

### ตัวอย่าง: ใช้ Hook ทั้งหมด

```typescript
'use client';

import { useOrderItems } from '@/lib/hooks/useOrderItems';

export default function OrderEditor({ orderId }) {
  const {
    items,
    loading,
    error,
    addItem,
    updateItemQuantity,
    deleteItem,
    fetchItems,
  } = useOrderItems(orderId);

  // โหลด items เมื่อ component mount
  useEffect(() => {
    fetchItems(orderId);
  }, [orderId]);

  // เพิ่ม item
  const handleAdd = async () => {
    const success = await addItem(
      'product-123',
      'ชื่อสินค้า',
      2,
      150
    );
    if (success) {
      console.log('เพิ่มรายการเสร็จ');
    }
  };

  // อัพเดต quantity
  const handleUpdateQuantity = async (itemId, newQty) => {
    await updateItemQuantity(itemId, newQty);
  };

  // ลบ item
  const handleDelete = async (itemId) => {
    await deleteItem(itemId);
  };

  if (loading) return <div>กำลังโหลด...</div>;
  if (error) return <div>เกิดข้อผิดพลาด: {error}</div>;

  return (
    <div>
      <h2>รายการ ({items.length})</h2>
      {items.map((item) => (
        <div key={item.id}>
          <p>{item.productName}</p>
          <input
            type="number"
            value={item.quantity}
            onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value))}
          />
          <button onClick={() => handleDelete(item.id)}>ลบ</button>
        </div>
      ))}
      <button onClick={handleAdd}>เพิ่มรายการ</button>
    </div>
  );
}
```

---

## 🎨 UI Components

### 1. OrderItemsManager (แนะนำให้ใช้)
**Component ที่สมบูรณ์ที่สุด สามารถใช้งานได้เลย**

```typescript
import OrderItemsManager from '@/components/orders/OrderItemsManager';

export default function OrderPage() {
  return (
    <OrderItemsManager
      orderId="order-123"
      tax={50}           // optional
      shipping={100}     // optional
      discount={0}       // optional
    />
  );
}
```

**มีปัญหา:**
- OrderItemsTable - แสดงรายการและควบคุม quantity
- AddItemModal - Modal เลือกสินค้าจาก catalog
- CartSummary - สรุปราคา, ภาษี, ค่าส่ง

---

### 2. OrderItemsTable
**แสดงรายการเป็น Table พร้อมปุ่ม +/- quantity และลบ**

```typescript
import OrderItemsTable from '@/components/orders/OrderItemsTable';

export default function MyComponent() {
  const [items, setItems] = useState([]);

  return (
    <OrderItemsTable
      items={items}
      loading={false}
      onAddClick={() => {/* open modal */}}
      onQuantityChange={async (itemId, newQty) => {
        // update item quantity
      }}
      onDelete={async (itemId) => {
        // delete item
      }}
    />
  );
}
```

---

### 3. AddItemModal
**Modal เลือกสินค้าและเพิ่มลงในออเดอร์**

```typescript
import AddItemModal from '@/components/orders/AddItemModal';

export default function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>เพิ่มรายการ</button>

      <AddItemModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onAdd={async (productId, productName, quantity, price) => {
          // add item to order
          return true;
        }}
        loading={false}
      />
    </>
  );
}
```

---

### 4. CartSummary
**แสดงสรุปราคา ภาษี ค่าส่ง และลด**

```typescript
import CartSummary from '@/components/orders/CartSummary';

export default function MyComponent() {
  return (
    <CartSummary
      items={orderItems}
      tax={50}
      shipping={100}
      discount={0}
    />
  );
}
```

---

## 💻 Service Functions (Optional)

หากต้องการใช้ backend service functions โดยตรง (ไม่ผ่าน API):

```typescript
import {
  addOrderItem,
  updateOrderItem,
  deleteOrderItem,
  getOrderItems,
  recalculateOrderTotal,
  bulkAddOrderItems,
} from '@/lib/order/item-service';

// เพิ่ม item
const newItem = await addOrderItem('order-123', {
  productId: 'product-456',
  productName: 'ชื่อสินค้า',
  quantity: 2,
  price: 150,
});

// อัพเดต item
const updated = await updateOrderItem('order-123', 'item-456', {
  quantity: 3,
});

// ลบ item
const deleted = await deleteOrderItem('order-123', 'item-456');

// ดึง items ทั้งหมด
const items = await getOrderItems('order-123');

// Recalculate totals
await recalculateOrderTotal('order-123');
```

---

## 📝 Type Definitions

```typescript
// OrderItem (ใน types/index.ts)
export interface OrderItem {
  id?: string;              // ใหม่
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  totalPrice?: number;      // ใหม่ (quantity * price)
}

// Order interface ยังเหมือนเดิม
export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];       // มี id แล้ว
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  // ... other fields
}
```

---

## 🔄 Auto Recalculation

ระบบจะ **auto recalculate** order total ทุกครั้งที่:
- เพิ่ม item ใหม่
- เปลี่ยน quantity
- เปลี่ยน price
- ลบ item

```typescript
// Example: เมื่อ add item
POST /api/orders/order-123/items
{
  "productId": "prod-456",
  "productName": "สินค้า A",
  "quantity": 2,
  "price": 100
}

// Order ของเดิม:
// subtotal: 500
// tax: 50
// shipping: 100
// total: 650

// หลังเพิ่ม item:
// subtotal: 700 (500 + 200)
// tax: 50
// shipping: 100
// total: 850 ✓ auto recalculated
```

---

## ✅ Validation & Error Handling

### API Validation
- ✓ ตรวจสอบ orderId และ itemId
- ✓ ตรวจสอบ quantity > 0
- ✓ ตรวจสอบ item belongs to order
- ✓ HTTP error codes (400, 404, 500)

### Hook Error Handling
```typescript
const { items, error, addItem } = useOrderItems('order-123');

if (error) {
  console.error('Error:', error);
  // แสดง error message ให้ user
}

const success = await addItem(...);
if (!success) {
  // Handle error
}
```

---

## 🎯 Common Use Cases

### Use Case 1: Edit Order Items
```typescript
'use client';

import { useState, useEffect } from 'react';
import OrderItemsManager from '@/components/orders/OrderItemsManager';

export default function EditOrderPage({ orderId }) {
  return (
    <div className="p-6">
      <h1>แก้ไขออเดอร์</h1>
      <OrderItemsManager orderId={orderId} />
    </div>
  );
}
```

### Use Case 2: Create New Order With Items
```typescript
'use client';

import { useState } from 'react';
import { useOrderItems } from '@/lib/hooks/useOrderItems';
import OrderItemsManager from '@/components/orders/OrderItemsManager';

export default function CreateOrderPage() {
  const [orderId, setOrderId] = useState<string | null>(null);

  const handleCreateOrder = async () => {
    // Create new order first
    const res = await fetch('/api/orders', { method: 'POST' });
    const newOrder = await res.json();
    setOrderId(newOrder.id);
  };

  if (!orderId) {
    return <button onClick={handleCreateOrder}>สร้างออเดอร์ใหม่</button>;
  }

  return <OrderItemsManager orderId={orderId} />;
}
```

### Use Case 3: Quick Item Quantity Update
```typescript
const { updateItemQuantity } = useOrderItems(orderId);

// User types in input
const handleQtyChange = async (e, itemId) => {
  const newQty = parseInt(e.target.value);
  await updateItemQuantity(itemId, newQty);
};
```

---

## 🧪 Testing Checklist

- [ ] Add item to order
- [ ] Update item quantity (increase)
- [ ] Update item quantity (decrease to 1)
- [ ] Try update quantity to 0 or negative (should fail)
- [ ] Delete item
- [ ] Verify order total recalculates automatically
- [ ] Verify order subtotal = sum of all items
- [ ] Add multiple items
- [ ] Delete all items (order should have 0 items)
- [ ] Test error handling (invalid orderId, invalid itemId)
- [ ] Test in dark mode
- [ ] Test responsive design (mobile, tablet, desktop)

---

## 🚀 Future Enhancements

- [ ] Bulk operations (add/delete multiple items at once)
- [ ] Item history/audit trail
- [ ] Cart persistence (localStorage)
- [ ] Stock availability warnings
- [ ] Item notes/special instructions
- [ ] Item images preview
- [ ] Undo/Redo operations
- [ ] Item duplication
- [ ] Preset order templates

---

## 📞 Troubleshooting

### Items not showing
- ตรวจสอบว่า orderId ถูกต้อง
- ตรวจสอบ browser console สำหรับ error messages
- ตรวจสอบ network tab ใน DevTools

### Total not recalculating
- ตรวจสอบว่า API เรียกสำเร็จ
- ตรวจสอบ `updated_at` field ใน database

### Modal ไม่แสดง products
- ตรวจสอบ `/api/products` endpoint
- ตรวจสอบ product data structure

---

## 📚 Related Files

```
app/
  api/
    orders/
      [orderId]/
        items/
          route.ts         # GET, POST
          [itemId]/
            route.ts       # PUT, DELETE

lib/
  order/
    item-service.ts       # Service functions
  hooks/
    useOrderItems.ts      # React hook

components/
  orders/
    OrderItemsTable.tsx   # Items table
    AddItemModal.tsx      # Add item modal
    CartSummary.tsx       # Order summary
    OrderItemsManager.tsx # Complete component

types/
  index.ts               # OrderItem type
```

---

## ✨ Notes

- ทุก operation ทำ auto recalculate order total
- Error handling ครอบคลุมที่ API และ Hook level
- UI Components พร้อมใช้งาน ไม่ต้อง customize
- Support dark mode ด้วย
- เป็น Thai language ทั้งหมด
