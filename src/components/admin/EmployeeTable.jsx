import { useState } from 'react';
import { Search, Edit2, Trash2, UserPlus } from 'lucide-react';
import Badge from '../shared/Badge';
import LoadingSpinner from '../shared/LoadingSpinner';
import toast from 'react-hot-toast';

export default function EmployeeTable({
  employees,
  loading,
  onEdit,
  onDelete,
  onAdd,
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = employees.filter((emp) => {
    const matchesSearch =
      emp.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      emp.email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          {onAdd && (
            <button
              onClick={onAdd}
              className="flex items-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
            >
              <UserPlus className="h-4 w-4" />
              Add Employee
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Name</th>
              <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Email</th>
              <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Phone</th>
              <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Role</th>
              <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Status</th>
              <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
                  No employees found
                </td>
              </tr>
            ) : (
              filtered.map((emp) => (
                <tr key={emp.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-sm font-medium">
                        {emp.full_name?.charAt(0)?.toUpperCase() || 'E'}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{emp.full_name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{emp.email}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{emp.phone || '-'}</td>
                  <td className="py-3 px-4">
                    <Badge variant={emp.role}>{emp.role}</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={emp.status === 'active' ? 'active' : 'inactive'}>{emp.status}</Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(emp)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(emp)}
                          className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
