import { useState } from 'react';
import useLeave from '../../hooks/useLeave';
import { queryDocuments } from '../../lib/firestore';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useEffect } from 'react';
import Badge from '../shared/Badge';
import LoadingSpinner from '../shared/LoadingSpinner';
import toast from 'react-hot-toast';

export default function LeaveApprovals() {
  const { leaveRequests, loading, updateLeaveStatus } = useLeave();
  const [employees, setEmployees] = useState({});
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    const fetchEmployees = async () => {
      const allUsers = await queryDocuments('users', 'role', '==', 'employee');
      const map = {};
      allUsers.forEach((u) => { map[u.id] = u.full_name; });
      setEmployees(map);
    };
    fetchEmployees();
  }, []);

  const filtered = leaveRequests.filter((l) => {
    if (filter === 'all') return true;
    return l.status === filter;
  });

  const handleApprove = async (id) => {
    try {
      await updateLeaveStatus(id, 'approved');
      toast.success('Leave approved');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleReject = async (id) => {
    try {
      await updateLeaveStatus(id, 'rejected');
      toast.success('Leave rejected');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Leave Requests</h3>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <p className="text-center py-8 text-gray-500 dark:text-gray-400">No leave requests</p>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {filtered.map((req) => (
            <div key={req.id} className="p-4 flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {employees[req.employee_id] || req.employee_id}
                  </span>
                  <Badge variant={req.type}>{req.type}</Badge>
                  <Badge variant={req.status}>{req.status}</Badge>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {req.start_date} to {req.end_date}
                </p>
                {req.reason && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{req.reason}</p>
                )}
              </div>
              {req.status === 'pending' && (
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleApprove(req.id)}
                    className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 hover:bg-green-200 dark:hover:bg-green-900/50"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleReject(req.id)}
                    className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 dark:hover:bg-red-900/50"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
