import React from 'react';
import { CheckIcon, ClockIcon } from 'lucide-react';

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

  return (
    <div 
      className={`px-4 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors duration-200 cursor-pointer group ${
        notification.read ? 'opacity-75' : 'bg-gradient-to-r from-blue-50/30 to-transparent dark:from-blue-900/20'
      }`} 
      onClick={notification.read ? undefined : onRead}
    >
      <div className="flex items-start space-x-3">
        {/* Notification indicator */}
        <div className="flex-shrink-0 mt-1">
          {!notification.read ? (
            <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-purple-600 rounded-full"></div>
          ) : (
            <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-relaxed ${
            notification.read 
              ? 'text-gray-600 dark:text-gray-400' 
              : 'text-gray-900 dark:text-gray-100 font-medium'
          }`}>
            {notification.message}
          </p>
          
          <div className="flex items-center mt-2 space-x-2">
            <ClockIcon className="h-3 w-3 text-gray-400 dark:text-gray-500" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {timeAgo(notification.createdAt)}
            </p>
          </div>
        </div>

        {/* Action button */}
        {!notification.read && (
          <button 
            onClick={e => {
              e.stopPropagation();
              onRead();
            }} 
            className="flex-shrink-0 p-1 rounded-full text-green-500 dark:text-green-400 hover:bg-green-500/10 dark:hover:bg-green-400/10 transition-colors duration-200 opacity-0 group-hover:opacity-100"
            title="Mark as read"
          >
            <CheckIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}