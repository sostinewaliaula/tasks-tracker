import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UsersIcon, FilterIcon, SearchIcon } from 'lucide-react';
// Departments are fetched from the backend; no static constants here
type ApiUser = {
  id: number | string;
  name: string;
  email: string;
  department?: string;
  primaryDepartment?: string | null;
  subDepartment?: string | null;
  role: 'employee' | 'manager' | 'admin';
  avatar?: string | null;
  tasksCompleted?: number;
  tasksInProgress?: number;
};

export function UsersPage() {
  const { currentUser, token } = useAuth() as any;
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';
  type DepartmentNode = { id: number; name: string; parentId: number | null; children?: DepartmentNode[] };
  const [filters, setFilters] = useState({
    role: 'all',
    primaryDepartment: 'all',
    subDepartment: 'all',
    search: ''
  });
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_URL}/api/users`, {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        if (!res.ok) throw new Error('Failed to load users');
        const j = await res.json();
        const raw: any[] = j.data || [];
        const mapped: ApiUser[] = raw.map((u, idx) => {
          const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim();
          return {
            id: u.id ?? idx,
            name: (u.name ?? fullName) || 'Unknown',
            email: u.email || u.username || 'unknown@local',
            department: u.department?.name || u.department || 'General',
            role: (u.role || 'employee').toLowerCase(),
            avatar: u.avatarUrl || u.avatar || null,
            tasksCompleted: u.tasksCompleted ?? ((idx % 20) + 5),
            tasksInProgress: u.tasksInProgress ?? (idx % 3)
          };
        });
        setUsers(mapped);
      } catch (e: any) {
        setError(e?.message || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, [API_URL, token]);

  // Filter users based on current filters
  const filteredUsers = users.filter(user => {
    // Apply role filter
    if (filters.role !== 'all' && user.role !== filters.role) return false;
    // Apply department filters
    if (filters.primaryDepartment !== 'all') {
      const userPrimary = user.primaryDepartment || user.department || '';
      if (userPrimary !== filters.primaryDepartment) return false;
      if (filters.subDepartment !== 'all') {
        const userSub = user.subDepartment || '';
        if (userSub !== filters.subDepartment) return false;
      }
    }
    // Apply search filter
    if (filters.search && !user.name.toLowerCase().includes(filters.search.toLowerCase()) && !user.email.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    return true;
  });
  // Departments list
  const [departments, setDepartments] = useState<string[]>([]);
  const [departmentTree, setDepartmentTree] = useState<DepartmentNode[]>([]);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const res = await fetch(`${API_URL}/api/departments`, {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' }
        });
        if (!res.ok) throw new Error('Failed to load departments');
        const j = await res.json();
        const tree: DepartmentNode[] = (j.data || []) as DepartmentNode[];
        setDepartmentTree(tree);
        const primaryNames: string[] = tree.filter(d => !d.parentId).map(d => d.name).filter(Boolean);
        setDepartments(primaryNames);
      } catch (e) {
        // keep empty on failure; filters will still work
        setDepartmentTree([]);
        setDepartments([]);
      }
    };
    loadDepartments();
  }, [API_URL, token]);
  const subDepartmentOptions = useMemo(() => {
    if (filters.primaryDepartment === 'all') return [] as string[];
    const parent = departmentTree.find(d => d.name === filters.primaryDepartment);
    return (parent?.children || []).map(c => c.name).filter(Boolean) as string[];
  }, [filters.primaryDepartment, departmentTree]);
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({
      ...prev,
      search: e.target.value
    }));
  };
  const handleRoleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({
      ...prev,
      role: e.target.value
    }));
  };
  const handlePrimaryDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({
      ...prev,
      primaryDepartment: e.target.value,
      subDepartment: 'all'
    }));
  };
  const handleSubDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({
      ...prev,
      subDepartment: e.target.value
    }));
  };
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-gray-100 sm:text-3xl sm:truncate flex items-center">
            <UsersIcon className="h-8 w-8 mr-3 text-[#2e9d74]" />
            Users
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
            Manage and view all users in your organization
          </p>
        </div>
      </div>
      <div className="card">
        <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 sm:px-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 flex items-center">
              <FilterIcon className="h-5 w-5 mr-2 text-[#2e9d74]" />
              Filter Users
            </h3>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-y-4 sm:grid-cols-4 sm:gap-x-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Search
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="h-5 w-5 text-gray-400 dark:text-gray-300" />
                </div>
                <input type="text" name="search" id="search" className="focus:ring-[#2e9d74] focus:border-[#2e9d74] block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" placeholder="Search by name or email" value={filters.search} onChange={handleSearchChange} />
              </div>
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Role
              </label>
              <select id="role" name="role" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-[#2e9d74] focus:border-[#2e9d74] sm:text-sm rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value={filters.role} onChange={handleRoleFilterChange}>
                <option value="all">All Roles</option>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <div>
              <label htmlFor="primaryDepartment" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Primary Department
              </label>
              <select id="primaryDepartment" name="primaryDepartment" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-[#2e9d74] focus:border-[#2e9d74] sm:text-sm rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value={filters.primaryDepartment} onChange={handlePrimaryDepartmentChange}>
                <option value="all">All Primary</option>
                {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="subDepartment" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Sub-Department
              </label>
              <select id="subDepartment" name="subDepartment" disabled={filters.primaryDepartment === 'all'} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-[#2e9d74] focus:border-[#2e9d74] sm:text-sm rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800" value={filters.subDepartment} onChange={handleSubDepartmentChange}>
                <option value="all">{filters.primaryDepartment === 'all' ? 'Select primary first' : 'All Sub-Departments'}</option>
                {subDepartmentOptions.map(sub => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          {error && (
            <div className="px-6 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>
          )}
          {loading && (
            <div className="px-6 py-3 text-sm text-gray-500 dark:text-gray-300">Loading users…</div>
          )}
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Department
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tasks
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map(user => <tr key={user.id} className={user.id === currentUser?.id ? 'bg-[#e8f5f0] dark:bg-[#22332c]' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img className="h-10 w-10 rounded-full" src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2e9d74&color=fff`} alt="" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-300">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'manager' ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'}`}>
                      {user.role === 'manager' ? 'Manager' : 'Employee'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {user.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {user.tasksCompleted} completed
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-300">
                      {user.tasksInProgress} in progress
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a href="#" className="text-[#2e9d74] hover:text-[#228a63]">
                      View
                    </a>
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && <div className="px-6 py-10 text-center text-gray-500 dark:text-gray-300">
            No users match your current filters.
          </div>}
      </div>
    </div>;
}