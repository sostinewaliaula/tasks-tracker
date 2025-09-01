import React from 'react';
import { useTask } from '../../context/TaskContext';
import { NotificationItem } from './NotificationItem';
type NotificationDropdownProps = {
  onClose: () => void;
};
export function NotificationDropdown({
  onClose
}: NotificationDropdownProps) {
  const {
    notifications,
    markNotificationAsRead
  } = useTask();
  const sortedNotifications = [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
      <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
        <div className="px-4 py-2 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {sortedNotifications.length > 0 ? sortedNotifications.map(notification => <NotificationItem key={notification.id} notification={notification} onRead={() => markNotificationAsRead(notification.id)} />) : <div className="px-4 py-3 text-sm text-gray-500">
              No notifications
            </div>}
        </div>
        <div className="border-t border-gray-200 px-4 py-2">
          <button className="text-xs text-blue-600 hover:text-blue-800 font-medium" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>;
}