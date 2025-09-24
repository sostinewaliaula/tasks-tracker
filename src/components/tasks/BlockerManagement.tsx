import React, { useState } from 'react';
import { AlertCircleIcon, CheckCircleIcon, ClockIcon, XIcon } from 'lucide-react';
import { Task, TaskStatus } from '../../context/TaskContext';

interface BlockerManagementProps {
  task: Task;
  onUpdateStatus: (status: TaskStatus, blockerReason?: string) => void;
  canManage: boolean;
}

export function BlockerManagement({ task, onUpdateStatus, canManage }: BlockerManagementProps) {
  const [isBlocking, setIsBlocking] = useState(false);
  const [blockerReason, setBlockerReason] = useState(task.blockerReason || '');
  const [showReasonForm, setShowReasonForm] = useState(false);

  const handleBlockTask = () => {
    if (!blockerReason.trim()) {
      setShowReasonForm(true);
      return;
    }
    onUpdateStatus('blocker', blockerReason);
    setIsBlocking(false);
    setShowReasonForm(false);
  };

  const handleUnblockTask = () => {
    onUpdateStatus('in-progress');
    setBlockerReason('');
    setShowReasonForm(false);
  };

  const handleResolveBlocker = () => {
    onUpdateStatus('completed');
    setBlockerReason('');
    setShowReasonForm(false);
  };

  if (task.status === 'blocker') {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircleIcon className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
              Task Blocked
            </h4>
            {task.blockerReason && (
              <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                <strong>Reason:</strong> {task.blockerReason}
              </p>
            )}
            {canManage && (
              <div className="flex space-x-2">
                <button
                  onClick={handleUnblockTask}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <ClockIcon className="h-3 w-3 mr-1" />
                  Unblock
                </button>
                <button
                  onClick={handleResolveBlocker}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <CheckCircleIcon className="h-3 w-3 mr-1" />
                  Mark Resolved
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!canManage) return null;

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <AlertCircleIcon className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            Block Task
          </h4>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
            Use this when the task cannot proceed due to external dependencies or issues.
          </p>
          
          {showReasonForm ? (
            <div className="space-y-3">
              <div>
                <label htmlFor="blockerReason" className="block text-xs font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                  Blocker Reason *
                </label>
                <textarea
                  id="blockerReason"
                  rows={3}
                  className="w-full px-3 py-2 border border-yellow-300 dark:border-yellow-600 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                  placeholder="Explain why this task is blocked..."
                  value={blockerReason}
                  onChange={e => setBlockerReason(e.target.value)}
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleBlockTask}
                  disabled={!blockerReason.trim()}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <AlertCircleIcon className="h-3 w-3 mr-1" />
                  Block Task
                </button>
                <button
                  onClick={() => {
                    setShowReasonForm(false);
                    setBlockerReason('');
                  }}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  <XIcon className="h-3 w-3 mr-1" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowReasonForm(true)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <AlertCircleIcon className="h-3 w-3 mr-1" />
              Block Task
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
