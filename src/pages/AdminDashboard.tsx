import React from 'react';
import { useAuth } from '../context/AuthContext';
import { BuildingIcon, UsersIcon, ClipboardCheckIcon, ChartBarIcon } from 'lucide-react';

type DepartmentNode = {
  id: number;
  name: string;
  parentId: number | null;
  children?: DepartmentNode[];
};

export function AdminDashboard() {
  const { currentUser, token } = useAuth() as any;
  const [departments, setDepartments] = React.useState<DepartmentNode[]>([]);
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(false);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const selectedDept = React.useMemo(() => {
    const all: DepartmentNode[] = [];
    const walk = (nodes: DepartmentNode[]) => nodes.forEach(n => { all.push(n); if (n.children) walk(n.children); });
    walk(departments);
    return all.find(d => d.id === selectedId) || null;
  }, [departments, selectedId]);

  React.useEffect(() => {
    if (currentUser?.role !== 'admin') return;
    const run = async () => {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/departments`, { headers: { Authorization: token ? `Bearer ${token}` : '' } });
      const json = await res.json();
      setDepartments(json.data || []);
      setLoading(false);
    };
    run();
  }, [API_URL, currentUser?.role, token]);

  const renderTree = (nodes: DepartmentNode[]) => (
    <ul className="divide-y divide-gray-200">
      {nodes.map((dept) => (
        <li key={dept.id} className={`px-4 py-4 hover:bg-gray-50 cursor-pointer ${selectedId === dept.id ? 'bg-[#e8f5f0]' : ''}`} onClick={() => setSelectedId(dept.id)}>
          <div className="flex items-center">
            <BuildingIcon className="h-5 w-5 text-[#2e9d74] mr-3" />
            <p className="text-sm font-medium text-gray-900">{dept.name}</p>
          </div>
          {dept.children && dept.children.length ? (
            <div className="ml-6 mt-2">
              {renderTree(dept.children)}
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-gray-100 sm:text-3xl sm:truncate flex items-center">
            <BuildingIcon className="h-8 w-8 mr-3 text-[#2e9d74]" />
            Company Overview
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">Admin view: browse departments and see details.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="card">
            <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">Departments</h3>
            </div>
            {loading ? (
              <div className="p-4 text-sm text-gray-500 dark:text-gray-300">Loading...</div>
            ) : (
              departments.length ? renderTree(departments) : <div className="p-4 text-sm text-gray-500 dark:text-gray-300">No departments yet.</div>
            )}
          </div>
        </div>
        <div className="lg:col-span-2">
          {selectedDept ? (
            <div className="card">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">{selectedDept.name} Department</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-300">Department description</p>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700">
                <dl>
                  <div className="bg-gray-50 dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
                      <UsersIcon className="h-5 w-5 mr-2 text-[#2e9d74]" />
                      Manager
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">—</dd>
                  </div>
                  <div className="bg-white dark:bg-gray-900 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
                      <UsersIcon className="h-5 w-5 mr-2 text-[#2e9d74]" />
                      Team Size
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">—</dd>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
                      <ClipboardCheckIcon className="h-5 w-5 mr-2 text-[#2e9d74]" />
                      Task Completion Rate
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 max-w-xs">
                          <div className="bg-gradient-to-r from-[#2e9d74] to-[#8c52ff] h-2.5 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                        <span className="ml-2">75%</span>
                      </div>
                    </dd>
                  </div>
                  <div className="bg-white dark:bg-gray-900 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
                      <ChartBarIcon className="h-5 w-5 mr-2 text-[#2e9d74]" />
                      Active Tasks by Status
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">
                      <div className="flex items-center space-x-4">
                        <span className="inline-flex items-center text-xs bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2 py-1 rounded">To Do: 67</span>
                        <span className="inline-flex items-center text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">In Progress: 67</span>
                        <span className="inline-flex items-center text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">Completed: 66</span>
                      </div>
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="px-4 py-5 sm:px-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">Department Performance</h3>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <div className="bg-white dark:bg-gray-900 overflow-hidden shadow-sm rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">Total Tasks</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-100">77</dd>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-900 overflow-hidden shadow-sm rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">On-Time Completion</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-100">85%</dd>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-900 overflow-hidden shadow-sm rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">Team Efficiency</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-100">96%</dd>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="px-4 py-5 sm:px-6 text-center">
                <BuildingIcon className="h-12 w-12 text-[#2e9d74] mx-auto mb-4" />
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">Select a Department</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-300 mx-auto">Click on a department from the list to view its details.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


