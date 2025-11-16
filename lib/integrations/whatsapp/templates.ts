/**
 * WhatsApp Message Templates - Thai Language Support
 * Pre-configured templates for various business scenarios
 */

import type { MessageTemplate, TemplateComponent } from './types';

// ============================================
// Thai Language Templates
// ============================================

/**
 * Order Confirmation Template (Thai)
 */
export const orderConfirmationTemplate: MessageTemplate = {
  name: 'order_confirmation_th',
  language: 'th',
  category: 'UTILITY',
  components: [
    {
      type: 'HEADER',
      format: 'TEXT',
      text: 'ยืนยันคำสั่งซื้อ ✅',
    },
    {
      type: 'BODY',
      text: 'สวัสดีค่ะคุณ {{1}}\n\nเราได้รับคำสั่งซื้อของคุณเรียบร้อยแล้ว\n\n📦 หมายเลขคำสั่งซื้อ: {{2}}\n💰 ยอดรวม: {{3}} บาท\n📅 วันที่สั่งซื้อ: {{4}}\n\nเราจะดำเนินการจัดส่งสินค้าของคุณโดยเร็วที่สุด ขอบคุณที่ไว้วางใจเราค่ะ',
      example: {
        body_text: [['สมชาย', 'ORD-12345', '1,250', '15/11/2567']],
      },
    },
    {
      type: 'FOOTER',
      text: 'ติดตามสถานะได้ทุกเมื่อ',
    },
    {
      type: 'BUTTONS',
      buttons: [
        {
          type: 'QUICK_REPLY',
          text: '📍 ติดตามสถานะ',
        },
        {
          type: 'QUICK_REPLY',
          text: '💬 ติดต่อเรา',
        },
      ],
    },
  ],
};

/**
 * Shipping Update Template (Thai)
 */
export const shippingUpdateTemplate: MessageTemplate = {
  name: 'shipping_update_th',
  language: 'th',
  category: 'UTILITY',
  components: [
    {
      type: 'HEADER',
      format: 'TEXT',
      text: 'สินค้าของคุณกำลังจัดส่ง 🚚',
    },
    {
      type: 'BODY',
      text: 'สวัสดีค่ะคุณ {{1}}\n\nสินค้าของคุณกำลังอยู่ระหว่างการจัดส่ง\n\n📦 หมายเลขคำสั่งซื้อ: {{2}}\n🚚 ขนส่ง: {{3}}\n📍 หมายเลขติดตาม: {{4}}\n⏰ คาดว่าจะถึง: {{5}}\n\nคุณสามารถติดตามพัสดุได้แล้ววันนี้',
      example: {
        body_text: [['สมชาย', 'ORD-12345', 'Kerry Express', 'KE123456789TH', '16/11/2567']],
      },
    },
    {
      type: 'FOOTER',
      text: 'ติดตามได้ตลอด 24 ชั่วโมง',
    },
    {
      type: 'BUTTONS',
      buttons: [
        {
          type: 'URL',
          text: '🔍 ติดตามพัสดุ',
          url: 'https://tracking.example.com/{{1}}',
        },
      ],
    },
  ],
};

/**
 * Delivery Confirmation Template (Thai)
 */
export const deliveryConfirmationTemplate: MessageTemplate = {
  name: 'delivery_confirmation_th',
  language: 'th',
  category: 'UTILITY',
  components: [
    {
      type: 'HEADER',
      format: 'TEXT',
      text: 'จัดส่งสำเร็จแล้ว ✅',
    },
    {
      type: 'BODY',
      text: 'สวัสดีค่ะคุณ {{1}}\n\n🎉 สินค้าของคุณได้ถูกจัดส่งเรียบร้อยแล้ว!\n\n📦 หมายเลขคำสั่งซื้อ: {{2}}\n📅 จัดส่งเมื่อ: {{3}}\n\nหวังว่าคุณจะพอใจกับสินค้าของเรานะคะ ขอบคุณที่ไว้วางใจค่ะ',
      example: {
        body_text: [['สมชาย', 'ORD-12345', '16/11/2567 14:30']],
      },
    },
    {
      type: 'BUTTONS',
      buttons: [
        {
          type: 'QUICK_REPLY',
          text: '⭐ รีวิวสินค้า',
        },
        {
          type: 'QUICK_REPLY',
          text: '🛒 สั่งซื้ออีกครั้ง',
        },
      ],
    },
  ],
};

/**
 * Payment Reminder Template (Thai)
 */
export const paymentReminderTemplate: MessageTemplate = {
  name: 'payment_reminder_th',
  language: 'th',
  category: 'UTILITY',
  components: [
    {
      type: 'HEADER',
      format: 'TEXT',
      text: 'แจ้งเตือนการชำระเงิน 💳',
    },
    {
      type: 'BODY',
      text: 'สวัสดีค่ะคุณ {{1}}\n\nเรายังไม่ได้รับการชำระเงินสำหรับคำสั่งซื้อของคุณ\n\n📦 หมายเลขคำสั่งซื้อ: {{2}}\n💰 จำนวนเงิน: {{3}} บาท\n⏰ กำหนดชำระ: {{4}}\n\nกรุณาชำระเงินภายในกำหนดเพื่อให้เราจัดส่งสินค้าให้คุณค่ะ',
      example: {
        body_text: [['สมชาย', 'ORD-12345', '1,250', '17/11/2567']],
      },
    },
    {
      type: 'BUTTONS',
      buttons: [
        {
          type: 'URL',
          text: '💳 ชำระเงินเลย',
          url: 'https://payment.example.com/{{1}}',
        },
      ],
    },
  ],
};

/**
 * Promotional Campaign Template (Thai)
 */
export const promotionalCampaignTemplate: MessageTemplate = {
  name: 'promotional_campaign_th',
  language: 'th',
  category: 'MARKETING',
  components: [
    {
      type: 'HEADER',
      format: 'IMAGE',
    },
    {
      type: 'BODY',
      text: '🎉 โปรโมชั่นพิเศษเฉพาะคุณ!\n\n{{1}}\n\n✨ ส่วนลด: {{2}}%\n⏰ ใช้ได้ถึง: {{3}}\n🏷️ รหัสส่วนลด: {{4}}\n\nอย่าพลาดโอกาสดีๆ นี้นะคะ!',
      example: {
        body_text: [['Flash Sale! ลดสูงสุด 50%', '30', '20/11/2567', 'FLASH30']],
      },
    },
    {
      type: 'FOOTER',
      text: 'เงื่อนไขเป็นไปตามที่บริษัทกำหนด',
    },
    {
      type: 'BUTTONS',
      buttons: [
        {
          type: 'URL',
          text: '🛒 ช้อปเลย',
          url: 'https://shop.example.com/promo/{{1}}',
        },
      ],
    },
  ],
};

/**
 * Customer Support Template (Thai)
 */
export const customerSupportTemplate: MessageTemplate = {
  name: 'customer_support_th',
  language: 'th',
  category: 'UTILITY',
  components: [
    {
      type: 'HEADER',
      format: 'TEXT',
      text: 'ฝ่ายบริการลูกค้า 💬',
    },
    {
      type: 'BODY',
      text: 'สวัสดีค่ะคุณ {{1}}\n\nขอบคุณที่ติดต่อเรา เราได้รับเรื่องของคุณแล้ว\n\n📋 หมายเลขตั๋ว: {{2}}\n📌 เรื่อง: {{3}}\n⏰ เวลา: {{4}}\n\nทีมงานของเราจะติดต่อกลับโดยเร็วที่สุดค่ะ',
      example: {
        body_text: [['สมชาย', 'TICKET-12345', 'สอบถามเรื่องการจัดส่ง', '15/11/2567 10:30']],
      },
    },
    {
      type: 'BUTTONS',
      buttons: [
        {
          type: 'QUICK_REPLY',
          text: '📞 โทรหาเรา',
        },
        {
          type: 'QUICK_REPLY',
          text: '📧 ส่งอีเมล',
        },
      ],
    },
  ],
};

/**
 * Abandoned Cart Template (Thai)
 */
export const abandonedCartTemplate: MessageTemplate = {
  name: 'abandoned_cart_th',
  language: 'th',
  category: 'MARKETING',
  components: [
    {
      type: 'HEADER',
      format: 'TEXT',
      text: 'คุณลืมของไว้ในตะกร้าแล้ว 🛒',
    },
    {
      type: 'BODY',
      text: 'สวัสดีค่ะคุณ {{1}}\n\nเราเห็นว่าคุณมีสินค้าที่ยังไม่ได้ชำระเงินอยู่ในตะกร้า\n\n🛒 จำนวนสินค้า: {{2}} รายการ\n💰 มูลค่ารวม: {{3}} บาท\n\nกลับมาทำรายการให้เสร็จกันเถอะค่ะ!\n\n🎁 พิเศษ! รับส่วนลด {{4}}% สำหรับการสั่งซื้อวันนี้',
      example: {
        body_text: [['สมชาย', '3', '2,500', '10']],
      },
    },
    {
      type: 'BUTTONS',
      buttons: [
        {
          type: 'URL',
          text: '🛒 กลับไปที่ตะกร้า',
          url: 'https://shop.example.com/cart',
        },
      ],
    },
  ],
};

/**
 * Review Request Template (Thai)
 */
export const reviewRequestTemplate: MessageTemplate = {
  name: 'review_request_th',
  language: 'th',
  category: 'UTILITY',
  components: [
    {
      type: 'HEADER',
      format: 'TEXT',
      text: 'ขอรีวิวสินค้าหน่อยค่ะ ⭐',
    },
    {
      type: 'BODY',
      text: 'สวัสดีค่ะคุณ {{1}}\n\nคุณพอใจกับสินค้าของเราหรือไม่คะ?\n\n📦 สินค้า: {{2}}\n📅 ซื้อเมื่อ: {{3}}\n\nรีวิวจากคุณช่วยให้ลูกค้าคนอื่นๆ ตัดสินใจได้ง่ายขึ้นค่ะ ขอบคุณมากค่ะ 🙏',
      example: {
        body_text: [['สมชาย', 'iPhone 15 Pro Max', '10/11/2567']],
      },
    },
    {
      type: 'BUTTONS',
      buttons: [
        {
          type: 'URL',
          text: '⭐ รีวิวเลย',
          url: 'https://shop.example.com/review/{{1}}',
        },
      ],
    },
  ],
};

/**
 * Stock Alert Template (Thai)
 */
export const stockAlertTemplate: MessageTemplate = {
  name: 'stock_alert_th',
  language: 'th',
  category: 'MARKETING',
  components: [
    {
      type: 'HEADER',
      format: 'TEXT',
      text: 'สินค้ากลับมามีสต็อกแล้ว! 🎉',
    },
    {
      type: 'BODY',
      text: 'สวัสดีค่ะคุณ {{1}}\n\nสินค้าที่คุณรอคอยกลับมามีสต็อกแล้วค่ะ!\n\n📦 สินค้า: {{2}}\n💰 ราคา: {{3}} บาท\n📊 เหลือ: {{4}} ชิ้น\n\nรีบสั่งซื้อก่อนของจะหมดอีกนะคะ!',
      example: {
        body_text: [['สมชาย', 'iPhone 15 Pro Max 256GB', '42,900', '15']],
      },
    },
    {
      type: 'BUTTONS',
      buttons: [
        {
          type: 'URL',
          text: '🛒 ซื้อเลย',
          url: 'https://shop.example.com/product/{{1}}',
        },
      ],
    },
  ],
};

// ============================================
// Template Helper Functions
// ============================================

/**
 * Format order confirmation message
 */
export function formatOrderConfirmation(data: {
  customerName: string;
  orderNumber: string;
  totalAmount: number;
  orderDate: string;
}): any[] {
  return [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: data.customerName },
        { type: 'text', text: data.orderNumber },
        { type: 'text', text: data.totalAmount.toLocaleString('th-TH') },
        { type: 'text', text: data.orderDate },
      ],
    },
  ];
}

/**
 * Format shipping update message
 */
export function formatShippingUpdate(data: {
  customerName: string;
  orderNumber: string;
  carrier: string;
  trackingNumber: string;
  estimatedDelivery: string;
}): any[] {
  return [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: data.customerName },
        { type: 'text', text: data.orderNumber },
        { type: 'text', text: data.carrier },
        { type: 'text', text: data.trackingNumber },
        { type: 'text', text: data.estimatedDelivery },
      ],
    },
    {
      type: 'button',
      sub_type: 'url',
      index: 0,
      parameters: [{ type: 'text', text: data.trackingNumber }],
    },
  ];
}

/**
 * Format delivery confirmation message
 */
export function formatDeliveryConfirmation(data: {
  customerName: string;
  orderNumber: string;
  deliveryTime: string;
}): any[] {
  return [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: data.customerName },
        { type: 'text', text: data.orderNumber },
        { type: 'text', text: data.deliveryTime },
      ],
    },
  ];
}

/**
 * Format payment reminder message
 */
export function formatPaymentReminder(data: {
  customerName: string;
  orderNumber: string;
  amount: number;
  dueDate: string;
}): any[] {
  return [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: data.customerName },
        { type: 'text', text: data.orderNumber },
        { type: 'text', text: data.amount.toLocaleString('th-TH') },
        { type: 'text', text: data.dueDate },
      ],
    },
    {
      type: 'button',
      sub_type: 'url',
      index: 0,
      parameters: [{ type: 'text', text: data.orderNumber }],
    },
  ];
}

/**
 * Format promotional campaign message
 */
export function formatPromotionalCampaign(data: {
  imageUrl: string;
  campaignName: string;
  discount: number;
  expiryDate: string;
  couponCode: string;
}): any[] {
  return [
    {
      type: 'header',
      parameters: [{ type: 'image', image: { link: data.imageUrl } }],
    },
    {
      type: 'body',
      parameters: [
        { type: 'text', text: data.campaignName },
        { type: 'text', text: data.discount.toString() },
        { type: 'text', text: data.expiryDate },
        { type: 'text', text: data.couponCode },
      ],
    },
    {
      type: 'button',
      sub_type: 'url',
      index: 0,
      parameters: [{ type: 'text', text: data.couponCode }],
    },
  ];
}

/**
 * Get all Thai templates
 */
export function getAllThaiTemplates(): MessageTemplate[] {
  return [
    orderConfirmationTemplate,
    shippingUpdateTemplate,
    deliveryConfirmationTemplate,
    paymentReminderTemplate,
    promotionalCampaignTemplate,
    customerSupportTemplate,
    abandonedCartTemplate,
    reviewRequestTemplate,
    stockAlertTemplate,
  ];
}

/**
 * Get template by name
 */
export function getTemplateByName(name: string): MessageTemplate | undefined {
  const templates = getAllThaiTemplates();
  return templates.find((template) => template.name === name);
}
