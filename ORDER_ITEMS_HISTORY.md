# Order Items History & Audit Logging

ระบบจดบันทึกประวัติการเปลี่ยนแปลงทั้งหมดสำหรับ order items

## ภาพรวม

- ✅ บันทึกอัตโนมัติทุกครั้งที่มีการเปลี่ยนแปลง
- ✅ ดึงประวัติตามออเดอร์หรือรายการ
- ✅ แสดงผล UI component พร้อมใช้
- ✅ สนับสนุน migrations

## การติดตั้ง

### 1. สร้าง Table (ถ้ายังไม่มี)

```sql
CREATE TABLE IF NOT EXISTS order_item_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  product_id UUID REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  old_quantity INTEGER,
  new_quantity INTEGER,
  old_price DECIMAL(10, 2),
  new_price DECIMAL(10, 2),
  changed_by VARCHAR(255),
  notes TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_item_history_order_id ON order_item_history(order_id);
CREATE INDEX idx_order_item_history_item_id ON order_item_history(item_id);
CREATE INDEX idx_order_item_history_changed_at ON order_item_history(changed_at DESC);
```

หรือใช้ migration file:
```bash
supabase migration up
```

### 2. ใช้ใน Code

History จะถูกบันทึกอัตโนมัติเมื่อ:
- เพิ่ม item: `addOrderItem()`
- แก้ไข item: `updateOrderItem()`
- ลบ item: `deleteOrderItem()`

## API Endpoints

### GET `/api/orders/[orderId]/items/history`
ดึงประวัติทั้งหมดสำหรับออเดอร์

```bash
curl GET /api/orders/order-123/items/history
```

**Response:**
```json
[
  {
    "id": "history-id",
    "orderId": "order-123",
    "itemId": "item-123",
    "action": "added",
    "productId": "product-456",
    "productName": "ชื่อสินค้า",
    "newQuantity": 2,
    "newPrice": 150,
    "changedAt": "2024-01-01T00:00:00Z",
    "changedBy": "user@example.com"
  }
]
```

### GET `/api/orders/[orderId]/items/[itemId]/history`
ดึงประวัติเฉพาะรายการ

```bash
curl GET /api/orders/order-123/items/item-123/history
```

## Service Functions

### recordItemHistory()
บันทึกประวัติการเปลี่ยนแปลง

```typescript
import { recordItemHistory } from '@/lib/order/item-history';

await recordItemHistory(orderId, itemId, 'quantity_changed', {
  productId: 'prod-123',
  productName: 'ชื่อสินค้า',
  oldQuantity: 2,
  newQuantity: 5,
  changedBy: 'admin@example.com',
  notes: 'ปรับจำนวนตามคำขอลูกค้า'
});
```

### getItemHistory()
ดึงประวัติรายการ

```typescript
import { getItemHistory } from '@/lib/order/item-history';

// ประวัติทั้งหมดของออเดอร์
const history = await getItemHistory('order-123');

// ประวัติเฉพาะรายการ
const itemHistory = await getItemHistory('order-123', 'item-123');
```

### getItemChangeSummary()
สรุปจำนวนการเปลี่ยนแปลง

```typescript
import { getItemChangeSummary } from '@/lib/order/item-history';

const summary = await getItemChangeSummary('order-123', 'item-123');
// {
//   totalAdded: 10,      // จำนวนที่เพิ่มขึ้นทั้งหมด
//   totalRemoved: 5,     // จำนวนที่ลดลงทั้งหมด
//   lastModified: Date,
//   changeCount: 3       // จำนวนครั้งที่แก้ไข
// }
```

## UI Components

### OrderItemHistory
แสดงประวัติการเปลี่ยนแปลง

```typescript
import OrderItemHistory from '@/components/orders/OrderItemHistory';

export default function OrderPage() {
  return (
    <>
      {/* ประวัติทั้งหมดของออเดอร์ */}
      <OrderItemHistory orderId="order-123" />

      {/* ประวัติเฉพาะรายการ */}
      <OrderItemHistory
        orderId="order-123"
        itemId="item-123"
      />
    </>
  );
}
```

**Props:**
- `orderId` (string) - ID ของออเดอร์ (required)
- `itemId` (string) - ID ของรายการ (optional, ถ้าไม่ระบุจะแสดงทั้งหมด)

## Action Types

```typescript
type Action =
  | 'added'              // เพิ่มรายการใหม่
  | 'deleted'            // ลบรายการ
  | 'quantity_changed'   // เปลี่ยนจำนวน
  | 'price_changed'      // เปลี่ยนราคา
  | 'updated'            // แก้ไขทั่วไป
```

## ตัวอย่างการใช้งาน

### Example 1: แสดงประวัติในออเดอร์
```typescript
'use client';

import OrderItemHistory from '@/components/orders/OrderItemHistory';

export default function OrderDetailsPage({ orderId }) {
  return (
    <div className="p-6 space-y-6">
      <h1>รายละเอียดออเดอร์</h1>

      {/* ประวัติการเปลี่ยนแปลง */}
      <OrderItemHistory orderId={orderId} />
    </div>
  );
}
```

### Example 2: ดึงและแสดงผลแบบ Custom
```typescript
import { getItemHistory } from '@/lib/order/item-history';

export default async function HistoryReport({ orderId }) {
  const history = await getItemHistory(orderId);

  return (
    <div>
      {history.map((record) => (
        <div key={record.id}>
          <p>{record.productName} - {record.action}</p>
          <p>{record.oldQuantity} → {record.newQuantity}</p>
          <p>{new Date(record.changedAt).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
```

### Example 3: บันทึกด้วยข้อมูลเพิ่มเติม
```typescript
import { recordItemHistory } from '@/lib/order/item-history';

const handleManagerAdjustment = async (orderId, itemId) => {
  await recordItemHistory(
    orderId,
    itemId,
    'quantity_changed',
    {
      productId: 'product-123',
      productName: 'ชื่อสินค้า',
      oldQuantity: 5,
      newQuantity: 10,
      changedBy: 'manager@example.com',
      notes: 'ปรับเพิ่มตามสินค้าที่เข้ามาใหม่'
    }
  );
};
```

## Error Handling

ระบบจะไม่หยุด main operation ถ้า history recording ล้มเหลว:

```typescript
// ถ้า order_item_history table ไม่มี → บันทึกลง console และดำเนินการต่อ
// ถ้า insert error → บันทึกลง console และดำเนินการต่อ
// User operation จะสำเร็จเสมอ
```

## Performance

### Indexes
- `order_id` - ค้นหาโดยออเดอร์
- `item_id` - ค้นหาโดยรายการ
- `changed_at` - เรียงลำดับตามเวลา

### Query Optimization
```typescript
// ดี: ค้นหาเฉพาะรายการที่ต้องการ
const history = await getItemHistory('order-123', 'item-123');

// ขอให้หลีกเลี่ยง: ดึงทั้งหมดแล้ว filter
const allHistory = await getItemHistory('order-123');
```

## Future Enhancements

- [ ] ลบข้อมูลประวัติตามอายุ (retention policy)
- [ ] การส่งออกรายงาน (CSV, PDF)
- [ ] Analytics & trends
- [ ] Real-time notifications
- [ ] Bulk operations history
- [ ] Undo/Redo functionality

## Troubleshooting

### ประวัติไม่ถูกบันทึก
1. ตรวจสอบว่า `order_item_history` table มีอยู่
2. ตรวจสอบ browser console สำหรับข้อมูล error
3. ตรวจสอบ Database logs

### API ส่งคืน empty
1. ตรวจสอบ orderId ถูกต้องหรือไม่
2. ตรวจสอบว่ามีประวัติอยู่จริง
3. ตรวจสอบ RLS policies

## Schema

```sql
-- order_item_history
| Column       | Type         | Description           |
|--------------|------|----------------------------------------|
| id           | UUID   | Primary key           |
| order_id     | UUID   | FK to orders          |
| item_id      | UUID   | FK to order_items     |
| action       | varchar(50) | Type of change       |
| product_id   | UUID   | Product reference     |
| product_name | varchar(255) | Product name snapshot |
| old_quantity | integer | Previous quantity    |
| new_quantity | integer | New quantity         |
| old_price    | decimal | Previous price       |
| new_price    | decimal | New price            |
| changed_by   | varchar(255) | User who made change |
| notes        | text   | Additional notes     |
| changed_at   | timestamp | When change occurred |
| created_at   | timestamp | Record creation time |
```

## สรุป

ระบบ history ให้:
- ✅ Audit trail สมบูรณ์
- ✅ ติดตามการเปลี่ยนแปลงทั้งหมด
- ✅ ไม่ส่งผลกระทบต่อ main operations
- ✅ UI components พร้อมใช้
- ✅ Query functions พร้อมใช้
