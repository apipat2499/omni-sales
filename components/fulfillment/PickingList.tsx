/**
 * Picking List Component
 * Displays picking lists with barcode scanning support
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  FulfillmentOrder,
  generatePickingList,
} from '@/lib/utils/fulfillment-management';
import { useI18n } from '@/lib/hooks/useI18n';

interface PickingListProps {
  orders: FulfillmentOrder[];
  onItemPicked?: (orderId: string, itemId: string, quantity: number) => void;
  onCompletePicking?: (orderId: string, notes?: string) => void;
  enableBarcodeScanner?: boolean;
  printMode?: boolean;
}

export function PickingList({
  orders,
  onItemPicked,
  onCompletePicking,
  enableBarcodeScanner = false,
  printMode = false,
}: PickingListProps) {
  const { t } = useI18n();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [notes, setNotes] = useState('');
  const [pickingProgress, setPickingProgress] = useState<Record<string, Record<string, number>>>({});
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Generate picking list
  const pickingList = generatePickingList(orders);

  // Initialize picking progress
  useEffect(() => {
    const progress: Record<string, Record<string, number>> = {};
    orders.forEach((order) => {
      progress[order.id] = {};
      order.items.forEach((item) => {
        progress[order.id][item.orderItemId] = item.picked;
      });
    });
    setPickingProgress(progress);
  }, [orders]);

  // Handle barcode scan
  const handleBarcodeScan = (barcode: string) => {
    if (!selectedOrder) return;

    const order = orders.find((o) => o.id === selectedOrder);
    if (!order) return;

    // Find item by barcode
    const item = order.items.find((i) => i.barcode === barcode);
    if (item) {
      handlePickItem(order.id, item.orderItemId, 1);
      setScannedBarcode('');
    } else {
      alert(t('fulfillment.picking.barcodeNotFound'));
    }
  };

  // Handle pick item
  const handlePickItem = (orderId: string, itemId: string, quantity: number) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const item = order.items.find((i) => i.orderItemId === itemId);
    if (!item) return;

    const currentPicked = pickingProgress[orderId]?.[itemId] || 0;
    const newPicked = Math.min(currentPicked + quantity, item.quantity);

    setPickingProgress((prev) => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [itemId]: newPicked,
      },
    }));

    onItemPicked?.(orderId, itemId, quantity);
  };

  // Handle complete picking
  const handleCompletePicking = (orderId: string) => {
    onCompletePicking?.(orderId, notes);
    setSelectedOrder(null);
    setNotes('');
  };

  // Check if all items are picked
  const isOrderComplete = (orderId: string): boolean => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return false;

    return order.items.every((item) => {
      const picked = pickingProgress[orderId]?.[item.orderItemId] || 0;
      return picked >= item.quantity;
    });
  };

  // Print view
  if (printMode) {
    return (
      <div className="print:p-8 print:bg-white">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">{t('fulfillment.pickingList')}</h1>
          <p className="text-gray-600">{new Date().toLocaleDateString()}</p>
        </div>

        {pickingList.items.map((location) => (
          <div key={location.location} className="mb-8 page-break-inside-avoid">
            <h2 className="text-xl font-semibold mb-4 border-b-2 border-gray-300 pb-2">
              {t('fulfillment.location')}: {location.location}
            </h2>
            <table className="w-full mb-6">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-2">□</th>
                  <th className="text-left py-2">{t('fulfillment.product')}</th>
                  <th className="text-center py-2">{t('common.quantity')}</th>
                  <th className="text-left py-2">{t('fulfillment.orders')}</th>
                </tr>
              </thead>
              <tbody>
                {location.items.map((item) => (
                  <tr key={item.productId} className="border-b border-gray-200">
                    <td className="py-3">
                      <div className="w-5 h-5 border-2 border-gray-400"></div>
                    </td>
                    <td className="py-3">{item.productName}</td>
                    <td className="py-3 text-center font-semibold">{item.quantity}</td>
                    <td className="py-3 text-sm text-gray-600">
                      {item.orders.join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        <div className="mt-8 border-t-2 border-gray-300 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold">{t('fulfillment.totalOrders')}:</p>
              <p className="text-2xl">{pickingList.orders.length}</p>
            </div>
            <div>
              <p className="font-semibold">{t('fulfillment.totalItems')}:</p>
              <p className="text-2xl">{pickingList.totalItems}</p>
            </div>
          </div>
          <div className="mt-6 border-t border-gray-200 pt-4">
            <p className="font-semibold mb-2">{t('fulfillment.pickedBy')}:</p>
            <div className="border-b-2 border-gray-300 w-64"></div>
          </div>
          <div className="mt-4">
            <p className="font-semibold mb-2">{t('common.notes')}:</p>
            <div className="border border-gray-300 h-24"></div>
          </div>
        </div>
      </div>
    );
  }

  // Interactive view
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('fulfillment.pickingList')}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {pickingList.orders.length} {t('fulfillment.orders')}, {pickingList.totalItems}{' '}
            {t('fulfillment.items')}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          {t('common.print')}
        </button>
      </div>

      {/* Barcode Scanner */}
      {enableBarcodeScanner && selectedOrder && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-blue-900">
              {t('fulfillment.barcodeScanner')}
            </h3>
            <button
              onClick={() => setScannerActive(!scannerActive)}
              className={`px-3 py-1 rounded ${
                scannerActive
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-300 text-gray-700'
              }`}
            >
              {scannerActive ? t('common.active') : t('common.inactive')}
            </button>
          </div>
          {scannerActive && (
            <div className="flex space-x-2">
              <input
                ref={barcodeInputRef}
                type="text"
                value={scannedBarcode}
                onChange={(e) => setScannedBarcode(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleBarcodeScan(scannedBarcode);
                  }
                }}
                placeholder={t('fulfillment.scanBarcode')}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                onClick={() => handleBarcodeScan(scannedBarcode)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {t('common.scan')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Location-based Picking List */}
      <div className="space-y-6">
        {pickingList.items.map((location) => (
          <div key={location.location} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                📍 {t('fulfillment.location')}: {location.location}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('fulfillment.product')}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      {t('common.quantity')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {t('fulfillment.orders')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      {t('common.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {location.items.map((item) => {
                    const relatedOrders = orders.filter((order) =>
                      item.orders.includes(order.orderId)
                    );
                    return (
                      <tr key={item.productId}>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {item.productName}
                          </div>
                          <div className="text-sm text-gray-500">{item.productId}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-lg font-semibold text-gray-900">
                            {item.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {item.orders.map((orderId) => (
                              <span
                                key={orderId}
                                className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                              >
                                {orderId}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {relatedOrders.map((order) => {
                            const orderItem = order.items.find(
                              (i) => i.productId === item.productId
                            );
                            if (!orderItem) return null;

                            const picked =
                              pickingProgress[order.id]?.[orderItem.orderItemId] || 0;
                            const isPicked = picked >= orderItem.quantity;

                            return (
                              <div key={order.id} className="flex items-center justify-end space-x-2 mb-1">
                                <span className="text-xs text-gray-500">
                                  {picked}/{orderItem.quantity}
                                </span>
                                {!isPicked && (
                                  <button
                                    onClick={() =>
                                      handlePickItem(order.id, orderItem.orderItemId, 1)
                                    }
                                    className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                  >
                                    {t('fulfillment.pick')}
                                  </button>
                                )}
                                {isPicked && (
                                  <span className="text-green-600 text-sm">✓</span>
                                )}
                              </div>
                            );
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Orders Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t('fulfillment.ordersSummary')}
        </h2>
        <div className="space-y-3">
          {pickingList.orders.map((order) => {
            const isComplete = isOrderComplete(order.id);
            const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
            const pickedItems = order.items.reduce((sum, item) => {
              const picked = pickingProgress[order.id]?.[item.orderItemId] || 0;
              return sum + picked;
            }, 0);
            const progress = (pickedItems / totalItems) * 100;

            return (
              <div
                key={order.id}
                className={`border rounded-lg p-4 ${
                  selectedOrder === order.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{order.orderId}</h3>
                    <p className="text-sm text-gray-500">
                      {order.items.length} {t('fulfillment.items')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isComplete ? (
                      <>
                        <span className="text-green-600 font-semibold">
                          {t('common.complete')}
                        </span>
                        <button
                          onClick={() => handleCompletePicking(order.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          {t('fulfillment.completePicking')}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setSelectedOrder(order.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        {selectedOrder === order.id
                          ? t('common.selected')
                          : t('common.select')}
                      </button>
                    )}
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>
                      {pickedItems} / {totalItems} {t('fulfillment.picked')}
                    </span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        isComplete ? 'bg-green-600' : 'bg-blue-600'
                      }`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      {selectedOrder && (
        <div className="bg-white rounded-lg shadow p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('fulfillment.pickingNotes')}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder={t('fulfillment.addNotes')}
          />
        </div>
      )}
    </div>
  );
}
