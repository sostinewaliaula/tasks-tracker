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
  return <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Task Status Overview
            </h3>
            <div className="mt-1 text-3xl font-semibold text-gray-900">
              {totalTasks} Tasks
            </div>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {completionRate}% completion rate for{' '}
              {timeframeLabel.toLowerCase()}
            </p>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5
              }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Tasks" fill="#2e9d74">
                    {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Task Priority Distribution
            </h3>
            <div className="mt-1 text-3xl font-semibold text-gray-900">
              {priorityCounts.high} High Priority
            </div>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {totalTasks > 0 ? Math.round(priorityCounts.high / totalTasks * 100) : 0}
              % of all tasks
            </p>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={priorityData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" label={({
                  name,
                  percent
                }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                    {priorityData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {timeframeLabel} Summary
          </h3>
          <div className="mt-5 border-t border-gray-200 pt-5">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">
                  Tasks Created
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {totalTasks}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">
                  Tasks Completed
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-green-600">
                  {statusCounts.completed}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">
                  Completion Rate
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-[#2e9d74]">
                  {completionRate}%
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>;
}