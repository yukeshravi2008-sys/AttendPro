import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateDocument } from '../../lib/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import { QRCodeCanvas } from 'qrcode.react';
import { Camera, Save, Building2, Mail, Phone, User } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../shared/LoadingSpinner';
import Badge from '../shared/Badge';

export default function ProfileCard() {
  const { user, userData, companyId, refreshUserData } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(userData?.full_name || '');
  const [phone, setPhone] = useState(userData?.phone || '');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef();

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    setUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target.result;
        const storageRef = ref(storage, `profiles/${user.uid}_${Date.now()}.jpg`);
        await uploadString(storageRef, dataUrl, 'data_url');
        const url = await getDownloadURL(storageRef);
        await updateDocument('users', user.uid, { profile_photo: url });
        await refreshUserData();
        toast.success('Photo updated');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDocument('users', user.uid, { full_name: fullName, phone });
      await refreshUserData();
      setEditing(false);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-teal-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
              {userData?.profile_photo ? (
                <img src={userData.profile_photo} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                userData?.full_name?.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute bottom-0 right-0 p-1.5 bg-teal-600 text-white rounded-full hover:bg-teal-700"
            >
              {uploadingPhoto ? <LoadingSpinner size="sm" text="" /> : <Camera className="h-4 w-4" />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          <div className="flex-1 text-center sm:text-left">
            {editing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  placeholder="Full Name"
                />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  placeholder="Phone"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-3 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{userData?.full_name}</h2>
                <div className="flex items-center gap-2 mt-1 justify-center sm:justify-start">
                  <Badge variant={userData?.role}>{userData?.role}</Badge>
                  <Badge variant={userData?.status === 'active' ? 'active' : 'inactive'}>{userData?.status}</Badge>
                </div>
                <button
                  onClick={() => setEditing(true)}
                  className="mt-2 text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  Edit Profile
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <Mail className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{userData?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <Phone className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{userData?.phone || 'Not set'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <Building2 className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Company ID</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{companyId || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <User className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">User ID</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.uid?.slice(0, 12)}...</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Employee QR Code</h3>
        <div className="flex justify-center p-4 bg-white rounded-xl">
          <QRCodeCanvas
            value={JSON.stringify({ uid: user?.uid, companyId })}
            size={200}
            level="H"
            includeMargin
          />
        </div>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
          Scan this QR code for quick attendance
        </p>
      </div>
    </div>
  );
}
