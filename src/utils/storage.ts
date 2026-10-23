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
  COMPANY_CONFIG: 'rexon_demo_company_config_v2'
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
