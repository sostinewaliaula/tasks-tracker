import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTask } from '../context/TaskContext';
import { TaskStats } from '../components/dashboard/TaskStats';
import { TeamPerformance } from '../components/reports/TeamPerformance';
import { TimeframeSelector } from '../components/reports/TimeframeSelector';
import { ExportOptions } from '../components/reports/ExportOptions';
import { BarChart2Icon, CalendarIcon, UsersIcon, TrendingUpIcon } from 'lucide-react';
export function ReportsPage() {
  const {
    currentUser
  } = useAuth();
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('week');
  const [reportType, setReportType] = useState<'overview' | 'team' | 'trends'>('overview');
  if (!currentUser || currentUser.role !== 'manager') {
    return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6 text-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Access Restricted
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500 mx-auto">
              <p>Only managers can access the reports page.</p>
            </div>
          </div>
        </div>
      </div>;
  }
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Department Reports
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Comprehensive analytics and insights for {currentUser.department}{' '}
            department
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <ExportOptions />
        </div>
      </div>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Report Settings
            </h3>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-6">
            <div>
              <TimeframeSelector value={timeframe} onChange={value => setTimeframe(value)} />
            </div>
            <div>
              <label htmlFor="reportType" className="block text-sm font-medium text-gray-700">
                Report Type
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <button type="button" onClick={() => setReportType('overview')} className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${reportType === 'overview' ? 'text-[#2e9d74] z-10 border-[#2e9d74]' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <BarChart2Icon className="h-5 w-5 mr-2" />
                  Overview
                </button>
                <button type="button" onClick={() => setReportType('team')} className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${reportType === 'team' ? 'text-[#2e9d74] z-10 border-[#2e9d74]' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <UsersIcon className="h-5 w-5 mr-2" />
                  Team
                </button>
                <button type="button" onClick={() => setReportType('trends')} className={`relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${reportType === 'trends' ? 'text-[#2e9d74] z-10 border-[#2e9d74]' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <TrendingUpIcon className="h-5 w-5 mr-2" />
                  Trends
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 py-5 sm:p-6">
          {reportType === 'overview' && <TaskStats department={currentUser.department} timeframe={timeframe} />}
          {reportType === 'team' && <TeamPerformance department={currentUser.department} timeframe={timeframe} />}
          {reportType === 'trends' && <div className="text-center py-10">
              <TrendingUpIcon className="h-12 w-12 text-[#2e9d74] mx-auto" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                Trends Analysis
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Coming soon! This feature is under development.
              </p>
            </div>}
        </div>
      </div>
    </div>;
}