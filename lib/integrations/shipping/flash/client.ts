/**
 * Flash Express Thailand Shipping Integration
 * API Documentation: https://developer.flashexpress.com/
 */

export interface FlashConfig {
  apiKey: string;
  merchantId: string;
  apiUrl?: string;
  environment?: 'production' | 'sandbox';
}

export interface FlashAddress {
  name: string;
  phone: string;
  address: string;
  district: string;
  province: string;
  postalCode: string;
  country?: string;
}

export interface FlashShipmentRequest {
  senderAddress: FlashAddress;
  recipientAddress: FlashAddress;
  parcel: {
    weight: number; // kg
    width?: number; // cm
    height?: number; // cm
    length?: number; // cm
    codAmount?: number;
    insuranceValue?: number;
    description?: string;
  };
  serviceType?: 'standard' | 'express' | 'economy';
  referenceNumber?: string;
}

export interface FlashShipment {
  trackingNumber: string;
  pno: string; // Parcel Number
  status: string;
  estimatedDeliveryDate?: string;
  labelUrl?: string;
  sortCode?: string;
}

export interface FlashRateQuote {
  serviceType: string;
  serviceName: string;
  price: number;
  currency: string;
  estimatedDays: number;
}

export interface FlashTrackingInfo {
  trackingNumber: string;
  pno: string;
  status: string;
  statusDescription: string;
  statusDate: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  recipientName?: string;
  podImageUrl?: string; // Proof of Delivery
  trackingHistory: Array<{
    date: string;
    time: string;
    status: string;
    location: string;
    description: string;
    scanType?: string;
  }>;
}

export class FlashExpressClient {
  private apiKey: string;
  private merchantId: string;
  private apiUrl: string;
  private environment: 'production' | 'sandbox';

  constructor(config: FlashConfig) {
    this.apiKey = config.apiKey;
    this.merchantId = config.merchantId;
    this.environment = config.environment || 'production';
    this.apiUrl = config.apiUrl || (
      this.environment === 'production'
        ? 'https://api.flashexpress.com/open/v1'
        : 'https://sandbox-api.flashexpress.com/open/v1'
    );
  }

  /**
   * Generate API signature (Flash requires HMAC signature)
   */
  private async generateSignature(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.apiKey);
    const messageData = encoder.encode(data);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Get shipping rate quotes
   */
  async getRateQuote(
    origin: string,
    destination: string,
    weight: number,
    dimensions?: { width: number; height: number; length: number }
  ): Promise<FlashRateQuote[]> {
    try {
      const requestData = {
        mchId: this.merchantId,
        srcPostalCode: origin,
        dstPostalCode: destination,
        weight,
        dimensions,
      };

      const dataString = JSON.stringify(requestData);
      const signature = await this.generateSignature(dataString);

      const response = await fetch(`${this.apiUrl}/rates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'API-KEY': this.apiKey,
          'SIGNATURE': signature,
        },
        body: dataString,
      });

      if (!response.ok) {
        throw new Error(`Flash API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.code !== 1) {
        throw new Error(`Flash API error: ${data.message}`);
      }

      return data.data?.map((rate: any) => ({
        serviceType: rate.serviceCode,
        serviceName: rate.serviceName,
        price: parseFloat(rate.price),
        currency: 'THB',
        estimatedDays: rate.estimatedDays || 1,
      })) || [];
    } catch (error) {
      console.error('Error getting Flash rate quote:', error);
      throw error;
    }
  }

  /**
   * Create shipment
   */
  async createShipment(shipmentData: FlashShipmentRequest): Promise<FlashShipment> {
    try {
      const requestData = {
        mchId: this.merchantId,
        outTradeNo: shipmentData.referenceNumber || `FLASH-${Date.now()}`,
        srcName: shipmentData.senderAddress.name,
        srcPhone: shipmentData.senderAddress.phone,
        srcProvinceName: shipmentData.senderAddress.province,
        srcCityName: shipmentData.senderAddress.district,
        srcDistrictName: shipmentData.senderAddress.district,
        srcPostalCode: shipmentData.senderAddress.postalCode,
        srcDetailAddress: shipmentData.senderAddress.address,
        dstName: shipmentData.recipientAddress.name,
        dstPhone: shipmentData.recipientAddress.phone,
        dstProvinceName: shipmentData.recipientAddress.province,
        dstCityName: shipmentData.recipientAddress.district,
        dstDistrictName: shipmentData.recipientAddress.district,
        dstPostalCode: shipmentData.recipientAddress.postalCode,
        dstDetailAddress: shipmentData.recipientAddress.address,
        weight: shipmentData.parcel.weight,
        width: shipmentData.parcel.width,
        height: shipmentData.parcel.height,
        length: shipmentData.parcel.length,
        codAmount: shipmentData.parcel.codAmount,
        insuredValue: shipmentData.parcel.insuranceValue,
        itemName: shipmentData.parcel.description || 'Goods',
        expressCategory: this.mapServiceType(shipmentData.serviceType),
      };

      const dataString = JSON.stringify(requestData);
      const signature = await this.generateSignature(dataString);

      const response = await fetch(`${this.apiUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'API-KEY': this.apiKey,
          'SIGNATURE': signature,
        },
        body: dataString,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Flash API error: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();

      if (data.code !== 1) {
        throw new Error(`Flash API error: ${data.message}`);
      }

      return {
        trackingNumber: data.data.mchId,
        pno: data.data.pno,
        status: data.data.state || 'created',
        estimatedDeliveryDate: data.data.estimatedDeliveryDate,
        labelUrl: data.data.expressImage,
        sortCode: data.data.sortCode,
      };
    } catch (error) {
      console.error('Error creating Flash shipment:', error);
      throw error;
    }
  }

  /**
   * Track shipment
   */
  async trackShipment(pno: string): Promise<FlashTrackingInfo> {
    try {
      const requestData = {
        mchId: this.merchantId,
        pno,
      };

      const dataString = JSON.stringify(requestData);
      const signature = await this.generateSignature(dataString);

      const response = await fetch(`${this.apiUrl}/tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'API-KEY': this.apiKey,
          'SIGNATURE': signature,
        },
        body: dataString,
      });

      if (!response.ok) {
        throw new Error(`Flash API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.code !== 1) {
        throw new Error(`Flash API error: ${data.message}`);
      }

      const trackData = data.data;

      return {
        trackingNumber: trackData.outTradeNo,
        pno: trackData.pno,
        status: trackData.state,
        statusDescription: trackData.stateText,
        statusDate: trackData.stateDate,
        estimatedDeliveryDate: trackData.estimatedDeliveryDate,
        actualDeliveryDate: trackData.signedDate,
        recipientName: trackData.signedName,
        podImageUrl: trackData.signedImage,
        trackingHistory: trackData.routes?.map((route: any) => ({
          date: route.scanDate,
          time: route.scanTime,
          status: route.status,
          location: route.location,
          description: route.description,
          scanType: route.scanType,
        })) || [],
      };
    } catch (error) {
      console.error('Error tracking Flash shipment:', error);
      throw error;
    }
  }

  /**
   * Cancel shipment
   */
  async cancelShipment(pno: string, reason?: string): Promise<boolean> {
    try {
      const requestData = {
        mchId: this.merchantId,
        pno,
        cancelReason: reason || 'Customer request',
      };

      const dataString = JSON.stringify(requestData);
      const signature = await this.generateSignature(dataString);

      const response = await fetch(`${this.apiUrl}/orders/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'API-KEY': this.apiKey,
          'SIGNATURE': signature,
        },
        body: dataString,
      });

      if (!response.ok) {
        throw new Error(`Flash API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.code === 1;
    } catch (error) {
      console.error('Error cancelling Flash shipment:', error);
      throw error;
    }
  }

  /**
   * Get shipping label PDF
   */
  async getShippingLabel(pno: string): Promise<string> {
    try {
      const requestData = {
        mchId: this.merchantId,
        pno,
      };

      const dataString = JSON.stringify(requestData);
      const signature = await this.generateSignature(dataString);

      const response = await fetch(`${this.apiUrl}/labels/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'API-KEY': this.apiKey,
          'SIGNATURE': signature,
        },
        body: dataString,
      });

      if (!response.ok) {
        throw new Error(`Flash API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.code !== 1) {
        throw new Error(`Flash API error: ${data.message}`);
      }

      return data.data.pdfUrl;
    } catch (error) {
      console.error('Error getting Flash shipping label:', error);
      throw error;
    }
  }

  /**
   * Map service type to Flash Express category
   */
  private mapServiceType(serviceType?: string): number {
    switch (serviceType) {
      case 'express':
        return 1; // Flash Express
      case 'standard':
        return 2; // Flash Standard
      case 'economy':
        return 3; // Flash Economy
      default:
        return 2; // Default to standard
    }
  }
}

// Export singleton instance
let flashClient: FlashExpressClient | null = null;

export function getFlashClient(config?: FlashConfig): FlashExpressClient {
  if (!flashClient && config) {
    flashClient = new FlashExpressClient(config);
  }
  if (!flashClient) {
    throw new Error('Flash Express client not initialized');
  }
  return flashClient;
}

export function initFlashClient(
  apiKey: string,
  merchantId: string,
  environment?: 'production' | 'sandbox'
): FlashExpressClient {
  flashClient = new FlashExpressClient({ apiKey, merchantId, environment });
  return flashClient;
}
