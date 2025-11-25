'use client';

import { useState } from 'react';
import { useAdvancedSettings } from '@/contexts/AdvancedSettingsContext';
import { Save, Hash, Clock } from 'lucide-react';

export default function OrderSettingsPage() {
  const { settings, updateOrderNumberSettings } = useAdvancedSettings();
  const [formData, setFormData] = useState(settings.orderNumberSettings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const generateExample = () => {
    let example = formData.prefix;
    if (formData.separator) example += formData.separator;
    if (formData.include_year) example += '2025';
    if (formData.include_month) example += '01';
    if (formData.include_day) example += '15';
    if (formData.separator && (formData.include_year || formData.include_month || formData.include_day)) {
      example += formData.separator;
    }
    example += '1'.padStart(formData.padding, '0');
    if (formData.suffix) example += formData.separator + formData.suffix;
    return example;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const example = generateExample();
      await updateOrderNumberSettings({ ...formData, example_format: example });
      setMessage({ type: 'success', text: 'บันทึกการตั้งค่าสำเร็จ!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาด' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Hash className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ตั้งค่าคำสั่งซื้อ</h1>
            <p className="text-gray-600">กำหนดรูปแบบหมายเลขและการจัดการคำสั่งซื้อ</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">รูปแบบหมายเลขคำสั่งซื้อ</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">คำนำหน้า (Prefix)</label>
            <input
              type="text"
              value={formData.prefix}
              onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="ORD"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">คำต่อท้าย (Suffix)</label>
            <input
              type="text"
              value={formData.suffix || ''}
              onChange={(e) => setFormData({ ...formData, suffix: e.target.value || undefined })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="TH"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              จำนวนหลัก: {formData.padding}
            </label>
            <input
              type="range"
              min="4"
              max="10"
              value={formData.padding}
              onChange={(e) => setFormData({ ...formData, padding: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ตัวคั่น</label>
            <select
              value={formData.separator}
              onChange={(e) => setFormData({ ...formData, separator: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="-">ขีด (-)</option>
              <option value="_">ขีดล่าง (_)</option>
              <option value="/">ทับ (/)</option>
              <option value="">ไม่มี</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">รวมวันที่:</p>
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.include_year}
                onChange={(e) => setFormData({ ...formData, include_year: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm">ปี (YYYY)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.include_month}
                onChange={(e) => setFormData({ ...formData, include_month: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm">เดือน (MM)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.include_day}
                onChange={(e) => setFormData({ ...formData, include_day: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm">วัน (DD)</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">รีเซ็ตเลขลำดับ</label>
          <select
            value={formData.reset_counter}
            onChange={(e) =>
              setFormData({
                ...formData,
                reset_counter: e.target.value as 'never' | 'yearly' | 'monthly' | 'daily',
              })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="never">ไม่รีเซ็ต</option>
            <option value="yearly">รีเซ็ตทุกปี</option>
            <option value="monthly">รีเซ็ตทุกเดือน</option>
            <option value="daily">รีเซ็ตทุกวัน</option>
          </select>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-700 mb-1">ตัวอย่างหมายเลขคำสั่งซื้อ:</p>
          <p className="text-2xl font-bold text-blue-700">{generateExample()}</p>
        </div>

        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
        </button>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">การยกเลิกอัตโนมัติ</h3>
        </div>
        <p className="text-sm text-gray-600">
          คำสั่งซื้อที่ไม่ได้ชำระเงินจะถูกยกเลิกอัตโนมัติหลังจากครบเวลาที่กำหนด
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">เวลารอ (นาที)</label>
            <input
              type="number"
              defaultValue={60}
              min="15"
              max="1440"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 text-orange-600 rounded"
              />
              <span className="text-sm">เปิดใช้งาน</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
