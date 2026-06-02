import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { Users, CheckCircle2, XCircle, Clock, UserCheck } from 'lucide-react';

export default function StatsCards({ stats }) {
  const cards = [
    {
      label: 'Total Employees',
      value: stats.totalEmployees,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      label: 'Present Today',
      value: stats.presentToday,
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      label: 'Absent Today',
      value: stats.absentToday,
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-100 dark:bg-red-900/30',
    },
    {
      label: 'Late Today',
      value: stats.lateToday,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
    },
  ];

  const pieData = [
    { name: 'Present', value: stats.presentToday, color: '#22c55e' },
    { name: 'Absent', value: stats.absentToday, color: '#ef4444' },
    { name: 'Late', value: stats.lateToday, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{card.value}</p>
            </div>
            <div className={`p-3 rounded-lg ${card.bg}`}>
              <card.icon className={`h-6 w-6 ${card.color}`} />
            </div>
          </div>
        </div>
      ))}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Attendance %</p>
        <div className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-teal-600" />
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.totalEmployees > 0
              ? Math.round((stats.presentToday / stats.totalEmployees) * 100)
              : 0}%
          </span>
        </div>
        {pieData.length > 0 && (
          <div className="h-20 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={30} innerRadius={20}>
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
