import React from 'react';
import { Task } from '../../context/TaskContext';
import { TaskCard } from '../tasks/TaskCard';
type WeeklyCalendarProps = {
  tasks: Task[];
};
export function WeeklyCalendar({
  tasks
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
  return <div>
      <div className="bg-white dark:bg-gray-900 px-4 py-5 border-b border-gray-200 dark:border-gray-700 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
          Weekly Calendar
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
          Tasks scheduled for this week
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700">
        {tasksByDay.map(({ date, tasks }) => <div key={date.toISOString()} className="min-h-[200px]">
              <div className={`px-4 py-2 text-center font-medium ${isToday(date) ? 'bg-[#e8f5f0] dark:bg-[#22332c] text-[#2e9d74] dark:text-[#2e9d74]' : 'bg-gray-50 dark:bg-gray-800 dark:text-gray-100'}`}> 
                {formatDate(date)}
                {isToday(date) && <span className="ml-2 text-xs font-bold">(Today)</span>}
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {tasks.length > 0 ? tasks.map(task => <div key={task.id} className="p-2">
                      <TaskCard task={task} />
                    </div>) : <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-300">
                    No tasks scheduled
                  </div>}
              </div>
            </div>)}
      </div>
    </div>;
}