import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTask, Task } from '../context/TaskContext';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { UserExportButton } from '../components/reports/UserExportButton';

export function UserReportsPage() {
  const { currentUser } = useAuth();
  const { tasks } = useTask();
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('week');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const userTasks: Task[] = useMemo(() => {
    if (!currentUser) return [] as Task[];
    const raw = tasks.filter(t => String(t.createdBy) === String(currentUser.id));
    if (!dateFrom && !dateTo) return raw;
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;
    if (from) from.setHours(0,0,0,0);
    if (to) to.setHours(23,59,59,999);
    return raw.filter(t => {
      const created = new Date(t.createdAt);
      const withinFrom = from ? created >= from : true;
      const withinTo = to ? created <= to : true;
      return withinFrom && withinTo;
    });
  }, [tasks, currentUser, dateFrom, dateTo]);

  const kpis = useMemo(() => {
    const total = userTasks.length;
    const completed = userTasks.filter(t => t.status === 'completed').length;
    const overdue = userTasks.filter(t => t.status !== 'completed' && new Date(t.deadline).getTime() < Date.now()).length;
    const carried = userTasks.filter(t => t.isCarriedOver).length;
    return { total, completed, overdue, carried, completionRate: total ? Math.round((completed / total) * 100) : 0 };
  }, [userTasks]);

  const trendData = useMemo(() => {
    const makeKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
    const now = new Date();
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;
    if (from) from.setHours(0,0,0,0);
    if (to) to.setHours(23,59,59,999);
    if (timeframe === 'week') {
      const start = new Date(now);
      const day = start.getDay();
      const mondayOffset = (day === 0 ? -6 : 1 - day);
      start.setDate(start.getDate() + mondayOffset);
      start.setHours(0,0,0,0);
      const points: { name: string; created: number; completed: number }[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const key = makeKey(d);
        const created = userTasks.filter(t => {
          const c = new Date(t.createdAt);
          if (from && c < from) return false;
          if (to && c > to) return false;
          return makeKey(c) === key;
        }).length;
        const completed = userTasks.filter(t => {
          const d = new Date(t.deadline);
          if (from && d < from) return false;
          if (to && d > to) return false;
          return t.status === 'completed' && makeKey(d) === key;
        }).length;
        points.push({ name: d.toLocaleDateString(undefined, { weekday: 'short' }), created, completed });
      }
      return points;
    }
    // month: aggregate by week number within the current month
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const weekBuckets: Record<string, { name: string; created: number; completed: number } > = {};
    const weekLabel = (d: Date) => `W${Math.ceil((d.getDate() + (new Date(d.getFullYear(), d.getMonth(), 1).getDay() || 7)) / 7)}`;
    for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
      const label = weekLabel(dt);
      weekBuckets[label] ||= { name: label, created: 0, completed: 0 };
    }
    userTasks.forEach(t => {
      const c = new Date(t.createdAt);
      const d = new Date(t.deadline);
      const inFrom = from ? c >= from : true;
      const inTo = to ? c <= to : true;
      if (c.getMonth() === now.getMonth() && inFrom && inTo) weekBuckets[weekLabel(c)].created += 1;
      const inFromD = from ? d >= from : true;
      const inToD = to ? d <= to : true;
      if (t.status === 'completed' && d.getMonth() === now.getMonth() && inFromD && inToD) weekBuckets[weekLabel(d)].completed += 1;
    });
    return Object.values(weekBuckets);
  }, [userTasks, timeframe, dateFrom, dateTo]);

  const priorityData = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 } as Record<'high'|'medium'|'low', number>;
    userTasks.forEach(t => { counts[t.priority] += 1; });
    return [
      { name: 'High', value: counts.high, color: '#ef4444' },
      { name: 'Medium', value: counts.medium, color: '#f59e0b' },
      { name: 'Low', value: counts.low, color: '#10b981' },
    ];
  }, [userTasks]);

  const statusData = useMemo(() => {
    const counts = { todo: 0, inprogress: 0, completed: 0 } as Record<'todo'|'inprogress'|'completed', number>;
    userTasks.forEach(t => {
      if (t.status === 'in-progress') counts.inprogress += 1; else counts[t.status] += 1 as any;
    });
    return [
      { name: 'To Do', value: counts.todo },
      { name: 'In Progress', value: counts.inprogress },
      { name: 'Completed', value: counts.completed },
    ];
  }, [userTasks]);

  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div className="md:flex md:items-center md:justify-between mb-6">
      <div className="flex-1 min-w-0">
        <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-gray-100 sm:text-3xl sm:truncate">My Reports</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">Personal analytics and insights</p>
      </div>
      <div className="mt-4 flex md:mt-0 md:ml-4 items-center space-x-3">
        <div className="hidden sm:block">
          <label className="mr-2 text-sm text-gray-600 dark:text-gray-300">Timeframe</label>
          <select value={timeframe} onChange={e => setTimeframe(e.target.value as any)} className="border border-gray-300 dark:border-gray-700 rounded-md py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <option value="week">This week</option>
            <option value="month">This month</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-gray-300 dark:border-gray-700 rounded-md py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
          <span className="text-gray-500 dark:text-gray-300">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border border-gray-300 dark:border-gray-700 rounded-md py-2 px-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="ml-1 text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">Reset</button>
          )}
        </div>
        <UserExportButton
          tasks={userTasks.map(t => ({ id: t.id, title: t.title, status: t.status, priority: t.priority, deadline: t.deadline, createdAt: t.createdAt, isCarriedOver: t.isCarriedOver }))}
          filenameBase={`my-reports-${new Date().toISOString().slice(0,10)}`}
        />
      </div>
    </div>

    <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-6">
      <div className="card"><div className="px-4 py-5 sm:p-6"><p className="text-sm text-gray-500">Total Tasks</p><p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">{kpis.total}</p></div></div>
      <div className="card"><div className="px-4 py-5 sm:p-6"><p className="text-sm text-gray-500">Completed</p><p className="mt-1 text-2xl font-semibold text-green-600">{kpis.completed}</p></div></div>
      <div className="card"><div className="px-4 py-5 sm:p-6"><p className="text-sm text-gray-500">Overdue</p><p className="mt-1 text-2xl font-semibold text-red-600">{kpis.overdue}</p></div></div>
      <div className="card"><div className="px-4 py-5 sm:p-6"><p className="text-sm text-gray-500">Carried Over</p><p className="mt-1 text-2xl font-semibold text-purple-600">{kpis.carried}</p></div></div>
    </div>

    <div className="card mb-6">
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
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">By Priority</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={priorityData} dataKey="value" nameKey="name" outerRadius={90} label>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">By Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#2e9d74" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  </div>;
}


