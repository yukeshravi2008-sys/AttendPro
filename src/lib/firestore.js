import { db } from './firebase';
import {
  doc, getDoc, collection, getDocs, query, where,
  setDoc, updateDoc, deleteDoc,
  orderBy, onSnapshot,
} from 'firebase/firestore';

export async function getDocument(collectionName, id) {
  if (!id) return null;
  const ref = doc(db, collectionName, id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() };
  }
  return null;
}

export const setDocument = async (collectionName, id, data) => {
  await setDoc(doc(db, collectionName, id), data, { merge: true });
};

export const updateDocument = async (collectionName, id, data) => {
  await updateDoc(doc(db, collectionName, id), data);
};

export const deleteDocument = async (collectionName, id) => {
  await deleteDoc(doc(db, collectionName, id));
};

export const addDocument = async (collectionName, id, data) => {
  await setDoc(doc(db, collectionName, id), data);
};

export const queryDocuments = async (collectionName, field, operator, value) => {
  const q = query(collection(db, collectionName), where(field, operator, value));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const queryDocumentsWithOrder = async (collectionName, conditions, orderByField, orderDirection = 'desc') => {
  try {
    let q = collection(db, collectionName);
    conditions.forEach(([field, operator, value]) => {
      q = query(q, where(field, operator, value));
    });
    q = query(q, orderBy(orderByField, orderDirection));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    if (error.code === 'failed-precondition' || error.message?.includes('index') || error.message?.includes('INDEX')) {
      console.warn(`[Firestore] Composite index missing for ${collectionName}. Using high-performance in-memory fallback.`);
      
      const equalityConditions = [];
      const rangeConditions = [];
      
      conditions.forEach(cond => {
        const [_, operator] = cond;
        if (operator === '==') {
          equalityConditions.push(cond);
        } else {
          rangeConditions.push(cond);
        }
      });
      
      let fallbackQuery = collection(db, collectionName);
      equalityConditions.forEach(([field, operator, value]) => {
        fallbackQuery = query(fallbackQuery, where(field, operator, value));
      });
      
      const snapshot = await getDocs(fallbackQuery);
      let results = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      rangeConditions.forEach(([field, operator, value]) => {
        results = results.filter(docData => {
          const docValue = docData[field];
          if (docValue === undefined || docValue === null) return false;
          switch (operator) {
            case '>': return docValue > value;
            case '>=': return docValue >= value;
            case '<': return docValue < value;
            case '<=': return docValue <= value;
            case '!=': return docValue !== value;
            default: return true;
          }
        });
      });
      
      results.sort((a, b) => {
        const valA = a[orderByField];
        const valB = b[orderByField];
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        
        if (valA < valB) return orderDirection === 'asc' ? -1 : 1;
        if (valA > valB) return orderDirection === 'asc' ? 1 : -1;
        return 0;
      });
      
      return results;
    }
    throw error;
  }
};

export const getAllDocuments = async (collectionName) => {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const subscribeToCollection = (collectionName, callback, conditions = []) => {
  let q = collection(db, collectionName);
  conditions.forEach(([field, operator, value]) => {
    q = query(q, where(field, operator, value));
  });
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(data);
  });
  return unsubscribe;
};

export const subscribeToDocument = (collectionName, id, callback) => {
  const docRef = doc(db, collectionName, id);
  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    callback(docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null);
  });
  return unsubscribe;
};
