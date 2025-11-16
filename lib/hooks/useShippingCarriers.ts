/**
 * Shipping Carriers Hook
 * Manages carrier configurations, rate calculation, and label generation
 */

import { useState, useCallback, useEffect } from 'react';
import {
  CarrierConfig,
  ShippingRate,
  ShippingLabel,
  TrackingEvent,
  Address,
  Parcel,
  ShipmentRequest,
  getShippingRates,
  getCachedRates,
  generateShippingLabel,
  trackPackage,
  batchGenerateLabels,
  validateAddress,
  schedulePickup,
  cancelShipment,
  compareRates,
  clearRateCache,
} from '../utils/shipping-integration';

interface UseShippingCarriersOptions {
  autoLoad?: boolean;
  enableCache?: boolean;
}

interface UseShippingCarriersReturn {
  carriers: CarrierConfig[];
  loading: boolean;
  error: string | null;

  // Carrier management
  addCarrier: (config: Omit<CarrierConfig, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCarrier: (id: string, config: Partial<CarrierConfig>) => Promise<void>;
  deleteCarrier: (id: string) => Promise<void>;
  toggleCarrier: (id: string, enabled: boolean) => Promise<void>;

  // Rate calculation
  getRate: (from: Address, to: Address, parcel: Parcel) => Promise<ShippingRate[]>;
  getCachedRate: (
    from: Address,
    to: Address,
    parcel: Parcel,
    forceRefresh?: boolean
  ) => Promise<ShippingRate[]>;
  compareRate: (rates: ShippingRate[]) => {
    cheapest: ShippingRate;
    fastest: ShippingRate;
    recommended: ShippingRate;
    allRates: ShippingRate[];
  };

  // Label generation
  generateLabel: (shipment: ShipmentRequest) => Promise<ShippingLabel>;
  batchGenerateLabel: (shipments: ShipmentRequest[]) => Promise<{
    success: ShippingLabel[];
    failed: Array<{ shipment: ShipmentRequest; error: string }>;
  }>;
  cancelLabel: (carrierId: string, trackingNumber: string) => Promise<void>;

  // Tracking
  trackPackage: (
    carrierId: string,
    trackingNumber: string
  ) => Promise<TrackingEvent[]>;

  // Address validation
  validateAddress: (address: Address) => Promise<{
    isValid: boolean;
    errors: string[];
    suggestions?: Address[];
  }>;

  // Pickup scheduling
  schedulePickup: (
    carrierId: string,
    address: Address,
    pickupDate: Date,
    packageCount: number,
    totalWeight: number
  ) => Promise<{
    confirmationNumber: string;
    pickupDate: Date;
    readyTime: string;
    closeTime: string;
  }>;

  // Utility
  refresh: () => Promise<void>;
  clearCache: () => void;
}

/**
 * Hook for managing shipping carriers
 */
export function useShippingCarriers(
  options: UseShippingCarriersOptions = {}
): UseShippingCarriersReturn {
  const { autoLoad = true, enableCache = true } = options;

  const [carriers, setCarriers] = useState<CarrierConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load carriers
  const loadCarriers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/shipping/carriers');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load carriers');
      }

      const data = await response.json();

      // Convert date strings to Date objects
      const carriersData: CarrierConfig[] = data.map((carrier: any) => ({
        ...carrier,
        createdAt: new Date(carrier.createdAt),
        updatedAt: new Date(carrier.updatedAt),
      }));

      setCarriers(carriersData);
    } catch (err) {
      console.error('Error loading carriers:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load carriers on mount
  useEffect(() => {
    if (autoLoad) {
      loadCarriers();
    }
  }, [autoLoad, loadCarriers]);

  // Add carrier
  const handleAddCarrier = useCallback(
    async (config: Omit<CarrierConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/shipping/carriers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(config),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to add carrier');
        }

        const newCarrier = await response.json();
        setCarriers((prev) => [...prev, newCarrier]);
      } catch (err) {
        console.error('Error adding carrier:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Update carrier
  const handleUpdateCarrier = useCallback(
    async (id: string, config: Partial<CarrierConfig>) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/shipping/carriers/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(config),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update carrier');
        }

        const updatedCarrier = await response.json();
        setCarriers((prev) =>
          prev.map((carrier) => (carrier.id === id ? updatedCarrier : carrier))
        );
      } catch (err) {
        console.error('Error updating carrier:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Delete carrier
  const handleDeleteCarrier = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/shipping/carriers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete carrier');
      }

      setCarriers((prev) => prev.filter((carrier) => carrier.id !== id));
    } catch (err) {
      console.error('Error deleting carrier:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Toggle carrier
  const handleToggleCarrier = useCallback(
    async (id: string, enabled: boolean) => {
      await handleUpdateCarrier(id, { enabled });
    },
    [handleUpdateCarrier]
  );

  // Get shipping rates
  const handleGetRate = useCallback(
    async (from: Address, to: Address, parcel: Parcel): Promise<ShippingRate[]> => {
      setLoading(true);
      setError(null);

      try {
        const rates = enableCache
          ? await getCachedRates(carriers, from, to, parcel)
          : await getShippingRates(carriers, from, to, parcel);

        return rates;
      } catch (err) {
        console.error('Error getting rates:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [carriers, enableCache]
  );

  // Get cached shipping rates
  const handleGetCachedRate = useCallback(
    async (
      from: Address,
      to: Address,
      parcel: Parcel,
      forceRefresh: boolean = false
    ): Promise<ShippingRate[]> => {
      setLoading(true);
      setError(null);

      try {
        const rates = await getCachedRates(carriers, from, to, parcel, forceRefresh);
        return rates;
      } catch (err) {
        console.error('Error getting cached rates:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [carriers]
  );

  // Compare rates
  const handleCompareRate = useCallback((rates: ShippingRate[]) => {
    return compareRates(rates);
  }, []);

  // Generate label
  const handleGenerateLabel = useCallback(
    async (shipment: ShipmentRequest): Promise<ShippingLabel> => {
      setLoading(true);
      setError(null);

      try {
        const carrier = carriers.find((c) => c.carrier === shipment.carrier);
        if (!carrier) {
          throw new Error(`Carrier not found: ${shipment.carrier}`);
        }

        const label = await generateShippingLabel(carrier, shipment);
        return label;
      } catch (err) {
        console.error('Error generating label:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [carriers]
  );

  // Batch generate labels
  const handleBatchGenerateLabel = useCallback(
    async (shipments: ShipmentRequest[]): Promise<{
      success: ShippingLabel[];
      failed: Array<{ shipment: ShipmentRequest; error: string }>;
    }> => {
      setLoading(true);
      setError(null);

      try {
        const results = {
          success: [] as ShippingLabel[],
          failed: [] as Array<{ shipment: ShipmentRequest; error: string }>,
        };

        // Group shipments by carrier
        const shipmentsByCarrier = new Map<string, ShipmentRequest[]>();
        shipments.forEach((shipment) => {
          const key = shipment.carrier;
          if (!shipmentsByCarrier.has(key)) {
            shipmentsByCarrier.set(key, []);
          }
          shipmentsByCarrier.get(key)!.push(shipment);
        });

        // Process each carrier
        for (const [carrierType, carrierShipments] of shipmentsByCarrier) {
          const carrier = carriers.find((c) => c.carrier === carrierType);
          if (!carrier) {
            carrierShipments.forEach((shipment) => {
              results.failed.push({
                shipment,
                error: `Carrier not found: ${carrierType}`,
              });
            });
            continue;
          }

          const result = await batchGenerateLabels(carrier, carrierShipments);
          results.success.push(...result.success);
          results.failed.push(...result.failed);
        }

        return results;
      } catch (err) {
        console.error('Error batch generating labels:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [carriers]
  );

  // Cancel label
  const handleCancelLabel = useCallback(
    async (carrierId: string, trackingNumber: string) => {
      setLoading(true);
      setError(null);

      try {
        const carrier = carriers.find((c) => c.id === carrierId);
        if (!carrier) {
          throw new Error(`Carrier not found: ${carrierId}`);
        }

        await cancelShipment(carrier, trackingNumber);
      } catch (err) {
        console.error('Error cancelling label:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [carriers]
  );

  // Track package
  const handleTrackPackage = useCallback(
    async (carrierId: string, trackingNumber: string): Promise<TrackingEvent[]> => {
      setLoading(true);
      setError(null);

      try {
        const carrier = carriers.find((c) => c.id === carrierId);
        if (!carrier) {
          throw new Error(`Carrier not found: ${carrierId}`);
        }

        const events = await trackPackage(carrier.carrier, trackingNumber, carrier);
        return events;
      } catch (err) {
        console.error('Error tracking package:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [carriers]
  );

  // Validate address
  const handleValidateAddress = useCallback(
    async (
      address: Address
    ): Promise<{
      isValid: boolean;
      errors: string[];
      suggestions?: Address[];
    }> => {
      setLoading(true);
      setError(null);

      try {
        const result = await validateAddress(address);
        return result;
      } catch (err) {
        console.error('Error validating address:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Schedule pickup
  const handleSchedulePickup = useCallback(
    async (
      carrierId: string,
      address: Address,
      pickupDate: Date,
      packageCount: number,
      totalWeight: number
    ) => {
      setLoading(true);
      setError(null);

      try {
        const carrier = carriers.find((c) => c.id === carrierId);
        if (!carrier) {
          throw new Error(`Carrier not found: ${carrierId}`);
        }

        const result = await schedulePickup(
          carrier,
          address,
          pickupDate,
          packageCount,
          totalWeight
        );
        return result;
      } catch (err) {
        console.error('Error scheduling pickup:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [carriers]
  );

  // Clear cache
  const handleClearCache = useCallback(() => {
    clearRateCache();
  }, []);

  return {
    carriers,
    loading,
    error,

    // Carrier management
    addCarrier: handleAddCarrier,
    updateCarrier: handleUpdateCarrier,
    deleteCarrier: handleDeleteCarrier,
    toggleCarrier: handleToggleCarrier,

    // Rate calculation
    getRate: handleGetRate,
    getCachedRate: handleGetCachedRate,
    compareRate: handleCompareRate,

    // Label generation
    generateLabel: handleGenerateLabel,
    batchGenerateLabel: handleBatchGenerateLabel,
    cancelLabel: handleCancelLabel,

    // Tracking
    trackPackage: handleTrackPackage,

    // Address validation
    validateAddress: handleValidateAddress,

    // Pickup scheduling
    schedulePickup: handleSchedulePickup,

    // Utility
    refresh: loadCarriers,
    clearCache: handleClearCache,
  };
}
