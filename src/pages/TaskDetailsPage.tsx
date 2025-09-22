import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTask, TaskStatus, TaskPriority } from '../context/TaskContext';
import { XIcon, ClockIcon, CalendarIcon, UserIcon, CheckIcon, PlusIcon, ArrowLeft } from 'lucide-react';

export function TaskDetailsPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { tasks, updateTaskStatus, addSubtask } = useTask();
  const task = tasks.find(t => t.id === taskId);
  const [showAddSubtask, setShowAddSubtask] = React.useState(false);
  const [subtaskTitle, setSubtaskTitle] = React.useState('');
  const [subtaskDescription, setSubtaskDescription] = React.useState('');
  const [subtaskPriority, setSubtaskPriority] = React.useState<TaskPriority>('medium');
  const [warning, setWarning] = React.useState<string | null>(null);
  if (!task) return <div className="max-w-4xl mx-auto py-12 text-center text-gray-500 dark:text-gray-400">Task not found.</div>;

  const completedSubtasks = task.subtasks ? task.subtasks.filter(st => st.status === 'completed').length : 0;
  const totalSubtasks = task.subtasks ? task.subtasks.length : 0;
  const progress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const handleStatusChange = (newStatus: TaskStatus) => {
    if (newStatus === 'completed' && task.subtasks && task.subtasks.length > 0) {
      const incomplete = task.subtasks.some(st => st.status !== 'completed');
      if (incomplete) {
        setWarning('You cannot complete this task until all subtasks are completed.');
        return;
      }
    }
    setWarning(null);
    updateTaskStatus(task.id, newStatus);
  };

  const handleCreateSubtask = async () => {
    if (!subtaskTitle.trim()) return;
    await addSubtask(task.id, {
      title: subtaskTitle.trim(),
      description: subtaskDescription,
      deadline: task.deadline,
      priority: subtaskPriority,
      status: 'todo',
      createdBy: task.createdBy,
      department: task.department
    });
    setSubtaskTitle('');
    setSubtaskDescription('');
    setSubtaskPriority('medium');
    setShowAddSubtask(false);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
  };
  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'todo':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">To Do</span>;
      case 'in-progress':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">In Progress</span>;
      case 'completed':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completed</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center px-3 py-2 rounded-md bg-white dark:bg-gray-900 shadow hover:bg-gray-100 dark:hover:bg-gray-800 text-[#2e9d74] mr-4">
          <ArrowLeft className="h-5 w-5 mr-1" /> Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Task Details</h1>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">{task.title}</h2>
            <div className="flex items-center space-x-2 mb-2">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(task.priority)}`}>{task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority</span>
              {getStatusBadge(task.status)}
            </div>
            <p className="text-gray-500 dark:text-gray-300 mb-2">{task.description}</p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-300">
              <span className="flex items-center"><CalendarIcon className="h-4 w-4 mr-1" /> Deadline: <span className="ml-1 font-medium">{formatDate(task.deadline)}</span></span>
              <span className="flex items-center"><ClockIcon className="h-4 w-4 mr-1" /> Created: <span className="ml-1 font-medium">{formatDate(task.createdAt)}</span></span>
              <span className="flex items-center"><UserIcon className="h-4 w-4 mr-1" /> Department: <span className="ml-1 font-medium">{task.department}</span></span>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col items-end">
            <label className="text-xs text-gray-600 dark:text-gray-300 mb-1">Change Status</label>
            <select value={task.status} onChange={e => handleStatusChange(e.target.value as TaskStatus)} className="rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2">
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            {warning && <div className="text-xs text-red-500 mt-2">{warning}</div>}
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Subtasks</h3>
          <button onClick={() => setShowAddSubtask(true)} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-[#2e9d74] hover:opacity-90">
            <PlusIcon className="h-4 w-4 mr-1" /> Add Subtask
          </button>
        </div>
        {totalSubtasks > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600 dark:text-gray-300">Progress</span>
              <span className="text-gray-600 dark:text-gray-300">{completedSubtasks}/{totalSubtasks} completed</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2.5">
              <div className="bg-gradient-to-r from-[#2e9d74] to-[#8c52ff] h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {task.subtasks && task.subtasks.length > 0 ? (
            task.subtasks.map(st => (
              <li key={st.id} className="py-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{st.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-300">Due {formatDate(st.deadline)}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <select value={st.status} onChange={e => updateTaskStatus(st.id, e.target.value as TaskStatus)} className="text-xs rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  {getStatusBadge(st.status)}
                </div>
              </li>
            ))
          ) : (
            <li className="py-2 text-sm text-gray-500 dark:text-gray-300">No subtasks yet.</li>
          )}
        </ul>
      </div>
      {showAddSubtask && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-md shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100">New Subtask for "{task.title}"</h4>
              <button onClick={() => setShowAddSubtask(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Title</label>
                <input value={subtaskTitle} onChange={e => setSubtaskTitle(e.target.value)} className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Description</label>
                <textarea value={subtaskDescription} onChange={e => setSubtaskDescription(e.target.value)} rows={3} className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Priority</label>
                <select value={subtaskPriority} onChange={e => setSubtaskPriority(e.target.value as TaskPriority)} className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="text-right">
                <button onClick={handleCreateSubtask} className="px-4 py-2 rounded-md border border-transparent bg-[#2e9d74] text-white">Create Subtask</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
