/**
 * Lazada API Integration
 * Documentation: https://open.lazada.com/
 */

import crypto from 'crypto';

interface LazadaConfig {
  appKey: string;
  appSecret: string;
  accessToken: string;
  refreshToken: string;
}

interface LazadaOrder {
  orderId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  items: LazadaOrderItem[];
  shippingAddress: string;
}

interface LazadaOrderItem {
  itemId: string;
  itemName: string;
  quantity: number;
  price: number;
  sku?: string;
}

class LazadaAPI {
  private appKey: string;
  private appSecret: string;
  private accessToken: string;
  private baseUrl = 'https://api.lazada.co.th/rest/api/2.0';

  constructor(config: LazadaConfig) {
    this.appKey = config.appKey;
    this.appSecret = config.appSecret;
    this.accessToken = config.accessToken;
  }

  /**
   * Generate request signature for Lazada API
   */
  private generateSignature(path: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {} as Record<string, any>);

    const queryString = Object.entries(sortedParams)
      .map(([key, value]) => `${key}${value}`)
      .join('');

    return crypto
      .createHmac('sha256', this.appSecret)
      .update(queryString)
      .digest('hex');
  }

  /**
   * Get orders from Lazada seller account
   * Note: Requires actual Lazada API credentials to work
   */
  async getOrders(
    limit: number = 100,
    offset: number = 0
  ): Promise<LazadaOrder[]> {
    try {
      const timestamp = Date.now();
      const params = {
        app_key: this.appKey,
        timestamp,
        access_token: this.accessToken,
        limit,
        offset,
      };

      const sign = this.generateSignature('/order/get', params);
      params['sign'] = sign as any;

      const queryString = new URLSearchParams(
        params as Record<string, string>
      ).toString();
      const url = `${this.baseUrl}/order/get?${queryString}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Source': 'omni-sales',
        },
      });

      if (!response.ok) {
        throw new Error(`Lazada API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformOrders(data);
    } catch (error) {
      console.error('Error fetching Lazada orders:', error);
      throw error;
    }
  }

  /**
   * Transform Lazada order format to internal format
   */
  private transformOrders(lazadaData: any): LazadaOrder[] {
    // This is a placeholder transformation
    // Actual implementation depends on Lazada API response structure
    return [];
  }

  /**
   * Refresh access token when expired
   */
  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      const timestamp = Date.now();
      const params = {
        app_key: this.appKey,
        timestamp,
        refresh_token: refreshToken,
      };

      const sign = this.generateSignature('/auth/token/refresh', params);
      params['sign'] = sign as any;

      const response = await fetch(
        `${this.baseUrl}/auth/token/refresh`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to refresh access token');
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error refreshing Lazada token:', error);
      throw error;
    }
  }
}

export function createLazadaClient(config: LazadaConfig): LazadaAPI {
  return new LazadaAPI(config);
}
