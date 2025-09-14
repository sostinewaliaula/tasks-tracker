import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface RBACProps {
  children: React.ReactNode;
  allowedRoles: ('admin' | 'manager' | 'employee')[];
}

export function RBAC({ children, allowedRoles }: RBACProps) {
  const { currentUser, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

export function withRBAC(WrappedComponent: React.ComponentType, allowedRoles: ('admin' | 'manager' | 'employee')[]) {
  return function WithRBACWrapper(props: any) {
    return (
      <RBAC allowedRoles={allowedRoles}>
        <WrappedComponent {...props} />
      </RBAC>
    );
  };
}

// Hook for checking permissions in components
export function usePermissions() {
  const { currentUser } = useAuth();

  return {
    isAdmin: currentUser?.role === 'admin',
    isManager: currentUser?.role === 'manager',
    isEmployee: currentUser?.role === 'employee',
    canViewAllUsers: ['admin'].includes(currentUser?.role || ''),
    canManageDepartment: ['admin', 'manager'].includes(currentUser?.role || ''),
    canViewReports: ['admin', 'manager'].includes(currentUser?.role || ''),
    canCreateTasks: ['admin', 'manager', 'employee'].includes(currentUser?.role || ''),
  };
}