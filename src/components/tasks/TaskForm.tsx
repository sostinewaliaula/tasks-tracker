import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTask, TaskPriority } from '../../context/TaskContext';
import { XIcon } from 'lucide-react';
type TaskFormProps = {
  onCancel: () => void;
  onTaskAdded: () => void;
};
export function TaskForm({
  onCancel,
  onTaskAdded
}: TaskFormProps) {
  const {
    currentUser
  } = useAuth();
  const {
    addTask
  } = useTask();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    addTask({
      title,
      description,
      deadline: new Date(deadline),
      priority,
      status: 'todo',
      createdBy: currentUser.id,
      department: currentUser.department
    });
    onTaskAdded();
  };
  // Get min and max date for the current week (Monday to Friday)
  const getWeekDates = () => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ...
    // Find the most recent Monday
    const monday = new Date(now);
    monday.setDate(now.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    monday.setHours(0, 0, 0, 0);
    // Find the upcoming Friday
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    friday.setHours(23, 59, 59, 999);
    return {
      min: monday.toISOString().split('T')[0],
      max: friday.toISOString().split('T')[0]
    };
  };
  const {
    min,
    max
  } = getWeekDates();
  return <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Create New Task
          </h3>
          <button type="button" onClick={onCancel} className="inline-flex items-center p-1.5 border border-transparent rounded-full text-gray-400 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2e9d74]">
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input type="text" name="title" id="title" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#2e9d74] focus:border-[#2e9d74] sm:text-sm" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea id="description" name="description" rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#2e9d74] focus:border-[#2e9d74] sm:text-sm" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
                  Deadline (This Week)
                </label>
                <input type="date" name="deadline" id="deadline" required min={min} max={max} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#2e9d74] focus:border-[#2e9d74] sm:text-sm" value={deadline} onChange={e => setDeadline(e.target.value)} />
                <p className="mt-1 text-xs text-gray-500">
                  Tasks must be completed within this week (Monday-Friday)
                </p>
              </div>
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                  Priority
                </label>
                <select id="priority" name="priority" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#2e9d74] focus:border-[#2e9d74] sm:text-sm rounded-md" value={priority} onChange={e => setPriority(e.target.value as TaskPriority)}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:flex sm:flex-row-reverse">
            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gradient-to-r from-[#2e9d74] to-[#8c52ff] text-base font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2e9d74] sm:ml-3 sm:w-auto sm:text-sm">
              Create Task
            </button>
            <button type="button" onClick={onCancel} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2e9d74] sm:mt-0 sm:w-auto sm:text-sm">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>;
}