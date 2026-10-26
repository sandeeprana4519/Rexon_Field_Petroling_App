import React, { useState, useMemo } from 'react';
import {
  Users,
  Battery,
  BatteryCharging,
  BatteryWarning,
  Clock,
  Phone,
  Radio,
  MapPin,
  CheckCircle2,
  FileCheck2,
  Plus,
  Edit,
  Power,
  Search,
  Filter,
  X,
  Building2,
  Calendar,
  FileSpreadsheet,
  Mail,
  KeyRound,
  Smartphone,
  Eye,
  EyeOff,
  Trash2,
  Compass
} from 'lucide-react';
import { FieldOfficer, Site, OfficerShift, OfficerEmploymentStatus, PatrolReport, Assignment, PatrolZone } from '../types';
import { DEMO_AREAS } from '../data/demoData';
import { OfficerDailyReportModal } from './OfficerDailyReportModal';
import { getCallUrl, getWhatsAppUrl, WhatsAppIcon } from '../utils/contactUtils';

interface FieldOfficersViewProps {
  officers: FieldOfficer[];
  sites: Site[];
  areas?: string[];
  zones?: PatrolZone[];
  reports?: PatrolReport[];
  assignments?: Assignment[];
  onSaveOfficer: (officer: FieldOfficer) => void;
  onToggleOfficerStatus: (officerId: string) => void;
  onDeleteOfficer?: (officerId: string) => void;
  onFilterByOfficer: (officerId: string) => void;
  onSelectReport?: (report: PatrolReport) => void;
  onLaunchOfficerApp?: (officer: FieldOfficer) => void;
}

export const FieldOfficersView: React.FC<FieldOfficersViewProps> = ({
  officers,
  sites,
  areas = [...DEMO_AREAS],
  zones = [],
  reports = [],
  assignments = [],
  onSaveOfficer,
  onToggleOfficerStatus,
  onDeleteOfficer,
  onFilterByOfficer,
  onSelectReport,
  onLaunchOfficerApp
}) => {
  // Available Patrol Zones (prioritizes active configured zones like आदर्श नगर, खंडकाम, etc.)
  const availableZoneList = useMemo(() => {
    if (zones && zones.length > 0) {
      return zones.map((z) => z.name);
    }
    if (areas && areas.length > 0) {
      return areas;
    }
    return [...DEMO_AREAS];
  }, [zones, areas]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | OfficerEmploymentStatus>('all');
  const [selectedShift, setSelectedShift] = useState<'all' | OfficerShift>('all');

  // Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState<FieldOfficer | null>(null);
  const [viewingOfficerSites, setViewingOfficerSites] = useState<FieldOfficer | null>(null);
  const [selectedOfficerForReport, setSelectedOfficerForReport] = useState<FieldOfficer | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [radioDispatchFeedback, setRadioDispatchFeedback] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    email: '',
    password: 'rexon123',
    phone: '',
    area: availableZoneList[0] || (DEMO_AREAS[0] as string),
    shift: 'Day' as OfficerShift,
    employmentStatus: 'active' as OfficerEmploymentStatus
  });


  const filteredOfficers = useMemo(() => {
    return officers.filter((off) => {
      // 1. Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = off.name.toLowerCase().includes(q);
        const matchesEmpId = off.employeeId.toLowerCase().includes(q);
        const matchesBadge = off.badgeNumber.toLowerCase().includes(q);
        const matchesPhone = off.phone.toLowerCase().includes(q);
        const matchesEmail = off.email ? off.email.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesEmpId && !matchesBadge && !matchesPhone && !matchesEmail) return false;
      }

      // 2. Area
      if (selectedArea !== 'all' && off.area !== selectedArea) return false;

      // 3. Employment Status
      if (selectedStatus !== 'all' && off.employmentStatus !== selectedStatus) return false;

      // 4. Shift
      if (selectedShift !== 'all' && off.shift !== selectedShift) return false;

      return true;
    });
  }, [officers, searchQuery, selectedArea, selectedStatus, selectedShift]);

  const openCreateModal = () => {
    setEditingOfficer(null);
    const nextEmpNum = 1000 + officers.length + 1;
    setFormData({
      name: '',
      employeeId: `REX-EMP-${nextEmpNum}`,
      email: `officer${nextEmpNum}@rexon.com`,
      password: 'rexon123',
      phone: '+1 (555) 301-4400',
      area: availableZoneList[0] || 'Area A - North Industrial',
      shift: 'Day',
      employmentStatus: 'active'
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (officer: FieldOfficer) => {
    setEditingOfficer(officer);
    setFormData({
      name: officer.name,
      employeeId: officer.employeeId,
      email: officer.email || '',
      password: officer.password || 'rexon123',
      phone: officer.phone,
      area: officer.area || availableZoneList[0] || 'Area A - North Industrial',
      shift: officer.shift,
      employmentStatus: officer.employmentStatus
    });
    setIsFormModalOpen(true);
  };


  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.employeeId.trim() || !formData.phone.trim()) {
      alert('Officer name, employee ID, and phone number are required.');
      return;
    }

    const officerToSave: FieldOfficer = {
      id: editingOfficer ? editingOfficer.id : `off-${Date.now()}`,
      employeeId: formData.employeeId.trim(),
      badgeNumber: editingOfficer ? editingOfficer.badgeNumber : `RF-${Math.floor(100 + Math.random() * 900)}`,
      name: formData.name.trim(),
      email: formData.email.trim() || `${formData.name.toLowerCase().replace(/\s+/g, '')}@rexon.com`,
      password: formData.password.trim() || 'rexon123',
      phone: formData.phone.trim(),
      area: formData.area,
      shift: formData.shift,
      status: formData.employmentStatus === 'active' ? 'on_duty' : 'off_duty',
      employmentStatus: formData.employmentStatus,
      isActive: formData.employmentStatus === 'active',
      assignedSiteIds: editingOfficer ? editingOfficer.assignedSiteIds : [],
      batteryPercent: editingOfficer ? editingOfficer.batteryPercent : 95,
      lastCheckInTime: editingOfficer ? editingOfficer.lastCheckInTime : 'Just added',
      currentActivity: editingOfficer ? editingOfficer.currentActivity : 'Awaiting dispatch assignment',
      patrolsCompletedToday: editingOfficer ? editingOfficer.patrolsCompletedToday : 0,
      demoGpsVerified: true
    };

    onSaveOfficer(officerToSave);
    setIsFormModalOpen(false);
    setActionFeedback(
      editingOfficer
        ? `Field Officer "${officerToSave.name}" details updated successfully.`
        : `Field Officer "${officerToSave.name}" (ID: ${officerToSave.employeeId}) registered.`
    );
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const triggerRadioCheck = (officerName: string, badgeNumber: string) => {
    setRadioDispatchFeedback(`Simulated dispatch check sent to Officer ${officerName} (${badgeNumber}). Signal strong.`);
    setTimeout(() => {
      setRadioDispatchFeedback(null);
    }, 2800);
  };

  const getBatteryIcon = (percent: number) => {
    if (percent < 20) return <BatteryWarning className="w-4 h-4 text-[#C62828]" />;
    if (percent > 90) return <BatteryCharging className="w-4 h-4 text-[#2E7D32]" />;
    return <Battery className="w-4 h-4 text-[#8B735B]" />;
  };

  const getEmploymentBadge = (status: OfficerEmploymentStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9]">
            Active
          </span>
        );
      case 'on_leave':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
            On Leave
          </span>
        );
      case 'deactivated':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#FFEBEE] text-[#B71C1C] border border-[#FFCDD2]">
            Deactivated
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-[#FFFFFF] border border-[#E7DED2] p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#6F4E37]" />
            <h2 className="text-base font-bold text-[#4B3621]">
              Field Officers Management
            </h2>
            <span className="text-xs font-mono text-[#4B3621] bg-[#F0E8DD] px-2 py-0.5 rounded border border-[#E7DED2]">
              {officers.length} Officers Registered
            </span>
          </div>
          <p className="text-xs text-[#8B735B] mt-0.5">
            Manage guard personnel, track employment status, employee IDs, assigned zones, and allocate site quotas
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#6F4E37] hover:bg-[#5A3E2B] rounded-lg transition-colors cursor-pointer shrink-0 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Field Officer</span>
        </button>
      </div>

      {actionFeedback && (
        <div className="p-3 bg-[#E8F5E9] border border-[#C8E6C9] rounded-xl text-xs text-[#1B5E20] flex items-center gap-2 animate-in fade-in shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {radioDispatchFeedback && (
        <div className="p-3 bg-[#FAF7F2] border border-[#6F4E37]/30 rounded-xl text-xs text-[#4B3621] flex items-center gap-2 animate-in fade-in shadow-2xs">
          <Radio className="w-4 h-4 text-[#6F4E37] animate-pulse shrink-0" />
          <span>{radioDispatchFeedback}</span>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-xl p-3.5 sm:p-4 space-y-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E7DED2] pb-2.5">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#6F4E37]" />
            <span className="text-xs font-bold text-[#4B3621] uppercase tracking-wide">
              Officer Roster Filters
            </span>
            <span className="text-xs text-[#8B735B] font-mono tabular-nums">
              (Showing {filteredOfficers.length} of {officers.length} officers)
            </span>
          </div>

          {(searchQuery || selectedArea !== 'all' || selectedStatus !== 'all' || selectedShift !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedArea('all');
                setSelectedStatus('all');
                setSelectedShift('all');
              }}
              className="text-xs text-[#C62828] hover:text-[#B71C1C] font-semibold underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          {/* 1. Keyword search */}
          <div>
            <label className="block text-[#4B3621] font-semibold text-[11px] mb-1">Search Officer</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#8B735B] absolute left-2.5 top-2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name, Employee ID, Badge, Phone..."
                className="w-full pl-8 pr-2.5 py-1.5 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-[#4B3621] placeholder-[#8B735B]/70 focus:outline-none focus:border-[#6F4E37] focus:bg-[#FFFFFF]"
              />
            </div>
          </div>

          {/* 2. Patrol Zone */}
          <div>
            <label className="block text-[#4B3621] font-semibold text-[11px] mb-1">
              Patrol Zone (पेट्रोल ज़ोन)
            </label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-none focus:border-[#6F4E37] cursor-pointer"
            >
              <option value="all">All Patrol Zones ({availableZoneList.length})</option>
              {availableZoneList.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>


          {/* 3. Employment Status */}
          <div>
            <label className="block text-[#4B3621] font-semibold text-[11px] mb-1">Employment Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-none focus:border-[#6F4E37] cursor-pointer"
            >
              <option value="all">All Employment Statuses</option>
              <option value="active">Active Only</option>
              <option value="on_leave">On Leave Only</option>
              <option value="deactivated">Deactivated Only</option>
            </select>
          </div>

          {/* 4. Shift */}
          <div>
            <label className="block text-[#4B3621] font-semibold text-[11px] mb-1">Shift</label>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-none focus:border-[#6F4E37] cursor-pointer"
            >
              <option value="all">All Shifts</option>
              <option value="Day">Day Shift</option>
              <option value="Night">Night Shift</option>
              <option value="Swing">Swing Shift</option>
            </select>
          </div>
        </div>
      </div>

      {/* Officers Grid */}
      {filteredOfficers.length === 0 ? (
        <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-xl p-10 text-center shadow-2xs">
          <Users className="w-10 h-10 text-[#8B735B] mx-auto mb-2" />
          <h4 className="text-sm font-bold text-[#4B3621]">No Field Officers Found</h4>
          <p className="text-xs text-[#8B735B] mt-1">
            No officers match your filter criteria. Try adjusting the search filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOfficers.map((officer) => {
            const isOfficerActive = officer.employmentStatus === 'active';
            const assignedSitesList = sites.filter((s) => officer.assignedSiteIds.includes(s.id));

            return (
              <div
                key={officer.id}
                className={`border rounded-xl p-4 flex flex-col justify-between transition-all hover:border-[#8B735B] space-y-3.5 shadow-2xs ${
                  isOfficerActive ? 'bg-[#FFFFFF] border-[#E7DED2]' : 'bg-[#FAF7F2] border-[#E7DED2] opacity-75'
                }`}
              >
                <div>
                  {/* Top Bar with Name, Employee ID, Status Toggle */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-[#E8D8C5] border border-[#E7DED2] flex items-center justify-center font-bold text-[#4B3621] text-sm shrink-0">
                        {officer.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#4B3621]">
                          {officer.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#6F4E37] font-bold">
                          <span>{officer.employeeId}</span>
                          <span>·</span>
                          <span className="text-[#8B735B]">{officer.badgeNumber}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {getEmploymentBadge(officer.employmentStatus)}
                      <button
                        type="button"
                        onClick={() => onToggleOfficerStatus(officer.id)}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          isOfficerActive
                            ? 'bg-[#FFFFFF] text-[#2E7D32] hover:bg-[#FFEBEE] hover:text-[#C62828] border-[#E7DED2] hover:border-[#FFCDD2]'
                            : 'bg-[#FFFFFF] text-[#8B735B] hover:text-[#2E7D32] border-[#E7DED2]'
                        }`}
                        title={isOfficerActive ? 'Deactivate Officer' : 'Activate Officer'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Phone & Area Info */}
                  <div className="space-y-1.5 text-xs text-[#8B735B] mb-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="flex items-center gap-1 text-[11px] text-[#4B3621] font-mono font-medium">
                          <Phone className="w-3 h-3 text-[#6F4E37]" />
                          <span>{officer.phone}</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <a
                            href={getCallUrl(officer.phone)}
                            className="p-1 rounded-md bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2] transition-colors"
                            title={`Call ${officer.name}`}
                          >
                            <Phone className="w-2.5 h-2.5 text-[#6F4E37]" />
                          </a>
                          <a
                            href={getWhatsAppUrl(officer.phone, `नमस्ते ${officer.name} जी, REXON एडमिन ऑपरेशन्स से संपर्क कर रहे हैं।`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-md bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] border border-[#25D366]/30 transition-colors"
                            title={`WhatsApp ${officer.name}`}
                          >
                            <WhatsAppIcon className="w-2.5 h-2.5 text-[#25D366]" />
                          </a>
                        </div>
                      </div>
                      <span className="font-mono text-[11px] text-[#8B735B] font-semibold">{officer.shift} Shift</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#8B735B]">
                      <MapPin className="w-3.5 h-3.5 text-[#6F4E37] shrink-0" />
                      <span>Patrol Zone: <strong className="text-[#4B3621] font-semibold">{officer.area}</strong></span>
                    </div>
                  </div>

                  {/* Officer Mobile App Login Credentials (Email & Password) */}
                  <div className="p-2.5 rounded-xl bg-[#FAF5EE] border border-[#DFCBB9] mb-2.5 shadow-2xs">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#4B3621] mb-2 pb-1.5 border-b border-[#E8DACB]">
                      <div className="flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-[#6F4E37]" />
                        <span>Officer App Login (ऐप लॉगिन)</span>
                      </div>
                      {onLaunchOfficerApp && (
                        <button
                          type="button"
                          onClick={() => onLaunchOfficerApp(officer)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-[#6F4E37] hover:text-[#4B3621] hover:underline cursor-pointer"
                          title="Open Officer App directly with this account"
                        >
                          <span>लॉगिन करें →</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between gap-1.5 bg-[#FFFFFF] px-2 py-1 rounded-md border border-[#E7DED2]">
                        <span className="text-[10px] text-[#8B735B] font-bold uppercase shrink-0">Mail / ID:</span>
                        <span className="font-mono text-[11px] text-[#4B3621] font-semibold truncate" title={officer.email || `${officer.name.toLowerCase().replace(/\s+/g, '')}@rexon.com`}>
                          {officer.email || `${officer.name.toLowerCase().replace(/\s+/g, '')}@rexon.com`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-1.5 bg-[#FFFFFF] px-2 py-1 rounded-md border border-[#E7DED2]">
                        <span className="text-[10px] text-[#8B735B] font-bold uppercase shrink-0">Password:</span>
                        <span className="font-mono text-[11px] text-[#6F4E37] font-bold">
                          {officer.password || 'rexon123'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Telemetry Strip */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] mb-2.5">
                    <div className="p-2 rounded-lg bg-[#FAF7F2] border border-[#E7DED2]">
                      <div className="text-[#8B735B] flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-[#6F4E37]" />
                        <span>Last Check-In</span>
                      </div>
                      <div className="font-mono text-[#4B3621] font-bold mt-0.5">{officer.lastCheckInTime}</div>
                    </div>

                    <div className="p-2 rounded-lg bg-[#FAF7F2] border border-[#E7DED2]">
                      <div className="text-[#8B735B] flex items-center gap-1 font-medium">
                        {getBatteryIcon(officer.batteryPercent)}
                        <span>Battery</span>
                      </div>
                      <div className="font-mono text-[#4B3621] font-bold mt-0.5">{officer.batteryPercent}%</div>
                    </div>
                  </div>

                  {/* Allocated Sites Count Button */}
                  <div className="p-2.5 rounded-lg bg-[#FAF7F2] border border-[#E7DED2] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#6F4E37] shrink-0" />
                      <span className="text-[#4B3621] font-semibold">
                        Assigned Sites: <strong className="text-[#6F4E37] font-mono font-bold">{assignedSitesList.length}</strong>
                      </span>
                    </div>

                    {assignedSitesList.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setViewingOfficerSites(officer)}
                        className="text-[11px] text-[#6F4E37] hover:underline font-bold cursor-pointer"
                      >
                        View Allocation List →
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2.5 border-t border-[#E7DED2] space-y-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOfficerForReport(officer)}
                    className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-[#6F4E37] hover:bg-[#5A3E2B] text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                    title="Audit Reports & Data Download (Daily / Weekly / Monthly)"
                  >
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>Download Reports (रिपोर्ट डाउनलोड)</span>
                  </button>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(officer)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-[#F0E8DD] hover:bg-[#E8D8C5] text-[#4B3621] border border-[#E7DED2] transition-colors cursor-pointer shadow-2xs"
                      >
                        <Edit className="w-3 h-3 text-[#6F4E37]" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerRadioCheck(officer.name, officer.badgeNumber)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-[#F0E8DD] hover:bg-[#E8D8C5] text-[#4B3621] border border-[#E7DED2] transition-colors cursor-pointer"
                        title="Dispatch radio test ping"
                      >
                        <Radio className="w-3 h-3 text-[#6F4E37]" />
                      </button>
                      {onDeleteOfficer && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Are you sure you want to remove Field Officer "${officer.name}" (${officer.badgeNumber}) from the patrol roster?`)) {
                              onDeleteOfficer(officer.id);
                            }
                          }}
                          className="inline-flex items-center gap-1 p-1 text-xs rounded bg-[#FAF7F2] hover:bg-[#FFEBEE] text-[#8B735B] hover:text-[#C62828] border border-[#E7DED2] hover:border-[#FFCDD2] transition-colors cursor-pointer"
                          title="Remove officer from roster (फील्ड ऑफिसर हटाएं)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>


                    <button
                      type="button"
                      onClick={() => onFilterByOfficer(officer.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2] transition-colors cursor-pointer shadow-2xs"
                    >
                      <FileCheck2 className="w-3 h-3 text-[#6F4E37]" />
                      <span>Audit Logs</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Officer Form Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
          <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-[#4B3621]">
            <div className="p-4 sm:p-5 border-b border-[#E7DED2] bg-[#FAF7F2] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#6F4E37]" />
                <h3 className="text-sm font-bold text-[#4B3621]">
                  {editingOfficer ? `Edit Officer: ${editingOfficer.name}` : 'Register New Field Officer'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="text-[#8B735B] hover:text-[#4B3621] p-1 rounded-lg hover:bg-[#F0E8DD]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[#4B3621] mb-1 font-semibold">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sandeep Rana or Amit Kumar"
                  className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-none focus:border-[#6F4E37]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4B3621] mb-1 font-semibold">Employee ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    placeholder="e.g. REX-EMP-1001"
                    className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] font-mono focus:outline-none focus:border-[#6F4E37]"
                  />
                </div>

                <div>
                  <label className="block text-[#4B3621] mb-1 font-semibold">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +1 (555) 301-4401"
                    className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-none focus:border-[#6F4E37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4B3621] mb-1 font-semibold flex items-center justify-between">
                    <span>Login Email ID * (लॉगिन ईमेल)</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#8B735B] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. officer@rexon.com"
                      className="w-full pl-8 pr-3 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-none focus:border-[#6F4E37] text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#4B3621] mb-1 font-semibold flex items-center justify-between">
                    <span>App Password * (ऐप पासवर्ड)</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-[#8B735B] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Default: rexon123"
                      className="w-full pl-8 pr-3 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] font-mono font-bold focus:outline-none focus:border-[#6F4E37] text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Login Instructions Note for Officer Application */}
              <div className="p-2.5 bg-[#F8F5EF] rounded-xl border border-[#D7C4B2] text-xs text-[#6F4E37] flex items-start gap-2">
                <Smartphone className="w-4 h-4 shrink-0 mt-0.5 text-[#6F4E37]" />
                <div className="text-[11px] leading-relaxed">
                  <strong>फील्ड ऑफिसर ऐप लॉगिन (Officer Mobile App):</strong> फील्ड ऑफिसर अपने मोबाइल या टैबलेट ऐप में इसी <strong>ईमेल आईडी</strong> और <strong>पासवर्ड</strong> के साथ सीधे लॉगिन कर सकेंगे।
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4B3621] mb-1 font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-[#6F4E37]" />
                      <span>Patrol Zone * (पेट्रोलिंग ज़ोन)</span>
                    </span>
                    <span className="text-[10px] text-[#6F4E37] font-semibold bg-[#F0E8DD] px-1.5 py-0.5 rounded border border-[#E7DED2]">
                      {availableZoneList.length} ज़ोन उपलब्ध
                    </span>
                  </label>
                  <select
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] font-medium focus:outline-none focus:border-[#6F4E37] cursor-pointer"
                  >
                    {availableZoneList.map((zoneName) => {
                      const matchedZoneObj = zones.find(
                        (z) => z.name.toLowerCase() === zoneName.toLowerCase()
                      );
                      return (
                        <option key={zoneName} value={zoneName}>
                          {zoneName} {matchedZoneObj?.code ? `[${matchedZoneObj.code}]` : ''}
                        </option>
                      );
                    })}
                  </select>
                  <p className="text-[10px] text-[#8B735B] mt-1">
                    फील्ड ऑफिसर को इस पेट्रोलिंग ज़ोन की सभी साइट्स और चेकपॉइंट्स पर नियुक्त किया जाएगा।
                  </p>
                </div>


                <div>
                  <label className="block text-[#4B3621] mb-1 font-semibold">Shift Assignment</label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value as OfficerShift })}
                    className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-none focus:border-[#6F4E37] cursor-pointer"
                  >
                    <option value="Day">Day Shift</option>
                    <option value="Night">Night Shift</option>
                    <option value="Swing">Swing Shift</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#4B3621] mb-1 font-semibold">Employment Status</label>
                <select
                  value={formData.employmentStatus}
                  onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value as OfficerEmploymentStatus })}
                  className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-none focus:border-[#6F4E37] cursor-pointer"
                >
                  <option value="active">Active (On Duty / Standby)</option>
                  <option value="on_leave">On Leave / Rest Day</option>
                  <option value="deactivated">Deactivated</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[#E7DED2] flex items-center justify-between gap-2">
                <div>
                  {editingOfficer && onDeleteOfficer && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Remove Officer "${editingOfficer.name}" (${editingOfficer.badgeNumber}) permanently from roster?`)) {
                          onDeleteOfficer(editingOfficer.id);
                          setIsFormModalOpen(false);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#FFEBEE] text-[#C62828] hover:bg-[#FFCDD2] border border-[#FFCDD2] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Officer (हटाएं)</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFormModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#F0E8DD] text-[#4B3621] hover:bg-[#E8D8C5] transition-colors cursor-pointer font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-[#6F4E37] hover:bg-[#5A3E2B] text-white font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    {editingOfficer ? 'Update Officer' : 'Register Officer'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Viewing Officer Allocated Sites Modal */}
      {viewingOfficerSites && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-[#4B3621]">
            <div className="p-4 border-b border-[#E7DED2] bg-[#FAF7F2] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#4B3621] flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#6F4E37]" />
                  <span>Site Allocations: {viewingOfficerSites.name}</span>
                </h3>
                <p className="text-[11px] text-[#8B735B]">
                  {viewingOfficerSites.employeeId} · Zone: {viewingOfficerSites.area}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingOfficerSites(null)}
                className="text-[#8B735B] hover:text-[#4B3621] p-1 rounded-lg hover:bg-[#F0E8DD]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#FFFFFF]">
              <div className="text-xs text-[#8B735B] mb-2 font-medium">
                Total Allocated Sites: <strong className="text-[#6F4E37] font-mono font-bold">{viewingOfficerSites.assignedSiteIds.length}</strong>
              </div>

              {sites
                .filter((s) => viewingOfficerSites.assignedSiteIds.includes(s.id))
                .map((site, index) => (
                  <div
                    key={site.id}
                    className="p-3 rounded-lg bg-[#FAF7F2] border border-[#E7DED2] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-[#4B3621]">
                        {index + 1}. {site.name}
                      </div>
                      <div className="text-[11px] text-[#8B735B] mt-0.5 font-medium">
                        {site.code} · {site.clientName}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-[#4B3621] bg-[#FFFFFF] px-2 py-0.5 rounded border border-[#E7DED2] font-semibold">
                      {site.patrolFrequency || '2x per shift'}
                    </span>
                  </div>
                ))}
            </div>

            <div className="p-3.5 border-t border-[#E7DED2] bg-[#FAF7F2] flex justify-end">
              <button
                type="button"
                onClick={() => setViewingOfficerSites(null)}
                className="px-4 py-1.5 rounded-lg bg-[#6F4E37] hover:bg-[#5A3E2B] text-white text-xs font-bold cursor-pointer shadow-2xs"
              >
                Close Allocations
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 2: OFFICER-WISE DAILY REPORTS & DOWNLOADS MODAL */}
      {selectedOfficerForReport && (
        <OfficerDailyReportModal
          officer={selectedOfficerForReport}
          sites={sites}
          reports={reports}
          assignments={assignments}
          onClose={() => setSelectedOfficerForReport(null)}
          onSelectReport={onSelectReport}
        />
      )}
    </div>
  );
};
