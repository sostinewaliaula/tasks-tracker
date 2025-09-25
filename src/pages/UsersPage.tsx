import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  UsersIcon, 
  FilterIcon, 
  SearchIcon, 
  MoreVerticalIcon, 
  EditIcon, 
  TrashIcon, 
  GridIcon,
  ListIcon,
  ChevronDownIcon,
  CheckIcon,
  XIcon,
  MailIcon,
  PhoneIcon,
  CalendarIcon,
  ShieldIcon,
  BuildingIcon,
  CheckCircleIcon,
  ClockIcon,
  AlertCircleIcon
} from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedUsers, setSelectedUsers] = useState<Set<number | string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'role' | 'department' | 'tasks'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
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

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(user => {
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

    // Sort users
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'role':
          aValue = a.role;
          bValue = b.role;
          break;
        case 'department':
          aValue = (a.department || '').toLowerCase();
          bValue = (b.department || '').toLowerCase();
          break;
        case 'tasks':
          aValue = (a.tasksCompleted || 0) + (a.tasksInProgress || 0);
          bValue = (b.tasksCompleted || 0) + (b.tasksInProgress || 0);
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [users, filters, sortBy, sortOrder]);

  // Selection handlers
  const handleSelectUser = (userId: number | string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredAndSortedUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredAndSortedUsers.map(user => user.id)));
    }
  };

  const handleSort = (field: 'name' | 'role' | 'department' | 'tasks') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Utility function to format names properly
  const formatDisplayName = (name: string) => {
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
  // Role badge component
  const RoleBadge = ({ role }: { role: string }) => {
    const roleConfig = {
      admin: { 
        icon: ShieldIcon, 
        color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800',
        label: 'Admin'
      },
      manager: { 
        icon: UsersIcon, 
        color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-800',
        label: 'Manager'
      },
      employee: { 
        icon: UsersIcon, 
        color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800',
        label: 'Employee'
      }
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.employee;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="w-3 h-3 mr-1.5" />
        {config.label}
      </span>
    );
  };

  // User card component for grid view
  const UserCard = ({ user }: { user: ApiUser }) => (
    <div className={`group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50 ${user.id === currentUser?.id ? 'ring-2 ring-[#2e9d74] ring-opacity-50' : ''}`}>
      {/* Select checkbox positioned in top-right corner */}
      <div className="absolute top-3 right-3 z-10">
        <input
          type="checkbox"
          checked={selectedUsers.has(user.id)}
          onChange={() => handleSelectUser(user.id)}
          className="h-4 w-4 text-[#2e9d74] focus:ring-[#2e9d74] border-gray-300 dark:border-gray-600 rounded cursor-pointer"
        />
      </div>
      
      <div className="p-6">
        <div className="flex items-start space-x-4">
          <div className="relative flex-shrink-0">
            <img 
              className="h-14 w-14 rounded-full ring-2 ring-gray-200 dark:ring-gray-700" 
              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formatDisplayName(user.name))}&background=2e9d74&color=fff&size=56`} 
              alt={formatDisplayName(user.name)}
            />
            {user.id === currentUser?.id && (
              <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-[#2e9d74] rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                <CheckIcon className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
        <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
              {formatDisplayName(user.name)}
              {user.id === currentUser?.id && (
                <span className="ml-2 text-xs text-[#2e9d74] font-medium">(You)</span>
              )}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate flex items-center mt-1">
              <MailIcon className="h-3 w-3 mr-1.5 flex-shrink-0" />
              <span className="truncate" title={user.email}>
                {user.email}
              </span>
            </p>
          </div>
        </div>
        
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <RoleBadge role={user.role} />
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <BuildingIcon className="h-3 w-3 mr-1" />
              <span className="truncate max-w-20" title={user.department || 'No Department'}>
                {user.department || 'No Department'}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="text-center">
              <div className="flex items-center justify-center text-green-600 dark:text-green-400">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">{user.tasksCompleted || 0}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Completed</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center text-blue-600 dark:text-blue-400">
                <ClockIcon className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">{user.tasksInProgress || 0}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">In Progress</p>
            </div>
          </div>
        </div>
        
        {/* Action button - appears on hover */}
        <div className="absolute top-3 right-12 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <MoreVerticalIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <UsersIcon className="h-8 w-8 mr-3 text-[#2e9d74]" />
            Users
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage and view all users in your organization
          </p>
        </div>
      </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <UsersIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{users.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <UsersIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Managers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {users.filter(u => u.role === 'manager').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Employees</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {users.filter(u => u.role === 'employee').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <BuildingIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Departments</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{departments.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Search */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={filters.search}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2e9d74] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
          </div>

              {/* Controls */}
              <div className="flex items-center space-x-4">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-white dark:bg-gray-600 text-[#2e9d74] shadow-sm' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <GridIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-white dark:bg-gray-600 text-[#2e9d74] shadow-sm' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <ListIcon className="h-4 w-4" />
                  </button>
                </div>

                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`inline-flex items-center px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                    showFilters
                      ? 'border-[#2e9d74] text-[#2e9d74] bg-[#2e9d74]/10'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <FilterIcon className="h-4 w-4 mr-2" />
                  Filters
                  <ChevronDownIcon className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role
              </label>
                    <select
                      value={filters.role}
                      onChange={handleRoleFilterChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2e9d74] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                <option value="all">All Roles</option>
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                <option value="employee">Employee</option>
              </select>
            </div>
                  
            <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Department
              </label>
                    <select
                      value={filters.primaryDepartment}
                      onChange={handlePrimaryDepartmentChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2e9d74] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="all">All Departments</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
              </select>
            </div>
                  
            <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sort By
              </label>
                    <select
                      value={`${sortBy}-${sortOrder}`}
                      onChange={(e) => {
                        const [field, order] = e.target.value.split('-');
                        setSortBy(field as any);
                        setSortOrder(order as any);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2e9d74] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="name-asc">Name (A-Z)</option>
                      <option value="name-desc">Name (Z-A)</option>
                      <option value="role-asc">Role (A-Z)</option>
                      <option value="role-desc">Role (Z-A)</option>
                      <option value="department-asc">Department (A-Z)</option>
                      <option value="department-desc">Department (Z-A)</option>
                      <option value="tasks-desc">Most Tasks</option>
                      <option value="tasks-asc">Least Tasks</option>
              </select>
            </div>
          </div>
        </div>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.size > 0 && (
          <div className="bg-[#2e9d74] text-white rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition-colors">
                  Export
                </button>
                <button className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition-colors">
                  Assign Department
                </button>
                <button className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition-colors">
                  Change Role
                </button>
                <button 
                  onClick={() => setSelectedUsers(new Set())}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2e9d74]"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <AlertCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">Error Loading Users</h3>
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : filteredAndSortedUsers.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No users found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {filters.search || filters.role !== 'all' || filters.primaryDepartment !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'Get started by adding your first user.'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedUsers.map(user => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUsers.size === filteredAndSortedUsers.length && filteredAndSortedUsers.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-[#2e9d74] focus:ring-[#2e9d74] border-gray-300 dark:border-gray-600 rounded"
                      />
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        User
                        {sortBy === 'name' && (
                          <ChevronDownIcon className={`h-4 w-4 ml-1 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                        )}
                      </div>
                </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                      onClick={() => handleSort('role')}
                    >
                      <div className="flex items-center">
                        Role
                        {sortBy === 'role' && (
                          <ChevronDownIcon className={`h-4 w-4 ml-1 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                        )}
                      </div>
                </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                      onClick={() => handleSort('department')}
                    >
                      <div className="flex items-center">
                  Department
                        {sortBy === 'department' && (
                          <ChevronDownIcon className={`h-4 w-4 ml-1 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                        )}
                      </div>
                </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                      onClick={() => handleSort('tasks')}
                    >
                      <div className="flex items-center">
                  Tasks
                        {sortBy === 'tasks' && (
                          <ChevronDownIcon className={`h-4 w-4 ml-1 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                        )}
                      </div>
                </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                </th>
              </tr>
            </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredAndSortedUsers.map(user => (
                    <tr 
                      key={user.id} 
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        user.id === currentUser?.id ? 'bg-[#e8f5f0] dark:bg-[#22332c]' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                          className="h-4 w-4 text-[#2e9d74] focus:ring-[#2e9d74] border-gray-300 dark:border-gray-600 rounded"
                        />
                      </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                          <img 
                            className="h-10 w-10 rounded-full ring-2 ring-gray-200 dark:ring-gray-700" 
                            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formatDisplayName(user.name))}&background=2e9d74&color=fff&size=40`} 
                            alt={formatDisplayName(user.name)}
                          />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {formatDisplayName(user.name)}
                              {user.id === currentUser?.id && (
                                <span className="ml-2 text-xs text-[#2e9d74] font-medium">(You)</span>
                              )}
                        </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                              <MailIcon className="h-3 w-3 mr-1" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                        <RoleBadge role={user.role} />
                  </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 flex items-center">
                        <BuildingIcon className="h-4 w-4 mr-2" />
                        {user.department || 'No Department'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center text-green-600 dark:text-green-400">
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            {user.tasksCompleted || 0}
                          </div>
                          <div className="flex items-center text-blue-600 dark:text-blue-400">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {user.tasksInProgress || 0}
                    </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button className="text-[#2e9d74] hover:text-[#228a63] p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                            <EditIcon className="h-4 w-4" />
                          </button>
                          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                            <MoreVerticalIcon className="h-4 w-4" />
                          </button>
                        </div>
                  </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
          </div>
        )}
      </div>
      </div>
  );
}