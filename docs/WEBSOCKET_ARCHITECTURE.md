# WebSocket Architecture & Event Types

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND LAYER                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────┐      ┌─────────────────────┐                   │
│  │  React Components   │      │   Custom Hooks      │                   │
│  │  ┌───────────────┐  │      │  ┌──────────────┐  │                   │
│  │  │ OrderStatus   │  │◄─────┤  │useWebSocket  │  │                   │
│  │  │    Badge      │  │      │  │              │  │                   │
│  │  └───────────────┘  │      │  └──────────────┘  │                   │
│  │  ┌───────────────┐  │      │  ┌──────────────┐  │                   │
│  │  │ LiveCustomer  │  │◄─────┤  │useWebSocket  │  │                   │
│  │  │    Count      │  │      │  │   Event      │  │                   │
│  │  └───────────────┘  │      │  └──────────────┘  │                   │
│  │  ┌───────────────┐  │      │  ┌──────────────┐  │                   │
│  │  │  LiveSales    │  │◄─────┤  │useWebSocket  │  │                   │
│  │  │    Ticker     │  │      │  │  Namespace   │  │                   │
│  │  └───────────────┘  │      │  └──────────────┘  │                   │
│  └─────────────────────┘      └─────────────────────┘                   │
│                                         │                                │
│                                         │ WebSocket API                  │
└─────────────────────────────────────────┼────────────────────────────────┘
                                          │
                              ┌───────────▼──────────┐
                              │   WebSocket Client   │
                              │   (Browser Native)   │
                              └───────────┬──────────┘
                                          │
                              ws://host/api/ws
                                          │
┌─────────────────────────────────────────┼────────────────────────────────┐
│                           WEBSOCKET SERVER LAYER                         │
├─────────────────────────────────────────┼────────────────────────────────┤
│                                         │                                │
│                              ┌──────────▼─────────┐                      │
│                              │  WebSocket Manager │                      │
│                              └──────────┬─────────┘                      │
│                                         │                                │
│        ┌────────────────────────────────┼────────────────────────────┐  │
│        │                                │                            │  │
│        │   ┌────────────────────────────▼──────────────────────┐    │  │
│        │   │          Connection Management                    │    │  │
│        │   │  ┌──────────────────────────────────────────────┐ │    │  │
│        │   │  │ • Authentication & Authorization             │ │    │  │
│        │   │  │ • Session Tracking                           │ │    │  │
│        │   │  │ • Connection Pooling                         │ │    │  │
│        │   │  │ • Rate Limiting (100 events/min)             │ │    │  │
│        │   │  │ • Heartbeat (30s ping/5s pong timeout)       │ │    │  │
│        │   │  └──────────────────────────────────────────────┘ │    │  │
│        │   └───────────────────────────────────────────────────┘    │  │
│        │                                                             │  │
│        │   ┌─────────────────────────────────────────────────────┐  │  │
│        │   │           Namespace Management                      │  │  │
│        │   │  ┌────────────┐  ┌────────────┐  ┌────────────┐   │  │  │
│        │   │  │  orders    │  │ customers  │  │  products  │   │  │  │
│        │   │  └────────────┘  └────────────┘  └────────────┘   │  │  │
│        │   │  ┌────────────┐  ┌────────────┐  ┌────────────┐   │  │  │
│        │   │  │ inventory  │  │  payments  │  │   system   │   │  │  │
│        │   │  └────────────┘  └────────────┘  └────────────┘   │  │  │
│        │   └─────────────────────────────────────────────────────┘  │  │
│        │                                                             │  │
│        │   ┌─────────────────────────────────────────────────────┐  │  │
│        │   │         Event Broadcasting Engine                   │  │  │
│        │   │  ┌─────────────────────────────────────────────┐   │  │  │
│        │   │  │ • Role-Based Broadcasting                   │   │  │  │
│        │   │  │ • User-Specific Broadcasting                │   │  │  │
│        │   │  │ • Namespace Broadcasting                    │   │  │  │
│        │   │  │ • Exclusion Filters                         │   │  │  │
│        │   │  └─────────────────────────────────────────────┘   │  │  │
│        │   └─────────────────────────────────────────────────────┘  │  │
│        └─────────────────────────────────────────────────────────────┘  │
│                                         │                                │
└─────────────────────────────────────────┼────────────────────────────────┘
                                          │
                                          │ Event Emission
                                          │
┌─────────────────────────────────────────┼────────────────────────────────┐
│                            API ROUTES LAYER                              │
├─────────────────────────────────────────┼────────────────────────────────┤
│                                         │                                │
│   ┌──────────────┐    ┌──────────────┐ │ ┌──────────────┐              │
│   │   Orders     │    │  Inventory   │ │ │   Payments   │              │
│   │     API      │    │     API      │ │ │     API      │              │
│   └──────┬───────┘    └──────┬───────┘ │ └──────┬───────┘              │
│          │                   │         │        │                        │
│          └───────────────────┼─────────┼────────┘                        │
│                              │         │                                 │
│                      ┌───────▼─────────▼────────┐                       │
│                      │  WebSocket Event Helpers │                       │
│                      │  ┌────────────────────┐  │                       │
│                      │  │ emitOrderEvent     │  │                       │
│                      │  │ emitInventoryEvent │  │                       │
│                      │  │ emitProductEvent   │  │                       │
│                      │  │ emitPaymentEvent   │  │                       │
│                      │  └────────────────────┘  │                       │
│                      └─────────────────────────┘                        │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

## Event Flow Diagram

```
┌──────────────┐
│   Client     │
│  (Browser)   │
└──────┬───────┘
       │
       │ 1. Connect: ws://host/api/ws
       ▼
┌──────────────────────────────┐
│    WebSocket Manager         │
│  ┌────────────────────────┐  │
│  │ 1. Accept Connection   │  │
│  │ 2. Generate Conn ID    │  │
│  │ 3. Check Origin/Limits │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
       │
       │ 2. Authenticate
       ▼
┌──────────────────────────────┐
│   Authentication Handler     │
│  ┌────────────────────────┐  │
│  │ 1. Verify Token        │  │
│  │ 2. Set User Info       │  │
│  │ 3. Track Connection    │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
       │
       │ 3. Subscribe to Namespaces
       ▼
┌──────────────────────────────┐
│  Namespace Subscription      │
│  ┌────────────────────────┐  │
│  │ 1. Check Permissions   │  │
│  │ 2. Add to Namespace    │  │
│  │ 3. Confirm Subscription│  │
│  └────────────────────────┘  │
└──────────────────────────────┘
       │
       │ 4. API Action Triggers Event
       ▼
┌──────────────────────────────┐
│     API Route (e.g. Orders)  │
│  ┌────────────────────────┐  │
│  │ 1. Process Request     │  │
│  │ 2. Update Database     │  │
│  │ 3. Emit WS Event       │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
       │
       │ 5. Event Broadcasting
       ▼
┌──────────────────────────────┐
│  Event Broadcasting Engine   │
│  ┌────────────────────────┐  │
│  │ 1. Filter by Namespace │  │
│  │ 2. Filter by Role      │  │
│  │ 3. Filter by User      │  │
│  │ 4. Send to Clients     │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
       │
       │ 6. Receive Event
       ▼
┌──────────────────────────────┐
│        Client Handler        │
│  ┌────────────────────────┐  │
│  │ 1. Parse Event         │  │
│  │ 2. Call Event Handlers │  │
│  │ 3. Update UI           │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

## Event Types Reference

### Complete Event Type Hierarchy

```typescript
type WebSocketEventType =
  // ORDER EVENTS
  | 'order:created'           // New order placed
  | 'order:updated'           // Order details changed
  | 'order:status_changed'    // Order status transition
  | 'order:deleted'           // Order cancelled/deleted

  // CUSTOMER EVENTS
  | 'customer:activity'       // General customer action
  | 'customer:viewing_product' // Product page view
  | 'customer:added_to_cart'  // Cart item added
  | 'customer:online'         // Customer connected
  | 'customer:offline'        // Customer disconnected

  // INVENTORY EVENTS
  | 'inventory:updated'       // Stock level changed
  | 'inventory:low_stock'     // Stock below threshold
  | 'inventory:out_of_stock'  // Stock depleted
  | 'inventory:restocked'     // Stock replenished

  // PRODUCT EVENTS
  | 'product:price_changed'   // Price updated
  | 'product:created'         // New product added
  | 'product:updated'         // Product modified
  | 'product:deleted'         // Product removed

  // PAYMENT EVENTS
  | 'payment:received'        // Payment completed
  | 'payment:failed'          // Payment declined
  | 'payment:refunded'        // Refund processed

  // SYSTEM EVENTS
  | 'system:notification'     // General notification
  | 'system:alert'            // Important alert
  | 'system:maintenance'      // Maintenance notice
```

### Event Payload Schemas

#### Order Events

```typescript
// order:created
{
  orderId: string;
  customerId: string;
  customerName: string;
  total: number;
  status: OrderStatus;
  channel: string;
}

// order:status_changed
{
  orderId: string;
  customerId: string;
  customerName: string;
  oldStatus: OrderStatus;
  newStatus: OrderStatus;
  timestamp: number;
}
```

#### Inventory Events

```typescript
// inventory:updated
{
  productId: string;
  productName: string;
  sku: string;
  oldStock: number;
  newStock: number;
  difference: number;
  reason?: 'sale' | 'restock' | 'adjustment' | 'return';
}

// inventory:low_stock
{
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  threshold: number;
  severity: 'low' | 'critical';
}
```

#### Payment Events

```typescript
// payment:received
{
  paymentId: string;
  orderId: string;
  customerId: string;
  amount: number;
  method: string;
  status: 'success' | 'pending' | 'failed';
}
```

## Role-Based Access Matrix

```
┌──────────────┬────────┬───────────┬──────────┬───────────┬──────────┬────────┐
│ Event Type   │ Admin  │  Manager  │  Staff   │ Customer  │  Guest   │ Public │
├──────────────┼────────┼───────────┼──────────┼───────────┼──────────┼────────┤
│ order:*      │   ✓    │     ✓     │    ✓     │   ✓ (own) │    ✗     │   ✗    │
├──────────────┼────────┼───────────┼──────────┼───────────┼──────────┼────────┤
│ customer:*   │   ✓    │     ✓     │    ✓     │     ✗     │    ✗     │   ✗    │
├──────────────┼────────┼───────────┼──────────┼───────────┼──────────┼────────┤
│ product:*    │   ✓    │     ✓     │    ✓     │     ✓     │    ✓     │   ✓    │
├──────────────┼────────┼───────────┼──────────┼───────────┼──────────┼────────┤
│ inventory:*  │   ✓    │     ✓     │    ✓     │     ✗     │    ✗     │   ✗    │
├──────────────┼────────┼───────────┼──────────┼───────────┼──────────┼────────┤
│ payment:*    │   ✓    │     ✓     │    ✗     │   ✓ (own) │    ✗     │   ✗    │
├──────────────┼────────┼───────────┼──────────┼───────────┼──────────┼────────┤
│ system:*     │   ✓    │     ✗     │    ✗     │     ✗     │    ✗     │   ✗    │
└──────────────┴────────┴───────────┴──────────┴───────────┴──────────┴────────┘

Legend:
  ✓      = Full access
  ✓(own) = Access to own data only
  ✗      = No access
```

## Performance Metrics

### Connection Metrics
- **Max Connections**: 10,000 concurrent
- **Connection Setup**: < 100ms
- **Authentication**: < 50ms
- **Event Latency**: < 10ms

### Rate Limits
- **Events per Minute**: 100 per connection
- **Connection Attempts**: 10 per IP per minute
- **Message Size**: 1MB max

### Scalability
```
Single Server Capacity:
  ├─ Connections: 10,000
  ├─ Events/sec: 50,000
  ├─ Bandwidth: 100 Mbps
  └─ CPU: 4 cores @ 80%

Multi-Server (with Redis):
  ├─ Connections: Unlimited
  ├─ Events/sec: 500,000+
  ├─ Bandwidth: 1 Gbps+
  └─ Horizontal scaling
```

## Security Features

### 1. Authentication
- Token-based authentication
- Session management
- Expiration handling
- Role verification

### 2. Authorization
- Role-based access control (RBAC)
- Namespace permissions
- User-level filtering
- Event filtering

### 3. Rate Limiting
- Per-connection limits
- Per-IP limits
- Automatic throttling
- Graceful degradation

### 4. Network Security
- CORS configuration
- Origin validation
- SSL/TLS support
- DDoS protection

### 5. Data Security
- Payload validation
- XSS prevention
- Injection protection
- Sanitization

## Monitoring & Debugging

### Connection Stats API
```bash
GET /api/ws/stats
{
  "totalConnections": 245,
  "authenticatedConnections": 230,
  "connectionsByRole": { "admin": 5, "staff": 20, "customer": 205 },
  "connectionsByNamespace": { "orders": 225, "products": 245 }
}
```

### Health Check API
```bash
GET /api/ws/info
{
  "status": "operational",
  "version": "1.0.0",
  "features": { ... }
}
```

### Logging
- Connection events
- Authentication attempts
- Event broadcasts
- Error tracking
- Performance metrics

## Production Deployment

### Requirements
1. Node.js 18+ with `--experimental-websocket` flag
2. Redis (for multi-server setup)
3. Load balancer with WebSocket support
4. SSL certificates

### Deployment Steps
```bash
# 1. Build application
npm run build

# 2. Set environment variables
export NODE_ENV=production
export ALLOWED_ORIGINS=https://yourdomain.com
export WS_PORT=3001

# 3. Start custom server
node server.js
```

### Multi-Server Setup
```javascript
// Add Redis adapter
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

wsManager.adapter(createAdapter(pubClient, subClient));
```

## Migration Guide

### From Polling to WebSocket
```typescript
// Before (Polling)
setInterval(async () => {
  const orders = await fetch('/api/orders').then(r => r.json());
  updateUI(orders);
}, 5000);

// After (WebSocket)
const ws = useWebSocket({ namespaces: ['orders'] });
ws.on('order:created', (order) => {
  updateUI(order);
});
```

### Integration Checklist
- [ ] Install dependencies (`ws`, `@types/ws`)
- [ ] Configure environment variables
- [ ] Update API routes to emit events
- [ ] Add authentication tokens
- [ ] Implement client-side hooks
- [ ] Add real-time components
- [ ] Test connection and events
- [ ] Monitor performance
- [ ] Deploy to production

## Support & Resources

- Documentation: `/lib/websocket/README.md`
- Examples: `/lib/websocket/integration-example.ts`
- API Reference: `/api/ws/info`
- Issue Tracker: GitHub Issues
