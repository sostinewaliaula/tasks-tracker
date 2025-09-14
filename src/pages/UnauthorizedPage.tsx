import React from 'react';
import { useNavigate } from 'react-router-dom';

export function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <div className="text-center space-y-6 p-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-lg text-gray-600">
            You don't have permission to access this resource.
          </p>
        </div>
        
        <div className="space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-[#2e9d74] text-white rounded-lg hover:bg-[#258a5f] transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}