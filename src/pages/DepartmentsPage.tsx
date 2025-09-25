import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTask } from '../context/TaskContext';
import { BuildingIcon, UsersIcon, ClipboardCheckIcon, ChartBarIcon, PencilIcon, TrashIcon, ChevronRight, ChevronDown, UserPlus, Building2Icon, XIcon, FileTextIcon } from 'lucide-react';
import { DepartmentModal } from '../components/departments/DepartmentModal';
import { useToast } from '../components/ui/Toast';

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

function EditDepartmentModal({ open, onClose, department, managerOptions, onSave, loading, departments }: {
  open: boolean;
  onClose: () => void;
  department: DepartmentNode | null;
  managerOptions: { id: number; name: string }[];
  onSave: (data: { name: string; managerId: number | null; description?: string }) => void;
  loading: boolean;
  departments?: DepartmentNode[];
}) {
  const [name, setName] = useState(department?.name || '');
  const [managerId, setManagerId] = useState<number | ''>(department?.managerId || '');
  const [description, setDescription] = useState(department?.description || '');
  
  // Get all existing manager IDs from departments (excluding current department)
  const getExistingManagerIds = () => {
    const managerIds = new Set<number>();
    
    const collectManagerIds = (depts: DepartmentNode[]) => {
      depts.forEach(dept => {
        // Skip the current department being edited
        if (dept.id !== department?.id && dept.managerId) {
          managerIds.add(dept.managerId);
        }
        if (dept.children) {
          collectManagerIds(dept.children);
        }
      });
    };
    
    if (departments) {
      collectManagerIds(departments);
    }
    
    return managerIds;
  };

  // Filter out users who are already managers (except current manager)
  const availableManagerOptions = managerOptions.filter(manager => {
    const existingManagerIds = getExistingManagerIds();
    return !existingManagerIds.has(manager.id);
  });

  // Ensure current manager is always available in the dropdown
  const finalManagerOptions = availableManagerOptions.length > 0 ? availableManagerOptions : 
    (department?.managerId ? managerOptions.filter(m => m.id === department.managerId) : []);
  
  useEffect(() => {
    setName(department?.name || '');
    setManagerId(department?.managerId || '');
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
                {finalManagerOptions.length > 0 ? (
                  finalManagerOptions.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))
                ) : (
                  <option value="" disabled>
                    {managerOptions.length > 0 ? 'All users are already managers' : 'No users available'}
                  </option>
                )}
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

export function DepartmentsPage() {
  return <DepartmentsPageContent />;
}

function DepartmentsPageContent() {
  const { currentUser, token } = useAuth() as any;
  const { getTasksCountByStatus } = useTask();

  const [departments, setDepartments] = useState<DepartmentNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [assignUser, setAssignUser] = useState('');
  const [users, setUsers] = useState<{ id: number; name: string; email: string | null; ldapUid: string; role: string; departmentId?: number | null; department?: string; primaryDepartment?: string | null; subDepartment?: string | null; }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalParent, setModalParent] = useState<{ id: number | null, name?: string } | null>(null);
  const [editModal, setEditModal] = useState<{ open: boolean; dept: DepartmentNode | null }>({ open: false, dept: null });
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
    if (currentUser?.role === 'admin') fetchDepartments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.role]);

  const fetchUsers = async () => {
    if (currentUser?.role !== 'admin') return;
    const res = await fetch(`${API_URL}/api/users`, { headers: { 'Authorization': token ? `Bearer ${token}` : '' } });
    if (!res.ok) return;
    const j = await res.json();
    setUsers(j.data || []);
  };

  useEffect(() => {
    fetchUsers();
  }, [API_URL, currentUser?.role, token]);


  const allDepartments: DepartmentNode[] = useMemo(() => {
    const result: DepartmentNode[] = [];
    const walk = (nodes: DepartmentNode[]) => nodes.forEach(n => { result.push(n); if (n.children && n.children.length) walk(n.children); });
    walk(departments);
    return result;
  }, [departments]);

  const primaryDepartments = useMemo(() => allDepartments.filter(d => d.parentId === null), [allDepartments]);

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
  const deleteDept = async (id: number) => {
    setDeleteModal({ open: true, deptId: id, deptName: allDepartments.find(d => d.id === id)?.name });
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
    // Default to first primary department if none selected
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
      // First create the department
      const res = await fetch(`${API_URL}/api/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        const deptData = await res.json();
        const newDepartmentId = deptData.data?.id;
        
        // If a manager is selected, update their role and assign them to the department
        if (managerId && newDepartmentId) {
          const selectedUser = users.find(u => u.id === managerId);
          
          // Update user role to manager if they're not already a manager or admin
          if (selectedUser && selectedUser.role !== 'manager' && selectedUser.role !== 'admin') {
            await fetch(`${API_URL}/api/users/${managerId}/role`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
              body: JSON.stringify({ role: 'manager' })
            });
          }
          
          // Assign user to the department
          await fetch(`${API_URL}/api/users/${managerId}/department`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
            body: JSON.stringify({ departmentId: newDepartmentId })
          });
        }
        
        fetchDepartments();
        fetchUsers(); // Refresh users list to show updated roles
        showToast('Department added successfully', 'success');
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

  // Helper to get member count for a department (including all sub-departments)
  function getDepartmentMemberCount(dept: DepartmentNode, includeSubDepartments: boolean = true) {
    let count = 0;
    
    // Count users directly assigned to this department + manager
    if (dept.managerId) {
      count += 1;
    }
    
    if (dept.users) {
      count += dept.users.length;
    }
    
    // If including sub-departments, recursively count members from all children
    if (includeSubDepartments && dept.children) {
      for (const child of dept.children) {
        count += getDepartmentMemberCount(child, true);
      }
    }
    
    return count;
  }

  // Helper to get only direct members (not including sub-departments)
  function getDirectMemberCount(dept: DepartmentNode) {
    return getDepartmentMemberCount(dept, false);
  }

  const renderTree = (nodes: DepartmentNode[]) => (
    <div className="space-y-1 p-2">
      {nodes.map((dept) => (
        <div key={dept.id}>
          <div
            className={`group relative rounded-xl p-4 transition-all duration-200 cursor-pointer border
              ${selectedId === dept.id
                ? 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800 shadow-md'
                : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-700 hover:shadow-sm'
              }
            `}
            onClick={() => setSelectedId(dept.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center flex-1">
                {dept.children && dept.children.length ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = new Set(expandedIds);
                      if (next.has(dept.id)) next.delete(dept.id); else next.add(dept.id);
                      setExpandedIds(next);
                    }}
                    className="mr-3 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    {expandedIds.has(dept.id) ? 
                      <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" /> : 
                      <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    }
                  </button>
                ) : (
                  <div className="w-8 mr-3" />
                )}
                
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${
                  selectedId === dept.id 
                    ? 'bg-green-500' 
                    : 'bg-gray-100 dark:bg-gray-600 group-hover:bg-green-100 dark:group-hover:bg-green-900/20'
                } transition-colors`}>
                  <BuildingIcon className={`h-5 w-5 ${
                    selectedId === dept.id 
                      ? 'text-white' 
                      : 'text-gray-500 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400'
                  } transition-colors`} />
                </div>
                
                <div className="flex-1">
                  <div className={`font-semibold transition-colors ${
                    selectedId === dept.id 
                      ? 'text-green-900 dark:text-green-100' 
                      : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    {dept.name}
                  </div>
                  <div className="flex items-center space-x-4 mt-1">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <UsersIcon className="h-3 w-3 mr-1" />
                      {getDirectMemberCount(dept)} direct members
                    </div>
                    {dept.children && dept.children.length > 0 && (
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <BuildingIcon className="h-3 w-3 mr-1" />
                        {dept.children.length} sub-departments
                      </div>
                    )}
                    {getDepartmentMemberCount(dept) > getDirectMemberCount(dept) && (
                      <div className="flex items-center text-sm text-green-600 dark:text-green-400 font-medium">
                        <UsersIcon className="h-3 w-3 mr-1" />
                        {getDepartmentMemberCount(dept)} total members
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {currentUser?.role === 'admin' && (
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditModal({ open: true, dept }); }} 
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all"
                    title="Edit Department"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteDept(dept.id); }} 
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                    title="Delete Department"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {dept.children && dept.children.length && expandedIds.has(dept.id) && (
            <div className="ml-8 mt-2 space-y-1">
              {renderTree(dept.children)}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 accent-green sm:text-3xl sm:truncate flex items-center">
              <BuildingIcon className="h-8 w-8 mr-3 accent-green" />
              Departments
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
              View and manage all departments in your organization
            </p>
          </div>
        </div>

        {currentUser?.role === 'admin' ? (
          <div className="section-card p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <button
                onClick={handleAddDepartment}
                className="bg-gradient-to-r from-green-500 to-purple-600 text-white px-4 py-2 rounded-lg flex items-center text-sm w-full md:w-auto justify-center hover:from-green-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Add Department
              </button>
              <button
                onClick={handleAddSubDepartment}
                disabled={primaryDepartments.length === 0}
                className="bg-gradient-to-r from-green-500 to-purple-600 text-white px-4 py-2 rounded-lg flex items-center text-sm w-full md:w-auto justify-center hover:from-green-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
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
              users={users}
              departments={departments}
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
        ) : null}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Departments List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                    <BuildingIcon className="h-5 w-5 mr-2 text-green-600" />
                    Departments
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                      {departments.length}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {currentUser?.role === 'admin' ? (
                  loading ? (
                    <div className="p-8 text-center">
                      <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Loading departments...</p>
                    </div>
                  ) : departments.length ? (
                    renderTree(departments)
                  ) : (
                    <div className="p-8 text-center">
                      <BuildingIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">No departments yet</p>
                      <button
                        onClick={handleAddDepartment}
                        className="text-green-600 hover:text-green-700 text-sm font-medium"
                      >
                        Create your first department
                      </button>
                    </div>
                  )
                ) : (
                  <div className="p-8 text-center">
                    <BuildingIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Access restricted to administrators</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Department Details */}
          <div className="lg:col-span-2">
            {selectedDept ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-purple-600 px-6 py-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                        <BuildingIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{selectedDept.name}</h3>
                        <p className="text-white/90 text-sm">Department Overview</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{getDepartmentMemberCount(selectedDept)}</div>
                      <div className="text-white/80 text-sm">
                        {getDepartmentMemberCount(selectedDept) > getDirectMemberCount(selectedDept) 
                          ? 'Total Team Members' 
                          : 'Team Members'
                        }
                      </div>
                      {getDepartmentMemberCount(selectedDept) > getDirectMemberCount(selectedDept) && (
                        <div className="text-white/60 text-xs mt-1">
                          ({getDirectMemberCount(selectedDept)} direct + {getDepartmentMemberCount(selectedDept) - getDirectMemberCount(selectedDept)} from sub-departments)
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Department Stats Cards */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mr-4">
                          <UsersIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                            {selectedDept?.managerId ? (users.find(u => u.id === selectedDept.managerId)?.name || '—') : '—'}
                          </div>
                          <div className="text-sm text-blue-700 dark:text-blue-300">Department Manager</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mr-4">
                          <UsersIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <div className="text-lg font-bold text-green-900 dark:text-green-100">
                            {getDepartmentMemberCount(selectedDept)}
                          </div>
                          <div className="text-sm text-green-700 dark:text-green-300">
                            {getDepartmentMemberCount(selectedDept) > getDirectMemberCount(selectedDept) 
                              ? 'Total Team Members' 
                              : 'Team Members'
                            }
                          </div>
                          {getDepartmentMemberCount(selectedDept) > getDirectMemberCount(selectedDept) && (
                            <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                              {getDirectMemberCount(selectedDept)} direct + {getDepartmentMemberCount(selectedDept) - getDirectMemberCount(selectedDept)} sub-depts
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mr-4">
                          <ClipboardCheckIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                            {deptStats ? deptStats['completed'] : 0}%
                          </div>
                          <div className="text-sm text-purple-700 dark:text-purple-300">Completion Rate</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Task Completion Progress</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{deptStats ? deptStats['completed'] : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-purple-600 h-3 rounded-full transition-all duration-500" 
                        style={{ width: `${deptStats ? deptStats['completed'] : 0}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Task Status Overview */}
                  {deptStats && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                        <ChartBarIcon className="h-5 w-5 mr-2 text-green-600" />
                        Task Status Overview
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-600 dark:text-gray-300">{deptStats['todo'] || 0}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">To Do</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{deptStats['in-progress'] || 0}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">In Progress</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{deptStats['completed'] || 0}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Completed</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Department Members */}
                  <div className="mt-8">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                      <UsersIcon className="h-5 w-5 mr-2 text-green-600" />
                      Team Members ({getDepartmentMemberCount(selectedDept)})
                      {getDepartmentMemberCount(selectedDept) > getDirectMemberCount(selectedDept) && (
                        <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                          (including all sub-departments)
                        </span>
                      )}
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                      {(() => {
                        const members = [];
                        
                        // Add manager if exists
                        if (selectedDept.manager) {
                          members.push({
                            ...selectedDept.manager,
                            role: 'manager',
                            isManager: true,
                            departmentName: selectedDept.name,
                            parentDepartment: undefined,
                          });
                        }
                        
                        // Add regular users from this department
                        if (selectedDept.users) {
                          const regularUsers = selectedDept.users.filter(user => 
                            !selectedDept.manager || user.id !== selectedDept.manager.id
                          );
                          members.push(...regularUsers.map(user => ({
                            ...user,
                            isManager: false,
                            departmentName: selectedDept.name,
                            parentDepartment: undefined,
                          })));
                        }
                        
                        // Add members from sub-departments
                        const addSubDepartmentMembers = (dept: DepartmentNode, parentName: string) => {
                          if (dept.children) {
                            for (const child of dept.children) {
                              // Add manager if exists
                              if (child.manager) {
                                members.push({
                                  ...child.manager,
                                  role: 'manager',
                                  isManager: true,
                                  departmentName: child.name,
                                  parentDepartment: parentName,
                                });
                              }
                              
                              // Add regular users
                              if (child.users) {
                                const childUsers = child.users.filter(user => 
                                  !child.manager || user.id !== child.manager.id
                                );
                                members.push(...childUsers.map(user => ({
                                  ...user,
                                  isManager: false,
                                  departmentName: child.name,
                                  parentDepartment: parentName,
                                })));
                              }
                              
                              // Recursively add from deeper sub-departments
                              addSubDepartmentMembers(child, child.name);
                            }
                          }
                        };
                        
                        addSubDepartmentMembers(selectedDept, selectedDept.name);
                        
                        if (members.length === 0) {
                          return (
                            <div className="text-center py-8">
                              <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-500 dark:text-gray-400">No team members assigned</p>
                            </div>
                          );
                        }
                        
                        return (
                          <div className="space-y-3">
                            {members.map((member) => (
                              <div key={`${member.id}-${member.departmentName}`} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                    member.isManager 
                                      ? 'bg-gradient-to-r from-green-500 to-purple-600 text-white' 
                                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                                  }`}>
                                    {member.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900 dark:text-gray-100">
                                      {member.name}
                                      {member.isManager && (
                                        <span className="ml-2 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                                          Manager
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                                      {member.role}
                                    </div>
                                    <div className="text-xs text-gray-400 dark:text-gray-500">
                                      {member.departmentName}
                                      {member.parentDepartment && member.parentDepartment !== member.departmentName && (
                                        <span className="ml-1">(sub-department of {member.parentDepartment})</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                {/* User Assignment Section */}
                {currentUser?.role === 'admin' ? (
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 px-6 py-6 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center mr-3">
                        <UserPlus className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add User to Department</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Assign users to this department</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Select User</label>
                        <select 
                          value={selectedUserId} 
                          onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : '')} 
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        >
                          <option value="">Choose a user...</option>
                          {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name} {u.email ? `(${u.email})` : `(${u.ldapUid})`}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Or Enter Details</label>
                        <input 
                          value={assignUser} 
                          onChange={(e) => setAssignUser(e.target.value)} 
                          placeholder="User ID, LDAP UID, or email" 
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all" 
                        />
                      </div>
                      
                      <div className="flex items-end">
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
                          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-3 rounded-xl text-sm font-medium shadow-lg hover:shadow-xl transition-all"
                        >
                          Add User
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                      <div className="flex items-start">
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                          <span className="text-white text-xs">i</span>
                        </div>
                        <div>
                          <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Assignment Tips</p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            You can assign users by selecting from the dropdown, or by entering their User ID, LDAP UID, or email address.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-12 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-purple-100 dark:from-green-900/20 dark:to-purple-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <BuildingIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Select a Department</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    Choose a department from the list to view detailed information, manage team members, and track progress.
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-400 dark:text-gray-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Click on any department to get started</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <DeleteConfirmModal open={deleteModal.open} onCancel={() => setDeleteModal({ open: false })} onConfirm={handleDeleteConfirm} deptName={deleteModal.deptName || ''} />
      <EditDepartmentModal open={editModal.open} onClose={() => setEditModal({ open: false, dept: null })} department={editModal.dept} managerOptions={users.map(u => ({ id: u.id, name: u.name }))} onSave={handleEditSave} loading={editLoading} departments={departments} />
    </div>
  );
}