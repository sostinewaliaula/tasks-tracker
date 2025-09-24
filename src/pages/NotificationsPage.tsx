import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { BellIcon, CheckIcon, TrashIcon, FilterIcon } from 'lucide-react';
export function NotificationsPage() {
  const {
    notifications,
    markNotificationAsRead
  } = useTask();
  const {
    currentUser
  } = useAuth();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
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
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate flex items-center">
            <BellIcon className="h-8 w-8 mr-3 text-[#2e9d74]" />
            Notifications
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Stay updated with all your task-related notifications
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button type="button" onClick={handleMarkAllAsRead} disabled={!unreadCount} className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${unreadCount ? 'bg-gradient-to-r from-green-500 to-purple-600 hover:opacity-90' : 'bg-gray-300 cursor-not-allowed'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}>
            <CheckIcon className="h-5 w-5 mr-2" />
            Mark All as Read
          </button>
        </div>
      </div>
      <div className="card">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <FilterIcon className="h-5 w-5 mr-2 text-[#2e9d74]" />
              Filter Notifications
            </h3>
            <div className="mt-3 sm:mt-0">
              <select id="filter" name="filter" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-[#2e9d74] sm:text-sm rounded-md" value={filter} onChange={e => setFilter(e.target.value as 'all' | 'unread' | 'read')}>
                <option value="all">All Notifications</option>
                <option value="unread">Unread Only</option>
                <option value="read">Read Only</option>
              </select>
            </div>
          </div>
        </div>
        <ul className="divide-y divide-gray-200">
          {filteredNotifications.length > 0 ? filteredNotifications.map(notification => <li key={notification.id} className={`px-4 py-4 hover:bg-gray-50 ${notification.read ? 'opacity-75' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center">
                      {!notification.read && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#2e9d74]" aria-hidden="true"></span>}
                      <p className={`${!notification.read ? 'ml-2 font-medium' : ''} text-sm text-gray-900`}>
                        {notification.message}
                      </p>
                    </div>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <span>{formatDate(notification.createdAt)}</span>
                      {notification.relatedTaskId && <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Task Related
                        </span>}
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex">
                    {!notification.read && <button type="button" onClick={() => markNotificationAsRead(notification.id)} className="bg-white rounded-md text-sm font-medium text-[#2e9d74] hover:text-[#228a63] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                        Mark as read
                      </button>}
                  </div>
                </div>
              </li>) : <li className="px-4 py-6 text-center text-gray-500">
              No notifications found.
              {filter !== 'all' && ' Try changing the filter.'}
            </li>}
        </ul>
      </div>
    </div>;
}