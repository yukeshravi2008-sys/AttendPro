import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged, signInWithEmailAndPassword, signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrCreateUserDoc = async (firebaseUser) => {
    const ref = doc(db, 'users', firebaseUser.uid);
    const snap = await getDoc(ref);

    let profileData;
    if (snap.exists()) {
      profileData = snap.data();
    } else {
      // Auto-create missing profile
      profileData = {
        full_name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
        email: firebaseUser.email,
        role: 'superadmin',
        company_id: '',
        phone: '',
        status: 'active',
        profile_photo: '',
        created_at: serverTimestamp(),
      };
      await setDoc(ref, profileData);
      console.log('[AuthContext] Created missing user profile in Firestore');
    }

    // Auto-seed missing company if it doesn't exist
    const companyId = profileData?.company_id || profileData?.companyId;
    if (companyId && typeof companyId === 'string' && companyId.trim() !== '') {
      const cleanCompanyId = companyId.trim();
      const companyRef = doc(db, 'companies', cleanCompanyId, 'companies', cleanCompanyId);
      const companySnap = await getDoc(companyRef);
      if (!companySnap.exists()) {
        console.log(`[AuthContext] Seeding missing company document for ID: ${cleanCompanyId}`);
        await setDoc(companyRef, {
          company_name: 'AttendPro Headquarters',
          address: '100 Silicon Valley Blvd, San Jose, CA',
          latitude: 37.3382,
          longitude: -121.8863,
          allowed_radius: 500,
          created_at: new Date().toISOString(),
        });
      }
    }

    return profileData;
  };

  useEffect(() => {
    if (!auth) {
      console.warn('[AuthContext] Firebase auth not available');
      setLoading(false);
      setError('Firebase is not initialized. Check environment variables.');
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          console.log('[AuthContext] Auth UID:', firebaseUser.uid);
          const data = await fetchOrCreateUserDoc(firebaseUser);
          console.log('========== USER DEBUG ==========');
          console.log('UID:', firebaseUser.uid);
          console.log('Firestore Data:', data);
          console.log('Role:', data?.role);
          console.log('================================');
          setUser(firebaseUser);
          setUserData(data);
        } else {
          setUser(null);
          setUserData(null);
        }
      } catch (err) {
        console.error('[AuthContext] Error in auth state change:', err);
        setUser(firebaseUser || null);
        setUserData(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = useCallback(async (email, password) => {
    if (!auth) throw new Error('Firebase auth not initialized');
    const result = await signInWithEmailAndPassword(auth, email, password);
    const data = await fetchOrCreateUserDoc(result.user);
    setUserData(data);
    return { user: result.user, userData: data };
  }, []);

  const logout = useCallback(async () => {
    if (!auth) return;
    await signOut(auth);
    setUser(null);
    setUserData(null);
  }, []);

  const refreshUserData = useCallback(async () => {
    if (user) {
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) setUserData(snap.data());
    }
  }, [user]);

  const roleValue = userData?.role || userData?.Role || null;
  const companyIdValue = userData?.company_id || userData?.companyId || null;

  const value = {
    user,
    userData,
    role: roleValue && typeof roleValue === 'string' ? roleValue.toLowerCase() : roleValue,
    companyId: companyIdValue && typeof companyIdValue === 'string' ? companyIdValue.trim() : companyIdValue,
    loading,
    error,
    login,
    logout,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}