import { cn } from '@/lib/utils';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  indeterminate?: boolean;
  disabled?: boolean;
  label?: string;
  className?: string;
  id?: string;
}

export default function Checkbox({
  checked,
  onChange,
  indeterminate = false,
  disabled = false,
  label,
  className,
  id,
}: CheckboxProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          ref={(input) => {
            if (input) {
              input.indeterminate = indeterminate;
            }
          }}
          className={cn(
            'h-4 w-4 rounded border-gray-300 dark:border-gray-600',
            'text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-colors duration-150 cursor-pointer',
            'dark:bg-gray-700 dark:checked:bg-blue-600'
          )}
        />
      </div>
      {label && (
        <label
          htmlFor={id}
          className={cn(
            'text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {label}
        </label>
      )}
    </div>
  );
}
