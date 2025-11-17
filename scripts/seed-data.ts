import { createClient } from '@supabase/supabase-js';

// ใช้ environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ข้อมูลสินค้าตัวอย่าง
const sampleProducts = [
  {
    name: 'iPhone 15 Pro Max',
    description: 'สมาร์ทโฟนรุ่นล่าสุดจาก Apple พร้อม A17 Pro chip',
    price: 50000,
    cost: 40000,
    stock: 25,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1592286927505-b0ce2563d64c?w=400',
    sku: 'IPH-15PM-256',
  },
  {
    name: 'Samsung Galaxy S24 Ultra',
    description: 'สมาร์ทโฟนแฟล็กชิปจาก Samsung',
    price: 42000,
    cost: 33000,
    stock: 30,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400',
    sku: 'SGS-24U-512',
  },
  {
    name: 'MacBook Air M3',
    description: 'โน้ตบุ๊กน้ำหนักเบาพร้อม M3 chip',
    price: 38900,
    cost: 30000,
    stock: 15,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
    sku: 'MBA-M3-13',
  },
  {
    name: 'AirPods Pro 2',
    description: 'หูฟังไร้สายพร้อม Active Noise Cancellation',
    price: 8900,
    cost: 6500,
    stock: 50,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=400',
    sku: 'APP-2-WHT',
  },
  {
    name: 'Sony WH-1000XM5',
    description: 'หูฟังป้องกันเสียงรบกวนชั้นเลิศ',
    price: 13000,
    cost: 9500,
    stock: 20,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400',
    sku: 'SNY-WH1000XM5',
  },
  {
    name: 'iPad Air M2',
    description: 'แท็บเล็ตสำหรับการทำงานและความบันเทิง',
    price: 24900,
    cost: 19000,
    stock: 18,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400',
    sku: 'IPAD-AIR-M2',
  },
];

// ข้อมูลลูกค้าตัวอย่าง
const sampleCustomers = [
  {
    name: 'สมชาย ใจดี',
    email: 'somchai@example.com',
    phone: '081-234-5678',
    address: '123 ถนนสุขุมวิท แขวงคลองเตย กรุงเทพฯ 10110',
    tags: ['vip'],
  },
  {
    name: 'สมหญิง รักสวย',
    email: 'somying@example.com',
    phone: '082-345-6789',
    address: '456 ถนนพหลโยธิน แขวงจตุจักร กรุงเทพฯ 10900',
    tags: ['regular'],
  },
  {
    name: 'บริษัท ABC จำกัด',
    email: 'contact@abc.com',
    phone: '02-123-4567',
    address: '789 ถนนสาทร แขวงยานนาวา กรุงเทพฯ 10120',
    tags: ['wholesale', 'vip'],
  },
  {
    name: 'คุณมานี มีเงิน',
    email: 'manee@example.com',
    phone: '083-456-7890',
    address: '321 ถนนรามคำแหง แขวงหัวหมาก กรุงเทพฯ 10240',
    tags: ['new'],
  },
  {
    name: 'ร้าน XYZ',
    email: 'shop@xyz.com',
    phone: '084-567-8901',
    address: '654 ถนนเพชรบุรี แขวงมักกะสัน กรุงเทพฯ 10400',
    tags: ['wholesale'],
  },
];

async function seedData() {
  try {
    console.log('🌱 เริ่มต้นการเพิ่มข้อมูลตัวอย่าง...\n');

    // ลบข้อมูลเก่าทั้งหมด (ระวัง: ใช้เฉพาะ development)
    console.log('🗑️  กำลังลบข้อมูลเก่า...');
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ ลบข้อมูลเก่าเสร็จสิ้น\n');

    // 1. เพิ่มสินค้า
    console.log('📦 กำลังเพิ่มสินค้า...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .insert(sampleProducts)
      .select();

    if (productsError) {
      console.error('❌ เกิดข้อผิดพลาดในการเพิ่มสินค้า:', productsError);
      return;
    }
    console.log(`✅ เพิ่มสินค้าสำเร็จ ${products?.length} รายการ\n`);

    // 2. เพิ่มลูกค้า
    console.log('👥 กำลังเพิ่มลูกค้า...');
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .insert(sampleCustomers)
      .select();

    if (customersError) {
      console.error('❌ เกิดข้อผิดพลาดในการเพิ่มลูกค้า:', customersError);
      return;
    }
    console.log(`✅ เพิ่มลูกค้าสำเร็จ ${customers?.length} รายการ\n`);

    // 3. เพิ่มคำสั่งซื้อ
    if (products && customers) {
      console.log('🛒 กำลังเพิ่มคำสั่งซื้อ...');

      const sampleOrders = [
        {
          customer_id: customers[0].id,
          status: 'pending',
          channel: 'online',
          subtotal: 50000,
          tax: 3500,
          shipping: 0,
          total: 53500,
          shipping_address: customers[0].address,
          notes: 'ต้องการจัดส่งเร็ว',
        },
        {
          customer_id: customers[1].id,
          status: 'processing',
          channel: 'offline',
          subtotal: 21900,
          tax: 1533,
          shipping: 100,
          total: 23533,
          shipping_address: customers[1].address,
        },
        {
          customer_id: customers[2].id,
          status: 'shipped',
          channel: 'online',
          subtotal: 122900,
          tax: 8603,
          shipping: 0,
          total: 131503,
          shipping_address: customers[2].address,
        },
        {
          customer_id: customers[3].id,
          status: 'delivered',
          channel: 'mobile',
          subtotal: 24900,
          tax: 1743,
          shipping: 150,
          total: 26793,
          shipping_address: customers[3].address,
        },
        {
          customer_id: customers[4].id,
          status: 'pending',
          channel: 'phone',
          subtotal: 26700,
          tax: 1869,
          shipping: 200,
          total: 28769,
          shipping_address: customers[4].address,
          notes: 'โทรยืนยันก่อนจัดส่ง',
        },
      ];

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .insert(sampleOrders)
        .select();

      if (ordersError) {
        console.error('❌ เกิดข้อผิดพลาดในการเพิ่มคำสั่งซื้อ:', ordersError);
        return;
      }
      console.log(`✅ เพิ่มคำสั่งซื้อสำเร็จ ${orders?.length} รายการ\n`);
    }

    console.log('🎉 เพิ่มข้อมูลตัวอย่างสำเร็จทั้งหมด!');
    console.log('\n📊 สรุป:');
    console.log(`   - สินค้า: ${products?.length || 0} รายการ`);
    console.log(`   - ลูกค้า: ${customers?.length || 0} รายการ`);
    console.log(`   - คำสั่งซื้อ: 5 รายการ`);

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  }
}

// เรียกใช้งาน
seedData();
