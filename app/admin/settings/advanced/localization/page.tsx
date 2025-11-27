'use client';

import { useState } from 'react';
import { useAdvancedSettings } from '@/contexts/AdvancedSettingsContext';
import { Globe, Plus, DollarSign, Languages } from 'lucide-react';

export default function LocalizationPage() {
  const { settings } = useAdvancedSettings();
  const [activeTab, setActiveTab] = useState<'languages' | 'currencies'>('languages');

  const languages = [
    { code: 'th', name: 'ไทย', flag: '🇹🇭', isDefault: true, enabled: true },
    { code: 'en', name: 'English', flag: '🇬🇧', isDefault: false, enabled: true },
    { code: 'zh', name: '中文', flag: '🇨🇳', isDefault: false, enabled: false },
    { code: 'ja', name: '日本語', flag: '🇯🇵', isDefault: false, enabled: false },
  ];

  const currencies = [
    { code: 'THB', name: 'บาทไทย', symbol: '฿', rate: 1.0, default: true },
    { code: 'USD', name: 'US Dollar', symbol: '$', rate: 0.028, default: false },
    { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.026, default: false },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', rate: 0.20, default: false },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
          <Globe className="w-6 h-6 text-teal-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ภาษาและสกุลเงิน</h1>
          <p className="text-gray-600">ตั้งค่า Multi-language & Multi-currency</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('languages')}
            className={`flex-1 px-6 py-4 text-sm font-medium ${
              activeTab === 'languages'
                ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Languages className="w-4 h-4 inline mr-2" />
            ภาษา
          </button>
          <button
            onClick={() => setActiveTab('currencies')}
            className={`flex-1 px-6 py-4 text-sm font-medium ${
              activeTab === 'currencies'
                ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <DollarSign className="w-4 h-4 inline mr-2" />
            สกุลเงิน
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'languages' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">ภาษาที่รองรับ</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                  <Plus className="w-4 h-4" />
                  เพิ่มภาษา
                </button>
              </div>

              <div className="grid gap-4">
                {languages.map((lang) => (
                  <div
                    key={lang.code}
                    className="border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">{lang.flag}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">{lang.name}</h4>
                          {lang.isDefault && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                              ค่าเริ่มต้น
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">รหัส: {lang.code.toUpperCase()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={lang.enabled}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                      </label>
                      <button className="px-3 py-1 text-sm text-teal-600 hover:bg-teal-50 rounded">
                        แก้ไข
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'currencies' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">สกุลเงินที่รองรับ</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                  <Plus className="w-4 h-4" />
                  เพิ่มสกุลเงิน
                </button>
              </div>

              <div className="grid gap-4">
                {currencies.map((currency) => (
                  <div
                    key={currency.code}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl font-bold text-gray-700">{currency.symbol}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900">
                              {currency.code} - {currency.name}
                            </h4>
                            {currency.default && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                หลัก
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            อัตราแลกเปลี่ยน: 1 THB = {currency.rate.toFixed(4)} {currency.code}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                          อัพเดทอัตรา
                        </button>
                        <button className="px-3 py-2 text-sm text-teal-600 hover:bg-teal-50 rounded-lg">
                          ตั้งค่า
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm font-medium text-blue-900">
                    อัพเดทอัตราแลกเปลี่ยนอัตโนมัติทุกวัน
                  </span>
                </label>
                <p className="text-sm text-blue-700 mt-1 ml-6">
                  ใช้ API ของ exchangerate-api.com
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
