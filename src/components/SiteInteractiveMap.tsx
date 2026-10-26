import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Compass,
  Navigation,
  ExternalLink,
  Layers,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Shield,
  User,
  Info,
  Maximize2
} from 'lucide-react';
import { Site } from '../types';
import {
  getGoogleMapsNavUrl,
  getGoogleMapsViewUrl,
  getFallbackCoordinatesForSite,
  calculateDistanceMeters,
  formatDistance
} from '../utils/mapUtils';

interface SiteInteractiveMapProps {
  site: Site;
  officerLocation?: { lat: number; lng: number };
  officerName?: string;
  heightClass?: string;
  showNavigationButton?: boolean;
  onExpandFullscreen?: () => void;
  className?: string;
}

export const SiteInteractiveMap: React.FC<SiteInteractiveMapProps> = ({
  site,
  officerLocation,
  officerName,
  heightClass = 'h-72 sm:h-80',
  showNavigationButton = true,
  onExpandFullscreen,
  className = ''
}) => {
  const [mapLayer, setMapLayer] = useState<'osm' | 'satellite' | 'google_embed'>('osm');
  const [zoomLevel, setZoomLevel] = useState<number>(16);

  // Resolved coordinates
  const coordinates = useMemo(() => {
    return getFallbackCoordinatesForSite(site);
  }, [site]);

  // Officer coordinates (defaults slightly offset from site centroid if not provided)
  const effectiveOfficerLocation = useMemo(() => {
    if (officerLocation && officerLocation.lat != null && officerLocation.lng != null) {
      return officerLocation;
    }
    // Simulate officer nearby (~60m away)
    return {
      lat: coordinates.lat + 0.00045,
      lng: coordinates.lng + 0.00035
    };
  }, [officerLocation, coordinates]);

  // Distance in meters between officer and site
  const distanceToSiteMeters = useMemo(() => {
    return calculateDistanceMeters(
      effectiveOfficerLocation.lat,
      effectiveOfficerLocation.lng,
      coordinates.lat,
      coordinates.lng
    );
  }, [effectiveOfficerLocation, coordinates]);

  const isInsideGeofence = distanceToSiteMeters <= (site.geofenceRadiusMeters || 50);

  // Google Maps navigation & view URLs
  const googleMapsNavUrl = useMemo(() => getGoogleMapsNavUrl(site), [site]);
  const googleMapsViewUrl = useMemo(() => getGoogleMapsViewUrl(site), [site]);

  // Bounding box for OpenStreetMap embed
  const bbox = useMemo(() => {
    const delta = 0.0035 * (17 / zoomLevel);
    const minLng = coordinates.lng - delta;
    const minLat = coordinates.lat - delta;
    const maxLng = coordinates.lng + delta;
    const maxLat = coordinates.lat + delta;
    return `${minLng},${minLat},${maxLng},${maxLat}`;
  }, [coordinates, zoomLevel]);

  return (
    <div className={`relative bg-[#FAF7F2] border border-[#E7DED2] rounded-2xl overflow-hidden shadow-2xs flex flex-col ${className}`}>
      {/* Top Map Header Strip */}
      <div className="bg-[#FFFFFF] px-3 sm:px-4 py-2 border-b border-[#E7DED2] flex flex-wrap items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-[#6F4E37] text-white flex items-center justify-center shrink-0">
            <MapPin className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#4B3621] truncate flex items-center gap-1.5">
              <span>{site.name}</span>
              <span className="text-[10px] font-mono text-[#8B735B] bg-[#FAF7F2] px-1.5 py-0.2 rounded border border-[#E7DED2] shrink-0">
                {site.code}
              </span>
            </div>
            <div className="text-[10px] font-mono text-[#8B735B] truncate">
              {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)} · Geofence: {site.geofenceRadiusMeters || 50}m
            </div>
          </div>
        </div>

        {/* Map Layer Mode & Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="bg-[#FAF7F2] border border-[#E7DED2] rounded-lg p-0.5 flex items-center text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setMapLayer('osm')}
              className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                mapLayer === 'osm' ? 'bg-[#6F4E37] text-white shadow-2xs' : 'text-[#8B735B] hover:text-[#4B3621]'
              }`}
            >
              Street
            </button>
            <button
              type="button"
              onClick={() => setMapLayer('satellite')}
              className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                mapLayer === 'satellite' ? 'bg-[#6F4E37] text-white shadow-2xs' : 'text-[#8B735B] hover:text-[#4B3621]'
              }`}
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => setMapLayer('google_embed')}
              className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                mapLayer === 'google_embed' ? 'bg-[#6F4E37] text-white shadow-2xs' : 'text-[#8B735B] hover:text-[#4B3621]'
              }`}
            >
              Google View
            </button>
          </div>

          {onExpandFullscreen && (
            <button
              type="button"
              onClick={onExpandFullscreen}
              className="p-1 rounded-lg text-[#8B735B] hover:text-[#4B3621] bg-[#FAF7F2] hover:bg-[#F0E8DD] border border-[#E7DED2] cursor-pointer"
              title="Expand Fullscreen Map"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Map Viewport */}
      <div className={`relative w-full ${heightClass} bg-[#EBE7E0] overflow-hidden`}>
        {mapLayer === 'osm' && (
          <iframe
            title={`OpenStreetMap for ${site.name}`}
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${coordinates.lat}%2C${coordinates.lng}`}
            className="w-full h-full border-0 pointer-events-auto"
            loading="lazy"
          />
        )}

        {mapLayer === 'satellite' && (
          <iframe
            title={`Satellite View for ${site.name}`}
            src={`https://maps.google.com/maps?q=${coordinates.lat},${coordinates.lng}&t=k&z=${zoomLevel}&ie=UTF8&iwloc=&output=embed`}
            className="w-full h-full border-0 pointer-events-auto"
            loading="lazy"
          />
        )}

        {mapLayer === 'google_embed' && (
          <iframe
            title={`Google Map View for ${site.name}`}
            src={`https://maps.google.com/maps?q=${coordinates.lat},${coordinates.lng}&z=${zoomLevel}&ie=UTF8&iwloc=&output=embed`}
            className="w-full h-full border-0 pointer-events-auto"
            loading="lazy"
          />
        )}

        {/* Floating Proximity & Geofence Badge */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1.5 pointer-events-none">
          <div className="bg-[#FFFFFF]/95 backdrop-blur-xs border border-[#E7DED2] rounded-xl px-2.5 py-1.5 shadow-md flex items-center gap-2 text-xs">
            <span className={`w-2 h-2 rounded-full shrink-0 ${isInsideGeofence ? 'bg-[#2E7D32] animate-pulse' : 'bg-[#D97706]'}`} />
            <div className="text-[11px]">
              <span className="text-[#8B735B]">Distance to site: </span>
              <strong className={isInsideGeofence ? 'text-[#1B5E20]' : 'text-[#4B3621]'}>
                ~{formatDistance(distanceToSiteMeters)}
              </strong>
              {isInsideGeofence && (
                <span className="ml-1 text-[9px] font-bold uppercase font-mono px-1 py-0.2 bg-[#E8F5E9] text-[#1B5E20] rounded border border-[#C8E6C9]">
                  Inside Geofence
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Zoom Controls Overlay */}
        <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1 shadow-md">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(z + 1, 19))}
            className="w-7 h-7 rounded-lg bg-white hover:bg-[#FAF7F2] text-[#4B3621] border border-[#E7DED2] flex items-center justify-center font-bold text-sm cursor-pointer shadow-xs"
            title="Zoom In"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(z - 1, 12))}
            className="w-7 h-7 rounded-lg bg-white hover:bg-[#FAF7F2] text-[#4B3621] border border-[#E7DED2] flex items-center justify-center font-bold text-sm cursor-pointer shadow-xs"
            title="Zoom Out"
          >
            -
          </button>
        </div>
      </div>

      {/* Bottom Action Footer with Direct Google Maps Navigation Button */}
      {showNavigationButton && (
        <div className="bg-[#FFFFFF] p-3 border-t border-[#E7DED2] flex flex-col sm:flex-row items-center justify-between gap-2.5 z-10">
          <div className="flex items-center gap-2 text-xs text-[#8B735B] w-full sm:w-auto">
            <Compass className="w-3.5 h-3.5 text-[#6F4E37] shrink-0" />
            <span className="truncate text-[#4B3621] font-medium">
              {site.address}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <a
              href={googleMapsViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#4B3621] border border-[#E7DED2] text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
              title="Open site location on Google Maps"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#6F4E37]" />
              <span>View Map</span>
            </a>

            <a
              href={googleMapsNavUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-bold transition-all shadow-md cursor-pointer hover:shadow-lg"
              title="Open turn-by-turn navigation in Google Maps App"
            >
              <Navigation className="w-4 h-4 text-white fill-white" />
              <span>Google Maps नेविगेशन शुरू करें</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
