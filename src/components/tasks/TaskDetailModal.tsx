import React from 'react';
import { useTask, TaskStatus, TaskPriority } from '../../context/TaskContext';
import { XIcon, ClockIcon, CalendarIcon, UserIcon, CheckIcon, PlusIcon } from 'lucide-react';
type TaskDetailModalProps = {
  taskId: string;
  onClose: () => void;
};
export function TaskDetailModal({
  taskId,
  onClose
}: TaskDetailModalProps) {
  const {
    tasks,
    updateTaskStatus,
    addSubtask
  } = useTask();
  const task = tasks.find(t => t.id === taskId);
  const [showAddSubtask, setShowAddSubtask] = React.useState(false);
  const [subtaskTitle, setSubtaskTitle] = React.useState('');
  const [subtaskDescription, setSubtaskDescription] = React.useState('');
  const [subtaskPriority, setSubtaskPriority] = React.useState<TaskPriority>('medium');
  const [warning, setWarning] = React.useState<string | null>(null);
  const completedSubtasks = task.subtasks ? task.subtasks.filter(st => st.status === 'completed').length : 0;
  const totalSubtasks = task.subtasks ? task.subtasks.length : 0;
  const progress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;
  if (!task) return null;
  const handleStatusChange = (newStatus: TaskStatus) => {
    if (newStatus === 'completed' && task.subtasks && task.subtasks.length > 0) {
      const incomplete = task.subtasks.some(st => st.status !== 'completed');
      if (incomplete) {
        setWarning('You cannot complete this task until all subtasks are completed.');
        return;
      }
    }
    setWarning(null);
    updateTaskStatus(taskId, newStatus);
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
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
            To Do
          </span>;
      case 'in-progress':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            In Progress
          </span>;
      case 'completed':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Completed
          </span>;
    }
  };
  return <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75 dark:bg-gray-900 dark:opacity-80"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>
        <div className="inline-block align-bottom bg-white dark:bg-gray-900 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white dark:bg-gray-900 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                    Task Details
                  </h3>
                  <button type="button" className="bg-white dark:bg-gray-900 rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none" onClick={onClose}>
                    <span className="sr-only">Close</span>
                    <XIcon className="h-6 w-6" />
                  </button>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between items-start">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {task.title}
                    </h2>
                    <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}{' '}
                      Priority
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-4">
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <p className="text-sm text-gray-500 dark:text-gray-300">
                        {task.description}
                      </p>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-300">
                        <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400 dark:text-gray-300" />
                        <span>
                          Deadline:{' '}
                          <span className="font-medium">
                            {formatDate(task.deadline)}
                          </span>
                        </span>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-300">
                        <ClockIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400 dark:text-gray-300" />
                        <span>
                          Created:{' '}
                          <span className="font-medium">
                            {formatDate(task.createdAt)}
                          </span>
                        </span>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-300">
                        <UserIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400 dark:text-gray-300" />
                        <span>
                          Department:{' '}
                          <span className="font-medium">{task.department}</span>
                        </span>
                      </div>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200 mr-2">
                            Status:
                          </span>
                          {getStatusBadge(task.status)}
                        </div>
                        {warning && (
                          <div className="text-xs text-red-500 mt-2">{warning}</div>
                        )}
                        {task.status !== 'completed' && <div className="flex space-x-2">
                            {task.status === 'todo' && <button onClick={() => handleStatusChange('in-progress')} className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-[#2e9d74] bg-[#e8f5f0] hover:bg-[#d1ebe3] dark:bg-[#22332c] dark:hover:bg-[#1a2821] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2e9d74]">
                                Start
                              </button>}
                            <button onClick={() => handleStatusChange('completed')} className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-gradient-to-r from-[#2e9d74] to-[#8c52ff] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2e9d74]">
                              <CheckIcon className="h-4 w-4 mr-1" />
                              Complete
                            </button>
                          </div>}
                      </div>
                    </div>

                    {/* Subtasks section */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100">Subtasks</h4>
                        <button onClick={() => setShowAddSubtask(true)} className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-[#2e9d74] hover:opacity-90">
                          <PlusIcon className="h-4 w-4 mr-1" />
                          Add Subtask
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
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-700 shadow-sm px-4 py-2 bg-white dark:bg-gray-900 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2e9d74] sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
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
    </div>;
}