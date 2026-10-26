import React, { useState, useMemo, useEffect } from 'react';
import {
  LayoutDashboard,
  FileCheck2,
  Building2,
  Download,
  User,
  LogOut,
  Shield,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Clock,
  X,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Compass,
  Phone,
  Mail,
  Save,
  KeyRound
} from 'lucide-react';
import { CompanyClientAccount, PatrolReport, Site, IncidentRecord, FieldOfficer, Assignment } from '../../types';
import { ZaxonOwnerLoginView } from './ZaxonOwnerLoginView';
import { ZaxonOwnerDashboardView } from './ZaxonOwnerDashboardView';
import { ZaxonReportsView } from './ZaxonReportsView';
import { ZaxonSitesView } from './ZaxonSitesView';
import { ZaxonDownloadsView } from './ZaxonDownloadsView';
import { SiteDetailModal } from '../SiteDetailModal';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../../utils/storage';
import { useLiveClock } from '../../utils/dateUtils';

interface ZaxonOwnerAppProps {
  accounts: CompanyClientAccount[];
  sites: Site[];
  reports: PatrolReport[];
  incidents: IncidentRecord[];
  officers?: FieldOfficer[];
  assignments?: Assignment[];
  onSwitchToAdmin: () => void;
  onSwitchToOfficer: () => void;
  onUpdateAccount: (updatedAccount: CompanyClientAccount) => void;
  initialLoginId?: string;
}

export const ZaxonOwnerApp: React.FC<ZaxonOwnerAppProps> = ({
  accounts,
  sites,
  reports,
  incidents,
  officers = [],
  assignments = [],
  onSwitchToAdmin,
  onSwitchToOfficer,
  onUpdateAccount,
  initialLoginId = ''
}) => {
  // Live Clock Hook (Ticking live with seconds)
  const { displayDateFormatted, liveTimeWithSeconds } = useLiveClock(1000);
  
  // Authentication State
  const [currentUser, setCurrentUser] = useState<CompanyClientAccount | null>(() => {
    return loadFromStorage<CompanyClientAccount | null>(STORAGE_KEYS.ZAXON_AUTH, null);
  });

  // Active Tab State ('dashboard' | 'reports' | 'sites' | 'downloads')
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'sites' | 'downloads'>('dashboard');

  // Selected Report Modal State
  const [selectedReport, setSelectedReport] = useState<PatrolReport | null>(null);

  // Profile Modal State (Opens from Profile button next to Logout or navigation)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileLoginId, setProfileLoginId] = useState('');
  const [profileNewPassword, setProfileNewPassword] = useState('');
  const [profileConfirmPassword, setProfileConfirmPassword] = useState('');
  const [showProfilePassword, setShowProfilePassword] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync current user with accounts if updated
  useEffect(() => {
    if (currentUser) {
      const fresh = accounts.find((a) => a.id === currentUser.id || a.loginId === currentUser.loginId);
      if (fresh) {
        setCurrentUser(fresh);
        saveToStorage(STORAGE_KEYS.ZAXON_AUTH, fresh);
      }
    }
  }, [accounts]);

  // Sync profile form when modal opens
  useEffect(() => {
    if (currentUser && isProfileModalOpen) {
      setProfileLoginId(currentUser.loginId || '');
      setProfileNewPassword('');
      setProfileConfirmPassword('');
      setShowProfilePassword(false);
      setProfileFeedback(null);
    }
  }, [currentUser, isProfileModalOpen]);

  const handleLoginSuccess = (account: CompanyClientAccount) => {
    setCurrentUser(account);
    saveToStorage(STORAGE_KEYS.ZAXON_AUTH, account);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    saveToStorage(STORAGE_KEYS.ZAXON_AUTH, null);
  };

  // STRICT DATA ISOLATION LOGIC
  // 1. Company Sites: only sites belonging to this company or specifically assigned
  const companySites = useMemo(() => {
    if (!currentUser) return [];
    return sites.filter((site) => {
      if (currentUser.assignedSiteIds && currentUser.assignedSiteIds.length > 0) {
        return currentUser.assignedSiteIds.includes(site.id);
      }
      return site.clientName === currentUser.companyName || site.id.includes(currentUser.companyId.replace('comp-', ''));
    });
  }, [sites, currentUser]);

  const companySiteIds = useMemo(() => companySites.map((s) => s.id), [companySites]);

  // 2. Company Reports: only reports belonging to the company's sites
  const companyReports = useMemo(() => {
    if (!currentUser) return [];
    return reports.filter((r) => {
      return companySiteIds.includes(r.siteId) || r.clientName === currentUser.companyName;
    });
  }, [reports, companySiteIds, currentUser]);

  // 3. Company Incidents: only incidents for the company's sites
  const companyIncidents = useMemo(() => {
    if (!currentUser) return [];
    return incidents.filter((i) => companySiteIds.includes(i.siteId));
  }, [incidents, companySiteIds, currentUser]);

  // Profile modal password / loginId update handler
  const handleUpdateProfileSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setProfileFeedback(null);

    const cleanId = profileLoginId.trim().toLowerCase();
    const cleanNewPass = profileNewPassword.trim();
    const cleanConfirm = profileConfirmPassword.trim();

    if (!cleanId) {
      setProfileFeedback({ type: 'error', message: 'Login ID cannot be empty.' });
      return;
    }

    let finalPass = currentUser.password;
    if (cleanNewPass) {
      if (cleanNewPass.length < 4) {
        setProfileFeedback({ type: 'error', message: 'New password must be at least 4 characters long.' });
        return;
      }
      if (cleanNewPass !== cleanConfirm) {
        setProfileFeedback({ type: 'error', message: 'New password and confirm password do not match.' });
        return;
      }
      finalPass = cleanNewPass;
    }

    const updatedAccount: CompanyClientAccount = {
      ...currentUser,
      loginId: cleanId,
      password: finalPass
    };

    setCurrentUser(updatedAccount);
    saveToStorage(STORAGE_KEYS.ZAXON_AUTH, updatedAccount);
    onUpdateAccount(updatedAccount);

    setProfileFeedback({ type: 'success', message: 'Login ID and password updated successfully!' });
    setProfileNewPassword('');
    setProfileConfirmPassword('');
    setTimeout(() => {
      setProfileFeedback(null);
    }, 4000);
  };

  // If not authenticated, render login view
  if (!currentUser) {
    return (
      <ZaxonOwnerLoginView
        accounts={accounts}
        onLoginSuccess={handleLoginSuccess}
        onSwitchToAdmin={onSwitchToAdmin}
        onSwitchToOfficer={onSwitchToOfficer}
        initialLoginId={initialLoginId}
      />
    );
  }

  const primarySite = companySites[0];

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#4B3621] flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E7DED2] shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 sm:py-0 sm:h-16 gap-2 sm:gap-4">
            {/* Left: Brand Logo & Title */}
            <div className="flex items-center justify-between sm:justify-start gap-2.5 sm:w-1/4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 sm:p-2 bg-[#6F4E37] text-white rounded-xl shadow-xs shrink-0">
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-sm sm:text-base font-black tracking-tight text-[#4B3621]">
                      REXON
                    </h1>
                    <span className="font-mono text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#FAF7F2] text-[#6F4E37] border border-[#E7DED2]">
                      PORTAL
                    </span>
                  </div>
                  <p className="text-[10px] text-[#8B735B] hidden md:block">
                    Verified Guard Patrol Audits & Executive Incident Feed
                  </p>
                </div>
              </div>

              {/* Mobile Live Clock Badge */}
              <div className="flex sm:hidden items-center gap-1.5 px-2 py-1 rounded-lg bg-[#FAF7F2] border border-[#E7DED2] text-[11px] font-mono text-[#4B3621] shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1B5E20] animate-pulse"></span>
                <span className="font-bold text-[#6F4E37]">{liveTimeWithSeconds}</span>
              </div>
            </div>

            {/* Center: Profile & Sign Out Buttons (Centered, brought close together, never clipped) */}
            <div className="flex items-center justify-center gap-2 sm:flex-1 py-0.5">
              {/* Dedicated Profile Button */}
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2] hover:border-[#6F4E37] transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-2xs active:scale-95 shrink-0"
                title="View Company Profile & Update Credentials"
              >
                <User className="w-3.5 h-3.5 text-[#6F4E37]" />
                <span>Profile</span>
              </button>

              {/* Sign Out Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#FFEBEE] text-[#8B735B] hover:text-[#C62828] border border-[#E7DED2] hover:border-[#FFCDD2] transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-2xs active:scale-95 shrink-0"
                title="Sign out of Rexon Company Portal"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Right: Live Clock & Quick Switchers (Desktop) */}
            <div className="hidden sm:flex items-center justify-end gap-2 sm:w-1/4 shrink-0">
              {/* Live Date & Real-Time Clock Badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E7DED2] text-xs font-mono text-[#4B3621] shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#1B5E20] animate-pulse"></span>
                <span className="font-bold text-[#6F4E37] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#6F4E37]" />
                  {liveTimeWithSeconds}
                </span>
              </div>

              {/* Portal Switchers */}
              <button
                type="button"
                onClick={onSwitchToAdmin}
                className="px-2 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2] text-[11px] font-semibold transition-colors cursor-pointer hidden lg:flex items-center gap-1"
                title="Switch to REXON Super Admin Portal"
              >
                <ExternalLink className="w-3 h-3 text-[#6F4E37]" />
                <span>Admin</span>
              </button>

              <button
                type="button"
                onClick={onSwitchToOfficer}
                className="px-2 py-1.5 rounded-lg bg-[#6F4E37] hover:bg-[#5A3E2B] text-white text-[11px] font-semibold transition-colors cursor-pointer hidden lg:flex items-center gap-1"
                title="Switch to Field Officer Patrol Mode"
              >
                <span>Field</span>
              </button>
            </div>
          </div>

          {/* Navigation Tab Bar - Refined smaller size, elegant presentation */}
          <nav className="flex flex-wrap items-center justify-center sm:justify-start gap-1 sm:gap-1.5 border-t border-[#E7DED2] py-1.5 sm:py-2">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-[#6F4E37] text-white shadow-2xs border border-[#6F4E37]'
                  : 'text-[#5C4033] hover:text-[#4B3621] bg-white hover:bg-[#FAF7F2] border border-[#E7DED2]'
              }`}
            >
              <LayoutDashboard className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Overview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'reports'
                  ? 'bg-[#6F4E37] text-white shadow-2xs border border-[#6F4E37]'
                  : 'text-[#5C4033] hover:text-[#4B3621] bg-white hover:bg-[#FAF7F2] border border-[#E7DED2]'
              }`}
            >
              <FileCheck2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Patrol Reports ({companyReports.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sites')}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'sites'
                  ? 'bg-[#6F4E37] text-white shadow-2xs border border-[#6F4E37]'
                  : 'text-[#5C4033] hover:text-[#4B3621] bg-white hover:bg-[#FAF7F2] border border-[#E7DED2]'
              }`}
            >
              <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Facilities ({companySites.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('downloads')}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'downloads'
                  ? 'bg-[#6F4E37] text-white shadow-2xs border border-[#6F4E37]'
                  : 'text-[#5C4033] hover:text-[#4B3621] bg-white hover:bg-[#FAF7F2] border border-[#E7DED2]'
              }`}
            >
              <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Download Reports</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 pb-16">
        {activeTab === 'dashboard' && (
          <ZaxonOwnerDashboardView
            account={currentUser}
            companySites={companySites}
            companyReports={companyReports}
            companyIncidents={companyIncidents}
            officers={officers}
            assignments={assignments}
            onSelectReport={(report) => setSelectedReport(report)}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'reports' && (
          <ZaxonReportsView
            reports={companyReports}
            sites={companySites}
            onSelectReport={(report) => setSelectedReport(report)}
            onOpenDownloads={() => setActiveTab('downloads')}
          />
        )}

        {activeTab === 'sites' && (
          <ZaxonSitesView sites={companySites} />
        )}

        {activeTab === 'downloads' && (
          <ZaxonDownloadsView
            account={currentUser}
            reports={companyReports}
            sites={companySites}
          />
        )}
      </main>

      {/* DEDICATED COMPANY PROFILE & CREDENTIALS MODAL */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white border border-[#E7DED2] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#E7DED2] bg-[#FAF7F2] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#6F4E37] text-white rounded-xl">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#4B3621]">
                    Company Profile & Security Credentials
                  </h3>
                  <p className="text-xs text-[#8B735B]">
                    Manage company information, facility details, and update portal login credentials.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="text-[#8B735B] hover:text-[#4B3621] p-1.5 rounded-lg hover:bg-[#F0E8DD] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
              {profileFeedback && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-2xs ${
                    profileFeedback.type === 'success'
                      ? 'bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9]'
                      : 'bg-[#FFEBEE] text-[#C62828] border border-[#FFCDD2]'
                  }`}
                >
                  {profileFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{profileFeedback.message}</span>
                </div>
              )}

              {/* 1. Company & Facility Information Card */}
              <div className="bg-[#FAF7F2] border border-[#E7DED2] rounded-2xl p-4.5 space-y-3.5">
                <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#E7DED2]">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[10px] font-bold text-[#4B3621] bg-[#F0E8DD] px-2 py-0.5 rounded border border-[#E7DED2]">
                        {currentUser.code || primarySite?.code || 'SITE-CODE'}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9]">
                        Verified Client Enterprise
                      </span>
                    </div>
                    <h4 className="text-base font-black text-[#4B3621] mt-1">
                      {currentUser.companyName}
                    </h4>
                    {primarySite && (
                      <div className="text-xs font-semibold text-[#6F4E37] flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Facility: {primarySite.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Address */}
                  <div className="space-y-0.5">
                    <span className="text-[#8B735B] text-[10px] uppercase font-bold flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#6F4E37]" />
                      <span>Address / Location</span>
                    </span>
                    <div className="font-semibold text-[#4B3621]">
                      {currentUser.address || primarySite?.address || 'Registered Premises'}
                    </div>
                  </div>

                  {/* Industry Sector */}
                  <div className="space-y-0.5">
                    <span className="text-[#8B735B] text-[10px] uppercase font-bold flex items-center gap-1">
                      <Compass className="w-3 h-3 text-[#6F4E37]" />
                      <span>Industry / Sector</span>
                    </span>
                    <div className="font-semibold text-[#4B3621]">
                      {currentUser.industry || primarySite?.industry || 'Commercial & Industrial'}
                    </div>
                  </div>

                  {/* Contact Person */}
                  <div className="space-y-0.5">
                    <span className="text-[#8B735B] text-[10px] uppercase font-bold flex items-center gap-1">
                      <User className="w-3 h-3 text-[#6F4E37]" />
                      <span>Primary Contact</span>
                    </span>
                    <div className="font-semibold text-[#4B3621]">
                      {currentUser.name || primarySite?.contactPerson || 'Facility Lead'}
                    </div>
                  </div>

                  {/* Contact Phone & Email */}
                  <div className="space-y-0.5">
                    <span className="text-[#8B735B] text-[10px] uppercase font-bold flex items-center gap-1">
                      <Phone className="w-3 h-3 text-[#6F4E37]" />
                      <span>Phone & Email</span>
                    </span>
                    <div className="font-semibold text-[#4B3621] font-mono">
                      {currentUser.phone || primarySite?.contactPhone || 'N/A'}
                    </div>
                    {currentUser.email && (
                      <div className="text-[11px] text-[#8B735B] truncate">
                        {currentUser.email}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. UPDATE LOGIN ID & PASSWORD FORM */}
              <form onSubmit={handleUpdateProfileSecurity} className="bg-white border border-[#E7DED2] rounded-2xl p-4.5 space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-[#E7DED2]">
                  <KeyRound className="w-4 h-4 text-[#6F4E37]" />
                  <h4 className="text-xs font-bold text-[#4B3621] uppercase tracking-wide">
                    Update Portal Login ID & Password
                  </h4>
                </div>

                <div className="space-y-3">
                  {/* Login ID Input */}
                  <div>
                    <label className="block text-[#4B3621] font-bold mb-1">
                      Portal Login ID
                    </label>
                    <input
                      type="text"
                      required
                      value={profileLoginId}
                      onChange={(e) => setProfileLoginId(e.target.value)}
                      placeholder="e.g. apex.portal"
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-xl text-xs font-mono text-[#4B3621] focus:bg-white focus:outline-none focus:border-[#6F4E37]"
                    />
                    <p className="text-[10px] text-[#8B735B] mt-1">
                      Used by company executives, HR, and facility heads to log into this portal.
                    </p>
                  </div>

                  {/* New Password Input */}
                  <div>
                    <label className="block text-[#4B3621] font-bold mb-1">
                      New Password (Leave blank to keep unchanged)
                    </label>
                    <div className="relative">
                      <input
                        type={showProfilePassword ? 'text' : 'password'}
                        value={profileNewPassword}
                        onChange={(e) => setProfileNewPassword(e.target.value)}
                        placeholder="Enter new portal password"
                        className="w-full pl-3 pr-10 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-xl text-xs font-mono text-[#4B3621] focus:bg-white focus:outline-none focus:border-[#6F4E37]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowProfilePassword(!showProfilePassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8B735B] hover:text-[#4B3621] cursor-pointer"
                      >
                        {showProfilePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password Input */}
                  {profileNewPassword && (
                    <div className="animate-in fade-in">
                      <label className="block text-[#4B3621] font-bold mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type={showProfilePassword ? 'text' : 'password'}
                        value={profileConfirmPassword}
                        onChange={(e) => setProfileConfirmPassword(e.target.value)}
                        placeholder="Re-enter new portal password"
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-xl text-xs font-mono text-[#4B3621] focus:bg-white focus:outline-none focus:border-[#6F4E37]"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-[#E7DED2]">
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2] text-xs font-semibold cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#6F4E37] hover:bg-[#5A3E2B] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Credentials</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Patrol Report Detail Inspection Modal */}
      {selectedReport && (
        <SiteDetailModal
          report={selectedReport}
          site={companySites.find((s) => s.id === selectedReport.siteId)}
          allSiteIncidents={companyIncidents.filter((i) => i.siteId === selectedReport.siteId)}
          isOfficerMode={false}
          onClose={() => setSelectedReport(null)}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-[#E7DED2] py-4 text-center text-xs text-[#8B735B]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#1B5E20]" />
            <span>Rexon Field Patrolling · Enterprise Client Suite</span>
          </div>
          <div>
            Logged in for <strong className="text-[#4B3621]">{currentUser.companyName}</strong> (Unified ID: <code className="font-mono text-[#6F4E37]">{currentUser.loginId}</code>)
          </div>
        </div>
      </footer>
    </div>
  );
};
