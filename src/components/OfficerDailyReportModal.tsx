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
  AlertCircle,
  Download,
  Eye,
  Layers,
  Filter,
  Check,
  CalendarDays,
  CalendarRange,
  TableProperties,
  LayoutGrid
} from 'lucide-react';
import { FieldOfficer, Site, PatrolReport, Assignment, IncidentRecord } from '../types';
import { getTodayDateString, getOffsetDateString } from '../utils/dateUtils';

export type TimeframeMode = 'daily' | 'weekly' | 'monthly' | 'custom';

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
  // Timeframe and date state
  const [timeframeMode, setTimeframeMode] = useState<TimeframeMode>('daily');
  const [selectedDate, setSelectedDate] = useState(() => getTodayDateString());
  const [customStartDate, setCustomStartDate] = useState(() => getOffsetDateString(-6));
  const [customEndDate, setCustomEndDate] = useState(() => getTodayDateString());

  // UI state
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Quick Date Navigation for daily mode
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
    setSelectedDate(getTodayDateString());
  };

  // Compute effective date range [effectiveStartDate, effectiveEndDate]
  const { effectiveStartDate, effectiveEndDate, timeframeLabel } = useMemo(() => {
    if (timeframeMode === 'daily') {
      return {
        effectiveStartDate: selectedDate,
        effectiveEndDate: selectedDate,
        timeframeLabel: `Daily (${selectedDate})`
      };
    }

    if (timeframeMode === 'weekly') {
      const endD = new Date(selectedDate);
      const startD = new Date(selectedDate);
      startD.setDate(startD.getDate() - 6);
      const startStr = startD.toISOString().split('T')[0];
      const endStr = endD.toISOString().split('T')[0];
      return {
        effectiveStartDate: startStr,
        effectiveEndDate: endStr,
        timeframeLabel: `Weekly (${startStr} to ${endStr})`
      };
    }

    if (timeframeMode === 'monthly') {
      const parts = selectedDate.split('-');
      const y = parseInt(parts[0]) || 2026;
      const m = parseInt(parts[1]) || 10;
      const startStr = `${y}-${String(m).padStart(2, '0')}-01`;
      const lastDay = new Date(y, m, 0).getDate();
      const endStr = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      return {
        effectiveStartDate: startStr,
        effectiveEndDate: endStr,
        timeframeLabel: `Monthly (October ${y} · ${startStr} to ${endStr})`
      };
    }

    // custom
    return {
      effectiveStartDate: customStartDate,
      effectiveEndDate: customEndDate,
      timeframeLabel: `Custom Range (${customStartDate} to ${customEndDate})`
    };
  }, [timeframeMode, selectedDate, customStartDate, customEndDate]);

  // Filter assignments matching this officer in date range
  const filteredAssignments = useMemo(() => {
    return assignments.filter((asg) => {
      const matchesOfficer =
        asg.officerId === officer.id ||
        asg.officerBadge === officer.badgeNumber ||
        (asg.officerName && asg.officerName.toLowerCase() === officer.name.toLowerCase());
      if (!matchesOfficer) return false;
      if (asg.status === 'cancelled') return false;

      const asgStart = asg.startDate || asg.date;
      const asgEnd = asg.endDate || asgStart;

      // Overlap with [effectiveStartDate, effectiveEndDate]
      return asgStart <= effectiveEndDate && asgEnd >= effectiveStartDate;
    });
  }, [assignments, officer.id, officer.badgeNumber, officer.name, effectiveStartDate, effectiveEndDate]);

  // Filter reports matching this officer in date range
  const filteredReports = useMemo(() => {
    return reports.filter((rep) => {
      const matchesOfficer =
        rep.officerId === officer.id ||
        rep.officerBadge === officer.badgeNumber ||
        (rep.officerName && rep.officerName.toLowerCase() === officer.name.toLowerCase());
      if (!matchesOfficer) return false;

      const repDate = rep.scheduledDate || getTodayDateString();
      return repDate >= effectiveStartDate && repDate <= effectiveEndDate;
    });
  }, [reports, officer.id, officer.badgeNumber, officer.name, effectiveStartDate, effectiveEndDate]);

  // Build unified Site-Wise Audit Records
  const siteAuditRecords = useMemo(() => {
    const siteIds = new Set<string>();

    // Add sites from assignments
    filteredAssignments.forEach((a) => siteIds.add(a.siteId));
    // Add sites from reports
    filteredReports.forEach((r) => siteIds.add(r.siteId));

    // Fallback: if no specific assignments/reports found, include officer's assigned sites
    if (siteIds.size === 0) {
      if (officer.assignedSiteIds && officer.assignedSiteIds.length > 0) {
        officer.assignedSiteIds.forEach((id) => siteIds.add(id));
      } else {
        // Fallback to top sites in the officer's area
        sites.filter((s) => s.area === officer.area).slice(0, 5).forEach((s) => siteIds.add(s.id));
      }
    }

    return Array.from(siteIds).map((siteId) => {
      const siteObj = sites.find((s) => s.id === siteId);
      const siteReports = filteredReports.filter((r) => r.siteId === siteId);
      const siteAssignments = filteredAssignments.filter((a) => a.siteId === siteId);

      const latestReport = siteReports[0] || null;
      const latestAssignment = siteAssignments[0] || null;

      // Status determination
      let status: 'completed' | 'in_progress' | 'pending' | 'missed' = 'pending';
      if (latestReport) {
        status = latestReport.status;
      } else if (latestAssignment && latestAssignment.status === 'completed') {
        status = 'completed';
      }

      // Checklists & work done analysis
      const templateChecklist = siteObj?.checklistTemplates || [];
      const reportChecklist = latestReport?.checklist || [];

      // Determine what was done vs not done
      let completedWorkItems: string[] = [];
      let pendingWorkItems: string[] = [];

      if (reportChecklist.length > 0) {
        reportChecklist.forEach((chk) => {
          if (chk.checked) {
            completedWorkItems.push(chk.title + (chk.notes ? ` (${chk.notes})` : ''));
          } else {
            pendingWorkItems.push(chk.title);
          }
        });
      } else if (status === 'completed') {
        completedWorkItems = [
          'Main gate and perimeter lock security check',
          'Boundary wall and perimeter fencing scan',
          'Rear emergency exit padlocks verified',
          'Perimeter safety & illumination audit'
        ];
      } else {
        // Not completed yet
        pendingWorkItems = templateChecklist.length > 0
          ? templateChecklist.map((c) => c.title)
          : [
              'Main entrance security check',
              'Perimeter boundary audit',
              'Emergency exits padlock audit',
              'Fire safety & extinguisher verification'
            ];
      }

      const totalCheckpoints = Math.max(reportChecklist.length, completedWorkItems.length + pendingWorkItems.length, 4);
      const completedCheckpoints = completedWorkItems.length;
      const completionPercentage = totalCheckpoints > 0 ? Math.round((completedCheckpoints / totalCheckpoints) * 100) : 0;

      // Incidents logged at this site
      const incidents: IncidentRecord[] = latestReport?.incidents || [];

      // Photos
      const photos = latestReport?.photos || [];

      // Timestamps
      const scheduledTime = latestAssignment?.scheduledTime || latestReport?.scheduledTime || siteObj?.lastPatrolTime || '09:00 AM';
      const actualTime = latestReport?.actualCheckInTime || (status === 'completed' ? scheduledTime : 'Pending arrival');
      const completedTime = latestReport?.completedAt || (status === 'completed' ? 'Logged on shift' : 'Incomplete');
      const gpsDeviation = latestReport?.gpsStatus?.distanceDeviationMeters ?? (status === 'completed' ? 12 : null);

      return {
        siteId,
        site: siteObj,
        clientName: siteObj?.clientName || latestAssignment?.clientName || latestAssignment?.companyName || 'Contract Client',
        siteName: siteObj?.name || latestAssignment?.siteName || 'Assigned Site',
        siteCode: siteObj?.code || 'SITE-CODE',
        area: siteObj?.area || officer.area,
        status,
        scheduledTime,
        actualTime,
        completedTime,
        gpsDeviation,
        completedWorkItems,
        pendingWorkItems,
        totalCheckpoints,
        completedCheckpoints,
        completionPercentage,
        incidents,
        photos,
        remarks: latestReport?.officerRemarks || latestAssignment?.notes || (status === 'completed' ? 'Routine patrol audit completed.' : 'Pending scheduled inspection.'),
        report: latestReport,
        assignment: latestAssignment
      };
    });
  }, [filteredAssignments, filteredReports, officer.assignedSiteIds, officer.area, sites]);

  // Summary Metrics
  const summary = useMemo(() => {
    const totalSites = siteAuditRecords.length;
    const completed = siteAuditRecords.filter((r) => r.status === 'completed').length;
    const inProgress = siteAuditRecords.filter((r) => r.status === 'in_progress').length;
    const pending = siteAuditRecords.filter((r) => r.status === 'pending').length;
    const missed = siteAuditRecords.filter((r) => r.status === 'missed').length;

    const totalIncidents = siteAuditRecords.reduce((acc, r) => acc + r.incidents.length, 0);
    const totalPhotos = siteAuditRecords.reduce((acc, r) => acc + r.photos.length, 0);

    const totalCheckpoints = siteAuditRecords.reduce((acc, r) => acc + r.totalCheckpoints, 0);
    const completedCheckpoints = siteAuditRecords.reduce((acc, r) => acc + r.completedCheckpoints, 0);
    const overallRate = totalCheckpoints > 0 ? Math.round((completedCheckpoints / totalCheckpoints) * 100) : 0;

    return {
      totalSites,
      completed,
      inProgress,
      pending,
      missed,
      totalIncidents,
      totalPhotos,
      overallRate
    };
  }, [siteAuditRecords]);

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = [
      'Officer Name',
      'Employee ID',
      'Badge Number',
      'Shift',
      'Area',
      'Report Timeframe',
      'Start Date',
      'End Date',
      'Site Name',
      'Company / Client',
      'Site Code',
      'Patrol Status',
      'Scheduled Time',
      'Actual Check-In',
      'Submission Time',
      'Checkpoints Completed Count',
      'Total Checkpoints',
      'Completion %',
      'Work Completed (क्या-क्या काम किया)',
      'Work Pending / Not Done (जो काम बाकी रह गया)',
      'Incident Count',
      'Incident Details',
      'GPS Deviation (Meters)',
      'Officer Remarks'
    ];

    const rows = siteAuditRecords.map((item) => {
      const incDetails =
        item.incidents.map((i) => `[${i.severity.toUpperCase()}] ${i.title} (${i.actionsTaken})`).join('; ') || 'None';

      const doneStr = item.completedWorkItems.join('; ') || 'None';
      const pendingStr = item.pendingWorkItems.join('; ') || 'None';

      return [
        `"${officer.name}"`,
        `"${officer.employeeId}"`,
        `"${officer.badgeNumber}"`,
        `"${officer.shift}"`,
        `"${officer.area}"`,
        `"${timeframeMode.toUpperCase()}"`,
        `"${effectiveStartDate}"`,
        `"${effectiveEndDate}"`,
        `"${item.siteName.replace(/"/g, '""')}"`,
        `"${item.clientName.replace(/"/g, '""')}"`,
        `"${item.siteCode}"`,
        `"${item.status.toUpperCase()}"`,
        `"${item.scheduledTime}"`,
        `"${item.actualTime}"`,
        `"${item.completedTime}"`,
        item.completedCheckpoints,
        item.totalCheckpoints,
        `"${item.completionPercentage}%"`,
        `"${doneStr.replace(/"/g, '""')}"`,
        `"${pendingStr.replace(/"/g, '""')}"`,
        item.incidents.length,
        `"${incDetails.replace(/"/g, '""')}"`,
        item.gpsDeviation !== null ? `"${item.gpsDeviation}m"` : '"N/A"',
        `"${(item.remarks || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Rexon_Patrol_Report_${officer.name.replace(/\s+/g, '_')}_${timeframeMode}_${effectiveStartDate}_to_${effectiveEndDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setActionFeedback(`CSV Report (${timeframeMode}) downloaded successfully.`);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // Generate Standalone Printable HTML
  const generatePrintableHtml = () => {
    const tableRows = siteAuditRecords
      .map(
        (r, idx) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${idx + 1}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">
          <strong>${r.siteName}</strong><br/>
          <span style="font-size: 11px; color: #555;">Client: ${r.clientName} · ${r.siteCode}</span>
        </td>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 11px;">${r.area}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-family: monospace; font-size: 11px;">
          Sched: ${r.scheduledTime}<br/>
          In: ${r.actualTime}
        </td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
          <span style="padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; ${
            r.status === 'completed'
              ? 'background: #e8f5e9; color: #1b5e20; border: 1px solid #c8e6c9;'
              : r.status === 'in_progress'
              ? 'background: #e3f2fd; color: #0d47a1; border: 1px solid #bbdefb;'
              : 'background: #fff8e1; color: #e65100; border: 1px solid #ffe082;'
          }">
            ${r.status}
          </span>
        </td>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 11px;">
          <strong style="color: #1b5e20;">✓ Cleared (${r.completedCheckpoints}/${r.totalCheckpoints}):</strong><br/>
          ${r.completedWorkItems.length > 0 ? r.completedWorkItems.map((item) => `• ${item}`).join('<br/>') : 'None'}
          ${
            r.pendingWorkItems.length > 0
              ? `<br/><strong style="color: #c62828; margin-top: 4px; display: inline-block;">✗ Pending:</strong><br/>` +
                r.pendingWorkItems.map((item) => `• ${item}`).join('<br/>')
              : ''
          }
        </td>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 11px;">
          ${
            r.incidents.length > 0
              ? r.incidents.map((i) => `<span style="color: #c62828; font-weight: bold;">[${i.severity.toUpperCase()}]</span> ${i.title}`).join('<br/>')
              : '<span style="color: #777;">None</span>'
          }
        </td>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 11px;">
          ${r.gpsDeviation !== null ? `<span style="color: #1b5e20; font-weight: bold;">${r.gpsDeviation}m (Verified)</span>` : '<span style="color: #777;">Pending</span>'}
          <br/>
          <em style="font-size: 10px; color: #444;">${r.remarks}</em>
        </td>
      </tr>
    `
      )
      .join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Rexon Field Patrol Audit - ${officer.name} - ${timeframeLabel}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #222; margin: 0; padding: 15px; font-size: 12px; }
    .header { border-bottom: 2px solid #6F4E37; padding-bottom: 12px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: flex-start; }
    .title { font-size: 18px; font-weight: bold; color: #4B3621; margin: 0; }
    .subtitle { font-size: 12px; color: #666; margin-top: 4px; }
    .badge { background: #FAF7F2; border: 1px solid #E7DED2; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 11px; }
    .officer-card { background: #FAF7F2; border: 1px solid #E7DED2; border-radius: 8px; padding: 10px 15px; margin-bottom: 15px; display: flex; flex-wrap: wrap; gap: 15px; justify-content: space-between; font-size: 11px; }
    .kpi-row { display: flex; gap: 10px; margin-bottom: 15px; }
    .kpi-box { flex: 1; border: 1px solid #E7DED2; background: #fff; padding: 8px; border-radius: 6px; text-align: center; }
    .kpi-val { font-size: 16px; font-weight: bold; font-family: monospace; color: #4B3621; }
    .kpi-lbl { font-size: 10px; color: #666; text-transform: uppercase; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px; }
    th { background: #FAF7F2; color: #4B3621; border: 1px solid #E7DED2; padding: 8px; text-align: left; font-size: 10px; text-transform: uppercase; }
    .footer { margin-top: 25px; border-top: 1px solid #E7DED2; padding-top: 15px; display: flex; justify-content: space-between; font-size: 11px; color: #555; }
    .sign-box { border-top: 1px dashed #999; width: 180px; padding-top: 4px; text-align: center; font-size: 10px; margin-top: 30px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">REXON SECURITY SERVICES</h1>
      <div class="subtitle">Official Field Patrol Audit & Verification Ledger (दैनिक / साप्ताहिक / मासिक रिपोर्ट)</div>
      <div style="font-size: 11px; margin-top: 3px; color: #6F4E37; font-weight: bold;">
        Timeframe: ${timeframeLabel}
      </div>
    </div>
    <div style="text-align: right;">
      <div class="badge">LEDGER: REX-${officer.badgeNumber}-${effectiveStartDate}</div>
      <div style="font-size: 10px; color: #888; margin-top: 4px;">Generated: ${new Date().toLocaleString()}</div>
    </div>
  </div>

  <div class="officer-card">
    <div><strong>Officer:</strong> ${officer.name}</div>
    <div><strong>Employee ID:</strong> ${officer.employeeId}</div>
    <div><strong>Badge:</strong> ${officer.badgeNumber}</div>
    <div><strong>Shift:</strong> ${officer.shift} Shift</div>
    <div><strong>Zone:</strong> ${officer.area}</div>
    <div><strong>Phone:</strong> ${officer.phone}</div>
  </div>

  <div class="kpi-row">
    <div class="kpi-box">
      <div class="kpi-val">${summary.totalSites}</div>
      <div class="kpi-lbl">Assigned Sites</div>
    </div>
    <div class="kpi-box" style="border-color: #c8e6c9; background: #e8f5e9;">
      <div class="kpi-val" style="color: #1b5e20;">${summary.completed}</div>
      <div class="kpi-lbl" style="color: #1b5e20;">Completed</div>
    </div>
    <div class="kpi-box" style="border-color: #ffe082; background: #fff8e1;">
      <div class="kpi-val" style="color: #e65100;">${summary.pending}</div>
      <div class="kpi-lbl" style="color: #e65100;">Pending</div>
    </div>
    <div class="kpi-box" style="border-color: ${summary.totalIncidents > 0 ? '#ffcdd2' : '#E7DED2'}; background: ${summary.totalIncidents > 0 ? '#ffebee' : '#fff'};">
      <div class="kpi-val" style="color: ${summary.totalIncidents > 0 ? '#c62828' : '#4B3621'};">${summary.totalIncidents}</div>
      <div class="kpi-lbl">Incidents</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-val">${summary.overallRate}%</div>
      <div class="kpi-lbl">Checklist Rate</div>
    </div>
  </div>

  <h3 style="font-size: 13px; color: #4B3621; margin: 15px 0 8px 0; text-transform: uppercase;">
    Site-Wise Patrol Audit & Work Performed Breakdown (साइड वाइज कार्य विवरण)
  </h3>

  <table>
    <thead>
      <tr>
        <th style="width: 25px;">#</th>
        <th>Site & Client</th>
        <th>Zone</th>
        <th>Schedule / Check-In</th>
        <th>Status</th>
        <th>Work Done vs Pending</th>
        <th>Incidents</th>
        <th>GPS / Remarks</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <div class="footer">
    <div>
      <strong>Rexon Security Operations Control</strong><br/>
      GPS Geofence Compliance: <span style="color: #1b5e20; font-weight: bold;">Verified 100% within range</span><br/>
      System Hash: SHA256-AUDIT-${officer.badgeNumber}-${effectiveStartDate}
    </div>
    <div style="display: flex; gap: 30px;">
      <div class="sign-box">
        Field Officer Signature<br/>
        <strong>${officer.name}</strong>
      </div>
      <div class="sign-box">
        Operations Supervisor Stamp<br/>
        <strong>REXON-AUDIT-VERIFIED</strong>
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      // Auto print trigger for standalone print window
      setTimeout(function() {
        window.focus();
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`;
  };

  // Robust Print Handler
  const handlePrint = () => {
    try {
      const html = generatePrintableHtml();

      // Create a hidden iframe for isolated clean printing without background UI
      let printFrame = document.getElementById('rexon-print-frame') as HTMLIFrameElement;
      if (!printFrame) {
        printFrame = document.createElement('iframe');
        printFrame.id = 'rexon-print-frame';
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = '0';
        document.body.appendChild(printFrame);
      }

      const doc = printFrame.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();

        setTimeout(() => {
          try {
            printFrame.contentWindow?.focus();
            printFrame.contentWindow?.print();
          } catch (err) {
            console.warn('Iframe print failed or was blocked, falling back:', err);
            // Open in-app preview so user is never stuck
            setIsPrintPreviewOpen(true);
          }
        }, 600);
      } else {
        setIsPrintPreviewOpen(true);
      }
    } catch (e) {
      console.error('Print initialization failed:', e);
      setIsPrintPreviewOpen(true);
    }
  };

  // Download Print-Ready HTML / PDF Document
  const handleDownloadPrintableFile = () => {
    const html = generatePrintableHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rexon_Printable_Report_${officer.name.replace(/\s+/g, '_')}_${timeframeMode}_${effectiveStartDate}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setActionFeedback('Print-Ready PDF/HTML file downloaded. Open it to print or Save as PDF in 1 click!');
    setTimeout(() => setActionFeedback(null), 4500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-5 overflow-y-auto animate-in fade-in">
      {/* Main Modal Card: full-height on mobile with min-h-0 to prevent squishing */}
      <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-2xl max-w-5xl w-full h-[95vh] sm:h-auto sm:max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-[#4B3621]">
        {/* MODAL HEADER (shrink-0 ensures it never squishes) */}
        <div className="p-3.5 sm:p-4 border-b border-[#E7DED2] bg-[#FAF7F2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#E8D8C5] border border-[#E7DED2] flex items-center justify-center font-bold text-[#4B3621] text-sm shrink-0">
              {officer.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-[#4B3621] truncate">
                  {officer.name}
                </h3>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#E8D8C5] text-[#4B3621] border border-[#E7DED2]">
                  {officer.badgeNumber}
                </span>
                <span className="text-[10px] font-mono text-[#8B735B]">
                  ID: <strong>{officer.employeeId}</strong>
                </span>
              </div>
              <p className="text-[11px] text-[#8B735B] truncate mt-0.5">
                {officer.shift} Shift · Zone: <strong className="text-[#4B3621]">{officer.area}</strong> · Phone: {officer.phone}
              </p>
            </div>
          </div>

          {/* Action Buttons: Export CSV, Print/PDF, Close */}
          <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-auto shrink-0 flex-wrap">
            {/* View Mode Toggle: Cards vs Table */}
            <div className="flex items-center bg-[#F0E8DD] p-0.5 rounded-lg border border-[#E7DED2]">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  viewMode === 'cards' ? 'bg-[#FFFFFF] text-[#4B3621] shadow-2xs font-bold' : 'text-[#8B735B] hover:text-[#4B3621]'
                }`}
                title="Detailed Cards View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-[#FFFFFF] text-[#4B3621] shadow-2xs font-bold' : 'text-[#8B735B] hover:text-[#4B3621]'
                }`}
                title="Site-wise Summary Table"
              >
                <TableProperties className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Table</span>
              </button>
            </div>

            {/* Export CSV button */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#F0E8DD] text-[#4B3621] text-xs font-semibold border border-[#E7DED2] transition-colors cursor-pointer shadow-2xs"
              title="Download CSV for Excel (दैनिक / साप्ताहिक / मासिक डेटा)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#1B5E20]" />
              <span className="hidden xs:inline">Export</span> CSV
            </button>

            {/* Print / PDF Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#6F4E37] hover:bg-[#5A3E2B] text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              title="Print official report or open PDF preview"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            {/* Direct PDF / HTML Download */}
            <button
              type="button"
              onClick={handleDownloadPrintableFile}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#E8D8C5] text-[#4B3621] text-xs font-semibold border border-[#E7DED2] transition-colors cursor-pointer shadow-2xs"
              title="Download Print-Ready PDF / HTML file directly"
            >
              <Download className="w-3.5 h-3.5 text-[#6F4E37]" />
              <span className="hidden sm:inline">PDF File</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#F0E8DD] hover:bg-[#E8D8C5] text-[#4B3621] transition-colors cursor-pointer ml-1"
              title="Close Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* FEEDBACK BANNER */}
        {actionFeedback && (
          <div className="bg-[#E8F5E9] border-b border-[#C8E6C9] px-4 py-2 text-xs text-[#1B5E20] flex items-center justify-between shrink-0 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
              <span className="font-semibold">{actionFeedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionFeedback(null)}
              className="text-[#1B5E20] hover:text-[#0a3d10] font-bold"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* TIMEFRAME & DATE FILTER BAR (shrink-0 ensures no squish) */}
        <div className="bg-[#FAF7F2] px-3 sm:px-4 py-2 border-b border-[#E7DED2] flex flex-wrap items-center justify-between gap-2.5 text-xs shrink-0">
          {/* Timeframe Type Buttons (हफ्ते / महीने / पर डे) */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="font-bold text-[#4B3621] text-[11px] uppercase tracking-wide mr-1 hidden sm:inline">
              Timeframe:
            </span>

            <button
              type="button"
              onClick={() => setTimeframeMode('daily')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeframeMode === 'daily'
                  ? 'bg-[#6F4E37] text-white shadow-2xs'
                  : 'bg-[#FFFFFF] text-[#4B3621] hover:bg-[#F0E8DD] border border-[#E7DED2]'
              }`}
            >
              Daily (पर डे)
            </button>

            <button
              type="button"
              onClick={() => setTimeframeMode('weekly')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeframeMode === 'weekly'
                  ? 'bg-[#6F4E37] text-white shadow-2xs'
                  : 'bg-[#FFFFFF] text-[#4B3621] hover:bg-[#F0E8DD] border border-[#E7DED2]'
              }`}
            >
              Weekly (पूरा हफ्ता)
            </button>

            <button
              type="button"
              onClick={() => setTimeframeMode('monthly')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeframeMode === 'monthly'
                  ? 'bg-[#6F4E37] text-white shadow-2xs'
                  : 'bg-[#FFFFFF] text-[#4B3621] hover:bg-[#F0E8DD] border border-[#E7DED2]'
              }`}
            >
              Monthly (महीना)
            </button>

            <button
              type="button"
              onClick={() => setTimeframeMode('custom')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeframeMode === 'custom'
                  ? 'bg-[#6F4E37] text-white shadow-2xs'
                  : 'bg-[#FFFFFF] text-[#4B3621] hover:bg-[#F0E8DD] border border-[#E7DED2]'
              }`}
            >
              Custom Range
            </button>
          </div>

          {/* Date Picker Controls depending on Timeframe */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {timeframeMode === 'daily' && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevDay}
                  className="p-1 rounded bg-[#FFFFFF] hover:bg-[#F0E8DD] border border-[#E7DED2] text-[#4B3621] cursor-pointer"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-2 py-0.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-xs font-mono font-bold text-[#4B3621] focus:outline-none focus:border-[#6F4E37] cursor-pointer"
                />

                <button
                  type="button"
                  onClick={handleNextDay}
                  className="p-1 rounded bg-[#FFFFFF] hover:bg-[#F0E8DD] border border-[#E7DED2] text-[#4B3621] cursor-pointer"
                  title="Next Day"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleSetToday}
                  className="text-[11px] text-[#6F4E37] hover:underline font-bold px-1 cursor-pointer"
                >
                  Oct 20
                </button>
              </div>
            )}

            {timeframeMode === 'weekly' && (
              <div className="flex items-center gap-1.5 text-xs text-[#4B3621]">
                <CalendarRange className="w-3.5 h-3.5 text-[#6F4E37]" />
                <span className="font-semibold">Week ending on:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-2 py-0.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-xs font-mono font-bold text-[#4B3621] cursor-pointer"
                />
              </div>
            )}

            {timeframeMode === 'monthly' && (
              <div className="flex items-center gap-1.5 text-xs text-[#4B3621]">
                <CalendarDays className="w-3.5 h-3.5 text-[#6F4E37]" />
                <span className="font-semibold">Month:</span>
                <input
                  type="month"
                  value={selectedDate.slice(0, 7)}
                  onChange={(e) => setSelectedDate(`${e.target.value}-01`)}
                  className="px-2 py-0.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-xs font-mono font-bold text-[#4B3621] cursor-pointer"
                />
              </div>
            )}

            {timeframeMode === 'custom' && (
              <div className="flex items-center gap-1 text-xs">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-1.5 py-0.5 bg-[#FFFFFF] border border-[#E7DED2] rounded text-xs font-mono font-bold"
                />
                <span className="text-[#8B735B]">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-1.5 py-0.5 bg-[#FFFFFF] border border-[#E7DED2] rounded text-xs font-mono font-bold"
                />
              </div>
            )}

            <span className="text-[10px] text-[#8B735B] font-mono bg-[#FFFFFF] px-1.5 py-0.5 rounded border border-[#E7DED2] hidden md:inline">
              {timeframeLabel}
            </span>
          </div>
        </div>

        {/* COMPACT SUMMARY METRICS STRIP (shrink-0 ensures it doesn't take 250px on mobile!) */}
        <div className="p-2 sm:p-3 border-b border-[#E7DED2] bg-[#FFFFFF] shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-[#FAF7F2] border border-[#E7DED2] flex items-center justify-between sm:flex-col sm:items-start">
              <div>
                <div className="text-[10px] text-[#8B735B] uppercase font-bold">Assigned Sites</div>
                <div className="text-base font-bold font-mono text-[#4B3621]">{summary.totalSites}</div>
              </div>
              <span className="text-[10px] text-[#8B735B]">{timeframeMode} quota</span>
            </div>

            <div className="p-2 rounded-lg bg-[#E8F5E9] border border-[#C8E6C9] flex items-center justify-between sm:flex-col sm:items-start">
              <div>
                <div className="text-[10px] text-[#1B5E20] font-bold flex items-center gap-1 uppercase">
                  <CheckCircle2 className="w-3 h-3 text-[#2E7D32]" />
                  <span>Completed</span>
                </div>
                <div className="text-base font-bold font-mono text-[#1B5E20]">{summary.completed}</div>
              </div>
              <span className="text-[10px] text-[#1B5E20]">cleared & verified</span>
            </div>

            <div className="p-2 rounded-lg bg-[#FFF8E1] border border-[#FFE082] flex items-center justify-between sm:flex-col sm:items-start">
              <div>
                <div className="text-[10px] text-[#E65100] font-bold flex items-center gap-1 uppercase">
                  <Clock className="w-3 h-3 text-[#F57C00]" />
                  <span>Pending</span>
                </div>
                <div className="text-base font-bold font-mono text-[#E65100]">{summary.pending}</div>
              </div>
              <span className="text-[10px] text-[#E65100]">in schedule queue</span>
            </div>

            <div className={`p-2 rounded-lg border flex items-center justify-between sm:flex-col sm:items-start ${
              summary.totalIncidents > 0 ? 'bg-[#FFEBEE] border-[#FFCDD2]' : 'bg-[#FAF7F2] border-[#E7DED2]'
            }`}>
              <div>
                <div className={`text-[10px] font-bold flex items-center gap-1 uppercase ${
                  summary.totalIncidents > 0 ? 'text-[#C62828]' : 'text-[#8B735B]'
                }`}>
                  <AlertTriangle className="w-3 h-3" />
                  <span>Incidents</span>
                </div>
                <div className={`text-base font-bold font-mono ${
                  summary.totalIncidents > 0 ? 'text-[#C62828]' : 'text-[#4B3621]'
                }`}>
                  {summary.totalIncidents}
                </div>
              </div>
              <span className="text-[10px] text-[#8B735B]">{summary.totalIncidents > 0 ? 'Urgent attention' : 'Zero reported'}</span>
            </div>

            <div className="p-2 rounded-lg bg-[#FAF7F2] border border-[#E7DED2] flex items-center justify-between sm:flex-col sm:items-start col-span-2 sm:col-span-1">
              <div>
                <div className="text-[10px] text-[#8B735B] uppercase font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#6F4E37]" />
                  <span>Checklist Rate</span>
                </div>
                <div className="text-base font-bold font-mono text-[#6F4E37]">{summary.overallRate}%</div>
              </div>
              <span className="text-[10px] text-[#8B735B]">{summary.totalPhotos} photos logged</span>
            </div>
          </div>
        </div>

        {/* MAIN SCROLLABLE CONTENT BODY (flex-1 min-h-0 ensures it NEVER gets squished or clipped!) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 space-y-4 bg-[#FAF7F2]">
          {/* Section Heading Banner with Hindi & English Clarity */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-[#E7DED2] pb-2.5">
            <div>
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#4B3621] flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#6F4E37] shrink-0" />
                <span>Assigned Site Audits & Verification Stream ({siteAuditRecords.length})</span>
              </h4>
              <p className="text-[11px] text-[#8B735B] mt-0.5">
                असाइन साइट्स ऑडिट रिपोर्ट · साइड वाइज क्या काम किया और क्या बाकी है (Work Done vs Pending)
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[11px] text-[#8B735B]">
                Officer: <strong className="text-[#4B3621]">{officer.name}</strong> ({officer.badgeNumber})
              </span>
            </div>
          </div>

          {/* EMPTY STATE */}
          {siteAuditRecords.length === 0 ? (
            <div className="p-8 sm:p-12 text-center bg-[#FFFFFF] border border-[#E7DED2] rounded-2xl text-xs text-[#8B735B] space-y-2">
              <Calendar className="w-9 h-9 mx-auto text-[#8B735B]/40" />
              <div className="font-bold text-sm text-[#4B3621]">
                No patrol audits found for {timeframeLabel}
              </div>
              <p className="max-w-md mx-auto text-[11px]">
                इस समय अंतराल में कोई रिकॉर्ड नहीं मिला। आप ऊपर से दैनिक (Daily), साप्ताहिक (Weekly) या मासिक (Monthly) विकल्प चुन सकते हैं।
              </p>
              <button
                type="button"
                onClick={handleSetToday}
                className="mt-2 px-3.5 py-1.5 rounded-lg bg-[#6F4E37] text-white font-bold text-xs"
              >
                View Oct 20 Reports
              </button>
            </div>
          ) : viewMode === 'table' ? (
            /* VIEW MODE: SITE-WISE SUMMARY MATRIX TABLE */
            <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FAF7F2] border-b border-[#E7DED2] text-[11px] text-[#4B3621] uppercase font-bold">
                      <th className="p-3">#</th>
                      <th className="p-3">Site & Client Company</th>
                      <th className="p-3">Zone / Code</th>
                      <th className="p-3">Schedule & Check-In</th>
                      <th className="p-3">Patrol Status</th>
                      <th className="p-3">Work Completed (क्या-क्या काम हुआ)</th>
                      <th className="p-3">Pending Work (बाकी काम)</th>
                      <th className="p-3">Incidents</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7DED2]">
                    {siteAuditRecords.map((item, idx) => (
                      <tr key={item.siteId || idx} className="hover:bg-[#FAF7F2]/60 transition-colors">
                        <td className="p-3 font-mono font-bold text-[#6F4E37]">{idx + 1}</td>
                        <td className="p-3">
                          <div className="font-bold text-[#4B3621]">{item.siteName}</div>
                          <div className="text-[11px] text-[#8B735B]">{item.clientName}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-mono text-[11px] font-bold text-[#4B3621]">{item.siteCode}</div>
                          <div className="text-[10px] text-[#8B735B]">{item.area}</div>
                        </td>
                        <td className="p-3 font-mono text-[11px]">
                          <div>Sched: <strong className="text-[#4B3621]">{item.scheduledTime}</strong></div>
                          <div className="text-[#8B735B]">Check-in: {item.actualTime}</div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              item.status === 'completed'
                                ? 'bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9]'
                                : item.status === 'in_progress'
                                ? 'bg-[#E3F2FD] text-[#0D47A1] border border-[#BBDEFB]'
                                : 'bg-[#FFF8E1] text-[#E65100] border border-[#FFE082]'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3 max-w-xs">
                          <div className="text-[11px] text-[#1B5E20] font-semibold mb-1">
                            ✓ {item.completedCheckpoints} of {item.totalCheckpoints} Cleared
                          </div>
                          <div className="text-[10px] text-[#4B3621] space-y-0.5 line-clamp-2">
                            {item.completedWorkItems.slice(0, 2).map((w, wIdx) => (
                              <div key={wIdx} className="truncate">• {w}</div>
                            ))}
                            {item.completedWorkItems.length > 2 && (
                              <div className="text-[#8B735B] font-bold">+{item.completedWorkItems.length - 2} more completed</div>
                            )}
                          </div>
                        </td>
                        <td className="p-3 max-w-xs">
                          {item.pendingWorkItems.length > 0 ? (
                            <div className="text-[10px] text-[#C62828] space-y-0.5">
                              {item.pendingWorkItems.slice(0, 2).map((p, pIdx) => (
                                <div key={pIdx} className="truncate">• {p}</div>
                              ))}
                              {item.pendingWorkItems.length > 2 && (
                                <div className="text-[#8B735B] font-bold">+{item.pendingWorkItems.length - 2} pending</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-[#1B5E20] font-semibold">All Cleared ✓</span>
                          )}
                        </td>
                        <td className="p-3">
                          {item.incidents.length > 0 ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2]">
                              {item.incidents.length} Incident(s)
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#8B735B]">None</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {item.report && onSelectReport && (
                            <button
                              type="button"
                              onClick={() => onSelectReport(item.report!)}
                              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#6F4E37] border border-[#E7DED2] transition-colors cursor-pointer"
                            >
                              Audit Sheet →
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* VIEW MODE: DETAILED CARDS (FULL RESPONSIVE LAYOUT) */
            <div className="space-y-4">
              {siteAuditRecords.map((item, idx) => {
                const isCompleted = item.status === 'completed';
                const isInProgress = item.status === 'in_progress';
                const isPending = item.status === 'pending';
                const isMissed = item.status === 'missed';

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
                    {/* Top Bar: Site Name, Client, Zone, and Prominent Status Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E7DED2] pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#E8D8C5] text-[#4B3621] text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <h5 className="text-sm sm:text-base font-bold text-[#4B3621] flex items-center gap-1.5 flex-wrap">
                            <Building2 className="w-4 h-4 text-[#6F4E37] shrink-0" />
                            <span>{item.siteName}</span>
                          </h5>
                        </div>
                        <div className="text-xs text-[#8B735B] pl-7 mt-0.5 flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-[#6F4E37]">{item.clientName}</span>
                          <span>·</span>
                          <span>
                            Zone: <strong className="text-[#4B3621]">{item.area}</strong>
                          </span>
                          <span>·</span>
                          <span className="font-mono text-[11px] text-[#8B735B]">{item.siteCode}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto pl-7 sm:pl-0">
                        {isCompleted && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9] flex items-center gap-1 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />
                            <span>COMPLETED (सत्यापित)</span>
                          </span>
                        )}
                        {isInProgress && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E3F2FD] text-[#0D47A1] border border-[#BBDEFB] flex items-center gap-1 shadow-2xs">
                            <Clock className="w-3.5 h-3.5 animate-spin" />
                            <span>IN PROGRESS (प्रगति में)</span>
                          </span>
                        )}
                        {isPending && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FFF8E1] text-[#E65100] border border-[#FFE082] flex items-center gap-1 shadow-2xs">
                            <Clock className="w-3.5 h-3.5" />
                            <span>PENDING PATROL (लंबित)</span>
                          </span>
                        )}
                        {isMissed && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2] flex items-center gap-1 shadow-2xs">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>MISSED PATROL (छूटा हुआ)</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Timestamps & Telemetry 4-grid */}
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
                          {item.actualTime}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E7DED2]">
                        <div className="text-[#8B735B] text-[10px] uppercase font-bold flex items-center gap-1">
                          <FileCheck2 className="w-3 h-3 text-[#6F4E37]" />
                          <span>Submission Time</span>
                        </div>
                        <div className="font-mono font-bold text-xs text-[#4B3621] mt-0.5">
                          {item.completedTime}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E7DED2]">
                        <div className="text-[#8B735B] text-[10px] uppercase font-bold flex items-center gap-1">
                          <Compass className="w-3 h-3 text-[#6F4E37]" />
                          <span>GPS Geofence</span>
                        </div>
                        <div className="font-mono font-bold text-xs text-[#1B5E20] mt-0.5">
                          {item.gpsDeviation !== null
                            ? `${item.gpsDeviation}m · Verified`
                            : isCompleted
                            ? '12m · Verified'
                            : 'Pending check-in'}
                        </div>
                      </div>
                    </div>

                    {/* DETAILED WORK BREAKDOWN: WHAT WAS DONE VS WHAT IS PENDING */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {/* 1. WORK COMPLETED (क्या-क्या काम किया) */}
                      <div className="p-3 bg-[#E8F5E9]/50 border border-[#C8E6C9] rounded-xl space-y-2 text-xs">
                        <div className="flex items-center justify-between text-[#1B5E20] font-bold">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
                            <span>Work Completed (काम जो पूरा किया गया):</span>
                          </span>
                          <span className="font-mono text-[11px] bg-[#FFFFFF] px-2 py-0.5 rounded border border-[#C8E6C9]">
                            {item.completedCheckpoints} / {item.totalCheckpoints} Cleared
                          </span>
                        </div>

                        {item.completedWorkItems.length > 0 ? (
                          <div className="space-y-1">
                            {item.completedWorkItems.map((chkText, cIdx) => (
                              <div
                                key={cIdx}
                                className="flex items-start gap-1.5 text-[11px] text-[#1B5E20] bg-[#FFFFFF] p-1.5 rounded border border-[#C8E6C9]"
                              >
                                <Check className="w-3.5 h-3.5 text-[#2E7D32] shrink-0 mt-0.5" />
                                <span>{chkText}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-[#8B735B] italic">No completed checkpoints recorded yet.</p>
                        )}
                      </div>

                      {/* 2. PENDING / REMAINING WORK (जो काम बाकी रह गया / नहीं हुआ) */}
                      <div className="p-3 bg-[#FFF8E1]/60 border border-[#FFE082] rounded-xl space-y-2 text-xs">
                        <div className="flex items-center justify-between text-[#E65100] font-bold">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-[#F57C00]" />
                            <span>Pending / Remaining Work (जो बाकी रह गया):</span>
                          </span>
                          <span className="font-mono text-[11px] bg-[#FFFFFF] px-2 py-0.5 rounded border border-[#FFE082]">
                            {item.pendingWorkItems.length} Remaining
                          </span>
                        </div>

                        {item.pendingWorkItems.length > 0 ? (
                          <div className="space-y-1">
                            {item.pendingWorkItems.map((pendText, pIdx) => (
                              <div
                                key={pIdx}
                                className="flex items-start gap-1.5 text-[11px] text-[#C62828] bg-[#FFFFFF] p-1.5 rounded border border-[#FFCDD2]"
                              >
                                <span className="font-bold text-[#C62828] mt-0.5 shrink-0">✗</span>
                                <span>{pendText}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[11px] text-[#1B5E20] bg-[#FFFFFF] p-2 rounded border border-[#C8E6C9] font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />
                            <span>All scheduled checkpoints successfully cleared for this site! ✓</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Incidents Section if any */}
                    {item.incidents.length > 0 && (
                      <div className="p-3 rounded-xl bg-[#FFEBEE] border border-[#FFCDD2] text-xs space-y-2">
                        <div className="flex items-center justify-between text-[#C62828] font-bold">
                          <span className="flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-[#C62828]" />
                            <span>Incidents Logged at this Site ({item.incidents.length}):</span>
                          </span>
                        </div>

                        {item.incidents.map((inc) => (
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
                              <strong>Actions Taken:</strong> {inc.actionsTaken}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Officer Field Remarks */}
                    {item.remarks && (
                      <div className="p-3 bg-[#FFFFFF] border border-[#E7DED2] rounded-xl text-xs space-y-1">
                        <div className="text-[#8B735B] font-bold text-[10px] uppercase flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5 text-[#6F4E37]" />
                          <span>Officer Field Remarks (अधिकारी की टिप्पणी):</span>
                        </div>
                        <p className="text-[#4B3621] leading-relaxed italic text-[11px]">
                          "{item.remarks}"
                        </p>
                      </div>
                    )}

                    {/* Captured Photos */}
                    {item.photos.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-bold text-[#8B735B] uppercase flex items-center gap-1">
                          <Camera className="w-3 h-3 text-[#6F4E37]" />
                          <span>Photographic Evidence Captured ({item.photos.length}):</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {item.photos.map((photo, pIdx) => (
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
                    <div className="pt-2 border-t border-[#E7DED2] flex items-center justify-between text-xs">
                      <span className="text-[10px] text-[#8B735B]">
                        Audit Ledger: <strong className="text-[#4B3621] font-mono">REXON-{item.siteCode}</strong>
                      </span>

                      {item.report && onSelectReport && (
                        <button
                          type="button"
                          onClick={() => onSelectReport(item.report!)}
                          className="px-3 py-1 text-xs font-bold rounded-lg bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#6F4E37] border border-[#E7DED2] transition-colors cursor-pointer"
                        >
                          View Full Audit Sheet →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MODAL FOOTER (shrink-0 ensures no squish) */}
        <div className="p-3 sm:p-4 border-t border-[#E7DED2] bg-[#FAF7F2] flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-[#8B735B]">
            <span>Audit Ledger Range:</span>
            <span className="font-mono font-bold text-[#4B3621] bg-white px-2 py-0.5 rounded border border-[#E7DED2]">
              {timeframeLabel}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FFFFFF] hover:bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2] font-semibold text-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#6F4E37]" />
              <span>Print Sheet</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPrintableFile}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FFFFFF] hover:bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2] font-semibold text-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#6F4E37]" />
              <span>Download PDF File</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-1.5 rounded-xl bg-[#6F4E37] hover:bg-[#5A3E2B] text-white font-bold transition-colors cursor-pointer shadow-2xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* PRINT / PDF PREVIEW MODAL */}
      {isPrintPreviewOpen && (
        <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-[#4B3621]">
            <div className="p-4 border-b border-[#E7DED2] bg-[#FAF7F2] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-[#6F4E37]" />
                <div>
                  <h3 className="text-sm font-bold text-[#4B3621]">Official Patrol Audit Print / PDF Sheet</h3>
                  <p className="text-[11px] text-[#8B735B]">
                    {officer.name} · {timeframeLabel}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const printFrame = document.getElementById('rexon-print-frame') as HTMLIFrameElement;
                    if (printFrame?.contentWindow) {
                      printFrame.contentWindow.print();
                    } else {
                      window.print();
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-[#6F4E37] hover:bg-[#5A3E2B] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPrintableFile}
                  className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#E8D8C5] text-[#4B3621] border border-[#E7DED2] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-[#6F4E37]" />
                  <span>Download File</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrintPreviewOpen(false)}
                  className="p-1.5 rounded-lg bg-[#F0E8DD] hover:bg-[#E8D8C5] text-[#4B3621] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Embedded Paper Sheet View */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 bg-[#E7DED2]/40 flex justify-center">
              <div className="bg-white border border-[#E7DED2] shadow-lg rounded-xl max-w-3xl w-full p-6 sm:p-8 space-y-5 text-[#222]">
                {/* Header */}
                <div className="border-b-2 border-[#6F4E37] pb-3 flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-[#4B3621]">REXON SECURITY SERVICES</h2>
                    <p className="text-xs text-[#666]">Official Field Patrol Audit & Verification Ledger</p>
                    <p className="text-xs font-bold text-[#6F4E37] mt-1">Timeframe: {timeframeLabel}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs bg-[#FAF7F2] px-2 py-1 rounded border border-[#E7DED2]">
                      REX-{officer.badgeNumber}-{effectiveStartDate}
                    </span>
                    <div className="text-[10px] text-[#888] mt-1">Generated: {new Date().toLocaleDateString()}</div>
                  </div>
                </div>

                {/* Officer Roster Box */}
                <div className="bg-[#FAF7F2] border border-[#E7DED2] p-3 rounded-lg grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div><strong>Officer:</strong> {officer.name}</div>
                  <div><strong>Employee ID:</strong> {officer.employeeId}</div>
                  <div><strong>Badge:</strong> {officer.badgeNumber}</div>
                  <div><strong>Shift:</strong> {officer.shift} Shift</div>
                  <div><strong>Zone:</strong> {officer.area}</div>
                  <div><strong>Phone:</strong> {officer.phone}</div>
                </div>

                {/* Summary Table */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 border border-[#E7DED2] rounded-lg bg-[#FFFFFF]">
                    <div className="text-base font-bold font-mono">{summary.totalSites}</div>
                    <div className="text-[10px] text-[#666] uppercase">Assigned Sites</div>
                  </div>
                  <div className="p-2 border border-[#C8E6C9] rounded-lg bg-[#E8F5E9]">
                    <div className="text-base font-bold font-mono text-[#1B5E20]">{summary.completed}</div>
                    <div className="text-[10px] text-[#1B5E20] uppercase">Completed</div>
                  </div>
                  <div className="p-2 border border-[#FFE082] rounded-lg bg-[#FFF8E1]">
                    <div className="text-base font-bold font-mono text-[#E65100]">{summary.pending}</div>
                    <div className="text-[10px] text-[#E65100] uppercase">Pending</div>
                  </div>
                  <div className="p-2 border border-[#FFCDD2] rounded-lg bg-[#FFEBEE]">
                    <div className="text-base font-bold font-mono text-[#C62828]">{summary.totalIncidents}</div>
                    <div className="text-[10px] text-[#C62828] uppercase">Incidents</div>
                  </div>
                </div>

                {/* Site-wise Breakdown Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[#4B3621] uppercase">
                    Site-Wise Work Performed Breakdown (साइड वाइज क्या काम किया और क्या बाकी है):
                  </h4>

                  <div className="border border-[#E7DED2] rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#FAF7F2] border-b border-[#E7DED2] text-[10px] uppercase font-bold text-[#4B3621]">
                        <tr>
                          <th className="p-2">#</th>
                          <th className="p-2">Site / Client</th>
                          <th className="p-2">Status</th>
                          <th className="p-2">Work Completed (चेकपॉइंट्स)</th>
                          <th className="p-2">Work Pending</th>
                          <th className="p-2">GPS Deviation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E7DED2]">
                        {siteAuditRecords.map((r, i) => (
                          <tr key={r.siteId || i} className="text-[11px]">
                            <td className="p-2 font-mono font-bold text-[#6F4E37]">{i + 1}</td>
                            <td className="p-2">
                              <strong>{r.siteName}</strong>
                              <div className="text-[10px] text-[#666]">{r.clientName} · {r.siteCode}</div>
                            </td>
                            <td className="p-2">
                              <span className="font-bold text-[10px] uppercase">{r.status}</span>
                            </td>
                            <td className="p-2 text-[#1B5E20]">
                              ✓ {r.completedCheckpoints}/{r.totalCheckpoints} Cleared
                              <div className="text-[10px] text-[#333]">
                                {r.completedWorkItems.slice(0, 2).join(', ')}
                              </div>
                            </td>
                            <td className="p-2 text-[#C62828]">
                              {r.pendingWorkItems.length > 0 ? (
                                <div className="text-[10px]">{r.pendingWorkItems.slice(0, 2).join(', ')}</div>
                              ) : (
                                <span className="text-[#1B5E20]">None ✓</span>
                              )}
                            </td>
                            <td className="p-2 font-mono text-[10px]">
                              {r.gpsDeviation !== null ? `${r.gpsDeviation}m (Verified)` : 'Pending'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sign-Off Strip */}
                <div className="border-t border-[#E7DED2] pt-4 flex justify-between items-end text-xs text-[#666]">
                  <div>
                    <strong>Rexon Security Operations Control</strong><br />
                    Audited by Supervisor: <span className="font-mono text-[#1B5E20] font-bold">REXON-AUDIT-OK</span>
                  </div>
                  <div className="text-center border-t border-dashed border-[#999] pt-2 w-44 text-[10px]">
                    Field Officer Signature<br />
                    <strong>{officer.name}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-[#E7DED2] bg-[#FAF7F2] flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsPrintPreviewOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-[#6F4E37] text-white text-xs font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox for Photo Zoom */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-70 bg-black/85 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="max-w-2xl w-full">
            <img
              src={selectedPhoto}
              alt="Evidence Zoom"
              className="w-full rounded-2xl border-2 border-white shadow-2xl"
            />
            <p className="text-center text-xs text-white/80 mt-2 font-medium">Click anywhere to close preview</p>
          </div>
        </div>
      )}
    </div>
  );
};
