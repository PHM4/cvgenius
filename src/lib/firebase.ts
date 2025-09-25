import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

type ConfigEntries = [keyof typeof firebaseConfig, unknown];

const missingConfigEntries = (Object.entries(firebaseConfig) as ConfigEntries[])
  .filter(([, value]) => !value);

export const isFirebaseConfigured = missingConfigEntries.length === 0;

if (!isFirebaseConfigured) {
  const missingKeys = missingConfigEntries.map(([key]) => key).join(', ');
  console.warn(`Firebase is not fully configured. Missing keys: ${missingKeys}`);
}

let app: FirebaseApp | undefined;
let authInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;

if (isFirebaseConfigured) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  authInstance = getAuth(app);
  firestoreInstance = getFirestore(app);
}

export const auth = authInstance;
export const db = firestoreInstance;

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
