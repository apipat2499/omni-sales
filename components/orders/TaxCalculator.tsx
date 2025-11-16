'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit2, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { useTaxCalculation, useTaxConfigBuilder, useOrderTaxSummary } from '@/lib/hooks/useTaxCalculation';
import { useI18n } from '@/lib/hooks/useI18n';
import type { OrderItem } from '@/types';
import type { TaxConfig, TaxType } from '@/lib/utils/tax-calculation';

interface TaxCalculatorProps {
  items: OrderItem[];
  onTaxChange?: (taxAmount: number, total: number) => void;
  showSettings?: boolean;
  compact?: boolean;
}

export default function TaxCalculator({
  items,
  onTaxChange,
  showSettings = true,
  compact = false,
}: TaxCalculatorProps) {
  const i18n = useI18n();
  const { taxConfigs, createNewTaxConfig, deleteExistingTaxConfig, updateExistingTaxConfig } =
    useTaxCalculation({
      onTaxChange: (calc) => {
        onTaxChange?.(calc.taxAmount, calc.total);
      },
    });

  const summary = useOrderTaxSummary(items, taxConfigs);
  const [showDetails, setShowDetails] = useState(!compact);
  const [showConfig, setShowConfig] = useState(false);

  return (
    <div className="space-y-3">
      {/* Tax Summary */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between hover:opacity-75 transition-opacity"
        >
          <div className="text-left">
            <div className="text-xs font-medium text-blue-600 dark:text-blue-300">
              {i18n.t('tax.total')}
            </div>
            <div className="text-lg font-bold dark:text-white">
              {i18n.currency(summary.total)}
            </div>
          </div>
          {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showDetails && (
          <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800 space-y-1 text-sm">
            <div className="flex justify-between text-gray-700 dark:text-gray-300">
              <span>{i18n.t('common.subtotal')}</span>
              <span>{i18n.currency(summary.subtotal)}</span>
            </div>

            {summary.taxBreakdown.map((tax) => (
              <div key={tax.taxId} className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>
                  {tax.taxName} ({tax.rate}%)
                </span>
                <span>{i18n.currency(tax.amount)}</span>
              </div>
            ))}

            <div className="flex justify-between font-bold text-blue-700 dark:text-blue-300 pt-1 border-t border-blue-200 dark:border-blue-800">
              <span>{i18n.t('tax.amount')}</span>
              <span>{i18n.currency(summary.taxAmount)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Tax Configuration */}
      {showSettings && (
        <div className="space-y-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="w-full text-left text-sm font-medium px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between dark:text-white"
          >
            {i18n.t('tax.settings')}
            {showConfig ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showConfig && (
            <div className="space-y-2 pl-3 border-l-2 border-blue-300 dark:border-blue-700">
              {taxConfigs.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400 italic py-2">
                  {i18n.t('common.empty')}
                </div>
              ) : (
                taxConfigs.map((config) => (
                  <TaxConfigItem
                    key={config.id}
                    config={config}
                    onUpdate={updateExistingTaxConfig}
                    onDelete={deleteExistingTaxConfig}
                  />
                ))
              )}

              <button
                onClick={() => setShowConfig(false)}
                className="mt-2 text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                {i18n.t('common.close')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Tax config item component
 */
function TaxConfigItem({
  config,
  onUpdate,
  onDelete,
}: {
  config: TaxConfig;
  onUpdate: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const builder = useTaxConfigBuilder(config);
  const i18n = useI18n();

  const handleSave = () => {
    if (builder.validateForm()) {
      onUpdate(config.id, builder.formData);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 space-y-2">
        <div>
          <label className="text-xs font-medium dark:text-white block mb-1">{i18n.t('common.name')}</label>
          <input
            type="text"
            value={builder.formData.name}
            onChange={(e) => builder.updateField('name', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
          />
          {builder.errors.name && <p className="text-red-500 text-xs mt-1">{builder.errors.name}</p>}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium dark:text-white block mb-1">{i18n.t('tax.rate')}</label>
            <input
              type="number"
              value={builder.formData.rate}
              onChange={(e) => builder.updateField('rate', parseFloat(e.target.value))}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-medium dark:text-white block mb-1">{i18n.t('tax.type')}</label>
            <select
              value={builder.formData.type}
              onChange={(e) => builder.updateField('type', e.target.value as TaxType)}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
            >
              <option value="vat">VAT</option>
              <option value="gst">GST</option>
              <option value="sales-tax">Sales Tax</option>
              <option value="percentage">Percentage</option>
              <option value="flat-fee">Flat Fee</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={builder.formData.isInclusive}
            onChange={(e) => builder.updateField('isInclusive', e.target.checked)}
            className="h-4 w-4"
          />
          <label className="text-xs dark:text-white">{i18n.t('tax.included')}</label>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSave}
            className="flex-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            {i18n.t('common.save')}
          </button>
          <button
            onClick={() => {
              builder.reset();
              setIsEditing(false);
            }}
            className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {i18n.t('common.cancel')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 flex items-start justify-between group hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium dark:text-white truncate">
          {config.name}
          {!config.isActive && <span className="text-xs text-gray-500 dark:text-gray-400"> (disabled)</span>}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {config.rate}% ({config.type})
        </div>
      </div>

      <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setIsEditing(true)}
          className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
          title="Edit"
        >
          <Edit2 className="h-3 w-3" />
        </button>
        <button
          onClick={() => onDelete(config.id)}
          className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
          title="Delete"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
