import React, { useState, useMemo } from 'react';
import { useTask } from '../../context/TaskContext';
import { useAuth } from '../../context/AuthContext';
import { AlertCircleIcon, ClockIcon, TrendingUpIcon, UsersIcon, CalendarIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface BlockerReportProps {
  department?: string;
  timeframe?: 'week' | 'month' | 'quarter';
}

export function BlockerReport({ department, timeframe = 'week' }: BlockerReportProps) {
  const { tasks } = useTask();
  const { currentUser } = useAuth();
  const [viewMode, setViewMode] = useState<'overview' | 'trends' | 'details'>('overview');

  const blockerData = useMemo(() => {
    let filteredTasks = tasks.filter(task => task.status === 'blocker');
    
    // Include subtask blockers
    const subtaskBlockers = tasks.flatMap(task => 
      task.subtasks?.filter(subtask => subtask.status === 'blocker') || []
    );
    filteredTasks = [...filteredTasks, ...subtaskBlockers];
    
    if (department && currentUser?.department) {
      filteredTasks = filteredTasks.filter(task => task.department === department);
    }
    
    return filteredTasks;
  }, [tasks, department, currentUser]);

  const getBlockerAge = (createdAt: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d`;
    }
  };

  const getDaysUntilDeadline = (deadline: Date) => {
    const now = new Date();
    const diffInDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays;
  };

  const blockerStats = useMemo(() => {
    const totalBlockers = blockerData.length;
    const overdueBlockers = blockerData.filter(task => getDaysUntilDeadline(task.deadline) < 0).length;
    const urgentBlockers = blockerData.filter(task => {
      const days = getDaysUntilDeadline(task.deadline);
      return days <= 1 && days >= 0;
    }).length;
    const longTermBlockers = blockerData.filter(task => {
      const age = getBlockerAge(task.createdAt);
      return parseInt(age) > 7; // More than 7 days
    }).length;

    return {
      total: totalBlockers,
      overdue: overdueBlockers,
      urgent: urgentBlockers,
      longTerm: longTermBlockers,
      averageAge: totalBlockers > 0 ? 
        Math.round(blockerData.reduce((sum, task) => {
          const age = getBlockerAge(task.createdAt);
          return sum + parseInt(age);
        }, 0) / totalBlockers) : 0
    };
  }, [blockerData]);

  const priorityData = useMemo(() => {
    const priorityCounts = blockerData.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'High', value: priorityCounts.high || 0, color: '#EF4444' },
      { name: 'Medium', value: priorityCounts.medium || 0, color: '#F59E0B' },
      { name: 'Low', value: priorityCounts.low || 0, color: '#10B981' }
    ];
  }, [blockerData]);

  const departmentData = useMemo(() => {
    const deptCounts = blockerData.reduce((acc, task) => {
      acc[task.department] = (acc[task.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(deptCounts).map(([dept, count]) => ({
      name: dept,
      value: count,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    }));
  }, [blockerData]);

  const ageDistribution = useMemo(() => {
    const ageGroups = {
      '0-1d': 0,
      '1-3d': 0,
      '3-7d': 0,
      '7d+': 0
    };

    blockerData.forEach(task => {
      const age = parseInt(getBlockerAge(task.createdAt));
      if (age <= 1) ageGroups['0-1d']++;
      else if (age <= 3) ageGroups['1-3d']++;
      else if (age <= 7) ageGroups['3-7d']++;
      else ageGroups['7d+']++;
    });

    return Object.entries(ageGroups).map(([range, count]) => ({
      name: range,
      value: count,
      color: range === '7d+' ? '#EF4444' : range === '3-7d' ? '#F59E0B' : '#10B981'
    }));
  }, [blockerData]);

  if (blockerData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
            <AlertCircleIcon className="h-8 w-8 text-green-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Blockers Found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {department ? 'No blocked tasks in this department.' : 'No blocked tasks in the system.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Blocker Report
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {department ? `${department} Department` : 'All Departments'} • {timeframe} view
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'overview'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setViewMode('trends')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'trends'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Trends
            </button>
            <button
              onClick={() => setViewMode('details')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'details'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Details
            </button>
          </div>
        </div>
      </div>

      {/* Overview Mode */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Key Metrics */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Key Metrics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {blockerStats.total}
                </div>
                <div className="text-sm text-red-700 dark:text-red-300">Total Blockers</div>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {blockerStats.averageAge}d
                </div>
                <div className="text-sm text-orange-700 dark:text-orange-300">Avg Age</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {blockerStats.urgent}
                </div>
                <div className="text-sm text-yellow-700 dark:text-yellow-300">Urgent</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {blockerStats.longTerm}
                </div>
                <div className="text-sm text-purple-700 dark:text-purple-300">Long-term</div>
              </div>
            </div>
          </div>

          {/* Priority Distribution */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Priority Distribution
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Age Distribution */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Blocker Age Distribution
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Distribution */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Department Distribution
            </h3>
            <div className="space-y-3">
              {departmentData.map((dept, index) => (
                <div key={dept.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: dept.color }}
                    ></div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {dept.name}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {dept.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Details Mode */}
      {viewMode === 'details' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Blocked Tasks Details
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {blockerData.length} blocked tasks found
            </p>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {blockerData.map((task) => {
              const daysUntilDeadline = getDaysUntilDeadline(task.deadline);
              const isOverdue = daysUntilDeadline < 0;
              const isUrgent = daysUntilDeadline <= 1 && !isOverdue;
              const age = getBlockerAge(task.createdAt);

              return (
                <div key={task.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50">
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
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          task.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
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
                          <UsersIcon className="h-3 w-3" />
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
                          <span>Blocked {age} ago</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
