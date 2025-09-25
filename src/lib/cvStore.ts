import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Firestore,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { type CVData, type SavedCVDocument, type SavedCVSummary } from '../types/cv.types';

export interface SaveCVInput {
  id?: string;
  name: string;
  data: CVData;
}

function getDb(): Firestore {
  const firestore = db;
  if (!firestore) {
    throw new Error('Firestore is unavailable. Ensure Firebase is configured.');
  }
  return firestore;
}

function getCvCollection(uid: string) {
  const firestore = getDb();
  return collection(firestore, 'users', uid, 'cvs');
}

function toDate(value: unknown) {
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  return undefined;
}

export async function listUserCVs(uid: string): Promise<SavedCVSummary[]> {
  const colRef = getCvCollection(uid);
  const cvQuery = query(colRef, orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(cvQuery);

  return snapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data();

    return {
      id: docSnapshot.id,
      name: (data.name as string | undefined) ?? 'Untitled CV',
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } satisfies SavedCVSummary;
  });
}

export async function loadUserCV(uid: string, cvId: string): Promise<SavedCVDocument | null> {
  const docRef = doc(getCvCollection(uid), cvId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();

  return {
    id: snapshot.id,
    name: (data.name as string | undefined) ?? 'Untitled CV',
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    data: data.data as CVData,
  } satisfies SavedCVDocument;
}

export async function saveUserCV(uid: string, input: SaveCVInput): Promise<string> {
  const colRef = getCvCollection(uid);
  const docRef = input.id ? doc(colRef, input.id) : doc(colRef);

  const payload: Record<string, unknown> = {
    name: input.name,
    data: input.data,
    updatedAt: serverTimestamp(),
  };

  if (!input.id) {
    payload.createdAt = serverTimestamp();
  }

  await setDoc(docRef, payload, { merge: Boolean(input.id) });

  return docRef.id;
}
