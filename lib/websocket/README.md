# Real-Time WebSocket System

A comprehensive WebSocket implementation for real-time updates in the Omni Sales platform.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT APPLICATIONS                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   React UI   │  │  Mobile App  │  │  Dashboard   │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                 │                        │
│         └─────────────────┼─────────────────┘                        │
│                           │                                          │
└───────────────────────────┼──────────────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │  useWebSocket  │  (Client Hook)
                    │     Hook       │
                    └───────┬────────┘
                            │
                            │ WebSocket Connection
                            │ ws://host/api/ws
                            │
┌───────────────────────────▼──────────────────────────────────────────┐
│                      WEBSOCKET SERVER                                │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    WebSocket Manager                           │ │
│  │  ┌──────────────────────────────────────────────────────────┐ │ │
│  │  │  Connection Pool                                          │ │ │
│  │  │  - User Authentication                                    │ │ │
│  │  │  - Session Management                                     │ │ │
│  │  │  - Rate Limiting                                          │ │ │
│  │  │  - Heartbeat/Ping-Pong                                    │ │ │
│  │  └──────────────────────────────────────────────────────────┘ │ │
│  │                                                                  │ │
│  │  ┌──────────────────────────────────────────────────────────┐ │ │
│  │  │  Namespace Subscriptions                                  │ │ │
│  │  │  ├─ orders     (Order events)                             │ │ │
│  │  │  ├─ customers  (Customer activity)                        │ │ │
│  │  │  ├─ products   (Product updates)                          │ │ │
│  │  │  ├─ inventory  (Stock changes)                            │ │ │
│  │  │  ├─ payments   (Payment events)                           │ │ │
│  │  │  └─ system     (System notifications)                     │ │ │
│  │  └──────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    Event Broadcasting                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │ │
│  │  │   Role-Based │  │  User-Based  │  │  Namespace   │        │ │
│  │  │  Broadcasting│  │ Broadcasting │  │ Broadcasting │        │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘        │ │
│  └────────────────────────────────────────────────────────────────┘ │
└───────────────────────────┬──────────────────────────────────────────┘
                            │
                            │ Event Emission
                            │
┌───────────────────────────▼──────────────────────────────────────────┐
│                        API ROUTES                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Orders     │  │  Inventory   │  │   Payments   │              │
│  │   API        │  │    API       │  │     API      │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                 │                        │
│         └─────────────────┼─────────────────┘                        │
│                           │                                          │
│                  ┌────────▼────────┐                                 │
│                  │  WebSocket      │                                 │
│                  │  Event Helpers  │                                 │
│                  └─────────────────┘                                 │
└──────────────────────────────────────────────────────────────────────┘
```

## Event Types

### Order Events
- `order:created` - New order created
- `order:updated` - Order details updated
- `order:status_changed` - Order status changed
- `order:deleted` - Order deleted

### Customer Events
- `customer:activity` - Customer action performed
- `customer:viewing_product` - Customer viewing a product
- `customer:added_to_cart` - Item added to cart
- `customer:online` - Customer came online
- `customer:offline` - Customer went offline

### Inventory Events
- `inventory:updated` - Stock level changed
- `inventory:low_stock` - Stock below threshold
- `inventory:out_of_stock` - Product out of stock
- `inventory:restocked` - Product restocked

### Product Events
- `product:price_changed` - Price updated
- `product:created` - New product created
- `product:updated` - Product details updated
- `product:deleted` - Product deleted

### Payment Events
- `payment:received` - Payment received
- `payment:failed` - Payment failed
- `payment:refunded` - Payment refunded

### System Events
- `system:notification` - System notification
- `system:alert` - System alert
- `system:maintenance` - Maintenance notification

## Usage

### Client-Side

#### Basic Connection
```typescript
import { useWebSocket } from '@/lib/hooks/useWebSocket';

function MyComponent() {
  const ws = useWebSocket({
    autoConnect: true,
    reconnect: true,
    maxReconnectAttempts: 5,
    namespaces: ['orders', 'products'],
    auth: {
      userId: 'user_123',
      role: 'admin',
      sessionId: 'session_456',
      expiresAt: Date.now() + 86400000,
    },
  });

  useEffect(() => {
    // Listen to order created events
    const cleanup = ws.on('order:created', (data) => {
      console.log('New order:', data);
    });

    return cleanup;
  }, [ws]);

  return (
    <div>
      {ws.isConnected ? 'Connected' : 'Disconnected'}
    </div>
  );
}
```

#### Using Real-Time Components
```typescript
import OrderStatusBadge from '@/components/realtime/OrderStatusBadge';
import LiveCustomerCount from '@/components/realtime/LiveCustomerCount';
import LiveSalesTicker from '@/components/realtime/LiveSalesTicker';

function Dashboard() {
  return (
    <div>
      <LiveCustomerCount showDetails />
      <LiveSalesTicker maxItems={10} />
      <OrderStatusBadge
        orderId="order_123"
        initialStatus="pending"
      />
    </div>
  );
}
```

### Server-Side

#### Emitting Events from API Routes
```typescript
// app/api/orders/route.ts
import { emitOrderEvent } from '@/lib/websocket/helpers';

export async function POST(request: Request) {
  // Create order in database
  const order = await createOrder(data);

  // Emit WebSocket event
  emitOrderEvent('created', {
    id: order.id,
    customerId: order.customerId,
    customerName: order.customerName,
    total: order.total,
    status: order.status,
    channel: order.channel,
  });

  return Response.json(order);
}
```

#### Broadcasting Custom Events
```typescript
import { wsEvents } from '@/lib/websocket/events';

// Broadcast to all admins
wsEvents.systemNotification({
  title: 'System Update',
  message: 'New feature released',
  severity: 'info',
  targetRoles: ['admin', 'manager'],
});

// Broadcast to specific users
wsEvents.orderStatusChanged(
  {
    orderId: 'order_123',
    customerId: 'cust_456',
    customerName: 'John Doe',
    oldStatus: 'pending',
    newStatus: 'processing',
    timestamp: Date.now(),
  },
  { userIds: ['cust_456'] }
);
```

## Security

### Authentication
All WebSocket connections require authentication:
```typescript
{
  userId: string,
  role: 'admin' | 'manager' | 'staff' | 'customer' | 'guest',
  sessionId: string,
  expiresAt: number
}
```

### Role-Based Access Control

| Role     | Orders | Customers | Products | Inventory | Payments | System |
|----------|--------|-----------|----------|-----------|----------|--------|
| admin    | ✓      | ✓         | ✓        | ✓         | ✓        | ✓      |
| manager  | ✓      | ✓         | ✓        | ✓         | ✓        | ✗      |
| staff    | ✓      | ✓         | ✓        | ✓         | ✗        | ✗      |
| customer | ✓*     | ✗         | ✓        | ✗         | ✗        | ✗      |
| guest    | ✗      | ✗         | ✓        | ✗         | ✗        | ✗      |

*Customers can only see their own orders

### Rate Limiting
- 100 events per minute per connection
- Automatic connection termination on abuse
- IP-based connection limits

### CORS
Configure allowed origins in `.env`:
```
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

## Configuration

### Environment Variables
```bash
# WebSocket Configuration
WS_PORT=3001                    # Optional, defaults to Next.js port
ALLOWED_ORIGINS=*               # Comma-separated origins

# Connection Settings
WS_MAX_CONNECTIONS=10000        # Max concurrent connections
WS_PING_INTERVAL=30000          # Ping interval in ms
WS_PONG_TIMEOUT=5000            # Pong timeout in ms
```

### Custom Server
To use WebSocket with Next.js, use the custom server:

```bash
# Update package.json
{
  "scripts": {
    "dev": "node server.js",
    "start": "NODE_ENV=production node server.js"
  }
}
```

## Monitoring

### Connection Statistics
```typescript
// GET /api/ws/stats
{
  "totalConnections": 245,
  "authenticatedConnections": 230,
  "connectionsByRole": {
    "admin": 5,
    "staff": 20,
    "customer": 205
  },
  "connectionsByNamespace": {
    "orders": 225,
    "products": 245,
    "inventory": 25
  }
}
```

### Health Check
```bash
# GET /api/ws/info
curl http://localhost:3000/api/ws/info
```

## Performance

### Optimizations
- Connection pooling
- Event batching
- Namespace-based filtering
- Role-based filtering
- Automatic cleanup of stale connections

### Scaling
For production, consider:
- Redis pub/sub for multi-server deployments
- Load balancing with sticky sessions
- Horizontal scaling with session affinity

## Testing

### Test WebSocket Connection
```javascript
const ws = new WebSocket('ws://localhost:3000/api/ws');

ws.onopen = () => {
  console.log('Connected');

  // Authenticate
  ws.send(JSON.stringify({
    type: 'auth',
    data: {
      userId: 'test_user',
      role: 'admin',
      sessionId: 'test_session',
      expiresAt: Date.now() + 3600000
    }
  }));

  // Subscribe to namespace
  ws.send(JSON.stringify({
    type: 'subscribe',
    data: { namespace: 'orders' }
  }));
};

ws.onmessage = (event) => {
  console.log('Message:', JSON.parse(event.data));
};
```

## Troubleshooting

### Common Issues

1. **Connection fails**
   - Check if custom server is running (`node server.js`)
   - Verify CORS settings
   - Check firewall rules

2. **Events not received**
   - Verify namespace subscription
   - Check user role permissions
   - Confirm event is being emitted

3. **Frequent disconnections**
   - Check network stability
   - Verify ping/pong intervals
   - Review rate limiting

## Future Enhancements

- [ ] Redis adapter for multi-server support
- [ ] Message persistence
- [ ] Event replay capability
- [ ] GraphQL subscriptions integration
- [ ] Mobile push notification integration
- [ ] Advanced analytics dashboard
