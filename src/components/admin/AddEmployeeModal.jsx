import { useState } from 'react';
import Modal from '../shared/Modal';
import toast from 'react-hot-toast';

export default function AddEmployeeModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: 'password123',
    daily_wage: '',
    monthly_salary: '',
  });

  const handleMonthlySalaryChange = (e) => {
    const val = e.target.value;
    const monthly = val === '' ? '' : Number(val);
    setFormData(prev => ({
      ...prev,
      monthly_salary: val,
      daily_wage: monthly ? Math.round(monthly / 26) : '',
    }));
  };

  const handleDailyWageChange = (e) => {
    setFormData(prev => ({
      ...prev,
      daily_wage: e.target.value,
    }));
  };
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email) {
      toast.error('Name and email are required');
      return;
    }
    setSaving(true);
    try {
      await onSave(formData);
      toast.success('Employee added');
      onClose();
      setFormData({ full_name: '', email: '', phone: '', password: 'password123' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Employee">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            placeholder="John Doe"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            placeholder="john@company.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            placeholder="+1 555-0000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Temporary Password</label>
          <input
            type="text"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
          />
          <p className="text-xs text-gray-500 mt-1">Default: password123</p>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Wage Settings</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly Salary (₹)</label>
              <input
                type="number"
                value={formData.monthly_salary}
                onChange={handleMonthlySalaryChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                placeholder="e.g. 24000"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Daily Wage (₹)</label>
              <input
                type="number"
                value={formData.daily_wage}
                onChange={handleDailyWageChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                placeholder="e.g. 800"
                min="0"
              />
            </div>
          </div>
          {formData.monthly_salary > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Daily wage auto-calculated: ₹{Math.round(Number(formData.monthly_salary) / 26)}/day
            </p>
          )}
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? 'Adding...' : 'Add Employee'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
