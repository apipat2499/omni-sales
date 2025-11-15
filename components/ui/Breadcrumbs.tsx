'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href: string;
}

const PATH_LABELS: Record<string, string> = {
  '': 'หน้าหลัก',
  'products': 'สินค้า',
  'orders': 'คำสั่งซื้อ',
  'customers': 'ลูกค้า',
  'discounts': 'ส่วนลด',
  'analytics': 'Analytics',
  'reports': 'รายงาน',
  'settings': 'ตั้งค่า',
};

export default function Breadcrumbs() {
  const pathname = usePathname();

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'หน้าหลัก', href: '/' },
    ];

    let currentPath = '';
    paths.forEach((path, index) => {
      currentPath += `/${path}`;

      // Skip if it's a dynamic route (numeric ID)
      if (/^\d+$/.test(path)) {
        return;
      }

      const label = PATH_LABELS[path] || path.charAt(0).toUpperCase() + path.slice(1);
      breadcrumbs.push({
        label,
        href: currentPath,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumbs on home page
  if (pathname === '/') {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.href} className="flex items-center">
          {index > 0 && (
            <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
          )}
          {index === breadcrumbs.length - 1 ? (
            // Current page - not a link
            <span className="font-medium text-gray-900 dark:text-white">
              {crumb.label}
            </span>
          ) : (
            // Previous pages - links
            <Link
              href={crumb.href}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
            >
              {index === 0 && <Home className="h-4 w-4" />}
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
