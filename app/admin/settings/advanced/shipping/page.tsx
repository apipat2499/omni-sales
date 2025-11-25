'use client';

import { useState } from 'react';
import { useAdvancedSettings } from '@/contexts/AdvancedSettingsContext';
import { Truck, Plus, MapPin, Package } from 'lucide-react';

export default function ShippingSettingsPage() {
  const { settings, addShippingZone, addShippingProvider } = useAdvancedSettings();
  const [activeTab, setActiveTab] = useState<'zones' | 'providers'>('providers');

  const providers = [
    { name: 'Kerry Express', code: 'KERRY', cost: 50, days: '1-2', logo: '🚚' },
    { name: 'Flash Express', code: 'FLASH', cost: 40, days: '1-3', logo: '⚡' },
    { name: 'Thailand Post', code: 'THPOST', cost: 30, days: '3-5', logo: '📮' },
    { name: 'J&T Express', code: 'JNT', cost: 45, days: '2-3', logo: '📦' },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
          <Truck className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">การจัดส่งขั้นสูง</h1>
          <p className="text-gray-600">จัดการโซนและผู้ให้บริการจัดส่ง</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('providers')}
            className={`flex-1 px-6 py-4 text-sm font-medium ${
              activeTab === 'providers'
                ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Package className="w-4 h-4 inline mr-2" />
            ผู้ให้บริการ
          </button>
          <button
            onClick={() => setActiveTab('zones')}
            className={`flex-1 px-6 py-4 text-sm font-medium ${
              activeTab === 'zones'
                ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <MapPin className="w-4 h-4 inline mr-2" />
            โซนการจัดส่ง
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'providers' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">ผู้ให้บริการจัดส่ง</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  <Plus className="w-4 h-4" />
                  เพิ่มผู้ให้บริการ
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {providers.map((provider) => (
                  <div
                    key={provider.code}
                    className="border border-gray-200 rounded-lg p-4 hover:border-red-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{provider.logo}</div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{provider.name}</h4>
                          <p className="text-sm text-gray-600">รหัส: {provider.code}</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      </label>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">ค่าจัดส่ง:</span>
                        <p className="font-semibold text-gray-900">฿{provider.cost}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">ระยะเวลา:</span>
                        <p className="font-semibold text-gray-900">{provider.days} วัน</p>
                      </div>
                    </div>

                    <button className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                      ตั้งค่าราคาและโซน
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'zones' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">โซนการจัดส่ง</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  <Plus className="w-4 h-4" />
                  เพิ่มโซน
                </button>
              </div>

              <div className="grid gap-4">
                {[
                  { name: 'กรุงเทพและปริมณฑล', provinces: 6, cost: 50, isMetro: true },
                  { name: 'ภาคกลาง', provinces: 25, cost: 70, isMetro: false },
                  { name: 'ภาคเหนือ', provinces: 17, cost: 90, isMetro: false },
                  { name: 'ภาคอีสาน', provinces: 20, cost: 90, isMetro: false },
                  { name: 'ภาคใต้', provinces: 14, cost: 100, isMetro: false },
                ].map((zone, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">{zone.name}</h4>
                          {zone.isMetro && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                              Metro
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{zone.provinces} จังหวัด</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">ค่าจัดส่งเริ่มต้น</p>
                        <p className="text-lg font-bold text-gray-900">฿{zone.cost}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
