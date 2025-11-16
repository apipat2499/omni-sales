/**
 * Kerry Express Thailand Shipping Integration
 * API Documentation: https://api.kerryexpress.co.th/
 */

export interface KerryConfig {
  apiKey: string;
  apiUrl?: string;
  environment?: 'production' | 'sandbox';
}

export interface KerryAddress {
  name: string;
  phone: string;
  address: string;
  district: string;
  province: string;
  postalCode: string;
  country?: string;
}

export interface KerryShipmentRequest {
  senderAddress: KerryAddress;
  recipientAddress: KerryAddress;
  parcel: {
    weight: number; // kg
    width?: number; // cm
    height?: number; // cm
    length?: number; // cm
    codAmount?: number; // Cash on Delivery
    insuranceValue?: number;
    description?: string;
  };
  serviceType?: 'standard' | 'express' | 'same_day';
  referenceNumber?: string;
}

export interface KerryShipment {
  trackingNumber: string;
  consignmentNumber: string;
  status: string;
  estimatedDeliveryDate?: string;
  labelUrl?: string;
}

export interface KerryRateQuote {
  serviceType: string;
  serviceName: string;
  price: number;
  currency: string;
  estimatedDays: number;
  cutoffTime?: string;
}

export interface KerryTrackingInfo {
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

export class KerryExpressClient {
  private apiKey: string;
  private apiUrl: string;
  private environment: 'production' | 'sandbox';

  constructor(config: KerryConfig) {
    this.apiKey = config.apiKey;
    this.environment = config.environment || 'production';
    this.apiUrl = config.apiUrl || (
      this.environment === 'production'
        ? 'https://api.kerryexpress.co.th/v1'
        : 'https://sandbox-api.kerryexpress.co.th/v1'
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
  ): Promise<KerryRateQuote[]> {
    try {
      const response = await fetch(`${this.apiUrl}/rates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          origin_postal_code: origin,
          destination_postal_code: destination,
          weight,
          dimensions,
        }),
      });

      if (!response.ok) {
        throw new Error(`Kerry API error: ${response.statusText}`);
      }

      const data = await response.json();

      return data.rates?.map((rate: any) => ({
        serviceType: rate.service_code,
        serviceName: rate.service_name,
        price: parseFloat(rate.total_charge),
        currency: 'THB',
        estimatedDays: rate.estimated_delivery_days || 1,
        cutoffTime: rate.cutoff_time,
      })) || [];
    } catch (error) {
      console.error('Error getting Kerry rate quote:', error);
      throw error;
    }
  }

  /**
   * Create shipment
   */
  async createShipment(shipmentData: KerryShipmentRequest): Promise<KerryShipment> {
    try {
      const response = await fetch(`${this.apiUrl}/shipments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          sender: {
            name: shipmentData.senderAddress.name,
            phone: shipmentData.senderAddress.phone,
            address: shipmentData.senderAddress.address,
            district: shipmentData.senderAddress.district,
            province: shipmentData.senderAddress.province,
            postal_code: shipmentData.senderAddress.postalCode,
            country: shipmentData.senderAddress.country || 'TH',
          },
          recipient: {
            name: shipmentData.recipientAddress.name,
            phone: shipmentData.recipientAddress.phone,
            address: shipmentData.recipientAddress.address,
            district: shipmentData.recipientAddress.district,
            province: shipmentData.recipientAddress.province,
            postal_code: shipmentData.recipientAddress.postalCode,
            country: shipmentData.recipientAddress.country || 'TH',
          },
          parcel: {
            weight: shipmentData.parcel.weight,
            width: shipmentData.parcel.width,
            height: shipmentData.parcel.height,
            length: shipmentData.parcel.length,
            cod_amount: shipmentData.parcel.codAmount,
            insurance_value: shipmentData.parcel.insuranceValue,
            description: shipmentData.parcel.description,
          },
          service_type: shipmentData.serviceType || 'standard',
          reference_number: shipmentData.referenceNumber,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Kerry API error: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();

      return {
        trackingNumber: data.tracking_number,
        consignmentNumber: data.consignment_number,
        status: data.status || 'created',
        estimatedDeliveryDate: data.estimated_delivery_date,
        labelUrl: data.label_url,
      };
    } catch (error) {
      console.error('Error creating Kerry shipment:', error);
      throw error;
    }
  }

  /**
   * Track shipment
   */
  async trackShipment(trackingNumber: string): Promise<KerryTrackingInfo> {
    try {
      const response = await fetch(`${this.apiUrl}/tracking/${trackingNumber}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Kerry API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        trackingNumber: data.tracking_number,
        status: data.status_code,
        statusDescription: data.status_description,
        statusDate: data.status_date,
        estimatedDeliveryDate: data.estimated_delivery_date,
        actualDeliveryDate: data.actual_delivery_date,
        recipientName: data.recipient_name,
        trackingHistory: data.tracking_history?.map((event: any) => ({
          date: event.date,
          time: event.time,
          status: event.status,
          location: event.location,
          description: event.description,
        })) || [],
      };
    } catch (error) {
      console.error('Error tracking Kerry shipment:', error);
      throw error;
    }
  }

  /**
   * Cancel shipment
   */
  async cancelShipment(trackingNumber: string, reason?: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/shipments/${trackingNumber}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          reason: reason || 'Customer request',
        }),
      });

      if (!response.ok) {
        throw new Error(`Kerry API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.success || false;
    } catch (error) {
      console.error('Error cancelling Kerry shipment:', error);
      throw error;
    }
  }

  /**
   * Get shipping label PDF
   */
  async getShippingLabel(trackingNumber: string): Promise<string> {
    try {
      const response = await fetch(`${this.apiUrl}/labels/${trackingNumber}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/pdf',
        },
      });

      if (!response.ok) {
        throw new Error(`Kerry API error: ${response.statusText}`);
      }

      const blob = await response.blob();
      const base64 = await this.blobToBase64(blob);
      return base64;
    } catch (error) {
      console.error('Error getting Kerry shipping label:', error);
      throw error;
    }
  }

  /**
   * Validate address
   */
  async validateAddress(address: KerryAddress): Promise<{ valid: boolean; suggestions?: KerryAddress[] }> {
    try {
      const response = await fetch(`${this.apiUrl}/address/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          address: address.address,
          district: address.district,
          province: address.province,
          postal_code: address.postalCode,
        }),
      });

      if (!response.ok) {
        throw new Error(`Kerry API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        valid: data.valid || false,
        suggestions: data.suggestions,
      };
    } catch (error) {
      console.error('Error validating Kerry address:', error);
      return { valid: false };
    }
  }

  /**
   * Helper: Convert blob to base64
   */
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

// Export singleton instance
let kerryClient: KerryExpressClient | null = null;

export function getKerryClient(config?: KerryConfig): KerryExpressClient {
  if (!kerryClient && config) {
    kerryClient = new KerryExpressClient(config);
  }
  if (!kerryClient) {
    throw new Error('Kerry Express client not initialized');
  }
  return kerryClient;
}

export function initKerryClient(apiKey: string, environment?: 'production' | 'sandbox'): KerryExpressClient {
  kerryClient = new KerryExpressClient({ apiKey, environment });
  return kerryClient;
}
