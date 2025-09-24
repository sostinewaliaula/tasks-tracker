import React from 'react';
import { useTask } from '../../context/TaskContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
type TaskStatsProps = {
  department?: string;
  timeframe?: 'week' | 'month' | 'quarter';
};
export function TaskStats({
  department,
  timeframe = 'week'
}: TaskStatsProps) {
  const {
    getTasksCountByStatus,
    getTasksCountByPriority
  } = useTask();
  const statusCounts = getTasksCountByStatus(department);
  const priorityCounts = getTasksCountByPriority(department);
  const statusData = [{
    name: 'To Do',
    value: statusCounts.todo,
    color: '#CBD5E1'
  }, {
    name: 'In Progress',
    value: statusCounts['in-progress'],
    color: '#FBBF24'
  }, {
    name: 'Completed',
    value: statusCounts.completed,
    color: '#34D399'
  }];
  const priorityData = [{
    name: 'High',
    value: priorityCounts.high,
    color: '#F87171'
  }, {
    name: 'Medium',
    value: priorityCounts.medium,
    color: '#FBBF24'
  }, {
    name: 'Low',
    value: priorityCounts.low,
    color: '#34D399'
  }];
  const totalTasks = statusData.reduce((sum, item) => sum + item.value, 0);
  const completionRate = totalTasks > 0 ? Math.round(statusCounts.completed / totalTasks * 100) : 0;
  // Additional data for extended reports page
  const timeframeLabel = timeframe === 'week' ? 'This Week' : timeframe === 'month' ? 'This Month' : 'This Quarter';
  return <div className="space-y-6">
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Tasks</p>
              <p className="text-3xl font-bold">{totalTasks}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Completed</p>
              <p className="text-3xl font-bold">{statusCounts.completed}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Completion Rate</p>
              <p className="text-3xl font-bold">{completionRate}%</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-400 px-6 py-4">
            <h3 className="text-lg font-semibold text-white">
              Task Status Overview
            </h3>
            <p className="text-white/90 text-sm mt-1">
              {completionRate}% completion rate for {timeframeLabel.toLowerCase()}
            </p>
          </div>
          <div className="p-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5
              }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="value" name="Tasks" radius={[4, 4, 0, 0]}>
                    {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-4">
            <h3 className="text-lg font-semibold text-white">
              Priority Distribution
            </h3>
            <p className="text-white/90 text-sm mt-1">
              {totalTasks > 0 ? Math.round(priorityCounts.high / totalTasks * 100) : 0}% high priority tasks
            </p>
          </div>
          <div className="p-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={priorityData} 
                    cx="50%" 
                    cy="50%" 
                    labelLine={false} 
                    outerRadius={80} 
                    fill="#8884d8" 
                    dataKey="value" 
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {priorityData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {timeframeLabel} Summary
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
            Detailed breakdown of task metrics
          </p>
        </div>
        <div className="p-6">
          <dl className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="text-center">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Tasks Created
              </dt>
              <dd className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {totalTasks}
              </dd>
            </div>
            <div className="text-center">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Tasks Completed
              </dt>
              <dd className="text-3xl font-bold text-green-600 dark:text-green-400">
                {statusCounts.completed}
              </dd>
            </div>
            <div className="text-center">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Completion Rate
              </dt>
              <dd className="text-3xl font-bold text-[#2e9d74] dark:text-[#2e9d74]">
                {completionRate}%
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>;
}