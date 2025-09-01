import React, { useState, createContext, useContext } from 'react';
type User = {
  id: string;
  name: string;
  role: 'employee' | 'manager';
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
    // In a real app, this would be an API call
    // For demo purposes, we'll simulate authentication
    const mockUsers = {
      'employee@caava.com': {
        id: '1',
        name: 'Alex Johnson',
        role: 'employee' as const,
        department: 'Marketing',
        email: 'employee@caava.com'
      },
      'manager@caava.com': {
        id: '2',
        name: 'Sam Williams',
        role: 'manager' as const,
        department: 'Marketing',
        email: 'manager@caava.com'
      }
    };
    if (email in mockUsers && password === 'password') {
      setCurrentUser(mockUsers[email as keyof typeof mockUsers]);
    } else {
      throw new Error('Invalid credentials');
    }
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