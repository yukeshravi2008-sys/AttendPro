import MapView from '../../components/admin/MapView';

export default function AdminMap() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Live Map</h1>
        <p className="text-gray-500 dark:text-gray-400">Employee check-in locations</p>
      </div>
      <MapView />
    </div>
  );
}
