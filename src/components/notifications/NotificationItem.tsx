import React from 'react';
import { CheckIcon } from 'lucide-react';
type NotificationItemProps = {
  notification: {
    id: string;
    message: string;
    read: boolean;
    createdAt: Date;
  };
  onRead: () => void;
};
export function NotificationItem({
  notification,
  onRead
}: NotificationItemProps) {
  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    return Math.floor(seconds) + ' seconds ago';
  };
  return <div className={`px-4 py-3 hover:bg-gray-50 ${notification.read ? 'opacity-75' : ''}`} onClick={notification.read ? undefined : onRead}>
      <div className="flex justify-between">
        <p className={`text-sm ${notification.read ? 'text-gray-500' : 'text-gray-900 font-medium'}`}>
          {notification.message}
        </p>
        {!notification.read && <button onClick={e => {
        e.stopPropagation();
        onRead();
      }} className="ml-2 text-blue-600 hover:text-blue-800">
            <CheckIcon className="h-4 w-4" />
          </button>}
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {timeAgo(notification.createdAt)}
      </p>
    </div>;
}