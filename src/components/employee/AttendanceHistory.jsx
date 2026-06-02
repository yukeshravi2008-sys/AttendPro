import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import useAttendance from '../../hooks/useAttendance';
import { formatDate, formatTime } from '../../utils/dateUtils';
import Badge from '../shared/Badge';
import LoadingSpinner from '../shared/LoadingSpinner';

export default function AttendanceHistory({ limit = 7 }) {
  const { user } = useAuth();
  const { attendance } = useAttendance();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sorted = [...attendance]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
    setRecords(sorted);
    setLoading(false);
  }, [attendance, limit]);

  if (loading) return <LoadingSpinner size="sm" />;

  if (records.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400 text-sm py-4 text-center">
        No attendance records yet
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-400 font-medium">Date</th>
            <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-400 font-medium">In</th>
            <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-400 font-medium">Out</th>
            <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-400 font-medium">Hours</th>
            <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-400 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id} className="border-b border-gray-100 dark:border-gray-800">
              <td className="py-2 px-2 text-gray-900 dark:text-white">{formatDate(record.date)}</td>
              <td className="py-2 px-2 text-gray-900 dark:text-white">{formatTime(record.check_in)}</td>
              <td className="py-2 px-2 text-gray-900 dark:text-white">{formatTime(record.check_out)}</td>
              <td className="py-2 px-2 text-gray-900 dark:text-white">{record.work_hours || 0}h</td>
              <td className="py-2 px-2">
                <Badge variant={record.status}>{record.status}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
