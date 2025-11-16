'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronRight } from 'lucide-react';
import type { HelpCategory } from '@/types/help';

interface CategoryBrowserProps {
  selectedCategoryId?: string;
  showArticleCount?: boolean;
}

export default function CategoryBrowser({
  selectedCategoryId,
  showArticleCount = true,
}: CategoryBrowserProps) {
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/help/categories?include_count=${showArticleCount}&is_active=true`
      );
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
      </div>
      <div className="divide-y">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/help/category/${category.slug}`}
            className={`block p-4 hover:bg-gray-50 transition-colors ${
              category.id === selectedCategoryId ? 'bg-blue-50' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center flex-1">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">
                    {category.name}
                  </h3>
                  {showArticleCount && (
                    <p className="text-xs text-gray-500">
                      {category.article_count || 0} articles
                    </p>
                  )}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
