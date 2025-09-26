import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUpIcon, BellIcon, CheckCircleIcon, ClockIcon, AlertTriangleIcon } from 'lucide-react';

interface NotificationAnalyticsProps {
  onClose?: () => void;
}

interface AnalyticsData {
  period: string;
  typeStats: Array<{ type: string; count: number }>;
  priorityStats: Array<{ priority: string; count: number }>;
  readStats: Array<{ read: boolean; count: number }>;
  dailyStats: Array<{ date: string; count: number; read_count: number; unread_count: number }>;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];

export function NotificationAnalytics({ onClose }: NotificationAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/notifications/analytics?days=${period}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center text-red-500">
          <AlertTriangleIcon className="h-8 w-8 mx-auto mb-2" />
          <p>Error loading analytics: {error}</p>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const totalNotifications = analytics.readStats.reduce((sum, stat) => sum + stat.count, 0);
  const readNotifications = analytics.readStats.find(stat => stat.read)?.count || 0;
  const unreadNotifications = analytics.readStats.find(stat => !stat.read)?.count || 0;
  const readPercentage = totalNotifications > 0 ? Math.round((readNotifications / totalNotifications) * 100) : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-green-500 to-purple-600 rounded-lg">
            <TrendingUpIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Notification Analytics
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Insights for the last {analytics.period}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
          <div className="flex items-center">
            <BellIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{totalNotifications}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Read</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{readNotifications}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-4">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Unread</p>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{unreadNotifications}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4">
          <div className="flex items-center">
            <TrendingUpIcon className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Read Rate</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{readPercentage}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Notification Types */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">By Type</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.typeStats}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ type, count }) => `${type}: ${count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {analytics.typeStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Distribution */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">By Priority</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.priorityStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="priority" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Trends */}
      {analytics.dailyStats.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Daily Trends</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.dailyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} name="Total" />
              <Line type="monotone" dataKey="read_count" stroke="#8b5cf6" strokeWidth={2} name="Read" />
              <Line type="monotone" dataKey="unread_count" stroke="#f59e0b" strokeWidth={2} name="Unread" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
