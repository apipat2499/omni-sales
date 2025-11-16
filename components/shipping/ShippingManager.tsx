'use client';

import React, { useState, useEffect } from 'react';
import { Package, Truck, Download, X, CheckCircle, AlertCircle } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  total: number;
  status: string;
}

export function ShippingManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [selectedProvider, setSelectedProvider] = useState<string>('kerry');
  const [providers, setProviders] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadProviders();
    loadPendingOrders();
  }, []);

  const loadProviders = async () => {
    try {
      const response = await fetch('/api/shipping/providers');
      const data = await response.json();
      if (data.success) {
        setProviders(data.data);
      }
    } catch (error) {
      console.error('Error loading providers:', error);
    }
  };

  const loadPendingOrders = async () => {
    try {
      setLoading(true);
      // Load orders that are ready to ship (paid, not yet shipped)
      const response = await fetch('/api/orders?status=paid');
      const data = await response.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map(o => o.id)));
    }
  };

  const handleBulkCreateShipments = async () => {
    if (selectedOrders.size === 0) {
      alert('Please select at least one order');
      return;
    }

    if (!confirm(`Create shipments for ${selectedOrders.size} orders?`)) {
      return;
    }

    try {
      setProcessing(true);

      // Create shipments for selected orders
      const requests = Array.from(selectedOrders).map(orderId => ({
        orderId,
        provider: selectedProvider,
        serviceType: 'standard',
      }));

      const response = await fetch('/api/shipping/bulk-create-from-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: requests }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Successfully created ${data.data.created} shipments`);
        setSelectedOrders(new Set());
        loadPendingOrders();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Shipping Management</h2>
            <p className="text-gray-600 mt-1">Create and manage shipments for orders</p>
          </div>
          <Package className="h-8 w-8 text-blue-600" />
        </div>
      </div>

      {/* Bulk Actions */}
      {orders.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Actions</h3>

          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shipping Provider
              </label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.provider_code}>
                    {provider.provider_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end space-x-2">
              <button
                onClick={handleBulkCreateShipments}
                disabled={selectedOrders.size === 0 || processing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                <Truck className="h-4 w-4" />
                <span>
                  {processing ? 'Creating...' : `Create Shipments (${selectedOrders.size})`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orders List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Ready to Ship ({orders.length})
            </h3>
            {orders.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {selectedOrders.size === orders.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No orders ready to ship</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {orders.map((order) => (
              <div
                key={order.id}
                className={`p-6 hover:bg-gray-50 transition-colors ${
                  selectedOrders.has(order.id) ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedOrders.has(order.id)}
                    onChange={() => handleSelectOrder(order.id)}
                    className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {order.order_number}
                        </h4>
                        <p className="text-sm text-gray-600">{order.customer_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ฿{order.total.toLocaleString()}
                        </p>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
