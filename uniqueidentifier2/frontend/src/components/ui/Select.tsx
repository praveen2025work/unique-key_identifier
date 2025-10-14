import React, { SelectHTMLAttributes } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: SelectOption[];
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      options,
      label,
      error,
      hint,
      icon,
      size = 'md',
      variant = 'default',
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'px-2.5 py-1.5 text-xs',
      md: 'px-3 py-2 text-sm',
      lg: 'px-4 py-3 text-base',
    };

    const variantClasses = {
      default: 'border-gray-300 focus:border-primary focus:ring-primary',
      success: 'border-green-400 focus:border-green-500 focus:ring-green-500 bg-green-50',
      error: 'border-red-400 focus:border-red-500 focus:ring-red-500 bg-red-50',
      warning: 'border-yellow-400 focus:border-yellow-500 focus:ring-yellow-500 bg-yellow-50',
      info: 'border-blue-400 focus:border-blue-500 focus:ring-blue-500 bg-blue-50',
    };

    const baseClasses = `
      w-full
      border-2
      rounded-lg
      transition-all
      duration-200
      focus:outline-none
      focus:ring-2
      focus:ring-offset-1
      disabled:bg-gray-100
      disabled:cursor-not-allowed
      disabled:opacity-60
      appearance-none
      bg-white
      cursor-pointer
      shadow-sm
      hover:shadow-md
      font-medium
      ${sizeClasses[size]}
      ${error ? variantClasses.error : variantClasses[variant]}
      ${icon ? 'pl-10' : ''}
      ${className}
    `;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
              {icon}
            </div>
          )}
          <select
            ref={ref}
            disabled={disabled}
            className={baseClasses}
            {...props}
          >
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <ChevronDownIcon className="w-5 h-5 text-gray-500" />
          </div>
        </div>
        {hint && !error && (
          <p className="mt-1 text-xs text-gray-500">{hint}</p>
        )}
        {error && (
          <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;

