# Returns & RMA Management System Documentation

## Overview

The Returns & RMA (Return Merchandise Authorization) Management System provides comprehensive functionality for handling product returns, managing refunds, processing inspections, and tracking return shipping. It integrates seamlessly with the order management system and inventory management for complete post-sale lifecycle management.

## Core Features

- **Return Authorization (RMA)**: Automated RMA number generation and authorization workflow
- **Return Status Tracking**: Track returns through pending, authorized, awaiting return, received, inspecting, processed, rejected, and cancelled statuses
- **Multi-Item Returns**: Support returning multiple items from a single order
- **Condition Assessment**: Document returned item conditions (unopened, like new, good, fair, poor, damaged)
- **Inspection Management**: Track inspection details, damages, and resellability determination
- **Refund Processing**: Process refunds with multiple refund methods and gateway integration
- **Return Shipping**: Manage both outbound (customer ships back) and inbound (warehouse receives) shipping
- **Restocking Fees**: Apply percentage-based restocking fees based on item condition
- **Return Analytics**: Analyze return rates, trends, and refund metrics
- **Return Reasons**: Configurable return reason codes and categories

## Database Schema

### Return Reasons Table
```sql
CREATE TABLE return_reasons (
  id UUID PRIMARY KEY,
  reason_code VARCHAR(50) UNIQUE NOT NULL,
  reason_name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  refundable BOOLEAN DEFAULT true,
  requires_inspection BOOLEAN DEFAULT false,
  created_at TIMESTAMP
);
```

**Purpose**: Reference table for categorizing return reasons
**Key Fields**:
- `reason_code`: Unique identifier (e.g., "DEFECT", "WRONG_SIZE")
- `refundable`: Whether this reason qualifies for refund
- `requires_inspection`: Whether inspection is mandatory

### Returns Table
```sql
CREATE TABLE returns (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  order_id UUID NOT NULL REFERENCES orders(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  rma_number VARCHAR(50) UNIQUE NOT NULL,
  return_reason_id UUID REFERENCES return_reasons(id),
  return_status VARCHAR(50) DEFAULT 'pending',
  return_condition VARCHAR(50),
  authorization_code VARCHAR(50),
  authorized_at TIMESTAMP,
  return_received_date TIMESTAMP,
  refund_amount DECIMAL(12, 2),
  refund_status VARCHAR(50) DEFAULT 'pending',
  refund_processed_at TIMESTAMP,
  restocking_fee_applied DECIMAL(12, 2),
  restocking_fee_percentage DECIMAL(5, 2),
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Key Fields**:
- `rma_number`: Auto-generated authorization code (format: RMA-TIMESTAMP-RANDOM)
- `return_status`: Workflow status (pending → authorized → awaiting_return → received → inspecting → processed)
- `refund_amount`: Net refund amount after fees
- `restocking_fee_applied`: Actual fee charged in currency

### Return Items Table
```sql
CREATE TABLE return_items (
  id UUID PRIMARY KEY,
  return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES order_items(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity_returned INTEGER NOT NULL,
  quantity_approved INTEGER,
  item_condition VARCHAR(50),
  inspection_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP
);
```

**Purpose**: Individual items within a return
**Key Fields**:
- `quantity_returned`: Quantity customer wants to return
- `quantity_approved`: Quantity approved after inspection
- `item_condition`: Condition assessment (unopened, like_new, good, fair, poor, damaged)

### Return Inspections Table
```sql
CREATE TABLE return_inspections (
  id UUID PRIMARY KEY,
  return_item_id UUID NOT NULL REFERENCES return_items(id),
  inspection_date TIMESTAMP,
  inspector_name VARCHAR(255),
  condition_assessment VARCHAR(255),
  is_resellable BOOLEAN,
  damages_found TEXT,
  photos_url TEXT[],
  inspection_result VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP
);
```

**Purpose**: Detailed inspection records for returned items
**Key Fields**:
- `is_resellable`: Determines if item can be restocked
- `inspection_result`: pass, fail, partial
- `photos_url`: Array of photo URLs for documentation

### Refund Transactions Table
```sql
CREATE TABLE refund_transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  return_id UUID NOT NULL REFERENCES returns(id),
  refund_amount DECIMAL(12, 2) NOT NULL,
  refund_method VARCHAR(100),
  payment_method VARCHAR(100),
  transaction_id VARCHAR(255),
  gateway_response JSONB,
  refund_status VARCHAR(50),
  processed_at TIMESTAMP,
  actual_receipt_date TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Purpose**: Track refund payment transactions
**Key Fields**:
- `refund_method`: original_payment, credit, check, store_credit
- `gateway_response`: Payment gateway response JSON

### Return Shipping Table
```sql
CREATE TABLE return_shipping (
  id UUID PRIMARY KEY,
  return_id UUID NOT NULL REFERENCES returns(id),
  outbound_tracking_number VARCHAR(255),
  outbound_carrier VARCHAR(100),
  outbound_shipped_date TIMESTAMP,
  inbound_tracking_number VARCHAR(255),
  inbound_carrier VARCHAR(100),
  inbound_shipped_date TIMESTAMP,
  warehouse_received_date TIMESTAMP,
  shipping_label_url TEXT,
  is_prepaid BOOLEAN DEFAULT false,
  shipping_status VARCHAR(50),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Purpose**: Manage bidirectional return shipping
**Key Fields**:
- `outbound_*`: When customer ships item back to warehouse
- `inbound_*`: (Optional) When providing replacement item
- `is_prepaid`: Whether return shipping is paid by company

### Return Analytics Table
```sql
CREATE TABLE return_analytics (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  period_start_date DATE,
  period_end_date DATE,
  total_returns INTEGER,
  total_return_value DECIMAL(12, 2),
  return_rate DECIMAL(5, 2),
  average_days_to_refund INTEGER,
  resellable_items INTEGER,
  unrepairable_items INTEGER,
  restocking_fees_collected DECIMAL(12, 2),
  top_return_reason VARCHAR(255),
  refund_method_breakdown JSONB,
  return_by_category JSONB,
  created_at TIMESTAMP
);
```

**Purpose**: Historical analytics snapshots
**Key Fields**:
- `return_by_category`: Breakdown of returns by product category
- `refund_method_breakdown`: Distribution of refund methods used

## TypeScript Types

### Core Type Definitions

```typescript
export type ReturnStatus = 'pending' | 'authorized' | 'awaiting_return' | 'received' | 'inspecting' | 'processed' | 'rejected' | 'cancelled';
export type ReturnCondition = 'unopened' | 'like_new' | 'good' | 'fair' | 'poor' | 'damaged';
export type RefundStatus = 'pending' | 'approved' | 'processed' | 'completed' | 'failed' | 'cancelled';
export type InspectionStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface Return {
  id: string;
  userId: string;
  orderId: string;
  customerId: string;
  rmaNumber: string;
  returnStatus: ReturnStatus;
  refundAmount?: number;
  refundStatus: RefundStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReturnItem {
  id: string;
  returnId: string;
  productId: string;
  quantityReturned: number;
  itemCondition?: ReturnCondition;
  inspectionStatus: InspectionStatus;
}

export interface RefundTransaction {
  id: string;
  returnId: string;
  refundAmount: number;
  refundStatus?: RefundStatus;
  processedAt?: Date;
}
```

## Service Layer Functions

### Return Authorization

**`initiateReturn(userId: string, data: Partial<Return>): Promise<Return | null>`**
- Creates a new return request with auto-generated RMA number
- Parameters: orderId (required), customerId (required), returnReasonId, reasonDetails
- Returns: Created Return object with unique RMA number
- Sets initial status to 'pending'

**`authorizeReturn(userId: string, returnId: string, authCode?: string): Promise<boolean>`**
- Authorizes a return for processing
- Updates status to 'authorized'
- Sets authorization_code and authorized_at timestamp
- Returns: true on success

**`getReturn(returnId: string): Promise<Return | null>`**
- Retrieves single return with all details
- Returns: Complete Return object or null

**`getReturns(userId: string, status?: string): Promise<Return[]>`**
- Fetches all returns for a user with optional status filter
- Returns: Array of Return objects ordered by creation date (newest first)

**`updateReturnStatus(returnId: string, newStatus: string): Promise<boolean>`**
- Updates return workflow status
- Valid statuses: pending, authorized, awaiting_return, received, inspecting, processed, rejected, cancelled
- Returns: true on success

### Return Items Management

**`addReturnItem(returnId: string, data: Partial<ReturnItem>): Promise<ReturnItem | null>`**
- Adds an item to a return
- Parameters: orderItemId (required), productId (required), productName (required), quantityReturned (required)
- Initializes inspection_status to 'pending'
- Returns: Created ReturnItem object

**`getReturnItems(returnId: string): Promise<ReturnItem[]>`**
- Retrieves all items in a return
- Returns: Array of ReturnItem objects

**`updateReturnItemCondition(itemId: string, condition: string): Promise<boolean>`**
- Updates item condition assessment
- Condition values: unopened, like_new, good, fair, poor, damaged
- Returns: true on success

### Inspection Management

**`createReturnInspection(itemId: string, data: Partial<ReturnInspection>): Promise<ReturnInspection | null>`**
- Records inspection details for a returned item
- Parameters: inspectorName, conditionAssessment, isResellable, damagesFound, photosUrl, inspectionResult
- Automatically updates item inspection_status to 'completed'
- Returns: Created ReturnInspection object

**`getReturnInspections(itemId: string): Promise<ReturnInspection[]>`**
- Retrieves inspection history for an item
- Returns: Array of ReturnInspection objects (newest first)

### Refund Processing

**`processRefund(userId: string, returnId: string, data: Partial<RefundTransaction>): Promise<RefundTransaction | null>`**
- Processes refund for approved return
- Parameters: refundAmount (required), refundMethod, paymentMethod, orderPaymentId, refundReason
- Updates return refund_status to 'processed'
- Returns: Created RefundTransaction object
- Error: Returns null if refund processing fails

**`getRefundTransaction(returnId: string): Promise<RefundTransaction | null>`**
- Retrieves refund details for a return
- Returns: RefundTransaction or null if no refund exists

**`getRefundTransactions(userId: string): Promise<RefundTransaction[]>`**
- Retrieves all refund transactions for a user
- Returns: Array of RefundTransaction objects (newest first)

### Return Shipping

**`setupReturnShipping(returnId: string, data: Partial<ReturnShipping>): Promise<ReturnShipping | null>`**
- Creates return shipping entry with tracking
- Parameters: outboundCarrier, outboundTrackingNumber, isPrepaid, shippingLabelUrl, returnInstructionsUrl
- Sets shipping_status to 'pending'
- Updates return status to 'awaiting_return'
- Returns: Created ReturnShipping object

**`updateReturnShipping(shippingId: string, updates: Partial<ReturnShipping>): Promise<boolean>`**
- Updates shipping information (status, dates, tracking)
- Returns: true on success

**`getReturnShipping(returnId: string): Promise<ReturnShipping | null>`**
- Retrieves shipping details for a return
- Returns: ReturnShipping object or null

### Analytics & Statistics

**`getReturnAnalytics(userId: string, days?: number): Promise<ReturnAnalytics[]>`**
- Fetches analytics records for a period (default: 30 days)
- Returns: Array of ReturnAnalytics objects

**`recordReturnAnalytics(userId: string, data: Partial<ReturnAnalytics>): Promise<ReturnAnalytics | null>`**
- Records analytics snapshot
- Parameters: periodStartDate, periodEndDate, totalReturns, returnRate, etc.
- Returns: Created ReturnAnalytics object

**`getReturnStatistics(userId: string): Promise<ReturnStatistics | null>`**
- Calculates real-time return statistics
- Returns: ReturnStatistics object with:
  - totalReturns, totalReturnValue, returnRate
  - averageRefundAmount, averageDaysToRefund
  - resellablePercentage, mostCommonReason
  - pendingReturns, pendingRefunds

### Approval/Rejection

**`approveReturn(returnId: string, refundAmount?: number, restockingFeePercentage?: number): Promise<boolean>`**
- Approves return for refund
- Calculates restocking fee and updates refund amount
- Returns: true on success

**`rejectReturn(returnId: string, reason: string): Promise<boolean>`**
- Rejects return with reason
- Updates status to 'rejected'
- Returns: true on success

## API Endpoints

### GET /api/returns/list
Retrieves all returns with optional statistics.

**Query Parameters:**
- `userId` (required): User's ID
- `status` (optional): Filter by status (pending, authorized, processed, etc.)
- `includeStats` (optional): Include statistics summary

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "rmaNumber": "RMA-1234567890-123",
      "orderId": "uuid",
      "returnStatus": "pending",
      "refundAmount": 99.99,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "stats": {
    "totalReturns": 15,
    "totalReturnValue": 1500.00,
    "pendingReturns": 3,
    "pendingRefunds": 2
  },
  "total": 15
}
```

### GET/POST /api/returns
Get single return or initiate new return.

**GET Query Parameters:**
- `returnId` (required): Return ID to fetch
- `includeDetails` (optional): Include items, shipping, refund

**GET Response:** 200 OK
```json
{
  "data": { Return object },
  "items": [ ReturnItem[] ],
  "shipping": { ReturnShipping },
  "refund": { RefundTransaction }
}
```

**POST Body:**
```json
{
  "userId": "uuid",
  "orderId": "uuid",
  "customerId": "uuid",
  "returnReasonId": "uuid",
  "reasonDetails": "Item arrived damaged",
  "customerNotes": "Packaging was crushed"
}
```

**POST Response:** 201 Created - Return object with generated RMA number

### POST /api/returns/authorize
Authorize return and optionally approve refund.

**Body:**
```json
{
  "userId": "uuid",
  "returnId": "uuid",
  "approve": true,
  "refundAmount": 99.99,
  "restockingFeePercentage": 15,
  "shippingData": {
    "outboundCarrier": "FedEx",
    "outboundTrackingNumber": "1234567890",
    "isPrepaid": true
  }
}
```

**Response:** 200 OK
```json
{
  "success": true,
  "message": "Return authorized",
  "refundApproved": true,
  "shippingSetup": true
}
```

### GET/POST /api/returns/refund
Get refund details or process refund.

**GET Query Parameters:**
- `returnId` (required): Return ID

**POST Body:**
```json
{
  "userId": "uuid",
  "returnId": "uuid",
  "refundAmount": 99.99,
  "refundMethod": "original_payment",
  "paymentMethod": "credit_card",
  "orderPaymentId": "uuid"
}
```

**POST Response:** 201 Created - RefundTransaction object

### GET /api/returns/items
Retrieve return items or inspections.

**GET Query Parameters:**
- `returnId` (optional): Get all items in return
- `itemId` (optional): Get inspections for item

**POST Body:**
```json
{
  "returnId": "uuid",
  "orderItemId": "uuid",
  "productId": "uuid",
  "productName": "Product Name",
  "quantityReturned": 1,
  "inspectionData": {
    "inspectorName": "John Doe",
    "conditionAssessment": "Damaged packaging",
    "isResellable": false,
    "damagesFound": "Corner crush damage"
  }
}
```

**POST Response:** 201 Created - ReturnItem object

### GET /api/returns/analytics
Retrieve return analytics and statistics.

**Query Parameters:**
- `userId` (required): User's ID
- `days` (optional): Period in days (default: 30)

**Response:** 200 OK
```json
{
  "data": [ ReturnAnalytics[] ],
  "statistics": {
    "totalReturns": 15,
    "totalReturnValue": 1500.00,
    "returnRate": 2.5,
    "averageRefundAmount": 100.00,
    "averageDaysToRefund": 5,
    "resellablePercentage": 60,
    "mostCommonReason": "WRONG_SIZE",
    "pendingReturns": 3,
    "pendingRefunds": 2
  },
  "total": 12
}
```

## Return Workflow

### Complete Return Flow

1. **Initiation**
   - Customer initiates return via POST /api/returns
   - System generates unique RMA number
   - Return created with 'pending' status
   - Customer receives RMA number for tracking

2. **Authorization**
   - Support team reviews return reason and details
   - POST /api/returns/authorize with decision
   - If approved: status → 'authorized', authorization code generated
   - Return shipping label and instructions provided

3. **Awaiting Return**
   - Customer ships item back with tracking number
   - Optionally setup return shipping via setupReturnShipping
   - Status: 'awaiting_return'
   - Track inbound shipment status

4. **Receiving**
   - Warehouse receives return shipment
   - Confirm receipt in system
   - Status → 'received'
   - Update warehouse_received_date

5. **Inspection**
   - QA inspects returned item
   - Record inspection via createReturnInspection
   - Assess condition and resellability
   - Status → 'inspecting'
   - Document damages or issues

6. **Refund Processing**
   - If approved for refund: processRefund called
   - Calculate final refund amount (minus restocking fee if applicable)
   - Process payment gateway refund
   - Status → 'processed'
   - Status → 'completed' when funds received by customer

7. **Completion**
   - Return fully processed
   - Refund completed
   - Item recorded in inventory (if resellable)
   - Analytics updated

## Dashboard Features

The Returns Management dashboard at `/app/returns` includes:

### Overview Tab
- Return statistics (total, pending, refunded)
- Average refund amount and processing time
- Return rate and resellable percentage
- Pending returns and refunds count

### Pending Returns Tab
- List of awaiting authorization
- Action buttons for review and approval
- Customer notes and reasons

### Processing Returns Tab
- Returns in progress (authorized to refunding)
- Current status display
- Tracking information

### Completed Returns Tab
- Successfully processed returns
- Refund amounts
- Completion indicators

## Key Metrics & Analytics

### Return Rate Calculation
```
Return Rate = (Total Returns / Total Orders) × 100
```

### Average Days to Refund
```
Average Days = Sum of (Refund Processed Date - Return Created Date) / Number of Refunded Returns
```

### Resellable Percentage
```
Resellable % = (Resellable Items / Total Returned Items) × 100
```

### Return Value Metrics
- Total Return Value: Sum of all refund amounts
- Average Refund Amount: Total Return Value / Total Returns
- Restocking Fees Collected: Sum of all applied restocking fees

## Best Practices

### Return Authorization
- Set clear return windows (e.g., 30 days from purchase)
- Require reason for better analytics
- Use inspection for high-value items
- Document all decisions for compliance

### Refund Processing
- Process refunds within 5-7 business days of receipt
- Use original payment method when possible
- Send confirmation emails with tracking
- Track refund delivery dates

### Inspections
- Require inspections for all returns
- Document damages with photos
- Define clear condition categories
- Track inspector compliance

### Inventory Integration
- Update inventory for resellable items
- Track unrepairable/salvage items separately
- Flag high-return products for review
- Monitor quality issues by supplier

### Customer Communication
- Provide RMA number immediately
- Send return instructions with prepaid labels
- Update status in real-time
- Notify when refund is processed

## Troubleshooting Guide

### Return Not Authorized
**Problem:** Return stays in pending status
**Solution:**
1. Check return reason is valid (requiresInspection setting)
2. Verify customer information is complete
3. Check for duplicate RMA numbers
4. Manually authorize via approveReturn

### Refund Not Processing
**Problem:** Refund stuck in pending status
**Solution:**
1. Verify refund amount is correct
2. Check payment gateway credentials
3. Ensure original payment method is available
4. Review gateway_response for error details
5. Try alternative refund method (credit, check)

### Missing Return Inspection
**Problem:** Return items not showing inspections
**Solution:**
1. Check inspection_status on return_items
2. Verify createReturnInspection was called
3. Check for inspection error logs
4. Manually create inspection record

### Analytics Not Updating
**Problem:** Analytics showing old data
**Solution:**
1. Verify recordReturnAnalytics being called
2. Check date range in query
3. Ensure period dates are correct
4. Check user_id parameter matches

## Compliance & Audit Trail

- All return events timestamped and recorded
- Authorization codes stored for tracking
- Inspection photos and notes archived
- Refund transaction IDs logged
- RMA numbers unique and traceable
- Audit trail supports dispute resolution

## Performance Optimization

### Database Indexes
- idx_returns_user: Fast user-specific queries
- idx_returns_rma_number: RMA lookup
- idx_returns_status: Status filtering
- idx_return_items_product: Inventory reconciliation
- idx_refund_transactions_status: Pending refunds

### Query Optimization
- Pagination for large return lists
- Status-based filtering to reduce dataset
- Indexed searches on RMA number
- Pre-calculated analytics snapshots

### Best Practices
- Archive old returns after 1-2 years
- Schedule analytics jobs during off-peak hours
- Batch refund processing
- Cache return reason lookup

## Future Enhancements

- Reverse logistics optimization
- ML-based return prediction
- Automated inspection via computer vision
- Integration with carrier APIs
- Customer return history scoring
- Predictive restocking recommendations
- Return reason drill-down analysis
- Supplier quality metrics
