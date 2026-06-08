import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { queryDocuments, queryDocumentsWithOrder } from '../../lib/firestore';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import Badge from '../../components/shared/Badge';
import {
  Users, CheckCircle, XCircle, TrendingUp, BarChart3, Calendar, Award,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, getDay } from 'date-fns';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getDateRange(daysBack) {
  const end = new Date();
  const start = subDays(end, daysBack);
  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd'),
  };
}

export default function Analytics() {
  const { companyId } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [allAttendance, setAllAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [emps, attendance] = await Promise.all([
          queryDocuments('users', 'company_id', '==', companyId),
          queryDocumentsWithOrder('attendance',
            [['company_id', '==', companyId]],
            'date', 'desc'
          ),
        ]);
        if (cancelled) return;
        setEmployees(emps.filter(e => e.role === 'employee'));
        setAllAttendance(attendance);
      } catch (err) {
        console.error('Analytics fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [companyId]);

  const today = format(new Date(), 'yyyy-MM-dd');
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const todayAttendance = useMemo(() =>
    allAttendance.filter(a => a.date === today),
    [allAttendance, today]
  );

  const presentToday = useMemo(() =>
    todayAttendance.filter(a => a.status === 'present' || a.status === 'late').length,
    [todayAttendance]
  );

  const thisMonthAttendance = useMemo(() =>
    allAttendance.filter(a => {
      const d = new Date(a.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }),
    [allAttendance, currentMonth, currentYear]
  );

  const thisMonthPresent = useMemo(() =>
    thisMonthAttendance.filter(a => a.status === 'present' || a.status === 'late').length,
    [thisMonthAttendance]
  );

  const thisMonthTotal = useMemo(() => thisMonthAttendance.length || 1, [thisMonthAttendance]);
  const avgRate = useMemo(() => Math.round((thisMonthPresent / thisMonthTotal) * 100), [thisMonthPresent, thisMonthTotal]);

  const absentToday = useMemo(() => {
    const presentIds = new Set(todayAttendance.map(a => a.employee_id));
    return employees.filter(e => !presentIds.has(e.id)).length;
  }, [employees, todayAttendance]);

  const last30Days = useMemo(() => {
    const { start } = getDateRange(30);
    const days = [];
    const grouped = {};
    allAttendance.forEach(a => {
      if (a.date >= start && a.date <= today) {
        if (!grouped[a.date]) grouped[a.date] = { present: 0, absent: 0 };
        if (a.status === 'present' || a.status === 'late') {
          grouped[a.date].present++;
        } else {
          grouped[a.date].absent++;
        }
      }
    });
    const dayList = [];
    for (let i = 30; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      dayList.push(d);
    }
    dayList.forEach(date => {
      days.push({
        date: format(new Date(date), 'MMM dd'),
        present: grouped[date]?.present || 0,
        absent: grouped[date]?.absent || 0,
      });
    });
    return days;
  }, [allAttendance, today]);

  const monthlyData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const records = allAttendance.filter(a => a.date.startsWith(monthStr));
      const present = records.filter(a => a.status === 'present' || a.status === 'late').length;
      const total = records.length || 1;
      const pct = Math.round((present / total) * 100);
      const color = pct >= 90 ? '#1D9E75' : pct >= 75 ? '#f59e0b' : '#ef4444';
      data.push({
        month: MONTHS[d.getMonth()],
        pct,
        present,
        total: records.length,
        fill: color,
      });
    }
    return data;
  }, [allAttendance, currentYear, currentMonth]);

  const topPerformers = useMemo(() => {
    const map = {};
    thisMonthAttendance.forEach(a => {
      if (!map[a.employee_id]) map[a.employee_id] = { present: 0, late: 0, total: 0 };
      map[a.employee_id].total++;
      if (a.status === 'present') map[a.employee_id].present++;
      else if (a.status === 'late') map[a.employee_id].late++;
    });
    const list = Object.entries(map).map(([id, stats]) => {
      const emp = employees.find(e => e.id === id);
      return {
        id,
        name: emp?.full_name || 'Unknown',
        present: stats.present,
        late: stats.late,
        total: stats.total,
        rate: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0,
      };
    });
    list.sort((a, b) => b.rate - a.rate || b.present - a.present);
    return list.slice(0, 5);
  }, [thisMonthAttendance, employees]);

  const lateByDay = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    const { start } = getDateRange(30);
    allAttendance.forEach(a => {
      if (a.status === 'late' && a.date >= start) {
        const day = getDay(new Date(a.date));
        counts[day]++;
      }
    });
    return DAY_NAMES.map((name, i) => ({
      day: name,
      late: counts[i],
    })).filter(d => d.day !== 'Sun');
  }, [allAttendance]);

  const employeeComparison = useMemo(() => {
    const map = {};
    thisMonthAttendance.forEach(a => {
      if (!map[a.employee_id]) map[a.employee_id] = { present: 0, late: 0, absent: 0 };
      if (a.status === 'present') map[a.employee_id].present++;
      else if (a.status === 'late') map[a.employee_id].late++;
      else if (a.status === 'absent') map[a.employee_id].absent++;
    });
    return employees.map(emp => {
      const stats = map[emp.id] || { present: 0, late: 0, absent: 0 };
      const total = stats.present + stats.late + stats.absent;
      const present = stats.present + stats.late;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;
      let status = 'absent';
      if (rate >= 90) status = 'present';
      else if (rate >= 75) status = 'late';
      return {
        id: emp.id,
        name: emp.full_name || 'Unknown',
        present: stats.present,
        late: stats.late,
        absent: stats.absent,
        rate,
        status,
      };
    });
  }, [thisMonthAttendance, employees]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-gray-500 dark:text-gray-400">Attendance insights and reports</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-teal-600" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Employees</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{employees.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Present Today</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{presentToday}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Absent Today</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{absentToday}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-teal-600" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Avg Attendance Rate</span>
          </div>
          <p className="text-2xl font-bold text-teal-600">{avgRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-teal-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Attendance Trend (Last 30 Days)</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={last30Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={10} tick={{ angle: -45 }} height={60} />
                <YAxis stroke="#9CA3AF" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#f3f4f6' }}
                />
                <Legend />
                <Line type="monotone" dataKey="present" stroke="#1D9E75" strokeWidth={2} dot={false} name="Present" />
                <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} dot={false} name="Absent" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-teal-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Attendance Rate</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#f3f4f6' }}
                  formatter={(value, name) => [`${value}%`, 'Rate']}
                />
                <Legend />
                <Bar dataKey="pct" radius={[4, 4, 0, 0]} name="Rate">
                  {monthlyData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Late Arrivals by Day of Week</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lateByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#f3f4f6' }}
                />
                <Bar dataKey="late" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Late Arrivals" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-5 w-5 text-teal-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Performers This Month</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">Name</th>
                  <th className="text-center py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">Present</th>
                  <th className="text-center py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">Late</th>
                  <th className="text-right py-2 px-3 text-gray-600 dark:text-gray-400 font-medium">Rate</th>
                </tr>
              </thead>
              <tbody>
                {topPerformers.map((emp) => (
                  <tr key={emp.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2.5 px-3 font-medium text-gray-900 dark:text-white">{emp.name}</td>
                    <td className="py-2.5 px-3 text-center text-green-600">{emp.present}</td>
                    <td className="py-2.5 px-3 text-center text-amber-600">{emp.late}</td>
                    <td className="py-2.5 px-3 text-right">
                      {emp.rate === 100 ? (
                        <Badge variant="present">100%</Badge>
                      ) : (
                        <span className="font-medium">{emp.rate}%</span>
                      )}
                    </td>
                  </tr>
                ))}
                {topPerformers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">No data this month</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-teal-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Employee Overview This Month</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Name</th>
                <th className="text-center py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Present</th>
                <th className="text-center py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Absent</th>
                <th className="text-center py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Late</th>
                <th className="text-center py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Rate</th>
                <th className="text-center py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {employeeComparison.map((emp) => (
                <tr key={emp.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{emp.name}</td>
                  <td className="py-3 px-4 text-center text-green-600 font-medium">{emp.present}</td>
                  <td className="py-3 px-4 text-center text-red-500 font-medium">{emp.absent}</td>
                  <td className="py-3 px-4 text-center text-amber-600 font-medium">{emp.late}</td>
                  <td className="py-3 px-4 text-center font-medium">{emp.rate}%</td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant={emp.status}>
                      {emp.status === 'present' ? 'Good' : emp.status === 'late' ? 'Average' : 'Poor'}
                    </Badge>
                  </td>
                </tr>
              ))}
              {employeeComparison.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No employees found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
