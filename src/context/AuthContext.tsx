import React, { useState, createContext, useContext } from 'react';
type User = {
  id: string;
  name: string;
  role: 'employee' | 'manager' | 'superadmin';
  department: string;
  email: string;
};
type AuthContextType = {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
};
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function AuthProvider({
  children
}: {
  children: ReactNode;
}) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const login = async (email: string, password: string) => {
    // Mock users to simulate authentication until LDAP is configured
    const mockUsers: Record<string, User & { password: string }> = {
      'admin@caava.com': {
        id: '0',
        name: 'Super Admin',
        role: 'superadmin',
        department: 'All',
        email: 'admin@caava.com',
        password: 'password'
      },
      'employee@caava.com': {
        id: '1',
        name: 'Alex Johnson',
        role: 'employee',
        department: 'Marketing',
        email: 'employee@caava.com',
        password: 'password'
      },
      'manager@caava.com': {
        id: '2',
        name: 'Sam Williams',
        role: 'manager',
        department: 'Marketing',
        email: 'manager@caava.com',
        password: 'password'
      }
    };
    const user = mockUsers[email];
    if (!user || user.password !== password) {
      throw new Error('Invalid credentials');
    }
    const { password: _omit, ...sanitized } = user;
    setCurrentUser(sanitized);
  };
  const logout = () => {
    setCurrentUser(null);
  };
  return <AuthContext.Provider value={{
    currentUser,
    login,
    logout,
    isAuthenticated: !!currentUser
  }}>
      {children}
    </AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}