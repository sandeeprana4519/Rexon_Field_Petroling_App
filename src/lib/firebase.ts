import { initializeApp, getApps, getApp, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

/**
 * Firebase Client Configuration
 * Loaded securely from Vite environment variables (VITE_FIREBASE_*)
 * Never hardcode private keys or credentials.
 */
const rawConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim() || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim() || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim() || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim() || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim() || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim() || ''
};

/**
 * Validation check to determine if real Firebase configuration has been supplied.
 * Checks for presence of mandatory apiKey and projectId, and filters out obvious placeholders.
 */
export const validateFirebaseConfig = (config: typeof rawConfig): { isValid: boolean; missingKeys: string[] } => {
  const missingKeys: string[] = [];

  if (!config.apiKey || config.apiKey.includes('MY_') || config.apiKey === '') {
    missingKeys.push('VITE_FIREBASE_API_KEY');
  }
  if (!config.authDomain || config.authDomain.includes('MY_') || config.authDomain === '') {
    missingKeys.push('VITE_FIREBASE_AUTH_DOMAIN');
  }
  if (!config.projectId || config.projectId.includes('MY_') || config.projectId === '') {
    missingKeys.push('VITE_FIREBASE_PROJECT_ID');
  }
  if (!config.storageBucket || config.storageBucket.includes('MY_') || config.storageBucket === '') {
    missingKeys.push('VITE_FIREBASE_STORAGE_BUCKET');
  }
  if (!config.messagingSenderId || config.messagingSenderId.includes('MY_') || config.messagingSenderId === '') {
    missingKeys.push('VITE_FIREBASE_MESSAGING_SENDER_ID');
  }
  if (!config.appId || config.appId.includes('MY_') || config.appId === '') {
    missingKeys.push('VITE_FIREBASE_APP_ID');
  }

  return {
    isValid: missingKeys.length === 0,
    missingKeys
  };
};

const validation = validateFirebaseConfig(rawConfig);
export const isFirebaseConfigured = validation.isValid;
export const missingFirebaseConfigKeys = validation.missingKeys;

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  try {
    const firebaseOptions: FirebaseOptions = {
      apiKey: rawConfig.apiKey,
      authDomain: rawConfig.authDomain,
      projectId: rawConfig.projectId,
      storageBucket: rawConfig.storageBucket,
      messagingSenderId: rawConfig.messagingSenderId,
      appId: rawConfig.appId
    };

    appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseOptions);
    authInstance = getAuth(appInstance);
    dbInstance = getFirestore(appInstance);
    storageInstance = getStorage(appInstance);
    console.info('[Firebase] SDK successfully initialized for project:', rawConfig.projectId);
  } catch (error) {
    console.error('[Firebase] Initialization error:', error);
    appInstance = null;
    authInstance = null;
    dbInstance = null;
    storageInstance = null;
  }
} else {
  console.info(
    '[Firebase] Real configuration not yet detected. The application will continue running in local persistence fallback mode until Firebase credentials are provided.',
    { missingKeys: validation.missingKeys }
  );
}

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;
export const storage = storageInstance;
export const firebaseConfig = isFirebaseConfigured ? rawConfig : null;
