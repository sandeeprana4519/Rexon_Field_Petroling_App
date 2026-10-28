export type PatrolStatus = 'completed' | 'in_progress' | 'pending' | 'missed';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'investigating' | 'action_required' | 'resolved';
export type OfficerShift = 'Day' | 'Night' | 'Swing';
export type OfficerStatus = 'on_duty' | 'patrolling' | 'break' | 'off_duty';
export type SiteSecurityStatus = 'normal' | 'heightened' | 'incident_reported';
export type SiteType = 'factory' | 'warehouse' | 'society' | 'office' | 'other';
export type OfficerEmploymentStatus = 'active' | 'on_leave' | 'deactivated';
export type CheckpointStatus = 'safe' | 'issue_found' | 'not_checked';
export type AppMode = 'owner_dashboard' | 'field_officer' | 'zaxon_owner_app' | 'raxon_owner_app';

export type ReportVerdict = 'completed' | 'issue_found' | 'All Clear' | 'Attention Required' | 'Critical Issues' | 'safe' | 'issues_reported' | 'pending';

export interface ChecklistItem {
  id: string;
  title: string;
  label?: string;
  description?: string;
  category: 'Perimeter' | 'Access Control' | 'Fire & Life Safety' | 'Utilities' | 'Equipment';
  checked: boolean;
  isCritical: boolean;
  isActive?: boolean;
  status?: CheckpointStatus;
  issueDescription?: string;
  issueSeverity?: IncidentSeverity;
  timestamp?: string;
  notes?: string;
}

export type EvidenceMediaType = 'photo' | 'video';
export type EvidenceUploadStatus = 'uploading' | 'completed' | 'failed' | 'simulated';

export interface CheckpointPhoto {
  id: string;
  url: string;
  caption: string;
  timestamp: string;
  locationName: string;
  checkpointId?: string;
  // Storage evidence metadata
  storagePath?: string;
  fileName?: string;
  contentType?: string;
  fileSizeBytes?: number;
  uploadedAt?: string;
  uploaderUid?: string;
  mediaType?: EvidenceMediaType;
  uploadStatus?: EvidenceUploadStatus;
  uploadProgress?: number;
  errorMessage?: string;
}

export interface PatrolEvidenceItem {
  id: string;
  storagePath: string;
  downloadUrl?: string;
  originalFileName: string;
  contentType: string;
  fileSizeBytes: number;
  uploadedAt: string;
  uploaderUid?: string;
  companyId: string;
  siteId: string;
  reportId: string;
  mediaType: EvidenceMediaType;
  caption?: string;
  locationName?: string;
  checkpointId?: string;
}

export interface IncidentRecord {
  id: string;
  siteId: string;
  siteName: string;
  officerId: string;
  officerName: string;
  patrolReportId?: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  reportedAt: string;
  summary: string;
  actionsTaken: string;
  photoCount: number;
}

export interface Site {
  id: string;
  code: string;
  name: string;
  clientName: string;
  siteType: SiteType;
  area: string;
  address: string;
  contactPerson: string;
  contactPhone: string;
  patrolFrequency: string;
  geofenceRadiusMeters: number;
  coordinates?: {
    lat?: number;
    lng?: number;
  };
  securityStatus: SiteSecurityStatus;
  isActive: boolean;
  requiredDailyPatrols: number;
  completedPatrolsToday: number;
  activeOfficersCount: number;
  checklistTemplates: ChecklistItem[];
  incidentCount: number;
  lastPatrolTime?: string;
  // Linked Client Company reference & Unified Portal Credentials
  companyId?: string;
  loginId?: string;
  password?: string;
  industry?: string;
  contactEmail?: string;
  portalActive?: boolean;
  notes?: string;
}

export type CompanyUserRole = 
  | 'Company Owner' 
  | 'Company HR' 
  | 'Company Manager' 
  | 'company_owner' 
  | 'company_hr' 
  | 'company_manager'
  | 'company_portal';

export interface CompanyClientAccount {
  id: string;
  companyId: string; // ID of the ClientCompany
  companyName: string; // e.g. "Apex Logistics Global"
  loginId: string; // Unique company login e.g. "apex.company"
  password?: string;
  name: string; // Contact or Company name
  fullName?: string; // alias
  email: string;
  phone: string;
  address?: string; // Physical address
  code?: string; // Company code e.g. CMP-APEX-01
  industry?: string; // Industry sector
  role: CompanyUserRole;
  assignedSiteIds: string[]; // List of site IDs authorized for this company
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  notes?: string;
}

export interface ClientCompany {
  id: string;
  code: string; // e.g. "CMP-APEX-01"
  name: string; // e.g. "Apex Logistics Global"
  loginId?: string; // Unified Company Login ID e.g. "apex.company"
  password?: string; // Unified Company Password e.g. "apex123"
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  industry?: string;
  industrySector?: string;
  assignedSiteIds?: string[];
  siteIds: string[];
  isActive: boolean;
  createdAt: string;
  notes?: string;
  authorizedUsersCount?: number;
}

export interface FieldOfficer {
  id: string;
  employeeId: string; // e.g. "REX-EMP-1001"
  badgeNumber: string; // e.g. "RF-101"
  name: string;
  phone: string;
  email?: string;
  password?: string;
  area: string;
  shift: OfficerShift;
  status: OfficerStatus;
  employmentStatus: OfficerEmploymentStatus;
  isActive: boolean;
  assignedSiteIds: string[];
  batteryPercent: number;
  lastCheckInTime: string;
  currentActivity: string;
  patrolsCompletedToday: number;
  demoGpsVerified: boolean;
}

export interface PatrolReport {
  id: string;
  reportCode: string;
  siteId: string;
  siteName: string;
  clientName?: string;
  createdAt?: string;
  officerId: string;
  officerName: string;
  officerBadge: string;
  area: string;
  scheduledTime: string;
  scheduledDate: string; // YYYY-MM-DD
  actualCheckInTime: string | null;
  completedAt: string | null;
  status: PatrolStatus;
  finalVerdict?: ReportVerdict;
  gpsStatus: {
    verified: boolean;
    accuracyMeters: number;
    distanceDeviationMeters: number;
    lat?: number;
    lng?: number;
    label: string;
    isSimulated?: boolean;
    siteLat?: number;
    siteLng?: number;
    validatedAt?: string;
    validationToken?: string;
    geofenceRadiusMeters?: number;
    validationSource?: 'device_gps' | 'backend_verified' | 'simulation';
  };
  checklist: ChecklistItem[];
  officerRemarks: string;
  photos: CheckpointPhoto[];
  evidenceItems?: PatrolEvidenceItem[];
  incidents: IncidentRecord[];
  incidentCount: number;
  // Historical notification logs tracking (preserved for backward compatibility with stored reports)
  notificationStatus?: NotificationDeliveryStatus;
  notificationLogs?: ReportNotificationLog[];
}

export type NotificationDeliveryStatus = 'pending' | 'sent' | 'failed' | 'retry_required' | 'unconfigured' | 'test_mode';

export interface ReportNotificationLog {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientRole?: string;
  recipientPhone: string;
  phoneNumber?: string;
  status: NotificationDeliveryStatus;
  sentAt?: string;
  timestamp?: string;
  errorMessage?: string;
  providerMessageId?: string;
  retryCount?: number;
  testMode?: boolean;
}

export type AssignmentStatus = 'active' | 'completed' | 'cancelled' | 'scheduled';

export interface Assignment {
  id: string;
  siteId: string;
  siteName: string;
  clientName?: string;
  companyName?: string;
  area: string;
  officerId: string;
  officerName: string;
  officerBadge: string;
  shift: OfficerShift;
  date: string; // YYYY-MM-DD (anchor date)
  startDate?: string; // YYYY-MM-DD (allocation start date)
  endDate?: string; // YYYY-MM-DD (allocation end date)
  durationDays?: number; // total allocated days count
  scheduledTime: string; // e.g. "08:00 AM" (daily scheduled patrol time)
  patrolFrequency: string; // e.g. "2x per shift"
  workingDays?: string; // e.g. "All Days", "Monday - Friday", "Weekends"
  startTime?: string;
  endTime?: string;
  status: AssignmentStatus;
  patrolQuota: number;
  patrolsCompleted: number;
  notes: string;
}

export interface PatrolZone {
  id: string;
  name: string;
  code?: string;
  description?: string;
  createdAt?: string;
}

export interface FilterState {
  date: string; // 'all' | 'today' | 'yesterday' | 'last_7_days'
  area: string; // 'all' | area name
  officerId: string; // 'all' | officer id
  siteId: string; // 'all' | site id
  status: string; // 'all' | PatrolStatus
  searchQuery: string;
}

export type NavigationTab = 
  | 'dashboard' 
  | 'sites' 
  | 'officers' 
  | 'reports' 
  | 'incidents' 
  | 'assignments' 
  | 'zones'
  | 'settings';
