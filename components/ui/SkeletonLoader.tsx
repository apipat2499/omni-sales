'use client';

interface SkeletonLoaderProps {
  count?: number;
  type?: 'card' | 'table' | 'list';
}

function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20" />
        </div>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            {[1, 2, 3, 4, 5].map((i) => (
              <th key={i} className="px-6 py-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24 animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {[1, 2, 3, 4, 5].map((row) => (
            <tr key={row}>
              {[1, 2, 3, 4, 5].map((col) => (
                <td key={col} className="px-6 py-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              </div>
              <div className="grid grid-cols-4 gap-4 mt-4">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="space-y-2">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SkeletonLoader({ count = 3, type = 'card' }: SkeletonLoaderProps) {
  if (type === 'table') {
    return <TableSkeleton />;
  }

  if (type === 'list') {
    return <ListSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
