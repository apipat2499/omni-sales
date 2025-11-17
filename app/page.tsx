'use client';

import Link from 'next/link';
import {
  Store,
  TrendingUp,
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  Globe,
  Smartphone,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Activity,
  PackageCheck,
  Clock3,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

export default function Home() {
  const { user, loading, supabaseReady } = useAuth();
  const isDemoMode = !supabaseReady;

  const demoMetrics = [
    {
      label: 'ยอดขายรวมวันนี้',
      value: '฿1,280,000',
      change: '+18%',
      hint: 'จาก 6 ช่องทาง',
    },
    {
      label: 'ออเดอร์ใหม่ (1 ชม.)',
      value: '46',
      change: '+12%',
      hint: 'ถูกปิดการขายแล้ว 92%',
    },
    {
      label: 'สินค้าใกล้หมด',
      value: '8 รายการ',
      change: 'แนะนำสั่งเพิ่ม',
      hint: 'สาขา Central',
    },
  ];

  const demoOrders = [
    { time: '09:12', channel: 'Shopee', customer: 'คุณกมล', amount: '฿8,450', status: 'จัดส่งแล้ว' },
    { time: '09:05', channel: 'หน้าร้าน', customer: 'Walk-in', amount: '฿2,190', status: 'รอชำระ' },
    { time: '08:55', channel: 'Line OA', customer: 'คุณปิยะ', amount: '฿5,600', status: 'ยืนยันแล้ว' },
    { time: '08:40', channel: 'Website', customer: 'คุณธันวา', amount: '฿12,300', status: 'กำลังแพ็ค' },
  ];

  const demoInventoryHighlights = [
    {
      title: 'Warehouse Bangkok',
      stocked: '98%',
      alert: 'สินค้า A-102 ต่ำกว่า MIN',
    },
    {
      title: 'Pop-up Siam',
      stocked: '65%',
      alert: 'พร้อมกระตุ้น Flash Sale',
    },
  ];

  // Determine the link destination based on auth state
  const getAuthLink = () => {
    if (loading) return '/login'; // Default to login while loading
    return user ? '/dashboard' : '/login';
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="h-8 w-8 text-blue-600 dark:text-blue-500" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">Omni Sales</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
            >
              ราคา
            </Link>
            <Link
              href={getAuthLink()}
              className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium"
            >
              {user ? 'ไปที่แดชบอร์ด' : 'เข้าสู่ระบบ'}
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            ระบบจัดการขาย
            <span className="text-blue-600 dark:text-blue-500"> Omnichannel</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            จัดการธุรกิจออนไลน์และออฟไลน์ในที่เดียว ติดตามยอดขาย สินค้า และลูกค้าได้แบบ Real-time
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href={getAuthLink()}
              className="px-8 py-4 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium text-lg flex items-center gap-2"
            >
              เริ่มใช้งาน
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>

        {isDemoMode && (
          <section className="container mx-auto px-4 pb-10">
            <div className="bg-white dark:bg-gray-900 border border-blue-100 dark:border-gray-800 rounded-3xl p-8 shadow-lg">
              <div className="flex flex-col gap-2 mb-8">
                <span className="inline-flex items-center gap-2 bg-blue-100/70 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-4 py-1 rounded-full text-sm font-semibold w-fit">
                  <Sparkles className="w-4 h-4" />
                  โหมดทดลอง - แสดงข้อมูลตัวอย่างแบบ Real-time
                </span>
                <p className="text-gray-600 dark:text-gray-300">
                  ระบบสาธิตข้อมูลอัตโนมัติเมื่อ Supabase ยังไม่พร้อม เพื่อให้ทีมขายนำเสนอฟีเจอร์ได้เต็มรูปแบบ
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {demoMetrics.map((metric) => (
                  <DemoMetricCard key={metric.label} metric={metric} />
                ))}
              </div>

              <div className="mt-10 grid gap-8 lg:grid-cols-2">
                <DemoOrderTimeline orders={demoOrders} />
                <DemoInventoryPanel highlights={demoInventoryHighlights} />
              </div>
            </div>
          </section>
        )}

        {/* Features */}
        <section className="container mx-auto px-4 py-20">
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-16">
            ฟีเจอร์หลัก
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<BarChart3 className="h-10 w-10 text-blue-600" />}
              title="Dashboard แบบ Real-time"
              description="ดูภาพรวมธุรกิจด้วยกราฟและสถิติที่อัพเดทแบบ Real-time"
            />
            <FeatureCard
              icon={<Package className="h-10 w-10 text-blue-600" />}
              title="จัดการสินค้า"
              description="เพิ่ม แก้ไข ลบสินค้า พร้อมแจ้งเตือนสต็อกสินค้าใกล้หมด"
            />
            <FeatureCard
              icon={<ShoppingCart className="h-10 w-10 text-blue-600" />}
              title="ติดตามคำสั่งซื้อ"
              description="จัดการออเดอร์จากทุกช่องทาง ทั้ง Online, Offline, Mobile, และโทรศัพท์"
            />
            <FeatureCard
              icon={<Users className="h-10 w-10 text-blue-600" />}
              title="ฐานข้อมูลลูกค้า"
              description="จัดการข้อมูลลูกค้า แบ่งกลุ่ม และติดตามประวัติการสั่งซื้อ"
            />
            <FeatureCard
              icon={<TrendingUp className="h-10 w-10 text-blue-600" />}
              title="รายงานและวิเคราะห์"
              description="สร้างรายงานยอดขาย ส่งออกเป็น Excel/PDF"
            />
            <FeatureCard
              icon={<Globe className="h-10 w-10 text-blue-600" />}
              title="Omnichannel"
              description="รองรับหลายช่องทางการขาย ทั้ง Online และ Offline"
            />
          </div>
        </section>

        {/* Channels */}
        <section className="container mx-auto px-4 py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur rounded-3xl my-10">
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-16">
            รองรับทุกช่องทางการขาย
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <ChannelCard
              icon={<Globe className="h-12 w-12 text-blue-600" />}
              title="Online Store"
              description="เว็บไซต์ E-commerce"
            />
            <ChannelCard
              icon={<Store className="h-12 w-12 text-green-600" />}
              title="Offline Store"
              description="ร้านค้าหน้าร้าน POS"
            />
            <ChannelCard
              icon={<Smartphone className="h-12 w-12 text-purple-600" />}
              title="Mobile App"
              description="แอปพลิเคชันมือถือ"
            />
            <ChannelCard
              icon={<ShoppingCart className="h-12 w-12 text-orange-600" />}
              title="Phone Order"
              description="รับออเดอร์ทางโทรศัพท์"
            />
          </div>
        </section>

        {/* Benefits */}
        <section className="container mx-auto px-4 py-20">
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-16">
            ทำไมต้องเลือกเรา
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <BenefitItem text="จัดการธุรกิจได้ง่ายขึ้นด้วย Dashboard ที่ใช้งานง่าย" />
            <BenefitItem text="ติดตามยอดขายแบบ Real-time จากทุกช่องทาง" />
            <BenefitItem text="ลดความผิดพลาดในการจัดการสต็อกสินค้า" />
            <BenefitItem text="เข้าใจพฤติกรรมลูกค้าด้วยรายงานและการวิเคราะห์" />
            <BenefitItem text="ส่งออกรายงานเป็น Excel/PDF ได้ง่าย" />
            <BenefitItem text="รองรับ PWA ใช้งานได้แม้ไม่มีอินเทอร์เน็ต" />
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="container mx-auto px-4 py-20">
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-8">
            แผนราคาที่เหมาะกับทุกธุรกิจ
          </h2>
          <p className="text-xl text-center text-gray-600 dark:text-gray-300 mb-16">
            เริ่มต้นฟรี อัพเกรดได้ทุกเมื่อที่ธุรกิจของคุณเติบโต
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">ฟรี</h3>
              <div className="flex items-baseline mb-6">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">฿0</span>
                <span className="text-gray-600 dark:text-gray-300 ml-2">/ตลอดกาล</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>สินค้า 100 รายการ</span>
                </li>
                <li className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>คำสั่งซื้อ 50/เดือน</span>
                </li>
                <li className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>รายงานพื้นฐาน</span>
                </li>
              </ul>
            </div>

            {/* Starter Plan */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-8 shadow-2xl transform scale-105 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 px-4 py-1 rounded-full text-sm font-semibold text-blue-600">
                แนะนำ
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
              <div className="flex items-baseline mb-6">
                <span className="text-4xl font-bold text-white">฿299</span>
                <span className="text-blue-100 ml-2">/เดือน</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-white">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>สินค้า 1,000 รายการ</span>
                </li>
                <li className="flex items-start gap-2 text-white">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>คำสั่งซื้อ 500/เดือน</span>
                </li>
                <li className="flex items-start gap-2 text-white">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>ส่งออก PDF & Excel</span>
                </li>
                <li className="flex items-start gap-2 text-white">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>แจ้งเตือนอีเมล</span>
                </li>
              </ul>
            </div>

            {/* Pro Plan */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pro</h3>
              <div className="flex items-baseline mb-6">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">฿999</span>
                <span className="text-gray-600 dark:text-gray-300 ml-2">/เดือน</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>ไม่จำกัดสินค้า & ออเดอร์</span>
                </li>
                <li className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>รายงานขั้นสูง</span>
                </li>
                <li className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>API access</span>
                </li>
                <li className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>หลายสาขา (3 สาขา)</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="text-center mt-12">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
            >
              ดูแผนราคาทั้งหมด
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 text-white">
            <h2 className="text-4xl font-bold mb-6">
              พร้อมเริ่มต้นแล้วหรือยัง?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              เริ่มจัดการธุรกิจของคุณด้วยระบบที่ทันสมัยและใช้งานง่าย
            </p>
            <Link
              href={getAuthLink()}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-medium text-lg"
            >
              เริ่มใช้งานทันที
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600 dark:text-gray-400">
        <p>&copy; 2024 Omni Sales. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
}

function ChannelCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300 text-sm">{description}</p>
    </div>
  );
}

function BenefitItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
      <p className="text-lg text-gray-700 dark:text-gray-300">{text}</p>
    </div>
  );
}

function DemoMetricCard({
  metric,
}: {
  metric: { label: string; value: string; change: string; hint: string };
}) {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-6 bg-gradient-to-br from-white to-blue-50/60 dark:from-gray-900 dark:to-gray-800/40">
      <p className="text-sm text-gray-500 dark:text-gray-400">{metric.label}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{metric.value}</p>
      <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold mt-1">{metric.change}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{metric.hint}</p>
    </div>
  );
}

function DemoOrderTimeline({
  orders,
}: {
  orders: { time: string; channel: string; customer: string; amount: string; status: string }[];
}) {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-6 bg-slate-50 dark:bg-gray-900/40">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">ออเดอร์เข้าใหม่ (15 นาที)</h3>
      </div>
      <div className="space-y-4">
        {orders.map((order, index) => (
          <div key={`${order.channel}-${index}`} className="flex items-center gap-4">
            <div className="text-sm font-semibold text-gray-500 w-16">{order.time}</div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">{order.customer}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{order.channel}</p>
            </div>
            <p className="font-semibold text-gray-900 dark:text-white">{order.amount}</p>
            <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
              {order.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DemoInventoryPanel({
  highlights,
}: {
  highlights: { title: string; stocked: string; alert: string }[];
}) {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-6 bg-indigo-50/60 dark:bg-indigo-950/40">
      <div className="flex items-center gap-2 mb-4">
        <PackageCheck className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">สต็อกสำคัญ</h3>
      </div>
      <div className="space-y-4">
        {highlights.map((highlight) => (
          <div key={highlight.title} className="p-4 rounded-xl bg-white/80 dark:bg-gray-900/50 border border-indigo-100 dark:border-indigo-900/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">คลัง</p>
                <p className="font-semibold text-gray-900 dark:text-white">{highlight.title}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">พร้อมขาย</p>
                <p className="text-xl font-bold text-indigo-700 dark:text-indigo-200">{highlight.stocked}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
              <Clock3 className="w-4 h-4" />
              {highlight.alert}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
