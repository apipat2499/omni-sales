'use client';

import { useState, useEffect } from 'react';
import { useAdvancedSettings } from '@/contexts/AdvancedSettingsContext';
import { Save, Eye, Palette, Type, Image as ImageIcon, MessageSquare, Link as LinkIcon } from 'lucide-react';

export default function StorefrontCustomizationPage() {
  const { settings, updateStorefront, loading } = useAdvancedSettings();
  const [formData, setFormData] = useState(settings.storefront);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'hero' | 'messages' | 'social'>('colors');

  useEffect(() => {
    setFormData(settings.storefront);
  }, [settings.storefront]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      await updateStorefront(formData);
      setMessage({ type: 'success', text: 'บันทึกการปรับแต่งหน้าร้านสำเร็จ!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการบันทึก' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">กำลังโหลด...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">การปรับแต่งหน้าร้าน</h1>
        <p className="text-gray-600">สร้างแบรนด์ที่เป็นเอกลักษณ์ด้วยการปรับแต่งสี ฟอนต์ และเนื้อหา</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="flex border-b border-gray-200 overflow-x-auto">
              {[
                { key: 'colors', label: 'สี', icon: <Palette className="w-4 h-4" /> },
                { key: 'typography', label: 'ฟอนต์', icon: <Type className="w-4 h-4" /> },
                { key: 'hero', label: 'แบนเนอร์', icon: <ImageIcon className="w-4 h-4" /> },
                { key: 'messages', label: 'ข้อความ', icon: <MessageSquare className="w-4 h-4" /> },
                { key: 'social', label: 'Social Media', icon: <LinkIcon className="w-4 h-4" /> },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* Colors Tab */}
              {activeTab === 'colors' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">สีธีมของร้านค้า</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <ColorPicker
                      label="สีหลัก"
                      value={formData.primary_color}
                      onChange={(color) => setFormData({ ...formData, primary_color: color })}
                    />
                    <ColorPicker
                      label="สีรอง"
                      value={formData.secondary_color}
                      onChange={(color) => setFormData({ ...formData, secondary_color: color })}
                    />
                    <ColorPicker
                      label="สีเน้น"
                      value={formData.accent_color}
                      onChange={(color) => setFormData({ ...formData, accent_color: color })}
                    />
                    <ColorPicker
                      label="สีปุ่ม"
                      value={formData.button_color}
                      onChange={(color) => setFormData({ ...formData, button_color: color })}
                    />
                    <ColorPicker
                      label="สีปุ่ม (Hover)"
                      value={formData.button_hover_color}
                      onChange={(color) => setFormData({ ...formData, button_hover_color: color })}
                    />
                    <ColorPicker
                      label="สีลิงก์"
                      value={formData.link_color}
                      onChange={(color) => setFormData({ ...formData, link_color: color })}
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">สี Status</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <ColorPicker
                        label="สำเร็จ"
                        value={formData.success_color}
                        onChange={(color) => setFormData({ ...formData, success_color: color })}
                      />
                      <ColorPicker
                        label="ข้อผิดพลาด"
                        value={formData.error_color}
                        onChange={(color) => setFormData({ ...formData, error_color: color })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Typography Tab */}
              {activeTab === 'typography' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">ฟอนต์</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ฟอนต์หลัก</label>
                    <select
                      value={formData.font_family}
                      onChange={(e) => setFormData({ ...formData, font_family: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Inter, system-ui, sans-serif">Inter</option>
                      <option value="Roboto, sans-serif">Roboto</option>
                      <option value="Prompt, sans-serif">Prompt (Thai)</option>
                      <option value="Sarabun, sans-serif">Sarabun (Thai)</option>
                      <option value="Kanit, sans-serif">Kanit (Thai)</option>
                      <option value="Georgia, serif">Georgia</option>
                      <option value="'Times New Roman', serif">Times New Roman</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ฟอนต์หัวข้อ</label>
                    <select
                      value={formData.heading_font}
                      onChange={(e) => setFormData({ ...formData, heading_font: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Inter, system-ui, sans-serif">Inter</option>
                      <option value="Roboto, sans-serif">Roboto</option>
                      <option value="Prompt, sans-serif">Prompt (Thai)</option>
                      <option value="Kanit, sans-serif">Kanit (Thai)</option>
                      <option value="Montserrat, sans-serif">Montserrat</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ขนาดฟอนต์พื้นฐาน: {formData.font_size_base}px
                    </label>
                    <input
                      type="range"
                      min="12"
                      max="20"
                      value={formData.font_size_base}
                      onChange={(e) =>
                        setFormData({ ...formData, font_size_base: parseInt(e.target.value) })
                      }
                      className="w-full"
                    />
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-lg font-medium mb-2" style={{ fontFamily: formData.heading_font }}>
                      ตัวอย่างหัวข้อ
                    </h4>
                    <p style={{ fontFamily: formData.font_family, fontSize: `${formData.font_size_base}px` }}>
                      ตัวอย่างข้อความธรรมดา Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    </p>
                  </div>
                </div>
              )}

              {/* Hero Tab */}
              {activeTab === 'hero' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">แบนเนอร์หน้าหลัก</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL รูปแบนเนอร์</label>
                    <input
                      type="url"
                      value={formData.hero_banner_url || ''}
                      onChange={(e) => setFormData({ ...formData, hero_banner_url: e.target.value })}
                      placeholder="https://example.com/banner.jpg"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">หัวข้อหลัก</label>
                    <input
                      type="text"
                      value={formData.hero_title || ''}
                      onChange={(e) => setFormData({ ...formData, hero_title: e.target.value })}
                      placeholder="ยินดีต้อนรับสู่ร้านของเรา"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">คำบรรยาย</label>
                    <input
                      type="text"
                      value={formData.hero_subtitle || ''}
                      onChange={(e) => setFormData({ ...formData, hero_subtitle: e.target.value })}
                      placeholder="สินค้าคุณภาพ ราคาดี บริการเป็นเลิศ"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ข้อความปุ่ม</label>
                      <input
                        type="text"
                        value={formData.hero_cta_text}
                        onChange={(e) => setFormData({ ...formData, hero_cta_text: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ลิงก์ปุ่ม</label>
                      <input
                        type="text"
                        value={formData.hero_cta_link}
                        onChange={(e) => setFormData({ ...formData, hero_cta_link: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Messages Tab */}
              {activeTab === 'messages' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">ข้อความและประกาศ</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ข้อความต้อนรับ</label>
                    <textarea
                      value={formData.welcome_message || ''}
                      onChange={(e) => setFormData({ ...formData, welcome_message: e.target.value })}
                      rows={3}
                      placeholder="ยินดีต้อนรับสู่ร้านของเรา..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">แบนเนอร์โปรโมชั่น</label>
                    <textarea
                      value={formData.promotion_banner || ''}
                      onChange={(e) => setFormData({ ...formData, promotion_banner: e.target.value })}
                      rows={2}
                      placeholder="ลดราคาพิเศษ 50% ทุกสินค้า!"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">แสดงประกาศ</label>
                      <input
                        type="checkbox"
                        checked={formData.announcement_enabled}
                        onChange={(e) =>
                          setFormData({ ...formData, announcement_enabled: e.target.checked })
                        }
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                    </div>

                    {formData.announcement_enabled && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">ข้อความประกาศ</label>
                          <textarea
                            value={formData.announcement_text || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, announcement_text: e.target.value })
                            }
                            rows={2}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทประกาศ</label>
                          <select
                            value={formData.announcement_type}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                announcement_type: e.target.value as 'info' | 'warning' | 'success',
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="info">ข้อมูล (น้ำเงิน)</option>
                            <option value="warning">คำเตือน (เหลือง)</option>
                            <option value="success">สำเร็จ (เขียว)</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Social Tab */}
              {activeTab === 'social' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">โซเชียลมีเดีย</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Facebook URL</label>
                    <input
                      type="url"
                      value={formData.facebook_url || ''}
                      onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                      placeholder="https://facebook.com/yourpage"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Instagram URL</label>
                    <input
                      type="url"
                      value={formData.instagram_url || ''}
                      onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                      placeholder="https://instagram.com/yourpage"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">LINE URL</label>
                    <input
                      type="url"
                      value={formData.line_url || ''}
                      onChange={(e) => setFormData({ ...formData, line_url: e.target.value })}
                      placeholder="https://line.me/ti/p/@yourline"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">TikTok URL</label>
                    <input
                      type="url"
                      value={formData.tiktok_url || ''}
                      onChange={(e) => setFormData({ ...formData, tiktok_url: e.target.value })}
                      placeholder="https://tiktok.com/@yourpage"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Message */}
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

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </button>
            <button className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              <Eye className="w-5 h-5" />
              ดูตัวอย่าง
            </button>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ตัวอย่าง</h3>

              {/* Color Preview */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">สีธีม:</p>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-12 h-12 rounded-lg border-2 border-gray-200"
                        style={{ backgroundColor: formData.primary_color }}
                      />
                      <span className="text-xs mt-1">หลัก</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div
                        className="w-12 h-12 rounded-lg border-2 border-gray-200"
                        style={{ backgroundColor: formData.secondary_color }}
                      />
                      <span className="text-xs mt-1">รอง</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div
                        className="w-12 h-12 rounded-lg border-2 border-gray-200"
                        style={{ backgroundColor: formData.accent_color }}
                      />
                      <span className="text-xs mt-1">เน้น</span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">ปุ่ม:</p>
                  <button
                    className="px-4 py-2 rounded-lg text-white font-medium"
                    style={{ backgroundColor: formData.button_color }}
                  >
                    {formData.hero_cta_text}
                  </button>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">ลิงก์:</p>
                  <a href="#" style={{ color: formData.link_color }} className="font-medium hover:underline">
                    ตัวอย่างลิงก์
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
        />
      </div>
    </div>
  );
}
