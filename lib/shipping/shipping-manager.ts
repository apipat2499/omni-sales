/**
 * Unified Shipping Manager
 * Integrates multiple Thai shipping providers (Kerry, Flash, Thailand Post)
 */

import { KerryExpressClient, KerryShipmentRequest, KerryShipment, KerryRateQuote, KerryTrackingInfo } from '@/lib/integrations/shipping/kerry/client';
import { FlashExpressClient, FlashShipmentRequest, FlashShipment, FlashRateQuote, FlashTrackingInfo } from '@/lib/integrations/shipping/flash/client';
import { ThailandPostClient, ThailandPostShipmentRequest, ThailandPostShipment, ThailandPostRateQuote, ThailandPostTrackingInfo } from '@/lib/integrations/shipping/thailand-post/client';
import { supabase } from '@/lib/supabase/client';

export type ShippingProvider = 'kerry' | 'flash' | 'thailand-post';

export interface Address {
  name: string;
  phone: string;
  address: string;
  district: string;
  province: string;
  postalCode: string;
  country?: string;
}

export interface ShipmentRequest {
  provider: ShippingProvider;
  orderId?: string;
  senderAddress: Address;
  recipientAddress: Address;
  parcel: {
    weight: number;
    width?: number;
    height?: number;
    length?: number;
    codAmount?: number;
    insuranceValue?: number;
    description?: string;
  };
  serviceType?: string;
  referenceNumber?: string;
}

export interface UnifiedShipment {
  id?: string;
  provider: ShippingProvider;
  trackingNumber: string;
  orderId?: string;
  status: string;
  estimatedDeliveryDate?: string;
  labelUrl?: string;
  createdAt?: Date;
  metadata?: Record<string, any>;
}

export interface UnifiedRateQuote {
  provider: ShippingProvider;
  serviceType: string;
  serviceName: string;
  price: number;
  currency: string;
  estimatedDays: number;
}

export interface UnifiedTrackingInfo {
  provider: ShippingProvider;
  trackingNumber: string;
  status: string;
  statusDescription: string;
  statusDate: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  recipientName?: string;
  trackingHistory: Array<{
    date: string;
    time: string;
    status: string;
    location: string;
    description: string;
  }>;
}

export interface ShippingConfig {
  kerry?: {
    apiKey: string;
    environment?: 'production' | 'sandbox';
  };
  flash?: {
    apiKey: string;
    merchantId: string;
    environment?: 'production' | 'sandbox';
  };
  thailandPost?: {
    apiToken: string;
    environment?: 'production' | 'sandbox';
  };
}

export class ShippingManager {
  private kerryClient?: KerryExpressClient;
  private flashClient?: FlashExpressClient;
  private thailandPostClient?: ThailandPostClient;

  constructor(config: ShippingConfig) {
    if (config.kerry) {
      this.kerryClient = new KerryExpressClient(config.kerry);
    }
    if (config.flash) {
      this.flashClient = new FlashExpressClient(config.flash);
    }
    if (config.thailandPost) {
      this.thailandPostClient = new ThailandPostClient(config.thailandPost);
    }
  }

  /**
   * Get shipping rates from all available providers
   */
  async getRates(
    origin: string,
    destination: string,
    weight: number,
    dimensions?: { width: number; height: number; length: number }
  ): Promise<UnifiedRateQuote[]> {
    const rates: UnifiedRateQuote[] = [];

    // Check cache first
    const cached = await this.getCachedRates(origin, destination, weight);
    if (cached && cached.length > 0) {
      return cached;
    }

    // Get rates from Kerry
    if (this.kerryClient) {
      try {
        const kerryRates = await this.kerryClient.getRateQuote(origin, destination, weight, dimensions);
        rates.push(...kerryRates.map(rate => ({
          ...rate,
          provider: 'kerry' as ShippingProvider,
        })));
      } catch (error) {
        console.error('Error getting Kerry rates:', error);
      }
    }

    // Get rates from Flash
    if (this.flashClient) {
      try {
        const flashRates = await this.flashClient.getRateQuote(origin, destination, weight, dimensions);
        rates.push(...flashRates.map(rate => ({
          ...rate,
          provider: 'flash' as ShippingProvider,
        })));
      } catch (error) {
        console.error('Error getting Flash rates:', error);
      }
    }

    // Get rates from Thailand Post
    if (this.thailandPostClient) {
      try {
        const thaiPostRates = await this.thailandPostClient.getRateQuote(origin, destination, weight, dimensions);
        rates.push(...thaiPostRates.map(rate => ({
          ...rate,
          provider: 'thailand-post' as ShippingProvider,
        })));
      } catch (error) {
        console.error('Error getting Thailand Post rates:', error);
      }
    }

    // Cache the rates
    if (rates.length > 0) {
      await this.cacheRates(origin, destination, weight, rates);
    }

    return rates.sort((a, b) => a.price - b.price);
  }

  /**
   * Create shipment with selected provider
   */
  async createShipment(request: ShipmentRequest): Promise<UnifiedShipment> {
    let shipment: UnifiedShipment;

    switch (request.provider) {
      case 'kerry':
        if (!this.kerryClient) {
          throw new Error('Kerry Express client not initialized');
        }
        const kerryShipment = await this.kerryClient.createShipment(request as KerryShipmentRequest);
        shipment = {
          provider: 'kerry',
          trackingNumber: kerryShipment.trackingNumber,
          orderId: request.orderId,
          status: kerryShipment.status,
          estimatedDeliveryDate: kerryShipment.estimatedDeliveryDate,
          labelUrl: kerryShipment.labelUrl,
          metadata: { consignmentNumber: kerryShipment.consignmentNumber },
        };
        break;

      case 'flash':
        if (!this.flashClient) {
          throw new Error('Flash Express client not initialized');
        }
        const flashShipment = await this.flashClient.createShipment(request as FlashShipmentRequest);
        shipment = {
          provider: 'flash',
          trackingNumber: flashShipment.pno,
          orderId: request.orderId,
          status: flashShipment.status,
          estimatedDeliveryDate: flashShipment.estimatedDeliveryDate,
          labelUrl: flashShipment.labelUrl,
          metadata: { pno: flashShipment.pno, sortCode: flashShipment.sortCode },
        };
        break;

      case 'thailand-post':
        if (!this.thailandPostClient) {
          throw new Error('Thailand Post client not initialized');
        }
        const thaiPostShipment = await this.thailandPostClient.createShipment(request as ThailandPostShipmentRequest);
        shipment = {
          provider: 'thailand-post',
          trackingNumber: thaiPostShipment.barcode,
          orderId: request.orderId,
          status: thaiPostShipment.status,
          estimatedDeliveryDate: thaiPostShipment.estimatedDeliveryDate,
          labelUrl: thaiPostShipment.labelUrl,
          metadata: { barcode: thaiPostShipment.barcode },
        };
        break;

      default:
        throw new Error(`Unsupported shipping provider: ${request.provider}`);
    }

    // Save shipment to database
    shipment.createdAt = new Date();
    const savedShipment = await this.saveShipment(shipment);

    // Create tracking history entry
    await this.createTrackingEntry({
      shipmentId: savedShipment.id!,
      status: shipment.status,
      location: 'Origin',
      description: 'Shipment created',
    });

    return savedShipment;
  }

  /**
   * Track shipment
   */
  async trackShipment(provider: ShippingProvider, trackingNumber: string): Promise<UnifiedTrackingInfo> {
    let tracking: UnifiedTrackingInfo;

    switch (provider) {
      case 'kerry':
        if (!this.kerryClient) {
          throw new Error('Kerry Express client not initialized');
        }
        const kerryTracking = await this.kerryClient.trackShipment(trackingNumber);
        tracking = {
          provider: 'kerry',
          trackingNumber: kerryTracking.trackingNumber,
          status: kerryTracking.status,
          statusDescription: kerryTracking.statusDescription,
          statusDate: kerryTracking.statusDate,
          estimatedDeliveryDate: kerryTracking.estimatedDeliveryDate,
          actualDeliveryDate: kerryTracking.actualDeliveryDate,
          recipientName: kerryTracking.recipientName,
          trackingHistory: kerryTracking.trackingHistory,
        };
        break;

      case 'flash':
        if (!this.flashClient) {
          throw new Error('Flash Express client not initialized');
        }
        const flashTracking = await this.flashClient.trackShipment(trackingNumber);
        tracking = {
          provider: 'flash',
          trackingNumber: flashTracking.trackingNumber,
          status: flashTracking.status,
          statusDescription: flashTracking.statusDescription,
          statusDate: flashTracking.statusDate,
          estimatedDeliveryDate: flashTracking.estimatedDeliveryDate,
          actualDeliveryDate: flashTracking.actualDeliveryDate,
          recipientName: flashTracking.recipientName,
          trackingHistory: flashTracking.trackingHistory,
        };
        break;

      case 'thailand-post':
        if (!this.thailandPostClient) {
          throw new Error('Thailand Post client not initialized');
        }
        const thaiPostTracking = await this.thailandPostClient.trackShipment(trackingNumber);
        tracking = {
          provider: 'thailand-post',
          trackingNumber: thaiPostTracking.trackingNumber,
          status: thaiPostTracking.status,
          statusDescription: thaiPostTracking.statusDescription,
          statusDate: thaiPostTracking.statusDate,
          estimatedDeliveryDate: thaiPostTracking.estimatedDeliveryDate,
          actualDeliveryDate: thaiPostTracking.actualDeliveryDate,
          recipientName: thaiPostTracking.recipientName,
          trackingHistory: thaiPostTracking.trackingHistory,
        };
        break;

      default:
        throw new Error(`Unsupported shipping provider: ${provider}`);
    }

    // Update tracking history in database
    const { data: shipment } = await supabase
      .from('shipments')
      .select('id')
      .eq('tracking_number', trackingNumber)
      .eq('provider', provider)
      .single();

    if (shipment && tracking.trackingHistory.length > 0) {
      const latestEvent = tracking.trackingHistory[0];
      await this.createTrackingEntry({
        shipmentId: shipment.id,
        status: latestEvent.status,
        location: latestEvent.location,
        description: latestEvent.description,
      });
    }

    return tracking;
  }

  /**
   * Cancel shipment
   */
  async cancelShipment(provider: ShippingProvider, trackingNumber: string, reason?: string): Promise<boolean> {
    let success: boolean;

    switch (provider) {
      case 'kerry':
        if (!this.kerryClient) {
          throw new Error('Kerry Express client not initialized');
        }
        success = await this.kerryClient.cancelShipment(trackingNumber, reason);
        break;

      case 'flash':
        if (!this.flashClient) {
          throw new Error('Flash Express client not initialized');
        }
        success = await this.flashClient.cancelShipment(trackingNumber, reason);
        break;

      case 'thailand-post':
        if (!this.thailandPostClient) {
          throw new Error('Thailand Post client not initialized');
        }
        success = await this.thailandPostClient.cancelShipment(trackingNumber, reason);
        break;

      default:
        throw new Error(`Unsupported shipping provider: ${provider}`);
    }

    if (success) {
      // Update shipment status in database
      await supabase
        .from('shipments')
        .update({ status: 'cancelled', updated_at: new Date() })
        .eq('tracking_number', trackingNumber)
        .eq('provider', provider);

      // Add tracking entry
      const { data: shipment } = await supabase
        .from('shipments')
        .select('id')
        .eq('tracking_number', trackingNumber)
        .eq('provider', provider)
        .single();

      if (shipment) {
        await this.createTrackingEntry({
          shipmentId: shipment.id,
          status: 'cancelled',
          location: 'System',
          description: reason || 'Shipment cancelled',
        });
      }
    }

    return success;
  }

  /**
   * Get shipping label
   */
  async getShippingLabel(provider: ShippingProvider, trackingNumber: string): Promise<string> {
    switch (provider) {
      case 'kerry':
        if (!this.kerryClient) {
          throw new Error('Kerry Express client not initialized');
        }
        return await this.kerryClient.getShippingLabel(trackingNumber);

      case 'flash':
        if (!this.flashClient) {
          throw new Error('Flash Express client not initialized');
        }
        return await this.flashClient.getShippingLabel(trackingNumber);

      case 'thailand-post':
        if (!this.thailandPostClient) {
          throw new Error('Thailand Post client not initialized');
        }
        return await this.thailandPostClient.getShippingLabel(trackingNumber);

      default:
        throw new Error(`Unsupported shipping provider: ${provider}`);
    }
  }

  /**
   * Get available providers
   */
  async getAvailableProviders(): Promise<Array<{ id: string; name: string; enabled: boolean }>> {
    const { data: providers } = await supabase
      .from('shipping_providers')
      .select('*')
      .eq('enabled', true);

    return providers || [];
  }

  /**
   * Save shipment to database
   */
  private async saveShipment(shipment: UnifiedShipment): Promise<UnifiedShipment> {
    const { data, error } = await supabase
      .from('shipments')
      .insert({
        provider: shipment.provider,
        tracking_number: shipment.trackingNumber,
        order_id: shipment.orderId,
        status: shipment.status,
        estimated_delivery_date: shipment.estimatedDeliveryDate,
        label_url: shipment.labelUrl,
        metadata: shipment.metadata,
        created_at: shipment.createdAt,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving shipment:', error);
      throw error;
    }

    return {
      id: data.id,
      provider: data.provider,
      trackingNumber: data.tracking_number,
      orderId: data.order_id,
      status: data.status,
      estimatedDeliveryDate: data.estimated_delivery_date,
      labelUrl: data.label_url,
      metadata: data.metadata,
      createdAt: data.created_at,
    };
  }

  /**
   * Create tracking history entry
   */
  private async createTrackingEntry(entry: {
    shipmentId: string;
    status: string;
    location: string;
    description: string;
  }): Promise<void> {
    await supabase.from('shipment_tracking').insert({
      shipment_id: entry.shipmentId,
      status: entry.status,
      location: entry.location,
      description: entry.description,
      timestamp: new Date(),
    });
  }

  /**
   * Get cached rates
   */
  private async getCachedRates(
    origin: string,
    destination: string,
    weight: number
  ): Promise<UnifiedRateQuote[] | null> {
    const { data } = await supabase
      .from('shipping_rates_cache')
      .select('rates')
      .eq('origin_postal_code', origin)
      .eq('destination_postal_code', destination)
      .eq('weight', weight)
      .gte('expires_at', new Date().toISOString())
      .single();

    return data?.rates || null;
  }

  /**
   * Cache rates
   */
  private async cacheRates(
    origin: string,
    destination: string,
    weight: number,
    rates: UnifiedRateQuote[]
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Cache for 24 hours

    await supabase.from('shipping_rates_cache').insert({
      origin_postal_code: origin,
      destination_postal_code: destination,
      weight,
      rates,
      expires_at: expiresAt,
    });
  }

  /**
   * Bulk create shipments
   */
  async bulkCreateShipments(requests: ShipmentRequest[]): Promise<UnifiedShipment[]> {
    const shipments: UnifiedShipment[] = [];

    for (const request of requests) {
      try {
        const shipment = await this.createShipment(request);
        shipments.push(shipment);
      } catch (error) {
        console.error(`Error creating shipment for order ${request.orderId}:`, error);
      }
    }

    return shipments;
  }

  /**
   * Get shipment by order ID
   */
  async getShipmentByOrderId(orderId: string): Promise<UnifiedShipment | null> {
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      provider: data.provider,
      trackingNumber: data.tracking_number,
      orderId: data.order_id,
      status: data.status,
      estimatedDeliveryDate: data.estimated_delivery_date,
      labelUrl: data.label_url,
      metadata: data.metadata,
      createdAt: data.created_at,
    };
  }
}

// Export singleton instance
let shippingManager: ShippingManager | null = null;

export function getShippingManager(): ShippingManager {
  if (!shippingManager) {
    const config: ShippingConfig = {};

    if (process.env.KERRY_API_KEY) {
      config.kerry = {
        apiKey: process.env.KERRY_API_KEY,
        environment: (process.env.KERRY_ENVIRONMENT as 'production' | 'sandbox') || 'production',
      };
    }

    if (process.env.FLASH_API_KEY && process.env.FLASH_MERCHANT_ID) {
      config.flash = {
        apiKey: process.env.FLASH_API_KEY,
        merchantId: process.env.FLASH_MERCHANT_ID,
        environment: (process.env.FLASH_ENVIRONMENT as 'production' | 'sandbox') || 'production',
      };
    }

    if (process.env.THAILAND_POST_API_KEY) {
      config.thailandPost = {
        apiToken: process.env.THAILAND_POST_API_KEY,
        environment: (process.env.THAILAND_POST_ENVIRONMENT as 'production' | 'sandbox') || 'production',
      };
    }

    shippingManager = new ShippingManager(config);
  }

  return shippingManager;
}
