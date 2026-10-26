import React, { useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  Calendar,
  Users,
  Compass,
  ArrowRight,
  TrendingUp,
  FileCheck,
  ChevronRight,
  Activity,
  MapPin,
  Phone,
  Mail,
  Shield,
  Headphones
} from 'lucide-react';
import { CompanyClientAccount, PatrolReport, Site, IncidentRecord, FieldOfficer, Assignment } from '../../types';
import { getCallUrl, getWhatsAppUrl, REXON_ADMIN_CONTACT, WhatsAppIcon } from '../../utils/contactUtils';
import { useLiveClock } from '../../utils/dateUtils';

interface ZaxonOwnerDashboardViewProps {
  account: CompanyClientAccount;
  companySites: Site[];
  companyReports: PatrolReport[];
  companyIncidents: IncidentRecord[];
  officers?: FieldOfficer[];
  assignments?: Assignment[];
  onSelectReport: (report: PatrolReport) => void;
  onNavigateToTab: (tab: 'reports' | 'sites' | 'downloads') => void;
}

export const ZaxonOwnerDashboardView: React.FC<ZaxonOwnerDashboardViewProps> = ({
  account,
  companySites,
  companyReports,
  companyIncidents,
  officers = [],
  assignments = [],
  onSelectReport,
  onNavigateToTab
}) => {
  // Live Date & Time Clock Hook (ticking with seconds)
  const { displayDateFormatted, liveTimeWithSeconds } = useLiveClock(1000);

  // Today's Date
  const todayStr = new Date().toISOString().split('T')[0];
  const todayReports = companyReports.filter((r) => r.scheduledDate === todayStr);

  // Total Completed
  const completedReports = companyReports.filter((r) => r.status === 'completed');
  const todayCompletedCount = todayReports.filter((r) => r.status === 'completed').length;

  // Checkpoints Compliance
  let totalCheckpoints = 0;
  let verifiedCheckpoints = 0;
  completedReports.forEach((r) => {
    (r.checklist || []).forEach((c) => {
      totalCheckpoints++;
      if (c.checked) verifiedCheckpoints++;
    });
  });
  const complianceRate = totalCheckpoints > 0 ? Math.round((verifiedCheckpoints / totalCheckpoints) * 100) : 100;

  // Incidents
  const openIncidents = companyIncidents.filter((i) => i.status === 'action_required' || i.status === 'investigating');

  // Recent 5 Reports
  const recentReports = [...companyReports]
    .sort((a, b) => new Date(b.completedAt || b.scheduledDate).getTime() - new Date(a.completedAt || a.scheduledDate).getTime())
    .slice(0, 5);

  // Company Sites IDs
  const companySiteIds = useMemo(() => companySites.map((s) => s.id), [companySites]);

  // Today's Assigned Officers for this company's sites
  const todayAssignedOfficers = useMemo(() => {
    const siteAssignments = assignments.filter((a) =>
      companySiteIds.includes(a.siteId) && a.status === 'active'
    );
    const matched = officers.filter((off) =>
      siteAssignments.some((a) => a.officerId === off.id) ||
      off.assignedSiteIds?.some((sId) => companySiteIds.includes(sId))
    );

    if (matched.length === 0 && officers.length > 0) {
      const siteAreas = Array.from(new Set(companySites.map((s) => s.area)));
      return officers.filter((off) => siteAreas.includes(off.area) && off.employmentStatus === 'active');
    }
    return matched;
  }, [officers, assignments, companySiteIds, companySites]);

  return (
    <div className="space-y-6">
      {/* 1. Executive Welcome & Status Header with Live Date & Ticking Time */}
      <div className="bg-white border border-[#E7DED2] rounded-3xl p-5 sm:p-7 shadow-2xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#FAF7F2] rounded-full blur-3xl -z-10" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2]">
                REXON COMPANY PORTAL
              </span>
              <span className="text-xs text-[#8B735B]">·</span>
              <span className="text-xs text-[#1B5E20] font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#1B5E20] animate-pulse" />
                Live Cloud Sync Active
              </span>
              <span className="text-xs text-[#8B735B]">·</span>
              {/* Live ticking clock stamp */}
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#FAF7F2] border border-[#E7DED2] font-mono text-[11px] text-[#4B3621]">
                <Clock className="w-3 h-3 text-[#6F4E37]" />
                <span className="font-semibold">{displayDateFormatted}</span>
                <span className="text-[#8B735B]">·</span>
                <span className="font-bold text-[#6F4E37]">{liveTimeWithSeconds}</span>
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-[#4B3621]">
              Security Audit & Patrol Dashboard
            </h2>
            <p className="text-xs text-[#8B735B]">
              Logged in for <strong>{account.companyName}</strong>. Viewing real-time verified security patrol audits, GPS check-ins, and verified checkpoint compliance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onNavigateToTab('downloads')}
              className="px-4 py-2.5 bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#6F4E37] border border-[#E7DED2] text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-2xs"
            >
              <FileCheck className="w-4 h-4" />
              <span>Download Executive Reports</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateToTab('reports')}
              className="px-4 py-2.5 bg-[#6F4E37] hover:bg-[#5A3E2B] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <span>View All Patrols</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Executive KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-[#E7DED2]">
          {/* Total Patrols */}
          <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E7DED2] space-y-1">
            <div className="flex items-center justify-between text-[#8B735B]">
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Audits</span>
              <Activity className="w-4 h-4 text-[#6F4E37]" />
            </div>
            <div className="text-2xl font-black font-mono text-[#4B3621]">
              {companyReports.length}
            </div>
            <div className="text-[10px] text-[#8B735B]">
              Lifetime logged patrols
            </div>
          </div>

          {/* Today's Completed */}
          <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E7DED2] space-y-1">
            <div className="flex items-center justify-between text-[#8B735B]">
              <span className="text-[10px] font-bold uppercase tracking-wider">Today's Completed</span>
              <CheckCircle2 className="w-4 h-4 text-[#1B5E20]" />
            </div>
            <div className="text-2xl font-black font-mono text-[#1B5E20]">
              {todayCompletedCount}
            </div>
            <div className="text-[10px] text-[#8B735B]">
              {todayReports.length} scheduled today
            </div>
          </div>

          {/* Checkpoint Compliance */}
          <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E7DED2] space-y-1">
            <div className="flex items-center justify-between text-[#8B735B]">
              <span className="text-[10px] font-bold uppercase tracking-wider">Compliance Rate</span>
              <TrendingUp className="w-4 h-4 text-[#2E7D32]" />
            </div>
            <div className="text-2xl font-black font-mono text-[#4B3621]">
              {complianceRate}%
            </div>
            <div className="text-[10px] text-[#1B5E20] font-semibold">
              Verified checkpoints
            </div>
          </div>

          {/* Active Incidents */}
          <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E7DED2] space-y-1">
            <div className="flex items-center justify-between text-[#8B735B]">
              <span className="text-[10px] font-bold uppercase tracking-wider">Open Incidents</span>
              <AlertTriangle className={`w-4 h-4 ${openIncidents.length > 0 ? 'text-[#C62828]' : 'text-[#8B735B]'}`} />
            </div>
            <div className={`text-2xl font-black font-mono ${openIncidents.length > 0 ? 'text-[#C62828]' : 'text-[#4B3621]'}`}>
              {openIncidents.length}
            </div>
            <div className="text-[10px] text-[#8B735B]">
              {openIncidents.length === 0 ? 'All premises clear' : 'Action requested'}
            </div>
          </div>

          {/* Connected Sites */}
          <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E7DED2] space-y-1 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-[#8B735B]">
              <span className="text-[10px] font-bold uppercase tracking-wider">Monitored Facilities</span>
              <Building2 className="w-4 h-4 text-[#6F4E37]" />
            </div>
            <div className="text-2xl font-black font-mono text-[#4B3621]">
              {companySites.length}
            </div>
            <div className="text-[10px] text-[#8B735B]">
              Assigned premises
            </div>
          </div>
        </div>
      </div>

      {/* 2. ASSIGNED FIELD OFFICERS ON DUTY TODAY (Clean English & Direct Triggers) */}
      <div className="bg-white border border-[#E7DED2] rounded-3xl p-5 sm:p-7 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E7DED2]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#1B5E20]/10 text-[#1B5E20] rounded-xl border border-[#1B5E20]/20">
              <ShieldCheck className="w-5 h-5 text-[#1B5E20]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#4B3621] flex items-center gap-2">
                <span>Assigned Patrol Officers on Duty</span>
                <span className="w-2 h-2 rounded-full bg-[#1B5E20] animate-pulse" />
              </h3>
              <p className="text-xs text-[#8B735B]">
                Field security officers deployed on active duty across your monitored facilities today ({displayDateFormatted}).
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9] self-start sm:self-auto">
            {todayAssignedOfficers.length} Officers Allocated Today
          </span>
        </div>

        {todayAssignedOfficers.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#8B735B] bg-[#FAF7F2] rounded-2xl border border-[#E7DED2]">
            No field officers assigned for today. Please contact REXON Central Operations Control Room for assistance.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayAssignedOfficers.map((officer) => {
              const assignedSitesForOfficer = companySites.filter((s) =>
                officer.assignedSiteIds?.includes(s.id) ||
                assignments.some((a) => a.officerId === officer.id && a.siteId === s.id)
              );
              const waMessage = `Hello Officer ${officer.name}, contacting from ${account.companyName} regarding security operations at our facility.`;

              return (
                <div
                  key={officer.id}
                  className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E7DED2] hover:border-[#6F4E37] transition-all space-y-3 shadow-2xs flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-[#E8D8C5] border border-[#E7DED2] flex items-center justify-center font-bold text-[#4B3621] text-xs shrink-0 shadow-2xs">
                          {officer.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-[#4B3621] truncate">
                            {officer.name}
                          </h4>
                          <div className="text-[11px] font-mono text-[#6F4E37] font-semibold">
                            Badge: {officer.badgeNumber} · ID: {officer.employeeId}
                          </div>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9] shrink-0">
                        On Duty
                      </span>
                    </div>

                    {/* Shift & Assigned Facilities */}
                    <div className="text-xs text-[#8B735B] space-y-1 pt-1 border-t border-[#E7DED2]/80">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px]">Duty Shift:</span>
                        <strong className="text-[#4B3621] font-mono">{officer.shift} Shift</strong>
                      </div>
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-[11px] shrink-0">Assigned Facilities:</span>
                        <span className="font-semibold text-[#4B3621] text-right truncate">
                          {assignedSitesForOfficer.length > 0
                            ? assignedSitesForOfficer.map((s) => s.name).join(', ')
                            : companySites[0]?.name || 'All Company Facilities'}
                        </span>
                      </div>
                    </div>

                    {/* Mobile Phone Display */}
                    <div className="p-2 bg-white rounded-xl border border-[#E7DED2] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-[#8B735B]">
                        <Phone className="w-3.5 h-3.5 text-[#6F4E37]" />
                        <span className="font-semibold text-[11px]">Mobile / Phone:</span>
                      </div>
                      <span className="font-mono font-bold text-[#4B3621]">
                        {officer.phone}
                      </span>
                    </div>
                  </div>

                  {/* 1-Click Action Buttons: Direct Call & Direct WhatsApp */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E7DED2]">
                    <a
                      href={getCallUrl(officer.phone)}
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#FFFFFF] hover:bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2] text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                      title={`Call Officer ${officer.name} directly`}
                    >
                      <Phone className="w-3.5 h-3.5 text-[#6F4E37]" />
                      <span>Call</span>
                    </a>

                    <a
                      href={getWhatsAppUrl(officer.phone, waMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                      title={`Chat on WhatsApp with ${officer.name}`}
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5 text-white" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Central Operations Desk Direct Contact Card */}
        <div className="mt-4 p-4 sm:p-5 bg-gradient-to-r from-[#FAF7F2] to-[#F5EFE6] rounded-2xl border border-[#E7DED2] flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs shadow-2xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 bg-[#6F4E37] text-white rounded-xl shadow-xs shrink-0 mt-0.5 sm:mt-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-sm text-[#4B3621]">
                  REXON Central Operations Control Room
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1B5E20] animate-pulse"></span>
                  24/7 Dispatch Desk
                </span>
              </div>
              <p className="text-[11px] text-[#8B735B] leading-relaxed max-w-xl">
                Direct hotline for emergency escalation, urgent guard dispatch, and real-time patrol roster support.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto shrink-0 pt-1 lg:pt-0">
            <a
              href={getCallUrl(REXON_ADMIN_CONTACT.phone)}
              className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white hover:bg-[#FAF7F2] text-[#4B3621] border border-[#E7DED2] hover:border-[#6F4E37] font-bold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-[#6F4E37]" />
              <span>Call: {REXON_ADMIN_CONTACT.phone}</span>
            </a>

            <a
              href={getWhatsAppUrl(REXON_ADMIN_CONTACT.phone, `Hello REXON Operations Desk, contacting from ${account.companyName} regarding security patrol support.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <WhatsAppIcon className="w-4 h-4 text-white" />
              <span>WhatsApp Chat</span>
            </a>
          </div>
        </div>
      </div>

      {/* 3. Main Grid: Sites Progress & Recent Patrol Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Patrol Reports Feed (Real-time connected to Field Officer submissions) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#6F4E37]" />
              <h3 className="text-sm font-bold text-[#4B3621]">
                Recent Security Patrol Feed (Live Stream)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToTab('reports')}
              className="text-xs text-[#6F4E37] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Ledger</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentReports.length === 0 ? (
            <div className="p-10 bg-white border border-[#E7DED2] rounded-2xl text-center text-xs text-[#8B735B] space-y-2 shadow-2xs">
              <Clock className="w-8 h-8 text-[#8B735B] mx-auto opacity-50" />
              <div className="font-bold text-[#4B3621]">No Patrols Recorded Yet</div>
              <p className="max-w-xs mx-auto">
                When field officers complete patrols at your facilities, verified audit reports and GPS timestamps will display here in real-time.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentReports.map((report) => {
                const completedPoints = (report.checklist || []).filter((c) => c.checked).length;
                const totalPoints = (report.checklist || []).length;
                const hasIncident = (report.incidentCount || 0) > 0;

                return (
                  <div
                    key={report.id}
                    onClick={() => onSelectReport(report)}
                    className="p-4 bg-white border border-[#E7DED2] hover:border-[#6F4E37] rounded-2xl shadow-2xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-[#4B3621] bg-[#F0E8DD] px-1.5 py-0.5 rounded border border-[#E7DED2]">
                          {report.reportCode}
                        </span>
                        <span className="text-xs text-[#8B735B]">·</span>
                        <span className="text-xs font-bold text-[#4B3621] group-hover:text-[#6F4E37] transition-colors truncate">
                          {report.siteName}
                        </span>
                        {hasIncident && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2]">
                            ⚠️ Incident Logged
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#8B735B]">
                        <span>Officer: <strong className="text-[#4B3621]">{report.officerName}</strong> ({report.officerBadge})</span>
                        <span>·</span>
                        <span>{report.scheduledDate} · {report.actualCheckInTime || report.completedAt || report.scheduledTime}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-[#1B5E20]">
                          {completedPoints}/{totalPoints} Verified
                        </div>
                        <div className="text-[10px] text-[#8B735B] font-mono">
                          GPS: {report.gpsStatus?.distanceDeviationMeters || 0}m dev
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-[#FAF7F2] text-[#4B3621] group-hover:bg-[#6F4E37] group-hover:text-white transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Facility Watchlist */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#6F4E37]" />
              <h3 className="text-sm font-bold text-[#4B3621]">
                Facility Watchlist ({companySites.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToTab('sites')}
              className="text-xs text-[#6F4E37] hover:underline font-semibold cursor-pointer"
            >
              Details
            </button>
          </div>

          <div className="bg-white border border-[#E7DED2] rounded-2xl divide-y divide-[#E7DED2] overflow-hidden shadow-2xs">
            {companySites.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#8B735B]">
                No sites assigned to this account.
              </div>
            ) : (
              companySites.map((site) => {
                const siteTodayReports = todayReports.filter((r) => r.siteId === site.id);
                const isClear = site.securityStatus !== 'incident_reported';

                return (
                  <div key={site.id} className="p-3.5 space-y-2 hover:bg-[#FAF7F2] transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#4B3621] truncate">{site.name}</div>
                        <div className="text-[10px] text-[#8B735B] truncate">{site.address}</div>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border shrink-0 ${
                        isClear
                          ? 'bg-[#E8F5E9] text-[#1B5E20] border-[#C8E6C9]'
                          : 'bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]'
                      }`}>
                        {isClear ? 'Nominal' : 'Incident'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#8B735B] pt-1 border-t border-[#E7DED2]">
                      <span>Today's Patrols: <strong className="text-[#4B3621]">{siteTodayReports.length}</strong></span>
                      <span className="font-mono text-[#6F4E37] font-semibold">{site.patrolFrequency || '2x per shift'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Notice */}
          <div className="p-3.5 bg-[#FAF7F2] border border-[#E7DED2] rounded-2xl text-xs text-[#8B735B] space-y-1">
            <span className="font-bold text-[#4B3621] block">24/7 Operations Desk</span>
            <p className="text-[11px] leading-relaxed">
              For security emergencies or special patrol instructions, contact the central REXON Operations Command desk.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
