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
  INITIAL_PATROL_ZONES,
  DEMO_COMPANY_CONFIG
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
import { isFirebaseConfigured } from './lib/firebase';
import { downloadPatrolReportsCSV } from './utils/csvExport';
import {
  DEFAULT_COMPANY_ID,
  subscribeSites,
  saveSiteToFirestore,
  deleteSiteFromFirestore,
  subscribeOfficers,
  saveOfficerToFirestore,
  deleteOfficerFromFirestore,
  subscribeAssignments,
  saveAssignmentToFirestore,
  subscribePatrolReports,
  submitPatrolReportToFirestore,
  subscribeIncidents,
  saveIncidentToFirestore,
  subscribeZones,
  saveZoneToFirestore,
  deleteZoneFromFirestore,
  saveCompanyConfigToFirestore
} from './services/firestoreService';


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

  const [companyConfig, setCompanyConfig] = useState(() =>
    loadFromStorage(STORAGE_KEYS.COMPANY_CONFIG, DEMO_COMPANY_CONFIG)
  );

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

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.COMPANY_CONFIG, companyConfig);
  }, [companyConfig]);


  // Live Cloud Firestore Subscriptions (Active only when real Firebase is configured)
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    const unsubs = [
      subscribeSites(DEFAULT_COMPANY_ID, (liveSites) => {
        if (liveSites && liveSites.length > 0) setSites(liveSites);
      }, (err) => setGlobalFeedback(`[Firestore Error] Sites sync: ${err.message}`)),
      subscribeOfficers(DEFAULT_COMPANY_ID, (liveOfficers) => {
        if (liveOfficers && liveOfficers.length > 0) setOfficers(liveOfficers);
      }),
      subscribeAssignments(DEFAULT_COMPANY_ID, (liveAssignments) => {
        if (liveAssignments && liveAssignments.length > 0) setAssignments(liveAssignments);
      }),
      subscribePatrolReports(DEFAULT_COMPANY_ID, (liveReports) => {
        if (liveReports && liveReports.length > 0) setReports(liveReports);
      }),
      subscribeIncidents(DEFAULT_COMPANY_ID, (liveIncidents) => {
        if (liveIncidents && liveIncidents.length > 0) setIncidents(liveIncidents);
      }),
      subscribeZones(DEFAULT_COMPANY_ID, (liveZones) => {
        if (liveZones && liveZones.length > 0) setZones(liveZones);
      })
    ];

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, []);

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
  const handleSaveSite = async (savedSite: Site) => {
    setSites((prev) => {
      const exists = prev.some((s) => s.id === savedSite.id);
      if (exists) {
        return prev.map((s) => (s.id === savedSite.id ? savedSite : s));
      }
      return [savedSite, ...prev];
    });

    if (isFirebaseConfigured) {
      try {
        await saveSiteToFirestore(DEFAULT_COMPANY_ID, savedSite);
        setGlobalFeedback(`Site "${savedSite.name}" synced to Cloud Firestore.`);
        setTimeout(() => setGlobalFeedback(null), 3000);
      } catch (err: any) {
        setGlobalFeedback(`[Firestore Error] Could not save site: ${err?.message || 'Permission denied'}`);
      }
    }
  };

  const handleToggleSiteStatus = async (siteId: string) => {
    const targetSite = sites.find((s) => s.id === siteId);
    if (!targetSite) return;
    const updated = { ...targetSite, isActive: !targetSite.isActive };

    setSites((prev) => prev.map((s) => (s.id === siteId ? updated : s)));
    setGlobalFeedback(`Site "${updated.name}" is now ${updated.isActive ? 'Active' : 'Deactivated'}.`);
    setTimeout(() => setGlobalFeedback(null), 3000);

    if (isFirebaseConfigured) {
      try {
        await saveSiteToFirestore(DEFAULT_COMPANY_ID, updated);
      } catch (err: any) {
        setGlobalFeedback(`[Firestore Error] Status update failed: ${err?.message}`);
      }
    }
  };

  const handleDeleteSite = async (siteId: string) => {
    const targetSite = sites.find((s) => s.id === siteId);
    if (!targetSite) return;

    setSites((prev) => prev.filter((s) => s.id !== siteId));
    setAssignments((prev) => prev.filter((a) => a.siteId !== siteId));
    setGlobalFeedback(`Site "${targetSite.name}" was removed from the active monitoring database.`);
    setTimeout(() => setGlobalFeedback(null), 3000);

    if (isFirebaseConfigured) {
      try {
        await deleteSiteFromFirestore(DEFAULT_COMPANY_ID, siteId);
      } catch (err: any) {
        setGlobalFeedback(`[Firestore Error] Could not delete site: ${err?.message}`);
      }
    }
  };


  // ZONE MANAGEMENT HANDLERS (REQUESTED BY USER)
  const handleCreateZone = async (newZone: PatrolZone) => {
    setZones((prev) => {
      const exists = prev.some((z) => z.id === newZone.id || z.name.toLowerCase() === newZone.name.toLowerCase());
      if (exists) return prev;
      return [...prev, newZone];
    });
    setGlobalFeedback(`Patrol zone "${newZone.name}" created and added to site selection list.`);
    setTimeout(() => setGlobalFeedback(null), 3000);

    if (isFirebaseConfigured) {
      try {
        await saveZoneToFirestore(DEFAULT_COMPANY_ID, newZone);
      } catch (err: any) {
        setGlobalFeedback(`[Firestore Error] Could not save zone: ${err?.message}`);
      }
    }
  };

  const handleUpdateZone = async (updatedZone: PatrolZone, oldName: string) => {
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

    if (isFirebaseConfigured) {
      try {
        await saveZoneToFirestore(DEFAULT_COMPANY_ID, updatedZone);
      } catch (err: any) {
        setGlobalFeedback(`[Firestore Error] Could not update zone: ${err?.message}`);
      }
    }
  };

  const handleDeleteZone = async (zoneId: string, reassignToZoneName?: string) => {
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

    if (isFirebaseConfigured) {
      try {
        await deleteZoneFromFirestore(DEFAULT_COMPANY_ID, zoneId);
      } catch (err: any) {
        setGlobalFeedback(`[Firestore Error] Could not delete zone: ${err?.message}`);
      }
    }
  };

  // 2. FIELD OFFICER MANAGEMENT HANDLERS
  const handleSaveOfficer = async (savedOfficer: FieldOfficer) => {
    setOfficers((prev) => {
      const exists = prev.some((o) => o.id === savedOfficer.id);
      if (exists) {
        return prev.map((o) => (o.id === savedOfficer.id ? savedOfficer : o));
      }
      return [savedOfficer, ...prev];
    });

    if (isFirebaseConfigured) {
      try {
        await saveOfficerToFirestore(DEFAULT_COMPANY_ID, savedOfficer);
        setGlobalFeedback(`Officer "${savedOfficer.name}" saved to Cloud Firestore.`);
        setTimeout(() => setGlobalFeedback(null), 3000);
      } catch (err: any) {
        setGlobalFeedback(`[Firestore Error] Could not save officer: ${err?.message}`);
      }
    }
  };

  const handleToggleOfficerStatus = async (officerId: string) => {
    const target = officers.find((o) => o.id === officerId);
    if (!target) return;
    const nextActive = target.employmentStatus !== 'active';
    const updated: FieldOfficer = {
      ...target,
      employmentStatus: nextActive ? 'active' : 'deactivated',
      isActive: nextActive,
      status: nextActive ? 'on_duty' : 'off_duty'
    };

    setOfficers((prev) => prev.map((o) => (o.id === officerId ? updated : o)));
    setGlobalFeedback(`Officer "${target.name}" status set to ${nextActive ? 'Active' : 'Deactivated'}.`);
    setTimeout(() => setGlobalFeedback(null), 3000);

    if (isFirebaseConfigured) {
      try {
        await saveOfficerToFirestore(DEFAULT_COMPANY_ID, updated);
      } catch (err: any) {
        setGlobalFeedback(`[Firestore Error] Could not update officer status: ${err?.message}`);
      }
    }
  };

  const handleDeleteOfficer = async (officerId: string) => {
    const target = officers.find((o) => o.id === officerId);
    if (!target) return;

    setOfficers((prev) => prev.filter((o) => o.id !== officerId));
    setAssignments((prev) => prev.filter((a) => a.officerId !== officerId));
    setGlobalFeedback(`Officer "${target.name}" (${target.badgeNumber}) removed from active roster.`);
    setTimeout(() => setGlobalFeedback(null), 3000);

    if (isFirebaseConfigured) {
      try {
        await deleteOfficerFromFirestore(DEFAULT_COMPANY_ID, officerId);
      } catch (err: any) {
        setGlobalFeedback(`[Firestore Error] Could not delete officer: ${err?.message}`);
      }
    }
  };

  const handleSaveCompanyConfig = async (newConfig: typeof DEMO_COMPANY_CONFIG) => {
    setCompanyConfig(newConfig);
    setGlobalFeedback(`कंपनी सेटिंग्स "${newConfig.companyName}" सफलतापूर्वक सहेजी गईं (Company profile updated).`);
    setTimeout(() => setGlobalFeedback(null), 3500);

    if (isFirebaseConfigured) {
      try {
        await saveCompanyConfigToFirestore(DEFAULT_COMPANY_ID, newConfig);
      } catch (err: any) {
        setGlobalFeedback(`[Firestore Error] Could not save company settings: ${err?.message}`);
      }
    }
  };


  // 3. ASSIGNMENT MANAGEMENT HANDLERS
  const handleAddAssignments = async (newAssignmentsList: Assignment[]) => {
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

    if (isFirebaseConfigured) {
      try {
        for (const asg of newAssignmentsList) {
          await saveAssignmentToFirestore(DEFAULT_COMPANY_ID, asg);
        }
        setGlobalFeedback(`${newAssignmentsList.length} site assignment(s) saved to Cloud Firestore.`);
        setTimeout(() => setGlobalFeedback(null), 3000);
      } catch (err: any) {
        setGlobalFeedback(`[Firestore Error] Could not save assignments: ${err?.message}`);
      }
    }
  };

  const handleUpdateAssignment = async (updatedAsg: Assignment) => {
    setAssignments((prev) =>
      prev.map((asg) => (asg.id === updatedAsg.id ? updatedAsg : asg))
    );

    if (isFirebaseConfigured) {
      try {
        await saveAssignmentToFirestore(DEFAULT_COMPANY_ID, updatedAsg);
      } catch (err: any) {
        setGlobalFeedback(`[Firestore Error] Could not update assignment: ${err?.message}`);
      }
    }
  };

  const handleCancelAssignment = async (assignmentId: string) => {
    const asg = assignments.find((a) => a.id === assignmentId);
    if (!asg) return;
    const updated = { ...asg, status: 'cancelled' as const };

    setAssignments((prev) =>
      prev.map((a) => (a.id === assignmentId ? updated : a))
    );

    if (isFirebaseConfigured) {
      try {
        await saveAssignmentToFirestore(DEFAULT_COMPANY_ID, updated);
      } catch (err: any) {
        setGlobalFeedback(`[Firestore Error] Could not cancel assignment: ${err?.message}`);
      }
    }
  };

  // 4. CHECKLIST MANAGEMENT HANDLER
  const handleSaveMasterChecklists = (updatedChecklists: ChecklistItem[]) => {
    setMasterChecklists(updatedChecklists);
  };

  // 5. INCIDENT STATUS HANDLER
  const handleUpdateIncidentStatus = async (incidentId: string, newStatus: IncidentStatus) => {
    const inc = incidents.find((i) => i.id === incidentId);
    if (!inc) return;
    const updated = { ...inc, status: newStatus };

    setIncidents((prev) =>
      prev.map((i) => (i.id === incidentId ? updated : i))
    );

    if (isFirebaseConfigured) {
      try {
        await saveIncidentToFirestore(DEFAULT_COMPANY_ID, updated);
      } catch (err: any) {
        setGlobalFeedback(`[Firestore Error] Could not update incident: ${err?.message}`);
      }
    }
  };

  // 6. MODULE 4: SUBMIT PATROL REPORT FROM FIELD OFFICER MODE
  const handleSubmitPatrolReport = async (
    newReport: PatrolReport,
    newIncidents?: IncidentRecord[] | IncidentRecord
  ) => {
    // 1. Add to reports list
    setReports((prev) => [newReport, ...prev]);

    const incidentsList: IncidentRecord[] = Array.isArray(newIncidents)
      ? newIncidents
      : newIncidents
      ? [newIncidents]
      : (newReport.incidents || []);

    const hasIncidents = incidentsList.length > 0;

    // 2. Update site progress & timestamp
    setSites((prev) =>
      prev.map((s) => {
        if (s.id === newReport.siteId) {
          return {
            ...s,
            completedPatrolsToday: s.completedPatrolsToday + 1,
            lastPatrolTime: newReport.completedAt || newReport.actualCheckInTime || 'Completed',
            incidentCount: s.incidentCount + incidentsList.length,
            securityStatus: hasIncidents ? 'incident_reported' : s.securityStatus
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

    // 5. If incident was reported during patrol, add all to incidents list
    if (incidentsList.length > 0) {
      setIncidents((prev) => [...incidentsList, ...prev]);
    }

    // 6. Cloud Firestore persistent submission
    if (isFirebaseConfigured) {
      try {
        await submitPatrolReportToFirestore(DEFAULT_COMPANY_ID, newReport, incidentsList);
        setGlobalFeedback(`Patrol report ${newReport.reportCode} saved to Cloud Firestore (${incidentsList.length > 0 ? `${incidentsList.length} incident(s) registered` : 'All clear'}).`);
        setTimeout(() => setGlobalFeedback(null), 3500);
      } catch (err: any) {
        console.error('Firestore submission error:', err);
        setGlobalFeedback(`[Firestore Error] Could not save patrol report: ${err?.message || 'Permission denied'}`);
      }
    } else {
      setGlobalFeedback(
        `Patrol report ${newReport.reportCode} (${newReport.siteName}) successfully received from Officer ${newReport.officerName} and recorded in live operations log.`
      );
      setTimeout(() => setGlobalFeedback(null), 4000);
    }
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
    setCompanyConfig(DEMO_COMPANY_CONFIG);
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
    downloadPatrolReportsCSV(filteredReports);
    setGlobalFeedback(`Exported ${filteredReports.length} patrol report log(s) to CSV file.`);
    setTimeout(() => {
      setGlobalFeedback(null);
    }, 3500);
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
        companyName={companyConfig.companyName}
        ownerName={companyConfig.ownerName}
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
              onDeleteSite={handleDeleteSite}
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
              zones={zones}
              areas={zones.map((z) => z.name)}
              onSaveOfficer={handleSaveOfficer}
              onToggleOfficerStatus={handleToggleOfficerStatus}
              onDeleteOfficer={handleDeleteOfficer}

              onFilterByOfficer={(offId) => {
                handleFilterChange('officerId', offId);
                setCurrentTab('dashboard');
              }}
              onSelectReport={(rep) => setSelectedReport(rep)}
              onLaunchOfficerApp={(officer) => {
                setSelectedOfficerPersonaId(officer.id);
                saveToStorage(STORAGE_KEYS.OFFICER_AUTH, officer.id);
                setAppMode('field_officer');
              }}
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
              sites={sites}
              officers={officers}
              assignments={assignments}
              reports={reports}
              incidents={incidents}
              zones={zones}
              masterChecklists={masterChecklists}
              companyConfig={companyConfig}
              onSaveCompanyConfig={handleSaveCompanyConfig}
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
