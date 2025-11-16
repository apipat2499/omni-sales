# WebSocket Event Types Reference

## Quick Reference Table

| Event Type | Namespace | Payload | Roles | Description |
|------------|-----------|---------|-------|-------------|
| `order:created` | orders | OrderCreatedPayload | admin, manager, staff | New order placed |
| `order:updated` | orders | OrderUpdatedPayload | admin, manager, staff | Order modified |
| `order:status_changed` | orders | OrderStatusChangedPayload | admin, manager, staff, customer | Status transition |
| `order:deleted` | orders | `{ orderId }` | admin, manager | Order cancelled |
| `customer:activity` | customers | CustomerActivityPayload | admin, manager, staff | Customer action |
| `customer:viewing_product` | customers | CustomerViewingProductPayload | admin, manager | Product view |
| `customer:added_to_cart` | customers | CartPayload | admin, manager | Cart update |
| `customer:online` | customers | CustomerOnlineStatusPayload | admin, manager, staff | Customer connected |
| `customer:offline` | customers | CustomerOnlineStatusPayload | admin, manager, staff | Customer disconnected |
| `inventory:updated` | inventory | InventoryUpdatedPayload | admin, manager, staff | Stock changed |
| `inventory:low_stock` | inventory | InventoryAlertPayload | admin, manager, staff | Low stock alert |
| `inventory:out_of_stock` | inventory | `{ productId, productName, sku }` | admin, manager, staff | No stock |
| `inventory:restocked` | inventory | RestockedPayload | admin, manager, staff | Stock added |
| `product:price_changed` | products | ProductPriceChangedPayload | all | Price updated |
| `product:created` | products | ProductCreatedPayload | admin, manager, staff | New product |
| `product:updated` | products | ProductUpdatedPayload | admin, manager, staff | Product modified |
| `product:deleted` | products | `{ productId }` | admin, manager | Product removed |
| `payment:received` | payments | PaymentReceivedPayload | admin, manager, customer* | Payment completed |
| `payment:failed` | payments | PaymentFailedPayload | admin, manager, customer* | Payment failed |
| `payment:refunded` | payments | PaymentRefundedPayload | admin, manager, customer* | Refund issued |
| `system:notification` | system | SystemNotificationPayload | targetRoles | General notice |
| `system:alert` | system | SystemAlertPayload | targetRoles | Important alert |
| `system:maintenance` | system | MaintenancePayload | all | Maintenance notice |

*customer can only see their own events

## Detailed Event Specifications

### Order Events

#### order:created
```typescript
{
  type: 'order:created',
  namespace: 'orders',
  data: {
    orderId: string,
    customerId: string,
    customerName: string,
    total: number,
    status: OrderStatus,
    channel: string
  },
  timestamp: number
}
```

**Example:**
```json
{
  "type": "order:created",
  "namespace": "orders",
  "data": {
    "orderId": "ORD-001",
    "customerId": "CUST-123",
    "customerName": "John Doe",
    "total": 1500,
    "status": "pending",
    "channel": "online"
  },
  "timestamp": 1700000000000
}
```

#### order:status_changed
```typescript
{
  type: 'order:status_changed',
  namespace: 'orders',
  data: {
    orderId: string,
    customerId: string,
    customerName: string,
    oldStatus: OrderStatus,
    newStatus: OrderStatus,
    timestamp: number
  },
  timestamp: number
}
```

**Example:**
```json
{
  "type": "order:status_changed",
  "namespace": "orders",
  "data": {
    "orderId": "ORD-001",
    "customerId": "CUST-123",
    "customerName": "John Doe",
    "oldStatus": "pending",
    "newStatus": "processing",
    "timestamp": 1700000100000
  },
  "timestamp": 1700000100000
}
```

---

### Customer Events

#### customer:activity
```typescript
{
  type: 'customer:activity',
  namespace: 'customers',
  data: {
    customerId: string,
    customerName?: string,
    action: 'viewing' | 'cart_add' | 'cart_remove' | 'checkout_start' | 'checkout_complete',
    productId?: string,
    productName?: string,
    timestamp: number
  },
  timestamp: number
}
```

**Example:**
```json
{
  "type": "customer:activity",
  "namespace": "customers",
  "data": {
    "customerId": "CUST-123",
    "customerName": "John Doe",
    "action": "cart_add",
    "productId": "PROD-456",
    "productName": "Wireless Headphones",
    "timestamp": 1700000200000
  },
  "timestamp": 1700000200000
}
```

#### customer:online / customer:offline
```typescript
{
  type: 'customer:online' | 'customer:offline',
  namespace: 'customers',
  data: {
    customerId: string,
    isOnline: boolean,
    lastSeen: number
  },
  timestamp: number
}
```

---

### Inventory Events

#### inventory:updated
```typescript
{
  type: 'inventory:updated',
  namespace: 'inventory',
  data: {
    productId: string,
    productName: string,
    sku: string,
    oldStock: number,
    newStock: number,
    difference: number,
    reason?: 'sale' | 'restock' | 'adjustment' | 'return'
  },
  timestamp: number
}
```

**Example:**
```json
{
  "type": "inventory:updated",
  "namespace": "inventory",
  "data": {
    "productId": "PROD-456",
    "productName": "Wireless Headphones",
    "sku": "WH-001",
    "oldStock": 50,
    "newStock": 49,
    "difference": -1,
    "reason": "sale"
  },
  "timestamp": 1700000300000
}
```

#### inventory:low_stock
```typescript
{
  type: 'inventory:low_stock',
  namespace: 'inventory',
  data: {
    productId: string,
    productName: string,
    sku: string,
    currentStock: number,
    threshold: number,
    severity: 'low' | 'critical'
  },
  timestamp: number
}
```

**Example:**
```json
{
  "type": "inventory:low_stock",
  "namespace": "inventory",
  "data": {
    "productId": "PROD-456",
    "productName": "Wireless Headphones",
    "sku": "WH-001",
    "currentStock": 5,
    "threshold": 10,
    "severity": "critical"
  },
  "timestamp": 1700000400000
}
```

---

### Product Events

#### product:price_changed
```typescript
{
  type: 'product:price_changed',
  namespace: 'products',
  data: {
    productId: string,
    productName: string,
    sku: string,
    oldPrice: number,
    newPrice: number,
    changePercentage: number
  },
  timestamp: number
}
```

**Example:**
```json
{
  "type": "product:price_changed",
  "namespace": "products",
  "data": {
    "productId": "PROD-456",
    "productName": "Wireless Headphones",
    "sku": "WH-001",
    "oldPrice": 3000,
    "newPrice": 2500,
    "changePercentage": -16.67
  },
  "timestamp": 1700000500000
}
```

---

### Payment Events

#### payment:received
```typescript
{
  type: 'payment:received',
  namespace: 'payments',
  data: {
    paymentId: string,
    orderId: string,
    customerId: string,
    amount: number,
    method: string,
    status: 'success' | 'pending' | 'failed'
  },
  timestamp: number
}
```

**Example:**
```json
{
  "type": "payment:received",
  "namespace": "payments",
  "data": {
    "paymentId": "PAY-789",
    "orderId": "ORD-001",
    "customerId": "CUST-123",
    "amount": 1500,
    "method": "credit_card",
    "status": "success"
  },
  "timestamp": 1700000600000
}
```

#### payment:failed
```typescript
{
  type: 'payment:failed',
  namespace: 'payments',
  data: {
    paymentId: string,
    orderId: string,
    customerId: string,
    amount: number,
    reason: string,
    retryable: boolean
  },
  timestamp: number
}
```

---

### System Events

#### system:notification
```typescript
{
  type: 'system:notification',
  namespace: 'system',
  data: {
    title: string,
    message: string,
    severity: 'info' | 'warning' | 'error' | 'success',
    targetRoles?: UserRole[],
    actionUrl?: string
  },
  timestamp: number
}
```

**Example:**
```json
{
  "type": "system:notification",
  "namespace": "system",
  "data": {
    "title": "New Feature Released",
    "message": "Check out our new dashboard analytics!",
    "severity": "info",
    "targetRoles": ["admin", "manager"],
    "actionUrl": "/analytics"
  },
  "timestamp": 1700000700000
}
```

#### system:alert
```typescript
{
  type: 'system:alert',
  namespace: 'system',
  data: {
    title: string,
    message: string,
    severity: 'info' | 'warning' | 'error' | 'success',
    targetRoles?: UserRole[]
  },
  timestamp: number
}
```

#### system:maintenance
```typescript
{
  type: 'system:maintenance',
  namespace: 'system',
  data: {
    message: string,
    scheduledAt?: number,
    duration?: number
  },
  timestamp: number
}
```

---

## Event Emission Examples

### Server-Side

```typescript
import { wsEvents } from '@/lib/websocket/events';

// Order created
wsEvents.orderCreated({
  orderId: 'ORD-001',
  customerId: 'CUST-123',
  customerName: 'John Doe',
  total: 1500,
  status: 'pending',
  channel: 'online'
});

// Inventory low stock
wsEvents.inventoryAlert({
  productId: 'PROD-456',
  productName: 'Wireless Headphones',
  sku: 'WH-001',
  currentStock: 5,
  threshold: 10,
  severity: 'critical'
});

// System notification
wsEvents.systemNotification({
  title: 'Server Maintenance',
  message: 'System will be down for maintenance',
  severity: 'warning',
  targetRoles: ['admin']
});
```

### Using Helpers

```typescript
import {
  emitOrderEvent,
  emitInventoryEvent,
  emitProductEvent,
  emitPaymentEvent
} from '@/lib/websocket/helpers';

// In your API route
emitOrderEvent('created', {
  id: order.id,
  customerId: order.customerId,
  customerName: order.customerName,
  total: order.total,
  status: order.status,
  channel: order.channel
});

emitInventoryEvent('updated', {
  id: product.id,
  name: product.name,
  sku: product.sku,
  oldStock: 50,
  newStock: 49,
  reason: 'sale'
});
```

---

## Client-Side Listening

### Basic Event Listener

```typescript
import { useWebSocket } from '@/lib/hooks/useWebSocket';

function MyComponent() {
  const ws = useWebSocket({ namespaces: ['orders'] });

  useEffect(() => {
    // Listen to order created
    const cleanup = ws.on('order:created', (data) => {
      console.log('New order:', data);
      // Update UI
    });

    return cleanup; // Cleanup on unmount
  }, [ws]);
}
```

### Multiple Event Listeners

```typescript
useEffect(() => {
  const cleanup1 = ws.on('order:created', handleOrderCreated);
  const cleanup2 = ws.on('order:status_changed', handleStatusChange);
  const cleanup3 = ws.on('inventory:low_stock', handleLowStock);

  return () => {
    cleanup1();
    cleanup2();
    cleanup3();
  };
}, [ws]);
```

### Typed Event Listeners

```typescript
import type { OrderCreatedPayload } from '@/lib/websocket/types';

ws.on<OrderCreatedPayload>('order:created', (data) => {
  // data is typed as OrderCreatedPayload
  console.log(data.orderId, data.total);
});
```

---

## Broadcasting Options

### Role-Based Broadcasting

```typescript
// Only send to admins and managers
wsEvents.orderCreated(orderData, {
  roles: ['admin', 'manager']
});
```

### User-Specific Broadcasting

```typescript
// Send to specific users only
wsEvents.orderStatusChanged(statusData, {
  userIds: ['customer_123']
});
```

### Namespace Broadcasting

```typescript
// Broadcast to all subscribers of a namespace
wsEvents.systemNotification(notificationData, {
  namespace: 'system'
});
```

### Exclusion Broadcasting

```typescript
// Exclude certain users
wsEvents.productUpdated(productData, {
  excludeUserIds: ['user_456']
});
```

---

## Event Filtering

The WebSocket server automatically filters events based on:

1. **Namespace Subscription**: Only receive events from subscribed namespaces
2. **Role Permissions**: Only receive events your role has access to
3. **User Filtering**: Customers only receive their own order/payment events
4. **Exclusion Rules**: Events can exclude specific users or sessions

---

## Best Practices

1. **Always include timestamps**: Use `Date.now()` for all events
2. **Use descriptive event names**: Follow the `namespace:action` pattern
3. **Keep payload small**: Limit data to essential information
4. **Use typed payloads**: Define TypeScript interfaces for all events
5. **Handle errors gracefully**: Wrap event handlers in try-catch
6. **Clean up listeners**: Always return cleanup function from useEffect
7. **Batch similar events**: Use debouncing for high-frequency events
8. **Document custom events**: Add to this reference if creating new events

---

## Testing Events

### Test Event Emission
```typescript
// In your test file
import { wsEvents } from '@/lib/websocket/events';

test('order created event', () => {
  const mockHandler = jest.fn();
  ws.on('order:created', mockHandler);

  wsEvents.orderCreated({
    orderId: 'TEST-001',
    customerId: 'CUST-001',
    customerName: 'Test User',
    total: 1000,
    status: 'pending',
    channel: 'online'
  });

  expect(mockHandler).toHaveBeenCalled();
});
```

### Test Event Reception
```typescript
// Simulate receiving an event
const testEvent = {
  type: 'order:created',
  namespace: 'orders',
  data: { orderId: 'TEST-001', ... },
  timestamp: Date.now()
};

ws.handleMessage({ data: JSON.stringify(testEvent) });
```

---

## Monitoring Events

### Log All Events (Development)
```typescript
const ws = useWebSocket({ debug: true });

// This will log all events to console
```

### Track Event Metrics
```typescript
let eventCount = 0;
let eventTypes = new Set();

ws.on('*', (data, event) => {
  eventCount++;
  eventTypes.add(event.type);

  console.log({
    totalEvents: eventCount,
    uniqueTypes: eventTypes.size,
    latestEvent: event.type
  });
});
```

---

## Future Events (Planned)

- `cart:abandoned` - Cart abandonment alert
- `order:shipped` - Shipping confirmation
- `product:review_added` - New product review
- `customer:referral` - Referral program event
- `inventory:transfer` - Stock transfer between warehouses
- `analytics:milestone` - Business milestone achieved

---

For complete documentation, see:
- `/home/user/omni-sales/lib/websocket/README.md`
- `/home/user/omni-sales/docs/WEBSOCKET_ARCHITECTURE.md`
