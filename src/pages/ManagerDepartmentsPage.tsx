import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTask } from '../context/TaskContext';
import { BuildingIcon, UsersIcon, ClipboardCheckIcon, ChartBarIcon, PencilIcon, TrashIcon, ChevronRight, ChevronDown, Building2Icon, XIcon, FileTextIcon } from 'lucide-react';
import { DepartmentModal } from '../components/departments/DepartmentModal';
import { useToast } from '../components/ui/Toast';

type DepartmentNode = {
  id: number;
  name: string;
  parentId: number | null;
  children?: DepartmentNode[];
  managerId?: number | null;
  description?: string;
};

function DeleteConfirmModal({ open, onCancel, onConfirm, deptName }: { open: boolean; onCancel: () => void; onConfirm: () => void; deptName: string }) {
  if (!open) return null;
  return (
    <div className="fixed z-30 inset-0 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Delete Department</h2>
        <p className="mb-4 text-gray-700 dark:text-gray-300">Are you sure you want to delete <span className="font-bold">{deptName}</span>? This action cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded bg-red-600 text-white">Delete</button>
        </div>
      </div>
    </div>
  );
}

function EditDepartmentModal({ open, onClose, department, managerOptions, onSave, loading }: {
  open: boolean;
  onClose: () => void;
  department: DepartmentNode | null;
  managerOptions: { id: number; name: string }[];
  onSave: (data: { name: string; managerId: number | null; description?: string }) => void;
  loading: boolean;
}) {
  const [name, setName] = useState(department?.name || '');
  const [managerId, setManagerId] = useState<number | ''>(department?.managerId || '');
  const [description, setDescription] = useState(department?.description || '');
  
  useEffect(() => {
    setName(department?.name || '');
    setManagerId(department?.managerId ? Number(department.managerId) : '');
    setDescription(department?.description || '');
  }, [department, open]);
  
  if (!open || !department) return null;
  
  return (
    <div className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-16 px-4 pb-16 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-black bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-80"></div>
        </div>
        <div className="relative inline-block align-bottom bg-white dark:bg-gray-900 rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:align-middle w-full max-w-lg">
          {/* Modern Header */}
          <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-purple-50 dark:from-gray-800 dark:to-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-purple-600 flex items-center justify-center">
                  <Building2Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Edit Department
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    Update department information
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={onClose} 
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={e => { e.preventDefault(); onSave({ name, managerId: managerId ? Number(managerId) : null, description }); }} className="bg-white dark:bg-gray-900 px-8 py-6">
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                <Building2Icon className="h-4 w-4 mr-2 text-green-600" />
                Department Name
              </label>
              <input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-200"
                placeholder="Enter department name"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                <UsersIcon className="h-4 w-4 mr-2 text-purple-600" />
                Manager
              </label>
              <select 
                value={managerId} 
                onChange={e => setManagerId(e.target.value ? Number(e.target.value) : '')} 
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-200"
              >
                <option value="">No manager</option>
                {managerOptions.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                <FileTextIcon className="h-4 w-4 mr-2 text-blue-600" />
                Description
              </label>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-200 resize-none"
                rows={3}
                placeholder="Enter department description (optional)"
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading} 
                className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-purple-600 rounded-lg hover:from-green-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function ManagerDepartmentsPage() {
  return <ManagerDepartmentsPageContent />;
}

function ManagerDepartmentsPageContent() {
  const { currentUser, token } = useAuth() as any;
  const { getTasksCountByStatus } = useTask();

  const [departments, setDepartments] = useState<DepartmentNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [assignUser, setAssignUser] = useState('');
  const [users, setUsers] = useState<{ id: number; name: string; email: string | null; ldapUid: string; department?: string; primaryDepartment?: string | null; subDepartment?: string | null; }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalParent, setModalParent] = useState<{ id: number | null, name?: string } | null>(null);
  const [editModal, setEditModal] = useState<{ open: boolean; dept: DepartmentNode | null }>({ open: false, dept: null });
  const [managers, setManagers] = useState<{ id: number; name: string }[]>([]);
  const [editLoading, setEditLoading] = useState(false);

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
    if (currentUser?.role === 'manager' || currentUser?.role === 'admin') fetchDepartments();
  }, [currentUser?.role]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await fetch(`${API_URL}/api/users`, { headers: { 'Authorization': token ? `Bearer ${token}` : '' } });
        if (res.ok) {
          const json = await res.json();
          setUsers(json.data || []);
          setManagers((json.data || []).filter((u: any) => u.role === 'manager' || u.role === 'admin'));
        }
      } catch (e) {
        console.error('Failed to load users:', e);
      }
    };
    loadUsers();
  }, [token, API_URL]);

  const allDepartments = useMemo(() => {
    const all: DepartmentNode[] = [];
    const walk = (nodes: DepartmentNode[]) => nodes.forEach(n => { all.push(n); if (n.children) walk(n.children); });
    walk(departments);
    return all;
  }, [departments]);

  const primaryDepartments = useMemo(() => departments.filter(d => !d.parentId), [departments]);
  const selectedDept = useMemo(() => allDepartments.find(d => d.id === selectedId) || null, [allDepartments, selectedId]);
  const deptStats = selectedDept ? getTasksCountByStatus(selectedDept.name) : null;

  const { showToast } = useToast();
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; deptId?: number; deptName?: string }>({ open: false });

  const updateDept = async () => {
    if (!editName.trim() || !selectedId) return;
    try {
      const res = await fetch(`${API_URL}/api/departments/${selectedId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }, body: JSON.stringify({ name: editName.trim() }) });
      if (res.ok) {
        setEditName('');
        fetchDepartments();
        showToast('Department updated', 'success');
      } else {
        const j = await res.json().catch(() => ({}));
        showToast(j.error || 'Failed to update department', 'error');
      }
    } catch (e) {
      showToast('Failed to update department', 'error');
    }
  };

  const deleteDept = (id: number) => {
    const dept = allDepartments.find(d => d.id === id);
    setDeleteModal({ open: true, deptId: id, deptName: dept?.name });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.deptId) return;
    try {
      const res = await fetch(`${API_URL}/api/departments/${deleteModal.deptId}`, { method: 'DELETE', headers: { 'Authorization': token ? `Bearer ${token}` : '' } });
      if (res.status === 204) {
        if (selectedId === deleteModal.deptId) setSelectedId(null);
        fetchDepartments();
        showToast('Department deleted', 'success');
      } else {
        const j = await res.json().catch(() => ({}));
        showToast(j.error || 'Failed to delete department', 'error');
      }
    } catch (e) {
      showToast('Failed to delete department', 'error');
    }
    setDeleteModal({ open: false });
  };

  const handleAddDepartment = () => {
    setModalParent(null);
    setModalOpen(true);
  };
  
  const handleAddSubDepartment = () => {
    const defaultPrimary = primaryDepartments[0];
    setModalParent({ id: defaultPrimary?.id ?? null, name: defaultPrimary?.name });
    setModalOpen(true);
  };
  
  const handleModalSubmit = async (name: string, parentId?: number | null, managerId?: number | null) => {
    if (!name.trim()) return;
    const body: any = { name: name.trim() };
    if (parentId) body.parentId = parentId;
    if (managerId !== undefined) body.managerId = managerId;
    try {
      const res = await fetch(`${API_URL}/api/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        fetchDepartments();
        showToast('Department added', 'success');
      } else {
        const j = await res.json().catch(() => ({}));
        showToast(j.error || 'Failed to create department', 'error');
      }
    } catch (e) {
      showToast('Failed to create department', 'error');
    }
  };

  const handleEditSave = async (data: { name: string; managerId: number | null; description?: string }) => {
    if (!editModal.dept) return;
    setEditLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/departments/${editModal.dept.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ name: data.name, managerId: data.managerId, description: data.description })
      });
      if (res.ok) {
        fetchDepartments();
        showToast('Department updated', 'success');
        setEditModal({ open: false, dept: null });
      } else {
        const j = await res.json().catch(() => ({}));
        showToast(j.error || 'Failed to update department', 'error');
      }
    } catch (e) {
      showToast('Failed to update department', 'error');
    }
    setEditLoading(false);
  };

  function getDepartmentMemberCount(dept: DepartmentNode, users: { id: number; name: string; email: string | null; ldapUid: string; department?: string; primaryDepartment?: string | null; subDepartment?: string | null; }[]) {
    return users.filter(u => u.primaryDepartment === dept.name || u.department === dept.name).length;
  }

  const renderTree = (nodes: DepartmentNode[]) => (
    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
      {nodes.map((dept) => (
        <li
          key={dept.id}
          className={`px-4 py-3 transition-colors duration-150 cursor-pointer
            ${selectedId === dept.id
              ? 'bg-[#e8f5f0] dark:bg-[var(--color-bg-card)]'
              : 'hover:bg-gray-50 dark:hover:bg-gray-800'}
          `}
        >
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
                  className="mr-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                >
                  {expandedIds.has(dept.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              ) : (
                <div className="w-6 mr-2" />
              )}
              <BuildingIcon className="h-5 w-5 mr-3 text-gray-400" />
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{dept.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {getDepartmentMemberCount(dept, users)} members
                </div>
              </div>
            </div>
            {(currentUser?.role === 'manager' || currentUser?.role === 'admin') ? (
              <div className="flex items-center space-x-2">
                <button onClick={(e) => { e.stopPropagation(); setEditModal({ open: true, dept }); }} className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100" title="Edit">
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

  return (
    <div className="w-full min-h-screen bg-white dark:bg-[var(--color-bg-dark)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 accent-green sm:text-3xl sm:truncate flex items-center">
              <BuildingIcon className="h-8 w-8 mr-3 accent-green" />
              Department Management
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
              View and manage departments under your supervision
            </p>
          </div>
        </div>

        {(currentUser?.role === 'manager' || currentUser?.role === 'admin') ? (
          <div className="section-card p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <button
                onClick={handleAddDepartment}
                className="bg-[var(--color-accent-green)] text-white px-4 py-2 rounded flex items-center text-sm w-full md:w-auto justify-center"
              >
                Add Department
              </button>
              <button
                onClick={handleAddSubDepartment}
                disabled={primaryDepartments.length === 0}
                className="bg-[var(--color-accent-green)] text-white px-4 py-2 rounded flex items-center text-sm w-full md:w-auto justify-center disabled:opacity-50"
              >
                Add Sub-Department
              </button>
            </div>
            <DepartmentModal
              open={modalOpen}
              onClose={() => setModalOpen(false)}
              onSubmit={handleModalSubmit}
              parentId={modalParent?.id ?? undefined}
              parentName={modalParent?.name}
              primaryDepartments={modalParent ? primaryDepartments : undefined}
              managers={managers}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Rename Department</label>
                <div className="flex">
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 border rounded-l px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700" placeholder="New name" />
                  <button onClick={updateDept} disabled={!selectedId || !editName.trim()} className="bg-[var(--color-accent-green)] text-white px-3 rounded-r text-sm disabled:opacity-50">Save</button>
                </div>
              </div>
            </div>
            {error ? <p className="text-sm text-red-600 mt-2">{error}</p> : null}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="text-center">
              <BuildingIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Access Restricted</h3>
              <p className="text-gray-500 dark:text-gray-400">
                You need manager or administrator privileges to view and manage departments.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="card">
              <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 sm:px-6">
                <h3 className="text-lg leading-6 font-medium accent-green">Departments</h3>
              </div>
              {(currentUser?.role === 'manager' || currentUser?.role === 'admin') ? (
                loading ? <div className="p-4 text-sm text-gray-500 dark:text-gray-300">Loading...</div> : (
                  departments.length ? renderTree(departments) : <div className="p-4 text-sm text-gray-500 dark:text-gray-300">No departments yet.</div>
                )
              ) : (
                <div className="p-4 text-center">
                  <BuildingIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-300">Access restricted to managers and administrators</p>
                </div>
              )}
            </div>
          </div>
          <div className="lg:col-span-2">
            {selectedDept ? <div className="card bg-white dark:bg-[var(--color-bg-card)]">
                <div className="px-4 py-5 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg leading-6 font-medium accent-green">{selectedDept.name}</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">Department details and management</p>
                    </div>
                    {(currentUser?.role === 'manager' || currentUser?.role === 'admin') ? (
                      <div className="flex items-center space-x-2">
                        <button onClick={(e) => { e.stopPropagation(); setEditModal({ open: true, dept: selectedDept }); }} className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100" title="Edit">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); deleteDept(selectedDept.id); }} className="text-red-500 hover:text-red-600" title="Delete">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="px-4 py-5 sm:px-6">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Manager</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                        {selectedDept.managerId ? users.find(u => u.id === selectedDept.managerId)?.name || `User ${selectedDept.managerId}` : 'No manager assigned'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Team Size</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{getDepartmentMemberCount(selectedDept, users)} members</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Tasks</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                        {getTasksCountByStatus().total} total ({getTasksCountByStatus().completed} completed)
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Description</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedDept.description || 'No description provided'}</dd>
                    </div>
                  </dl>
                </div>
                {(currentUser?.role === 'manager' || currentUser?.role === 'admin') ? (
                  <div className="px-4 py-5 sm:px-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg leading-6 font-medium accent-green mb-3">Add User to Department</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : '')} className="border rounded px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700">
                        <option value="">Select user…</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.name} {u.email ? `(${u.email})` : `(${u.ldapUid})`}</option>
                        ))}
                      </select>
                      <input value={assignUser} onChange={(e) => setAssignUser(e.target.value)} placeholder="Enter userId, LDAP UID or email" className="border rounded px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700" />
                      <button
                        onClick={async () => {
                          if ((!assignUser.trim() && selectedUserId === '') || !selectedDept) return;
                          const body: any = {};
                          if (selectedUserId !== '') body.userId = Number(selectedUserId);
                          else if (/^\d+$/.test(assignUser.trim())) body.userId = Number(assignUser.trim());
                          else if (assignUser.includes('@')) body.email = assignUser.trim();
                          else body.ldapUid = assignUser.trim();
                          const res = await fetch(`${API_URL}/api/departments/${selectedDept.id}/users`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
                            body: JSON.stringify(body)
                          });
                          if (res.ok) {
                            setAssignUser(''); setSelectedUserId('');
                            showToast('User assigned to department', 'success');
                          } else {
                            const j = await res.json().catch(() => ({}));
                            showToast(j.error || 'Failed to assign user', 'error');
                          }
                        }}
                        className="bg-[var(--color-accent-green)] text-white px-4 py-2 rounded text-sm"
                      >
                        Add User
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">Tip: provide numeric user ID, LDAP UID, or email.</p>
                  </div>
                ) : null}
              </div> : <div className="card">
                <div className="px-4 py-5 sm:px-6 text-center">
                  <BuildingIcon className="h-12 w-12 accent-green mx-auto mb-4" />
                  <h3 className="text-lg leading-6 font-medium accent-green">
                    {(currentUser?.role === 'manager' || currentUser?.role === 'admin') ? 'Select a Department' : 'Access Restricted'}
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-300 mx-auto">
                    {(currentUser?.role === 'manager' || currentUser?.role === 'admin') 
                      ? 'Click on a department from the list to view its details.'
                      : 'You need manager or administrator privileges to view department details.'
                    }
                  </p>
                </div>
              </div>}
          </div>
        </div>
      </div>
      <DeleteConfirmModal open={deleteModal.open} onCancel={() => setDeleteModal({ open: false })} onConfirm={handleDeleteConfirm} deptName={deleteModal.deptName || ''} />
      <EditDepartmentModal open={editModal.open} onClose={() => setEditModal({ open: false, dept: null })} department={editModal.dept} managerOptions={[...managers, ...(editModal.dept?.managerId ? managers.find(m => m.id === editModal.dept?.managerId) ? [] : [{ id: editModal.dept.managerId, name: users.find(u => u.id === editModal.dept?.managerId)?.name || `User ${editModal.dept.managerId}` }] : [])]} onSave={handleEditSave} loading={editLoading} />
    </div>
  );
}
