'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, BookOpen, TrendingUp, Star, ChevronRight } from 'lucide-react';
import type { HelpCategory, HelpArticle } from '@/types/help';

export default function HelpPage() {
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<HelpArticle[]>([]);
  const [popularArticles, setPopularArticles] = useState<HelpArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHelpData();
  }, []);

  const loadHelpData = async () => {
    try {
      setLoading(true);

      // Load categories with article counts
      const categoriesRes = await fetch('/api/help/categories?include_count=true&is_active=true');
      const categoriesData = await categoriesRes.json();
      setCategories(categoriesData);

      // Load featured articles
      const featuredRes = await fetch('/api/help/articles?is_featured=true&limit=3');
      const featuredData = await featuredRes.json();
      setFeaturedArticles(featuredData.articles || []);

      // Load popular articles
      const popularRes = await fetch('/api/help/articles?order_by=view_count&limit=5');
      const popularData = await popularRes.json();
      setPopularArticles(popularData.articles || []);
    } catch (error) {
      console.error('Error loading help data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/help/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const getIconComponent = (iconName: string | null) => {
    // You can expand this to support more icons
    const icons: { [key: string]: any } = {
      'BookOpen': BookOpen,
      'Search': Search,
      'Star': Star,
    };
    return icons[iconName || 'BookOpen'] || BookOpen;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading help center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">How can we help you?</h1>
            <p className="text-xl text-blue-100 mb-8">
              Search our knowledge base or browse categories below
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for articles..."
                  className="w-full px-6 py-4 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured Articles */}
        {featuredArticles.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <Star className="h-6 w-6 text-yellow-500 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">Featured Articles</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {featuredArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/help/articles/${article.slug}`}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {article.title}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-3">
                    {article.description}
                  </p>
                  <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
                    Read more
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Category</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/help/category/${category.slug}`}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {category.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">
                      {category.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {category.article_count || 0} articles
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Popular Articles */}
        {popularArticles.length > 0 && (
          <div>
            <div className="flex items-center mb-6">
              <TrendingUp className="h-6 w-6 text-green-500 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">Popular Articles</h2>
            </div>
            <div className="bg-white rounded-lg shadow-md divide-y">
              {popularArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/help/articles/${article.slug}`}
                  className="block p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {article.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {article.description}
                      </p>
                    </div>
                    <div className="ml-4 flex items-center text-gray-500">
                      <span className="text-sm">{article.view_count} views</span>
                      <ChevronRight className="h-5 w-5 ml-2" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Can't find what you're looking for?
            </h2>
            <p className="text-gray-600 mb-6">
              Our support team is here to help
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/contact"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Contact Support
              </Link>
              <Link
                href="/support"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Submit a Ticket
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
