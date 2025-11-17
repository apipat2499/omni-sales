import type { SalesStats, ChartDataPoint, CategorySales, Order, OrderItem, Discount } from '@/types';

function minutesAgo(mins: number) {
  const date = new Date();
  date.setMinutes(date.getMinutes() - mins);
  return date;
}

const demoOrdersSeed: Order[] = [
  {
    id: 'demo-1001',
    customerId: 'cust-001',
    customerName: 'คุณลลิตา',
    items: [
      { productId: 'prod-espresso', productName: 'เซ็ตเอสเพรสโซ่', quantity: 2, price: 420, totalPrice: 840 },
    ] as OrderItem[],
    subtotal: 1200,
    tax: 84,
    shipping: 40,
    total: 1324,
    status: 'processing',
    channel: 'online',
    paymentMethod: 'credit_card',
    createdAt: minutesAgo(15),
    updatedAt: minutesAgo(10),
  },
  {
    id: 'demo-1002',
    customerId: 'cust-002',
    customerName: 'คุณภัทร',
    items: [
      { productId: 'prod-grinder', productName: 'เครื่องบดกาแฟ', quantity: 1, price: 3200, totalPrice: 3200 },
    ],
    subtotal: 3200,
    tax: 224,
    shipping: 0,
    total: 3424,
    status: 'shipped',
    channel: 'offline',
    paymentMethod: 'cash',
    createdAt: minutesAgo(45),
    updatedAt: minutesAgo(20),
  },
  {
    id: 'demo-1003',
    customerId: 'cust-003',
    customerName: 'บริษัท เทสไทย',
    items: [
      { productId: 'prod-beans', productName: 'เมล็ดกาแฟ House Blend', quantity: 10, price: 250, totalPrice: 2500 },
    ],
    subtotal: 2500,
    tax: 175,
    shipping: 120,
    total: 2795,
    status: 'pending',
    channel: 'phone',
    paymentMethod: 'invoice',
    createdAt: minutesAgo(90),
    updatedAt: minutesAgo(80),
  },
];

const demoDiscountSeed: Discount[] = [
  {
    id: 'disc-demo-1',
    code: 'FLASH50',
    name: 'Flash Sale 50%',
    type: 'percentage',
    value: 50,
    minPurchaseAmount: 1000,
    usageCount: 28,
    usageLimit: 50,
    startDate: minutesAgo(60 * 24 * 2),
    endDate: minutesAgo(-60 * 24),
    active: true,
    appliesTo: 'all',
    createdAt: minutesAgo(60 * 24 * 3),
    updatedAt: minutesAgo(10),
  },
  {
    id: 'disc-demo-2',
    code: 'WELCOME250',
    name: 'ส่วนลดลูกค้าใหม่',
    type: 'fixed',
    value: 250,
    minPurchaseAmount: 2000,
    usageCount: 112,
    usageLimit: 500,
    startDate: minutesAgo(60 * 24 * 30),
    endDate: undefined,
    active: true,
    appliesTo: 'all',
    createdAt: minutesAgo(60 * 24 * 40),
    updatedAt: minutesAgo(120),
  },
];

export const demoDashboardStats: SalesStats = {
  totalRevenue: 1280000,
  totalOrders: 1842,
  totalCustomers: 612,
  averageOrderValue: 695,
  revenueGrowth: 0.18,
  ordersGrowth: 0.12,
  customersGrowth: 0.22,
};

export const demoChartData: ChartDataPoint[] = Array.from({ length: 14 }).map((_, index) => {
  const base = new Date();
  base.setDate(base.getDate() - (13 - index));
  return {
    date: base.toISOString().slice(0, 10),
    revenue: 45000 + index * 3500 + (index % 3) * 1500,
    orders: 40 + index * 3,
  };
});

export const demoCategorySales: CategorySales[] = [
  { category: 'กาแฟพร้อมดื่ม', value: 420000, percentage: 0.35 },
  { category: 'อุปกรณ์', value: 320000, percentage: 0.27 },
  { category: 'เมล็ดกาแฟ', value: 280000, percentage: 0.22 },
  { category: 'อื่น ๆ', value: 260000, percentage: 0.16 },
];

export function getDemoOrders(): Order[] {
  return demoOrdersSeed.map((order) => ({
    ...order,
    createdAt: new Date(order.createdAt),
    updatedAt: new Date(order.updatedAt),
    deliveredAt: order.deliveredAt ? new Date(order.deliveredAt) : undefined,
    items: order.items.map((item) => ({ ...item })),
  }));
}

export function getDemoDiscounts(): Discount[] {
  return demoDiscountSeed.map((discount) => ({
    ...discount,
    startDate: discount.startDate ? new Date(discount.startDate) : undefined,
    endDate: discount.endDate ? new Date(discount.endDate) : undefined,
    createdAt: new Date(discount.createdAt),
    updatedAt: new Date(discount.updatedAt),
  }));
}
