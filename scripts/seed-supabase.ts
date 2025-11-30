/**
 * Supabase Data Seeding Script
 *
 * สคริปต์สำหรับ seed ข้อมูลทดสอบลง Supabase Database
 *
 * วิธีใช้งาน:
 *   npm run seed:supabase
 *   npm run seed:supabase -- --clear (ลบข้อมูลเก่าก่อน)
 *   npm run seed:supabase -- --products (seed เฉพาะ products)
 *   npm run seed:supabase -- --orders (seed เฉพาะ orders)
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample Products Data
const products = [
  {
    name: 'iPhone 15 Pro',
    category: 'Electronics',
    price: 45900,
    cost: 35000,
    stock: 25,
    sku: 'IPH15P-001',
    description: 'Latest iPhone with A17 Pro chip and titanium design',
  },
  {
    name: 'Samsung Galaxy S24 Ultra',
    category: 'Electronics',
    price: 42900,
    cost: 32000,
    stock: 18,
    sku: 'SAM-S24U-001',
    description: 'Premium Android smartphone with S Pen',
  },
  {
    name: 'MacBook Pro 14"',
    category: 'Electronics',
    price: 89900,
    cost: 70000,
    stock: 12,
    sku: 'MBP14-M3-001',
    description: 'M3 Pro chip with 18GB RAM and 512GB SSD',
  },
  {
    name: 'Nike Air Max 270',
    category: 'Clothing',
    price: 5200,
    cost: 3000,
    stock: 45,
    sku: 'NIKE-AM270-001',
    description: 'Comfortable running shoes with Max Air cushioning',
  },
  {
    name: 'Adidas Ultraboost 22',
    category: 'Clothing',
    price: 6200,
    cost: 3500,
    stock: 38,
    sku: 'ADI-UB22-001',
    description: 'Premium running shoes with Boost technology',
  },
  {
    name: 'Arabica Coffee Beans 1kg',
    category: 'Food & Beverage',
    price: 650,
    cost: 400,
    stock: 120,
    sku: 'COF-ARB-1KG',
    description: 'Premium Arabica coffee beans from Thailand',
  },
  {
    name: 'Japanese Green Tea Set',
    category: 'Food & Beverage',
    price: 1200,
    cost: 700,
    stock: 8,
    sku: 'TEA-JPN-SET',
    description: 'Authentic Japanese green tea collection',
  },
  {
    name: 'Modern Sofa 3-Seater',
    category: 'Home & Garden',
    price: 24900,
    cost: 15000,
    stock: 6,
    sku: 'SOF-MOD-3S',
    description: 'Contemporary fabric sofa with wooden legs',
  },
  {
    name: 'Garden Tool Set',
    category: 'Home & Garden',
    price: 2800,
    cost: 1500,
    stock: 22,
    sku: 'GRD-TLS-PRO',
    description: 'Professional 10-piece gardening tool set',
  },
  {
    name: 'Yoga Mat Premium',
    category: 'Sports',
    price: 1500,
    cost: 800,
    stock: 55,
    sku: 'YOG-MAT-PRO',
    description: 'Eco-friendly yoga mat with carrying strap',
  },
  {
    name: 'Bluetooth Speaker',
    category: 'Electronics',
    price: 2900,
    cost: 1800,
    stock: 32,
    sku: 'SPK-BT-001',
    description: 'Portable waterproof Bluetooth speaker',
  },
  {
    name: 'Wireless Earbuds',
    category: 'Electronics',
    price: 4500,
    cost: 2800,
    stock: 28,
    sku: 'EAR-WL-001',
    description: 'True wireless earbuds with active noise cancellation',
  },
];

// Sample Customers Data
const customers = [
  {
    name: 'สมชาย ใจดี',
    email: 'somchai@example.com',
    phone: '081-234-5678',
    address: '123 ถนนสุขุมวิท กรุงเทพฯ 10110',
  },
  {
    name: 'สมหญิง รักสวย',
    email: 'somying@example.com',
    phone: '082-345-6789',
    address: '456 ถนนพระราม 4 กรุงเทพฯ 10330',
  },
  {
    name: 'วิชัย มีสุข',
    email: 'wichai@example.com',
    phone: '083-456-7890',
    address: '789 ถนนลาดพร้าว กรุงเทพฯ 10230',
  },
  {
    name: 'บริษัท ABC จำกัด',
    email: 'abc@company.com',
    phone: '084-567-8901',
    address: '321 ถนนสาทร กรุงเทพฯ 10120',
  },
  {
    name: 'ปิยะ สวยงาม',
    email: 'piya@example.com',
    phone: '085-678-9012',
    address: '654 ถนนรัชดา กรุงเทพฯ 10400',
  },
];

// Helper function to create orders
function createSampleOrders(customerIds: string[], productIds: string[]) {
  const orders = [];
  const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  const channels = ['online', 'offline', 'mobile', 'phone'];
  const paymentMethods = ['Credit Card', 'E-Wallet', 'Bank Transfer', 'COD', 'Invoice'];

  for (let i = 0; i < 15; i++) {
    const customerId = customerIds[Math.floor(Math.random() * customerIds.length)];
    const numItems = Math.floor(Math.random() * 3) + 1;
    const items = [];
    let subtotal = 0;

    for (let j = 0; j < numItems; j++) {
      const productId = productIds[Math.floor(Math.random() * productIds.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const price = products.find(p => p.name === productId)?.price || 1000;

      items.push({
        product_id: productId,
        product_name: products.find(p => p.name === productId)?.name || 'Product',
        quantity,
        price,
      });

      subtotal += price * quantity;
    }

    const tax = subtotal * 0.07;
    const shipping = subtotal > 10000 ? 0 : 100;
    const total = subtotal + tax + shipping;

    const createdDaysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - createdDaysAgo);

    orders.push({
      customer_id: customerId,
      customer_name: customers.find(c => c.email === customerId)?.name || 'Customer',
      subtotal,
      tax,
      shipping,
      total,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      channel: channels[Math.floor(Math.random() * channels.length)],
      payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      shipping_address: customers.find(c => c.email === customerId)?.address || 'Address',
      created_at: createdAt.toISOString(),
      updated_at: new Date().toISOString(),
      items,
    });
  }

  return orders;
}

// Main seeding function
async function seed() {
  const args = process.argv.slice(2);
  const shouldClear = args.includes('--clear');
  const seedProducts = args.includes('--products') || args.length === 0 || shouldClear;
  const seedOrders = args.includes('--orders') || args.length === 0 || shouldClear;

  console.log('🌱 Starting database seeding...\n');

  try {
    // Clear existing data if requested
    if (shouldClear) {
      console.log('🧹 Clearing existing data...');

      await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      console.log('✅ Existing data cleared\n');
    }

    // Seed Products
    if (seedProducts) {
      console.log('📦 Seeding products...');
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .insert(products)
        .select();

      if (productsError) {
        console.error('❌ Error seeding products:', productsError.message);
      } else {
        console.log(`✅ Successfully seeded ${productsData?.length || 0} products\n`);
      }
    }

    // Seed Customers
    console.log('👥 Seeding customers...');
    const { data: customersData, error: customersError } = await supabase
      .from('customers')
      .insert(customers)
      .select();

    if (customersError) {
      console.error('❌ Error seeding customers:', customersError.message);
    } else {
      console.log(`✅ Successfully seeded ${customersData?.length || 0} customers\n`);
    }

    // Seed Orders (if customers and products exist)
    if (seedOrders && customersData && customersData.length > 0) {
      console.log('📋 Seeding orders...');

      // Get product IDs
      const { data: allProducts } = await supabase.from('products').select('id, name');
      const productIds = allProducts?.map(p => p.id) || [];
      const customerIds = customersData.map(c => c.id);

      if (productIds.length > 0) {
        const ordersData = createSampleOrders(customerIds, productIds);

        for (const orderData of ordersData) {
          const { items, ...orderFields } = orderData;

          // Insert order
          const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert(orderFields)
            .select()
            .single();

          if (orderError) {
            console.error('❌ Error creating order:', orderError.message);
            continue;
          }

          // Insert order items
          if (order && items.length > 0) {
            const orderItems = items.map(item => ({
              ...item,
              order_id: order.id,
            }));

            const { error: itemsError } = await supabase
              .from('order_items')
              .insert(orderItems);

            if (itemsError) {
              console.error('❌ Error creating order items:', itemsError.message);
            }
          }
        }

        console.log(`✅ Successfully seeded ${ordersData.length} orders\n`);
      }
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Products: ${products.length}`);
    console.log(`   Customers: ${customers.length}`);
    console.log(`   Orders: ~15 with multiple items`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeding
seed();
