import React, { useState, useMemo, useEffect } from 'react';
import {
  NavigationTab,
  FilterState,
  PatrolReport,
  Site,
  FieldOfficer,
  IncidentRecord,
  Assignment,
  IncidentStatus,
  ChecklistItem,
  AppMode,
  PatrolZone
} from './types';
import {
  DEMO_SITES,
  DEMO_OFFICERS,
  DEMO_PATROL_REPORTS,
  DEMO_INCIDENTS,
  DEMO_ASSIGNMENTS,
  MASTER_CHECKLIST_LIBRARY,
  INITIAL_PATROL_ZONES
} from './data/demoData';
import { loadFromStorage, saveToStorage, clearDemoStorage, STORAGE_KEYS } from './utils/storage';
import { DemoDataBanner } from './components/DemoDataBanner';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardKpiCards } from './components/DashboardKpiCards';
import { FilterBar } from './components/FilterBar';
import { PatrolReportsTable } from './components/PatrolReportsTable';
import { SiteDetailModal } from './components/SiteDetailModal';
import { SitesView } from './components/SitesView';
import { PatrolZonesView } from './components/PatrolZonesView';
import { FieldOfficersView } from './components/FieldOfficersView';
import { IncidentsView } from './components/IncidentsView';
import { AssignmentsView } from './components/AssignmentsView';
import { SettingsView } from './components/SettingsView';
import { ChecklistManagerModal } from './components/ChecklistManagerModal';
import { FieldOfficerMode } from './components/FieldOfficerMode';
import { ShieldCheck, FileSpreadsheet, AlertTriangle, ArrowUpRight, Smartphone, LogOut, Compass } from 'lucide-react';

export default function App() {
  // App Mode (Owner Dashboard vs Field Officer Mode)
  const [appMode, setAppMode] = useState<AppMode>('owner_dashboard');
  const [selectedOfficerPersonaId, setSelectedOfficerPersonaId] = useState<string>('off-sandeep');

  // Navigation & UI state
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<PatrolReport | null>(null);
  const [isChecklistManagerOpen, setIsChecklistManagerOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [globalFeedback, setGlobalFeedback] = useState<string | null>(null);

  // Persistent Demo Data State (loaded from localStorage with fallback)
  const [sites, setSites] = useState<Site[]>(() =>
    loadFromStorage(STORAGE_KEYS.SITES, DEMO_SITES)
  );
  const [officers, setOfficers] = useState<FieldOfficer[]>(() =>
    loadFromStorage(STORAGE_KEYS.OFFICERS, DEMO_OFFICERS)
  );
  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    const loaded = loadFromStorage(STORAGE_KEYS.ASSIGNMENTS, DEMO_ASSIGNMENTS);
    return loaded.map((a) => {
      const site = DEMO_SITES.find((s) => s.id === a.siteId);
      const start = a.startDate || a.date || '2026-10-20';
      const end = a.endDate || (a.id.includes('ami') ? '2026-10-24' : '2026-10-26');
      const startD = new Date(start).getTime();
      const endD = new Date(end).getTime();
      const diff = Math.round((endD - startD) / (1000 * 60 * 60 * 24)) + 1;
      return {
        ...a,
        startDate: start,
        endDate: end,
        durationDays: a.durationDays || (diff > 0 ? diff : 7),
        clientName: a.clientName || site?.clientName || 'Contract Client',
        workingDays: a.workingDays || 'All Days (Mon - Sun)',
        status: a.status || 'active'
      };
    });
  });
  const [masterChecklists, setMasterChecklists] = useState<ChecklistItem[]>(() =>
    loadFromStorage(STORAGE_KEYS.CHECKLISTS, MASTER_CHECKLIST_LIBRARY)
  );
  const [reports, setReports] = useState<PatrolReport[]>(() =>
    loadFromStorage(STORAGE_KEYS.REPORTS, DEMO_PATROL_REPORTS)
  );
  const [incidents, setIncidents] = useState<IncidentRecord[]>(() =>
    loadFromStorage(STORAGE_KEYS.INCIDENTS, DEMO_INCIDENTS)
  );
  const [zones, setZones] = useState<PatrolZone[]>(() => {
    const stored = loadFromStorage<any>(STORAGE_KEYS.AREAS, INITIAL_PATROL_ZONES);
    if (Array.isArray(stored) && stored.length > 0) {
      if (typeof stored[0] === 'string') {
        return (stored as string[]).map((name, idx) => ({
          id: `zone-${idx + 1}`,
          name,
          code: `ZONE-${String.fromCharCode(65 + (idx % 26))}`,
          description: `Patrol zone for ${name}`
        }));
      }
      return stored as PatrolZone[];
    }
    return INITIAL_PATROL_ZONES;
  });

  // Auto-sync state to localStorage whenever it changes
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SITES, sites);
  }, [sites]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.OFFICERS, officers);
  }, [officers]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ASSIGNMENTS, assignments);
  }, [assignments]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CHECKLISTS, masterChecklists);
  }, [masterChecklists]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.REPORTS, reports);
  }, [reports]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.INCIDENTS, incidents);
  }, [incidents]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.AREAS, zones);
  }, [zones]);

  // Dashboard Filters State
  const [filters, setFilters] = useState<FilterState>({
    date: 'today',
    area: 'all',
    officerId: 'all',
    siteId: 'all',
    status: 'all',
    searchQuery: ''
  });

  const handleFilterChange = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      date: 'today',
      area: 'all',
      officerId: 'all',
      siteId: 'all',
      status: 'all',
      searchQuery: ''
    });
  };

  // Filtered Patrol Reports calculation
  const filteredReports = useMemo(() => {
    return reports.filter((rep) => {
      if (filters.date === 'today' && rep.scheduledDate !== '2026-10-20') return false;
      if (filters.date === 'yesterday' && rep.scheduledDate !== '2026-10-19') return false;

      if (filters.area !== 'all' && rep.area !== filters.area) return false;
      if (filters.officerId !== 'all' && rep.officerId !== filters.officerId) return false;
      if (filters.siteId !== 'all' && rep.siteId !== filters.siteId) return false;
      if (filters.status !== 'all' && rep.status !== filters.status) return false;

      if (filters.searchQuery.trim() !== '') {
        const query = filters.searchQuery.toLowerCase();
        const matchesName = rep.siteName.toLowerCase().includes(query);
        const matchesOfficer = rep.officerName.toLowerCase().includes(query);
        const matchesBadge = rep.officerBadge.toLowerCase().includes(query);
        const matchesCode = rep.reportCode.toLowerCase().includes(query);
        const matchesArea = rep.area.toLowerCase().includes(query);
        if (!matchesName && !matchesOfficer && !matchesBadge && !matchesCode && !matchesArea) {
          return false;
        }
      }

      return true;
    });
  }, [reports, filters]);

  // Derived KPI calculations
  const totalSitesCount = sites.filter((s) => s.isActive).length;
  const activeOfficersCount = officers.filter(
    (o) => o.employmentStatus === 'active' && (o.status === 'patrolling' || o.status === 'on_duty')
  ).length;
  const completedPatrolsCount = reports.filter((r) => r.status === 'completed').length;
  const pendingPatrolsCount = reports.filter((r) => r.status === 'pending').length;
  const missedPatrolsCount = reports.filter((r) => r.status === 'missed').length;
  const openIncidentsCount = incidents.filter((i) => i.status !== 'resolved').length;

  // 1. SITES MANAGEMENT HANDLERS
  const handleSaveSite = (savedSite: Site) => {
    setSites((prev) => {
      const exists = prev.some((s) => s.id === savedSite.id);
      if (exists) {
        return prev.map((s) => (s.id === savedSite.id ? savedSite : s));
      }
      return [savedSite, ...prev];
    });
  };

  const handleToggleSiteStatus = (siteId: string) => {
    setSites((prev) =>
      prev.map((s) => {
        if (s.id === siteId) {
          const nextActive = !s.isActive;
          setGlobalFeedback(
            `Site "${s.name}" is now ${nextActive ? 'Active' : 'Deactivated'}. (Saved in demo session)`
          );
          setTimeout(() => setGlobalFeedback(null), 3000);
          return { ...s, isActive: nextActive };
        }
        return s;
      })
    );
  };

  // ZONE MANAGEMENT HANDLERS (REQUESTED BY USER)
  const handleCreateZone = (newZone: PatrolZone) => {
    setZones((prev) => {
      const exists = prev.some((z) => z.id === newZone.id || z.name.toLowerCase() === newZone.name.toLowerCase());
      if (exists) return prev;
      return [...prev, newZone];
    });
    setGlobalFeedback(`Patrol zone "${newZone.name}" created and added to site selection list.`);
    setTimeout(() => setGlobalFeedback(null), 3000);
  };

  const handleUpdateZone = (updatedZone: PatrolZone, oldName: string) => {
    setZones((prev) => prev.map((z) => (z.id === updatedZone.id ? updatedZone : z)));
    if (oldName && oldName !== updatedZone.name) {
      setSites((prev) =>
        prev.map((s) => (s.area.toLowerCase() === oldName.toLowerCase() ? { ...s, area: updatedZone.name } : s))
      );
      setAssignments((prev) =>
        prev.map((a) => (a.area.toLowerCase() === oldName.toLowerCase() ? { ...a, area: updatedZone.name } : a))
      );
      setOfficers((prev) =>
        prev.map((o) => (o.area.toLowerCase() === oldName.toLowerCase() ? { ...o, area: updatedZone.name } : o))
      );
    }
    setGlobalFeedback(`Zone "${updatedZone.name}" updated successfully.`);
    setTimeout(() => setGlobalFeedback(null), 3000);
  };

  const handleDeleteZone = (zoneId: string, reassignToZoneName?: string) => {
    const target = zones.find((z) => z.id === zoneId);
    if (!target) return;
    setZones((prev) => prev.filter((z) => z.id !== zoneId));
    if (reassignToZoneName) {
      setSites((prev) =>
        prev.map((s) => (s.area.toLowerCase() === target.name.toLowerCase() ? { ...s, area: reassignToZoneName } : s))
      );
      setAssignments((prev) =>
        prev.map((a) => (a.area.toLowerCase() === target.name.toLowerCase() ? { ...a, area: reassignToZoneName } : a))
      );
    }
    setGlobalFeedback(`Zone "${target.name}" removed.`);
    setTimeout(() => setGlobalFeedback(null), 3000);
  };

  // 2. FIELD OFFICER MANAGEMENT HANDLERS
  const handleSaveOfficer = (savedOfficer: FieldOfficer) => {
    setOfficers((prev) => {
      const exists = prev.some((o) => o.id === savedOfficer.id);
      if (exists) {
        return prev.map((o) => (o.id === savedOfficer.id ? savedOfficer : o));
      }
      return [savedOfficer, ...prev];
    });
  };

  const handleToggleOfficerStatus = (officerId: string) => {
    setOfficers((prev) =>
      prev.map((o) => {
        if (o.id === officerId) {
          const nextActive = o.employmentStatus !== 'active';
          setGlobalFeedback(
            `Officer "${o.name}" status set to ${nextActive ? 'Active' : 'Deactivated'}. (Saved in demo session)`
          );
          setTimeout(() => setGlobalFeedback(null), 3000);
          return {
            ...o,
            employmentStatus: nextActive ? 'active' : 'deactivated',
            isActive: nextActive,
            status: nextActive ? 'on_duty' : 'off_duty'
          };
        }
        return o;
      })
    );
  };

  // 3. ASSIGNMENT MANAGEMENT HANDLERS
  const handleAddAssignments = (newAssignmentsList: Assignment[]) => {
    setAssignments((prev) => [...newAssignmentsList, ...prev]);

    if (newAssignmentsList.length > 0) {
      const offId = newAssignmentsList[0].officerId;
      const newSiteIds = newAssignmentsList.map((a) => a.siteId);
      setOfficers((prev) =>
        prev.map((o) => {
          if (o.id === offId) {
            const combined = Array.from(new Set([...o.assignedSiteIds, ...newSiteIds]));
            return { ...o, assignedSiteIds: combined };
          }
          return o;
        })
      );
    }
  };

  const handleUpdateAssignment = (updatedAsg: Assignment) => {
    setAssignments((prev) =>
      prev.map((asg) => (asg.id === updatedAsg.id ? updatedAsg : asg))
    );
  };

  const handleCancelAssignment = (assignmentId: string) => {
    setAssignments((prev) =>
      prev.map((asg) => (asg.id === assignmentId ? { ...asg, status: 'cancelled' } : asg))
    );
  };

  // 4. CHECKLIST MANAGEMENT HANDLER
  const handleSaveMasterChecklists = (updatedChecklists: ChecklistItem[]) => {
    setMasterChecklists(updatedChecklists);
  };

  // 5. INCIDENT STATUS HANDLER
  const handleUpdateIncidentStatus = (incidentId: string, newStatus: IncidentStatus) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === incidentId ? { ...inc, status: newStatus } : inc))
    );
  };

  // 6. MODULE 4: SUBMIT PATROL REPORT FROM FIELD OFFICER MODE
  const handleSubmitPatrolReport = (newReport: PatrolReport, newIncident?: IncidentRecord) => {
    // 1. Add to reports list
    setReports((prev) => [newReport, ...prev]);

    // 2. Update site progress & timestamp
    setSites((prev) =>
      prev.map((s) => {
        if (s.id === newReport.siteId) {
          return {
            ...s,
            completedPatrolsToday: s.completedPatrolsToday + 1,
            lastPatrolTime: newReport.completedAt || newReport.actualCheckInTime || 'Completed',
            incidentCount: newIncident ? s.incidentCount + 1 : s.incidentCount,
            securityStatus: newIncident ? 'incident_reported' : s.securityStatus
          };
        }
        return s;
      })
    );

    // 3. Update assignment status
    setAssignments((prev) =>
      prev.map((asg) => {
        if (asg.officerId === newReport.officerId && asg.siteId === newReport.siteId) {
          return {
            ...asg,
            status: 'completed',
            patrolsCompleted: asg.patrolsCompleted + 1
          };
        }
        return asg;
      })
    );

    // 4. Update officer stats
    setOfficers((prev) =>
      prev.map((o) => {
        if (o.id === newReport.officerId) {
          return {
            ...o,
            patrolsCompletedToday: o.patrolsCompletedToday + 1,
            lastCheckInTime: newReport.actualCheckInTime || o.lastCheckInTime,
            currentActivity: `Completed Patrol at ${newReport.siteName}`
          };
        }
        return o;
      })
    );

    // 5. If incident was reported during patrol, add to incidents list
    if (newIncident) {
      setIncidents((prev) => [newIncident, ...prev]);
    }

    setGlobalFeedback(
      `Patrol report ${newReport.reportCode} (${newReport.siteName}) successfully received from Officer ${newReport.officerName} and recorded in live operations log.`
    );
    setTimeout(() => setGlobalFeedback(null), 4000);
  };

  // Switch to Owner Dashboard and open specific report
  const handleViewReportInOwner = (reportId: string) => {
    setAppMode('owner_dashboard');
    setCurrentTab('reports');
    const targetReport = reports.find((r) => r.id === reportId);
    if (targetReport) {
      setSelectedReport(targetReport);
    }
  };

  // 7. RESET DEMO DATA
  const handleResetToDemoDefaults = () => {
    clearDemoStorage();
    setSites(DEMO_SITES);
    setOfficers(DEMO_OFFICERS);
    setAssignments(DEMO_ASSIGNMENTS);
    setMasterChecklists(MASTER_CHECKLIST_LIBRARY);
    setZones(INITIAL_PATROL_ZONES);
    setReports(DEMO_PATROL_REPORTS);
    setIncidents(DEMO_INCIDENTS);
    setGlobalFeedback('All demo records reset to initial factory demo state.');
    setTimeout(() => setGlobalFeedback(null), 3000);
  };

  const handleRefreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setGlobalFeedback('Demo data reloaded and synchronized with local session.');
      setTimeout(() => setGlobalFeedback(null), 2500);
    }, 600);
  };

  const handleExportCSV = () => {
    setGlobalFeedback('Exporting daily patrol logs & GPS audit sheet to CSV (Demo)...');
    setTimeout(() => {
      setGlobalFeedback(null);
    }, 3000);
  };

  // --- RENDER FIELD OFFICER MODE IF ACTIVE ---
  if (appMode === 'field_officer') {
    return (
      <FieldOfficerMode
        officers={officers}
        sites={sites}
        assignments={assignments}
        reports={reports}
        selectedOfficerId={selectedOfficerPersonaId}
        onSelectOfficer={setSelectedOfficerPersonaId}
        onUpdateOfficer={handleSaveOfficer}
        onSwitchToOwnerMode={() => setAppMode('owner_dashboard')}
        onSubmitPatrolReport={handleSubmitPatrolReport}
        onViewReportInOwner={handleViewReportInOwner}
      />
    );
  }

  // --- RENDER SECURITY OWNER DASHBOARD ---
  return (
    <div className="min-h-screen bg-[#F8F5EF] text-[#4B3621] flex flex-col antialiased font-sans">
      {/* 1. Global Demo Data Notice Banner */}
      <DemoDataBanner onSwitchToFieldOfficerMode={() => setAppMode('field_officer')} />

      {/* 2. Top Header Bar */}
      <Header
        currentTab={currentTab}
        appMode={appMode}
        onSwitchAppMode={setAppMode}
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onRefreshData={handleRefreshData}
        isRefreshing={isRefreshing}
      />

      {/* 3. Main Workspace Layout */}
      <div className="flex-1 flex w-full">
        {/* Left Sidebar Navigation */}
        <Sidebar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          openIncidentsCount={openIncidentsCount}
          missedPatrolsCount={missedPatrolsCount}
          activeOfficersCount={activeOfficersCount}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Center Main Content Area */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0 space-y-6">
          {globalFeedback && (
            <div className="p-3 bg-[#E8F5E9] border border-[#C8E6C9] rounded-xl text-xs text-[#1B5E20] flex items-center gap-2 animate-in fade-in shadow-2xs">
              <FileSpreadsheet className="w-4 h-4 text-[#2E7D32] shrink-0" />
              <span>{globalFeedback}</span>
            </div>
          )}

          {/* TAB 1: DASHBOARD */}
          {currentTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Security Alert Ticker if any high incidents or missed patrols */}
              {(missedPatrolsCount > 0 || openIncidentsCount > 0) && (
                <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-2xs">
                  <div className="flex items-center gap-2 text-[#92400E]">
                    <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />
                    <span>
                      <strong>Operations Alert:</strong> {missedPatrolsCount} missed patrol flagged for audit & {openIncidentsCount} open incidents under investigation.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleFilterChange('status', 'missed')}
                      className="text-xs px-2.5 py-1 rounded bg-[#FDE68A] hover:bg-[#FCD34D] text-[#78350F] border border-[#F59E0B] font-medium transition-colors cursor-pointer"
                    >
                      Filter Missed ({missedPatrolsCount})
                    </button>
                    <button
                      onClick={() => setCurrentTab('incidents')}
                      className="text-xs px-2.5 py-1 rounded bg-[#6F4E37] hover:bg-[#5A3E2B] text-white font-medium transition-colors cursor-pointer"
                    >
                      View Incidents ({openIncidentsCount})
                    </button>
                  </div>
                </div>
              )}

              {/* KPI Summary Cards */}
              <DashboardKpiCards
                totalSites={totalSitesCount}
                activeOfficers={activeOfficersCount}
                completedPatrols={completedPatrolsCount}
                pendingPatrols={pendingPatrolsCount}
                missedPatrols={missedPatrolsCount}
                openIncidents={openIncidentsCount}
                onFilterByStatus={(st) => handleFilterChange('status', st)}
                onNavigateTab={(tab) => setCurrentTab(tab)}
                currentStatusFilter={filters.status}
              />

              {/* Live Working Filter Bar */}
              <FilterBar
                filters={filters}
                onFilterChange={handleFilterChange}
                onResetFilters={handleResetFilters}
                sites={sites}
                officers={officers}
                areas={zones.map((z) => z.name)}
                totalResultsCount={filteredReports.length}
                totalPatrolsCount={reports.length}
              />

              {/* Patrol Reports Table Module */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-[#4B3621] flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#6F4E37]" />
                      <span>Live Patrol Reports & Verification Stream</span>
                    </h3>
                    <p className="text-xs text-[#8B735B]">
                      Real-time patrol logs with verified GPS geofence checks, officer check-in stamps, and incident tags
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportCSV}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#4B3621] hover:text-[#2E1F14] bg-[#FFFFFF] hover:bg-[#F0E8DD] border border-[#E7DED2] rounded-lg transition-colors cursor-pointer shadow-2xs"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-[#6F4E37]" />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                <PatrolReportsTable
                  reports={filteredReports}
                  onSelectReport={(rep) => setSelectedReport(rep)}
                  onFilterByOfficer={(offId) => handleFilterChange('officerId', offId)}
                  onFilterBySite={(sId) => handleFilterChange('siteId', sId)}
                />
              </div>

              {/* Quick Jump Callout Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                <div
                  onClick={() => setCurrentTab('sites')}
                  className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E7DED2] hover:border-[#8B735B] hover:bg-[#FAF7F2] transition-colors cursor-pointer group flex items-center justify-between shadow-2xs"
                >
                  <div>
                    <div className="text-xs font-bold text-[#4B3621] group-hover:text-[#6F4E37] transition-colors">
                      Sites Management
                    </div>
                    <div className="text-[11px] text-[#8B735B]">
                      Create sites, site-specific checklists & GPS
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[#8B735B] group-hover:text-[#4B3621]" />
                </div>

                <div
                  onClick={() => setCurrentTab('zones')}
                  className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E7DED2] hover:border-[#8B735B] hover:bg-[#FAF7F2] transition-colors cursor-pointer group flex items-center justify-between shadow-2xs"
                >
                  <div>
                    <div className="text-xs font-bold text-[#4B3621] group-hover:text-[#6F4E37] transition-colors">
                      Patrol Areas & Zones
                    </div>
                    <div className="text-[11px] text-[#8B735B]">
                      Manage patrol sectors ({zones.length} active zones)
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[#8B735B] group-hover:text-[#4B3621]" />
                </div>

                <div
                  onClick={() => setCurrentTab('assignments')}
                  className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E7DED2] hover:border-[#8B735B] hover:bg-[#FAF7F2] transition-colors cursor-pointer group flex items-center justify-between shadow-2xs"
                >
                  <div>
                    <div className="text-xs font-bold text-[#4B3621] group-hover:text-[#6F4E37] transition-colors">
                      Site & Company Allocations
                    </div>
                    <div className="text-[11px] text-[#8B735B]">
                      Date-wise allocations with conflict check
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[#8B735B] group-hover:text-[#4B3621]" />
                </div>

                <div
                  onClick={() => setAppMode('field_officer')}
                  className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#6F4E37]/30 hover:border-[#6F4E37] transition-colors cursor-pointer group flex items-center justify-between shadow-2xs"
                >
                  <div>
                    <div className="text-xs font-bold text-[#6F4E37] group-hover:text-[#5A3E2B] transition-colors">
                      Launch Field Officer Mode
                    </div>
                    <div className="text-[11px] text-[#8B735B]">
                      Simulate mobile patrol & inspections
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[#6F4E37]" />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SITES MANAGEMENT */}
          {currentTab === 'sites' && (
            <SitesView
              sites={sites}
              reports={reports}
              assignments={assignments}
              officers={officers}
              masterChecklists={masterChecklists}
              zones={zones}
              onCreateZone={handleCreateZone}
              onSaveSite={handleSaveSite}
              onToggleSiteStatus={handleToggleSiteStatus}
              onSelectSiteReport={(rep) => setSelectedReport(rep)}
              onOpenChecklistManager={() => setIsChecklistManagerOpen(true)}
              onOpenZonesManager={() => setCurrentTab('zones')}
            />
          )}

          {/* TAB: PATROL AREAS & ZONES (REQUESTED BY USER) */}
          {currentTab === 'zones' && (
            <PatrolZonesView
              zones={zones}
              sites={sites}
              officers={officers}
              onCreateZone={handleCreateZone}
              onUpdateZone={handleUpdateZone}
              onDeleteZone={handleDeleteZone}
              onNavigateToSitesWithZone={(zoneName) => {
                handleFilterChange('area', zoneName);
                setCurrentTab('sites');
              }}
            />
          )}

          {/* TAB 3: FIELD OFFICERS MANAGEMENT */}
          {currentTab === 'officers' && (
            <FieldOfficersView
              officers={officers}
              sites={sites}
              reports={reports}
              assignments={assignments}
              areas={zones.map((z) => z.name)}
              onSaveOfficer={handleSaveOfficer}
              onToggleOfficerStatus={handleToggleOfficerStatus}
              onFilterByOfficer={(offId) => {
                handleFilterChange('officerId', offId);
                setCurrentTab('dashboard');
              }}
              onSelectReport={(rep) => setSelectedReport(rep)}
            />
          )}

          {/* TAB 4: PATROL REPORTS */}
          {currentTab === 'reports' && (
            <div className="space-y-4">
              <div className="bg-[#FFFFFF] border border-[#E7DED2] p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-[#4B3621]">Patrol Reports Audit Archive</h2>
                  <p className="text-xs text-[#8B735B] mt-0.5">
                    Complete verifiable patrol ledger with GPS deviation logs, inspection checkpoints and photos
                  </p>
                </div>
                <button
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#4B3621] hover:text-[#2E1F14] bg-[#FFFFFF] hover:bg-[#F0E8DD] border border-[#E7DED2] rounded-lg transition-colors cursor-pointer shadow-2xs shrink-0 whitespace-nowrap self-start sm:self-auto"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#6F4E37] shrink-0" />
                  <span>Export All Logs</span>
                </button>
              </div>

              <FilterBar
                filters={filters}
                onFilterChange={handleFilterChange}
                onResetFilters={handleResetFilters}
                sites={sites}
                officers={officers}
                areas={zones.map((z) => z.name)}
                totalResultsCount={filteredReports.length}
                totalPatrolsCount={reports.length}
              />

              <PatrolReportsTable
                reports={filteredReports}
                onSelectReport={(rep) => setSelectedReport(rep)}
                onFilterByOfficer={(offId) => handleFilterChange('officerId', offId)}
                onFilterBySite={(sId) => handleFilterChange('siteId', sId)}
              />
            </div>
          )}

          {/* TAB 5: INCIDENTS */}
          {currentTab === 'incidents' && (
            <IncidentsView
              incidents={incidents}
              onUpdateIncidentStatus={handleUpdateIncidentStatus}
            />
          )}

          {/* TAB 6: SITE ASSIGNMENTS */}
          {currentTab === 'assignments' && (
            <AssignmentsView
              assignments={assignments}
              sites={sites}
              officers={officers}
              areas={zones.map((z) => z.name)}
              onAddAssignments={handleAddAssignments}
              onUpdateAssignment={handleUpdateAssignment}
              onCancelAssignment={handleCancelAssignment}
            />
          )}

          {/* TAB 7: SETTINGS */}
          {currentTab === 'settings' && (
            <SettingsView
              onOpenMobilePreview={() => setAppMode('field_officer')}
              onResetToDemoDefaults={handleResetToDemoDefaults}
            />
          )}
        </main>
      </div>

      {/* Site Detail & Patrol Audit Modal */}
      {selectedReport && (
        <SiteDetailModal
          report={selectedReport}
          site={sites.find((s) => s.id === selectedReport.siteId)}
          allSiteIncidents={incidents.filter((i) => i.siteId === selectedReport.siteId)}
          onClose={() => setSelectedReport(null)}
        />
      )}

      {/* Checklist Library Configuration Modal */}
      {isChecklistManagerOpen && (
        <ChecklistManagerModal
          checklists={masterChecklists}
          onSaveChecklist={handleSaveMasterChecklists}
          onClose={() => setIsChecklistManagerOpen(false)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-[#E7DED2] bg-[#FFFFFF] px-4 py-3 text-center text-xs text-[#8B735B]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-medium text-[#4B3621]">Rexon Field Patrolling App · Security Company Operations</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAppMode('field_officer')}
              className="text-[#6F4E37] hover:text-[#4B3621] font-semibold underline cursor-pointer"
            >
              Switch to Field Officer Mode
            </button>
            <span className="font-mono text-[11px] text-[#8B735B] bg-[#F0E8DD] px-2 py-0.5 rounded border border-[#E7DED2]">
              DEMO STORAGE ACTIVE
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
