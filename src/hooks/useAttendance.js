import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  addDocument, updateDocument, getDocument, queryDocuments,
  queryDocumentsWithOrder, subscribeToCollection,
} from '../lib/firestore';
import { haversineDistance } from '../utils/haversine';
import { getTodayDateString, isLateArrival } from '../utils/dateUtils';

export default function useAttendance() {
  const { user, companyId } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !companyId) return;
    setLoading(true);
    const unsub = subscribeToCollection('attendance', (data) => {
      setAttendance(data.filter(a => a.employee_id === user.uid));
      const today = data.find(a =>
        a.employee_id === user.uid && a.date === getTodayDateString()
      );
      setTodayRecord(today || null);
      setLoading(false);
    }, [['employee_id', '==', user.uid]]);
    return unsub;
  }, [user, companyId]);

  const fetchAttendance = useCallback(async (startDate, endDate) => {
    if (!user) return [];
    const conditions = [['employee_id', '==', user.uid]];
    if (startDate) conditions.push(['date', '>=', startDate]);
    if (endDate) conditions.push(['date', '<=', endDate]);
    return await queryDocumentsWithOrder('attendance', conditions, 'date', 'desc');
  }, [user]);

  const checkIn = useCallback(async (latitude, longitude, selfieUrl = null) => {
    console.log('[useAttendance:checkIn] companyId:', JSON.stringify(companyId), '(type:', typeof companyId + ')');
    if (!user || !companyId) throw new Error('User not authenticated');

    const { doc: fDoc, getDoc: fGetDoc } = await import('firebase/firestore');
    const { db } = await import('../lib/firebase');
    const companyRef = fDoc(db, 'companies', companyId);
    const companySnap = await fGetDoc(companyRef);
    const company = companySnap.exists() ? { id: companySnap.id, ...companySnap.data() } : null;
    console.log('[useAttendance:checkIn] company result:', company);
    if (!company) throw new Error('Company not found');

    const distance = haversineDistance(
      latitude, longitude,
      parseFloat(company.latitude),
      parseFloat(company.longitude)
    );

    console.log('[useAttendance:checkIn] Employee coords:', latitude, longitude);
    console.log('[useAttendance:checkIn] Company coords:', company.latitude, company.longitude);
    console.log('[useAttendance:checkIn] Distance (m):', distance);
    console.log('[useAttendance:checkIn] Allowed radius:', company.allowed_radius, `(type: ${typeof company.allowed_radius})`);
    console.log('[useAttendance:checkIn] Distance > allowed_radius?', distance > company.allowed_radius);

    if (distance > company.allowed_radius) {
      throw new Error('You are outside the allowed attendance area.');
    }

    const shifts = await queryDocuments('shifts', 'company_id', '==', companyId);
    const defaultShift = shifts[0];

    const today = getTodayDateString();

    const holidays = await queryDocuments('holidays', 'company_id', '==', companyId);
    const isHoliday = holidays.some(h => h.date === today);
    if (isHoliday) throw new Error('Today is a holiday. No attendance required.');

    const checkInTime = new Date();
    let status = 'present';
    if (defaultShift && isLateArrival(checkInTime, defaultShift.start_time)) {
      status = 'late';
    }

    const attendanceId = `${user.uid}_${today}`;
    await addDocument('attendance', attendanceId, {
      employee_id: user.uid,
      company_id: companyId,
      date: today,
      check_in: checkInTime.toISOString(),
      check_out: null,
      latitude,
      longitude,
      work_hours: 0,
      status,
      selfie_url: selfieUrl || '',
      created_at: new Date().toISOString(),
    });

    return { status, distance, checkInTime };
  }, [user, companyId]);

  const checkOut = useCallback(async () => {
    if (!user) throw new Error('User not authenticated');

    const today = getTodayDateString();
    const attendanceId = `${user.uid}_${today}`;
    const record = await getDocument('attendance', attendanceId);
    if (!record) throw new Error('No check-in record found for today');
    if (record.check_out) throw new Error('Already checked out today');

    const checkOutTime = new Date();
    const checkInTime = new Date(record.check_in);
    const workHours = parseFloat(
      ((checkOutTime - checkInTime) / (1000 * 60 * 60)).toFixed(2)
    );

    await updateDocument('attendance', attendanceId, {
      check_out: checkOutTime.toISOString(),
      work_hours: workHours,
    });

    return { workHours, checkOutTime };
  }, [user]);

  const getMonthlyAttendance = useCallback(async (year, month) => {
    if (!user) return [];
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    const records = await queryDocumentsWithOrder('attendance',
      [['employee_id', '==', user.uid], ['date', '>=', `${monthStr}-01`], ['date', '<=', `${monthStr}-31`]],
      'date', 'asc'
    );
    return records;
  }, [user]);

  const getMonthlyEarnings = useCallback(async (year, month, dailyWage, joiningDate) => {
    if (!user) return null;
    const records = await getMonthlyAttendance(year, month);
    const presentStrict = records.filter(r => r.status === 'present').length;
    const lateDays = records.filter(r => r.status === 'late').length;
    const presentDays = presentStrict + lateDays;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    let startDate = firstDay;

    if (joiningDate) {
      const join = joiningDate?.toDate ? joiningDate.toDate() : new Date(joiningDate);
      if (join > firstDay) startDate = join;
    }

    let workingDays = 0;
    const d = new Date(startDate);
    while (d <= lastDay) {
      if (d.getDay() !== 0) workingDays++;
      d.setDate(d.getDate() + 1);
    }

    const absentDays = Math.max(0, workingDays - presentDays);
    const earnedSalary = dailyWage * presentDays;
    const deduction = dailyWage * absentDays;
    return {
      year,
      month,
      presentDays,
      presentStrict,
      lateDays,
      absentDays,
      dailyWage,
      earnedSalary,
      deduction,
      netSalary: earnedSalary,
      workingDays,
    };
  }, [user, getMonthlyAttendance]);

  const getEarningsReport = useCallback(async (dailyWage, monthsBack = 6, joiningDate) => {
    if (!user) return [];
    const results = [];
    const now = new Date();
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const earning = await getMonthlyEarnings(d.getFullYear(), d.getMonth(), dailyWage, joiningDate);
      if (earning) results.push(earning);
    }
    return results;
  }, [user, getMonthlyEarnings]);

  return {
    attendance,
    todayRecord,
    loading,
    checkIn,
    checkOut,
    fetchAttendance,
    getMonthlyAttendance,
    getMonthlyEarnings,
    getEarningsReport,
  };
}