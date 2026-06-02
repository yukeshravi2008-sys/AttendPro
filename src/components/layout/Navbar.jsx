import { useAuth } from '../../context/AuthContext';
import { Menu, Moon, Sun, LogOut } from 'lucide-react';
import Badge from '../shared/Badge';

export default function Navbar({ onMenuClick, darkMode, toggleDarkMode }) {
  const { userData, role, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden lg:block" />

        <div className="flex items-center gap-3">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {userData?.full_name || 'User'}
              </p>
              <Badge variant={role}>{role}</Badge>
            </div>

            <div className="h-8 w-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-sm font-medium">
              {userData?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hidden sm:block"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
