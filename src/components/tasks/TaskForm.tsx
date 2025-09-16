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
  const { addTask, addSubtask } = useTask();
  const [showSubtasksModal, setShowSubtasksModal] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [subtaskDraft, setSubtaskDraft] = useState('');
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const id = await addTask({
      title,
      description: '',
      deadline: new Date(deadline),
      priority,
      status: 'todo',
      createdBy: currentUser.id,
      department: currentUser.department
    });
    setCreatedTaskId(id);
    // Create all subtasks entered inline
    for (const st of subtasks) {
      await addSubtask(id, {
        title: st,
        description: '',
        deadline: new Date(deadline),
        priority,
        status: 'todo',
        createdBy: currentUser.id,
        department: currentUser.department
      });
    }
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
  return <div className="bg-white dark:bg-gray-900 shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
            Create New Task
          </h3>
          <button type="button" onClick={onCancel} className="inline-flex items-center p-1.5 border border-transparent rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2e9d74]">
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Title
              </label>
              <input type="text" name="title" id="title" required className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#2e9d74] focus:border-[#2e9d74] sm:text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Subtasks
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  placeholder="Add a subtask title"
                  className="flex-1 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#2e9d74] focus:border-[#2e9d74] sm:text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  value={subtaskDraft}
                  onChange={e => setSubtaskDraft(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => { if (subtaskDraft.trim()) { setSubtasks(prev => [...prev, subtaskDraft.trim()]); setSubtaskDraft(''); } }}
                  className="px-3 py-2 bg-[#2e9d74] text-white rounded-md"
                >
                  Add
                </button>
              </div>
              {subtasks.length > 0 && (
                <ul className="mt-2 divide-y divide-gray-200 dark:divide-gray-700">
                  {subtasks.map((st, idx) => (
                    <li key={`${st}-${idx}`} className="py-1 flex items-center justify-between">
                      <span className="text-sm text-gray-800 dark:text-gray-200">{st}</span>
                      <button type="button" className="text-xs text-red-600" onClick={() => setSubtasks(prev => prev.filter((_, i) => i !== idx))}>Remove</button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">You can add more subtasks later from the task details.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Deadline (This Week)
                </label>
                <input type="date" name="deadline" id="deadline" required min={min} max={max} className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#2e9d74] focus:border-[#2e9d74] sm:text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value={deadline} onChange={e => setDeadline(e.target.value)} />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                  Tasks must be completed within this week (Monday-Friday)
                </p>
              </div>
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Priority
                </label>
                <select id="priority" name="priority" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-[#2e9d74] focus:border-[#2e9d74] sm:text-sm rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value={priority} onChange={e => setPriority(e.target.value as TaskPriority)}>
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
            <button type="button" onClick={onCancel} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-700 shadow-sm px-4 py-2 bg-white dark:bg-gray-900 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2e9d74] sm:mt-0 sm:w-auto sm:text-sm">
              Cancel
            </button>
          </div>
        </form>
      </div>
      {/* Removed separate subtasks modal: subtasks are now inline within main modal */}
    </div>;
}