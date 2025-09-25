import React, { useState, useEffect } from 'react';
import { XIcon, Building2Icon, PlusIcon, UsersIcon } from 'lucide-react';
import { useToast } from '../ui/Toast';

interface DepartmentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string, parentId?: number | null, managerId?: number | null) => void;
  parentId?: number | null;
  parentName?: string;
  primaryDepartments?: { id: number; name: string }[];
  managers?: { id: number; name: string }[];
}

export function DepartmentModal({ open, onClose, onSubmit, parentId, parentName, primaryDepartments, managers }: DepartmentModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(parentId ?? null);
  const [selectedManagerId, setSelectedManagerId] = useState<number | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (open) {
      setName('');
      setSelectedParentId(parentId ?? null);
      setSelectedManagerId(null);
    }
  }, [open, parentId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Department name is required');
      return;
    }
    if (primaryDepartments && !selectedParentId) {
      setError('Please select a primary department');
      return;
    }
    setError(null);
    onSubmit(name.trim(), primaryDepartments ? selectedParentId : undefined, selectedManagerId ?? undefined);
    setName('');
    onClose();
  };

  if (!open) return null;

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
                  {parentId ? <Building2Icon className="h-5 w-5 text-white" /> : <PlusIcon className="h-5 w-5 text-white" />}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {parentId ? 'Add Sub-Department' : 'Add Department'}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    {parentId ? 'Create a new sub-department' : 'Create a new department'}
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
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 px-8 py-6">
            {primaryDepartments && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                  <Building2Icon className="h-4 w-4 mr-2 text-green-600" />
                  Primary Department
                </label>
                <select
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-200"
                  value={selectedParentId ?? ''}
                  onChange={e => setSelectedParentId(e.target.value ? Number(e.target.value) : null)}
                  required
                >
                  <option value="">Select primary department</option>
                  {primaryDepartments.map(pd => (
                    <option key={pd.id} value={pd.id}>{pd.name}</option>
                  ))}
                </select>
              </div>
            )}
            {managers && managers.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                  <UsersIcon className="h-4 w-4 mr-2 text-purple-600" />
                  Manager (optional)
                </label>
                <select
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-200"
                  value={selectedManagerId ?? ''}
                  onChange={e => setSelectedManagerId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">No manager</option>
                  {managers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                <Building2Icon className="h-4 w-4 mr-2 text-green-600" />
                Department Name
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-200"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={parentId ? 'e.g., Platform' : 'e.g., Turnkey'}
                autoFocus
              />
            </div>
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
              </div>
            )}
            
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
                className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-purple-600 rounded-lg hover:from-green-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {parentId ? 'Add Sub-Department' : 'Add Department'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
