/**
 * Lazada API Client
 * Documentation: https://open.lazada.com/apps/doc/api
 *
 * This client handles authentication, HMAC-SHA256 signing, and API calls to Lazada
 */

import crypto from 'crypto';

export interface LazadaConfig {
  appKey: string;
  appSecret: string;
  accessToken?: string;
  apiUrl?: string;
  region?: 'TH' | 'SG' | 'MY' | 'VN' | 'PH' | 'ID';
}

export interface LazadaAuthResponse {
  access_token: string;
  country: string;
  refresh_token: string;
  account_platform: string;
  refresh_expires_in: number;
  country_user_info: {
    country: string;
    user_id: string;
    seller_id: string;
    short_code: string;
  }[];
  expires_in: number;
  account: string;
}

export interface LazadaOrder {
  order_id: number;
  order_number: string;
  status: string;
  created_at: string;
  updated_at: string;
  price: string;
  payment_method: string;
  customer_first_name: string;
  customer_last_name: string;
  items_count: number;
  promised_shipping_time: string;
  shipping_fee: number;
  voucher: number;
  address_billing: {
    first_name: string;
    last_name: string;
    phone: string;
    address1: string;
    city: string;
    post_code: string;
    country: string;
  };
  address_shipping: {
    first_name: string;
    last_name: string;
    phone: string;
    address1: string;
    city: string;
    post_code: string;
    country: string;
  };
  statuses: string[];
  remarks: string;
}

export interface LazadaOrderItem {
  order_item_id: number;
  order_id: number;
  purchase_order_id: string;
  purchase_order_number: string;
  package_id: string;
  sku: string;
  name: string;
  variation: string;
  shop_sku: string;
  digital_delivery_info: string;
  tax_amount: number;
  reason: string;
  reason_detail: string;
  return_status: string;
  shipment_provider: string;
  tracking_code: string;
  tracking_code_pre: string;
  status: string;
  created_at: string;
  updated_at: string;
  price: number;
  paid_price: number;
  wallet_credits: number;
  item_price: number;
  shipping_type: string;
  shipping_fee_original: number;
  shipping_fee: number;
  shipping_service_cost: number;
  voucher_platform: number;
  voucher_seller: number;
  is_digital: number;
  product_main_image: string;
  product_detail_url: string;
  promised_shipping_time: string;
  is_reroute: number;
  stage_pay_status: string;
  invoice_number: string;
}

export interface LazadaProduct {
  item_id: number;
  primary_category: number;
  attributes: Record<string, any>;
  skus: LazadaProductSku[];
  images: string[];
  status: string;
  created_time: string;
  updated_time: string;
}

export interface LazadaProductSku {
  SkuId: number;
  SellerSku: string;
  ShopSku: string;
  Url: string;
  package_width: string;
  package_height: string;
  package_length: string;
  package_weight: string;
  Available: number;
  price: number;
  special_price: number;
  Status: string;
}

/**
 * Lazada API Client Class
 */
export class LazadaClient {
  private appKey: string;
  private appSecret: string;
  private accessToken: string;
  private apiUrl: string;

  constructor(config: LazadaConfig) {
    this.appKey = config.appKey;
    this.appSecret = config.appSecret;
    this.accessToken = config.accessToken || '';

    // Set API URL based on region
    const regionUrls: Record<string, string> = {
      TH: 'https://api.lazada.co.th/rest',
      SG: 'https://api.lazada.sg/rest',
      MY: 'https://api.lazada.com.my/rest',
      VN: 'https://api.lazada.vn/rest',
      PH: 'https://api.lazada.com.ph/rest',
      ID: 'https://api.lazada.co.id/rest',
    };

    this.apiUrl =
      config.apiUrl || regionUrls[config.region || 'TH'] || 'https://api.lazada.co.th/rest';
  }

  /**
   * Generate HMAC-SHA256 signature for Lazada API
   * Format: HMAC-SHA256(apiPath + sorted(params))
   */
  private generateSignature(apiPath: string, params: Record<string, any>): string {
    // Sort parameters by key
    const sortedKeys = Object.keys(params).sort();

    // Concatenate API path with sorted parameters
    let signatureBase = apiPath;
    sortedKeys.forEach((key) => {
      signatureBase += key + params[key];
    });

    // Generate HMAC-SHA256 signature
    return crypto.createHmac('sha256', this.appSecret).update(signatureBase).digest('hex').toUpperCase();
  }

  /**
   * Make authenticated API request to Lazada
   */
  private async makeRequest<T>(
    apiPath: string,
    method: 'GET' | 'POST' = 'GET',
    params: Record<string, any> = {},
    useAccessToken: boolean = true
  ): Promise<T> {
    const timestamp = Date.now().toString();

    // Common parameters
    const commonParams: Record<string, string> = {
      app_key: this.appKey,
      sign_method: 'sha256',
      timestamp,
    };

    if (useAccessToken && this.accessToken) {
      commonParams.access_token = this.accessToken;
    }

    // Merge with custom parameters
    const allParams = { ...commonParams, ...params };

    // Generate signature
    const sign = this.generateSignature(apiPath, allParams);
    allParams.sign = sign;

    // Build URL
    const queryString = new URLSearchParams(allParams).toString();
    const url = `${this.apiUrl}${apiPath}?${queryString}`;

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await fetch(url, options);
      const data = await response.json();

      // Check for API errors
      if (data.code && data.code !== '0') {
        throw new Error(`Lazada API Error [${data.code}]: ${data.message || 'Unknown error'}`);
      }

      return data as T;
    } catch (error) {
      console.error('Lazada API request failed:', error);
      throw error;
    }
  }

  /**
   * Generate authorization URL for shop connection
   */
  getAuthorizationUrl(redirectUrl: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      force_auth: 'true',
      redirect_uri: redirectUrl,
      client_id: this.appKey,
    });

    return `${this.apiUrl}/oauth/authorize?${params.toString()}`;
  }

  /**
   * Get access token using authorization code
   */
  async getAccessToken(code: string): Promise<LazadaAuthResponse> {
    const apiPath = '/auth/token/create';
    const params = {
      code,
    };

    const response = await this.makeRequest<LazadaAuthResponse>(apiPath, 'POST', params, false);
    this.accessToken = response.access_token;
    return response;
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<LazadaAuthResponse> {
    const apiPath = '/auth/token/refresh';
    const params = {
      refresh_token: refreshToken,
    };

    const response = await this.makeRequest<LazadaAuthResponse>(apiPath, 'POST', params, false);
    this.accessToken = response.access_token;
    return response;
  }

  /**
   * Get orders
   */
  async getOrders(params: {
    created_after?: string;
    created_before?: string;
    updated_after?: string;
    updated_before?: string;
    status?: string;
    offset?: number;
    limit?: number;
  }): Promise<{
    data: {
      count: number;
      orders: LazadaOrder[];
    };
  }> {
    const apiPath = '/orders/get';
    const queryParams: Record<string, string> = {};

    if (params.created_after) queryParams.created_after = params.created_after;
    if (params.created_before) queryParams.created_before = params.created_before;
    if (params.updated_after) queryParams.updated_after = params.updated_after;
    if (params.updated_before) queryParams.updated_before = params.updated_before;
    if (params.status) queryParams.status = params.status;
    if (params.offset !== undefined) queryParams.offset = params.offset.toString();
    if (params.limit) queryParams.limit = params.limit.toString();

    return this.makeRequest(apiPath, 'GET', queryParams);
  }

  /**
   * Get order items by order ID
   */
  async getOrderItems(orderId: number): Promise<{
    data: LazadaOrderItem[];
  }> {
    const apiPath = '/order/items/get';
    const params = {
      order_id: orderId.toString(),
    };

    return this.makeRequest(apiPath, 'GET', params);
  }

  /**
   * Get multiple orders
   */
  async getMultipleOrders(orderIds: number[]): Promise<{
    data: LazadaOrder[];
  }> {
    const apiPath = '/orders/get';
    const params = {
      order_ids: JSON.stringify(orderIds),
    };

    return this.makeRequest(apiPath, 'GET', params);
  }

  /**
   * Get products
   */
  async getProducts(params: {
    filter?: 'all' | 'live' | 'inactive' | 'deleted' | 'image-missing' | 'pending' | 'rejected' | 'sold-out';
    search?: string;
    offset?: number;
    limit?: number;
    options?: string;
    sku_seller_list?: string[];
  }): Promise<{
    data: {
      total_products: number;
      products: LazadaProduct[];
    };
  }> {
    const apiPath = '/products/get';
    const queryParams: Record<string, string> = {};

    if (params.filter) queryParams.filter = params.filter;
    if (params.search) queryParams.search = params.search;
    if (params.offset !== undefined) queryParams.offset = params.offset.toString();
    if (params.limit) queryParams.limit = params.limit.toString();
    if (params.options) queryParams.options = params.options;
    if (params.sku_seller_list) queryParams.sku_seller_list = JSON.stringify(params.sku_seller_list);

    return this.makeRequest(apiPath, 'GET', queryParams);
  }

  /**
   * Create product
   */
  async createProduct(productData: {
    name: string;
    description: string;
    brand: string;
    category_id: number;
    price: number;
    special_price?: number;
    quantity: number;
    sku?: string;
    images: string[];
    attributes: Record<string, any>;
    package_weight?: string;
    package_length?: string;
    package_width?: string;
    package_height?: string;
  }): Promise<{
    data: {
      item_id: number;
      sku_list: { shop_sku: string; seller_sku: string; sku_id: number }[];
    };
  }> {
    const apiPath = '/product/create';

    const payload = {
      Request: {
        Product: {
          PrimaryCategory: productData.category_id,
          Attributes: {
            name: productData.name,
            description: productData.description,
            brand: productData.brand,
            ...productData.attributes,
          },
          Skus: [
            {
              SellerSku: productData.sku || `SKU-${Date.now()}`,
              quantity: productData.quantity,
              price: productData.price,
              special_price: productData.special_price || productData.price,
              package_weight: productData.package_weight || '0.5',
              package_length: productData.package_length || '10',
              package_width: productData.package_width || '10',
              package_height: productData.package_height || '10',
              Images: {
                Image: productData.images,
              },
            },
          ],
        },
      },
    };

    return this.makeRequest(apiPath, 'POST', { payload: JSON.stringify(payload) });
  }

  /**
   * Update product
   */
  async updateProduct(
    itemId: number,
    updateData: {
      name?: string;
      description?: string;
      price?: number;
      special_price?: number;
      quantity?: number;
      attributes?: Record<string, any>;
    }
  ): Promise<{
    data: {
      item_id: number;
      sku_list: { shop_sku: string; seller_sku: string; sku_id: number }[];
    };
  }> {
    const apiPath = '/product/update';

    const product: any = {};
    if (updateData.name || updateData.description || updateData.attributes) {
      product.Attributes = {};
      if (updateData.name) product.Attributes.name = updateData.name;
      if (updateData.description) product.Attributes.description = updateData.description;
      if (updateData.attributes) Object.assign(product.Attributes, updateData.attributes);
    }

    if (updateData.price !== undefined || updateData.special_price !== undefined || updateData.quantity !== undefined) {
      product.Skus = [{}];
      if (updateData.price !== undefined) product.Skus[0].price = updateData.price;
      if (updateData.special_price !== undefined) product.Skus[0].special_price = updateData.special_price;
      if (updateData.quantity !== undefined) product.Skus[0].quantity = updateData.quantity;
    }

    const payload = {
      Request: {
        Product: product,
      },
    };

    return this.makeRequest(apiPath, 'POST', {
      payload: JSON.stringify(payload),
    });
  }

  /**
   * Update product price and quantity
   */
  async updatePriceQuantity(sellerSku: string, price?: number, quantity?: number): Promise<{
    data: {
      sku_id: number;
      seller_sku: string;
    };
  }> {
    const apiPath = '/product/price_quantity/update';

    const payload: any = {
      SellerSku: sellerSku,
    };

    if (price !== undefined) payload.Price = price;
    if (quantity !== undefined) payload.Quantity = quantity;

    return this.makeRequest(apiPath, 'POST', { payload: JSON.stringify(payload) });
  }

  /**
   * Get seller information
   */
  async getSeller(): Promise<{
    data: {
      seller_id: string;
      name: string;
      email: string;
      location: string;
      cb: boolean;
      status: string;
      verified_email: boolean;
    };
  }> {
    const apiPath = '/seller/get';
    return this.makeRequest(apiPath, 'GET');
  }
}

/**
 * Create Lazada client instance
 */
export function createLazadaClient(config: LazadaConfig): LazadaClient {
  return new LazadaClient(config);
}
