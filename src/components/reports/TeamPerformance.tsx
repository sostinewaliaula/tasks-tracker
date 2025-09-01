import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
type TeamPerformanceProps = {
  department: string;
  timeframe: 'week' | 'month' | 'quarter';
};
export function TeamPerformance({
  department,
  timeframe
}: TeamPerformanceProps) {
  // Mock data for team performance
  const mockEmployees = [{
    id: '1',
    name: 'Alex Johnson'
  }, {
    id: '2',
    name: 'Jamie Smith'
  }, {
    id: '3',
    name: 'Taylor Wilson'
  }, {
    id: '4',
    name: 'Jordan Brown'
  }];
  const mockPerformanceData = mockEmployees.map(employee => ({
    name: employee.name,
    completed: Math.floor(Math.random() * 15) + 5,
    onTime: Math.floor(Math.random() * 100),
    efficiency: Math.floor(Math.random() * 40) + 60
  }));
  // Mock data for time trends
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const mockTrendData = days.map(day => ({
    name: day,
    completed: Math.floor(Math.random() * 8) + 2,
    created: Math.floor(Math.random() * 10) + 1
  }));
  return <div className="space-y-8">
      <div>
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Team Member Performance
        </h3>
        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockPerformanceData} margin={{
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
                <BarChart data={mockPerformanceData} margin={{
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
                <LineChart data={mockTrendData} margin={{
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
                {mockPerformanceData.map((employee, index) => <tr key={index}>
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
                          <div className="bg-gradient-to-r from-[#2e9d74] to-[#8c52ff] h-2.5 rounded-full" style={{
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