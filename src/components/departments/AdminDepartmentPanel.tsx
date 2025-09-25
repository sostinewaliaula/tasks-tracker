import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/Toast';
import { BuildingIcon, PlusIcon, PencilIcon, TrashIcon } from 'lucide-react';
import { DepartmentModal } from './DepartmentModal';

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

export function AdminDepartmentPanel() {
  const { currentUser, token } = useAuth() as any;
  const { showToast } = useToast();
  const [departments, setDepartments] = React.useState<DepartmentNode[]>([]);
  const [users, setUsers] = React.useState<{ id: number; name: string; role: string; departmentId?: number | null }[]>([]);
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [editName, setEditName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalParent, setModalParent] = React.useState<{ id: number | null, name?: string } | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/departments`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      if (!res.ok) throw new Error('Failed to load departments');
      const json = await res.json();
      setDepartments(json.data || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      if (!res.ok) throw new Error('Failed to load users');
      const json = await res.json();
      const items = (json.data || []).map((u: any) => ({ 
        id: u.id, 
        name: u.name, 
        role: u.role,
        departmentId: u.departmentId 
      }));
      setUsers(items);
    } catch (e) {
      // noop for now
    }
  };

  React.useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchDepartments();
      fetchUsers();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.role]);

  const createPrimary = async () => {
    if (!newPrimaryName.trim()) return;
    const res = await fetch(`${API_URL}/api/departments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
      body: JSON.stringify({ name: newPrimaryName.trim() })
    });
    if (res.ok) { setNewPrimaryName(''); fetchDepartments(); }
    else { const j = await res.json().catch(() => ({})); showToast(j.error || 'Failed to create department', 'error'); }
  };

  const createSub = async () => {
    if (!newSubName.trim() || !selectedId) return;
    const res = await fetch(`${API_URL}/api/departments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
      body: JSON.stringify({ name: newSubName.trim(), parentId: selectedId })
    });
    if (res.ok) { setNewSubName(''); fetchDepartments(); }
    else { const j = await res.json().catch(() => ({})); showToast(j.error || 'Failed to create sub-department', 'error'); }
  };

  const updateDept = async () => {
    if (!editName.trim() || !selectedId) return;
    const res = await fetch(`${API_URL}/api/departments/${selectedId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
      body: JSON.stringify({ name: editName.trim() })
    });
    if (res.ok) { setEditName(''); fetchDepartments(); }
    else { const j = await res.json().catch(() => ({})); showToast(j.error || 'Failed to update department', 'error'); }
  };

  const deleteDept = async (id: number) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    const res = await fetch(`${API_URL}/api/departments/${id}`, {
      method: 'DELETE',
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    });
    if (res.status === 204) { if (selectedId === id) setSelectedId(null); fetchDepartments(); }
    else { const j = await res.json().catch(() => ({})); showToast(j.error || 'Failed to delete department', 'error'); }
  };

  const renderTree = (nodes: DepartmentNode[]) => (
    <ul className="divide-y divide-gray-200">
      {nodes.map((dept) => (
        <li key={dept.id} className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${selectedId === dept.id ? 'bg-[#e8f5f0]' : ''}`} onClick={() => setSelectedId(dept.id)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BuildingIcon className="h-5 w-5 text-[#2e9d74] mr-3" />
              <p className="text-sm font-medium text-gray-900">{dept.name}</p>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={(e) => { e.stopPropagation(); setSelectedId(dept.id); setEditName(dept.name); }} className="text-gray-500 hover:text-gray-700" title="Edit">
                <PencilIcon className="h-4 w-4" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); deleteDept(dept.id); }} className="text-red-500 hover:text-red-600" title="Delete">
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
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

  const handleAddDepartment = () => {
    setModalParent(null);
    setModalOpen(true);
  };
  const handleAddSubDepartment = () => {
    if (!selectedId) return;
    const parent = findDepartmentById(departments, selectedId);
    setModalParent({ id: selectedId, name: parent?.name });
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
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
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
              headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
              body: JSON.stringify({ role: 'manager' })
            });
          }
          
          // Assign user to the department
          await fetch(`${API_URL}/api/users/${managerId}/department`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
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
  function findDepartmentById(nodes: DepartmentNode[], id: number): DepartmentNode | undefined {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findDepartmentById(node.children, id);
        if (found) return found;
      }
    }
    return undefined;
  }

  if (currentUser?.role !== 'admin') return null;

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <button
          onClick={handleAddDepartment}
          className="bg-gradient-to-r from-green-500 to-purple-600 text-white px-4 py-2 rounded-lg flex items-center text-sm w-full md:w-auto justify-center hover:from-green-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <PlusIcon className="h-4 w-4 mr-1" /> Add Department
        </button>
        <button
          onClick={handleAddSubDepartment}
          disabled={!selectedId}
          className="bg-gradient-to-r from-green-500 to-purple-600 text-white px-4 py-2 rounded-lg flex items-center text-sm w-full md:w-auto justify-center hover:from-green-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlusIcon className="h-4 w-4 mr-1" /> Add Sub-Department
        </button>
      </div>
      <DepartmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        parentId={modalParent?.id ?? undefined}
        parentName={modalParent?.name}
        primaryDepartments={departments.filter(d => d.parentId === null).map(d => ({ id: d.id, name: d.name }))}
        users={users}
        departments={departments}
      />
      {/* Rename and error UI remains unchanged */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rename Department</label>
          <div className="flex">
            <input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 border rounded-l px-3 py-2 text-sm" placeholder="New name" />
            <button onClick={updateDept} disabled={!selectedId || !editName.trim()} className="bg-gradient-to-r from-green-500 to-purple-600 text-white px-3 py-2 rounded-r text-sm hover:from-green-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">Save</button>
          </div>
        </div>
      </div>
      {error ? <p className="text-sm text-red-600 mt-2">{error}</p> : null}
      <div className="mt-6">
        <div className="px-4 py-3 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Departments</h3>
        </div>
        {loading ? (
          <div className="p-4 text-sm text-gray-500">Loading...</div>
        ) : (
          departments.length ? renderTree(departments) : <div className="p-4 text-sm text-gray-500">No departments yet.</div>
        )}
      </div>
    </div>
  );
}


