import React, { useState, useMemo } from 'react';
import { AlertCircleIcon, ClockIcon, CheckCircleIcon, UserIcon, CalendarIcon } from 'lucide-react';
import { Task, useTask } from '../../context/TaskContext';
import { useAuth } from '../../context/AuthContext';

export function BlockerDashboard() {
  const { tasks } = useTask();
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState<'all' | 'department' | 'my'>('all');

  const blockerTasks = useMemo(() => {
    let filteredTasks = tasks.filter(task => task.status === 'blocker');
    
    // Include subtask blockers
    const subtaskBlockers = tasks.flatMap(task => 
      task.subtasks?.filter(subtask => subtask.status === 'blocker') || []
    );
    filteredTasks = [...filteredTasks, ...subtaskBlockers];
    
    if (filter === 'department' && currentUser?.department) {
      filteredTasks = filteredTasks.filter(task => task.department === currentUser.department);
    } else if (filter === 'my') {
      filteredTasks = filteredTasks.filter(task => task.createdBy === currentUser?.id);
    }
    
    return filteredTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [tasks, filter, currentUser]);

  const getBlockerAge = (createdAt: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  const getDaysUntilDeadline = (deadline: Date) => {
    const now = new Date();
    const diffInDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays;
  };

  if (blockerTasks.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center">
          <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No Blocked Tasks
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filter === 'all' 
              ? 'All tasks are progressing smoothly!'
              : filter === 'department'
              ? 'No blocked tasks in your department.'
              : 'You have no blocked tasks.'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <AlertCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Blocked Tasks
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {blockerTasks.length} task{blockerTasks.length !== 1 ? 's' : ''} currently blocked
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <select
              value={filter}
              onChange={e => setFilter(e.target.value as any)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Blockers</option>
              <option value="department">My Department</option>
              <option value="my">My Tasks</option>
            </select>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {blockerTasks.map((task) => {
          const daysUntilDeadline = getDaysUntilDeadline(task.deadline);
          const isOverdue = daysUntilDeadline < 0;
          const isUrgent = daysUntilDeadline <= 1 && !isOverdue;

          return (
            <div key={task.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 truncate">
                      {task.title}
                    </h4>
                    {task.parentId && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        SUBTASK
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority.toUpperCase()}
                    </span>
                    {isOverdue && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        OVERDUE
                      </span>
                    )}
                    {isUrgent && !isOverdue && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                        URGENT
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {task.description}
                  </p>

                  {task.blockerReason && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-3">
                      <div className="flex items-start space-x-2">
                        <AlertCircleIcon className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-red-800 dark:text-red-200 mb-1">
                            Blocker Reason:
                          </p>
                          <p className="text-sm text-red-700 dark:text-red-300">
                            {task.blockerReason}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <UserIcon className="h-3 w-3" />
                      <span>{task.createdBy}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CalendarIcon className="h-3 w-3" />
                      <span>
                        Due {isOverdue ? `${Math.abs(daysUntilDeadline)}d ago` : 
                              isUrgent ? 'today' : 
                              `in ${daysUntilDeadline}d`}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ClockIcon className="h-3 w-3" />
                      <span>Blocked {getBlockerAge(task.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
