import { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications';
import { BellIcon, CheckIcon, TrashIcon, XIcon, ClockIcon, AlertCircleIcon, CheckCircleIcon, InfoIcon, EyeIcon, MoreVerticalIcon, SearchIcon, ChevronDownIcon, ChevronRightIcon, CalendarIcon, FlagIcon, WifiIcon, WifiOffIcon, SettingsIcon, TrendingUpIcon } from 'lucide-react';
import { NotificationPreferences } from '../components/notifications/NotificationPreferences';
import { NotificationFilters } from '../components/notifications/NotificationFilters';
import { NotificationAnalytics } from '../components/notifications/NotificationAnalytics';
import { NotificationScheduler } from '../components/notifications/NotificationScheduler';
export function NotificationsPage() {
  const {
    getUserNotifications,
    markNotificationAsRead,
    deleteNotification
  } = useTask();
  const { isConnected, connectionError } = useRealtimeNotifications();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showActions, setShowActions] = useState<string | null>(null);
  const [expandedNotifications, setExpandedNotifications] = useState<Set<string>>(new Set());
  const [showPreferences, setShowPreferences] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'analytics'>('list');
  
  // Get user-specific notifications
  const notifications = getUserNotifications();
  
  // Sort notifications by date (newest first)
  const sortedNotifications = [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  // Apply filter and search
  const filteredNotifications = sortedNotifications.filter(notification => {
    // Apply filter
    if (filter === 'read' && !notification.read) return false;
    if (filter === 'unread' && notification.read) return false;
    
    // Apply search
    if (searchQuery) {
      return notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    }
    
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

  const handleClearSearch = () => {
    setSearchQuery('');
  };


  const toggleActions = (notificationId: string) => {
    setShowActions(showActions === notificationId ? null : notificationId);
  };

  const toggleExpanded = (notificationId: string) => {
    setExpandedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'blocker':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'todo':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'task_completed':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'task_overdue':
        return <AlertCircleIcon className="h-6 w-6 text-red-500" />;
      case 'task_assigned':
        return <InfoIcon className="h-6 w-6 text-blue-500" />;
      default:
        return <BellIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  const getNotificationTypeColor = (type?: string) => {
    switch (type) {
      case 'task_completed':
        return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      case 'task_overdue':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'task_assigned':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700';
    }
  };


  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-purple-600 rounded-xl shadow-lg">
                <BellIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Notifications
                  </h1>
                  {/* Connection Status */}
                  <div className="flex items-center space-x-2">
                    {isConnected ? (
                      <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                        <WifiIcon className="h-4 w-4" />
                        <span className="text-xs font-medium">Live</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                        <WifiOffIcon className="h-4 w-4" />
                        <span className="text-xs font-medium">Offline</span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
            Stay updated with all your task-related notifications
                  {connectionError && (
                    <span className="text-red-500 dark:text-red-400 ml-2">
                      ({connectionError})
                    </span>
                  )}
          </p>
        </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
          {selectedNotifications.length > 0 && (
                <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm border border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedNotifications.length} selected
                  </span>
              <button 
                onClick={handleMarkSelectedAsRead}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
              >
                <CheckIcon className="h-4 w-4 mr-1" />
                    Mark Read
              </button>
              <button 
                onClick={handleDeleteSelected}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Delete
              </button>
                </div>
          )}
              
          <button 
            onClick={() => setViewMode(viewMode === 'list' ? 'analytics' : 'list')}
            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <TrendingUpIcon className="h-4 w-4 mr-2" />
            {viewMode === 'list' ? 'Analytics' : 'List'}
          </button>
          
          <button 
            onClick={() => setShowScheduler(true)}
            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <ClockIcon className="h-4 w-4 mr-2" />
            Schedule
          </button>
          
          <button 
            onClick={() => setShowPreferences(true)}
            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <SettingsIcon className="h-4 w-4 mr-2" />
            Preferences
          </button>
          
          <button 
            onClick={handleMarkAllAsRead} 
            disabled={!unreadCount} 
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  unreadCount 
                    ? 'bg-gradient-to-r from-green-500 to-purple-600 text-white hover:shadow-lg hover:scale-105' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                Mark All Read
          </button>
        </div>
      </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BellIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{notifications.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <AlertCircleIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unread</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{unreadCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Read</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{notifications.length - unreadCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Conditional Rendering based on view mode */}
        {viewMode === 'analytics' ? (
          <NotificationAnalytics />
        ) : (
          <>
            {/* Advanced Filters */}
            <NotificationFilters 
              onFiltersChange={() => {}}
              onClearFilters={() => {}}
            />

            {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
              {/* Search Bar */}
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <XIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Filter and Select All */}
            <div className="flex items-center space-x-4">
              {filteredNotifications.length > 0 && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.length === filteredNotifications.length}
                    onChange={handleSelectAll}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Select All ({selectedNotifications.length}/{filteredNotifications.length})
                  </span>
                </div>
              )}
                
              <select 
                value={filter} 
                onChange={e => setFilter(e.target.value as 'all' | 'unread' | 'read')}
                  className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                >
                  <option value="all">All ({notifications.length})</option>
                  <option value="unread">Unread ({unreadCount})</option>
                  <option value="read">Read ({notifications.length - unreadCount})</option>
              </select>
              </div>
            </div>
          </div>
        </div>
        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border transition-all duration-200 hover:shadow-md ${
                  notification.read 
                    ? 'border-gray-200 dark:border-gray-700 opacity-75' 
                    : `border-l-4 border-l-green-500 ${getNotificationTypeColor(notification.type)}`
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notification.id)}
                    onChange={() => handleSelectNotification(notification.id)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded mt-1"
                  />
                    
                    {/* Icon */}
                  <div className="flex-shrink-0">
                      <div className={`p-2 rounded-lg ${
                        notification.read 
                          ? 'bg-gray-100 dark:bg-gray-700' 
                          : 'bg-white dark:bg-gray-800 shadow-sm'
                      }`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                      {!notification.read && (
                              <div className="h-2 w-2 bg-gradient-to-r from-green-500 to-purple-600 rounded-full"></div>
                            )}
                            <p className={`text-sm ${
                              notification.read 
                                ? 'text-gray-600 dark:text-gray-400' 
                                : 'text-gray-900 dark:text-gray-100 font-semibold'
                            }`}>
                        {notification.message}
                      </p>
                    </div>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mb-2">
                            <div className="flex items-center space-x-1">
                              <ClockIcon className="h-3 w-3" />
                              <span>{getRelativeTime(notification.createdAt)}</span>
                            </div>
                      {notification.relatedTaskId && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          Task Related
                        </span>
                            )}
                          </div>

                          {/* Task and Subtasks Section */}
                          {notification.relatedTask && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {notification.relatedTask.title}
                                  </h4>
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(notification.relatedTask.status)}`}>
                                    {notification.relatedTask.status}
                                  </span>
                                </div>
                                
                                {notification.relatedTask.subtasks && notification.relatedTask.subtasks.length > 0 && (
                                  <button
                                    onClick={() => toggleExpanded(notification.id)}
                                    className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                  >
                                    <span>{notification.relatedTask.subtasks.length} subtasks</span>
                                    {expandedNotifications.has(notification.id) ? (
                                      <ChevronDownIcon className="h-3 w-3" />
                                    ) : (
                                      <ChevronRightIcon className="h-3 w-3" />
                                    )}
                                  </button>
                                )}
                              </div>

                              {/* Subtasks List */}
                              {expandedNotifications.has(notification.id) && notification.relatedTask.subtasks && (
                                <div className="mt-3 ml-4 space-y-2">
                                  {notification.relatedTask.subtasks.map((subtask) => (
                                    <div key={subtask.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                                            {subtask.title}
                                          </h5>
                                          <div className="flex items-center space-x-2 text-xs">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full font-medium ${getStatusColor(subtask.status)}`}>
                                              {subtask.status}
                                            </span>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full font-medium ${getPriorityColor(subtask.priority)}`}>
                                              <FlagIcon className="h-3 w-3 mr-1" />
                                              {subtask.priority}
                                            </span>
                                            <div className="flex items-center text-gray-500 dark:text-gray-400">
                                              <CalendarIcon className="h-3 w-3 mr-1" />
                                              <span>{new Date(subtask.deadline).toLocaleDateString()}</span>
                                            </div>
                                          </div>
                                          {subtask.blockerReason && (
                                            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs">
                                              <div className="flex items-start space-x-1">
                                                <AlertCircleIcon className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-red-700 dark:text-red-300">
                                                  <strong>Blocked:</strong> {subtask.blockerReason}
                                                </span>
                                              </div>
                                            </div>
                      )}
                    </div>
                    </div>
                  </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center space-x-2 ml-4">
                  {!notification.read && (
                    <button 
                      onClick={() => markNotificationAsRead(notification.id)} 
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                    >
                              <EyeIcon className="h-3 w-3 mr-1" />
                              Mark Read
                    </button>
                  )}
                          
                          <div className="relative">
                            <button
                              onClick={() => toggleActions(notification.id)}
                              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                              <MoreVerticalIcon className="h-4 w-4" />
                            </button>
                            
                            {showActions === notification.id && (
                              <div className="absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                                <button
                                  onClick={() => {
                                    markNotificationAsRead(notification.id);
                                    setShowActions(null);
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <CheckIcon className="h-4 w-4 mr-2" />
                                  Mark as Read
                                </button>
                  <button 
                                  onClick={() => {
                                    deleteNotification(notification.id);
                                    setShowActions(null);
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  <TrashIcon className="h-4 w-4 mr-2" />
                                  Delete
                  </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-12 text-center">
              <div className="flex flex-col items-center">
                  <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                    <BellIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No notifications found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {searchQuery 
                      ? 'Try adjusting your search terms or filters.' 
                      : filter !== 'all' 
                        ? 'Try changing the filter to see more notifications.' 
                        : 'You\'re all caught up!'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
          </>
        )}
      </div>

      {/* Notification Preferences Modal */}
      {showPreferences && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-opacity-70 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mx-auto max-h-[90vh] overflow-y-auto">
            <NotificationPreferences onClose={() => setShowPreferences(false)} />
          </div>
        </div>
      )}

      {/* Notification Scheduler Modal */}
      {showScheduler && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-opacity-70 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full mx-auto max-h-[90vh] overflow-y-auto">
            <NotificationScheduler onClose={() => setShowScheduler(false)} />
          </div>
        </div>
      )}
    </div>
  );
}