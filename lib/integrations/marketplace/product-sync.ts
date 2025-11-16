/**
 * Marketplace Product Sync Module
 * Synchronizes products from omni-sales to Shopee and Lazada marketplaces
 */

import { createClient } from '@supabase/supabase-js';
import { ShopeeClient } from './shopee/client';
import { LazadaClient } from './lazada/client';

export interface ProductSyncConfig {
  supabaseUrl: string;
  supabaseKey: string;
}

export interface MarketplaceConnection {
  id: string;
  marketplace_type: 'shopee' | 'lazada';
  shop_id: string;
  shop_name: string;
  access_token: string;
  refresh_token?: string;
  credentials: Record<string, any>;
  is_active: boolean;
}

export interface ProductSyncResult {
  success: boolean;
  marketplace: string;
  shop_id: string;
  products_synced: number;
  products_failed: number;
  errors: string[];
  synced_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  sku?: string;
  category?: string;
  brand?: string;
  weight?: number;
  images?: string[];
  metadata?: Record<string, any>;
}

export interface MarketplaceProduct {
  id: string;
  product_id: string;
  marketplace_connection_id: string;
  marketplace_type: string;
  marketplace_product_id: string;
  marketplace_sku: string;
  status: string;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Product Sync Service
 */
export class ProductSyncService {
  private supabase;

  constructor(config: ProductSyncConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
  }

  /**
   * Upload product to Shopee
   */
  async uploadToShopee(
    product: Product,
    connection: MarketplaceConnection
  ): Promise<{ success: boolean; marketplaceProductId?: string; error?: string }> {
    try {
      const client = new ShopeeClient({
        partnerId: connection.credentials.partner_id,
        partnerKey: connection.credentials.partner_key,
        shopId: parseInt(connection.shop_id),
        accessToken: connection.access_token,
      });

      // Upload images if available
      const imageIds: { image_id: string }[] = [];
      if (product.images && product.images.length > 0) {
        for (const imageUrl of product.images.slice(0, 9)) {
          try {
            // Fetch image and convert to buffer
            const imageResponse = await fetch(imageUrl);
            const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

            const imageResult = await client.uploadImage(imageBuffer);
            imageIds.push({ image_id: imageResult.image_id });
          } catch (error) {
            console.error('Error uploading image to Shopee:', error);
          }
        }
      }

      // If no images uploaded, use a placeholder
      if (imageIds.length === 0) {
        console.warn('No images available for product, using default');
      }

      // Create product on Shopee
      const result = await client.addItem({
        item_name: product.name.substring(0, 255),
        description: product.description || product.name,
        price: product.price,
        stock: product.stock,
        item_sku: product.sku,
        category_id: connection.credentials.default_category_id || 100003,
        weight: product.weight || 0.5,
        dimension: {
          package_length: 10,
          package_width: 10,
          package_height: 10,
        },
        image_list: imageIds.length > 0 ? imageIds : [],
        brand: product.brand
          ? {
              brand_id: 0,
              original_brand_name: product.brand,
            }
          : undefined,
      });

      return {
        success: true,
        marketplaceProductId: result.item_id.toString(),
      };
    } catch (error) {
      console.error('Error uploading to Shopee:', error);
      return {
        success: false,
        error: `${error}`,
      };
    }
  }

  /**
   * Upload product to Lazada
   */
  async uploadToLazada(
    product: Product,
    connection: MarketplaceConnection
  ): Promise<{ success: boolean; marketplaceProductId?: string; error?: string }> {
    try {
      const client = new LazadaClient({
        appKey: connection.credentials.app_key,
        appSecret: connection.credentials.app_secret,
        accessToken: connection.access_token,
        region: connection.credentials.region || 'TH',
      });

      // Prepare images
      const images = product.images && product.images.length > 0 ? product.images.slice(0, 8) : [];

      // Create product on Lazada
      const result = await client.createProduct({
        name: product.name.substring(0, 255),
        description: product.description || product.name,
        brand: product.brand || 'No Brand',
        category_id: connection.credentials.default_category_id || 10000001,
        price: product.price,
        special_price: product.price,
        quantity: product.stock,
        sku: product.sku || `SKU-${product.id}`,
        images: images,
        attributes: {},
        package_weight: product.weight ? product.weight.toString() : '0.5',
        package_length: '10',
        package_width: '10',
        package_height: '10',
      });

      return {
        success: true,
        marketplaceProductId: result.data.item_id.toString(),
      };
    } catch (error) {
      console.error('Error uploading to Lazada:', error);
      return {
        success: false,
        error: `${error}`,
      };
    }
  }

  /**
   * Update product on Shopee
   */
  async updateShopeeProduct(
    marketplaceProductId: string,
    updates: {
      name?: string;
      description?: string;
      price?: number;
      stock?: number;
    },
    connection: MarketplaceConnection
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const client = new ShopeeClient({
        partnerId: connection.credentials.partner_id,
        partnerKey: connection.credentials.partner_key,
        shopId: parseInt(connection.shop_id),
        accessToken: connection.access_token,
      });

      const updateData: any = {};
      if (updates.name) updateData.item_name = updates.name;
      if (updates.description) updateData.description = updates.description;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.stock !== undefined) updateData.stock = updates.stock;

      await client.updateItem(parseInt(marketplaceProductId), updateData);

      // Update stock separately if needed
      if (updates.stock !== undefined) {
        await client.updateStock(parseInt(marketplaceProductId), updates.stock);
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating Shopee product:', error);
      return {
        success: false,
        error: `${error}`,
      };
    }
  }

  /**
   * Update product on Lazada
   */
  async updateLazadaProduct(
    marketplaceProductId: string,
    updates: {
      name?: string;
      description?: string;
      price?: number;
      stock?: number;
    },
    connection: MarketplaceConnection
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const client = new LazadaClient({
        appKey: connection.credentials.app_key,
        appSecret: connection.credentials.app_secret,
        accessToken: connection.access_token,
        region: connection.credentials.region || 'TH',
      });

      await client.updateProduct(parseInt(marketplaceProductId), {
        name: updates.name,
        description: updates.description,
        price: updates.price,
        quantity: updates.stock,
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating Lazada product:', error);
      return {
        success: false,
        error: `${error}`,
      };
    }
  }

  /**
   * Sync product to marketplace
   */
  async syncProduct(productId: string, connectionId: string): Promise<ProductSyncResult> {
    const result: ProductSyncResult = {
      success: false,
      marketplace: 'unknown',
      shop_id: '',
      products_synced: 0,
      products_failed: 0,
      errors: [],
      synced_at: new Date().toISOString(),
    };

    try {
      // Get product
      const { data: product, error: productError } = await this.supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        result.errors.push('Product not found');
        return result;
      }

      // Get connection
      const { data: connection, error: connectionError } = await this.supabase
        .from('marketplace_connections')
        .select('*')
        .eq('id', connectionId)
        .single();

      if (connectionError || !connection) {
        result.errors.push('Marketplace connection not found');
        return result;
      }

      result.marketplace = connection.marketplace_type;
      result.shop_id = connection.shop_id;

      // Check if product already exists on marketplace
      const { data: existingMarketplaceProduct } = await this.supabase
        .from('marketplace_products')
        .select('*')
        .eq('product_id', productId)
        .eq('marketplace_connection_id', connectionId)
        .single();

      let uploadResult;

      if (existingMarketplaceProduct) {
        // Update existing product
        if (connection.marketplace_type === 'shopee') {
          uploadResult = await this.updateShopeeProduct(
            existingMarketplaceProduct.marketplace_product_id,
            {
              name: product.name,
              description: product.description,
              price: product.price,
              stock: product.stock,
            },
            connection
          );
        } else {
          uploadResult = await this.updateLazadaProduct(
            existingMarketplaceProduct.marketplace_product_id,
            {
              name: product.name,
              description: product.description,
              price: product.price,
              stock: product.stock,
            },
            connection
          );
        }

        if (uploadResult.success) {
          await this.supabase
            .from('marketplace_products')
            .update({
              last_synced_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingMarketplaceProduct.id);

          result.products_synced++;
        } else {
          result.products_failed++;
          result.errors.push(uploadResult.error || 'Unknown error');
        }
      } else {
        // Upload new product
        if (connection.marketplace_type === 'shopee') {
          uploadResult = await this.uploadToShopee(product, connection);
        } else if (connection.marketplace_type === 'lazada') {
          uploadResult = await this.uploadToLazada(product, connection);
        } else {
          result.errors.push('Unsupported marketplace type');
          return result;
        }

        if (uploadResult.success && uploadResult.marketplaceProductId) {
          // Save marketplace product mapping
          await this.supabase.from('marketplace_products').insert({
            product_id: productId,
            marketplace_connection_id: connectionId,
            marketplace_type: connection.marketplace_type,
            marketplace_product_id: uploadResult.marketplaceProductId,
            marketplace_sku: product.sku || '',
            status: 'active',
            last_synced_at: new Date().toISOString(),
          });

          result.products_synced++;
        } else {
          result.products_failed++;
          result.errors.push(uploadResult.error || 'Unknown error');
        }
      }

      result.success = result.products_failed === 0;
    } catch (error) {
      result.errors.push(`Sync failed: ${error}`);
      console.error('Product sync error:', error);
    }

    return result;
  }

  /**
   * Sync multiple products to marketplace
   */
  async syncProducts(productIds: string[], connectionId: string): Promise<ProductSyncResult> {
    const result: ProductSyncResult = {
      success: false,
      marketplace: 'unknown',
      shop_id: '',
      products_synced: 0,
      products_failed: 0,
      errors: [],
      synced_at: new Date().toISOString(),
    };

    for (const productId of productIds) {
      const productResult = await this.syncProduct(productId, connectionId);

      result.marketplace = productResult.marketplace;
      result.shop_id = productResult.shop_id;
      result.products_synced += productResult.products_synced;
      result.products_failed += productResult.products_failed;
      result.errors.push(...productResult.errors);
    }

    result.success = result.products_failed === 0;
    return result;
  }

  /**
   * Update inventory across all marketplaces for a product
   */
  async updateInventoryAcrossMarketplaces(
    productId: string,
    newStock: number
  ): Promise<ProductSyncResult[]> {
    const results: ProductSyncResult[] = [];

    // Get all marketplace products for this product
    const { data: marketplaceProducts } = await this.supabase
      .from('marketplace_products')
      .select('*, marketplace_connections(*)')
      .eq('product_id', productId);

    if (!marketplaceProducts || marketplaceProducts.length === 0) {
      return results;
    }

    for (const mp of marketplaceProducts) {
      const connection = mp.marketplace_connections;
      const result: ProductSyncResult = {
        success: false,
        marketplace: connection.marketplace_type,
        shop_id: connection.shop_id,
        products_synced: 0,
        products_failed: 0,
        errors: [],
        synced_at: new Date().toISOString(),
      };

      try {
        let updateResult;

        if (connection.marketplace_type === 'shopee') {
          updateResult = await this.updateShopeeProduct(
            mp.marketplace_product_id,
            { stock: newStock },
            connection
          );
        } else if (connection.marketplace_type === 'lazada') {
          updateResult = await this.updateLazadaProduct(
            mp.marketplace_product_id,
            { stock: newStock },
            connection
          );
        } else {
          result.errors.push('Unsupported marketplace');
          results.push(result);
          continue;
        }

        if (updateResult.success) {
          result.products_synced++;
          result.success = true;

          await this.supabase
            .from('marketplace_products')
            .update({
              last_synced_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', mp.id);
        } else {
          result.products_failed++;
          result.errors.push(updateResult.error || 'Unknown error');
        }
      } catch (error) {
        result.products_failed++;
        result.errors.push(`${error}`);
      }

      results.push(result);
    }

    return results;
  }
}
