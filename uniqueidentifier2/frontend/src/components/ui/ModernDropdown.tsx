'use client'

import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDownIcon, 
  CheckIcon, 
  MagnifyingGlassIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

export interface DropdownOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  description?: string;
  badge?: string;
}

interface ModernDropdownProps {
  options: DropdownOption[];
  value?: string | number | (string | number)[];
  onChange: (value: string | number | (string | number)[]) => void;
  label?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  searchable?: boolean;
  multiple?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  disabled?: boolean;
  className?: string;
  maxHeight?: string;
  icon?: React.ReactNode;
  clearable?: boolean;
}

const ModernDropdown: React.FC<ModernDropdownProps> = ({
  options,
  value,
  onChange,
  label,
  error,
  hint,
  placeholder = 'Select an option...',
  searchable = false,
  multiple = false,
  size = 'md',
  variant = 'default',
  disabled = false,
  className = '',
  maxHeight = '300px',
  icon,
  clearable = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  const variantClasses = {
    default: 'border-gray-300 focus-within:border-indigo-500 focus-within:ring-indigo-500',
    success: 'border-green-400 focus-within:border-green-500 focus-within:ring-green-500 bg-green-50',
    error: 'border-red-400 focus-within:border-red-500 focus-within:ring-red-500 bg-red-50',
    warning: 'border-yellow-400 focus-within:border-yellow-500 focus-within:ring-yellow-500 bg-yellow-50',
    info: 'border-blue-400 focus-within:border-blue-500 focus-within:ring-blue-500 bg-blue-50',
  };

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected option(s)
  const getSelectedOptions = () => {
    if (multiple && Array.isArray(value)) {
      return options.filter(opt => value.includes(opt.value));
    }
    return options.find(opt => opt.value === value);
  };

  const selectedOptions = getSelectedOptions();

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Reset highlighted index when filtered options change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchTerm]);

  // Handle option selection
  const handleSelect = (optionValue: string | number) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter(v => v !== optionValue)
        : [...currentValues, optionValue];
      onChange(newValues);
    } else {
      onChange(optionValue);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  // Handle clear
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(multiple ? [] : '');
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex].value);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Tab':
        setIsOpen(false);
        setSearchTerm('');
        break;
    }
  };

  // Render selected value display
  const renderSelectedDisplay = () => {
    if (multiple && Array.isArray(selectedOptions) && selectedOptions.length > 0) {
      return (
        <div className="flex flex-wrap gap-1">
          {selectedOptions.map((option: DropdownOption) => (
            <span
              key={option.value}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium"
            >
              {option.icon && <span className="w-3 h-3">{option.icon}</span>}
              {option.label}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(option.value);
                }}
                className="hover:bg-indigo-200 rounded-full p-0.5"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      );
    }

    if (!multiple && selectedOptions && typeof selectedOptions === 'object' && !Array.isArray(selectedOptions)) {
      const option = selectedOptions as DropdownOption;
      return (
        <div className="flex items-center gap-2">
          {option.icon && <span className="w-4 h-4">{option.icon}</span>}
          <span className="truncate">{option.label}</span>
          {option.badge && (
            <span className="ml-auto px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs">
              {option.badge}
            </span>
          )}
        </div>
      );
    }

    return <span className="text-gray-400">{placeholder}</span>;
  };

  const hasValue = multiple 
    ? Array.isArray(value) && value.length > 0 
    : value !== undefined && value !== null && value !== '';

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={`
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
            bg-white
            cursor-pointer
            shadow-sm
            hover:shadow-md
            font-medium
            text-left
            ${sizeClasses[size]}
            ${error ? variantClasses.error : variantClasses[variant]}
            ${icon ? 'pl-10' : ''}
            ${isOpen ? 'ring-2' : ''}
          `}
        >
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              {icon}
            </div>
          )}
          
          <div className="flex items-center justify-between pr-8">
            {renderSelectedDisplay()}
          </div>

          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {clearable && hasValue && !disabled && (
              <button
                onClick={handleClear}
                className="p-0.5 hover:bg-gray-200 rounded-full transition-colors"
              >
                <XMarkIcon className="w-4 h-4 text-gray-500" />
              </button>
            )}
            <ChevronDownIcon 
              className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                isOpen ? 'transform rotate-180' : ''
              }`} 
            />
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div 
            className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl overflow-hidden animate-fade-in"
            style={{ maxHeight }}
          >
            {searchable && (
              <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            <div className="overflow-y-auto" style={{ maxHeight: searchable ? `calc(${maxHeight} - 60px)` : maxHeight }}>
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-6 text-center text-gray-500 text-sm">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option, index) => {
                  const isSelected = multiple && Array.isArray(value)
                    ? value.includes(option.value)
                    : value === option.value;
                  
                  const isHighlighted = index === highlightedIndex;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => !option.disabled && handleSelect(option.value)}
                      disabled={option.disabled}
                      className={`
                        w-full px-3 py-2.5 text-left flex items-center justify-between
                        transition-colors duration-150
                        ${isHighlighted ? 'bg-indigo-50' : ''}
                        ${isSelected ? 'bg-indigo-100 text-indigo-900' : 'text-gray-900'}
                        ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-50 cursor-pointer'}
                      `}
                      onMouseEnter={() => setHighlightedIndex(index)}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {option.icon && (
                          <span className="w-4 h-4 flex-shrink-0">{option.icon}</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-medium text-sm">
                            {option.label}
                          </div>
                          {option.description && (
                            <div className="truncate text-xs text-gray-500 mt-0.5">
                              {option.description}
                            </div>
                          )}
                        </div>
                        {option.badge && (
                          <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-medium flex-shrink-0">
                            {option.badge}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <CheckIcon className="w-5 h-5 text-indigo-600 flex-shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {hint && !error && (
        <p className="mt-1 text-xs text-gray-500">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
};

export default ModernDropdown;
