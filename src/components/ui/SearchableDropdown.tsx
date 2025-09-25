import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

interface SearchableDropdownOption {
  id: number | string;
  label: string;
  value: string;
  subtitle?: string;
}

interface SearchableDropdownProps {
  options: SearchableDropdownOption[];
  value: string | number | '';
  onChange: (value: string | number | '') => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  className = "",
  disabled = false
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (option.subtitle && option.subtitle.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get the selected option
  const selectedOption = options.find(option => option.id === value);

  // Handle option selection
  const handleSelect = (option: SearchableDropdownOption) => {
    onChange(option.id);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  // Handle clear selection
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        searchInputRef.current?.focus();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Reset highlighted index when search term changes
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchTerm]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          w-full px-3 py-2 text-left border rounded-lg
          bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
          border-gray-300 dark:border-gray-700
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-between
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        `}
      >
        <span className={selectedOption ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}>
          {selectedOption ? (
            <div>
              <div className="font-medium">{selectedOption.label}</div>
              {selectedOption.subtitle && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedOption.subtitle}
                </div>
              )}
            </div>
          ) : (
            placeholder
          )}
        </span>
        <div className="flex items-center space-x-2">
          {selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`
                    w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700
                    focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700
                    ${index === highlightedIndex ? 'bg-gray-100 dark:bg-gray-700' : ''}
                    ${option.id === value ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                  `}
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {option.label}
                  </div>
                  {option.subtitle && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {option.subtitle}
                    </div>
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                {searchTerm ? 'No users found' : 'No users available'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
