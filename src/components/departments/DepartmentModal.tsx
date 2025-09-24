import React, { useState, useEffect, useContext, createContext, useCallback } from 'react';
import { XIcon } from 'lucide-react';

interface DepartmentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string, parentId?: number | null, managerId?: number | null) => void;
  parentId?: number | null;
  parentName?: string;
  primaryDepartments?: { id: number; name: string }[];
  managers?: { id: number; name: string }[];
}

// Toast context and provider
const ToastContext = createContext<{ showToast: (msg: string, type?: 'success'|'error') => void } | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ msg: string; type: 'success'|'error' } | null>(null);
  const showToast = useCallback((msg: string, type: 'success'|'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-2 rounded shadow-lg text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>{toast.msg}</div>
      )}
    </ToastContext.Provider>
  );
}
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
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
    <div className="fixed z-20 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75 dark:bg-gray-900 dark:opacity-80"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white dark:bg-gray-900 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 px-6 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                {parentId ? 'Add Sub-Department' : 'Add Department'}
              </h3>
              <button type="button" className="bg-white dark:bg-gray-900 rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none" onClick={onClose}>
                <span className="sr-only">Close</span>
                <XIcon className="h-6 w-6" />
              </button>
            </div>
            {primaryDepartments && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Primary Department</label>
                <select
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-[#2e9d74] sm:text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
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
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Manager (optional)</label>
                <select
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-[#2e9d74] sm:text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
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
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Department Name</label>
              <input
                type="text"
                className="w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-[#2e9d74] sm:text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={parentId ? 'e.g., Platform' : 'e.g., Turnkey'}
                autoFocus
              />
            </div>
            {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-green-500 to-purple-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Add
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
