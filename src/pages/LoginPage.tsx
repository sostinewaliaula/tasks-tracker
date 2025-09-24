import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LockIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
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
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-green-100'
    }`}>
      {/* Main Login Container */}
      <div className="w-full max-w-3xl">
        <div className={`rounded-2xl shadow-2xl overflow-hidden ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex">
            {/* Left Panel - Illustration */}
            <div className={`hidden lg:flex lg:w-1/2 p-4 items-center justify-center ${
              darkMode 
                ? 'bg-gradient-to-br from-gray-700 to-gray-600' 
                : 'bg-gradient-to-br from-blue-50 to-green-50'
            }`}>
              <div className="relative w-full h-full max-w-xs">
                {/* Isometric Illustration */}
                <div className="relative">
                  {/* Large Laptop */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-32 h-24 bg-blue-200 rounded-lg shadow-lg relative">
                      {/* Laptop Screen */}
                      <div className="absolute inset-2 bg-white rounded border-2 border-blue-300 flex items-center justify-center">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                          <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                            <LockIcon className="w-2 h-2 text-white" />
                          </div>
                        </div>
                      </div>
                      {/* Laptop Base */}
                      <div className="absolute -bottom-2 left-0 right-0 h-4 bg-blue-300 rounded-b-lg"></div>
                    </div>
                  </div>

                  {/* Person on Laptop */}
                  <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
                    <div className="w-8 h-8 bg-green-500 rounded-full"></div>
                    <div className="w-6 h-4 bg-green-400 rounded-t-lg mt-1"></div>
                  </div>

                  {/* Person at Bottom */}
                  <div className="absolute bottom-8 left-8">
                    <div className="w-8 h-8 bg-green-500 rounded-full"></div>
                    <div className="w-6 h-4 bg-blue-500 rounded-t-lg mt-1"></div>
                  </div>

                  {/* Server Racks */}
                  <div className="absolute top-16 right-8 space-y-2">
                    <div className="w-6 h-8 bg-blue-200 rounded"></div>
                    <div className="w-6 h-8 bg-blue-200 rounded"></div>
                    <div className="w-6 h-8 bg-blue-200 rounded"></div>
                  </div>

                  {/* Cloud Icon */}
                  <div className="absolute top-4 left-4">
                    <div className="w-8 h-6 bg-white rounded-full shadow-md flex items-center justify-center">
                      <div className="w-4 h-4 bg-blue-200 rounded-full"></div>
                    </div>
                  </div>

                  {/* Gears */}
                  <div className="absolute bottom-16 right-4 space-y-1">
                    <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  </div>

                  {/* Security Icons */}
                  <div className="absolute top-20 right-16">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <LockIcon className="w-3 h-3 text-white" />
                    </div>
                  </div>

                  {/* Data Cubes */}
                  <div className="absolute top-32 left-16 space-y-1">
                    <div className="w-2 h-2 bg-green-400 rounded"></div>
                    <div className="w-2 h-2 bg-green-400 rounded"></div>
                    <div className="w-2 h-2 bg-green-400 rounded"></div>
                  </div>

                  {/* Bar Charts */}
                  <div className="absolute bottom-20 left-12 space-x-1 flex items-end">
                    <div className="w-2 h-4 bg-green-400 rounded-t"></div>
                    <div className="w-2 h-6 bg-yellow-400 rounded-t"></div>
                    <div className="w-2 h-3 bg-blue-400 rounded-t"></div>
                  </div>

                  {/* Connection Lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <line x1="50%" y1="30%" x2="60%" y2="40%" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2" />
                    <line x1="70%" y1="50%" x2="80%" y2="60%" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2" />
                    <line x1="40%" y1="70%" x2="50%" y2="80%" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className={`w-full lg:w-1/2 p-5 ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              {/* Header */}
              <div className="text-center mb-3">
                <div className="flex items-center justify-center mb-2">
                  <img src={logo} alt="Caava Group" className="h-8 w-auto" />
                </div>
                <h1 className={`text-sm font-semibold mb-1 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Tasks Tracker</h1>
                <h2 className="text-sm font-bold text-green-500">Login</h2>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-2">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className={`block text-xs font-medium mb-1 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-sm ${
                        darkMode 
                          ? 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400' 
                          : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="admin@turnkeyafrica.com"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className={`block text-xs font-medium mb-1 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LockIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`block w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-sm ${
                        darkMode 
                          ? 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400' 
                          : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOffIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>


                {/* Error Message */}
                {error && (
                  <div className={`border rounded-lg p-4 ${
                    darkMode 
                      ? 'bg-red-900/30 border-red-800' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <p className={`text-sm ${
                      darkMode ? 'text-red-300' : 'text-red-600'
                    }`}>{error}</p>
                  </div>
                )}

                {/* Login Button */}
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-500 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:from-green-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Log in'
                  )}
                </button>
              </form>

              {/* LDAP Information */}
              <div className={`mt-3 rounded-lg p-2 space-y-1 ${
                darkMode ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <p className={`text-xs font-medium text-center ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>LDAP Authentication</p>
                <div className={`text-xs ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <p className="text-center">
                    Use your LDAP credentials to sign in.
                  </p>
                </div>
              </div>

              {/* Dark Mode Toggle */}
              <div className="absolute top-6 right-6">
                <button
                  onClick={toggleDarkMode}
                  className={`p-2 rounded-full transition-colors duration-200 ${
                    darkMode 
                      ? 'hover:bg-gray-700' 
                      : 'hover:bg-gray-100'
                  }`}
                  aria-label="Toggle dark mode"
                >
                  {darkMode ? (
                    <svg className="h-5 w-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.07l-.71.71M21 12h-1M4 12H3m16.66 5.66l-.71-.71M4.05 4.93l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}