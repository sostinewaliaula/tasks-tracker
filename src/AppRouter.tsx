import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RBAC } from "./components/auth/RBAC";
import { LoginPage } from "./pages/LoginPage";
import { UnauthorizedPage } from "./pages/UnauthorizedPage";
import { EmployeeDashboard } from "./pages/EmployeeDashboard";
import { ManagerDashboard } from "./pages/ManagerDashboard";
import { SystemSettingsPage } from "./pages/SystemSettingsPage";
import { UsersPage } from "./pages/UsersPage";
import { DepartmentsPage } from "./pages/DepartmentsPage";
import { TasksPage } from "./pages/TasksPage";
import { ReportsPage } from "./pages/ReportsPage";

export function AppRouter() {
  return (
    <BrowserRouter>
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
      </Routes>
    </BrowserRouter>
  );
}