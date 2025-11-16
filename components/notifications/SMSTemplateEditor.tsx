/**
 * SMS Template Editor Component
 *
 * SMS template editor with character counter, preview, variable insertion, and test send.
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Save, Eye, Send, X, Plus, MessageSquare, AlertCircle } from 'lucide-react';
import { useEmailTemplates } from '@/lib/hooks/useEmailTemplates';
import { useNotificationService } from '@/lib/hooks/useNotificationService';
import { useI18n } from '@/lib/hooks/useI18n';
import { getSMSCharacterInfo } from '@/lib/utils/sms-service';
import type { NotificationTemplate, TemplateCategory } from '@/lib/utils/notification-templates';

// ============================================================================
// Type Definitions
// ============================================================================

interface SMSTemplateEditorProps {
  templateId?: string;
  onSave?: (template: NotificationTemplate) => void;
  onCancel?: () => void;
}

// ============================================================================
// Main Component
// ============================================================================

export default function SMSTemplateEditor({
  templateId,
  onSave,
  onCancel,
}: SMSTemplateEditorProps) {
  const i18n = useI18n();
  const { createTemplate, updateTemplate, getCommonVariables } = useEmailTemplates();
  const { sendSMS } = useNotificationService();

  const [showPreview, setShowPreview] = useState(false);
  const [showTestSend, setShowTestSend] = useState(false);
  const [showVariableMenu, setShowVariableMenu] = useState(false);

  // Template fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<TemplateCategory>('order');
  const [smsBody, setSmsBody] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const commonVariables = getCommonVariables();

  // Calculate SMS character info
  const charInfo = useMemo(() => getSMSCharacterInfo(smsBody), [smsBody]);

  // Load template if editing
  useEffect(() => {
    if (templateId) {
      // Load template data
      // This would come from the useEmailTemplates hook
    }
  }, [templateId]);

  // Handle save
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      if (!name.trim()) {
        throw new Error('Template name is required');
      }

      if (!smsBody.trim()) {
        throw new Error('SMS message is required');
      }

      let template: NotificationTemplate | null;

      if (templateId) {
        template = updateTemplate(templateId, {
          name,
          category,
          smsBody,
          description,
          isActive,
        });
      } else {
        template = createTemplate({
          name,
          type: 'sms',
          category,
          smsBody,
          description,
          isActive,
        });
      }

      if (template && onSave) {
        onSave(template);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  // Insert variable
  const insertVariable = (varName: string) => {
    const variable = `{{${varName}}}`;
    setSmsBody(prev => prev + variable);
    setShowVariableMenu(false);
  };

  // Get character counter color
  const getCharCounterColor = () => {
    if (charInfo.remaining < 0) return 'text-red-600 dark:text-red-400';
    if (charInfo.remaining < 20) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-2xl font-bold dark:text-white">
              {templateId
                ? i18n.t('notifications.editSMSTemplate')
                : i18n.t('notifications.createSMSTemplate')}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Form */}
      <div className="p-6 space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {i18n.t('notifications.templateName')} *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              placeholder="e.g., Order Confirmation SMS"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {i18n.t('notifications.category')} *
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as TemplateCategory)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="order">{i18n.t('notifications.categories.order')}</option>
              <option value="customer">{i18n.t('notifications.categories.customer')}</option>
              <option value="payment">{i18n.t('notifications.categories.payment')}</option>
              <option value="inventory">{i18n.t('notifications.categories.inventory')}</option>
              <option value="marketing">{i18n.t('notifications.categories.marketing')}</option>
              <option value="system">{i18n.t('notifications.categories.system')}</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {i18n.t('notifications.description')}
          </label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            placeholder="Brief description of this template"
          />
        </div>

        {/* SMS Message */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {i18n.t('notifications.smsMessage')} *
            </label>
            <button
              onClick={() => setShowVariableMenu(!showVariableMenu)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              {i18n.t('notifications.insertVariable')}
            </button>
          </div>

          <textarea
            value={smsBody}
            onChange={e => setSmsBody(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            rows={6}
            placeholder="e.g., Hi {{customerName}}! Your order {{orderNumber}} has been confirmed. Total: {{orderTotal}}. Thanks!"
          />

          {/* Character Counter */}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <span className={getCharCounterColor()}>
                {charInfo.length} / {charInfo.segments === 1 ? 160 : charInfo.segments * 153}{' '}
                characters
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {charInfo.segments} {charInfo.segments === 1 ? 'message' : 'messages'}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                Encoding: {charInfo.encoding}
              </span>
            </div>

            {charInfo.remaining < 0 && (
              <span className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {Math.abs(charInfo.remaining)} characters over limit
              </span>
            )}
          </div>

          {/* SMS Limits Info */}
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
              {i18n.t('notifications.smsLimits')}
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
              <li>• Standard SMS: 160 characters per message</li>
              <li>• Multi-part SMS: 153 characters per message</li>
              <li>• Unicode messages (emoji, etc.): 70 characters per message</li>
              <li>• Variables will be replaced with actual values when sending</li>
            </ul>
          </div>
        </div>

        {/* Active Status */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            checked={isActive}
            onChange={e => setIsActive(e.target.checked)}
            className="h-4 w-4 text-blue-600 rounded"
          />
          <label htmlFor="isActive" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            {i18n.t('notifications.activeTemplate')}
          </label>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(true)}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            {i18n.t('notifications.preview')}
          </button>
          <button
            onClick={() => setShowTestSend(true)}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            {i18n.t('notifications.testSend')}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              {i18n.t('common.cancel')}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? i18n.t('common.saving') : i18n.t('common.save')}
          </button>
        </div>
      </div>

      {/* Variable Menu */}
      {showVariableMenu && (
        <VariableMenu
          variables={Object.values(commonVariables)}
          onSelect={insertVariable}
          onClose={() => setShowVariableMenu(false)}
        />
      )}

      {/* Preview Modal */}
      {showPreview && (
        <PreviewModal message={smsBody} onClose={() => setShowPreview(false)} />
      )}

      {/* Test Send Modal */}
      {showTestSend && (
        <TestSendModal
          message={smsBody}
          onClose={() => setShowTestSend(false)}
          onSend={sendSMS}
        />
      )}
    </div>
  );
}

// ============================================================================
// Variable Menu Component
// ============================================================================

function VariableMenu({
  variables,
  onSelect,
  onClose,
}: {
  variables: Array<{ name: string; description: string; example: string }>;
  onSelect: (varName: string) => void;
  onClose: () => void;
}) {
  const i18n = useI18n();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-bold dark:text-white">
            {i18n.t('notifications.availableVariables')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid gap-2">
            {variables.map(variable => (
              <button
                key={variable.name}
                onClick={() => onSelect(variable.name)}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
              >
                <div className="font-mono text-sm text-blue-600 dark:text-blue-400 mb-1">
                  {`{{${variable.name}}}`}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {variable.description}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  {i18n.t('notifications.example')}: {variable.example}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Preview Modal Component
// ============================================================================

function PreviewModal({ message, onClose }: { message: string; onClose: () => void }) {
  const i18n = useI18n();
  const charInfo = getSMSCharacterInfo(message);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-bold dark:text-white">
            {i18n.t('notifications.smsPreview')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Phone Mockup */}
          <div className="mx-auto max-w-xs">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-3xl p-4 shadow-lg">
              {/* Phone Header */}
              <div className="text-center mb-4">
                <div className="h-1 w-16 bg-gray-400 dark:bg-gray-600 rounded-full mx-auto mb-4" />
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {/* Message Bubble */}
              <div className="bg-blue-500 text-white rounded-2xl rounded-tl-sm p-4 mb-4">
                <p className="text-sm whitespace-pre-wrap">{message || '(Empty message)'}</p>
              </div>

              {/* Character Info */}
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>{i18n.t('notifications.characters')}:</span>
                  <span>{charInfo.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>{i18n.t('notifications.messages')}:</span>
                  <span>{charInfo.segments}</span>
                </div>
                <div className="flex justify-between">
                  <span>{i18n.t('notifications.encoding')}:</span>
                  <span>{charInfo.encoding}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Info Note */}
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
            {i18n.t('notifications.previewNote')}
          </p>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            {i18n.t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Test Send Modal Component
// ============================================================================

function TestSendModal({
  message,
  onClose,
  onSend,
}: {
  message: string;
  onClose: () => void;
  onSend: any;
}) {
  const i18n = useI18n();
  const [phone, setPhone] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!phone) return;

    try {
      setIsSending(true);
      await onSend({
        to: phone,
        body: message,
      });
      setSent(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Test send failed:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-bold dark:text-white">
            {i18n.t('notifications.testSendSMS')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {sent ? (
            <div className="text-center py-8">
              <div className="text-green-600 dark:text-green-400 mb-2">
                <MessageSquare className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-lg font-semibold dark:text-white">
                {i18n.t('notifications.testSMSSentSuccess')}
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {i18n.t('notifications.testSMSDescription')}
              </p>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1234567890"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {i18n.t('notifications.phoneFormat')}
              </p>
            </>
          )}
        </div>

        {!sent && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              {i18n.t('common.cancel')}
            </button>
            <button
              onClick={handleSend}
              disabled={!phone || isSending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {isSending ? i18n.t('common.sending') : i18n.t('common.send')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
