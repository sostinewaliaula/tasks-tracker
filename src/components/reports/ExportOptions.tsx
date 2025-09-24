import React, { useState, useRef, useEffect } from 'react';
import { DownloadIcon, ChevronDownIcon, CalendarIcon, FilterIcon, CheckIcon } from 'lucide-react';

type ExportOptionsProps = {
  tasks: any[];
  onExport: (data: any[], format: string, dateRange: string, statuses: string[]) => void;
};

export function ExportOptions({ tasks, onExport }: ExportOptionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['todo', 'in-progress', 'completed', 'blocker']);
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [quickExportDropdown, setQuickExportDropdown] = useState<{
    isOpen: boolean;
    dateType: 'today' | 'week' | 'month' | null;
  }>({ isOpen: false, dateType: null });

  const advancedExportRef = useRef<HTMLDivElement>(null);
  const quickExportRef = useRef<HTMLDivElement>(null);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (advancedExportRef.current && !advancedExportRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (quickExportRef.current && !quickExportRef.current.contains(event.target as Node)) {
        setQuickExportDropdown({ isOpen: false, dateType: null });
      }
    }

    if (isOpen || quickExportDropdown.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, quickExportDropdown.isOpen]);

  const statusOptions = [
    { value: 'todo', label: 'To Do', color: 'bg-gray-100 text-gray-800' },
    { value: 'in-progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'blocker', label: 'Blocked', color: 'bg-red-100 text-red-800' }
  ];

  const handleStatusToggle = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const getDateRange = (type: 'today' | 'week' | 'month' | 'custom') => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (type) {
      case 'today':
        return {
          from: today.toISOString().split('T')[0],
          to: today.toISOString().split('T')[0],
          label: 'Today'
        };
      case 'week':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
        return {
          from: startOfWeek.toISOString().split('T')[0],
          to: endOfWeek.toISOString().split('T')[0],
          label: 'This Week'
        };
      case 'month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
          from: startOfMonth.toISOString().split('T')[0],
          to: endOfMonth.toISOString().split('T')[0],
          label: 'This Month'
        };
      case 'custom':
        return {
          from: customDateFrom,
          to: customDateTo,
          label: customDateFrom && customDateTo ? `${customDateFrom} to ${customDateTo}` : 'Custom Range'
        };
      default:
        return { from: '', to: '', label: 'All Time' };
    }
  };

  const handleQuickExportClick = (dateType: 'today' | 'week' | 'month') => {
    setQuickExportDropdown({ isOpen: true, dateType });
    setIsOpen(false); // Close advanced export dropdown if open
  };

  const handleQuickExportConfirm = (format: string) => {
    if (!quickExportDropdown.dateType) return;
    
    const dateRange = getDateRange(quickExportDropdown.dateType);
    
    // Filter tasks based on selected statuses and date range
    const filteredTasks = tasks.filter(task => {
      const statusMatch = selectedStatuses.includes(task.status);
      const dateMatch = !dateRange.from || !dateRange.to || (
        new Date(task.createdAt) >= new Date(dateRange.from) &&
        new Date(task.createdAt) <= new Date(dateRange.to)
      );
      return statusMatch && dateMatch;
    });

    onExport(filteredTasks, format, `${dateRange.from} to ${dateRange.to}`, selectedStatuses);
    setQuickExportDropdown({ isOpen: false, dateType: null });
  };

  const handleQuickExport = (format: string, dateType: 'today' | 'week' | 'month' | 'custom') => {
    const dateRange = getDateRange(dateType);
    
    if (dateType === 'custom' && (!customDateFrom || !customDateTo)) {
      alert('Please select both start and end dates for custom range');
      return;
    }

    // Filter tasks based on selected statuses and date range
    const filteredTasks = tasks.filter(task => {
      const statusMatch = selectedStatuses.includes(task.status);
      const dateMatch = !dateRange.from || !dateRange.to || (
        new Date(task.createdAt) >= new Date(dateRange.from) &&
        new Date(task.createdAt) <= new Date(dateRange.to)
      );
      return statusMatch && dateMatch;
    });

    onExport(filteredTasks, format, `${dateRange.from} to ${dateRange.to}`, selectedStatuses);
    setIsOpen(false);
    setQuickExportDropdown({ isOpen: false, dateType: null });
  };

  return (
    <div className="flex items-center space-x-3">
      {/* Quick Export Dropdown */}
      <div className="relative inline-block text-left" ref={quickExportRef}>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          onClick={() => setQuickExportDropdown({ isOpen: !quickExportDropdown.isOpen, dateType: null })}
        >
          <CalendarIcon className="h-4 w-4 mr-2" />
          Quick Export
          <ChevronDownIcon className="h-4 w-4 ml-2" />
        </button>

        {quickExportDropdown.isOpen && (
          <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-xl shadow-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 z-50">
            <div className="p-4">
              {/* Time Period Selection */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Select Time Period</h3>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setQuickExportDropdown({ isOpen: true, dateType: 'today' })}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      quickExportDropdown.dateType === 'today'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setQuickExportDropdown({ isOpen: true, dateType: 'week' })}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      quickExportDropdown.dateType === 'week'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => setQuickExportDropdown({ isOpen: true, dateType: 'month' })}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      quickExportDropdown.dateType === 'month'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Month
                  </button>
                </div>
              </div>

              {/* Status Filters */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center">
                    <FilterIcon className="h-4 w-4 mr-2" />
                    Filter by Status
                  </h3>
                  <button
                    onClick={() => setSelectedStatuses(statusOptions.map(s => s.value))}
                    className="text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                  >
                    Select All
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {statusOptions.map(status => (
                    <label key={status.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes(status.value)}
                        onChange={() => handleStatusToggle(status.value)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Export Format Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => handleQuickExport('PDF', quickExportDropdown.dateType || 'today')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Export as PDF
                </button>
                <button
                  onClick={() => handleQuickExport('Word', quickExportDropdown.dateType || 'today')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Export as Word
                </button>
                <button
                  onClick={() => handleQuickExport('Excel', quickExportDropdown.dateType || 'today')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Export as Excel
                </button>
                <button
                  onClick={() => handleQuickExport('CSV', quickExportDropdown.dateType || 'today')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Export as CSV
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Export Dropdown */}
      <div className="relative inline-block text-left" ref={advancedExportRef}>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-500 to-purple-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          onClick={() => {
            setIsOpen(!isOpen);
            setQuickExportDropdown({ isOpen: false, dateType: null }); // Close quick export if open
          }}
        >
          <DownloadIcon className="h-5 w-5 mr-2" />
          Advanced Export
          <ChevronDownIcon className="h-5 w-5 ml-2" />
        </button>

        {isOpen && (
          <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-xl shadow-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 z-50">
            <div className="p-4">
              {/* Status Filters */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center">
                    <FilterIcon className="h-4 w-4 mr-2" />
                    Filter by Status
                  </h3>
                  <button
                    onClick={() => setSelectedStatuses(statusOptions.map(s => s.value))}
                    className="text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                  >
                    Select All
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {statusOptions.map(status => (
                    <label key={status.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes(status.value)}
                        onChange={() => handleStatusToggle(status.value)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Custom Date Range */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Custom Date Range</h3>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={customDateFrom}
                    onChange={e => setCustomDateFrom(e.target.value)}
                    className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-green-500 focus:border-green-500"
                    placeholder="From"
                  />
                  <input
                    type="date"
                    value={customDateTo}
                    onChange={e => setCustomDateTo(e.target.value)}
                    className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-green-500 focus:border-green-500"
                    placeholder="To"
                  />
                </div>
              </div>

              {/* Export Format Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => handleQuickExport('PDF', 'custom')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Export as PDF
                </button>
                <button
                  onClick={() => handleQuickExport('Word', 'custom')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Export as Word
                </button>
                <button
                  onClick={() => handleQuickExport('Excel', 'custom')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Export as Excel
                </button>
                <button
                  onClick={() => handleQuickExport('CSV', 'custom')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Export as CSV
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}