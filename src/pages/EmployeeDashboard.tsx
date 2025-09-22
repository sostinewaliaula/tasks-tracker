import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTask } from '../context/TaskContext';
import { WeeklyCalendar } from '../components/dashboard/WeeklyCalendar';
import { TaskStats } from '../components/dashboard/TaskStats';
import { BellIcon, ArrowRight } from 'lucide-react';
export function EmployeeDashboard() {
  const {
    currentUser
  } = useAuth();
  const { notifications, getTasksByUser, getTasksForCurrentWeek } = useTask();
  const navigate = useNavigate();
  const userTasks = currentUser ? getTasksByUser(currentUser.id) : [];
  const weeklyTasks = getTasksForCurrentWeek();
  const myStats = useMemo(() => ({
    todo: userTasks.filter(t => t.status === 'todo').length,
    'in-progress': userTasks.filter(t => t.status === 'in-progress').length,
    completed: userTasks.filter(t => t.status === 'completed').length,
  }), [userTasks]);
  const overdueCount = useMemo(() => userTasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'completed').length, [userTasks]);
  const nextDeadlines = useMemo(() => userTasks
    .filter(t => t.status !== 'completed')
    .slice()
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 5), [userTasks]);
  const recentlyCompleted = useMemo(() => userTasks
    .filter(t => t.status === 'completed')
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5), [userTasks]);
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
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-3">
              <div className="text-xs text-gray-500 dark:text-gray-300">To Do</div>
              <div className="text-xl font-semibold">{myStats.todo}</div>
            </div>
            <div className="rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-3">
              <div className="text-xs text-gray-500 dark:text-gray-300">In Progress</div>
              <div className="text-xl font-semibold">{myStats['in-progress']}</div>
            </div>
            <div className="rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-3">
              <div className="text-xs text-gray-500 dark:text-gray-300">Overdue</div>
              <div className="text-xl font-semibold text-red-600 dark:text-red-400">{overdueCount}</div>
        </div>
          </div>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3" />
      </div>
      {/* Optional: richer charts */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500 dark:text-gray-300">This Week Overview</span>
          <button onClick={() => navigate('/reports')} className="inline-flex items-center px-4 py-2 rounded-full text-white bg-gradient-to-r from-[#2e9d74] to-[#8c52ff] hover:opacity-90 text-sm">
            View Reports
            <ArrowRight className="h-4 w-4 ml-2" />
          </button>
        </div>
        <TaskStats timeframe="week" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 shadow overflow-hidden sm:rounded-md">
          <WeeklyCalendar tasks={weeklyTasks} onViewAll={() => navigate('/tasks')} />
        </div>
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 sm:px-6 flex items-center justify-between">
              <BellIcon className="h-5 w-5 text-[#2e9d74] mr-2" />
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">Notifications</h3>
              <button onClick={() => navigate('/notifications')} className="inline-flex items-center px-4 py-2 rounded-full text-white bg-gradient-to-r from-[#2e9d74] to-[#8c52ff] hover:opacity-90 text-sm">
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            </div>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.length ? notifications.slice(-10).reverse().map(n => (
                <li key={n.id} className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{n.message}</li>
              )) : <li className="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">No notifications</li>}
            </ul>
          </div>
          <div className="bg-white dark:bg-gray-900 shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 sm:px-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">My Next Deadlines</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">Upcoming tasks due soon</p>
              </div>
              <button onClick={() => navigate('/tasks')} className="inline-flex items-center px-4 py-2 rounded-full text-white bg-gradient-to-r from-[#2e9d74] to-[#8c52ff] hover:opacity-90 text-sm">
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            </div>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {nextDeadlines.length ? nextDeadlines.map(t => (
                <li key={t.id} className="px-4 py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 dark:text-gray-100 font-medium truncate mr-2">{t.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">{new Date(t.deadline).toLocaleDateString()}</span>
                  </div>
                </li>
              )) : <li className="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">No upcoming deadlines</li>}
            </ul>
          </div>
      <div className="bg-white dark:bg-gray-900 shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 sm:px-6 flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">Recently Completed</h3>
              <button onClick={() => navigate('/tasks')} className="inline-flex items-center px-4 py-2 rounded-full text-white bg-gradient-to-r from-[#2e9d74] to-[#8c52ff] hover:opacity-90 text-sm">
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            </div>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentlyCompleted.length ? recentlyCompleted.map(t => (
                <li key={t.id} className="px-4 py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 dark:text-gray-100 font-medium truncate mr-2">{t.title}</span>
                    <span className="text-xs text-green-700 dark:text-green-300">Completed</span>
                  </div>
                </li>
              )) : <li className="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">No completed tasks yet</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>;
}