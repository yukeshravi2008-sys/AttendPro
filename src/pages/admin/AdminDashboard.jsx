import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { queryDocuments, queryDocumentsWithOrder } from '../../lib/firestore';
import StatsCards from '../../components/admin/StatsCards';
import LeaveApprovals from '../../components/admin/LeaveApprovals';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Badge from '../../components/shared/Badge';

export default function AdminDashboard() {
  const { companyId } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
  });
  const [todayEmployees, setTodayEmployees] = useState([]);
  const [weeklyChart, setWeeklyChart] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!companyId) return;

      const allEmployees = await queryDocuments('users', 'company_id', '==', companyId);
      const employees = allEmployees.filter(e => e.role === 'employee');
      const totalEmployees = employees.length;

      const today = format(new Date(), 'yyyy-MM-dd');
      const todayAttendance = await queryDocuments('attendance', 'date', '==', today) || [];
      const companyAttendance = todayAttendance.filter(a => a.company_id === companyId);

      const presentToday = companyAttendance.filter(a => a.status === 'present').length;
      const lateToday = companyAttendance.filter(a => a.status === 'late').length;
      const absentToday = totalEmployees - presentToday - lateToday;

      setStats({ totalEmployees, presentToday, absentToday: Math.max(0, absentToday), lateToday });

      const todayList = employees.map(emp => {
        const record = companyAttendance.find(a => a.employee_id === emp.id);
        return {
          ...emp,
          attendance: record || null,
        };
      });
      setTodayEmployees(todayList);

      const weekDays = [];
      for (let i = 6; i >= 0; i--) {
        const d = format(new Date(Date.now() - i * 86400000), 'yyyy-MM-dd');
        weekDays.push(d);
      }
      const weekAttendance = await Promise.all(
        weekDays.map(d => queryDocuments('attendance', 'date', '==', d))
      );
      const chartData = weekDays.map((d, i) => {
        const dayRecords = (weekAttendance[i] || []).filter(a => a.company_id === companyId);
        return {
          day: format(new Date(d), 'EEE'),
          present: dayRecords.filter(a => a.status === 'present').length,
          late: dayRecords.filter(a => a.status === 'late').length,
          absent: dayRecords.filter(a => a.status === 'absent').length,
        };
      });
      setWeeklyChart(chartData);
    };
    fetchData();
  }, [companyId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Attendance overview for today</p>
      </div>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weekly Attendance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6',
                  }}
                />
                <Bar dataKey="present" fill="#22c55e" name="Present" radius={[4, 4, 0, 0]} />
                <Bar dataKey="late" fill="#f59e0b" name="Late" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" fill="#ef4444" name="Absent" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <LeaveApprovals />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Today's Employees</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">Employee</th>
                <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">Status</th>
                <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">Check In</th>
                <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">Check Out</th>
              </tr>
            </thead>
            <tbody>
              {todayEmployees.map((emp) => (
                <tr key={emp.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-medium">
                        {emp.full_name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span className="text-gray-900 dark:text-white">{emp.full_name}</span>
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    {emp.attendance ? (
                      <Badge variant={emp.attendance.status}>{emp.attendance.status}</Badge>
                    ) : (
                      <Badge variant="absent">Not checked in</Badge>
                    )}
                  </td>
                  <td className="py-2 px-3 text-gray-600 dark:text-gray-400">
                    {emp.attendance?.check_in ? format(new Date(emp.attendance.check_in), 'hh:mm a') : '-'}
                  </td>
                  <td className="py-2 px-3 text-gray-600 dark:text-gray-400">
                    {emp.attendance?.check_out ? format(new Date(emp.attendance.check_out), 'hh:mm a') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
