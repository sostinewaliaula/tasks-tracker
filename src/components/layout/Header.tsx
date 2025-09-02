import { useState } from 'react';
import { BellIcon, MenuIcon, XIcon, LogOutIcon, UsersIcon, BuildingIcon } from 'lucide-react';
import { useTask } from '../../context/TaskContext';
import { NotificationDropdown } from '../notifications/NotificationDropdown';
import logo from '../../assets/logo.png';

type HeaderProps = {
  userRole: string;
  onLogout: () => void;
  currentPage: 'dashboard' | 'tasks' | 'reports' | 'notifications' | 'users' | 'departments' | 'settings';
  onNavigate: (page: 'dashboard' | 'tasks' | 'reports' | 'notifications' | 'users' | 'departments' | 'settings') => void;
};

export function Header({
  userRole,
  onLogout,
  currentPage,
  onNavigate
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { notifications } = useTask();
  const unreadCount = notifications.filter(n => !n.read).length;

  return <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <img src={logo} alt="Caava Group" className="h-8 w-auto" />
            </div>
            <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <a href="#" onClick={() => { onNavigate('dashboard'); setIsNotificationsOpen(false); }} className={`${currentPage === 'dashboard' ? 'border-[#2e9d74] text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                Dashboard
              </a>
              <a href="#" onClick={() => { onNavigate('tasks'); setIsNotificationsOpen(false); }} className={`${currentPage === 'tasks' ? 'border-[#2e9d74] text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                Tasks
              </a>
              {userRole !== 'employee' && <a href="#" onClick={() => { onNavigate('reports'); setIsNotificationsOpen(false); }} className={`${currentPage === 'reports' ? 'border-[#2e9d74] text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  Reports
                </a>}
              <a href="#" onClick={() => { onNavigate('users'); setIsNotificationsOpen(false); }} className={`${currentPage === 'users' ? 'border-[#2e9d74] text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                Users
              </a>
              {userRole !== 'employee' && <a href="#" onClick={() => { onNavigate('departments'); setIsNotificationsOpen(false); }} className={`${currentPage === 'departments' ? 'border-[#2e9d74] text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  Departments
                </a>}
              {userRole === 'superadmin' && <a href="#" onClick={() => { onNavigate('settings'); setIsNotificationsOpen(false); }} className={`${currentPage === 'settings' ? 'border-[#2e9d74] text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                Settings
              </a>}
              <a href="#" onClick={() => { onNavigate('notifications'); setIsNotificationsOpen(false); }} className={`${currentPage === 'notifications' ? 'border-[#2e9d74] text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                Notifications
              </a>
            </nav>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="relative">
              <button type="button" className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2e9d74]" onClick={() => setIsNotificationsOpen(prev => !prev)}>
                <span className="sr-only">View notifications</span>
                <BellIcon className={`h-6 w-6 ${currentPage === 'notifications' ? 'text-[#2e9d74]' : ''}`} />
                {unreadCount > 0 && <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                    {unreadCount}
                  </span>}
              </button>
              {isNotificationsOpen && (
                <NotificationDropdown
                  onClose={() => setIsNotificationsOpen(false)}
                  onViewAll={() => { setIsNotificationsOpen(false); onNavigate('notifications'); }}
                />
              )}
            </div>
            <div className="ml-3 relative">
              <button type="button" onClick={onLogout} className="ml-3 bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2e9d74]">
                <span className="sr-only">Sign out</span>
                <LogOutIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
          <div className="flex items-center sm:hidden">
            <button type="button" className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#2e9d74]" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? <XIcon className="block h-6 w-6" /> : <MenuIcon className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      {isMenuOpen && <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <a href="#" onClick={() => { onNavigate('dashboard'); setIsMenuOpen(false); setIsNotificationsOpen(false); }} className={`${currentPage === 'dashboard' ? 'bg-[#e8f5f0] border-[#2e9d74] text-[#2e9d74]' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}>
              Dashboard
            </a>
            <a href="#" onClick={() => { onNavigate('tasks'); setIsMenuOpen(false); setIsNotificationsOpen(false); }} className={`${currentPage === 'tasks' ? 'bg-[#e8f5f0] border-[#2e9d74] text-[#2e9d74]' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}>
              Tasks
            </a>
            {userRole === 'manager' && <a href="#" onClick={() => { onNavigate('reports'); setIsMenuOpen(false); setIsNotificationsOpen(false); }} className={`${currentPage === 'reports' ? 'bg-[#e8f5f0] border-[#2e9d74] text-[#2e9d74]' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}>
                Reports
              </a>}
            <a href="#" onClick={() => { onNavigate('notifications'); setIsMenuOpen(false); setIsNotificationsOpen(false); }} className={`${currentPage === 'notifications' ? 'bg-[#e8f5f0] border-[#2e9d74] text-[#2e9d74]' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium flex items-center`}>
              Notifications
              {unreadCount > 0 && <span className="ml-2 inline-block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {unreadCount}
                </span>}
            </a>
            <a href="#" onClick={() => { onNavigate('users'); setIsMenuOpen(false); setIsNotificationsOpen(false); }} className={`${currentPage === 'users' ? 'bg-[#e8f5f0] border-[#2e9d74] text-[#2e9d74]' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium flex items-center`}>
              <UsersIcon className="h-5 w-5 mr-2" />
              Users
            </a>
            {userRole === 'manager' && <a href="#" onClick={() => { onNavigate('departments'); setIsMenuOpen(false); setIsNotificationsOpen(false); }} className={`${currentPage === 'departments' ? 'bg-[#e8f5f0] border-[#2e9d74] text-[#2e9d74]' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'} block pl-3 pr-4 py-2 border-l-4 text-base font-medium flex items-center`}>
                <BuildingIcon className="h-5 w-5 mr-2" />
                Departments
              </a>}
            <div className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
              <button className="flex items-center" onClick={onLogout}>
                <LogOutIcon className="h-6 w-6 mr-2" />
                Sign out
              </button>
            </div>
          </div>
        </div>}
    </header>;
}