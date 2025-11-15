'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfServicePage() {
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            เงื่อนไขการให้บริการ
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            อัปเดตล่าสุด: 15 พฤศจิกายน 2025
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              1. การยอมรับข้อกำหนด
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              ด้วยการเข้าถึงและใช้งาน Omni Sales ("บริการ") คุณตกลงที่จะผูกพันตามเงื่อนไขการให้บริการนี้
              หากคุณไม่ยอมรับเงื่อนไขเหล่านี้ กรุณาอย่าใช้บริการของเรา
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              2. การใช้งานบริการ
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p className="leading-relaxed">
                <strong className="text-gray-900 dark:text-white">2.1 การมีสิทธิ์ใช้งาน:</strong>{' '}
                คุณต้องมีอายุอย่างน้อย 18 ปี หรือมีความสามารถทางกฎหมายในการทำสัญญา
              </p>
              <p className="leading-relaxed">
                <strong className="text-gray-900 dark:text-white">2.2 บัญชีผู้ใช้:</strong>{' '}
                คุณมีหน้าที่รับผิดชอบในการรักษาความลับของข้อมูลบัญชีของคุณ
                และรับผิดชอบต่อกิจกรรมทั้งหมดที่เกิดขึ้นภายใต้บัญชีของคุณ
              </p>
              <p className="leading-relaxed">
                <strong className="text-gray-900 dark:text-white">2.3 การใช้งานที่ยอมรับได้:</strong>{' '}
                คุณตกลงที่จะใช้บริการเพื่อวัตถุประสงค์ทางธุรกิจที่ถูกต้องตามกฎหมายเท่านั้น
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              3. แผนการให้บริการและการชำระเงิน
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p className="leading-relaxed">
                <strong className="text-gray-900 dark:text-white">3.1 แผนบริการ:</strong>{' '}
                เราเสนอแผนบริการหลายระดับ ตั้งแต่แผนฟรีไปจนถึงแผน Enterprise
                ฟีเจอร์และข้อจำกัดของแต่ละแผนมีอธิบายไว้ในหน้าราคา
              </p>
              <p className="leading-relaxed">
                <strong className="text-gray-900 dark:text-white">3.2 การชำระเงิน:</strong>{' '}
                ค่าบริการสำหรับแผนที่เสียค่าใช้จ่ายจะเรียกเก็บล่วงหน้าตามรอบการเรียกเก็บเงินที่คุณเลือก
                (รายเดือนหรือรายปี) การชำระเงินทั้งหมดไม่สามารถขอคืนได้
              </p>
              <p className="leading-relaxed">
                <strong className="text-gray-900 dark:text-white">3.3 การต่ออายุอัตโนมัติ:</strong>{' '}
                การสมัครสมาชิกของคุณจะต่ออายุโดยอัตโนมัติ
                เว้นแต่คุณจะยกเลิกก่อนสิ้นสุดรอบการเรียกเก็บเงินปัจจุบัน
              </p>
              <p className="leading-relaxed">
                <strong className="text-gray-900 dark:text-white">3.4 การเปลี่ยนแปลงราคา:</strong>{' '}
                เราขอสงวนสิทธิ์ในการเปลี่ยนแปลงราคาด้วยการแจ้งล่วงหน้า 30 วัน
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              4. ข้อมูลและความเป็นส่วนตัว
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              การใช้งานของคุณอยู่ภายใต้{' '}
              <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
                นโยบายความเป็นส่วนตัว
              </Link>{' '}
              ของเรา ซึ่งอธิบายวิธีที่เราเก็บรวบรวม ใช้ และปกป้องข้อมูลส่วนบุคคลของคุณ
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              5. ทรัพย์สินทางปัญญา
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p className="leading-relaxed">
                <strong className="text-gray-900 dark:text-white">5.1 ความเป็นเจ้าของ:</strong>{' '}
                บริการและเนื้อหาทั้งหมด รวมถึงซอฟต์แวร์ ข้อความ กราฟิก โลโก้ และอื่นๆ
                เป็นทรัพย์สินของ Omni Sales และได้รับการคุ้มครองโดยกฎหมายลิขสิทธิ์
              </p>
              <p className="leading-relaxed">
                <strong className="text-gray-900 dark:text-white">5.2 ข้อมูลของคุณ:</strong>{' '}
                คุณยังคงเป็นเจ้าของข้อมูลทั้งหมดที่คุณอัปโหลดหรือสร้างในบริการ
                เราไม่อ้างสิทธิ์ใดๆ ต่อข้อมูลของคุณ
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              6. การยกเลิกและการระงับบริการ
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p className="leading-relaxed">
                <strong className="text-gray-900 dark:text-white">6.1 การยกเลิกโดยคุณ:</strong>{' '}
                คุณสามารถยกเลิกบัญชีของคุณได้ตลอดเวลาผ่านหน้าการตั้งค่า
                การยกเลิกจะมีผลในสิ้นรอบการเรียกเก็บเงินปัจจุบัน
              </p>
              <p className="leading-relaxed">
                <strong className="text-gray-900 dark:text-white">6.2 การระงับโดยเรา:</strong>{' '}
                เราขอสงวนสิทธิ์ในการระงับหรือยกเลิกบัญชีของคุณหากคุณละเมิดเงื่อนไขเหล่านี้
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              7. การจำกัดความรับผิด
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              บริการนี้ให้บริการในสภาพ "ตามที่เป็น" โดยไม่มีการรับประกันใดๆ
              ไม่ว่าโดยชัดแจ้งหรือโดยนัยยะ เราจะไม่รับผิดชอบต่อความเสียหายใดๆ
              ที่เกิดจากการใช้หรือไม่สามารถใช้บริการนี้
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              8. การเปลี่ยนแปลงเงื่อนไข
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              เราขอสงวนสิทธิ์ในการแก้ไขเงื่อนไขเหล่านี้ได้ตลอดเวลา
              การเปลี่ยนแปลงที่สำคัญจะมีการแจ้งให้ทราบล่วงหน้า 30 วัน
              การใช้บริการต่อไปหลังจากการเปลี่ยนแปลงถือว่าคุณยอมรับเงื่อนไขใหม่
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              9. กฎหมายที่ใช้บังคับ
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              เงื่อนไขเหล่านี้อยู่ภายใต้บังคับและตีความตามกฎหมายของประเทศไทย
              ข้อพิพาทใดๆ จะอยู่ภายใต้เขตอำนาจศาลของประเทศไทย
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              10. การติดต่อเรา
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              หากคุณมีคำถามเกี่ยวกับเงื่อนไขการให้บริการนี้ กรุณาติดต่อเราที่:
            </p>
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300">
                <strong className="text-gray-900 dark:text-white">Email:</strong>{' '}
                support@omnisales.com
              </p>
              <p className="text-gray-700 dark:text-gray-300 mt-2">
                <strong className="text-gray-900 dark:text-white">เว็บไซต์:</strong>{' '}
                <Link href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">
                  แบบฟอร์มติดต่อ
                </Link>
              </p>
            </div>
          </section>

          <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              เอกสารนี้เป็นเงื่อนไขการให้บริการทางกฎหมายที่มีผลผูกพัน
              กรุณาอ่านและทำความเข้าใจก่อนใช้บริการ
            </p>
          </div>
        </div>

        {/* Related Links */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Link
            href="/privacy"
            className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            นโยบายความเป็นส่วนตัว
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
