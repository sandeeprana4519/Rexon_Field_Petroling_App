import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import {
  Site,
  FieldOfficer,
  Assignment,
  PatrolReport,
  IncidentRecord,
  PatrolZone,
  ChecklistItem,
  ClientCompany,
  CompanyClientAccount
} from '../types';

export const DEFAULT_COMPANY_ID = 'rexon-security';

/**
 * Deeply normalizes Firestore document payload by removing undefined properties
 * across nested objects, arrays, and sub-documents to prevent Firestore serialization errors.
 */
export const sanitizeDataForFirestore = (val: any): any => {
  if (val === undefined) {
    return null;
  }
  if (val === null || typeof val !== 'object') {
    return val;
  }
  if (val instanceof Date) {
    return val;
  }
  if (Array.isArray(val)) {
    return val
      .filter((item) => item !== undefined)
      .map((item) => sanitizeDataForFirestore(item));
  }

  const cleanObj: Record<string, any> = {};
  for (const [key, prop] of Object.entries(val)) {
    if (prop !== undefined) {
      cleanObj[key] = sanitizeDataForFirestore(prop);
    }
  }
  return cleanObj;
};


// ==========================================
// 1. SITES REPOSITORY
// ==========================================

export const subscribeSites = (
  companyId: string,
  onData: (sites: Site[]) => void,
  onError?: (err: Error) => void
): (() => void) => {
  if (!db || !isFirebaseConfigured) return () => {};

  const colRef = collection(db, 'companies', companyId, 'sites');
  const q = query(colRef, orderBy('name', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const sites: Site[] = [];
      snapshot.forEach((docSnap) => {
        sites.push({ ...docSnap.data(), id: docSnap.id } as Site);
      });
      onData(sites);
    },
    (error) => {
      console.error('[Firestore] Sites subscription error:', error);
      onError?.(error);
    }
  );
};

export const saveSiteToFirestore = async (companyId: string, site: Site): Promise<void> => {
  if (!db || !isFirebaseConfigured) {
    throw new Error('Cloud Firestore is not initialized or configured.');
  }

  const docRef = doc(db, 'companies', companyId, 'sites', site.id);
  const payload = {
    ...sanitizeDataForFirestore(site),
    updatedAt: serverTimestamp()
  };

  await setDoc(docRef, payload, { merge: true });
};

export const deleteSiteFromFirestore = async (companyId: string, siteId: string): Promise<void> => {
  if (!db || !isFirebaseConfigured) {
    throw new Error('Cloud Firestore is not initialized or configured.');
  }

  const docRef = doc(db, 'companies', companyId, 'sites', siteId);
  await deleteDoc(docRef);
};

// ==========================================
// 2. FIELD OFFICERS REPOSITORY
// ==========================================

export const subscribeOfficers = (
  companyId: string,
  onData: (officers: FieldOfficer[]) => void,
  onError?: (err: Error) => void
): (() => void) => {
  if (!db || !isFirebaseConfigured) return () => {};

  const colRef = collection(db, 'companies', companyId, 'officers');
  const q = query(colRef, orderBy('name', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const officers: FieldOfficer[] = [];
      snapshot.forEach((docSnap) => {
        officers.push({ ...docSnap.data(), id: docSnap.id } as FieldOfficer);
      });
      onData(officers);
    },
    (error) => {
      console.error('[Firestore] Officers subscription error:', error);
      onError?.(error);
    }
  );
};

export const saveOfficerToFirestore = async (companyId: string, officer: FieldOfficer): Promise<void> => {
  if (!db || !isFirebaseConfigured) {
    throw new Error('Cloud Firestore is not initialized or configured.');
  }

  const docRef = doc(db, 'companies', companyId, 'officers', officer.id);
  const payload = {
    ...sanitizeDataForFirestore(officer),
    updatedAt: serverTimestamp()
  };

  await setDoc(docRef, payload, { merge: true });
};

export const deleteOfficerFromFirestore = async (companyId: string, officerId: string): Promise<void> => {
  if (!db || !isFirebaseConfigured) {
    throw new Error('Cloud Firestore is not initialized or configured.');
  }

  const docRef = doc(db, 'companies', companyId, 'officers', officerId);
  await deleteDoc(docRef);
};

export const saveCompanyConfigToFirestore = async (companyId: string, companyConfig: any): Promise<void> => {
  if (!db || !isFirebaseConfigured) return;
  const docRef = doc(db, 'companies', companyId, 'settings', 'general');
  await setDoc(docRef, { ...sanitizeDataForFirestore(companyConfig), updatedAt: serverTimestamp() }, { merge: true });
};


// ==========================================
// 3. ASSIGNMENTS REPOSITORY
// ==========================================

export const subscribeAssignments = (
  companyId: string,
  onData: (assignments: Assignment[]) => void,
  onError?: (err: Error) => void
): (() => void) => {
  if (!db || !isFirebaseConfigured) return () => {};

  const colRef = collection(db, 'companies', companyId, 'assignments');
  const q = query(colRef, orderBy('date', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const assignments: Assignment[] = [];
      snapshot.forEach((docSnap) => {
        assignments.push({ ...docSnap.data(), id: docSnap.id } as Assignment);
      });
      onData(assignments);
    },
    (error) => {
      console.error('[Firestore] Assignments subscription error:', error);
      onError?.(error);
    }
  );
};

export const saveAssignmentToFirestore = async (companyId: string, assignment: Assignment): Promise<void> => {
  if (!db || !isFirebaseConfigured) {
    throw new Error('Cloud Firestore is not initialized or configured.');
  }

  const docRef = doc(db, 'companies', companyId, 'assignments', assignment.id);
  const payload = {
    ...sanitizeDataForFirestore(assignment),
    updatedAt: serverTimestamp()
  };

  await setDoc(docRef, payload, { merge: true });
};

export const deleteAssignmentFromFirestore = async (companyId: string, assignmentId: string): Promise<void> => {
  if (!db || !isFirebaseConfigured) {
    throw new Error('Cloud Firestore is not initialized or configured.');
  }

  const docRef = doc(db, 'companies', companyId, 'assignments', assignmentId);
  await deleteDoc(docRef);
};

// ==========================================
// 4. PATROL REPORTS REPOSITORY
// ==========================================

export const subscribePatrolReports = (
  companyId: string,
  onData: (reports: PatrolReport[]) => void,
  onError?: (err: Error) => void
): (() => void) => {
  if (!db || !isFirebaseConfigured) return () => {};

  const colRef = collection(db, 'companies', companyId, 'patrolReports');
  const q = query(colRef, orderBy('scheduledDate', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const reports: PatrolReport[] = [];
      snapshot.forEach((docSnap) => {
        reports.push({ ...docSnap.data(), id: docSnap.id } as PatrolReport);
      });
      onData(reports);
    },
    (error) => {
      console.error('[Firestore] Reports subscription error:', error);
      onError?.(error);
    }
  );
};

export const submitPatrolReportToFirestore = async (
  companyId: string,
  report: PatrolReport,
  newIncidents?: IncidentRecord[] | IncidentRecord
): Promise<void> => {
  if (!db || !isFirebaseConfigured) {
    throw new Error('Cloud Firestore is not initialized or configured.');
  }

  const batch = writeBatch(db);

  // 1. Report Document (Idempotent by report.id)
  // Ensure no binary or temporary blob strings are ever stored in Firestore documents
  const cleanPhotos = (report.photos || [])
    .filter((p) => p.storagePath || (p.url && !p.url.startsWith('data:') && !p.url.startsWith('blob:')))
    .map((p) => ({
      id: p.id,
      caption: p.caption || '',
      timestamp: p.timestamp || '',
      locationName: p.locationName || '',
      storagePath: p.storagePath || '',
      url: p.url?.startsWith('http') ? p.url : '',
      fileName: p.fileName || '',
      contentType: p.contentType || '',
      fileSizeBytes: p.fileSizeBytes || 0,
      uploadedAt: p.uploadedAt || new Date().toISOString(),
      mediaType: p.mediaType || 'photo',
      uploadStatus: p.uploadStatus || 'completed'
    }));

  const sanitizedReportPayload = {
    ...report,
    photos: cleanPhotos,
    evidenceItems: (report.evidenceItems || []).filter((e) => !!e.storagePath)
  };

  const reportDocRef = doc(db, 'companies', companyId, 'patrolReports', report.id);
  batch.set(
    reportDocRef,
    {
      ...sanitizeDataForFirestore(sanitizedReportPayload),
      createdAt: serverTimestamp()
    },
    { merge: true }
  );

  // 2. Incident Documents if generated during patrol (handles single or multiple incidents)
  const incidentsList: IncidentRecord[] = Array.isArray(newIncidents)
    ? newIncidents
    : newIncidents
    ? [newIncidents]
    : report.incidents || [];

  for (const inc of incidentsList) {
    const incDocRef = doc(db, 'companies', companyId, 'incidents', inc.id);
    batch.set(
      incDocRef,
      {
        ...sanitizeDataForFirestore(inc),
        createdAt: serverTimestamp()
      },
      { merge: true }
    );
  }

  // 3. Update Site statistics
  const siteDocRef = doc(db, 'companies', companyId, 'sites', report.siteId);
  batch.set(
    siteDocRef,
    {
      lastPatrolTime: report.completedAt || report.actualCheckInTime || 'Completed',
      securityStatus: incidentsList.length > 0 ? 'incident_reported' : 'normal',
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );


  await batch.commit();
};

// ==========================================
// 5. INCIDENTS REPOSITORY
// ==========================================

export const subscribeIncidents = (
  companyId: string,
  onData: (incidents: IncidentRecord[]) => void,
  onError?: (err: Error) => void
): (() => void) => {
  if (!db || !isFirebaseConfigured) return () => {};

  const colRef = collection(db, 'companies', companyId, 'incidents');
  const q = query(colRef, orderBy('reportedAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const incidents: IncidentRecord[] = [];
      snapshot.forEach((docSnap) => {
        incidents.push({ ...docSnap.data(), id: docSnap.id } as IncidentRecord);
      });
      onData(incidents);
    },
    (error) => {
      console.error('[Firestore] Incidents subscription error:', error);
      onError?.(error);
    }
  );
};

export const saveIncidentToFirestore = async (companyId: string, incident: IncidentRecord): Promise<void> => {
  if (!db || !isFirebaseConfigured) {
    throw new Error('Cloud Firestore is not initialized or configured.');
  }

  const docRef = doc(db, 'companies', companyId, 'incidents', incident.id);
  const payload = {
    ...sanitizeDataForFirestore(incident),
    updatedAt: serverTimestamp()
  };

  await setDoc(docRef, payload, { merge: true });
};

// ==========================================
// 6. PATROL ZONES REPOSITORY
// ==========================================

export const subscribeZones = (
  companyId: string,
  onData: (zones: PatrolZone[]) => void,
  onError?: (err: Error) => void
): (() => void) => {
  if (!db || !isFirebaseConfigured) return () => {};

  const colRef = collection(db, 'companies', companyId, 'zones');
  const q = query(colRef, orderBy('name', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const zones: PatrolZone[] = [];
      snapshot.forEach((docSnap) => {
        zones.push({ ...docSnap.data(), id: docSnap.id } as PatrolZone);
      });
      onData(zones);
    },
    (error) => {
      console.error('[Firestore] Zones subscription error:', error);
      onError?.(error);
    }
  );
};

export const saveZoneToFirestore = async (companyId: string, zone: PatrolZone): Promise<void> => {
  if (!db || !isFirebaseConfigured) {
    throw new Error('Cloud Firestore is not initialized or configured.');
  }

  const docRef = doc(db, 'companies', companyId, 'zones', zone.id);
  await setDoc(docRef, { ...sanitizeDataForFirestore(zone), updatedAt: serverTimestamp() }, { merge: true });
};

export const deleteZoneFromFirestore = async (companyId: string, zoneId: string): Promise<void> => {
  if (!db || !isFirebaseConfigured) {
    throw new Error('Cloud Firestore is not initialized or configured.');
  }

  const docRef = doc(db, 'companies', companyId, 'zones', zoneId);
  await deleteDoc(docRef);
};

// ==========================================
// 7. SAFE IDEMPOTENT DATA MIGRATION
// ==========================================

export interface MigrationPayload {
  sites: Site[];
  officers: FieldOfficer[];
  assignments: Assignment[];
  reports: PatrolReport[];
  incidents: IncidentRecord[];
  zones: PatrolZone[];
  masterChecklists: ChecklistItem[];
}

export const migrateLocalDataToFirestore = async (
  companyId: string,
  data: MigrationPayload
): Promise<{ count: number }> => {
  if (!db || !isFirebaseConfigured) {
    throw new Error('Cannot migrate: Cloud Firestore is not configured.');
  }

  const firestoreDb = db as import('firebase/firestore').Firestore;
  const batch = writeBatch(firestoreDb);
  let opCount = 0;

  // 1. Sites
  data.sites.forEach((site) => {
    const ref = doc(firestoreDb, 'companies', companyId, 'sites', site.id);
    batch.set(ref, { ...sanitizeDataForFirestore(site), isDemo: true, migratedAt: serverTimestamp() }, { merge: true });
    opCount++;
  });

  // 2. Officers
  data.officers.forEach((officer) => {
    const ref = doc(firestoreDb, 'companies', companyId, 'officers', officer.id);
    batch.set(ref, { ...sanitizeDataForFirestore(officer), isDemo: true, migratedAt: serverTimestamp() }, { merge: true });
    opCount++;
  });

  // 3. Assignments
  data.assignments.forEach((assignment) => {
    const ref = doc(firestoreDb, 'companies', companyId, 'assignments', assignment.id);
    batch.set(ref, { ...sanitizeDataForFirestore(assignment), isDemo: true, migratedAt: serverTimestamp() }, { merge: true });
    opCount++;
  });

  // 4. Reports
  data.reports.forEach((report) => {
    const ref = doc(firestoreDb, 'companies', companyId, 'patrolReports', report.id);
    batch.set(ref, { ...sanitizeDataForFirestore(report), isDemo: true, migratedAt: serverTimestamp() }, { merge: true });
    opCount++;
  });

  // 5. Incidents
  data.incidents.forEach((incident) => {
    const ref = doc(firestoreDb, 'companies', companyId, 'incidents', incident.id);
    batch.set(ref, { ...sanitizeDataForFirestore(incident), isDemo: true, migratedAt: serverTimestamp() }, { merge: true });
    opCount++;
  });

  // 6. Zones
  data.zones.forEach((zone) => {
    const ref = doc(firestoreDb, 'companies', companyId, 'zones', zone.id);
    batch.set(ref, { ...sanitizeDataForFirestore(zone), isDemo: true, migratedAt: serverTimestamp() }, { merge: true });
    opCount++;
  });

  await batch.commit();
  return { count: opCount };
};

// ==========================================
// 8. CLIENT COMPANIES REPOSITORY (ZAXON OWNER APP)
// ==========================================

export const subscribeClientCompanies = (
  companyId: string,
  onUpdate: (companies: ClientCompany[]) => void,
  onError?: (error: Error) => void
) => {
  if (!db || !isFirebaseConfigured) return () => {};

  const colRef = collection(db, 'companies', companyId, 'clientCompanies');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const companies: ClientCompany[] = [];
      snapshot.forEach((docSnap) => {
        companies.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      onUpdate(companies);
    },
    (err) => {
      console.warn('[Firestore] Error subscribing to client companies:', err.message);
      onError?.(err);
    }
  );
};

export const saveClientCompanyToFirestore = async (
  companyId: string,
  clientCompany: ClientCompany
): Promise<void> => {
  if (!db || !isFirebaseConfigured) return;

  const docRef = doc(db, 'companies', companyId, 'clientCompanies', clientCompany.id);
  const payload = sanitizeDataForFirestore({
    ...clientCompany,
    updatedAt: serverTimestamp()
  });
  await setDoc(docRef, payload, { merge: true });
};

export const deleteClientCompanyFromFirestore = async (
  companyId: string,
  clientCompanyId: string
): Promise<void> => {
  if (!db || !isFirebaseConfigured) return;

  const docRef = doc(db, 'companies', companyId, 'clientCompanies', clientCompanyId);
  await deleteDoc(docRef);
};

// ==========================================
// 9. CLIENT ACCOUNTS REPOSITORY (ZAXON OWNER APP)
// ==========================================

export const subscribeClientAccounts = (
  companyId: string,
  onUpdate: (accounts: CompanyClientAccount[]) => void,
  onError?: (error: Error) => void
) => {
  if (!db || !isFirebaseConfigured) return () => {};

  const colRef = collection(db, 'companies', companyId, 'clientAccounts');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const accounts: CompanyClientAccount[] = [];
      snapshot.forEach((docSnap) => {
        accounts.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });
      onUpdate(accounts);
    },
    (err) => {
      console.warn('[Firestore] Error subscribing to client accounts:', err.message);
      onError?.(err);
    }
  );
};

export const saveClientAccountToFirestore = async (
  companyId: string,
  account: CompanyClientAccount
): Promise<void> => {
  if (!db || !isFirebaseConfigured) return;

  const docRef = doc(db, 'companies', companyId, 'clientAccounts', account.id);
  const payload = sanitizeDataForFirestore({
    ...account,
    updatedAt: serverTimestamp()
  });
  await setDoc(docRef, payload, { merge: true });
};

export const deleteClientAccountFromFirestore = async (
  companyId: string,
  accountId: string
): Promise<void> => {
  if (!db || !isFirebaseConfigured) return;

  const docRef = doc(db, 'companies', companyId, 'clientAccounts', accountId);
  await deleteDoc(docRef);
};

