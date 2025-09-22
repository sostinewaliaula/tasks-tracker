import React, { useEffect, useState } from 'react';
import { Task, TaskStatus, useTask } from '../../context/TaskContext';
import { ClockIcon, CheckCircleIcon, CircleIcon, CheckIcon } from 'lucide-react';
type TaskCardProps = {
  task: Task;
};
export function TaskCard({
  task
}: TaskCardProps) {
  const {
    updateTaskStatus
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
  return <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {getStatusIcon(task.status)}
          <p className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100">{task.title}</p>
          <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>
        </div>
        <div className="flex items-center">
          <span className={`text-sm ${timeLeft ? timerColor : getDeadlineColor(task.deadline)} dark:text-gray-300`}>
            {timeLeft ? timeLeft : getDeadlineText(task.deadline)}
          </span>
        </div>
      </div>
      <div className="mt-2 sm:flex sm:justify-between">
        <div className="sm:flex">
          <p className="text-sm text-gray-500 dark:text-gray-300">{task.description}</p>
        </div>
        <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-300 sm:mt-0">
          <p>Status: {getStatusText(task.status)}</p>
          {task.status !== 'completed' && <div className="ml-4">
              {task.status === 'todo' && <button onClick={() => handleStatusChange('in-progress')} className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-[#2e9d74] bg-[#e8f5f0] hover:bg-[#d1ebe3] dark:bg-[#22332c] dark:hover:bg-[#1a2821] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2e9d74]">
                  Start
                </button>}
              <button onClick={() => handleStatusChange('completed')} className="ml-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 dark:text-green-200 bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                <CheckIcon className="h-4 w-4 mr-1" />
                Complete
              </button>
            </div>}
        </div>
      </div>
    </div>;
}