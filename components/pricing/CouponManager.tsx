/**
 * CouponManager Component
 * Manage coupons with bulk generation, QR codes, and redemption tracking
 */

'use client';

import React, { useState, useMemo } from 'react';
import { useCouponManagement } from '@/lib/hooks/useCouponManagement';
import type { Coupon, CouponType } from '@/lib/utils/discount-calculator';

interface CouponManagerProps {
  className?: string;
}

export default function CouponManager({ className = '' }: CouponManagerProps) {
  const {
    coupons,
    activeCoupons,
    loading,
    error,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    generateBulkCoupons,
    generateCode,
    statistics,
    refresh,
  } = useCouponManagement();

  const [view, setView] = useState<'list' | 'create' | 'bulk'>('list');
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<CouponType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  /**
   * Filter coupons
   */
  const filteredCoupons = useMemo(() => {
    let filtered = coupons;

    if (searchQuery) {
      filtered = filtered.filter((c) =>
        c.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter((c) => c.type === filterType);
    }

    if (filterStatus === 'active') {
      filtered = activeCoupons;
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter((c) => !c.isActive);
    }

    return filtered;
  }, [coupons, activeCoupons, searchQuery, filterType, filterStatus]);

  /**
   * Handle delete coupon
   */
  const handleDelete = async (code: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      await deleteCoupon(code);
    } catch (err) {
      alert('Failed to delete coupon');
    }
  };

  /**
   * Handle toggle coupon
   */
  const handleToggle = async (code: string, isActive: boolean) => {
    try {
      await updateCoupon(code, { isActive: !isActive });
    } catch (err) {
      alert('Failed to toggle coupon');
    }
  };

  if (view === 'create') {
    return (
      <CouponForm
        onSave={async (coupon) => {
          await createCoupon(coupon);
          setView('list');
        }}
        onCancel={() => setView('list')}
        generateCode={generateCode}
        className={className}
      />
    );
  }

  if (view === 'bulk') {
    return (
      <BulkCouponGenerator
        onGenerate={async (count, config) => {
          const codes = await generateBulkCoupons(count, config);
          alert(`Generated ${codes.length} coupons!`);
          setView('list');
        }}
        onCancel={() => setView('list')}
        className={className}
      />
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Coupon Manager</h2>
            <p className="text-sm text-gray-600 mt-1">
              Generate and manage discount coupons
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView('bulk')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Bulk Generate
            </button>
            <button
              onClick={() => setView('create')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Coupon
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Total Coupons</div>
            <div className="text-2xl font-bold text-blue-600">{statistics.totalCoupons}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Active Coupons</div>
            <div className="text-2xl font-bold text-green-600">{statistics.activeCoupons}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Total Redemptions</div>
            <div className="text-2xl font-bold text-purple-600">{statistics.totalRedemptions}</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Redemption Rate</div>
            <div className="text-2xl font-bold text-orange-600">
              {statistics.totalCoupons > 0
                ? ((statistics.totalRedemptions / statistics.totalCoupons) * 100).toFixed(1)
                : 0}
              %
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search by code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as CouponType | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount</option>
            <option value="bogo">BOGO</option>
            <option value="free_shipping">Free Shipping</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Top Coupons */}
      {statistics.topCoupons.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Top Performing Coupons</h3>
          <div className="grid grid-cols-5 gap-3">
            {statistics.topCoupons.map((item, index) => (
              <div key={item.coupon.code} className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-3">
                <div className="text-xs text-gray-600">#{index + 1}</div>
                <div className="font-mono font-semibold text-purple-700 text-sm">{item.coupon.code}</div>
                <div className="text-xs text-gray-600 mt-1">{item.redemptions} uses</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coupons List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading coupons...</p>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No coupons found</p>
            <button
              onClick={() => setView('create')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Your First Coupon
            </button>
          </div>
        ) : (
          filteredCoupons.map((coupon) => (
            <CouponCard
              key={coupon.code}
              coupon={coupon}
              onToggle={() => handleToggle(coupon.code, coupon.isActive)}
              onDelete={() => handleDelete(coupon.code)}
              onEdit={() => setSelectedCoupon(coupon)}
            />
          ))
        )}
      </div>

      {/* Edit Coupon Modal */}
      {selectedCoupon && (
        <CouponForm
          coupon={selectedCoupon}
          onSave={async (updates) => {
            await updateCoupon(selectedCoupon.code, updates);
            setSelectedCoupon(null);
          }}
          onCancel={() => setSelectedCoupon(null)}
          generateCode={generateCode}
          isModal
        />
      )}
    </div>
  );
}

/**
 * Coupon Card Component
 */
interface CouponCardProps {
  coupon: Coupon;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

function CouponCard({ coupon, onToggle, onDelete, onEdit }: CouponCardProps) {
  const [showQR, setShowQR] = useState(false);

  const typeColors: Record<CouponType, string> = {
    percentage: 'bg-blue-100 text-blue-800',
    fixed: 'bg-green-100 text-green-800',
    bogo: 'bg-purple-100 text-purple-800',
    free_shipping: 'bg-orange-100 text-orange-800',
    buy_x_get_y: 'bg-pink-100 text-pink-800',
  };

  const isExpired = coupon.validUntil < new Date();
  const isValid = coupon.isActive && !isExpired;

  return (
    <div className={`border rounded-lg p-4 ${isExpired ? 'bg-gray-50 opacity-75' : 'bg-white'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <code className="text-xl font-bold font-mono text-gray-900">{coupon.code}</code>
            <span className={`px-2 py-1 rounded text-xs font-medium ${typeColors[coupon.type]}`}>
              {coupon.type}
            </span>
            {isExpired && (
              <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                Expired
              </span>
            )}
            {!isExpired && !coupon.isActive && (
              <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                Inactive
              </span>
            )}
          </div>

          {coupon.description && (
            <p className="text-sm text-gray-600 mb-2">{coupon.description}</p>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
            <span>
              Value: {coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`}
            </span>
            {coupon.minOrderValue && <span>Min Order: ${coupon.minOrderValue}</span>}
            <span>
              Valid: {coupon.validFrom.toLocaleDateString()} - {coupon.validUntil.toLocaleDateString()}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Uses:</span>
              <span className="font-semibold text-gray-900">{coupon.usageCount}</span>
              {coupon.maxUsages && <span className="text-gray-500">/ {coupon.maxUsages}</span>}
            </div>
            {coupon.maxUsagesPerCustomer && (
              <span className="text-gray-500">Max per customer: {coupon.maxUsagesPerCustomer}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQR(!showQR)}
            className="p-2 text-purple-600 hover:bg-purple-50 rounded"
            title="Show QR Code"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1z"
                clipRule="evenodd"
              />
              <path d="M11 4a1 1 0 10-2 0v1a1 1 0 002 0V4zM10 7a1 1 0 011 1v1h2a1 1 0 110 2h-3a1 1 0 01-1-1V8a1 1 0 011-1zM16 9a1 1 0 100 2 1 1 0 000-2zM9 13a1 1 0 011-1h1a1 1 0 110 2v2a1 1 0 11-2 0v-3zM7 11a1 1 0 10-2 0v4a1 1 0 102 0v-4zM15 11a1 1 0 10-2 0v4a1 1 0 102 0v-4zM14 15a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" />
            </svg>
          </button>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={coupon.isActive} onChange={onToggle} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
          <button onClick={onEdit} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
            Edit
          </button>
          <button onClick={onDelete} className="p-2 text-red-600 hover:bg-red-50 rounded">
            Delete
          </button>
        </div>
      </div>

      {/* QR Code */}
      {showQR && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <div className="bg-white p-4 border-2 border-gray-300 rounded">
              <QRCodePlaceholder code={coupon.code} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">QR Code</h4>
              <p className="text-xs text-gray-600">
                Scan this code to apply the coupon
              </p>
              <button className="mt-2 text-sm text-blue-600 hover:underline">
                Download QR Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Coupon Form Component
 */
interface CouponFormProps {
  coupon?: Coupon;
  onSave: (coupon: any) => Promise<void>;
  onCancel: () => void;
  generateCode: (prefix?: string, length?: number) => string;
  className?: string;
  isModal?: boolean;
}

function CouponForm({ coupon, onSave, onCancel, generateCode, className = '', isModal = false }: CouponFormProps) {
  const [formData, setFormData] = useState({
    code: coupon?.code || '',
    type: coupon?.type || 'percentage' as CouponType,
    value: coupon?.value || 10,
    validFrom: coupon?.validFrom?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    validUntil: coupon?.validUntil?.toISOString().split('T')[0] || '',
    minOrderValue: coupon?.minOrderValue || '',
    maxDiscount: coupon?.maxDiscount || '',
    maxUsages: coupon?.maxUsages || '',
    maxUsagesPerCustomer: coupon?.maxUsagesPerCustomer || '',
    isActive: coupon?.isActive ?? true,
    isStackable: coupon?.isStackable ?? true,
    description: coupon?.description || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await onSave({
        ...formData,
        validFrom: new Date(formData.validFrom),
        validUntil: new Date(formData.validUntil),
        minOrderValue: formData.minOrderValue ? parseFloat(formData.minOrderValue as string) : undefined,
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount as string) : undefined,
        maxUsages: formData.maxUsages ? parseInt(formData.maxUsages as string) : undefined,
        maxUsagesPerCustomer: formData.maxUsagesPerCustomer ? parseInt(formData.maxUsagesPerCustomer as string) : undefined,
      });
    } catch (err) {
      alert('Failed to save coupon');
    }
  };

  const content = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Coupon Code
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="SAVE20"
            required
            readOnly={!!coupon}
          />
          {!coupon && (
            <button
              type="button"
              onClick={() => setFormData({ ...formData, code: generateCode('SAVE', 8) })}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Generate
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as CouponType })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="percentage">Percentage Discount</option>
            <option value="fixed">Fixed Amount</option>
            <option value="bogo">Buy One Get One</option>
            <option value="free_shipping">Free Shipping</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Value {formData.type === 'percentage' ? '(%)' : '($)'}
          </label>
          <input
            type="number"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
          <input
            type="date"
            value={formData.validFrom}
            onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
          <input
            type="date"
            value={formData.validUntil}
            onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Order Value (optional)
          </label>
          <input
            type="number"
            value={formData.minOrderValue}
            onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="No minimum"
            min="0"
            step="0.01"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Discount (optional)
          </label>
          <input
            type="number"
            value={formData.maxDiscount}
            onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="No maximum"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Total Uses (optional)
          </label>
          <input
            type="number"
            value={formData.maxUsages}
            onChange={(e) => setFormData({ ...formData, maxUsages: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Unlimited"
            min="1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Uses Per Customer (optional)
          </label>
          <input
            type="number"
            value={formData.maxUsagesPerCustomer}
            onChange={(e) => setFormData({ ...formData, maxUsagesPerCustomer: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Unlimited"
            min="1"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description (optional)
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          rows={2}
          placeholder="Describe this coupon..."
        />
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Active</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isStackable}
            onChange={(e) => setFormData({ ...formData, isStackable: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Stackable with other coupons</span>
        </label>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {coupon ? 'Update' : 'Create'} Coupon
        </button>
      </div>
    </form>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {coupon ? 'Edit' : 'Create'} Coupon
          </h2>
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {coupon ? 'Edit' : 'Create'} Coupon
      </h2>
      {content}
    </div>
  );
}

/**
 * Bulk Coupon Generator
 */
interface BulkCouponGeneratorProps {
  onGenerate: (count: number, config: any) => Promise<void>;
  onCancel: () => void;
  className?: string;
}

function BulkCouponGenerator({ onGenerate, onCancel, className = '' }: BulkCouponGeneratorProps) {
  const [count, setCount] = useState(10);
  const [prefix, setPrefix] = useState('BULK');
  const [config, setConfig] = useState({
    type: 'percentage' as CouponType,
    value: 10,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    isActive: true,
    isStackable: false,
  });

  const handleGenerate = async () => {
    if (count < 1 || count > 1000) {
      alert('Please enter a count between 1 and 1000');
      return;
    }

    try {
      await onGenerate(count, config);
    } catch (err) {
      alert('Failed to generate coupons');
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Bulk Generate Coupons</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of Coupons (1-1000)
          </label>
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            min="1"
            max="1000"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Code Prefix (optional)
          </label>
          <input
            type="text"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value.toUpperCase())}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="BULK"
          />
          <p className="text-xs text-gray-500 mt-1">
            Codes will be like: {prefix}ABC123XY
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={config.type}
              onChange={(e) => setConfig({ ...config, type: e.target.value as CouponType })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="percentage">Percentage Discount</option>
              <option value="fixed">Fixed Amount</option>
              <option value="free_shipping">Free Shipping</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Value {config.type === 'percentage' ? '(%)' : '($)'}
            </label>
            <input
              type="number"
              value={config.value}
              onChange={(e) => setConfig({ ...config, value: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Preview</h3>
          <p className="text-sm text-blue-700">
            This will generate {count} unique coupons with {config.type === 'percentage' ? `${config.value}%` : `$${config.value}`} discount.
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Generate {count} Coupons
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * QR Code Placeholder Component
 */
function QRCodePlaceholder({ code }: { code: string }) {
  return (
    <div className="w-32 h-32 bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="text-xs text-gray-500">QR Code</div>
        <div className="text-xs font-mono text-gray-700 mt-1">{code}</div>
      </div>
    </div>
  );
}
