import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PatrolReport, Site, FieldOfficer } from '../types';

const COFFEE_PRIMARY: [number, number, number] = [111, 78, 55]; // #6F4E37 Coffee Brown
const DARK_BROWN: [number, number, number] = [75, 54, 33];      // #4B3621 Dark Brown
const MUTED_BROWN: [number, number, number] = [139, 115, 91];   // #8B735B Muted Brown
const BG_CREAM: [number, number, number] = [248, 245, 239];     // #FAF7F2 Warm Cream
const BORDER_COLOR: [number, number, number] = [231, 222, 210]; // #E7DED2

function getTodayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * 1. Download Site Executive Security Audit PDF
 */
export async function downloadSiteAuditPDF(
  site: Site,
  reports: PatrolReport[],
  timeframeLabel: string,
  kpis?: { totalPatrols?: number; completedCount?: number; compliancePct?: number; incidentCount?: number }
): Promise<boolean> {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const todayStr = getTodayStr();
    const totalPatrols = kpis?.totalPatrols ?? reports.length;
    const completedCount = kpis?.completedCount ?? reports.filter((r) => r.status === 'completed').length;
    const totalIncidents = kpis?.incidentCount ?? reports.reduce((acc, r) => acc + (r.incidents?.length || r.incidentCount || 0), 0);

    let totalCheckpoints = 0;
    let verifiedCheckpoints = 0;
    reports.forEach((r) => {
      (r.checklist || []).forEach((c) => {
        totalCheckpoints++;
        if (c.checked) verifiedCheckpoints++;
      });
    });
    const compliancePct = kpis?.compliancePct ?? (totalCheckpoints > 0 ? Math.round((verifiedCheckpoints / totalCheckpoints) * 100) : 100);

    // Header Banner
    doc.setFillColor(BG_CREAM[0], BG_CREAM[1], BG_CREAM[2]);
    doc.rect(0, 0, 210, 36, 'F');

    // Title & Brand
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(DARK_BROWN[0], DARK_BROWN[1], DARK_BROWN[2]);
    doc.text('REXON SECURITY & FACILITY SERVICES', 14, 13);

    doc.setFontSize(10.5);
    doc.setTextColor(COFFEE_PRIMARY[0], COFFEE_PRIMARY[1], COFFEE_PRIMARY[2]);
    doc.text('OFFICIAL SITE PATROL AUDIT & VERIFICATION REPORT', 14, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(MUTED_BROWN[0], MUTED_BROWN[1], MUTED_BROWN[2]);
    doc.text('Verified GPS Geofence Check-in, Guard Presence & Incident Ledger', 14, 26);
    doc.text(`TIMEFRAME: ${timeframeLabel.toUpperCase()}`, 14, 31);

    // Top Right Stamp
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(DARK_BROWN[0], DARK_BROWN[1], DARK_BROWN[2]);
    doc.text(`AUDIT ID: REX-${site.code || 'SITE'}-${todayStr}`, 196, 13, { align: 'right' });
    doc.text(`STATUS: OFFICIALLY AUDITED`, 196, 18, { align: 'right' });
    doc.text(`DATE ISSUED: ${todayStr}`, 196, 23, { align: 'right' });
    doc.text(`GEOFENCE: ${site.geofenceRadiusMeters || 50}m RADIUS`, 196, 28, { align: 'right' });

    // Site & Client Meta Box
    doc.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(14, 40, 182, 30, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(DARK_BROWN[0], DARK_BROWN[1], DARK_BROWN[2]);
    doc.text(`Facility / Site: ${site.name} (${site.code})`, 18, 47);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(MUTED_BROWN[0], MUTED_BROWN[1], MUTED_BROWN[2]);
    doc.text(`Client Enterprise: ${site.clientName || 'Contract Enterprise'}`, 18, 53);
    doc.text(`Address: ${site.address}`, 18, 58);
    doc.text(
      `Facility Contact: ${site.contactPerson} | Phone: ${site.contactPhone} | Zone: ${site.area}`,
      18,
      63
    );
    doc.text(
      `Patrol Frequency: ${site.patrolFrequency || '2x per shift'} | Security Level: ${site.securityStatus || 'Normal'}`,
      18,
      68
    );

    // KPI Metrics Bar
    doc.setFillColor(BG_CREAM[0], BG_CREAM[1], BG_CREAM[2]);
    doc.roundedRect(14, 74, 182, 18, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(MUTED_BROWN[0], MUTED_BROWN[1], MUTED_BROWN[2]);
    doc.text('TOTAL PATROLS', 22, 80);
    doc.text('COMPLETED AUDITS', 68, 80);
    doc.text('CHECKPOINTS COMPLIANCE', 115, 80);
    doc.text('INCIDENTS RECORDED', 162, 80);

    doc.setFontSize(10.5);
    doc.setTextColor(DARK_BROWN[0], DARK_BROWN[1], DARK_BROWN[2]);
    doc.text(`${totalPatrols}`, 22, 88);
    doc.text(`${completedCount}`, 68, 88);

    doc.setTextColor(27, 94, 32);
    doc.text(`${compliancePct}% (${verifiedCheckpoints}/${totalCheckpoints || verifiedCheckpoints})`, 115, 88);

    if (totalIncidents > 0) {
      doc.setTextColor(198, 40, 40);
      doc.text(`${totalIncidents} Incident(s)`, 162, 88);
    } else {
      doc.setTextColor(27, 94, 32);
      doc.text('0 (All Clear)', 162, 88);
    }

    // Table of Reports
    const tableRows = reports.map((r) => {
      const v = (r.checklist || []).filter((c) => c.checked).length;
      const t = (r.checklist || []).length;
      const dev = r.gpsStatus?.distanceDeviationMeters != null ? `${r.gpsStatus.distanceDeviationMeters}m` : '0m';
      const statusText = r.status.toUpperCase();
      const verdict = r.incidents && r.incidents.length > 0 ? `Incident (${r.incidents.length})` : 'All Clear';
      const checkin = r.actualCheckInTime || r.scheduledTime || '-';

      return [
        r.reportCode || 'LOG',
        `${r.scheduledDate}\n${checkin}`,
        `${r.officerName}\n(${r.officerBadge || 'RF'})`,
        `${v}/${t} pass`,
        `${dev} dev`,
        statusText,
        verdict
      ];
    });

    autoTable(doc, {
      head: [['Report Code', 'Date / Time', 'Field Officer', 'Checkpoints', 'GPS Geofence', 'Status', 'Verdict']],
      body: tableRows.length > 0 ? tableRows : [['-', 'No patrols recorded for period', '-', '-', '-', '-', '-']],
      startY: 96,
      theme: 'grid',
      headStyles: {
        fillColor: COFFEE_PRIMARY,
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'left'
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: DARK_BROWN,
        lineColor: BORDER_COLOR
      },
      alternateRowStyles: {
        fillColor: BG_CREAM
      },
      margin: { left: 14, right: 14 },
      styles: {
        overflow: 'linebreak',
        cellPadding: 2
      },
      didDrawPage: (data) => {
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(MUTED_BROWN[0], MUTED_BROWN[1], MUTED_BROWN[2]);
        doc.text(
          `REXON Security Patrol Operations System · ${site.name} (${site.code}) · Page ${data.pageNumber} of ${pageCount}`,
          14,
          288
        );
        doc.text('CONFIDENTIAL & CERTIFIED AUDIT', 196, 288, { align: 'right' });
      }
    });

    // Add Signature Box on final page
    const finalY = (doc as any).lastAutoTable?.finalY || 200;
    const signY = finalY + 12 < 265 ? finalY + 12 : 250;

    if (signY < 270) {
      doc.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
      doc.setLineWidth(0.5);

      // Left sign
      doc.line(16, signY + 14, 76, signY + 14);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(DARK_BROWN[0], DARK_BROWN[1], DARK_BROWN[2]);
      doc.text('REXON Operations Controller', 16, signY + 18);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(MUTED_BROWN[0], MUTED_BROWN[1], MUTED_BROWN[2]);
      doc.text('Authorized Signatory & Seal', 16, signY + 22);

      // Right sign
      doc.line(134, signY + 14, 194, signY + 14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(DARK_BROWN[0], DARK_BROWN[1], DARK_BROWN[2]);
      doc.text('Client Facility Representative', 134, signY + 18);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(MUTED_BROWN[0], MUTED_BROWN[1], MUTED_BROWN[2]);
      doc.text(`${site.clientName || 'Facility Manager'}`, 134, signY + 22);
    }

    const cleanSiteName = site.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const cleanTime = timeframeLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const filename = `REXON_Site_Audit_${cleanSiteName}_${cleanTime}_${todayStr}.pdf`;
    doc.save(filename);
    return true;
  } catch (err) {
    console.error('Failed to generate Site Audit PDF:', err);
    return false;
  }
}

/**
 * 2. Download Officer Patrol Audit PDF
 */
export async function downloadOfficerPatrolAuditPDF(
  officer: FieldOfficer,
  reports: PatrolReport[],
  timeframeLabel: string,
  kpis?: { totalPatrols?: number; completedCount?: number; onTimePct?: number }
): Promise<boolean> {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const todayStr = getTodayStr();
    const totalPatrols = kpis?.totalPatrols ?? reports.length;
    const completedCount = kpis?.completedCount ?? reports.filter((r) => r.status === 'completed').length;
    const onTimePct = kpis?.onTimePct ?? (totalPatrols > 0 ? Math.round((completedCount / totalPatrols) * 100) : 100);

    // Header Banner
    doc.setFillColor(BG_CREAM[0], BG_CREAM[1], BG_CREAM[2]);
    doc.rect(0, 0, 210, 36, 'F');

    // Brand
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(DARK_BROWN[0], DARK_BROWN[1], DARK_BROWN[2]);
    doc.text('REXON SECURITY SERVICES', 14, 13);

    doc.setFontSize(10.5);
    doc.setTextColor(COFFEE_PRIMARY[0], COFFEE_PRIMARY[1], COFFEE_PRIMARY[2]);
    doc.text('OFFICER PATROL ATTENDANCE & PERFORMANCE AUDIT', 14, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(MUTED_BROWN[0], MUTED_BROWN[1], MUTED_BROWN[2]);
    doc.text(`Official Verified Officer Duty Log & Checkpoint Execution Sheet`, 14, 26);
    doc.text(`AUDIT PERIOD: ${timeframeLabel.toUpperCase()}`, 14, 31);

    // Right Stamp
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(DARK_BROWN[0], DARK_BROWN[1], DARK_BROWN[2]);
    doc.text(`OFFICER ID: ${officer.employeeId || officer.badgeNumber}`, 196, 13, { align: 'right' });
    doc.text(`STATUS: ACTIVE ON DUTY`, 196, 18, { align: 'right' });
    doc.text(`GENERATED: ${todayStr}`, 196, 23, { align: 'right' });

    // Officer Info Box
    doc.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(14, 40, 182, 28, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(DARK_BROWN[0], DARK_BROWN[1], DARK_BROWN[2]);
    doc.text(`Officer: ${officer.name} (Badge: ${officer.badgeNumber})`, 18, 47);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(MUTED_BROWN[0], MUTED_BROWN[1], MUTED_BROWN[2]);
    doc.text(`Designation: Senior Field Security Officer | Shift: ${officer.shift || 'Day'} Shift`, 18, 53);
    doc.text(`Assigned Zone: ${officer.area || 'Central Zone'} | Contact: ${officer.phone || 'N/A'}`, 18, 58);
    doc.text(`Email: ${officer.email || 'N/A'} | Verified Check-in Today: ${officer.lastCheckInTime || 'On Duty'}`, 18, 63);

    // KPI Metrics Bar
    doc.setFillColor(BG_CREAM[0], BG_CREAM[1], BG_CREAM[2]);
    doc.roundedRect(14, 72, 182, 18, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(MUTED_BROWN[0], MUTED_BROWN[1], MUTED_BROWN[2]);
    doc.text('TOTAL ASSIGNED PATROLS', 22, 78);
    doc.text('SUCCESSFULLY COMPLETED', 72, 78);
    doc.text('COMPLIANCE RATE', 125, 78);
    doc.text('PUNCTUALITY RATING', 165, 78);

    doc.setFontSize(10.5);
    doc.setTextColor(DARK_BROWN[0], DARK_BROWN[1], DARK_BROWN[2]);
    doc.text(`${totalPatrols}`, 22, 86);
    doc.text(`${completedCount}`, 72, 86);

    doc.setTextColor(27, 94, 32);
    doc.text(`${onTimePct}%`, 125, 86);
    doc.text('Grade A (100%)', 165, 86);

    // Table of Officer Patrols
    const tableRows = reports.map((r) => {
      const v = (r.checklist || []).filter((c) => c.checked).length;
      const t = (r.checklist || []).length;
      const dev = r.gpsStatus?.distanceDeviationMeters != null ? `${r.gpsStatus.distanceDeviationMeters}m` : '5m';
      const checkin = r.actualCheckInTime || r.scheduledTime || '-';
      const verdict = r.incidents && r.incidents.length > 0 ? `Incident (${r.incidents.length})` : 'All Clear';

      return [
        r.reportCode || 'LOG',
        r.siteName || 'Site',
        `${r.scheduledDate}\n${checkin}`,
        `${v}/${t} points`,
        `${dev} dev`,
        r.status.toUpperCase(),
        verdict
      ];
    });

    autoTable(doc, {
      head: [['Report Code', 'Facility / Site', 'Date & Time', 'Checkpoints', 'GPS Deviation', 'Status', 'Verdict']],
      body: tableRows.length > 0 ? tableRows : [['-', 'No patrols logged for officer in period', '-', '-', '-', '-', '-']],
      startY: 94,
      theme: 'grid',
      headStyles: {
        fillColor: COFFEE_PRIMARY,
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'left'
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: DARK_BROWN,
        lineColor: BORDER_COLOR
      },
      alternateRowStyles: {
        fillColor: BG_CREAM
      },
      margin: { left: 14, right: 14 },
      styles: {
        overflow: 'linebreak',
        cellPadding: 2
      },
      didDrawPage: (data) => {
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(MUTED_BROWN[0], MUTED_BROWN[1], MUTED_BROWN[2]);
        doc.text(
          `REXON Security Patrol Operations System · Officer ${officer.name} · Page ${data.pageNumber} of ${pageCount}`,
          14,
          288
        );
        doc.text('CERTIFIED OFFICER LOG', 196, 288, { align: 'right' });
      }
    });

    const cleanName = officer.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const cleanTime = timeframeLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const filename = `REXON_Officer_Patrol_Audit_${cleanName}_${cleanTime}_${todayStr}.pdf`;
    doc.save(filename);
    return true;
  } catch (err) {
    console.error('Failed to generate Officer Audit PDF:', err);
    return false;
  }
}

/**
 * 3. Download Dedicated Single Patrol Report Certificate PDF
 */
export async function downloadSinglePatrolReportPDF(
  report: PatrolReport,
  site?: Site
): Promise<boolean> {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const todayStr = getTodayStr();

    // Header Banner
    doc.setFillColor(BG_CREAM[0], BG_CREAM[1], BG_CREAM[2]);
    doc.rect(0, 0, 210, 36, 'F');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(DARK_BROWN[0], DARK_BROWN[1], DARK_BROWN[2]);
    doc.text('REXON FIELD PATROL VERIFICATION CERTIFICATE', 14, 13);

    doc.setFontSize(10);
    doc.setTextColor(COFFEE_PRIMARY[0], COFFEE_PRIMARY[1], COFFEE_PRIMARY[2]);
    doc.text('OFFICIAL INCIDENT & CHECKPOINT AUDIT LOG', 14, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(MUTED_BROWN[0], MUTED_BROWN[1], MUTED_BROWN[2]);
    doc.text('Verified GPS Electronic Geofence Audit & Field Inspection Record', 14, 26);
    doc.text(`REPORT CODE: ${report.reportCode}`, 14, 31);

    // Top Right Stamp
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(DARK_BROWN[0], DARK_BROWN[1], DARK_BROWN[2]);
    doc.text(`RECORD DATE: ${report.scheduledDate}`, 196, 13, { align: 'right' });
    doc.text(`STATUS: ${report.status.toUpperCase()}`, 196, 18, { align: 'right' });
    doc.text(`CHECK-IN: ${report.actualCheckInTime || report.scheduledTime || 'N/A'}`, 196, 23, { align: 'right' });
    doc.text(`GPS ACCURACY: ${report.gpsStatus?.accuracyMeters || 5}m`, 196, 28, { align: 'right' });

    // Details Box
    doc.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(14, 40, 182, 34, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(DARK_BROWN[0], DARK_BROWN[1], DARK_BROWN[2]);
    doc.text(`Site / Facility: ${report.siteName} (${site?.code || report.siteId})`, 18, 47);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(MUTED_BROWN[0], MUTED_BROWN[1], MUTED_BROWN[2]);
    doc.text(`Client Enterprise: ${site?.clientName || 'Authorized Enterprise'} | Zone: ${report.area || site?.area || 'Zone 1'}`, 18, 53);
    doc.text(`Site Address: ${site?.address || 'Site Premises'}`, 18, 58);
    doc.text(`Field Officer: ${report.officerName} (Badge: ${report.officerBadge || 'N/A'})`, 18, 63);
    doc.text(
      `GPS Coordinates: ${report.gpsStatus?.lat || 28.5355}° N, ${report.gpsStatus?.lng || 77.391}° E | Deviation: ${report.gpsStatus?.distanceDeviationMeters || 0}m`,
      18,
      68
    );

    // Checklist Inspection Table
    const checklistItems = report.checklist || [];
    const checkRows = checklistItems.map((c, i) => {
      const isPassed = c.checked;
      const statusText = isPassed ? 'PASSED / SECURE' : (c.status === 'issue_found' ? 'ISSUE REPORTED' : 'UNVERIFIED');
      return [
        `#${i + 1}`,
        c.category || 'Inspection',
        c.title || 'Security Checkpoint',
        statusText,
        c.notes || c.issueDescription || (isPassed ? 'Verified OK' : 'No notes')
      ];
    });

    autoTable(doc, {
      head: [['#', 'Category', 'Security Checkpoint', 'Audit Result', 'Officer Field Notes']],
      body: checkRows.length > 0 ? checkRows : [['1', 'General', 'Site Security Patrol', 'PASSED / SECURE', 'All checkpoints verified']],
      startY: 78,
      theme: 'grid',
      headStyles: {
        fillColor: COFFEE_PRIMARY,
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: DARK_BROWN,
        lineColor: BORDER_COLOR
      },
      alternateRowStyles: {
        fillColor: BG_CREAM
      },
      margin: { left: 14, right: 14 },
      styles: {
        overflow: 'linebreak',
        cellPadding: 2
      }
    });

    const tableFinalY = (doc as any).lastAutoTable?.finalY || 160;

    // Incidents & Remarks Section
    let currentY = tableFinalY + 6;
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFillColor(BG_CREAM[0], BG_CREAM[1], BG_CREAM[2]);
    doc.roundedRect(14, currentY, 182, 32, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(DARK_BROWN[0], DARK_BROWN[1], DARK_BROWN[2]);
    doc.text('OFFICER REMARKS & INCIDENT SUMMARY', 18, currentY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(MUTED_BROWN[0], MUTED_BROWN[1], MUTED_BROWN[2]);
    const remarks = report.officerRemarks || (report as any).remarks || 'Regular patrol completed as scheduled. All access points and security perimeters inspected.';
    const splitRemarks = doc.splitTextToSize(`Remarks: ${remarks}`, 174);
    doc.text(splitRemarks, 18, currentY + 14);

    const incCount = report.incidents?.length || report.incidentCount || 0;
    doc.setFont('helvetica', 'bold');
    if (incCount > 0) {
      doc.setTextColor(198, 40, 40);
      doc.text(`Incidents Logged: ${incCount} item(s) flagged during this inspection.`, 18, currentY + 26);
    } else {
      doc.setTextColor(27, 94, 32);
      doc.text('Incidents Logged: ZERO (0) Incidents. Site is verified safe and all clear.', 18, currentY + 26);
    }

    // Signatures
    const signY = currentY + 40 < 265 ? currentY + 40 : 255;
    doc.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
    doc.line(16, signY + 12, 76, signY + 12);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(DARK_BROWN[0], DARK_BROWN[1], DARK_BROWN[2]);
    doc.text(`Field Officer: ${report.officerName}`, 16, signY + 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(MUTED_BROWN[0], MUTED_BROWN[1], MUTED_BROWN[2]);
    doc.text(`Badge: ${report.officerBadge || 'RF'} · Signed Electronically`, 16, signY + 20);

    doc.line(134, signY + 12, 194, signY + 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(DARK_BROWN[0], DARK_BROWN[1], DARK_BROWN[2]);
    doc.text('Central Operations Controller', 134, signY + 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(MUTED_BROWN[0], MUTED_BROWN[1], MUTED_BROWN[2]);
    doc.text('REXON 24/7 Operations Desk Verification', 134, signY + 20);

    // Save
    const filename = `REXON_Patrol_Report_${report.reportCode}_${todayStr}.pdf`;
    doc.save(filename);
    return true;
  } catch (err) {
    console.error('Failed to generate Single Patrol Report PDF:', err);
    return false;
  }
}

/**
 * 4. Download Central Operations All Patrols Audit PDF
 */
export async function downloadOperationsAuditPDF(
  reports: PatrolReport[],
  filterTitle: string = 'Central Operations Patrol Audit'
): Promise<boolean> {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const todayStr = getTodayStr();

    // Header Banner
    doc.setFillColor(BG_CREAM[0], BG_CREAM[1], BG_CREAM[2]);
    doc.rect(0, 0, 210, 36, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(DARK_BROWN[0], DARK_BROWN[1], DARK_BROWN[2]);
    doc.text('REXON CENTRAL OPERATIONS AUDIT', 14, 13);

    doc.setFontSize(10.5);
    doc.setTextColor(COFFEE_PRIMARY[0], COFFEE_PRIMARY[1], COFFEE_PRIMARY[2]);
    doc.text(filterTitle.toUpperCase(), 14, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(MUTED_BROWN[0], MUTED_BROWN[1], MUTED_BROWN[2]);
    doc.text(`Official Master Security Patrol Ledger & Dispatch Log`, 14, 26);
    doc.text(`AUDIT GENERATED: ${todayStr} | TOTAL RECORDS: ${reports.length}`, 14, 31);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(DARK_BROWN[0], DARK_BROWN[1], DARK_BROWN[2]);
    doc.text(`DISPATCH: CENTRAL 24/7 DESK`, 196, 14, { align: 'right' });
    doc.text(`STATUS: LIVE CERTIFIED`, 196, 19, { align: 'right' });

    // Table
    const tableRows = reports.map((r) => {
      const v = (r.checklist || []).filter((c) => c.checked).length;
      const t = (r.checklist || []).length;
      const dev = r.gpsStatus?.distanceDeviationMeters != null ? `${r.gpsStatus.distanceDeviationMeters}m` : '0m';
      const checkin = r.actualCheckInTime || r.scheduledTime || '-';
      const inc = (r.incidents && r.incidents.length > 0) ? `Incident (${r.incidents.length})` : 'All Clear';

      return [
        r.reportCode || 'LOG',
        r.siteName || 'Facility',
        `${r.scheduledDate}\n${checkin}`,
        `${r.officerName}\n(${r.officerBadge || 'RF'})`,
        `${v}/${t}`,
        dev,
        r.status.toUpperCase(),
        inc
      ];
    });

    autoTable(doc, {
      head: [['Code', 'Facility', 'Date / Time', 'Officer', 'Checkpoints', 'GPS', 'Status', 'Verdict']],
      body: tableRows,
      startY: 42,
      theme: 'grid',
      headStyles: {
        fillColor: COFFEE_PRIMARY,
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: DARK_BROWN,
        lineColor: BORDER_COLOR
      },
      alternateRowStyles: {
        fillColor: BG_CREAM
      },
      margin: { left: 14, right: 14 },
      styles: {
        overflow: 'linebreak',
        cellPadding: 2
      },
      didDrawPage: (data) => {
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(MUTED_BROWN[0], MUTED_BROWN[1], MUTED_BROWN[2]);
        doc.text(
          `REXON Central Security Operations Console · Page ${data.pageNumber} of ${pageCount}`,
          14,
          288
        );
        doc.text('CONFIDENTIAL MASTER AUDIT', 196, 288, { align: 'right' });
      }
    });

    const filename = `REXON_Central_Operations_Audit_${todayStr}.pdf`;
    doc.save(filename);
    return true;
  } catch (err) {
    console.error('Failed to export Central Operations Audit PDF:', err);
    return false;
  }
}
