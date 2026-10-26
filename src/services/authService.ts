import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../utils/storage';
import { DEMO_OFFICERS } from '../data/demoData';

export type UserRole = 'admin' | 'field_officer';

export interface AppUserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  companyId: string;
  officerId?: string;
  createdAt?: string;
}

export interface AuthSessionState {
  user: AppUserProfile | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  isFirebaseBacked: boolean;
  error: string | null;
}

/**
 * Fetch server-verified user profile and role from Firestore.
 * The client cannot write or elevate its own role; the role is stored in /users/{uid}
 * governed by Firestore Security Rules.
 */
export const fetchUserProfile = async (uid: string): Promise<AppUserProfile | null> => {
  if (!db || !isFirebaseConfigured) return null;

  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      const data = snap.data();
      return {
        uid,
        email: data.email || '',
        displayName: data.displayName || 'User',
        role: (data.role === 'admin' ? 'admin' : 'field_officer') as UserRole,
        companyId: data.companyId || 'rexon-demo-company',
        officerId: data.officerId,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      };
    }

    return null;
  } catch (err) {
    console.warn('[AuthService] Could not fetch Firestore user profile:', err);
    return null;
  }
};

/**
 * Sign in using Firebase Authentication Email/Password.
 * Returns the authenticated AppUserProfile on success.
 */
export const signInWithEmail = async (email: string, pass: string): Promise<AppUserProfile> => {
  const cleanEmail = email.trim();
  const cleanPass = pass.trim();

  if (isFirebaseConfigured && auth) {
    // 1. Production Path: Real Firebase Authentication
    const credential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
    const fbUser = credential.user;

    // Fetch verified profile from Firestore
    const profile = await fetchUserProfile(fbUser.uid);

    if (profile) {
      return profile;
    }

    // Default profile fallback if Firestore document is still pending initialization
    return {
      uid: fbUser.uid,
      email: fbUser.email || cleanEmail,
      displayName: fbUser.displayName || cleanEmail.split('@')[0],
      role: 'field_officer', // Safe least-privilege default (never default to admin)
      companyId: 'rexon-demo-company'
    };
  }

  // 2. Fallback Path: Existing Demo Authentication (used when Firebase credentials are not yet supplied)
  const matchedOfficer = DEMO_OFFICERS.find(
    (o) =>
      o.email?.toLowerCase() === cleanEmail.toLowerCase() ||
      o.employeeId.toLowerCase() === cleanEmail.toLowerCase() ||
      o.badgeNumber.toLowerCase() === cleanEmail.toLowerCase()
  );

  if (matchedOfficer && (matchedOfficer.password || 'rexon123') === cleanPass) {
    saveToStorage(STORAGE_KEYS.OFFICER_AUTH, matchedOfficer.id);
    return {
      uid: matchedOfficer.id,
      email: matchedOfficer.email || `${matchedOfficer.name.toLowerCase()}@rexon.com`,
      displayName: matchedOfficer.name,
      role: 'field_officer',
      companyId: 'rexon-demo-company',
      officerId: matchedOfficer.id
    };
  }

  // Check Admin Demo login
  if (cleanEmail.toLowerCase().includes('admin') || cleanEmail.toLowerCase().includes('owner')) {
    if (cleanPass === 'admin123' || cleanPass === 'rexon123') {
      return {
        uid: 'admin-owner-demo',
        email: cleanEmail,
        displayName: 'Security Operations Owner',
        role: 'admin',
        companyId: 'rexon-demo-company'
      };
    }
  }

  throw new Error('Invalid email or password. Please verify credentials.');
};

/**
 * Sign out user from Firebase Auth and clear local session state
 */
export const signOutUser = async (): Promise<void> => {
  if (isFirebaseConfigured && auth) {
    await signOut(auth);
  }
  saveToStorage(STORAGE_KEYS.OFFICER_AUTH, null);
};

/**
 * Subscribe to authentication state changes.
 * Supports real Firebase Auth observer with fallback to local storage session.
 */
export const subscribeToAuth = (
  callback: (session: { user: AppUserProfile | null; isFirebaseBacked: boolean }) => void
): (() => void) => {
  if (isFirebaseConfigured && auth) {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const profile = await fetchUserProfile(fbUser.uid);
        callback({
          user: profile || {
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || 'User',
            role: 'field_officer', // least-privilege default
            companyId: 'rexon-demo-company'
          },
          isFirebaseBacked: true
        });
      } else {
        callback({ user: null, isFirebaseBacked: true });
      }
    });

    return unsubscribe;
  }

  // Fallback observer using existing storage session
  const storedOfficerId = loadFromStorage<string | null>(STORAGE_KEYS.OFFICER_AUTH, null);
  if (storedOfficerId) {
    const officer = DEMO_OFFICERS.find((o) => o.id === storedOfficerId);
    if (officer) {
      callback({
        user: {
          uid: officer.id,
          email: officer.email || `${officer.name.toLowerCase()}@rexon.com`,
          displayName: officer.name,
          role: 'field_officer',
          companyId: 'rexon-demo-company',
          officerId: officer.id
        },
        isFirebaseBacked: false
      });
      return () => {};
    }
  }

  callback({ user: null, isFirebaseBacked: false });
  return () => {};
};
