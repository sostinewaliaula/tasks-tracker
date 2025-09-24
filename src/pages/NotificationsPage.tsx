import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { BellIcon, CheckIcon, TrashIcon, FilterIcon, XIcon, ClockIcon, AlertCircleIcon, CheckCircleIcon, InfoIcon } from 'lucide-react';
export function NotificationsPage() {
  const {
    getUserNotifications,
    markNotificationAsRead,
    deleteNotification
  } = useTask();
  const {
    currentUser
  } = useAuth();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  // Get user-specific notifications
  const notifications = getUserNotifications();
  
  // Sort notifications by date (newest first)
  const sortedNotifications = [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  // Apply filter
  const filteredNotifications = sortedNotifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'read') return notification.read;
    if (filter === 'unread') return !notification.read;
    return true;
  });
  const unreadCount = notifications.filter(n => !n.read).length;
  const handleMarkAllAsRead = () => {
    filteredNotifications.forEach(notification => {
      if (!notification.read) {
        markNotificationAsRead(notification.id);
      }
    });
  };

  const handleSelectNotification = (notificationId: string) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId) 
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    }
  };

  const handleDeleteSelected = () => {
    selectedNotifications.forEach(notificationId => {
      deleteNotification(notificationId);
    });
    setSelectedNotifications([]);
  };

  const handleMarkSelectedAsRead = () => {
    selectedNotifications.forEach(notificationId => {
      markNotificationAsRead(notificationId);
    });
    setSelectedNotifications([]);
  };

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'task_completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'task_overdue':
        return <AlertCircleIcon className="h-5 w-5 text-red-500" />;
      case 'task_assigned':
        return <InfoIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-500" />;
    }
  };
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-gray-100 sm:text-3xl sm:truncate flex items-center">
            <BellIcon className="h-8 w-8 mr-3 text-green-500" />
            Notifications
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Stay updated with all your task-related notifications
          </p>
        </div>
        <div className="mt-4 flex space-x-2 md:mt-0 md:ml-4">
          {selectedNotifications.length > 0 && (
            <>
              <button 
                type="button" 
                onClick={handleMarkSelectedAsRead}
                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <CheckIcon className="h-4 w-4 mr-1" />
                Mark as Read
              </button>
              <button 
                type="button" 
                onClick={handleDeleteSelected}
                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Delete
              </button>
            </>
          )}
          <button 
            type="button" 
            onClick={handleMarkAllAsRead} 
            disabled={!unreadCount} 
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${unreadCount ? 'bg-gradient-to-r from-green-500 to-purple-600 hover:opacity-90' : 'bg-gray-300 cursor-not-allowed'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
          >
            <CheckIcon className="h-5 w-5 mr-2" />
            Mark All as Read
          </button>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 flex items-center">
                <FilterIcon className="h-5 w-5 mr-2 text-green-500" />
                Filter Notifications
              </h3>
              {filteredNotifications.length > 0 && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.length === filteredNotifications.length}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Select All ({selectedNotifications.length}/{filteredNotifications.length})
                  </span>
                </div>
              )}
            </div>
            <div className="mt-3 sm:mt-0">
              <select 
                id="filter" 
                name="filter" 
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" 
                value={filter} 
                onChange={e => setFilter(e.target.value as 'all' | 'unread' | 'read')}
              >
                <option value="all">All Notifications ({notifications.length})</option>
                <option value="unread">Unread Only ({unreadCount})</option>
                <option value="read">Read Only ({notifications.length - unreadCount})</option>
              </select>
            </div>
          </div>
        </div>
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredNotifications.length > 0 ? filteredNotifications.map(notification => (
            <li key={notification.id} className={`px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 ${
              notification.read ? 'opacity-75' : 'bg-gradient-to-r from-blue-50/30 to-transparent dark:from-blue-900/20'
            }`}>
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1 flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notification.id)}
                    onChange={() => handleSelectNotification(notification.id)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-1"
                  />
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center">
                      {!notification.read && (
                        <span className="h-2 w-2 flex-shrink-0 rounded-full bg-gradient-to-r from-green-500 to-purple-600" aria-hidden="true"></span>
                      )}
                      <p className={`${!notification.read ? 'ml-2 font-semibold' : 'ml-2 font-medium'} text-sm text-gray-900 dark:text-gray-100`}>
                        {notification.message}
                      </p>
                    </div>
                    <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      <span>{formatDate(notification.createdAt)}</span>
                      {notification.relatedTaskId && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          Task Related
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0 flex space-x-2">
                  {!notification.read && (
                    <button 
                      type="button" 
                      onClick={() => markNotificationAsRead(notification.id)} 
                      className="text-green-500 dark:text-green-400 hover:bg-green-500/10 dark:hover:bg-green-400/10 px-2 py-1 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                    >
                      Mark as read
                    </button>
                  )}
                  <button 
                    type="button" 
                    onClick={() => deleteNotification(notification.id)} 
                    className="text-red-500 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-400/10 px-2 py-1 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          )) : (
            <li className="px-4 py-12 text-center">
              <div className="flex flex-col items-center">
                <BellIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                  No notifications found
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                  {filter !== 'all' && 'Try changing the filter to see more notifications.'}
                  {filter === 'all' && 'You\'re all caught up!'}
                </p>
              </div>
            </li>
          )}
        </ul>
      </div>
    </div>;
}