import React, { useState, useEffect } from 'react';
import { FilterIcon, CalendarIcon, TagIcon, AlertTriangleIcon, SearchIcon, XIcon } from 'lucide-react';

interface NotificationFiltersProps {
  onFiltersChange: (filters: NotificationFilters) => void;
  onClearFilters: () => void;
}

export interface NotificationFilters {
  type?: string;
  category?: string;
  priority?: string;
  read?: boolean;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export function NotificationFilters({ onFiltersChange, onClearFilters }: NotificationFiltersProps) {
  const [filters, setFilters] = useState<NotificationFilters>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  // Fetch available categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/notifications/categories', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const handleFilterChange = (key: keyof NotificationFilters, value: any) => {
    const newFilters = { ...filters };
    if (value === '' || value === undefined) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
    onClearFilters();
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  const notificationTypes = [
    { value: 'task_completed', label: 'Task Completed', icon: '✅' },
    { value: 'task_assigned', label: 'Task Assigned', icon: '📋' },
    { value: 'task_overdue', label: 'Task Overdue', icon: '⚠️' },
    { value: 'task_deadline', label: 'Task Deadline', icon: '⏰' },
    { value: 'daily_progress', label: 'Daily Progress', icon: '📊' },
    { value: 'weekly_report', label: 'Weekly Report', icon: '📈' },
    { value: 'manager_summary', label: 'Manager Summary', icon: '👥' },
    { value: 'deadline_reminder', label: 'Deadline Reminder', icon: '🔔' },
    { value: 'blocker_resolved', label: 'Blocker Resolved', icon: '🚫' },
    { value: 'task_updated', label: 'Task Updated', icon: '✏️' },
    { value: 'department_update', label: 'Department Update', icon: '🏢' },
    { value: 'system_announcement', label: 'System Announcement', icon: '📢' },
    { value: 'general', label: 'General', icon: '📝' }
  ];

  const priorities = [
    { value: 'high', label: 'High', color: 'text-red-500' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-500' },
    { value: 'low', label: 'Low', color: 'text-green-500' }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FilterIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Filter Notifications
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
            >
              Clear All
            </button>
          )}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
          </button>
        </div>
      </div>

      {/* Basic Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Search */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Type Filter */}
        <select
          value={filters.type || ''}
          onChange={(e) => handleFilterChange('type', e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500"
        >
          <option value="">All Types</option>
          {notificationTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.icon} {type.label}
            </option>
          ))}
        </select>

        {/* Read Status */}
        <select
          value={filters.read === undefined ? '' : filters.read.toString()}
          onChange={(e) => handleFilterChange('read', e.target.value === '' ? undefined : e.target.value === 'true')}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500"
        >
          <option value="">All Status</option>
          <option value="false">Unread</option>
          <option value="true">Read</option>
        </select>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <TagIcon className="h-4 w-4 inline mr-1" />
                Category
              </label>
              <select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <AlertTriangleIcon className="h-4 w-4 inline mr-1" />
                Priority
              </label>
              <select
                value={filters.priority || ''}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">All Priorities</option>
                {priorities.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    <span className={priority.color}>{priority.label}</span>
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Date Range
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  placeholder="From Date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <input
                  type="date"
                  placeholder="To Date"
                  value={filters.dateTo || ''}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Filters:</span>
            {Object.entries(filters).map(([key, value]) => (
              <span
                key={key}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
              >
                {key}: {value}
                <button
                  onClick={() => handleFilterChange(key as keyof NotificationFilters, undefined)}
                  className="ml-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
