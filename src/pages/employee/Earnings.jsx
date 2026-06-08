import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import useAttendance from '../../hooks/useAttendance';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { IndianRupee, TrendingUp, TrendingDown } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatINR(num) {
  return (num || 0).toLocaleString('en-IN');
}

export default function Earnings() {
  const { userData } = useAuth();
  const { getEarningsReport, loading } = useAttendance();
  const [earnings, setEarnings] = useState([]);
  const [fetching, setFetching] = useState(true);

  const dailyWage = userData?.daily_wage || 0;

  useEffect(() => {
    if (!dailyWage) {
      setFetching(false);
      return;
    }
    getEarningsReport(dailyWage, 6).then((data) => {
      setEarnings(data);
      setFetching(false);
    });
  }, [dailyWage, getEarningsReport]);

  const totalEarnedThisYear = earnings
    .filter(e => e.year === new Date().getFullYear())
    .reduce((sum, e) => sum + e.earnedSalary, 0);

  const chartData = earnings.map(e => ({
    name: MONTH_NAMES[e.month],
    earned: e.earnedSalary,
    deduction: e.deduction,
  }));

  if (fetching) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Earnings</h1>
        <p className="text-gray-500 dark:text-gray-400">Your salary and wage details</p>
      </div>

      {!dailyWage ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <IndianRupee className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No wage data configured yet. Contact your admin.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center gap-2 mb-2">
                <IndianRupee className="h-5 w-5 text-teal-600" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Daily Wage</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{formatINR(dailyWage)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-teal-600" />
                <span className="text-sm text-gray-500 dark:text-gray-400">This Year Earned</span>
              </div>
              <p className="text-2xl font-bold text-teal-600">₹{formatINR(totalEarnedThisYear)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Monthly Salary</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{formatINR(userData?.monthly_salary || 0)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-5 w-5 text-amber-600" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Working Days/Month</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">26</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Earnings Trend</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#f3f4f6' }}
                    formatter={(value) => [`₹${formatINR(value)}`, undefined]}
                  />
                  <Bar dataKey="earned" fill="#1D9E75" radius={[4, 4, 0, 0]} name="Earned" />
                  <Bar dataKey="deduction" fill="#ef4444" radius={[4, 4, 0, 0]} name="Deduction" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Month</th>
                    <th className="text-center py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Present</th>
                    <th className="text-center py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Absent</th>
                    <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Daily Wage</th>
                    <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Earned</th>
                    <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Deduction</th>
                    <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Net Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {earnings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500 dark:text-gray-400">
                        No earnings data available
                      </td>
                    </tr>
                  ) : (
                    earnings.map((e, i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                          {MONTH_NAMES[e.month]} {e.year}
                        </td>
                        <td className="py-3 px-4 text-center text-green-600 font-medium">{e.presentDays}</td>
                        <td className="py-3 px-4 text-center text-red-500 font-medium">{e.absentDays}</td>
                        <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">₹{formatINR(e.dailyWage)}</td>
                        <td className="py-3 px-4 text-right text-gray-900 dark:text-white font-medium">₹{formatINR(e.earnedSalary)}</td>
                        <td className="py-3 px-4 text-right text-red-500">₹{formatINR(e.deduction)}</td>
                        <td className="py-3 px-4 text-right text-teal-600 font-bold">₹{formatINR(e.netSalary)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
