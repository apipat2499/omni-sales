'use client';

import { useState } from 'react';
import { useAdvancedSettings } from '@/contexts/AdvancedSettingsContext';
import { Save, Package, Grid, SlidersHorizontal } from 'lucide-react';

export default function ProductSettingsPage() {
  const { settings, updateProductSettings } = useAdvancedSettings();
  const [formData, setFormData] = useState(settings.productSettings);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
          <Package className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ตั้งค่าสินค้า</h1>
          <p className="text-gray-600">การแสดงผลและจัดการสินค้า</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Grid className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">การแสดงผล</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                จำนวนสินค้าต่อหน้า: {formData.products_per_page}
              </label>
              <input
                type="range"
                min="12"
                max="48"
                step="4"
                value={formData.products_per_page}
                onChange={(e) =>
                  setFormData({ ...formData, products_per_page: parseInt(e.target.value) })
                }
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">เรียงลำดับเริ่มต้น</label>
              <select
                value={formData.default_sort}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    default_sort: e.target.value as any,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="newest">ใหม่ล่าสุด</option>
                <option value="price_asc">ราคาต่ำ-สูง</option>
                <option value="price_desc">ราคาสูง-ต่ำ</option>
                <option value="popular">ยอดนิยม</option>
                <option value="name_asc">ชื่อ A-Z</option>
              </select>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Desktop (คอลัมน์)</label>
              <input
                type="number"
                min="2"
                max="6"
                value={formData.grid_columns_desktop}
                onChange={(e) =>
                  setFormData({ ...formData, grid_columns_desktop: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tablet (คอลัมน์)</label>
              <input
                type="number"
                min="2"
                max="4"
                value={formData.grid_columns_tablet}
                onChange={(e) =>
                  setFormData({ ...formData, grid_columns_tablet: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mobile (คอลัมน์)</label>
              <input
                type="number"
                min="1"
                max="2"
                value={formData.grid_columns_mobile}
                onChange={(e) =>
                  setFormData({ ...formData, grid_columns_mobile: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="mt-6 space-y-2">
            {[
              { key: 'show_quick_view', label: 'Quick View' },
              { key: 'show_add_to_cart', label: 'ปุ่ม Add to Cart' },
              { key: 'show_wishlist', label: 'Wishlist' },
              { key: 'show_compare', label: 'เปรียบเทียบสินค้า' },
              { key: 'show_rating', label: 'คะแนนรีวิว' },
              { key: 'show_stock_status', label: 'สถานะสต็อก' },
            ].map((item) => (
              <label key={item.key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData[item.key as keyof typeof formData] as boolean}
                  onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="text-sm text-gray-700">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">SKU & สินค้าหมด</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">คำนำหน้า SKU</label>
              <input
                type="text"
                value={formData.sku_prefix}
                onChange={(e) => setFormData({ ...formData, sku_prefix: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">รูปแบบ SKU</label>
              <select
                value={formData.sku_format}
                onChange={(e) => setFormData({ ...formData, sku_format: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="PREFIX-RANDOM8">PREFIX-RANDOM8</option>
                <option value="PREFIX-SEQUENTIAL">PREFIX-SEQUENTIAL</option>
                <option value="CATEGORY-SEQUENTIAL">CATEGORY-SEQUENTIAL</option>
              </select>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.sku_auto_generate}
                onChange={(e) => setFormData({ ...formData, sku_auto_generate: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-sm text-gray-700">สร้าง SKU อัตโนมัติ</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.show_out_of_stock}
                onChange={(e) =>
                  setFormData({ ...formData, show_out_of_stock: e.target.checked })
                }
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-sm text-gray-700">แสดงสินค้าหมด</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.allow_backorder}
                onChange={(e) => setFormData({ ...formData, allow_backorder: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-sm text-gray-700">อนุญาตสั่งจอง (Backorder)</span>
            </label>
          </div>

          {formData.show_out_of_stock && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ข้อความเมื่อสินค้าหมด
              </label>
              <input
                type="text"
                value={formData.out_of_stock_message}
                onChange={(e) =>
                  setFormData({ ...formData, out_of_stock_message: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        <button
          onClick={() => updateProductSettings(formData)}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Save className="w-5 h-5" />
          บันทึกการเปลี่ยนแปลง
        </button>
      </div>
    </div>
  );
}
