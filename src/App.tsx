import React, { useState } from 'react';
import { TaskProvider } from './context/TaskContext';
import { AuthProvider } from './context/AuthContext';
import { EmployeeDashboard } from './pages/EmployeeDashboard';
import { ManagerDashboard } from './pages/ManagerDashboard';
import { TasksPage } from './pages/TasksPage';
import { ReportsPage } from './pages/ReportsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { UsersPage } from './pages/UsersPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { LoginPage } from './pages/LoginPage';
import { SystemSettingsPage } from './pages/SystemSettingsPage';
import { Header } from './components/layout/Header';
export function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'tasks' | 'reports' | 'notifications' | 'users' | 'departments' | 'settings'>('dashboard');
  const handleLogin = (role: string) => {
    setIsLoggedIn(true);
    setUserRole(role);
  };
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole('');
    setCurrentPage('dashboard');
  };
  const handleNavigation = (page: 'dashboard' | 'tasks' | 'reports' | 'notifications' | 'users' | 'departments' | 'settings') => {
    setCurrentPage(page);
  };
  return <AuthProvider>
      <TaskProvider>
        <div className="flex flex-col min-h-screen bg-[#e8f5f0]">
          {isLoggedIn && <Header userRole={userRole} onLogout={handleLogout} currentPage={currentPage} onNavigate={handleNavigation} />}
          <main className="flex-1">
            {!isLoggedIn ? <LoginPage onLogin={handleLogin} /> :
            currentPage === 'dashboard' ? (userRole === 'employee' ? <EmployeeDashboard /> : <ManagerDashboard />) :
            currentPage === 'tasks' ? <TasksPage /> :
            currentPage === 'reports' ? <ReportsPage /> :
            currentPage === 'notifications' ? <NotificationsPage /> :
            currentPage === 'users' ? <UsersPage /> :
            currentPage === 'departments' ? <DepartmentsPage /> :
            <SystemSettingsPage />}
          </main>
        </div>
      </TaskProvider>
    </AuthProvider>;
}