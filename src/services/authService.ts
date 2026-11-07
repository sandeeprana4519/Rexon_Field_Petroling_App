import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
  getAuth
} from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured, firebaseConfig } from '../lib/firebase';
import { DEFAULT_COMPANY_ID } from './firestoreService';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../utils/storage';
import { DEMO_OFFICERS } from '../data/demoData';

export type UserRole = 'admin' | 'company' | 'field_officer';

// Configured Authorized Admin UID & Whitelist
export const AUTHORIZED_ADMIN_UID = 'CRGIZ0zLonatw6METbQ0UB2T1lf1';

export const AUTHORIZED_ADMIN_EMAILS = [
  'admin.sandeep@rexon.com',
  'sandeeprana4519@gmail.com',
  'admin@rexonsecurity.com',
  'admin@rexon.com'
].map((e) => e.toLowerCase());

export const isAuthorizedAdmin = (uid?: string | null, email?: string | null): boolean => {
  if (uid && uid === AUTHORIZED_ADMIN_UID) return true;
  if (email && AUTHORIZED_ADMIN_EMAILS.includes(email.trim().toLowerCase())) return true;
  return false;
};

export interface AppUserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: 'active' | 'deactivated';
  companyId: string;
  isApproved?: boolean;
  officerId?: string;
  photoURL?: string;
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
 * Structure: /users/{uid} -> { uid, email, role, status, companyId, officerId }
 */
export const fetchUserProfile = async (uid: string): Promise<AppUserProfile | null> => {
  if (!db || !isFirebaseConfigured) return null;

  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      const data = snap.data();
      const isAdminByUid = uid === AUTHORIZED_ADMIN_UID;
      const isAdminByEmail = isAuthorizedAdmin(uid, data.email);
      const resolvedRole: UserRole =
        isAdminByUid || isAdminByEmail || data.role === 'admin'
          ? 'admin'
          : data.role === 'company'
          ? 'company'
          : 'field_officer';

      return {
        uid,
        email: data.email || '',
        displayName:
          data.displayName ||
          (resolvedRole === 'admin'
            ? 'Super Administrator'
            : resolvedRole === 'company'
            ? 'Company Portal User'
            : 'Field Officer'),
        role: resolvedRole,
        status: data.status === 'deactivated' ? 'deactivated' : 'active',
        companyId: data.companyId || DEFAULT_COMPANY_ID,
        isApproved: data.isApproved !== false,
        officerId: data.officerId,
        photoURL: data.photoURL,
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
 * Creates or updates user document in Firestore (/users/{uid})
 * adhering to the required schema:
 * { uid, email, role, status, companyId, officerId }
 */
export const createUserProfileInFirestore = async (
  fbUser: { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null },
  role: UserRole = 'admin',
  companyId: string = DEFAULT_COMPANY_ID,
  extraDisplayName?: string,
  status: 'active' | 'deactivated' = 'active',
  officerId?: string
): Promise<AppUserProfile> => {
  const isSuper = fbUser.uid === AUTHORIZED_ADMIN_UID || isAuthorizedAdmin(fbUser.uid, fbUser.email);
  const resolvedRole = isSuper ? 'admin' : role;

  const profile: AppUserProfile = {
    uid: fbUser.uid,
    email: fbUser.email || '',
    displayName:
      extraDisplayName?.trim() ||
      fbUser.displayName ||
      fbUser.email?.split('@')[0] ||
      (resolvedRole === 'admin'
        ? 'Super Administrator'
        : resolvedRole === 'company'
        ? 'Company Portal'
        : 'Field Officer'),
    role: resolvedRole,
    status,
    companyId,
    officerId,
    isApproved: true,
    photoURL: fbUser.photoURL || undefined,
    createdAt: new Date().toISOString()
  };

  if (db && isFirebaseConfigured) {
    try {
      const userDocRef = doc(db, 'users', fbUser.uid);
      await setDoc(
        userDocRef,
        {
          uid: profile.uid,
          email: profile.email,
          displayName: profile.displayName,
          role: profile.role,
          status: profile.status,
          companyId: profile.companyId,
          officerId: profile.officerId || null,
          isApproved: profile.isApproved,
          photoURL: profile.photoURL || null,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('[AuthService] Could not write user profile doc in Firestore:', err);
    }
  }

  return profile;
};

/**
 * Creates a new user in Firebase Authentication and Firestore (/users/{uid})
 * using an isolated secondary Firebase App instance.
 * CRITICAL: This preserves the currently logged-in Admin session completely!
 */
export interface CreateUserAccountParams {
  email: string;
  password?: string;
  role: 'company' | 'field_officer';
  companyId: string;
  officerId?: string;
  displayName?: string;
}

export const createFirebaseUserAccount = async (
  params: CreateUserAccountParams
): Promise<{ uid: string; email: string }> => {
  const cleanEmail = params.email.trim();
  const cleanPass = params.password?.trim() || 'rexon123';

  if (!cleanEmail) {
    throw new Error('Email is required to create account.');
  }

  let newUid = `user-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // 1. Create in Firebase Auth using isolated secondary app instance
  if (isFirebaseConfigured && firebaseConfig) {
    try {
      const secondaryAppName = `SecondaryApp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);

      try {
        const cred = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, cleanPass);
        newUid = cred.user.uid;
      } finally {
        await signOut(secondaryAuth).catch(() => {});
        await deleteApp(secondaryApp).catch(() => {});
      }
    } catch (authErr: any) {
      if (authErr?.code === 'auth/email-already-in-use') {
        console.info('[AuthService] User account already exists in Firebase Auth; proceeding to link profile.');
      } else {
        console.warn('[AuthService] Secondary Auth creation notice:', authErr?.message || authErr);
      }
    }
  }

  // 2. Save profile in Firebase Database structure: /users/{newUid}
  if (db && isFirebaseConfigured) {
    try {
      const userDocRef = doc(db, 'users', newUid);
      await setDoc(
        userDocRef,
        {
          uid: newUid,
          email: cleanEmail,
          displayName: params.displayName || cleanEmail.split('@')[0],
          role: params.role,
          companyId: params.companyId || DEFAULT_COMPANY_ID,
          officerId: params.officerId || null,
          status: 'active',
          isApproved: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    } catch (err: any) {
      console.warn('[AuthService] Could not write user doc in Firestore:', err);
    }
  }

  return { uid: newUid, email: cleanEmail };
};

/**
 * Sign in using Firebase Authentication Email/Password.
 * Strictly verifies UID and assigned role in Firebase Database.
 */
export const signInWithEmail = async (email: string, pass: string): Promise<AppUserProfile> => {
  const cleanEmail = email.trim();
  const cleanPass = pass.trim();

  if (!cleanEmail) {
    throw new Error('कृपया ईमेल दर्ज करें (Please enter email).');
  }
  if (!cleanPass) {
    throw new Error('कृपया पासवर्ड दर्ज करें (Please enter password).');
  }

  if (isFirebaseConfigured && auth) {
    // 1. Production Path: Real Firebase Authentication
    const credential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
    const fbUser = credential.user;

    const isAdminByUid = fbUser.uid === AUTHORIZED_ADMIN_UID;
    const isAdminByEmail = isAuthorizedAdmin(fbUser.uid, fbUser.email);

    let profile = await fetchUserProfile(fbUser.uid);

    // Case A: Super Admin Account
    if (isAdminByUid || isAdminByEmail || profile?.role === 'admin') {
      if (!profile || profile.role !== 'admin') {
        profile = await createUserProfileInFirestore(
          fbUser,
          'admin',
          DEFAULT_COMPANY_ID,
          'Super Administrator',
          'active'
        );
      }
      saveToStorage(STORAGE_KEYS.ADMIN_AUTH, true);
      return profile;
    }

    // Case B: Company Account
    if (profile?.role === 'company') {
      if (profile.status === 'deactivated') {
        await signOut(auth);
        saveToStorage(STORAGE_KEYS.ADMIN_AUTH, false);
        throw new Error('Access Denied: This company account is currently deactivated (अकाउंट निष्क्रिय है).');
      }
      return profile;
    }

    // Case C: Field Officer Account
    if (profile?.role === 'field_officer') {
      if (profile.status === 'deactivated' || profile.isApproved === false) {
        await signOut(auth);
        saveToStorage(STORAGE_KEYS.ADMIN_AUTH, false);
        saveToStorage(STORAGE_KEYS.OFFICER_AUTH, null);
        throw new Error('Access Denied / Not Approved by Admin: आपका खाता एडमिन द्वारा स्वीकृत नहीं है या निष्क्रिय है।');
      }
      saveToStorage(STORAGE_KEYS.OFFICER_AUTH, profile.officerId || profile.uid);
      return profile;
    }

    // Self-heal demo officer if email matches
    const matchedOfficer = DEMO_OFFICERS.find((o) => o.email?.toLowerCase() === cleanEmail.toLowerCase());
    if (matchedOfficer) {
      profile = await createUserProfileInFirestore(
        fbUser,
        'field_officer',
        DEFAULT_COMPANY_ID,
        matchedOfficer.name,
        'active',
        matchedOfficer.id
      );
      saveToStorage(STORAGE_KEYS.OFFICER_AUTH, matchedOfficer.id);
      return profile;
    }

    // User is authenticated, but no authorized role exists in database
    await signOut(auth);
    saveToStorage(STORAGE_KEYS.ADMIN_AUTH, false);
    saveToStorage(STORAGE_KEYS.OFFICER_AUTH, null);
    throw new Error('Access Denied: You are authenticated, but not authorized for this portal (UID/Role mismatch).');
  }

  // 2. Fallback Path: Existing Demo Authentication (used when Firebase credentials are not yet supplied)
  const matchedOfficer = DEMO_OFFICERS.find(
    (o) =>
      o.email?.toLowerCase() === cleanEmail.toLowerCase() ||
      o.employeeId.toLowerCase() === cleanEmail.toLowerCase() ||
      o.badgeNumber.toLowerCase() === cleanEmail.toLowerCase()
  );

  if (matchedOfficer && (matchedOfficer.password || 'rexon123') === cleanPass) {
    if (matchedOfficer.isApproved === false) {
      throw new Error('Access Denied / Not Approved by Admin: आपका खाता एडमिन द्वारा स्वीकृत (Approved) नहीं है।');
    }
    if (matchedOfficer.employmentStatus === 'deactivated' || matchedOfficer.isActive === false) {
      throw new Error(`Access Denied: ऑफिसर "${matchedOfficer.name}" का खाता निष्क्रिय (Deactivated) है।`);
    }

    saveToStorage(STORAGE_KEYS.OFFICER_AUTH, matchedOfficer.id);
    return {
      uid: matchedOfficer.id,
      email: matchedOfficer.email || `${matchedOfficer.name.toLowerCase()}@rexon.com`,
      displayName: matchedOfficer.name,
      role: 'field_officer',
      status: 'active',
      companyId: DEFAULT_COMPANY_ID,
      officerId: matchedOfficer.id,
      isApproved: true
    };
  }

  // Check Admin Demo login (Fixed Admin Emails or default rexon credentials)
  if (
    isAuthorizedAdmin(null, cleanEmail) ||
    cleanEmail.toLowerCase().includes('admin') ||
    cleanEmail.toLowerCase().includes('owner')
  ) {
    saveToStorage(STORAGE_KEYS.ADMIN_AUTH, true);
    return {
      uid: AUTHORIZED_ADMIN_UID,
      email: cleanEmail,
      displayName: 'Super Administrator',
      role: 'admin',
      status: 'active',
      companyId: DEFAULT_COMPANY_ID,
      isApproved: true
    };
  }

  throw new Error('Invalid email or password. Please verify credentials.');
};

/**
 * Public registration is DISABLED by strict system policy.
 */
export const registerWithEmail = async (
  _email?: string,
  _pass?: string,
  _displayName?: string
): Promise<never> => {
  throw new Error('पब्लिक साइन-अप बंद है। केवल अधिकृत सुपर एडमिन ही लॉगिन कर सकते हैं और फील्ड ऑफिसर्स को एडमिन द्वारा ही अधिकृत किया जाता है (Public registration is disabled).');
};

/**
 * Sign out user from Firebase Auth and clear local session state
 */
export const signOutUser = async (): Promise<void> => {
  if (isFirebaseConfigured && auth) {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('[AuthService] Error during Firebase signOut:', err);
    }
  }
  saveToStorage(STORAGE_KEYS.ADMIN_AUTH, false);
  saveToStorage(STORAGE_KEYS.OFFICER_AUTH, null);
};

/**
 * Subscribe to authentication state changes.
 * Supports real Firebase Auth observer with fallback to local storage session.
 */
export const subscribeToAuth = (
  callback: (session: {
    user: AppUserProfile | null;
    firebaseUser: FirebaseUser | null;
    isFirebaseBacked: boolean;
  }) => void
): (() => void) => {
  if (isFirebaseConfigured && auth) {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const isAdminUser = isAuthorizedAdmin(fbUser.uid, fbUser.email);
        let profile = await fetchUserProfile(fbUser.uid);
        if (!profile && isAdminUser) {
          profile = await createUserProfileInFirestore(
            fbUser,
            'admin',
            DEFAULT_COMPANY_ID,
            'Super Administrator',
            'active'
          );
        }

        // If user is deactivated or not approved, force sign out
        if (!isAdminUser && profile && (profile.status === 'deactivated' || profile.isApproved === false)) {
          try {
            await signOut(auth);
          } catch (e) {
            console.warn('[AuthService] signOut error:', e);
          }
          saveToStorage(STORAGE_KEYS.ADMIN_AUTH, false);
          saveToStorage(STORAGE_KEYS.OFFICER_AUTH, null);
          callback({ user: null, firebaseUser: null, isFirebaseBacked: true });
          return;
        }

        callback({
          user: profile,
          firebaseUser: fbUser,
          isFirebaseBacked: true
        });
      } else {
        callback({ user: null, firebaseUser: null, isFirebaseBacked: true });
      }
    });

    return unsubscribe;
  }

  // Fallback observer using existing storage session
  const isStoredAdmin = loadFromStorage<boolean>(STORAGE_KEYS.ADMIN_AUTH, false);
  if (isStoredAdmin) {
    callback({
      user: {
        uid: AUTHORIZED_ADMIN_UID,
        email: 'admin.sandeep@rexon.com',
        displayName: 'Super Administrator',
        role: 'admin',
        status: 'active',
        companyId: DEFAULT_COMPANY_ID
      },
      firebaseUser: null,
      isFirebaseBacked: false
    });
    return () => {};
  }

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
          status: 'active',
          companyId: DEFAULT_COMPANY_ID,
          officerId: officer.id
        },
        firebaseUser: null,
        isFirebaseBacked: false
      });
      return () => {};
    }
  }

  callback({ user: null, firebaseUser: null, isFirebaseBacked: false });
  return () => {};
};

/**
 * Maps Firebase Authentication error codes to user-friendly Hindi & English messages
 */
export const parseAuthError = (error: any): string => {
  if (!error) return 'अज्ञात प्रमाणीकरण त्रुटि (Unknown authentication error).';
  const code = error?.code || '';

  switch (code) {
    case 'auth/invalid-email':
      return 'ईमेल प्रारूप अमान्य है (Invalid email address format).';
    case 'auth/user-disabled':
      return 'यह खाता व्यवस्थापक द्वारा निष्क्रिय कर दिया गया है (This account has been disabled).';
    case 'auth/user-not-found':
      return 'इस ईमेल से कोई खाता नहीं मिला। कृपया ईमेल जांचें (No account found with this email).';
    case 'auth/wrong-password':
      return 'गलत पासवर्ड दर्ज किया गया है (Incorrect password. Please verify and retry).';
    case 'auth/invalid-credential':
      return 'अमान्य क्रेडेंशियल्स: ईमेल या पासवर्ड गलत है (Invalid email or password).';
    case 'auth/email-already-in-use':
      return 'यह ईमेल पहले से पंजीकृत है (Email already registered).';
    case 'auth/weak-password':
      return 'पासवर्ड बहुत कमजोर है। कृपया कम से कम 6 अक्षर दर्ज करें (Password should be at least 6 characters).';
    case 'auth/network-request-failed':
      return 'नेटवर्क कनेक्शन त्रुटि: कृपया इंटरनेट कनेक्शन जांचें (Network error. Check connection).';
    case 'auth/too-many-requests':
      return 'बहुत अधिक असफल प्रयास। कृपया कुछ मिनट बाद पुनः प्रयास करें (Too many attempts. Try again later).';
    case 'auth/operation-not-allowed':
      return 'Firebase Console में यह Sign-in विकल्प सक्षम नहीं है (Provider not enabled in Firebase Console).';
    default:
      return error?.message || 'प्रमाणीकरण त्रुटि (Authentication failed).';
  }
};
