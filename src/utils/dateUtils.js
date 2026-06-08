import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, differenceInHours, differenceInMinutes } from 'date-fns';

export const formatDate = (date) => {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM dd, yyyy');
};

export const formatTime = (date) => {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'hh:mm a');
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM dd, yyyy hh:mm a');
};

export const getMonthDays = (year, month) => {
  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(new Date(year, month));
  return eachDayOfInterval({ start, end });
};

export const getDayStatus = (day, attendanceRecords) => {
  const record = attendanceRecords.find(r =>
    isSameDay(parseISO(r.date), day)
  );
  return record ? record.status : null;
};

export const getAttendanceColor = (status) => {
  switch (status) {
    case 'present': return 'bg-green-500';
    case 'late': return 'bg-amber-500';
    case 'absent': return 'bg-red-500';
    default: return 'bg-gray-200 dark:bg-gray-600';
  }
};

export const calculateWorkHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const ci = typeof checkIn === 'string' ? parseISO(checkIn) : checkIn.toDate ? checkIn.toDate() : checkIn;
  const co = typeof checkOut === 'string' ? parseISO(checkOut) : checkOut.toDate ? checkOut.toDate() : checkOut;
  return parseFloat(differenceInHours(co, ci).toFixed(2));
};

export const isLateArrival = (checkInTime, shiftStartTime, graceMinutes = 15) => {
  if (!checkInTime || !shiftStartTime) return false;
  const checkIn = typeof checkInTime === 'string' ? parseISO(checkInTime) : checkInTime.toDate ? checkInTime.toDate() : checkInTime;
  const shiftStart = typeof shiftStartTime === 'string' ? parseISO(`1970-01-01T${shiftStartTime}`) : shiftStartTime;

  const checkInMinutes = checkIn.getHours() * 60 + checkIn.getMinutes();
  const shiftStartMinutes = shiftStart.getHours ? shiftStart.getHours() * 60 + shiftStart.getMinutes() : 0;

  return checkInMinutes > shiftStartMinutes + graceMinutes;
};

export const getTodayDateString = () => format(new Date(), 'yyyy-MM-dd');

export const getLocalDateString = (date) => {
  const d = date || new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
