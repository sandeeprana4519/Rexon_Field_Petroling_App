import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { DEFAULT_COMPANY_ID } from './firestoreService';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../utils/storage';
import { DEMO_OFFICERS } from '../data/demoData';

export type UserRole = 'admin' | 'field_officer';

// Fixed Super Admin Identity Whitelist
export const FIXED_ADMIN_EMAILS = [
  'sandeeprana4519@gmail.com', // Primary Super Admin
  'admin@rexonsecurity.com',
  'admin@rexon.com'
].map((e) => e.toLowerCase());

export const isFixedAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return FIXED_ADMIN_EMAILS.includes(clean);
};

export interface AppUserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
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
 * Role is stored in /users/{uid} governed by Firestore Security Rules.
 */
export const fetchUserProfile = async (uid: string): Promise<AppUserProfile | null> => {
  if (!db || !isFirebaseConfigured) return null;

  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      const data = snap.data();
      const isAdminByRole = data.role === 'admin' || isFixedAdminEmail(data.email);
      return {
        uid,
        email: data.email || '',
        displayName: data.displayName || (isAdminByRole ? 'Super Administrator' : 'Field Officer'),
        role: (isAdminByRole ? 'admin' : 'field_officer') as UserRole,
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
 * to satisfy Firestore Security Rules:
 * isAuthenticated() && isCompanyMember(companyId) && isAdmin(companyId)
 */
export const createUserProfileInFirestore = async (
  fbUser: FirebaseUser,
  role: UserRole = 'admin',
  companyId: string = DEFAULT_COMPANY_ID,
  extraDisplayName?: string,
  isApproved: boolean = true
): Promise<AppUserProfile> => {
  const isSuper = role === 'admin' || isFixedAdminEmail(fbUser.email);
  const profile: AppUserProfile = {
    uid: fbUser.uid,
    email: fbUser.email || '',
    displayName: extraDisplayName?.trim() || fbUser.displayName || fbUser.email?.split('@')[0] || (isSuper ? 'Super Administrator' : 'Field Officer'),
    role: isSuper ? 'admin' : role,
    companyId,
    isApproved: isSuper ? true : isApproved,
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
          companyId: profile.companyId,
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
 * Sign in using Firebase Authentication Email/Password.
 * Strictly verifies fixed admin or admin-approved officer role.
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
    const emailLower = (fbUser.email || '').toLowerCase();

    // Check fixed admin identity
    const isAdminUser = isFixedAdminEmail(emailLower);
    let profile = await fetchUserProfile(fbUser.uid);

    if (isAdminUser || profile?.role === 'admin') {
      if (!profile || profile.role !== 'admin') {
        profile = await createUserProfileInFirestore(fbUser, 'admin', DEFAULT_COMPANY_ID, 'Super Administrator', true);
      }
      saveToStorage(STORAGE_KEYS.ADMIN_AUTH, true);
      return profile;
    }

    // Verify if this user is an authorized Field Officer
    if (profile?.role === 'field_officer') {
      if (profile.isApproved === false) {
        await signOut(auth);
        saveToStorage(STORAGE_KEYS.ADMIN_AUTH, false);
        saveToStorage(STORAGE_KEYS.OFFICER_AUTH, null);
        throw new Error('Access Denied / Not Approved by Admin: आपका खाता एडमिन द्वारा स्वीकृत (Approved) नहीं है। कृपया कंट्रोल रूम एडमिन से संपर्क करें।');
      }
      saveToStorage(STORAGE_KEYS.OFFICER_AUTH, profile.officerId || profile.uid);
      return profile;
    }

    // Neither admin nor approved officer -> reject
    await signOut(auth);
    saveToStorage(STORAGE_KEYS.ADMIN_AUTH, false);
    saveToStorage(STORAGE_KEYS.OFFICER_AUTH, null);
    throw new Error('Access Denied: केवल अधिकृत सुपर एडमिन ही इस कंसोल में लॉगिन कर सकते हैं। (Unauthorized user)');
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
      companyId: DEFAULT_COMPANY_ID,
      officerId: matchedOfficer.id,
      isApproved: true
    };
  }

  // Check Admin Demo login (Fixed Admin Emails or default rexon credentials)
  if (isFixedAdminEmail(cleanEmail) || cleanEmail.toLowerCase().includes('admin') || cleanEmail.toLowerCase().includes('owner')) {
    if (cleanPass === 'admin123' || cleanPass === 'rexon123' || cleanPass === 'rexonadmin123') {
      saveToStorage(STORAGE_KEYS.ADMIN_AUTH, true);
      return {
        uid: 'admin-owner-demo',
        email: cleanEmail,
        displayName: 'Super Administrator (Admin Console)',
        role: 'admin',
        companyId: DEFAULT_COMPANY_ID,
        isApproved: true
      };
    }
  }

  throw new Error('Invalid email or password. Please verify credentials.');
};

/**
 * Public registration is DISABLED by strict system policy.
 * Only pre-configured Super Admins can log in; Field Officers are provisioned
 * directly by the Admin from the Field Officers console.
 */
export const registerWithEmail = async (
  _email?: string,
  _pass?: string,
  _displayName?: string
): Promise<never> => {
  throw new Error('पब्लिक साइन-अप बंद है। केवल अधिकृत सुपर एडमिन ही लॉगिन कर सकते हैं और फील्ड ऑफिसर्स को एडमिन द्वारा ही अधिकृत किया जाता है (Public registration is disabled).');
};

/**
 * Sign in using Google Sign-In Popup via Firebase Authentication.
 * Strictly verifies that the authenticated Google account belongs to the Fixed Super Admin.
 */
export const signInWithGoogle = async (): Promise<AppUserProfile> => {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase Authentication is not configured in this environment.');
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  const credential = await signInWithPopup(auth, provider);
  const fbUser = credential.user;
  const emailLower = (fbUser.email || '').toLowerCase();

  // Strict check: Only pre-configured Super Admin is allowed
  const isAdminUser = isFixedAdminEmail(emailLower);
  let profile = await fetchUserProfile(fbUser.uid);

  if (!isAdminUser && profile?.role !== 'admin') {
    await signOut(auth);
    throw new Error(
      `Access Denied: Google खाता (${fbUser.email}) अधिकृत सुपर एडमिन नहीं है। केवल फिक्स्ड सुपर एडमिन (${FIXED_ADMIN_EMAILS[0]}) को ही एडमिन कंसोल का एक्सेस है।`
    );
  }

  // Ensure user profile document exists in Firestore for RBAC rules
  if (!profile) {
    profile = await createUserProfileInFirestore(
      fbUser,
      'admin',
      DEFAULT_COMPANY_ID,
      fbUser.displayName || 'Super Administrator',
      true
    );
  }

  saveToStorage(STORAGE_KEYS.ADMIN_AUTH, true);
  return profile;
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
        const emailLower = (fbUser.email || '').toLowerCase();
        const isAdminUser = isFixedAdminEmail(emailLower);
        let profile = await fetchUserProfile(fbUser.uid);
        if (!profile && isAdminUser) {
          profile = await createUserProfileInFirestore(fbUser, 'admin', DEFAULT_COMPANY_ID, 'Super Administrator', true);
        }

        // If user is an unapproved officer or unauthorized non-admin, force sign out
        if (!isAdminUser && profile?.role !== 'admin' && profile?.isApproved === false) {
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
        uid: 'admin-owner-demo',
        email: 'admin@rexon.com',
        displayName: 'Security Operations Owner',
        role: 'admin',
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
      return 'इस ईमेल से कोई खाता नहीं मिला। कृपया ईमेल जांचें या साइन अप करें (No account found with this email).';
    case 'auth/wrong-password':
      return 'गलत पासवर्ड दर्ज किया गया है (Incorrect password. Please verify and retry).';
    case 'auth/invalid-credential':
      return 'अमान्य क्रेडेंशियल्स: ईमेल या पासवर्ड गलत है (Invalid email or password).';
    case 'auth/email-already-in-use':
      return 'यह ईमेल पहले से पंजीकृत है। कृपया लॉगिन करें (Email already registered. Please log in).';
    case 'auth/weak-password':
      return 'पासवर्ड बहुत कमजोर है। कृपया कम से कम 6 अक्षर दर्ज करें (Password should be at least 6 characters).';
    case 'auth/popup-closed-by-user':
      return 'Google साइन-इन पॉपअप समय से पहले बंद कर दिया गया (Sign-in popup closed before completion).';
    case 'auth/popup-blocked':
      return 'ब्राउज़र ने पॉपअप विंडो ब्लॉक कर दी। कृपया पॉपअप की अनुमति दें (Popup was blocked by your browser).';
    case 'auth/cancelled-popup-request':
      return 'पिछला लॉगिन अनुरोध रद्द कर दिया गया (Popup request was cancelled).';
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
