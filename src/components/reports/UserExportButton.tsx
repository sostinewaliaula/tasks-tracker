import { useState, useRef, useEffect } from 'react';
import { DownloadIcon, ChevronDownIcon, CalendarIcon, FilterIcon } from 'lucide-react';
import logoUrl from '../../assets/logo.png';
import { jsPDF } from 'jspdf';

export type ExportableTask = {
  title: string;
  status: string;
  priority: string;
  deadline: Date;
  createdAt: Date;
  isCarriedOver?: boolean;
  parentId?: string | null;
  parentTitle?: string | null;
  isSubtask?: boolean;
  department?: string;
  description?: string;
};

function toCsv(tasks: ExportableTask[]): string {
  const headers = ['Title','Status','Deadline','Overdue','Carried Over'];
  const rows = tasks.map(t => [
    (t.isSubtask ? '- ' : '') + t.title.replace(/\n/g, ' '),
    t.status,
    new Date(t.deadline).toISOString(),
    new Date(t.deadline).getTime() < Date.now() && t.status !== 'completed' ? 'Yes' : 'No',
    t.isCarriedOver ? 'Yes' : 'No'
  ]);
  const content = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\r\n');
  return content;
}

function downloadText(filename: string, text: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type AnyTask = ExportableTask & { subtasks?: AnyTask[] };

function flattenWithSubtasks(input: AnyTask[]): ExportableTask[] {
  const out: ExportableTask[] = [];
  input.forEach(t => {
    out.push({ title: t.title, status: t.status, priority: t.priority, deadline: t.deadline, createdAt: t.createdAt, isCarriedOver: t.isCarriedOver, parentId: null, parentTitle: null, isSubtask: false });
    if (Array.isArray(t.subtasks) && t.subtasks.length > 0) {
      t.subtasks.forEach(st => out.push({ title: st.title, status: st.status as any, priority: st.priority as any, deadline: st.deadline as any, createdAt: st.createdAt as any, isCarriedOver: st.isCarriedOver as any, parentId: t as any, parentTitle: t.title, isSubtask: true }));
    }
  });
  return out;
}

export function UserExportButton({ tasks, filenameBase }: { tasks: AnyTask[]; filenameBase: string; }) {
  const [open, setOpen] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['todo', 'in-progress', 'completed', 'blocker']);
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [quickExportDropdown, setQuickExportDropdown] = useState<{
    isOpen: boolean;
    dateType: 'today' | 'week' | 'month' | null;
  }>({ isOpen: false, dateType: null });

  const advancedExportRef = useRef<HTMLDivElement>(null);
  const quickExportRef = useRef<HTMLDivElement>(null);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (advancedExportRef.current && !advancedExportRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
      if (quickExportRef.current && !quickExportRef.current.contains(event.target as Node)) {
        setQuickExportDropdown({ isOpen: false, dateType: null });
      }
    }

    if (open || quickExportDropdown.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, quickExportDropdown.isOpen]);

  const statusOptions = [
    { value: 'todo', label: 'To Do', color: 'bg-gray-100 text-gray-800' },
    { value: 'in-progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'blocker', label: 'Blocked', color: 'bg-red-100 text-red-800' }
  ];

  const handleStatusToggle = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const getDateRange = (type: 'today' | 'week' | 'month' | 'custom') => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (type) {
      case 'today':
        return {
          from: today.toISOString().split('T')[0],
          to: today.toISOString().split('T')[0],
          label: 'Today'
        };
      case 'week':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
        return {
          from: startOfWeek.toISOString().split('T')[0],
          to: endOfWeek.toISOString().split('T')[0],
          label: 'This Week'
        };
      case 'month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
          from: startOfMonth.toISOString().split('T')[0],
          to: endOfMonth.toISOString().split('T')[0],
          label: 'This Month'
        };
      case 'custom':
        return {
          from: customDateFrom,
          to: customDateTo,
          label: customDateFrom && customDateTo ? `${customDateFrom} to ${customDateTo}` : 'Custom Range'
        };
      default:
        return { from: '', to: '', label: 'All Time' };
    }
  };

  const filterTasks = (tasks: AnyTask[], statuses: string[], dateFrom?: string, dateTo?: string) => {
    return tasks.filter(task => {
      const statusMatch = statuses.includes(task.status);
      const dateMatch = !dateFrom || !dateTo || (
        new Date(task.createdAt) >= new Date(dateFrom) &&
        new Date(task.createdAt) <= new Date(dateTo)
      );
      return statusMatch && dateMatch;
    });
  };



  const handleQuickExport = (format: 'csv' | 'json' | 'pdf' | 'word', dateType: 'today' | 'week' | 'month' | 'custom') => {
    const dateRange = getDateRange(dateType);
    
    if (dateType === 'custom' && (!customDateFrom || !customDateTo)) {
      alert('Please select both start and end dates for custom range');
      return;
    }

    const filteredTasks = filterTasks(tasks, selectedStatuses, dateRange.from, dateRange.to);
    const flat = flattenWithSubtasks(filteredTasks);
    const newFilenameBase = `${filenameBase}-${dateRange.label.toLowerCase().replace(/\s+/g, '-')}`;

    if (format === 'csv') {
      const csv = toCsv(flat);
      downloadText(`${newFilenameBase}.csv`, csv, 'text/csv;charset=utf-8');
    } else if (format === 'json') {
    const json = JSON.stringify(flat, null, 2);
      downloadText(`${newFilenameBase}.json`, json, 'application/json;charset=utf-8');
    } else if (format === 'pdf') {
      doPdfWithTasks(flat, newFilenameBase);
    } else if (format === 'word') {
      doWordWithTasks(flat, newFilenameBase);
    }
    
    setOpen(false);
    setQuickExportDropdown({ isOpen: false, dateType: null });
  };

  const loadImage = (url: string) => new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
  const doPdfWithTasks = async (tasksToExport: ExportableTask[], filename: string) => {
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
      const marginX = 40;
      const marginY = 40;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const availableWidth = pageWidth - marginX * 2;
      let y = marginY;
      // Logo
      try {
        const img = await loadImage(logoUrl as unknown as string);
        doc.addImage(img, 'PNG', marginX, y, 140, 45);
      } catch (e) {
        // ignore logo failure
      }
      y += 65;
      doc.setFontSize(16);
      doc.text('My Tasks Report', marginX, y);
      y += 10;
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text(new Date().toLocaleString(), marginX, y);
      doc.setTextColor(0);
      y += 24;

      const headers = ['Title','Status','Deadline','Overdue','Carried Over'];
      const statusW = 100, deadlineW = 120, overdueW = 80, carriedW = 100;
      const titleW = availableWidth - (statusW + deadlineW + overdueW + carriedW);
      const colWidths = [titleW, statusW, deadlineW, overdueW, carriedW];

      const drawHeader = () => {
        const headerHeight = 28;
        // Draw background bar
        doc.setFillColor(46, 157, 116);
        doc.rect(marginX, y, availableWidth, headerHeight, 'F');
        // Header text
        let x = marginX + 8;
        const textY = y + 18; // baseline inside header
        doc.setFontSize(11);
        doc.setTextColor(255);
        headers.forEach((h, i) => {
          doc.text(h, x, textY);
          x += colWidths[i];
        });
        // Move y below header with small padding
        doc.setTextColor(0);
        y += headerHeight + 6;
      };

      drawHeader();

      const lineGap = 4;
      const baseLine = 12;
      doc.setFontSize(10);
      tasksToExport.forEach((t) => {
        // compute wrapped title
        const titleLines = doc.splitTextToSize(t.title || '', titleW - 12);
        const rowHeight = Math.max(baseLine, titleLines.length * (baseLine + lineGap));
        if (y + rowHeight + marginY > pageHeight) {
          doc.addPage('a4', 'portrait');
          y = marginY;
          drawHeader();
        }
        let x = marginX + 8;
        const cells = [
          titleLines,
          String(t.status),
          new Date(t.deadline).toLocaleDateString(),
          new Date(t.deadline).getTime() < Date.now() && t.status !== 'completed' ? 'Yes' : 'No',
          t.isCarriedOver ? 'Yes' : 'No'
        ];
        cells.forEach((val, i) => {
          if (Array.isArray(val)) {
            let ly = y;
            val.forEach((ln, idx) => { 
              const tx = x + (t.isSubtask ? 14 : 0);
              if (t.isSubtask && idx === 0) {
                doc.circle(x + 4, ly - 3, 2, 'F');
              }
              doc.text(String(ln), tx, ly); 
              ly += baseLine + lineGap; 
            });
          } else {
            doc.text(String(val), x, y);
          }
          x += colWidths[i];
        });
        y += rowHeight + 2;
      });
      doc.save(`${filename}.pdf`);
    } catch (e) {
      // Fallback to print if jsPDF is not installed
      const win = window.open('', '_blank');
      if (!win) return;
      const rows = tasksToExport.map(t => `<tr><td>${t.title}</td><td>${t.status}</td><td>${new Date(t.deadline).toLocaleDateString()}</td><td>${new Date(t.deadline).getTime() < Date.now() && t.status !== 'completed' ? 'Yes' : 'No'}</td><td>${t.isCarriedOver ? 'Yes' : 'No'}</td></tr>`).join('');
      win.document.write(`<!doctype html><html><head><title>My Tasks Report</title>
        <style>@page { size: A4 portrait; margin: 20mm; } body{font-family:Arial;padding:24px} table{width:100%;border-collapse:collapse} th,td{border:1px solid #ddd;padding:8px;font-size:12px} th{background:#2e9d74;color:#fff;text-align:left} tr:nth-child(even) { background-color: #f9f9f9; }</style>
      </head><body>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px"><img src="${logoUrl}" style="height:36px"/><h2 style="margin:0">My Tasks Report</h2></div>
        <div style="color:#666;margin-bottom:12px">${new Date().toLocaleString()}</div>
        <table><thead><tr><th>Title</th><th>Status</th><th>Deadline</th><th>Overdue</th><th>Carried Over</th></tr></thead><tbody>${rows}</tbody></table>
      </body></html>`);
      win.document.close();
      win.focus();
      win.print();
    }
  };

  const doWordWithTasks = (tasks: ExportableTask[], filenameBase: string) => {
    // Create HTML content for Word document
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Tasks Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { width: 60px; height: 60px; margin-bottom: 10px; }
          .title { font-size: 24px; font-weight: bold; color: #2e9d74; margin-bottom: 10px; }
          .summary { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .summary-item { margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #2e9d74; color: white; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .status-todo { color: #6c757d; font-weight: bold; }
          .status-in-progress { color: #ffc107; font-weight: bold; }
          .status-completed { color: #28a745; font-weight: bold; }
          .status-blocker { color: #dc3545; font-weight: bold; }
          .priority-high { color: #dc3545; font-weight: bold; }
          .priority-medium { color: #ffc107; font-weight: bold; }
          .priority-low { color: #28a745; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${logoUrl}" alt="Company Logo" class="logo">
          <div class="title">Tasks Report</div>
          <div>Generated on ${new Date().toLocaleDateString()}</div>
        </div>
        
        <div class="summary">
          <div class="summary-item"><strong>Total Tasks:</strong> ${tasks.length}</div>
          <div class="summary-item"><strong>Report Period:</strong> ${filenameBase}</div>
          <div class="summary-item"><strong>Generated By:</strong> Tasks Tracker System</div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Deadline</th>
              <th>Department</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            ${tasks.map(task => `
              <tr>
                <td>${task.title}</td>
                <td><span class="status-${task.status}">${task.status.toUpperCase()}</span></td>
                <td><span class="priority-${task.priority}">${task.priority.toUpperCase()}</span></td>
                <td>${new Date(task.deadline).toLocaleDateString()}</td>
                <td>${task.department || 'N/A'}</td>
                <td>${task.description || 'No description'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    // Create and download the Word document
    const blob = new Blob([htmlContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filenameBase}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center space-x-3">
      {/* Quick Export Dropdown */}
      <div className="relative inline-block text-left" ref={quickExportRef}>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          onClick={() => setQuickExportDropdown({ isOpen: !quickExportDropdown.isOpen, dateType: null })}
        >
          <CalendarIcon className="h-4 w-4 mr-2" />
          Quick Export
          <ChevronDownIcon className="h-4 w-4 ml-2" />
        </button>

        {quickExportDropdown.isOpen && (
          <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-xl shadow-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 z-50">
            <div className="p-4">
              {/* Time Period Selection */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Select Time Period</h3>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setQuickExportDropdown({ isOpen: true, dateType: 'today' })}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      quickExportDropdown.dateType === 'today'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setQuickExportDropdown({ isOpen: true, dateType: 'week' })}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      quickExportDropdown.dateType === 'week'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => setQuickExportDropdown({ isOpen: true, dateType: 'month' })}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      quickExportDropdown.dateType === 'month'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Month
                  </button>
                </div>
              </div>

              {/* Status Filters */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center">
                    <FilterIcon className="h-4 w-4 mr-2" />
                    Filter by Status
                  </h3>
                  <button
                    onClick={() => setSelectedStatuses(statusOptions.map(s => s.value))}
                    className="text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                  >
                    Select All
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {statusOptions.map(status => (
                    <label key={status.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes(status.value)}
                        onChange={() => handleStatusToggle(status.value)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Export Format Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => handleQuickExport('pdf', quickExportDropdown.dateType || 'today')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Export as PDF
                </button>
                <button
                  onClick={() => handleQuickExport('word', quickExportDropdown.dateType || 'today')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Export as Word
                </button>
                <button
                  onClick={() => handleQuickExport('json', quickExportDropdown.dateType || 'today')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Export as JSON
                </button>
                <button
                  onClick={() => handleQuickExport('csv', quickExportDropdown.dateType || 'today')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Export as CSV
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Export Dropdown */}
      <div className="relative inline-block text-left" ref={advancedExportRef}>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-500 to-purple-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          onClick={() => {
            setOpen(!open);
            setQuickExportDropdown({ isOpen: false, dateType: null }); // Close quick export if open
          }}
        >
      <DownloadIcon className="h-5 w-5 mr-2" />
          Advanced Export
      <ChevronDownIcon className="h-5 w-5 ml-2" />
    </button>

    {open && (
          <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-xl shadow-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 z-50">
            <div className="p-4">
              {/* Status Filters */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center">
                    <FilterIcon className="h-4 w-4 mr-2" />
                    Filter by Status
                  </h3>
                  <button
                    onClick={() => setSelectedStatuses(statusOptions.map(s => s.value))}
                    className="text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                  >
                    Select All
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {statusOptions.map(status => (
                    <label key={status.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes(status.value)}
                        onChange={() => handleStatusToggle(status.value)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Custom Date Range */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Custom Date Range</h3>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={customDateFrom}
                    onChange={e => setCustomDateFrom(e.target.value)}
                    className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-green-500 focus:border-green-500"
                    placeholder="From"
                  />
                  <input
                    type="date"
                    value={customDateTo}
                    onChange={e => setCustomDateTo(e.target.value)}
                    className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-green-500 focus:border-green-500"
                    placeholder="To"
                  />
                </div>
              </div>

              {/* Export Format Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => handleQuickExport('pdf', 'custom')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Export as PDF
                </button>
                <button
                  onClick={() => handleQuickExport('word', 'custom')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Export as Word
                </button>
                <button
                  onClick={() => handleQuickExport('json', 'custom')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Export as JSON
                </button>
                <button
                  onClick={() => handleQuickExport('csv', 'custom')}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Export as CSV
                </button>
              </div>
        </div>
      </div>
    )}
      </div>

    </div>
  );
}


