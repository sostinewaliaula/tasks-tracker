import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTask } from '../context/TaskContext';
import { BuildingIcon, UsersIcon, ClipboardCheckIcon, ChartBarIcon, PencilIcon, TrashIcon, ChevronRight, ChevronDown } from 'lucide-react';

type DepartmentNode = {
  id: number;
  name: string;
  parentId: number | null;
  children?: DepartmentNode[];
};

export function DepartmentsPage() {
  const { currentUser, token } = useAuth() as any;
  const { getTasksCountByStatus } = useTask();

  const [departments, setDepartments] = useState<DepartmentNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newPrimaryName, setNewPrimaryName] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [editName, setEditName] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/departments`, { headers: { 'Authorization': token ? `Bearer ${token}` : '' } });
      if (!res.ok) throw new Error('Failed to load departments');
      const json = await res.json();
      setDepartments(json.data || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') fetchDepartments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.role]);

  const allDepartments: DepartmentNode[] = useMemo(() => {
    const result: DepartmentNode[] = [];
    const walk = (nodes: DepartmentNode[]) => nodes.forEach(n => { result.push(n); if (n.children && n.children.length) walk(n.children); });
    walk(departments);
    return result;
  }, [departments]);

  const selectedDept = useMemo(() => allDepartments.find(d => d.id === selectedId) || null, [allDepartments, selectedId]);
  const deptStats = selectedDept ? getTasksCountByStatus(selectedDept.name) : null;

  const createPrimary = async () => {
    if (!newPrimaryName.trim()) return;
    const res = await fetch(`${API_URL}/api/departments`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }, body: JSON.stringify({ name: newPrimaryName.trim() }) });
    if (res.ok) { setNewPrimaryName(''); fetchDepartments(); } else { const j = await res.json().catch(() => ({})); alert(j.error || 'Failed to create department'); }
  };
  const createSub = async () => {
    if (!newSubName.trim() || !selectedId) return;
    const res = await fetch(`${API_URL}/api/departments`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }, body: JSON.stringify({ name: newSubName.trim(), parentId: selectedId }) });
    if (res.ok) { setNewSubName(''); fetchDepartments(); } else { const j = await res.json().catch(() => ({})); alert(j.error || 'Failed to create sub-department'); }
  };
  const updateDept = async () => {
    if (!editName.trim() || !selectedId) return;
    const res = await fetch(`${API_URL}/api/departments/${selectedId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }, body: JSON.stringify({ name: editName.trim() }) });
    if (res.ok) { setEditName(''); fetchDepartments(); } else { const j = await res.json().catch(() => ({})); alert(j.error || 'Failed to update department'); }
  };
  const deleteDept = async (id: number) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    const res = await fetch(`${API_URL}/api/departments/${id}`, { method: 'DELETE', headers: { 'Authorization': token ? `Bearer ${token}` : '' } });
    if (res.status === 204) { if (selectedId === id) setSelectedId(null); fetchDepartments(); } else { const j = await res.json().catch(() => ({})); alert(j.error || 'Failed to delete department'); }
  };

  const renderTree = (nodes: DepartmentNode[]) => (
    <ul className="divide-y divide-gray-200">
      {nodes.map((dept) => (
        <li key={dept.id} className={`px-4 py-3 hover:bg-gray-50 ${selectedId === dept.id ? 'bg-[#e8f5f0]' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {dept.children && dept.children.length ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const next = new Set(expandedIds);
                    if (next.has(dept.id)) next.delete(dept.id); else next.add(dept.id);
                    setExpandedIds(next);
                  }}
                  className="mr-2 text-gray-600 hover:text-gray-800"
                  aria-label={expandedIds.has(dept.id) ? 'Collapse' : 'Expand'}
                  title={expandedIds.has(dept.id) ? 'Collapse' : 'Expand'}
                >
                  {expandedIds.has(dept.id) ? <ChevronDown className="h-4 w-4"/> : <ChevronRight className="h-4 w-4"/>}
                </button>
              ) : <span className="mr-2 w-4 inline-block"/>}
              <button onClick={() => setSelectedId(dept.id)} className="flex items-center">
                <BuildingIcon className="h-5 w-5 text-[#2e9d74] mr-3" />
                <p className="text-sm font-medium text-gray-900 text-left">{dept.name}</p>
              </button>
            </div>
            {currentUser?.role === 'admin' ? (
              <div className="flex items-center space-x-2">
                <button onClick={(e) => { e.stopPropagation(); setSelectedId(dept.id); setEditName(dept.name); }} className="text-gray-500 hover:text-gray-700" title="Edit">
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); deleteDept(dept.id); }} className="text-red-500 hover:text-red-600" title="Delete">
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>
          {dept.children && dept.children.length && expandedIds.has(dept.id) ? (
            <div className="ml-6 mt-2">
              {renderTree(dept.children)}
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );

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

      {currentUser?.role === 'admin' ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Add Primary Department</label>
              <div className="flex">
                <input value={newPrimaryName} onChange={(e) => setNewPrimaryName(e.target.value)} className="flex-1 border rounded-l px-3 py-2 text-sm" placeholder="e.g., Turnkey" />
                <button onClick={createPrimary} className="bg-[#2e9d74] text-white px-3 rounded-r text-sm">Add</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Add Sub-Department</label>
              <div className="flex">
                <input value={newSubName} onChange={(e) => setNewSubName(e.target.value)} className="flex-1 border rounded-l px-3 py-2 text-sm" placeholder="e.g., Platform" />
                <button onClick={createSub} disabled={!selectedId} className="bg-[#2e9d74] text-white px-3 rounded-r text-sm disabled:opacity-50">Add</button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Selected parent: {selectedDept ? selectedDept.name : 'None'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rename Department</label>
              <div className="flex">
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 border rounded-l px-3 py-2 text-sm" placeholder="New name" />
                <button onClick={updateDept} disabled={!selectedId || !editName.trim()} className="bg-[#2e9d74] text-white px-3 rounded-r text-sm disabled:opacity-50">Save</button>
              </div>
            </div>
          </div>
          {error ? <p className="text-sm text-red-600 mt-2">{error}</p> : null}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Departments</h3>
            </div>
            {currentUser?.role === 'admin' ? (
              loading ? <div className="p-4 text-sm text-gray-500">Loading...</div> : (
                departments.length ? renderTree(departments) : <div className="p-4 text-sm text-gray-500">No departments yet.</div>
              )
            ) : (
              <div className="p-4 text-sm text-gray-500">No data available.</div>
            )}
          </div>
        </div>
        <div className="lg:col-span-2">
          {selectedDept ? <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">{selectedDept.name} Department</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Department details</p>
              </div>
              <div className="border-t border-gray-200">
                <dl>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 flex items-center"><UsersIcon className="h-5 w-5 mr-2 text-[#2e9d74]" />Manager</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">—</dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 flex items-center"><UsersIcon className="h-5 w-5 mr-2 text-[#2e9d74]" />Team Size</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">—</dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 flex items-center"><ClipboardCheckIcon className="h-5 w-5 mr-2 text-[#2e9d74]" />Task Completion Rate</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-xs">
                          <div className="bg-gradient-to-r from-[#2e9d74] to-[#8c52ff] h-2.5 rounded-full" style={{ width: `${deptStats ? deptStats['completed'] : 0}%` }}></div>
                        </div>
                        <span className="ml-2">{deptStats ? deptStats['completed'] : 0}%</span>
                      </div>
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 flex items-center"><ChartBarIcon className="h-5 w-5 mr-2 text-[#2e9d74]" />Active Tasks by Status</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {deptStats ? (
                        <div className="flex items-center space-x-4">
                          <span className="inline-flex items-center text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">To Do: {deptStats['todo']}</span>
                          <span className="inline-flex items-center text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">In Progress: {deptStats['in-progress']}</span>
                          <span className="inline-flex items-center text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Completed: {deptStats['completed']}</span>
                        </div>
                      ) : '—'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div> : <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 text-center">
                <BuildingIcon className="h-12 w-12 text-[#2e9d74] mx-auto mb-4" />
                <h3 className="text-lg leading-6 font-medium text-gray-900">Select a Department</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500 mx-auto">Click on a department from the list to view its details.</p>
              </div>
            </div>}
        </div>
      </div>
    </div>;
}