# Advanced Search System - Quick Start Guide

Get up and running with the Advanced Search System in 5 minutes.

## Installation

No installation needed! All files are already in your project:

```
✅ /lib/utils/search-engine.ts
✅ /lib/hooks/useSearchEngine.ts
✅ /components/search/SearchBar.tsx
✅ /components/search/SearchResults.tsx
✅ /components/search/SearchExample.tsx
✅ Updated /lib/utils/i18n.ts
```

## Quick Integration

### Step 1: Import Components

```tsx
import { SearchBar, SearchResults } from '@/components/search';
import { useSearchEngine } from '@/lib/hooks/useSearchEngine';
```

### Step 2: Get Your Data

```tsx
// Use existing hooks or fetch data
const items = useOrderItems();
const products = useProducts();
const orders = useOrders();
const templates = useOrderTemplates();
```

### Step 3: Initialize Search Engine

```tsx
const {
  query,
  setQuery,
  scope,
  setScope,
  search,
  results,
  isSearching,
  getSavedSearches,
  getSearchHistory,
} = useSearchEngine(
  { items, products, orders, templates },
  { autoSearch: false }
);
```

### Step 4: Render Components

```tsx
return (
  <div className="p-6">
    <SearchBar
      value={query}
      onChange={setQuery}
      onSearch={search}
      scope={scope}
      onScopeChange={setScope}
      savedSearches={getSavedSearches()}
      searchHistory={getSearchHistory()}
    />

    <SearchResults
      results={results}
      isSearching={isSearching}
      query={query}
    />
  </div>
);
```

## Complete Example

```tsx
'use client';

import React from 'react';
import { SearchBar, SearchResults } from '@/components/search';
import { useSearchEngine } from '@/lib/hooks/useSearchEngine';
import { useOrderItems } from '@/lib/hooks/useOrderItems';
import { useProducts } from '@/lib/hooks/useProducts';

export default function SearchPage() {
  // Get data
  const { items } = useOrderItems();
  const { products } = useProducts();

  // Initialize search
  const {
    query,
    setQuery,
    scope,
    setScope,
    search,
    results,
    isSearching,
    filters,
    removeFilter,
    clearFilters,
    getSavedSearches,
    getSearchHistory,
  } = useSearchEngine(
    { items, products },
    { autoSearch: false, trackHistory: true }
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Search</h1>

      <SearchBar
        value={query}
        onChange={setQuery}
        onSearch={search}
        scope={scope}
        onScopeChange={setScope}
        savedSearches={getSavedSearches()}
        searchHistory={getSearchHistory()}
      />

      <SearchResults
        results={results}
        isSearching={isSearching}
        query={query}
        filters={filters}
        onRemoveFilter={removeFilter}
        onClearFilters={clearFilters}
      />
    </div>
  );
}
```

## Try It Out

### Basic Searches

```
apple                  # Simple text search
status:completed       # Field-specific search
price:>1000            # Comparison search
quantity:100..500      # Range search
"exact phrase"         # Exact phrase matching
apple -discount        # Exclude term
```

### Advanced Searches

```
name:phone quantity:>50 -refurbished
# Find phones with quantity > 50, exclude refurbished

price:500..1000 status:pending
# Pending orders between 500-1000

tag:urgent date:>2024-11-01
# Urgent items from November onwards
```

## Next Steps

1. **Customize Styling**
   - Modify Tailwind classes in components
   - Match your design system

2. **Add Features**
   - Implement result click handlers
   - Add export functionality
   - Create custom filters

3. **Monitor Performance**
   - Check search statistics
   - Optimize for your dataset
   - Adjust debounce delay if needed

4. **Enhance UX**
   - Add loading skeletons
   - Implement infinite scroll
   - Add keyboard shortcuts

## Common Use Cases

### Product Search

```tsx
const { search } = useSearchEngine({ products });

search('laptop', 'products');
```

### Order Search

```tsx
const { search } = useSearchEngine({ orders });

search('status:completed', 'orders');
```

### Cross-Entity Search

```tsx
const { search } = useSearchEngine({
  items,
  products,
  orders,
  templates,
});

search('apple', 'all');
```

## Troubleshooting

### No Results?

1. Check if data is loaded: `console.log(items, products)`
2. Verify search scope matches your data
3. Try lowering fuzzy match threshold
4. Check for typos in field names

### Slow Performance?

1. Enable result caching: `{ cacheResults: true }`
2. Limit results: Pass `limit: 50` to search
3. Debounce input: `{ debounceMs: 500 }`
4. Build index once on mount

### LocalStorage Issues?

1. Check browser storage limits (5-10MB)
2. Clear old history: `clearHistory()`
3. Delete unused saved searches
4. Implement IndexedDB for large datasets

## API Reference

### useSearchEngine Options

```typescript
{
  autoSearch?: boolean;      // Default: false
  debounceMs?: number;       // Default: 300
  cacheResults?: boolean;    // Default: true
  trackHistory?: boolean;    // Default: true
}
```

### SearchBar Props

```typescript
{
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string, scope?: SearchScope) => void;
  scope: SearchScope;
  onScopeChange: (scope: SearchScope) => void;
  showQuickFilters?: boolean;
  showSuggestions?: boolean;
  savedSearches?: SavedSearch[];
  searchHistory?: SearchHistoryEntry[];
}
```

### SearchResults Props

```typescript
{
  results: SearchResult<any>[];
  isSearching: boolean;
  query: string;
  filters?: SearchFilter[];
  onRemoveFilter?: (filterId: string) => void;
  onClearFilters?: () => void;
  onResultClick?: (result: SearchResult<any>) => void;
  groupByType?: boolean;
  showScore?: boolean;
  itemsPerPage?: number;
}
```

## Support

For detailed documentation, see:
- `/components/search/README.md` - Component docs
- `/SEARCH_SYSTEM_IMPLEMENTATION.md` - Full implementation guide

## Examples

Check out `/components/search/SearchExample.tsx` for a complete working example with all features enabled.

---

**Happy Searching! 🔍**
