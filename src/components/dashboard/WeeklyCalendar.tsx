import React from 'react';
import { Task } from '../../context/TaskContext';
import { TaskCard } from '../tasks/TaskCard';
type WeeklyCalendarProps = {
  tasks: Task[];
  onViewAll?: () => void;
};
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
            <div className={`px-4 py-3 text-center font-semibold border-b border-gray-200 dark:border-gray-700 ${
              isToday(date) 
                ? 'bg-gradient-to-r from-green-500 to-green-400 text-white' 
                : 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
            }`}> 
              <div className="text-sm">
                {formatDate(date)}
              </div>
              {isToday(date) && (
                <div className="text-xs font-bold mt-1 opacity-90">
                  Today
                </div>
              )}
            </div>
            
            {/* Tasks Container */}
            <div className="min-h-[300px] max-h-[500px] overflow-y-auto">
              {tasks.length > 0 ? (
                <div className="space-y-2 p-3">
                  {tasks.map(task => (
                    <div key={task.id} className="relative">
                      <TaskCard task={task} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[200px] p-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
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