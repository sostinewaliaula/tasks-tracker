import React, { useState, useEffect } from 'react';
import { ClockIcon, CalendarIcon, BellIcon, SettingsIcon, SaveIcon, Loader2, CheckCircleIcon, AlertCircleIcon } from 'lucide-react';

interface NotificationSchedulerProps {
  onClose?: () => void;
}

interface ScheduleSettings {
  dailyProgressTime: string; // HH:MM format
  weeklyReportDay: string; // day of week
  weeklyReportTime: string; // HH:MM format
  deadlineReminderTime: string; // HH:MM format
  overdueReportDay: string; // day of week
  overdueReportTime: string; // HH:MM format
  managerSummaryTime: string; // HH:MM format
}

export function NotificationScheduler({ onClose }: NotificationSchedulerProps) {
  const [settings, setSettings] = useState<ScheduleSettings>({
    dailyProgressTime: '20:00', // 8 PM Nairobi
    weeklyReportDay: 'wednesday',
    weeklyReportTime: '09:00', // 9 AM Nairobi
    deadlineReminderTime: '09:00', // 9 AM Nairobi
    overdueReportDay: 'thursday',
    overdueReportTime: '16:30', // 4:30 PM Nairobi
    managerSummaryTime: '20:00' // 8 PM Nairobi
  });

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSettingChange = (key: keyof ScheduleSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // In a real implementation, this would save to the backend
      // For now, we'll simulate the save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Notification schedule updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update schedule');
    } finally {
      setIsLoading(false);
    }
  };

  const scheduleItems = [
    {
      id: 'daily-progress',
      title: 'Daily Progress Reports',
      description: 'Send daily task progress summaries to users',
      icon: CalendarIcon,
      color: 'text-blue-500',
      fields: [
        {
          key: 'dailyProgressTime' as keyof ScheduleSettings,
          label: 'Time',
          type: 'time',
          description: 'Mon-Fri at 8:00 PM Nairobi time'
        }
      ]
    },
    {
      id: 'weekly-report',
      title: 'Weekly Reports',
      description: 'Send weekly progress reports to users',
      icon: BellIcon,
      color: 'text-green-500',
      fields: [
        {
          key: 'weeklyReportDay' as keyof ScheduleSettings,
          label: 'Day',
          type: 'select',
          options: [
            { value: 'monday', label: 'Monday' },
            { value: 'tuesday', label: 'Tuesday' },
            { value: 'wednesday', label: 'Wednesday' },
            { value: 'thursday', label: 'Thursday' },
            { value: 'friday', label: 'Friday' }
          ]
        },
        {
          key: 'weeklyReportTime' as keyof ScheduleSettings,
          label: 'Time',
          type: 'time',
          description: '9:00 AM Nairobi time'
        }
      ]
    },
    {
      id: 'deadline-reminders',
      title: 'Deadline Reminders',
      description: 'Send reminders for tasks due tomorrow',
      icon: ClockIcon,
      color: 'text-orange-500',
      fields: [
        {
          key: 'deadlineReminderTime' as keyof ScheduleSettings,
          label: 'Time',
          type: 'time',
          description: 'Daily at 9:00 AM Nairobi time'
        }
      ]
    },
    {
      id: 'overdue-reports',
      title: 'Overdue Tasks Reports',
      description: 'Send reports about overdue tasks',
      icon: AlertCircleIcon,
      color: 'text-red-500',
      fields: [
        {
          key: 'overdueReportDay' as keyof ScheduleSettings,
          label: 'Day',
          type: 'select',
          options: [
            { value: 'monday', label: 'Monday' },
            { value: 'tuesday', label: 'Tuesday' },
            { value: 'wednesday', label: 'Wednesday' },
            { value: 'thursday', label: 'Thursday' },
            { value: 'friday', label: 'Friday' }
          ]
        },
        {
          key: 'overdueReportTime' as keyof ScheduleSettings,
          label: 'Time',
          type: 'time',
          description: '4:30 PM Nairobi time'
        }
      ]
    },
    {
      id: 'manager-summary',
      title: 'Manager Daily Summary',
      description: 'Send daily completed tasks summary to managers',
      icon: SettingsIcon,
      color: 'text-purple-500',
      fields: [
        {
          key: 'managerSummaryTime' as keyof ScheduleSettings,
          label: 'Time',
          type: 'time',
          description: 'Mon-Fri at 8:00 PM Nairobi time'
        }
      ]
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-green-500 to-purple-600 rounded-lg">
            <ClockIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Notification Schedule
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configure automated notification timing
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <div className="flex items-center">
            <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
            <p className="text-green-700 dark:text-green-300 text-sm font-medium">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <div className="flex items-center">
            <AlertCircleIcon className="h-4 w-4 text-red-500 mr-2" />
            <p className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Schedule Items */}
      <div className="space-y-6 mb-6">
        {scheduleItems.map((item) => {
          const Icon = item.icon;
          
          return (
            <div
              key={item.id}
              className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-start space-x-3 mb-4">
                <Icon className={`h-5 w-5 ${item.color} mt-1`} />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {item.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.description}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {item.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {field.label}
                    </label>
                    {field.type === 'time' ? (
                      <input
                        type="time"
                        value={settings[field.key]}
                        onChange={(e) => handleSettingChange(field.key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    ) : field.type === 'select' ? (
                      <select
                        value={settings[field.key]}
                        onChange={(e) => handleSettingChange(field.key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        {field.options?.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : null}
                    {field.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {field.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save Button */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            isLoading
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-500 to-purple-600 text-white hover:shadow-lg hover:scale-105'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <SaveIcon className="h-4 w-4 mr-2" />
              Save Schedule
            </>
          )}
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start">
          <BellIcon className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              About Notification Scheduling
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              All times are in Nairobi timezone (UTC+3). Notifications are sent based on user preferences 
              and will only be delivered to users who have enabled the respective notification types in their preferences.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
