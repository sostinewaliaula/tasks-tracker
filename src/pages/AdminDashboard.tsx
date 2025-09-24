import React from 'react';
import { useAuth } from '../context/AuthContext';
import { BuildingIcon, UsersIcon, ClipboardCheckIcon, ChartBarIcon, Loader2 } from 'lucide-react';

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
    <ul className="space-y-1">
      {nodes.map((dept) => (
        <li key={dept.id}>
          <div 
            className={`px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
              selectedId === dept.id 
                ? 'bg-gradient-to-r from-green-500 to-green-400 text-white shadow-md' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`} 
            onClick={() => setSelectedId(dept.id)}
          >
            <div className="flex items-center">
              <BuildingIcon className={`h-4 w-4 mr-3 ${selectedId === dept.id ? 'text-white' : 'text-[#2e9d74]'}`} />
              <p className="text-sm font-medium">{dept.name}</p>
            </div>
          </div>
          {dept.children && dept.children.length ? (
            <div className="ml-4 mt-2">
              {renderTree(dept.children)}
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-green-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center">
                  <BuildingIcon className="h-8 w-8 mr-3" />
                  Company Overview
                </h1>
                <p className="text-white/90 text-lg">
                  Admin view: browse departments and see details
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

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Departments Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-400 px-6 py-4">
                <h3 className="text-lg font-semibold text-white">Departments</h3>
                <p className="text-white/90 text-sm">Select a department to view details</p>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-6 text-center">
                    <div className="w-8 h-8 border-4 border-[#2e9d74] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading departments...</p>
                  </div>
                ) : departments.length ? (
                  <div className="p-2">
                    {renderTree(departments)}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                      <BuildingIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">No departments yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Department Details */}
          <div className="lg:col-span-2">
            {selectedDept ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{selectedDept.name} Department</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">Department overview and performance metrics</p>
                </div>
                
                <div className="p-6">
                  <dl className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center mb-2">
                        <UsersIcon className="h-5 w-5 mr-2 text-[#2e9d74]" />
                        Manager
                      </dt>
                      <dd className="text-sm text-gray-900 dark:text-gray-100">—</dd>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center mb-2">
                        <UsersIcon className="h-5 w-5 mr-2 text-[#2e9d74]" />
                        Team Size
                      </dt>
                      <dd className="text-sm text-gray-900 dark:text-gray-100">—</dd>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center mb-2">
                        <ClipboardCheckIcon className="h-5 w-5 mr-2 text-[#2e9d74]" />
                        Task Completion Rate
                      </dt>
                      <dd className="text-sm text-gray-900 dark:text-gray-100">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5 max-w-xs">
                            <div className="bg-gradient-to-r from-green-500 to-purple-600 h-2.5 rounded-full" style={{ width: '75%' }}></div>
                          </div>
                          <span className="ml-3 font-medium">75%</span>
                        </div>
                      </dd>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center mb-3">
                        <ChartBarIcon className="h-5 w-5 mr-2 text-[#2e9d74]" />
                        Active Tasks by Status
                      </dt>
                      <dd className="text-sm text-gray-900 dark:text-gray-100">
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                            To Do: 67
                          </span>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                            In Progress: 67
                          </span>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                            Completed: 66
                          </span>
                        </div>
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Department Performance</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-1">Total Tasks</dt>
                      <dd className="text-2xl font-bold text-gray-900 dark:text-gray-100">77</dd>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-1">On-Time Completion</dt>
                      <dd className="text-2xl font-bold text-green-600 dark:text-green-400">85%</dd>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-1">Team Efficiency</dt>
                      <dd className="text-2xl font-bold text-[#2e9d74] dark:text-[#2e9d74]">96%</dd>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BuildingIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Select a Department</h3>
                  <p className="text-gray-500 dark:text-gray-400">Click on a department from the list to view its details and performance metrics.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


