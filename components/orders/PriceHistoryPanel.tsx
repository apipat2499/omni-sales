'use client';

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Calendar, DollarSign } from 'lucide-react';
import { usePriceHistory, usePriceTrends } from '@/lib/hooks/usePriceHistory';
import { formatPrice } from '@/lib/utils/price-history';

interface PriceHistoryPanelProps {
  itemId: string;
  itemName: string;
  showFullHistory?: boolean;
  maxRecords?: number;
}

export default function PriceHistoryPanel({
  itemId,
  itemName,
  showFullHistory = false,
  maxRecords = 5,
}: PriceHistoryPanelProps) {
  const { history, summary, stats, volatility } = usePriceHistory({
    itemId,
    persistent: true,
  });

  const trendData = usePriceTrends(itemId, 30);

  const displayHistory = useMemo(() => {
    return showFullHistory ? history : history.slice(-maxRecords).reverse();
  }, [history, showFullHistory, maxRecords]);

  const getTrendIcon = () => {
    switch (summary.trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    switch (summary.trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (history.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          ไม่มีประวัติราคา
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
            ราคาปัจจุบัน
          </p>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {formatPrice(stats.currentPrice)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
            ราคาเฉลี่ย
          </p>
          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
            {formatPrice(stats.averagePrice)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
            ช่วงราคา
          </p>
          <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
            {formatPrice(stats.maxPrice - stats.minPrice)}
          </p>
        </div>

        <div className={`bg-gradient-to-br rounded-lg p-3 border ${
          summary.trend === 'up'
            ? 'from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-800'
            : summary.trend === 'down'
            ? 'from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-red-200 dark:border-red-800'
            : 'from-gray-50 to-gray-100 dark:from-gray-900/30 dark:to-gray-800/30 border-gray-200 dark:border-gray-800'
        }`}>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
            การเปลี่ยนแปลง
          </p>
          <div className="flex items-center gap-1">
            {getTrendIcon()}
            <p className={`text-lg font-bold ${getTrendColor()}`}>
              {summary.changePercent >= 0 ? '+' : ''}
              {summary.changePercent.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Summary Info */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            ราคาต่ำสุด
          </span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {formatPrice(stats.minPrice)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            ราคาสูงสุด
          </span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {formatPrice(stats.maxPrice)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            ความผันผวน (σ)
          </span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {volatility.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            รวมจำนวน
          </span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {stats.totalQuantity} หน่วย
          </span>
        </div>
      </div>

      {/* Price History Timeline */}
      {displayHistory.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            ประวัติราคา {showFullHistory ? '' : `(ล่าสุด ${displayHistory.length})`}
          </h4>

          <div className="space-y-2">
            {displayHistory.map((record, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                {/* Timeline Dot */}
                <div className="flex-shrink-0 mt-1">
                  <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatPrice(record.price)}
                    </p>
                    {record.action && (
                      <span className="text-xs font-medium px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                        {record.action === 'created'
                          ? 'สร้าง'
                          : record.action === 'updated'
                          ? 'อัปเดต'
                          : 'ลด'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {record.timestamp.toLocaleDateString('th-TH')}
                    </span>
                    <span>
                      {record.timestamp.toLocaleTimeString('th-TH', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {record.quantity} หน่วย
                    </span>
                  </div>

                  {record.notes && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                      หมายเหตุ: {record.notes}
                    </p>
                  )}

                  {record.discountPercent && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      ส่วนลด: {record.discountPercent}%
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!showFullHistory && history.length > maxRecords && (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
              {history.length - maxRecords} รายการเพิ่มเติม
            </p>
          )}
        </div>
      )}

      {/* Trend Chart Info */}
      {trendData.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            แนวโน้มราคา (30 วัน)
          </h4>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              ข้อมูล: {trendData.length} วัน
            </p>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {trendData.slice(-5)
                .reverse()
                .map((data, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-gray-600 dark:text-gray-400">
                      {data.date}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ฿{data.avgPrice.toFixed(2)}
                    </span>
                    <span className="text-gray-500 dark:text-gray-500">
                      ({data.recordCount} บันทึก)
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
