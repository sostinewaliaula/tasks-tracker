import { useEffect, useRef, useState } from 'react';
import { BellIcon, LogOutIcon, UserIcon } from 'lucide-react';
import { useTask } from '../../context/TaskContext';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../components/auth/RBAC';
import { NotificationDropdown } from '../notifications/NotificationDropdown';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../assets/logo.png';
import { useDarkMode } from '../../context/DarkModeContext';

export function Header() {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { notifications } = useTask();
  const { logout, currentUser } = useAuth();
  const { isAdmin, isManager } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const unreadCount = notifications.filter(n => !n.read).length;
  const { darkMode, toggleDarkMode } = useDarkMode();
  const formatDisplayName = (name?: string) => {
    if (!name) return '';
    const cleaned = name.replace(/[._]+/g, ' ').trim();
    return cleaned
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };
  const rawName = currentUser?.name 
    || (currentUser as any)?.email?.split('@')[0]
    || (currentUser as any)?.ldap_uid
    || '';
  const displayName = formatDisplayName(rawName);
  const formatRole = (role?: string) => role === 'employee' ? 'User' : (role ? formatDisplayName(role) : '');

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-[#2e9d74] to-[#8c52ff] rounded-lg flex items-center justify-center">
                  <img src={logo} alt="Caava Group" className="h-6 w-6" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-[#2e9d74] to-[#8c52ff] bg-clip-text text-transparent">
                  Tasks Tracker
                </span>
              </div>
            </div>
            <nav className="ml-8 flex space-x-1">
              {/* Dashboard - based on role */}
              <button
                onClick={() => {
                  setIsNotificationsOpen(false);
                  navigate(isManager ? '/manager/dashboard' : '/dashboard');
                }}
                className={`${
                  location.pathname.includes('dashboard')
                    ? 'bg-gradient-to-r from-[#2e9d74] to-[#4ade80] text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                } inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200`}
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
                    ? 'bg-gradient-to-r from-[#2e9d74] to-[#4ade80] text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                } inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200`}
              >
                Tasks
              </button>

              {/* My Reports - available to all */}
              <button
                onClick={() => {
                  setIsNotificationsOpen(false);
                  navigate('/my-reports');
                }}
                className={`${
                  location.pathname === '/my-reports'
                    ? 'bg-gradient-to-r from-[#2e9d74] to-[#4ade80] text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                } inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200`}
              >
                My Reports
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
                      ? 'bg-gradient-to-r from-[#2e9d74] to-[#4ade80] text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                  } inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200`}
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
                      ? 'bg-gradient-to-r from-[#2e9d74] to-[#4ade80] text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                  } inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200`}
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
                      ? 'bg-gradient-to-r from-[#2e9d74] to-[#4ade80] text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                  } inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200`}
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
                      ? 'bg-gradient-to-r from-[#2e9d74] to-[#4ade80] text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                  } inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200`}
                >
                  Settings
                </button>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
              >
                <BellIcon className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
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

            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <div className="w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.07l-.71.71M21 12h-1M4 12H3m16.66 5.66l-.71-.71M4.05 4.93l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
              ) : (
                <div className="w-5 h-5 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" /></svg>
                </div>
              )}
            </button>
            {/* Profile menu */}
            <ProfileMenu
              name={displayName}
              roleLabel={formatRole(currentUser?.role)}
              onLogout={() => { logout(); navigate('/login'); }}
              onProfile={() => navigate('/profile')}
              onSettings={() => navigate('/settings')}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

function ProfileMenu({ name, roleLabel, onLogout, onProfile, onSettings }: { name: string; roleLabel: string; onLogout: () => void; onProfile: () => void; onSettings: () => void; }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => setOpen(v => !v)} 
        className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
      >
        <div className="text-left hidden sm:block">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 leading-tight group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors duration-200">{name || 'User'}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{roleLabel}</p>
        </div>
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#2e9d74] to-[#8c52ff] flex items-center justify-center shadow-sm">
          <UserIcon className="h-4 w-4 text-white" />
        </div>
        <svg className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-[#2e9d74]/5 to-[#8c52ff]/5">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{name || 'User'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{roleLabel}</p>
          </div>
          <div className="py-2">
            <button 
              onClick={() => { setOpen(false); onProfile(); }} 
              className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 flex items-center group"
            >
              <UserIcon className="h-4 w-4 mr-3 text-gray-400 group-hover:text-[#2e9d74] transition-colors duration-200" />
              Profile
            </button>
            <button 
              onClick={() => { setOpen(false); onSettings(); }} 
              className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 flex items-center group"
            >
              <svg className="h-4 w-4 mr-3 text-gray-400 group-hover:text-[#2e9d74] transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
            <div className="border-t border-gray-200/50 dark:border-gray-700/50 my-1"></div>
            <button 
              onClick={() => { setOpen(false); onLogout(); }} 
              className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 flex items-center group"
            >
              <LogOutIcon className="h-4 w-4 mr-3 group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors duration-200" /> 
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}