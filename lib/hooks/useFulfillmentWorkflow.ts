/**
 * Fulfillment Workflow Hook
 * Manages fulfillment order state and transitions
 */

import { useState, useCallback, useEffect } from 'react';
import { Order } from '@/types';
import {
  FulfillmentOrder,
  FulfillmentStatus,
  ReturnRequest,
  createFulfillmentOrder,
  startPicking,
  pickItem,
  completePicking,
  startPacking,
  addPackingBox,
  completePacking,
  shipOrder,
  updateTrackingStatus,
  createReturnRequest,
  processReturnRequest,
  validateFulfillmentOrder,
  PackingBox,
  ShippingInfo,
} from '../utils/fulfillment-management';
import { ShippingRate, TrackingEvent, trackPackage } from '../utils/shipping-integration';

interface UseFulfillmentWorkflowOptions {
  orderId?: string;
  fulfillmentId?: string;
  autoSave?: boolean;
}

interface UseFulfillmentWorkflowReturn {
  order: FulfillmentOrder | null;
  status: FulfillmentStatus | null;
  loading: boolean;
  error: string | null;
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };

  // Picking actions
  startPicking: (pickedBy: string) => Promise<void>;
  pickItem: (itemId: string, quantity: number) => Promise<void>;
  completePicking: (notes?: string) => Promise<void>;

  // Packing actions
  startPacking: (packedBy: string) => Promise<void>;
  addBox: (box: Omit<PackingBox, 'id'>) => Promise<void>;
  completePacking: (
    weight: number,
    dimensions: { length: number; width: number; height: number; unit: 'cm' | 'in' },
    notes?: string
  ) => Promise<void>;

  // Shipping actions
  getShippingRates: () => Promise<ShippingRate[]>;
  selectCarrier: (carrier: string, service: string, rate: number) => Promise<void>;
  generateLabel: () => Promise<string>;
  shipOrder: (shippingInfo: Partial<ShippingInfo>) => Promise<void>;

  // Tracking actions
  trackOrder: () => Promise<TrackingEvent[]>;
  updateStatus: (status: 'in_transit' | 'out_for_delivery' | 'delivered') => Promise<void>;

  // Return actions
  createReturn: (
    items: ReturnRequest['items'],
    reason: string,
    requestedBy: string
  ) => Promise<ReturnRequest>;
  processReturn: (
    returnId: string,
    status: ReturnRequest['status'],
    approvedBy?: string,
    refundAmount?: number,
    restockItems?: boolean,
    notes?: string
  ) => Promise<void>;

  // Utility actions
  refresh: () => Promise<void>;
  save: () => Promise<void>;
  reset: () => void;
}

/**
 * Hook for managing fulfillment workflow
 */
export function useFulfillmentWorkflow(
  options: UseFulfillmentWorkflowOptions = {}
): UseFulfillmentWorkflowReturn {
  const { orderId, fulfillmentId, autoSave = false } = options;

  const [order, setOrder] = useState<FulfillmentOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>({
    isValid: true,
    errors: [],
    warnings: [],
  });

  // Load fulfillment order
  const loadOrder = useCallback(async () => {
    if (!orderId && !fulfillmentId) return;

    setLoading(true);
    setError(null);

    try {
      const url = fulfillmentId
        ? `/api/fulfillment/${fulfillmentId}`
        : `/api/fulfillment/by-order/${orderId}`;

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load fulfillment order');
      }

      const data = await response.json();

      // Convert date strings to Date objects
      const fulfillmentOrder: FulfillmentOrder = {
        ...data,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
        picking: {
          ...data.picking,
          startedAt: data.picking.startedAt ? new Date(data.picking.startedAt) : undefined,
          completedAt: data.picking.completedAt ? new Date(data.picking.completedAt) : undefined,
          items: data.picking.items.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          })),
        },
        packing: {
          ...data.packing,
          startedAt: data.packing.startedAt ? new Date(data.packing.startedAt) : undefined,
          completedAt: data.packing.completedAt ? new Date(data.packing.completedAt) : undefined,
        },
        shipping: {
          ...data.shipping,
          estimatedDelivery: data.shipping.estimatedDelivery
            ? new Date(data.shipping.estimatedDelivery)
            : undefined,
          actualDelivery: data.shipping.actualDelivery
            ? new Date(data.shipping.actualDelivery)
            : undefined,
          shippedAt: data.shipping.shippedAt ? new Date(data.shipping.shippedAt) : undefined,
        },
        returns: data.returns.map((ret: any) => ({
          ...ret,
          createdAt: new Date(ret.createdAt),
          updatedAt: new Date(ret.updatedAt),
          receivedAt: ret.receivedAt ? new Date(ret.receivedAt) : undefined,
          processedAt: ret.processedAt ? new Date(ret.processedAt) : undefined,
        })),
      };

      setOrder(fulfillmentOrder);

      // Validate order
      const validationResult = validateFulfillmentOrder(fulfillmentOrder);
      setValidation(validationResult);
    } catch (err) {
      console.error('Error loading fulfillment order:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [orderId, fulfillmentId]);

  // Save fulfillment order
  const saveOrder = useCallback(async () => {
    if (!order) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/fulfillment/${order.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(order),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save fulfillment order');
      }

      const data = await response.json();
      setOrder(data);
    } catch (err) {
      console.error('Error saving fulfillment order:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [order]);

  // Auto-save when order changes
  useEffect(() => {
    if (autoSave && order) {
      const timeoutId = setTimeout(() => {
        saveOrder();
      }, 1000); // Debounce for 1 second

      return () => clearTimeout(timeoutId);
    }
  }, [order, autoSave, saveOrder]);

  // Load order on mount
  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  // Picking actions
  const handleStartPicking = useCallback(
    async (pickedBy: string) => {
      if (!order) throw new Error('No fulfillment order loaded');

      try {
        const updatedOrder = startPicking(order, pickedBy);
        setOrder(updatedOrder);

        if (autoSave) {
          await saveOrder();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    },
    [order, autoSave, saveOrder]
  );

  const handlePickItem = useCallback(
    async (itemId: string, quantity: number) => {
      if (!order) throw new Error('No fulfillment order loaded');

      try {
        const updatedOrder = pickItem(order, itemId, quantity);
        setOrder(updatedOrder);

        if (autoSave) {
          await saveOrder();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    },
    [order, autoSave, saveOrder]
  );

  const handleCompletePicking = useCallback(
    async (notes?: string) => {
      if (!order) throw new Error('No fulfillment order loaded');

      try {
        const updatedOrder = completePicking(order, notes);
        setOrder(updatedOrder);

        if (autoSave) {
          await saveOrder();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    },
    [order, autoSave, saveOrder]
  );

  // Packing actions
  const handleStartPacking = useCallback(
    async (packedBy: string) => {
      if (!order) throw new Error('No fulfillment order loaded');

      try {
        const updatedOrder = startPacking(order, packedBy);
        setOrder(updatedOrder);

        if (autoSave) {
          await saveOrder();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    },
    [order, autoSave, saveOrder]
  );

  const handleAddBox = useCallback(
    async (box: Omit<PackingBox, 'id'>) => {
      if (!order) throw new Error('No fulfillment order loaded');

      try {
        const updatedOrder = addPackingBox(order, box);
        setOrder(updatedOrder);

        if (autoSave) {
          await saveOrder();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    },
    [order, autoSave, saveOrder]
  );

  const handleCompletePacking = useCallback(
    async (
      weight: number,
      dimensions: { length: number; width: number; height: number; unit: 'cm' | 'in' },
      notes?: string
    ) => {
      if (!order) throw new Error('No fulfillment order loaded');

      try {
        const updatedOrder = completePacking(order, weight, dimensions, notes);
        setOrder(updatedOrder);

        if (autoSave) {
          await saveOrder();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    },
    [order, autoSave, saveOrder]
  );

  // Shipping actions
  const handleGetShippingRates = useCallback(async (): Promise<ShippingRate[]> => {
    if (!order) throw new Error('No fulfillment order loaded');

    try {
      const response = await fetch(`/api/fulfillment/${order.id}/rates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weight: order.packing.weight,
          dimensions: order.packing.dimensions,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get shipping rates');
      }

      const rates = await response.json();
      return rates;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, [order]);

  const handleSelectCarrier = useCallback(
    async (carrier: string, service: string, rate: number) => {
      if (!order) throw new Error('No fulfillment order loaded');

      try {
        const updatedOrder = {
          ...order,
          shipping: {
            ...order.shipping,
            carrier,
            service,
            rate,
          },
        };

        setOrder(updatedOrder);

        if (autoSave) {
          await saveOrder();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    },
    [order, autoSave, saveOrder]
  );

  const handleGenerateLabel = useCallback(async (): Promise<string> => {
    if (!order) throw new Error('No fulfillment order loaded');

    try {
      const response = await fetch(`/api/fulfillment/${order.id}/label`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate shipping label');
      }

      const { labelUrl, trackingNumber } = await response.json();

      const updatedOrder = {
        ...order,
        shipping: {
          ...order.shipping,
          trackingNumber,
          shippingLabel: labelUrl,
        },
      };

      setOrder(updatedOrder);

      if (autoSave) {
        await saveOrder();
      }

      return labelUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, [order, autoSave, saveOrder]);

  const handleShipOrder = useCallback(
    async (shippingInfo: Partial<ShippingInfo>) => {
      if (!order) throw new Error('No fulfillment order loaded');

      try {
        const updatedOrder = shipOrder(order, shippingInfo);
        setOrder(updatedOrder);

        if (autoSave) {
          await saveOrder();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    },
    [order, autoSave, saveOrder]
  );

  // Tracking actions
  const handleTrackOrder = useCallback(async (): Promise<TrackingEvent[]> => {
    if (!order || !order.shipping.trackingNumber) {
      throw new Error('No tracking number available');
    }

    try {
      const events = await trackPackage(
        order.shipping.carrier as any,
        order.shipping.trackingNumber
      );
      return events;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  }, [order]);

  const handleUpdateStatus = useCallback(
    async (status: 'in_transit' | 'out_for_delivery' | 'delivered') => {
      if (!order) throw new Error('No fulfillment order loaded');

      try {
        const updatedOrder = updateTrackingStatus(order, status);
        setOrder(updatedOrder);

        if (autoSave) {
          await saveOrder();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    },
    [order, autoSave, saveOrder]
  );

  // Return actions
  const handleCreateReturn = useCallback(
    async (
      items: ReturnRequest['items'],
      reason: string,
      requestedBy: string
    ): Promise<ReturnRequest> => {
      if (!order) throw new Error('No fulfillment order loaded');

      try {
        const returnRequest = createReturnRequest(order, items, reason, requestedBy);

        const updatedOrder = {
          ...order,
          returns: [...order.returns, returnRequest],
        };

        setOrder(updatedOrder);

        if (autoSave) {
          await saveOrder();
        }

        return returnRequest;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    },
    [order, autoSave, saveOrder]
  );

  const handleProcessReturn = useCallback(
    async (
      returnId: string,
      status: ReturnRequest['status'],
      approvedBy?: string,
      refundAmount?: number,
      restockItems?: boolean,
      notes?: string
    ) => {
      if (!order) throw new Error('No fulfillment order loaded');

      try {
        const returnIndex = order.returns.findIndex((r) => r.id === returnId);
        if (returnIndex === -1) {
          throw new Error('Return request not found');
        }

        const updatedReturn = processReturnRequest(
          order.returns[returnIndex],
          status,
          approvedBy,
          refundAmount,
          restockItems,
          notes
        );

        const updatedReturns = [...order.returns];
        updatedReturns[returnIndex] = updatedReturn;

        const updatedOrder = {
          ...order,
          returns: updatedReturns,
        };

        setOrder(updatedOrder);

        if (autoSave) {
          await saveOrder();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    },
    [order, autoSave, saveOrder]
  );

  return {
    order,
    status: order?.status || null,
    loading,
    error,
    validation,

    // Picking
    startPicking: handleStartPicking,
    pickItem: handlePickItem,
    completePicking: handleCompletePicking,

    // Packing
    startPacking: handleStartPacking,
    addBox: handleAddBox,
    completePacking: handleCompletePacking,

    // Shipping
    getShippingRates: handleGetShippingRates,
    selectCarrier: handleSelectCarrier,
    generateLabel: handleGenerateLabel,
    shipOrder: handleShipOrder,

    // Tracking
    trackOrder: handleTrackOrder,
    updateStatus: handleUpdateStatus,

    // Returns
    createReturn: handleCreateReturn,
    processReturn: handleProcessReturn,

    // Utility
    refresh: loadOrder,
    save: saveOrder,
    reset: () => setOrder(null),
  };
}
