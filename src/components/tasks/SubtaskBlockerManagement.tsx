import React, { useState } from 'react';
import { AlertCircleIcon, CheckCircleIcon, ClockIcon, XIcon } from 'lucide-react';
import { Task, TaskStatus } from '../../context/TaskContext';

interface SubtaskBlockerManagementProps {
  subtask: Task;
  onUpdateStatus: (id: string, status: TaskStatus, blockerReason?: string) => void;
  canManage: boolean;
}

export function SubtaskBlockerManagement({ subtask, onUpdateStatus, canManage }: SubtaskBlockerManagementProps) {
  const [isBlocking, setIsBlocking] = useState(false);
  const [blockerReason, setBlockerReason] = useState(subtask.blockerReason || '');
  const [showReasonForm, setShowReasonForm] = useState(false);

  const handleBlockSubtask = () => {
    if (!blockerReason.trim()) {
      setShowReasonForm(true);
      return;
    }
    onUpdateStatus(subtask.id, 'blocker', blockerReason);
    setIsBlocking(false);
    setShowReasonForm(false);
  };

  const handleUnblockSubtask = () => {
    onUpdateStatus(subtask.id, 'in-progress');
    setBlockerReason('');
    setShowReasonForm(false);
  };

  const handleResolveBlocker = () => {
    onUpdateStatus(subtask.id, 'completed');
    setBlockerReason('');
    setShowReasonForm(false);
  };

  if (subtask.status === 'blocker') {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mt-2">
        <div className="flex items-start space-x-2">
          <AlertCircleIcon className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h5 className="text-xs font-medium text-red-800 dark:text-red-200 mb-1">
              Subtask Blocked
            </h5>
            {subtask.blockerReason && (
              <p className="text-xs text-red-700 dark:text-red-300 mb-2">
                <strong>Reason:</strong> {subtask.blockerReason}
              </p>
            )}
            {canManage && (
              <div className="flex space-x-1">
                <button
                  onClick={handleUnblockSubtask}
                  className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-500"
                >
                  <ClockIcon className="h-3 w-3 mr-1" />
                  Unblock
                </button>
                <button
                  onClick={handleResolveBlocker}
                  className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-green-500"
                >
                  <CheckCircleIcon className="h-3 w-3 mr-1" />
                  Resolve
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
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mt-2">
      <div className="flex items-start space-x-2">
        <AlertCircleIcon className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h5 className="text-xs font-medium text-yellow-800 dark:text-yellow-200 mb-1">
            Block Subtask
          </h5>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-2">
            Use this when the subtask cannot proceed due to external dependencies or issues.
          </p>
          
          {showReasonForm ? (
            <div className="space-y-2">
              <div>
                <label htmlFor={`blockerReason-${subtask.id}`} className="block text-xs font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                  Blocker Reason *
                </label>
                <textarea
                  id={`blockerReason-${subtask.id}`}
                  rows={2}
                  className="w-full px-2 py-1.5 text-xs border border-yellow-300 dark:border-yellow-600 rounded focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Explain why this subtask is blocked..."
                  value={blockerReason}
                  onChange={e => setBlockerReason(e.target.value)}
                />
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={handleBlockSubtask}
                  disabled={!blockerReason.trim()}
                  className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <AlertCircleIcon className="h-3 w-3 mr-1" />
                  Block
                </button>
                <button
                  onClick={() => {
                    setShowReasonForm(false);
                    setBlockerReason('');
                  }}
                  className="inline-flex items-center px-2 py-1 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-gray-500"
                >
                  <XIcon className="h-3 w-3 mr-1" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowReasonForm(true)}
              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-red-500"
            >
              <AlertCircleIcon className="h-3 w-3 mr-1" />
              Block Subtask
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
