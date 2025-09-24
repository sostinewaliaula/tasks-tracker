import React from 'react';
import { Task, TaskStatus, useTask } from '../../context/TaskContext';
import { ClockIcon, CheckCircleIcon, CircleIcon, ExternalLinkIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
type WeeklyCalendarProps = {
  tasks: Task[];
  onViewAll?: () => void;
};
// Compact Task Card for Calendar
function CompactTaskCard({ task }: { task: Task }) {
  const navigate = useNavigate();

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'todo':
        return <CircleIcon className="h-3 w-3 text-gray-400" />;
      case 'in-progress':
        return <ClockIcon className="h-3 w-3 text-yellow-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-3 w-3 text-green-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200';
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
      return 'Today';
    } else if (diffDays === 1) {
      return '1d left';
    } else {
      return `${diffDays}d left`;
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

  const handleTaskClick = () => {
    navigate(`/tasks/${task.id}`);
  };

  return (
    <div 
      onClick={handleTaskClick}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-green-300 dark:hover:border-green-600 transition-all duration-200 overflow-hidden group cursor-pointer"
    >
      {/* Compact Header */}
      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
        <div className="space-y-1">
          <div className="flex items-start space-x-2">
            {getStatusIcon(task.status)}
            <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-200 leading-tight flex-1">
              {task.title}
            </h3>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                {task.priority.charAt(0).toUpperCase()}
              </span>
              {task.isCarriedOver && (
                <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200">
                  C
                </span>
              )}
            </div>
            <ExternalLinkIcon className="h-3 w-3 text-gray-400 group-hover:text-green-500 transition-colors duration-200 opacity-0 group-hover:opacity-100" />
          </div>
        </div>
      </div>

      {/* Compact Content */}
      <div className="px-3 py-2">
        {/* Status and Time */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {task.status === 'todo' ? 'To Do' : task.status === 'in-progress' ? 'In Progress' : 'Complete'}
          </span>
          <span className={`text-xs font-medium ${getDeadlineColor(task.deadline)}`}>
            {getDeadlineText(task.deadline)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function WeeklyCalendar({
  tasks,
  onViewAll
}: WeeklyCalendarProps) {
  // Get the current week's dates (Monday to Friday)
  const getWeekDays = () => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ...
    // Find the most recent Monday
    const monday = new Date(now);
    monday.setDate(now.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    monday.setHours(0, 0, 0, 0);
    const weekDays = [];
    // Create array of weekdays (Monday to Friday)
    for (let i = 0; i < 5; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      weekDays.push(day);
    }
    return weekDays;
  };
  const weekDays = getWeekDays();
  // Group tasks by day
  const tasksByDay = weekDays.map(day => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    return {
      date: day,
      tasks: tasks.filter(task => {
        const taskDate = new Date(task.deadline);
        return taskDate >= dayStart && taskDate <= dayEnd;
      })
    };
  });
  // Format date as "Mon, 01 Jan"
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: '2-digit',
      month: 'short'
    });
  };
  // Check if the date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };
  return <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="bg-gradient-to-r from-green-500 to-purple-600 px-6 py-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">
              Weekly Calendar
            </h3>
            <p className="mt-1 text-sm text-white/90">
              Tasks scheduled for this week
            </p>
          </div>
          {onViewAll && (
            <button 
              onClick={onViewAll} 
              className="inline-flex items-center px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-200 text-sm font-medium"
            >
              Go to Tasks
            </button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5">
        {tasksByDay.map(({ date, tasks }, index) => (
          <div key={date.toISOString()} className={`relative ${index !== 4 ? 'md:border-r border-gray-200 dark:border-gray-700' : ''}`}>
            {/* Day Header */}
            <div className={`px-3 py-2 text-center font-semibold border-b border-gray-200 dark:border-gray-700 ${
              isToday(date) 
                ? 'bg-gradient-to-r from-green-500 to-green-400 text-white' 
                : 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
            }`}> 
              <div className="flex items-center justify-between">
                <div className="text-xs">
                  {formatDate(date)}
                </div>
                {tasks.length > 0 && (
                  <div className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isToday(date) 
                      ? 'bg-white/20 text-white' 
                      : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                  }`}>
                    {tasks.length}
                  </div>
                )}
              </div>
              {isToday(date) && (
                <div className="text-xs font-bold mt-0.5 opacity-90">
                  Today
                </div>
              )}
            </div>
            
            {/* Tasks Container */}
            <div className="min-h-[250px] max-h-[600px] overflow-y-auto">
              {tasks.length > 0 ? (
                <div className="space-y-1.5 p-2">
                  {tasks.map(task => (
                    <div key={task.id} className="relative">
                      <CompactTaskCard task={task} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[200px] p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    No tasks scheduled
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>;
}