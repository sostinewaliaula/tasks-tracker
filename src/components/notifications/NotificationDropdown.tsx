import React, { useEffect, useRef } from 'react';
import { useTask } from '../../context/TaskContext';
import { NotificationItem } from './NotificationItem';
import { BellIcon } from 'lucide-react';

type NotificationDropdownProps = {
  onClose: () => void;
  onViewAll: () => void;
};

export function NotificationDropdown({
  onClose,
  onViewAll
}: NotificationDropdownProps) {
  const {
    notifications,
    markNotificationAsRead
  } = useTask();

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const sortedNotifications = [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div 
      ref={dropdownRef}
      className="origin-top-right absolute right-0 mt-2 w-80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 focus:outline-none z-50 overflow-hidden"
    >
      <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-green-500/5 to-purple-600/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BellIcon className="h-5 w-5 text-green-500 dark:text-green-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
            </div>
            {unreadCount > 0 && (
              <span className="px-2 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full font-medium">
                {unreadCount} new
              </span>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {sortedNotifications.length > 0 ? (
            sortedNotifications.map(notification => (
              <NotificationItem 
                key={notification.id} 
                notification={notification} 
                onRead={() => markNotificationAsRead(notification.id)} 
              />
            ))
          ) : (
            <div className="px-6 py-8 text-center">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <BellIcon className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">No notifications</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">You're all caught up!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200/50 dark:border-gray-700/50 px-4 py-3 bg-gray-50/50 dark:bg-gray-700/30">
          <div className="flex items-center justify-between">
            <button 
              className="text-sm text-green-500 dark:text-green-400 hover:text-green-600 dark:hover:text-green-300 font-medium transition-colors duration-200" 
              onClick={onViewAll}
            >
              View all
            </button>
            <button 
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium transition-colors duration-200" 
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}