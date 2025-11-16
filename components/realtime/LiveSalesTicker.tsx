'use client';

import { useEffect, useState } from 'react';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { TrendingUp, DollarSign, ShoppingCart } from 'lucide-react';
import { OrderCreatedPayload, PaymentReceivedPayload } from '@/lib/websocket/types';

interface Sale {
  id: string;
  customerName: string;
  amount: number;
  timestamp: number;
  type: 'order' | 'payment';
}

interface LiveSalesTickerProps {
  className?: string;
  maxItems?: number;
}

export default function LiveSalesTicker({
  className = '',
  maxItems = 5,
}: LiveSalesTickerProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [todayCount, setTodayCount] = useState(0);

  const ws = useWebSocket({
    autoConnect: true,
    namespaces: ['orders', 'payments'],
  });

  useEffect(() => {
    if (!ws.isConnected) return;

    // Listen for new orders
    const cleanupOrders = ws.on<OrderCreatedPayload>('order:created', (data) => {
      const newSale: Sale = {
        id: data.orderId,
        customerName: data.customerName,
        amount: data.total,
        timestamp: Date.now(),
        type: 'order',
      };

      setSales((prev) => [newSale, ...prev.slice(0, maxItems - 1)]);
      setTodayTotal((prev) => prev + data.total);
      setTodayCount((prev) => prev + 1);
    });

    // Listen for payments
    const cleanupPayments = ws.on<PaymentReceivedPayload>('payment:received', (data) => {
      if (data.status === 'success') {
        const newSale: Sale = {
          id: data.paymentId,
          customerName: `Payment #${data.paymentId.slice(0, 8)}`,
          amount: data.amount,
          timestamp: Date.now(),
          type: 'payment',
        };

        setSales((prev) => [newSale, ...prev.slice(0, maxItems - 1)]);
      }
    });

    return () => {
      cleanupOrders();
      cleanupPayments();
    };
  }, [ws, maxItems]);

  // Mock initial data
  useEffect(() => {
    setTodayTotal(45230);
    setTodayCount(23);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(amount);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header with stats */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">Live Sales</h3>
          </div>
          {ws.isConnected && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-green-600">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              LIVE
            </span>
          )}
        </div>

        {/* Today's stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 rounded">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Today's Sales</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(todayTotal)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded">
              <ShoppingCart className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Orders</p>
              <p className="text-lg font-bold text-gray-900">{todayCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Live sales feed */}
      <div className="divide-y divide-gray-100">
        {sales.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            Waiting for new sales...
          </div>
        ) : (
          sales.map((sale, index) => (
            <div
              key={sale.id}
              className="p-3 hover:bg-gray-50 transition-colors animate-slide-down"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`
                      p-2 rounded-full
                      ${sale.type === 'order' ? 'bg-blue-100' : 'bg-green-100'}
                    `}
                  >
                    {sale.type === 'order' ? (
                      <ShoppingCart className="w-4 h-4 text-blue-600" />
                    ) : (
                      <DollarSign className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">
                      {sale.customerName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatTime(sale.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    {formatCurrency(sale.amount)}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{sale.type}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Connection status */}
      {!ws.isConnected && (
        <div className="p-3 bg-amber-50 border-t border-amber-200">
          <p className="text-xs text-amber-800 text-center">
            Reconnecting to live feed...
          </p>
        </div>
      )}
    </div>
  );
}
