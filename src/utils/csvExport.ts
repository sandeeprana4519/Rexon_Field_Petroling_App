import { PatrolReport, Assignment } from '../types';

/**
 * Escapes CSV field value to ensure valid RFC 4180 output.
 */
function escapeCsvValue(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Triggers a real browser file download for CSV content.
 */
function triggerDownload(csvContent: string, fileName: string): void {
  // \uFEFF is the UTF-8 BOM so Excel and Google Sheets render non-ASCII & Hindi characters properly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export Patrol Reports to CSV.
 */
export function downloadPatrolReportsCSV(reports: PatrolReport[], customFilename?: string): void {
  const headers = [
    'Report ID',
    'Date',
    'Site Name',
    'Patrol Zone',
    'Officer Name',
    'Officer Badge',
    'Scheduled Time',
    'Actual Check-In',
    'Completed Time',
    'Status',
    'Verdict',
    'GPS Deviation (meters)',
    'Checkpoints Total',
    'Checkpoints Verified',
    'Incident Count',
    'Remarks / Notes'
  ];

  const rows = reports.map((rep) => {
    const verifiedCheckpoints = rep.checklist ? rep.checklist.filter((c) => c.checked).length : 0;
    const totalCheckpoints = rep.checklist ? rep.checklist.length : 0;
    const deviation = rep.gpsStatus?.distanceDeviationMeters != null ? `${rep.gpsStatus.distanceDeviationMeters}m` : 'N/A';

    return [
      escapeCsvValue(rep.reportCode),
      escapeCsvValue(rep.scheduledDate),
      escapeCsvValue(rep.siteName),
      escapeCsvValue(rep.area),
      escapeCsvValue(rep.officerName),
      escapeCsvValue(rep.officerBadge),
      escapeCsvValue(rep.scheduledTime),
      escapeCsvValue(rep.actualCheckInTime || 'Pending'),
      escapeCsvValue(rep.completedAt || 'N/A'),
      escapeCsvValue(rep.status.toUpperCase()),
      escapeCsvValue(rep.finalVerdict || 'completed'),
      escapeCsvValue(deviation),
      escapeCsvValue(totalCheckpoints),
      escapeCsvValue(verifiedCheckpoints),
      escapeCsvValue(rep.incidentCount || 0),
      escapeCsvValue(rep.officerRemarks || '')
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const filename = customFilename || `rexon_patrol_reports_${new Date().toISOString().split('T')[0]}.csv`;
  triggerDownload(csvContent, filename);
}

/**
 * Export Assignments / Shift Allocations to CSV.
 */
export function downloadAssignmentsCSV(assignments: Assignment[], customFilename?: string): void {
  const headers = [
    'Assignment ID',
    'Site Name',
    'Client Organization',
    'Patrol Area / Zone',
    'Officer Name',
    'Badge Number',
    'Shift',
    'Start Date',
    'End Date',
    'Duration (Days)',
    'Scheduled Time',
    'Patrol Frequency',
    'Working Days',
    'Patrol Quota',
    'Patrols Completed',
    'Status',
    'Instructions / Notes'
  ];

  const rows = assignments.map((asg) => {
    return [
      escapeCsvValue(asg.id),
      escapeCsvValue(asg.siteName),
      escapeCsvValue(asg.clientName || ''),
      escapeCsvValue(asg.area),
      escapeCsvValue(asg.officerName),
      escapeCsvValue(asg.officerBadge),
      escapeCsvValue(asg.shift),
      escapeCsvValue(asg.startDate || asg.date),
      escapeCsvValue(asg.endDate || asg.date),
      escapeCsvValue(asg.durationDays || 1),
      escapeCsvValue(asg.scheduledTime),
      escapeCsvValue(asg.patrolFrequency),
      escapeCsvValue(asg.workingDays || 'All Days'),
      escapeCsvValue(asg.patrolQuota),
      escapeCsvValue(asg.patrolsCompleted),
      escapeCsvValue(asg.status.toUpperCase()),
      escapeCsvValue(asg.notes || '')
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const filename = customFilename || `rexon_site_allocations_${new Date().toISOString().split('T')[0]}.csv`;
  triggerDownload(csvContent, filename);
}
