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
  - เพิ่มสินค้าใหม่ผ่าน Modal
  - แก้ไขข้อมูลสินค้า
  - ลบสินค้าพร้อม confirmation
  - Real-time data จาก Supabase

### 🚧 ฟีเจอร์ที่รอพัฒนา

- 🔐 Authentication System (Supabase Auth)
- ✏️ CRUD Operations for Orders & Customers
- 📴 PWA & Offline Support

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

3. Run the development server
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

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

1. **Database Integration**
   - Set up Supabase
   - Create database schema
   - Implement real-time sync

2. **Authentication**
   - User login/registration
   - Role-based access control
   - Session management

3. **CRUD Operations**
   - Add/Edit/Delete products
   - Update order status
   - Manage customers

4. **Advanced Features**
   - Dark mode
   - PWA support
   - Email notifications
   - Inventory management
   - Multi-store support

## 📝 License

This project is for educational purposes.

## 👨‍💻 Author

Created with ❤️ for omnichannel sales management
