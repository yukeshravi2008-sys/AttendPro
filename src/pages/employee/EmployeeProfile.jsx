import ProfileCard from '../../components/employee/ProfileCard';

export default function EmployeeProfile() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your personal information</p>
      </div>
      <ProfileCard />
    </div>
  );
}
