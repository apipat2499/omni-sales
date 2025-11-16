/**
 * Canned Responses Manager
 * Quick replies and templates for agents
 */

'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Plus, Edit, Trash2, Search, Copy } from 'lucide-react';

interface CannedResponse {
  id: string;
  title: string;
  content: string;
  shortcut?: string;
  category?: string;
  tags: string[];
  usageCount: number;
}

interface CannedResponsesProps {
  onSelect?: (response: CannedResponse) => void;
}

export default function CannedResponses({ onSelect }: CannedResponsesProps) {
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingResponse, setEditingResponse] = useState<CannedResponse | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    shortcut: '',
    category: '',
    tags: '',
  });

  // Fetch canned responses
  const fetchResponses = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/chat/canned-responses');
      const data = await response.json();

      if (data.success) {
        setResponses(data.responses);
      }
    } catch (error) {
      console.error('Error fetching canned responses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResponses();
  }, []);

  // Create or update canned response
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const tags = formData.tags.split(',').map((t) => t.trim()).filter(Boolean);

    try {
      const url = editingResponse
        ? `/api/chat/canned-responses/${editingResponse.id}`
        : '/api/chat/canned-responses';

      const response = await fetch(url, {
        method: editingResponse ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          shortcut: formData.shortcut || undefined,
          category: formData.category || undefined,
          tags,
        }),
      });

      if (response.ok) {
        setFormData({ title: '', content: '', shortcut: '', category: '', tags: '' });
        setShowAddForm(false);
        setEditingResponse(null);
        fetchResponses();
      }
    } catch (error) {
      console.error('Error saving canned response:', error);
    }
  };

  // Delete canned response
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this response?')) return;

    try {
      const response = await fetch(`/api/chat/canned-responses/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchResponses();
      }
    } catch (error) {
      console.error('Error deleting canned response:', error);
    }
  };

  // Copy to clipboard
  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    // Show toast notification
  };

  // Get unique categories
  const categories = ['all', ...new Set(responses.map((r) => r.category).filter(Boolean))];

  // Filter responses
  const filteredResponses = responses.filter((response) => {
    const matchesSearch =
      response.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      response.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      response.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || response.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Edit handler
  const handleEdit = (response: CannedResponse) => {
    setEditingResponse(response);
    setFormData({
      title: response.title,
      content: response.content,
      shortcut: response.shortcut || '',
      category: response.category || '',
      tags: response.tags.join(', '),
    });
    setShowAddForm(true);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Canned Responses</h2>
          <p className="text-gray-600">Quick replies and message templates</p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingResponse(null);
            setFormData({ title: '', content: '', shortcut: '', category: '', tags: '' });
          }}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          <span>Add Response</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search responses..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category === 'all' ? 'All Categories' : category}
            </option>
          ))}
        </select>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingResponse ? 'Edit Response' : 'Add New Response'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shortcut (optional)
                </label>
                <input
                  type="text"
                  value={formData.shortcut}
                  onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
                  placeholder="e.g., /greeting"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category (optional)
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Greetings"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g., greeting, welcome"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingResponse(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingResponse ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Response List */}
      <div className="grid grid-cols-1 gap-4">
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}

        {!loading && filteredResponses.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No canned responses found</p>
          </div>
        )}

        {!loading &&
          filteredResponses.map((response) => (
            <div
              key={response.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{response.title}</h3>
                    {response.shortcut && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded font-mono">
                        {response.shortcut}
                      </span>
                    )}
                    {response.category && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                        {response.category}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 mb-2">{response.content}</p>
                  <div className="flex items-center space-x-3 text-sm text-gray-500">
                    <span>Used {response.usageCount} times</span>
                    {response.tags.length > 0 && (
                      <div className="flex items-center space-x-1">
                        {response.tags.map((tag, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleCopy(response.content)}
                    className="text-gray-600 hover:text-gray-800"
                    title="Copy"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(response)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(response.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {onSelect && (
                    <button
                      onClick={() => onSelect(response)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Use
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
