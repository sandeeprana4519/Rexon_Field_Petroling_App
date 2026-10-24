import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlayCircle,
  AlertOctagon,
  ChevronRight,
  ShieldCheck,
  FileText,
  MessageSquare
} from 'lucide-react';
import { PatrolReport, PatrolStatus } from '../types';

interface PatrolReportsTableProps {
  reports: PatrolReport[];
  onSelectReport: (report: PatrolReport) => void;
  onFilterByOfficer?: (officerId: string) => void;
  onFilterBySite?: (siteId: string) => void;
}

export const PatrolReportsTable: React.FC<PatrolReportsTableProps> = ({
  reports,
  onSelectReport,
  onFilterByOfficer,
  onFilterBySite
}) => {
  const getStatusBadge = (status: PatrolStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold text-[#1B5E20] bg-[#E8F5E9] border border-[#C8E6C9]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />
            <span>Completed</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold text-[#0369A1] bg-[#E0F2FE] border border-[#BAE6FD]">
            <PlayCircle className="w-3.5 h-3.5 text-[#0284C7] animate-pulse" />
            <span>In Progress</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold text-[#92400E] bg-[#FEF3C7] border border-[#FDE68A]">
            <Clock className="w-3.5 h-3.5 text-[#D97706]" />
            <span>Pending</span>
          </span>
        );
      case 'missed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold text-[#B71C1C] bg-[#FFEBEE] border border-[#FFCDD2]">
            <AlertTriangle className="w-3.5 h-3.5 text-[#C62828]" />
            <span>Missed</span>
          </span>
        );
    }
  };

  const getIncidentIndicator = (report: PatrolReport) => {
    if (report.incidentCount === 0) {
      return (
        <span className="text-xs text-[#8B735B] flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#2E7D32]" />
          <span>None</span>
        </span>
      );
    }

    const highestSeverity = report.incidents[0]?.severity || 'medium';
    const severityColors = {
      critical: 'text-[#B71C1C] bg-[#FFEBEE] border-[#FFCDD2]',
      high: 'text-[#C2410C] bg-[#FFF7ED] border-[#FFEDD5]',
      medium: 'text-[#92400E] bg-[#FEF3C7] border-[#FDE68A]',
      low: 'text-[#4B3621] bg-[#F0E8DD] border-[#E7DED2]'
    };

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border ${severityColors[highestSeverity]}`}
      >
        <AlertOctagon className="w-3 h-3 text-[#C62828]" />
        <span>
          {report.incidentCount} {highestSeverity.toUpperCase()}
        </span>
      </span>
    );
  };

  const getWhatsAppBadge = (report: PatrolReport) => {
    if (!report.notificationStatus) return null;
    switch (report.notificationStatus) {
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] text-[#1B5E20] bg-[#E8F5E9] border border-[#C8E6C9] px-1.5 py-0.5 rounded font-mono font-bold" title="WhatsApp report summary sent to Owner/HR">
            <MessageSquare className="w-2.5 h-2.5 text-[#25D366]" />
            <span>WA Sent</span>
          </span>
        );
      case 'test_mode':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] text-[#92400E] bg-[#FEF3C7] border border-[#FDE68A] px-1.5 py-0.5 rounded font-mono font-bold" title="Safe Test Mode: WhatsApp notification staged in audit log">
            <MessageSquare className="w-2.5 h-2.5 text-[#D97706]" />
            <span>WA Test</span>
          </span>
        );
      case 'unconfigured':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] text-[#8B735B] bg-[#FAF7F2] border border-[#E7DED2] px-1.5 py-0.5 rounded font-mono" title="Setup Pending: Cloud Functions credentials required">
            <MessageSquare className="w-2.5 h-2.5 text-[#8B735B]" />
            <span>WA Pending</span>
          </span>
        );
      case 'failed':
      case 'retry_required':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] text-[#C62828] bg-[#FFEBEE] border border-[#FFCDD2] px-1.5 py-0.5 rounded font-mono font-bold" title="WhatsApp dispatch failed">
            <MessageSquare className="w-2.5 h-2.5 text-[#C62828]" />
            <span>WA Failed</span>
          </span>
        );
      default:
        return null;
    }
  };

  if (reports.length === 0) {
    return (
      <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-xl p-10 text-center shadow-2xs">
        <FileText className="w-10 h-10 text-[#8B735B] mx-auto mb-3" />
        <h4 className="text-sm font-bold text-[#4B3621] mb-1">
          No Patrol Reports Found
        </h4>
        <p className="text-xs text-[#8B735B] max-w-sm mx-auto mb-4">
          No records match the current filter criteria. Try adjusting the date range, area, or status filter.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-xl overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#E7DED2] bg-[#FAF7F2] text-[#8B735B] font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Site Name</th>
              <th className="py-3 px-4">Assigned Officer</th>
              <th className="py-3 px-4">Scheduled Time</th>
              <th className="py-3 px-4">Actual Check-In</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Incidents</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7DED2]">
            {reports.map((report) => (
              <tr
                key={report.id}
                onClick={() => onSelectReport(report)}
                className="hover:bg-[#F0E8DD]/50 transition-colors cursor-pointer group"
              >
                {/* 1. Site Name */}
                <td className="py-3 px-4">
                  <div className="font-bold text-[#4B3621] group-hover:text-[#6F4E37] transition-colors">
                    {report.siteName}
                  </div>
                  <div className="text-[11px] text-[#8B735B] flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-[#8B735B] font-medium">{report.reportCode}</span>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onFilterBySite) onFilterBySite(report.siteId);
                      }}
                      className="hover:text-[#4B3621] underline-offset-2 hover:underline cursor-pointer"
                    >
                      {report.area}
                    </button>
                  </div>
                </td>

                {/* 2. Assigned Officer */}
                <td className="py-3 px-4">
                  <div className="font-semibold text-[#4B3621]">
                    {report.officerName}
                  </div>
                  <div className="text-[11px] text-[#8B735B] font-mono flex items-center gap-1">
                    <span className="text-[#6F4E37] font-semibold">{report.officerBadge}</span>
                    {onFilterByOfficer && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onFilterByOfficer(report.officerId);
                        }}
                        className="text-[#8B735B] hover:text-[#4B3621] hover:underline ml-1"
                        title="Filter by this officer"
                      >
                        [Filter]
                      </button>
                    )}
                  </div>
                </td>

                {/* 3. Scheduled Time */}
                <td className="py-3 px-4 font-mono tabular-nums text-[#4B3621]">
                  <div className="font-semibold">{report.scheduledTime}</div>
                  <div className="text-[10px] text-[#8B735B]">{report.scheduledDate}</div>
                </td>

                {/* 4. Actual Check-In */}
                <td className="py-3 px-4">
                  {report.actualCheckInTime ? (
                    <div>
                      <div className="font-mono tabular-nums font-bold text-[#4B3621]">
                        {report.actualCheckInTime}
                      </div>
                      <div className="text-[10px] text-[#2E7D32] flex items-center gap-1 mt-0.5 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]" />
                        <span>GPS Verified ({report.gpsStatus.distanceDeviationMeters}m)</span>
                      </div>
                    </div>
                  ) : report.status === 'missed' ? (
                    <div>
                      <div className="text-[#C62828] font-bold">No check-in</div>
                      <div className="text-[10px] text-[#8B735B]">Exceeded +30m</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-[#B45309] italic font-medium">Awaiting check-in</div>
                      <div className="text-[10px] text-[#8B735B]">Window open</div>
                    </div>
                  )}
                </td>

                {/* 5. Status */}
                <td className="py-3 px-4">
                  <div className="flex flex-col gap-1 items-start">
                    {getStatusBadge(report.status)}
                    {getWhatsAppBadge(report)}
                  </div>
                </td>

                {/* 6. Incident Indicator */}
                <td className="py-3 px-4">
                  {getIncidentIndicator(report)}
                </td>

                {/* 7. Action Button */}
                <td className="py-3 px-4 text-right">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectReport(report);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#F0E8DD] hover:bg-[#6F4E37] text-[#4B3621] hover:text-white text-xs font-semibold border border-[#E7DED2] hover:border-[#6F4E37] transition-all cursor-pointer shadow-2xs"
                  >
                    <span>Inspect</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-2.5 bg-[#FAF7F2] border-t border-[#E7DED2] flex items-center justify-between text-[11px] text-[#8B735B]">
        <div>
          <span>Showing </span>
          <span className="font-mono text-[#4B3621] font-bold">{reports.length}</span>
          <span> security patrol records</span>
        </div>
        <div className="text-[#8B735B] italic hidden sm:block">
          Click any row to inspect site checklist, GPS geofence & photos
        </div>
      </div>
    </div>
  );
};
