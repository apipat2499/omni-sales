'use client';

import { useState, useEffect } from 'react';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

interface WhatsAppPhoneInputProps {
  value: string;
  onChange: (value: string, isValid: boolean) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  required?: boolean;
  defaultCountry?: string;
  className?: string;
}

export function WhatsAppPhoneInput({
  value,
  onChange,
  placeholder = 'เบอร์โทรศัพท์',
  label = 'หมายเลข WhatsApp',
  error,
  required = false,
  defaultCountry = 'TH',
  className = '',
}: WhatsAppPhoneInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [isValid, setIsValid] = useState(false);
  const [formatted, setFormatted] = useState('');

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Validate phone number
    try {
      const valid = isValidPhoneNumber(newValue, defaultCountry);
      setIsValid(valid);

      if (valid) {
        const phoneNumber = parsePhoneNumber(newValue, defaultCountry);
        const formattedNumber = phoneNumber.formatInternational();
        setFormatted(formattedNumber);
        onChange(phoneNumber.number, true);
      } else {
        setFormatted('');
        onChange(newValue, false);
      }
    } catch (err) {
      setIsValid(false);
      setFormatted('');
      onChange(newValue, false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
          </svg>
        </div>

        <input
          type="tel"
          value={inputValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={`
            block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm
            focus:ring-2 focus:ring-green-500 focus:border-green-500
            ${error ? 'border-red-300' : isValid ? 'border-green-300' : 'border-gray-300'}
            ${error ? 'focus:ring-red-500 focus:border-red-500' : ''}
            dark:bg-gray-800 dark:border-gray-600 dark:text-white
          `}
        />

        {isValid && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        )}
      </div>

      {formatted && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          รูปแบบ: {formatted}
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {!error && !isValid && inputValue && (
        <p className="text-sm text-orange-600 dark:text-orange-400">
          กรุณากรอกหมายเลขโทรศัพท์ให้ถูกต้อง
        </p>
      )}
    </div>
  );
}
