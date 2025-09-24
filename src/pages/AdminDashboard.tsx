import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BuildingIcon, UsersIcon, ClipboardCheckIcon, ChartBarIcon, Loader2 } from 'lucide-react';

export function AdminDashboard() {
  const { currentUser, token } = useAuth() as any;
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [stats, setStats] = React.useState({
    totalUsers: 0,
    totalTasks: 0,
    activeDepartments: 0,
    completedTasks: 0
  });
  const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

  React.useEffect(() => {
    if (currentUser?.role !== 'admin') return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch departments
        const deptRes = await fetch(`${API_URL}/api/departments`, { 
          headers: { Authorization: token ? `Bearer ${token}` : '' } 
        });
        const deptData = await deptRes.json();

        // Fetch users
        const usersRes = await fetch(`${API_URL}/api/users`, { 
          headers: { Authorization: token ? `Bearer ${token}` : '' } 
        });
        const usersData = await usersRes.json();

        // Fetch tasks
        const tasksRes = await fetch(`${API_URL}/api/tasks`, { 
          headers: { Authorization: token ? `Bearer ${token}` : '' } 
        });
        const tasksData = await tasksRes.json();

        // Calculate stats
        const totalUsers = usersData.data?.length || 0;
        const totalTasks = tasksData.data?.length || 0;
        const activeDepartments = deptData.data?.length || 0;
        const completedTasks = tasksData.data?.filter((task: any) => task.status === 'completed').length || 0;

        setStats({
          totalUsers,
          totalTasks,
          activeDepartments,
          completedTasks
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [API_URL, currentUser?.role, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-green-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center">
                  <BuildingIcon className="h-8 w-8 mr-3" />
                  Admin Dashboard
                </h1>
                <p className="text-white/90 text-lg">
                  Welcome back, {currentUser?.name}! Here's your company overview.
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <BuildingIcon className="w-10 h-10" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <UsersIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <ClipboardCheckIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalTasks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <BuildingIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Departments</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.activeDepartments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.completedTasks}</p>
              </div>
            </div>
          </div>
        </div>

        {/* System Overview & Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Task Analytics */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2 text-green-600" />
              Task Analytics
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pending Tasks</span>
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {stats.totalTasks - stats.completedTasks - (stats.totalTasks * 0.3)}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">In Progress</span>
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {Math.floor(stats.totalTasks * 0.3)}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Blocked Tasks</span>
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {Math.floor(stats.totalTasks * 0.05)}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Completed</span>
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.completedTasks}</span>
              </div>
            </div>
          </div>

          {/* User Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
              <UsersIcon className="h-5 w-5 mr-2 text-blue-600" />
              User Activity
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Users</span>
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.totalUsers}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Managers</span>
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {Math.floor(stats.totalUsers * 0.2)}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Employees</span>
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {Math.floor(stats.totalUsers * 0.8)}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Admins</span>
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">1</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Tasks */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
              <ClipboardCheckIcon className="h-5 w-5 mr-2 text-green-600" />
              Recent System Activity
            </h3>
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-4">
                  <ClipboardCheckIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Task completed</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">"Update user interface" was completed by John Doe</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-4">
                  <UsersIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">New user registered</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Jane Smith joined the Support Team</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">4 hours ago</p>
                </div>
              </div>
              <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mr-4">
                  <BuildingIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Department updated</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Caava AI department settings modified</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">6 hours ago</p>
                </div>
              </div>
              <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mr-4">
                  <ClipboardCheckIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Task blocked</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">"Database migration" is blocked due to dependency</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">1 day ago</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2 text-purple-600" />
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/users')}
                className="w-full flex items-center p-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
              >
                <UsersIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-3" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">Manage Users</span>
              </button>
              <button 
                onClick={() => navigate('/departments')}
                className="w-full flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              >
                <BuildingIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Manage Departments</span>
              </button>
              <button 
                onClick={() => navigate('/reports')}
                className="w-full flex items-center p-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
              >
                <ChartBarIcon className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-3" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">View Reports</span>
              </button>
              <button 
                onClick={() => navigate('/settings')}
                className="w-full flex items-center p-3 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg transition-colors"
              >
                <ClipboardCheckIcon className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-3" />
                <span className="text-sm font-medium text-orange-700 dark:text-orange-300">System Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}