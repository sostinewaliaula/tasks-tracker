import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useTask } from '../../context/TaskContext';
import { useAuth } from '../../context/AuthContext';

type TeamPerformanceProps = {
  department?: string; // undefined => all departments
  timeframe: 'week' | 'month' | 'quarter';
  dateFrom?: string;
  dateTo?: string;
};

export function TeamPerformance({ department, timeframe, dateFrom, dateTo }: TeamPerformanceProps) {
  const { tasks } = useTask();
  const { currentUser, token } = useAuth();
  const [teamData, setTeamData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

  // Fetch team performance data
  const fetchTeamData = async () => {
    try {
      setError(null);
      
      // First get the department ID if we have a department name
      let departmentId = null;
      if (department && currentUser?.role === 'manager') {
        const deptRes = await fetch(`${API_URL}/api/departments`, { 
          headers: { 
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          } 
        });
        
        if (deptRes.ok) {
          const deptData = await deptRes.json();
          const deptArray = Array.isArray(deptData.data) ? deptData.data : [deptData.data];
          const foundDept = deptArray.find((d: any) => d.name === department);
          if (foundDept) {
            departmentId = foundDept.id;
          }
        }
      }
      
      // Fetch team performance data
      const url = departmentId ? `${API_URL}/api/departments/${departmentId}/team-performance` : `${API_URL}/api/team-performance`;
      
      // Build query parameters
      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      
      const finalUrl = params.toString() ? `${url}?${params.toString()}` : url;
      
      const res = await fetch(finalUrl, { 
        headers: { 
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        } 
      });
      
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Team performance API error:', errorText);
        throw new Error(`Failed to load team performance: ${res.status} ${errorText}`);
      }
      
      const response = await res.json();
      
      // Handle the response format
      const data = response.data || response;
      setTeamData(data);
      
    } catch (error) {
      console.error('Error fetching team performance:', error);
      setError(error instanceof Error ? error.message : 'Failed to load team performance');
    }
  };

  // Load data when component mounts
  useEffect(() => {
    const loadData = async () => {
      if (currentUser && token) {
        setIsLoading(true);
        try {
          await fetchTeamData();
        } catch (error) {
          console.error('Error loading team data:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentUser, token, department, dateFrom, dateTo]);

  // Use real team data if available, otherwise fallback to context data
  const performanceData = teamData?.teamMembers ? teamData.teamMembers.map((member: any) => ({
    name: member.name,
    completed: member.tasksCompleted,
    onTime: member.onTimeRate,
    efficiency: member.efficiencyScore
  })) : [];

  const trendData = teamData?.dailyActivity ? teamData.dailyActivity.map((day: any) => ({
    name: day.day,
    completed: day.completed,
    created: day.created
  })) : [];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2e9d74] mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-300">Loading team performance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error loading team performance data
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!teamData || !teamData.teamMembers || teamData.teamMembers.length === 0) {
    return (
      <div className="space-y-8">
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 dark:text-gray-300">No team members found for this department.</p>
        </div>
      </div>
    );
  }
  return <div className="space-y-8">
      {/* Team Performance Summary */}
      {teamData?.performanceMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Team Members</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{teamData.performanceMetrics.totalTeamMembers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tasks Completed</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{teamData.performanceMetrics.totalTasksCompleted}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Efficiency</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{teamData.performanceMetrics.averageCompletionRate}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Overdue Tasks</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{teamData.performanceMetrics.totalOverdueTasks}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">
          Team Member Performance
        </h3>
        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData} margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5
              }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" name="Tasks Completed" fill="#2e9d74" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              On-Time Completion Rate
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData} margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5
              }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis unit="%" />
                  <Tooltip formatter={value => [`${value}%`, 'On-Time Rate']} />
                  <Bar dataKey="onTime" name="On-Time %" fill="#8c52ff" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Daily Task Activity
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5
              }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="completed" name="Completed" stroke="#2e9d74" activeDot={{
                  r: 8
                }} />
                  <Line type="monotone" dataKey="created" name="Created" stroke="#8c52ff" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white overflow-hidden shadow-sm rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Team Efficiency Metrics
          </h3>
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team Member
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tasks Completed
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    On-Time Rate
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Efficiency Score
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {performanceData.map((employee, index) => <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {employee.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.completed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.onTime}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-gradient-to-r from-green-500 to-purple-600 h-2.5 rounded-full" style={{
                        width: `${employee.efficiency}%`
                      }}></div>
                        </div>
                        <span className="ml-2 text-sm text-gray-700">
                          {employee.efficiency}%
                        </span>
                      </div>
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>;
}