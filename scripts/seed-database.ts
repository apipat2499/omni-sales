import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // 1. Insert Customers
    console.log('📝 Inserting customers...');
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .insert([
        {
          name: 'สมชาย ใจดี',
          email: 'somchai@example.com',
          phone: '0812345678',
          address: '123 ถนนสุขุมวิท กรุงเทพ 10110',
        },
        {
          name: 'สมหญิง รักสวย',
          email: 'somying@example.com',
          phone: '0987654321',
          address: '456 ถนนพหลโยธิน เชียงใหม่ 50000',
        },
        {
          name: 'วิชัย มั่งคั่ง',
          email: 'vichai@example.com',
          phone: '0865432198',
          address: '789 ถนนราชดำเนิน ภูเก็ต 83000',
        },
        {
          name: 'นันทนา สวยงาม',
          email: 'nantana@example.com',
          phone: '0823456789',
          address: '321 ถนนศรีนครินทร์ กรุงเทพ 10250',
        },
        {
          name: 'ประยุทธ ขยัน',
          email: 'prayuth@example.com',
          phone: '0898765432',
          address: '555 ถนนเพชรบุรี กรุงเทพ 10400',
        },
      ])
      .select();

    if (customersError) throw customersError;
    console.log(`✅ Inserted ${customers?.length} customers\n`);

    // 2. Insert Products
    console.log('📦 Inserting products...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .insert([
        {
          name: 'เสื้อยืดสีขาว',
          description: 'เสื้อยืดคอกลม ผ้าฝ้าย 100%',
          price: 299,
          stock: 45,
          category: 'เสื้อผ้า',
          sku: 'TEE-WHT-001',
          status: 'active',
        },
        {
          name: 'กางเกงยีนส์',
          description: 'กางเกงยีนส์ขายาว ทรงสลิม',
          price: 599,
          stock: 30,
          category: 'เสื้อผ้า',
          sku: 'JEAN-BLU-001',
          status: 'active',
        },
        {
          name: 'รองเท้าผ้าใบ',
          description: 'รองเท้าผ้าใบสำหรับวิ่ง',
          price: 1499,
          stock: 15,
          category: 'รองเท้า',
          sku: 'SHOE-SNK-001',
          status: 'active',
        },
        {
          name: 'กระเป๋าสะพาย',
          description: 'กระเป๋าสะพายหนังแท้',
          price: 899,
          stock: 20,
          category: 'กระเป๋า',
          sku: 'BAG-001',
          status: 'active',
        },
        {
          name: 'หมวกแก๊ป',
          description: 'หมวกแก๊ปปักโลโก้',
          price: 299,
          stock: 50,
          category: 'เครื่องประดับ',
          sku: 'CAP-001',
          status: 'active',
        },
      ])
      .select();

    if (productsError) throw productsError;
    console.log(`✅ Inserted ${products?.length} products\n`);

    if (!customers || !products || customers.length === 0 || products.length === 0) {
      throw new Error('Failed to insert customers or products');
    }

    // 3. Insert Orders
    console.log('🛒 Inserting orders...');
    const orders = [
      {
        customer_id: customers[0].id,
        customer_name: customers[0].name,
        customer_email: customers[0].email,
        customer_phone: customers[0].phone,
        subtotal: 1197,
        tax: 0,
        shipping: 0,
        total: 1197,
        status: 'new',
        channel: 'online',
        payment_method: 'โอนเงินผ่านธนาคาร',
        shipping_address: customers[0].address,
      },
      {
        customer_id: customers[1].id,
        customer_name: customers[1].name,
        customer_email: customers[1].email,
        customer_phone: customers[1].phone,
        subtotal: 599,
        tax: 0,
        shipping: 0,
        total: 599,
        status: 'processing',
        channel: 'online',
        payment_method: 'บัตรเครดิต',
        shipping_address: customers[1].address,
      },
      {
        customer_id: customers[2].id,
        customer_name: customers[2].name,
        customer_email: customers[2].email,
        customer_phone: customers[2].phone,
        subtotal: 1499,
        tax: 0,
        shipping: 0,
        total: 1499,
        status: 'shipped',
        channel: 'phone',
        payment_method: 'เก็บเงินปลายทาง',
        shipping_address: customers[2].address,
      },
      {
        customer_id: customers[3].id,
        customer_name: customers[3].name,
        customer_email: customers[3].email,
        customer_phone: customers[3].phone,
        subtotal: 899,
        tax: 0,
        shipping: 0,
        total: 899,
        status: 'delivered',
        channel: 'online',
        payment_method: 'โอนเงินผ่านธนาคาร',
        shipping_address: customers[3].address,
      },
      {
        customer_id: customers[4].id,
        customer_name: customers[4].name,
        customer_email: customers[4].email,
        customer_phone: customers[4].phone,
        subtotal: 299,
        tax: 0,
        shipping: 0,
        total: 299,
        status: 'new',
        channel: 'offline',
        payment_method: 'เงินสด',
      },
      {
        customer_id: customers[0].id,
        customer_name: customers[0].name,
        customer_email: customers[0].email,
        customer_phone: customers[0].phone,
        subtotal: 1798,
        tax: 0,
        shipping: 0,
        total: 1798,
        status: 'processing',
        channel: 'online',
        payment_method: 'PromptPay',
        shipping_address: customers[0].address,
      },
      {
        customer_id: customers[1].id,
        customer_name: customers[1].name,
        customer_email: customers[1].email,
        customer_phone: customers[1].phone,
        subtotal: 598,
        tax: 0,
        shipping: 0,
        total: 598,
        status: 'delivered',
        channel: 'online',
        payment_method: 'บัตรเครดิต',
        shipping_address: customers[1].address,
      },
      {
        customer_id: customers[2].id,
        customer_name: customers[2].name,
        customer_email: customers[2].email,
        customer_phone: customers[2].phone,
        subtotal: 1197,
        tax: 0,
        shipping: 0,
        total: 1197,
        status: 'delivered',
        channel: 'phone',
        payment_method: 'โอนเงินผ่านธนาคาร',
        shipping_address: customers[2].address,
      },
    ];

    const { data: insertedOrders, error: ordersError } = await supabase
      .from('orders')
      .insert(orders)
      .select();

    if (ordersError) throw ordersError;
    console.log(`✅ Inserted ${insertedOrders?.length} orders\n`);

    if (!insertedOrders || insertedOrders.length === 0) {
      throw new Error('Failed to insert orders');
    }

    // 4. Insert Order Items
    console.log('📋 Inserting order items...');
    const orderItems = [
      // Order 1: เสื้อยืด 2 ชิ้น + กางเกงยีนส์ 1 ชิ้น
      {
        order_id: insertedOrders[0].id,
        product_id: products[0].id,
        product_name: products[0].name,
        quantity: 2,
        price: products[0].price,
      },
      {
        order_id: insertedOrders[0].id,
        product_id: products[1].id,
        product_name: products[1].name,
        quantity: 1,
        price: products[1].price,
      },
      // Order 2: กางเกงยีนส์ 1 ชิ้น
      {
        order_id: insertedOrders[1].id,
        product_id: products[1].id,
        product_name: products[1].name,
        quantity: 1,
        price: products[1].price,
      },
      // Order 3: รองเท้าผ้าใบ 1 ชิ้น
      {
        order_id: insertedOrders[2].id,
        product_id: products[2].id,
        product_name: products[2].name,
        quantity: 1,
        price: products[2].price,
      },
      // Order 4: กระเป๋าสะพาย 1 ชิ้น
      {
        order_id: insertedOrders[3].id,
        product_id: products[3].id,
        product_name: products[3].name,
        quantity: 1,
        price: products[3].price,
      },
      // Order 5: หมวกแก๊ป 1 ชิ้น
      {
        order_id: insertedOrders[4].id,
        product_id: products[4].id,
        product_name: products[4].name,
        quantity: 1,
        price: products[4].price,
      },
      // Order 6: รองเท้าผ้าใบ 1 + หมวกแก๊ป 1
      {
        order_id: insertedOrders[5].id,
        product_id: products[2].id,
        product_name: products[2].name,
        quantity: 1,
        price: products[2].price,
      },
      {
        order_id: insertedOrders[5].id,
        product_id: products[4].id,
        product_name: products[4].name,
        quantity: 1,
        price: products[4].price,
      },
      // Order 7: เสื้อยืด 2 ชิ้น
      {
        order_id: insertedOrders[6].id,
        product_id: products[0].id,
        product_name: products[0].name,
        quantity: 2,
        price: products[0].price,
      },
      // Order 8: เสื้อยืด 2 + กางเกงยีนส์ 1
      {
        order_id: insertedOrders[7].id,
        product_id: products[0].id,
        product_name: products[0].name,
        quantity: 2,
        price: products[0].price,
      },
      {
        order_id: insertedOrders[7].id,
        product_id: products[1].id,
        product_name: products[1].name,
        quantity: 1,
        price: products[1].price,
      },
    ];

    const { data: insertedItems, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select();

    if (itemsError) throw itemsError;
    console.log(`✅ Inserted ${insertedItems?.length} order items\n`);

    console.log('✨ Database seeding completed successfully!\n');
    console.log('Summary:');
    console.log(`- Customers: ${customers.length}`);
    console.log(`- Products: ${products.length}`);
    console.log(`- Orders: ${insertedOrders.length}`);
    console.log(`- Order Items: ${insertedItems?.length}`);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();
