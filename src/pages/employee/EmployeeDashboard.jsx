import { useAuth } from '../../context/AuthContext';
import useAttendance from '../../hooks/useAttendance';
import useLeave from '../../hooks/useLeave';
import CheckIn from '../../components/employee/CheckIn';
import AttendanceHistory from '../../components/employee/AttendanceHistory';
import Badge from '../../components/shared/Badge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { format } from 'date-fns';
import { MapContainer, TileLayer, Marker, Circle, Popup } from 'react-leaflet';
import { useState, useEffect } from 'react';
import { IndianRupee } from 'lucide-react';

export default function EmployeeDashboard() {
  const { userData, companyId } = useAuth();
  const { attendance, todayRecord, getMonthlyEarnings } = useAttendance();
  const { leaveRequests } = useLeave();
  const [company, setCompany] = useState(null);
  const [currentEarnings, setCurrentEarnings] = useState(null);

  useEffect(() => {
    if (!companyId) return

    const fetchCompany = async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore')
        const { db } = await import('../../lib/firebase')

        console.log('Fetching company with id:', companyId)
        console.log('db instance:', db)

        const docRef = doc(db, 'companies', companyId, 'companies', companyId)
        const docSnap = await getDoc(docRef)

        console.log('docSnap exists:', docSnap.exists())
        console.log('docSnap data:', docSnap.data())

        if (docSnap.exists()) {
          setCompany({ id: docSnap.id, ...docSnap.data() })
        } else {
          console.error('Company document not found for id:', companyId)
        }
      } catch (err) {
        console.error('Company fetch error:', err)
      }
    }

    fetchCompany()
  }, [companyId])

  useEffect(() => {
    const dailyWage = userData?.daily_wage || 0;
    if (!dailyWage) return;
    const now = new Date();
    getMonthlyEarnings(now.getFullYear(), now.getMonth(), dailyWage).then(setCurrentEarnings);
  }, [userData, getMonthlyEarnings])

  const pendingLeaves = leaveRequests.filter(l => l.status === 'pending');

  const monthlyStats = (() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthRecords = attendance.filter(r => {
      const d = new Date(r.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const present = monthRecords.filter(r => r.status === 'present').length;
    const late = monthRecords.filter(r => r.status === 'late').length;
    const absent = monthRecords.filter(r => r.status === 'absent').length;
    const total = monthRecords.length || 1;
    return { present, late, absent, total, percentage: Math.round((present / total) * 100) };
  })();

  const today = format(new Date(), 'EEEE, MMMM do, yyyy');

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Good {new Date().getHours() < 12 ? 'Morning' : 'Afternoon'}, {userData?.full_name?.split(' ')[0] || 'User'}!
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
    </div>
  );
}
