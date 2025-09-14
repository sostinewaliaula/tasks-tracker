import { useState } from 'react';
import { BellIcon, LogOutIcon } from 'lucide-react';
import { useTask } from '../../context/TaskContext';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../components/auth/RBAC';
import { NotificationDropdown } from '../notifications/NotificationDropdown';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../assets/logo.png';

export function Header() {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { notifications } = useTask();
  const { logout, currentUser } = useAuth();
  const { isAdmin, isManager } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <img src={logo} alt="Caava Group" className="h-8 w-auto" />
            </div>
            <nav className="ml-6 flex space-x-8">
              {/* Dashboard - based on role */}
              <button
                onClick={() => {
                  setIsNotificationsOpen(false);
                  navigate(isManager ? '/manager/dashboard' : '/dashboard');
                }}
                className={`${
                  location.pathname.includes('dashboard')
                    ? 'border-[#2e9d74] text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Dashboard
              </button>

              {/* Tasks - available to all */}
              <button
                onClick={() => {
                  setIsNotificationsOpen(false);
                  navigate('/tasks');
                }}
                className={`${
                  location.pathname === '/tasks'
                    ? 'border-[#2e9d74] text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Tasks
              </button>

              {/* Reports - managers and admins only */}
              {(isManager || isAdmin) && (
                <button
                  onClick={() => {
                    setIsNotificationsOpen(false);
                    navigate('/reports');
                  }}
                  className={`${
                    location.pathname === '/reports'
                      ? 'border-[#2e9d74] text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Reports
                </button>
              )}

              {/* Users - admin only */}
              {isAdmin && (
                <button
                  onClick={() => {
                    setIsNotificationsOpen(false);
                    navigate('/users');
                  }}
                  className={`${
                    location.pathname === '/users'
                      ? 'border-[#2e9d74] text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Users
                </button>
              )}

              {/* Departments - managers and admins only */}
              {(isManager || isAdmin) && (
                <button
                  onClick={() => {
                    setIsNotificationsOpen(false);
                    navigate('/departments');
                  }}
                  className={`${
                    location.pathname === '/departments'
                      ? 'border-[#2e9d74] text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Departments
                </button>
              )}

              {/* Settings - admin only */}
              {isAdmin && (
                <button
                  onClick={() => {
                    setIsNotificationsOpen(false);
                    navigate('/settings');
                  }}
                  className={`${
                    location.pathname === '/settings'
                      ? 'border-[#2e9d74] text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Settings
                </button>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 rounded-full hover:bg-gray-100 relative"
              >
                <BellIcon className="h-6 w-6 text-gray-500" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              {isNotificationsOpen && (
                <NotificationDropdown 
                  onClose={() => setIsNotificationsOpen(false)} 
                  onViewAll={() => {
                    setIsNotificationsOpen(false);
                    navigate('/notifications');
                  }} 
                />
              )}
            </div>

            {/* Profile/Logout */}
            <div className="flex items-center space-x-3">
              <div className="text-sm">
                <p className="font-medium text-gray-700">{currentUser?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{currentUser?.role}</p>
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <LogOutIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}