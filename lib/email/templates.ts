/**
 * Email templates for various system notifications
 */

import { formatCurrency } from '@/lib/utils';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export function orderConfirmationEmail(order: any, customer: any): EmailTemplate {
  return {
    subject: `ยืนยันการสั่งซื้อ #${order.id}`,
    html: `<h1>Order #${order.id}</h1><p>Thank you ${customer.name}!</p>`,
    text: `Order #${order.id}\nThank you ${customer.name}!`,
  };
}

export function lowStockAlertEmail(products: any[]): EmailTemplate {
  return {
    subject: 'แจ้งเตือน: สินค้าใกล้หมด',
    html: `<h1>Low Stock Alert</h1><p>${products.length} products low</p>`,
    text: `Low Stock: ${products.length} products`,
  };
}

export function welcomeEmail(customer: any): EmailTemplate {
  return {
    subject: 'ยินดีต้อนรับสู่ Omni Sales!',
    html: `<h1>Welcome ${customer.name}!</h1>`,
    text: `Welcome ${customer.name}!`,
  };
}
