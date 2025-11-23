import * as crypto from 'crypto';

export interface ShopeeOrder {
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
 * Shopee Open Platform API Client
 */
export class ShopeeClient {
  private shopId: string;
  private shopToken: string;
  private partnerId: string;
  private partnerKey: string;
  private baseUrl = 'https://partner.shopeemx.com/api/v2';
  private host = 'partner.shopeemx.com';

  constructor(shopId: string, shopToken: string, partnerId: string, partnerKey: string) {
    this.shopId = shopId;
    this.shopToken = shopToken;
    this.partnerId = partnerId;
    this.partnerKey = partnerKey;
  }

  /**
   * Generate authorization header for Shopee API
   */
  private generateAuthHeader(path: string, timestamp: number): string {
    const message = `${this.partnerId}${path}${timestamp}`;
    const signature = crypto
      .createHmac('sha256', this.partnerKey)
      .update(message)
      .digest('hex');
    return signature;
  }

  /**
   * Fetch orders from Shopee
   */
  async getOrders(fromDate?: number, toDate?: number): Promise<ShopeeOrder[]> {
    try {
      const path = '/order/orders_list';
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = this.generateAuthHeader(path, timestamp);

      const query = new URLSearchParams();
      query.append('shop_id', this.shopId);
      if (fromDate) query.append('time_from', fromDate.toString());
      if (toDate) query.append('time_to', toDate.toString());
      query.append('response_optional_fields', 'buyer_username,buyer_cancel_reason,cancel_by,cancel_reason,escrow_details');

      const url = `${this.baseUrl}${path}?${query.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-SOURCE': 'string',
          Authorization: signature,
          'X-PARTNER-ID': this.partnerId,
          'X-TIMESTAMP': timestamp.toString(),
          'X-ACCESS-TOKEN': this.shopToken,
        },
      });

      if (!response.ok) {
        throw new Error(`Shopee API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Transform Shopee orders to internal format
      return (data.response?.orders || []).map((order: any) => ({
        orderId: order.order_sn,
        customerName: order.buyer_username || 'Unknown',
        orderStatus: order.order_status,
        paymentStatus: order.payment_method,
        totalAmount: parseFloat(order.total_amount) || 0,
        items: order.items?.map((item: any) => ({
          productId: item.item_sku,
          productName: item.item_name,
          quantity: item.quantity,
          price: parseFloat(item.model_price_before_discount) || 0,
        })),
        shippingAddress: {
          address: order.recipient_address || '',
          city: order.recipient_city || '',
          zip: order.recipient_postal_code || '',
        },
      }));
    } catch (error) {
      console.error('Error fetching Shopee orders:', error);
      return [];
    }
  }

  /**
   * Get specific order details
   */
  async getOrderDetails(orderId: string): Promise<ShopeeOrder | null> {
    try {
      const path = `/order/get_order_detail`;
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = this.generateAuthHeader(path, timestamp);

      const query = new URLSearchParams();
      query.append('shop_id', this.shopId);
      query.append('order_sn', orderId);
      query.append('response_optional_fields', 'buyer_username,buyer_cancel_reason');

      const url = `${this.baseUrl}${path}?${query.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: signature,
          'X-PARTNER-ID': this.partnerId,
          'X-TIMESTAMP': timestamp.toString(),
          'X-ACCESS-TOKEN': this.shopToken,
        },
      });

      if (!response.ok) return null;

      const data = await response.json();
      const order = data.response?.order;

      if (!order) return null;

      return {
        orderId: order.order_sn,
        customerName: order.buyer_username || 'Unknown',
        orderStatus: order.order_status,
        paymentStatus: order.payment_method,
        totalAmount: parseFloat(order.total_amount) || 0,
      };
    } catch (error) {
      console.error('Error fetching Shopee order details:', error);
      return null;
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    try {
      const path = '/order/cancel_order';
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = this.generateAuthHeader(path, timestamp);

      const body = {
        order_sn: orderId,
        cancel_reason: 'Cannot fulfill',
      };

      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: signature,
          'X-PARTNER-ID': this.partnerId,
          'X-TIMESTAMP': timestamp.toString(),
          'X-ACCESS-TOKEN': this.shopToken,
        },
        body: JSON.stringify(body),
      });

      return response.ok;
    } catch (error) {
      console.error('Error updating Shopee order:', error);
      return false;
    }
  }
}
