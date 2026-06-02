import { useState } from 'react';
import useAttendance from '../../hooks/useAttendance';
import { LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CheckOut() {
  const { todayRecord, checkOut } = useAttendance();
  const [loading, setLoading] = useState(false);

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      const result = await checkOut();
      toast.success(`Checked out! Work hours: ${result.workHours}h`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!todayRecord || todayRecord.check_out) return null;

  return (
    <button
      onClick={handleCheckOut}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors font-medium"
    >
      <LogOut className="h-4 w-4" />
      {loading ? 'Processing...' : 'Check Out'}
    </button>
  );
}
