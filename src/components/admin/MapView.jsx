import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MapContainer, TileLayer, Marker, Circle, Popup } from 'react-leaflet';
import { getDocument, queryDocuments } from '../../lib/firestore';
import { haversineDistance } from '../../utils/haversine';
import { formatTime } from '../../utils/dateUtils';
import LoadingSpinner from '../shared/LoadingSpinner';
import { MapPin, Building2 } from 'lucide-react';

export default function MapView() {
  const { companyId } = useAuth();
  const [company, setCompany] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!companyId) return;
      try {
        const companyData = await getDocument('companies', companyId);
        setCompany(companyData);

        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = await queryDocuments('attendance', 'date', '==', today);
        setAttendance(todayAttendance.filter(a => a.company_id === companyId && a.latitude));

        const allUsers = await queryDocuments('users', 'company_id', '==', companyId);
        setEmployees(allUsers);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [companyId]);

  if (loading) return <LoadingSpinner />;
  if (!company) return <p className="text-gray-500">Company location not set</p>;

  const getEmployeeName = (id) => employees.find((e) => e.id === id)?.full_name || id;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="h-[500px]">
        <MapContainer
          center={[company.latitude, company.longitude]}
          zoom={15}
          className="h-full w-full"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <Circle
            center={[company.latitude, company.longitude]}
            radius={company.allowed_radius}
            pathOptions={{
              color: '#1D9E75',
              fillColor: '#1D9E75',
              fillOpacity: 0.1,
              weight: 2,
            }}
          />

          <Marker position={[company.latitude, company.longitude]}>
            <Popup>
              <div className="text-center">
                <Building2 className="h-5 w-5 text-teal-600 mx-auto" />
                <p className="font-semibold">{company.company_name}</p>
                <p className="text-xs text-gray-500">Office Location</p>
              </div>
            </Popup>
          </Marker>

          {attendance.map((record) => (
            <Marker
              key={record.id}
              position={[record.latitude, record.longitude]}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{getEmployeeName(record.employee_id)}</p>
                  <p>In: {formatTime(record.check_in)}</p>
                  {record.check_out && <p>Out: {formatTime(record.check_out)}</p>}
                  <p className="text-xs text-gray-500 mt-1">
                    Distance: {Math.round(haversineDistance(
                      record.latitude, record.longitude,
                      company.latitude, company.longitude
                    ))}m
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
