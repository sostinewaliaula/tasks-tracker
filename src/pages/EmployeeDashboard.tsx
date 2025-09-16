import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTask } from '../context/TaskContext';
import { TaskList } from '../components/tasks/TaskList';
import { TaskForm } from '../components/tasks/TaskForm';
import { WeeklyCalendar } from '../components/dashboard/WeeklyCalendar';
import { PlusIcon, CalendarIcon, ListIcon } from 'lucide-react';
export function EmployeeDashboard() {
  const {
    currentUser
  } = useAuth();
  const {
    tasks,
    getTasksByUser,
    getTasksForCurrentWeek
  } = useTask();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const userTasks = currentUser ? getTasksByUser(currentUser.id) : [];
  const weeklyTasks = getTasksForCurrentWeek();
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-gray-100 sm:text-3xl sm:truncate">
            My Tasks
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
            Welcome back, {currentUser?.name || 'User'}! Here's your task
            overview for this week.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
          <div className="inline-flex shadow-sm rounded-md">
            <button type="button" onClick={() => setViewMode('list')} className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium ${viewMode === 'list' ? 'text-[#2e9d74] z-10' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
              <ListIcon className="h-5 w-5 mr-2" />
              List
            </button>
            <button type="button" onClick={() => setViewMode('calendar')} className={`relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium ${viewMode === 'calendar' ? 'text-[#2e9d74] z-10' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
              <CalendarIcon className="h-5 w-5 mr-2" />
              Calendar
            </button>
          </div>
          <button type="button" onClick={() => setIsAddingTask(true)} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#2e9d74] to-[#8c52ff] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2e9d74]">
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Task
          </button>
        </div>
      </div>
      {isAddingTask && <div className="mb-6">
          <TaskForm onCancel={() => setIsAddingTask(false)} onTaskAdded={() => setIsAddingTask(false)} />
        </div>}
      <div className="bg-white dark:bg-gray-900 shadow overflow-hidden sm:rounded-md">
        {viewMode === 'list' ? <TaskList tasks={userTasks} /> : <WeeklyCalendar tasks={weeklyTasks} />}
      </div>
    </div>;
}