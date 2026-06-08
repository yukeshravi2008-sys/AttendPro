import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/shared/ErrorBoundary';

import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';

import Login from './pages/auth/Login';

import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeeAttendance from './pages/employee/EmployeeAttendance';
import EmployeeLeave from './pages/employee/EmployeeLeave';
import EmployeeProfile from './pages/employee/EmployeeProfile';
import EmployeeEarnings from './pages/employee/Earnings';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEmployees from './pages/admin/AdminEmployees';
import AdminReports from './pages/admin/AdminReports';
import AdminLeave from './pages/admin/AdminLeave';
import AdminMap from './pages/admin/AdminMap';

import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import CompanyManagement from './pages/superadmin/CompanyManagement';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1f2937',
              color: '#f3f4f6',
              borderRadius: '0.75rem',
              border: '1px solid #374151',
            },
            success: {
              iconTheme: { primary: '#1D9E75', secondary: '#f3f4f6' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#f3f4f6' },
            },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/employee/dashboard" element={
              <ProtectedRoute allowedRoles={['employee']}><ErrorBoundary><EmployeeDashboard /></ErrorBoundary></ProtectedRoute>
            } />
            <Route path="/employee/attendance" element={
              <ProtectedRoute allowedRoles={['employee']}><ErrorBoundary><EmployeeAttendance /></ErrorBoundary></ProtectedRoute>
            } />
            <Route path="/employee/leave" element={
              <ProtectedRoute allowedRoles={['employee']}><ErrorBoundary><EmployeeLeave /></ErrorBoundary></ProtectedRoute>
            } />
            <Route path="/employee/profile" element={
              <ProtectedRoute allowedRoles={['employee']}><ErrorBoundary><EmployeeProfile /></ErrorBoundary></ProtectedRoute>
            } />
            <Route path="/employee/earnings" element={
              <ProtectedRoute allowedRoles={['employee']}><ErrorBoundary><EmployeeEarnings /></ErrorBoundary></ProtectedRoute>
            } />

            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRoles={['admin']}><ErrorBoundary><AdminDashboard /></ErrorBoundary></ProtectedRoute>
            } />
            <Route path="/admin/employees" element={
              <ProtectedRoute allowedRoles={['admin']}><ErrorBoundary><AdminEmployees /></ErrorBoundary></ProtectedRoute>
            } />
            <Route path="/admin/reports" element={
              <ProtectedRoute allowedRoles={['admin']}><ErrorBoundary><AdminReports /></ErrorBoundary></ProtectedRoute>
            } />
            <Route path="/admin/leave" element={
              <ProtectedRoute allowedRoles={['admin']}><ErrorBoundary><AdminLeave /></ErrorBoundary></ProtectedRoute>
            } />
            <Route path="/admin/map" element={
              <ProtectedRoute allowedRoles={['admin']}><ErrorBoundary><AdminMap /></ErrorBoundary></ProtectedRoute>
            } />

            <Route path="/superadmin/dashboard" element={
              <ProtectedRoute allowedRoles={['superadmin']}><ErrorBoundary><SuperAdminDashboard /></ErrorBoundary></ProtectedRoute>
            } />
            <Route path="/superadmin/companies" element={
              <ProtectedRoute allowedRoles={['superadmin']}><ErrorBoundary><CompanyManagement /></ErrorBoundary></ProtectedRoute>
            } />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
