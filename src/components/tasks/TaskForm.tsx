import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTask, TaskPriority } from '../../context/TaskContext';

type TaskStatus = 'todo' | 'in-progress' | 'completed' | 'blocker';
import { 
  XIcon, 
  PlusIcon, 
  CalendarIcon, 
  FlagIcon, 
  ListIcon, 
  TrashIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  CircleIcon
} from 'lucide-react';

type TaskFormProps = {
  onCancel: () => void;
  onTaskAdded: () => void;
};

export function TaskForm({
  onCancel,
  onTaskAdded
}: TaskFormProps) {
  const { currentUser } = useAuth();
  const { addTask, addSubtask } = useTask();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subtaskDraft, setSubtaskDraft] = useState('');
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [blockerReason, setBlockerReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setIsSubmitting(true);
    try {
    const id = await addTask({
      title,
      description,
      deadline: new Date(deadline),
      priority,
      status,
      blockerReason: status === 'blocker' ? blockerReason : undefined,
      createdBy: currentUser.id,
      department: currentUser.department
    });
      
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
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsSubmitting(false);
    }
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

  const { min, max } = getWeekDates();

  const addSubtaskToList = () => {
    if (subtaskDraft.trim()) {
      setSubtasks(prev => [...prev, subtaskDraft.trim()]);
      setSubtaskDraft('');
    }
  };

  const removeSubtask = (index: number) => {
    setSubtasks(prev => prev.filter((_, i) => i !== index));
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'todo':
        return <CircleIcon className="h-4 w-4 text-gray-400" />;
      case 'in-progress':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'blocker':
        return <AlertCircleIcon className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[90vh] max-h-[800px]">
      {/* Fixed Header */}
      <div className="px-8 py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-purple-600 flex items-center justify-center">
              <PlusIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Create New Task
          </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                Add a new task with subtasks and details
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onCancel} 
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
            </div>

      {/* Scrollable Form Content */}
      <div className="flex-1 overflow-y-auto">
        <form id="task-form" onSubmit={handleSubmit} className="px-8 py-6">
        <div className="space-y-6">
          {/* Task Title - Full Width */}
            <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Task Title *
              </label>
                <input
                  type="text"
              id="title" 
              required 
              className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Enter task title..."
              value={title} 
              onChange={e => setTitle(e.target.value)} 
            />
              </div>

          {/* Description - Full Width */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea 
              id="description"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Enter task description..."
              value={description} 
              onChange={e => setDescription(e.target.value)} 
            />
            </div>

          {/* Two Column Layout for Status, Priority, and Deadline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FlagIcon className="h-4 w-4 inline mr-2" />
                Status
              </label>
              <div className="relative">
                <select 
                  id="status" 
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 appearance-none text-sm"
                  value={status} 
                  onChange={e => setStatus(e.target.value as TaskStatus)}
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="blocker">Blocker</option>
              </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  {getStatusIcon(status)}
            </div>
              </div>
              </div>

            {/* Priority */}
              <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FlagIcon className="h-4 w-4 inline mr-2" />
                  Priority
                </label>
              <div className="relative">
                <select 
                  id="priority" 
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 appearance-none text-sm"
                  value={priority} 
                  onChange={e => setPriority(e.target.value as TaskPriority)}
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(priority)}`}>
                    {priority.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-2" />
                Deadline (This Week) *
              </label>
              <div className="relative">
                <input 
                  type="date" 
                  id="deadline" 
                  required 
                  min={min} 
                  max={max} 
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                  value={deadline} 
                  onChange={e => setDeadline(e.target.value)} 
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Monday-Friday only
              </p>
            </div>
          </div>

          {/* Blocker Reason - Full Width */}
          {status === 'blocker' && (
            <div>
              <label htmlFor="blockerReason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <AlertCircleIcon className="h-4 w-4 inline mr-2 text-red-500" />
                Blocker Reason *
              </label>
              <input 
                type="text" 
                id="blockerReason" 
                required={status === 'blocker'} 
                className="w-full px-4 py-3 border border-red-300 dark:border-red-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Explain why this task is blocked..."
                value={blockerReason} 
                onChange={e => setBlockerReason(e.target.value)} 
              />
            </div>
          )}

          {/* Subtasks - Full Width */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <ListIcon className="h-4 w-4 inline mr-2" />
              Subtasks
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Add a subtask title"
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                value={subtaskDraft}
                onChange={e => setSubtaskDraft(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addSubtaskToList())}
              />
              <button
                type="button"
                onClick={addSubtaskToList}
                className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-purple-600 text-white rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 font-medium text-sm flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-1.5" />
                Add
              </button>
            </div>
            
            {/* Subtasks List */}
            {subtasks.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Added Subtasks ({subtasks.length})
                </h4>
                {subtasks.map((subtask, idx) => (
                  <div key={`${subtask}-${idx}`} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                      <CircleIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{subtask}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSubtask(idx)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors duration-200"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
            </button>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              You can add more subtasks later from the task details.
            </p>
          </div>
        </div>
        </form>
      </div>

      {/* Fixed Footer */}
      <div className="px-8 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {subtasks.length > 0 && (
              <span className="flex items-center">
                <ListIcon className="h-3.5 w-3.5 mr-1.5" />
                {subtasks.length} subtask{subtasks.length !== 1 ? 's' : ''} added
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button 
              type="button" 
              onClick={onCancel} 
              className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              form="task-form"
              disabled={isSubmitting}
              className="px-8 py-2.5 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-green-500 to-purple-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Task
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}