import React, { useState, useMemo } from 'react';
import {
  Shield,
  Smartphone,
  MapPin,
  Clock,
  Building2,
  CheckCircle2,
  PlayCircle,
  AlertTriangle,
  Search,
  Filter,
  ArrowRight,
  User,
  LogOut,
  ChevronRight,
  Info,
  Phone,
  FileText,
  X,
  Compass,
  KeyRound,
  Settings,
  ArrowLeft,
  Navigation,
  ExternalLink
} from 'lucide-react';
import {
  Site,
  FieldOfficer,
  Assignment,
  PatrolReport,
  PatrolStatus,
  IncidentRecord
} from '../types';
import { OfficerPatrolSession } from './OfficerPatrolSession';
import { SiteDetailModal } from './SiteDetailModal';
import { SiteMapModal } from './SiteMapModal';
import { OfficerLoginView } from './OfficerLoginView';
import { OfficerProfileModal } from './OfficerProfileModal';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../utils/storage';
import { useLiveClock } from '../utils/dateUtils';
import { getCallUrl, getWhatsAppUrl, REXON_ADMIN_CONTACT, WhatsAppIcon } from '../utils/contactUtils';
import { getGoogleMapsNavUrl, getGoogleMapsViewUrl } from '../utils/mapUtils';

interface FieldOfficerModeProps {
  officers: FieldOfficer[];
  sites: Site[];
  assignments: Assignment[];
  reports: PatrolReport[];
  selectedOfficerId: string;
  onSelectOfficer: (officerId: string) => void;
  onUpdateOfficer?: (officer: FieldOfficer) => void;
  onSwitchToOwnerMode: () => void;
  onSwitchToZaxonOwner?: () => void;
  onSubmitPatrolReport: (report: PatrolReport, newIncidents?: IncidentRecord[] | IncidentRecord) => void;
  onViewReportInOwner: (reportId: string) => void;
}

export const FieldOfficerMode: React.FC<FieldOfficerModeProps> = ({
  officers,
  sites,
  assignments,
  reports,
  selectedOfficerId,
  onSelectOfficer,
  onUpdateOfficer,
  onSwitchToOwnerMode,
  onSwitchToZaxonOwner,
  onSubmitPatrolReport,
  onViewReportInOwner
}) => {
  // Authentication State: Officer must log in with Email or Registration ID & Password
  const [authenticatedOfficerId, setAuthenticatedOfficerId] = useState<string | null>(() => {
    const storedId = loadFromStorage<string | null>(STORAGE_KEYS.OFFICER_AUTH, null);
    if (storedId && officers.some((o) => o.id === storedId)) {
      return storedId;
    }
    return null;
  });

  // Profile & Settings Modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Active Authenticated Officer Persona
  const activeOfficer = useMemo(() => {
    if (authenticatedOfficerId) {
      const match = officers.find((o) => o.id === authenticatedOfficerId);
      if (match) return match;
    }
    return officers.find((o) => o.id === selectedOfficerId) || officers[0];
  }, [officers, authenticatedOfficerId, selectedOfficerId]);

  // Handlers for authentication
  const handleLoginSuccess = (officer: FieldOfficer) => {
    setAuthenticatedOfficerId(officer.id);
    saveToStorage(STORAGE_KEYS.OFFICER_AUTH, officer.id);
    onSelectOfficer(officer.id);
  };

  const handleLogout = () => {
    setAuthenticatedOfficerId(null);
    saveToStorage(STORAGE_KEYS.OFFICER_AUTH, null);
    setIsProfileModalOpen(false);
  };

  const handleUpdatePassword = (officerId: string, newPassword: string) => {
    const target = officers.find((o) => o.id === officerId);
    if (target && onUpdateOfficer) {
      onUpdateOfficer({ ...target, password: newPassword });
    }
  };

  // Active patrol session site
  const [activePatrolSite, setActivePatrolSite] = useState<Site | null>(null);
  const [activePatrolScheduledTime, setActivePatrolScheduledTime] = useState<string>('08:00 AM');

  // Site details preview modal
  const [inspectingSite, setInspectingSite] = useState<Site | null>(null);

  // Site map & navigation modal
  const [activeMapSite, setActiveMapSite] = useState<Site | null>(null);

  // Completed patrol report preview modal (direct mobile view)
  const [viewingReport, setViewingReport] = useState<PatrolReport | null>(null);

  // Search & Filter Tabs
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PatrolStatus>('all');

  // Live date & real-time clock hook (ticking every 1000ms for live frequency)
  const { todayDateStr, headerDateFormatted, liveTimeWithSeconds, liveTimeShort } = useLiveClock(1000);

  // Find all assignments for this officer
  const officerAssignments = useMemo(() => {
    return assignments.filter((a) => a.officerId === activeOfficer.id && a.status !== 'cancelled');
  }, [assignments, activeOfficer.id]);

  // Map officer's assigned sites and compute their current patrol status for today
  const assignedSitesWithStatus = useMemo(() => {
    const allSiteIds = Array.from(
      new Set([
        ...activeOfficer.assignedSiteIds,
        ...officerAssignments.map((a) => a.siteId)
      ])
    );

    const relevantSites = sites.filter((s) => allSiteIds.includes(s.id));
    const fallbackSites = relevantSites.length > 0 ? relevantSites : sites.filter((s) => s.area === activeOfficer.area).slice(0, 4);

    return fallbackSites.map((site, index) => {
      const matchAssignment = officerAssignments.find((a) => a.siteId === site.id);
      const scheduledTime = matchAssignment?.scheduledTime || (index === 0 ? '08:00 AM' : index === 1 ? '10:00 AM' : index === 2 ? '01:00 PM' : '03:30 PM');

      const existingReport = reports.find(
        (r) => r.siteId === site.id && r.officerId === activeOfficer.id && r.status === 'completed' && (r.scheduledDate === todayDateStr || !r.scheduledDate)
      );

      let status: PatrolStatus = 'pending';
      if (existingReport) {
        status = 'completed';
      } else if (matchAssignment?.status === 'completed') {
        status = 'completed';
      } else if (index === 1 && !existingReport) {
        status = 'in_progress';
      } else if (index === 3 && !existingReport) {
        status = 'missed';
      }

      return {
        site,
        scheduledTime,
        report: existingReport,
        status
      };
    });
  }, [sites, officerAssignments, activeOfficer, reports]);

  // Filtered sites list
  const filteredSites = useMemo(() => {
    return assignedSitesWithStatus.filter(({ site, scheduledTime, status }) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = site.name.toLowerCase().includes(q);
        const matchesAddress = site.address.toLowerCase().includes(q);
        const matchesCode = site.code.toLowerCase().includes(q);
        if (!matchesName && !matchesAddress && !matchesCode) return false;
      }

      if (statusFilter !== 'all' && status !== statusFilter) return false;

      return true;
    });
  }, [assignedSitesWithStatus, searchQuery, statusFilter]);

  // Counts for summary bar
  const pendingCount = assignedSitesWithStatus.filter((s) => s.status === 'pending').length;
  const inProgressCount = assignedSitesWithStatus.filter((s) => s.status === 'in_progress').length;
  const completedCount = assignedSitesWithStatus.filter((s) => s.status === 'completed').length;
  const missedCount = assignedSitesWithStatus.filter((s) => s.status === 'missed').length;

  const startPatrolForSite = (site: Site, scheduledTime: string) => {
    setActivePatrolSite(site);
    setActivePatrolScheduledTime(scheduledTime);
  };

  const getStatusBadge = (status: PatrolStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9]">
            <CheckCircle2 className="w-3 h-3 text-[#2E7D32]" />
            <span>Completed</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]">
            <PlayCircle className="w-3 h-3 text-[#0284C7] animate-pulse" />
            <span>In Progress</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
            <Clock className="w-3 h-3 text-[#D97706]" />
            <span>Pending</span>
          </span>
        );
      case 'missed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#FFEBEE] text-[#B71C1C] border border-[#FFCDD2]">
            <AlertTriangle className="w-3 h-3 text-[#C62828]" />
            <span>Missed</span>
          </span>
        );
    }
  };

  // If officer is not authenticated, render the Officer Login Screen
  if (!authenticatedOfficerId) {
    return (
      <OfficerLoginView
        officers={officers}
        onLoginSuccess={handleLoginSuccess}
        onSwitchToOwnerMode={onSwitchToOwnerMode}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F5EF] text-[#4B3621] flex flex-col font-sans antialiased">
      {/* 1. AUTHENTICATED OFFICER SESSION HEADER */}
      <div className="bg-[#E8D8C5] border-b border-[#E7DED2] px-3 sm:px-6 py-2 text-xs text-[#4B3621]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[9px] uppercase tracking-wider bg-[#6F4E37] text-white shrink-0">
              OFFICER AUTHENTICATED
            </span>
            <span className="text-[#4B3621] text-xs font-medium truncate">
              Signed in as: <strong className="font-bold">{activeOfficer.name}</strong> ({activeOfficer.email || activeOfficer.employeeId})
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {onSwitchToZaxonOwner && (
              <button
                type="button"
                onClick={onSwitchToZaxonOwner}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#6F4E37] border border-[#D5C2AD] text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              >
                <span>Rexon Company Portal</span>
              </button>
            )}
            <button
              onClick={onSwitchToOwnerMode}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FFFFFF] hover:bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2] text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#6F4E37]" />
              <span>REXON Admin Portal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Control Room Helpline Strip */}
      <div className="bg-[#FAF7F2] border-b border-[#E7DED2] px-3 sm:px-4 py-2">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-[#1B5E20] animate-pulse shrink-0" />
            <span className="text-[#8B735B] truncate">
              कंट्रोल रूम हेल्पलाइन (Admin Desk): <strong className="text-[#4B3621] font-mono">{REXON_ADMIN_CONTACT.phone}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={getCallUrl(REXON_ADMIN_CONTACT.phone)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2] rounded-lg font-bold text-[11px] shadow-2xs"
              title="Call Control Room"
            >
              <Phone className="w-3 h-3 text-[#6F4E37]" />
              <span>Call Admin</span>
            </a>
            <a
              href={getWhatsAppUrl(REXON_ADMIN_CONTACT.phone, `नमस्ते REXON कंट्रोल रूम, मैं फील्ड ऑफिसर ${activeOfficer.name} (${activeOfficer.badgeNumber}) ड्यूटी से रिपोर्ट कर रहा हूँ।`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-lg font-bold text-[11px] shadow-2xs"
              title="WhatsApp Admin Desk"
            >
              <WhatsAppIcon className="w-3 h-3 text-white" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. OFFICER MOBILE APP HEADER */}
      <header className="sticky top-0 z-30 bg-[#FFFFFF] border-b border-[#E7DED2] px-3 sm:px-4 py-2.5 sm:py-3 shadow-2xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-[#6F4E37] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              {activeOfficer.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#4B3621] tracking-wide flex items-center gap-1.5 truncate">
                <span className="truncate">Rexon Field Portal</span>
                <span className="text-[10px] font-mono text-[#1B5E20] font-bold px-1.5 py-0.2 rounded bg-[#E8F5E9] border border-[#C8E6C9] shrink-0">
                  ON DUTY
                </span>
              </div>
              <div className="text-[11px] text-[#8B735B] truncate">
                {activeOfficer.name} · {activeOfficer.employeeId}
              </div>
            </div>
          </div>

          {/* Profile & Settings + Logout Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2] rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              title="Open Officer Profile and Settings"
            >
              <User className="w-3.5 h-3.5 text-[#6F4E37]" />
              <span className="hidden sm:inline">Profile & Settings</span>
              <span className="sm:hidden">Profile</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#FFEBEE] text-[#C62828] border border-[#E7DED2] hover:border-[#FFCDD2] rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              title="Log Out of Officer Account"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. MAIN MOBILE CONTAINER */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-3.5 sm:p-6 space-y-4 pb-20">
        {/* Officer Persona & Today's Duty Banner */}
        <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-2xl p-4 sm:p-5 space-y-3 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E7DED2] pb-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#8B735B]">
                  ACTIVE DUTY ASSIGNMENT · {headerDateFormatted}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9] shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32] animate-pulse"></span>
                  LIVE {liveTimeWithSeconds}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <h1 className="text-base sm:text-lg font-bold text-[#4B3621]">
                  Officer {activeOfficer.name}
                </h1>
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="text-[11px] text-[#6F4E37] hover:text-[#4B3621] font-semibold underline flex items-center gap-1 cursor-pointer"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>Settings</span>
                </button>
              </div>
              <div className="text-xs text-[#8B735B] flex flex-wrap items-center gap-2 mt-0.5 font-medium">
                <span>Badge #{activeOfficer.badgeNumber}</span>
                <span>·</span>
                <span className="text-[#6F4E37] font-bold">{activeOfficer.shift} Shift</span>
                <span>·</span>
                <span className="text-[#4B3621]">{activeOfficer.area}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-[#4B3621] bg-[#FAF7F2] px-3 py-1.5 rounded-lg border border-[#E7DED2] self-start sm:self-auto">
              <span>Battery: <strong>{activeOfficer.batteryPercent}%</strong></span>
              <span>·</span>
              <span className="text-[#1B5E20] font-bold">GPS Linked</span>
            </div>
          </div>

          {/* Today's Patrol Summary Metric Badges */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <button
              onClick={() => setStatusFilter('pending')}
              className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-[#FEF3C7] border-[#D97706] text-[#92400E] shadow-2xs font-bold'
                  : 'bg-[#FAF7F2] border-[#E7DED2] hover:bg-[#F0E8DD]'
              }`}
            >
              <div className="text-[10px] text-[#8B735B] font-semibold">Pending</div>
              <div className="text-base sm:text-lg font-mono font-bold text-[#D97706] mt-0.5">
                {pendingCount}
              </div>
            </button>

            <button
              onClick={() => setStatusFilter('in_progress')}
              className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                statusFilter === 'in_progress'
                  ? 'bg-[#E0F2FE] border-[#0284C7] text-[#0369A1] shadow-2xs font-bold'
                  : 'bg-[#FAF7F2] border-[#E7DED2] hover:bg-[#F0E8DD]'
              }`}
            >
              <div className="text-[10px] text-[#8B735B] font-semibold">In Progress</div>
              <div className="text-base sm:text-lg font-mono font-bold text-[#0284C7] mt-0.5">
                {inProgressCount}
              </div>
            </button>

            <button
              onClick={() => setStatusFilter('completed')}
              className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                statusFilter === 'completed'
                  ? 'bg-[#E8F5E9] border-[#2E7D32] text-[#1B5E20] shadow-2xs font-bold'
                  : 'bg-[#FAF7F2] border-[#E7DED2] hover:bg-[#F0E8DD]'
              }`}
            >
              <div className="text-[10px] text-[#8B735B] font-semibold">Completed</div>
              <div className="text-base sm:text-lg font-mono font-bold text-[#2E7D32] mt-0.5">
                {completedCount}
              </div>
            </button>

            <button
              onClick={() => setStatusFilter('missed')}
              className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                statusFilter === 'missed'
                  ? 'bg-[#FFEBEE] border-[#C62828] text-[#B71C1C] shadow-2xs font-bold'
                  : 'bg-[#FAF7F2] border-[#E7DED2] hover:bg-[#F0E8DD]'
              }`}
            >
              <div className="text-[10px] text-[#8B735B] font-semibold">Missed</div>
              <div className="text-base sm:text-lg font-mono font-bold text-[#C62828] mt-0.5">
                {missedCount}
              </div>
            </button>
          </div>
        </div>

        {/* 4. SEARCH & STATUS FILTER TABS */}
        <div className="space-y-2">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#8B735B] absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assigned site name, code, address..."
              className="w-full pl-9 pr-3 py-2.5 min-h-[44px] bg-[#FFFFFF] border border-[#E7DED2] rounded-xl text-xs text-[#4B3621] placeholder-[#8B735B]/70 focus:outline-none focus:border-[#6F4E37] shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-[#8B735B] hover:text-[#4B3621]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter Buttons (Responsive Multi-row Wrap on Mobile - Bug 1 Fix) */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {(['all', 'pending', 'in_progress', 'completed', 'missed'] as const).map((tab) => {
              const isActive = statusFilter === tab;
              const labels = {
                all: `All Sites (${assignedSitesWithStatus.length})`,
                pending: `Pending (${pendingCount})`,
                in_progress: `In Progress (${inProgressCount})`,
                completed: `Completed (${completedCount})`,
                missed: `Missed (${missedCount})`
              };

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-lg font-bold whitespace-nowrap text-xs transition-colors cursor-pointer select-none shadow-2xs ${
                    isActive
                      ? 'bg-[#6F4E37] text-white shadow-xs'
                      : 'bg-[#FFFFFF] text-[#8B735B] hover:text-[#4B3621] border border-[#E7DED2]'
                  }`}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. SITES LIST (Grouped & Filtered) */}
        <div className="space-y-3">
          {filteredSites.length === 0 ? (
            <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-2xl p-8 text-center text-xs text-[#8B735B] space-y-2 shadow-2xs">
              <Building2 className="w-8 h-8 text-[#8B735B] mx-auto" />
              <div className="text-[#4B3621] font-bold">No Assigned Sites Match</div>
              <p className="text-[11px]">
                No sites found in "{statusFilter}" status for {activeOfficer.name}. Try switching status filters or selecting another officer persona.
              </p>
            </div>
          ) : (
            filteredSites.map(({ site, scheduledTime, status, report }) => {
              const isCompleted = status === 'completed';

              return (
                <div
                  key={site.id}
                  className="bg-[#FFFFFF] border border-[#E7DED2] rounded-2xl p-4 sm:p-5 space-y-3 hover:border-[#8B735B] transition-all shadow-2xs"
                >
                  {/* Site Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[10px] text-[#4B3621] px-1.5 py-0.5 rounded bg-[#F0E8DD] border border-[#E7DED2] font-semibold">
                          {site.code}
                        </span>
                        <span className="capitalize font-mono text-[10px] text-[#4B3621] px-1.5 py-0.5 rounded bg-[#FAF7F2] border border-[#E7DED2]">
                          {site.siteType || 'factory'}
                        </span>
                        {getStatusBadge(status)}
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-[#4B3621] mt-1.5 truncate">
                        {site.name}
                      </h3>
                      <div className="text-xs text-[#8B735B] truncate font-medium">
                        {site.clientName}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[10px] text-[#8B735B] font-mono">Scheduled</div>
                      <div className="font-mono font-bold text-xs text-[#4B3621]">{scheduledTime}</div>
                    </div>
                  </div>

                  {/* Address & Zone */}
                  <div className="space-y-1 text-xs text-[#8B735B]">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#6F4E37] shrink-0" />
                      <span className="truncate text-[#4B3621]">{site.address}</span>
                    </div>
                    <div className="text-[11px] text-[#8B735B] pl-5">
                      Zone: <strong className="text-[#4B3621]">{site.area}</strong> · Frequency: {site.patrolFrequency || '2x per shift'}
                    </div>

                    {/* Site Contact Person with 1-Click Call & WhatsApp */}
                    {site.contactPhone && (
                      <div className="pt-2 mt-1 border-t border-[#E7DED2]/60 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <User className="w-3 h-3 text-[#6F4E37] shrink-0" />
                          <span className="text-[11px] text-[#4B3621] truncate font-medium">
                            {site.contactPerson} (<span className="font-mono text-[#8B735B]">{site.contactPhone}</span>)
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <a
                            href={getCallUrl(site.contactPhone)}
                            className="p-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2] transition-colors"
                            title={`Call ${site.contactPerson}`}
                          >
                            <Phone className="w-3 h-3 text-[#6F4E37]" />
                          </a>
                          <a
                            href={getWhatsAppUrl(site.contactPhone, `नमस्ते ${site.contactPerson} जी, मैं REXON फील्ड ऑफिसर ${activeOfficer.name} आपकी साइट ${site.name} की सुरक्षा पेट्रोलिंग ड्यूटी पर हूँ।`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] border border-[#25D366]/30 transition-colors"
                            title={`WhatsApp ${site.contactPerson}`}
                          >
                            <WhatsAppIcon className="w-3 h-3 text-[#25D366]" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                    {/* Site Map & Google Maps Navigation Strip */}
                    <div className="pt-2.5 pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-[#E7DED2]/60">
                      <div className="flex items-center gap-1.5 text-xs text-[#8B735B]">
                        <Compass className="w-3.5 h-3.5 text-[#6F4E37] shrink-0" />
                        <span className="text-[11px] font-mono text-[#4B3621]">
                          {site.coordinates?.lat && site.coordinates?.lng
                            ? `${site.coordinates.lat.toFixed(4)}, ${site.coordinates.lng.toFixed(4)}`
                            : 'GPS Linked'} · {site.geofenceRadiusMeters || 50}m Geofence
                        </span>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => setActiveMapSite(site)}
                          className="flex-1 sm:flex-none min-h-[38px] px-3 py-1.5 text-xs font-bold rounded-xl bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2] transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                          title="View Site Map & Geofence"
                        >
                          <Compass className="w-3.5 h-3.5 text-[#6F4E37]" />
                          <span>साइट मैप (View Map)</span>
                        </button>

                        <a
                          href={getGoogleMapsNavUrl(site)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 sm:flex-none min-h-[38px] px-3.5 py-1.5 text-xs font-bold rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg"
                          title="Open turn-by-turn navigation in Google Maps app"
                        >
                          <Navigation className="w-3.5 h-3.5 text-white fill-white" />
                          <span>Google Maps नेविगेशन</span>
                        </a>
                      </div>
                    </div>

                    {/* Actions Strip: Clean Vertical / Responsive Layout (Bug 2 Fix) */}
                    <div className="pt-2 border-t border-[#E7DED2] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <button
                        type="button"
                        onClick={() => setInspectingSite(site)}
                        className="w-full sm:w-auto min-h-[44px] px-4 py-2 text-xs font-semibold rounded-xl bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2] transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <Info className="w-3.5 h-3.5 text-[#6F4E37]" />
                        <span>View Site Details</span>
                      </button>

                    {isCompleted ? (
                      <button
                        type="button"
                        onClick={() => {
                          const matchingReport = report || reports.find((r) => r.siteId === site.id && (r.scheduledDate === todayDateStr || !r.scheduledDate)) || reports.find((r) => r.siteId === site.id);
                          if (matchingReport) {
                            setViewingReport(matchingReport);
                          } else {
                            const syntheticReport: PatrolReport = {
                              id: `rep-comp-${site.id}`,
                              reportCode: `PTR-${site.code.replace('SITE-', '')}-01`,
                              siteId: site.id,
                              siteName: site.name,
                              area: site.area,
                              officerId: activeOfficer.id,
                              officerName: activeOfficer.name,
                              officerBadge: activeOfficer.badgeNumber,
                              scheduledDate: todayDateStr,
                              scheduledTime: scheduledTime,
                              actualCheckInTime: liveTimeShort,
                              completedAt: `Completed today at ${liveTimeShort}`,
                              status: 'completed',
                              finalVerdict: 'completed',
                              checklist: (site.checklistTemplates && site.checklistTemplates.length > 0
                                ? site.checklistTemplates
                                : [
                                    { id: '1', title: 'Main gate and lock security check', category: 'Access Control' as const, checked: true, isCritical: true },
                                    { id: '2', title: 'Boundary wall and perimeter fencing scan', category: 'Perimeter' as const, checked: true, isCritical: true },
                                    { id: '3', title: 'Rear gate and emergency exit padlocks check', category: 'Access Control' as const, checked: true, isCritical: true },
                                    { id: '4', title: 'Suspicious activity & unauthorized vehicle audit', category: 'Perimeter' as const, checked: true, isCritical: true }
                                  ]
                              ).map((c) => ({ ...c, checked: true, status: 'safe' as const })),

                              photos: [],
                              officerRemarks: 'Routine patrol completed. All checkpoints verified secure.',
                              gpsStatus: {
                                verified: true,
                                lat: site.coordinates?.lat || 37.7842,
                                lng: site.coordinates?.lng || -122.3965,
                                accuracyMeters: 4.5,
                                distanceDeviationMeters: 12,
                                label: `GPS check-in verified inside ${site.geofenceRadiusMeters}m perimeter`
                              },
                              incidentCount: 0,
                              incidents: []
                            };
                            setViewingReport(syntheticReport);
                          }
                        }}
                        className="w-full sm:w-auto min-h-[44px] px-4 py-2 text-xs font-bold rounded-xl bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9] hover:bg-[#C8E6C9] transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />
                        <span>View Submitted Report</span>
                      </button>
                    ) : (

                      <button
                        type="button"
                        onClick={() => startPatrolForSite(site, scheduledTime)}
                        className="w-full sm:w-auto min-h-[44px] px-4 py-2 text-xs font-bold rounded-xl bg-[#6F4E37] hover:bg-[#5A3E2B] text-white transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md"
                      >
                        <PlayCircle className="w-4 h-4" />
                        <span>Start Patrol</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Back to Owner Dashboard Prompt */}
        <div className="pt-4 pb-2 text-center">
          <button
            onClick={onSwitchToOwnerMode}
            className="text-xs text-[#6F4E37] hover:text-[#4B3621] font-bold underline cursor-pointer"
          >
            ← Switch back to Security Company Owner Dashboard
          </button>
        </div>
      </main>

      {/* ACTIVE PATROL EXECUTION MODAL */}
      {activePatrolSite && (
        <OfficerPatrolSession
          site={activePatrolSite}
          officer={activeOfficer}
          scheduledTime={activePatrolScheduledTime}
          onClose={() => setActivePatrolSite(null)}
          onSubmitReport={(newReport, newIncidents) => {
            onSubmitPatrolReport(newReport, newIncidents);
            setActivePatrolSite(null);
          }}
          onSwitchToOwnerDashboard={(repId) => {
            setActivePatrolSite(null);
            onViewReportInOwner(repId);
          }}
        />
      )}

      {/* SITE DETAILS MODAL */}
      {inspectingSite && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-[#4B3621]">
            <div className="flex items-center justify-between border-b border-[#E7DED2] pb-3">
              <h3 className="text-sm font-bold text-[#4B3621] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#6F4E37]" />
                <span>Site Details: {inspectingSite.name}</span>
              </h3>
              <button onClick={() => setInspectingSite(null)} className="text-[#8B735B] hover:text-[#4B3621] p-1 rounded hover:bg-[#F0E8DD]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E7DED2] space-y-1">
                <div className="text-[10px] text-[#8B735B] uppercase font-mono font-bold">Client Organization</div>
                <div className="font-bold text-[#4B3621]">{inspectingSite.clientName}</div>
                <div className="text-[#8B735B]">{inspectingSite.address}</div>
              </div>

              {/* Company / Site Contact Person with Direct Call & WhatsApp */}
              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E7DED2] space-y-2">
                <div className="flex items-center justify-between text-[#8B735B]">
                  <span className="font-semibold text-[11px]">कंपनी / साइट अधिकृत संपर्क (Site Contact)</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white border border-[#E7DED2] text-[#6F4E37]">Authorized</span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-[#4B3621] text-xs">
                      {inspectingSite.contactPerson || 'Authorized Representative'}
                    </div>
                    <div className="text-[11px] text-[#8B735B] font-mono mt-0.5">
                      {inspectingSite.contactPhone || 'No phone recorded'}
                    </div>
                  </div>

                  {/* 1-Click Call and WhatsApp action buttons */}
                  {inspectingSite.contactPhone && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={getCallUrl(inspectingSite.contactPhone)}
                        className="inline-flex items-center gap-1 py-1.5 px-3 rounded-xl bg-white hover:bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2] text-xs font-bold transition-colors shadow-2xs"
                        title={`Call ${inspectingSite.contactPerson}`}
                      >
                        <Phone className="w-3.5 h-3.5 text-[#6F4E37]" />
                        <span>कॉल करें</span>
                      </a>

                      <a
                        href={getWhatsAppUrl(inspectingSite.contactPhone, `नमस्ते ${inspectingSite.contactPerson} जी, मैं REXON फील्ड ऑफिसर ${activeOfficer.name} आपकी साइट ${inspectingSite.name} की सुरक्षा पेट्रोलिंग ड्यूटी पर हूँ।`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 py-1.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold transition-colors shadow-2xs"
                        title={`WhatsApp ${inspectingSite.contactPerson}`}
                      >
                        <WhatsAppIcon className="w-3.5 h-3.5 text-white" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* REXON Central Control Room Support */}
              <div className="p-2.5 rounded-xl bg-[#F0E8DD] border border-[#D5C2AD] flex items-center justify-between gap-2 text-xs">
                <div>
                  <div className="font-bold text-[#4B3621] text-[11px]">REXON कंट्रोल रूम (Admin Desk)</div>
                  <div className="text-[10px] text-[#8B735B] font-mono">{REXON_ADMIN_CONTACT.phone}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <a
                    href={getCallUrl(REXON_ADMIN_CONTACT.phone)}
                    className="p-1.5 rounded-lg bg-white text-[#4B3621] border border-[#E7DED2] font-bold text-xs"
                    title="Call Control Room"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#6F4E37]" />
                  </a>
                  <a
                    href={getWhatsAppUrl(REXON_ADMIN_CONTACT.phone, `नमस्ते REXON एडमिन, मैं फील्ड ऑफिसर ${activeOfficer.name} साइट ${inspectingSite.name} से सहायता हेतु संपर्क कर रहा हूँ।`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-[#25D366] text-white font-bold text-xs"
                    title="WhatsApp Control Room"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5 text-white" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-lg bg-[#FAF7F2] border border-[#E7DED2]">
                  <div className="text-[#8B735B] font-semibold">Geofence Radius</div>
                  <div className="font-bold text-[#1B5E20] mt-0.5">{inspectingSite.geofenceRadiusMeters} meters</div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#FAF7F2] border border-[#E7DED2]">
                  <div className="text-[#8B735B] font-semibold">Patrol Frequency</div>
                  <div className="font-bold text-[#4B3621] mt-0.5">{inspectingSite.patrolFrequency}</div>
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-[#4B3621] mb-1.5">
                  Inspection Checkpoints Configured ({inspectingSite.checklistTemplates?.length || 4}):
                </div>
                <div className="space-y-1 max-h-36 overflow-y-auto p-2 rounded-lg bg-[#FAF7F2] border border-[#E7DED2]">
                  {(inspectingSite.checklistTemplates?.length > 0
                    ? inspectingSite.checklistTemplates
                    : [
                        { id: '1', title: 'Main gate and lock security check' },
                        { id: '2', title: 'Boundary wall and perimeter fencing scan' },
                        { id: '3', title: 'Rear gate and emergency exit padlocks check' },
                        { id: '4', title: 'Suspicious activity & unauthorized vehicle audit' }
                      ]
                  ).map((chk, i) => (
                    <div key={chk.id || i} className="text-[11px] text-[#4B3621] flex items-center gap-1.5 py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#6F4E37] shrink-0" />
                      <span>{chk.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#E7DED2]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = inspectingSite;
                    setInspectingSite(null);
                    setActiveMapSite(target);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Compass className="w-3.5 h-3.5 text-[#6F4E37]" />
                  <span>साइट मैप खोलें</span>
                </button>

                <a
                  href={getGoogleMapsNavUrl(inspectingSite)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <Navigation className="w-3.5 h-3.5 text-white fill-white" />
                  <span>Google Maps</span>
                </a>
              </div>

              <button
                type="button"
                onClick={() => setInspectingSite(null)}
                className="px-4 py-2 rounded-lg bg-[#6F4E37] hover:bg-[#5A3E2B] text-white text-xs font-bold cursor-pointer shadow-2xs"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SITE MAP & NAVIGATION MODAL */}
      {activeMapSite && (
        <SiteMapModal
          site={activeMapSite}
          officerName={activeOfficer.name}
          onClose={() => setActiveMapSite(null)}
        />
      )}

      {/* VIEW SUBMITTED REPORT MODAL (Direct in Field Officer Mode - Site details removed & report displayed cleanly) */}
      {viewingReport && (
        <SiteDetailModal
          report={viewingReport}
          site={sites.find((s) => s.id === viewingReport.siteId)}
          allSiteIncidents={viewingReport.incidents || []}
          isOfficerMode={true}
          onClose={() => setViewingReport(null)}
        />
      )}

      {/* OFFICER PROFILE & SETTINGS MODAL */}
      {isProfileModalOpen && (
        <OfficerProfileModal
          officer={activeOfficer}
          assignedSites={sites.filter(
            (s) => activeOfficer.assignedSiteIds.includes(s.id) || s.area === activeOfficer.area
          )}
          onClose={() => setIsProfileModalOpen(false)}
          onUpdatePassword={handleUpdatePassword}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
};
