import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('th-TH').format(num);
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    processing: 'bg-blue-100 text-blue-800 border-blue-200',
    shipped: 'bg-purple-100 text-purple-800 border-purple-200',
    delivered: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}

export function getChannelColor(channel: string): string {
  const colors: Record<string, string> = {
    online: 'bg-blue-100 text-blue-800 border-blue-200',
    offline: 'bg-green-100 text-green-800 border-green-200',
    mobile: 'bg-purple-100 text-purple-800 border-purple-200',
    phone: 'bg-orange-100 text-orange-800 border-orange-200',
  };
  return colors[channel] || 'bg-gray-100 text-gray-800 border-gray-200';
}

export function getTagColor(tag: string): string {
  const colors: Record<string, string> = {
    vip: 'bg-amber-100 text-amber-800 border-amber-200',
    regular: 'bg-gray-100 text-gray-800 border-gray-200',
    new: 'bg-green-100 text-green-800 border-green-200',
    wholesale: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  };
  return colors[tag] || 'bg-gray-100 text-gray-800 border-gray-200';
}

export function isLowStock(stock: number): boolean {
  return stock < 10;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
