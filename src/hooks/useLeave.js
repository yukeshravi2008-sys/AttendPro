import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  addDocument, updateDocument,
  queryDocuments, getAllDocuments,
} from '../lib/firestore';

export default function useLeave() {
  const { user, companyId, role } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLeaveRequests = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let data;
      if (role === 'superadmin') {
        data = await getAllDocuments('leave_requests');
      } else if (role === 'admin') {
        data = await queryDocuments('leave_requests', 'company_id', '==', companyId);
      } else {
        data = await queryDocuments('leave_requests', 'employee_id', '==', user.uid);
      }
      data.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
      setLeaveRequests(data);
    } finally {
      setLoading(false);
    }
  }, [user, companyId, role]);

  useEffect(() => {
    fetchLeaveRequests();
  }, [fetchLeaveRequests]);

  const submitLeaveRequest = useCallback(async (leaveData) => {
    if (!user || !companyId) throw new Error('User not authenticated');
    const id = `leave_${user.uid}_${Date.now()}`;
    await addDocument('leave_requests', id, {
      employee_id: user.uid,
      company_id: companyId,
      start_date: leaveData.start_date,
      end_date: leaveData.end_date,
      reason: leaveData.reason,
      type: leaveData.type,
      status: 'pending',
      created_at: new Date().toISOString(),
    });
    await fetchLeaveRequests();
    return id;
  }, [user, companyId, fetchLeaveRequests]);

  const updateLeaveStatus = useCallback(async (leaveId, status) => {
    await updateDocument('leave_requests', leaveId, { status });
    await fetchLeaveRequests();
  }, [fetchLeaveRequests]);

  const getPendingLeaves = useCallback(() => {
    return leaveRequests.filter(l => l.status === 'pending');
  }, [leaveRequests]);

  return {
    leaveRequests,
    loading,
    fetchLeaveRequests,
    submitLeaveRequest,
    updateLeaveStatus,
    getPendingLeaves,
  };
}
