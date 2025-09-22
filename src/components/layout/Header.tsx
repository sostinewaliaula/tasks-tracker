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
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-sm">
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
                    ? 'border-[#2e9d74] text-gray-900 dark:text-gray-100'
                    : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-100'
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
                    ? 'border-[#2e9d74] text-gray-900 dark:text-gray-100'
                    : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-100'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
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
                    ? 'border-[#2e9d74] text-gray-900 dark:text-gray-100'
                    : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-100'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
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
                      ? 'border-[#2e9d74] text-gray-900 dark:text-gray-100'
                      : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-100'
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
                      ? 'border-[#2e9d74] text-gray-900 dark:text-gray-100'
                      : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-100'
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
                      ? 'border-[#2e9d74] text-gray-900 dark:text-gray-100'
                      : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-100'
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
                      ? 'border-[#2e9d74] text-gray-900 dark:text-gray-100'
                      : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-100'
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
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 relative"
              >
                <BellIcon className="h-6 w-6 text-gray-500 dark:text-gray-300" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 rounded-full h-2 w-2 border-2 border-white dark:border-gray-900" />
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
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.07l-.71.71M21 12h-1M4 12H3m16.66 5.66l-.71-.71M4.05 4.93l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" /></svg>
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
      <button onClick={() => setOpen(v => !v)} className="flex items-center space-x-3 px-2 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
        <div className="text-left hidden sm:block">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 leading-tight">{name || 'User'}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{roleLabel}</p>
        </div>
        <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <UserIcon className="h-5 w-5 text-gray-500 dark:text-gray-300" />
        </div>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{name || 'User'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{roleLabel}</p>
          </div>
          <div className="py-1">
            <button onClick={() => { setOpen(false); onProfile(); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">Profile</button>
            <button onClick={() => { setOpen(false); onSettings(); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">Settings</button>
            <button onClick={() => { setOpen(false); onLogout(); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-gray-800 flex items-center">
              <LogOutIcon className="h-4 w-4 mr-2" /> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}