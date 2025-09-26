import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BellIcon, MailIcon, CalendarIcon, AlertTriangleIcon, CheckCircleIcon, ClockIcon, SettingsIcon, SaveIcon, Loader2 } from 'lucide-react';

interface NotificationPreferencesProps {
  onClose?: () => void;
}

export function NotificationPreferences({ onClose }: NotificationPreferencesProps) {
  const { currentUser, token, updateUser } = useAuth();
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    taskAssigned: true,
    taskCompleted: true,
    taskOverdue: true,
    taskDeadline: true,
    weeklyReport: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load current preferences
  useEffect(() => {
    if (currentUser) {
      setPreferences({
        emailNotifications: currentUser.emailNotifications ?? true,
        taskAssigned: currentUser.taskAssigned ?? true,
        taskCompleted: currentUser.taskCompleted ?? true,
        taskOverdue: currentUser.taskOverdue ?? true,
        taskDeadline: currentUser.taskDeadline ?? true,
        weeklyReport: currentUser.weeklyReport ?? true,
      });
    }
  }, [currentUser]);

  const handlePreferenceChange = (key: keyof typeof preferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    if (!token) {
      setError('No authentication token found');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(preferences)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update preferences');
      }

      const updatedUser = await response.json();
      updateUser(updatedUser);
      setSuccess('Notification preferences updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err: any) {
      setError(err.message || 'Failed to update preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const preferenceItems = [
    {
      key: 'emailNotifications' as keyof typeof preferences,
      title: 'Email Notifications',
      description: 'Receive notifications via email',
      icon: MailIcon,
      color: 'text-blue-500'
    },
    {
      key: 'taskAssigned' as keyof typeof preferences,
      title: 'Task Assigned',
      description: 'Get notified when tasks are assigned to you',
      icon: CheckCircleIcon,
      color: 'text-green-500'
    },
    {
      key: 'taskCompleted' as keyof typeof preferences,
      title: 'Task Completed',
      description: 'Get notified when tasks are completed',
      icon: CheckCircleIcon,
      color: 'text-green-500'
    },
    {
      key: 'taskOverdue' as keyof typeof preferences,
      title: 'Overdue Tasks',
      description: 'Get notified about overdue tasks',
      icon: AlertTriangleIcon,
      color: 'text-red-500'
    },
    {
      key: 'taskDeadline' as keyof typeof preferences,
      title: 'Task Deadlines',
      description: 'Get notified about upcoming deadlines',
      icon: CalendarIcon,
      color: 'text-orange-500'
    },
    {
      key: 'weeklyReport' as keyof typeof preferences,
      title: 'Weekly Reports',
      description: 'Receive weekly progress reports',
      icon: ClockIcon,
      color: 'text-purple-500'
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-green-500 to-purple-600 rounded-lg">
            <SettingsIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Notification Preferences
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Customize how you receive notifications
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
            <AlertTriangleIcon className="h-4 w-4 text-red-500 mr-2" />
            <p className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Preferences List */}
      <div className="space-y-4 mb-6">
        {preferenceItems.map((item) => {
          const Icon = item.icon;
          const isEnabled = preferences[item.key];
          
          return (
            <div
              key={item.key}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center space-x-3">
                <Icon className={`h-5 w-5 ${item.color}`} />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {item.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.description}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => handlePreferenceChange(item.key)}
                disabled={isSaving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                  isEnabled
                    ? 'bg-gradient-to-r from-green-500 to-purple-600'
                    : 'bg-gray-200 dark:bg-gray-600'
                } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      {/* Save Button */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            isSaving
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-500 to-purple-600 text-white hover:shadow-lg hover:scale-105'
          }`}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <SaveIcon className="h-4 w-4 mr-2" />
              Save Preferences
            </>
          )}
        </button>
      </div>
    </div>
  );
}
