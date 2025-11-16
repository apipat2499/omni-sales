/**
 * Shopee API Client
 * Documentation: https://open.shopee.com/documents
 *
 * This client handles authentication, request signing, and API calls to Shopee
 */

import crypto from 'crypto';

export interface ShopeeConfig {
  partnerId: number;
  partnerKey: string;
  shopId: number;
  accessToken: string;
  apiUrl?: string;
}

export interface ShopeeAuthResponse {
  access_token: string;
  refresh_token: string;
  expire_in: number;
  shop_id_list: number[];
}

export interface ShopeeOrderDetail {
  order_sn: string;
  region: string;
  currency: string;
  cod: boolean;
  total_amount: number;
  order_status: string;
  shipping_carrier: string;
  payment_method: string;
  days_to_ship: number;
  ship_by_date: number;
  buyer_user_id: number;
  buyer_username: string;
  recipient_address: {
    name: string;
    phone: string;
    full_address: string;
    district: string;
    city: string;
    state: string;
    region: string;
    zipcode: string;
  };
  actual_shipping_fee: number;
  goods_to_declare: boolean;
  note: string;
  note_update_time: number;
  item_list: ShopeeOrderItem[];
  pay_time: number;
  create_time: number;
  update_time: number;
}

export interface ShopeeOrderItem {
  item_id: number;
  item_name: string;
  item_sku: string;
  model_id: number;
  model_name: string;
  model_sku: string;
  model_quantity_purchased: number;
  model_original_price: number;
  model_discounted_price: number;
  wholesale: boolean;
  weight: number;
  add_on_deal: boolean;
  main_item: boolean;
  add_on_deal_id: number;
  promotion_type: string;
  promotion_id: number;
  order_item_id: number;
  promotion_group_id: number;
  image_info: {
    image_url: string;
  };
  product_location_id: string[];
}

export interface ShopeeProduct {
  item_id: number;
  item_name: string;
  item_sku: string;
  item_status: string;
  description: string;
  price: number;
  stock: number;
  image_list: { image_id: string; image_url: string }[];
  weight: number;
  dimension: {
    package_length: number;
    package_width: number;
    package_height: number;
  };
  category_id: number;
  brand: {
    brand_id: number;
    original_brand_name: string;
  };
  model_list: ShopeeProductModel[];
}

export interface ShopeeProductModel {
  model_id: number;
  model_sku: string;
  price_info: {
    original_price: number;
    current_price: number;
  };
  stock_info: {
    stock_type: number;
    current_stock: number;
  };
  tier_index: number[];
}

/**
 * Shopee API Client Class
 */
export class ShopeeClient {
  private partnerId: number;
  private partnerKey: string;
  private shopId: number;
  private accessToken: string;
  private apiUrl: string;

  constructor(config: ShopeeConfig) {
    this.partnerId = config.partnerId;
    this.partnerKey = config.partnerKey;
    this.shopId = config.shopId;
    this.accessToken = config.accessToken;
    this.apiUrl = config.apiUrl || 'https://partner.shopeemobile.com';
  }

  /**
   * Generate SHA256 signature for Shopee API requests
   * Format: SHA256(partner_id + api_path + timestamp + access_token + shop_id + partner_key)
   */
  private generateSignature(
    apiPath: string,
    timestamp: number,
    accessToken: string,
    shopId: number
  ): string {
    const baseString = `${this.partnerId}${apiPath}${timestamp}${accessToken}${shopId}`;

    return crypto
      .createHmac('sha256', this.partnerKey)
      .update(baseString)
      .digest('hex');
  }

  /**
   * Generate auth signature (for token generation without access token)
   */
  private generateAuthSignature(apiPath: string, timestamp: number): string {
    const baseString = `${this.partnerId}${apiPath}${timestamp}`;

    return crypto
      .createHmac('sha256', this.partnerKey)
      .update(baseString)
      .digest('hex');
  }

  /**
   * Make authenticated API request to Shopee
   */
  private async makeRequest<T>(
    apiPath: string,
    method: 'GET' | 'POST' = 'GET',
    body?: any,
    useAuth: boolean = true
  ): Promise<T> {
    const timestamp = Math.floor(Date.now() / 1000);

    let sign: string;
    const queryParams: Record<string, string> = {
      partner_id: this.partnerId.toString(),
      timestamp: timestamp.toString(),
    };

    if (useAuth) {
      sign = this.generateSignature(apiPath, timestamp, this.accessToken, this.shopId);
      queryParams.access_token = this.accessToken;
      queryParams.shop_id = this.shopId.toString();
    } else {
      sign = this.generateAuthSignature(apiPath, timestamp);
    }

    queryParams.sign = sign;

    const queryString = new URLSearchParams(queryParams).toString();
    const url = `${this.apiUrl}${apiPath}?${queryString}`;

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body && method === 'POST') {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      const data = await response.json();

      if (data.error) {
        throw new Error(`Shopee API Error: ${data.error} - ${data.message || 'Unknown error'}`);
      }

      return data.response as T;
    } catch (error) {
      console.error('Shopee API request failed:', error);
      throw error;
    }
  }

  /**
   * Get access token using auth code
   */
  async getAccessToken(code: string, shopId: number): Promise<ShopeeAuthResponse> {
    const apiPath = '/api/v2/auth/token/get';
    const body = {
      code,
      shop_id: shopId,
      partner_id: this.partnerId,
    };

    return this.makeRequest<ShopeeAuthResponse>(apiPath, 'POST', body, false);
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string, shopId: number): Promise<ShopeeAuthResponse> {
    const apiPath = '/api/v2/auth/access_token/get';
    const body = {
      refresh_token: refreshToken,
      shop_id: shopId,
      partner_id: this.partnerId,
    };

    return this.makeRequest<ShopeeAuthResponse>(apiPath, 'POST', body, false);
  }

  /**
   * Get order list
   */
  async getOrderList(params: {
    time_range_field: 'create_time' | 'update_time';
    time_from: number;
    time_to: number;
    page_size: number;
    cursor?: string;
    order_status?: string;
    response_optional_fields?: string;
  }): Promise<{
    more: boolean;
    next_cursor: string;
    order_list: { order_sn: string }[];
  }> {
    const apiPath = '/api/v2/order/get_order_list';
    return this.makeRequest(apiPath, 'POST', params);
  }

  /**
   * Get order details
   */
  async getOrderDetails(orderSnList: string[]): Promise<{
    order_list: ShopeeOrderDetail[];
  }> {
    const apiPath = '/api/v2/order/get_order_detail';
    const body = {
      order_sn_list: orderSnList,
      response_optional_fields: [
        'buyer_user_id',
        'buyer_username',
        'estimated_shipping_fee',
        'recipient_address',
        'actual_shipping_fee',
        'goods_to_declare',
        'note',
        'note_update_time',
        'item_list',
        'pay_time',
        'dropshipper',
        'credit_card_number',
        'dropshipper_phone',
        'split_up',
        'buyer_cancel_reason',
        'cancel_by',
        'cancel_reason',
        'actual_shipping_fee_confirmed',
        'buyer_cpf_id',
        'fulfillment_flag',
        'pickup_done_time',
        'package_list',
        'shipping_carrier',
        'payment_method',
        'total_amount',
        'buyer_username',
        'invoice_data',
      ].join(','),
    };

    return this.makeRequest(apiPath, 'POST', body);
  }

  /**
   * Get product item list
   */
  async getItemList(params: {
    offset: number;
    page_size: number;
    item_status?: string[];
    update_time_from?: number;
    update_time_to?: number;
  }): Promise<{
    total_count: number;
    has_next_page: boolean;
    next_offset: number;
    item: { item_id: number; item_status: string }[];
  }> {
    const apiPath = '/api/v2/product/get_item_list';
    return this.makeRequest(apiPath, 'POST', params);
  }

  /**
   * Get product item base info
   */
  async getItemBaseInfo(itemIdList: number[]): Promise<{
    item_list: ShopeeProduct[];
  }> {
    const apiPath = '/api/v2/product/get_item_base_info';
    const body = {
      item_id_list: itemIdList,
      need_tax_info: false,
      need_complaint_policy: false,
    };

    return this.makeRequest(apiPath, 'POST', body);
  }

  /**
   * Add new product item
   */
  async addItem(productData: {
    item_name: string;
    description: string;
    price: number;
    stock: number;
    item_sku?: string;
    category_id: number;
    weight: number;
    dimension?: {
      package_length: number;
      package_width: number;
      package_height: number;
    };
    image_list: { image_id: string }[];
    brand?: {
      brand_id: number;
      original_brand_name: string;
    };
  }): Promise<{
    item_id: number;
    warnings: any[];
  }> {
    const apiPath = '/api/v2/product/add_item';
    const body = {
      original_price: productData.price,
      description: productData.description,
      item_name: productData.item_name,
      item_status: 'NORMAL',
      dimension: productData.dimension || {
        package_length: 10,
        package_width: 10,
        package_height: 10,
      },
      weight: productData.weight,
      normal_stock: productData.stock,
      category_id: productData.category_id,
      image: {
        image_id_list: productData.image_list.map((img) => img.image_id),
      },
      item_sku: productData.item_sku || '',
      brand: productData.brand,
    };

    return this.makeRequest(apiPath, 'POST', body);
  }

  /**
   * Update product item
   */
  async updateItem(
    itemId: number,
    updateData: {
      item_name?: string;
      description?: string;
      price?: number;
      stock?: number;
      item_sku?: string;
      weight?: number;
    }
  ): Promise<{
    item_id: number;
    warnings: any[];
  }> {
    const apiPath = '/api/v2/product/update_item';
    const body: any = {
      item_id: itemId,
    };

    if (updateData.item_name) body.item_name = updateData.item_name;
    if (updateData.description) body.description = updateData.description;
    if (updateData.price) body.original_price = updateData.price;
    if (updateData.stock !== undefined) body.normal_stock = updateData.stock;
    if (updateData.item_sku) body.item_sku = updateData.item_sku;
    if (updateData.weight) body.weight = updateData.weight;

    return this.makeRequest(apiPath, 'POST', body);
  }

  /**
   * Update product stock
   */
  async updateStock(itemId: number, stock: number): Promise<{
    success_list: { model_id: number; original_stock: number; current_stock: number }[];
    failure_list: any[];
  }> {
    const apiPath = '/api/v2/product/update_stock';
    const body = {
      item_id: itemId,
      stock_list: [
        {
          model_id: 0,
          normal_stock: stock,
        },
      ],
    };

    return this.makeRequest(apiPath, 'POST', body);
  }

  /**
   * Upload product image
   */
  async uploadImage(imageData: Buffer): Promise<{ image_id: string; image_url: string }> {
    const apiPath = '/api/v2/media_space/upload_image';
    const base64Image = imageData.toString('base64');

    const body = {
      image: base64Image,
    };

    const response = await this.makeRequest<{ image_info: { image_id: string; image_url: string } }>(
      apiPath,
      'POST',
      body
    );

    return response.image_info;
  }
}

/**
 * Create Shopee client instance
 */
export function createShopeeClient(config: ShopeeConfig): ShopeeClient {
  return new ShopeeClient(config);
}
