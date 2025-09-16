import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTask, TaskStatus, TaskPriority } from '../context/TaskContext';
import { TaskList } from '../components/tasks/TaskList';
import { TaskForm } from '../components/tasks/TaskForm';
import { TaskDetailModal } from '../components/tasks/TaskDetailModal';
import { PlusIcon, FilterIcon, SortAscIcon } from 'lucide-react';

export function TasksPage() {
  const { currentUser } = useAuth();
  const { tasks } = useTask();

  const [isAddingTask, setIsAddingTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    status: 'all' as TaskStatus | 'all',
    priority: 'all' as TaskPriority | 'all',
    search: '',
    dateFrom: '' as string,
    dateTo: '' as string
  });

  const [sortBy, setSortBy] = useState<'deadline' | 'priority' | 'status'>('deadline');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filter tasks based on user role and filters
  const filteredTasks = tasks.filter(task => {
    // Visibility rules
    if (currentUser?.role === 'manager') {
      if (task.department !== currentUser.department) return false;
    } else if (currentUser?.role === 'employee') {
      if (task.createdBy !== currentUser?.id) return false;
    } // superadmin sees all

    // Apply status filter
    if (filters.status !== 'all' && task.status !== filters.status) return false;

    // Apply priority filter
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false;

    // Apply search filter
    if (
      filters.search &&
      !task.title.toLowerCase().includes(filters.search.toLowerCase()) &&
      !task.description.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false;
    }

    // Apply date range filter against task.deadline (inclusive)
    const deadline = new Date(task.deadline);
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      from.setHours(0, 0, 0, 0);
      if (deadline < from) return false;
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      if (deadline > to) return false;
    }

    return true;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'deadline') {
      comparison = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    } else if (sortBy === 'priority') {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
    } else if (sortBy === 'status') {
      const statusOrder = { todo: 0, 'in-progress': 1, completed: 2 } as const;
      comparison = statusOrder[a.status] - statusOrder[b.status];
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: 'deadline' | 'priority' | 'status') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, status: e.target.value as TaskStatus | 'all' }));
  };

  const handlePriorityFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, priority: e.target.value as TaskPriority | 'all' }));
  };

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, dateFrom: e.target.value }));
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, dateTo: e.target.value }));
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTask(taskId);
  };

  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-gray-100 sm:text-3xl sm:truncate">
            Tasks Management
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
            View, filter, and manage all your tasks in one place
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            type="button"
            onClick={() => setIsAddingTask(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#2e9d74] to-[#8c52ff] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2e9d74]"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Task
          </button>
        </div>
      </div>

      {isAddingTask && (
        <div className="mb-6">
          <TaskForm onCancel={() => setIsAddingTask(false)} onTaskAdded={() => setIsAddingTask(false)} />
        </div>
      )}

      <div className="card mb-6">
        <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 sm:px-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 flex items-center">
              <FilterIcon className="h-5 w-5 mr-2 text-[#2e9d74]" />
              Filters & Sorting
            </h3>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-y-4 sm:grid-cols-6 sm:gap-x-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Search
              </label>
              <input
                type="text"
                name="search"
                id="search"
                placeholder="Search tasks..."
                className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#2e9d74] focus:border-[#2e9d74] sm:text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                value={filters.search}
                onChange={handleSearchChange}
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Status
              </label>
              <select
                id="status"
                name="status"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-[#2e9d74] focus:border-[#2e9d74] sm:text-sm rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                value={filters.status}
                onChange={handleStatusFilterChange}
              >
                <option value="all">All Statuses</option>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-[#2e9d74] focus:border-[#2e9d74] sm:text-sm rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                value={filters.priority}
                onChange={handlePriorityFilterChange}
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                From Date
              </label>
              <input
                type="date"
                id="dateFrom"
                name="dateFrom"
                className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#2e9d74] focus:border-[#2e9d74] sm:text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                value={filters.dateFrom}
                onChange={handleDateFromChange}
              />
            </div>

            <div>
              <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                To Date
              </label>
              <input
                type="date"
                id="dateTo"
                name="dateTo"
                className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#2e9d74] focus:border-[#2e9d74] sm:text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                value={filters.dateTo}
                onChange={handleDateToChange}
              />
            </div>

            <div>
              <label htmlFor="sort" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Sort By
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <select
                  id="sort"
                  name="sort"
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-[#2e9d74] focus:border-[#2e9d74] sm:text-sm rounded-l-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  value={sortBy}
                  onChange={e => handleSort(e.target.value as any)}
                >
                  <option value="deadline">Deadline</option>
                  <option value="priority">Priority</option>
                  <option value="status">Status</option>
                </select>
                <button
                  type="button"
                  onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                  className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-300 sm:text-sm rounded-r-md hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <SortAscIcon className={`h-4 w-4 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
        <TaskList tasks={sortedTasks} onTaskClick={handleTaskClick} />
      </div>

      {selectedTask && (
        <TaskDetailModal taskId={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>;
}