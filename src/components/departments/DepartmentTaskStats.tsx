import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/Toast';
import { 
  ChartBarIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  AlertTriangleIcon,
  UsersIcon,
  CalendarIcon
} from 'lucide-react';

interface DepartmentStats {
  totalTasks: number;
  todo: number;
  inProgress: number;
  completed: number;
  blocker: number;
  high: number;
  medium: number;
  low: number;
  overdue: number;
  completionRate: number;
  averageCompletionTime: number;
  totalUsers: number;
}

interface DepartmentTaskStatsProps {
  departmentId: number;
  departmentName: string;
  onClose: () => void;
}

export function DepartmentTaskStats({ departmentId, departmentName, onClose }: DepartmentTaskStatsProps) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState<DepartmentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDepartmentStats();
  }, [departmentId]);

  const fetchDepartmentStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/departments/${departmentId}/stats`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch department statistics');
      }

      const data = await response.json();
      setStats(data.data.stats);
    } catch (error) {
      console.error('Error fetching department stats:', error);
      showToast('Failed to load department statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="text-center text-gray-400">
            <AlertTriangleIcon className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <p>Failed to load department statistics</p>
          </div>
        </div>
      </div>
    );
  }

  const statusData = [
    { name: 'To Do', value: stats.todo, color: '#CBD5E1' },
    { name: 'In Progress', value: stats.inProgress, color: '#FBBF24' },
    { name: 'Completed', value: stats.completed, color: '#34D399' },
    { name: 'Blocked', value: stats.blocker, color: '#EF4444' }
  ];

  const priorityData = [
    { name: 'High', value: stats.high, color: '#F87171' },
    { name: 'Medium', value: stats.medium, color: '#FBBF24' },
    { name: 'Low', value: stats.low, color: '#34D399' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-purple-600 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Task Statistics</h2>
              <p className="text-gray-400">{departmentName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Tasks</p>
                <p className="text-2xl font-bold text-white">{stats.totalTasks}</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Completion Rate</p>
                <p className="text-2xl font-bold text-green-500">{stats.completionRate}%</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Overdue Tasks</p>
                <p className="text-2xl font-bold text-red-500">{stats.overdue}</p>
              </div>
              <AlertTriangleIcon className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Team Members</p>
                <p className="text-2xl font-bold text-purple-500">{stats.totalUsers}</p>
              </div>
              <UsersIcon className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Task Status Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Task Status</h3>
            <div className="space-y-3">
              {statusData.map((status) => (
                <div key={status.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: status.color }}
                    ></div>
                    <span className="text-gray-300">{status.name}</span>
                  </div>
                  <span className="text-white font-semibold">{status.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Task Priority</h3>
            <div className="space-y-3">
              {priorityData.map((priority) => (
                <div key={priority.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: priority.color }}
                    ></div>
                    <span className="text-gray-300">{priority.name}</span>
                  </div>
                  <span className="text-white font-semibold">{priority.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <ClockIcon className="h-5 w-5 text-blue-500" />
                  <span className="text-gray-300">Avg. Completion Time</span>
                </div>
                <span className="text-white font-semibold">
                  {stats.averageCompletionTime} days
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CalendarIcon className="h-5 w-5 text-orange-500" />
                  <span className="text-gray-300">Tasks per User</span>
                </div>
                <span className="text-white font-semibold">
                  {stats.totalUsers > 0 ? Math.round(stats.totalTasks / stats.totalUsers) : 0}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Team Productivity</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span className="text-gray-300">Completed Tasks</span>
                </div>
                <span className="text-white font-semibold">{stats.completed}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertTriangleIcon className="h-5 w-5 text-red-500" />
                  <span className="text-gray-300">Blocked Tasks</span>
                </div>
                <span className="text-white font-semibold">{stats.blocker}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
