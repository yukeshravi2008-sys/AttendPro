import LeaveApprovals from '../../components/admin/LeaveApprovals';

export default function AdminLeave() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leave Management</h1>
        <p className="text-gray-500 dark:text-gray-400">Approve or reject leave requests</p>
      </div>
      <LeaveApprovals />
    </div>
  );
}
