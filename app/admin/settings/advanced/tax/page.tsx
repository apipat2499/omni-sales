'use client';

import { useState } from 'react';
import { useAdvancedSettings } from '@/contexts/AdvancedSettingsContext';
import { Save, Plus, Trash2, Edit2, Calculator } from 'lucide-react';
import type { TaxRule } from '@/contexts/AdvancedSettingsContext';

const THAI_PROVINCES = [
  'กรุงเทพมหานคร', 'กระบี่', 'กาญจนบุรี', 'กาฬสินธุ์', 'กำแพงเพชร', 'ขอนแก่น', 'จันทบุรี', 'ฉะเชิงเทรา',
  'ชลบุรี', 'ชัยนาท', 'ชัยภูมิ', 'ชุมพร', 'เชียงราย', 'เชียงใหม่', 'ตรัง', 'ตราด', 'ตาก', 'นครนายก',
  'นครปฐม', 'นครพนม', 'นครราชสีมา', 'นครศรีธรรมราช', 'นครสวรรค์', 'นนทบุรี', 'นราธิวาส', 'น่าน',
  'บึงกาฬ', 'บุรีรัมย์', 'ปทุมธานี', 'ประจวบคีรีขันธ์', 'ปราจีนบุรี', 'ปัตตานี', 'พระนครศรีอยุธยา',
  'พะเยา', 'พังงา', 'พัทลุง', 'พิจิตร', 'พิษณุโลก', 'เพชรบุรี', 'เพชรบูรณ์', 'แพร่', 'พัฒนา',
  'ภูเก็ต', 'มหาสารคาม', 'มุกดาหาร', 'แม่ฮ่องสอน', 'ยโสธร', 'ยะลา', 'ร้อยเอ็ด', 'ระนอง', 'ระยอง',
  'ราชบุรี', 'ลพบุรี', 'ลำปาง', 'ลำพูน', 'เลย', 'ศรีสะเกษ', 'สกลนคร', 'สงขลา', 'สตูล', 'สมุทรปราการ',
  'สมุทรสงคราม', 'สมุทรสาคร', 'สระแก้ว', 'สระบุรี', 'สิงห์บุรี', 'สุโขทัย', 'สุพรรณบุรี', 'สุราษฎร์ธานี',
  'สุรินทร์', 'หนองคาย', 'หนองบัวลำภู', 'อ่างทอง', 'อำนาจเจริญ', 'อุดรธานี', 'อุตรดิตถ์', 'อุทัยธานี', 'อุบลราชธานี'
];

export default function TaxSettingsPage() {
  const { settings, addTaxRule, updateTaxRule, deleteTaxRule } = useAdvancedSettings();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<Omit<TaxRule, 'id'>>({
    name: '',
    description: '',
    tax_type: 'percentage',
    tax_rate: 7.0,
    apply_to: 'all',
    category_ids: [],
    product_ids: [],
    provinces: [],
    is_active: true,
    is_default: false,
    priority: 0,
  });

  const handleSave = async () => {
    if (editingId) {
      await updateTaxRule(editingId, formData);
      setEditingId(null);
    } else {
      await addTaxRule(formData);
      setShowAddModal(false);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      tax_type: 'percentage',
      tax_rate: 7.0,
      apply_to: 'all',
      category_ids: [],
      product_ids: [],
      provinces: [],
      is_active: true,
      is_default: false,
      priority: 0,
    });
  };

  const handleEdit = (rule: TaxRule) => {
    setFormData(rule);
    setEditingId(rule.id);
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบกฎภาษีนี้?')) {
      await deleteTaxRule(id);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Calculator className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ตั้งค่าภาษี</h1>
              <p className="text-gray-600">จัดการ VAT และภาษีตามประเภทสินค้า/พื้นที่</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            เพิ่มกฎภาษี
          </button>
        </div>
      </div>

      {/* Tax Rules List */}
      <div className="space-y-4">
        {settings.taxRules.map((rule) => (
          <div
            key={rule.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                  {rule.is_default && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      ค่าเริ่มต้น
                    </span>
                  )}
                  {!rule.is_active && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                      ปิดใช้งาน
                    </span>
                  )}
                </div>
                {rule.description && (
                  <p className="text-sm text-gray-600 mb-3">{rule.description}</p>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">อัตราภาษี:</span>
                    <p className="font-semibold text-gray-900">
                      {rule.tax_rate}
                      {rule.tax_type === 'percentage' ? '%' : ' บาท'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">ใช้กับ:</span>
                    <p className="font-semibold text-gray-900">
                      {rule.apply_to === 'all' && 'ทุกสินค้า'}
                      {rule.apply_to === 'category' && 'หมวดหมู่เฉพาะ'}
                      {rule.apply_to === 'product' && 'สินค้าเฉพาะ'}
                      {rule.apply_to === 'location' && 'จังหวัดเฉพาะ'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">ลำดับความสำคัญ:</span>
                    <p className="font-semibold text-gray-900">{rule.priority}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">สถานะ:</span>
                    <p className={`font-semibold ${rule.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                      {rule.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </p>
                  </div>
                </div>

                {rule.apply_to === 'location' && rule.provinces.length > 0 && (
                  <div className="mt-3">
                    <span className="text-sm text-gray-500">จังหวัด: </span>
                    <span className="text-sm text-gray-900">
                      {rule.provinces.join(', ')}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleEdit(rule)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(rule.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {settings.taxRules.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Calculator className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">ยังไม่มีกฎภาษี</h3>
            <p className="text-gray-600 mb-4">เริ่มต้นเพิ่มกฎภาษีแรกของคุณ</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              เพิ่มกฎภาษี
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingId ? 'แก้ไขกฎภาษี' : 'เพิ่มกฎภาษี'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ชื่อกฎภาษี *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="เช่น VAT 7%"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">คำอธิบาย</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="อธิบายกฎภาษีนี้"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ประเภทภาษี
                    </label>
                    <select
                      value={formData.tax_type}
                      onChange={(e) =>
                        setFormData({ ...formData, tax_type: e.target.value as 'percentage' | 'fixed' })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="percentage">เปอร์เซ็นต์ (%)</option>
                      <option value="fixed">จำนวนคงที่ (บาท)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      อัตราภาษี *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.tax_rate}
                      onChange={(e) =>
                        setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="7.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ใช้กับ</label>
                  <select
                    value={formData.apply_to}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        apply_to: e.target.value as 'all' | 'category' | 'product' | 'location',
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">ทุกสินค้า</option>
                    <option value="category">หมวดหมู่เฉพาะ</option>
                    <option value="product">สินค้าเฉพาะ</option>
                    <option value="location">จังหวัดเฉพาะ</option>
                  </select>
                </div>

                {formData.apply_to === 'location' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      เลือกจังหวัด
                    </label>
                    <select
                      multiple
                      value={formData.provinces}
                      onChange={(e) => {
                        const values = Array.from(e.target.selectedOptions, (option) => option.value);
                        setFormData({ ...formData, provinces: values });
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 h-32"
                    >
                      {THAI_PROVINCES.map((province) => (
                        <option key={province} value={province}>
                          {province}
                        </option>
                      ))}
                    </select>
                    <p className="text-sm text-gray-500 mt-1">กด Ctrl/Cmd เพื่อเลือกหลายจังหวัด</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ลำดับความสำคัญ
                  </label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="0"
                  />
                  <p className="text-sm text-gray-500 mt-1">เลขมากกว่า = ความสำคัญสูงกว่า</p>
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-green-600 rounded"
                    />
                    <span className="text-sm text-gray-700">เปิดใช้งาน</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_default}
                      onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                      className="w-4 h-4 text-green-600 rounded"
                    />
                    <span className="text-sm text-gray-700">ตั้งเป็นค่าเริ่มต้น</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Save className="w-5 h-5" />
                  {editingId ? 'บันทึกการแก้ไข' : 'เพิ่มกฎภาษี'}
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingId(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
