import React, { useEffect, useState } from 'react';
import { Task, TaskStatus, useTask } from '../../context/TaskContext';
import { ClockIcon, CheckCircleIcon, CircleIcon, CheckIcon, AlertCircleIcon } from 'lucide-react';
type TaskCardProps = {
  task: Task;
};
export function TaskCard({
  task
}: TaskCardProps) {
  const {
    updateTaskStatus,
    carryOverTask
  } = useTask();
  // Live timer state
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [timerColor, setTimerColor] = useState<string>('');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const deadlineDate = new Date(task.deadline);
      const diff = deadlineDate.getTime() - now.getTime();
      if (diff > 0 && diff < 24 * 60 * 60 * 1000) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}:${seconds.toString().padStart(2, '0')} left`);
        if (diff < 60 * 60 * 1000) {
          setTimerColor('text-red-600 font-bold');
        } else if (diff < 6 * 60 * 60 * 1000) {
          setTimerColor('text-yellow-600 font-semibold');
        } else {
          setTimerColor('text-green-600 font-semibold');
        }
      } else {
        setTimeLeft(null);
        setTimerColor('');
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [task.deadline]);
  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'todo':
        return <CircleIcon className="h-5 w-5 text-gray-400" />;
      case 'in-progress':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'blocker':
        return <AlertCircleIcon className="h-5 w-5 text-red-500" />;
    }
  };
  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case 'todo':
        return 'To Do';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'blocker':
        return 'Blocked';
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
    }
  };
  const getDeadlineText = (deadline: Date) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return 'Overdue';
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return '1 day left';
    } else {
      return `${diffDays} days left`;
    }
  };
  const getDeadlineColor = (deadline: Date) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return 'text-red-600';
    } else if (diffDays <= 1) {
      return 'text-yellow-600';
    } else {
      return 'text-green-600';
    }
  };
  const handleStatusChange = (newStatus: TaskStatus) => {
    updateTaskStatus(task.id, newStatus);
  };
  return <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Task Header */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {getStatusIcon(task.status)}
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {task.title}
            </h3>
          </div>
          <div className="flex items-center space-x-2 ml-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>
            {task.status === 'blocker' && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                Blocked
              </span>
            )}
            {task.isCarriedOver && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                Carried over
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Task Content */}
      <div className="px-4 py-3">
        {/* Description */}
        {task.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Blocker Reason */}
        {task.status === 'blocker' && task.blockerReason && (
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

        {/* Status and Time Info */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Status:
            </span>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {getStatusText(task.status)}
            </span>
          </div>
          <div className="flex items-center">
            <span className={`text-xs font-medium ${timeLeft ? timerColor : getDeadlineColor(task.deadline)}`}>
              {timeLeft ? timeLeft : getDeadlineText(task.deadline)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {task.status !== 'completed' && (
              <>
                {task.status === 'todo' && (
                  <button 
                    onClick={() => handleStatusChange('in-progress')} 
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-[#2e9d74] bg-[#e8f5f0] hover:bg-[#d1ebe3] dark:bg-[#22332c] dark:hover:bg-[#1a2821] transition-colors duration-200"
                  >
                    Start
                  </button>
                )}
                <button 
                  onClick={() => handleStatusChange('completed')} 
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-green-700 dark:text-green-200 bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 transition-colors duration-200"
                >
                  <CheckIcon className="h-3 w-3 mr-1" />
                  Complete
                </button>
              </>
            )}
          </div>
          
          {/* Carry Over Button */}
          {(new Date(task.deadline).getTime() < new Date().getTime()) && task.status !== 'completed' && (
            <a 
              href={`/tasks/${task.id}`} 
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-[#2e9d74] text-white hover:bg-[#259d6a] transition-colors duration-200"
            >
              Carry over
            </a>
          )}
        </div>
      </div>
    </div>;
}