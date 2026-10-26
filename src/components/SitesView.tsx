import React, { useState, useMemo } from 'react';
import {
  Building2,
  MapPin,
  Plus,
  Edit,
  Power,
  Search,
  CheckCircle2,
  X,
  FileCheck2,
  ListChecks,
  Phone,
  User,
  Compass,
  Clock,
  Filter,
  Trash2,
  BookmarkCheck,
  RotateCcw,
  Library,
  Layers,
  Edit2,
  Calendar,
  MessageSquare,
  KeyRound,
  Eye,
  EyeOff,
  ExternalLink,
  Copy,
  Check,
  Mail,
  Shield,
  Briefcase,
  Navigation
} from 'lucide-react';
import { Site, SiteType, PatrolReport, ChecklistItem, PatrolZone, Assignment, FieldOfficer } from '../types';
import { DEMO_AREAS } from '../data/demoData';
import { SiteChecklistModal } from './SiteChecklistModal';
import { SiteReportsDownloadModal } from './SiteReportsDownloadModal';
import { SiteMapModal } from './SiteMapModal';
import { SiteInteractiveMap } from './SiteInteractiveMap';
import { getGoogleMapsNavUrl, getGoogleMapsViewUrl, getFallbackCoordinatesForSite } from '../utils/mapUtils';
import { getCallUrl, getWhatsAppUrl, WhatsAppIcon } from '../utils/contactUtils';

interface SitesViewProps {
  sites: Site[];
  reports: PatrolReport[];
  assignments?: Assignment[];
  officers?: FieldOfficer[];
  masterChecklists: ChecklistItem[];
  zones?: PatrolZone[];
  onCreateZone?: (zone: PatrolZone) => void;
  onSaveSite: (site: Site) => void;
  onToggleSiteStatus: (siteId: string) => void;
  onDeleteSite?: (siteId: string) => void;
  onSelectSiteReport: (report: PatrolReport) => void;
  onOpenChecklistManager: () => void;
  onOpenZonesManager?: () => void;
  onLaunchOwnerApp?: (loginId?: string) => void;
}

export const SitesView: React.FC<SitesViewProps> = ({
  sites,
  reports,
  assignments = [],
  officers = [],
  masterChecklists,
  zones = [],
  onCreateZone,
  onSaveSite,
  onToggleSiteStatus,
  onDeleteSite,
  onSelectSiteReport,
  onOpenChecklistManager,
  onOpenZonesManager,
  onLaunchOwnerApp
}) => {

  // Available zones list (fallback to DEMO_AREAS if zones prop empty)
  const availableZoneNames = useMemo(() => {
    if (zones && zones.length > 0) {
      return zones.map((z) => z.name);
    }
    return [...DEMO_AREAS];
  }, [zones]);

  // View Mode: 'facilities' (Sites grid) or 'client_logins' (Unified Client Company Portal Logins)
  const [siteViewTab, setSiteViewTab] = useState<'facilities' | 'client_logins'>('facilities');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visiblePasswordSiteIds, setVisiblePasswordSiteIds] = useState<Record<string, boolean>>({});
  const [showModalPassword, setShowModalPassword] = useState(false);

  const togglePasswordVisibility = (siteId: string) => {
    setVisiblePasswordSiteIds((prev) => ({ ...prev, [siteId]: !prev[siteId] }));
  };

  const handleCopyCredentials = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('all');
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'deactivated'>('all');
  const [selectedType, setSelectedType] = useState<'all' | SiteType>('all');

  // Modal State for Create / Edit Site
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Dedicated Site Checklist Modal State (for managing single site's checklist from card)
  const [selectedSiteForChecklist, setSelectedSiteForChecklist] = useState<Site | null>(null);

  // Dedicated Site Reports Download Modal State (Daily, Weekly, Monthly)
  const [selectedSiteForDownload, setSelectedSiteForDownload] = useState<Site | null>(null);

  // Dedicated Site Map & Google Maps Navigation Modal State
  const [selectedSiteForMap, setSelectedSiteForMap] = useState<Site | null>(null);
  const [isPreviewingFormMap, setIsPreviewingFormMap] = useState<boolean>(false);

  // Quick Add Zone Modal State (right inside Create Site modal)
  const [isQuickZoneModalOpen, setIsQuickZoneModalOpen] = useState(false);
  const [quickZoneName, setQuickZoneName] = useState('');
  const [quickZoneCode, setQuickZoneCode] = useState('');

  // Form Fields for Create / Edit Site
  const [formData, setFormData] = useState({
    name: '',
    clientName: '',
    siteType: 'factory' as SiteType,
    address: '',
    area: availableZoneNames[0] || 'Area A - North Industrial',
    contactPerson: '',
    contactPhone: '',
    patrolFrequency: '2x per shift',
    lat: '',
    lng: '',
    geofenceRadiusMeters: 50,
    loginId: '',
    password: '',
    industry: '',
    contactEmail: '',
    portalActive: true,
    notes: ''
  });

  // Site-specific checklist state inside Create/Edit Site form
  const [siteChecklist, setSiteChecklist] = useState<ChecklistItem[]>([]);
  const [isAddingCustomCheckpoint, setIsAddingCustomCheckpoint] = useState(false);
  const [editingCheckpointId, setEditingCheckpointId] = useState<string | null>(null);
  const [isImportLibraryOpen, setIsImportLibraryOpen] = useState(false);

  // New checkpoint form state inside Create/Edit site modal
  const [customCheckpointTitle, setCustomCheckpointTitle] = useState('');
  const [customCheckpointCategory, setCustomCheckpointCategory] = useState<ChecklistItem['category']>('Perimeter');
  const [customCheckpointCritical, setCustomCheckpointCritical] = useState(false);
  const [customCheckpointNotes, setCustomCheckpointNotes] = useState('');

  const uniqueClients = useMemo(() => {
    return Array.from(new Set(sites.map((s) => s.clientName))).sort();
  }, [sites]);

  const filteredSites = useMemo(() => {
    return sites.filter((site) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = site.name.toLowerCase().includes(q);
        const matchesClient = site.clientName.toLowerCase().includes(q);
        const matchesArea = site.area.toLowerCase().includes(q);
        const matchesAddress = site.address.toLowerCase().includes(q);
        const matchesCode = site.code.toLowerCase().includes(q);
        if (!matchesName && !matchesClient && !matchesArea && !matchesAddress && !matchesCode) {
          return false;
        }
      }

      // 2. Area Filter
      if (selectedArea !== 'all' && site.area.toLowerCase() !== selectedArea.toLowerCase()) {
        return false;
      }

      // 3. Client Filter
      if (selectedClient !== 'all' && site.clientName !== selectedClient) {
        return false;
      }

      // 4. Status Filter
      if (selectedStatus === 'active' && !site.isActive) return false;
      if (selectedStatus === 'deactivated' && site.isActive) return false;

      // 5. Site Type Filter
      if (selectedType !== 'all' && site.siteType !== selectedType) return false;

      return true;
    });
  }, [sites, searchQuery, selectedArea, selectedClient, selectedStatus, selectedType]);

  const openCreateModal = () => {
    setEditingSite(null);
    const nextNum = sites.length + 1;
    setFormData({
      name: '',
      clientName: '',
      siteType: 'factory',
      address: '',
      area: availableZoneNames[0] || 'Area A - North Industrial',
      contactPerson: '',
      contactPhone: '',
      patrolFrequency: '2x per shift',
      lat: '37.7842',
      lng: '-122.3965',
      geofenceRadiusMeters: 60,
      loginId: `site${nextNum}.portal`,
      password: `site${nextNum}pass`,
      industry: 'Commercial & Industrial',
      contactEmail: '',
      portalActive: true,
      notes: ''
    });
    // Default 4 checkpoints from master library for new site
    setSiteChecklist([...masterChecklists.slice(0, 4).map((m) => ({ ...m, id: `chk-${Date.now()}-${Math.floor(Math.random() * 1000)}` }))]);
    setIsAddingCustomCheckpoint(false);
    setEditingCheckpointId(null);
    setIsImportLibraryOpen(false);
    setShowModalPassword(false);
    setIsFormModalOpen(true);
  };

  const openEditModal = (site: Site) => {
    setEditingSite(site);
    const existingChecklists =
      site.checklistTemplates && site.checklistTemplates.length > 0
        ? [...site.checklistTemplates]
        : masterChecklists.slice(0, 4).map((m) => ({ ...m, id: `chk-${Date.now()}-${Math.floor(Math.random() * 1000)}` }));

    setFormData({
      name: site.name,
      clientName: site.clientName,
      siteType: site.siteType || 'factory',
      address: site.address,
      area: site.area,
      contactPerson: site.contactPerson,
      contactPhone: site.contactPhone,
      patrolFrequency: site.patrolFrequency || '2x per shift',
      lat: site.coordinates?.lat ? String(site.coordinates.lat) : '',
      lng: site.coordinates?.lng ? String(site.coordinates.lng) : '',
      geofenceRadiusMeters: site.geofenceRadiusMeters || 50,
      loginId: site.loginId || `${site.code.toLowerCase().replace(/[^a-z0-9]/g, '')}.site`,
      password: site.password || 'site123',
      industry: site.industry || '',
      contactEmail: site.contactEmail || '',
      portalActive: site.portalActive ?? true,
      notes: site.notes || ''
    });
    setSiteChecklist(existingChecklists);
    setIsAddingCustomCheckpoint(false);
    setEditingCheckpointId(null);
    setIsImportLibraryOpen(false);
    setShowModalPassword(false);
    setIsFormModalOpen(true);
  };

  const handleQuickAddZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickZoneName.trim()) return;

    const trimmed = quickZoneName.trim();
    if (onCreateZone) {
      const newZone: PatrolZone = {
        id: `zone-${Date.now()}`,
        name: trimmed,
        code: quickZoneCode.trim() || `ZONE-${Math.floor(10 + Math.random() * 90)}`,
        createdAt: new Date().toISOString()
      };
      onCreateZone(newZone);
    }
    setFormData((prev) => ({ ...prev, area: trimmed }));
    setQuickZoneName('');
    setQuickZoneCode('');
    setIsQuickZoneModalOpen(false);
  };

  // Site Checkpoint handlers inside Create/Edit modal
  const handleSaveCustomCheckpoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCheckpointTitle.trim()) return;

    if (editingCheckpointId) {
      setSiteChecklist((prev) =>
        prev.map((item) =>
          item.id === editingCheckpointId
            ? {
                ...item,
                title: customCheckpointTitle.trim(),
                category: customCheckpointCategory,
                isCritical: customCheckpointCritical,
                notes: customCheckpointNotes.trim() || undefined
              }
            : item
        )
      );
      setEditingCheckpointId(null);
    } else {
      const newItem: ChecklistItem = {
        id: `sitechk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: customCheckpointTitle.trim(),
        category: customCheckpointCategory,
        checked: false,
        isCritical: customCheckpointCritical,
        isActive: true,
        notes: customCheckpointNotes.trim() || undefined
      };
      setSiteChecklist((prev) => [...prev, newItem]);
    }

    setCustomCheckpointTitle('');
    setCustomCheckpointNotes('');
    setCustomCheckpointCritical(false);
    setIsAddingCustomCheckpoint(false);
  };

  const handleStartEditCheckpoint = (chk: ChecklistItem) => {
    setEditingCheckpointId(chk.id);
    setCustomCheckpointTitle(chk.title);
    setCustomCheckpointCategory(chk.category);
    setCustomCheckpointCritical(chk.isCritical);
    setCustomCheckpointNotes(chk.notes || '');
    setIsAddingCustomCheckpoint(true);
  };

  const handleRemoveCheckpoint = (chkId: string) => {
    setSiteChecklist((prev) => prev.filter((item) => item.id !== chkId));
  };

  const handleToggleCheckpointActive = (chkId: string) => {
    setSiteChecklist((prev) =>
      prev.map((item) =>
        item.id === chkId ? { ...item, isActive: item.isActive === false ? true : false } : item
      )
    );
  };

  const handleImportLibraryItem = (libItem: ChecklistItem) => {
    const alreadyExists = siteChecklist.some(
      (it) => it.title.toLowerCase() === libItem.title.toLowerCase()
    );
    if (!alreadyExists) {
      const copy: ChecklistItem = {
        ...libItem,
        id: `sitechk-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      };
      setSiteChecklist((prev) => [...prev, copy]);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.clientName.trim() || !formData.address.trim()) {
      alert('Please fill in all required fields: Site Name, Client Name, and Address.');
      return;
    }

    const siteToSave: Site = {
      id: editingSite ? editingSite.id : `site-${Date.now()}`,
      code: editingSite ? editingSite.code : `SITE-${Math.floor(100 + Math.random() * 900)}`,
      name: formData.name.trim(),
      clientName: formData.clientName.trim(),
      siteType: formData.siteType,
      area: formData.area,
      address: formData.address.trim(),
      contactPerson: formData.contactPerson.trim(),
      contactPhone: formData.contactPhone.trim(),
      patrolFrequency: formData.patrolFrequency,
      geofenceRadiusMeters: Number(formData.geofenceRadiusMeters) || 50,
      coordinates: {
        lat: formData.lat ? parseFloat(formData.lat) : getFallbackCoordinatesForSite({ area: formData.area }).lat,
        lng: formData.lng ? parseFloat(formData.lng) : getFallbackCoordinatesForSite({ area: formData.area }).lng
      },
      securityStatus: editingSite ? editingSite.securityStatus : 'normal',
      isActive: editingSite ? editingSite.isActive : true,
      requiredDailyPatrols: editingSite ? editingSite.requiredDailyPatrols : 6,
      completedPatrolsToday: editingSite ? editingSite.completedPatrolsToday : 0,
      activeOfficersCount: editingSite ? editingSite.activeOfficersCount : 0,
      checklistTemplates:
        siteChecklist.length > 0
          ? siteChecklist
          : masterChecklists.slice(0, 4).map((m) => ({ ...m, id: `chk-${Date.now()}-${Math.random()}` })),
      incidentCount: editingSite ? editingSite.incidentCount : 0,
      lastPatrolTime: editingSite ? editingSite.lastPatrolTime : 'None today',
      loginId: formData.loginId.trim() || `${formData.name.toLowerCase().split(' ')[0].replace(/[^a-z0-9]/g, '')}.site`,
      password: formData.password.trim() || 'site123',
      industry: formData.industry.trim() || (formData.siteType === 'factory' ? 'Manufacturing & Industrial' : formData.siteType === 'warehouse' ? 'Warehousing & Logistics' : formData.siteType === 'office' ? 'Corporate Commercial' : formData.siteType === 'society' ? 'Residential Society' : 'Commercial Facility'),
      contactEmail: formData.contactEmail.trim(),
      portalActive: formData.portalActive,
      notes: formData.notes.trim()
    };

    onSaveSite(siteToSave);
    setIsFormModalOpen(false);
    setActionFeedback(
      editingSite
        ? `Site "${siteToSave.name}" details, client portal login, and checklist updated successfully.`
        : `Site "${siteToSave.name}" registered with Client Portal ID "${siteToSave.loginId}".`
    );
    setTimeout(() => setActionFeedback(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="bg-[#FFFFFF] border border-[#E7DED2] p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#6F4E37]" />
            <h2 className="text-base font-bold text-[#4B3621]">
              Sites Management Console
            </h2>
            <span className="text-xs font-mono text-[#4B3621] bg-[#F0E8DD] px-2 py-0.5 rounded border border-[#E7DED2]">
              {sites.length} Total Sites
            </span>
          </div>
          <p className="text-xs text-[#8B735B] mt-0.5">
            Register client properties, configure site-specific checkpoints, manage patrol zones, and geofence parameters
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {onOpenZonesManager && (
            <button
              onClick={onOpenZonesManager}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#4B3621] hover:text-[#2E1F14] bg-[#FAF7F2] hover:bg-[#F0E8DD] border border-[#E7DED2] rounded-lg transition-colors cursor-pointer shadow-2xs"
              title="Manage Patrol Areas and Zones"
            >
              <Compass className="w-3.5 h-3.5 text-[#6F4E37]" />
              <span>Patrol Areas / Zones</span>
            </button>
          )}

          <button
            onClick={onOpenChecklistManager}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#4B3621] hover:text-[#2E1F14] bg-[#F0E8DD] hover:bg-[#E8D8C5] border border-[#E7DED2] rounded-lg transition-colors cursor-pointer shadow-2xs"
            title="Global Inspection Checkpoints Library"
          >
            <ListChecks className="w-3.5 h-3.5 text-[#6F4E37]" />
            <span>Master Checklists</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#6F4E37] hover:bg-[#5A3E2B] rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Site / नई साइट</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation: Monitored Facilities vs Client Company Logins */}
      <div className="flex border border-[#E7DED2] bg-[#FFFFFF] rounded-xl p-1 gap-1.5 shadow-2xs">
        <button
          type="button"
          onClick={() => setSiteViewTab('facilities')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            siteViewTab === 'facilities'
              ? 'bg-[#6F4E37] text-white shadow-xs'
              : 'text-[#4B3621] hover:bg-[#F0E8DD] bg-[#FAF7F2]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Monitored Sites & Patrols · साइट्स व पेट्रोलिंग ({sites.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setSiteViewTab('client_logins')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            siteViewTab === 'client_logins'
              ? 'bg-[#6F4E37] text-white shadow-xs'
              : 'text-[#4B3621] hover:bg-[#F0E8DD] bg-[#FAF7F2]'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Client Company Logins & Portal · क्लाइंट लॉगिन व क्रेडेंशियल्स ({sites.length})</span>
        </button>
      </div>

      {actionFeedback && (
        <div className="p-3 bg-[#E8F5E9] border border-[#C8E6C9] rounded-xl text-xs text-[#1B5E20] flex items-center gap-2 animate-in fade-in shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-xl p-3.5 sm:p-4 space-y-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E7DED2] pb-2.5">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#6F4E37]" />
            <span className="text-xs font-bold text-[#4B3621] uppercase tracking-wide">
              Filter Sites Catalog
            </span>
            <span className="text-xs text-[#8B735B] font-mono tabular-nums">
              ({filteredSites.length} of {sites.length} matching)
            </span>
          </div>

          {(searchQuery || selectedArea !== 'all' || selectedClient !== 'all' || selectedStatus !== 'all' || selectedType !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedArea('all');
                setSelectedClient('all');
                setSelectedStatus('all');
                setSelectedType('all');
              }}
              className="inline-flex items-center gap-1 text-xs text-[#C62828] hover:text-[#B71C1C] font-semibold transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
          {/* Search Input */}
          <div className="relative">
            <label className="block text-[#4B3621] font-semibold text-[11px] mb-1">Search Keyword</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#8B735B] absolute left-2.5 top-2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Site name, client, code..."
                className="w-full pl-8 pr-2.5 py-1.5 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-[#4B3621] placeholder-[#8B735B]/70 focus:outline-none focus:border-[#6F4E37] focus:bg-[#FFFFFF]"
              />
            </div>
          </div>

          {/* Area / Zone Filter */}
          <div>
            <label className="block text-[#4B3621] font-semibold text-[11px] mb-1">Patrol Area / Zone</label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-none focus:border-[#6F4E37] cursor-pointer"
            >
              <option value="all">All Zones ({availableZoneNames.length})</option>
              {availableZoneNames.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Client Filter */}
          <div>
            <label className="block text-[#4B3621] font-semibold text-[11px] mb-1">Client Company</label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-none focus:border-[#6F4E37] cursor-pointer"
            >
              <option value="all">All Clients ({uniqueClients.length})</option>
              {uniqueClients.map((client) => (
                <option key={client} value={client}>
                  {client}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[#4B3621] font-semibold text-[11px] mb-1">Site Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-none focus:border-[#6F4E37] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="deactivated">Deactivated Only</option>
            </select>
          </div>

          {/* Site Type Filter */}
          <div>
            <label className="block text-[#4B3621] font-semibold text-[11px] mb-1">Site Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-none focus:border-[#6F4E37] cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="factory">Factory</option>
              <option value="warehouse">Warehouse</option>
              <option value="society">Society / Residential</option>
              <option value="office">Office / Commercial</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* View Switch: Facilities vs Client Company Logins */}
      {siteViewTab === 'facilities' ? (
        filteredSites.length === 0 ? (
          <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-xl p-10 text-center shadow-2xs">
            <Building2 className="w-10 h-10 text-[#8B735B] mx-auto mb-2" />
            <h4 className="text-sm font-bold text-[#4B3621]">No Sites Found</h4>
            <p className="text-xs text-[#8B735B] mt-1">
              Try adjusting your search query or area/client filters.
            </p>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSites.map((site) => {
            const isSiteActive = site.isActive !== false;
            const siteReport = reports.find((r) => r.siteId === site.id);
            const checklistCount = site.checklistTemplates?.length || masterChecklists.length;

            return (
              <div
                key={site.id}
                className={`border rounded-xl p-4 flex flex-col justify-between transition-all hover:border-[#8B735B] space-y-3.5 shadow-2xs ${
                  isSiteActive ? 'bg-[#FFFFFF] border-[#E7DED2]' : 'bg-[#FAF7F2] border-[#E7DED2] opacity-75'
                }`}
              >
                <div>
                  {/* Top: Badges & Deactivate toggle */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[10px] text-[#4B3621] px-1.5 py-0.5 rounded bg-[#F0E8DD] border border-[#E7DED2] font-semibold">
                        {site.code}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#FAF7F2] border border-[#E7DED2] text-[#8B735B]">
                        {site.siteType || 'Commercial'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isSiteActive
                            ? 'bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9]'
                            : 'bg-[#FFEBEE] text-[#B71C1C] border border-[#FFCDD2]'
                        }`}
                      >
                        {isSiteActive ? 'Active' : 'Deactivated'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onToggleSiteStatus(site.id)}
                        title={isSiteActive ? 'Deactivate Site' : 'Reactivate Site'}
                        className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                          isSiteActive
                            ? 'bg-[#FFFFFF] text-[#2E7D32] hover:bg-[#FFEBEE] hover:text-[#C62828] border-[#E7DED2] hover:border-[#FFCDD2]'
                            : 'bg-[#FFFFFF] text-[#8B735B] hover:text-[#2E7D32] border-[#E7DED2]'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>

                      {onDeleteSite && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Are you sure you want to remove site "${site.name}" from active monitored sites?`)) {
                              onDeleteSite(site.id);
                            }
                          }}
                          title="Delete Site (साइट हटाएं)"
                          className="p-1.5 rounded-lg border border-[#E7DED2] hover:border-[#FFCDD2] bg-[#FFFFFF] hover:bg-[#FFEBEE] text-[#8B735B] hover:text-[#C62828] text-xs transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>


                  {/* Site Name and Client */}
                  <div className="mb-2">
                    <h3 className="text-base font-bold text-[#4B3621] tracking-tight">
                      {site.name}
                    </h3>
                    <div className="text-xs font-semibold text-[#8B735B] truncate">
                      Client: {site.clientName}
                    </div>
                  </div>

                  {/* Address and Area */}
                  <div className="space-y-1 text-xs text-[#8B735B] mb-2.5">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#6F4E37] shrink-0 mt-0.5" />
                      <span className="line-clamp-2 text-[#4B3621]">{site.address}</span>
                    </div>
                    <div className="text-[11px] text-[#8B735B] pl-5 flex items-center gap-1">
                      <span>Zone:</span>
                      <strong className="text-[#4B3621] font-semibold">{site.area}</strong>
                    </div>
                  </div>

                  {/* Frequency & Checkpoints metadata */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="p-2 rounded-lg bg-[#FAF7F2] border border-[#E7DED2] space-y-0.5">
                      <div className="text-[#8B735B] flex items-center gap-1 text-[11px] font-semibold">
                        <Clock className="w-3 h-3 text-[#6F4E37]" />
                        <span>Patrol Freq:</span>
                      </div>
                      <div className="font-bold text-[#4B3621]">{site.patrolFrequency || '2x per shift'}</div>
                    </div>

                    <div className="p-2 rounded-lg bg-[#FAF7F2] border border-[#E7DED2] space-y-0.5">
                      <div className="text-[#8B735B] flex items-center gap-1 text-[11px] font-semibold">
                        <ListChecks className="w-3 h-3 text-[#6F4E37]" />
                        <span>Checkpoints:</span>
                      </div>
                      <div className="font-bold text-[#4B3621] flex items-center gap-1">
                        <span>{checklistCount}</span>
                        <span className="text-[10px] font-normal text-[#8B735B]">Configured</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact details */}
                  <div className="p-2.5 rounded-lg bg-[#FAF7F2] border border-[#E7DED2] space-y-1.5 text-[11px] text-[#8B735B]">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 min-w-0">
                        <User className="w-3 h-3 text-[#6F4E37] shrink-0" />
                        <strong className="text-[#4B3621] font-semibold truncate">{site.contactPerson}</strong>
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {site.contactPhone && (
                          <>
                            <a
                              href={getCallUrl(site.contactPhone)}
                              title={`Call ${site.contactPerson}`}
                              className="p-1 rounded bg-white hover:bg-[#F0E8DD] border border-[#E7DED2] text-[#4B3621] transition-colors"
                            >
                              <Phone className="w-3 h-3 text-[#6F4E37]" />
                            </a>
                            <a
                              href={getWhatsAppUrl(site.contactPhone, `Hello ${site.contactPerson}, regarding security operations at ${site.name}:`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`WhatsApp ${site.contactPerson}`}
                              className="p-1 rounded bg-[#E8F5E9] hover:bg-[#C8E6C9] border border-[#C8E6C9] text-[#2E7D32] transition-colors"
                            >
                              <WhatsAppIcon className="w-3 h-3" />
                            </a>
                          </>
                        )}
                        <span className="text-[#8B735B] font-mono text-[10px]">{site.contactPhone}</span>
                      </div>
                    </div>

                    {site.contactEmail && (
                      <div className="flex items-center gap-1 text-[10px] text-[#8B735B] truncate">
                        <Mail className="w-3 h-3 text-[#6F4E37] shrink-0" />
                        <a href={`mailto:${site.contactEmail}`} className="text-[#6F4E37] hover:underline truncate">
                          {site.contactEmail}
                        </a>
                      </div>
                    )}

                    {site.coordinates?.lat && site.coordinates?.lng ? (
                      <div className="flex items-center gap-1 text-[10px] font-mono text-[#1B5E20] pt-1 border-t border-[#E7DED2]">
                        <Compass className="w-3 h-3 shrink-0" />
                        <span>GPS: {site.coordinates.lat.toFixed(4)}°N, {site.coordinates.lng.toFixed(4)}°W</span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-[#8B735B] pt-1 border-t border-[#E7DED2]">
                        GPS Coordinates: Centroid geofence ({site.geofenceRadiusMeters}m radius)
                      </div>
                    )}
                  </div>

                  {/* Integrated Client Portal Access Box (Single Unified Entity) */}
                  <div className="p-2.5 rounded-lg bg-[#FAF5EE] border border-[#D5C2AD] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#4B3621]">
                        <KeyRound className="w-3.5 h-3.5 text-[#6F4E37]" />
                        <span>Client Portal Login · क्लाइंट लॉगिन</span>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                          site.portalActive !== false
                            ? 'bg-[#E8F5E9] text-[#1B5E20] border-[#C8E6C9]'
                            : 'bg-[#FFEBEE] text-[#B71C1C] border-[#FFCDD2]'
                        }`}
                      >
                        {site.portalActive !== false ? 'Portal Active' : 'Suspended'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                      <div className="bg-white px-2 py-1 rounded border border-[#E7DED2] flex items-center justify-between">
                        <span className="text-[#8B735B] text-[10px] font-sans">ID:</span>
                        <span
                          className="font-bold text-[#4B3621] truncate max-w-[95px]"
                          title={site.loginId || `${site.code.toLowerCase().replace(/[^a-z0-9]/g, '')}.site`}
                        >
                          {site.loginId || `${site.code.toLowerCase().replace(/[^a-z0-9]/g, '')}.site`}
                        </span>
                      </div>
                      <div className="bg-white px-2 py-1 rounded border border-[#E7DED2] flex items-center justify-between">
                        <span className="text-[#8B735B] text-[10px] font-sans">Pass:</span>
                        <span className="font-bold text-[#4B3621]">
                          {visiblePasswordSiteIds[site.id] ? site.password || 'site123' : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(site.id)}
                          className="text-[#8B735B] hover:text-[#4B3621] cursor-pointer ml-1"
                          title={visiblePasswordSiteIds[site.id] ? 'Hide password' : 'Show password'}
                        >
                          {visiblePasswordSiteIds[site.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3 text-[#6F4E37]" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyCredentials(
                            `Site / Company: ${site.name} (${site.clientName})\nLogin ID: ${
                              site.loginId || `${site.code.toLowerCase().replace(/[^a-z0-9]/g, '')}.site`
                            }\nPassword: ${site.password || 'site123'}`,
                            site.id
                          )
                        }
                        className="flex-1 py-1 px-2 rounded bg-white hover:bg-[#FAF7F2] border border-[#E7DED2] text-[10px] font-semibold text-[#4B3621] flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        title="Copy Client Login ID & Password"
                      >
                        {copiedId === site.id ? <Check className="w-3 h-3 text-[#2E7D32]" /> : <Copy className="w-3 h-3 text-[#6F4E37]" />}
                        <span>{copiedId === site.id ? 'Copied!' : 'Copy Login'}</span>
                      </button>

                      {onLaunchOwnerApp && (
                        <button
                          type="button"
                          onClick={() => onLaunchOwnerApp(site.loginId || site.code)}
                          className="flex-1 py-1 px-2 rounded bg-[#6F4E37] hover:bg-[#5A3E2B] text-white text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          title="Open Client Executive Portal directly as this company"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Open Portal</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2.5 border-t border-[#E7DED2] space-y-2">
                  {/* Site Map & Google Maps Navigation Button Group */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedSiteForMap(site)}
                      className="inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2] text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                      title="View Site Location Map & Geofence"
                    >
                      <Compass className="w-3.5 h-3.5 text-[#6F4E37]" />
                      <span>साइट मैप (Map)</span>
                    </button>
                    <a
                      href={getGoogleMapsNavUrl(site)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
                      title="Open Google Maps turn-by-turn navigation"
                    >
                      <Navigation className="w-3.5 h-3.5 text-white fill-white" />
                      <span>Google Maps</span>
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedSiteForDownload(site)}
                    className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-[#6F4E37] hover:bg-[#5A3E2B] text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                    title="Download Site Patrol Reports (Daily / Weekly / Monthly)"
                  >
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>Download Reports (रिपोर्ट डाउनलोड)</span>
                  </button>

                  <div className="flex items-center justify-between gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(site)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-[#F0E8DD] hover:bg-[#E8D8C5] text-[#4B3621] border border-[#E7DED2] transition-colors cursor-pointer shadow-2xs"
                        title="Edit Site Details"
                      >
                        <Edit className="w-3 h-3 text-[#6F4E37]" />
                        <span>Edit</span>
                      </button>

                      {/* DEDICATED SITE MASTER CHECKLIST BUTTON */}
                      <button
                        type="button"
                        onClick={() => setSelectedSiteForChecklist(site)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded bg-[#F5EFE6] hover:bg-[#E8D8C5] text-[#6F4E37] border border-[#D5C2AD] transition-colors cursor-pointer shadow-2xs"
                        title="Manage Master Checklist for this specific site"
                      >
                        <ListChecks className="w-3.5 h-3.5" />
                        <span>Checklist ({site.checklistTemplates?.length || masterChecklists.length})</span>
                      </button>
                    </div>

                    {siteReport ? (
                      <button
                        type="button"
                        onClick={() => onSelectSiteReport(siteReport)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#1B5E20] border border-[#C8E6C9] transition-colors cursor-pointer shadow-2xs"
                      >
                        <FileCheck2 className="w-3 h-3" />
                        <span>Today's Log</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-[#8B735B] italic">No log today</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )) : (
        /* CLIENT COMPANY LOGINS & PORTAL MANAGEMENT DECK */
        <div className="space-y-4">
          {/* Executive Info Banner */}
          <div className="p-4 bg-[#FAF7F2] border border-[#E7DED2] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E7DED2] text-[#6F4E37] shrink-0 mt-0.5">
                <Shield className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-[#4B3621] uppercase tracking-wider">
                    Client Company Enterprise Portals · क्लाइंट पोर्टल व क्रेडेंशियल्स
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9]">
                    Unified Site-Company Engine
                  </span>
                </div>
                <p className="text-xs text-[#8B735B]">
                  Each monitored site is a registered client company facility. Company directors, HR, and facility heads log in to view live patrols, GPS check-ins, and incident sheets.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-[#E7DED2] text-[#4B3621]">
                Total: <strong className="text-[#6F4E37]">{filteredSites.length}</strong>
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#E8F5E9] border border-[#C8E6C9] text-[#1B5E20]">
                Active: <strong>{filteredSites.filter((s) => s.portalActive !== false).length}</strong>
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#FFEBEE] border border-[#FFCDD2] text-[#B71C1C]">
                Suspended: <strong>{filteredSites.filter((s) => s.portalActive === false).length}</strong>
              </span>
            </div>
          </div>

          {/* Client Company Cards Deck */}
          {filteredSites.length === 0 ? (
            <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-xl p-10 text-center shadow-2xs">
              <KeyRound className="w-10 h-10 text-[#8B735B] mx-auto mb-2" />
              <h4 className="text-sm font-bold text-[#4B3621]">No Client Accounts Found</h4>
              <p className="text-xs text-[#8B735B] mt-1">Try adjusting your search query or area/client filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSites.map((site) => {
                const isPortalActive = site.portalActive !== false;
                const isSiteActive = site.isActive !== false;
                const loginId = site.loginId || `${site.code.toLowerCase().replace(/[^a-z0-9]/g, '')}.site`;
                const password = site.password || 'site123';
                const isPasswordVisible = visiblePasswordSiteIds[site.id];

                return (
                  <div
                    key={site.id}
                    className={`border rounded-xl p-4 flex flex-col justify-between transition-all hover:border-[#8B735B] space-y-3.5 shadow-2xs ${
                      isPortalActive && isSiteActive
                        ? 'bg-[#FFFFFF] border-[#E7DED2]'
                        : 'bg-[#FAF7F2] border-[#E7DED2] opacity-80'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[10px] text-[#4B3621] px-1.5 py-0.5 rounded bg-[#F0E8DD] border border-[#E7DED2] font-semibold">
                            {site.code}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FAF7F2] border border-[#E7DED2] text-[#8B735B] flex items-center gap-1">
                            <Briefcase className="w-2.5 h-2.5 text-[#6F4E37]" />
                            <span>{site.industry || 'Commercial Enterprise'}</span>
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            isPortalActive && isSiteActive
                              ? 'bg-[#E8F5E9] text-[#1B5E20] border-[#C8E6C9]'
                              : 'bg-[#FFEBEE] text-[#B71C1C] border-[#FFCDD2]'
                          }`}
                        >
                          {isPortalActive && isSiteActive ? 'Active' : 'Suspended'}
                        </span>
                      </div>

                      {/* Client Company Name & Facility */}
                      <div className="mb-2">
                        <h3 className="text-base font-bold text-[#4B3621] tracking-tight">
                          {site.clientName}
                        </h3>
                        <div className="text-xs font-semibold text-[#8B735B] flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3.5 h-3.5 text-[#6F4E37] shrink-0" />
                          <span className="text-[#4B3621]">{site.name}</span>
                        </div>
                      </div>

                      {/* Location & Sector */}
                      <div className="space-y-1 text-xs text-[#8B735B] mb-2.5">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#6F4E37] shrink-0 mt-0.5" />
                          <span className="line-clamp-2 text-[#4B3621]">{site.address}</span>
                        </div>
                        <div className="text-[11px] text-[#8B735B] pl-5">
                          Zone: <strong className="text-[#4B3621]">{site.area}</strong>
                        </div>
                      </div>

                      {/* Integrated Credentials Box */}
                      <div className="p-2.5 rounded-lg bg-[#FAF5EE] border border-[#D5C2AD] space-y-2 mb-2.5">
                        <div className="flex items-center justify-between text-xs font-bold text-[#4B3621]">
                          <span className="flex items-center gap-1">
                            <KeyRound className="w-3.5 h-3.5 text-[#6F4E37]" />
                            <span>Portal Access Credentials</span>
                          </span>
                          <span className="text-[10px] font-normal text-[#8B735B]">Role: Executive</span>
                        </div>

                        <div className="grid grid-cols-1 gap-1.5 text-xs font-mono">
                          {/* Login ID */}
                          <div className="bg-white px-2.5 py-1.5 rounded-lg border border-[#E7DED2] flex items-center justify-between">
                            <span className="text-[#8B735B] text-[11px] font-sans">Login ID:</span>
                            <span className="font-bold text-[#4B3621] select-all truncate">{loginId}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyCredentials(loginId, `${site.id}-login`)}
                              className="text-[#8B735B] hover:text-[#4B3621] p-1 cursor-pointer"
                              title="Copy Login ID"
                            >
                              {copiedId === `${site.id}-login` ? (
                                <Check className="w-3 h-3 text-[#2E7D32]" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>

                          {/* Password */}
                          <div className="bg-white px-2.5 py-1.5 rounded-lg border border-[#E7DED2] flex items-center justify-between">
                            <span className="text-[#8B735B] text-[11px] font-sans">Password:</span>
                            <span className="font-bold text-[#4B3621]">
                              {isPasswordVisible ? password : '••••••••'}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(site.id)}
                                className="text-[#8B735B] hover:text-[#4B3621] p-1 cursor-pointer"
                                title={isPasswordVisible ? 'Hide Password' : 'Show Password'}
                              >
                                {isPasswordVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3 text-[#6F4E37]" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyCredentials(password, `${site.id}-pass`)}
                                className="text-[#8B735B] hover:text-[#4B3621] p-1 cursor-pointer"
                                title="Copy Password"
                              >
                                {copiedId === `${site.id}-pass` ? (
                                  <Check className="w-3 h-3 text-[#2E7D32]" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Copy Combo Button */}
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyCredentials(
                              `Client Company: ${site.clientName}\nFacility: ${site.name}\nLogin ID: ${loginId}\nPassword: ${password}\nPortal: REXON Field Patrolling Client Executive Suite`,
                              `${site.id}-combo`
                            )
                          }
                          className="w-full py-1 text-[10px] font-semibold text-[#4B3621] bg-white hover:bg-[#FAF7F2] border border-[#E7DED2] rounded flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          {copiedId === `${site.id}-combo` ? (
                            <Check className="w-3 h-3 text-[#2E7D32]" />
                          ) : (
                            <Copy className="w-3 h-3 text-[#6F4E37]" />
                          )}
                          <span>{copiedId === `${site.id}-combo` ? 'Credentials Copied!' : 'Copy Login & Password'}</span>
                        </button>
                      </div>

                      {/* Contact & Escalation */}
                      <div className="p-2.5 rounded-lg bg-[#FAF7F2] border border-[#E7DED2] space-y-1.5 text-[11px] text-[#8B735B]">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 font-semibold text-[#4B3621]">
                            <User className="w-3 h-3 text-[#6F4E37]" />
                            <span>{site.contactPerson}</span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            {site.contactPhone && (
                              <>
                                <a
                                  href={getCallUrl(site.contactPhone)}
                                  title={`Call ${site.contactPerson}`}
                                  className="p-1 rounded bg-white hover:bg-[#F0E8DD] border border-[#E7DED2] text-[#4B3621] transition-colors"
                                >
                                  <Phone className="w-3 h-3 text-[#6F4E37]" />
                                </a>
                                <a
                                  href={getWhatsAppUrl(
                                    site.contactPhone,
                                    `Hello ${site.contactPerson}, regarding security operations at ${site.name}:`
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={`WhatsApp ${site.contactPerson}`}
                                  className="p-1 rounded bg-[#E8F5E9] hover:bg-[#C8E6C9] border border-[#C8E6C9] text-[#2E7D32] transition-colors"
                                >
                                  <WhatsAppIcon className="w-3 h-3" />
                                </a>
                              </>
                            )}
                            <span className="font-mono text-[10px]">{site.contactPhone}</span>
                          </div>
                        </div>

                        {site.contactEmail && (
                          <div className="flex items-center gap-1 text-[10px] text-[#8B735B] truncate">
                            <Mail className="w-3 h-3 text-[#6F4E37] shrink-0" />
                            <a href={`mailto:${site.contactEmail}`} className="text-[#6F4E37] hover:underline truncate">
                              {site.contactEmail}
                            </a>
                          </div>
                        )}

                        {site.notes && (
                          <div className="text-[10px] text-[#4B3621] bg-white p-1.5 rounded border border-[#E7DED2] italic">
                            "{site.notes}"
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2.5 border-t border-[#E7DED2] flex items-center gap-2">
                      {onLaunchOwnerApp && (
                        <button
                          type="button"
                          onClick={() => onLaunchOwnerApp(loginId)}
                          className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-[#6F4E37] hover:bg-[#5A3E2B] text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                          title="Open Client Executive Portal"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Launch Portal (खोलें)</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openEditModal(site)}
                        className="py-2 px-3 text-xs font-semibold rounded-xl bg-[#F0E8DD] hover:bg-[#E8D8C5] text-[#4B3621] border border-[#E7DED2] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                        title="Edit Site & Login Credentials"
                      >
                        <Edit className="w-3.5 h-3.5 text-[#6F4E37]" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT SITE MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-2xl w-full max-w-2xl max-h-[92vh] shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#E7DED2] bg-[#FAF7F2] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#6F4E37]" />
                <h3 className="text-sm font-bold text-[#4B3621]">
                  {editingSite ? `Edit Site: ${editingSite.name}` : 'Create New Monitored Site · नई साइट जोड़ें'}
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

            {/* Modal Form Body */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Site Name */}
                <div>
                  <label className="block text-[#4B3621] mb-1 font-semibold">Site / Facility Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Apex Rail Freight Yard"
                    className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-none focus:border-[#6F4E37]"
                  />
                </div>

                {/* 2. Client / Company Name */}
                <div>
                  <label className="block text-[#4B3621] mb-1 font-semibold">Client / Company Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    placeholder="e.g. Apex Logistics Global"
                    className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-none focus:border-[#6F4E37]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 3. Site Type */}
                <div>
                  <label className="block text-[#4B3621] mb-1 font-semibold">Site Type *</label>
                  <select
                    value={formData.siteType}
                    onChange={(e) => setFormData({ ...formData, siteType: e.target.value as SiteType })}
                    className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-none focus:border-[#6F4E37] cursor-pointer"
                  >
                    <option value="factory">Factory</option>
                    <option value="warehouse">Warehouse</option>
                    <option value="society">Society / Residential</option>
                    <option value="office">Office / Commercial</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* 4. Patrol Area / Zone with attached clean button */}
                <div>
                  <label className="block text-[#4B3621] mb-1 font-semibold text-xs">
                    Patrol Area / Zone *
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      className="flex-1 min-w-0 px-3 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-xs text-[#4B3621] focus:outline-none focus:border-[#6F4E37] cursor-pointer"
                    >
                      {availableZoneNames.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => setIsQuickZoneModalOpen(true)}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F0E8DD] hover:bg-[#E8D8C5] text-[#4B3621] border border-[#E7DED2] rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                      title="Add New Patrol Zone"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#6F4E37]" />
                      <span>New Zone</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 5. Address */}
              <div>
                <label className="block text-[#4B3621] mb-1 font-semibold">Physical Address *</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address, building number, gate number..."
                  className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-none focus:border-[#6F4E37]"
                />
              </div>

              {/* Map Coordinates & Geofence */}
              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E7DED2] space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[#4B3621] font-bold text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-[#6F4E37]" />
                    <span>Map Coordinates & Geofence (लोकेशन व गूगल मैप्स)</span>
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const fallback = getFallbackCoordinatesForSite({ area: formData.area });
                        setFormData((prev) => ({
                          ...prev,
                          lat: String(fallback.lat),
                          lng: String(fallback.lng)
                        }));
                      }}
                      className="text-[10px] text-[#6F4E37] hover:underline font-semibold cursor-pointer"
                    >
                      ज़ोन से भरें (Auto-Fill)
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(
                            (pos) => {
                              setFormData((prev) => ({
                                ...prev,
                                lat: pos.coords.latitude.toFixed(6),
                                lng: pos.coords.longitude.toFixed(6)
                              }));
                            },
                            (err) => {
                              alert('Could not get GPS position: ' + err.message);
                            }
                          );
                        } else {
                          alert('Geolocation is not supported by your browser.');
                        }
                      }}
                      className="text-[10px] text-[#6F4E37] hover:underline font-semibold cursor-pointer"
                    >
                      डिवाइस GPS
                    </button>
                    <span>·</span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.address || formData.name || 'San Francisco')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-[#1A73E8] hover:underline font-bold inline-flex items-center gap-0.5"
                    >
                      <span>Google Maps चेक करें</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[#8B735B] text-[10px] mb-0.5 font-semibold">Latitude (e.g. 37.7842)</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.lat}
                      onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                      placeholder="37.7842"
                      className="w-full px-2.5 py-1 bg-[#FFFFFF] border border-[#E7DED2] rounded text-[#4B3621] font-mono focus:outline-none focus:border-[#6F4E37]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8B735B] text-[10px] mb-0.5 font-semibold">Longitude (e.g. -122.3965)</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.lng}
                      onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                      placeholder="-122.3965"
                      className="w-full px-2.5 py-1 bg-[#FFFFFF] border border-[#E7DED2] rounded text-[#4B3621] font-mono focus:outline-none focus:border-[#6F4E37]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8B735B] text-[10px] mb-0.5 font-semibold">Radius (meters)</label>
                    <input
                      type="number"
                      value={formData.geofenceRadiusMeters}
                      onChange={(e) => setFormData({ ...formData, geofenceRadiusMeters: Number(e.target.value) })}
                      className="w-full px-2.5 py-1 bg-[#FFFFFF] border border-[#E7DED2] rounded text-[#4B3621] font-mono focus:outline-none focus:border-[#6F4E37]"
                    />
                  </div>
                </div>

                {/* Map Preview Toggle */}
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[10px] text-[#8B735B]">
                    जैसे ही लोकेशन/कोऑर्डिनेट्स डालेंगे, मैप पर यह स्थान फील्ड ऑफिसर को दिखाई देगा।
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsPreviewingFormMap(!isPreviewingFormMap)}
                    className="text-[11px] font-bold text-[#6F4E37] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Compass className="w-3 h-3" />
                    <span>{isPreviewingFormMap ? 'मैप छुपाएं (Hide)' : 'मैप देखें (Preview Map)'}</span>
                  </button>
                </div>

                {isPreviewingFormMap && (
                  <div className="pt-2">
                    <SiteInteractiveMap
                      site={{
                        id: 'preview',
                        code: editingSite?.code || 'SITE-NEW',
                        name: formData.name || 'New Facility',
                        clientName: formData.clientName || 'Client',
                        siteType: formData.siteType,
                        area: formData.area,
                        address: formData.address || 'Address',
                        contactPerson: formData.contactPerson,
                        contactPhone: formData.contactPhone,
                        patrolFrequency: formData.patrolFrequency,
                        geofenceRadiusMeters: formData.geofenceRadiusMeters || 50,
                        coordinates: {
                          lat: formData.lat ? parseFloat(formData.lat) : getFallbackCoordinatesForSite({ area: formData.area }).lat,
                          lng: formData.lng ? parseFloat(formData.lng) : getFallbackCoordinatesForSite({ area: formData.area }).lng
                        },
                        securityStatus: 'normal',
                        isActive: true,
                        requiredDailyPatrols: 6,
                        completedPatrolsToday: 0,
                        activeOfficersCount: 0,
                        checklistTemplates: [],
                        incidentCount: 0
                      }}
                      heightClass="h-48 sm:h-56"
                      showNavigationButton={true}
                    />
                  </div>
                )}
              </div>

              {/* 6. Contact Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4B3621] mb-1 font-semibold">Site Contact Person</label>
                  <input
                    type="text"
                    required
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="e.g. Martin Sterling (Facility Mgr)"
                    className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-none focus:border-[#6F4E37]"
                  />
                </div>

                <div>
                  <label className="block text-[#4B3621] mb-1 font-semibold">Contact Phone Number</label>
                  <input
                    type="text"
                    required
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="e.g. +1 (555) 392-8811"
                    className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-none focus:border-[#6F4E37]"
                  />
                </div>
              </div>

              {/* 7. Patrol Frequency */}
              <div>
                <label className="block text-[#4B3621] mb-1 font-semibold">Patrol Frequency</label>
                <select
                  value={formData.patrolFrequency}
                  onChange={(e) => setFormData({ ...formData, patrolFrequency: e.target.value })}
                  className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-none focus:border-[#6F4E37] cursor-pointer"
                >
                  <option value="Hourly">Hourly</option>
                  <option value="2x per shift">2x per shift</option>
                  <option value="3x per shift">3x per shift</option>
                  <option value="4x daily">4x daily</option>
                  <option value="Once per shift">Once per shift</option>
                </select>
              </div>

              {/* 8. CLIENT COMPANY PORTAL & LOGIN CREDENTIALS (UNIFIED WITH SITES) */}
              <div className="space-y-3 pt-3 border-t border-[#E7DED2] bg-[#FAF7F2] p-3.5 rounded-xl border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-[#4B3621] text-xs">
                    <KeyRound className="w-4 h-4 text-[#6F4E37]" />
                    <span>Client Company Portal & Login · क्लाइंट पोर्टल लॉगिन व क्रेडेंशियल्स</span>
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-[#4B3621] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.portalActive}
                      onChange={(e) => setFormData({ ...formData, portalActive: e.target.checked })}
                      className="w-3.5 h-3.5 text-[#6F4E37] rounded border-[#E7DED2] cursor-pointer accent-[#6F4E37]"
                    />
                    <span className="font-semibold text-[11px]">Portal Active (सक्रिय)</span>
                  </label>
                </div>
                <p className="text-[11px] text-[#8B735B]">
                  One unified login for the client enterprise owner, HR, and facility managers to inspect verified patrols, GPS logs, and incident sheets.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Login ID */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[#4B3621] font-semibold text-[11px]">Company Login ID *</label>
                      <button
                        type="button"
                        onClick={() => {
                          const base = (formData.clientName || formData.name || 'client')
                            .toLowerCase()
                            .replace(/[^a-z0-9]/g, '');
                          setFormData({ ...formData, loginId: `${base || 'client'}.portal` });
                        }}
                        className="text-[10px] text-[#6F4E37] hover:underline font-semibold cursor-pointer"
                      >
                        Auto Suggest
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.loginId}
                      onChange={(e) => setFormData({ ...formData, loginId: e.target.value })}
                      placeholder="e.g. apex.portal or freight.yard"
                      className="w-full px-2.5 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] font-mono text-xs focus:outline-none focus:border-[#6F4E37]"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[#4B3621] font-semibold text-[11px]">Company Password *</label>
                      <button
                        type="button"
                        onClick={() => {
                          const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
                          let pass = '';
                          for (let i = 0; i < 6; i++) pass += chars[Math.floor(Math.random() * chars.length)];
                          setFormData({ ...formData, password: `${pass}99` });
                        }}
                        className="text-[10px] text-[#6F4E37] hover:underline font-semibold cursor-pointer"
                      >
                        Generate Random
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showModalPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Client portal password"
                        className="w-full pl-2.5 pr-8 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] font-mono text-xs focus:outline-none focus:border-[#6F4E37]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowModalPassword(!showModalPassword)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#8B735B] hover:text-[#4B3621] cursor-pointer"
                      >
                        {showModalPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Industry Sector */}
                  <div>
                    <label className="block text-[#4B3621] font-semibold text-[11px] mb-1">Industry / Sector</label>
                    <input
                      type="text"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      placeholder="e.g. Manufacturing & Industrial, Warehousing, IT Park"
                      className="w-full px-2.5 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] text-xs focus:outline-none focus:border-[#6F4E37]"
                    />
                  </div>

                  {/* Contact Email */}
                  <div>
                    <label className="block text-[#4B3621] font-semibold text-[11px] mb-1">Official Client Email</label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      placeholder="client.ops@company.com"
                      className="w-full px-2.5 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] text-xs focus:outline-none focus:border-[#6F4E37]"
                    />
                  </div>
                </div>

                {/* Operational Notes */}
                <div>
                  <label className="block text-[#4B3621] font-semibold text-[11px] mb-1">Client Security Instructions & Notes</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Gate opening protocols, night illumination rules, emergency contacts..."
                    className="w-full px-2.5 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] text-xs focus:outline-none focus:border-[#6F4E37] resize-none"
                  />
                </div>
              </div>

              {/* 9. SITE MASTER CHECKLIST CONFIGURATION */}
              <div className="space-y-3 pt-3 border-t border-[#E7DED2]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-[#4B3621] text-xs">
                      <ListChecks className="w-4 h-4 text-[#6F4E37]" />
                      <span>Site Master Checklist · साइट मास्टर चेकलिस्ट ({siteChecklist.length})</span>
                    </div>
                    <p className="text-[11px] text-[#8B735B]">
                      Every site has its own separate Master Checklist. Configure the master inspection checkpoints for this site.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCustomCheckpoint(true);
                        setEditingCheckpointId(null);
                        setCustomCheckpointTitle('');
                        setCustomCheckpointNotes('');
                        setCustomCheckpointCritical(false);
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold text-white bg-[#6F4E37] hover:bg-[#5A3E2B] rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Add Checkpoint</span>
                    </button>
                  </div>
                </div>

                {/* Quick Presets Strip */}
                <div className="p-2.5 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg space-y-1.5">
                  <span className="text-[10px] text-[#8B735B] font-semibold uppercase tracking-wider block">
                    Quick Master Presets (क्लिक करके तुरंत जोड़ें):
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { title: 'Main gate & lock check', category: 'Access Control', isCritical: true },
                      { title: 'Boundary wall & perimeter scan', category: 'Perimeter', isCritical: true },
                      { title: 'Fire extinguisher pressure gauge', category: 'Fire & Life Safety', isCritical: true },
                      { title: 'Rear gate and exit padlocks', category: 'Access Control', isCritical: true },
                      { title: 'Server room & electrical substation access', category: 'Access Control', isCritical: true },
                      { title: 'Perimeter illumination & CCTV check', category: 'Utilities', isCritical: false },
                      { title: 'Water meter & generator fuel reserve', category: 'Utilities', isCritical: false }
                    ].map((preset) => {
                      const isAlreadyAdded = siteChecklist.some(
                        (it) => it.title.toLowerCase() === preset.title.toLowerCase()
                      );
                      return (
                        <button
                          key={preset.title}
                          type="button"
                          disabled={isAlreadyAdded}
                          onClick={() => {
                            if (!isAlreadyAdded) {
                              const newChk: ChecklistItem = {
                                id: `sitechk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                                title: preset.title,
                                category: preset.category as any,
                                checked: false,
                                isCritical: preset.isCritical,
                                isActive: true
                              };
                              setSiteChecklist((prev) => [...prev, newChk]);
                            }
                          }}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
                            isAlreadyAdded
                              ? 'bg-[#EFEAE2] text-[#8B735B] border-[#D5C2AD] cursor-default opacity-70'
                              : 'bg-[#FFFFFF] hover:bg-[#F0E8DD] text-[#4B3621] border-[#E7DED2] cursor-pointer hover:border-[#6F4E37]'
                          }`}
                        >
                          {isAlreadyAdded ? '✓ ' : '+ '}
                          {preset.title}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Add / Edit Checkpoint Form */}
                {isAddingCustomCheckpoint && (
                  <div className="p-3 bg-[#FAF7F2] border border-[#6F4E37]/30 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#4B3621]">
                        {editingCheckpointId ? 'Edit Checkpoint for this Site' : 'Create Custom Checkpoint for this Site'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAddingCustomCheckpoint(false)}
                        className="text-[#8B735B] hover:text-[#4B3621]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#4B3621] mb-0.5">
                        Checkpoint Title * (चेकपॉइंट का नाम)
                      </label>
                      <input
                        type="text"
                        value={customCheckpointTitle}
                        onChange={(e) => setCustomCheckpointTitle(e.target.value)}
                        placeholder="e.g. Inspect Backup Generator Fuel Level or Check Pharmacy Storage Lock"
                        className="w-full px-2.5 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded text-xs text-[#4B3621] focus:outline-none focus:border-[#6F4E37]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#4B3621] mb-0.5">
                          Category
                        </label>
                        <select
                          value={customCheckpointCategory}
                          onChange={(e) => setCustomCheckpointCategory(e.target.value as any)}
                          className="w-full px-2 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded text-xs text-[#4B3621]"
                        >
                          <option value="Perimeter">Perimeter (चारदीवारी / बाउंड्री)</option>
                          <option value="Access Control">Access Control (गेट व ताला सुरक्षा)</option>
                          <option value="Fire & Life Safety">Fire & Life Safety (अग्निशमन)</option>
                          <option value="Utilities">Utilities (बिजली / पानी)</option>
                          <option value="Equipment">Equipment (उपकरण / मशीन)</option>
                        </select>
                      </div>

                      <div className="flex items-center pt-4">
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-[#4B3621]">
                          <input
                            type="checkbox"
                            checked={customCheckpointCritical}
                            onChange={(e) => setCustomCheckpointCritical(e.target.checked)}
                            className="w-4 h-4 rounded text-[#C62828] focus:ring-0 cursor-pointer"
                          />
                          <span>Critical Checkpoint (अनिवार्य)</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#4B3621] mb-0.5">
                        Instructions / Notes (Optional)
                      </label>
                      <input
                        type="text"
                        value={customCheckpointNotes}
                        onChange={(e) => setCustomCheckpointNotes(e.target.value)}
                        placeholder="e.g. Ensure key is logged and photo taken"
                        className="w-full px-2.5 py-1 bg-[#FFFFFF] border border-[#E7DED2] rounded text-xs text-[#4B3621] focus:outline-none focus:border-[#6F4E37]"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingCustomCheckpoint(false)}
                        className="px-2.5 py-1 bg-[#E7DED2] text-[#4B3621] rounded text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveCustomCheckpoint}
                        className="px-3 py-1 bg-[#6F4E37] text-white rounded text-xs font-bold"
                      >
                        {editingCheckpointId ? 'Update Checkpoint' : 'Add to Site Master Checklist'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Checkpoint items list */}
                <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg">
                  {siteChecklist.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-2 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="w-5 h-5 rounded-full bg-[#FAF7F2] border border-[#E7DED2] text-[#8B735B] text-[10px] font-mono flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-[#4B3621] truncate">{item.title}</span>
                            {item.isCritical && (
                              <span className="text-[9px] font-bold text-[#C62828] bg-[#FFEBEE] border border-[#FFCDD2] px-1 py-0.2 rounded shrink-0">
                                Critical
                              </span>
                            )}
                            <span className="text-[9px] font-mono text-[#8B735B] bg-[#FAF7F2] border border-[#E7DED2] px-1 py-0.2 rounded shrink-0">
                              {item.category}
                            </span>
                          </div>
                          {item.notes && (
                            <p className="text-[10px] text-[#8B735B] truncate">{item.notes}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleCheckpointActive(item.id)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                            item.isActive !== false
                              ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]'
                              : 'bg-[#F0E8DD] text-[#8B735B] border-[#E7DED2]'
                          }`}
                        >
                          {item.isActive !== false ? 'Active' : 'Off'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEditCheckpoint(item)}
                          className="p-1 text-[#8B735B] hover:text-[#4B3621]"
                          title="Edit checkpoint"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveCheckpoint(item.id)}
                          className="p-1 text-[#C62828] hover:text-[#B71C1C]"
                          title="Remove checkpoint"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {siteChecklist.length === 0 && (
                    <div className="p-4 text-center text-xs text-[#8B735B]">
                      No checkpoints configured for this site. Click presets above or "+ Add Checkpoint" to define this site's master checklist.
                    </div>
                  )}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-[#E7DED2] flex items-center justify-between gap-2">
                <div>
                  {editingSite && onDeleteSite && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Remove site "${editingSite.name}" permanently from monitored database?`)) {
                          onDeleteSite(editingSite.id);
                          setIsFormModalOpen(false);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#FFEBEE] text-[#C62828] hover:bg-[#FFCDD2] border border-[#FFCDD2] text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Site (हटाएं)</span>
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
                    {editingSite ? 'Save Changes' : 'Create Site / सुरक्षित करें'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADD ZONE MODAL (POPUP WHEN CLICKING "+ New Zone" INSIDE CREATE SITE) */}
      {isQuickZoneModalOpen && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-2xl w-full max-w-sm shadow-2xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#E7DED2]">
              <div className="flex items-center gap-1.5 font-bold text-[#4B3621]">
                <Compass className="w-4 h-4 text-[#6F4E37]" />
                <span>Quick Add Patrol Zone · नया ज़ोन जोड़ें</span>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickZoneModalOpen(false)}
                className="text-[#8B735B] hover:text-[#4B3621]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickAddZone} className="space-y-3">
              <div>
                <label className="block text-[#4B3621] font-semibold mb-1">
                  Zone / Area Name * (ज़ोन का नाम)
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={quickZoneName}
                  onChange={(e) => setQuickZoneName(e.target.value)}
                  placeholder="e.g. Area F - South Tech Park"
                  className="w-full px-2.5 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded text-xs text-[#4B3621] focus:outline-none focus:border-[#6F4E37]"
                />
              </div>

              <div>
                <label className="block text-[#4B3621] font-semibold mb-1">
                  Zone Short Code (ज़ोन कोड - Optional)
                </label>
                <input
                  type="text"
                  value={quickZoneCode}
                  onChange={(e) => setQuickZoneCode(e.target.value)}
                  placeholder="e.g. ZONE-F"
                  className="w-full px-2.5 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded text-xs text-[#4B3621] font-mono focus:outline-none focus:border-[#6F4E37]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E7DED2]">
                <button
                  type="button"
                  onClick={() => setIsQuickZoneModalOpen(false)}
                  className="px-3 py-1 bg-[#F0E8DD] text-[#4B3621] rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 bg-[#6F4E37] text-white rounded font-bold hover:bg-[#5A3E2B]"
                >
                  Add & Select / जोड़ें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEDICATED SITE CHECKLIST MODAL (OPENED FROM SITE CARD) */}
      {selectedSiteForChecklist && (
        <SiteChecklistModal
          site={selectedSiteForChecklist}
          masterLibrary={masterChecklists}
          onSaveSiteChecklist={(siteId, updatedChecklists) => {
            const targetSite = sites.find((s) => s.id === siteId);
            if (targetSite) {
              const updatedSite: Site = {
                ...targetSite,
                checklistTemplates: updatedChecklists
              };
              onSaveSite(updatedSite);
              setActionFeedback(`Checklist for site "${targetSite.name}" updated with ${updatedChecklists.length} checkpoints.`);
              setTimeout(() => setActionFeedback(null), 3500);
            }
          }}
          onClose={() => setSelectedSiteForChecklist(null)}
        />
      )}

      {/* DEDICATED SITE REPORTS DOWNLOAD MODAL (Daily / Weekly / Monthly) */}
      {selectedSiteForDownload && (
        <SiteReportsDownloadModal
          site={selectedSiteForDownload}
          reports={reports}
          assignments={assignments}
          officers={officers}
          onClose={() => setSelectedSiteForDownload(null)}
          onSelectReport={onSelectSiteReport}
        />
      )}

      {/* DEDICATED SITE MAP & GOOGLE MAPS NAVIGATION MODAL */}
      {selectedSiteForMap && (
        <SiteMapModal
          site={selectedSiteForMap}
          onClose={() => setSelectedSiteForMap(null)}
        />
      )}
    </div>
  );
};
