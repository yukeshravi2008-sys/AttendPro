import { useState, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import useAttendance from '../../hooks/useAttendance';
import useGeolocation from '../../hooks/useGeolocation';
import { MapContainer, TileLayer, Marker, Circle, Popup } from 'react-leaflet';
import { Camera, MapPin, LogIn, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../shared/LoadingSpinner';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';

export default function CheckIn() {
  const { user, companyId } = useAuth();
  const { todayRecord, checkIn, checkOut } = useAttendance();
  const { getCurrentPosition } = useGeolocation();
  const [loading, setLoading] = useState(false);
  const [companyLocation, setCompanyLocation] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [selfieDataUrl, setSelfieDataUrl] = useState(null);
  const [selfieUrl, setSelfieUrl] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (err) {
      toast.error('Camera access denied - you can check in without a selfie');
    }
  }, []);

  const captureSelfie = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg');
    setSelfieDataUrl(dataUrl);
    stopCamera();
    toast.success('Selfie captured');
  }, [stopCamera]);

  const uploadSelfie = useCallback(async () => {
    if (!selfieDataUrl) return '';
    const storageRef = ref(storage, `selfies/${user.uid}_${Date.now()}.jpg`);
    await uploadString(storageRef, selfieDataUrl, 'data_url');
    return await getDownloadURL(storageRef);
  }, [user, selfieDataUrl]);

  const loadCompanyLocation = useCallback(async () => {
    if (!companyId) {
      console.warn('[CheckIn] No companyId available');
      return null;
    }
    try {
      const { doc, getDoc } = await import('firebase/firestore')
      const { db } = await import('../../lib/firebase')

      console.log('[CheckIn] Fetching company:', companyId)
      const docRef = doc(db, 'companies', companyId, 'companies', companyId)
      const docSnap = await getDoc(docRef)
      console.log('[CheckIn] docSnap exists:', docSnap.exists())
      console.log('[CheckIn] docSnap data:', docSnap.data())

      if (docSnap.exists()) {
        const company = { id: docSnap.id, ...docSnap.data() }
        setCompanyLocation({
          latitude: company.latitude,
          longitude: company.longitude,
          radius: company.allowed_radius,
          name: company.company_name,
        })
        return company
      } else {
        console.error('[CheckIn] Company document not found for id:', companyId)
        toast.error('Company not found. Contact your administrator.')
        return null
      }
    } catch (err) {
      console.error('[CheckIn] Company fetch error:', err)
      toast.error('Company not found. Contact your administrator.')
      return null
    }
  }, [companyId])

  const handleCheckIn = useCallback(async () => {
    setLoading(true);
    try {
      const pos = await getCurrentPosition();
      setCurrentLocation(pos);

      const company = await loadCompanyLocation();
      if (!company) {
        throw new Error('Company configuration not found. Unable to check in.');
      }

      let selfie = '';
      if (selfieDataUrl) {
        selfie = await uploadSelfie();
        setSelfieUrl(selfie);
      }

      const result = await checkIn(pos.latitude, pos.longitude, selfie);
      toast.success(`Checked in at ${new Date(result.checkInTime).toLocaleTimeString()} - ${result.status}`);
    } catch (err) {
      if (!err.message.includes('Company')) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [getCurrentPosition, checkIn, uploadSelfie, loadCompanyLocation, selfieDataUrl]);

  const handleCheckOut = useCallback(async () => {
    setLoading(true);
    try {
      const result = await checkOut();
      toast.success(`Checked out! Hours: ${result.workHours}h`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [checkOut]);

  const handleShowLocation = useCallback(async () => {
    try {
      const pos = await getCurrentPosition();
      setCurrentLocation(pos);
      await loadCompanyLocation();
    } catch (err) {
      toast.error(err.message);
    }
  }, [getCurrentPosition, loadCompanyLocation]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {!todayRecord && (
          <button
            onClick={handleCheckIn}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors font-medium"
          >
            {loading ? <LoadingSpinner size="sm" text="" /> : <LogIn className="h-4 w-4" />}
            Check In
          </button>
        )}
        {todayRecord && !todayRecord.check_out && (
          <button
            onClick={handleCheckOut}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors font-medium"
          >
            {loading ? <LoadingSpinner size="sm" text="" /> : <LogOut className="h-4 w-4" />}
            Check Out
          </button>
        )}
        <button
          onClick={handleShowLocation}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
        >
          <MapPin className="h-4 w-4" />
          Show Location
        </button>
        {!showCamera && !selfieDataUrl && (
          <button
            onClick={startCamera}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            <Camera className="h-4 w-4" />
            Take Selfie
          </button>
        )}
      </div>

      {showCamera && (
        <div className="relative rounded-lg overflow-hidden bg-black max-w-md">
          <video ref={videoRef} autoPlay playsInline className="w-full" />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            <button
              onClick={captureSelfie}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              Capture
            </button>
            <button
              onClick={stopCamera}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {selfieUrl && (
        <div className="flex items-center gap-3">
          <img src={selfieUrl} alt="Selfie" className="h-16 w-16 rounded-lg object-cover border border-gray-200 dark:border-gray-700" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Selfie captured</span>
        </div>
      )}

      {todayRecord && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{todayRecord.status}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Check In</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {todayRecord.check_in ? new Date(todayRecord.check_in).toLocaleTimeString() : '-'}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Check Out</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {todayRecord.check_out ? new Date(todayRecord.check_out).toLocaleTimeString() : '-'}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Hours</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{todayRecord.work_hours || 0}h</p>
          </div>
        </div>
      )}

      {companyLocation && (
        <div className="h-64 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <MapContainer
            center={[companyLocation.latitude, companyLocation.longitude]}
            zoom={16}
            className="h-full w-full"
            scrollWheelZoom={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Circle
              center={[companyLocation.latitude, companyLocation.longitude]}
              radius={companyLocation.radius}
              pathOptions={{ color: '#1D9E75', fillOpacity: 0.1 }}
            />
            <Marker position={[companyLocation.latitude, companyLocation.longitude]}>
              <Popup>{companyLocation.name} (Office)</Popup>
            </Marker>
            {currentLocation && (
              <Marker position={[currentLocation.latitude, currentLocation.longitude]}>
                <Popup>You are here</Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      )}
    </div>
  );
}
