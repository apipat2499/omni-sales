'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SETTINGS_NAVIGATION = [
  { name: 'Overview', href: '/admin/settings', exact: true },
  { name: 'Store', href: '/admin/settings/store' },
  { name: 'Payment', href: '/admin/settings/payment' },
  { name: 'Products', href: '/admin/settings/products' },
  { name: 'Categories', href: '/admin/settings/categories' },
  { name: 'Shipping', href: '/admin/settings/shipping' },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Settings Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-8 overflow-x-auto">
            {SETTINGS_NAVIGATION.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  isActive(item.href, item.exact)
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Settings Content */}
      <main>{children}</main>
    </div>
  );
}
