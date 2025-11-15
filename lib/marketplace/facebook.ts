/**
 * Facebook Shop API Integration
 * Documentation: https://developers.facebook.com/docs/commerce
 */

interface FacebookConfig {
  appId: string;
  appSecret: string;
  accessToken: string;
  pageId: string;
}

interface FacebookOrder {
  orderId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  totalAmount: number;
  orderStatus: string;
  items: FacebookOrderItem[];
  shippingAddress: string;
}

interface FacebookOrderItem {
  itemId: string;
  itemName: string;
  quantity: number;
  price: number;
}

class FacebookAPI {
  private appId: string;
  private appSecret: string;
  private accessToken: string;
  private pageId: string;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor(config: FacebookConfig) {
    this.appId = config.appId;
    this.appSecret = config.appSecret;
    this.accessToken = config.accessToken;
    this.pageId = config.pageId;
  }

  /**
   * Get orders from Facebook Shop
   * Note: Requires actual Facebook API credentials and proper permissions
   */
  async getOrders(limit: number = 25): Promise<FacebookOrder[]> {
    try {
      const url = `${this.baseUrl}/${this.pageId}/orders?fields=id,created_timestamp,order_status,estimated_payment.fields(currency,total_amount),ship_by_date,shipping_address,items.fields(item_description,item_price,quantity,image_url),buyer.fields(email,name,phone)&access_token=${this.accessToken}&limit=${limit}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Source': 'omni-sales',
        },
      });

      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformOrders(data);
    } catch (error) {
      console.error('Error fetching Facebook orders:', error);
      throw error;
    }
  }

  /**
   * Transform Facebook order format to internal format
   */
  private transformOrders(fbData: any): FacebookOrder[] {
    // This is a placeholder transformation
    // Actual implementation depends on Facebook API response structure
    if (!fbData.data) {
      return [];
    }

    return fbData.data.map((order: any) => ({
      orderId: order.id,
      customerName: order.buyer?.name || 'Unknown',
      customerEmail: order.buyer?.email,
      customerPhone: order.buyer?.phone,
      totalAmount:
        order.estimated_payment?.total_amount || 0,
      orderStatus: order.order_status || 'unknown',
      items:
        order.items?.map((item: any) => ({
          itemId: item.item_id || '',
          itemName: item.item_description || '',
          quantity: item.quantity || 1,
          price: item.item_price || 0,
        })) || [],
      shippingAddress: JSON.stringify(order.shipping_address || {}),
    }));
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: string,
    status: string
  ): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/${orderId}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_status: status,
          access_token: this.accessToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      return true;
    } catch (error) {
      console.error('Error updating Facebook order status:', error);
      throw error;
    }
  }

  /**
   * Get shop info
   */
  async getShopInfo(): Promise<any> {
    try {
      const url = `${this.baseUrl}/${this.pageId}?fields=id,name,picture.type(large)&access_token=${this.accessToken}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch shop info');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Facebook shop info:', error);
      throw error;
    }
  }
}

export function createFacebookClient(config: FacebookConfig): FacebookAPI {
  return new FacebookAPI(config);
}
