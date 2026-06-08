import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, ClipboardCheck, CalendarCheck,
  MapPin, Building2, LogOut, X, ChevronLeft, IndianRupee, BarChart3,
} from 'lucide-react';

const employeeLinks = [
  { to: '/employee/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/employee/attendance', icon: ClipboardCheck, label: 'Attendance' },
  { to: '/employee/leave', icon: CalendarCheck, label: 'Leave' },
  { to: '/employee/earnings', icon: IndianRupee, label: 'Earnings' },
  { to: '/employee/profile', icon: Users, label: 'Profile' },
];

const adminLinks = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/employees', icon: Users, label: 'Employees' },
  { to: '/admin/reports', icon: ClipboardCheck, label: 'Reports' },
  { to: '/admin/leave', icon: CalendarCheck, label: 'Leave' },
  { to: '/admin/map', icon: MapPin, label: 'Map' },
];

const superadminLinks = [
  { to: '/superadmin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/superadmin/companies', icon: Building2, label: 'Companies' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { role, logout } = useAuth();

  const links = role === 'superadmin'
    ? superadminLinks
    : role === 'admin'
      ? adminLinks
      : employeeLinks;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-30 h-full w-64 bg-gray-900 text-white transform transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:z-auto`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-teal-400" />
            <span className="font-bold text-lg">AttendPro</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-gray-700 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <link.icon className="h-5 w-5" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
