import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTask } from '../context/TaskContext';
import { WeeklyCalendar } from '../components/dashboard/WeeklyCalendar';
import { TaskStats } from '../components/dashboard/TaskStats';
import { BlockerDashboard } from '../components/dashboard/BlockerDashboard';
import { BellIcon, ArrowRight, Loader2, AlertCircleIcon } from 'lucide-react';
export function EmployeeDashboard() {
  const {
    currentUser
  } = useAuth();
  const { notifications, getTasksByUser, getTasksForCurrentWeek, tasks } = useTask();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // Format display name like in Header component
  const formatDisplayName = (name?: string) => {
    if (!name) return '';
    const cleaned = name.replace(/[._]+/g, ' ').trim();
    return cleaned
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const rawName = currentUser?.name 
    || (currentUser as any)?.email?.split('@')[0]
    || (currentUser as any)?.ldap_uid
    || '';
  const displayName = formatDisplayName(rawName);
  
  const userTasks = currentUser ? getTasksByUser(currentUser.id) : [];
  const weeklyTasks = getTasksForCurrentWeek();
  
  // Debug logging
  console.log('User tasks:', userTasks);
  console.log('Weekly tasks:', weeklyTasks);
  console.log('Current user:', currentUser);

  // Function to create sample tasks for testing
  const createSampleTasks = async () => {
    if (!currentUser) return;
    
    const sampleTasks = [
      {
        title: "Review quarterly reports",
        description: "Analyze Q4 performance metrics and prepare summary",
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        priority: "high" as const,
        status: "todo" as const,
        department: currentUser.department_id,
        createdBy: currentUser.id
      },
      {
        title: "Update project documentation",
        description: "Update API documentation and user guides",
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        priority: "medium" as const,
        status: "in-progress" as const,
        department: currentUser.department_id,
        createdBy: currentUser.id
      },
      {
        title: "Team meeting preparation",
        description: "Prepare agenda and materials for weekly team meeting",
        deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago (overdue)
        priority: "high" as const,
        status: "todo" as const,
        department: currentUser.department_id,
        createdBy: currentUser.id
      },
      {
        title: "Code review completed",
        description: "Completed review of pull request #123",
        deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        priority: "medium" as const,
        status: "completed" as const,
        department: currentUser.department_id,
        createdBy: currentUser.id
      },
      {
        title: "Database migration blocked",
        description: "Waiting for approval from security team",
        deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        priority: "high" as const,
        status: "blocker" as const,
        blockerReason: "Security team needs to review migration scripts before proceeding",
        department: currentUser.department_id,
        createdBy: currentUser.id
      },
      {
        title: "Database optimization",
        description: "Optimize database queries for better performance",
        deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        priority: "low" as const,
        status: "completed" as const,
        department: currentUser.department_id,
        createdBy: currentUser.id
      }
    ];

    try {
      for (const task of sampleTasks) {
        await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify({
            title: task.title,
            description: task.description,
            deadline: task.deadline.toISOString(),
            priority: task.priority,
            status: task.status,
            departmentId: null,
            createdById: parseInt(currentUser.id)
          })
        });
      }
      // Refresh the page to show new tasks
      window.location.reload();
    } catch (error) {
      console.error('Error creating sample tasks:', error);
    }
  };
  
  const myStats = useMemo(() => {
    // Count main task blockers
    const mainTaskBlockers = userTasks.filter(t => t.status === 'blocker').length;
    // Count subtask blockers
    const subtaskBlockers = userTasks.reduce((count, task) => {
      return count + (task.subtasks?.filter(subtask => subtask.status === 'blocker').length || 0);
    }, 0);
    
    const stats = {
    todo: userTasks.filter(t => t.status === 'todo').length,
    'in-progress': userTasks.filter(t => t.status === 'in-progress').length,
    completed: userTasks.filter(t => t.status === 'completed').length,
      blocker: mainTaskBlockers + subtaskBlockers,
    };
    
    console.log('myStats debug:', { mainTaskBlockers, subtaskBlockers, stats, userTasks: userTasks.length });
    return stats;
  }, [userTasks]);
  
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

  // Loading state management
  useEffect(() => {
    if (currentUser && tasks.length >= 0) {
      setIsLoading(false);
    }
  }, [currentUser, tasks]);
  return <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-green-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {isLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      Loading...
                    </div>
                  ) : currentUser ? (
                    `Welcome back, ${displayName || 'User'}!`
                  ) : (
                    'Welcome back!'
                  )}
                </h1>
                <p className="text-white/90 text-lg mb-2">
                  Here's your task overview for this week
                </p>
                {currentUser && (
                  <div className="flex items-center space-x-4 text-sm text-white/80">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {currentUser.email}
                    </span>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {currentUser.department_id}
                    </span>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
                    </span>
                  </div>
                )}
              </div>
              <div className="hidden md:block">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            <div className="flex items-center relative z-10">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-4 shadow-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">To Do</p>
                {isLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-400">Loading...</span>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{myStats.todo}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            <div className="flex items-center relative z-10">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mr-4 shadow-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
                {isLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-400">Loading...</span>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{myStats['in-progress']}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            <div className="flex items-center relative z-10">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center mr-4 shadow-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue</p>
                {isLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-400">Loading...</span>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{overdueCount}</p>
                )}
              </div>
        </div>
          </div>

          {/* Blocker Stats Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            <div className="flex items-center relative z-10">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center mr-4 shadow-sm">
                <AlertCircleIcon className="w-6 h-6 text-white" />
            </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Blocked</p>
                {isLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-400">Loading...</span>
            </div>
                ) : (
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{myStats.blocker}</p>
                )}
        </div>
          </div>
        </div>
      </div>
        {/* Analytics Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">This Week Overview</h2>
            <div className="flex items-center space-x-3">
              {userTasks.length === 0 && (
                <button 
                  onClick={createSampleTasks} 
                  className="inline-flex items-center px-4 py-2 rounded-lg text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-sm font-medium"
                >
                  Create Sample Tasks
                </button>
              )}
              <button 
                onClick={() => navigate('/reports')} 
                className="inline-flex items-center px-4 py-2 rounded-lg text-white bg-gradient-to-r from-green-500 to-purple-600 hover:from-green-600 hover:to-purple-700 transition-all duration-200 text-sm font-medium"
              >
            View Reports
            <ArrowRight className="h-4 w-4 ml-2" />
          </button>
            </div>
        </div>
        <TaskStats timeframe="week" />
      </div>

        {/* Main Content Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#2e9d74] mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Calendar Section */}
            <div className="lg:col-span-2">
          <WeeklyCalendar tasks={weeklyTasks} onViewAll={() => navigate('/tasks')} />
        </div>
            
            {/* Sidebar */}
        <div className="space-y-6">
            {/* Notifications */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-400 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BellIcon className="h-5 w-5 text-white mr-2" />
                    <h3 className="text-lg font-semibold text-white">Notifications</h3>
                  </div>
                  <button 
                    onClick={() => navigate('/notifications')} 
                    className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors duration-200 text-sm font-medium"
                  >
                View All
                    <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            </div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {notifications.slice(-5).reverse().map(n => (
                      <li key={n.id} className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                        {n.message}
                      </li>
                    ))}
            </ul>
                ) : (
                  <div className="px-6 py-8 text-center">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                      <BellIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">No notifications</p>
          </div>
                )}
              </div>
          </div>

            {/* Next Deadlines */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-purple-600 px-6 py-4">
                  <div className="flex items-center justify-between">
              <div>
                    <h3 className="text-lg font-semibold text-white">Next Deadlines</h3>
                    <p className="text-white/90 text-sm">Upcoming tasks due soon</p>
              </div>
                  <button 
                    onClick={() => navigate('/tasks')} 
                    className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors duration-200 text-sm font-medium"
                  >
                View All
                    <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            </div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {isLoading ? (
                  <div className="px-6 py-8 text-center">
                    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading deadlines...</p>
                  </div>
                ) : nextDeadlines.length ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {nextDeadlines.map(t => {
                      const deadline = new Date(t.deadline);
                      const now = new Date();
                      const diffTime = deadline.getTime() - now.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      const isOverdue = diffDays < 0;
                      const isDueSoon = diffDays <= 1 && diffDays >= 0;
                      
                      return (
                        <li key={t.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate block">
                                {t.title}
                              </span>
                              <span className={`text-xs ${isOverdue ? 'text-red-600' : isDueSoon ? 'text-yellow-600' : 'text-gray-500 dark:text-gray-400'}`}>
                                {isOverdue ? `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}` : 
                                 isDueSoon ? 'Due soon' : 
                                 `Due in ${diffDays} day${diffDays !== 1 ? 's' : ''}`}
                              </span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ml-2 ${
                              isOverdue ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' :
                              isDueSoon ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
                              'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}>
                              {deadline.toLocaleDateString()}
                            </span>
                  </div>
                </li>
                      );
                    })}
            </ul>
                ) : (
                  <div className="px-6 py-8 text-center">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No upcoming deadlines</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Create some tasks to see them here</p>
                  </div>
                )}
          </div>
            </div>

            {/* Blocked Tasks */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Blocked Tasks</h3>
                    <p className="text-white/90 text-sm">Tasks that need attention</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AlertCircleIcon className="h-5 w-5 text-white" />
                    <span className="text-white font-medium">
                      {(() => {
                        // Count main task blockers
                        const mainTaskBlockers = tasks.filter(t => t.status === 'blocker' && t.createdBy === currentUser?.id).length;
                        // Count subtask blockers
                        const subtaskBlockers = tasks.reduce((count, task) => {
                          return count + (task.subtasks?.filter(subtask => 
                            subtask.status === 'blocker' && subtask.createdBy === currentUser?.id
                          ).length || 0);
                        }, 0);
                        const total = mainTaskBlockers + subtaskBlockers;
                        console.log('Blocker count debug:', { mainTaskBlockers, subtaskBlockers, total, tasks: tasks.length });
                        return total;
                      })()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <BlockerDashboard />
              </div>
            </div>

            {/* Recently Completed */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Recently Completed</h3>
                    <p className="text-white/90 text-sm">Your recent achievements</p>
          </div>
                  <button 
                    onClick={() => navigate('/tasks')} 
                    className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors duration-200 text-sm font-medium"
                  >
                View All
                    <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            </div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {isLoading ? (
                  <div className="px-6 py-8 text-center">
                    <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading completed tasks...</p>
                  </div>
                ) : recentlyCompleted.length ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {recentlyCompleted.map(t => {
                      const completedDate = new Date(t.createdAt);
                      const now = new Date();
                      const diffTime = now.getTime() - completedDate.getTime();
                      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                      
                      return (
                        <li key={t.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate block">
                                {t.title}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {diffDays === 0 ? 'Completed today' : 
                                 diffDays === 1 ? 'Completed yesterday' : 
                                 `Completed ${diffDays} days ago`}
                              </span>
                            </div>
                            <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 whitespace-nowrap ml-2">
                              ✓ Completed
                            </span>
                  </div>
                </li>
                      );
                    })}
            </ul>
                ) : (
                  <div className="px-6 py-8 text-center">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No completed tasks yet</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Complete some tasks to see them here</p>
                  </div>
                )}
              </div>
          </div>
        </div>
        </div>
        )}
      </div>
    </div>;
}