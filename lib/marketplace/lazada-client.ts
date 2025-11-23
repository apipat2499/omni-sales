import * as crypto from 'crypto';

export interface LazadaOrder {
  orderId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  orderStatus: string;
  paymentStatus: string;
  totalAmount: number;
  items?: Array<{ productId: string; productName: string; quantity: number; price: number }>;
  shippingAddress?: { address: string; city: string; zip: string };
}

/**
 * Lazada Open Platform API Client
 */
export class LazadaClient {
  private appKey: string;
  private appSecret: string;
  private baseUrl = 'https://api.lazada.com.th/rest/';
  private regionUrl = 'https://api.lazada.com.th/rest/';

  constructor(appKey: string, appSecret: string) {
    this.appKey = appKey;
    this.appSecret = appSecret;
  }

  /**
   * Generate request signature for Lazada API
   */
  private generateSignature(path: string, params: Record<string, any>): string {
    const query = new URLSearchParams();

    // Add all parameters in sorted order
    Object.keys(params)
      .sort()
      .forEach((key) => {
        if (params[key] !== undefined) {
          query.append(key, String(params[key]));
        }
      });

    const baseString = `${path}?${query.toString()}`;
    const signature = crypto
      .createHmac('sha256', this.appSecret)
      .update(baseString)
      .digest('hex');

    return signature.toUpperCase();
  }

  /**
   * Fetch orders from Lazada
   */
  async getOrders(fromDate?: number, toDate?: number, limit = 100): Promise<LazadaOrder[]> {
    try {
      const path = 'order/orders/get';
      const timestamp = Date.now();

      const params: Record<string, any> = {
        app_key: this.appKey,
        timestamp,
        sign_method: 'sha256',
      };

      if (fromDate) params.created_after = fromDate;
      if (toDate) params.created_before = toDate;
      params.limit = limit;

      const signature = this.generateSignature(`/${path}`, params);
      params.sign = signature;

      const query = new URLSearchParams(params);
      const url = `${this.baseUrl}${path}?${query.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!response.ok) {
        throw new Error(`Lazada API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.code !== '0') {
        throw new Error(`Lazada API error: ${data.message}`);
      }

      // Transform Lazada orders to internal format
      return (data.data?.orders || []).map((order: any) => ({
        orderId: order.order_id,
        customerName: order.customer_first_name + ' ' + (order.customer_last_name || ''),
        customerPhone: order.recipient_phone,
        orderStatus: order.statuses?.[0] || 'pending',
        paymentStatus: order.payment_method || 'unknown',
        totalAmount: parseFloat(order.price) || 0,
        items: order.order_items?.map((item: any) => ({
          productId: item.sku,
          productName: item.name,
          quantity: item.quantity,
          price: parseFloat(item.price) || 0,
        })),
        shippingAddress: {
          address: order.address_shipping || '',
          city: order.city_shipping || '',
          zip: order.zip_code || '',
        },
      }));
    } catch (error) {
      console.error('Error fetching Lazada orders:', error);
      return [];
    }
  }

  /**
   * Get specific order details
   */
  async getOrderDetails(orderId: string): Promise<LazadaOrder | null> {
    try {
      const path = 'order/order/get';
      const timestamp = Date.now();

      const params: Record<string, any> = {
        app_key: this.appKey,
        timestamp,
        sign_method: 'sha256',
        order_id: orderId,
      };

      const signature = this.generateSignature(`/${path}`, params);
      params.sign = signature;

      const query = new URLSearchParams(params);
      const url = `${this.baseUrl}${path}?${query.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!response.ok) return null;

      const data = await response.json();

      if (data.code !== '0' || !data.data) return null;

      const order = data.data;

      return {
        orderId: order.order_id,
        customerName: order.customer_first_name + ' ' + (order.customer_last_name || ''),
        customerPhone: order.recipient_phone,
        orderStatus: order.statuses?.[0] || 'pending',
        paymentStatus: order.payment_method || 'unknown',
        totalAmount: parseFloat(order.price) || 0,
      };
    } catch (error) {
      console.error('Error fetching Lazada order details:', error);
      return null;
    }
  }

  /**
   * Update order status (cancel)
   */
  async updateOrderStatus(orderId: string, reason?: string): Promise<boolean> {
    try {
      const path = 'order/order/cancel';
      const timestamp = Date.now();

      const params: Record<string, any> = {
        app_key: this.appKey,
        timestamp,
        sign_method: 'sha256',
        order_id: orderId,
        reason_detail: reason || 'Cannot fulfill',
      };

      const signature = this.generateSignature(`/${path}`, params);
      params.sign = signature;

      const query = new URLSearchParams(params);
      const url = `${this.baseUrl}${path}?${query.toString()}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!response.ok) return false;

      const data = await response.json();
      return data.code === '0';
    } catch (error) {
      console.error('Error updating Lazada order:', error);
      return false;
    }
  }
}
