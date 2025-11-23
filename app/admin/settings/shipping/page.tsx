'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import Modal from '@/components/ui/Modal';

interface ShippingMethod {
  id: string;
  method: string;
  cost: number;
  days: string;
}

export default function ShippingSettingsPage() {
  const { settings, updateShippingSettings } = useSettings();
  const [methods, setMethods] = useState<ShippingMethod[]>(settings.shipping.methods);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(settings.shipping.freeShippingThreshold);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
  const [formData, setFormData] = useState<Partial<ShippingMethod>>({
    method: '',
    cost: 0,
    days: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setMethods(settings.shipping.methods);
    setFreeShippingThreshold(settings.shipping.freeShippingThreshold);
  }, [settings.shipping]);

  const handleOpenModal = (method?: ShippingMethod) => {
    if (method) {
      setEditingMethod(method);
      setFormData(method);
    } else {
      setEditingMethod(null);
      setFormData({
        method: '',
        cost: 0,
        days: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMethod(null);
    setFormData({
      method: '',
      cost: 0,
      days: '',
    });
  };

  const handleMethodSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.method || !formData.cost || !formData.days) {
      setMessage({ type: 'error', text: 'All fields are required' });
      return;
    }

    if (editingMethod) {
      // Update existing method
      const updatedMethods = methods.map((m) =>
        m.id === editingMethod.id ? { ...editingMethod, ...formData } : m
      );
      setMethods(updatedMethods);
      setMessage({ type: 'success', text: 'Shipping method updated!' });
    } else {
      // Add new method
      const newMethod: ShippingMethod = {
        id: Date.now().toString(),
        method: formData.method!,
        cost: formData.cost!,
        days: formData.days!,
      };
      setMethods([...methods, newMethod]);
      setMessage({ type: 'success', text: 'Shipping method added!' });
    }
    handleCloseModal();
  };

  const handleDeleteMethod = (methodId: string) => {
    if (confirm('Are you sure you want to delete this shipping method?')) {
      const updatedMethods = methods.filter((m) => m.id !== methodId);
      setMethods(updatedMethods);
      setMessage({ type: 'success', text: 'Shipping method deleted!' });
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setMessage(null);

    try {
      await updateShippingSettings({
        methods,
        freeShippingThreshold,
      });
      setMessage({ type: 'success', text: 'Shipping settings saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save shipping settings' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Shipping Settings</h1>
        <p className="text-gray-600">Configure shipping methods and costs</p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Free Shipping Threshold */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Free Shipping</h2>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">
            Free shipping threshold (THB):
          </label>
          <input
            type="number"
            value={freeShippingThreshold}
            onChange={(e) => setFreeShippingThreshold(parseFloat(e.target.value) || 0)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-32"
            min="0"
            step="1"
          />
          <p className="text-sm text-gray-500">
            Orders above this amount qualify for free shipping
          </p>
        </div>
      </div>

      {/* Shipping Methods */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Shipping Methods</h2>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Add Method
          </button>
        </div>

        {/* Methods Table */}
        <div className="overflow-hidden border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost (THB)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery Time
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {methods.map((method) => (
                <tr key={method.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {method.method}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {method.cost.toLocaleString()} THB
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {method.days} days
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleOpenModal(method)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteMethod(method.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {methods.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No shipping methods configured. Add your first method!</p>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className={`px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors ${
            saving ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>

      {/* Shipping Method Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingMethod ? 'Edit Shipping Method' : 'Add Shipping Method'}
        size="md"
      >
        <form onSubmit={handleMethodSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Method Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.method || ''}
              onChange={(e) => setFormData({ ...formData, method: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Standard, Express"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cost (THB) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.cost || 0}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Time <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.days || ''}
                onChange={(e) => setFormData({ ...formData, days: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 2-3"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {editingMethod ? 'Update Method' : 'Add Method'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
