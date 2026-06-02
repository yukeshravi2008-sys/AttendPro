import useAttendance from '../../hooks/useAttendance';
import AttendanceCalendar from '../../components/employee/AttendanceCalendar';
import AttendanceHistory from '../../components/employee/AttendanceHistory';

export default function EmployeeAttendance() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Attendance</h1>
        <p className="text-gray-500 dark:text-gray-400">Track your attendance records</p>
      </div>

      <AttendanceCalendar />

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">All Records</h3>
        <AttendanceHistory limit={100} />
      </div>
    </div>
  );
}
