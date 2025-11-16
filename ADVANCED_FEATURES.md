# Advanced Features & Utilities

ฟีเจอร์ขั้นสูงสำหรับ Order Items Management System

## 📚 Table of Contents

1. [Toast Notifications](#toast-notifications)
2. [Confirmation Dialogs](#confirmation-dialogs)
3. [Keyboard Shortcuts](#keyboard-shortcuts)
4. [Retry Logic](#retry-logic)
5. [Bulk Operations](#bulk-operations)
6. [Search & Filter](#search--filter)
7. [Export & Print](#export--print)
8. [Hooks Reference](#hooks-reference)

---

## 🔔 Toast Notifications

Display success/error feedback to users.

### Usage

```typescript
import { useToast } from '@/lib/hooks/useToast';

export default function MyComponent() {
  const { success, error, warning, info } = useToast();

  const handleAction = async () => {
    try {
      await someOperation();
      success('Operation successful!');
    } catch (err) {
      error('Something went wrong');
    }
  };

  return <button onClick={handleAction}>Do something</button>;
}
```

### Toast Types

- **success** - Green background, check icon (4 sec duration)
- **error** - Red background, alert icon (5 sec duration)
- **warning** - Yellow background, alert triangle (4 sec duration)
- **info** - Blue background, info icon (4 sec duration)

### API

```typescript
toast(message: string, type?: ToastType, duration?: number): string
success(message: string, duration?: number): string
error(message: string, duration?: number): string
warning(message: string, duration?: number): string
info(message: string, duration?: number): string
dismiss(id: string): void
dismissAll(): void
```

---

## ✅ Confirmation Dialogs

Beautiful confirmation dialogs instead of native confirm().

### Usage

```typescript
import { useState } from 'react';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = () => {
    // Do dangerous operation
    setIsOpen(false);
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Delete Item</button>

      <ConfirmDialog
        isOpen={isOpen}
        title="Delete Item"
        message="Are you sure? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDangerous={true}
        onConfirm={handleConfirm}
        onCancel={() => setIsOpen(false)}
      />
    </>
  );
}
```

### Props

- `isOpen` - Show/hide dialog
- `title` - Dialog title
- `message` - Dialog message
- `confirmLabel` - Confirm button text (default: "ยืนยัน")
- `cancelLabel` - Cancel button text (default: "ยกเลิก")
- `isDangerous` - Show red styling (default: false)
- `loading` - Disable buttons (default: false)
- `onConfirm` - Confirm callback
- `onCancel` - Cancel callback

---

## ⌨️ Keyboard Shortcuts

Add keyboard shortcuts to your application.

### Usage

```typescript
import { useKeyboardShortcuts, SHORTCUTS } from '@/lib/hooks/useKeyboardShortcuts';

export default function MyComponent() {
  const handleDelete = () => console.log('Delete');
  const handleSave = () => console.log('Save');

  useKeyboardShortcuts({
    [SHORTCUTS.CTRL_D]: handleDelete,
    [SHORTCUTS.CTRL_S]: handleSave,
    'ctrl+p': () => window.print(),
  });

  return <div>Press Ctrl+D, Ctrl+S, or Ctrl+P</div>;
}
```

### Predefined Shortcuts

```
CTRL_S     → ctrl+s (Save)
CTRL_N     → ctrl+n (New)
CTRL_E     → ctrl+e (Export)
CTRL_P     → ctrl+p (Print)
CTRL_D     → ctrl+d (Delete)
ESCAPE     → escape (Close/Cancel)
ENTER      → enter (Confirm)
DELETE     → delete (Delete key)
PLUS       → + (Increase)
MINUS      → - (Decrease)
SLASH      → / (Focus search)
```

### Create Custom Shortcuts

```typescript
useKeyboardShortcuts({
  'ctrl+shift+a': handleAction,      // Ctrl+Shift+A
  'alt+d': handleDelete,             // Alt+D
  'shift+enter': handleSpecial,      // Shift+Enter
});
```

---

## 🔄 Retry Logic

Automatic retry with exponential backoff for failed operations.

### useRetry Hook

```typescript
import { useRetry } from '@/lib/hooks/useRetry';

export default function MyComponent() {
  const { execute, isLoading, error, attempt, isRetrying } = useRetry({
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    shouldRetry: (error) => error.status >= 500,
  });

  const handleOperation = async () => {
    const result = await execute(async () => {
      const res = await fetch('/api/some-endpoint');
      return res.json();
    });
  };

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {isRetrying && <p>Retrying... Attempt {attempt}</p>}
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```

### retryApiCall Utility

```typescript
import { retryApiCall } from '@/lib/utils/api-retry';

// Retry fetch with 3 attempts, 1s initial delay
const data = await retryApiCall(
  () => fetch('/api/endpoint'),
  3,        // maxAttempts
  1000,     // initialDelay in ms
  2         // backoffMultiplier
);
```

### Delay Calculation

```
Attempt 1: 0ms (immediate)
Attempt 2: 1000ms (1s)
Attempt 3: 2000ms (2s)
Attempt 4: 4000ms (4s)
Attempt 5: 8000ms (8s) - capped at maxDelay
```

---

## 📦 Bulk Operations

Perform actions on multiple items at once.

### Bulk Update Quantities

```typescript
import { bulkUpdateQuantities } from '@/lib/utils/bulk-operations';

const updates = [
  { itemId: 'item-1', quantity: 5 },
  { itemId: 'item-2', quantity: 10 },
];

const result = await bulkUpdateQuantities('order-123', updates);
// result.updatedCount = 2
// result.failedCount = 0
// result.success = true
```

### Bulk Delete

```typescript
import { bulkDeleteItems } from '@/lib/utils/bulk-operations';

const result = await bulkDeleteItems('order-123', [
  'item-1',
  'item-2',
  'item-3',
]);
```

### Apply Discount

```typescript
import { applyDiscountToItems } from '@/lib/utils/bulk-operations';

// Apply 20% discount to all items
const updates = applyDiscountToItems(items, 20);
// Update specific items only
const updates = applyDiscountToItems(items, 20, ['item-1', 'item-3']);
```

### Increase/Decrease Quantities

```typescript
import {
  increaseQuantities,
  decreaseQuantities,
  setQuantityForAll,
} from '@/lib/utils/bulk-operations';

// Increase all quantities by 5
const increases = increaseQuantities(items, 5);

// Decrease all by 2 (minimum 1)
const decreases = decreaseQuantities(items, 2);

// Set all to 10
const setAll = setQuantityForAll(items, 10);
```

### BulkOperationResult

```typescript
interface BulkOperationResult {
  success: boolean;
  updatedCount: number;   // Number of successful operations
  failedCount: number;    // Number of failed operations
  errors: Array<{
    itemId: string;
    error: string;        // Error message
  }>;
}
```

---

## 🔍 Search & Filter

Search and filter data with fuzzy matching.

### useSearch Hook (Fuzzy Matching)

```typescript
import { useSearch } from '@/lib/hooks/useSearch';

export default function ItemSearch() {
  const { searchTerm, setSearchTerm, results } = useSearch(items, {
    keys: ['productName', 'productId'],
    threshold: 0.6,  // 0-1, lower = more lenient
    caseSensitive: false,
  });

  return (
    <>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search items..."
      />
      {results.map((item) => (
        <div key={item.id}>{item.productName}</div>
      ))}
    </>
  );
}
```

### useSimpleFilter Hook (Exact Match)

```typescript
import { useSimpleFilter } from '@/lib/hooks/useSearch';

export default function ItemFilter() {
  const { searchTerm, setSearchTerm, results } = useSimpleFilter(
    items,
    (item, searchTerm) =>
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productId.includes(searchTerm)
  );

  return (
    <>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {results.map((item) => (
        <div key={item.id}>{item.productName}</div>
      ))}
    </>
  );
}
```

### Return Values

```typescript
{
  searchTerm: string;               // Current search term
  setSearchTerm: (term: string) => void;
  results: T[];                     // Filtered results
  isSearching: boolean;             // Is searching?
  clearSearch: () => void;          // Clear search
  searchInField?: (term, field, threshold?) => boolean; // useSearch only
}
```

---

## 💾 Export & Print

Export order items to different formats.

### CSV Export

```typescript
import { exportOrderItemsToCSV } from '@/lib/utils/export';

// Download as CSV
exportOrderItemsToCSV(items, 'order-123');
```

**CSV includes:**
- Item number, name, price, quantity
- Discount, total, notes
- Summary with totals

### Print

```typescript
import { printOrderItems } from '@/lib/utils/export';

// Open print dialog
printOrderItems(items, 'order-123');
```

**Print includes:**
- Header with order ID and date
- Formatted table with all items
- Summary section with totals
- Thai date/time formatting

### JSON Export

```typescript
import { exportOrderItemsToJSON } from '@/lib/utils/export';

exportOrderItemsToJSON(items, 'order-123');
```

---

## 🪝 Hooks Reference

### All Available Hooks

```typescript
// State Management
import { useOrderItems } from '@/lib/hooks/useOrderItems';
import { useToast } from '@/lib/hooks/useToast';

// Search & Filter
import { useSearch, useSimpleFilter } from '@/lib/hooks/useSearch';

// Keyboard
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';

// Async & Retry
import { useRetry } from '@/lib/hooks/useRetry';
```

### useOrderItems

Complete order items management:

```typescript
const {
  items,                    // OrderItem[]
  loading,                  // boolean
  error,                    // string | null
  addItem,                  // (pid, name, qty, price) => Promise<bool>
  updateItemQuantity,       // (id, qty) => Promise<bool>
  updateItem,               // (id, qty?, price?) => Promise<bool>
  deleteItem,               // (id) => Promise<bool>
  fetchItems,               // (orderId) => Promise<void>
  refresh,                  // (orderId?) => Promise<void>
} = useOrderItems(orderId);
```

---

## 🎯 Common Patterns

### Pattern 1: Add with Retry

```typescript
const { execute } = useRetry();
const { addItem } = useOrderItems(orderId);
const { success, error } = useToast();

const addWithRetry = async () => {
  const result = await execute(() =>
    fetch('/api/orders/order-id/items', {
      method: 'POST',
      body: JSON.stringify({...}),
    })
  );

  if (result) success('Added!');
  else error('Failed to add');
};
```

### Pattern 2: Bulk Operations with Feedback

```typescript
const { success, error } = useToast();

const handleBulkUpdate = async () => {
  const result = await bulkUpdateQuantities(orderId, updates);

  success(`Updated ${result.updatedCount} items`);
  if (result.failedCount > 0) {
    error(`Failed to update ${result.failedCount} items`);
  }
};
```

### Pattern 3: Search + Filter

```typescript
const { searchTerm, setSearchTerm, results } = useSearch(items, {
  keys: ['productName', 'notes'],
});

// Then filter by other criteria
const filtered = results.filter(
  (item) => item.quantity > 0 && !item.notes?.includes('removed')
);
```

### Pattern 4: Keyboard Shortcuts

```typescript
useKeyboardShortcuts({
  [SHORTCUTS.CTRL_S]: () => saveOrder(),
  [SHORTCUTS.CTRL_P]: () => printItems(),
  'ctrl+shift+d': () => deleteAllItems(),
});
```

---

## ✨ Best Practices

1. **Always use toast for feedback** - Users should know if operation succeeded
2. **Use retry for network operations** - Improve reliability
3. **Confirm before delete** - Use ConfirmDialog for destructive actions
4. **Use keyboard shortcuts** - Power users appreciate them
5. **Batch similar operations** - Use bulk operations instead of loops
6. **Clear search on navigation** - Don't confuse users with filtered data

---

## 🐛 Troubleshooting

### Toast not showing
- Check that ToastProvider wraps your app
- Toast component is in your layout

### Retry not working
- Verify network error detection
- Check maxAttempts value
- Monitor browser console for errors

### Bulk operations failing silently
- Check result.errors array
- Verify item IDs are correct
- Check server logs

### Keyboard shortcuts not working
- Avoid conflicts with browser shortcuts
- Check if component is mounted
- Verify key combinations are correct

---

## 📊 Performance Tips

1. **Batch operations** - Use bulk operations instead of loops
2. **Debounce search** - Use useSearch with debounce for large datasets
3. **Memoize callbacks** - Wrap keyboard handlers with useCallback
4. **Lazy load** - Don't fetch all data upfront
5. **Pagination** - For large lists, use pagination instead of showing all

---

## 🚀 Examples

See the actual usage in:
- `components/orders/OrderItemsManager.tsx`
- `components/orders/CartSummary.tsx`
- `components/orders/AddItemModal.tsx`

All components use these utilities and hooks.

---

## 💪 Future Enhancements

- [ ] Undo/Redo functionality
- [ ] Real-time collaboration
- [ ] Analytics integration
- [ ] Advanced filtering UI
- [ ] Batch import from CSV
- [ ] Integration with backend events
