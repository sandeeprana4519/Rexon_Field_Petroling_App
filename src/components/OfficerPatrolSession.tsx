import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  Compass,
  Camera,
  MessageSquare,
  Building2,
  MapPin,
  ShieldAlert,
  Send,
  HelpCircle,
  FileCheck2,
  X,
  Mic
} from 'lucide-react';
import {
  Site,
  FieldOfficer,
  ChecklistItem,
  CheckpointStatus,
  IncidentSeverity,
  PatrolReport,
  IncidentRecord,
  CheckpointPhoto
} from '../types';
import { VoiceInputControl } from './VoiceInputControl';

interface OfficerPatrolSessionProps {
  site: Site;
  officer: FieldOfficer;
  scheduledTime?: string;
  onClose: () => void;
  onSubmitReport: (report: PatrolReport, newIncident?: IncidentRecord) => void;
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

  const [demoPhotos, setDemoPhotos] = useState<CheckpointPhoto[]>([
    {
      id: `p-${Date.now()}-1`,
      url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200"><rect width="320" height="200" fill="%23f0e8dd"/><rect x="10" y="10" width="300" height="180" fill="%23ffffff" stroke="%23e7ded2" stroke-width="2"/><text x="160" y="80" fill="%238b735b" font-family="sans-serif" font-size="11" text-anchor="middle" font-weight="bold">DEMO PHOTO CAPTURE</text><text x="160" y="105" fill="%234b3621" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle">Gate 1 Entrance Checkpoint</text><text x="160" y="130" fill="%232e7d32" font-family="monospace" font-size="10" text-anchor="middle">Simulated Time: Active Check-In</text></svg>',
      caption: 'Main entrance gate padlock verification',
      timestamp: checkInTime,
      locationName: 'Main Entrance Gate'
    }
  ]);

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

  const handleAddDemoPhoto = () => {
    const photoNumber = demoPhotos.length + 1;
    const newPhoto: CheckpointPhoto = {
      id: `p-${Date.now()}`,
      url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200"><rect width="320" height="200" fill="%23f0e8dd"/><rect x="10" y="10" width="300" height="180" fill="%23ffffff" stroke="%236f4e37" stroke-dasharray="4"/><text x="160" y="85" fill="%236f4e37" font-family="sans-serif" font-size="11" text-anchor="middle" font-weight="bold">DEMO PHOTO #${photoNumber}</text><text x="160" y="110" fill="%234b3621" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle">Perimeter Checkpoint ${photoNumber}</text><text x="160" y="135" fill="%238b735b" font-family="monospace" font-size="10" text-anchor="middle">Timestamp: ${checkInTime}</text></svg>`,
      caption: `Checkpoint #${photoNumber} security scan capture`,
      timestamp: checkInTime,
      locationName: `Perimeter Zone ${photoNumber}`
    };
    setDemoPhotos((prev) => [...prev, newPhoto]);
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

    setIsSubmitting(true);

    const now = new Date();
    const completedTimeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const todayDateString = '2026-10-20';
    const reportCode = `PTR-2026-${Math.floor(100 + Math.random() * 900)}`;

    // Build checklist results list
    const finalChecklist = checklistTemplates.map((chk) => {
      const res = itemResults[chk.id];
      return {
        ...chk,
        checked: res.status === 'safe' || res.status === 'issue_found',
        status: res.status,
        issueDescription: res.status === 'issue_found' ? res.issueDescription : undefined,
        issueSeverity: res.status === 'issue_found' ? res.issueSeverity : undefined
      };
    });

    const issuesFound = checklistTemplates
      .filter((chk) => itemResults[chk.id]?.status === 'issue_found')
      .map((chk) => ({
        chk,
        result: itemResults[chk.id]
      }));

    const finalVerdict = issuesFound.length > 0 ? 'issue_found' : 'completed';

    // Construct Patrol Report object
    const newReport: PatrolReport = {
      id: `rep-${Date.now()}`,
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
      photos: demoPhotos,
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

    // If an issue was found, create an automatic incident record for owner desk
    let createdIncident: IncidentRecord | undefined = undefined;
    if (issuesFound.length > 0) {
      const primaryIssue = issuesFound[0];
      const incId = `INC-2026-${Math.floor(100 + Math.random() * 900)}`;
      const incident: IncidentRecord = {
        id: incId,
        siteId: site.id,
        siteName: site.name,
        officerId: officer.id,
        officerName: officer.name,
        reportedAt: `${todayDateString} · ${checkInTime}`,
        severity: primaryIssue.result.issueSeverity || 'high',
        status: 'action_required',
        title: `${primaryIssue.chk.title} - Security Issue`,
        summary: primaryIssue.result.issueDescription,
        actionsTaken: `Logged by Officer ${officer.name} during patrol inspection. Immediate site supervisor notification triggered.`,
        photoCount: demoPhotos.length
      };

      createdIncident = incident;
      newReport.incidents = [incident];
    }

    onSubmitReport(newReport, createdIncident);
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

        {/* 3. Evidence Photos (Demo Captures) */}
        <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-xl p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#4B3621]">
              <Camera className="w-4 h-4 text-[#6F4E37]" />
              <span>Inspection Photos & Evidence ({demoPhotos.length})</span>
            </div>
            <span className="text-[10px] font-mono text-[#8B735B]">Demo Simulated</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {demoPhotos.map((photo) => (
              <div key={photo.id} className="relative aspect-video rounded-lg overflow-hidden border border-[#E7DED2] bg-[#FAF7F2]">
                <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover" />
                <div className="absolute bottom-1 left-1 right-1 px-1 py-0.5 rounded bg-black/60 text-[9px] text-white truncate font-medium">
                  {photo.caption}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddDemoPhoto}
              className="aspect-video rounded-lg border border-dashed border-[#8B735B] hover:border-[#6F4E37] bg-[#FAF7F2] flex flex-col items-center justify-center text-xs text-[#8B735B] hover:text-[#4B3621] transition-colors cursor-pointer"
            >
              <Camera className="w-4 h-4 mb-1 text-[#6F4E37]" />
              <span className="text-[10px] font-bold">+ Take Photo</span>
            </button>
          </div>
          <p className="text-[10px] text-[#8B735B]">
            Photos are saved client-side in demo session and viewable on the Owner Dashboard.
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
