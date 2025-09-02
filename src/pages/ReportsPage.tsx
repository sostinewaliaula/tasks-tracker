import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTask } from '../context/TaskContext';
import { DEPARTMENTS } from '../constants/departments';
import { TaskStats } from '../components/dashboard/TaskStats';
import { TeamPerformance } from '../components/reports/TeamPerformance';
import { TimeframeSelector } from '../components/reports/TimeframeSelector';
import { ExportOptions } from '../components/reports/ExportOptions';
import { BarChart2Icon, CalendarIcon, UsersIcon, TrendingUpIcon } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from 'recharts';
export function ReportsPage() {
  const { currentUser } = useAuth();
  const { tasks } = useTask();
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('week');
  const [reportType, setReportType] = useState<'overview' | 'team' | 'trends'>('overview');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  if (!currentUser || (currentUser.role !== 'manager' && currentUser.role !== 'superadmin')) {
    return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6 text-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Access Restricted
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500 mx-auto">
              <p>Only managers and super admins can access the reports page.</p>
            </div>
          </div>
        </div>
      </div>;
  }
  const isSuperAdmin = currentUser.role === 'superadmin';
  const departments = useMemo(() => DEPARTMENTS, []);

  // Build trend data based on timeframe and department filter
  const trendData = useMemo(() => {
    const scopeDept = isSuperAdmin ? (selectedDepartment === 'all' ? undefined : selectedDepartment) : currentUser.department;
    const filtered = tasks.filter(t => (scopeDept ? t.department === scopeDept : true));

    const now = new Date();
    const makeKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;
    if (fromDate) fromDate.setHours(0,0,0,0);
    if (toDate) toDate.setHours(23,59,59,999);

    if (timeframe === 'week') {
      // Start from Monday of this week
      const start = new Date(now);
      const day = start.getDay();
      const mondayOffset = (day === 0 ? -6 : 1 - day);
      start.setDate(start.getDate() + mondayOffset);
      start.setHours(0,0,0,0);
      const days: { name: string; created: number; completed: number }[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const key = makeKey(d);
        const created = filtered.filter(t => {
          const c = new Date(t.createdAt);
          if (fromDate && c < fromDate) return false;
          if (toDate && c > toDate) return false;
          return makeKey(c) === key;
        }).length;
        const completed = filtered.filter(t => {
          const comp = new Date(t.deadline);
          if (fromDate && comp < fromDate) return false;
          if (toDate && comp > toDate) return false;
          return t.status === 'completed' && makeKey(comp) === key;
        }).length;
        days.push({ name: d.toLocaleDateString(undefined, { weekday: 'short' }), created, completed });
      }
      return days;
    }

    if (timeframe === 'month') {
      // Aggregate by week number within current month
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth()+1, 0);
      const weekBuckets: Record<string, { name: string; created: number; completed: number }> = {};
      const weekLabel = (d: Date) => `W${Math.ceil((d.getDate() + (new Date(d.getFullYear(), d.getMonth(), 1).getDay() || 7)) / 7)}`;
      for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate()+1)) {
        const label = weekLabel(dt);
        weekBuckets[label] ||= { name: label, created: 0, completed: 0 };
      }
      filtered.forEach(t => {
        const c = new Date(t.createdAt);
        if (c.getMonth() === now.getMonth()) {
          if (fromDate && c < fromDate) { /* skip */ } else if (toDate && c > toDate) { /* skip */ } else {
          const w = weekLabel(c);
          weekBuckets[w].created += 1;
          }
        }
        const d = new Date(t.deadline);
        if (t.status === 'completed' && d.getMonth() === now.getMonth()) {
          if (fromDate && d < fromDate) { /* skip */ } else if (toDate && d > toDate) { /* skip */ } else {
          const w = weekLabel(d);
          weekBuckets[w].completed += 1;
          }
        }
      });
      return Object.values(weekBuckets);
    }

    // timeframe === 'quarter' → aggregate by month for last 3 months
    const startMonth = now.getMonth() - 2;
    const months: { name: string; created: number; completed: number }[] = [];
    for (let i = 0; i < 3; i++) {
      const m = new Date(now.getFullYear(), startMonth + i, 1);
      const name = m.toLocaleString(undefined, { month: 'short' });
      const created = filtered.filter(t => {
        const c = new Date(t.createdAt);
        if (fromDate && c < fromDate) return false;
        if (toDate && c > toDate) return false;
        return c.getFullYear() === m.getFullYear() && c.getMonth() === m.getMonth();
      }).length;
      const completed = filtered.filter(t => {
        const d = new Date(t.deadline);
        if (fromDate && d < fromDate) return false;
        if (toDate && d > toDate) return false;
        return t.status === 'completed' && d.getFullYear() === m.getFullYear() && d.getMonth() === m.getMonth();
      }).length;
      months.push({ name, created, completed });
    }
    return months;
  }, [tasks, timeframe, selectedDepartment, isSuperAdmin, currentUser.department, dateFrom, dateTo]);
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {isSuperAdmin ? 'Company Reports' : 'Department Reports'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {isSuperAdmin ? 'Organization-wide analytics and insights' : <>Comprehensive analytics and insights for {currentUser.department} department</>}
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
          <div className="mt-4 grid grid-cols-1 gap-y-4 sm:grid-cols-3 sm:gap-x-6">
            <div>
              <TimeframeSelector value={timeframe} onChange={value => setTimeframe(value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date Range</label>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <input type="date" className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#2e9d74] focus:border-[#2e9d74] sm:text-sm" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                <input type="date" className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#2e9d74] focus:border-[#2e9d74] sm:text-sm" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
              <p className="text-xs text-gray-500 mt-1">Used for exports and future filters.</p>
            </div>
            {isSuperAdmin && (
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label>
                <select id="department" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#2e9d74] focus:border-[#2e9d74] sm:text-sm rounded-md" value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)}>
                  <option value="all">All Departments</option>
                  {departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            )}
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
          {reportType === 'overview' && <TaskStats department={isSuperAdmin ? (selectedDepartment === 'all' ? undefined : selectedDepartment) : currentUser.department} timeframe={timeframe} />}
          {reportType === 'team' && <TeamPerformance department={isSuperAdmin ? (selectedDepartment === 'all' ? undefined : selectedDepartment) : currentUser.department} timeframe={timeframe} />}
          {reportType === 'trends' && (
            <div className="space-y-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Created vs Completed</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="created" name="Created" stroke="#8c52ff" />
                        <Line type="monotone" dataKey="completed" name="Completed" stroke="#2e9d74" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Created Tasks</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="created" name="Created" fill="#8c52ff" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Completed Tasks</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="completed" name="Completed" fill="#2e9d74" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>;
}