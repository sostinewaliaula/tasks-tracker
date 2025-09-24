import React, { useState, createContext, useContext } from 'react';
import { useToast } from '../components/ui/Toast';

type User = {
  id: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  department_id: string;
  department: string;
  email: string;
  ldap_uid: string;
  phone?: string;
  bio?: string;
  language: string;
  timezone: string;
  darkMode: boolean;
  emailNotifications: boolean;
  taskAssigned: boolean;
  taskCompleted: boolean;
  taskOverdue: boolean;
  taskDeadline: boolean;
  weeklyReport: boolean;
  showEmail: boolean;
  showPhone: boolean;
  showBio: boolean;
};

type AuthContextType = {
  currentUser: User | null;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
  token?: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  
  // Optional toast - only use if available
  let showToast: ((message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number) => void) | null = null;
  try {
    const toastContext = useToast();
    showToast = toastContext.showToast;
  } catch (error) {
    // Toast provider not available, continue without toasts
    showToast = null;
  }

  const login = async (username: string, password: string): Promise<User> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const { token } = await response.json();
      setToken(token);
      localStorage.setItem('auth_token', token);

      // Immediately fetch user profile/role from DB-backed endpoint
      const meRes = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!meRes.ok) {
        throw new Error('Failed to load user profile');
      }
      const me = await meRes.json();
      const fetchedUser: User = me.user;
      setCurrentUser(fetchedUser);
      showToast?.('Login successful! Welcome back.', 'success');
      return fetchedUser;
    } catch (error) {
      console.error('Login error:', error);
      showToast?.('Login failed. Please check your credentials.', 'error');
      throw new Error('Authentication failed');
    }
  };

  const logout = () => {
      setCurrentUser(null);
      setToken(null);
      localStorage.removeItem('auth_token');
      showToast?.('Logged out successfully!', 'info');
    };

  const updateUser = (user: User) => {
    setCurrentUser(user);
  };

    // Effect to check token validity on mount and set up interceptor
    React.useEffect(() => {
      if (token) {
        // Verify token and fetch user data
        fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
          .then(res => res.json())
          .then(data => {
            if (data.user) {
              setCurrentUser(data.user);
            } else {
              logout();
            }
          })
          .catch(() => {
            logout();
          });
      }
    }, [token]);

    return (
      <AuthContext.Provider
        value={{
          currentUser,
          login,
          logout,
          updateUser,
          isAuthenticated: !!currentUser,
          token
        }}
      >
        {children}
      </AuthContext.Provider>
    );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}