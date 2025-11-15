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
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Omni Sales</span>
          </div>
          <Link
            href="/dashboard"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            เข้าสู่ระบบ
          </Link>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            ระบบจัดการขาย
            <span className="text-blue-600"> Omnichannel</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            จัดการธุรกิจออนไลน์และออฟไลน์ในที่เดียว ติดตามยอดขาย สินค้า และลูกค้าได้แบบ Real-time
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg flex items-center gap-2"
            >
              เริ่มใช้งาน
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-20">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
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
        <section className="container mx-auto px-4 py-20 bg-white/50 backdrop-blur rounded-3xl my-10">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
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
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
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
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-medium text-lg"
            >
              เริ่มใช้งานทันที
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600">
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
    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
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
      <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}

function BenefitItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
      <p className="text-lg text-gray-700">{text}</p>
    </div>
  );
}
