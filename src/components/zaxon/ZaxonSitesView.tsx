import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  Compass,
  Phone,
  User,
  Clock,
  ListChecks,
  CheckCircle2,
  Shield,
  Layers,
  ChevronRight,
  Navigation
} from 'lucide-react';
import { Site, ChecklistItem } from '../../types';
import { getCallUrl, getWhatsAppUrl, WhatsAppIcon } from '../../utils/contactUtils';
import { getGoogleMapsNavUrl } from '../../utils/mapUtils';

interface ZaxonSitesViewProps {
  sites: Site[];
}

export const ZaxonSitesView: React.FC<ZaxonSitesViewProps> = ({ sites }) => {
  const [selectedSiteForChecklist, setSelectedSiteForChecklist] = useState<Site | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#E7DED2] rounded-2xl p-5 shadow-2xs">
        <h2 className="text-base font-bold text-[#4B3621]">
          Registered Company Facilities ({sites.length})
        </h2>
        <p className="text-xs text-[#8B735B] mt-0.5">
          Authorized plant, warehouse, and office premises monitored under your security contract.
        </p>
      </div>

      {/* Sites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sites.length === 0 ? (
          <div className="col-span-full p-10 bg-white border border-[#E7DED2] rounded-2xl text-center text-xs text-[#8B735B]">
            No sites registered under this account yet.
          </div>
        ) : (
          sites.map((site) => {
            const checkpoints = site.checklistTemplates || [];
            const isNominal = site.securityStatus !== 'incident_reported';

            return (
              <div
                key={site.id}
                className="bg-white border border-[#E7DED2] rounded-2xl p-5 space-y-4 shadow-2xs hover:border-[#8B735B] transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-mono text-[10px] font-bold text-[#8B735B] bg-[#F0E8DD] px-1.5 py-0.5 rounded border border-[#E7DED2] uppercase">
                        {site.code}
                      </span>
                      <h3 className="text-sm font-bold text-[#4B3621] mt-1 truncate" title={site.name}>
                        {site.name}
                      </h3>
                      <p className="text-[11px] text-[#8B735B] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#6F4E37] shrink-0" />
                        <span className="truncate">{site.address}</span>
                      </p>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border shrink-0 ${
                      isNominal
                        ? 'bg-[#E8F5E9] text-[#1B5E20] border-[#C8E6C9]'
                        : 'bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]'
                    }`}>
                      {isNominal ? 'Nominal' : 'Incident'}
                    </span>
                  </div>

                  {/* Geofence & GPS specs */}
                  <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E7DED2] space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[#8B735B]">
                      <span>Geofence Boundary:</span>
                      <strong className="text-[#4B3621] font-mono">{site.geofenceRadiusMeters}m radius</strong>
                    </div>

                    {site.coordinates?.lat && site.coordinates?.lng ? (
                      <div className="flex items-center justify-between text-[#8B735B]">
                        <span>GPS Coordinates:</span>
                        <span className="text-[#1B5E20] font-mono text-[11px]">
                          {site.coordinates.lat.toFixed(4)}°N, {site.coordinates.lng.toFixed(4)}°W
                        </span>
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between text-[#8B735B]">
                      <span>Patrol Frequency:</span>
                      <strong className="text-[#4B3621]">{site.patrolFrequency || '2x per shift'}</strong>
                    </div>
                  </div>

                  {/* Contact person */}
                  <div className="space-y-1 text-xs text-[#8B735B]">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-[#6F4E37]" />
                        <span>Premises Lead:</span>
                      </span>
                      <strong className="text-[#4B3621]">{site.contactPerson}</strong>
                    </div>

                    {site.contactPhone && (
                      <div className="pt-1.5 border-t border-[#E7DED2] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#4B3621] font-semibold">
                          <Phone className="w-3.5 h-3.5 text-[#6F4E37] shrink-0" />
                          <span>{site.contactPhone}</span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <a
                            href={getCallUrl(site.contactPhone)}
                            className="p-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2] transition-colors cursor-pointer"
                            title={`Call ${site.contactPerson || 'Site Contact'}`}
                          >
                            <Phone className="w-3 h-3 text-[#6F4E37]" />
                          </a>
                          <a
                            href={getWhatsAppUrl(site.contactPhone, `Hello ${site.contactPerson || ''}, contacting regarding security operations at ${site.name}.`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] border border-[#25D366]/30 transition-colors cursor-pointer"
                            title="Chat on WhatsApp"
                          >
                            <WhatsAppIcon className="w-3 h-3 text-[#25D366]" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom buttons */}
                <div className="pt-3 border-t border-[#E7DED2] flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <a
                    href={getGoogleMapsNavUrl(site)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                    title="Open turn-by-turn navigation in Google Maps"
                  >
                    <Navigation className="w-3.5 h-3.5 text-white fill-white" />
                    <span>Google Maps नेविगेशन</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setSelectedSiteForChecklist(site)}
                    className="py-2 px-3 bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#4B3621] text-xs font-bold rounded-xl border border-[#E7DED2] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <ListChecks className="w-3.5 h-3.5 text-[#6F4E37]" />
                    <span>Checklist ({checkpoints.length})</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Checkpoints Modal */}
      {selectedSiteForChecklist && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#E7DED2] rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-[#E7DED2] pb-3">
              <div>
                <span className="text-[10px] font-mono text-[#8B735B] uppercase font-bold">
                  FACILITY CHECKLIST SPECIFICATION
                </span>
                <h3 className="text-base font-bold text-[#4B3621] mt-0.5">
                  {selectedSiteForChecklist.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSiteForChecklist(null)}
                className="text-[#8B735B] hover:text-[#4B3621] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#8B735B]">
              Field officers are required to inspect and verify each checkpoint on every scheduled patrol.
            </p>

            <div className="max-h-72 overflow-y-auto divide-y divide-[#E7DED2] border border-[#E7DED2] rounded-xl bg-[#FAF7F2]">
              {(selectedSiteForChecklist.checklistTemplates || []).map((cp, idx) => (
                <div key={cp.id} className="p-3 text-xs space-y-0.5 bg-white">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#FAF7F2] border border-[#E7DED2] text-[#6F4E37] font-bold text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-[#4B3621]">{cp.title || cp.label}</span>
                  </div>
                  {(cp.description || cp.notes) && (
                    <p className="text-[11px] text-[#8B735B] pl-7">{cp.description || cp.notes}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedSiteForChecklist(null)}
                className="px-4 py-2 bg-[#6F4E37] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
