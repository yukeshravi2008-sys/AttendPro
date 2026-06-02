import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { queryDocumentsWithOrder, queryDocuments } from '../../lib/firestore';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { formatDate, formatTime } from '../../utils/dateUtils';
import Badge from '../shared/Badge';
import LoadingSpinner from '../shared/LoadingSpinner';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

export default function AttendanceReport() {
  const { companyId } = useAuth();
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedEmployee, setSelectedEmployee] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [allRecords, allEmployees] = await Promise.all([
          queryDocumentsWithOrder('attendance', [['company_id', '==', companyId]], 'date', 'desc'),
          queryDocuments('users', 'company_id', '==', companyId),
        ]);
        setRecords(allRecords);
        setEmployees(allEmployees.filter(e => e.role === 'employee'));
      } finally {
        setLoading(false);
      }
    };
    if (companyId) fetchData();
  }, [companyId]);

  const filtered = records.filter((r) => {
    if (r.date < startDate || r.date > endDate) return false;
    if (selectedEmployee !== 'all' && r.employee_id !== selectedEmployee) return false;
    return true;
  });

  const getEmployeeName = (id) => employees.find((e) => e.id === id)?.full_name || id;

  const chartData = (() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = eachDayOfInterval({ start, end });
    return days.map((day) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayRecords = filtered.filter((r) => r.date === dayStr);
      return {
        date: format(day, 'MMM dd'),
        present: dayRecords.filter((r) => r.status === 'present').length,
        late: dayRecords.filter((r) => r.status === 'late').length,
        absent: dayRecords.filter((r) => r.status === 'absent').length,
      };
    });
  })();

  const exportData = filtered.map((r) => ({
    Employee: getEmployeeName(r.employee_id),
    Date: formatDate(r.date),
    'Check In': formatTime(r.check_in),
    'Check Out': formatTime(r.check_out),
    'Work Hours': r.work_hours || 0,
    Status: r.status,
  }));

  const handleExportCSV = () => {
    exportToCSV(exportData, 'attendance_report');
    toast.success('CSV exported');
  };

  const handleExportExcel = () => {
    exportToExcel(exportData, 'attendance_report');
    toast.success('Excel exported');
  };

  const handleExportPDF = () => {
    const columns = [
      { Header: 'Employee', accessor: 'Employee' },
      { Header: 'Date', accessor: 'Date' },
      { Header: 'Check In', accessor: 'Check In' },
      { Header: 'Check Out', accessor: 'Check Out' },
      { Header: 'Work Hours', accessor: 'Work Hours' },
      { Header: 'Status', accessor: 'Status' },
    ];
    exportToPDF(exportData, columns, 'attendance_report');
    toast.success('PDF exported');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employee</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 text-sm"
            >
              <option value="all">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.full_name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 ml-auto">
            <button onClick={handleExportCSV} className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
              <FileText className="h-4 w-4" /> CSV
            </button>
            <button onClick={handleExportExcel} className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              <FileSpreadsheet className="h-4 w-4" /> Excel
            </button>
            <button onClick={handleExportPDF} className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
              <Download className="h-4 w-4" /> PDF
            </button>
          </div>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Attendance Trends</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6',
                  }}
                />
                <Legend />
                <Bar dataKey="present" fill="#22c55e" name="Present" radius={[4, 4, 0, 0]} />
                <Bar dataKey="late" fill="#f59e0b" name="Late" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" fill="#ef4444" name="Absent" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Records ({filtered.length})
          </h3>
        </div>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Employee</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Check In</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Check Out</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Hours</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">No records found</td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-4 text-gray-900 dark:text-white">{getEmployeeName(r.employee_id)}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{formatDate(r.date)}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{formatTime(r.check_in)}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{formatTime(r.check_out)}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{r.work_hours || 0}h</td>
                      <td className="py-3 px-4"><Badge variant={r.status}>{r.status}</Badge></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
