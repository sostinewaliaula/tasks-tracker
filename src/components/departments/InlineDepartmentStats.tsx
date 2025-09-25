import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/Toast';
import { 
  UsersIcon,
  ClipboardCheckIcon,
  ChartBarIcon
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
  totalUsers: number;
}

interface InlineDepartmentStatsProps {
  departmentId: number;
  departmentName: string;
  managerName?: string;
}

export function InlineDepartmentStats({ departmentId, departmentName, managerName }: InlineDepartmentStatsProps) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState<DepartmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchDepartmentStats();
  }, [departmentId]);

  const fetchDepartmentStats = async () => {
    try {
      setLoading(true);
      console.log('Fetching department stats for ID:', departmentId);
      console.log('Token available:', !!token);
      
      const response = await fetch(`${API_URL}/api/departments/${departmentId}/stats`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch department statistics: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('Stats data received:', data);
      setStats(data.data.stats);
    } catch (error) {
      console.error('Error fetching department stats:', error);
      showToast(`Failed to load department statistics: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-700 rounded-lg p-4 animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-600 rounded-lg"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-600 rounded w-20"></div>
                  <div className="h-6 bg-gray-600 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Progress Bar Skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-600 rounded w-48"></div>
          <div className="h-2 bg-gray-600 rounded w-full"></div>
        </div>
        
        {/* Task Status Skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-600 rounded w-40"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center space-y-2">
                <div className="h-8 bg-gray-600 rounded w-8 mx-auto"></div>
                <div className="h-4 bg-gray-600 rounded w-16 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-400 py-8">
        <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-gray-500" />
        <p>Failed to load department statistics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Department Manager Card */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <UsersIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-blue-100 text-sm">Department Manager</p>
              <p className="text-white font-semibold">
                {managerName || '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Team Members Card */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <UsersIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-green-100 text-sm">Team Members</p>
              <p className="text-white font-semibold text-xl">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        {/* Completion Rate Card */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <ClipboardCheckIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-purple-100 text-sm">Completion Rate</p>
              <p className="text-white font-semibold text-xl">{stats.completionRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Task Completion Progress */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Task Completion Progress
        </h3>
        <div className="flex items-center space-x-4">
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${stats.completionRate}%` }}
            ></div>
          </div>
          <span className="text-lg font-semibold text-gray-900 dark:text-gray-100 min-w-[3rem]">
            {stats.completionRate}%
          </span>
        </div>
      </div>

      {/* Task Status Overview */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
          <ChartBarIcon className="h-5 w-5 mr-2 text-green-600" />
          Task Status Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* To Do */}
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {stats.todo}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">To Do</div>
          </div>

          {/* In Progress */}
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-500 mb-1">
              {stats.inProgress}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">In Progress</div>
          </div>

          {/* Completed */}
          <div className="text-center">
            <div className="text-3xl font-bold text-green-500 mb-1">
              {stats.completed}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
          </div>
        </div>
      </div>
    </div>
  );
}
