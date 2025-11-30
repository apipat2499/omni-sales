'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/RouteGuard';
import { showToast } from '@/lib/utils/toast';
import { Folder, Plus, Edit, Trash2, Loader2, Package } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  productCount?: number;
  created_at: string;
  updated_at: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formParentId, setFormParentId] = useState('');

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      showToast.error('ไม่สามารถโหลดข้อมูลหมวดหมู่ได้');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Open add modal
  const handleAdd = () => {
    setEditingCategory(null);
    setFormName('');
    setFormDescription('');
    setFormParentId('');
    setIsModalOpen(true);
  };

  // Open edit modal
  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormName(category.name);
    setFormDescription(category.description || '');
    setFormParentId(category.parent_id || '');
    setIsModalOpen(true);
  };

  // Submit form (create or update)
  const handleSubmit = async () => {
    if (!formName.trim()) {
      showToast.error('กรุณาระบุชื่อหมวดหมู่');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        parentId: formParentId || null,
      };

      const url = editingCategory
        ? `/api/categories/${editingCategory.id}`
        : '/api/categories';

      const response = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Operation failed');
      }

      showToast.success(
        editingCategory
          ? 'อัพเดทหมวดหมู่สำเร็จ'
          : 'เพิ่มหมวดหมู่สำเร็จ'
      );

      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete category
  const handleDelete = async (category: Category) => {
    if (!confirm(`ต้องการลบหมวดหมู่ "${category.name}" ใช่หรือไม่?`)) return;

    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete category');
      }

      showToast.success('ลบหมวดหมู่สำเร็จ');
      fetchCategories();
    } catch (error) {
      showToast.error(error instanceof Error ? error.message : 'ไม่สามารถลบหมวดหมู่ได้');
    }
  };

  // Get category hierarchy
  const getRootCategories = () => categories.filter((c) => !c.parent_id);
  const getSubcategories = (parentId: string) =>
    categories.filter((c) => c.parent_id === parentId);

  if (loading) {
    return (
      <AdminGuard>
        <AdminLayout>
          <div className="p-6 flex items-center justify-center min-h-screen">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
              <p className="text-gray-600 dark:text-gray-400">กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        </AdminLayout>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Product Categories
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                จัดการหมวดหมู่สินค้า
              </p>
            </div>
            <button
              onClick={handleAdd}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add Category
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Folder className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Categories</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {categories.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Folder className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Root Categories</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {getRootCategories().length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {categories.reduce((sum, c) => sum + (c.productCount || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Categories List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                All Categories
              </h2>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {categories.length === 0 ? (
                <div className="p-12 text-center">
                  <Folder className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">No categories found</p>
                  <button
                    onClick={handleAdd}
                    className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Create your first category
                  </button>
                </div>
              ) : (
                getRootCategories().map((category) => (
                  <CategoryRow
                    key={category.id}
                    category={category}
                    subcategories={getSubcategories(category.id)}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          </div>

          {/* Add/Edit Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {editingCategory ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}
                  </h2>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    disabled={isSubmitting}
                  >
                    ✕
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ชื่อหมวดหมู่ *
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="เช่น Electronics, Clothing"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      คำอธิบาย
                    </label>
                    <textarea
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="คำอธิบายหมวดหมู่"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      หมวดหมู่หลัก (Parent Category)
                    </label>
                    <select
                      value={formParentId}
                      onChange={(e) => setFormParentId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      disabled={isSubmitting}
                    >
                      <option value="">ไม่มี (Root Category)</option>
                      {categories
                        .filter((c) => !c.parent_id && (!editingCategory || c.id !== editingCategory.id))
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isSubmitting
                      ? editingCategory
                        ? 'กำลังอัพเดท...'
                        : 'กำลังเพิ่ม...'
                      : editingCategory
                      ? 'อัพเดท'
                      : 'เพิ่มหมวดหมู่'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}

// Category Row Component
function CategoryRow({
  category,
  subcategories,
  onEdit,
  onDelete,
  isSubcategory = false,
}: {
  category: Category;
  subcategories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  isSubcategory?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <div
        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
          isSubcategory ? 'pl-12 bg-gray-50 dark:bg-gray-700/50' : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {subcategories.length > 0 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            )}
            <Folder className="h-5 w-5 text-gray-400" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                {category.name}
              </h3>
              {category.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {category.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              {category.productCount !== undefined && (
                <span className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  {category.productCount} products
                </span>
              )}
              {subcategories.length > 0 && (
                <span>{subcategories.length} subcategories</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => onEdit(category)}
              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(category)}
              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {isExpanded &&
        subcategories.map((sub) => (
          <CategoryRow
            key={sub.id}
            category={sub}
            subcategories={[]}
            onEdit={onEdit}
            onDelete={onDelete}
            isSubcategory
          />
        ))}
    </>
  );
}
