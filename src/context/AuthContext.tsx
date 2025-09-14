import React, { useState, createContext, useContext } from 'react';

type User = {
  id: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  department_id: string;
  email: string;
  ldap_uid: string;
};

type AuthContextType = {
  currentUser: User | null;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));

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

      const { user, token } = await response.json();
      setCurrentUser(user);
      setToken(token);
      localStorage.setItem('auth_token', token);
      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Authentication failed');
    }
  };

  const logout = () => {
      setCurrentUser(null);
      setToken(null);
      localStorage.removeItem('auth_token');
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
          isAuthenticated: !!currentUser
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