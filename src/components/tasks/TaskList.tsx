import React, { useState } from 'react';
import { Task, TaskStatus, useTask } from '../../context/TaskContext';
import { TaskCard } from './TaskCard';
type TaskListProps = {
  tasks: Task[];
  onTaskClick?: (taskId: string) => void;
};
export function TaskList({
  tasks,
  onTaskClick
}: TaskListProps) {
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const filteredTasks = filter === 'all' ? tasks : tasks.filter(task => task.status === filter);
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // First sort by status (todo, in-progress, completed)
    const statusOrder = {
      todo: 0,
      'in-progress': 1,
      completed: 2
    };
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    // Then by priority (high, medium, low)
    const priorityOrder = {
      high: 0,
      medium: 1,
      low: 2
    };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    // Finally by deadline (soonest first)
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });
  return <div>
      <div className="bg-white dark:bg-gray-900 px-4 py-5 border-b border-gray-200 dark:border-gray-700 sm:px-6">
        <div className="flex flex-wrap items-center justify-between">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
            Tasks ({filteredTasks.length})
          </h3>
          <div className="flex mt-3 sm:mt-0">
            <select id="filter" name="filter" className="mt-1 block pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-[#2e9d74] focus:border-[#2e9d74] sm:text-sm rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value={filter} onChange={e => setFilter(e.target.value as TaskStatus | 'all')}>
              <option value="all">All Tasks</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {sortedTasks.length > 0 ? sortedTasks.map(task => <li key={task.id} onClick={onTaskClick ? () => onTaskClick(task.id) : undefined} className={onTaskClick ? 'cursor-pointer' : ''}>
              <TaskCard task={task} />
            </li>) : <li className="px-4 py-6 text-center text-gray-500 dark:text-gray-300">
            No tasks found. {filter !== 'all' && 'Try changing the filter.'}
          </li>}
      </ul>
    </div>;
}