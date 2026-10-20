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
  Filter
} from 'lucide-react';
import { Site, SiteType, PatrolReport, ChecklistItem } from '../types';
import { DEMO_AREAS } from '../data/demoData';

interface SitesViewProps {
  sites: Site[];
  reports: PatrolReport[];
  masterChecklists: ChecklistItem[];
  onSaveSite: (site: Site) => void;
  onToggleSiteStatus: (siteId: string) => void;
  onSelectSiteReport: (report: PatrolReport) => void;
  onOpenChecklistManager: () => void;
}

export const SitesView: React.FC<SitesViewProps> = ({
  sites,
  reports,
  masterChecklists,
  onSaveSite,
  onToggleSiteStatus,
  onSelectSiteReport,
  onOpenChecklistManager
}) => {
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('all');
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'deactivated'>('all');
  const [selectedType, setSelectedType] = useState<'all' | SiteType>('all');

  // Modal State for Create / Edit
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    clientName: '',
    siteType: 'factory' as SiteType,
    address: '',
    area: DEMO_AREAS[0] as string,
    contactPerson: '',
    contactPhone: '',
    patrolFrequency: '2x per shift',
    lat: '',
    lng: '',
    geofenceRadiusMeters: 50,
    selectedChecklistIds: [] as string[]
  });

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
      if (selectedArea !== 'all' && site.area !== selectedArea) {
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
    setFormData({
      name: '',
      clientName: '',
      siteType: 'factory',
      address: '',
      area: DEMO_AREAS[0],
      contactPerson: '',
      contactPhone: '',
      patrolFrequency: '2x per shift',
      lat: '37.7842',
      lng: '-122.3965',
      geofenceRadiusMeters: 60,
      selectedChecklistIds: masterChecklists.slice(0, 4).map((c) => c.id)
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (site: Site) => {
    setEditingSite(site);
    const existingChecklistIds =
      site.checklistTemplates && site.checklistTemplates.length > 0
        ? site.checklistTemplates.map((c) => c.id)
        : masterChecklists.slice(0, 3).map((c) => c.id);

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
      selectedChecklistIds: existingChecklistIds
    });
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.clientName.trim() || !formData.address.trim()) {
      alert('Please fill in all required fields: Site Name, Client Name, and Address.');
      return;
    }

    const assignedTemplates = masterChecklists.filter((chk) =>
      formData.selectedChecklistIds.includes(chk.id)
    );

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
        lat: formData.lat ? parseFloat(formData.lat) : undefined,
        lng: formData.lng ? parseFloat(formData.lng) : undefined
      },
      securityStatus: editingSite ? editingSite.securityStatus : 'normal',
      isActive: editingSite ? editingSite.isActive : true,
      requiredDailyPatrols: editingSite ? editingSite.requiredDailyPatrols : 6,
      completedPatrolsToday: editingSite ? editingSite.completedPatrolsToday : 0,
      activeOfficersCount: editingSite ? editingSite.activeOfficersCount : 0,
      checklistTemplates: assignedTemplates.length > 0 ? assignedTemplates : masterChecklists.slice(0, 4),
      incidentCount: editingSite ? editingSite.incidentCount : 0,
      lastPatrolTime: editingSite ? editingSite.lastPatrolTime : 'None today'
    };

    onSaveSite(siteToSave);
    setIsFormModalOpen(false);
    setActionFeedback(
      editingSite
        ? `Site "${siteToSave.name}" details updated successfully.`
        : `Site "${siteToSave.name}" registered into security network.`
    );
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const toggleChecklistSelection = (id: string) => {
    setFormData((prev) => {
      const exists = prev.selectedChecklistIds.includes(id);
      return {
        ...prev,
        selectedChecklistIds: exists
          ? prev.selectedChecklistIds.filter((item) => item !== id)
          : [...prev.selectedChecklistIds, id]
      };
    });
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
            Register client properties, edit site parameters, patrol frequency, and configure assigned inspection checklists
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenChecklistManager}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#4B3621] hover:text-[#2E1F14] bg-[#F0E8DD] hover:bg-[#E8D8C5] border border-[#E7DED2] rounded-lg transition-colors cursor-pointer shadow-2xs"
            title="Configure Checklist Inspection Templates"
          >
            <ListChecks className="w-3.5 h-3.5 text-[#6F4E37]" />
            <span>Manage Checklists</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#6F4E37] hover:bg-[#5A3E2B] rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Site</span>
          </button>
        </div>
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

          {/* Area Filter */}
          <div>
            <label className="block text-[#4B3621] font-semibold text-[11px] mb-1">Area / Zone</label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-none focus:border-[#6F4E37] cursor-pointer"
            >
              <option value="all">All Areas ({DEMO_AREAS.length})</option>
              {DEMO_AREAS.map((a) => (
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

      {/* Sites Card Grid */}
      {filteredSites.length === 0 ? (
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
                    <div className="text-[11px] text-[#8B735B] pl-5">
                      Zone: <strong className="text-[#4B3621] font-semibold">{site.area}</strong>
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
                      <div className="font-bold text-[#4B3621]">
                        {checklistCount} Configured
                      </div>
                    </div>
                  </div>

                  {/* Contact details */}
                  <div className="p-2.5 rounded-lg bg-[#FAF7F2] border border-[#E7DED2] space-y-1 text-[11px] text-[#8B735B]">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-[#6F4E37]" />
                        <strong className="text-[#4B3621] font-semibold">{site.contactPerson}</strong>
                      </span>
                      <span className="text-[#8B735B] font-mono">{site.contactPhone}</span>
                    </div>

                    {site.coordinates?.lat && site.coordinates?.lng ? (
                      <div className="flex items-center gap-1 text-[10px] font-mono text-[#1B5E20] pt-1 border-t border-[#E7DED2]">
                        <Compass className="w-3 h-3" />
                        <span>GPS: {site.coordinates.lat.toFixed(4)}°N, {site.coordinates.lng.toFixed(4)}°W</span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-[#8B735B] pt-1 border-t border-[#E7DED2]">
                        GPS Coordinates: Centroid geofence ({site.geofenceRadiusMeters}m radius)
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2.5 border-t border-[#E7DED2] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(site)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-[#F0E8DD] hover:bg-[#E8D8C5] text-[#4B3621] border border-[#E7DED2] transition-colors cursor-pointer shadow-2xs"
                  >
                    <Edit className="w-3 h-3 text-[#6F4E37]" />
                    <span>Edit Site</span>
                  </button>

                  {siteReport ? (
                    <button
                      type="button"
                      onClick={() => onSelectSiteReport(siteReport)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#1B5E20] border border-[#C8E6C9] transition-colors cursor-pointer shadow-2xs"
                    >
                      <FileCheck2 className="w-3 h-3" />
                      <span>View Checkpoints</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-[#8B735B] italic">No report today</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Site Modal Form */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
          <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-[#4B3621]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#E7DED2] bg-[#FAF7F2] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#6F4E37]" />
                <h3 className="text-sm font-bold text-[#4B3621]">
                  {editingSite ? `Edit Site: ${editingSite.name}` : 'Create New Monitored Site'}
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

                {/* 4. Area */}
                <div>
                  <label className="block text-[#4B3621] mb-1 font-semibold">Patrol Area / Zone *</label>
                  <select
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-none focus:border-[#6F4E37] cursor-pointer"
                  >
                    {DEMO_AREAS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
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

              {/* Optional Map Coordinates */}
              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E7DED2] space-y-2">
                <div className="flex items-center justify-between text-[#4B3621] font-bold text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-[#6F4E37]" />
                    <span>Map Coordinates & Geofence (Optional)</span>
                  </span>
                  <span className="text-[#8B735B] text-[10px] font-mono">Demo Geofence</span>
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

              {/* 8. Assigned Checklist Configuration */}
              <div className="space-y-2 pt-1 border-t border-[#E7DED2]">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#4B3621]">
                    Assigned Inspection Checkpoints ({formData.selectedChecklistIds.length} Selected)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const allIds = masterChecklists.map((c) => c.id);
                      setFormData({
                        ...formData,
                        selectedChecklistIds:
                          formData.selectedChecklistIds.length === allIds.length ? [] : allIds
                      });
                    }}
                    className="text-[#6F4E37] font-semibold hover:underline text-[11px] cursor-pointer"
                  >
                    {formData.selectedChecklistIds.length === masterChecklists.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg">
                  {masterChecklists.map((chk) => {
                    const isChecked = formData.selectedChecklistIds.includes(chk.id);
                    return (
                      <label
                        key={chk.id}
                        className="flex items-center gap-2 p-1.5 rounded hover:bg-[#F0E8DD] cursor-pointer select-none text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleChecklistSelection(chk.id)}
                          className="w-4 h-4 rounded border-[#E7DED2] text-[#6F4E37] focus:ring-0 cursor-pointer"
                        />
                        <span className={`flex-1 font-medium ${isChecked ? 'text-[#4B3621]' : 'text-[#8B735B]'}`}>
                          {chk.title}
                        </span>
                        <span className="text-[10px] font-mono text-[#8B735B] bg-[#FFFFFF] border border-[#E7DED2] px-1.5 py-0.5 rounded">
                          {chk.category}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-[#E7DED2] flex items-center justify-end gap-2">
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
                  {editingSite ? 'Save Changes' : 'Create Site'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
