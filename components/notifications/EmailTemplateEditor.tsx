/**
 * Email Template Editor Component
 *
 * WYSIWYG email editor with variable insertion, preview, and test send functionality.
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Save,
  Eye,
  Send,
  X,
  Plus,
  Code,
  Type,
  Image,
  Link,
  List,
  AlignLeft,
  Bold,
  Italic,
  Underline,
} from 'lucide-react';
import { useEmailTemplates } from '@/lib/hooks/useEmailTemplates';
import { useNotificationService } from '@/lib/hooks/useNotificationService';
import { useI18n } from '@/lib/hooks/useI18n';
import type { NotificationTemplate, TemplateCategory } from '@/lib/utils/notification-templates';

// ============================================================================
// Type Definitions
// ============================================================================

interface EmailTemplateEditorProps {
  templateId?: string;
  onSave?: (template: NotificationTemplate) => void;
  onCancel?: () => void;
}

type EditorMode = 'visual' | 'html';

// ============================================================================
// Main Component
// ============================================================================

export default function EmailTemplateEditor({
  templateId,
  onSave,
  onCancel,
}: EmailTemplateEditorProps) {
  const i18n = useI18n();
  const { createTemplate, updateTemplate, getCommonVariables, generatePreview } = useEmailTemplates();
  const { sendEmail } = useNotificationService();

  const [editorMode, setEditorMode] = useState<EditorMode>('visual');
  const [showPreview, setShowPreview] = useState(false);
  const [showTestSend, setShowTestSend] = useState(false);
  const [showVariableMenu, setShowVariableMenu] = useState(false);

  // Template fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<TemplateCategory>('order');
  const [subject, setSubject] = useState('');
  const [htmlBody, setHtmlBody] = useState('');
  const [textBody, setTextBody] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [preview, setPreview] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const commonVariables = getCommonVariables();

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

      if (!subject.trim()) {
        throw new Error('Subject is required');
      }

      if (!htmlBody.trim()) {
        throw new Error('Email content is required');
      }

      let template: NotificationTemplate | null;

      if (templateId) {
        template = updateTemplate(templateId, {
          name,
          category,
          subject,
          htmlBody,
          textBody,
          description,
          isActive,
        });
      } else {
        template = createTemplate({
          name,
          type: 'email',
          category,
          subject,
          htmlBody,
          textBody,
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

  // Handle preview
  const handlePreview = () => {
    setShowPreview(true);
    // Generate preview would use the generatePreview function
  };

  // Insert variable
  const insertVariable = (varName: string) => {
    const variable = `{{${varName}}}`;

    if (editorMode === 'html') {
      setHtmlBody(prev => prev + variable);
    } else {
      // For visual editor, insert at cursor position
      // This would require more complex implementation with cursor tracking
      setHtmlBody(prev => prev + variable);
    }

    setShowVariableMenu(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold dark:text-white">
            {templateId ? i18n.t('notifications.editTemplate') : i18n.t('notifications.createTemplate')}
          </h2>
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
        <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
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
              placeholder="e.g., Order Confirmation"
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

        {/* Subject Line */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {i18n.t('notifications.subject')} *
            </label>
            <button
              onClick={() => setShowVariableMenu(!showVariableMenu)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              {i18n.t('notifications.insertVariable')}
            </button>
          </div>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            placeholder="e.g., Order Confirmation - {{orderNumber}}"
          />
        </div>

        {/* Editor Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditorMode('visual')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              editorMode === 'visual'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            <Type className="h-4 w-4" />
            {i18n.t('notifications.visualEditor')}
          </button>
          <button
            onClick={() => setEditorMode('html')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              editorMode === 'html'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            <Code className="h-4 w-4" />
            {i18n.t('notifications.htmlEditor')}
          </button>
        </div>

        {/* Email Content Editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {i18n.t('notifications.emailContent')} *
          </label>

          {editorMode === 'visual' ? (
            <VisualEditor value={htmlBody} onChange={setHtmlBody} />
          ) : (
            <textarea
              value={htmlBody}
              onChange={e => setHtmlBody(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white font-mono text-sm"
              rows={15}
              placeholder="<html>...</html>"
            />
          )}
        </div>

        {/* Plain Text Version */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {i18n.t('notifications.plainTextVersion')}
            <span className="text-sm text-gray-500 ml-2">
              ({i18n.t('notifications.optional')})
            </span>
          </label>
          <textarea
            value={textBody}
            onChange={e => setTextBody(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            rows={6}
            placeholder="Plain text version for email clients that don't support HTML"
          />
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
            onClick={handlePreview}
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
        <PreviewModal
          subject={subject}
          htmlContent={htmlBody}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Test Send Modal */}
      {showTestSend && (
        <TestSendModal
          templateData={{ subject, htmlBody, textBody }}
          onClose={() => setShowTestSend(false)}
          onSend={sendEmail}
        />
      )}
    </div>
  );
}

// ============================================================================
// Visual Editor Component (Simplified)
// ============================================================================

function VisualEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  // This is a simplified version. In production, you'd use a rich text editor library
  // like Draft.js, Slate, or TinyMCE

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg">
      {/* Toolbar */}
      <div className="p-2 border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex items-center gap-2">
        <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
          <Bold className="h-4 w-4" />
        </button>
        <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
          <Italic className="h-4 w-4" />
        </button>
        <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
          <Underline className="h-4 w-4" />
        </button>
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
        <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
          <AlignLeft className="h-4 w-4" />
        </button>
        <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
          <List className="h-4 w-4" />
        </button>
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
        <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
          <Link className="h-4 w-4" />
        </button>
        <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
          <Image className="h-4 w-4" />
        </button>
      </div>

      {/* Content Area */}
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-4 dark:bg-gray-800 dark:text-white resize-none border-0 focus:outline-none"
        rows={15}
        placeholder="Start typing your email content..."
      />
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

function PreviewModal({
  subject,
  htmlContent,
  onClose,
}: {
  subject: string;
  htmlContent: string;
  onClose: () => void;
}) {
  const i18n = useI18n();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-bold dark:text-white">
            {i18n.t('notifications.emailPreview')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Email Header */}
          <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {i18n.t('notifications.subject')}:
            </div>
            <div className="font-semibold dark:text-white">{subject || '(No subject)'}</div>
          </div>

          {/* Email Content */}
          <div
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
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
  templateData,
  onClose,
  onSend,
}: {
  templateData: { subject: string; htmlBody: string; textBody: string };
  onClose: () => void;
  onSend: any;
}) {
  const i18n = useI18n();
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email) return;

    try {
      setIsSending(true);
      await onSend({
        to: email,
        subject: templateData.subject,
        htmlContent: templateData.htmlBody,
        textContent: templateData.textBody,
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
            {i18n.t('notifications.testSend')}
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
                <Send className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-lg font-semibold dark:text-white">
                {i18n.t('notifications.testSentSuccess')}
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {i18n.t('notifications.testSendDescription')}
              </p>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
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
              disabled={!email || isSending}
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
