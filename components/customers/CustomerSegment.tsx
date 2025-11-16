'use client';

/**
 * CustomerSegment Component
 *
 * Segment management UI
 * Create/edit segments, segment rules builder, preview matching customers
 */

import React, { useState, useEffect } from 'react';
import { Plus, X, Save, Eye, Trash2, Users } from 'lucide-react';
import { useCustomerSegments } from '@/lib/hooks/useCustomerSegments';
import { SegmentRule } from '@/lib/utils/customer-management';
import { useI18n } from '@/lib/hooks/useI18n';

export default function CustomerSegment() {
  const { t } = useI18n();
  const {
    segments,
    createSegment,
    updateSegment,
    deleteSegment,
    getMatchingCustomers,
    previewMatches,
    getSegmentStats,
    ruleFields,
    operatorsByType,
  } = useCustomerSegments();

  const [isCreating, setIsCreating] = useState(false);
  const [editingSegment, setEditingSegment] = useState<string | null>(null);
  const [previewSegmentId, setPreviewSegmentId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rules: [] as SegmentRule[],
  });

  const handleStartCreate = () => {
    setFormData({
      name: '',
      description: '',
      rules: [],
    });
    setIsCreating(true);
    setEditingSegment(null);
  };

  const handleStartEdit = (segmentId: string) => {
    const segment = segments.find((s) => s.id === segmentId);
    if (segment) {
      setFormData({
        name: segment.name,
        description: segment.description || '',
        rules: segment.rules,
      });
      setEditingSegment(segmentId);
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingSegment(null);
    setFormData({ name: '', description: '', rules: [] });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert(t('customer.segment.nameRequired'));
      return;
    }

    try {
      if (editingSegment) {
        await updateSegment(editingSegment, formData);
      } else {
        await createSegment(formData);
      }
      handleCancel();
    } catch (error) {
      console.error('Failed to save segment:', error);
      alert(t('customer.segment.saveError'));
    }
  };

  const handleDelete = async (segmentId: string) => {
    if (confirm(t('customer.segment.deleteConfirm'))) {
      try {
        await deleteSegment(segmentId);
      } catch (error) {
        console.error('Failed to delete segment:', error);
        alert(t('customer.segment.deleteError'));
      }
    }
  };

  const handleAddRule = () => {
    const newRule: SegmentRule = {
      field: 'lifetime_value',
      operator: 'gte',
      value: 0,
    };
    setFormData((prev) => ({
      ...prev,
      rules: [...prev.rules, newRule],
    }));
  };

  const handleRemoveRule = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateRule = (index: number, field: keyof SegmentRule, value: any) => {
    setFormData((prev) => ({
      ...prev,
      rules: prev.rules.map((rule, i) => {
        if (i !== index) return rule;

        // If changing field, reset operator and value
        if (field === 'field') {
          const fieldDef = ruleFields.find((f) => f.value === value);
          const defaultOperator = operatorsByType[fieldDef?.type || 'number'][0].value;
          return { field: value, operator: defaultOperator as any, value: '' };
        }

        return { ...rule, [field]: value };
      }),
    }));
  };

  const getOperatorsForField = (fieldName: string) => {
    const field = ruleFields.find((f) => f.value === fieldName);
    return operatorsByType[field?.type || 'number'];
  };

  const renderRuleBuilder = () => {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            {t('customer.segment.rules')}
          </h4>
          <button
            onClick={handleAddRule}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            <Plus className="h-4 w-4" />
            {t('customer.segment.addRule')}
          </button>
        </div>

        <div className="space-y-3">
          {formData.rules.map((rule, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <select
                value={rule.field}
                onChange={(e) => handleUpdateRule(index, 'field', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white text-sm"
              >
                {ruleFields.map((field) => (
                  <option key={field.value} value={field.value}>
                    {field.label}
                  </option>
                ))}
              </select>

              <select
                value={rule.operator}
                onChange={(e) => handleUpdateRule(index, 'operator', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white text-sm"
              >
                {getOperatorsForField(rule.field).map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={rule.value}
                onChange={(e) => handleUpdateRule(index, 'value', e.target.value)}
                placeholder={t('customer.segment.value')}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white text-sm"
              />

              <button
                onClick={() => handleRemoveRule(index)}
                className="p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {formData.rules.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              {t('customer.segment.noRules')}
            </p>
          )}
        </div>

        {formData.rules.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              {t('customer.segment.previewCount')}: {previewMatches(formData.rules).length} customers
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderForm = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {editingSegment ? t('customer.segment.edit') : t('customer.segment.create')}
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('customer.segment.name')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder={t('customer.segment.namePlaceholder')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('customer.segment.description')}
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder={t('customer.segment.descriptionPlaceholder')}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {renderRuleBuilder()}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            <Save className="h-4 w-4" />
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );

  const renderSegmentList = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('customer.segment.segments')}
          </h3>
          <button
            onClick={handleStartCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            <Plus className="h-4 w-4" />
            {t('customer.segment.create')}
          </button>
        </div>
      </div>

      <div className="p-6">
        {segments.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">{t('customer.segment.noSegments')}</p>
            <button
              onClick={handleStartCreate}
              className="mt-4 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600"
            >
              {t('customer.segment.createFirst')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {segments.map((segment) => {
              const stats = getSegmentStats(segment.id);

              return (
                <div
                  key={segment.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {segment.name}
                      </h4>
                      {segment.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {segment.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewSegmentId(segment.id === previewSegmentId ? null : segment.id)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        title={t('customer.segment.preview')}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleStartEdit(segment.id)}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        title={t('common.edit')}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(segment.id)}
                        className="p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        title={t('common.delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mt-4">
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                      <p className="text-xs text-gray-600 dark:text-gray-400">{t('customer.segment.members')}</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.memberCount}</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                      <p className="text-xs text-gray-600 dark:text-gray-400">{t('customer.segment.avgLtv')}</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        ${stats.averageLifetimeValue.toFixed(0)}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                      <p className="text-xs text-gray-600 dark:text-gray-400">{t('customer.segment.avgOrders')}</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {stats.averageOrders.toFixed(1)}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                      <p className="text-xs text-gray-600 dark:text-gray-400">{t('customer.segment.totalRevenue')}</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        ${stats.totalRevenue.toFixed(0)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {t('customer.segment.rules')} ({segment.rules.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {segment.rules.map((rule, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-xs rounded"
                        >
                          {ruleFields.find((f) => f.value === rule.field)?.label} {rule.operator} {rule.value}
                        </span>
                      ))}
                    </div>
                  </div>

                  {previewSegmentId === segment.id && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                        {t('customer.segment.matchingCustomers')}:
                      </p>
                      <div className="space-y-1">
                        {getMatchingCustomers(segment.id).slice(0, 5).map((customer) => (
                          <p key={customer.id} className="text-sm text-blue-800 dark:text-blue-200">
                            • {customer.name} ({customer.email})
                          </p>
                        ))}
                        {getMatchingCustomers(segment.id).length > 5 && (
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            + {getMatchingCustomers(segment.id).length - 5} more...
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('customer.segment.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t('customer.segment.description')}
        </p>
      </div>

      {(isCreating || editingSegment) && renderForm()}
      {renderSegmentList()}
    </div>
  );
}
