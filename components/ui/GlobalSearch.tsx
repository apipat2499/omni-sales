'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, FileText, ShoppingCart, Users, Package, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface SearchResult {
  type: 'product' | 'order' | 'customer' | 'discount';
  id: number;
  title: string;
  subtitle?: string;
  link: string;
  icon: any;
}

async function searchGlobal(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];

  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('Search failed');
  }
  return response.json();
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['global-search', query],
    queryFn: () => searchGlobal(query),
    enabled: query.length >= 2,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open search with /
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }

      // Close with Escape
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }

      // Navigate with arrows when open
      if (isOpen && results.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % results.length);
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
        }
        if (e.key === 'Enter' && results[selectedIndex]) {
          e.preventDefault();
          handleSelectResult(results[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  const handleSelectResult = (result: SearchResult) => {
    router.push(result.link);
    setIsOpen(false);
    setQuery('');
    inputRef.current?.blur();
  };

  const RESULT_ICONS = {
    product: Package,
    order: ShoppingCart,
    customer: Users,
    discount: TrendingUp,
  };

  return (
    <div className="relative w-full max-w-xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="ค้นหา... (กด / เพื่อค้นหา)"
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-40 max-h-[400px] overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-gray-500">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                <Search className="h-12 w-12 mb-2 opacity-50" />
                <p>ไม่พบผลลัพธ์สำหรับ "{query}"</p>
              </div>
            ) : (
              <div className="py-2">
                {results.map((result, index) => {
                  const Icon = RESULT_ICONS[result.type];
                  const isSelected = index === selectedIndex;

                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelectResult(result)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${
                        isSelected
                          ? 'bg-blue-100 dark:bg-blue-900/30'
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          isSelected
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-600 dark:text-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {result.title}
                        </p>
                        {result.subtitle && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {result.subtitle}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 capitalize">
                        {result.type}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
