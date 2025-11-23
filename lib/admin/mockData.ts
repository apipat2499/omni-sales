// Mock data for admin dashboard
// This will be replaced with real database queries later

export interface MockOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: {
    product: string;
    qty: number;
    price: number;
  }[];
  total: number;
  status: 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  channel: 'online' | 'offline' | 'phone';
  paymentMethod: string;
  shippingAddress?: string;
  trackingNumber?: string;
}

export interface MockProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  image?: string;
  sku: string;
  status: 'active' | 'inactive';
}

export const mockOrders: MockOrder[] = [
  {
    id: 'ORD-001',
    customerName: 'สมชาย ใจดี',
    customerEmail: 'somchai@example.com',
    customerPhone: '0812345678',
    items: [
      { product: 'เสื้อยืดสีขาว', qty: 2, price: 299 },
      { product: 'กางเกงยีนส์', qty: 1, price: 599 },
    ],
    total: 1197,
    status: 'new',
    createdAt: '2024-11-23T10:30:00Z',
    channel: 'online',
    paymentMethod: 'โอนเงินผ่านธนาคาร',
    shippingAddress: '123 ถนนสุขุมวิท กรุงเทพ 10110',
  },
  {
    id: 'ORD-002',
    customerName: 'สมหญิง รักสวย',
    customerEmail: 'somying@example.com',
    customerPhone: '0987654321',
    items: [
      { product: 'กางเกงยีนส์', qty: 1, price: 599 },
    ],
    total: 599,
    status: 'processing',
    createdAt: '2024-11-22T14:20:00Z',
    channel: 'online',
    paymentMethod: 'บัตรเครดิต',
    shippingAddress: '456 ถนนพหลโยธิน เชียงใหม่ 50000',
  },
  {
    id: 'ORD-003',
    customerName: 'วิชัย มั่งคั่ง',
    customerEmail: 'vichai@example.com',
    customerPhone: '0865432198',
    items: [
      { product: 'รองเท้าผ้าใบ', qty: 1, price: 1499 },
      { product: 'ถุงเท้า', qty: 3, price: 99 },
    ],
    total: 1796,
    status: 'shipped',
    createdAt: '2024-11-21T09:15:00Z',
    channel: 'phone',
    paymentMethod: 'เก็บเงินปลายทาง',
    shippingAddress: '789 ถนนราชดำเนิน ภูเก็ต 83000',
    trackingNumber: 'TH1234567890',
  },
  {
    id: 'ORD-004',
    customerName: 'นันทนา สวยงาม',
    customerEmail: 'nantana@example.com',
    customerPhone: '0823456789',
    items: [
      { product: 'เสื้อเชิ้ตแขนยาว', qty: 2, price: 599 },
    ],
    total: 1198,
    status: 'delivered',
    createdAt: '2024-11-20T16:45:00Z',
    channel: 'online',
    paymentMethod: 'โอนเงินผ่านธนาคาร',
    shippingAddress: '321 ถนนศรีนครินทร์ กรุงเทพ 10250',
  },
  {
    id: 'ORD-005',
    customerName: 'ประยุทธ ขยัน',
    customerEmail: 'prayuth@example.com',
    customerPhone: '0898765432',
    items: [
      { product: 'กระเป๋าสะพาย', qty: 1, price: 899 },
    ],
    total: 899,
    status: 'new',
    createdAt: '2024-11-23T11:00:00Z',
    channel: 'offline',
    paymentMethod: 'เงินสด',
  },
  {
    id: 'ORD-006',
    customerName: 'สุดา แจ่มใส',
    customerEmail: 'suda@example.com',
    customerPhone: '0845678901',
    items: [
      { product: 'หมวกแก๊ป', qty: 3, price: 299 },
      { product: 'ผ้าพันคอ', qty: 1, price: 399 },
    ],
    total: 1296,
    status: 'processing',
    createdAt: '2024-11-22T13:30:00Z',
    channel: 'online',
    paymentMethod: 'PromptPay',
  },
  {
    id: 'ORD-007',
    customerName: 'อนุชา รุ่งเรือง',
    customerEmail: 'anucha@example.com',
    customerPhone: '0876543210',
    items: [
      { product: 'เสื้อยืดสีขาว', qty: 5, price: 299 },
    ],
    total: 1495,
    status: 'shipped',
    createdAt: '2024-11-21T10:00:00Z',
    channel: 'phone',
    paymentMethod: 'โอนเงินผ่านธนาคาร',
    shippingAddress: '555 ถนนเจริญกรุง กรุงเทพ 10500',
    trackingNumber: 'TH0987654321',
  },
  {
    id: 'ORD-008',
    customerName: 'พิมพ์ใจ น่ารัก',
    customerEmail: 'pimjai@example.com',
    customerPhone: '0834567890',
    items: [
      { product: 'กระโปรงยีนส์', qty: 1, price: 699 },
    ],
    total: 699,
    status: 'delivered',
    createdAt: '2024-11-19T15:20:00Z',
    channel: 'online',
    paymentMethod: 'บัตรเครดิต',
  },
];

export const mockProducts: MockProduct[] = [
  {
    id: 'PROD-001',
    name: 'เสื้อยืดสีขาว',
    price: 299,
    stock: 45,
    category: 'เสื้อผ้า',
    sku: 'TEE-WHT-001',
    status: 'active',
  },
  {
    id: 'PROD-002',
    name: 'กางเกงยีนส์',
    price: 599,
    stock: 8,
    category: 'เสื้อผ้า',
    sku: 'JEAN-BLU-001',
    status: 'active',
  },
  {
    id: 'PROD-003',
    name: 'รองเท้าผ้าใบ',
    price: 1499,
    stock: 15,
    category: 'รองเท้า',
    sku: 'SHOE-SNK-001',
    status: 'active',
  },
  {
    id: 'PROD-004',
    name: 'ถุงเท้า',
    price: 99,
    stock: 120,
    category: 'เครื่องประดับ',
    sku: 'SOCK-001',
    status: 'active',
  },
  {
    id: 'PROD-005',
    name: 'เสื้อเชิ้ตแขนยาว',
    price: 599,
    stock: 25,
    category: 'เสื้อผ้า',
    sku: 'SHIRT-001',
    status: 'active',
  },
  {
    id: 'PROD-006',
    name: 'กระเป๋าสะพาย',
    price: 899,
    stock: 6,
    category: 'กระเป๋า',
    sku: 'BAG-001',
    status: 'active',
  },
  {
    id: 'PROD-007',
    name: 'หมวกแก๊ป',
    price: 299,
    stock: 35,
    category: 'เครื่องประดับ',
    sku: 'CAP-001',
    status: 'active',
  },
  {
    id: 'PROD-008',
    name: 'ผ้าพันคอ',
    price: 399,
    stock: 18,
    category: 'เครื่องประดับ',
    sku: 'SCARF-001',
    status: 'active',
  },
  {
    id: 'PROD-009',
    name: 'กระโปรงยีนส์',
    price: 699,
    stock: 3,
    category: 'เสื้อผ้า',
    sku: 'SKIRT-001',
    status: 'active',
  },
  {
    id: 'PROD-010',
    name: 'แจ็คเก็ตหนัง',
    price: 2499,
    stock: 5,
    category: 'เสื้อผ้า',
    sku: 'JACKET-001',
    status: 'active',
  },
];

// Analytics mock data
export const mockAnalytics = {
  revenue: {
    labels: ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน'],
    data: [45000, 52000, 48000, 61000, 58000, 67000],
  },
  ordersByChannel: [
    { channel: 'Online', count: 245, percentage: 61 },
    { channel: 'Offline', count: 98, percentage: 25 },
    { channel: 'Phone', count: 57, percentage: 14 },
  ],
  topProducts: [
    { name: 'เสื้อยืดสีขาว', sales: 156, revenue: 46644 },
    { name: 'กางเกงยีนส์', sales: 98, revenue: 58702 },
    { name: 'รองเท้าผ้าใบ', sales: 67, revenue: 100433 },
    { name: 'เสื้อเชิ้ตแขนยาว', sales: 54, revenue: 32346 },
    { name: 'หมวกแก๊ป', sales: 42, revenue: 12558 },
  ],
  customerStats: {
    total: 1247,
    new: 89,
    returning: 1158,
    avgOrderValue: 1285,
  },
};

// Helper functions
export function getOrderById(orderId: string): MockOrder | undefined {
  return mockOrders.find(order => order.id === orderId);
}

export function getProductById(productId: string): MockProduct | undefined {
  return mockProducts.find(product => product.id === productId);
}

export function getOrderStats() {
  const total = mockOrders.length;
  const newOrders = mockOrders.filter(o => o.status === 'new').length;
  const processing = mockOrders.filter(o => o.status === 'processing').length;
  const shipped = mockOrders.filter(o => o.status === 'shipped').length;
  const delivered = mockOrders.filter(o => o.status === 'delivered').length;
  const totalRevenue = mockOrders.reduce((sum, order) => sum + order.total, 0);

  return {
    total,
    newOrders,
    processing,
    shipped,
    delivered,
    totalRevenue,
  };
}

export function getProductStats() {
  const total = mockProducts.length;
  const lowStock = mockProducts.filter(p => p.stock < 10).length;
  const outOfStock = mockProducts.filter(p => p.stock === 0).length;
  const totalValue = mockProducts.reduce((sum, product) => sum + (product.price * product.stock), 0);

  return {
    total,
    lowStock,
    outOfStock,
    totalValue,
  };
}

export function updateOrderStatus(orderId: string, newStatus: MockOrder['status']): boolean {
  const order = mockOrders.find(o => o.id === orderId);
  if (order) {
    order.status = newStatus;
    return true;
  }
  return false;
}

export function updateProduct(productId: string, updates: Partial<MockProduct>): boolean {
  const productIndex = mockProducts.findIndex(p => p.id === productId);
  if (productIndex !== -1) {
    mockProducts[productIndex] = { ...mockProducts[productIndex], ...updates };
    return true;
  }
  return false;
}
