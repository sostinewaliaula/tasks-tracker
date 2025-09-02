import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTask } from '../context/TaskContext';
import { BuildingIcon, UsersIcon, ClipboardCheckIcon, ChartBarIcon } from 'lucide-react';
import { DEPARTMENTS } from '../constants/departments';

// Derive mock departments from constants
const mockDepartments = DEPARTMENTS.map((name, idx) => ({
  id: String(idx + 1),
  name,
  description: `${name} department description`,
  managerName: `${name} Manager`,
  memberCount: 10 + ((idx * 3) % 6),
  taskCompletion: 75 + ((idx * 2) % 20),
  budget: `$${100 + idx * 20},000`,
  projects: 6 + (idx % 6)
}));
export function DepartmentsPage() {
  const {
    currentUser
  } = useAuth();
  const {
    getTasksCountByStatus
  } = useTask();
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const department = useMemo(() => selectedDepartment ? mockDepartments.find(d => d.id === selectedDepartment) : null, [selectedDepartment]);
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate flex items-center">
            <BuildingIcon className="h-8 w-8 mr-3 text-[#2e9d74]" />
            Departments
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            View and manage all departments in your organization
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Departments
              </h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {mockDepartments.map(dept => <li key={dept.id} className={`px-4 py-4 hover:bg-gray-50 cursor-pointer ${selectedDepartment === dept.id ? 'bg-[#e8f5f0]' : ''}`} onClick={() => setSelectedDepartment(dept.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <BuildingIcon className="h-5 w-5 text-[#2e9d74] mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {dept.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {dept.memberCount} members
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2.5">
                        <div className="bg-gradient-to-r from-[#2e9d74] to-[#8c52ff] h-2.5 rounded-full" style={{
                      width: `${dept.taskCompletion}%`
                    }}></div>
                      </div>
                      <span className="ml-2 text-xs text-gray-500">
                        {dept.taskCompletion}%
                      </span>
                    </div>
                  </div>
                </li>)}
            </ul>
          </div>
        </div>
        <div className="lg:col-span-2">
          {department ? <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {department.name} Department
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  {department.description}
                </p>
              </div>
              <div className="border-t border-gray-200">
                <dl>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <UsersIcon className="h-5 w-5 mr-2 text-[#2e9d74]" />
                      Manager
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {department.managerName}
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <UsersIcon className="h-5 w-5 mr-2 text-[#2e9d74]" />
                      Team Size
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {department.memberCount} members
                    </dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <ClipboardCheckIcon className="h-5 w-5 mr-2 text-[#2e9d74]" />
                      Task Completion Rate
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-xs">
                          <div className="bg-gradient-to-r from-[#2e9d74] to-[#8c52ff] h-2.5 rounded-full" style={{
                        width: `${department.taskCompletion}%`
                      }}></div>
                        </div>
                        <span className="ml-2">
                          {department.taskCompletion}%
                        </span>
                      </div>
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <ChartBarIcon className="h-5 w-5 mr-2 text-[#2e9d74]" />
                      Annual Budget
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {department.budget}
                    </dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <ClipboardCheckIcon className="h-5 w-5 mr-2 text-[#2e9d74]" />
                      Active Projects
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {department.projects} projects
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="px-4 py-5 sm:px-6 border-t border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Department Performance
                </h3>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <div className="bg-white overflow-hidden shadow-sm rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Tasks
                      </dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">
                        {Math.floor(Math.random() * 50) + 30}
                      </dd>
                    </div>
                  </div>
                  <div className="bg-white overflow-hidden shadow-sm rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        On-Time Completion
                      </dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">
                        {Math.floor(Math.random() * 15) + 85}%
                      </dd>
                    </div>
                  </div>
                  <div className="bg-white overflow-hidden shadow-sm rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Team Efficiency
                      </dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">
                        {Math.floor(Math.random() * 10) + 90}%
                      </dd>
                    </div>
                  </div>
                </div>
              </div>
            </div> : <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 text-center">
                <BuildingIcon className="h-12 w-12 text-[#2e9d74] mx-auto mb-4" />
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Select a Department
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500 mx-auto">
                  Click on a department from the list to view its details.
                </p>
              </div>
            </div>}
        </div>
      </div>
    </div>;
}