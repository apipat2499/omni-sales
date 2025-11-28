'use client';

import { useState, useEffect } from 'react';
import { AdminGuard } from '@/components/RouteGuard';
import { DEFAULT_EMAIL_TEMPLATES } from '@/lib/email/templates/defaults';

interface EmailTemplate {
  id?: string;
  user_id?: string;
  name: string;
  subject: string;
  html_content: string;
  text_content?: string;
  variables?: string[];
  category?: string;
  is_active?: boolean;
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState<EmailTemplate>({
    name: '',
    subject: '',
    html_content: '',
    text_content: '',
    category: 'custom',
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      // Mock user ID - in production, get from auth context
      const userId = 'mock-user-id';

      const response = await fetch(`/api/email/templates?userId=${userId}`);
      const data = await response.json();

      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      name: '',
      subject: '',
      html_content: '',
      text_content: '',
      category: 'custom',
    });
    setSelectedTemplate(null);
    setIsEditing(true);
  };

  const handleEdit = (template: EmailTemplate) => {
    setFormData({
      name: template.name,
      subject: template.subject,
      html_content: template.html_content,
      text_content: template.text_content,
      category: template.category,
    });
    setSelectedTemplate(template);
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const userId = 'mock-user-id';
      const url = '/api/email/templates';

      let response;
      if (selectedTemplate?.id) {
        // Update existing template
        response = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateId: selectedTemplate.id,
            userId,
            name: formData.name,
            subject: formData.subject,
            htmlContent: formData.html_content,
            textContent: formData.text_content,
            category: formData.category,
          }),
        });
      } else {
        // Create new template
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            name: formData.name,
            subject: formData.subject,
            htmlContent: formData.html_content,
            textContent: formData.text_content,
            category: formData.category,
          }),
        });
      }

      const data = await response.json();

      if (data.success) {
        alert('Template saved successfully!');
        setIsEditing(false);
        loadTemplates();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const userId = 'mock-user-id';
      const response = await fetch(
        `/api/email/templates?templateId=${templateId}&userId=${userId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (data.success) {
        alert('Template deleted successfully!');
        loadTemplates();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  };

  const loadDefaultTemplate = (templateKey: string) => {
    const template = DEFAULT_EMAIL_TEMPLATES[templateKey as keyof typeof DEFAULT_EMAIL_TEMPLATES];
    if (template) {
      setFormData({
        name: template.name,
        subject: template.subject,
        html_content: template.html_content,
        text_content: template.text_content || '',
        category: template.category,
      });
    }
  };

  const handlePreview = () => {
    setIsPreview(true);
  };

  const renderPreview = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Preview: {formData.subject}</h2>
            <button
              onClick={() => setIsPreview(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              &times;
            </button>
          </div>
          <div
            className="border border-gray-300 rounded p-4 bg-gray-50"
            dangerouslySetInnerHTML={{ __html: formData.html_content }}
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <AdminGuard>
        <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading templates...</div>
      </div>
      </AdminGuard>
    );
  }

  if (isEditing) {
    return (
      <AdminGuard>
        <div className="container mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">
              {selectedTemplate ? 'Edit Template' : 'Create New Template'}
            </h1>
            <button
              onClick={() => setIsEditing(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              Back to List
            </button>
          </div>

          <div className="space-y-4">
            {/* Load Default Template */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Load Default Template
              </label>
              <select
                onChange={(e) => loadDefaultTemplate(e.target.value)}
                className="w-full border border-gray-300 rounded p-2"
              >
                <option value="">-- Select a default template --</option>
                {Object.keys(DEFAULT_EMAIL_TEMPLATES).map((key) => (
                  <option key={key} value={key}>
                    {key.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Template Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Template Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded p-2"
                placeholder="e.g., Order Confirmation"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border border-gray-300 rounded p-2"
              >
                <option value="transactional">Transactional</option>
                <option value="marketing">Marketing</option>
                <option value="notification">Notification</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium mb-2">Subject</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full border border-gray-300 rounded p-2"
                placeholder="Use {{variable_name}} for dynamic content"
              />
            </div>

            {/* HTML Content */}
            <div>
              <label className="block text-sm font-medium mb-2">HTML Content</label>
              <textarea
                value={formData.html_content}
                onChange={(e) =>
                  setFormData({ ...formData, html_content: e.target.value })
                }
                className="w-full border border-gray-300 rounded p-2 font-mono text-sm"
                rows={15}
                placeholder="Enter HTML content. Use {{variable_name}} for dynamic content"
              />
            </div>

            {/* Text Content */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Plain Text Content (Optional)
              </label>
              <textarea
                value={formData.text_content}
                onChange={(e) =>
                  setFormData({ ...formData, text_content: e.target.value })
                }
                className="w-full border border-gray-300 rounded p-2 font-mono text-sm"
                rows={8}
                placeholder="Plain text version of the email"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
              >
                Save Template
              </button>
              <button
                onClick={handlePreview}
                className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
              >
                Preview
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        {isPreview && renderPreview()}
      </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="container mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <button
            onClick={handleCreate}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Create New Template
          </button>
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No templates found</p>
            <button
              onClick={handleCreate}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
            >
              Create Your First Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold">{template.name}</h3>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {template.category}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">{template.subject}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(template)}
                    className="flex-1 bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => template.id && handleDelete(template.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </AdminGuard>
  );
}
