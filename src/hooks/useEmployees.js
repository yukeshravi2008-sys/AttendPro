import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { addDocument, getAllDocuments, queryDocuments, updateDocument, deleteDocument } from '../lib/firestore';
import { auth } from '../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function useEmployees() {
  const { user, companyId, role } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchEmployees = useCallback(async () => {
    if (!companyId && role !== 'superadmin') return;
    setLoading(true);
    try {
      let data;
      if (role === 'superadmin') {
        data = await getAllDocuments('users');
      } else {
        data = await queryDocuments('users', 'company_id', '==', companyId);
      }
      setEmployees(data.filter(e => e.role === 'employee'));
    } finally {
      setLoading(false);
    }
  }, [companyId, role]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const addEmployee = useCallback(async (employeeData) => {
    if (!companyId) throw new Error('No company selected');
    const cred = await createUserWithEmailAndPassword(auth, employeeData.email, employeeData.password || 'password123');
    await addDocument('users', cred.user.uid, {
      company_id: companyId,
      full_name: employeeData.full_name,
      email: employeeData.email,
      phone: employeeData.phone || '',
      role: 'employee',
      status: 'active',
      profile_photo: '',
      created_at: new Date().toISOString(),
    });
    await fetchEmployees();
    return cred.user.uid;
  }, [companyId, fetchEmployees]);

  const updateEmployee = useCallback(async (employeeId, data) => {
    await updateDocument('users', employeeId, data);
    await fetchEmployees();
  }, [fetchEmployees]);

  const deleteEmployee = useCallback(async (employeeId) => {
    await deleteDocument('users', employeeId);
    await fetchEmployees();
  }, [fetchEmployees]);

  return {
    employees,
    loading,
    fetchEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
  };
}
