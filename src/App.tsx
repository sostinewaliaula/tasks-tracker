import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { Header } from './components/layout/Header';
import { RBAC } from './components/auth/RBAC';
import { useAuth } from './context/AuthContext';
import { DarkModeProvider } from './context/DarkModeContext';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  
  return (
    <div className="flex flex-col min-h-screen bg-[#e8f5f0] dark:bg-[var(--color-bg-dark)]">
      {isAuthenticated && location.pathname !== '/login' && <Header />}
      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Protected Routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Employee Routes */}
          <Route
            path="/dashboard"
            element={
              <RBAC allowedRoles={['employee', 'manager', 'admin']}>
                <EmployeeDashboard />
              </RBAC>
            }
          />
          <Route
            path="/tasks"
            element={
              <RBAC allowedRoles={['employee', 'manager', 'admin']}>
                <TasksPage />
              </RBAC>
            }
          />
          
          {/* Manager Routes */}
          <Route
            path="/manager/dashboard"
            element={
              <RBAC allowedRoles={['manager', 'admin']}>
                <ManagerDashboard />
              </RBAC>
            }
          />
          <Route
            path="/departments"
            element={
              <RBAC allowedRoles={['manager', 'admin']}>
                <DepartmentsPage />
              </RBAC>
            }
          />
          <Route
            path="/reports"
            element={
              <RBAC allowedRoles={['manager', 'admin']}>
                <ReportsPage />
              </RBAC>
            }
          />
          
          {/* Admin Routes */}
          <Route
            path="/settings"
            element={
              <RBAC allowedRoles={['admin']}>
                <SystemSettingsPage />
              </RBAC>
            }
          />
          <Route
            path="/users"
            element={
              <RBAC allowedRoles={['admin']}>
                <UsersPage />
              </RBAC>
            }
          />

          {/* Notifications - Available to all authenticated users */}
          <Route
            path="/notifications"
            element={
              <RBAC allowedRoles={['employee', 'manager', 'admin']}>
                <NotificationsPage />
              </RBAC>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export function App() {
  return (
    <DarkModeProvider>
      <AuthProvider>
        <TaskProvider>
          <AppContent />
        </TaskProvider>
      </AuthProvider>
    </DarkModeProvider>
  );
}