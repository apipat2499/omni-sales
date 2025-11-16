'use client';

import { useState, useEffect } from 'react';
import { WhatsAppPhoneInput } from './WhatsAppPhoneInput';

interface Template {
  id: string;
  name: string;
  language: string;
  category: string;
  status: string;
  components: any[];
}

interface WhatsAppCampaignBuilderProps {
  onSave?: (campaign: any) => void;
  onCancel?: () => void;
}

export function WhatsAppCampaignBuilder({
  onSave,
  onCancel,
}: WhatsAppCampaignBuilderProps) {
  const [campaignName, setCampaignName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [targetAudience, setTargetAudience] = useState<string>('all');
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState('');
  const [sendNow, setSendNow] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [templateComponents, setTemplateComponents] = useState<any>({});

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/whatsapp/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    // Initialize template components
    const components: any = {};
    template.components.forEach((comp: any) => {
      if (comp.type === 'BODY' && comp.text) {
        const matches = comp.text.match(/\{\{(\d+)\}\}/g);
        if (matches) {
          components.body = matches.map(() => '');
        }
      }
    });
    setTemplateComponents(components);
  };

  const handleComponentChange = (type: string, index: number, value: string) => {
    setTemplateComponents((prev: any) => ({
      ...prev,
      [type]: prev[type]?.map((v: string, i: number) => i === index ? value : v) || [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!campaignName.trim()) {
      setError('กรุณากรอกชื่อแคมเปญ');
      return;
    }

    if (!selectedTemplate) {
      setError('กรุณาเลือก Template');
      return;
    }

    setLoading(true);

    try {
      // Build template components for API
      const components = [];

      if (templateComponents.body && templateComponents.body.length > 0) {
        components.push({
          type: 'body',
          parameters: templateComponents.body.map((text: string) => ({
            type: 'text',
            text,
          })),
        });
      }

      const campaignData = {
        name: campaignName,
        templateName: selectedTemplate.name,
        templateComponents: components,
        targetAudience: targetAudience === 'custom' ? { customTags } : null,
        scheduledAt: sendNow ? null : scheduledAt,
        sendNow,
      };

      const response = await fetch('/api/whatsapp/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create campaign');
      }

      const result = await response.json();

      if (onSave) {
        onSave(result.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        สร้างแคมเปญ WhatsApp
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Campaign Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ชื่อแคมเปญ <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="เช่น: โปรโมชั่นส่งท้ายปี 2024"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>

        {/* Template Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            เลือก Template <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedTemplate?.id || ''}
            onChange={(e) => {
              const template = templates.find(t => t.id === e.target.value);
              if (template) handleTemplateSelect(template);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          >
            <option value="">-- เลือก Template --</option>
            {templates
              .filter(t => t.status === 'APPROVED')
              .map(template => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.category})
                </option>
              ))}
          </select>
        </div>

        {/* Template Variables */}
        {selectedTemplate && templateComponents.body && (
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              กรอกข้อมูลสำหรับ Template
            </h3>
            <div className="space-y-3">
              {templateComponents.body.map((value: string, index: number) => (
                <div key={index}>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    ตัวแปรที่ {index + 1}
                  </label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleComponentChange('body', index, e.target.value)}
                    placeholder={`ค่าสำหรับ {{${index + 1}}}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Target Audience */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            กลุ่มเป้าหมาย
          </label>
          <select
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="all">ทุกคน (ที่ opt-in แล้ว)</option>
            <option value="custom">กำหนดเอง</option>
          </select>
        </div>

        {/* Custom Tags */}
        {targetAudience === 'custom' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags ของลูกค้า
            </label>
            <input
              type="text"
              value={customTags.join(', ')}
              onChange={(e) => setCustomTags(e.target.value.split(',').map(t => t.trim()))}
              placeholder="เช่น: vip, premium, active"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              คั่นด้วยเครื่องหมายจุลภาค (,)
            </p>
          </div>
        )}

        {/* Schedule */}
        <div>
          <label className="flex items-center space-x-2 mb-2">
            <input
              type="checkbox"
              checked={sendNow}
              onChange={(e) => setSendNow(e.target.checked)}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              ส่งทันที
            </span>
          </label>

          {!sendNow && (
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required={!sendNow}
            />
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              ยกเลิก
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>กำลังสร้าง...</span>
              </>
            ) : (
              <span>{sendNow ? 'สร้างและส่งเลย' : 'สร้างแคมเปญ'}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
