/**
 * Fulfillment Management Utility
 * Handles order picking, packing, shipping, tracking, and returns
 */

import { Order } from '@/types';

export type FulfillmentStatus =
  | 'new'
  | 'payment_received'
  | 'ready_for_fulfillment'
  | 'picking'
  | 'picked'
  | 'packing'
  | 'packed'
  | 'shipped'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'returned'
  | 'cancelled';

export type ReturnStatus = 'requested' | 'approved' | 'rejected' | 'received' | 'processed';

export interface FulfillmentItem {
  orderItemId: string;
  productId: string;
  productName: string;
  quantity: number;
  picked: number;
  packed: number;
  location?: string; // Warehouse location
  barcode?: string;
}

export interface PickingInfo {
  startedAt?: Date;
  completedAt?: Date;
  pickedBy?: string;
  notes?: string;
  items: {
    itemId: string;
    picked: number;
    timestamp: Date;
  }[];
}

export interface PackingInfo {
  startedAt?: Date;
  completedAt?: Date;
  packedBy?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
  };
  boxes: PackingBox[];
  notes?: string;
}

export interface PackingBox {
  id: string;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
  };
  items: {
    itemId: string;
    quantity: number;
  }[];
  trackingNumber?: string;
}

export interface ShippingInfo {
  carrier: string;
  service: string;
  trackingNumber?: string;
  shippingLabel?: string;
  labelFormat?: 'pdf' | 'png' | 'zpl';
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  shippedAt?: Date;
  rate: number;
  currency: string;
  insurance?: {
    amount: number;
    provider: string;
  };
}

export interface ReturnRequest {
  id: string;
  fulfillmentOrderId: string;
  orderId: string;
  items: {
    itemId: string;
    quantity: number;
    reason: string;
  }[];
  reason: string;
  status: ReturnStatus;
  requestedBy: string;
  approvedBy?: string;
  receivedAt?: Date;
  processedAt?: Date;
  refundAmount?: number;
  restockItems?: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FulfillmentOrder {
  id: string;
  orderId: string;
  status: FulfillmentStatus;
  items: FulfillmentItem[];
  picking: PickingInfo;
  packing: PackingInfo;
  shipping: ShippingInfo;
  returns: ReturnRequest[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  warehouse?: string;
  assignedTo?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FulfillmentMetrics {
  totalOrders: number;
  ordersByStatus: Record<FulfillmentStatus, number>;
  averagePickTime: number; // in minutes
  averagePackTime: number; // in minutes
  averageShipTime: number; // in minutes
  pickAccuracy: number; // percentage
  onTimeShipment: number; // percentage
  returnRate: number; // percentage
}

/**
 * Generate a fulfillment order from a regular order
 */
export function createFulfillmentOrder(order: Order): FulfillmentOrder {
  const items: FulfillmentItem[] = order.items.map((item) => ({
    orderItemId: item.id || `${item.productId}-${Date.now()}`,
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    picked: 0,
    packed: 0,
    location: undefined,
    barcode: undefined,
  }));

  return {
    id: `FO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    orderId: order.id,
    status: 'new',
    items,
    picking: {
      items: [],
    },
    packing: {
      boxes: [],
    },
    shipping: {
      carrier: '',
      service: '',
      rate: 0,
      currency: 'USD',
    },
    returns: [],
    priority: 'normal',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Validate status transition
 */
export function canTransitionStatus(
  currentStatus: FulfillmentStatus,
  newStatus: FulfillmentStatus
): boolean {
  const validTransitions: Record<FulfillmentStatus, FulfillmentStatus[]> = {
    new: ['payment_received', 'cancelled'],
    payment_received: ['ready_for_fulfillment', 'cancelled'],
    ready_for_fulfillment: ['picking', 'cancelled'],
    picking: ['picked', 'ready_for_fulfillment', 'cancelled'],
    picked: ['packing', 'picking', 'cancelled'],
    packing: ['packed', 'picked', 'cancelled'],
    packed: ['shipped', 'packing', 'cancelled'],
    shipped: ['in_transit', 'cancelled'],
    in_transit: ['out_for_delivery', 'delivered', 'returned'],
    out_for_delivery: ['delivered', 'returned'],
    delivered: ['returned'],
    returned: [],
    cancelled: [],
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
}

/**
 * Start picking process
 */
export function startPicking(
  fulfillmentOrder: FulfillmentOrder,
  pickedBy: string
): FulfillmentOrder {
  if (!canTransitionStatus(fulfillmentOrder.status, 'picking')) {
    throw new Error(`Cannot start picking from status: ${fulfillmentOrder.status}`);
  }

  return {
    ...fulfillmentOrder,
    status: 'picking',
    picking: {
      ...fulfillmentOrder.picking,
      startedAt: new Date(),
      pickedBy,
    },
    updatedAt: new Date(),
  };
}

/**
 * Mark item as picked
 */
export function pickItem(
  fulfillmentOrder: FulfillmentOrder,
  itemId: string,
  quantityPicked: number
): FulfillmentOrder {
  const itemIndex = fulfillmentOrder.items.findIndex((item) => item.orderItemId === itemId);
  if (itemIndex === -1) {
    throw new Error(`Item not found: ${itemId}`);
  }

  const item = fulfillmentOrder.items[itemIndex];
  const newPicked = Math.min(item.picked + quantityPicked, item.quantity);

  const updatedItems = [...fulfillmentOrder.items];
  updatedItems[itemIndex] = {
    ...item,
    picked: newPicked,
  };

  const pickingItems = [...fulfillmentOrder.picking.items];
  pickingItems.push({
    itemId,
    picked: quantityPicked,
    timestamp: new Date(),
  });

  return {
    ...fulfillmentOrder,
    items: updatedItems,
    picking: {
      ...fulfillmentOrder.picking,
      items: pickingItems,
    },
    updatedAt: new Date(),
  };
}

/**
 * Complete picking process
 */
export function completePicking(fulfillmentOrder: FulfillmentOrder, notes?: string): FulfillmentOrder {
  // Verify all items are picked
  const allPicked = fulfillmentOrder.items.every((item) => item.picked === item.quantity);
  if (!allPicked) {
    throw new Error('Not all items have been picked');
  }

  if (!canTransitionStatus(fulfillmentOrder.status, 'picked')) {
    throw new Error(`Cannot complete picking from status: ${fulfillmentOrder.status}`);
  }

  return {
    ...fulfillmentOrder,
    status: 'picked',
    picking: {
      ...fulfillmentOrder.picking,
      completedAt: new Date(),
      notes,
    },
    updatedAt: new Date(),
  };
}

/**
 * Start packing process
 */
export function startPacking(
  fulfillmentOrder: FulfillmentOrder,
  packedBy: string
): FulfillmentOrder {
  if (!canTransitionStatus(fulfillmentOrder.status, 'packing')) {
    throw new Error(`Cannot start packing from status: ${fulfillmentOrder.status}`);
  }

  return {
    ...fulfillmentOrder,
    status: 'packing',
    packing: {
      ...fulfillmentOrder.packing,
      startedAt: new Date(),
      packedBy,
    },
    updatedAt: new Date(),
  };
}

/**
 * Add a packing box
 */
export function addPackingBox(
  fulfillmentOrder: FulfillmentOrder,
  box: Omit<PackingBox, 'id'>
): FulfillmentOrder {
  const newBox: PackingBox = {
    ...box,
    id: `BOX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };

  const boxes = [...fulfillmentOrder.packing.boxes, newBox];

  // Update packed quantities
  const updatedItems = [...fulfillmentOrder.items];
  box.items.forEach((boxItem) => {
    const itemIndex = updatedItems.findIndex((item) => item.orderItemId === boxItem.itemId);
    if (itemIndex !== -1) {
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        packed: updatedItems[itemIndex].packed + boxItem.quantity,
      };
    }
  });

  return {
    ...fulfillmentOrder,
    items: updatedItems,
    packing: {
      ...fulfillmentOrder.packing,
      boxes,
    },
    updatedAt: new Date(),
  };
}

/**
 * Complete packing process
 */
export function completePacking(
  fulfillmentOrder: FulfillmentOrder,
  weight: number,
  dimensions: PackingInfo['dimensions'],
  notes?: string
): FulfillmentOrder {
  // Verify all items are packed
  const allPacked = fulfillmentOrder.items.every((item) => item.packed === item.quantity);
  if (!allPacked) {
    throw new Error('Not all items have been packed');
  }

  if (!canTransitionStatus(fulfillmentOrder.status, 'packed')) {
    throw new Error(`Cannot complete packing from status: ${fulfillmentOrder.status}`);
  }

  return {
    ...fulfillmentOrder,
    status: 'packed',
    packing: {
      ...fulfillmentOrder.packing,
      completedAt: new Date(),
      weight,
      dimensions,
      notes,
    },
    updatedAt: new Date(),
  };
}

/**
 * Mark order as shipped
 */
export function shipOrder(
  fulfillmentOrder: FulfillmentOrder,
  shippingInfo: Partial<ShippingInfo>
): FulfillmentOrder {
  if (!canTransitionStatus(fulfillmentOrder.status, 'shipped')) {
    throw new Error(`Cannot ship order from status: ${fulfillmentOrder.status}`);
  }

  return {
    ...fulfillmentOrder,
    status: 'shipped',
    shipping: {
      ...fulfillmentOrder.shipping,
      ...shippingInfo,
      shippedAt: new Date(),
    },
    updatedAt: new Date(),
  };
}

/**
 * Update tracking status
 */
export function updateTrackingStatus(
  fulfillmentOrder: FulfillmentOrder,
  status: 'in_transit' | 'out_for_delivery' | 'delivered'
): FulfillmentOrder {
  if (!canTransitionStatus(fulfillmentOrder.status, status)) {
    throw new Error(`Cannot update to status ${status} from ${fulfillmentOrder.status}`);
  }

  const updates: Partial<ShippingInfo> = {};
  if (status === 'delivered') {
    updates.actualDelivery = new Date();
  }

  return {
    ...fulfillmentOrder,
    status,
    shipping: {
      ...fulfillmentOrder.shipping,
      ...updates,
    },
    updatedAt: new Date(),
  };
}

/**
 * Create a return request
 */
export function createReturnRequest(
  fulfillmentOrder: FulfillmentOrder,
  items: ReturnRequest['items'],
  reason: string,
  requestedBy: string
): ReturnRequest {
  return {
    id: `RET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    fulfillmentOrderId: fulfillmentOrder.id,
    orderId: fulfillmentOrder.orderId,
    items,
    reason,
    status: 'requested',
    requestedBy,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Process return request
 */
export function processReturnRequest(
  returnRequest: ReturnRequest,
  status: ReturnStatus,
  approvedBy?: string,
  refundAmount?: number,
  restockItems?: boolean,
  notes?: string
): ReturnRequest {
  const updates: Partial<ReturnRequest> = {
    status,
    updatedAt: new Date(),
  };

  if (status === 'approved' && approvedBy) {
    updates.approvedBy = approvedBy;
  }

  if (status === 'received') {
    updates.receivedAt = new Date();
  }

  if (status === 'processed') {
    updates.processedAt = new Date();
    updates.refundAmount = refundAmount;
    updates.restockItems = restockItems;
  }

  if (notes) {
    updates.notes = notes;
  }

  return {
    ...returnRequest,
    ...updates,
  };
}

/**
 * Generate picking list
 */
export function generatePickingList(
  fulfillmentOrders: FulfillmentOrder[]
): {
  orders: FulfillmentOrder[];
  items: Array<{
    location: string;
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      orders: string[];
    }>;
  }>;
  totalItems: number;
} {
  // Group items by location
  const locationMap = new Map<
    string,
    Map<
      string,
      {
        productId: string;
        productName: string;
        quantity: number;
        orders: string[];
      }
    >
  >();

  let totalItems = 0;

  fulfillmentOrders.forEach((order) => {
    order.items.forEach((item) => {
      const location = item.location || 'UNASSIGNED';
      totalItems += item.quantity - item.picked;

      if (!locationMap.has(location)) {
        locationMap.set(location, new Map());
      }

      const locationItems = locationMap.get(location)!;
      if (!locationItems.has(item.productId)) {
        locationItems.set(item.productId, {
          productId: item.productId,
          productName: item.productName,
          quantity: 0,
          orders: [],
        });
      }

      const productItem = locationItems.get(item.productId)!;
      productItem.quantity += item.quantity - item.picked;
      if (!productItem.orders.includes(order.orderId)) {
        productItem.orders.push(order.orderId);
      }
    });
  });

  // Convert to array format
  const items = Array.from(locationMap.entries()).map(([location, products]) => ({
    location,
    items: Array.from(products.values()),
  }));

  // Sort by location
  items.sort((a, b) => a.location.localeCompare(b.location));

  return {
    orders: fulfillmentOrders,
    items,
    totalItems,
  };
}

/**
 * Generate packing slip
 */
export function generatePackingSlip(fulfillmentOrder: FulfillmentOrder): {
  orderId: string;
  fulfillmentId: string;
  items: Array<{
    productName: string;
    quantity: number;
    notes?: string;
  }>;
  boxes: PackingBox[];
  totalWeight?: number;
  shippingAddress?: string;
} {
  return {
    orderId: fulfillmentOrder.orderId,
    fulfillmentId: fulfillmentOrder.id,
    items: fulfillmentOrder.items.map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
      notes: undefined,
    })),
    boxes: fulfillmentOrder.packing.boxes,
    totalWeight: fulfillmentOrder.packing.weight,
    shippingAddress: undefined,
  };
}

/**
 * Calculate fulfillment metrics
 */
export function calculateMetrics(fulfillmentOrders: FulfillmentOrder[]): FulfillmentMetrics {
  const ordersByStatus: Record<FulfillmentStatus, number> = {
    new: 0,
    payment_received: 0,
    ready_for_fulfillment: 0,
    picking: 0,
    picked: 0,
    packing: 0,
    packed: 0,
    shipped: 0,
    in_transit: 0,
    out_for_delivery: 0,
    delivered: 0,
    returned: 0,
    cancelled: 0,
  };

  let totalPickTime = 0;
  let totalPackTime = 0;
  let totalShipTime = 0;
  let pickCount = 0;
  let packCount = 0;
  let shipCount = 0;
  let totalPicked = 0;
  let correctPicked = 0;
  let onTimeShipments = 0;
  let totalShipments = 0;
  let totalReturns = 0;

  fulfillmentOrders.forEach((order) => {
    ordersByStatus[order.status]++;

    // Pick time
    if (order.picking.startedAt && order.picking.completedAt) {
      const pickTime =
        (order.picking.completedAt.getTime() - order.picking.startedAt.getTime()) / 60000;
      totalPickTime += pickTime;
      pickCount++;
    }

    // Pack time
    if (order.packing.startedAt && order.packing.completedAt) {
      const packTime =
        (order.packing.completedAt.getTime() - order.packing.startedAt.getTime()) / 60000;
      totalPackTime += packTime;
      packCount++;
    }

    // Ship time (from created to shipped)
    if (order.shipping.shippedAt) {
      const shipTime = (order.shipping.shippedAt.getTime() - order.createdAt.getTime()) / 60000;
      totalShipTime += shipTime;
      shipCount++;

      // On-time shipment (within 24 hours)
      if (shipTime <= 1440) {
        onTimeShipments++;
      }
      totalShipments++;
    }

    // Pick accuracy
    order.items.forEach((item) => {
      totalPicked += item.quantity;
      correctPicked += Math.min(item.picked, item.quantity);
    });

    // Returns
    totalReturns += order.returns.length;
  });

  return {
    totalOrders: fulfillmentOrders.length,
    ordersByStatus,
    averagePickTime: pickCount > 0 ? totalPickTime / pickCount : 0,
    averagePackTime: packCount > 0 ? totalPackTime / packCount : 0,
    averageShipTime: shipCount > 0 ? totalShipTime / shipCount : 0,
    pickAccuracy: totalPicked > 0 ? (correctPicked / totalPicked) * 100 : 100,
    onTimeShipment: totalShipments > 0 ? (onTimeShipments / totalShipments) * 100 : 100,
    returnRate:
      fulfillmentOrders.length > 0 ? (totalReturns / fulfillmentOrders.length) * 100 : 0,
  };
}

/**
 * Batch process multiple fulfillment orders
 */
export function batchProcess(
  fulfillmentOrders: FulfillmentOrder[],
  action: 'pick' | 'pack' | 'ship',
  params: any
): {
  success: FulfillmentOrder[];
  failed: Array<{ order: FulfillmentOrder; error: string }>;
} {
  const success: FulfillmentOrder[] = [];
  const failed: Array<{ order: FulfillmentOrder; error: string }> = [];

  fulfillmentOrders.forEach((order) => {
    try {
      let updatedOrder: FulfillmentOrder;

      switch (action) {
        case 'pick':
          updatedOrder = startPicking(order, params.pickedBy);
          break;
        case 'pack':
          updatedOrder = startPacking(order, params.packedBy);
          break;
        case 'ship':
          updatedOrder = shipOrder(order, params.shippingInfo);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      success.push(updatedOrder);
    } catch (error) {
      failed.push({
        order,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return { success, failed };
}

/**
 * Sort fulfillment orders by priority and age
 */
export function sortByPriority(orders: FulfillmentOrder[]): FulfillmentOrder[] {
  const priorityWeight = {
    urgent: 4,
    high: 3,
    normal: 2,
    low: 1,
  };

  return [...orders].sort((a, b) => {
    // First by priority
    const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Then by age (oldest first)
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}

/**
 * Validate fulfillment order
 */
export function validateFulfillmentOrder(order: FulfillmentOrder): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if order has items
  if (!order.items || order.items.length === 0) {
    errors.push('Fulfillment order must have at least one item');
  }

  // Check if all items have locations for picking
  if (order.status === 'ready_for_fulfillment' || order.status === 'picking') {
    order.items.forEach((item) => {
      if (!item.location) {
        warnings.push(`Item ${item.productName} does not have a warehouse location assigned`);
      }
    });
  }

  // Check picking completion
  if (order.status === 'picked' || order.status === 'packing') {
    order.items.forEach((item) => {
      if (item.picked !== item.quantity) {
        errors.push(`Item ${item.productName} is not fully picked (${item.picked}/${item.quantity})`);
      }
    });
  }

  // Check packing completion
  if (order.status === 'packed' || order.status === 'shipped') {
    order.items.forEach((item) => {
      if (item.packed !== item.quantity) {
        errors.push(`Item ${item.productName} is not fully packed (${item.packed}/${item.quantity})`);
      }
    });

    if (!order.packing.weight || order.packing.weight <= 0) {
      warnings.push('Package weight is not set');
    }

    if (!order.packing.dimensions) {
      warnings.push('Package dimensions are not set');
    }
  }

  // Check shipping info
  if (order.status === 'shipped' || order.status === 'in_transit') {
    if (!order.shipping.carrier) {
      errors.push('Shipping carrier is not selected');
    }

    if (!order.shipping.trackingNumber) {
      warnings.push('Tracking number is not available');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
