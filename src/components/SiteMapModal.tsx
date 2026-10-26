import React from 'react';
import {
  X,
  MapPin,
  Building2,
  Navigation,
  ExternalLink,
  Phone,
  Compass,
  Shield,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Site } from '../types';
import { SiteInteractiveMap } from './SiteInteractiveMap';
import { getGoogleMapsNavUrl, getGoogleMapsViewUrl, getFallbackCoordinatesForSite } from '../utils/mapUtils';
import { getCallUrl, getWhatsAppUrl, WhatsAppIcon } from '../utils/contactUtils';

interface SiteMapModalProps {
  site: Site;
  officerName?: string;
  onClose: () => void;
}

export const SiteMapModal: React.FC<SiteMapModalProps> = ({ site, officerName, onClose }) => {
  const coordinates = getFallbackCoordinatesForSite(site);
  const googleMapsNavUrl = getGoogleMapsNavUrl(site);
  const googleMapsViewUrl = getGoogleMapsViewUrl(site);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-[#FFFFFF] border border-[#E7DED2] rounded-2xl w-full max-w-2xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-[#4B3621]">
        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 border-b border-[#E7DED2] bg-[#FAF7F2] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#6F4E37] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Compass className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono uppercase font-bold text-[#8B735B] px-1.5 py-0.2 rounded bg-[#FFFFFF] border border-[#E7DED2]">
                  {site.code}
                </span>
                <span className="text-xs text-[#8B735B]">·</span>
                <span className="text-xs font-semibold text-[#8B735B] truncate">{site.area}</span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-[#4B3621] truncate mt-0.5">
                {site.name}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#8B735B] hover:text-[#4B3621] hover:bg-[#F0E8DD] border border-transparent hover:border-[#E7DED2] transition-colors cursor-pointer shrink-0"
            aria-label="Close Map Dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4">
          {/* High Priority One-Tap Google Maps Navigation Banner */}
          <div className="bg-gradient-to-r from-[#1A73E8]/10 via-[#1A73E8]/5 to-transparent border border-[#1A73E8]/30 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3 w-full sm:w-auto min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#1A73E8] text-white flex items-center justify-center shrink-0 shadow-md">
                <Navigation className="w-5 h-5 text-white fill-white" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold text-[#1A73E8]">
                  गूगल मैप्स लाइव नेविगेशन (Live Turn-by-Turn)
                </div>
                <div className="text-[11px] text-[#4B3621] mt-0.5 font-medium">
                  क्लिक करते ही Google Maps में इस साइट का सीधा रास्ता और लाइव दिशा-निर्देश खुल जाएंगे।
                </div>
              </div>
            </div>

            <a
              href={googleMapsNavUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all shrink-0 cursor-pointer"
            >
              <Navigation className="w-4 h-4 text-white fill-white" />
              <span>Open Google Maps Navigation</span>
            </a>
          </div>

          {/* Embedded Interactive Map */}
          <div>
            <SiteInteractiveMap
              site={site}
              heightClass="h-72 sm:h-96"
              showNavigationButton={false}
              officerName={officerName}
            />
          </div>

          {/* Facility Location & Access Details Card */}
          <div className="bg-[#FAF7F2] border border-[#E7DED2] rounded-xl p-3.5 space-y-2.5 text-xs">
            <div className="flex items-start gap-2 text-xs">
              <MapPin className="w-4 h-4 text-[#6F4E37] shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-bold text-[#4B3621] block">Physical Facility Address:</span>
                <span className="text-[#8B735B] mt-0.5 block leading-relaxed">{site.address}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[#E7DED2]/70 text-[11px]">
              <div>
                <span className="text-[#8B735B]">GPS Coordinates: </span>
                <span className="font-mono font-bold text-[#4B3621]">
                  {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}
                </span>
              </div>
              <div>
                <span className="text-[#8B735B]">Geofence Radius: </span>
                <span className="font-mono font-bold text-[#1B5E20]">
                  {site.geofenceRadiusMeters || 50} Meters
                </span>
              </div>
            </div>

            {/* Site Contact Person */}
            {site.contactPerson && (
              <div className="pt-2 border-t border-[#E7DED2]/70 flex items-center justify-between gap-2">
                <div className="text-[11px]">
                  <span className="text-[#8B735B]">Site Incharge: </span>
                  <strong className="text-[#4B3621]">{site.contactPerson}</strong>
                  {site.contactPhone && (
                    <span className="font-mono text-[#8B735B] ml-1">({site.contactPhone})</span>
                  )}
                </div>

                {site.contactPhone && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={getCallUrl(site.contactPhone)}
                      className="p-1.5 rounded-lg bg-white hover:bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2] transition-colors"
                      title={`Call ${site.contactPerson}`}
                    >
                      <Phone className="w-3.5 h-3.5 text-[#6F4E37]" />
                    </a>
                    <a
                      href={getWhatsAppUrl(site.contactPhone, `नमस्ते ${site.contactPerson} जी, मैं REXON फील्ड ऑफिसर आपकी साइट ${site.name} पर पहुँचने के लिए मैप नेविगेशन पर हूँ।`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] border border-[#25D366]/30 transition-colors"
                      title={`WhatsApp ${site.contactPerson}`}
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Actions Footer */}
        <div className="p-3 sm:p-4 border-t border-[#E7DED2] bg-[#FAF7F2] flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={googleMapsViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2] text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#6F4E37]" />
              <span>Open in Google Maps Browser</span>
            </a>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#F0E8DD] hover:bg-[#E8D8C5] text-[#4B3621] text-xs font-bold transition-colors cursor-pointer"
            >
              बंद करें (Close)
            </button>
            <a
              href={googleMapsNavUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
            >
              <Navigation className="w-4 h-4 text-white fill-white" />
              <span>नेविगेट करें (Navigate)</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
