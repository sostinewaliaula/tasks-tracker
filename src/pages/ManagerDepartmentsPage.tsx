import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTask } from '../context/TaskContext';
import { 
  BuildingIcon, 
  UsersIcon, 
  TrendingUpIcon,
  ClockIcon,
  CheckCircleIcon,
  TargetIcon
} from 'lucide-react';
import { InlineDepartmentStats } from '../components/departments/InlineDepartmentStats';

type DepartmentNode = {
  id: number;
  name: string;
  parentId: number | null;
  children?: DepartmentNode[];
  managerId?: number | null;
  description?: string;
  manager?: { id: number; name: string };
  users?: { id: number; name: string; role: string }[];
};

export function ManagerDepartmentsPage() {
  return <ManagerDepartmentsPageContent />;
}

function ManagerDepartmentsPageContent() {
  const { currentUser, token } = useAuth() as any;
  const { getTasksCountByStatus } = useTask();

  const [departments, setDepartments] = useState<DepartmentNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<{ id: number; name: string; email: string | null; ldapUid: string; role: string; departmentId?: number | null; department?: string; primaryDepartment?: string | null; subDepartment?: string | null; }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [departmentStats, setDepartmentStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch(`${API_URL}/api/departments`, { 
        headers: { 
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        } 
      });
      
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Departments API error:', errorText);
        throw new Error(`Failed to load departments: ${res.status}`);
      }
      
      const json = await res.json();
      setDepartments(json.data || []);
    } catch (e: any) {
      console.error('Failed to load departments:', e);
      setError(e.message || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users`, { 
        headers: { 
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        } 
      });
      
      if (res.ok) {
        const json = await res.json();
        setUsers(json.data || []);
      } else {
        const errorText = await res.text();
        console.error('Users API error:', errorText);
        setError('Failed to load users');
      }
    } catch (e) {
      console.error('Failed to load users:', e);
      setError('Failed to load users');
    }
  };

  const fetchDepartmentStats = async (departmentId: number) => {
    try {
      const res = await fetch(`${API_URL}/api/departments/${departmentId}/stats`, { 
        headers: { 
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        } 
      });
      
      
      if (res.ok) {
        const json = await res.json();
        setDepartmentStats(json.data);
      } else {
        const errorText = await res.text();
        console.error('Department stats API error:', errorText);
      }
    } catch (e) {
      console.error('Failed to load department stats:', e);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    setError(null);
    try {
      await Promise.all([
        fetchDepartments(),
        fetchUsers()
      ]);
    } catch (e) {
      console.error('Failed to refresh data:', e);
      setError('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'manager' || currentUser?.role === 'admin') {
      fetchDepartments();
      fetchUsers();
    }
  }, [currentUser?.role, token]);

  // Utility function to format names
  const formatName = (name: string) => {
    if (!name) return 'Unknown User';
    
    // Handle cases like "sostine.waliaula" or "manager.it"
    if (name.includes('.')) {
      return name
        .split('.')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
    }
    
    // Handle cases with spaces or other separators
    return name
      .split(/[\s_-]+/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  };

  // Get the single department managed by current user
  const managedDepartment = useMemo(() => {
    if (!currentUser?.id) {
      return null;
    }
    
    const all: DepartmentNode[] = [];
    const walk = (nodes: DepartmentNode[]) => {
      nodes.forEach(n => {
        if (n.managerId === Number(currentUser.id)) {
          all.push(n);
        }
        if (n.children) walk(n.children);
      });
    };
    walk(departments);
    return all[0] || null; // Managers only manage one department
  }, [departments, currentUser?.id]);

  // Fetch department stats when managed department changes
  useEffect(() => {
    if (managedDepartment) {
      fetchDepartmentStats(managedDepartment.id);
    }
  }, [managedDepartment]);

  // Get team members from the single managed department
  const teamMembers = useMemo(() => {
    if (!currentUser?.id || !managedDepartment) {
      return [];
    }
    
    const members = new Map();
    
    // Add manager (current user)
    members.set(Number(currentUser.id), {
      id: Number(currentUser.id),
      name: currentUser.name,
      email: currentUser.email,
      role: 'manager',
      department: managedDepartment.name,
      isManager: true
    });
    
    // Add users from the managed department
    if (managedDepartment.users) {
      managedDepartment.users.forEach(user => {
        if (!members.has(user.id)) {
          members.set(user.id, {
            ...user,
            department: managedDepartment.name,
            isManager: false
          });
        }
      });
    }
    
    return Array.from(members.values());
  }, [managedDepartment, currentUser]);

  // Calculate team statistics for the single managed department
  const teamStats = useMemo(() => {
    const totalMembers = teamMembers.length;
    const managers = teamMembers.filter(m => m.isManager).length;
    const employees = teamMembers.filter(m => !m.isManager).length;
    
    // Use backend department stats if available, otherwise fallback to frontend calculation
    let totalTasks = 0;
    let completedTasks = 0;
    let inProgressTasks = 0;
    let overdueTasks = 0;
    
    if (departmentStats?.stats) {
      // Use backend stats
      totalTasks = departmentStats.stats.totalTasks || 0;
      completedTasks = departmentStats.stats.completed || 0;
      inProgressTasks = departmentStats.stats.inProgress || 0;
      overdueTasks = departmentStats.stats.overdue || 0;
    } else if (managedDepartment) {
      // Fallback to frontend calculation
      const deptStats = getTasksCountByStatus(managedDepartment.name);
      if (deptStats) {
        totalTasks = Object.values(deptStats).reduce((sum, count) => sum + count, 0);
        completedTasks = deptStats.completed || 0;
        inProgressTasks = deptStats['in-progress'] || 0;
        overdueTasks = 0;
      }
    }
    
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    return {
      totalMembers,
      managers,
      employees,
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      completionRate
    };
  }, [teamMembers, managedDepartment, departmentStats, getTasksCountByStatus]);

  // Department card component
  const DepartmentCard = ({ department }: { department: DepartmentNode }) => {
    const memberCount = department.users?.length || 0;
    
    // Use backend stats if available, otherwise fallback to frontend calculation
    let completedTasks = 0;
    let inProgressTasks = 0;
    let totalTasks = 0;
    let completionRate = 0;
    
    if (departmentStats?.stats && departmentStats.department?.id === department.id) {
      // Use backend stats
      completedTasks = departmentStats.stats.completed || 0;
      inProgressTasks = departmentStats.stats.inProgress || 0;
      totalTasks = departmentStats.stats.totalTasks || 0;
      completionRate = departmentStats.stats.completionRate || 0;
    } else {
      // Fallback to frontend calculation
      const deptStats = getTasksCountByStatus(department.name);
      if (deptStats) {
        completedTasks = deptStats.completed || 0;
        inProgressTasks = deptStats['in-progress'] || 0;
        totalTasks = Object.values(deptStats).reduce((sum, count) => sum + count, 0);
        completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      }
    }
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-[#2e9d74] to-purple-600 rounded-lg">
                <BuildingIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {department.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {memberCount} team member{memberCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="flex items-center justify-center text-green-600 dark:text-green-400 mb-1">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                <span className="text-lg font-semibold">{completedTasks}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center text-blue-600 dark:text-blue-400 mb-1">
                <ClockIcon className="h-4 w-4 mr-1" />
                <span className="text-lg font-semibold">{inProgressTasks}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">In Progress</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              {completionRate}% completion rate
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Team member card component
  const TeamMemberCard = ({ member }: { member: any }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
      <div className="flex items-center space-x-3">
        <img 
          className="h-10 w-10 rounded-full ring-2 ring-gray-200 dark:ring-gray-700" 
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(formatName(member.name))}&background=2e9d74&color=fff&size=40`} 
          alt={formatName(member.name)}
        />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {formatName(member.name)}
            {member.isManager && (
              <span className="ml-2 text-xs text-[#2e9d74] font-medium">(You)</span>
            )}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {member.email || member.ldapUid}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {member.department}
          </p>
        </div>
        <div className="flex items-center space-x-1">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            member.isManager 
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200'
              : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
          }`}>
            {member.isManager ? 'Manager' : 'Employee'}
          </span>
        </div>
      </div>
    </div>
  );

  if (currentUser?.role !== 'manager' && currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center max-w-md">
          <BuildingIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Access Restricted</h3>
          <p className="text-gray-500 dark:text-gray-400">
            You need manager or administrator privileges to view department management.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <BuildingIcon className="h-8 w-8 mr-3 text-[#2e9d74]" />
                My Department
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                View your department details and team information
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2e9d74] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {refreshing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#2e9d74] mr-2"></div>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error loading data
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setError(null);
                      if (currentUser?.role === 'manager' || currentUser?.role === 'admin') {
                        fetchDepartments();
                        fetchUsers();
                      }
                    }}
                    className="bg-red-100 dark:bg-red-900/30 px-3 py-2 rounded-md text-sm font-medium text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-900/50"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BuildingIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Department</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{managedDepartment ? '1' : '0'}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <UsersIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Team Members</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{teamStats.totalMembers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <TargetIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{teamStats.totalTasks}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <TrendingUpIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{teamStats.completionRate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Department Section */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">My Department</h2>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2e9d74]"></div>
                </div>
              ) : !managedDepartment ? (
                <div className="text-center py-12">
                  <BuildingIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Department</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    You're not currently managing any department.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <DepartmentCard department={managedDepartment} />
                  
                  {/* Department Statistics */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Department Statistics</h3>
                    <InlineDepartmentStats 
                      departmentId={managedDepartment.id}
                      departmentName={managedDepartment.name}
                      managerName={managedDepartment.managerId ? (users.find(u => u.id === managedDepartment.managerId) ? formatName(users.find(u => u.id === managedDepartment.managerId)!.name) : '—') : '—'}
                    />
                  </div>

                  {/* Backend Statistics */}
                  {departmentStats?.stats && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Detailed Analytics</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{departmentStats.stats.todo || 0}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">To Do</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{departmentStats.stats.inProgress || 0}</div>
                          <div className="text-sm text-blue-600 dark:text-blue-400">In Progress</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{departmentStats.stats.completed || 0}</div>
                          <div className="text-sm text-green-600 dark:text-green-400">Completed</div>
                        </div>
                        <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{departmentStats.stats.blocker || 0}</div>
                          <div className="text-sm text-red-600 dark:text-red-400">Blocked</div>
                        </div>
                      </div>
                      
                      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{departmentStats.stats.high || 0}</div>
                          <div className="text-sm text-purple-600 dark:text-purple-400">High Priority</div>
                        </div>
                        <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{departmentStats.stats.medium || 0}</div>
                          <div className="text-sm text-yellow-600 dark:text-yellow-400">Medium Priority</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{departmentStats.stats.low || 0}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Low Priority</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Team Members Details */}
                  {managedDepartment.users && managedDepartment.users.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Team Members</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {managedDepartment.users.map(user => (
                          <div key={user.id} className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <img 
                              className="h-10 w-10 rounded-full ring-2 ring-gray-200 dark:ring-gray-600" 
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(formatName(user.name))}&background=2e9d74&color=fff&size=40`} 
                              alt={formatName(user.name)}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {formatName(user.name)}
                                {Number(user.id) === Number(currentUser?.id) && (
                                  <span className="ml-2 text-xs text-[#2e9d74] font-medium">(You)</span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {user.role === 'manager' ? 'Manager' : 'Employee'}
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              user.role === 'manager' 
                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200'
                                : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                            }`}>
                              {user.role === 'manager' ? 'Manager' : 'Employee'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Team Members Section */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Team Members</h2>
              </div>
              
              {teamMembers.length === 0 ? (
                <div className="text-center py-8">
                  <UsersIcon className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No team members yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {teamMembers.map(member => (
                    <TeamMemberCard key={member.id} member={member} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}