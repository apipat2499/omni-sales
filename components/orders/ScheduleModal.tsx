'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Copy,
  Play,
  Clock,
  Calendar,
  Tag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useOrderScheduling, useScheduleBuilder, useScheduleDetails } from '@/lib/hooks/useOrderScheduling';
import type { OrderSchedule, DayOfWeek, ScheduleFrequency } from '@/lib/utils/order-scheduling';
import type { OrderItem } from '@/types';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScheduleApply?: (schedule: OrderSchedule) => void;
  initialItems?: OrderItem[];
  templateId?: string;
}

export default function ScheduleModal({
  isOpen,
  onClose,
  onScheduleApply,
  initialItems = [],
  templateId,
}: ScheduleModalProps) {
  const { schedules, createNewSchedule, deleteExistingSchedule } = useOrderScheduling();
  const [mode, setMode] = useState<'list' | 'create' | 'view'>('list');
  const [viewScheduleId, setViewScheduleId] = useState<string | null>(null);
  const builder = useScheduleBuilder(templateId);
  const details = useScheduleDetails(viewScheduleId || '');

  useEffect(() => {
    if (initialItems.length > 0) {
      builder.updateField('items', initialItems);
    }
  }, [initialItems]);

  const handleCreateSchedule = () => {
    if (!builder.validateForm()) return;

    const schedule = createNewSchedule(builder.formData);
    if (schedule) {
      builder.reset();
      setMode('list');
    }
  };

  const handleDeleteSchedule = (id: string) => {
    if (confirm('ยืนยันการลบตารางนี้?')) {
      deleteExistingSchedule(id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold dark:text-white">
            {mode === 'list' && 'ตารางอีเวนต์'}
            {mode === 'create' && 'สร้างตารางใหม่'}
            {mode === 'view' && 'รายละเอียดตารางอีเวนต์'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {mode === 'list' && (
            <ScheduleListView
              schedules={schedules}
              onCreateClick={() => {
                builder.reset();
                setMode('create');
              }}
              onViewClick={(id) => {
                setViewScheduleId(id);
                setMode('view');
              }}
              onDeleteClick={handleDeleteSchedule}
            />
          )}

          {mode === 'create' && (
            <ScheduleCreateView
              builder={builder}
              onSave={handleCreateSchedule}
              onBack={() => {
                setMode('list');
                builder.reset();
              }}
            />
          )}

          {mode === 'view' && details.schedule && (
            <ScheduleDetailsView
              schedule={details.schedule}
              executionHistory={details.executionHistory}
              nextExecutions={details.nextExecutions}
              onBack={() => {
                setMode('list');
                setViewScheduleId(null);
              }}
              onApply={() => {
                onScheduleApply?.(details.schedule);
                onClose();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Schedule list view
 */
function ScheduleListView({
  schedules,
  onCreateClick,
  onViewClick,
  onDeleteClick,
}: {
  schedules: OrderSchedule[];
  onCreateClick: () => void;
  onViewClick: (id: string) => void;
  onDeleteClick: (id: string) => void;
}) {
  const active = schedules.filter((s) => s.isActive);
  const inactive = schedules.filter((s) => !s.isActive);

  const getFrequencyLabel = (freq: ScheduleFrequency): string => {
    const labels: Record<ScheduleFrequency, string> = {
      once: 'ครั้งเดียว',
      daily: 'ทุกวัน',
      weekly: 'สัปดาห์ละครั้ง',
      biweekly: 'สองสัปดาห์ละครั้ง',
      monthly: 'เดือนละครั้ง',
      custom: 'กำหนดเอง',
    };
    return labels[freq];
  };

  return (
    <div className="space-y-4">
      {schedules.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 mb-4">ไม่มีตารางอีเวนต์</p>
          <button
            onClick={onCreateClick}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            สร้างตารางใหม่
          </button>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2">
                ทำงาน ({active.length})
              </h3>
              <div className="space-y-2">
                {active.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-between hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onViewClick(schedule.id)}>
                      <h4 className="font-medium dark:text-white truncate">{schedule.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <Clock className="h-3 w-3" />
                        <span>{schedule.time}</span>
                        <span>•</span>
                        <span>{getFrequencyLabel(schedule.frequency)}</span>
                        {schedule.items.length > 0 && (
                          <>
                            <span>•</span>
                            <span>{schedule.items.length} รายการ</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-2">
                      <button
                        onClick={() => onViewClick(schedule.id)}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                        title="ดูรายละเอียด"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDeleteClick(schedule.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="ลบ"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {inactive.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                ปิดใช้งาน ({inactive.length})
              </h3>
              <div className="space-y-2">
                {inactive.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 opacity-75 flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium dark:text-white truncate line-through">{schedule.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <Clock className="h-3 w-3" />
                        <span>{schedule.time}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteClick(schedule.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={onCreateClick}
            className="w-full mt-4 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            สร้างตารางใหม่
          </button>
        </>
      )}
    </div>
  );
}

/**
 * Schedule creation form view
 */
function ScheduleCreateView({
  builder,
  onSave,
  onBack,
}: {
  builder: ReturnType<typeof useScheduleBuilder>;
  onSave: () => void;
  onBack: () => void;
}) {
  const daysOfWeek: { value: DayOfWeek; label: string }[] = [
    { value: 'monday', label: 'จันทร์' },
    { value: 'tuesday', label: 'อังคาร' },
    { value: 'wednesday', label: 'พุธ' },
    { value: 'thursday', label: 'พฤหัสบดี' },
    { value: 'friday', label: 'ศุกร์' },
    { value: 'saturday', label: 'เสาร์' },
    { value: 'sunday', label: 'อาทิตย์' },
  ];

  return (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium dark:text-white mb-1">
          ชื่อตารางอีเวนต์ *
        </label>
        <input
          type="text"
          value={builder.formData.name}
          onChange={(e) => builder.updateField('name', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
            builder.errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="เช่น ออเดอร์วันจันทร์"
        />
        {builder.errors.name && <p className="text-red-500 text-sm mt-1">{builder.errors.name}</p>}
      </div>

      {/* Frequency */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium dark:text-white mb-1">ความถี่ *</label>
          <select
            value={builder.formData.frequency}
            onChange={(e) => builder.updateField('frequency', e.target.value as ScheduleFrequency)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="once">ครั้งเดียว</option>
            <option value="daily">ทุกวัน</option>
            <option value="weekly">สัปดาห์ละครั้ง</option>
            <option value="biweekly">สองสัปดาห์ละครั้ง</option>
            <option value="monthly">เดือนละครั้ง</option>
            <option value="custom">กำหนดเอง</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium dark:text-white mb-1">เวลา *</label>
          <input
            type="time"
            value={builder.formData.time}
            onChange={(e) => builder.updateField('time', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          />
          {builder.errors.time && <p className="text-red-500 text-sm mt-1">{builder.errors.time}</p>}
        </div>
      </div>

      {/* Days of Week for Weekly */}
      {(builder.formData.frequency === 'weekly' || builder.formData.frequency === 'biweekly') && (
        <div>
          <label className="block text-sm font-medium dark:text-white mb-2">วันที่ดำเนิน *</label>
          <div className="grid grid-cols-4 gap-2">
            {daysOfWeek.map((day) => (
              <button
                key={day.value}
                onClick={() => {
                  const current = builder.formData.daysOfWeek || [];
                  const updated = current.includes(day.value)
                    ? current.filter((d) => d !== day.value)
                    : [...current, day.value];
                  builder.updateField('daysOfWeek', updated);
                }}
                className={`py-2 px-2 rounded text-sm font-medium transition-colors ${
                  builder.formData.daysOfWeek?.includes(day.value)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
          {builder.errors.daysOfWeek && (
            <p className="text-red-500 text-sm mt-1">{builder.errors.daysOfWeek}</p>
          )}
        </div>
      )}

      {/* Day of Month for Monthly */}
      {builder.formData.frequency === 'monthly' && (
        <div>
          <label className="block text-sm font-medium dark:text-white mb-1">
            วันที่ของเดือน (1-28) *
          </label>
          <input
            type="number"
            min="1"
            max="28"
            value={builder.formData.dayOfMonth || ''}
            onChange={(e) => builder.updateField('dayOfMonth', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          />
          {builder.errors.dayOfMonth && (
            <p className="text-red-500 text-sm mt-1">{builder.errors.dayOfMonth}</p>
          )}
        </div>
      )}

      {/* Items Summary */}
      <div>
        <label className="block text-sm font-medium dark:text-white mb-2">
          รายการ ({builder.formData.items.length}) *
        </label>
        {builder.formData.items.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">ไม่มีรายการ</p>
        ) : (
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {builder.formData.items.map((item, idx) => (
              <div key={idx} className="text-sm p-2 bg-gray-100 dark:bg-gray-700 rounded">
                <div className="font-medium dark:text-white">{item.productName}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  จำนวน: {item.quantity} × ฿{item.price.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
        {builder.errors.items && <p className="text-red-500 text-sm mt-1">{builder.errors.items}</p>}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <button
          onClick={onBack}
          className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-white"
        >
          ยกเลิก
        </button>
        <button
          onClick={onSave}
          className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          สร้างตารางอีเวนต์
        </button>
      </div>
    </div>
  );
}

/**
 * Schedule details view
 */
function ScheduleDetailsView({
  schedule,
  executionHistory,
  nextExecutions,
  onBack,
  onApply,
}: {
  schedule: OrderSchedule;
  executionHistory: any[];
  nextExecutions: Date[];
  onBack: () => void;
  onApply: () => void;
}) {
  const [showHistory, setShowHistory] = useState(false);
  const [showExecutions, setShowExecutions] = useState(false);

  const getFrequencyLabel = (freq: ScheduleFrequency): string => {
    const labels: Record<ScheduleFrequency, string> = {
      once: 'ครั้งเดียว',
      daily: 'ทุกวัน',
      weekly: 'สัปดาห์ละครั้ง',
      biweekly: 'สองสัปดาห์ละครั้ง',
      monthly: 'เดือนละครั้ง',
      custom: 'กำหนดเอง',
    };
    return labels[freq];
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold dark:text-white mb-2">{schedule.name}</h3>
        <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {schedule.time}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {getFrequencyLabel(schedule.frequency)}
          </span>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              schedule.isActive
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {schedule.isActive ? 'ทำงาน' : 'ปิดใช้งาน'}
          </span>
        </div>
      </div>

      {/* Items */}
      <div>
        <h4 className="font-semibold dark:text-white mb-2">รายการ ({schedule.items.length})</h4>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {schedule.items.map((item, idx) => (
            <div key={idx} className="text-sm p-2 bg-gray-100 dark:bg-gray-700 rounded">
              <div className="font-medium dark:text-white">{item.productName}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                จำนวน: {item.quantity} × ฿{item.price.toFixed(2)} = ฿
                {(item.quantity * item.price - (item.discount || 0)).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Executions */}
      <div>
        <button
          onClick={() => setShowExecutions(!showExecutions)}
          className="w-full flex items-center justify-between py-2 px-3 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <span className="font-medium dark:text-white">ครั้งถัดไป ({nextExecutions.length})</span>
          {showExecutions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showExecutions && (
          <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
            {nextExecutions.map((date, idx) => (
              <div key={idx} className="text-sm p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                {formatDate(date)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Execution History */}
      {executionHistory.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between py-2 px-3 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <span className="font-medium dark:text-white">ประวัติการดำเนิน ({executionHistory.length})</span>
            {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showHistory && (
            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
              {executionHistory.map((exec, idx) => (
                <div
                  key={idx}
                  className={`text-sm p-2 rounded ${
                    exec.status === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : 'bg-red-50 dark:bg-red-900/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{formatDate(exec.executedAt)}</span>
                    <span
                      className={`text-xs font-medium ${
                        exec.status === 'success'
                          ? 'text-green-600 dark:text-green-300'
                          : 'text-red-600 dark:text-red-300'
                      }`}
                    >
                      {exec.status === 'success' ? 'สำเร็จ' : 'ล้มเหลว'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <button
          onClick={onBack}
          className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-white"
        >
          ย้อนกลับ
        </button>
        <button
          onClick={onApply}
          className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Play className="h-4 w-4" />
          ใช้ตารางนี้
        </button>
      </div>
    </div>
  );
}
