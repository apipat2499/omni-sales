interface StatusBadgeProps {
  status: 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  size?: 'sm' | 'md' | 'lg';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const statusConfig = {
    new: {
      label: 'ใหม่',
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    },
    processing: {
      label: 'กำลังดำเนินการ',
      color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    },
    shipped: {
      label: 'จัดส่งแล้ว',
      color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    },
    delivered: {
      label: 'สำเร็จ',
      color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
    },
    cancelled: {
      label: 'ยกเลิก',
      color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
    },
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ${config.color} ${sizeClasses[size]}`}
    >
      {config.label}
    </span>
  );
}
