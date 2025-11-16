/**
 * Order and Shipping Integration Service
 * Automatically creates shipments when orders are shipped and handles updates
 */

import { getShippingManager, ShipmentRequest, ShippingProvider } from './shipping-manager';
import { supabase } from '@/lib/supabase/client';
import { updateOrderStatus } from '@/lib/order/service';

/**
 * Auto-create shipment when order is marked as shipped
 */
export async function autoCreateShipmentForOrder(
  orderId: string,
  provider: ShippingProvider,
  serviceType?: string
): Promise<{ success: boolean; shipmentId?: string; trackingNumber?: string; error?: string }> {
  try {
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_shipping (*)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return { success: false, error: 'Order not found' };
    }

    // Check if shipment already exists
    const existingShipment = await getShippingManager().getShipmentByOrderId(orderId);
    if (existingShipment) {
      return {
        success: false,
        error: 'Shipment already exists for this order',
        shipmentId: existingShipment.id,
        trackingNumber: existingShipment.trackingNumber,
      };
    }

    // Get default sender address from settings
    const senderAddress = await getDefaultSenderAddress();
    if (!senderAddress) {
      return { success: false, error: 'Default sender address not configured' };
    }

    // Prepare recipient address from order shipping
    const orderShipping = order.order_shipping?.[0];
    if (!orderShipping) {
      return { success: false, error: 'No shipping information found for order' };
    }

    const recipientAddress = {
      name: orderShipping.recipient_name || order.customer_name,
      phone: orderShipping.recipient_phone || order.customer_phone,
      address: orderShipping.shipping_address,
      district: orderShipping.district || '',
      province: orderShipping.province || '',
      postalCode: orderShipping.postal_code || '',
    };

    // Get order items for parcel details
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('*, products (*)')
      .eq('order_id', orderId);

    const totalWeight = orderItems?.reduce((sum, item) => {
      return sum + ((item.products?.weight || 0) * item.quantity);
    }, 0) || 1;

    const itemDescriptions = orderItems?.map(item => item.products?.name).join(', ') || 'Order items';

    // Create shipment request
    const shipmentRequest: ShipmentRequest = {
      provider,
      orderId,
      senderAddress,
      recipientAddress,
      parcel: {
        weight: totalWeight,
        description: itemDescriptions,
        codAmount: order.payment_method === 'cod' ? order.total : undefined,
      },
      serviceType,
      referenceNumber: order.order_number,
    };

    // Create shipment
    const shippingManager = getShippingManager();
    const shipment = await shippingManager.createShipment(shipmentRequest);

    // Update order with tracking number
    await supabase
      .from('order_shipping')
      .update({
        tracking_number: shipment.trackingNumber,
        carrier: provider,
        shipping_status: 'in_transit',
        shipped_at: new Date(),
      })
      .eq('order_id', orderId);

    // Update order status
    await updateOrderStatus(orderId, 'shipped', 'Order shipped', `Tracking: ${shipment.trackingNumber}`);

    // Send email notification
    await sendShippingNotification(orderId, shipment.trackingNumber, provider);

    return {
      success: true,
      shipmentId: shipment.id,
      trackingNumber: shipment.trackingNumber,
    };
  } catch (error: any) {
    console.error('Error auto-creating shipment:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update order status when shipment status changes
 */
export async function updateOrderFromShipmentStatus(
  shipmentId: string,
  newStatus: string
): Promise<void> {
  try {
    const { data: shipment } = await supabase
      .from('shipments')
      .select('order_id, tracking_number, provider')
      .eq('id', shipmentId)
      .single();

    if (!shipment || !shipment.order_id) {
      return;
    }

    // Map shipment status to order status
    const orderStatus = mapShipmentStatusToOrderStatus(newStatus);
    if (!orderStatus) {
      return;
    }

    // Update order shipping status
    await supabase
      .from('order_shipping')
      .update({
        shipping_status: newStatus,
        ...(newStatus === 'delivered' && { delivered_at: new Date() }),
      })
      .eq('order_id', shipment.order_id);

    // Update order status
    await updateOrderStatus(
      shipment.order_id,
      orderStatus,
      'Shipment status updated',
      `Tracking: ${shipment.tracking_number} - ${newStatus}`
    );

    // Send notification if delivered
    if (newStatus === 'delivered') {
      await sendDeliveryNotification(shipment.order_id, shipment.tracking_number);
    }
  } catch (error) {
    console.error('Error updating order from shipment status:', error);
  }
}

/**
 * Get shipment tracking info for order
 */
export async function getOrderShipmentTracking(orderId: string) {
  try {
    const shippingManager = getShippingManager();
    const shipment = await shippingManager.getShipmentByOrderId(orderId);

    if (!shipment) {
      return null;
    }

    const tracking = await shippingManager.trackShipment(
      shipment.provider,
      shipment.trackingNumber
    );

    return {
      shipment,
      tracking,
    };
  } catch (error) {
    console.error('Error getting order shipment tracking:', error);
    return null;
  }
}

/**
 * Sync shipment status for all active shipments
 */
export async function syncAllActiveShipments(): Promise<{
  synced: number;
  failed: number;
}> {
  try {
    const { data: activeShipments } = await supabase
      .from('shipments')
      .select('*')
      .not('status', 'in', '("delivered","cancelled")');

    let synced = 0;
    let failed = 0;

    if (!activeShipments || activeShipments.length === 0) {
      return { synced: 0, failed: 0 };
    }

    const shippingManager = getShippingManager();

    for (const shipment of activeShipments) {
      try {
        const tracking = await shippingManager.trackShipment(
          shipment.provider,
          shipment.tracking_number
        );

        // Update shipment status
        await supabase
          .from('shipments')
          .update({
            status: tracking.status,
            updated_at: new Date(),
            ...(tracking.actualDeliveryDate && {
              delivered_at: tracking.actualDeliveryDate,
            }),
          })
          .eq('id', shipment.id);

        // Update order if status changed
        if (tracking.status !== shipment.status) {
          await updateOrderFromShipmentStatus(shipment.id, tracking.status);
        }

        synced++;
      } catch (error) {
        console.error(`Failed to sync shipment ${shipment.id}:`, error);
        failed++;
      }
    }

    return { synced, failed };
  } catch (error) {
    console.error('Error syncing shipments:', error);
    return { synced: 0, failed: 0 };
  }
}

/**
 * Helper: Map shipment status to order status
 */
function mapShipmentStatusToOrderStatus(shipmentStatus: string): string | null {
  const statusMap: Record<string, string> = {
    'created': 'processing',
    'picked_up': 'shipped',
    'in_transit': 'shipped',
    'out_for_delivery': 'shipped',
    'delivered': 'delivered',
    'cancelled': 'cancelled',
    'returned': 'return_requested',
  };

  return statusMap[shipmentStatus] || null;
}

/**
 * Helper: Get default sender address
 */
async function getDefaultSenderAddress() {
  // This would typically come from settings table
  // For now, return a placeholder
  return {
    name: process.env.COMPANY_NAME || 'Company Name',
    phone: process.env.COMPANY_PHONE || '0123456789',
    address: process.env.COMPANY_ADDRESS || 'Company Address',
    district: process.env.COMPANY_DISTRICT || 'District',
    province: process.env.COMPANY_PROVINCE || 'Bangkok',
    postalCode: process.env.COMPANY_POSTAL_CODE || '10100',
  };
}

/**
 * Helper: Send shipping notification email
 */
async function sendShippingNotification(
  orderId: string,
  trackingNumber: string,
  provider: string
): Promise<void> {
  try {
    // Get order and customer details
    const { data: order } = await supabase
      .from('orders')
      .select('customer_email, order_number')
      .eq('id', orderId)
      .single();

    if (!order || !order.customer_email) {
      return;
    }

    // In a real implementation, this would send an email
    console.log(`Sending shipping notification to ${order.customer_email}`);
    console.log(`Order: ${order.order_number}, Tracking: ${trackingNumber}, Provider: ${provider}`);

    // TODO: Integrate with email service
    // await sendEmail({
    //   to: order.customer_email,
    //   subject: `Your order ${order.order_number} has been shipped`,
    //   template: 'shipping-notification',
    //   data: { orderNumber: order.order_number, trackingNumber, provider }
    // });
  } catch (error) {
    console.error('Error sending shipping notification:', error);
  }
}

/**
 * Helper: Send delivery notification
 */
async function sendDeliveryNotification(
  orderId: string,
  trackingNumber: string
): Promise<void> {
  try {
    const { data: order } = await supabase
      .from('orders')
      .select('customer_email, order_number')
      .eq('id', orderId)
      .single();

    if (!order || !order.customer_email) {
      return;
    }

    console.log(`Sending delivery notification to ${order.customer_email}`);
    console.log(`Order: ${order.order_number}, Tracking: ${trackingNumber}`);

    // TODO: Integrate with email service
  } catch (error) {
    console.error('Error sending delivery notification:', error);
  }
}
