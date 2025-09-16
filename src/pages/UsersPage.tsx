import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UsersIcon, FilterIcon, SearchIcon } from 'lucide-react';
import { DEPARTMENTS } from '../constants/departments';
import { MOCK_USERS } from '../constants/mockUsers';
// Extend MOCK_USERS with task stats for Users table only (cosmetic)
const mockUsers = MOCK_USERS.map((u, idx) => ({
  ...u,
  tasksCompleted: 10 + (idx % 40),
  tasksInProgress: idx % 5
}));
export function UsersPage() {
  const {
    currentUser
  } = useAuth();
  const [filters, setFilters] = useState({
    role: 'all',
    department: 'all',
    search: ''
  });
  // Filter users based on current filters
  const filteredUsers = mockUsers.filter(user => {
    // Apply role filter
    if (filters.role !== 'all' && user.role !== filters.role) return false;
    // Apply department filter
    if (filters.department !== 'all' && user.department !== filters.department) return false;
    // Apply search filter
    if (filters.search && !user.name.toLowerCase().includes(filters.search.toLowerCase()) && !user.email.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    return true;
  });
  // Departments list
  const departments = DEPARTMENTS;
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
  const handleDepartmentFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({
      ...prev,
      department: e.target.value
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
          <div className="mt-4 grid grid-cols-1 gap-y-4 sm:grid-cols-3 sm:gap-x-4">
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
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Department
              </label>
              <select id="department" name="department" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-[#2e9d74] focus:border-[#2e9d74] sm:text-sm rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value={filters.department} onChange={handleDepartmentFilterChange}>
                <option value="all">All Departments</option>
                {departments.map(dept => <option key={dept} value={dept}>
                    {dept}
                  </option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
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
                        <img className="h-10 w-10 rounded-full" src={user.avatar} alt="" />
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