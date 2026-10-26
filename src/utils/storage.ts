import { Site, FieldOfficer, Assignment, ChecklistItem, PatrolReport, IncidentRecord } from '../types';
import {
  DEMO_SITES,
  DEMO_OFFICERS,
  DEMO_ASSIGNMENTS,
  DEMO_PATROL_REPORTS,
  DEMO_INCIDENTS,
  MASTER_CHECKLIST_LIBRARY
} from '../data/demoData';

const STORAGE_KEYS = {
  SITES: 'rexon_demo_sites_v2',
  OFFICERS: 'rexon_demo_officers_v2',
  ASSIGNMENTS: 'rexon_demo_assignments_v2',
  REPORTS: 'rexon_demo_reports_v2',
  INCIDENTS: 'rexon_demo_incidents_v2',
  CHECKLISTS: 'rexon_demo_master_checklists_v2',
  AREAS: 'rexon_demo_areas_v2',
  OFFICER_AUTH: 'rexon_officer_auth_session',
  ADMIN_AUTH: 'rexon_admin_auth_session',
  ADMIN_CREDENTIALS: 'rexon_admin_credentials_v1',
  COMPANY_CONFIG: 'rexon_demo_company_config_v2',
  CLIENT_COMPANIES: 'raxon_client_companies_v1',
  CLIENT_ACCOUNTS: 'raxon_client_accounts_v1',
  ZAXON_AUTH: 'raxon_owner_auth_session',
  RAXON_AUTH: 'raxon_owner_auth_session'
};

export interface AdminCredentials {
  adminId: string;
  password: string;
  updatedAt?: string;
}

export const DEFAULT_ADMIN_CREDENTIALS: AdminCredentials = {
  adminId: 'admin@rexon.com',
  password: 'rexonadmin123',
  updatedAt: '2026-10-23T00:00:00.000Z'
};

export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[Rexon Demo Storage] Failed to load key "${key}" from localStorage:`, err);
    return defaultValue;
  }
};

export const saveToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[Rexon Demo Storage] Failed to save key "${key}" to localStorage:`, err);
  }
};

export const clearDemoStorage = (): void => {
  try {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  } catch (err) {
    console.warn('[Rexon Demo Storage] Failed to clear localStorage:', err);
  }
};

export { STORAGE_KEYS };
