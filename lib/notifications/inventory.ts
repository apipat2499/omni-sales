import { supabase } from '@/lib/supabase/client';
import type { Product, NotificationPreferences } from '@/types';

export async function checkInventoryLevels() {
  try {
    // Get notification preferences
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('*')
      .is('user_id', null)
      .single();

    if (!prefs || !prefs.email_enabled) {
      return;
    }

    const threshold = prefs.low_stock_threshold || 10;

    // Get all products
    const { data: products } = await supabase
      .from('products')
      .select('*');

    if (!products) return;

    for (const product of products) {
      const stock = product.stock;

      // Check if out of stock
      if (stock === 0 && prefs.email_on_out_of_stock) {
        await createStockNotification(product, 'out_of_stock');
        await sendStockEmail(product, 'out_of_stock');
      }
      // Check if low stock
      else if (stock > 0 && stock < threshold && prefs.email_on_low_stock) {
        await createStockNotification(product, 'low_stock');
        await sendStockEmail(product, 'low_stock');
      }
    }
  } catch (error) {
    console.error('Error checking inventory levels:', error);
  }
}

async function createStockNotification(product: any, type: 'low_stock' | 'out_of_stock') {
  try {
    // Check if notification already exists for this product (avoid duplicates)
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('type', type)
      .eq('related_id', product.id)
      .eq('is_read', false)
      .maybeSingle();

    if (existing) {
      return; // Notification already exists
    }

    const title = type === 'out_of_stock'
      ? `Out of Stock: ${product.name}`
      : `Low Stock Alert: ${product.name}`;

    const message = type === 'out_of_stock'
      ? `${product.name} (SKU: ${product.sku}) is now out of stock.`
      : `${product.name} (SKU: ${product.sku}) has only ${product.stock} units remaining.`;

    await supabase.from('notifications').insert({
      type,
      title,
      message,
      severity: type === 'out_of_stock' ? 'error' : 'warning',
      related_id: product.id,
      related_type: 'product',
      is_read: false,
    });
  } catch (error) {
    console.error('Error creating stock notification:', error);
  }
}

async function sendStockEmail(product: any, type: 'low_stock' | 'out_of_stock') {
  try {
    // Send email via API
    await fetch('/api/notifications/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        to: process.env.ADMIN_EMAIL || 'admin@example.com',
        product: {
          name: product.name,
          sku: product.sku,
          stock: product.stock,
        },
      }),
    });
  } catch (error) {
    console.error('Error sending stock email:', error);
  }
}

export async function checkProductStockAfterOrder(productId: string) {
  try {
    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (!product) return;

    // Get notification preferences
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('*')
      .is('user_id', null)
      .single();

    if (!prefs || !prefs.email_enabled) return;

    const threshold = prefs.low_stock_threshold || 10;

    if (product.stock === 0 && prefs.email_on_out_of_stock) {
      await createStockNotification(product, 'out_of_stock');
      await sendStockEmail(product, 'out_of_stock');
    } else if (product.stock > 0 && product.stock < threshold && prefs.email_on_low_stock) {
      await createStockNotification(product, 'low_stock');
      await sendStockEmail(product, 'low_stock');
    }
  } catch (error) {
    console.error('Error checking product stock:', error);
  }
}
