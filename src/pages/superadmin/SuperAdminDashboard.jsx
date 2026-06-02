import { useState, useEffect } from 'react';
import { getAllDocuments, getDocument } from '../../lib/firestore';
import { Building2, Users, CheckCircle2 } from 'lucide-react';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

export default function SuperAdminDashboard() {
  const [companies, setCompanies] = useState([]);
  const [employeeCounts, setEmployeeCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const allCompanies = await getAllDocuments('companies');
        setCompanies(allCompanies);

        const counts = {};
        for (const company of allCompanies) {
          const users = await getAllDocuments('users');
          counts[company.id] = users.filter(u => u.company_id === company.id && u.role === 'employee').length;
        }
        setEmployeeCounts(counts);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;

  const totalEmployees = Object.values(employeeCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Super Admin Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">System-wide overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Companies</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{companies.length}</p>
            </div>
            <Building2 className="h-8 w-8 text-teal-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalEmployees}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Companies</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{companies.length}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">All Companies</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <div
              key={company.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <Building2 className="h-5 w-5 text-teal-600" />
                <h4 className="font-semibold text-gray-900 dark:text-white">{company.company_name}</h4>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 truncate">{company.address}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  <Users className="h-4 w-4 inline mr-1" />
                  {employeeCounts[company.id] || 0} employees
                </span>
                <span className="text-gray-400 dark:text-gray-500 text-xs">
                  R: {company.allowed_radius}m
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
