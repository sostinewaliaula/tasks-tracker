import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTask } from '../context/TaskContext';
import { TaskList } from '../components/tasks/TaskList';
import { TaskStats } from '../components/dashboard/TaskStats';
import { WeeklyCalendar } from '../components/dashboard/WeeklyCalendar';
import { CalendarIcon, ListIcon, ChartBarIcon } from 'lucide-react';
export function ManagerDashboard() {
  const {
    currentUser
  } = useAuth();
  const {
    getTasksByDepartment,
    getTasksForCurrentWeek
  } = useTask();
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'stats'>('stats');
  const departmentTasks = currentUser ? getTasksByDepartment(currentUser.department) : [];
  const weeklyTasks = getTasksForCurrentWeek();
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Department Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {currentUser?.name || 'Manager'}! Here's an overview
            of your department's tasks.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <div className="inline-flex shadow-sm rounded-md">
            <button type="button" onClick={() => setViewMode('stats')} className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${viewMode === 'stats' ? 'text-[#2e9d74] z-10' : 'text-gray-700 hover:bg-gray-50'}`}>
              <ChartBarIcon className="h-5 w-5 mr-2" />
              Analytics
            </button>
            <button type="button" onClick={() => setViewMode('list')} className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${viewMode === 'list' ? 'text-[#2e9d74] z-10' : 'text-gray-700 hover:bg-gray-50'}`}>
              <ListIcon className="h-5 w-5 mr-2" />
              List
            </button>
            <button type="button" onClick={() => setViewMode('calendar')} className={`relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${viewMode === 'calendar' ? 'text-[#2e9d74] z-10' : 'text-gray-700 hover:bg-gray-50'}`}>
              <CalendarIcon className="h-5 w-5 mr-2" />
              Calendar
            </button>
          </div>
        </div>
      </div>
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {viewMode === 'list' && <TaskList tasks={departmentTasks} />}
        {viewMode === 'calendar' && <WeeklyCalendar tasks={weeklyTasks} />}
        {viewMode === 'stats' && <TaskStats department={currentUser?.department} />}
      </div>
    </div>;
}