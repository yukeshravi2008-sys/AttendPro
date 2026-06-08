import { useState } from 'react';
import useEmployees from '../../hooks/useEmployees';
import EmployeeTable from '../../components/admin/EmployeeTable';
import AddEmployeeModal from '../../components/admin/AddEmployeeModal';
import Modal from '../../components/shared/Modal';
import toast from 'react-hot-toast';

export default function AdminEmployees() {
  const { employees, loading, addEmployee, updateEmployee, deleteEmployee } = useEmployees();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [deletingEmployee, setDeletingEmployee] = useState(null);

  const handleAdd = async (data) => {
    await addEmployee(data);
    setShowAddModal(false);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const dailyWage = form.daily_wage.value ? Number(form.daily_wage.value) : 0;
    const monthlySalary = form.monthly_salary.value ? Number(form.monthly_salary.value) : 0;
    const data = {
      full_name: form.full_name.value,
      phone: form.phone.value,
      status: form.status.value,
      daily_wage: dailyWage,
      monthly_salary: monthlySalary,
    };
    try {
      await updateEmployee(editingEmployee.id, data);
      toast.success('Employee updated');
      setEditingEmployee(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const [editMonthlySalary, setEditMonthlySalary] = useState('');
  const [editDailyWage, setEditDailyWage] = useState('');

  const openEditModal = (emp) => {
    setEditingEmployee(emp);
    setEditMonthlySalary(emp.monthly_salary || '');
    setEditDailyWage(emp.daily_wage || '');
  };

  const handleEditMonthlySalaryChange = (e) => {
    const val = e.target.value;
    const monthly = val === '' ? '' : Number(val);
    setEditMonthlySalary(val);
    setEditDailyWage(monthly ? Math.round(monthly / 26) : '');
  };

  const handleDelete = async () => {
    if (!deletingEmployee) return;
    try {
      await deleteEmployee(deletingEmployee.id);
      toast.success('Employee deleted');
      setDeletingEmployee(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employees</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your team members</p>
      </div>

      <EmployeeTable
        employees={employees}
        loading={loading}
        onAdd={() => setShowAddModal(true)}
        onEdit={openEditModal}
        onDelete={(emp) => setDeletingEmployee(emp)}
      />

      <AddEmployeeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAdd}
      />

      <Modal
        isOpen={!!editingEmployee}
        onClose={() => setEditingEmployee(null)}
        title="Edit Employee"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
            <input
              name="full_name"
              defaultValue={editingEmployee?.full_name}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
            <input
              name="phone"
              defaultValue={editingEmployee?.phone}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              name="status"
              defaultValue={editingEmployee?.status}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Wage Settings</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly Salary (₹)</label>
                <input
                  type="number"
                  name="monthly_salary"
                  value={editMonthlySalary}
                  onChange={handleEditMonthlySalaryChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Daily Wage (₹)</label>
                <input
                  type="number"
                  name="daily_wage"
                  value={editDailyWage}
                  onChange={(e) => setEditDailyWage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  min="0"
                />
              </div>
            </div>
            {editMonthlySalary > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Daily wage auto-calculated: ₹{Math.round(Number(editMonthlySalary) / 26)}/day
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => setEditingEmployee(null)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Save
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deletingEmployee}
        onClose={() => setDeletingEmployee(null)}
        title="Delete Employee"
        size="sm"
      >
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Are you sure you want to delete <strong>{deletingEmployee?.full_name}</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setDeletingEmployee(null)}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
