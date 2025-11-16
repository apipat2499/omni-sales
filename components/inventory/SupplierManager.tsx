'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Supplier } from '@/types';
import { SupplierPerformance } from '@/lib/utils/reorder-management';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface SupplierManagerProps {
  userId: string;
  suppliers?: Supplier[];
  onSupplierCreate?: (supplier: Supplier) => void;
  onSupplierUpdate?: (supplier: Supplier) => void;
  onSupplierDelete?: (supplierId: string) => void;
}

interface SupplierFormData {
  supplierName: string;
  supplierCode: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  paymentTerms: string;
  leadTimeDays: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SupplierManager({
  userId,
  suppliers = [],
  onSupplierCreate,
  onSupplierUpdate,
  onSupplierDelete,
}: SupplierManagerProps) {
  // State
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'details'>('list');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'leadTime' | 'rating'>('name');
  const [performanceData, setPerformanceData] = useState<Record<string, SupplierPerformance>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<SupplierFormData>({
    supplierName: '',
    supplierCode: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    paymentTerms: 'Net 30',
    leadTimeDays: 7,
  });

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Load performance data for suppliers
   */
  useEffect(() => {
    const loadPerformance = async () => {
      const performances: Record<string, SupplierPerformance> = {};
      for (const supplier of suppliers) {
        try {
          const response = await fetch(
            `/api/inventory/suppliers/${supplier.id}/performance`
          );
          if (response.ok) {
            const data = await response.json();
            performances[supplier.id] = data;
          }
        } catch (err) {
          console.error(`Failed to load performance for ${supplier.id}`, err);
        }
      }
      setPerformanceData(performances);
    };

    if (suppliers.length > 0) {
      loadPerformance();
    }
  }, [suppliers]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleCreateSupplier = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/inventory/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId }),
      });

      if (response.ok) {
        const newSupplier = await response.json();
        onSupplierCreate?.(newSupplier);
        resetForm();
        setViewMode('list');
      }
    } catch (err) {
      console.error('Failed to create supplier:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSupplier = async () => {
    if (!selectedSupplier) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/inventory/suppliers/${selectedSupplier.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedSupplier = await response.json();
        onSupplierUpdate?.(updatedSupplier);
        resetForm();
        setViewMode('list');
        setSelectedSupplier(null);
      }
    } catch (err) {
      console.error('Failed to update supplier:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/inventory/suppliers/${supplierId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onSupplierDelete?.(supplierId);
      }
    } catch (err) {
      console.error('Failed to delete supplier:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      supplierName: supplier.supplierName || '',
      supplierCode: supplier.supplierCode || '',
      contactPerson: supplier.contactPerson || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      city: supplier.city || '',
      country: supplier.country || '',
      paymentTerms: supplier.paymentTerms || 'Net 30',
      leadTimeDays: supplier.leadTimeDays || 7,
    });
    setViewMode('create');
  };

  const handleViewDetails = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setViewMode('details');
  };

  const resetForm = () => {
    setFormData({
      supplierName: '',
      supplierCode: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: '',
      paymentTerms: 'Net 30',
      leadTimeDays: 7,
    });
    setSelectedSupplier(null);
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const filteredSuppliers = useMemo(() => {
    let filtered = suppliers;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        s =>
          s.supplierName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.supplierCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.supplierName || '').localeCompare(b.supplierName || '');
        case 'leadTime':
          return (a.leadTimeDays || 0) - (b.leadTimeDays || 0);
        case 'rating':
          const ratingA = performanceData[a.id]?.overallScore || 0;
          const ratingB = performanceData[b.id]?.overallScore || 0;
          return ratingB - ratingA;
        default:
          return 0;
      }
    });

    return filtered;
  }, [suppliers, searchQuery, sortBy, performanceData]);

  // ============================================================================
  // RENDER: HEADER
  // ============================================================================

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Supplier Management</h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage suppliers, performance, and delivery metrics
        </p>
      </div>
      {viewMode === 'list' && (
        <button
          onClick={() => setViewMode('create')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Supplier
        </button>
      )}
    </div>
  );

  // ============================================================================
  // RENDER: SUPPLIER LIST
  // ============================================================================

  const renderList = () => (
    <div className="space-y-4">
      {/* Search and Sort */}
      <div className="flex items-center space-x-4">
        <input
          type="text"
          placeholder="Search suppliers..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="name">Sort by Name</option>
          <option value="leadTime">Sort by Lead Time</option>
          <option value="rating">Sort by Rating</option>
        </select>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map(supplier => {
          const performance = performanceData[supplier.id];
          return (
            <div
              key={supplier.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewDetails(supplier)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {supplier.supplierName}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Code: {supplier.supplierCode || 'N/A'}
                  </p>
                </div>
                {performance && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {(performance.overallScore * 100).toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-500">Score</div>
                  </div>
                )}
              </div>

              {/* Contact Info */}
              <div className="space-y-1 text-sm mb-3">
                {supplier.contactPerson && (
                  <div className="text-gray-600">
                    Contact: {supplier.contactPerson}
                  </div>
                )}
                {supplier.email && (
                  <div className="text-gray-600">{supplier.email}</div>
                )}
                {supplier.phone && (
                  <div className="text-gray-600">{supplier.phone}</div>
                )}
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-2 text-sm mb-3 pt-3 border-t">
                <div>
                  <div className="text-xs text-gray-500">Lead Time</div>
                  <div className="font-semibold">{supplier.leadTimeDays || 0} days</div>
                </div>
                {performance && (
                  <div>
                    <div className="text-xs text-gray-500">On-Time Rate</div>
                    <div className="font-semibold">
                      {(performance.onTimeDeliveryRate * 100).toFixed(0)}%
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-gray-500">Payment Terms</div>
                  <div className="font-semibold text-xs">
                    {supplier.paymentTerms || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Status</div>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      supplier.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {supplier.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 pt-3 border-t">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleEditSupplier(supplier);
                  }}
                  className="flex-1 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleDeleteSupplier(supplier.id);
                  }}
                  className="flex-1 px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredSuppliers.length === 0 && (
        <div className="text-center py-12 text-gray-500 bg-white border border-gray-200 rounded-lg">
          No suppliers found. Add one to get started!
        </div>
      )}
    </div>
  );

  // ============================================================================
  // RENDER: SUPPLIER FORM
  // ============================================================================

  const renderForm = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {selectedSupplier ? 'Edit Supplier' : 'Add New Supplier'}
        </h3>
        <button
          onClick={() => {
            resetForm();
            setViewMode('list');
          }}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Supplier Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Supplier Name *
          </label>
          <input
            type="text"
            value={formData.supplierName}
            onChange={e => setFormData({ ...formData, supplierName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Supplier Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Supplier Code
          </label>
          <input
            type="text"
            value={formData.supplierCode}
            onChange={e => setFormData({ ...formData, supplierCode: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Contact Person */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact Person
          </label>
          <input
            type="text"
            value={formData.contactPerson}
            onChange={e =>
              setFormData({ ...formData, contactPerson: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={e => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input
            type="text"
            value={formData.city}
            onChange={e => setFormData({ ...formData, city: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country
          </label>
          <input
            type="text"
            value={formData.country}
            onChange={e => setFormData({ ...formData, country: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Payment Terms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Terms
          </label>
          <select
            value={formData.paymentTerms}
            onChange={e => setFormData({ ...formData, paymentTerms: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="Net 15">Net 15</option>
            <option value="Net 30">Net 30</option>
            <option value="Net 60">Net 60</option>
            <option value="Net 90">Net 90</option>
            <option value="COD">Cash on Delivery</option>
          </select>
        </div>

        {/* Lead Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lead Time (days) *
          </label>
          <input
            type="number"
            value={formData.leadTimeDays}
            onChange={e =>
              setFormData({ ...formData, leadTimeDays: parseInt(e.target.value) || 0 })
            }
            min={1}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-2 pt-4 border-t">
        <button
          onClick={() => {
            resetForm();
            setViewMode('list');
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={selectedSupplier ? handleUpdateSupplier : handleCreateSupplier}
          disabled={isLoading || !formData.supplierName}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isLoading
            ? 'Saving...'
            : selectedSupplier
            ? 'Update Supplier'
            : 'Add Supplier'}
        </button>
      </div>
    </div>
  );

  // ============================================================================
  // RENDER: SUPPLIER DETAILS
  // ============================================================================

  const renderDetails = () => {
    if (!selectedSupplier) return null;

    const performance = performanceData[selectedSupplier.id];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setViewMode('list');
              setSelectedSupplier(null);
            }}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to List
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleEditSupplier(selectedSupplier)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Edit Supplier
            </button>
            <button
              onClick={() => handleDeleteSupplier(selectedSupplier.id)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Supplier Info Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {selectedSupplier.supplierName}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Supplier Code</div>
              <div className="font-medium">{selectedSupplier.supplierCode || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Contact Person</div>
              <div className="font-medium">
                {selectedSupplier.contactPerson || '-'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Email</div>
              <div className="font-medium">{selectedSupplier.email || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Phone</div>
              <div className="font-medium">{selectedSupplier.phone || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Address</div>
              <div className="font-medium">
                {[
                  selectedSupplier.address,
                  selectedSupplier.city,
                  selectedSupplier.country,
                ]
                  .filter(Boolean)
                  .join(', ') || '-'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Payment Terms</div>
              <div className="font-medium">{selectedSupplier.paymentTerms || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Lead Time</div>
              <div className="font-medium">{selectedSupplier.leadTimeDays} days</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Status</div>
              <span
                className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                  selectedSupplier.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {selectedSupplier.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        {performance && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Performance Metrics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">
                  {(performance.overallScore * 100).toFixed(0)}
                </div>
                <div className="text-sm text-gray-600 mt-1">Overall Score</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">
                  {(performance.onTimeDeliveryRate * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600 mt-1">On-Time Delivery</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-3xl font-bold text-yellow-600">
                  {performance.averageLeadTime.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600 mt-1">Avg Lead Time (days)</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">
                  {(performance.qualityScore * 5).toFixed(1)}/5
                </div>
                <div className="text-sm text-gray-600 mt-1">Quality Rating</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {renderHeader()}

      {viewMode === 'list' && renderList()}
      {viewMode === 'create' && renderForm()}
      {viewMode === 'details' && renderDetails()}

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      )}
    </div>
  );
}
