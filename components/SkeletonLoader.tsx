'use client';

interface SkeletonLoaderProps {
  count?: number;
  type?: 'text' | 'card' | 'table-row' | 'circle' | 'rectangle';
  className?: string;
  height?: string;
  width?: string;
}

export default function SkeletonLoader({
  count = 1,
  type = 'text',
  className = '',
  height = 'h-4',
  width = 'w-full',
}: SkeletonLoaderProps) {
  const getSkeletonType = (skeletonType: string) => {
    switch (skeletonType) {
      case 'circle':
        return (
          <div
            className={`${height} ${width} bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse`}
          />
        );
      case 'rectangle':
        return (
          <div
            className={`${height} ${width} bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse`}
          />
        );
      case 'card':
        return (
          <div className={`${className} bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3`}>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
          </div>
        );
      case 'table-row':
        return (
          <div className={`${className} flex gap-4 p-4 border-b border-gray-200 dark:border-gray-700`}>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1 animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1 animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1 animate-pulse" />
          </div>
        );
      case 'text':
      default:
        return (
          <div
            className={`${height} ${width} bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{getSkeletonType(type)}</div>
      ))}
    </div>
  );
}

/**
 * Skeleton components for common layouts
 */

export function TableSkeletonLoader({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1 animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1 animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1 animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0 w-20 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeletonLoader({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3 border border-gray-200 dark:border-gray-700"
        >
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5 animate-pulse" />
          </div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function ListSkeletonLoader({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-600 rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/3 animate-pulse" />
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/4 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ModalSkeletonLoader() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
      </div>

      {/* Content */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-3">
        <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    </div>
  );
}
