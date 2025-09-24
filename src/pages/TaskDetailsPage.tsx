import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTask, TaskStatus, TaskPriority } from '../context/TaskContext';
import { useToast } from '../components/departments/DepartmentModal';
import { BlockerManagement } from '../components/tasks/BlockerManagement';
import { SubtaskBlockerManagement } from '../components/tasks/SubtaskBlockerManagement';
import { 
  XIcon, 
  ClockIcon, 
  CalendarIcon, 
  UserIcon, 
  CheckIcon, 
  PlusIcon, 
  ArrowLeft,
  CheckCircleIcon,
  CircleIcon,
  AlertCircleIcon,
  EditIcon,
  TrashIcon,
  ListIcon,
  TrendingUpIcon,
  ChevronDownIcon,
  FlagIcon
} from 'lucide-react';

export function TaskDetailsPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { tasks, updateTaskStatus, addSubtask, carryOverTask } = useTask();
  const { showToast } = useToast();
  const task = tasks.find(t => t.id === taskId);
  const [showAddSubtask, setShowAddSubtask] = React.useState(false);
  const [subtaskTitle, setSubtaskTitle] = React.useState('');
  const [subtaskDescription, setSubtaskDescription] = React.useState('');
  const [subtaskPriority, setSubtaskPriority] = React.useState<TaskPriority>('medium');
  const [warning, setWarning] = React.useState<string | null>(null);
  const [showCarryOver, setShowCarryOver] = React.useState(false);
  const [carryReason, setCarryReason] = React.useState('');
  const [carryDate, setCarryDate] = React.useState<string>('');

  if (!task) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <AlertCircleIcon className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Task not found</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">The task you're looking for doesn't exist or has been removed.</p>
        <button
          onClick={() => navigate('/tasks')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-500 to-purple-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tasks
        </button>
      </div>
    );
  }

  const completedSubtasks = task.subtasks ? task.subtasks.filter(st => st.status === 'completed').length : 0;
  const totalSubtasks = task.subtasks ? task.subtasks.length : 0;
  const progress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  // Calculate progress and status based on subtasks
  let computedStatus: TaskStatus = task.status;
  if (totalSubtasks > 0) {
    if (completedSubtasks === totalSubtasks) {
      computedStatus = 'completed';
    } else if (completedSubtasks > 0) {
      computedStatus = 'in-progress';
    } else {
      computedStatus = 'todo';
    }
  }

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
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200';
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'todo':
        return <CircleIcon className="h-5 w-5 text-gray-400" />;
      case 'in-progress':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'todo':
        return <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">To Do</span>;
      case 'in-progress':
        return <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">In Progress</span>;
      case 'completed':
        return <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completed</span>;
      case 'blocker':
        return <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Blocked</span>;
    }
  };

  const isOverdue = new Date(task.deadline).getTime() < new Date().getTime() && task.status !== 'completed';

  const handleCarryOver = async () => {
    if (!carryDate || !carryReason.trim()) return;
    try {
      await carryOverTask(task.id, new Date(carryDate), carryReason.trim());
      showToast('Task carried over successfully', 'success');
      setShowCarryOver(false);
      setCarryReason('');
      setCarryDate('');
    } catch (e: any) {
      showToast(e?.message || 'Failed to carry over task', 'error');
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center px-4 py-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> 
            Back
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Task Details</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and track your task progress</p>
          </div>
        </div>
        
        {/* Status Actions */}
        <div className="flex items-center space-x-3">
          {task.status !== 'completed' && (
            <button
              onClick={() => handleStatusChange('completed')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-500 to-purple-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
            >
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Mark Complete
            </button>
          )}
          {task.status === 'todo' && (
            <button
              onClick={() => handleStatusChange('in-progress')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
            >
              <ClockIcon className="h-4 w-4 mr-2" />
              Start Task
            </button>
          )}
        </div>
      </div>

      {/* Warning Message */}
      {warning && (
        <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex">
            <AlertCircleIcon className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">{warning}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Task Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-4">
                {getStatusIcon(computedStatus)}
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{task.title}</h2>
              </div>
              
              <div className="flex items-center space-x-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                </span>
                {getStatusBadge(computedStatus)}
                {isOverdue && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200">
                    Overdue
                  </span>
                )}
                {task.isCarriedOver && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200">
                    Carried Over
                  </span>
                )}
              </div>

              <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-6">{task.description}</p>
            </div>
          </div>

          {/* Blocker Management */}
          <BlockerManagement 
            task={task} 
            onUpdateStatus={updateTaskStatus}
            canManage={true} // For now, allow all users to manage blockers
          />

          {/* Task Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Deadline</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatDate(task.deadline)}</p>
                {isOverdue && <p className="text-xs text-red-600 dark:text-red-400 font-medium">Overdue</p>}
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <ClockIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatDate(task.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <UserIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Department</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{task.department}</p>
              </div>
            </div>
          </div>

          {/* Carry Over Button */}
          {isOverdue && (
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setShowCarryOver(true)} 
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200"
              >
                <ClockIcon className="h-4 w-4 mr-2" />
                Carry Over Task
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Subtasks Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ListIcon className="h-5 w-5 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Subtasks</h3>
              {totalSubtasks > 0 && (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                  {completedSubtasks}/{totalSubtasks} completed
                </span>
              )}
            </div>
            <button 
              onClick={() => setShowAddSubtask(true)} 
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-500 to-purple-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Subtask
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {totalSubtasks > 0 && (
          <div className="px-8 py-4 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-500 to-purple-600 h-3 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Subtasks List */}
        <div className="p-8">
          {task.subtasks && task.subtasks.length > 0 ? (
            <div className="space-y-4">
              {task.subtasks.map(subtask => (
                <div key={subtask.id} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="flex items-center space-x-4 p-4">
                    <button
                      onClick={() => updateTaskStatus(subtask.id, subtask.status === 'completed' ? 'todo' : 'completed')}
                      className="flex-shrink-0 hover:scale-110 transition-transform duration-200"
                    >
                      {getStatusIcon(subtask.status)}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {subtask.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {subtask.description}
                      </p>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(subtask.priority)}`}>
                          {subtask.priority.charAt(0).toUpperCase() + subtask.priority.slice(1)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Due {formatDate(subtask.deadline)}
                        </span>
                        {subtask.status === 'blocker' && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            Blocked
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <select 
                        value={subtask.status} 
                        onChange={e => updateTaskStatus(subtask.id, e.target.value as TaskStatus)} 
                        className="text-xs rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="blocker">Blocked</option>
                      </select>
                      {getStatusBadge(subtask.status)}
                    </div>
                  </div>
                  
                  {/* Subtask Blocker Management */}
                  <SubtaskBlockerManagement 
                    subtask={subtask} 
                    onUpdateStatus={updateTaskStatus}
                    canManage={true}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <ListIcon className="h-6 w-6 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No subtasks yet</h4>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Break down your task into smaller, manageable subtasks.</p>
              <button
                onClick={() => setShowAddSubtask(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-500 to-purple-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add First Subtask
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Subtask Modal */}
      {showAddSubtask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[80vh] max-h-[600px] mx-4">
            {/* Fixed Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <PlusIcon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Create New Subtask</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Add a subtask to break down this task</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAddSubtask(false)} 
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-5">
                {/* Title */}
                <div>
                  <label htmlFor="subtaskTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <ListIcon className="h-4 w-4 inline mr-2" />
                    Subtask Title *
                  </label>
                  <input 
                    id="subtaskTitle"
                    type="text"
                    value={subtaskTitle} 
                    onChange={e => setSubtaskTitle(e.target.value)} 
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm" 
                    placeholder="Enter subtask title..."
                  />
                </div>
                
                {/* Description */}
                <div>
                  <label htmlFor="subtaskDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <EditIcon className="h-4 w-4 inline mr-2" />
                    Description
                  </label>
                  <textarea 
                    id="subtaskDescription"
                    value={subtaskDescription} 
                    onChange={e => setSubtaskDescription(e.target.value)} 
                    rows={3} 
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm resize-none"
                    placeholder="Enter subtask description..."
                  />
                </div>
                
                {/* Priority */}
                <div>
                  <label htmlFor="subtaskPriority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <FlagIcon className="h-4 w-4 inline mr-2" />
                    Priority
                  </label>
                  <div className="relative">
                    <select 
                      id="subtaskPriority"
                      value={subtaskPriority} 
                      onChange={e => setSubtaskPriority(e.target.value as TaskPriority)} 
                      className="w-full px-3 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 appearance-none text-sm"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ChevronDownIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
              <div className="flex justify-end space-x-3">
                <button 
                  onClick={() => setShowAddSubtask(false)} 
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateSubtask} 
                  className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-green-500 to-purple-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
                >
                  Create Subtask
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Carry Over Modal */}
      {isOverdue && showCarryOver && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-xl shadow-xl p-6 mx-4 border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <AlertCircleIcon className="h-6 w-6 text-red-500" />
                <h4 className="text-xl font-semibold text-red-600 dark:text-red-400">Task Overdue</h4>
              </div>
              <button 
                onClick={() => setShowCarryOver(false)} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors duration-200"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Deadline</label>
                  <input
                    type="date"
                    value={carryDate}
                    min={new Date(Date.now() + 24*60*60*1000).toISOString().slice(0,10)}
                    max={new Date(Date.now() + 7*24*60*60*1000).toISOString().slice(0,10)}
                    onChange={e => setCarryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reason</label>
                  <input 
                    value={carryReason} 
                    onChange={e => setCarryReason(e.target.value)} 
                    placeholder="Explain the unavoidable circumstances..." 
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button 
                  onClick={() => setShowCarryOver(false)} 
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button 
                  disabled={!carryDate || !carryReason.trim()} 
                  onClick={handleCarryOver} 
                  className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-600 hover:opacity-90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200"
                >
                  Save Carry Over
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}