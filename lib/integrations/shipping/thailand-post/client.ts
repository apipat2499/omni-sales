/**
 * Thailand Post Shipping Integration
 * API Documentation: https://trackapi.thailandpost.co.th/
 */

export interface ThailandPostConfig {
  apiToken: string;
  apiUrl?: string;
  environment?: 'production' | 'sandbox';
}

export interface ThailandPostAddress {
  name: string;
  phone: string;
  address: string;
  district: string;
  province: string;
  postalCode: string;
}

export interface ThailandPostShipmentRequest {
  senderAddress: ThailandPostAddress;
  recipientAddress: ThailandPostAddress;
  parcel: {
    weight: number; // kg
    width?: number; // cm
    height?: number; // cm
    length?: number; // cm
    codAmount?: number;
    insuranceValue?: number;
    description?: string;
  };
  serviceType?: 'ems' | 'registered' | 'parcel' | 'express';
  referenceNumber?: string;
}

export interface ThailandPostShipment {
  trackingNumber: string;
  barcode: string;
  status: string;
  estimatedDeliveryDate?: string;
  labelUrl?: string;
}

export interface ThailandPostRateQuote {
  serviceType: string;
  serviceName: string;
  price: number;
  currency: string;
  estimatedDays: number;
}

export interface ThailandPostTrackingInfo {
  trackingNumber: string;
  barcode: string;
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
    postcode?: string;
  }>;
}

export class ThailandPostClient {
  private apiToken: string;
  private apiUrl: string;
  private environment: 'production' | 'sandbox';

  constructor(config: ThailandPostConfig) {
    this.apiToken = config.apiToken;
    this.environment = config.environment || 'production';
    this.apiUrl = config.apiUrl || (
      this.environment === 'production'
        ? 'https://trackapi.thailandpost.co.th/post/api/v1'
        : 'https://sandbox-trackapi.thailandpost.co.th/post/api/v1'
    );
  }

  /**
   * Get shipping rate quotes
   */
  async getRateQuote(
    origin: string,
    destination: string,
    weight: number,
    dimensions?: { width: number; height: number; length: number }
  ): Promise<ThailandPostRateQuote[]> {
    try {
      const response = await fetch(`${this.apiUrl}/calculate/fee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${this.apiToken}`,
        },
        body: JSON.stringify({
          origin_postcode: origin,
          destination_postcode: destination,
          weight,
          width: dimensions?.width,
          height: dimensions?.height,
          length: dimensions?.length,
        }),
      });

      if (!response.ok) {
        throw new Error(`Thailand Post API error: ${response.statusText}`);
      }

      const data = await response.json();

      return data.services?.map((service: any) => ({
        serviceType: service.service_code,
        serviceName: service.service_name,
        price: parseFloat(service.fee),
        currency: 'THB',
        estimatedDays: service.delivery_days || 3,
      })) || [];
    } catch (error) {
      console.error('Error getting Thailand Post rate quote:', error);
      throw error;
    }
  }

  /**
   * Create shipment (Book collection)
   */
  async createShipment(shipmentData: ThailandPostShipmentRequest): Promise<ThailandPostShipment> {
    try {
      const response = await fetch(`${this.apiUrl}/booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${this.apiToken}`,
        },
        body: JSON.stringify({
          sender: {
            name: shipmentData.senderAddress.name,
            phone: shipmentData.senderAddress.phone,
            address: shipmentData.senderAddress.address,
            district: shipmentData.senderAddress.district,
            province: shipmentData.senderAddress.province,
            postcode: shipmentData.senderAddress.postalCode,
          },
          recipient: {
            name: shipmentData.recipientAddress.name,
            phone: shipmentData.recipientAddress.phone,
            address: shipmentData.recipientAddress.address,
            district: shipmentData.recipientAddress.district,
            province: shipmentData.recipientAddress.province,
            postcode: shipmentData.recipientAddress.postalCode,
          },
          parcel: {
            weight: shipmentData.parcel.weight,
            width: shipmentData.parcel.width,
            height: shipmentData.parcel.height,
            length: shipmentData.parcel.length,
            cod_amount: shipmentData.parcel.codAmount,
            insured_value: shipmentData.parcel.insuranceValue,
            detail: shipmentData.parcel.description || 'General Goods',
          },
          service_type: this.mapServiceType(shipmentData.serviceType),
          reference_no: shipmentData.referenceNumber,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Thailand Post API error: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();

      return {
        trackingNumber: data.barcode,
        barcode: data.barcode,
        status: data.status || 'created',
        estimatedDeliveryDate: data.estimated_delivery,
        labelUrl: data.label_url,
      };
    } catch (error) {
      console.error('Error creating Thailand Post shipment:', error);
      throw error;
    }
  }

  /**
   * Track shipment
   */
  async trackShipment(barcode: string): Promise<ThailandPostTrackingInfo> {
    try {
      const response = await fetch(`${this.apiUrl}/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${this.apiToken}`,
        },
        body: JSON.stringify({
          status: 'all',
          language: 'EN',
          barcode: barcode,
        }),
      });

      if (!response.ok) {
        throw new Error(`Thailand Post API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.response || !data.response.items || data.response.items.length === 0) {
        throw new Error('Tracking information not found');
      }

      const trackData = data.response.items[0];

      return {
        trackingNumber: trackData.barcode,
        barcode: trackData.barcode,
        status: trackData.status,
        statusDescription: trackData.status_description,
        statusDate: trackData.status_date,
        estimatedDeliveryDate: trackData.estimated_delivery_date,
        actualDeliveryDate: trackData.delivery_date,
        recipientName: trackData.receiver_name,
        trackingHistory: trackData.track_items?.map((item: any) => ({
          date: item.status_date,
          time: item.status_time,
          status: item.status,
          location: item.location,
          description: item.status_description,
          postcode: item.postcode,
        })) || [],
      };
    } catch (error) {
      console.error('Error tracking Thailand Post shipment:', error);
      throw error;
    }
  }

  /**
   * Track multiple shipments
   */
  async trackMultipleShipments(barcodes: string[]): Promise<ThailandPostTrackingInfo[]> {
    try {
      const response = await fetch(`${this.apiUrl}/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${this.apiToken}`,
        },
        body: JSON.stringify({
          status: 'all',
          language: 'EN',
          barcode: barcodes.join(','),
        }),
      });

      if (!response.ok) {
        throw new Error(`Thailand Post API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.response || !data.response.items) {
        return [];
      }

      return data.response.items.map((trackData: any) => ({
        trackingNumber: trackData.barcode,
        barcode: trackData.barcode,
        status: trackData.status,
        statusDescription: trackData.status_description,
        statusDate: trackData.status_date,
        estimatedDeliveryDate: trackData.estimated_delivery_date,
        actualDeliveryDate: trackData.delivery_date,
        recipientName: trackData.receiver_name,
        trackingHistory: trackData.track_items?.map((item: any) => ({
          date: item.status_date,
          time: item.status_time,
          status: item.status,
          location: item.location,
          description: item.status_description,
          postcode: item.postcode,
        })) || [],
      }));
    } catch (error) {
      console.error('Error tracking multiple Thailand Post shipments:', error);
      throw error;
    }
  }

  /**
   * Cancel shipment (Not all services support cancellation)
   */
  async cancelShipment(barcode: string, reason?: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${this.apiToken}`,
        },
        body: JSON.stringify({
          barcode,
          cancel_reason: reason || 'Customer request',
        }),
      });

      if (!response.ok) {
        throw new Error(`Thailand Post API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.status === 'success';
    } catch (error) {
      console.error('Error cancelling Thailand Post shipment:', error);
      return false;
    }
  }

  /**
   * Get shipping label
   */
  async getShippingLabel(barcode: string): Promise<string> {
    try {
      const response = await fetch(`${this.apiUrl}/label/${barcode}`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${this.apiToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Thailand Post API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.label_url || '';
    } catch (error) {
      console.error('Error getting Thailand Post label:', error);
      throw error;
    }
  }

  /**
   * Verify postal code
   */
  async verifyPostalCode(postalCode: string): Promise<{
    valid: boolean;
    province?: string;
    district?: string;
    subDistrict?: string;
  }> {
    try {
      const response = await fetch(`${this.apiUrl}/postcode/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${this.apiToken}`,
        },
        body: JSON.stringify({
          postcode: postalCode,
        }),
      });

      if (!response.ok) {
        return { valid: false };
      }

      const data = await response.json();

      return {
        valid: data.valid || false,
        province: data.province,
        district: data.district,
        subDistrict: data.sub_district,
      };
    } catch (error) {
      console.error('Error verifying Thailand Post postal code:', error);
      return { valid: false };
    }
  }

  /**
   * Map service type to Thailand Post service code
   */
  private mapServiceType(serviceType?: string): string {
    switch (serviceType) {
      case 'ems':
        return 'EMS';
      case 'registered':
        return 'REGISTERED';
      case 'parcel':
        return 'PARCEL';
      case 'express':
        return 'EXPRESS';
      default:
        return 'REGISTERED';
    }
  }
}

// Export singleton instance
let thailandPostClient: ThailandPostClient | null = null;

export function getThailandPostClient(config?: ThailandPostConfig): ThailandPostClient {
  if (!thailandPostClient && config) {
    thailandPostClient = new ThailandPostClient(config);
  }
  if (!thailandPostClient) {
    throw new Error('Thailand Post client not initialized');
  }
  return thailandPostClient;
}

export function initThailandPostClient(
  apiToken: string,
  environment?: 'production' | 'sandbox'
): ThailandPostClient {
  thailandPostClient = new ThailandPostClient({ apiToken, environment });
  return thailandPostClient;
}
