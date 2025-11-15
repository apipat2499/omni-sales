'use client';

import Link from 'next/link';
import { ArrowLeft, Mail, MessageSquare, Phone, MapPin, Clock, Send } from 'lucide-react';
import { useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'support',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setSubmitted(true);
    setLoading(false);

    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        type: 'support',
      });
    }, 3000);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับหน้าหลัก
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            ติดต่อเรา
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            เรายินดีที่จะให้ความช่วยเหลือคุณ
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="md:col-span-1 space-y-6">
            {/* Contact Cards */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                ช่องทางการติดต่อ
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      อีเมล
                    </h3>
                    <a
                      href="mailto:support@omnisales.com"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      support@omnisales.com
                    </a>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      ตอบกลับภายใน 24 ชั่วโมง
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      LINE Official
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">@omnisales</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      แชทสดทันที
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Phone className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      โทรศัพท์
                    </h3>
                    <a
                      href="tel:+6620001234"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      02-000-1234
                    </a>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      จันทร์-ศุกร์, 9:00-18:00
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <MapPin className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      ที่อยู่
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      123 ถนนสุขุมวิท<br />
                      เขตวัฒนา กรุงเทพฯ 10110
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  เวลาทำการ
                </h2>
              </div>
              <div className="space-y-2 text-gray-600 dark:text-gray-300">
                <div className="flex justify-between">
                  <span>จันทร์ - ศุกร์</span>
                  <span className="font-semibold">9:00 - 18:00</span>
                </div>
                <div className="flex justify-between">
                  <span>เสาร์</span>
                  <span className="font-semibold">10:00 - 16:00</span>
                </div>
                <div className="flex justify-between">
                  <span>อาทิตย์</span>
                  <span className="text-gray-400 dark:text-gray-500">ปิดทำการ</span>
                </div>
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 text-sm">
                  <p className="text-blue-600 dark:text-blue-400">
                    💬 แชท LINE: 24/7 (ตอบอัตโนมัตินอกเวลา)
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                ลิงก์ที่เป็นประโยชน์
              </h2>
              <div className="space-y-2">
                <Link
                  href="/pricing"
                  className="block text-blue-600 dark:text-blue-400 hover:underline"
                >
                  → ดูแผนราคา
                </Link>
                <Link
                  href="/terms"
                  className="block text-blue-600 dark:text-blue-400 hover:underline"
                >
                  → เงื่อนไขการให้บริการ
                </Link>
                <Link
                  href="/privacy"
                  className="block text-blue-600 dark:text-blue-400 hover:underline"
                >
                  → นโยบายความเป็นส่วนตัว
                </Link>
                <Link
                  href="/login"
                  className="block text-blue-600 dark:text-blue-400 hover:underline"
                >
                  → เข้าสู่ระบบ
                </Link>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                ส่งข้อความถึงเรา
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                กรอกฟอร์มด้านล่างและเราจะติดต่อกลับโดยเร็วที่สุด
              </p>

              {submitted ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                    <Send className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    ส่งข้อความสำเร็จ!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    เราได้รับข้อความของคุณแล้ว<br />
                    ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Type of Inquiry */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ประเภทคำถาม
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="support">ขอความช่วยเหลือ</option>
                      <option value="sales">สอบถามเกี่ยวกับการขาย</option>
                      <option value="billing">เกี่ยวกับการเรียกเก็บเงิน</option>
                      <option value="technical">ปัญหาทางเทคนิค</option>
                      <option value="feedback">ข้อเสนอแนะ</option>
                      <option value="other">อื่นๆ</option>
                    </select>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ชื่อ-นามสกุล <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="กรอกชื่อของคุณ"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      อีเมล <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="your@email.com"
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      หัวข้อ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="สรุปเรื่องที่ต้องการติดต่อ"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ข้อความ <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="โปรดอธิบายรายละเอียดเพิ่มเติม..."
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>กำลังส่ง...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>ส่งข้อความ</span>
                      </>
                    )}
                  </button>

                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    การส่งข้อความแสดงว่าคุณยอมรับ{' '}
                    <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
                      นโยบายความเป็นส่วนตัว
                    </Link>
                  </p>
                </form>
              )}
            </div>

            {/* FAQ Preview */}
            <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                💡 คำถามที่พบบ่อย
              </h3>
              <div className="space-y-2 text-blue-800 dark:text-blue-200">
                <p>
                  <strong>Q: จะเปลี่ยนแผนบริการได้อย่างไร?</strong><br />
                  <span className="text-sm">A: เข้าไปที่ Settings → Billing เพื่ออัพเกรดหรือดาวน์เกรดแผน</span>
                </p>
                <p>
                  <strong>Q: ลืมรหัสผ่านทำอย่างไร?</strong><br />
                  <span className="text-sm">A: คลิก "ลืมรหัสผ่าน" ในหน้า login เพื่อรีเซ็ตรหัสผ่านทางอีเมล</span>
                </p>
                <p>
                  <strong>Q: มีช่วยติดตั้งไหม?</strong><br />
                  <span className="text-sm">A: มี! แผน Enterprise มีบริการ on-site training และติดตั้งฟรี</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
