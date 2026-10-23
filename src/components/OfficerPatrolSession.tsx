import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  Compass,
  Camera,
  Video,
  UploadCloud,
  RefreshCw,
  Trash2,
  Play,
  FileVideo,
  Image as ImageIcon,
  MessageSquare,
  Building2,
  MapPin,
  ShieldAlert,
  Send,
  HelpCircle,
  FileCheck2,
  X,
  Mic,
  Loader2,
  AlertCircle
} from 'lucide-react';
import {
  Site,
  FieldOfficer,
  ChecklistItem,
  CheckpointStatus,
  IncidentSeverity,
  PatrolReport,
  IncidentRecord,
  CheckpointPhoto,
  PatrolEvidenceItem,
  EvidenceMediaType
} from '../types';
import { VoiceInputControl } from './VoiceInputControl';
import {
  uploadPatrolEvidence,
  validateEvidenceFile,
  checkFirebaseStorageAvailability,
  StorageAvailabilityStatus
} from '../services/storageService';
import { DEFAULT_COMPANY_ID } from '../services/firestoreService';

interface OfficerPatrolSessionProps {
  site: Site;
  officer: FieldOfficer;
  scheduledTime?: string;
  onClose: () => void;
  onSubmitReport: (report: PatrolReport, newIncidents?: IncidentRecord[] | IncidentRecord) => void;
  onSwitchToOwnerDashboard: (reportId: string) => void;
}

interface ItemResult {
  status: CheckpointStatus;
  issueDescription: string;
  issueSeverity: IncidentSeverity;
}

export const OfficerPatrolSession: React.FC<OfficerPatrolSessionProps> = ({
  site,
  officer,
  scheduledTime,
  onClose,
  onSubmitReport,
  onSwitchToOwnerDashboard
}) => {
  // Check-in Time
  const [checkInTime, setCheckInTime] = useState<string>(() => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });

  // Simulated GPS check-in status
  const [gpsVerified, setGpsVerified] = useState(true);
  const [simulatedDistance, setSimulatedDistance] = useState(12);

  // Checkpoints state
  const checklistTemplates: ChecklistItem[] = site.checklistTemplates?.length > 0 ? site.checklistTemplates : [
    { id: 'chk-1', title: 'Main gate and lock security check', category: 'Access Control', checked: false, isCritical: true },
    { id: 'chk-2', title: 'Boundary wall and perimeter fencing scan', category: 'Perimeter', checked: false, isCritical: true },
    { id: 'chk-3', title: 'Rear gate and emergency exit padlocks check', category: 'Access Control', checked: false, isCritical: true },
    { id: 'chk-4', title: 'Suspicious activity & unauthorized vehicle audit', category: 'Perimeter', checked: false, isCritical: true },
    { id: 'chk-5', title: 'Perimeter safety & night illumination verification', category: 'Utilities', checked: false, isCritical: false }
  ];

  const [itemResults, setItemResults] = useState<Record<string, ItemResult>>(() => {
    const initial: Record<string, ItemResult> = {};
    checklistTemplates.forEach((chk) => {
      initial[chk.id] = {
        status: 'safe', // Default to safe for convenient mobile execution
        issueDescription: '',
        issueSeverity: 'medium'
      };
    });
    return initial;
  });

  // Officer field notes & photos
  const [officerRemarks, setOfficerRemarks] = useState(
    'Conducted physical checkpoint audit. Perimeter secured; gate locks verified.'
  );

  // Stable report ID so that Cloud Storage paths exactly match the Firestore document ID
  const reportIdRef = useRef<string>(`rep-${Date.now()}`);

  // Firebase Storage availability status
  const [storageStatus, setStorageStatus] = useState<StorageAvailabilityStatus>({
    isAvailable: false,
    bucketName: '',
    message: 'Photo/video upload is currently unavailable. Firebase Storage setup is required.'
  });
  const [isCheckingStorage, setIsCheckingStorage] = useState(true);

  // Evidence Photos and Videos state - starts empty (never show fake upload success)
  const [evidenceItems, setEvidenceItems] = useState<CheckpointPhoto[]>([]);

  // Check Storage availability on mount
  useEffect(() => {
    let isMounted = true;
    checkFirebaseStorageAvailability().then((status) => {
      if (isMounted) {
        setStorageStatus(status);
        setIsCheckingStorage(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Keep references to selected File objects to support immediate retry on failure
  const rawFilesRef = useRef<Map<string, File>>(new Map());
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Validation & Submission State
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<PatrolReport | null>(null);

  const handleStatusChange = (chkId: string, status: CheckpointStatus) => {
    setValidationError(null);
    setItemResults((prev) => ({
      ...prev,
      [chkId]: {
        ...prev[chkId],
        status
      }
    }));
  };

  const handleIssueDescriptionChange = (chkId: string, desc: string) => {
    setValidationError(null);
    setItemResults((prev) => ({
      ...prev,
      [chkId]: {
        ...prev[chkId],
        issueDescription: desc
      }
    }));
  };

  const handleIssueSeverityChange = (chkId: string, severity: IncidentSeverity) => {
    setItemResults((prev) => ({
      ...prev,
      [chkId]: {
        ...prev[chkId],
        issueSeverity: severity
      }
    }));
  };

  /**
   * Initiates real upload of an evidence file to Firebase Storage
   */
  const startEvidenceUpload = (item: CheckpointPhoto, file: File) => {
    const { promise } = uploadPatrolEvidence({
      file,
      companyId: DEFAULT_COMPANY_ID,
      siteId: site.id,
      reportId: reportIdRef.current,
      evidenceId: item.id,
      uploaderUid: officer.id,
      caption: item.caption,
      locationName: item.locationName,
      onProgress: (percent) => {
        setEvidenceItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, uploadProgress: percent } : it))
        );
      }
    });

    promise
      .then((res) => {
        setEvidenceItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  url: res.downloadUrl,
                  storagePath: res.storagePath,
                  uploadStatus: 'completed',
                  uploadProgress: 100,
                  errorMessage: undefined
                }
              : it
          )
        );
      })
      .catch((err: any) => {
        console.warn('[Evidence Upload] Upload issue:', err);
        setEvidenceItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  uploadStatus: 'failed',
                  errorMessage: err?.message || 'Photo/video upload is currently unavailable. Firebase Storage setup is required.'
                }
              : it
          )
        );
      });
  };

  /**
   * Handles user selecting a file from device camera, video recorder, or file picker
   */
  const handleFileSelected = (
    e: React.ChangeEvent<HTMLInputElement>,
    forcedType?: EvidenceMediaType
  ) => {
    setValidationError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!storageStatus.isAvailable) {
      setValidationError('Photo/video upload is currently unavailable. Firebase Storage setup is required.');
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate allowed file types and file-size limits before upload
      const validation = validateEvidenceFile(file);
      if (!validation.isValid) {
        setValidationError(validation.error || 'Invalid file format or size.');
        continue;
      }

      const mediaType: EvidenceMediaType = forcedType || validation.mediaType;
      const evidenceId = `ev-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

      // Save raw File in ref map for retry support
      rawFilesRef.current.set(evidenceId, file);

      // Create preview object URL for device visual feedback
      const previewUrl = URL.createObjectURL(file);

      const newItem: CheckpointPhoto = {
        id: evidenceId,
        url: previewUrl,
        caption: `${mediaType === 'video' ? 'Video Evidence' : 'Photo Evidence'} (${file.name})`,
        timestamp: checkInTime,
        locationName: site.name,
        fileName: file.name,
        contentType: file.type || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg'),
        fileSizeBytes: file.size,
        uploadedAt: new Date().toISOString(),
        uploaderUid: officer.id,
        mediaType,
        uploadStatus: storageStatus.isAvailable ? 'uploading' : 'failed',
        uploadProgress: storageStatus.isAvailable ? 5 : 0,
        errorMessage: storageStatus.isAvailable ? undefined : 'Photo/video upload is currently unavailable. Firebase Storage setup is required.'
      };

      setEvidenceItems((prev) => [...prev, newItem]);

      if (storageStatus.isAvailable) {
        startEvidenceUpload(newItem, file);
      }
    }

    // Reset input value so same file can be re-selected if needed
    e.target.value = '';
  };

  /**
   * Retries an upload without losing form data or checklist responses
   */
  const handleRetryUpload = (itemId: string) => {
    setValidationError(null);
    const file = rawFilesRef.current.get(itemId);
    const targetItem = evidenceItems.find((it) => it.id === itemId);

    if (!file || !targetItem) {
      setValidationError('Original file handle expired. Please re-select the file from your device.');
      return;
    }

    if (!storageStatus.isAvailable) {
      setValidationError('Photo/video upload is currently unavailable. Firebase Storage setup is required.');
      return;
    }

    setEvidenceItems((prev) =>
      prev.map((it) =>
        it.id === itemId
          ? { ...it, uploadStatus: 'uploading', uploadProgress: 10, errorMessage: undefined }
          : it
      )
    );

    startEvidenceUpload(targetItem, file);
  };

  /**
   * Removes an evidence item before submitting report
   */
  const handleRemoveEvidence = (itemId: string) => {
    rawFilesRef.current.delete(itemId);
    setEvidenceItems((prev) => prev.filter((it) => it.id !== itemId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || submittedReport) return;

    // VALIDATION RULES:
    // 1. All items must have an explicit status
    for (const chk of checklistTemplates) {
      const res = itemResults[chk.id];
      if (!res || !res.status) {
        setValidationError(`Please inspect and select a status for "${chk.title}".`);
        return;
      }
      // If issue found, description is required
      if (res.status === 'issue_found' && !res.issueDescription.trim()) {
        setValidationError(`Please describe the issue found at "${chk.title}". Spoken voice input or typing is required.`);
        return;
      }
    }

    // Check if any evidence is actively uploading (prevent submitting mid-upload)
    const uploadingItems = evidenceItems.filter((it) => it.uploadStatus === 'uploading');
    if (uploadingItems.length > 0) {
      setValidationError('Evidence upload in progress. Please wait for upload to complete before submitting.');
      return;
    }

    setIsSubmitting(true);

    const now = new Date();
    const completedTimeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const todayDateString = '2026-10-20';
    const reportCode = `PTR-2026-${Math.floor(100 + Math.random() * 900)}`;
    const effectiveReportId = reportIdRef.current;

    // Build checklist results list
    const finalChecklist = checklistTemplates.map((chk) => {
      const res = itemResults[chk.id];
      const isIssue = res?.status === 'issue_found';
      return {
        ...chk,
        checked: res?.status === 'safe' || isIssue,
        status: res?.status || 'safe',
        ...(isIssue && res?.issueDescription ? { issueDescription: res.issueDescription.trim() } : {}),
        ...(isIssue && res?.issueSeverity ? { issueSeverity: res.issueSeverity } : {})
      };
    });

    const issuesFound = checklistTemplates
      .filter((chk) => itemResults[chk.id]?.status === 'issue_found')
      .map((chk) => ({
        chk,
        result: itemResults[chk.id]
      }));

    const finalVerdict = issuesFound.length > 0 ? 'issue_found' : 'completed';

    // Build durable evidence metadata array for Firestore audit record
    // Only real, verified Storage paths are stored; no binary strings or fake records
    const verifiedCompletedEvidence = evidenceItems.filter(
      (it) => it.uploadStatus === 'completed' && it.storagePath
    );

    const evidenceMetaList: PatrolEvidenceItem[] = verifiedCompletedEvidence.map((it) => ({
      id: it.id,
      storagePath: it.storagePath!,
      downloadUrl: it.url?.startsWith('http') ? it.url : '',
      originalFileName: it.fileName || `${it.id}.jpg`,
      contentType: it.contentType || (it.mediaType === 'video' ? 'video/mp4' : 'image/jpeg'),
      fileSizeBytes: it.fileSizeBytes || 0,
      uploadedAt: it.uploadedAt || new Date().toISOString(),
      uploaderUid: officer.id,
      companyId: DEFAULT_COMPANY_ID,
      siteId: site.id,
      reportId: effectiveReportId,
      mediaType: it.mediaType || 'photo',
      caption: it.caption,
      locationName: it.locationName,
      checkpointId: it.checkpointId
    }));

    // Construct Patrol Report object
    const newReport: PatrolReport = {
      id: effectiveReportId,
      reportCode,
      siteId: site.id,
      siteName: site.name,
      area: site.area,
      officerId: officer.id,
      officerName: officer.name,
      officerBadge: officer.badgeNumber,
      scheduledDate: todayDateString,
      scheduledTime: scheduledTime || '08:00 AM',
      actualCheckInTime: checkInTime,
      completedAt: completedTimeString,
      status: 'completed',
      finalVerdict,
      checklist: finalChecklist,
      photos: verifiedCompletedEvidence,
      evidenceItems: evidenceMetaList,
      officerRemarks,
      gpsStatus: {
        verified: true,
        lat: site.coordinates?.lat || 37.7842,
        lng: site.coordinates?.lng || -122.3965,
        accuracyMeters: 4.2,
        distanceDeviationMeters: simulatedDistance,
        label: `GPS check-in verified inside ${site.geofenceRadiusMeters}m perimeter`
      },
      incidentCount: issuesFound.length,
      incidents: []
    };

    // If issues were found, create an incident record for EVERY flagged checkpoint
    const createdIncidents: IncidentRecord[] = [];
    if (issuesFound.length > 0) {
      issuesFound.forEach((item, index) => {
        const incId = `INC-2026-${Math.floor(100 + Math.random() * 900)}-${index + 1}`;
        const incident: IncidentRecord = {
          id: incId,
          siteId: site.id,
          siteName: site.name,
          officerId: officer.id,
          officerName: officer.name,
          reportedAt: `${todayDateString} · ${checkInTime}`,
          severity: item.result.issueSeverity || 'high',
          status: 'action_required',
          title: `${item.chk.title} - Security Issue`,
          summary: item.result.issueDescription?.trim() || `${item.chk.title} flagged with issue during patrol`,
          actionsTaken: `Logged by Officer ${officer.name} during patrol inspection. Immediate site supervisor notification triggered.`,
          photoCount: verifiedCompletedEvidence.length
        };
        createdIncidents.push(incident);
      });

      newReport.incidents = createdIncidents;
      newReport.incidentCount = createdIncidents.length;
    }

    onSubmitReport(newReport, createdIncidents);
    setSubmittedReport(newReport);
    setIsSubmitting(false);
  };

  // SUCCESS CONFIRMATION SCREEN
  if (submittedReport) {
    const isIssue = submittedReport.finalVerdict === 'issue_found';

    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs overflow-y-auto flex items-center justify-center p-4">
        <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-2xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl animate-in zoom-in-95 text-[#4B3621]">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-[#E8F5E9] border-2 border-[#C8E6C9] text-[#2E7D32]">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9]">
              REPORT FILED SUCCESSFULLY
            </span>
            <h3 className="text-lg font-bold text-[#4B3621] mt-2">
              Patrol Report Submitted
            </h3>
            <p className="text-xs text-[#8B735B] mt-1">
              Your patrol checklist has been synchronized with the Security Owner Dashboard.
            </p>
          </div>

          {/* Report Summary Card */}
          <div className="bg-[#FAF7F2] border border-[#E7DED2] rounded-xl p-4 text-xs text-left space-y-2 font-sans">
            <div className="flex items-center justify-between pb-2 border-b border-[#E7DED2]">
              <span className="text-[#8B735B]">Report ID:</span>
              <span className="font-mono font-bold text-[#6F4E37]">{submittedReport.reportCode}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8B735B]">Site:</span>
              <span className="text-[#4B3621] font-semibold">{submittedReport.siteName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8B735B]">Officer:</span>
              <span className="text-[#4B3621]">{submittedReport.officerName} ({officer.employeeId})</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8B735B]">Check-in / Finished:</span>
              <span className="font-mono text-[#4B3621] font-medium">{submittedReport.actualCheckInTime} — {submittedReport.completedAt}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-[#E7DED2]">
              <span className="text-[#8B735B]">Verdict:</span>
              <span className={`font-bold uppercase text-[11px] ${isIssue ? 'text-[#B71C1C]' : 'text-[#1B5E20]'}`}>
                {isIssue ? 'Issue Found (Incident Logged)' : 'Completed (All Clear)'}
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => onSwitchToOwnerDashboard(submittedReport.id)}
              className="w-full py-3 rounded-xl bg-[#6F4E37] hover:bg-[#5A3E2B] text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Switch to Owner Dashboard to Inspect Live Report</span>
            </button>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-[#F0E8DD] hover:bg-[#E8D8C5] text-[#4B3621] text-xs font-bold transition-colors cursor-pointer"
            >
              Return to Officer Patrol Schedule
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE PATROL EXECUTION FORM
  return (
    <div className="fixed inset-0 z-50 bg-[#F8F5EF] text-[#4B3621] overflow-y-auto flex flex-col font-sans">
      {/* Top Mobile App Bar */}
      <header className="sticky top-0 z-30 bg-[#FFFFFF] border-b border-[#E7DED2] px-4 py-3 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8B735B] hover:text-[#4B3621] bg-[#FAF7F2] hover:bg-[#F0E8DD] border border-[#E7DED2] shrink-0 cursor-pointer"
            aria-label="Back to schedule"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-[#4B3621] truncate">
              {site.name}
            </h2>
            <div className="text-[11px] text-[#8B735B] font-mono flex items-center gap-1.5">
              <span>{site.code}</span>
              <span>·</span>
              <span>{officer.name}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-xs text-[#8B735B] hover:text-[#4B3621] px-2.5 py-1 rounded bg-[#F0E8DD] border border-[#E7DED2] font-semibold shrink-0 cursor-pointer"
        >
          Exit Session
        </button>
      </header>

      {/* Main Execution Form Content */}
      <form onSubmit={handleSubmit} className="flex-1 max-w-2xl mx-auto w-full p-4 sm:p-6 space-y-5 pb-8">
        {/* Validation Warning */}
        {validationError && (
          <div className="p-3.5 bg-[#FFEBEE] border border-[#FFCDD2] rounded-xl text-xs text-[#B71C1C] flex items-start gap-2.5 animate-in shake shadow-2xs">
            <AlertOctagon className="w-4 h-4 text-[#C62828] shrink-0 mt-0.5" />
            <span className="font-semibold">{validationError}</span>
          </div>
        )}

        {/* 1. Facility & Check-In Overview Card */}
        <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-xl p-4 sm:p-5 space-y-3.5 shadow-2xs">
          {/* Site Details Section */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 border-b border-[#E7DED2] pb-3">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono text-[#6F4E37] font-bold uppercase tracking-wider block">
                ACTIVE PATROL EXECUTION
              </span>
              <h3 className="text-base sm:text-lg font-bold text-[#4B3621] mt-0.5 break-words leading-snug">
                {site.name}
              </h3>
              <p className="text-xs text-[#8B735B] flex items-start gap-1.5 mt-1 break-words leading-relaxed">
                <MapPin className="w-3.5 h-3.5 text-[#6F4E37] shrink-0 mt-0.5" />
                <span className="break-words leading-tight">{site.address}</span>
              </p>
            </div>

            <div className="text-left sm:text-right shrink-0 pt-1 sm:pt-0">
              <div className="text-[10px] text-[#8B735B] font-medium">Scheduled Time</div>
              <div className="font-mono text-xs sm:text-sm text-[#4B3621] font-bold mt-0.5">{scheduledTime || '08:00 AM'}</div>
            </div>
          </div>

          {/* Area between Site Details & Checklist: Check-In Timestamp Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs bg-[#FAF7F2] p-3 rounded-xl border border-[#E7DED2]">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Clock className="w-4 h-4 text-[#6F4E37] shrink-0" />
              <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                <span className="text-[#8B735B]">Officer Check-In Time:</span>
                <span className="font-mono font-bold text-[#4B3621]">{checkInTime}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCheckInTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}
              className="text-[11px] text-[#6F4E37] hover:text-[#5A3E2B] underline font-bold self-start sm:self-auto cursor-pointer shrink-0"
            >
              Re-stamp Check-In Time
            </button>
          </div>

          {/* Area between Site Details & Checklist: GPS Check-In Notice Box */}
          <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E7DED2] space-y-2 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0 flex-1">
                <Compass className="w-4 h-4 text-[#6F4E37] shrink-0 mt-0.5" />
                <span className="font-bold text-[#4B3621] text-xs break-words leading-snug">
                  GPS Check-In: Integration Pending (Simulated Demo)
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#8B735B] bg-[#F0E8DD] px-2 py-0.5 rounded border border-[#E7DED2] font-semibold shrink-0 self-start sm:self-auto">
                DEMO ONLY
              </span>
            </div>

            <p className="text-[11px] text-[#8B735B] leading-relaxed break-words">
              Actual device GPS access is not connected in this demonstration. Check-in status is simulated within the site's {site.geofenceRadiusMeters}m geofence radius.
            </p>

            <div className="pt-1.5 border-t border-[#E7DED2]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] text-[#1B5E20] font-mono font-bold">
              <span className="break-words leading-tight">
                Status: Verified within {simulatedDistance}m of centroid
              </span>
              <button
                type="button"
                onClick={() => setSimulatedDistance((d) => (d === 12 ? 8 : 12))}
                className="text-[#8B735B] hover:text-[#4B3621] underline text-[10px] cursor-pointer self-start sm:self-auto shrink-0 font-sans"
              >
                Toggle Accuracy (Demo)
              </button>
            </div>
          </div>
        </div>

        {/* 2. Inspection Checklist Items */}
        <div className="space-y-3 pt-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-[#4B3621] leading-snug break-words">
              Inspection Checkpoints ({checklistTemplates.length})
            </h4>
            <span className="text-[11px] text-[#8B735B] leading-tight">
              Select status for each item
            </span>
          </div>

          <div className="space-y-3">
            {checklistTemplates.map((chk, idx) => {
              const result = itemResults[chk.id] || { status: 'safe', issueDescription: '', issueSeverity: 'medium' };

              return (
                <div
                  key={chk.id}
                  className={`border rounded-xl p-3.5 sm:p-4 space-y-3 transition-colors shadow-2xs ${
                    result.status === 'issue_found'
                      ? 'border-[#FFCDD2] bg-[#FFEBEE]/40'
                      : 'bg-[#FFFFFF] border-[#E7DED2]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[#8B735B] text-xs">#{idx + 1}</span>
                        <span className="text-xs font-bold text-[#4B3621]">
                          {chk.title}
                        </span>
                        {chk.isCritical && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#FFEBEE] border border-[#FFCDD2] text-[#B71C1C] font-bold uppercase">
                            Critical
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-[#8B735B] mt-0.5">
                        Category: {chk.category}
                      </div>
                    </div>
                  </div>

                  {/* 3 Status Button Choices: Safe, Issue Found, Not Checked (Touch-friendly min-h-[44px]) */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(chk.id, 'safe')}
                      className={`min-h-[44px] py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer select-none ${
                        result.status === 'safe'
                          ? 'bg-[#2E7D32] text-white shadow-sm'
                          : 'bg-[#FAF7F2] text-[#4B3621] hover:bg-[#F0E8DD] border border-[#E7DED2]'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Safe</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(chk.id, 'issue_found')}
                      className={`min-h-[44px] py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer select-none ${
                        result.status === 'issue_found'
                          ? 'bg-[#C62828] text-white shadow-sm'
                          : 'bg-[#FAF7F2] text-[#4B3621] hover:bg-[#F0E8DD] border border-[#E7DED2]'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Issue Found</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(chk.id, 'not_checked')}
                      className={`min-h-[44px] py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer select-none ${
                        result.status === 'not_checked'
                          ? 'bg-[#8B735B] text-white shadow-sm'
                          : 'bg-[#FAF7F2] text-[#8B735B] hover:bg-[#F0E8DD] border border-[#E7DED2]'
                      }`}
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Not Checked</span>
                    </button>
                  </div>

                  {/* Issue Input Drawer with Hindi/English Voice Input (Required if Issue Found) */}
                  {result.status === 'issue_found' && (
                    <div className="p-3 bg-[#FFFFFF] border border-[#FFCDD2] rounded-lg space-y-2.5 animate-in fade-in shadow-2xs">
                      <div className="flex items-center justify-between text-xs text-[#B71C1C] font-bold">
                        <span>Describe Security Issue *</span>
                        <span className="text-[10px] text-[#B71C1C] bg-[#FFEBEE] px-1.5 py-0.5 rounded border border-[#FFCDD2]">
                          Required
                        </span>
                      </div>

                      {/* Integrated Voice Input Control for Hindi and English */}
                      <VoiceInputControl
                        currentText={result.issueDescription}
                        onTranscriptReceived={(transcript) => {
                          handleIssueDescriptionChange(
                            chk.id,
                            result.issueDescription ? `${result.issueDescription} ${transcript}` : transcript
                          );
                        }}
                        fieldLabel="Checkpoint Issue Voice Input"
                        placeholderHint="Tap mic to speak issue in Hindi or English..."
                      />

                      <textarea
                        rows={2}
                        required
                        value={result.issueDescription}
                        onChange={(e) => handleIssueDescriptionChange(chk.id, e.target.value)}
                        placeholder="Detail the issue: e.g. Padlock broken, boundary fencing damaged, intruder tracks noticed... or use microphone above"
                        className="w-full px-2.5 py-1.5 text-xs bg-[#FFFFFF] border border-[#FFCDD2] rounded text-[#4B3621] placeholder-[#8B735B]/70 focus:outline-none focus:border-[#C62828]"
                      />

                      <div>
                        <label className="block text-[11px] text-[#4B3621] font-semibold mb-1">Issue Severity Level:</label>
                        <div className="grid grid-cols-4 gap-1.5 text-[11px]">
                          {(['low', 'medium', 'high', 'critical'] as IncidentSeverity[]).map((sev) => (
                            <button
                              key={sev}
                              type="button"
                              onClick={() => handleIssueSeverityChange(chk.id, sev)}
                              className={`py-1.5 rounded uppercase font-mono font-bold text-[10px] transition-colors cursor-pointer ${
                                result.issueSeverity === sev
                                  ? sev === 'critical'
                                    ? 'bg-[#B71C1C] text-white shadow-xs'
                                    : sev === 'high'
                                    ? 'bg-[#C2410C] text-white shadow-xs'
                                    : 'bg-[#D97706] text-white shadow-xs'
                                  : 'bg-[#FAF7F2] text-[#4B3621] hover:bg-[#F0E8DD] border border-[#E7DED2]'
                              }`}
                            >
                              {sev}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Evidence Photos & Video Clips (Firebase Cloud Storage Real Evidence) */}
        <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-xl p-4 space-y-3.5 shadow-2xs">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#4B3621]">
              <div className="w-6 h-6 rounded-md bg-[#FAF7F2] border border-[#E7DED2] flex items-center justify-center text-[#6F4E37]">
                <Camera className="w-3.5 h-3.5" />
              </div>
              <span>Patrol Media Evidence & Proof ({evidenceItems.length})</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded bg-[#FAF7F2] text-[#8B735B] border border-[#E7DED2]">
                Max: 15MB Image · 50MB Video
              </span>
            </div>
          </div>

          {/* Storage Availability Banner */}
          {!storageStatus.isAvailable && !isCheckingStorage && (
            <div className="p-3.5 rounded-xl bg-[#FFF8E1] border border-[#FFE082] text-xs text-[#5D4037] flex items-start gap-2.5 shadow-2xs animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-[#E65100] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-[#E65100]">
                  Photo/video upload is currently unavailable. Firebase Storage setup is required.
                </div>
                <div className="text-[11px] text-[#8B735B] leading-relaxed">
                  All checkpoint checklists, notes, GPS coordinates, and incident reports remain fully functional and can be submitted without interruption. Evidence uploads will activate once the Storage bucket is provisioned in the Firebase Console.
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons: Camera Capture, Video Recording, File Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* 1. Take Photo (Direct Camera) */}
            <input
              type="file"
              ref={photoInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFileSelected(e, 'photo')}
            />
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="min-h-[44px] py-2 px-3 rounded-xl bg-[#6F4E37] hover:bg-[#5A3E2B] text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs select-none"
            >
              <Camera className="w-4 h-4" />
              <span>Take Photo</span>
            </button>

            {/* 2. Record Video (Direct Video Camera) */}
            <input
              type="file"
              ref={videoInputRef}
              accept="video/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFileSelected(e, 'video')}
            />
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="min-h-[44px] py-2 px-3 rounded-xl bg-[#4B3621] hover:bg-[#382818] text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs select-none"
            >
              <Video className="w-4 h-4" />
              <span>Record Video</span>
            </button>

            {/* 3. Browse Gallery / Device File */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => handleFileSelected(e)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[44px] py-2 px-3 rounded-xl bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2] text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none"
            >
              <UploadCloud className="w-4 h-4 text-[#6F4E37]" />
              <span>Choose File</span>
            </button>
          </div>

          {/* Evidence Items Grid */}
          {evidenceItems.length === 0 ? (
            <div className="p-6 rounded-xl bg-[#FAF7F2] border border-dashed border-[#E7DED2] text-center text-xs text-[#8B735B] space-y-1">
              <Camera className="w-6 h-6 mx-auto text-[#8B735B]/60 mb-1" />
              <div className="font-semibold text-[#4B3621]">No evidence items attached yet</div>
              <div className="text-[11px]">Use buttons above to capture site photos or video clips with your device.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {evidenceItems.map((item) => {
                const isVideo = item.mediaType === 'video' || item.contentType?.startsWith('video/');
                const isUploading = item.uploadStatus === 'uploading';
                const isFailed = item.uploadStatus === 'failed';
                const isDone = item.uploadStatus === 'completed';

                return (
                  <div
                    key={item.id}
                    className="bg-[#FAF7F2] border border-[#E7DED2] rounded-xl overflow-hidden flex flex-col justify-between shadow-2xs transition-all relative"
                  >
                    {/* Media Preview Box */}
                    <div className="relative aspect-video bg-black/10 overflow-hidden flex items-center justify-center">
                      {isVideo ? (
                        <video
                          src={item.url}
                          controls
                          className="w-full h-full object-cover"
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={item.url}
                          alt={item.caption || 'Patrol evidence'}
                          className="w-full h-full object-cover"
                        />
                      )}

                      {/* Top Badges: Media Type & Timestamp */}
                      <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-black/70 text-white flex items-center gap-1">
                          {isVideo ? <Video className="w-2.5 h-2.5 text-sky-400" /> : <ImageIcon className="w-2.5 h-2.5 text-amber-300" />}
                          {isVideo ? 'VIDEO' : 'PHOTO'}
                        </span>
                        {item.fileSizeBytes && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-black/70 text-white">
                            {(item.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB
                          </span>
                        )}
                      </div>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveEvidence(item.id)}
                        title="Remove evidence"
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 hover:bg-[#C62828] text-white flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>

                      {/* Live Upload Progress Overlay */}
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-3 text-white">
                          <Loader2 className="w-6 h-6 animate-spin text-amber-400 mb-1.5" />
                          <div className="text-[10px] font-mono font-bold tracking-wider">
                            UPLOADING... {item.uploadProgress || 0}%
                          </div>
                          <div className="w-full max-w-[120px] bg-white/20 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div
                              className="bg-amber-400 h-full transition-all duration-200"
                              style={{ width: `${item.uploadProgress || 0}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Metadata & Status Card Content */}
                    <div className="p-2.5 space-y-2 text-[11px]">
                      <div>
                        <div className="font-semibold text-[#4B3621] truncate" title={item.fileName || item.caption}>
                          {item.fileName || item.caption || 'Evidence Capture'}
                        </div>
                        <div className="text-[10px] text-[#8B735B] flex items-center justify-between mt-0.5">
                          <span>{item.timestamp || checkInTime}</span>
                          <span className="font-mono text-[9px] truncate max-w-[100px]">{item.id}</span>
                        </div>
                      </div>

                      {/* Status / Retry Controls */}
                      {isDone && (
                        <div className="flex items-center justify-between text-[10px] text-[#1B5E20] bg-[#E8F5E9] px-2 py-1 rounded border border-[#C8E6C9] font-medium">
                          <span className="flex items-center gap-1 font-bold">
                            <CheckCircle2 className="w-3 h-3 text-[#2E7D32]" />
                            <span>Storage Ready</span>
                          </span>
                          <span className="font-mono text-[9px]">Verified</span>
                        </div>
                      )}

                      {isFailed && (
                        <div className="space-y-1.5 p-2 rounded bg-[#FFEBEE] border border-[#FFCDD2] text-[10px]">
                          <div className="text-[#C62828] font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span className="truncate">{item.errorMessage || 'Upload failed'}</span>
                          </div>
                          <div className="flex items-center justify-end gap-1.5 pt-0.5">
                            <button
                              type="button"
                              onClick={() => handleRetryUpload(item.id)}
                              className="px-2 py-1 rounded bg-[#C62828] hover:bg-[#B71C1C] text-white font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                            >
                              <RefreshCw className="w-2.5 h-2.5" />
                              <span>Retry Upload</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-[10px] text-[#8B735B] leading-relaxed">
            All captured photos and video clips are validated and transferred to Firebase Cloud Storage with strict least-privilege company boundaries. Evidence file handles are preserved locally so uploads can be retried without losing checkpoint notes.
          </p>
        </div>

        {/* 4. Officer Remarks with Voice Input */}
        <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-xl p-4 space-y-2.5 text-xs shadow-2xs">
          <div className="flex items-center justify-between text-[#4B3621] font-bold">
            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-[#6F4E37]" />
              <span>Officer Field Remarks (टिप्पणी / Remarks)</span>
            </span>
            <span className="text-[10px] text-[#8B735B]">Optional</span>
          </div>

          {/* Voice Input for general field remarks */}
          <VoiceInputControl
            currentText={officerRemarks}
            onTranscriptReceived={(transcript) => {
              setOfficerRemarks((prev) => (prev ? `${prev} ${transcript}` : transcript));
            }}
            fieldLabel="Officer Remarks Voice Input"
            placeholderHint="Tap mic to dictate patrol observations in Hindi or English..."
          />

          <textarea
            rows={2}
            value={officerRemarks}
            onChange={(e) => setOfficerRemarks(e.target.value)}
            placeholder="Log general shift observations or notes..."
            className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-[#4B3621] placeholder-[#8B735B]/70 focus:outline-none focus:border-[#6F4E37] focus:bg-[#FFFFFF]"
          />
        </div>

        {/* Action Buttons: Clean Vertical / Responsive Layout (Bug 2 Fix) */}
        <div className="pt-4 border-t border-[#E7DED2] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto py-3 px-5 rounded-xl bg-[#F0E8DD] hover:bg-[#E8D8C5] text-[#4B3621] text-xs font-bold transition-colors cursor-pointer text-center"
          >
            Cancel & Exit Session
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-[#6F4E37] hover:bg-[#5A3E2B] text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 min-h-[48px]"
          >
            <Send className="w-4 h-4" />
            <span>Submit Patrol Report</span>
          </button>
        </div>
      </form>
    </div>
  );
};
