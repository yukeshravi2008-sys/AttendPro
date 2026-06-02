import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoginForm from '../../components/auth/LoginForm';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { AlertTriangle } from 'lucide-react';

export default function Login() {
  const { user, userData, role, loading, error, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Configuration Error</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Copy <code className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">.env.example</code> to <code className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">.env</code> and fill in your Firebase credentials.
          </p>
        </div>
      </div>
    );
  }

  if (user && role) {
    const redirectMap = {
      superadmin: '/superadmin/dashboard',
      admin: '/admin/dashboard',
      employee: '/employee/dashboard',
    };
    const target = redirectMap[role];
    if (target) {
      return <Navigate to={target} replace />;
    }
  }

  if (user && (!role || (role && !['superadmin', 'admin', 'employee'].includes(role)))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Account Not Configured</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {userData === null
              ? 'Your user account exists but no profile was found. Please contact your administrator.'
              : 'Your user profile has not been assigned a valid role. Please contact your administrator.'}
          </p>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return <LoginForm />;
}
