import React, { useState, useMemo } from 'react';
import {
  CalendarCheck,
  Clock,
  Building2,
  User,
  Plus,
  CheckCircle2,
  X,
  AlertTriangle,
  Search,
  Filter,
  Edit,
  Trash2,
  Calendar,
  Layers,
  ChevronRight,
  Info,
  CalendarDays,
  Sparkles,
  ArrowRight,
  FileSpreadsheet
} from 'lucide-react';
import { Assignment, AssignmentStatus, Site, FieldOfficer, OfficerShift } from '../types';
import { DEMO_AREAS } from '../data/demoData';
import { downloadAssignmentsCSV } from '../utils/csvExport';


interface AssignmentsViewProps {
  assignments: Assignment[];
  sites: Site[];
  officers: FieldOfficer[];
  areas?: string[];
  onAddAssignments: (newAssignments: Assignment[]) => void;
  onUpdateAssignment: (assignment: Assignment) => void;
  onCancelAssignment: (assignmentId: string) => void;
}

// Calculate days duration inclusive of start & end
const calculateDurationInDays = (startDate: string, endDate: string): number => {
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 1;
};

// Add days to a YYYY-MM-DD date string
const addDaysToDate = (startDateStr: string, daysToAdd: number): string => {
  try {
    const d = new Date(startDateStr);
    d.setDate(d.getDate() + daysToAdd);
    return d.toISOString().split('T')[0];
  } catch {
    return startDateStr;
  }
};

// Add months to a YYYY-MM-DD date string
const addMonthsToDate = (startDateStr: string, monthsToAdd: number): string => {
  try {
    const d = new Date(startDateStr);
    d.setMonth(d.getMonth() + monthsToAdd);
    return d.toISOString().split('T')[0];
  } catch {
    return startDateStr;
  }
};

export const AssignmentsView: React.FC<AssignmentsViewProps> = ({
  assignments,
  sites,
  officers,
  areas = [...DEMO_AREAS],
  onAddAssignments,
  onUpdateAssignment,
  onCancelAssignment
}) => {
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOfficerFilter, setSelectedOfficerFilter] = useState('all');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('all');
  const [selectedSiteFilter, setSelectedSiteFilter] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | AssignmentStatus>('all');

  // Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Form State for Date-Wise Allocation
  const [formOfficerId, setFormOfficerId] = useState(officers[0]?.id || '');
  const [formSelectedCompany, setFormSelectedCompany] = useState<string>('all');
  const [formSelectedSiteIds, setFormSelectedSiteIds] = useState<string[]>([]);
  const [formStartDate, setFormStartDate] = useState('2026-10-20');
  const [formEndDate, setFormEndDate] = useState('2026-10-26'); // default 7 days
  const [formScheduledTime, setFormScheduledTime] = useState('08:00 AM');
  const [formPatrolFrequency, setFormPatrolFrequency] = useState('2x per shift');
  const [formWorkingDays, setFormWorkingDays] = useState('All Days (Mon - Sun)');
  const [formShift, setFormShift] = useState<OfficerShift>('Day');
  const [formStatus, setFormStatus] = useState<AssignmentStatus>('active');
  const [formNotes, setFormNotes] = useState('Standard perimeter check & facility locks audit.');

  // Extract unique companies/clients from sites
  const uniqueCompanies = useMemo(() => {
    const set = new Set<string>();
    sites.forEach((s) => {
      if (s.clientName && s.clientName.trim()) set.add(s.clientName.trim());
    });
    return Array.from(set).sort();
  }, [sites]);

  // Sites available in form based on selected company
  const availableSitesInForm = useMemo(() => {
    if (formSelectedCompany === 'all') return sites;
    return sites.filter((s) => s.clientName === formSelectedCompany);
  }, [sites, formSelectedCompany]);

  // Duration in days calculated dynamically
  const formDurationDays = useMemo(() => {
    return calculateDurationInDays(formStartDate, formEndDate);
  }, [formStartDate, formEndDate]);

  // Determine dynamic status based on dates (Upcoming, Active, Completed)
  const getDynamicDateStatus = (startDate?: string, endDate?: string, rawStatus?: AssignmentStatus): {
    label: string;
    colorClass: string;
    isUpcoming: boolean;
    isActive: boolean;
    isCompleted: boolean;
    isCancelled: boolean;
  } => {
    if (rawStatus === 'cancelled') {
      return {
        label: 'Cancelled',
        colorClass: 'bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]',
        isUpcoming: false,
        isActive: false,
        isCompleted: false,
        isCancelled: true
      };
    }

    const todayStr = '2026-10-20'; // Current demo anchor date
    const start = startDate || todayStr;
    const end = endDate || start;

    if (rawStatus === 'completed') {
      return {
        label: 'Completed',
        colorClass: 'bg-[#EDE7F6] text-[#4A148C] border-[#D1C4E9]',
        isUpcoming: false,
        isActive: false,
        isCompleted: true,
        isCancelled: false
      };
    }

    if (rawStatus === 'scheduled' || todayStr < start) {
      return {
        label: 'Scheduled / Upcoming',
        colorClass: 'bg-[#E3F2FD] text-[#0D47A1] border-[#BBDEFB]',
        isUpcoming: true,
        isActive: false,
        isCompleted: false,
        isCancelled: false
      };
    }

    if (todayStr > end) {
      return {
        label: 'Period Ended',
        colorClass: 'bg-[#F5F5F5] text-[#616161] border-[#E0E0E0]',
        isUpcoming: false,
        isActive: false,
        isCompleted: true,
        isCancelled: false
      };
    }

    return {
      label: 'Active Allocation',
      colorClass: 'bg-[#E8F5E9] text-[#1B5E20] border-[#C8E6C9]',
      isUpcoming: false,
      isActive: true,
      isCompleted: false,
      isCancelled: false
    };
  };

  // Filtered assignments list with rich criteria
  const filteredAssignments = useMemo(() => {
    return assignments.filter((asg) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesOfficer = asg.officerName.toLowerCase().includes(q);
        const matchesSite = asg.siteName.toLowerCase().includes(q);
        const matchesBadge = asg.officerBadge.toLowerCase().includes(q);
        const matchesArea = asg.area?.toLowerCase().includes(q);
        const matchesCompany = (asg.clientName || asg.companyName || '').toLowerCase().includes(q);
        if (!matchesOfficer && !matchesSite && !matchesBadge && !matchesArea && !matchesCompany) {
          return false;
        }
      }

      // 2. Officer Filter
      if (selectedOfficerFilter !== 'all' && asg.officerId !== selectedOfficerFilter) {
        return false;
      }

      // 3. Company Filter
      if (selectedCompanyFilter !== 'all') {
        const asgClient = asg.clientName || sites.find((s) => s.id === asg.siteId)?.clientName;
        if (asgClient !== selectedCompanyFilter) return false;
      }

      // 4. Site Filter
      if (selectedSiteFilter !== 'all' && asg.siteId !== selectedSiteFilter) {
        return false;
      }

      // 5. Date Range Filter
      const asgStart = asg.startDate || asg.date;
      const asgEnd = asg.endDate || asgStart;
      if (filterStartDate && asgEnd < filterStartDate) return false;
      if (filterEndDate && asgStart > filterEndDate) return false;

      // 6. Status Filter
      if (selectedStatusFilter !== 'all') {
        if (asg.status !== selectedStatusFilter) return false;
      }

      return true;
    });
  }, [
    assignments,
    searchQuery,
    selectedOfficerFilter,
    selectedCompanyFilter,
    selectedSiteFilter,
    filterStartDate,
    filterEndDate,
    selectedStatusFilter,
    sites
  ]);

  // Open Assign Modal (New Allocation)
  const openAssignModal = () => {
    setEditingAssignment(null);
    setDuplicateError(null);
    const initialOfficer = officers[0] || null;
    setFormOfficerId(initialOfficer ? initialOfficer.id : '');
    setFormSelectedCompany('all');

    // Pre-select sites matching the officer's area for convenience
    const matchingSites = sites.filter((s) => s.area === initialOfficer?.area && s.isActive);
    setFormSelectedSiteIds(matchingSites.slice(0, 2).map((s) => s.id));
    setFormStartDate('2026-10-20');
    setFormEndDate('2026-10-26'); // 7 days default
    setFormScheduledTime('08:00 AM');
    setFormPatrolFrequency('2x per shift');
    setFormWorkingDays('All Days (Mon - Sun)');
    setFormShift(initialOfficer?.shift || 'Day');
    setFormStatus('active');
    setFormNotes('Standard perimeter check & facility locks audit.');
    setIsAssignModalOpen(true);
  };

  // Open Edit Single Assignment Modal (Edit / Extend / Shorten)
  const openEditModal = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setDuplicateError(null);
    setFormOfficerId(assignment.officerId);

    // Identify company of the site
    const siteObj = sites.find((s) => s.id === assignment.siteId);
    setFormSelectedCompany(siteObj?.clientName || assignment.clientName || 'all');
    setFormSelectedSiteIds([assignment.siteId]);

    const start = assignment.startDate || assignment.date;
    const end = assignment.endDate || start;
    setFormStartDate(start);
    setFormEndDate(end);

    setFormScheduledTime(assignment.scheduledTime || '08:00 AM');
    setFormPatrolFrequency(assignment.patrolFrequency || '2x per shift');
    setFormWorkingDays(assignment.workingDays || 'All Days (Mon - Sun)');
    setFormShift(assignment.shift);
    setFormStatus(assignment.status || 'active');
    setFormNotes(assignment.notes || '');
    setIsAssignModalOpen(true);
  };

  // Quick preset duration handlers
  const handleApplyPresetDuration = (days: number) => {
    if (!formStartDate) return;
    const newEnd = addDaysToDate(formStartDate, days - 1);
    setFormEndDate(newEnd);
  };

  const handleApplyOneMonth = () => {
    if (!formStartDate) return;
    const newEnd = addMonthsToDate(formStartDate, 1);
    setFormEndDate(newEnd);
  };

  // When officer changes in the assignment form
  const handleOfficerChange = (offId: string) => {
    setFormOfficerId(offId);
    setDuplicateError(null);
    const off = officers.find((o) => o.id === offId);
    if (off) {
      setFormShift(off.shift);
      const areaSites = sites.filter((s) => s.area === off.area && s.isActive);
      if (areaSites.length > 0 && formSelectedSiteIds.length === 0) {
        setFormSelectedSiteIds([areaSites[0].id]);
      }
    }
  };

  // Toggle single site selection
  const toggleSiteSelection = (siteId: string) => {
    setDuplicateError(null);
    setFormSelectedSiteIds((prev) =>
      prev.includes(siteId) ? prev.filter((id) => id !== siteId) : [...prev, siteId]
    );
  };

  // Select all sites belonging to selected company or area
  const handleSelectAllSitesInCompany = () => {
    const targetSiteIds = availableSitesInForm.map((s) => s.id);
    setFormSelectedSiteIds(targetSiteIds);
    setDuplicateError(null);
  };

  const handleClearSiteSelection = () => {
    setFormSelectedSiteIds([]);
    setDuplicateError(null);
  };

  // Quick Extend (+7 Days) for an assignment in the table
  const handleQuickExtend = (assignment: Assignment, daysToAdd: number = 7) => {
    const currentEnd = assignment.endDate || assignment.date;
    const extendedEnd = addDaysToDate(currentEnd, daysToAdd);
    const updated: Assignment = {
      ...assignment,
      endDate: extendedEnd,
      durationDays: calculateDurationInDays(assignment.startDate || assignment.date, extendedEnd),
      status: 'active'
    };
    onUpdateAssignment(updated);
    setActionFeedback(
      `Extended allocation for "${assignment.siteName}" by ${daysToAdd} days (Until ${extendedEnd}).`
    );
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // Handle Form Submit with Strict Duplicate Prevention
  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDuplicateError(null);

    const officer = officers.find((o) => o.id === formOfficerId);
    if (!officer) {
      setDuplicateError('Please select a valid field officer.');
      return;
    }

    if (formSelectedSiteIds.length === 0) {
      setDuplicateError('Please select at least one site to allocate.');
      return;
    }

    if (formEndDate < formStartDate) {
      setDuplicateError('Allocation End Date cannot be earlier than Allocation Start Date.');
      return;
    }

    const calculatedDuration = calculateDurationInDays(formStartDate, formEndDate);

    // CHECK FOR DUPLICATES:
    // Prevent accidental duplicate assignments for the same officer, site, overlapping dates, and scheduled time
    for (const siteId of formSelectedSiteIds) {
      const duplicateFound = assignments.find((asg) => {
        if (editingAssignment && asg.id === editingAssignment.id) return false;
        if (asg.status === 'cancelled') return false;
        if (asg.officerId !== officer.id) return false;
        if (asg.siteId !== siteId) return false;
        if (asg.scheduledTime !== formScheduledTime) return false;

        const asgStart = asg.startDate || asg.date;
        const asgEnd = asg.endDate || asgStart;

        // Check if date ranges overlap: (StartA <= EndB) and (EndA >= StartB)
        const hasDateOverlap = formStartDate <= asgEnd && formEndDate >= asgStart;
        return hasDateOverlap;
      });

      if (duplicateFound) {
        const siteObj = sites.find((s) => s.id === siteId);
        setDuplicateError(
          `Conflict detected! Officer ${officer.name} is already assigned to "${siteObj?.name || 'this site'}" during ${duplicateFound.startDate || duplicateFound.date} to ${duplicateFound.endDate || duplicateFound.date} at ${formScheduledTime}. Please choose a different scheduled time, date range, or officer.`
        );
        return;
      }
    }

    // If Editing an existing assignment
    if (editingAssignment) {
      const targetSite = sites.find((s) => s.id === formSelectedSiteIds[0]) || {
        id: editingAssignment.siteId,
        name: editingAssignment.siteName,
        clientName: editingAssignment.clientName || 'Client',
        area: editingAssignment.area
      };

      const updated: Assignment = {
        ...editingAssignment,
        officerId: officer.id,
        officerName: officer.name,
        officerBadge: officer.badgeNumber,
        siteId: targetSite.id,
        siteName: targetSite.name,
        clientName: targetSite.clientName || editingAssignment.clientName,
        area: targetSite.area,
        date: formStartDate, // keep anchor date synced
        startDate: formStartDate,
        endDate: formEndDate,
        durationDays: calculatedDuration,
        scheduledTime: formScheduledTime,
        patrolFrequency: formPatrolFrequency,
        workingDays: formWorkingDays,
        shift: formShift,
        status: formStatus,
        notes: formNotes
      };

      onUpdateAssignment(updated);
      setIsAssignModalOpen(false);
      setActionFeedback(
        `Allocation for "${targetSite.name}" updated successfully: ${formStartDate} to ${formEndDate} (${calculatedDuration} days).`
      );
      setTimeout(() => setActionFeedback(null), 3500);
      return;
    }

    // If Creating New Assignment(s)
    const createdList: Assignment[] = formSelectedSiteIds.map((sId, idx) => {
      const targetSite = sites.find((s) => s.id === sId)!;
      return {
        id: `asg-${Date.now()}-${idx}`,
        siteId: targetSite.id,
        siteName: targetSite.name,
        clientName: targetSite.clientName,
        companyName: targetSite.clientName,
        area: targetSite.area,
        officerId: officer.id,
        officerName: officer.name,
        officerBadge: officer.badgeNumber,
        shift: formShift,
        date: formStartDate,
        startDate: formStartDate,
        endDate: formEndDate,
        durationDays: calculatedDuration,
        scheduledTime: formScheduledTime,
        patrolFrequency: formPatrolFrequency,
        workingDays: formWorkingDays,
        startTime: formShift === 'Day' ? '07:00 AM' : formShift === 'Swing' ? '03:00 PM' : '11:00 PM',
        endTime: formShift === 'Day' ? '03:00 PM' : formShift === 'Swing' ? '11:00 PM' : '07:00 AM',
        status: formStatus,
        patrolQuota: formPatrolFrequency === 'Hourly' ? 8 : formPatrolFrequency === '3x per shift' ? 6 : 4,
        patrolsCompleted: 0,
        notes: formNotes
      };
    });

    onAddAssignments(createdList);
    setIsAssignModalOpen(false);
    setActionFeedback(
      `Successfully allocated ${createdList.length} site(s) to Officer ${officer.name} for ${calculatedDuration} day(s) (${formStartDate} to ${formEndDate}).`
    );
    setTimeout(() => setActionFeedback(null), 4000);
  };

  // Cancel an allocation
  const handleCancel = (assignmentId: string, siteName: string, officerName: string) => {
    if (confirm(`Cancel scheduled patrol allocation for ${officerName} at ${siteName}?`)) {
      onCancelAssignment(assignmentId);
      setActionFeedback(`Allocation at "${siteName}" marked as Cancelled.`);
      setTimeout(() => setActionFeedback(null), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-[#FFFFFF] border border-[#E7DED2] p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-[#6F4E37]" />
            <h2 className="text-base font-bold text-[#4B3621]">
              Date-Wise Site & Company Allocation (साइट एवं कंपनी आवंटन)
            </h2>
            <span className="text-xs font-mono text-[#4B3621] bg-[#F0E8DD] px-2.5 py-0.5 rounded-full border border-[#E7DED2] font-semibold">
              {assignments.length} Total Allocations
            </span>
          </div>
          <p className="text-xs text-[#8B735B] mt-1">
            Allocate single or multiple client sites to field officers for 1 day, 5 days, 7 days, 15 days, 1 month, or custom periods with conflict prevention.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              downloadAssignmentsCSV(filteredAssignments);
              setActionFeedback(`Exported ${filteredAssignments.length} site allocations to CSV file.`);
              setTimeout(() => setActionFeedback(null), 3000);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#4B3621] bg-[#FFFFFF] hover:bg-[#F0E8DD] border border-[#E7DED2] rounded-xl transition-colors cursor-pointer shadow-2xs"
            title="Download assignments roster as CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#6F4E37]" />
            <span>Export Allocations CSV</span>
          </button>

          <button
            onClick={openAssignModal}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#6F4E37] hover:bg-[#5A3E2B] rounded-xl transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Date-Wise Allocation</span>
          </button>
        </div>
      </div>


      {actionFeedback && (
        <div className="p-3.5 bg-[#E8F5E9] border border-[#C8E6C9] rounded-xl text-xs text-[#1B5E20] flex items-center gap-2.5 animate-in fade-in shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0" />
          <span className="font-semibold">{actionFeedback}</span>
        </div>
      )}

      {/* Allocation Summary & Overview Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E7DED2] shadow-2xs">
          <div className="text-[11px] text-[#8B735B] font-medium flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#6F4E37]" />
            <span>Active Deployments</span>
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-[#4B3621]">
            {assignments.filter((a) => a.status === 'active').length}
          </div>
          <div className="text-[10px] text-[#8B735B] mt-0.5">Currently on-going site patrols</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E7DED2] shadow-2xs">
          <div className="text-[11px] text-[#8B735B] font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#0D47A1]" />
            <span>Scheduled / Upcoming</span>
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-[#0D47A1]">
            {assignments.filter((a) => a.status === 'scheduled').length}
          </div>
          <div className="text-[10px] text-[#8B735B] mt-0.5">Future date-wise rosters</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E7DED2] shadow-2xs">
          <div className="text-[11px] text-[#8B735B] font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1B5E20]" />
            <span>Completed Periods</span>
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-[#1B5E20]">
            {assignments.filter((a) => a.status === 'completed').length}
          </div>
          <div className="text-[10px] text-[#8B735B] mt-0.5">Finished allocation dates</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E7DED2] shadow-2xs">
          <div className="text-[11px] text-[#8B735B] font-medium flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#6F4E37]" />
            <span>Client Companies</span>
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-[#4B3621]">
            {uniqueCompanies.length}
          </div>
          <div className="text-[10px] text-[#8B735B] mt-0.5">Contract clients covered</div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-xl p-3.5 sm:p-4 space-y-3.5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E7DED2] pb-2.5">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#6F4E37]" />
            <span className="text-xs font-bold text-[#4B3621] uppercase tracking-wide">
              Filter Allocations
            </span>
            <span className="text-xs text-[#8B735B] font-mono tabular-nums">
              (Showing {filteredAssignments.length} of {assignments.length})
            </span>
          </div>

          {(searchQuery ||
            selectedOfficerFilter !== 'all' ||
            selectedCompanyFilter !== 'all' ||
            selectedSiteFilter !== 'all' ||
            filterStartDate ||
            filterEndDate ||
            selectedStatusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedOfficerFilter('all');
                setSelectedCompanyFilter('all');
                setSelectedSiteFilter('all');
                setFilterStartDate('');
                setFilterEndDate('');
                setSelectedStatusFilter('all');
              }}
              className="text-xs text-[#C62828] hover:text-[#B71C1C] font-semibold underline cursor-pointer"
            >
              Reset All Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          {/* 1. Keyword search */}
          <div className="lg:col-span-1">
            <label className="block text-[#4B3621] font-semibold text-[11px] mb-1">Search</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#8B735B] absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Officer, site, company..."
                className="w-full pl-8 pr-2.5 py-1.5 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-[#4B3621] placeholder-[#8B735B]/70 focus:outline-none focus:border-[#6F4E37] focus:bg-[#FFFFFF]"
              />
            </div>
          </div>

          {/* 2. Field Officer Filter */}
          <div>
            <label className="block text-[#4B3621] font-semibold text-[11px] mb-1">Field Officer</label>
            <select
              value={selectedOfficerFilter}
              onChange={(e) => setSelectedOfficerFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-none focus:border-[#6F4E37] cursor-pointer"
            >
              <option value="all">All Officers ({officers.length})</option>
              {officers.map((off) => (
                <option key={off.id} value={off.id}>
                  {off.name} ({off.badgeNumber})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Company / Client Filter */}
          <div>
            <label className="block text-[#4B3621] font-semibold text-[11px] mb-1">Company / Client</label>
            <select
              value={selectedCompanyFilter}
              onChange={(e) => setSelectedCompanyFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-none focus:border-[#6F4E37] cursor-pointer"
            >
              <option value="all">All Companies ({uniqueCompanies.length})</option>
              {uniqueCompanies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Site Filter */}
          <div>
            <label className="block text-[#4B3621] font-semibold text-[11px] mb-1">Specific Site</label>
            <select
              value={selectedSiteFilter}
              onChange={(e) => setSelectedSiteFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-none focus:border-[#6F4E37] cursor-pointer"
            >
              <option value="all">All Sites ({sites.length})</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Date Range Filter */}
          <div>
            <label className="block text-[#4B3621] font-semibold text-[11px] mb-1">Active Between</label>
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-1/2 px-1.5 py-1 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] text-[11px] focus:outline-none focus:border-[#6F4E37]"
                title="Filter Start Date"
              />
              <span className="text-[#8B735B] text-[10px]">to</span>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-1/2 px-1.5 py-1 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] text-[11px] focus:outline-none focus:border-[#6F4E37]"
                title="Filter End Date"
              />
            </div>
          </div>

          {/* 6. Status Filter */}
          <div>
            <label className="block text-[#4B3621] font-semibold text-[11px] mb-1">Allocation Status</label>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-none focus:border-[#6F4E37] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="scheduled">Scheduled / Upcoming</option>
              <option value="completed">Completed Only</option>
              <option value="cancelled">Cancelled Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Allocation Table */}
      <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E7DED2] bg-[#FAF7F2] text-[#8B735B] font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Field Officer</th>
                <th className="py-3 px-4">Company & Site</th>
                <th className="py-3 px-4">Allocation Period & Duration</th>
                <th className="py-3 px-4">Daily Schedule & Working Days</th>
                <th className="py-3 px-4">Frequency</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7DED2]">
              {filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8B735B]">
                    <Building2 className="w-8 h-8 mx-auto mb-2 text-[#8B735B]/60" />
                    <div className="font-semibold text-[#4B3621]">No allocations found matching the filter criteria.</div>
                    <div className="text-[11px] text-[#8B735B] mt-1">Try resetting filters or creating a new date-wise allocation.</div>
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((asg) => {
                  const siteObj = sites.find((s) => s.id === asg.siteId);
                  const client = asg.clientName || siteObj?.clientName || 'Contract Client';
                  const startDate = asg.startDate || asg.date;
                  const endDate = asg.endDate || startDate;
                  const duration = asg.durationDays || calculateDurationInDays(startDate, endDate);
                  const dynamicStatus = getDynamicDateStatus(startDate, endDate, asg.status);

                  return (
                    <tr
                      key={asg.id}
                      className={`hover:bg-[#F0E8DD]/40 transition-colors ${
                        asg.status === 'cancelled' ? 'opacity-60 bg-[#FAF7F2]' : ''
                      }`}
                    >
                      {/* 1. Field Officer */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#4B3621] flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#6F4E37] shrink-0" />
                          <span>{asg.officerName}</span>
                        </div>
                        <div className="text-[11px] font-mono text-[#8B735B] pl-5 flex items-center gap-1 mt-0.5">
                          <span className="text-[#6F4E37] font-semibold">{asg.officerBadge}</span>
                          <span>·</span>
                          <span>{asg.shift} Shift</span>
                        </div>
                      </td>

                      {/* 2. Company & Site */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#4B3621] flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#8B735B] shrink-0" />
                          <span>{asg.siteName}</span>
                        </div>
                        <div className="text-[11px] text-[#6F4E37] font-semibold pl-5 mt-0.5 flex items-center gap-1">
                          <span>{client}</span>
                          <span className="text-[#8B735B]">({asg.area})</span>
                        </div>
                        {asg.notes && (
                          <div className="text-[10px] text-[#8B735B] italic pl-5 truncate max-w-xs mt-0.5" title={asg.notes}>
                            "{asg.notes}"
                          </div>
                        )}
                      </td>

                      {/* 3. Allocation Period & Duration */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-[#4B3621] font-bold">
                          <Calendar className="w-3.5 h-3.5 text-[#6F4E37] shrink-0" />
                          <span>{startDate}</span>
                          <ArrowRight className="w-3 h-3 text-[#8B735B]" />
                          <span>{endDate}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FAF7F2] text-[#6F4E37] border border-[#E7DED2]">
                            {duration} Day{duration > 1 ? 's' : ''} Duration
                          </span>
                        </div>
                      </td>

                      {/* 4. Daily Schedule & Working Days */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-xs text-[#4B3621] font-semibold">
                          <Clock className="w-3.5 h-3.5 text-[#6F4E37] shrink-0" />
                          <span className="font-mono">{asg.scheduledTime}</span>
                        </div>
                        <div className="text-[11px] text-[#8B735B] mt-0.5">
                          {asg.workingDays || 'All Days (Mon - Sun)'}
                        </div>
                      </td>

                      {/* 5. Frequency */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FAF7F2] text-[#4B3621] border border-[#E7DED2]">
                          {asg.patrolFrequency || '2x per shift'}
                        </span>
                      </td>

                      {/* 6. Status Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${dynamicStatus.colorClass}`}
                        >
                          {dynamicStatus.label}
                        </span>
                      </td>

                      {/* 7. Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Quick Extend button if active */}
                          {asg.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => handleQuickExtend(asg, 7)}
                              className="px-2 py-1 text-[11px] font-semibold rounded bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#6F4E37] border border-[#E7DED2] transition-colors cursor-pointer"
                              title="Extend allocation by +7 days"
                            >
                              +7d
                            </button>
                          )}

                          {/* Edit / Extend / Shorten Modal trigger */}
                          <button
                            type="button"
                            onClick={() => openEditModal(asg)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-[#F0E8DD] hover:bg-[#E8D8C5] text-[#4B3621] border border-[#E7DED2] transition-colors cursor-pointer shadow-2xs"
                            title="Edit dates, extend, shorten, or change orders"
                          >
                            <Edit className="w-3 h-3 text-[#6F4E37]" />
                            <span>Edit</span>
                          </button>

                          {/* Cancel allocation */}
                          {asg.status !== 'cancelled' ? (
                            <button
                              type="button"
                              onClick={() => handleCancel(asg.id, asg.siteName, asg.officerName)}
                              className="p-1 rounded bg-[#FFFFFF] hover:bg-[#FFEBEE] text-[#C62828] border border-[#E7DED2] hover:border-[#FFCDD2] transition-colors cursor-pointer"
                              title="Cancel allocation"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-[#8B735B] italic">Cancelled</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ALLOCATION MODAL (Add New or Edit / Extend / Shorten) */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
          <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-[#4B3621]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#E7DED2] bg-[#FAF7F2] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-[#6F4E37]" />
                <div>
                  <h3 className="text-sm font-bold text-[#4B3621]">
                    {editingAssignment
                      ? `Edit / Extend Allocation: ${editingAssignment.siteName}`
                      : 'Date-Wise Site & Company Allocation'}
                  </h3>
                  <p className="text-[11px] text-[#8B735B]">
                    Configure officer assignment period, client company, working days, and schedule
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="text-[#8B735B] hover:text-[#4B3621] p-1.5 rounded-lg hover:bg-[#F0E8DD]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAssignSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
              {duplicateError && (
                <div className="p-3 bg-[#FFEBEE] border border-[#FFCDD2] rounded-xl text-xs text-[#C62828] flex items-start gap-2 shadow-2xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#C62828]" />
                  <div className="font-semibold">{duplicateError}</div>
                </div>
              )}

              {/* 1. Field Officer Selection */}
              <div>
                <label className="block text-[#4B3621] mb-1 font-bold">1. Select Field Officer *</label>
                <select
                  value={formOfficerId}
                  onChange={(e) => handleOfficerChange(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E7DED2] rounded-xl text-[#4B3621] focus:outline-none focus:border-[#6F4E37] cursor-pointer font-medium"
                >
                  {officers.map((off) => (
                    <option key={off.id} value={off.id}>
                      {off.name} (Badge: {off.badgeNumber} · ID: {off.employeeId} · Zone: {off.area} · {off.shift} Shift)
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Company / Client Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[#4B3621] font-bold">2. Select Company / Client</label>
                  <span className="text-[10px] text-[#8B735B]">Filters available sites below</span>
                </div>
                <select
                  value={formSelectedCompany}
                  onChange={(e) => {
                    const comp = e.target.value;
                    setFormSelectedCompany(comp);
                    if (comp !== 'all') {
                      // Automatically select sites belonging to this company
                      const matching = sites.filter((s) => s.clientName === comp && s.isActive);
                      setFormSelectedSiteIds(matching.map((s) => s.id));
                    }
                  }}
                  className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E7DED2] rounded-xl text-[#4B3621] focus:outline-none focus:border-[#6F4E37] cursor-pointer font-medium"
                >
                  <option value="all">All Companies / Independent Sites</option>
                  {uniqueCompanies.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Site Selection (Multi-select enabled) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[#4B3621] font-bold">
                    3. Select Site(s) belonging to company * ({formSelectedSiteIds.length} selected)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllSitesInCompany}
                      className="text-[11px] text-[#6F4E37] hover:underline font-bold cursor-pointer"
                    >
                      Select All ({availableSitesInForm.length})
                    </button>
                    <span className="text-[#8B735B]">·</span>
                    <button
                      type="button"
                      onClick={handleClearSiteSelection}
                      className="text-[11px] text-[#8B735B] hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="max-h-44 overflow-y-auto p-2 rounded-xl bg-[#FAF7F2] border border-[#E7DED2] grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availableSitesInForm.map((s) => {
                    const isSelected = formSelectedSiteIds.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        onClick={() => toggleSiteSelection(s.id)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-2 ${
                          isSelected
                            ? 'bg-[#FFFFFF] border-[#6F4E37] shadow-xs text-[#4B3621]'
                            : 'bg-[#FAF7F2] border-[#E7DED2] text-[#8B735B] hover:border-[#8B735B]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // handled by parent onClick
                          className="mt-0.5 rounded border-[#E7DED2] text-[#6F4E37] focus:ring-[#6F4E37] cursor-pointer"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-[#4B3621] truncate">{s.name}</div>
                          <div className="text-[10px] text-[#8B735B] truncate">
                            {s.clientName} · {s.area}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. Allocation Date Range & Quick Preset Durations */}
              <div className="p-3.5 bg-[#FAF7F2] border border-[#E7DED2] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-[#4B3621] font-bold flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 text-[#6F4E37]" />
                    <span>4. Allocation Period & Duration *</span>
                  </label>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#E8D8C5] text-[#4B3621] border border-[#E7DED2]">
                    Total: {formDurationDays} Day{formDurationDays > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Date Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#8B735B] text-[11px] mb-1 font-semibold">Start Date *</label>
                    <input
                      type="date"
                      required
                      value={formStartDate}
                      onChange={(e) => {
                        setFormStartDate(e.target.value);
                        setDuplicateError(null);
                      }}
                      className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] font-mono focus:outline-none focus:border-[#6F4E37]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#8B735B] text-[11px] mb-1 font-semibold">End Date *</label>
                    <input
                      type="date"
                      required
                      value={formEndDate}
                      onChange={(e) => {
                        setFormEndDate(e.target.value);
                        setDuplicateError(null);
                      }}
                      className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] font-mono focus:outline-none focus:border-[#6F4E37]"
                    />
                  </div>
                </div>

                {/* Quick Duration Helper Buttons */}
                <div>
                  <div className="text-[11px] text-[#8B735B] mb-1.5 font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#6F4E37]" />
                    <span>Quick Duration Presets (Set End Date automatically):</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleApplyPresetDuration(1)}
                      className={`px-2.5 py-1 text-xs rounded-lg border font-semibold transition-colors cursor-pointer ${
                        formDurationDays === 1
                          ? 'bg-[#6F4E37] text-white border-[#6F4E37]'
                          : 'bg-[#FFFFFF] text-[#4B3621] border-[#E7DED2] hover:bg-[#F0E8DD]'
                      }`}
                    >
                      1 Day
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPresetDuration(5)}
                      className={`px-2.5 py-1 text-xs rounded-lg border font-semibold transition-colors cursor-pointer ${
                        formDurationDays === 5
                          ? 'bg-[#6F4E37] text-white border-[#6F4E37]'
                          : 'bg-[#FFFFFF] text-[#4B3621] border-[#E7DED2] hover:bg-[#F0E8DD]'
                      }`}
                    >
                      5 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPresetDuration(7)}
                      className={`px-2.5 py-1 text-xs rounded-lg border font-semibold transition-colors cursor-pointer ${
                        formDurationDays === 7
                          ? 'bg-[#6F4E37] text-white border-[#6F4E37]'
                          : 'bg-[#FFFFFF] text-[#4B3621] border-[#E7DED2] hover:bg-[#F0E8DD]'
                      }`}
                    >
                      7 Days (1 Wk)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPresetDuration(10)}
                      className={`px-2.5 py-1 text-xs rounded-lg border font-semibold transition-colors cursor-pointer ${
                        formDurationDays === 10
                          ? 'bg-[#6F4E37] text-white border-[#6F4E37]'
                          : 'bg-[#FFFFFF] text-[#4B3621] border-[#E7DED2] hover:bg-[#F0E8DD]'
                      }`}
                    >
                      10 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPresetDuration(15)}
                      className={`px-2.5 py-1 text-xs rounded-lg border font-semibold transition-colors cursor-pointer ${
                        formDurationDays === 15
                          ? 'bg-[#6F4E37] text-white border-[#6F4E37]'
                          : 'bg-[#FFFFFF] text-[#4B3621] border-[#E7DED2] hover:bg-[#F0E8DD]'
                      }`}
                    >
                      15 Days
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyOneMonth}
                      className="px-2.5 py-1 text-xs rounded-lg border font-semibold bg-[#FFFFFF] text-[#4B3621] border-[#E7DED2] hover:bg-[#F0E8DD] transition-colors cursor-pointer"
                    >
                      1 Month
                    </button>
                  </div>
                </div>
              </div>

              {/* 5. Daily Schedule & Working Days */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4B3621] mb-1 font-bold">5. Daily Scheduled Patrol Time *</label>
                  <select
                    value={formScheduledTime}
                    onChange={(e) => {
                      setFormScheduledTime(e.target.value);
                      setDuplicateError(null);
                    }}
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E7DED2] rounded-xl text-[#4B3621] focus:outline-none focus:border-[#6F4E37] cursor-pointer font-mono font-semibold"
                  >
                    <option value="06:00 AM">06:00 AM</option>
                    <option value="07:00 AM">07:00 AM</option>
                    <option value="07:30 AM">07:30 AM</option>
                    <option value="08:00 AM">08:00 AM</option>
                    <option value="08:30 AM">08:30 AM</option>
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="09:30 AM">09:30 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="01:00 PM">01:00 PM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                    <option value="06:00 PM">06:00 PM</option>
                    <option value="08:00 PM">08:00 PM</option>
                    <option value="10:00 PM">10:00 PM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#4B3621] mb-1 font-bold">6. Working Days</label>
                  <select
                    value={formWorkingDays}
                    onChange={(e) => setFormWorkingDays(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E7DED2] rounded-xl text-[#4B3621] focus:outline-none focus:border-[#6F4E37] cursor-pointer font-medium"
                  >
                    <option value="All Days (Mon - Sun)">All Days (Monday - Sunday)</option>
                    <option value="Weekdays (Mon - Fri)">Weekdays (Monday - Friday)</option>
                    <option value="Weekends (Sat - Sun)">Weekends (Saturday - Sunday)</option>
                    <option value="Mon, Wed, Fri">Mon, Wed, Fri</option>
                    <option value="Tue, Thu, Sat">Tue, Thu, Sat</option>
                  </select>
                </div>
              </div>

              {/* 6. Frequency, Shift & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#4B3621] mb-1 font-semibold">Patrol Frequency</label>
                  <select
                    value={formPatrolFrequency}
                    onChange={(e) => setFormPatrolFrequency(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-none focus:border-[#6F4E37] cursor-pointer"
                  >
                    <option value="Hourly">Hourly</option>
                    <option value="2x per shift">2x per shift</option>
                    <option value="3x per shift">3x per shift</option>
                    <option value="4x daily">4x daily</option>
                    <option value="Once per shift">Once per shift</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#4B3621] mb-1 font-semibold">Shift</label>
                  <select
                    value={formShift}
                    onChange={(e) => setFormShift(e.target.value as OfficerShift)}
                    className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-none focus:border-[#6F4E37] cursor-pointer"
                  >
                    <option value="Day">Day Shift</option>
                    <option value="Night">Night Shift</option>
                    <option value="Swing">Swing Shift</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#4B3621] mb-1 font-semibold">Allocation Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as AssignmentStatus)}
                    className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-none focus:border-[#6F4E37] cursor-pointer font-bold"
                  >
                    <option value="active">Active</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* 7. Notes */}
              <div>
                <label className="block text-[#4B3621] mb-1 font-semibold">Assignment Notes & Orders</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Special orders, key custody, barrier check instructions..."
                  className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-none focus:border-[#6F4E37]"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-[#E7DED2] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#F0E8DD] text-[#4B3621] hover:bg-[#E8D8C5] transition-colors cursor-pointer font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#6F4E37] hover:bg-[#5A3E2B] text-white font-bold transition-colors cursor-pointer shadow-sm"
                >
                  {editingAssignment ? 'Save & Update Allocation' : `Confirm ${formSelectedSiteIds.length} Allocation(s)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
