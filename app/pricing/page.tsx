'use client';

import { Check, X, Zap, Users, Building2, Crown } from 'lucide-react';
import Link from 'next/link';

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  limitations: string[];
  highlighted: boolean;
  icon: any;
  buttonText: string;
  buttonVariant: 'primary' | 'secondary' | 'premium';
}

const pricingTiers: PricingTier[] = [
  {
    name: 'ฟรี',
    price: '฿0',
    period: 'ตลอดกาล',
    description: 'เหมาะสำหรับธุรกิจเริ่มต้น',
    icon: Zap,
    highlighted: false,
    buttonText: 'เริ่มใช้งานฟรี',
    buttonVariant: 'secondary',
    features: [
      'สินค้าสูงสุด 100 รายการ',
      'คำสั่งซื้อ 50 รายการ/เดือน',
      'ลูกค้า 100 ราย',
      'รายงานพื้นฐาน',
      'แอปพลิเคชัน PWA',
      'รองรับ 1 ผู้ใช้งาน',
    ],
    limitations: [
      'ไม่มีการส่งออก Excel',
      'ไม่มีการแจ้งเตือนอีเมล',
      'ไม่มี API access',
    ],
  },
  {
    name: 'Starter',
    price: '฿299',
    period: '/เดือน',
    description: 'เหมาะสำหรับร้านค้าขนาดเล็ก',
    icon: Users,
    highlighted: true,
    buttonText: 'เริ่มทดลอง 14 วัน',
    buttonVariant: 'primary',
    features: [
      'สินค้าสูงสุด 1,000 รายการ',
      'คำสั่งซื้อ 500 รายการ/เดือน',
      'ลูกค้าไม่จำกัด',
      'รายงานแบบครบถ้วน',
      'ส่งออก PDF และ Excel',
      'แอปพลิเคชัน PWA',
      'การแจ้งเตือนอีเมล',
      'รองรับ 3 ผู้ใช้งาน',
      'การสำรองข้อมูลรายวัน',
      'การสนับสนุนทางอีเมล',
    ],
    limitations: [
      'ไม่มี API access',
      'ไม่มีการจัดการหลายสาขา',
    ],
  },
  {
    name: 'Pro',
    price: '฿999',
    period: '/เดือน',
    description: 'เหมาะสำหรับธุรกิจขนาดกลาง',
    icon: Building2,
    highlighted: false,
    buttonText: 'เริ่มทดลอง 14 วัน',
    buttonVariant: 'primary',
    features: [
      'สินค้าไม่จำกัด',
      'คำสั่งซื้อไม่จำกัด',
      'ลูกค้าไม่จำกัด',
      'รายงานขั้นสูงและการวิเคราะห์',
      'ส่งออกทุกรูปแบบ',
      'แอปพลิเคชัน PWA',
      'การแจ้งเตือนแบบ Real-time',
      'Push notifications',
      'รองรับ 10 ผู้ใช้งาน',
      'การสำรองข้อมูลรายชั่วโมง',
      'API access',
      'Webhook support',
      'การจัดการหลายสาขา (สูงสุด 3 สาขา)',
      'การสนับสนุน 24/7',
      'การฝึกอบรมออนไลน์',
    ],
    limitations: [],
  },
  {
    name: 'Enterprise',
    price: '฿2,999',
    period: '/เดือน',
    description: 'สำหรับองค์กรขนาดใหญ่',
    icon: Crown,
    highlighted: false,
    buttonText: 'ติดต่อฝ่ายขาย',
    buttonVariant: 'premium',
    features: [
      'ทุกฟีเจอร์ใน Pro',
      'หลายสาขาไม่จำกัด',
      'ผู้ใช้งานไม่จำกัด',
      'Custom branding',
      'White-label solution',
      'การวิเคราะห์ขั้นสูง',
      'การพยากรณ์ยอดขาย',
      'Custom integrations',
      'Dedicated server',
      'SLA 99.9% uptime',
      'Account manager เฉพาะ',
      'การสนับสนุนลำดับความสำคัญ',
      'การฝึกอบรมแบบ On-site',
      'Custom development',
    ],
    limitations: [],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              Omni Sales
            </Link>
            <div className="flex gap-4">
              <Link
                href="/"
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                กลับหน้าหลัก
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                เข้าสู่ระบบ
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          แผนราคาที่เหมาะกับทุกธุรกิจ
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          เริ่มต้นฟรี อัพเกรดได้ทุกเมื่อที่ธุรกิจของคุณเติบโต
        </p>

        {/* Annual/Monthly Toggle (optional for future) */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className="text-gray-600 dark:text-gray-300">ชำระรายเดือน</span>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            (ประหยัด 20% เมื่อชำระรายปี - เร็วๆ นี้)
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {pricingTiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <div
                key={tier.name}
                className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 flex flex-col ${
                  tier.highlighted
                    ? 'ring-4 ring-blue-500 scale-105 z-10'
                    : 'hover:shadow-2xl transition-shadow'
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-1.5 rounded-full text-sm font-semibold">
                    แนะนำ
                  </div>
                )}

                {/* Icon */}
                <div className="mb-4">
                  <div className="inline-flex p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>

                {/* Header */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {tier.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    {tier.description}
                  </p>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {tier.price}
                    </span>
                    <span className="text-gray-600 dark:text-gray-300 ml-2">
                      {tier.period}
                    </span>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  className={`w-full py-3 rounded-lg font-semibold mb-8 transition-all ${
                    tier.buttonVariant === 'primary'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : tier.buttonVariant === 'premium'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {tier.buttonText}
                </button>

                {/* Features */}
                <div className="flex-1">
                  <div className="space-y-3 mb-6">
                    {tier.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 dark:text-gray-300 text-sm">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {tier.limitations.length > 0 && (
                    <div className="space-y-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                      {tier.limitations.map((limitation) => (
                        <div key={limitation} className="flex items-start gap-3">
                          <X className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-500 dark:text-gray-400 text-sm">
                            {limitation}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          คำถามที่พบบ่อย
        </h2>

        <div className="space-y-6">
          {[
            {
              q: 'ฉันสามารถเปลี่ยนแผนได้ไหม?',
              a: 'ได้เลย! คุณสามารถอัพเกรดหรือดาวน์เกรดแผนได้ทุกเมื่อ การชำระเงินจะถูกปรับตามระยะเวลาที่ใช้งานจริง',
            },
            {
              q: 'มีระยะทดลองใช้ฟรีไหม?',
              a: 'แผน Starter และ Pro มีระยะทดลองใช้ฟรี 14 วัน ไม่ต้องใช้บัตรเครดิต คุณสามารถยกเลิกได้ทุกเมื่อ',
            },
            {
              q: 'การชำระเงินปลอดภัยไหม?',
              a: 'ปลอดภัย 100%! เราใช้ระบบการชำระเงินที่ได้มาตรฐาน PCI DSS และเข้ารหัสข้อมูลทั้งหมด',
            },
            {
              q: 'ถ้าเกินขอบเขตการใช้งานจะเกิดอะไรขึ้น?',
              a: 'เราจะแจ้งเตือนเมื่อใกล้ถึงขีดจำกัด คุณสามารถอัพเกรดแผนหรือซื้อเพิ่มเติมได้',
            },
            {
              q: 'ข้อมูลของฉันปลอดภัยแค่ไหน?',
              a: 'ข้อมูลทั้งหมดถูกเข้ารหัสและสำรองอัตโนมัติทุกวัน มีระบบความปลอดภัยระดับธนาคาร',
            },
            {
              q: 'สามารถขอใบกำกับภาษีได้ไหม?',
              a: 'ได้ครับ เราออกใบกำกับภาษีเต็มรูปแบบสำหรับทุกการชำระเงิน',
            },
          ].map((faq, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {faq.q}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            พร้อมที่จะเริ่มต้นแล้วหรือยัง?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            เริ่มต้นฟรีวันนี้ ไม่ต้องใช้บัตรเครดิต
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
            >
              เริ่มใช้งานฟรี
            </Link>
            <Link
              href="/"
              className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-block"
            >
              ดูเดโม
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                ผลิตภัณฑ์
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li><Link href="/" className="hover:text-blue-600">ฟีเจอร์</Link></li>
                <li><Link href="/pricing" className="hover:text-blue-600">ราคา</Link></li>
                <li><Link href="/" className="hover:text-blue-600">เดโม</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                บริษัท
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li><Link href="/" className="hover:text-blue-600">เกี่ยวกับเรา</Link></li>
                <li><Link href="/" className="hover:text-blue-600">ติดต่อเรา</Link></li>
                <li><Link href="/" className="hover:text-blue-600">ทีมงาน</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                ทรัพยากร
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li><Link href="/" className="hover:text-blue-600">เอกสารประกอบ</Link></li>
                <li><Link href="/" className="hover:text-blue-600">API</Link></li>
                <li><Link href="/" className="hover:text-blue-600">ช่วยเหลือ</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                กฎหมาย
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li><Link href="/" className="hover:text-blue-600">เงื่อนไขการใช้งาน</Link></li>
                <li><Link href="/" className="hover:text-blue-600">นโยบายความเป็นส่วนตัว</Link></li>
                <li><Link href="/" className="hover:text-blue-600">คุกกี้</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-gray-600 dark:text-gray-300">
            <p>&copy; 2024 Omni Sales. สงวนลิขสิทธิ์.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
