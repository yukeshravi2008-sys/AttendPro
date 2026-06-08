import { useAuth } from '../../context/AuthContext';
import useAttendance from '../../hooks/useAttendance';
import useLeave from '../../hooks/useLeave';
import CheckIn from '../../components/employee/CheckIn';
import AttendanceHistory from '../../components/employee/AttendanceHistory';
import Badge from '../../components/shared/Badge';
import { format, getDay } from 'date-fns';
import { MapContainer, TileLayer, Marker, Circle, Popup } from 'react-leaflet';
import { useState, useEffect, useMemo } from 'react';
import { IndianRupee, Flame, Trophy, CalendarCheck, BarChart3, Target } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function EmployeeDashboard() {
  const { userData, companyId } = useAuth();
  const { attendance, todayRecord, getMonthlyEarnings } = useAttendance();
  const { leaveRequests } = useLeave();
  const [company, setCompany] = useState(null);
  const [currentEarnings, setCurrentEarnings] = useState(null);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  useEffect(() => {
    if (!companyId) return;

    const fetchCompany = async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../../lib/firebase');

        const docRef = doc(db, 'companies', companyId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setCompany({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.error('Company document not found for id:', companyId);
        }
      } catch (err) {
        console.error('Company fetch error:', err);
      }
    };

    fetchCompany();
  }, [companyId]);

  useEffect(() => {
    const dailyWage = userData?.daily_wage || 0;
    if (!dailyWage) return;
    getMonthlyEarnings(currentYear, currentMonth, dailyWage, userData?.created_at).then(setCurrentEarnings);
  }, [userData, getMonthlyEarnings, currentYear, currentMonth]);

  const pendingLeaves = leaveRequests.filter(l => l.status === 'pending');

  const monthlyStats = useMemo(() => {
    const monthRecords = attendance.filter(r => {
      const d = new Date(r.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const present = monthRecords.filter(r => r.status === 'present').length;
    const late = monthRecords.filter(r => r.status === 'late').length;
    const absent = monthRecords.filter(r => r.status === 'absent').length;
    const total = monthRecords.length || 1;
    return { present, late, absent, total, percentage: Math.round((present / total) * 100) };
  }, [attendance, currentMonth, currentYear]);

  const streak = useMemo(() => {
    const presentDates = attendance
      .filter(r => r.status === 'present' || r.status === 'late')
      .map(r => r.date)
      .sort()
      .reverse();
    if (presentDates.length === 0) return 0;
    let count = 1;
    for (let i = 1; i < presentDates.length; i++) {
      const prev = new Date(presentDates[i - 1]);
      const curr = new Date(presentDates[i]);
      const diff = Math.round((prev - curr) / (1000 * 60 * 60 * 24));
      if (diff === 1) count++;
      else break;
    }
    return count;
  }, [attendance]);

  const thisYearAttendance = useMemo(() =>
    attendance.filter(r => new Date(r.date).getFullYear() === currentYear),
    [attendance, currentYear]
  );

  const totalPresentThisYear = useMemo(() =>
    thisYearAttendance.filter(r => r.status === 'present' || r.status === 'late').length,
    [thisYearAttendance]
  );

  const bestMonth = useMemo(() => {
    const monthMap = {};
    thisYearAttendance.forEach(r => {
      const m = new Date(r.date).getMonth();
      if (!monthMap[m]) monthMap[m] = { present: 0, total: 0 };
      monthMap[m].total++;
      if (r.status === 'present' || r.status === 'late') monthMap[m].present++;
    });
    let best = { month: -1, rate: 0 };
    Object.entries(monthMap).forEach(([m, stats]) => {
      const rate = Math.round((stats.present / (stats.total || 1)) * 100);
      if (rate > best.rate) best = { month: parseInt(m), rate };
    });
    return best;
  }, [thisYearAttendance]);

  const monthlyTrend = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const records = attendance.filter(r => {
        const rd = new Date(r.date);
        return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear();
      });
      const present = records.filter(r => r.status === 'present' || r.status === 'late').length;
      const total = records.length || 1;
      data.push({ month: MONTHS[d.getMonth()], rate: Math.round((present / total) * 100) });
    }
    return data;
  }, [attendance, currentYear, currentMonth]);

  const thisMonthAttendance = useMemo(() =>
    attendance.filter(r => {
      const d = new Date(r.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }),
    [attendance, currentMonth, currentYear]
  );

  const weeklyPattern = useMemo(() => {
    const counts = {};
    DAY_NAMES.forEach(d => counts[d] = { present: 0, total: 0 });
    thisMonthAttendance.forEach(r => {
      const day = DAY_NAMES[getDay(new Date(r.date))];
      counts[day].total++;
      if (r.status === 'present' || r.status === 'late') counts[day].present++;
    });
    return DAY_NAMES.filter(d => d !== 'Sun').map(d => ({
      day: d,
      rate: counts[d].total > 0 ? Math.round((counts[d].present / counts[d].total) * 100) : 0,
    }));
  }, [thisMonthAttendance]);

  const today = format(new Date(), 'EEEE, MMMM do, yyyy');

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Good {now.getHours() < 12 ? 'Morning' : 'Afternoon'}, {userData?.full_name?.split(' ')[0] || 'User'}!
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{today}</p>
          </div>
          <div className="flex items-center gap-3">
            {todayRecord ? (
              <Badge variant={todayRecord.status} className="text-sm px-3 py-1">
                {todayRecord.status === 'present' ? 'Checked In' : todayRecord.status === 'late' ? 'Late Arrival' : 'Present'}
              </Badge>
            ) : (
              <Badge variant="absent" className="text-sm px-3 py-1">Not Checked In</Badge>
            )}
          </div>
        </div>
      </div>

      <CheckIn />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Attendance Summary</h3>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{monthlyStats.present}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Present</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">{monthlyStats.late}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Late</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{monthlyStats.absent}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Absent</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-teal-600">{monthlyStats.percentage}%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Rate</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-teal-600 h-2.5 rounded-full transition-all"
              style={{ width: `${monthlyStats.percentage}%` }}
            />
          </div>
        </div>

        {currentEarnings && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <IndianRupee className="h-5 w-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">This Month Earnings</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Earned Salary</span>
                <span className="text-lg font-bold text-teal-600">₹{(currentEarnings.earnedSalary || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Present Days</span>
                <span className="font-semibold text-gray-900 dark:text-white">{currentEarnings.presentDays}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Absent Days</span>
                <span className="font-semibold text-gray-900 dark:text-white">{currentEarnings.absentDays}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Daily Wage</span>
                <span className="font-semibold text-gray-900 dark:text-white">₹{(currentEarnings.dailyWage || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Deduction</span>
                <span className="font-semibold text-red-500">₹{(currentEarnings.deduction || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="pt-2 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Net Salary</span>
                <span className="text-lg font-bold text-teal-600">₹{(currentEarnings.netSalary || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}

        {pendingLeaves.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pending Leave</h3>
            <div className="space-y-3">
              {pendingLeaves.slice(0, 3).map((l) => (
                <div key={l.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{l.type}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{l.start_date} - {l.end_date}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {company && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Office Location</h3>
          <div className="h-48 rounded-lg overflow-hidden">
            <MapContainer
              center={[company.latitude, company.longitude]}
              zoom={15}
              className="h-full w-full"
              scrollWheelZoom={false}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Circle
                center={[company.latitude, company.longitude]}
                radius={company.allowed_radius}
                pathOptions={{ color: '#1D9E75', fillOpacity: 0.1 }}
              />
              <Marker position={[company.latitude, company.longitude]}>
                <Popup>{company.company_name}</Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Attendance</h3>
        <AttendanceHistory limit={7} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-teal-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">My Analytics</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-4 text-center">
            <Target className="h-5 w-5 text-teal-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-teal-600">{monthlyStats.percentage}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">This Month</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 text-center">
            <Flame className="h-5 w-5 text-amber-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-amber-600">{streak}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Day Streak</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
            <Trophy className="h-5 w-5 text-green-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-green-600">{bestMonth.month >= 0 ? MONTHS[bestMonth.month] : '-'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Best Month</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
            <CalendarCheck className="h-5 w-5 text-blue-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-blue-600">{totalPresentThisYear}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Present</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Monthly Trend</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" domain={[0, 100]} tickFormatter={v => `${v}%`} fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#f3f4f6' }}
                    formatter={(value) => [`${value}%`, 'Rate']}
                  />
                  <Area type="monotone" dataKey="rate" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.2} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Weekly Pattern (This Month)</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyPattern}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="day" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" domain={[0, 100]} tickFormatter={v => `${v}%`} fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#f3f4f6' }}
                    formatter={(value) => [`${value}%`, 'Attendance']}
                  />
                  <Bar dataKey="rate" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}