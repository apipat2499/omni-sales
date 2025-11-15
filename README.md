# 🛒 Omni Sales - ระบบจัดการขาย Omnichannel

ระบบจัดการขายออนไลน์และออฟไลน์แบบครบวงจร พัฒนาด้วย Next.js 14 และ TypeScript

## ✨ ฟีเจอร์หลัก

### ✅ ฟีเจอร์ที่พร้อมใช้งาน

- 🏠 **Landing Page** - หน้าแรกแสดงฟีเจอร์และช่องทางการขาย
- 📊 **Dashboard** - ภาพรวมธุรกิจด้วยกราฟและสถิติแบบ Real-time
  - สถิติยอดขาย, คำสั่งซื้อ, ลูกค้า
  - กราฟแสดงรายได้รายวัน (Line Chart)
  - กราฟแสดงยอดขายตามหมวดหมู่ (Pie Chart)
  - ตารางคำสั่งซื้อล่าสุด
- 📦 **Products** - จัดการสินค้า
  - ตารางแสดงสินค้าทั้งหมด
  - ค้นหาและกรองตามหมวดหมู่
  - แจ้งเตือนสต็อกเหลือน้อย
  - แสดงกำไรต่อชิ้น
- 🛍️ **Orders** - จัดการคำสั่งซื้อ
  - ตารางคำสั่งซื้อทั้งหมด
  - กรองตามสถานะ (Pending, Processing, Shipped, Delivered, Cancelled)
  - กรองตามช่องทาง (Online, Offline, Mobile, Phone)
  - ค้นหาด้วยรหัสหรือชื่อลูกค้า
- 👥 **Customers** - จัดการลูกค้า
  - แสดงข้อมูลลูกค้าแบบ Card
  - ระบบแท็ก (VIP, Regular, New, Wholesale)
  - สถิติการซื้อของแต่ละลูกค้า
  - ค้นหาลูกค้า
- 📈 **Reports** - รายงานและวิเคราะห์
  - รายงานยอดขาย
  - รายงานสินค้าขายดี Top 5
  - รายงานลูกค้าใช้จ่ายสูงสุด Top 5
  - ส่งออกรายงานเป็น PDF
  - ส่งออกรายงานเป็น Excel
- ⚙️ **Settings** - การตั้งค่า
  - ตั้งค่าโปรไฟล์
  - ตั้งค่าข้อมูลธุรกิจ
  - ตั้งค่าการแจ้งเตือน
  - ตั้งค่าความปลอดภัย
  - ตั้งค่ารูปแบบ
- 📱 **Responsive Design** - ใช้งานได้บนทุกอุปกรณ์
- 🎨 **Modern UI** - ออกแบบสวยงามด้วย TailwindCSS
- 🌙 **Dark Mode** - รองรับโหมดมืดอัตโนมัติ
  - Theme toggle button ในทุกหน้า
  - บันทึกค่าการตั้งค่าใน localStorage
  - รองรับ system preference
- 💾 **Database Integration** - เชื่อมต่อ Supabase
  - Database schema พร้อม tables, views, triggers
  - API routes สำหรับ CRUD operations
  - Row Level Security (RLS)
- ✏️ **CRUD Operations - Products** - จัดการสินค้าแบบครบวงจร
  - เพิ่มสินค้าใหม่ผ่าน Modal พร้อม validation
  - แก้ไขข้อมูลสินค้า
  - ลบสินค้าพร้อม confirmation dialog
  - Real-time data จาก Supabase
  - Search และ filter แบบ real-time
- ✏️ **CRUD Operations - Customers** - จัดการลูกค้าครบวงจร
  - เพิ่มลูกค้าใหม่ด้วย Modal form
  - แก้ไขข้อมูลลูกค้า (ชื่อ, email, phone, address, tags)
  - ลบลูกค้าพร้อม warning หากมี orders
  - Multi-select tags (VIP, Regular, New, Wholesale)
  - Email validation
- ✏️ **CRUD Operations - Orders** - จัดการออเดอร์
  - ดูรายละเอียดออเดอร์แบบครบถ้วน (OrderDetailsModal)
  - อัพเดทสถานะออเดอร์ (UpdateOrderStatusModal)
  - Status validation (ป้องกันการย้อนกลับ)
  - Auto-update delivered_at timestamp
  - Print order details
  - Filter และ search แบบ advanced
- 🔐 **Authentication System** - ระบบยืนยันตัวตนด้วย Supabase Auth
  - Email/Password login
  - Session management และ auto-refresh
  - Protected routes ด้วย middleware
  - Logout พร้อม confirmation
  - User info display ใน sidebar
  - Auto-redirect logic
- 📴 **PWA Support** - Progressive Web App พร้อมใช้งาน
  - Web App Manifest พร้อม shortcuts
  - Service Worker สำหรับ offline caching
  - Install prompts (Android, iOS, Desktop)
  - Offline fallback page พร้อม auto-retry
  - Cache strategies (Network-first, Stale-while-revalidate)
  - Background sync support
  - Platform detection และ smart install UI

### 🎯 ฟีเจอร์เพิ่มเติมที่แนะนำ (Optional)

- 📧 Email notifications เมื่อเปลี่ยนสถานะออเดอร์
- 📦 Inventory management ขั้นสูง
- 🔔 Push notifications
- 📊 Advanced analytics และ business intelligence
- 🌐 Multi-language support
- 🏪 Multi-store management
- 🎫 Promotions และ discount system
- 🚚 Shipping integration

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **Charts:** Recharts
- **Icons:** Lucide React
- **Date:** date-fns
- **Export:** jsPDF, xlsx
- **Database (Coming):** Supabase

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm
- Supabase account (for database)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd omni-sales
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Set up database
- Go to [Supabase](https://supabase.com) and create a project
- Run the SQL in `supabase/schema.sql` (creates tables)
- Run the SQL in `supabase/seed.sql` (adds sample data)
- See `supabase/README.md` for detailed instructions

5. Run the development server
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

7. Login with your Supabase user credentials
- Create a user in Supabase Dashboard → Authentication → Users
- Or sign up via the login page

### PWA Setup

To generate production-ready PWA assets:

1. **Generate Icons:**
```bash
npm run generate:icons
```
This opens an HTML tool where you can download PNG icons.

2. **Generate Screenshots:**
```bash
# Install Playwright (one-time)
npm run setup:playwright

# Start dev server
npm run dev

# In another terminal, capture screenshots
npm run generate:screenshots
```

3. **Place Generated Files:**
- Move icons to `public/icons/`
- Move favicon to `public/favicon.png`
- Move Apple touch icon to `public/apple-touch-icon.png`
- Screenshots are auto-saved to `public/screenshots/`

### Production Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for complete deployment guide including:
- Vercel deployment (recommended)
- Railway deployment
- Netlify deployment
- PWA configuration
- Supabase setup
- Security best practices
- Monetization strategies

## 📁 Project Structure

```
omni-sales/
├── app/                      # Next.js App Router pages
│   ├── page.tsx             # Landing page
│   ├── dashboard/           # Dashboard page
│   ├── products/            # Products page
│   ├── orders/              # Orders page
│   ├── customers/           # Customers page
│   ├── reports/             # Reports page
│   └── settings/            # Settings page
├── components/              # React components
│   ├── Sidebar.tsx          # Navigation sidebar
│   ├── DashboardLayout.tsx  # Layout wrapper
│   └── dashboard/           # Dashboard components
├── lib/                     # Utilities and helpers
│   ├── utils.ts             # Helper functions
│   └── data/                # Mock data
├── types/                   # TypeScript types
│   └── index.ts             # Type definitions
└── public/                  # Static files
```

## 📊 Data Models

### Product
- id, name, category, price, cost, stock, sku
- Supports: Electronics, Clothing, Food & Beverage, Home & Garden, Sports, Books, Other

### Order
- id, customerId, items[], total, status, channel
- Status: pending, processing, shipped, delivered, cancelled
- Channel: online, offline, mobile, phone

### Customer
- id, name, email, phone, address
- totalOrders, totalSpent, tags[]
- Tags: vip, regular, new, wholesale

## 🎯 Features in Detail

### Dashboard
- Real-time stats with growth indicators
- 14-day revenue trend chart
- Category sales pie chart
- Recent orders table with status and channel badges

### Products
- Low stock alerts (< 10 items)
- Profit margin calculation
- Category filtering
- Search by name or SKU

### Orders
- Multi-criteria filtering
- Status tracking
- Channel badges
- Payment method display

### Customers
- Card-based layout
- Customer segmentation with tags
- Purchase history
- Contact information

### Reports
- Sales analytics
- Top products analysis
- Customer insights
- Export to PDF/Excel

## 🔜 Roadmap

### ✅ Completed (v1.0)
- ✅ Database Integration (Supabase)
- ✅ Authentication System
- ✅ CRUD Operations (Products, Orders, Customers)
- ✅ Dark Mode
- ✅ PWA Support with offline mode
- ✅ Icon & Screenshot generators
- ✅ Deployment guides

### 🎯 Next Steps (v1.1+)

1. **Payment Integration**
   - Stripe/Omise integration
   - Subscription management
   - Invoice generation

2. **Enhanced Features**
   - Email notifications
   - Push notifications
   - Advanced inventory management
   - Multi-language support (EN/TH)

3. **Business Intelligence**
   - Advanced analytics
   - Sales forecasting
   - Customer lifetime value
   - Inventory predictions

4. **Integrations**
   - Shopify/WooCommerce sync
   - Facebook/Instagram shop
   - LINE Official Account
   - Thai logistics (Kerry, Flash, ThailandPost)

5. **Enterprise Features**
   - Multi-store management
   - Role-based permissions
   - API access
   - Webhook support
   - Custom reporting

## 📝 License

This project is for educational purposes.

## 👨‍💻 Author

Created with ❤️ for omnichannel sales management
