import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserIcon, LockIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import logo from '../assets/logo.png';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../context/DarkModeContext';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useDarkMode();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const result = await login(username, password);
      
      // Navigate based on user role from the login result
      switch(result?.role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'manager':
          navigate('/manager/dashboard');
          break;
        default:
          navigate('/dashboard');
      }
    } catch (err) {
      setError('Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2e9d74] via-[#4a9d74] to-[#8c52ff] dark:from-[#0f172a] dark:via-[#0b1220] dark:to-[#111827] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20 dark:opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>
      
      <div className="relative max-w-md w-full space-y-8">
        {/* Login Card */}
        <div className="card p-8 space-y-6">
          {/* Dark mode toggle */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.07l-.71.71M21 12h-1M4 12H3m16.66 5.66l-.71-.71M4.05 4.93l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" /></svg>
              )}
            </button>
          </div>
          {/* Logo and Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <img src={logo} alt="Caava Group" className="h-16 w-auto" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Welcome Back
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Sign in to your Tasks Tracker account
              </p>
            </div>
          </div>

          {/* Login Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Username Field */}
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400 group-focus-within:text-[#2e9d74] transition-colors" />
                </div>
                <input 
                  id="username" 
                  name="username" 
                  type="text" 
                  autoComplete="username" 
                  required 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2e9d74] focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-900" 
                  placeholder="Enter your LDAP username" 
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockIcon className="h-5 w-5 text-gray-400 group-focus-within:text-[#2e9d74] transition-colors" />
                </div>
                <input 
                  id="password" 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  autoComplete="current-password" 
                  required 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2e9d74] focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-900" 
                  placeholder="Enter your password" 
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-red-600 dark:text-red-300 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Sign In Button */}
            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-[#2e9d74] to-[#8c52ff] text-white py-3 px-4 rounded-lg font-medium hover:from-[#258a5f] hover:to-[#7a47e6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2e9d74] transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
            >
              Sign In
            </button>
          </form>

          {/* LDAP Information */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-200 text-center">LDAP Authentication</p>
            <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
              <p className="text-center">
                Use your LDAP credentials to sign in.
              </p>
              <p className="text-center text-gray-500">
                Contact your IT administrator if you need assistance.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-white/80 dark:text-gray-300 text-sm">
            © 2024 Caava Group. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}