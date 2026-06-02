import useLeave from '../../hooks/useLeave';
import LeaveForm from '../../components/employee/LeaveForm';
import Badge from '../../components/shared/Badge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { formatDate } from '../../utils/dateUtils';

export default function EmployeeLeave() {
  const { leaveRequests, loading } = useLeave();

  const leaveBalance = (() => {
    const sick = leaveRequests.filter(l => l.type === 'sick' && l.status === 'approved');
    const casual = leaveRequests.filter(l => l.type === 'casual' && l.status === 'approved');
    const annual = leaveRequests.filter(l => l.type === 'annual' && l.status === 'approved');
    const personal = leaveRequests.filter(l => l.type === 'personal' && l.status === 'approved');

    const calcDays = (leaves) => leaves.reduce((sum, l) => {
      const start = new Date(l.start_date);
      const end = new Date(l.end_date);
      return sum + Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
    }, 0);

    return {
      sick: { used: calcDays(sick), total: 12 },
      casual: { used: calcDays(casual), total: 12 },
      annual: { used: calcDays(annual), total: 20 },
      personal: { used: calcDays(personal), total: 10 },
    };
  })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leave Management</h1>
        <p className="text-gray-500 dark:text-gray-400">Apply for leave and track your requests</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(leaveBalance).map(([key, val]) => (
          <div key={key} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{key} Leave</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{val.total - val.used} <span className="text-sm font-normal text-gray-500">/ {val.total}</span></p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
              <div className="bg-teal-600 h-1.5 rounded-full" style={{ width: `${(val.used / val.total) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      <LeaveForm />

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Leave History</h3>
        {loading ? (
          <LoadingSpinner />
        ) : leaveRequests.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No leave requests yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-400 font-medium">Type</th>
                  <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-400 font-medium">Start</th>
                  <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-400 font-medium">End</th>
                  <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-400 font-medium">Reason</th>
                  <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.map((req) => (
                  <tr key={req.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 px-2 text-gray-900 dark:text-white capitalize">{req.type}</td>
                    <td className="py-2 px-2 text-gray-900 dark:text-white">{req.start_date}</td>
                    <td className="py-2 px-2 text-gray-900 dark:text-white">{req.end_date}</td>
                    <td className="py-2 px-2 text-gray-900 dark:text-white max-w-[200px] truncate">{req.reason}</td>
                    <td className="py-2 px-2"><Badge variant={req.status}>{req.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
