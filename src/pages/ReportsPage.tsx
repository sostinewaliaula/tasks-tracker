import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTask } from '../context/TaskContext';
import { useToast } from '../components/ui/Toast';
import { DEPARTMENTS } from '../constants/departments';
import { TaskStats } from '../components/dashboard/TaskStats';
import { TeamPerformance } from '../components/reports/TeamPerformance';
import { TimeframeSelector } from '../components/reports/TimeframeSelector';
import { ExportOptions } from '../components/reports/ExportOptions';
import { BarChart2Icon, CalendarIcon, UsersIcon, TrendingUpIcon, AlertCircleIcon, ClockIcon } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from 'recharts';
export function ReportsPage() {
  const { currentUser } = useAuth();
  const { tasks } = useTask();
  const { showToast } = useToast();
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('week');
  const [reportType, setReportType] = useState<'overview' | 'team' | 'trends' | 'blockers'>('overview');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  const handleExport = (filteredTasks: any[], format: string, dateRange: string, statuses: string[]) => {
    // Create export data
    const exportData = filteredTasks.map(task => ({
      'Task ID': task.id,
      'Title': task.title,
      'Description': task.description,
      'Status': task.status,
      'Department': task.department,
      'Created By': task.createdBy,
      'Deadline': new Date(task.deadline).toLocaleDateString(),
      'Blocker Reason': task.blockerReason || '',
      'Subtasks Count': task.subtasks?.length || 0
    }));

    if (format === 'CSV') {
      // Convert to CSV
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header] || '';
            // Escape commas and quotes in CSV
            return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
              ? `"${value.replace(/"/g, '""')}"` 
              : value;
          }).join(',')
        )
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `tasks-export-${dateRange}-${format.toLowerCase()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'Excel') {
      // For Excel, we'll create a simple CSV that can be opened in Excel
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join('\t'),
        ...exportData.map(row => 
          headers.map(header => row[header] || '').join('\t')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/tab-separated-values;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `tasks-export-${dateRange}-${format.toLowerCase()}.xls`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'PDF') {
      // For PDF, we'll create a simple HTML table and use browser print
      const tableHtml = `
        <html>
          <head>
            <title>Tasks Export - ${dateRange}</title>
            <style>
              @page { size: A4 portrait; margin: 20mm; }
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
              th { background-color: #2e9d74; color: white; font-weight: bold; }
              .header { text-align: center; margin-bottom: 20px; }
              .summary { margin-bottom: 20px; }
              tr:nth-child(even) { background-color: #f9f9f9; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Tasks Export Report</h1>
              <p>Date Range: ${dateRange}</p>
              <p>Statuses: ${statuses.join(', ')}</p>
              <p>Total Tasks: ${exportData.length}</p>
            </div>
            <table>
              <thead>
                <tr>
                  ${Object.keys(exportData[0] || {}).map(header => `<th>${header}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${exportData.map(row => 
                  `<tr>${Object.values(row).map(value => `<td>${value || ''}</td>`).join('')}</tr>`
                ).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(tableHtml);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }
    } else if (format === 'Word') {
      const wordHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Tasks Export - ${dateRange}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #2e9d74; margin-bottom: 10px; }
            .summary { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .summary-item { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #2e9d74; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Tasks Export Report</div>
            <div>Generated on ${new Date().toLocaleDateString()}</div>
          </div>
          
          <div class="summary">
            <div class="summary-item"><strong>Date Range:</strong> ${dateRange}</div>
            <div class="summary-item"><strong>Statuses:</strong> ${statuses.join(', ')}</div>
            <div class="summary-item"><strong>Total Tasks:</strong> ${exportData.length}</div>
          </div>
          
          <table>
            <thead>
              <tr>
                ${Object.keys(exportData[0] || {}).map(header => `<th>${header}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${exportData.map(row => 
                `<tr>${Object.values(row).map(value => `<td>${value || ''}</td>`).join('')}</tr>`
              ).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;
      
      const blob = new Blob([wordHtml], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tasks-export-${dateRange.toLowerCase().replace(/\s+/g, '-')}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    showToast(`Export completed! ${exportData.length} tasks exported as ${format} for ${dateRange}`, 'success');
  };

  if (!currentUser) {
    return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="card">
          <div className="px-4 py-5 sm:p-6 text-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
              Access Restricted
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-300 mx-auto">
              <p>Please log in to access the reports page.</p>
            </div>
          </div>
        </div>
      </div>;
  }
  const isAdmin = currentUser.role === 'admin';
  const isManager = currentUser.role === 'manager';
  const departments = useMemo(() => DEPARTMENTS, []);

  // Build trend data based on timeframe and department filter
  const trendData = useMemo(() => {
    const scopeDept = isAdmin ? (selectedDepartment === 'all' ? undefined : selectedDepartment) : currentUser.department;
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
  }, [tasks, timeframe, selectedDepartment, isAdmin, currentUser.department, dateFrom, dateTo]);

  // Blocker Analytics
  const blockerAnalytics = useMemo(() => {
    const scopeDept = isAdmin ? (selectedDepartment === 'all' ? undefined : selectedDepartment) : 
                     isManager ? currentUser.department : undefined;
    
    let filteredTasks = tasks;
    if (scopeDept) {
      filteredTasks = tasks.filter(t => t.department === scopeDept);
    }
    
    // Include subtask blockers
    const allBlockers = [
      ...filteredTasks.filter(task => task.status === 'blocker'),
      ...filteredTasks.flatMap(task => task.subtasks?.filter(subtask => subtask.status === 'blocker') || [])
    ];

    // Filter by user role
    let userBlockers = allBlockers;
    if (currentUser.role === 'employee') {
      userBlockers = allBlockers.filter(task => task.createdBy === currentUser.id);
    }

    const now = new Date();
    const getDaysUntilDeadline = (deadline: Date) => {
      return Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    };

    const getBlockerAge = (createdAt: Date) => {
      const diffInHours = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
      return diffInHours < 24 ? Math.floor(diffInHours) : Math.floor(diffInHours / 24);
    };

    // Categorize blockers
    const urgentBlockers = userBlockers.filter(task => {
      const days = getDaysUntilDeadline(task.deadline);
      return days <= 1 && days >= 0;
    });

    const overdueBlockers = userBlockers.filter(task => {
      const days = getDaysUntilDeadline(task.deadline);
      return days < 0;
    });

    const longTermBlockers = userBlockers.filter(task => {
      const age = getBlockerAge(task.createdAt);
      return age > 7;
    });

    // Priority breakdown
    const priorityBreakdown = userBlockers.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Department breakdown (for admins/managers)
    const departmentBreakdown = isAdmin || isManager ? 
      userBlockers.reduce((acc, task) => {
        acc[task.department] = (acc[task.department] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) : {};

    // Age distribution
    const ageDistribution = userBlockers.reduce((acc, task) => {
      const age = getBlockerAge(task.createdAt);
      if (age <= 1) acc['0-1d']++;
      else if (age <= 3) acc['1-3d']++;
      else if (age <= 7) acc['3-7d']++;
      else acc['7d+']++;
      return acc;
    }, { '0-1d': 0, '1-3d': 0, '3-7d': 0, '7d+': 0 });

    // Average resolution time
    const averageResolutionTime = userBlockers.length > 0 ? 
      Math.round(userBlockers.reduce((sum, task) => sum + getBlockerAge(task.createdAt), 0) / userBlockers.length) : 0;

    return {
      total: userBlockers.length,
      urgent: urgentBlockers.length,
      overdue: overdueBlockers.length,
      longTerm: longTermBlockers.length,
      priorityBreakdown,
      departmentBreakdown,
      ageDistribution,
      averageResolutionTime,
      mainTasks: userBlockers.filter(task => !task.parentId).length,
      subtasks: userBlockers.filter(task => task.parentId).length
    };
  }, [tasks, selectedDepartment, isAdmin, isManager, currentUser]);
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-gray-100 sm:text-3xl sm:truncate">
            {isAdmin ? 'Company Reports' : 'Department Reports'}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
            {isAdmin ? 'Organization-wide analytics and insights' : <>Comprehensive analytics and insights for {currentUser.department} department</>}
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <ExportOptions 
            tasks={tasks} 
            onExport={handleExport} 
          />
        </div>
      </div>
      <div className="card mb-6">
        <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 sm:px-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
              Report Settings
            </h3>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-y-4 sm:grid-cols-3 sm:gap-x-6">
            <div>
              <TimeframeSelector value={timeframe} onChange={value => setTimeframe(value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Date Range</label>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <input type="date" className="block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#2e9d74] focus:border-[#2e9d74] sm:text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                <input type="date" className="block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#2e9d74] focus:border-[#2e9d74] sm:text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">Used for exports and future filters.</p>
            </div>
            {isAdmin && (
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-200">Department</label>
                <select id="department" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-[#2e9d74] focus:border-[#2e9d74] sm:text-sm rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)}>
                  <option value="all">All Departments</option>
                  {departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Report Type
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <button type="button" onClick={() => setReportType('overview')} className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium ${reportType === 'overview' ? 'text-[#2e9d74] z-10 border-[#2e9d74]' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  <BarChart2Icon className="h-5 w-5 mr-2" />
                  Overview
                </button>
                <button type="button" onClick={() => setReportType('team')} className={`relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium ${reportType === 'team' ? 'text-[#2e9d74] z-10 border-[#2e9d74]' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  <UsersIcon className="h-5 w-5 mr-2" />
                  Team
                </button>
                <button type="button" onClick={() => setReportType('trends')} className={`relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium ${reportType === 'trends' ? 'text-[#2e9d74] z-10 border-[#2e9d74]' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  <TrendingUpIcon className="h-5 w-5 mr-2" />
                  Trends
                </button>
                <button type="button" onClick={() => setReportType('blockers')} className={`relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium ${reportType === 'blockers' ? 'text-[#2e9d74] z-10 border-[#2e9d74]' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  <AlertCircleIcon className="h-5 w-5 mr-2" />
                  Blockers
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 py-5 sm:p-6">
          {reportType === 'overview' && <TaskStats department={isAdmin ? (selectedDepartment === 'all' ? undefined : selectedDepartment) : currentUser.department} timeframe={timeframe} />}
          {reportType === 'team' && <TeamPerformance department={isAdmin ? (selectedDepartment === 'all' ? undefined : selectedDepartment) : currentUser.department} timeframe={timeframe} />}
          {reportType === 'blockers' && (
            <div className="space-y-6">
              {/* Blocker Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                        <AlertCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Blockers</p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{blockerAnalytics.total}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                        <ClockIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Urgent Blockers</p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{blockerAnalytics.urgent}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                        <AlertCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Overdue Blockers</p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{blockerAnalytics.overdue}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                        <ClockIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Resolution</p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{blockerAnalytics.averageResolutionTime}d</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Priority and Department Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Priority Breakdown */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Priority Breakdown</h3>
                  <div className="space-y-3">
                    {Object.entries(blockerAnalytics.priorityBreakdown).map(([priority, count]) => (
                      <div key={priority} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            priority === 'high' ? 'bg-red-500' :
                            priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}></div>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">{priority}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Department Breakdown (for admins/managers) */}
                {(isAdmin || isManager) && Object.keys(blockerAnalytics.departmentBreakdown).length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Department Breakdown</h3>
                    <div className="space-y-3">
                      {Object.entries(blockerAnalytics.departmentBreakdown).map(([department, count]) => (
                        <div key={department} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{department}</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Task Type Breakdown */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Task Type Breakdown</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Main Tasks</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{blockerAnalytics.mainTasks}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Subtasks</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{blockerAnalytics.subtasks}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Age Distribution Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Blocker Age Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={Object.entries(blockerAnalytics.ageDistribution).map(([range, count]) => ({
                      name: range,
                      value: count,
                      color: range === '7d+' ? '#EF4444' : range === '3-7d' ? '#F59E0B' : '#10B981'
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#EF4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
          {reportType === 'trends' && (
            <div className="space-y-8">
              <div className="card">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">Created vs Completed</h3>
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
                <div className="card">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">Created Tasks</h3>
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
                <div className="card">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">Completed Tasks</h3>
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