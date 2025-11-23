'use client';

import Link from 'next/link';

const SETTINGS_SECTIONS = [
  {
    title: 'Store Settings',
    description: 'Manage your store name, description, and branding',
    icon: '🏪',
    href: '/admin/settings/store',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    title: 'Payment Settings',
    description: 'Configure bank account and payment information',
    icon: '💳',
    href: '/admin/settings/payment',
    color: 'bg-green-50 text-green-600',
  },
  {
    title: 'Products Management',
    description: 'Add, edit, and manage your product catalog',
    icon: '📦',
    href: '/admin/settings/products',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    title: 'Categories',
    description: 'Manage product categories and organization',
    icon: '🏷️',
    href: '/admin/settings/categories',
    color: 'bg-yellow-50 text-yellow-600',
  },
  {
    title: 'Shipping Settings',
    description: 'Configure shipping methods and costs',
    icon: '🚚',
    href: '/admin/settings/shipping',
    color: 'bg-red-50 text-red-600',
  },
];

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your store settings and configurations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SETTINGS_SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${section.color} mb-4`}>
              <span className="text-2xl">{section.icon}</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{section.title}</h2>
            <p className="text-gray-600 text-sm">{section.description}</p>
            <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
              Configure
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">1</div>
            <div className="text-sm text-gray-600 mt-1">Store Configured</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">1</div>
            <div className="text-sm text-gray-600 mt-1">Payment Method</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">8</div>
            <div className="text-sm text-gray-600 mt-1">Products</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">4</div>
            <div className="text-sm text-gray-600 mt-1">Categories</div>
          </div>
        </div>
      </div>
    </div>
  );
}
