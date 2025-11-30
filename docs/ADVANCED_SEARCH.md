# 🔍 Advanced Search & Filters Implementation

## Overview

This document describes the advanced search and filtering system implemented in the Omni Sales application.

**Implementation Date:** 2025-11-29
**Status:** ✅ Complete

---

## 📋 Features

### 1. Fuzzy Search
- **Tolerates typos**: "Prodcut" will match "Product"
- **Word-based matching**: Searches each word independently
- **Configurable threshold**: Adjust similarity tolerance (default: 0.6)
- **Multi-field search**: Search across multiple fields simultaneously

### 2. Advanced Filters
- **Multiple filter types**: text, select, number, date, date range, number range
- **Filter combinations**: Apply multiple filters simultaneously
- **Filter presets**: Save and reuse common filter combinations
- **Visual feedback**: Shows active filter count
- **Responsive UI**: Works on all screen sizes

### 3. Search Hook
- **Unified API**: Single hook for search, filter, and sort
- **Performance optimized**: Memoized results
- **TypeScript support**: Full type safety
- **Flexible configuration**: Easy to customize per use case

---

## 🏗️ Architecture

### File Structure

```
lib/
├── utils/
│   └── fuzzy-search.ts         # Fuzzy search algorithms
└── hooks/
    └── useAdvancedSearch.ts    # Advanced search hook

components/
├── SearchInput.tsx             # Enhanced search input
└── AdvancedFilter.tsx          # Advanced filter component

docs/
└── ADVANCED_SEARCH.md          # This documentation
```

---

## 🔧 Implementation Details

### 1. Fuzzy Search Algorithm

**File:** `lib/utils/fuzzy-search.ts`

#### Levenshtein Distance

Calculates the minimum number of edits (insertions, deletions, substitutions) needed to change one string into another.

```typescript
levenshteinDistance('Product', 'Prodcut') // Returns: 2
levenshteinDistance('iPhone', 'iPhome') // Returns: 1
```

#### Similarity Score

Converts Levenshtein distance to a 0-1 similarity score:

```typescript
similarityScore('Product', 'Product')  // Returns: 1.0 (perfect match)
similarityScore('Product', 'Prodcut')  // Returns: 0.71 (good match)
similarityScore('Product', 'iPhone')   // Returns: 0.14 (poor match)
```

#### Fuzzy Match

Determines if a search term matches a target with configurable threshold:

```typescript
fuzzyMatch('iphone', 'iPhone 15 Pro', 0.6)     // true (exact match)
fuzzyMatch('iphome', 'iPhone 15 Pro', 0.6)     // true (fuzzy match)
fuzzyMatch('product', 'Electronics', 0.6)       // false (no match)
```

#### Multi-Field Search

Search across multiple fields at once:

```typescript
fuzzySearchMultiField(
  'iphone pro',
  ['iPhone 15 Pro', 'IPH-15P-001', 'Electronics'],
  0.6
) // true - matches first field
```

### 2. Advanced Filter Component

**File:** `components/AdvancedFilter.tsx`

#### Filter Field Types

1. **Text**: Simple text input
2. **Select**: Dropdown with predefined options
3. **Number**: Numeric input
4. **Date**: Single date picker
5. **Date Range**: From/To date pickers
6. **Number Range**: Min/Max numeric inputs

#### Usage Example

```typescript
import AdvancedFilter, { FilterField, FilterValues } from '@/components/AdvancedFilter';

const filterFields: FilterField[] = [
  {
    id: 'category',
    label: 'Category',
    type: 'select',
    options: [
      { value: 'electronics', label: 'Electronics' },
      { value: 'clothing', label: 'Clothing' },
    ],
  },
  {
    id: 'priceRange',
    label: 'Price Range',
    type: 'numberRange',
  },
  {
    id: 'dateRange',
    label: 'Date Range',
    type: 'dateRange',
  },
];

function MyPage() {
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  return (
    <AdvancedFilter
      fields={filterFields}
      values={filterValues}
      onChange={setFilterValues}
      onReset={() => setFilterValues({})}
    />
  );
}
```

#### Filter Presets

Save and reuse common filter combinations:

```typescript
<AdvancedFilter
  fields={filterFields}
  values={filterValues}
  onChange={setFilterValues}
  presets={[
    {
      id: '1',
      name: 'High Value Orders',
      filters: { priceRange: { min: 10000, max: null } },
    },
    {
      id: '2',
      name: 'Last 7 Days',
      filters: {
        dateRange: {
          from: '2025-11-22',
          to: '2025-11-29',
        },
      },
    },
  ]}
  onSavePreset={(name, filters) => {
    console.log('Save preset:', name, filters);
  }}
  onDeletePreset={(id) => {
    console.log('Delete preset:', id);
  }}
  onApplyPreset={(preset) => {
    setFilterValues(preset.filters);
  }}
/>
```

### 3. useAdvancedSearch Hook

**File:** `lib/hooks/useAdvancedSearch.ts`

#### Configuration

```typescript
interface SearchConfig<T> {
  searchFields: (keyof T)[];      // Fields to search in
  fuzzy?: boolean;                 // Enable fuzzy search
  fuzzyThreshold?: number;         // Similarity threshold (0-1)
}

interface FilterConfig<T> {
  filters: {
    [key: string]: (item: T, value: any) => boolean;
  };
}

interface SortConfig<T> {
  sortBy?: keyof T;               // Initial sort field
  sortOrder?: 'asc' | 'desc';     // Initial sort order
}
```

#### Usage Example

```typescript
import { useAdvancedSearch } from '@/lib/hooks/useAdvancedSearch';
import type { Product } from '@/types';

function ProductsPage() {
  const products = [...]; // Your products data

  const {
    // Search
    searchTerm,
    setSearchTerm,

    // Filters
    filterValues,
    setFilterValue,
    clearFilters,

    // Sort
    sortBy,
    sortOrder,
    toggleSort,

    // Results
    results,
    totalCount,
    filteredCount,

    // Stats
    activeFiltersCount,
    hasActiveFilters,
  } = useAdvancedSearch<Product>({
    data: products,
    searchFields: ['name', 'sku', 'category'],
    fuzzy: true,
    fuzzyThreshold: 0.6,
    filters: {
      category: (product, value) => product.category === value,
      priceRange: (product, value) =>
        (!value.min || product.price >= parseFloat(value.min)) &&
        (!value.max || product.price <= parseFloat(value.max)),
      inStock: (product, value) => value ? product.stock > 0 : true,
    },
    sortBy: 'name',
    sortOrder: 'asc',
  });

  return (
    <div>
      {/* Search */}
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search products..."
      />

      {/* Filters */}
      <select onChange={(e) => setFilterValue('category', e.target.value)}>
        <option value="">All Categories</option>
        <option value="electronics">Electronics</option>
        <option value="clothing">Clothing</option>
      </select>

      {/* Sort */}
      <button onClick={() => toggleSort('price')}>
        Sort by Price {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
      </button>

      {/* Results */}
      <p>Showing {filteredCount} of {totalCount} products</p>
      {results.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

### 4. Search Input Component

**File:** `components/SearchInput.tsx`

#### Features

- **Clear button**: Quick clear search term
- **Fuzzy toggle**: Enable/disable fuzzy search
- **Results count**: Show filtered vs total count
- **Visual feedback**: Indicates when fuzzy search is active

#### Usage Example

```typescript
import SearchInput from '@/components/SearchInput';

function MyPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFuzzy, setIsFuzzy] = useState(true);

  return (
    <SearchInput
      value={searchTerm}
      onChange={setSearchTerm}
      placeholder="Search products..."
      fuzzy={isFuzzy}
      onFuzzyToggle={setIsFuzzy}
      resultsCount={25}
      totalCount={100}
    />
  );
}
```

---

## 📖 Usage Patterns

### Pattern 1: Simple Fuzzy Search

```typescript
import { fuzzyMatch } from '@/lib/utils/fuzzy-search';

const searchTerm = 'iphone pro';
const productName = 'iPhone 15 Pro Max';

if (fuzzyMatch(searchTerm, productName, 0.6)) {
  console.log('Match found!');
}
```

### Pattern 2: Multi-Field Search

```typescript
import { fuzzySearchMultiField } from '@/lib/utils/fuzzy-search';

const searchTerm = 'laptop';
const product = {
  name: 'MacBook Pro',
  sku: 'LAPTOP-MBP-001',
  category: 'Electronics',
  description: 'Professional laptop for developers',
};

const fields = [product.name, product.sku, product.category, product.description];

if (fuzzySearchMultiField(searchTerm, fields, 0.6)) {
  console.log('Product matches search!');
}
```

### Pattern 3: Complete Search Solution

```typescript
import { useAdvancedSearch } from '@/lib/hooks/useAdvancedSearch';
import SearchInput from '@/components/SearchInput';
import AdvancedFilter from '@/components/AdvancedFilter';

function ProductsPage() {
  const {
    searchTerm,
    setSearchTerm,
    filterValues,
    setFilterValues,
    results,
    totalCount,
    filteredCount,
  } = useAdvancedSearch({
    data: products,
    searchFields: ['name', 'sku'],
    fuzzy: true,
    filters: {
      category: (p, v) => p.category === v,
      stock: (p, v) => v ? p.stock > 0 : true,
    },
  });

  return (
    <div>
      <SearchInput
        value={searchTerm}
        onChange={setSearchTerm}
        resultsCount={filteredCount}
        totalCount={totalCount}
      />

      <AdvancedFilter
        fields={[
          {
            id: 'category',
            label: 'Category',
            type: 'select',
            options: [
              { value: 'electronics', label: 'Electronics' },
              { value: 'clothing', label: 'Clothing' },
            ],
          },
          {
            id: 'stock',
            label: 'In Stock Only',
            type: 'select',
            options: [
              { value: 'true', label: 'Yes' },
              { value: 'false', label: 'No' },
            ],
          },
        ]}
        values={filterValues}
        onChange={setFilterValues}
      />

      {results.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

---

## 🎯 Best Practices

### 1. Choose Appropriate Fuzzy Threshold

```typescript
// Very strict (0.8-1.0): Only minor typos
fuzzyMatch('iphone', 'iPhome', 0.9)  // false

// Moderate (0.6-0.8): Common typos
fuzzyMatch('iphone', 'iPhome', 0.7)  // true

// Lenient (0.4-0.6): Major typos
fuzzyMatch('iphone', 'aphone', 0.5)  // true
```

**Recommendation**: Use 0.6-0.7 for most cases

### 2. Limit Search Fields

```typescript
// ❌ BAD - Too many fields, slow performance
searchFields: ['id', 'name', 'sku', 'description', 'category', 'tags', 'brand', ...]

// ✅ GOOD - Only relevant fields
searchFields: ['name', 'sku', 'category']
```

### 3. Use Memoization

The `useAdvancedSearch` hook already memoizes results, but if you're implementing custom logic:

```typescript
const filteredProducts = useMemo(() => {
  return products.filter(p =>
    fuzzyMatch(searchTerm, p.name, 0.6)
  );
}, [products, searchTerm]);
```

### 4. Debounce Search Input

For better performance with large datasets:

```typescript
import { useDebouncedValue } from '@/lib/hooks/useDebounce';

function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  const { results } = useAdvancedSearch({
    data: products,
    searchFields: ['name'],
    // Use debounced value
  });
}
```

---

## 📊 Performance Considerations

### Fuzzy Search Complexity

- **Time Complexity**: O(m × n) where m and n are string lengths
- **Recommendation**: Use for strings < 100 characters
- **Large Datasets**: Consider server-side fuzzy search

### Optimization Tips

1. **Limit Search Fields**: Only search essential fields
2. **Use Exact Match First**: Try exact/contains before fuzzy
3. **Debounce Input**: Wait 300ms before searching
4. **Pagination**: Don't search all results at once
5. **Web Workers**: Move fuzzy search to background thread for large datasets

### Example: Optimized Search

```typescript
function optimizedSearch(searchTerm: string, products: Product[]) {
  if (!searchTerm) return products;

  // Step 1: Try exact match (fast)
  const exactMatches = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (exactMatches.length > 0) {
    return exactMatches;
  }

  // Step 2: Try fuzzy match (slower)
  return products.filter(p =>
    fuzzyMatch(searchTerm, p.name, 0.6)
  );
}
```

---

## 🚀 Future Enhancements

### 1. Server-Side Fuzzy Search

Implement fuzzy search in the API for better performance with large datasets:

```typescript
// API Route: /api/products/search
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  // Use PostgreSQL pg_trgm extension for fuzzy search
  const { data } = await supabase
    .from('products')
    .select('*')
    .textSearch('name', query, {
      type: 'websearch',
      config: 'english',
    });

  return Response.json(data);
}
```

### 2. Search History

Track and suggest recent searches:

```typescript
interface SearchHistory {
  term: string;
  timestamp: Date;
  resultsCount: number;
}

function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistory[]>([]);

  const addSearch = (term: string, resultsCount: number) => {
    setHistory(prev => [
      { term, timestamp: new Date(), resultsCount },
      ...prev.slice(0, 9), // Keep last 10
    ]);
  };

  return { history, addSearch };
}
```

### 3. Search Analytics

Track popular searches and no-result searches:

```typescript
interface SearchAnalytics {
  term: string;
  count: number;
  hasResults: boolean;
}

// Track in analytics system
trackSearch(searchTerm, results.length > 0);
```

### 4. Autocomplete

Suggest results as user types:

```typescript
function AutocompleteSearch() {
  const [suggestions, setSuggestions] = useState<Product[]>([]);

  const handleSearch = useDebouncedCallback((term: string) => {
    const matches = products
      .filter(p => fuzzyMatch(term, p.name, 0.7))
      .slice(0, 5);
    setSuggestions(matches);
  }, 200);

  return (
    <div>
      <input onChange={(e) => handleSearch(e.target.value)} />
      <div>
        {suggestions.map(s => (
          <div key={s.id}>{s.name}</div>
        ))}
      </div>
    </div>
  );
}
```

---

## ✅ Checklist

- [x] Implement fuzzy search algorithm (Levenshtein distance)
- [x] Create fuzzy search utilities
- [x] Build AdvancedFilter component
- [x] Create useAdvancedSearch hook
- [x] Build enhanced SearchInput component
- [x] Add TypeScript types
- [x] Write comprehensive documentation
- [x] Add usage examples

---

**Created by:** Claude Code
**Date:** 2025-11-29
**Status:** ✅ Complete
