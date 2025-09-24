import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTask } from '../context/TaskContext';
import { TaskList } from '../components/tasks/TaskList';
import { TaskStats } from '../components/dashboard/TaskStats';
import { WeeklyCalendar } from '../components/dashboard/WeeklyCalendar';
import { BlockerDashboard } from '../components/dashboard/BlockerDashboard';
import { CalendarIcon, ListIcon, ChartBarIcon, Loader2, AlertCircleIcon } from 'lucide-react';
export function ManagerDashboard() {
  const {
    currentUser
  } = useAuth();
  const {
    getTasksByDepartment,
    getTasksForCurrentWeek,
    tasks
  } = useTask();
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'stats' | 'blockers'>('stats');
  const [isLoading, setIsLoading] = useState(true);

  // Format display name like in Header component
  const formatDisplayName = (name?: string) => {
    if (!name) return '';
    const cleaned = name.replace(/[._]+/g, ' ').trim();
    return cleaned
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const rawName = currentUser?.name 
    || (currentUser as any)?.email?.split('@')[0]
    || (currentUser as any)?.ldap_uid
    || '';
  const displayName = formatDisplayName(rawName);
  
  const departmentTasks = currentUser ? getTasksByDepartment(currentUser.department) : [];
  const weeklyTasks = getTasksForCurrentWeek();

  // Loading state management
  useEffect(() => {
    if (currentUser && tasks.length >= 0) {
      setIsLoading(false);
    }
  }, [currentUser, tasks]);
  return <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-green-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Department Dashboard
                </h1>
                <p className="text-white/90 text-lg">
                  {isLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Loading...
                    </div>
                  ) : currentUser ? (
                    `Welcome back, ${displayName || 'User'}!`
                  ) : (
                    'Welcome back!'
                  )} Here's an overview of your department's tasks.
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-2 shadow-sm border border-gray-200 dark:border-gray-700 inline-flex">
            <button 
              type="button" 
              onClick={() => setViewMode('stats')} 
              className={`relative inline-flex items-center px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                viewMode === 'stats' 
                  ? 'bg-gradient-to-r from-green-500 to-green-400 text-white shadow-md' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <ChartBarIcon className="h-5 w-5 mr-2" />
              Analytics
            </button>
            <button 
              type="button" 
              onClick={() => setViewMode('list')} 
              className={`relative inline-flex items-center px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                viewMode === 'list' 
                  ? 'bg-gradient-to-r from-green-500 to-green-400 text-white shadow-md' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <ListIcon className="h-5 w-5 mr-2" />
              List
            </button>
            <button 
              type="button" 
              onClick={() => setViewMode('calendar')} 
              className={`relative inline-flex items-center px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                viewMode === 'calendar' 
                  ? 'bg-gradient-to-r from-green-500 to-green-400 text-white shadow-md' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <CalendarIcon className="h-5 w-5 mr-2" />
              Calendar
            </button>
            <button 
              type="button" 
              onClick={() => setViewMode('blockers')} 
              className={`relative inline-flex items-center px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                viewMode === 'blockers' 
                  ? 'bg-gradient-to-r from-red-500 to-red-400 text-white shadow-md' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <AlertCircleIcon className="h-5 w-5 mr-2" />
              Blockers
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#2e9d74] mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Loading department data...</p>
              </div>
            </div>
          ) : (
            <>
              {viewMode === 'list' && <TaskList tasks={departmentTasks} />}
              {viewMode === 'calendar' && <WeeklyCalendar tasks={weeklyTasks} />}
              {viewMode === 'stats' && <TaskStats department={currentUser?.department} />}
              {viewMode === 'blockers' && <BlockerDashboard />}
            </>
          )}
        </div>
      </div>
    </div>;
}