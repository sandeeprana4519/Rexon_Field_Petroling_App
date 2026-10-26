import React, { useState, useMemo } from 'react';
import {
  Compass,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Search,
  Building2,
  Users,
  CheckCircle2,
  AlertTriangle,
  X,
  Layers,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  FileCheck2
} from 'lucide-react';
import { PatrolZone, Site, FieldOfficer } from '../types';

interface PatrolZonesViewProps {
  zones: PatrolZone[];
  sites: Site[];
  officers: FieldOfficer[];
  onCreateZone: (newZone: PatrolZone) => void;
  onUpdateZone: (updatedZone: PatrolZone, oldName: string) => void;
  onDeleteZone: (zoneId: string, reassignToZoneName?: string) => void;
  onNavigateToSitesWithZone?: (zoneName: string) => void;
}

export const PatrolZonesView: React.FC<PatrolZonesViewProps> = ({
  zones,
  sites,
  officers,
  onCreateZone,
  onUpdateZone,
  onDeleteZone,
  onNavigateToSitesWithZone
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<PatrolZone | null>(null);
  const [zoneToDelete, setZoneToDelete] = useState<PatrolZone | null>(null);
  const [reassignZoneName, setReassignZoneName] = useState<string>('');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [expandedZoneId, setExpandedZoneId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: ''
  });

  // Calculate statistics per zone
  const zoneStats = useMemo(() => {
    const stats: Record<string, { sitesCount: number; sitesList: Site[]; officersCount: number }> = {};
    zones.forEach((z) => {
      const matchedSites = sites.filter((s) => s.area.toLowerCase() === z.name.toLowerCase());
      const matchedOfficers = officers.filter((o) => o.area.toLowerCase() === z.name.toLowerCase());
      stats[z.id] = {
        sitesCount: matchedSites.length,
        sitesList: matchedSites,
        officersCount: matchedOfficers.length
      };
    });
    return stats;
  }, [zones, sites, officers]);

  const filteredZones = useMemo(() => {
    if (!searchQuery.trim()) return zones;
    const q = searchQuery.toLowerCase();
    return zones.filter(
      (z) =>
        z.name.toLowerCase().includes(q) ||
        (z.code && z.code.toLowerCase().includes(q)) ||
        (z.description && z.description.toLowerCase().includes(q))
    );
  }, [zones, searchQuery]);

  const openCreateModal = () => {
    setEditingZone(null);
    setFormData({
      name: '',
      code: `ZONE-${String.fromCharCode(65 + (zones.length % 26))}`,
      description: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (zone: PatrolZone) => {
    setEditingZone(zone);
    setFormData({
      name: zone.name,
      code: zone.code || '',
      description: zone.description || ''
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Zone name is required / ज़ोन का नाम आवश्यक है');
      return;
    }

    const trimmedName = formData.name.trim();

    // Check duplicate name
    const isDuplicate = zones.some(
      (z) =>
        z.name.toLowerCase() === trimmedName.toLowerCase() &&
        (!editingZone || z.id !== editingZone.id)
    );

    if (isDuplicate) {
      alert(`A zone named "${trimmedName}" already exists. Please choose a distinct name.`);
      return;
    }

    if (editingZone) {
      const oldName = editingZone.name;
      const updated: PatrolZone = {
        ...editingZone,
        name: trimmedName,
        code: formData.code.trim() || undefined,
        description: formData.description.trim() || undefined
      };
      onUpdateZone(updated, oldName);
      setActionFeedback(`Zone "${trimmedName}" updated successfully. Associated sites were automatically updated.`);
    } else {
      const newZone: PatrolZone = {
        id: `zone-${Date.now()}`,
        name: trimmedName,
        code: formData.code.trim() || `ZONE-${Math.floor(10 + Math.random() * 90)}`,
        description: formData.description.trim() || undefined,
        createdAt: new Date().toISOString()
      };
      onCreateZone(newZone);
      setActionFeedback(`New patrol zone "${trimmedName}" created and added to site creation options.`);
    }

    setIsModalOpen(false);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const confirmDeleteZone = () => {
    if (!zoneToDelete) return;
    const stats = zoneStats[zoneToDelete.id];
    const targetReassign = stats?.sitesCount > 0 ? reassignZoneName : undefined;

    onDeleteZone(zoneToDelete.id, targetReassign);
    setActionFeedback(
      `Zone "${zoneToDelete.name}" removed${
        targetReassign ? ` and its sites reassigned to "${targetReassign}".` : '.'
      }`
    );
    setZoneToDelete(null);
    setReassignZoneName('');
    setTimeout(() => setActionFeedback(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="bg-[#FFFFFF] border border-[#E7DED2] p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#6F4E37]" />
            <h2 className="text-base font-bold text-[#4B3621]">
              Patrol Areas & Zones Console · पेट्रोलिंग एरिया और ज़ोन
            </h2>
            <span className="text-xs font-mono text-[#4B3621] bg-[#F0E8DD] px-2 py-0.5 rounded border border-[#E7DED2]">
              {zones.length} Configured Zones
            </span>
          </div>
          <p className="text-xs text-[#8B735B] mt-0.5">
            Create, edit, or delete operational patrol zones. These zones appear automatically when creating new monitored sites and assigning officers.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#6F4E37] hover:bg-[#5A3E2B] rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Zone / नया ज़ोन बनाएं</span>
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div className="p-3 bg-[#E8F5E9] border border-[#C8E6C9] rounded-xl text-xs text-[#1B5E20] flex items-center gap-2 animate-in fade-in shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-xl p-3.5 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#FAF7F2] border border-[#E7DED2] flex items-center justify-center text-[#6F4E37]">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[#8B735B] font-medium">Total Patrolling Zones / कुल ज़ोन</div>
            <div className="text-lg font-bold text-[#4B3621]">{zones.length}</div>
          </div>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-xl p-3.5 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#FAF7F2] border border-[#E7DED2] flex items-center justify-center text-[#6F4E37]">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[#8B735B] font-medium">Mapped Client Sites / मैप की गई साइट्स</div>
            <div className="text-lg font-bold text-[#4B3621]">{sites.length}</div>
          </div>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-xl p-3.5 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#FAF7F2] border border-[#E7DED2] flex items-center justify-center text-[#6F4E37]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[#8B735B] font-medium">Field Officers Deployed / तैनात अधिकारी</div>
            <div className="text-lg font-bold text-[#4B3621]">{officers.length}</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-xl p-3.5 sm:p-4 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-[#8B735B] absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search zones by name, code or description (e.g. Area A, Industrial, ZONE-B)..."
            className="w-full pl-9 pr-3 py-2 bg-[#FAF7F2] border border-[#E7DED2] rounded-lg text-xs text-[#4B3621] placeholder-[#8B735B]/70 focus:outline-none focus:border-[#6F4E37] focus:bg-[#FFFFFF]"
          />
        </div>
      </div>

      {/* Zones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredZones.map((zone) => {
          const stats = zoneStats[zone.id] || { sitesCount: 0, sitesList: [], officersCount: 0 };
          const isExpanded = expandedZoneId === zone.id;

          return (
            <div
              key={zone.id}
              className="bg-[#FFFFFF] border border-[#E7DED2] rounded-xl p-4 shadow-2xs flex flex-col justify-between hover:border-[#8B735B] transition-all space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#F0E8DD] border border-[#E7DED2] flex items-center justify-center text-[#6F4E37] shrink-0 font-bold text-xs">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#4B3621] leading-tight">
                        {zone.name}
                      </h3>
                      {zone.code && (
                        <span className="inline-block mt-0.5 text-[10px] font-mono text-[#6F4E37] bg-[#F5EFE6] px-1.5 py-0.2 rounded border border-[#E7DED2]">
                          {zone.code}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(zone)}
                      className="p-1.5 text-[#8B735B] hover:text-[#4B3621] hover:bg-[#F0E8DD] rounded-lg transition-colors cursor-pointer"
                      title="Edit Zone"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setZoneToDelete(zone);
                        const otherZone = zones.find((z) => z.id !== zone.id);
                        setReassignZoneName(otherZone ? otherZone.name : '');
                      }}
                      className="p-1.5 text-[#C62828] hover:text-[#B71C1C] hover:bg-[#FFEBEE] rounded-lg transition-colors cursor-pointer"
                      title="Delete Zone"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {zone.description && (
                  <p className="text-xs text-[#8B735B] mt-2 line-clamp-2">
                    {zone.description}
                  </p>
                )}
              </div>

              {/* Stats & Site Preview */}
              <div className="space-y-2 pt-2 border-t border-[#E7DED2]/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8B735B] flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#6F4E37]" />
                    <span>Monitored Sites:</span>
                  </span>
                  <span className="font-bold text-[#4B3621] font-mono">
                    {stats.sitesCount}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8B735B] flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[#6F4E37]" />
                    <span>Assigned Officers:</span>
                  </span>
                  <span className="font-bold text-[#4B3621] font-mono">
                    {stats.officersCount}
                  </span>
                </div>

                {stats.sitesCount > 0 && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setExpandedZoneId(isExpanded ? null : zone.id)}
                      className="w-full text-left text-[11px] font-semibold text-[#6F4E37] hover:text-[#4B3621] flex items-center justify-between cursor-pointer py-1"
                    >
                      <span>
                        {isExpanded ? 'Hide Assigned Sites' : `View ${stats.sitesCount} Assigned Sites`}
                      </span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>

                    {isExpanded && (
                      <div className="mt-1.5 space-y-1 max-h-32 overflow-y-auto p-2 bg-[#FAF7F2] rounded-lg border border-[#E7DED2] text-[11px]">
                        {stats.sitesList.map((site) => (
                          <div key={site.id} className="flex items-center justify-between text-[#4B3621]">
                            <span className="truncate pr-2 font-medium">{site.name}</span>
                            <span className="text-[10px] text-[#8B735B] shrink-0 font-mono">{site.code}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Quick Button */}
              {onNavigateToSitesWithZone && (
                <button
                  type="button"
                  onClick={() => onNavigateToSitesWithZone(zone.name)}
                  className="w-full py-1.5 px-2.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#4B3621] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-[#E7DED2] cursor-pointer"
                >
                  <span>Filter Sites in this Zone</span>
                  <ArrowRight className="w-3 h-3 text-[#6F4E37]" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {filteredZones.length === 0 && (
        <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-xl p-8 text-center space-y-3">
          <Compass className="w-10 h-10 text-[#8B735B] mx-auto" />
          <h4 className="text-sm font-bold text-[#4B3621]">No Patrol Zones Found</h4>
          <p className="text-xs text-[#8B735B] max-w-sm mx-auto">
            {searchQuery
              ? `No zones match the search "${searchQuery}". Try a different keyword or create a new zone.`
              : 'No patrol zones have been created yet. Click below to add your first zone.'}
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#6F4E37] hover:bg-[#5A3E2B] rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Zone</span>
          </button>
        </div>
      )}

      {/* CREATE / EDIT ZONE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#E7DED2] bg-[#FAF7F2] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#6F4E37]" />
                <h3 className="text-sm font-bold text-[#4B3621]">
                  {editingZone ? `Edit Zone: ${editingZone.name}` : 'Create New Patrol Area / Zone · नया ज़ोन बनाएं'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#8B735B] hover:text-[#4B3621] p-1 rounded-lg hover:bg-[#F0E8DD]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-4 sm:p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[#4B3621] mb-1 font-semibold">
                  Zone / Area Name * (ज़ोन या एरिया का नाम)
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Area F - South Tech Park or Zone 6 - Airport Cargo"
                  className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-none focus:border-[#6F4E37]"
                />
                <p className="text-[11px] text-[#8B735B] mt-1">
                  This name will appear in the "Patrol Area / Zone" dropdown when registering or editing client sites.
                </p>
              </div>

              <div>
                <label className="block text-[#4B3621] mb-1 font-semibold">
                  Zone Short Code (ज़ोन कोड - Optional)
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. ZONE-F or SEC-06"
                  className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] font-mono focus:outline-none focus:border-[#6F4E37]"
                />
              </div>

              <div>
                <label className="block text-[#4B3621] mb-1 font-semibold">
                  Sector Description & Boundaries (विवरण - Optional)
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe landmarks, city sector, or perimeter boundaries included in this patrol zone..."
                  className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E7DED2] rounded-lg text-[#4B3621] focus:outline-none focus:border-[#6F4E37]"
                />
              </div>

              <div className="pt-3 border-t border-[#E7DED2] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#F0E8DD] text-[#4B3621] hover:bg-[#E8D8C5] transition-colors cursor-pointer font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#6F4E37] hover:bg-[#5A3E2B] text-white font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  {editingZone ? 'Save Changes' : 'Create Zone / सुरक्षित करें'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {zoneToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col p-5 space-y-4 text-xs">
            <div className="flex items-center gap-3 text-[#C62828]">
              <div className="w-9 h-9 rounded-full bg-[#FFEBEE] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-[#C62828]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#4B3621]">
                  Delete Patrol Zone: {zoneToDelete.name}?
                </h3>
                <p className="text-xs text-[#8B735B]">
                  Are you sure you want to remove this patrol zone?
                </p>
              </div>
            </div>

            {zoneStats[zoneToDelete.id]?.sitesCount > 0 && (
              <div className="p-3 bg-[#FEF3C7] border border-[#FDE68A] rounded-xl text-[#92400E] space-y-2">
                <p className="font-semibold">
                  Notice: {zoneStats[zoneToDelete.id].sitesCount} site(s) currently belong to this zone.
                </p>
                <label className="block text-xs text-[#78350F]">
                  Reassign existing sites to another zone:
                </label>
                <select
                  value={reassignZoneName}
                  onChange={(e) => setReassignZoneName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#FFFFFF] border border-[#F59E0B] rounded-lg text-[#78350F] font-semibold cursor-pointer"
                >
                  {zones
                    .filter((z) => z.id !== zoneToDelete.id)
                    .map((z) => (
                      <option key={z.id} value={z.name}>
                        {z.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E7DED2]">
              <button
                type="button"
                onClick={() => setZoneToDelete(null)}
                className="px-3.5 py-1.5 rounded-lg bg-[#F0E8DD] text-[#4B3621] hover:bg-[#E8D8C5] transition-colors cursor-pointer font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteZone}
                className="px-4 py-1.5 rounded-lg bg-[#C62828] hover:bg-[#B71C1C] text-white font-bold transition-colors cursor-pointer shadow-2xs"
              >
                Delete Zone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
