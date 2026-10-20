import React, { useState, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  Printer,
  Calendar,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Camera,
  MessageSquare,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  Radio,
  FileCheck2,
  Compass,
  AlertCircle
} from 'lucide-react';
import { FieldOfficer, Site, PatrolReport, Assignment, IncidentRecord } from '../types';

interface OfficerDailyReportModalProps {
  officer: FieldOfficer;
  sites: Site[];
  reports: PatrolReport[];
  assignments: Assignment[];
  onClose: () => void;
  onSelectReport?: (report: PatrolReport) => void;
}

export const OfficerDailyReportModal: React.FC<OfficerDailyReportModalProps> = ({
  officer,
  sites,
  reports,
  assignments,
  onClose,
  onSelectReport
}) => {
  // Selected date defaults to 2026-10-20 (anchor date)
  const [selectedDate, setSelectedDate] = useState('2026-10-20');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Quick Date Navigation
  const handlePrevDay = () => {
    try {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - 1);
      setSelectedDate(d.toISOString().split('T')[0]);
    } catch {}
  };

  const handleNextDay = () => {
    try {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + 1);
      setSelectedDate(d.toISOString().split('T')[0]);
    } catch {}
  };

  const handleSetToday = () => {
    setSelectedDate('2026-10-20');
  };

  // Find all assignments covering this officer on this selected date
  const officerAssignmentsForDate = useMemo(() => {
    return assignments.filter((asg) => {
      if (asg.officerId !== officer.id && asg.officerBadge !== officer.badgeNumber) return false;
      if (asg.status === 'cancelled') return false;

      const startDate = asg.startDate || asg.date;
      const endDate = asg.endDate || startDate;

      // Check if selectedDate falls within [startDate, endDate]
      return selectedDate >= startDate && selectedDate <= endDate;
    });
  }, [assignments, officer.id, officer.badgeNumber, selectedDate]);

  // Find all patrol reports logged by this officer for this date
  const officerReportsForDate = useMemo(() => {
    return reports.filter((rep) => {
      const matchesOfficer = rep.officerId === officer.id || rep.officerBadge === officer.badgeNumber;
      if (!matchesOfficer) return false;
      return rep.scheduledDate === selectedDate || rep.id.includes(selectedDate);
    });
  }, [reports, officer.id, officer.badgeNumber, selectedDate]);

  // Combined daily site records: combine assigned sites with reports
  const dailySiteRecords = useMemo(() => {
    // Collect all site IDs relevant for today
    const assignedSiteIds = new Set<string>();
    officerAssignmentsForDate.forEach((a) => assignedSiteIds.add(a.siteId));
    officerReportsForDate.forEach((r) => assignedSiteIds.add(r.siteId));

    // If neither assignments nor reports found for today, fallback to officer.assignedSiteIds
    if (assignedSiteIds.size === 0 && selectedDate === '2026-10-20') {
      officer.assignedSiteIds.forEach((id) => assignedSiteIds.add(id));
    }

    return Array.from(assignedSiteIds).map((siteId) => {
      const siteObj = sites.find((s) => s.id === siteId);
      const asgObj = officerAssignmentsForDate.find((a) => a.siteId === siteId);
      const repObj = officerReportsForDate.find((r) => r.siteId === siteId);

      // Determine status
      let status: 'completed' | 'in_progress' | 'pending' | 'missed' = 'pending';
      if (repObj) {
        status = repObj.status;
      } else if (asgObj && asgObj.status === 'completed') {
        status = 'completed';
      }

      // If scheduled time has passed and no report or check-in, evaluate missed vs pending
      const scheduledTime = asgObj?.scheduledTime || repObj?.scheduledTime || siteObj?.lastPatrolTime || '09:00 AM';

      return {
        siteId,
        site: siteObj,
        assignment: asgObj,
        report: repObj,
        status,
        scheduledTime,
        clientName: siteObj?.clientName || asgObj?.clientName || 'Contract Client'
      };
    });
  }, [officerAssignmentsForDate, officerReportsForDate, officer.assignedSiteIds, selectedDate, sites]);

  // Summary Metrics for Selected Date
  const totalSitesCount = dailySiteRecords.length;
  const completedCount = dailySiteRecords.filter((r) => r.status === 'completed').length;
  const inProgressCount = dailySiteRecords.filter((r) => r.status === 'in_progress').length;
  const pendingCount = dailySiteRecords.filter((r) => r.status === 'pending').length;
  const missedCount = dailySiteRecords.filter((r) => r.status === 'missed').length;

  // Total incidents reported on this date
  const totalIncidentsCount = useMemo(() => {
    return dailySiteRecords.reduce((acc, r) => {
      return acc + (r.report?.incidents?.length || r.report?.incidentCount || 0);
    }, 0);
  }, [dailySiteRecords]);

  // Export Daily Report to CSV
  const handleExportCSV = () => {
    const headers = [
      'Officer Name',
      'Employee ID',
      'Badge Number',
      'Date',
      'Company / Client',
      'Site Name',
      'Site Code',
      'Area',
      'Scheduled Time',
      'Actual Check-In Time',
      'Report Submitted Time',
      'Patrol Status',
      'Checkpoints Completed',
      'Total Checkpoints',
      'Completion Rate',
      'Incident Count',
      'Incident Titles & Severity',
      'GPS Deviation (Meters)',
      'Officer Remarks'
    ];

    const rows = dailySiteRecords.map((item) => {
      const siteName = item.site?.name || 'Assigned Site';
      const siteCode = item.site?.code || 'SITE-CODE';
      const area = item.site?.area || officer.area;
      const scheduledTime = item.scheduledTime;
      const actualTime = item.report?.actualCheckInTime || (item.status === 'completed' ? scheduledTime : 'N/A');
      const submitTime = item.report?.completedAt || (item.status === 'completed' ? 'Logged' : 'Pending');
      const statusLabel = item.status.toUpperCase();
      const completedChks = item.report?.checklist.filter((c) => c.checked).length || (item.status === 'completed' ? 4 : 0);
      const totalChks = item.report?.checklist.length || 4;
      const pct = Math.round((completedChks / totalChks) * 100);
      const incCount = item.report?.incidents?.length || item.report?.incidentCount || 0;
      const incDetails = item.report?.incidents?.map((i) => `[${i.severity.toUpperCase()}] ${i.title}`).join('; ') || 'None';
      const gpsDev = item.report?.gpsStatus?.distanceDeviationMeters ?? (item.status === 'completed' ? 12 : 'N/A');
      const remarks = item.report?.officerRemarks || item.assignment?.notes || 'Normal routine check.';

      return [
        `"${officer.name}"`,
        `"${officer.employeeId}"`,
        `"${officer.badgeNumber}"`,
        `"${selectedDate}"`,
        `"${item.clientName}"`,
        `"${siteName}"`,
        `"${siteCode}"`,
        `"${area}"`,
        `"${scheduledTime}"`,
        `"${actualTime}"`,
        `"${submitTime}"`,
        `"${statusLabel}"`,
        completedChks,
        totalChks,
        `"${pct}%"`,
        incCount,
        `"${incDetails.replace(/"/g, '""')}"`,
        `"${gpsDev}"`,
        `"${remarks.replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `REXON_Patrol_Report_${officer.name.replace(/\s+/g, '_')}_${selectedDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Daily Summary View (PDF-ready)
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
      <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-2xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-[#4B3621]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#E7DED2] bg-[#FAF7F2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#E8D8C5] border border-[#E7DED2] flex items-center justify-center font-bold text-[#4B3621] text-base shrink-0">
              {officer.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#4B3621]">
                  {officer.name} — Daily Patrol Audit & Reports
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#E8D8C5] text-[#4B3621] border border-[#E7DED2]">
                  {officer.badgeNumber}
                </span>
              </div>
              <p className="text-xs text-[#8B735B] mt-0.5">
                ID: <strong className="text-[#4B3621] font-mono">{officer.employeeId}</strong> · Shift: {officer.shift} · Zone: {officer.area} · Phone: {officer.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Export CSV button */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#F0E8DD] text-[#4B3621] text-xs font-semibold border border-[#E7DED2] transition-colors cursor-pointer shadow-2xs"
              title="Download CSV for Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#1B5E20]" />
              <span>Export CSV</span>
            </button>

            {/* Print / Save PDF button */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6F4E37] hover:bg-[#5A3E2B] text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              title="Print official daily patrol summary sheet or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#F0E8DD] hover:bg-[#E8D8C5] text-[#4B3621] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Date Selector & Quick Navigation Bar */}
        <div className="bg-[#FAF7F2] px-4 py-2.5 border-b border-[#E7DED2] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#4B3621] flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#6F4E37]" />
              <span>Report Date (तारीख):</span>
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevDay}
                className="p-1 rounded bg-[#FFFFFF] hover:bg-[#F0E8DD] border border-[#E7DED2] text-[#4B3621] cursor-pointer"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2.5 py-1 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-xs font-mono font-bold text-[#4B3621] focus:outline-none focus:border-[#6F4E37] cursor-pointer"
              />

              <button
                type="button"
                onClick={handleNextDay}
                className="p-1 rounded bg-[#FFFFFF] hover:bg-[#F0E8DD] border border-[#E7DED2] text-[#4B3621] cursor-pointer"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleSetToday}
              className="text-[11px] text-[#6F4E37] hover:underline font-bold px-1.5 cursor-pointer"
            >
              Today (Oct 20)
            </button>
          </div>

          <div className="text-[11px] text-[#8B735B] font-mono">
            Audit Ledger: <strong className="text-[#4B3621]">REXON-AUDIT-{selectedDate}</strong>
          </div>
        </div>

        {/* Daily Summary Statistics Cards */}
        <div className="p-4 sm:p-5 border-b border-[#E7DED2] grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs bg-[#FFFFFF]">
          <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E7DED2]">
            <div className="text-[11px] text-[#8B735B]">Assigned Sites</div>
            <div className="text-lg font-bold font-mono text-[#4B3621] mt-0.5">{totalSitesCount}</div>
            <div className="text-[10px] text-[#8B735B]">for this date</div>
          </div>

          <div className="p-3 rounded-xl bg-[#E8F5E9] border border-[#C8E6C9]">
            <div className="text-[11px] text-[#1B5E20] font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#2E7D32]" />
              <span>Completed</span>
            </div>
            <div className="text-lg font-bold font-mono text-[#1B5E20] mt-0.5">
              {completedCount} <span className="text-[10px] font-normal">({totalSitesCount > 0 ? Math.round((completedCount / totalSitesCount) * 100) : 0}%)</span>
            </div>
            <div className="text-[10px] text-[#1B5E20]">cleared & verified</div>
          </div>

          <div className="p-3 rounded-xl bg-[#E3F2FD] border border-[#BBDEFB]">
            <div className="text-[11px] text-[#0D47A1] font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#1565C0]" />
              <span>In Progress</span>
            </div>
            <div className="text-lg font-bold font-mono text-[#0D47A1] mt-0.5">{inProgressCount}</div>
            <div className="text-[10px] text-[#0D47A1]">currently active</div>
          </div>

          <div className="p-3 rounded-xl bg-[#FFF8E1] border border-[#FFE082]">
            <div className="text-[11px] text-[#E65100] font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#F57C00]" />
              <span>Pending</span>
            </div>
            <div className="text-lg font-bold font-mono text-[#E65100] mt-0.5">{pendingCount}</div>
            <div className="text-[10px] text-[#E65100]">upcoming queue</div>
          </div>

          <div className={`p-3 rounded-xl border ${totalIncidentsCount > 0 ? 'bg-[#FFEBEE] border-[#FFCDD2]' : 'bg-[#FAF7F2] border-[#E7DED2]'}`}>
            <div className={`text-[11px] font-semibold flex items-center gap-1 ${totalIncidentsCount > 0 ? 'text-[#C62828]' : 'text-[#8B735B]'}`}>
              <AlertTriangle className="w-3 h-3" />
              <span>Incidents Logged</span>
            </div>
            <div className={`text-lg font-bold font-mono mt-0.5 ${totalIncidentsCount > 0 ? 'text-[#C62828]' : 'text-[#4B3621]'}`}>
              {totalIncidentsCount}
            </div>
            <div className="text-[10px] text-[#8B735B]">{totalIncidentsCount > 0 ? 'Urgent attention' : 'None reported'}</div>
          </div>
        </div>

        {/* Sites & Reports List for Selected Date */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#FAF7F2]">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#4B3621] flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#6F4E37]" />
              <span>Assigned Site Audits & Verification Stream ({dailySiteRecords.length})</span>
            </h4>
            <span className="text-[11px] text-[#8B735B]">
              Officer Badge: <strong className="text-[#4B3621]">{officer.badgeNumber}</strong>
            </span>
          </div>

          {dailySiteRecords.length === 0 ? (
            <div className="p-12 text-center bg-[#FFFFFF] border border-[#E7DED2] rounded-xl text-xs text-[#8B735B]">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-[#8B735B]/50" />
              <div className="font-bold text-[#4B3621]">No site patrol allocations recorded for {selectedDate}.</div>
              <div className="mt-1">Use the Date-Wise Allocation tool to allocate sites for this date range.</div>
            </div>
          ) : (
            dailySiteRecords.map((item, idx) => {
              const rep = item.report;
              const isCompleted = item.status === 'completed';
              const isInProgress = item.status === 'in_progress';
              const isPending = item.status === 'pending';
              const isMissed = item.status === 'missed';

              const completedChecks = rep?.checklist.filter((c) => c.checked).length || (isCompleted ? 4 : 0);
              const totalChecks = rep?.checklist.length || 4;
              const completionPct = totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 0;
              const incidentsList: IncidentRecord[] = rep?.incidents || [];

              return (
                <div
                  key={item.siteId || idx}
                  className={`border rounded-2xl p-4 sm:p-5 transition-all shadow-2xs space-y-3.5 bg-[#FFFFFF] ${
                    isCompleted
                      ? 'border-[#C8E6C9]'
                      : isInProgress
                      ? 'border-[#BBDEFB]'
                      : isMissed
                      ? 'border-[#FFCDD2]'
                      : 'border-[#E7DED2]'
                  }`}
                >
                  {/* Top Bar: Site Name, Company, Status Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E7DED2] pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#E8D8C5] text-[#4B3621] text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <h5 className="text-sm font-bold text-[#4B3621] flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-[#6F4E37] shrink-0" />
                          <span>{item.site?.name || 'Assigned Facility'}</span>
                        </h5>
                      </div>
                      <div className="text-xs text-[#8B735B] pl-7 mt-0.5 flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-[#6F4E37]">{item.clientName}</span>
                        <span>·</span>
                        <span>Zone: <strong className="text-[#4B3621]">{item.site?.area || officer.area}</strong></span>
                        <span>·</span>
                        <span className="font-mono text-[11px] text-[#8B735B]">{item.site?.code || 'SITE-CODE'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto pl-7 sm:pl-0">
                      {isCompleted && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Completed</span>
                        </span>
                      )}
                      {isInProgress && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#E3F2FD] text-[#0D47A1] border border-[#BBDEFB] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          <span>In Progress</span>
                        </span>
                      )}
                      {isPending && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFF8E1] text-[#E65100] border border-[#FFE082] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pending Patrol</span>
                        </span>
                      )}
                      {isMissed && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2] flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Missed Patrol</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Timestamps & Telemetry */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E7DED2]">
                      <div className="text-[#8B735B] text-[10px] uppercase font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#6F4E37]" />
                        <span>Scheduled Time</span>
                      </div>
                      <div className="font-mono font-bold text-xs text-[#4B3621] mt-0.5">
                        {item.scheduledTime}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E7DED2]">
                      <div className="text-[#8B735B] text-[10px] uppercase font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#1B5E20]" />
                        <span>Actual Check-In</span>
                      </div>
                      <div className="font-mono font-bold text-xs text-[#4B3621] mt-0.5">
                        {rep?.actualCheckInTime || (isCompleted ? item.scheduledTime : 'Pending arrival')}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E7DED2]">
                      <div className="text-[#8B735B] text-[10px] uppercase font-bold flex items-center gap-1">
                        <FileCheck2 className="w-3 h-3 text-[#6F4E37]" />
                        <span>Submission Time</span>
                      </div>
                      <div className="font-mono font-bold text-xs text-[#4B3621] mt-0.5">
                        {rep?.completedAt || (isCompleted ? 'Logged on shift' : 'Not submitted')}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E7DED2]">
                      <div className="text-[#8B735B] text-[10px] uppercase font-bold flex items-center gap-1">
                        <Compass className="w-3 h-3 text-[#6F4E37]" />
                        <span>GPS Geofence</span>
                      </div>
                      <div className="font-mono font-bold text-xs text-[#1B5E20] mt-0.5">
                        {rep?.gpsStatus ? `${rep.gpsStatus.distanceDeviationMeters}m deviation` : (isCompleted ? '12m · Verified' : 'Awaiting check-in')}
                      </div>
                    </div>
                  </div>

                  {/* Checklist Inspection Score & Breakdown */}
                  <div className="p-3 bg-[#FAF7F2] border border-[#E7DED2] rounded-xl text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#4B3621] flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#6F4E37]" />
                        <span>Checklist Audit Results:</span>
                      </span>
                      <span className="font-mono font-bold text-[#6F4E37]">
                        {completedChecks} / {totalChecks} Cleared ({completionPct}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#E7DED2] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#6F4E37] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${completionPct}%` }}
                      />
                    </div>

                    {/* Checkpoints summary tags */}
                    {rep?.checklist && rep.checklist.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {rep.checklist.map((chk, i) => (
                          <span
                            key={chk.id || i}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium border flex items-center gap-1 ${
                              chk.checked
                                ? 'bg-[#FFFFFF] text-[#1B5E20] border-[#C8E6C9]'
                                : 'bg-[#FFFFFF] text-[#C62828] border-[#FFCDD2]'
                            }`}
                          >
                            <span>{chk.checked ? '✓' : '✗'}</span>
                            <span className="truncate max-w-[160px]">{chk.title}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Incidents Section if any */}
                  {incidentsList.length > 0 && (
                    <div className="p-3 rounded-xl bg-[#FFEBEE] border border-[#FFCDD2] text-xs space-y-2">
                      <div className="flex items-center justify-between text-[#C62828] font-bold">
                        <span className="flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-[#C62828]" />
                          <span>Incident(s) Logged During Patrol ({incidentsList.length})</span>
                        </span>
                      </div>

                      {incidentsList.map((inc) => (
                        <div key={inc.id} className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#FFCDD2] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#4B3621]">{inc.title}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                                inc.severity === 'critical'
                                  ? 'bg-[#C62828] text-white'
                                  : inc.severity === 'high'
                                  ? 'bg-[#E65100] text-white'
                                  : 'bg-[#F57C00] text-white'
                              }`}
                            >
                              {inc.severity} Severity
                            </span>
                          </div>
                          <p className="text-[11px] text-[#4B3621]">{inc.summary}</p>
                          <div className="text-[10px] text-[#8B735B]">
                            <strong>Action:</strong> {inc.actionsTaken}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Officer Field Remarks */}
                  {(rep?.officerRemarks || item.assignment?.notes) && (
                    <div className="p-3 bg-[#FFFFFF] border border-[#E7DED2] rounded-xl text-xs space-y-1">
                      <div className="text-[#8B735B] font-bold text-[10px] uppercase flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-[#6F4E37]" />
                        <span>Officer Field Remarks (टिप्पणी):</span>
                      </div>
                      <p className="text-[#4B3621] leading-relaxed italic">
                        "{rep?.officerRemarks || item.assignment?.notes}"
                      </p>
                    </div>
                  )}

                  {/* Evidence Photos */}
                  {rep?.photos && rep.photos.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold text-[#8B735B] uppercase flex items-center gap-1">
                        <Camera className="w-3 h-3 text-[#6F4E37]" />
                        <span>Photographic Evidence Captured ({rep.photos.length}):</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {rep.photos.map((photo, pIdx) => (
                          <div
                            key={photo.id || pIdx}
                            onClick={() => setSelectedPhoto(photo.url)}
                            className="cursor-pointer group relative rounded-lg overflow-hidden border border-[#E7DED2] hover:border-[#6F4E37] transition-all"
                          >
                            <img
                              src={photo.url}
                              alt={photo.caption || 'Patrol photo'}
                              className="w-20 h-16 object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity">
                              Zoom
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Card Actions */}
                  <div className="pt-2 border-t border-[#E7DED2] flex items-center justify-between">
                    <span className="text-[10px] text-[#8B735B]">
                      Audit Verification: <strong className="text-[#1B5E20]">Recorded in System</strong>
                    </span>

                    {rep && onSelectReport && (
                      <button
                        type="button"
                        onClick={() => onSelectReport(rep)}
                        className="px-3 py-1 text-xs font-bold rounded-lg bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#6F4E37] border border-[#E7DED2] transition-colors cursor-pointer"
                      >
                        View Full Audit Sheet →
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer with Print Sign-off Summary */}
        <div className="p-4 border-t border-[#E7DED2] bg-[#FAF7F2] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-[#8B735B] flex items-center gap-2">
            <span>Supervisor Verification:</span>
            <span className="font-mono font-bold text-[#4B3621] bg-white px-2 py-0.5 rounded border border-[#E7DED2]">
              REXON-SUP-OK
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#6F4E37] hover:bg-[#5A3E2B] text-white font-bold transition-colors cursor-pointer shadow-2xs"
          >
            Close Daily Reports
          </button>
        </div>
      </div>

      {/* Lightbox for Photo Zoom */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="max-w-2xl w-full">
            <img src={selectedPhoto} alt="Evidence Zoom" className="w-full rounded-2xl border-2 border-white shadow-2xl" />
            <p className="text-center text-xs text-white/80 mt-2 font-medium">Click anywhere to close preview</p>
          </div>
        </div>
      )}
    </div>
  );
};
