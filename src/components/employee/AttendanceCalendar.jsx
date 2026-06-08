import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import useAttendance from '../../hooks/useAttendance';
import { getMonthDays, getDayStatus, getAttendanceColor, formatTime, getLocalDateString, getTodayDateString } from '../../utils/dateUtils';
import Badge from '../shared/Badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function AttendanceCalendar() {
  const { user } = useAuth();
  const { getMonthlyAttendance } = useAttendance();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    setLoading(true);
    getMonthlyAttendance(currentYear, currentMonth).then((data) => {
      setRecords(data);
      setLoading(false);
    });
  }, [currentYear, currentMonth, getMonthlyAttendance]);

  const days = getMonthDays(currentYear, currentMonth);
  const startDay = new Date(currentYear, currentMonth, 1).getDay();

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDay(null);
  };

  const summary = {
    present: records.filter(r => r.status === 'present').length,
    late: records.filter(r => r.status === 'late').length,
    absent: records.filter(r => r.status === 'absent').length,
    total: records.length,
  };

  const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' });

  const selectedRecord = selectedDay ? records.find(r => r.date === selectedDay) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {monthName} {currentYear}
        </h3>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{summary.present}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Present</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{summary.late}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Late</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{summary.absent}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Absent</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {days.map((day) => {
            const dateStr = getLocalDateString(day);
            const status = getDayStatus(dateStr, records);
            const isToday = dateStr === getTodayDateString();
            const isSelected = selectedDay === dateStr;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-colors relative
                  ${isSelected ? 'ring-2 ring-teal-500' : ''}
                  ${isToday ? 'ring-1 ring-teal-300' : ''}
                  ${status ? getAttendanceColor(status) + ' text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      {selectedRecord && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Details for {selectedRecord.date}
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Check In:</span>{' '}
              <span className="text-gray-900 dark:text-white font-medium">{formatTime(selectedRecord.check_in)}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Check Out:</span>{' '}
              <span className="text-gray-900 dark:text-white font-medium">{formatTime(selectedRecord.check_out)}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Work Hours:</span>{' '}
              <span className="text-gray-900 dark:text-white font-medium">{selectedRecord.work_hours || 0}h</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Status:</span>{' '}
              <Badge variant={selectedRecord.status}>{selectedRecord.status}</Badge>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
