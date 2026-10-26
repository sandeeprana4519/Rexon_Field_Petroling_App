import React, { useState, useMemo } from 'react';
import {
  FileCheck2,
  Search,
  Filter,
  Calendar,
  Building2,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Compass,
  Camera,
  ChevronRight,
  ShieldAlert,
  ArrowUpDown,
  Download,
  Printer
} from 'lucide-react';
import { PatrolReport, Site } from '../../types';
import { getTodayDateString, getYesterdayDateString, getOffsetDateString } from '../../utils/dateUtils';

interface ZaxonReportsViewProps {
  reports: PatrolReport[];
  sites: Site[];
  onSelectReport: (report: PatrolReport) => void;
  onOpenDownloads: () => void;
}

export const ZaxonReportsView: React.FC<ZaxonReportsViewProps> = ({
  reports,
  sites,
  onSelectReport,
  onOpenDownloads
}) => {
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'yesterday' | '7days' | '30days'>('all');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();
  const sevenDaysAgo = getOffsetDateString(-7);
  const thirtyDaysAgo = getOffsetDateString(-30);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      // 1. Date Filter
      if (datePreset === 'today' && report.scheduledDate !== today) return false;
      if (datePreset === 'yesterday' && report.scheduledDate !== yesterday) return false;
      if (datePreset === '7days' && report.scheduledDate < sevenDaysAgo) return false;
      if (datePreset === '30days' && report.scheduledDate < thirtyDaysAgo) return false;

      // 2. Site Filter
      if (selectedSiteId !== 'all' && report.siteId !== selectedSiteId) return false;

      // 3. Status Filter
      if (selectedStatus !== 'all' && report.status !== selectedStatus) return false;

      // 4. Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCode = report.reportCode.toLowerCase().includes(q);
        const matchesSite = report.siteName.toLowerCase().includes(q);
        const matchesOfficer = report.officerName.toLowerCase().includes(q);
        const matchesBadge = report.officerBadge.toLowerCase().includes(q);
        if (!matchesCode && !matchesSite && !matchesOfficer && !matchesBadge) return false;
      }

      return true;
    });
  }, [reports, datePreset, selectedSiteId, selectedStatus, searchQuery, today, yesterday, sevenDaysAgo, thirtyDaysAgo]);

  return (
    <div className="space-y-5">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-[#E7DED2] rounded-2xl p-4.5 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-[#4B3621]">
            Patrol Audit Ledger
          </h2>
          <p className="text-xs text-[#8B735B]">
            Verified security inspection logs, checkpoints compliance, and proof of presence.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenDownloads}
          className="px-3.5 py-2 bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#6F4E37] border border-[#E7DED2] text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs self-start sm:self-center"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Audit Reports (PDF / CSV)</span>
        </button>
      </div>

      {/* Date Preset Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setDatePreset('all')}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            datePreset === 'all'
              ? 'bg-[#6F4E37] text-white shadow-2xs'
              : 'bg-white text-[#4B3621] border border-[#E7DED2] hover:bg-[#FAF7F2]'
          }`}
        >
          All Dates
        </button>

        <button
          type="button"
          onClick={() => setDatePreset('today')}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            datePreset === 'today'
              ? 'bg-[#6F4E37] text-white shadow-2xs'
              : 'bg-white text-[#4B3621] border border-[#E7DED2] hover:bg-[#FAF7F2]'
          }`}
        >
          Today
        </button>

        <button
          type="button"
          onClick={() => setDatePreset('yesterday')}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            datePreset === 'yesterday'
              ? 'bg-[#6F4E37] text-white shadow-2xs'
              : 'bg-white text-[#4B3621] border border-[#E7DED2] hover:bg-[#FAF7F2]'
          }`}
        >
          Yesterday
        </button>

        <button
          type="button"
          onClick={() => setDatePreset('7days')}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            datePreset === '7days'
              ? 'bg-[#6F4E37] text-white shadow-2xs'
              : 'bg-white text-[#4B3621] border border-[#E7DED2] hover:bg-[#FAF7F2]'
          }`}
        >
          Last 7 Days
        </button>

        <button
          type="button"
          onClick={() => setDatePreset('30days')}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            datePreset === '30days'
              ? 'bg-[#6F4E37] text-white shadow-2xs'
              : 'bg-white text-[#4B3621] border border-[#E7DED2] hover:bg-[#FAF7F2]'
          }`}
        >
          Last 30 Days
        </button>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8B735B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search report code, officer, site..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E7DED2] rounded-xl text-[#4B3621] focus:outline-none focus:border-[#6F4E37]"
          />
        </div>

        {/* Site Filter */}
        <div>
          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-[#E7DED2] rounded-xl text-[#4B3621] focus:outline-none focus:border-[#6F4E37] cursor-pointer"
          >
            <option value="all">All Facilities ({sites.length})</option>
            {sites.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-[#E7DED2] rounded-xl text-[#4B3621] focus:outline-none focus:border-[#6F4E37] cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="missed">Missed</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white border border-[#E7DED2] rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF7F2] border-b border-[#E7DED2] text-[#8B735B] uppercase tracking-wider font-bold text-[10px]">
                <th className="py-3 px-4">Report Code</th>
                <th className="py-3 px-4">Facility / Site</th>
                <th className="py-3 px-4">Field Officer</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Checkpoints</th>
                <th className="py-3 px-4">Status & GPS</th>
                <th className="py-3 px-4 text-right">Inspection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7DED2]">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[#8B735B] space-y-2">
                    <FileCheck2 className="w-8 h-8 mx-auto opacity-50 text-[#8B735B]" />
                    <div className="font-bold text-[#4B3621]">No Patrol Reports Found</div>
                    <p className="max-w-xs mx-auto">
                      No patrol records match your active filters. Try selecting "All Dates" or clearing search terms.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => {
                  const verifiedCount = (report.checklist || []).filter((c) => c.checked).length;
                  const totalCount = (report.checklist || []).length;
                  const pct = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0;
                  const hasIncidents = (report.incidentCount || 0) > 0;

                  return (
                    <tr
                      key={report.id}
                      onClick={() => onSelectReport(report)}
                      className="hover:bg-[#FAF7F2]/60 transition-colors cursor-pointer group"
                    >
                      {/* Code */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs font-bold text-[#4B3621] group-hover:text-[#6F4E37] bg-[#F0E8DD] px-2 py-0.5 rounded border border-[#E7DED2]">
                          {report.reportCode}
                        </span>
                      </td>

                      {/* Site */}
                      <td className="py-3.5 px-4 font-bold text-[#4B3621]">
                        <div className="truncate max-w-[180px]">{report.siteName}</div>
                        <div className="text-[10px] text-[#8B735B] font-normal">{report.area}</div>
                      </td>

                      {/* Officer */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#4B3621]">{report.officerName}</div>
                        <div className="font-mono text-[10px] text-[#8B735B]">{report.officerBadge}</div>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#4B3621]">
                        <div>{report.scheduledDate}</div>
                        <div className="text-[#8B735B] text-[10px]">
                          {report.actualCheckInTime || report.completedAt || report.scheduledTime}
                        </div>
                      </td>

                      {/* Checkpoints */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="font-mono font-bold text-xs text-[#1B5E20]">
                            {verifiedCount}/{totalCount}
                          </div>
                          <span className="text-[10px] text-[#8B735B]">({pct}%)</span>
                        </div>
                        <div className="w-16 h-1.5 bg-[#E7DED2] rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-[#1B5E20]" style={{ width: `${pct}%` }} />
                        </div>
                      </td>

                      {/* Status & GPS */}
                      <td className="py-3.5 px-4 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            report.status === 'completed'
                              ? 'bg-[#E8F5E9] text-[#1B5E20] border-[#C8E6C9]'
                              : report.status === 'missed'
                              ? 'bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]'
                              : 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                          }`}>
                            {report.status}
                          </span>

                          {hasIncidents && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2]">
                              {report.incidentCount} Incident
                            </span>
                          )}
                        </div>

                        <div className="text-[10px] font-mono text-[#8B735B] flex items-center gap-1">
                          <Compass className="w-3 h-3 text-[#1B5E20]" />
                          <span>GPS dev: {report.gpsStatus?.distanceDeviationMeters || 0}m</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] group-hover:bg-[#6F4E37] text-[#4B3621] group-hover:text-white transition-all text-xs font-bold inline-flex items-center gap-1"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-[#FAF7F2] border-t border-[#E7DED2] flex items-center justify-between text-[11px] text-[#8B735B]">
          <span>Showing <strong>{filteredReports.length}</strong> of {reports.length} verified audit records</span>
          <span className="italic">Click any report to view photo proofs and individual checkpoint timestamps</span>
        </div>
      </div>
    </div>
  );
};
