import AttendanceReport from '../../components/admin/AttendanceReport';

export default function AdminReports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
        <p className="text-gray-500 dark:text-gray-400">View and export attendance reports</p>
      </div>
      <AttendanceReport />
    </div>
  );
}
