import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTask, TaskStatus, TaskPriority, Task } from '../context/TaskContext';
import { TaskForm } from '../components/tasks/TaskForm';
import { 
  PlusIcon, 
  FilterIcon, 
  SortAscIcon, 
  XIcon, 
  SearchIcon, 
  CalendarIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  CircleIcon,
  ClockIcon,
  ExternalLinkIcon,
  ListIcon
} from 'lucide-react';

export function TasksPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { tasks, updateTaskStatus } = useTask();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

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
      if (String(task.createdBy) !== String(currentUser?.id)) return false;
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

  const toggleTaskExpansion = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'todo':
        return <CircleIcon className="h-4 w-4 text-gray-400" />;
      case 'in-progress':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200';
    }
  };

  const formatDeadline = (deadline: Date) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: 'Overdue', color: 'text-red-600' };
    } else if (diffDays === 0) {
      return { text: 'Today', color: 'text-yellow-600' };
    } else if (diffDays === 1) {
      return { text: 'Tomorrow', color: 'text-blue-600' };
    } else if (diffDays <= 7) {
      return { text: `${diffDays} days left`, color: 'text-blue-600' };
    } else {
      return { text: deadlineDate.toLocaleDateString(), color: 'text-gray-600' };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Tasks & Subtasks
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage and track your tasks and their subtasks
            </p>
          </div>
          <button
            onClick={() => setIsAddingTask(true)}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-500 to-purple-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Task
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Search tasks and subtasks..."
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as TaskStatus | 'all' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Status</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority
            </label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value as TaskPriority | 'all' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort By
            </label>
            <div className="flex space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'deadline' | 'priority' | 'status')}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="deadline">Deadline</option>
                <option value="priority">Priority</option>
                <option value="status">Status</option>
              </select>
              <button
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <SortAscIcon className={`h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Date Range Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {sortedTasks.length > 0 ? (
          sortedTasks.map(task => (
            <div key={task.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200">
              {/* Main Task */}
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div 
                    className="flex items-start space-x-3 flex-1 min-w-0 cursor-pointer"
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  >
                    {getStatusIcon(task.status)}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200">
                        {task.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {task.description}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                        <span className={`font-medium ${formatDeadline(task.deadline).color}`}>
                          {formatDeadline(task.deadline).text}
                        </span>
                        {task.isCarriedOver && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200">
                            Carried Over
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {/* Subtasks Toggle */}
                    {task.subtasks && task.subtasks.length > 0 && (
                      <button
                        onClick={() => toggleTaskExpansion(task.id)}
                        className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                      >
                        <ListIcon className="h-4 w-4" />
                        <span>{task.subtasks.length} subtasks</span>
                        <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${expandedTasks.has(task.id) ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                    
                    {/* Status Actions */}
                    <div className="flex items-center space-x-1">
                      {task.status !== 'completed' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTaskStatus(task.id, 'completed');
                          }}
                          className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors duration-200"
                          title="Mark as completed"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                        </button>
                      )}
                      {task.status === 'todo' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTaskStatus(task.id, 'in-progress');
                          }}
                          className="p-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors duration-200"
                          title="Start task"
                        >
                          <ClockIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    {/* View Details */}
                    <button
                      onClick={() => navigate(`/tasks/${task.id}`)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                      title="View details"
                    >
                      <ExternalLinkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Subtasks */}
              {task.subtasks && task.subtasks.length > 0 && expandedTasks.has(task.id) && (
                <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <div className="p-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Subtasks ({task.subtasks.filter(st => st.status === 'completed').length}/{task.subtasks.length} completed)
                    </h4>
                    <div className="space-y-2">
                      {task.subtasks.map(subtask => (
                        <div key={subtask.id} className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <button
                            onClick={() => updateTaskStatus(subtask.id, subtask.status === 'completed' ? 'todo' : 'completed')}
                            className="flex-shrink-0"
                          >
                            {getStatusIcon(subtask.status)}
                          </button>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {subtask.title}
                            </h5>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {subtask.description}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(subtask.priority)}`}>
                              {subtask.priority.charAt(0).toUpperCase() + subtask.priority.slice(1)}
                            </span>
                            <span className={`text-xs font-medium ${formatDeadline(subtask.deadline).color}`}>
                              {formatDeadline(subtask.deadline).text}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <ListIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No tasks found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {filters.search || filters.status !== 'all' || filters.priority !== 'all' 
                ? 'Try adjusting your filters to see more tasks.' 
                : 'Get started by creating your first task.'}
            </p>
            <button
              onClick={() => setIsAddingTask(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-500 to-purple-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Task
            </button>
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {isAddingTask && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-16 px-4 pb-16 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-black bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-80"></div>
            </div>
            <div className="relative inline-block align-bottom bg-white dark:bg-gray-900 rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:align-middle w-full max-w-4xl">
              <TaskForm onCancel={() => setIsAddingTask(false)} onTaskAdded={() => setIsAddingTask(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}