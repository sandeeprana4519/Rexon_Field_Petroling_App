import { Site } from '../types';

/**
 * Returns a Google Maps turn-by-turn navigation URL for the specified site.
 * Opens directly in the Google Maps app on iOS/Android or in browser on desktop.
 */
export function getGoogleMapsNavUrl(site: {
  coordinates?: { lat?: number; lng?: number };
  address?: string;
  name?: string;
}): string {
  if (site.coordinates?.lat != null && site.coordinates?.lng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${site.coordinates.lat},${site.coordinates.lng}`;
  }
  const query = [site.name, site.address].filter(Boolean).join(', ');
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query || 'Current Location')}`;
}

/**
 * Returns a Google Maps place search/view URL for the specified site.
 */
export function getGoogleMapsViewUrl(site: {
  coordinates?: { lat?: number; lng?: number };
  address?: string;
  name?: string;
}): string {
  if (site.coordinates?.lat != null && site.coordinates?.lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${site.coordinates.lat},${site.coordinates.lng}`;
  }
  const query = [site.name, site.address].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || 'Security Site')}`;
}

/**
 * Calculates Haversine distance between two coordinates in meters.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius of Earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Formats a distance in meters to a human-readable string.
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Fallback coordinate resolver for demo zones if site has no coordinates
 */
export function getFallbackCoordinatesForSite(site: Partial<Site>): { lat: number; lng: number } {
  if (site.coordinates?.lat != null && site.coordinates?.lng != null) {
    return { lat: site.coordinates.lat, lng: site.coordinates.lng };
  }
  
  // Coordinate defaults by Zone name
  const zone = (site.area || '').toLowerCase();
  if (zone.includes('north') || zone.includes('area a')) {
    return { lat: 37.7842, lng: -122.3965 };
  }
  if (zone.includes('downtown') || zone.includes('area b')) {
    return { lat: 37.7915, lng: -122.4012 };
  }
  if (zone.includes('westside') || zone.includes('area c')) {
    return { lat: 37.7785, lng: -122.4178 };
  }
  if (zone.includes('port') || zone.includes('area d')) {
    return { lat: 37.7952, lng: -122.3879 };
  }
  if (zone.includes('east') || zone.includes('area e')) {
    return { lat: 37.7712, lng: -122.3895 };
  }
  if (zone.includes('adarsh') || zone.includes('आदर्श')) {
    return { lat: 28.7155, lng: 77.1685 };
  }
  if (zone.includes('khandkam') || zone.includes('खंडकाम')) {
    return { lat: 28.6280, lng: 77.2085 };
  }

  // Default coordinate (San Francisco Metro / Delhi NCR baseline)
  return { lat: 37.7842, lng: -122.3965 };
}
