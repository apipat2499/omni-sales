'use client';

import { useState } from 'react';
import { useAdvancedSettings } from '@/contexts/AdvancedSettingsContext';
import { Save, Receipt, Building } from 'lucide-react';

export default function InvoiceSettingsPage() {
  const { settings, updateInvoiceSettings } = useAdvancedSettings();
  const [formData, setFormData] = useState(settings.invoiceSettings);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await updateInvoiceSettings(formData);
    setSaving(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
          <Receipt className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ตั้งค่าใบเสร็จ/ใบกำกับภาษี</h1>
          <p className="text-gray-600">จัดการข้อมูลบริษัทและฟอร์แมตใบเสร็จ</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">ข้อมูลบริษัท</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อบริษัท (ไทย) *</label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อบริษัท (EN)</label>
              <input
                type="text"
                value={formData.company_name_en || ''}
                onChange={(e) => setFormData({ ...formData, company_name_en: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">เลขประจำตัวผู้เสียภาษี</label>
              <input
                type="text"
                value={formData.tax_id || ''}
                onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="0123456789012"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">สาขา</label>
              <input
                type="text"
                value={formData.branch || ''}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="สำนักงานใหญ่"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">ที่อยู่ *</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">โทรศัพท์</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">อีเมล</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">เว็บไซต์</label>
              <input
                type="url"
                value={formData.website || ''}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ฟอร์แมตเอกสาร</h3>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">คำนำหน้าใบกำกับภาษี</label>
              <input
                type="text"
                value={formData.invoice_prefix}
                onChange={(e) => setFormData({ ...formData, invoice_prefix: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">คำนำหน้าใบเสร็จ</label>
              <input
                type="text"
                value={formData.receipt_prefix}
                onChange={(e) => setFormData({ ...formData, receipt_prefix: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">คำนำหน้าใบเสนอราคา</label>
              <input
                type="text"
                value={formData.quotation_prefix}
                onChange={(e) => setFormData({ ...formData, quotation_prefix: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {[
              { key: 'show_tax_breakdown', label: 'แสดงรายละเอียดภาษี' },
              { key: 'show_payment_method', label: 'แสดงวิธีการชำระเงิน' },
              { key: 'show_shipping_cost', label: 'แสดงค่าจัดส่ง' },
              { key: 'show_discount', label: 'แสดงส่วนลด' },
              { key: 'show_bilingual', label: 'แสดง 2 ภาษา (ไทย/อังกฤษ)' },
            ].map((item) => (
              <label key={item.key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData[item.key as keyof typeof formData] as boolean}
                  onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })}
                  className="w-4 h-4 text-orange-600 rounded"
                />
                <span className="text-sm text-gray-700">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ข้อความเพิ่มเติม</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">เงื่อนไขการชำระเงิน</label>
              <input
                type="text"
                value={formData.payment_terms}
                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Terms & Conditions</label>
              <textarea
                value={formData.terms_and_conditions || ''}
                onChange={(e) => setFormData({ ...formData, terms_and_conditions: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
        </button>
      </div>
    </div>
  );
}
