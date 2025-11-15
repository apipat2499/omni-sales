# Inventory Management System

Complete inventory management system for the Omni Sales platform with multi-warehouse support, stock tracking, barcode management, and forecasting.

## Features

### 1. Multi-Warehouse Management
- Create and manage multiple warehouse locations
- Assign default warehouse for inventory allocation
- Track inventory across different locations
- Warehouse-specific stock levels

### 2. Stock Tracking & Movements
- Comprehensive stock movement history
- 9 movement types: sales, returns, adjustments, transfers, received, damaged, expired, stocktake
- Before/after quantity tracking
- Complete audit trail with timestamps

### 3. Reorder Management
- Set minimum and maximum stock levels per product
- Automatic reorder suggestions
- Auto-reorder functionality
- Customizable reorder quantities

### 4. Inter-Warehouse Transfers
- Transfer stock between warehouses
- Automatic dual movement recording (out/in)
- Transfer status tracking
- Complete transfer history

### 5. Barcode Management
- Create and manage product barcodes
- Multiple barcode types (EAN13, EAN8, UPC, etc.)
- Barcode-based product lookup
- Barcode scanning support

### 6. Stock Counting
- Physical inventory counts
- Variance detection
- Automatic adjustment recording
- Count history tracking

### 7. Inventory Analytics
- Inventory value calculations
- Stock turnover rates
- Inventory forecasting
- Low stock alerts

## Database Schema

### Core Tables

#### `warehouses`
- `id` - UUID primary key
- `user_id` - User identifier (multi-tenancy)
- `name` - Warehouse name
- `code` - Warehouse code/identifier
- `address` - Physical address
- `city` - City location
- `country` - Country location
- `is_default` - Whether default warehouse
- `created_at` - Creation timestamp
- `updated_at` - Update timestamp

#### `inventory`
- `id` - UUID primary key
- `user_id` - User identifier
- `product_id` - Product reference
- `warehouse_id` - Warehouse location
- `quantity_on_hand` - Physical quantity
- `quantity_reserved` - Reserved quantity (pending orders)
- `quantity_available` - GENERATED: on_hand - reserved
- `last_movement_at` - Last movement timestamp
- `created_at` - Creation timestamp
- `updated_at` - Update timestamp

#### `stock_movements`
- `id` - UUID primary key
- `user_id` - User identifier
- `product_id` - Product reference
- `warehouse_id` - Warehouse location
- `movement_type` - Type of movement (enum)
- `quantity_change` - Positive or negative change
- `quantity_before` - Quantity before movement
- `quantity_after` - Quantity after movement
- `reason` - Reason for movement
- `notes` - Additional notes
- `created_by` - User who recorded movement
- `reference_type` - Type of reference (order, transfer, etc.)
- `reference_id` - ID of referenced document
- `created_at` - Movement timestamp

#### `reorder_points`
- `id` - UUID primary key
- `user_id` - User identifier
- `product_id` - Product reference
- `min_stock` - Minimum stock level
- `max_stock` - Maximum stock level
- `reorder_quantity` - Quantity to reorder
- `auto_reorder` - Enable automatic reorder
- `is_active` - Active status
- `created_at` - Creation timestamp
- `updated_at` - Update timestamp

#### `stock_transfers`
- `id` - UUID primary key
- `user_id` - User identifier
- `product_id` - Product reference
- `from_warehouse_id` - Source warehouse
- `to_warehouse_id` - Destination warehouse
- `quantity` - Transfer quantity
- `status` - Transfer status (pending/completed/cancelled)
- `notes` - Transfer notes
- `created_at` - Creation timestamp
- `updated_at` - Update timestamp

#### `barcodes`
- `id` - UUID primary key
- `user_id` - User identifier
- `product_id` - Product reference
- `barcode` - Barcode string
- `barcode_type` - Type (EAN13, EAN8, UPC, etc.)
- `is_active` - Active status
- `created_at` - Creation timestamp

#### `stock_counts`
- `id` - UUID primary key
- `user_id` - User identifier
- `warehouse_id` - Warehouse being counted
- `status` - Count status (in_progress/completed/cancelled)
- `notes` - Count notes
- `created_at` - Creation timestamp
- `updated_at` - Update timestamp

#### `stock_count_items`
- `id` - UUID primary key
- `stock_count_id` - Reference to stock count
- `product_id` - Product being counted
- `counted_quantity` - Physical count quantity
- `system_quantity` - System inventory quantity
- `variance` - GENERATED: counted - system
- `variance_percentage` - GENERATED: variance / system * 100
- `created_at` - Creation timestamp

#### `inventory_forecasts`
- `id` - UUID primary key
- `user_id` - User identifier
- `product_id` - Product reference
- `forecast_date` - Forecast date
- `forecast_quantity` - Predicted quantity needed
- `actual_quantity` - Actual quantity used
- `accuracy_percentage` - Forecast accuracy
- `created_at` - Creation timestamp

## API Endpoints

### Warehouses

**GET** `/api/inventory/warehouses`
```json
Query Parameters:
- userId (required)

Response:
[
  {
    "id": "uuid",
    "name": "Main Warehouse",
    "code": "WH001",
    "address": "123 Main St",
    "city": "Bangkok",
    "country": "Thailand",
    "is_default": true
  }
]
```

**POST** `/api/inventory/warehouses`
```json
Body:
{
  "userId": "string",
  "name": "string",
  "code": "string",
  "address": "string",
  "city": "string",
  "country": "string",
  "isDefault": boolean
}

Response: Warehouse object
```

### Inventory Levels

**GET** `/api/inventory/levels`
```json
Query Parameters:
- userId (required)
- warehouseId (optional)
- productId (optional)
- includeProducts (optional, default: false)

Response:
[
  {
    "id": "uuid",
    "product_id": "string",
    "warehouse_id": "string",
    "quantity_on_hand": 100,
    "quantity_reserved": 10,
    "quantity_available": 90,
    "last_movement_at": "2024-01-15T10:30:00Z"
  }
]
```

### Stock Movements

**GET** `/api/inventory/movements`
```json
Query Parameters:
- userId (required)
- productId (optional)
- warehouseId (optional)
- movementType (optional)
- limit (default: 100)
- offset (default: 0)

Response:
{
  "data": [...],
  "total": number,
  "limit": number,
  "offset": number
}
```

**POST** `/api/inventory/movements`
```json
Body:
{
  "userId": "string",
  "productId": "string",
  "warehouseId": "string",
  "movementType": "sales|return|adjustment|transfer_out|transfer_in|received|damaged|expired|stocktake",
  "quantityChange": number,
  "reason": "string",
  "notes": "string"
}

Response: StockMovement object
```

### Reorder Points

**GET** `/api/inventory/reorder?type=suggestions|points`
```json
Query Parameters:
- userId (required)
- type (default: "suggestions")

Response: Array of ReorderPoint or suggestion objects
```

**POST** `/api/inventory/reorder`
```json
Body:
{
  "userId": "string",
  "productId": "string",
  "minStock": number,
  "maxStock": number,
  "reorderQuantity": number,
  "autoReorder": boolean,
  "isActive": boolean
}

Response: ReorderPoint object
```

### Stock Transfers

**GET** `/api/inventory/transfers`
```json
Query Parameters:
- userId (required)
- status (optional)
- limit (default: 50)
- offset (default: 0)

Response:
{
  "data": [...],
  "total": number,
  "limit": number,
  "offset": number
}
```

**POST** `/api/inventory/transfers`
```json
Body:
{
  "userId": "string",
  "productId": "string",
  "fromWarehouseId": "string",
  "toWarehouseId": "string",
  "quantity": number,
  "notes": "string"
}

Response: Transfer object
```

### Barcodes

**GET** `/api/inventory/barcodes`
```json
Query Parameters:
- userId (required)
- barcode (optional) - lookup by barcode
- productId (optional) - filter by product

Response: Barcode objects or product details
```

**POST** `/api/inventory/barcodes`
```json
Body:
{
  "userId": "string",
  "productId": "string",
  "barcode": "string",
  "barcodeType": "ean13|ean8|upc|code128" (default: ean13)
}

Response: Barcode object
```

**DELETE** `/api/inventory/barcodes`
```json
Query Parameters:
- barcodeId (required)
- userId (required)

Response: Updated barcode object (soft delete)
```

### Stock Count

**GET** `/api/inventory/stock-count`
```json
Query Parameters:
- userId (required)
- warehouseId (optional)
- status (optional)

Response: StockCount objects with items
```

**POST** `/api/inventory/stock-count`
```json
Body:
{
  "userId": "string",
  "warehouseId": "string",
  "items": [
    {
      "productId": "string",
      "countedQuantity": number
    }
  ],
  "notes": "string"
}

Response: StockCount object
```

**PUT** `/api/inventory/stock-count`
```json
Body:
{
  "stockCountId": "string",
  "status": "in_progress|completed|cancelled"
}

Response: Updated StockCount object
```

## Service Functions

Located in `/lib/inventory/service.ts`

### recordStockMovement()
Records a stock movement and updates inventory level.
```typescript
recordStockMovement(
  userId: string,
  movement: {
    productId: string;
    warehouseId?: string;
    movementType: string;
    quantityChange: number;
    reason?: string;
    notes?: string;
    referenceType?: string;
    referenceId?: string;
  }
): Promise<StockMovement | null>
```

### getLowStockItems()
Retrieves items below reorder point.
```typescript
getLowStockItems(
  userId: string,
  warehouseId?: string
): Promise<InventoryLevel[]>
```

### getInventoryValue()
Calculates total inventory value.
```typescript
getInventoryValue(userId: string): Promise<number>
```

### transferStock()
Transfers stock between warehouses with automatic movement recording.
```typescript
transferStock(
  userId: string,
  transfer: {
    productId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    quantity: number;
    notes?: string;
  }
): Promise<boolean>
```

### getStockMovementHistory()
Fetches movement history with filtering options.
```typescript
getStockMovementHistory(
  userId: string,
  productId?: string,
  limit?: number
): Promise<StockMovement[]>
```

### getReorderSuggestions()
Gets items that need reordering.
```typescript
getReorderSuggestions(userId: string): Promise<ReorderPoint[]>
```

### createBarcode()
Creates a barcode for a product.
```typescript
createBarcode(
  userId: string,
  barcode: string,
  productId: string,
  barcodeType?: string
): Promise<boolean>
```

### getProductByBarcode()
Looks up product details by barcode.
```typescript
getProductByBarcode(
  userId: string,
  barcode: string
): Promise<any>
```

### calculateTurnoverRate()
Calculates inventory turnover rate.
```typescript
calculateTurnoverRate(
  userId: string,
  days?: number
): Promise<number>
```

### forecastInventoryNeeds()
Predicts future inventory needs based on sales velocity.
```typescript
forecastInventoryNeeds(
  userId: string,
  productId: string,
  days?: number
): Promise<number>
```

## Usage Examples

### Recording a Sale
```typescript
import { recordStockMovement } from '@/lib/inventory/service';

await recordStockMovement(userId, {
  productId: 'prod_123',
  warehouseId: 'wh_001',
  movementType: 'sales',
  quantityChange: -5,
  reason: 'Order #12345',
  referenceType: 'order',
  referenceId: 'order_12345'
});
```

### Transferring Stock
```typescript
import { transferStock } from '@/lib/inventory/service';

await transferStock(userId, {
  productId: 'prod_123',
  fromWarehouseId: 'wh_001',
  toWarehouseId: 'wh_002',
  quantity: 10,
  notes: 'Rebalancing inventory'
});
```

### Getting Low Stock Items
```typescript
import { getLowStockItems } from '@/lib/inventory/service';

const lowStock = await getLowStockItems(userId, 'wh_001');
// Triggers low stock alerts for UI
```

### Calculating Inventory Metrics
```typescript
import {
  getInventoryValue,
  calculateTurnoverRate
} from '@/lib/inventory/service';

const totalValue = await getInventoryValue(userId);
const turnoverRate = await calculateTurnoverRate(userId, 30); // Last 30 days
```

## Frontend Components

### Inventory Dashboard (`/app/inventory/page.tsx`)
Main inventory management interface featuring:
- KPI cards (total items, total value, low stock alerts, warehouse count)
- Multi-tab interface for different operations
- Stock level table with product details
- Recent movements feed
- Warehouse overview

## Type Definitions

See `/types/index.ts` for complete TypeScript interfaces:
- `Warehouse`
- `InventoryLevel`
- `StockMovement`
- `ReorderPoint`
- `StockTransfer`
- `Barcode`
- `StockCount`
- `StockCountItem`
- `InventoryForecast`
- `InventoryStats`

## Security

- All endpoints require `userId` for multi-tenant isolation
- Row-level security (RLS) policies enforce user data isolation
- Barcode lookups return only active barcodes
- All movements tracked with audit timestamps
- Soft deletes on barcodes (is_active flag)

## Performance Optimization

- Indexes on user_id, product_id, warehouse_id, movement_type
- Specialized filtered index for low stock queries
- Generated columns for computed fields (quantity_available)
- Pagination support on movement and transfer queries
- Denormalized product data in inventory queries

## Future Enhancements

- Barcode scanning interface with camera support
- Stock count mobile app
- Inventory rebalancing recommendations
- Machine learning-based forecasting
- Integration with supplier systems for auto-ordering
- Batch operations for large inventory adjustments
- Inventory variance analysis reports
- Cycle counting (ABC analysis)

## Troubleshooting

### Stock Movements Not Recording
- Verify warehouse exists and is active
- Check user_id matches authenticated user
- Ensure product exists in products table

### Low Stock Alerts Not Appearing
- Verify reorder_points record exists
- Check is_active flag on reorder point
- Confirm quantity_available is below min_stock

### Transfer Failures
- Validate sufficient quantity in source warehouse (on_hand - reserved)
- Ensure source and destination warehouses are different
- Check both warehouses exist

## Support

For issues or questions, refer to the main README.md or contact support.
