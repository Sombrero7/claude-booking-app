import {
  collection,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  DocumentReference,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

/**
 * Add a document to a collection
 */
export const addDocument = async (
  collectionName: string,
  data: DocumentData
): Promise<DocumentReference<DocumentData>> => {
  try {
    return await addDoc(collection(firestore, collectionName), data);
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Set a document with a specific ID
 */
export const setDocumentWithId = async (
  collectionName: string,
  id: string,
  data: DocumentData
): Promise<void> => {
  try {
    await setDoc(doc(firestore, collectionName, id), data);
  } catch (error) {
    console.error(`Error setting document in ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Get a document by ID
 */
export const getDocumentById = async (
  collectionName: string,
  id: string
): Promise<DocumentSnapshot<DocumentData>> => {
  try {
    return await getDoc(doc(firestore, collectionName, id));
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Update a document by ID
 */
export const updateDocumentById = async (
  collectionName: string,
  id: string,
  data: DocumentData
): Promise<void> => {
  try {
    await updateDoc(doc(firestore, collectionName, id), data);
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Delete a document by ID
 */
export const deleteDocumentById = async (
  collectionName: string,
  id: string
): Promise<void> => {
  try {
    await deleteDoc(doc(firestore, collectionName, id));
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Query documents with filters
 */
export const queryDocuments = async (
  collectionName: string,
  filters: Array<{ field: string; operator: string; value: any }>,
  orderByField?: string,
  orderDirection?: 'asc' | 'desc',
  limitCount?: number
): Promise<QuerySnapshot<DocumentData>> => {
  try {
    // Build query with filters
    let q = collection(firestore, collectionName);
    
    if (filters && filters.length > 0) {
      // @ts-ignore: Dynamic where conditions
      q = query(q, ...filters.map(f => where(f.field, f.operator, f.value)));
    }
    
    // Add ordering if specified
    if (orderByField) {
      q = query(q, orderBy(orderByField, orderDirection || 'asc'));
    }
    
    // Add limit if specified
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    
    return await getDocs(q);
  } catch (error) {
    console.error(`Error querying documents from ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Convert Firebase timestamp to JavaScript Date
 */
export const timestampToDate = (timestamp: Timestamp): Date => {
  return timestamp.toDate();
};

/**
 * Convert JavaScript Date to Firebase timestamp
 */
export const dateToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};