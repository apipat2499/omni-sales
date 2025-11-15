'use client';

import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Eye, Database, Users, FileText } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับหน้าหลัก
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              นโยบายความเป็นส่วนตัว
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            อัปเดตล่าสุด: 15 พฤศจิกายน 2025
          </p>
        </div>
      </header>

      {/* Quick Summary */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            สรุปสั้นๆ
          </h2>
          <ul className="space-y-2 text-blue-800 dark:text-blue-200">
            <li className="flex items-start gap-2">
              <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>เราเก็บข้อมูลที่จำเป็นเท่านั้นเพื่อให้บริการแก่คุณ</span>
            </li>
            <li className="flex items-start gap-2">
              <Lock className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>ข้อมูลของคุณได้รับการเข้ารหัสและปกป้องอย่างเข้มงวด</span>
            </li>
            <li className="flex items-start gap-2">
              <Eye className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>เราไม่ขายหรือแชร์ข้อมูลของคุณกับบุคคลที่สาม</span>
            </li>
            <li className="flex items-start gap-2">
              <Database className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>คุณสามารถเข้าถึง ส่งออก หรือลบข้อมูลของคุณได้ตลอดเวลา</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 space-y-8">
          <section>
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                1. ข้อมูลที่เราเก็บรวบรวม
              </h2>
            </div>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  1.1 ข้อมูลที่คุณให้แก่เรา
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>ข้อมูลบัญชี: ชื่อ, อีเมล, รหัสผ่าน</li>
                  <li>ข้อมูลธุรกิจ: ชื่อบริษัท, ที่อยู่, เบอร์โทรศัพท์, เลขประจำตัวผู้เสียภาษี</li>
                  <li>ข้อมูลการชำระเงิน: ข้อมูลบัตรเครดิต/เดบิต (เข้ารหัสโดยผู้ให้บริการชำระเงิน)</li>
                  <li>ข้อมูลธุรกรรม: ข้อมูลสินค้า, คำสั่งซื้อ, ลูกค้า ที่คุณเพิ่มในระบบ</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  1.2 ข้อมูลที่เก็บอัตโนมัติ
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>ข้อมูลการใช้งาน: หน้าที่เข้าชม, ฟีเจอร์ที่ใช้, เวลาการใช้งาน</li>
                  <li>ข้อมูลอุปกรณ์: ประเภทเบราว์เซอร์, ระบบปฏิบัติการ, ที่อยู่ IP</li>
                  <li>คุกกี้และเทคโนโลยีที่คล้ายกัน: เพื่อปรับปรุงประสบการณ์การใช้งาน</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                2. วิธีการใช้ข้อมูลของคุณ
              </h2>
            </div>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p className="leading-relaxed">เราใช้ข้อมูลของคุณเพื่อ:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>ให้บริการและจัดการบัญชีของคุณ</li>
                <li>ประมวลผลการชำระเงินและจัดการการสมัครสมาชิก</li>
                <li>ส่งการอัปเดต ข่าวสาร และข้อมูลสำคัญเกี่ยวกับบริการ</li>
                <li>ปรับปรุงและพัฒนาบริการของเรา</li>
                <li>วิเคราะห์การใช้งานเพื่อปรับปรุงประสบการณ์ผู้ใช้</li>
                <li>ป้องกันการฉ้อโกงและรักษาความปลอดภัย</li>
                <li>ปฏิบัติตามข้อกำหนดทางกฎหมาย</li>
                <li>ให้การสนับสนุนลูกค้า</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                3. การปกป้องข้อมูลของคุณ
              </h2>
            </div>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p className="leading-relaxed">
                เราใช้มาตรการรักษาความปลอดภัยระดับอุตสาหกรรมเพื่อปกป้องข้อมูลของคุณ:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>การเข้ารหัส TLS/SSL สำหรับการส่งข้อมูลทั้งหมด</li>
                <li>การเข้ารหัสข้อมูลที่เก็บในฐานข้อมูล</li>
                <li>การยืนยันตัวตนแบบหลายปัจจัย (2FA) - เร็วๆ นี้</li>
                <li>การสำรองข้อมูลอัตโนมัติรายวัน</li>
                <li>การตรวจสอบและทดสอบความปลอดภัยเป็นประจำ</li>
                <li>การจำกัดการเข้าถึงข้อมูลเฉพาะพนักงานที่จำเป็น</li>
                <li>การปฏิบัติตามมาตรฐาน SOC 2 และ GDPR</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                4. การแชร์ข้อมูล
              </h2>
            </div>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p className="leading-relaxed">
                เราไม่ขายข้อมูลส่วนบุคคลของคุณ เราอาจแชร์ข้อมูลกับ:
              </p>
              <div className="space-y-3 ml-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    ผู้ให้บริการที่เชื่อถือได้:
                  </h4>
                  <ul className="list-disc list-inside mt-1">
                    <li>Supabase - โฮสติ้งฐานข้อมูลและการยืนยันตัวตน</li>
                    <li>Stripe/Omise - ประมวลผลการชำระเงิน</li>
                    <li>Vercel - โฮสติ้งแอปพลิเคชัน</li>
                    <li>SendGrid - บริการอีเมล</li>
                  </ul>
                  <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">
                    ผู้ให้บริการเหล่านี้มีข้อตกลงความเป็นส่วนตัวที่เข้มงวด
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    ข้อกำหนดทางกฎหมาย:
                  </h4>
                  <p className="mt-1">
                    หากกฎหมายกำหนดให้เราเปิดเผยข้อมูล เช่น คำสั่งศาล หรือการสอบสวนทางกฎหมาย
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                5. สิทธิ์ของคุณ
              </h2>
            </div>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p className="leading-relaxed">คุณมีสิทธิ์ต่อไปนี้:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>เข้าถึง:</strong> ดูข้อมูลส่วนบุคคลที่เราเก็บไว้</li>
                <li><strong>แก้ไข:</strong> อัปเดตหรือแก้ไขข้อมูลที่ไม่ถูกต้อง</li>
                <li><strong>ลบ:</strong> ขอให้ลบข้อมูลของคุณ (ภายใต้ข้อจำกัดทางกฎหมาย)</li>
                <li><strong>ส่งออก:</strong> รับสำเนาข้อมูลของคุณในรูปแบบที่อ่านได้</li>
                <li><strong>ยกเลิก:</strong> ยกเลิกความยินยอมในการประมวลผลข้อมูล</li>
                <li><strong>คัดค้าน:</strong> คัดค้านการใช้ข้อมูลในวัตถุประสงค์บางอย่าง</li>
              </ul>
              <p className="leading-relaxed mt-4">
                หากต้องการใช้สิทธิ์เหล่านี้ กรุณาติดต่อเราที่{' '}
                <a
                  href="mailto:privacy@omnisales.com"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  privacy@omnisales.com
                </a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              6. การเก็บรักษาข้อมูล
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              เราเก็บข้อมูลของคุณตราบเท่าที่บัญชีของคุณยังใช้งานอยู่
              หากคุณยกเลิกบัญชี เราจะลบหรือทำให้ข้อมูลไม่สามารถระบุตัวตนได้ภายใน 90 วัน
              เว้นแต่กฎหมายกำหนดให้เก็บไว้นานกว่านั้น
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              7. คุกกี้และเทคโนโลยีการติดตาม
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p className="leading-relaxed">
                เราใช้คุกกี้และเทคโนโลยีที่คล้ายกันเพื่อ:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>จดจำการตั้งค่าและความชอบของคุณ</li>
                <li>เข้าสู่ระบบอัตโนมัติ</li>
                <li>วิเคราะห์การใช้งานเพื่อปรับปรุงบริการ</li>
                <li>ป้องกันการฉ้อโกงและเพิ่มความปลอดภัย</li>
              </ul>
              <p className="leading-relaxed mt-4">
                คุณสามารถปฏิเสธคุกกี้ได้ผ่านการตั้งค่าเบราว์เซอร์
                แต่บางฟีเจอร์อาจไม่ทำงานอย่างเต็มประสิทธิภาพ
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              8. การถ่ายโอนข้อมูลระหว่างประเทศ
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              ข้อมูลของคุณอาจถูกประมวลผลและเก็บรักษาในเซิร์ฟเวอร์ที่ตั้งอยู่ในประเทศต่างๆ
              เราใช้มาตรการรักษาความปลอดภัยที่เหมาะสมเพื่อปกป้องข้อมูลของคุณ
              ไม่ว่าจะประมวลผลที่ใดก็ตาม
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              9. ความเป็นส่วนตัวของเด็ก
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              บริการของเราไม่ได้มีไว้สำหรับบุคคลที่มีอายุต่ำกว่า 18 ปี
              เราไม่เก็บรวบรวมข้อมูลส่วนบุคคลจากเด็กโดยเจตนา
              หากคุณทราบว่ามีเด็กให้ข้อมูลแก่เรา กรุณาติดต่อเราเพื่อลบข้อมูลนั้น
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              10. การเปลี่ยนแปลงนโยบาย
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              เราอาจอัปเดตนโยบายความเป็นส่วนตัวนี้เป็นครั้งคราว
              การเปลี่ยนแปลงที่สำคัญจะแจ้งให้ทราบทางอีเมลหรือผ่านบริการ
              กรุณาตรวจสอบหน้านี้เป็นระยะเพื่อดูการอัปเดต
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              11. การติดต่อเรา
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              หากคุณมีคำถามเกี่ยวกับนโยบายความเป็นส่วนตัวนี้ กรุณาติดต่อเราที่:
            </p>
            <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-2">
              <p className="text-gray-700 dark:text-gray-300">
                <strong className="text-gray-900 dark:text-white">Email:</strong>{' '}
                <a
                  href="mailto:privacy@omnisales.com"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  privacy@omnisales.com
                </a>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <strong className="text-gray-900 dark:text-white">เจ้าหน้าที่คุ้มครองข้อมูล:</strong>{' '}
                dpo@omnisales.com
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <strong className="text-gray-900 dark:text-white">แบบฟอร์มติดต่อ:</strong>{' '}
                <Link href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">
                  คลิกที่นี่
                </Link>
              </p>
            </div>
          </section>

          <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Shield className="w-4 h-4" />
              <p className="text-center">
                เราให้ความสำคัญกับความเป็นส่วนตัวและความปลอดภัยของข้อมูลของคุณเป็นอันดับแรก
              </p>
            </div>
          </div>
        </div>

        {/* Related Links */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Link
            href="/terms"
            className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            เงื่อนไขการให้บริการ
          </Link>
          <Link
            href="/contact"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ติดต่อเรา
          </Link>
        </div>
      </main>
    </div>
  );
}
