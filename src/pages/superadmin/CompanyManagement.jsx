import { useState, useEffect } from 'react';
import {
  getAllDocuments, addDocument, updateDocument, deleteDocument,
  queryDocuments,
} from '../../lib/firestore';
import Modal from '../../components/shared/Modal';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import Badge from '../../components/shared/Badge';
import { Plus, Edit2, Trash2, Building2, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CompanyManagement() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState({
    company_name: '',
    address: '',
    latitude: '',
    longitude: '',
    allowed_radius: 100,
  });
  const [saving, setSaving] = useState(false);
  const [employeeCounts, setEmployeeCounts] = useState({});

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const data = await getAllDocuments('companies');
      setCompanies(data);

      const counts = {};
      for (const company of data) {
        const users = await queryDocuments('users', 'company_id', '==', company.id);
        counts[company.id] = users.filter(u => u.role === 'employee').length;
      }
      setEmployeeCounts(counts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCompanies(); }, []);

  const openAdd = () => {
    setEditingCompany(null);
    setFormData({ company_name: '', address: '', latitude: '', longitude: '', allowed_radius: 100 });
    setShowModal(true);
  };

  const openEdit = (company) => {
    setEditingCompany(company);
    setFormData({
      company_name: company.company_name,
      address: company.address || '',
      latitude: String(company.latitude || ''),
      longitude: String(company.longitude || ''),
      allowed_radius: company.allowed_radius || 100,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.company_name) {
      toast.error('Company name is required');
      return;
    }
    setSaving(true);
    try {
      const data = {
        company_name: formData.company_name,
        address: formData.address,
        latitude: parseFloat(formData.latitude) || 0,
        longitude: parseFloat(formData.longitude) || 0,
        allowed_radius: parseInt(formData.allowed_radius) || 100,
      };

      if (editingCompany) {
        await updateDocument('companies', editingCompany.id, data);
        toast.success('Company updated');
      } else {
        const id = `company_${Date.now()}`;
        await addDocument('companies', id, { ...data, created_at: new Date().toISOString() });
        toast.success('Company created');
      }

      setShowModal(false);
      await fetchCompanies();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (company) => {
    if (!window.confirm(`Delete ${company.company_name}? This will remove all associated data.`)) return;
    try {
      await deleteDocument('companies', company.id);
      toast.success('Company deleted');
      await fetchCompanies();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Companies</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage organizations in the system</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
        >
          <Plus className="h-4 w-4" />
          Add Company
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((company) => (
          <div
            key={company.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Building2 className="h-6 w-6 text-teal-600" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{company.company_name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{company.address || 'No address'}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openEdit(company)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(company)}
                  className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p>Lat: {company.latitude?.toFixed(4) || 'N/A'}, Lng: {company.longitude?.toFixed(4) || 'N/A'}</p>
              <p>Radius: {company.allowed_radius || 100}m</p>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Users className="h-4 w-4" />
              {employeeCounts[company.id] || 0} employees
            </div>
          </div>
        ))}

        {companies.length === 0 && (
          <div className="col-span-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
            <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p>No companies yet. Add your first company.</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCompany ? 'Edit Company' : 'Add Company'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name *</label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              placeholder="Acme Corp"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              placeholder="123 Main St, City"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                placeholder="40.7128"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                placeholder="-74.0060"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Allowed Radius (meters)
            </label>
            <input
              type="number"
              value={formData.allowed_radius}
              onChange={(e) => setFormData({ ...formData, allowed_radius: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              placeholder="100"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingCompany ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
